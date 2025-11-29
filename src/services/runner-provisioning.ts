/**
 * Runner Provisioning Service
 *
 * Handles provisioning AI runners on users' Hetzner Cloud accounts.
 * Uses Hetzner Cloud API directly for server creation and management.
 */

import { drizzleDb } from './database-drizzle';

// Server type configurations based on concurrent job capacity
// Using CPX (shared vCPU) servers for US region availability
export const SERVER_CONFIGS = {
  cpx11: { ram: '2GB', vcpu: 2, storage: '40GB', maxJobs: 1, monthlyPrice: 4.99 },
  cpx31: { ram: '8GB', vcpu: 4, storage: '160GB', maxJobs: 2, monthlyPrice: 17.99 },
  cpx41: { ram: '16GB', vcpu: 8, storage: '240GB', maxJobs: 4, monthlyPrice: 33.49 },
  cpx51: { ram: '32GB', vcpu: 16, storage: '360GB', maxJobs: 8, monthlyPrice: 66.99 },
} as const;

export type ServerType = keyof typeof SERVER_CONFIGS;

interface HetznerServer {
  id: number;
  name: string;
  status: string;
  public_net: {
    ipv4: {
      ip: string;
    };
    ipv6: {
      ip: string;
    };
  };
  server_type: {
    name: string;
    description: string;
  };
  datacenter: {
    name: string;
    location: {
      name: string;
      city: string;
      country: string;
    };
  };
}

interface HetznerApiError {
  error: {
    code: string;
    message: string;
  };
}

interface ProvisionRunnerOptions {
  userId: string;
  runnerId: string;
  apiToken: string;
  serverType: ServerType;
  region?: string;
  maxConcurrentJobs: number;
  quetrexApiKey: string;
}

/**
 * Validate a Hetzner Cloud API token
 */
export async function validateHetznerToken(apiToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.hetzner.cloud/v1/servers', {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate cloud-init configuration for runner server
 */
function generateCloudInit(options: {
  runnerId: string;
  userId: string;
  quetrexApiKey: string;
  maxConcurrentJobs: number;
}): string {
  const { runnerId, userId, quetrexApiKey, maxConcurrentJobs } = options;

  return `#cloud-config
package_update: true
package_upgrade: true

packages:
  - docker.io
  - docker-compose
  - curl
  - jq

write_files:
  - path: /opt/quetrex-runner/docker-compose.yml
    permissions: '0644'
    content: |
      version: '3.8'
      services:
        runner:
          image: ghcr.io/quetrex/runner:latest
          container_name: quetrex-runner
          restart: unless-stopped
          ports:
            - "8080:8080"
          volumes:
            - ./config.yml:/app/config.yml:ro
            - ./workspace:/workspace
            - /var/run/docker.sock:/var/run/docker.sock
          environment:
            - QUETREX_RUNNER_ID=${runnerId}
            - QUETREX_USER_ID=${userId}
            - QUETREX_API_URL=https://quetrex.com/api
            - QUETREX_API_KEY=${quetrexApiKey}
            - MAX_CONCURRENT_JOBS=${maxConcurrentJobs}
          healthcheck:
            test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
            interval: 30s
            timeout: 10s
            retries: 3

  - path: /opt/quetrex-runner/config.yml
    permissions: '0600'
    content: |
      # Quetrex Runner Configuration
      runner_id: "${runnerId}"
      user_id: "${userId}"

      quetrex:
        api_url: "https://quetrex.com/api"
        api_key: "${quetrexApiKey}"

      runner:
        max_concurrent_jobs: ${maxConcurrentJobs}
        workspace_path: /workspace
        log_level: info

      # Note: User will configure their Anthropic and GitHub credentials
      # after initial setup via the dashboard

  - path: /opt/quetrex-runner/start.sh
    permissions: '0755'
    content: |
      #!/bin/bash
      set -e
      cd /opt/quetrex-runner

      # Wait for Docker to be ready
      while ! docker info >/dev/null 2>&1; do
        echo "Waiting for Docker..."
        sleep 2
      done

      # Start the runner
      docker compose up -d

      echo "Quetrex runner started!"

runcmd:
  - systemctl enable docker
  - systemctl start docker
  - mkdir -p /opt/quetrex-runner/workspace
  - /opt/quetrex-runner/start.sh
  - echo "Runner provisioning complete!" > /var/log/quetrex-provision.log
`;
}

/**
 * Provision a new runner server on Hetzner Cloud
 */
export async function provisionRunner(options: ProvisionRunnerOptions): Promise<{
  success: boolean;
  serverIp?: string;
  hetznerServerId?: number;
  error?: string;
}> {
  const { userId, runnerId, apiToken, serverType, region = 'nbg1', maxConcurrentJobs, quetrexApiKey } = options;

  // Update status to provisioning
  await drizzleDb.updateRunner(runnerId, { status: 'provisioning' });

  try {
    // Generate cloud-init
    const cloudInit = generateCloudInit({
      runnerId,
      userId,
      quetrexApiKey,
      maxConcurrentJobs,
    });

    // Create server via Hetzner API
    const createResponse = await fetch('https://api.hetzner.cloud/v1/servers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `quetrex-runner-${runnerId.slice(0, 8)}`,
        server_type: serverType,
        image: 'ubuntu-24.04',
        location: region,
        start_after_create: true,
        user_data: cloudInit,
        labels: {
          purpose: 'quetrex-runner',
          runner_id: runnerId,
          user_id: userId,
        },
        public_net: {
          enable_ipv4: true,
          enable_ipv6: true,
        },
      }),
    });

    if (!createResponse.ok) {
      const errorData = (await createResponse.json()) as HetznerApiError;
      throw new Error(`Hetzner API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const createData = (await createResponse.json()) as { server: HetznerServer };
    const server = createData.server;

    // Update runner with server info
    await drizzleDb.updateRunner(runnerId, {
      status: 'provisioning', // Still provisioning until cloud-init completes
      ipAddress: server.public_net.ipv4.ip,
    });

    // Poll for server to be running
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

      const statusResponse = await fetch(`https://api.hetzner.cloud/v1/servers/${server.id}`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = (await statusResponse.json()) as { server: HetznerServer };
        if (statusData.server.status === 'running') {
          // Server is running, mark as active
          await drizzleDb.updateRunner(runnerId, {
            status: 'active',
            ipAddress: statusData.server.public_net.ipv4.ip,
          });

          return {
            success: true,
            serverIp: statusData.server.public_net.ipv4.ip,
            hetznerServerId: server.id,
          };
        }
      }

      attempts++;
    }

    // Timeout waiting for server
    await drizzleDb.updateRunner(runnerId, {
      status: 'error',
      errorMessage: 'Timeout waiting for server to start',
    });

    return {
      success: false,
      error: 'Timeout waiting for server to start',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during provisioning';

    await drizzleDb.updateRunner(runnerId, {
      status: 'error',
      errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete a runner server from Hetzner Cloud
 */
export async function deprovisionRunner(
  apiToken: string,
  serverIp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find server by IP
    const listResponse = await fetch('https://api.hetzner.cloud/v1/servers', {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!listResponse.ok) {
      throw new Error('Failed to list servers');
    }

    const listData = (await listResponse.json()) as { servers: HetznerServer[] };
    const server = listData.servers.find((s) => s.public_net.ipv4.ip === serverIp);

    if (!server) {
      return { success: true }; // Server doesn't exist, consider it deleted
    }

    // Delete the server
    const deleteResponse = await fetch(`https://api.hetzner.cloud/v1/servers/${server.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!deleteResponse.ok) {
      const errorData = (await deleteResponse.json()) as HetznerApiError;
      throw new Error(`Failed to delete server: ${errorData.error?.message}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during deprovisioning',
    };
  }
}

/**
 * Get runner server status from Hetzner Cloud
 */
export async function getRunnerStatus(
  apiToken: string,
  serverIp: string
): Promise<{
  status: 'running' | 'stopped' | 'not_found' | 'error';
  server?: HetznerServer;
  error?: string;
}> {
  try {
    const listResponse = await fetch('https://api.hetzner.cloud/v1/servers', {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!listResponse.ok) {
      throw new Error('Failed to list servers');
    }

    const listData = (await listResponse.json()) as { servers: HetznerServer[] };
    const server = listData.servers.find((s) => s.public_net.ipv4.ip === serverIp);

    if (!server) {
      return { status: 'not_found' };
    }

    return {
      status: server.status === 'running' ? 'running' : 'stopped',
      server,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
