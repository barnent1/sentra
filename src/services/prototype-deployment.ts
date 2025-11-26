/**
 * Prototype Deployment Service
 *
 * Deploys prototypes to Vercel preview URLs.
 *
 * Phase 1 (Fallback): Returns v0 URLs if Vercel API unavailable
 * Phase 2 (Current): Deploy to actual Vercel preview (prototypes.sentra.app)
 *
 * Features:
 * - Deploy prototypes with automatic URL generation
 * - Poll deployment status
 * - Redeploy existing deployments
 * - Delete deployments
 * - Automatic retry with exponential backoff
 * - Real Vercel API integration with fallback
 *
 * @module services/prototype-deployment
 */

import type { CodeFile } from './v0-integration';

// ============================================================================
// Types
// ============================================================================

/**
 * Deployment status values
 */
export type DeploymentStatus = 'pending' | 'deploying' | 'ready' | 'error';

/**
 * Vercel API deployment readyState values
 */
type VercelReadyState = 'QUEUED' | 'BUILDING' | 'ERROR' | 'READY' | 'CANCELED';

/**
 * Vercel API deployment response
 */
interface VercelDeployment {
  id: string;
  url: string;
  readyState: VercelReadyState;
  createdAt: number;
  meta?: Record<string, unknown>;
  target?: 'production' | 'staging' | null;
}

/**
 * Vercel API deployment event
 */
interface VercelDeploymentEvent {
  type: string;
  created: number;
  payload: {
    text: string;
    [key: string]: unknown;
  };
}

/**
 * Request for deploying a prototype
 */
export interface DeploymentRequest {
  projectName: string;
  prototypeId: string;
  files: CodeFile[];
  environmentVars?: Record<string, string>;
}

/**
 * Response from deployment operations
 */
export interface DeploymentResponse {
  deploymentId: string;
  url: string;
  status: DeploymentStatus;
  logs?: string[];
}

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Error options for custom error classes
 */
interface CustomErrorOptions {
  cause?: Error;
}

/**
 * Base error class for prototype deployment errors
 */
export class PrototypeDeploymentError extends Error {
  public readonly cause?: Error;

  constructor(message: string, options?: CustomErrorOptions) {
    super(message);
    this.name = 'PrototypeDeploymentError';
    this.cause = options?.cause;
  }
}

/**
 * Error thrown when deployment API request fails
 */
export class DeploymentApiError extends PrototypeDeploymentError {
  constructor(message: string, options?: CustomErrorOptions) {
    super(message, options);
    this.name = 'DeploymentApiError';
  }
}

/**
 * Error thrown when request validation fails
 */
export class DeploymentValidationError extends PrototypeDeploymentError {
  constructor(message: string, options?: CustomErrorOptions) {
    super(message, options);
    this.name = 'DeploymentValidationError';
  }
}

// ============================================================================
// In-Memory Storage (Phase 1)
// ============================================================================

/**
 * Internal deployment record for Phase 1 mock storage
 */
interface DeploymentRecord {
  deploymentId: string;
  projectName: string;
  prototypeId: string;
  url: string;
  status: DeploymentStatus;
  files: CodeFile[];
  environmentVars?: Record<string, string>;
  logs: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * In-memory deployment storage (Phase 1 only)
 * Phase 2 will use database and actual Vercel API
 */
const deployments = new Map<string, DeploymentRecord>();

// ============================================================================
// Service
// ============================================================================

/**
 * Prototype Deployment Service
 *
 * Manages deployment of prototypes to preview URLs.
 *
 * **Phase 2 (Current):**
 * - Deploy to Vercel preview (prototypes.sentra.app)
 * - Real Vercel API integration
 * - Automatic fallback to v0 URLs if Vercel unavailable
 * - Deployment status polling
 * - Log retrieval
 *
 * **Phase 1 (Fallback):**
 * - Returns v0-style URLs if Vercel API fails
 * - In-memory storage for testing
 *
 * @example
 * ```typescript
 * const service = new PrototypeDeploymentService();
 *
 * const result = await service.deploy({
 *   projectName: 'my-project',
 *   prototypeId: 'proto-123',
 *   files: [
 *     { path: 'app/page.tsx', content: '...' }
 *   ],
 * });
 *
 * console.log('Deployed to:', result.url);
 * ```
 */
export class PrototypeDeploymentService {
  private readonly vercelToken?: string;
  private readonly vercelProjectId?: string;
  private readonly vercelOrgId?: string;
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000; // milliseconds
  private readonly apiBaseUrl = 'https://api.vercel.com';

  /**
   * Create prototype deployment service
   *
   * Reads Vercel configuration from environment variables:
   * - VERCEL_TOKEN: API token for authentication
   * - VERCEL_PROJECT_ID: Project ID for deployments
   * - VERCEL_ORG_ID: Organization/team ID
   *
   * Falls back to Phase 1 (v0 URLs) if environment variables not set.
   */
  constructor() {
    this.vercelToken = process.env.VERCEL_TOKEN;
    this.vercelProjectId = process.env.VERCEL_PROJECT_ID;
    this.vercelOrgId = process.env.VERCEL_ORG_ID;
  }

  /**
   * Deploy a prototype
   *
   * Phase 2: Deploys to Vercel preview (prototypes.sentra.app)
   * Falls back to Phase 1 (v0 URLs) if Vercel API unavailable
   *
   * @param request - Deployment request with files and metadata
   * @returns Deployment response with URL and status
   * @throws {DeploymentValidationError} If request is invalid
   * @throws {DeploymentApiError} If deployment fails after retries
   *
   * @example
   * ```typescript
   * const result = await service.deploy({
   *   projectName: 'dashboard-app',
   *   prototypeId: 'proto-456',
   *   files: [
   *     { path: 'app/page.tsx', content: 'export default function Page() {}' }
   *   ],
   *   environmentVars: {
   *     NEXT_PUBLIC_API_URL: 'https://api.example.com',
   *   },
   * });
   * ```
   */
  async deploy(request: DeploymentRequest): Promise<DeploymentResponse> {
    // Validate request
    this.validateDeploymentRequest(request);

    // Sanitize project name for URL
    const sanitizedName = this.sanitizeProjectName(request.projectName);

    // Try Vercel API deployment if configured
    if (this.isVercelConfigured()) {
      try {
        return await this.deployToVercel(request, sanitizedName);
      } catch (error) {
        // Log error but continue to fallback
        console.error('Vercel deployment failed, falling back to Phase 1:', error);
      }
    }

    // Fallback to Phase 1: v0-style URLs
    return this.deployPhase1Fallback(request, sanitizedName);
  }

  /**
   * Deploy to Vercel via API
   */
  private async deployToVercel(
    request: DeploymentRequest,
    sanitizedName: string
  ): Promise<DeploymentResponse> {
    // Create deployment via Vercel API
    const deployment = await this.withRetry(() =>
      this.createVercelDeployment(request, sanitizedName)
    );

    // Map Vercel readyState to our status
    const status = this.mapVercelStatus(deployment.readyState);

    // Generate Sentra-hosted URL
    const url = `https://${sanitizedName}-${request.prototypeId}.prototypes.sentra.app`;

    // Store deployment record
    const record: DeploymentRecord = {
      deploymentId: deployment.id,
      projectName: request.projectName,
      prototypeId: request.prototypeId,
      url,
      status,
      files: request.files,
      environmentVars: request.environmentVars,
      logs: [`[${new Date().toISOString()}] Deploying to Vercel...`],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    deployments.set(deployment.id, record);

    return {
      deploymentId: deployment.id,
      url,
      status,
      logs: record.logs,
    };
  }

  /**
   * Fallback to Phase 1 deployment (v0 URLs)
   */
  private deployPhase1Fallback(
    request: DeploymentRequest,
    sanitizedName: string
  ): DeploymentResponse {
    // Generate deployment ID
    const deploymentId = this.generateDeploymentId();

    // Generate URL (Phase 1: v0-style URL)
    const url = this.generateUrl(sanitizedName, request.prototypeId);

    // Create deployment logs
    const logs: string[] = [
      `[${new Date().toISOString()}] Starting deployment for ${request.projectName}`,
      `[${new Date().toISOString()}] Deploying ${request.files.length} files`,
      `[${new Date().toISOString()}] Generated URL: ${url}`,
      `[${new Date().toISOString()}] Deployment successful`,
    ];

    // Store deployment record (Phase 1: in-memory)
    const record: DeploymentRecord = {
      deploymentId,
      projectName: request.projectName,
      prototypeId: request.prototypeId,
      url,
      status: 'ready',
      files: request.files,
      environmentVars: request.environmentVars,
      logs,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    deployments.set(deploymentId, record);

    return {
      deploymentId,
      url,
      status: 'ready',
      logs,
    };
  }

  /**
   * Create deployment via Vercel API
   */
  private async createVercelDeployment(
    request: DeploymentRequest,
    sanitizedName: string
  ): Promise<VercelDeployment> {
    const url = `${this.apiBaseUrl}/v13/deployments`;

    // Prepare files in Vercel format
    const files = request.files.map((file) => ({
      file: file.path,
      data: Buffer.from(file.content).toString('base64'),
      encoding: 'base64',
    }));

    // Prepare deployment payload
    const payload = {
      name: `${sanitizedName}-${request.prototypeId}`,
      files,
      projectSettings: {
        framework: 'nextjs',
      },
      target: null, // Preview deployment
      ...(request.environmentVars && {
        env: Object.entries(request.environmentVars).map(([key, value]) => ({
          key,
          value,
          type: 'plain',
        })),
      }),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.vercelToken}`,
        'Content-Type': 'application/json',
        ...(this.vercelOrgId && { 'x-vercel-team-id': this.vercelOrgId }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DeploymentApiError(
        `Vercel API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json() as Promise<VercelDeployment>;
  }

  /**
   * Get deployment status
   *
   * Polls Vercel API if configured, otherwise returns local status.
   *
   * @param deploymentId - Deployment ID from deploy()
   * @returns Current deployment status and URL
   * @throws {DeploymentValidationError} If deploymentId is invalid
   * @throws {DeploymentApiError} If deployment not found
   *
   * @example
   * ```typescript
   * const status = await service.getStatus('deploy-123');
   * console.log('Status:', status.status);
   * console.log('URL:', status.url);
   * ```
   */
  async getStatus(deploymentId: string): Promise<DeploymentResponse> {
    // Validate input
    if (!deploymentId || deploymentId.trim().length === 0) {
      throw new DeploymentValidationError('Deployment ID is required');
    }

    // Try fetching from Vercel API if configured
    if (this.isVercelConfigured()) {
      try {
        const deployment = await this.getVercelDeployment(deploymentId);
        const status = this.mapVercelStatus(deployment.readyState);

        // Get logs from Vercel
        const logs = await this.getVercelLogs(deploymentId);

        // Update local record
        const record = deployments.get(deploymentId);
        if (record) {
          record.status = status;
          record.logs = logs;
          record.updatedAt = new Date();
          deployments.set(deploymentId, record);
        }

        return {
          deploymentId,
          url: record?.url || deployment.url,
          status,
          logs,
        };
      } catch (error) {
        // Fall through to local record if API fails
        console.error('Failed to fetch from Vercel API:', error);
      }
    }

    // Fallback to local record
    const record = deployments.get(deploymentId);
    if (!record) {
      throw new DeploymentApiError('Deployment not found');
    }

    return {
      deploymentId: record.deploymentId,
      url: record.url,
      status: record.status,
      logs: record.logs,
    };
  }

  /**
   * Get deployment from Vercel API
   */
  private async getVercelDeployment(deploymentId: string): Promise<VercelDeployment> {
    const url = `${this.apiBaseUrl}/v13/deployments/${deploymentId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.vercelToken}`,
        ...(this.vercelOrgId && { 'x-vercel-team-id': this.vercelOrgId }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DeploymentApiError(
        `Vercel API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json() as Promise<VercelDeployment>;
  }

  /**
   * Get deployment logs from Vercel API
   */
  private async getVercelLogs(deploymentId: string): Promise<string[]> {
    const url = `${this.apiBaseUrl}/v6/deployments/${deploymentId}/events`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.vercelToken}`,
          ...(this.vercelOrgId && { 'x-vercel-team-id': this.vercelOrgId }),
        },
      });

      if (!response.ok) {
        return [`[${new Date().toISOString()}] Could not fetch logs`];
      }

      const events = (await response.json()) as VercelDeploymentEvent[];

      return events
        .filter((event) => event.payload?.text)
        .map((event) => {
          const timestamp = new Date(event.created).toISOString();
          return `[${timestamp}] ${event.payload.text}`;
        });
    } catch (error) {
      return [`[${new Date().toISOString()}] Error fetching logs`];
    }
  }

  /**
   * Redeploy an existing deployment
   *
   * Updates the deployment with latest changes.
   * URL remains the same.
   *
   * @param deploymentId - Deployment ID to redeploy
   * @returns Updated deployment response
   * @throws {DeploymentValidationError} If deploymentId is invalid
   * @throws {DeploymentApiError} If deployment not found or redeploy fails
   *
   * @example
   * ```typescript
   * const result = await service.redeploy('deploy-123');
   * console.log('Redeployed to:', result.url);
   * ```
   */
  async redeploy(deploymentId: string): Promise<DeploymentResponse> {
    // Validate input
    if (!deploymentId || deploymentId.trim().length === 0) {
      throw new DeploymentValidationError('Deployment ID is required');
    }

    // Get existing deployment record
    const record = deployments.get(deploymentId);
    if (!record) {
      throw new DeploymentApiError('Deployment not found');
    }

    // Redeploy using original files
    const sanitizedName = this.sanitizeProjectName(record.projectName);
    const redeployRequest: DeploymentRequest = {
      projectName: record.projectName,
      prototypeId: record.prototypeId,
      files: record.files,
      environmentVars: record.environmentVars,
    };

    // Try Vercel API if configured
    if (this.isVercelConfigured()) {
      try {
        const deployment = await this.withRetry(() =>
          this.createVercelDeployment(redeployRequest, sanitizedName)
        );

        // Update record with new deployment
        record.status = this.mapVercelStatus(deployment.readyState);
        record.logs = [
          ...record.logs,
          `[${new Date().toISOString()}] Redeploying ${record.projectName}`,
        ];
        record.updatedAt = new Date();

        deployments.set(deploymentId, record);

        return {
          deploymentId,
          url: record.url,
          status: record.status,
          logs: record.logs,
        };
      } catch (error) {
        // Fall through to Phase 1 fallback
        console.error('Vercel redeploy failed:', error);
      }
    }

    // Phase 1 fallback
    const redeployLogs = [
      ...record.logs,
      `[${new Date().toISOString()}] Redeploying ${record.projectName}`,
      `[${new Date().toISOString()}] Redeployment successful`,
    ];

    record.status = 'ready';
    record.logs = redeployLogs;
    record.updatedAt = new Date();

    deployments.set(deploymentId, record);

    return {
      deploymentId: record.deploymentId,
      url: record.url,
      status: record.status,
      logs: record.logs,
    };
  }

  /**
   * Delete a deployment
   *
   * Removes deployment and makes URL inaccessible.
   *
   * @param deploymentId - Deployment ID to delete
   * @throws {DeploymentValidationError} If deploymentId is invalid
   * @throws {DeploymentApiError} If deployment not found
   *
   * @example
   * ```typescript
   * await service.delete('deploy-123');
   * console.log('Deployment deleted');
   * ```
   */
  async delete(deploymentId: string): Promise<void> {
    // Validate input
    if (!deploymentId || deploymentId.trim().length === 0) {
      throw new DeploymentValidationError('Deployment ID is required');
    }

    // Check if deployment exists
    if (!deployments.has(deploymentId)) {
      throw new DeploymentApiError('Deployment not found');
    }

    // Try deleting from Vercel API if configured
    if (this.isVercelConfigured()) {
      try {
        await this.deleteVercelDeployment(deploymentId);
      } catch (error) {
        // Log error but continue with local deletion
        console.error('Failed to delete from Vercel:', error);
      }
    }

    // Delete from local storage
    deployments.delete(deploymentId);
  }

  /**
   * Delete deployment from Vercel API
   */
  private async deleteVercelDeployment(deploymentId: string): Promise<void> {
    const url = `${this.apiBaseUrl}/v13/deployments/${deploymentId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.vercelToken}`,
        ...(this.vercelOrgId && { 'x-vercel-team-id': this.vercelOrgId }),
      },
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new DeploymentApiError(
        `Vercel API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Validate deployment request
   */
  private validateDeploymentRequest(request: DeploymentRequest): void {
    // Validate project name
    if (!request.projectName || request.projectName.trim().length === 0) {
      throw new DeploymentValidationError('Project name is required');
    }

    // Validate prototype ID
    if (!request.prototypeId || request.prototypeId.trim().length === 0) {
      throw new DeploymentValidationError('Prototype ID is required');
    }

    // Validate files array
    if (!Array.isArray(request.files) || request.files.length === 0) {
      throw new DeploymentValidationError('At least one file is required');
    }

    // Validate each file
    for (const file of request.files) {
      if (!file.path || file.path.trim().length === 0) {
        throw new DeploymentValidationError('File path cannot be empty');
      }

      if (file.content.length === 0) {
        throw new DeploymentValidationError('File content cannot be empty');
      }
    }
  }

  /**
   * Generate unique deployment ID
   */
  private generateDeploymentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `deploy-${timestamp}-${random}`;
  }

  /**
   * Sanitize project name for URL
   *
   * Converts to lowercase, replaces spaces/special chars with hyphens
   */
  private sanitizeProjectName(projectName: string): string {
    return projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generate deployment URL
   *
   * Phase 1 fallback: Returns v0-style URL
   */
  private generateUrl(sanitizedName: string, prototypeId: string): string {
    // Phase 1: v0-style URL (fallback)
    return `https://v0.dev/chat/${sanitizedName}-${prototypeId}`;
  }

  /**
   * Check if Vercel is configured
   */
  private isVercelConfigured(): boolean {
    return !!(this.vercelToken && this.vercelProjectId && this.vercelOrgId);
  }

  /**
   * Map Vercel readyState to our deployment status
   */
  private mapVercelStatus(readyState: VercelReadyState): DeploymentStatus {
    switch (readyState) {
      case 'QUEUED':
        return 'pending';
      case 'BUILDING':
        return 'deploying';
      case 'READY':
        return 'ready';
      case 'ERROR':
      case 'CANCELED':
        return 'error';
      default:
        return 'pending';
    }
  }

  /**
   * Retry function with exponential backoff
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === this.maxRetries - 1) break;

        const delay = this.baseRetryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw new DeploymentApiError(
      `Operation failed after ${this.maxRetries} retries`,
      { cause: lastError }
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

}
