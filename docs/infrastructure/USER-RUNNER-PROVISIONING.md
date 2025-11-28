# User Runner Provisioning

**Version:** 1.0.0
**Last Updated:** 2025-11-28

---

## Overview

This document describes how Quetrex provisions AI runners on users' own Hetzner accounts. The provisioning is fully automated via Terraform and Ansible.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 User's Hetzner Account                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              CX22 VPS (~$4.35/mo)                       ││
│  │              2 vCPU | 4GB RAM | 40GB SSD                ││
│  │                                                          ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │           Docker: quetrex-runner                    │││
│  │  │                                                     │││
│  │  │  • Claude Code CLI                                  │││
│  │  │  • Git + GitHub CLI                                 │││
│  │  │  • Node.js runtime                                  │││
│  │  │  • Project workspace                                │││
│  │  └─────────────────────────────────────────────────────┘││
│  │                                                          ││
│  │  Firewall: SSH (22), Runner API (8080)                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Status reports
                              ▼
                    ┌─────────────────┐
                    │ Quetrex Platform│
                    └─────────────────┘
```

---

## Provisioning Flow

### Step 1: User Provides Hetzner API Token

```typescript
// Quetrex validates the token
async function validateHetznerToken(token: string): Promise<boolean> {
  const response = await fetch('https://api.hetzner.cloud/v1/servers', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.ok;
}
```

### Step 2: Terraform Creates Server

```hcl
# terraform/user-runner/main.tf

terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
  }
}

variable "hcloud_token" {
  sensitive = true
}

variable "user_id" {
  type = string
}

variable "ssh_public_key" {
  type = string
}

provider "hcloud" {
  token = var.hcloud_token
}

# SSH Key
resource "hcloud_ssh_key" "quetrex" {
  name       = "quetrex-runner-${var.user_id}"
  public_key = var.ssh_public_key
}

# Firewall
resource "hcloud_firewall" "runner" {
  name = "quetrex-runner-${var.user_id}"

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "8080"
    source_ips = ["0.0.0.0/0", "::/0"]  # Runner API
  }

  rule {
    direction = "out"
    protocol  = "tcp"
    port      = "any"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }
}

# Server
resource "hcloud_server" "runner" {
  name        = "quetrex-runner-${var.user_id}"
  image       = "ubuntu-24.04"
  server_type = "cx22"
  location    = "nbg1"

  ssh_keys = [hcloud_ssh_key.quetrex.id]

  firewall_ids = [hcloud_firewall.runner.id]

  labels = {
    purpose = "quetrex-runner"
    user_id = var.user_id
  }

  user_data = <<-EOF
    #cloud-config
    package_update: true
    packages:
      - docker.io
      - docker-compose
      - git
    runcmd:
      - systemctl enable docker
      - systemctl start docker
      - usermod -aG docker ubuntu
  EOF
}

output "server_ip" {
  value = hcloud_server.runner.ipv4_address
}

output "server_id" {
  value = hcloud_server.runner.id
}
```

### Step 3: Ansible Configures Server

```yaml
# ansible/user-runner/playbook.yml

---
- name: Configure Quetrex Runner
  hosts: runner
  become: yes
  vars:
    user_id: "{{ lookup('env', 'USER_ID') }}"
    anthropic_session: "{{ lookup('env', 'ANTHROPIC_SESSION') }}"
    github_token: "{{ lookup('env', 'GITHUB_TOKEN') }}"
    quetrex_api_key: "{{ lookup('env', 'QUETREX_API_KEY') }}"

  tasks:
    - name: Wait for cloud-init to complete
      command: cloud-init status --wait
      changed_when: false

    - name: Create runner directory
      file:
        path: /opt/quetrex-runner
        state: directory
        mode: '0755'

    - name: Copy Docker Compose file
      template:
        src: docker-compose.yml.j2
        dest: /opt/quetrex-runner/docker-compose.yml
        mode: '0644'

    - name: Copy runner configuration
      template:
        src: config.yml.j2
        dest: /opt/quetrex-runner/config.yml
        mode: '0600'

    - name: Pull runner image
      docker_image:
        name: ghcr.io/quetrex/runner:latest
        source: pull

    - name: Start runner container
      docker_compose:
        project_src: /opt/quetrex-runner
        state: present
        pull: yes

    - name: Enable auto-updates
      cron:
        name: "Update Quetrex runner"
        minute: "0"
        hour: "4"
        job: "cd /opt/quetrex-runner && docker compose pull && docker compose up -d"
```

### Step 4: Runner Docker Configuration

```yaml
# ansible/user-runner/templates/docker-compose.yml.j2

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
      - QUETREX_USER_ID={{ user_id }}
      - QUETREX_API_URL=https://quetrex.app/api
      - QUETREX_API_KEY={{ quetrex_api_key }}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

```yaml
# ansible/user-runner/templates/config.yml.j2

# Quetrex Runner Configuration
# This file contains sensitive credentials - do not share

user_id: "{{ user_id }}"

# Anthropic authentication (session-based, not API key)
anthropic:
  session_token: "{{ anthropic_session }}"

# GitHub authentication
github:
  token: "{{ github_token }}"

# Quetrex platform connection
quetrex:
  api_url: "https://quetrex.app/api"
  api_key: "{{ quetrex_api_key }}"

# Runner settings
runner:
  max_concurrent_jobs: 1
  workspace_path: /workspace
  log_level: info
```

---

## Runner Container

### Dockerfile

```dockerfile
# Dockerfile for quetrex-runner
FROM ubuntu:24.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    nodejs \
    npm \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y gh

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Create non-root user
RUN useradd -m -s /bin/bash runner
USER runner
WORKDIR /home/runner

# Copy runner application
COPY --chown=runner:runner . /app
WORKDIR /app

# Health check endpoint
EXPOSE 8080

CMD ["node", "runner.js"]
```

### Runner Application

> **Note:** The actual runner implementation uses safe command execution patterns.
> See `src/runner/` for production code with proper input sanitization.

**Key Components:**

1. **Health Endpoint** - Reports runner status to Quetrex platform
2. **Job Queue** - Receives and queues jobs from Quetrex API
3. **Job Processor** - Executes Claude Code on GitHub issues
4. **Status Reporter** - Sends progress updates to dashboard

**Security Considerations:**

- All shell commands use `execFile` (not `exec`) to prevent injection
- Repository names and issue numbers are validated before use
- Workspace isolation via Docker containers
- Credentials never logged or exposed in error messages

---

## Server Specifications

### Recommended: CX22

| Spec | Value |
|------|-------|
| vCPU | 2 (shared) |
| RAM | 4GB |
| Storage | 40GB NVMe |
| Traffic | 20TB |
| Cost | ~$4.35/month |

### Resource Usage

| Component | RAM | CPU |
|-----------|-----|-----|
| Runner container | 2GB | 1 core |
| Claude Code process | 1GB | 0.5 core |
| System overhead | 512MB | 0.25 core |
| **Buffer** | **512MB** | **0.25 core** |

---

## Security

### Container Isolation

```yaml
# Security options in docker-compose
services:
  runner:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp
```

### Credential Handling

| Credential | Storage | Exposure |
|------------|---------|----------|
| Anthropic session | config.yml (encrypted at rest) | Container env only |
| GitHub token | config.yml (encrypted at rest) | Container env only |
| Hetzner API token | Never stored on runner | Used only during provisioning |

### Network Security

- Firewall allows only SSH (22) and Runner API (8080)
- Runner API authenticated via Quetrex API key
- All traffic to Quetrex platform over HTTPS

---

## Monitoring

### Runner Health Check

```bash
# Called by Quetrex platform every 60 seconds
curl -sf https://<runner-ip>:8080/health
```

### Response Format

```json
{
  "status": "healthy",
  "currentJob": "job-123",
  "queueLength": 2,
  "uptime": 86400,
  "lastActivity": "2025-11-28T10:30:00Z"
}
```

### Alerts

| Condition | Action |
|-----------|--------|
| Health check fails 3x | Email user, show warning in dashboard |
| Runner offline > 1 hour | Email user |
| Job fails | Show in dashboard, option to retry |

---

## Updates

### Automatic Updates

Runners auto-update daily at 4am local time:

```bash
# Cron job on runner server
0 4 * * * cd /opt/quetrex-runner && docker compose pull && docker compose up -d
```

### Manual Update

Users can trigger update from dashboard:
1. Dashboard → Runner → Update
2. Quetrex API calls runner `/update` endpoint
3. Runner pulls latest image and restarts

---

## Troubleshooting

### Runner Won't Start

```bash
# SSH to runner
ssh ubuntu@<runner-ip>

# Check Docker status
sudo systemctl status docker

# Check container logs
docker logs quetrex-runner

# Restart runner
cd /opt/quetrex-runner
docker compose down
docker compose up -d
```

### Job Stuck

```bash
# Check current job
curl http://localhost:8080/health

# View job logs
docker logs quetrex-runner --tail 100

# Cancel current job
curl -X POST http://localhost:8080/job/cancel
```

### Connection Issues

```bash
# Test connectivity to Quetrex
curl -I https://quetrex.app/api/health

# Check firewall
sudo ufw status

# Check if port 8080 is listening
sudo netstat -tlnp | grep 8080
```

---

## Deprovisioning

When user cancels subscription or requests deletion:

```hcl
# terraform destroy with user's token
terraform destroy -var="hcloud_token=${USER_HCLOUD_TOKEN}"
```

This removes:
- Server
- Firewall rules
- SSH key

User's Hetzner account remains (they may use it for other things).

---

*Document created by Glen Barnhardt with Claude Code assistance.*
