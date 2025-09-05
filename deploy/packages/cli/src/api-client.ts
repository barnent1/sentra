// Sentra Evolutionary Agent System - API Client
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces

import type {
  ProjectId,
  ProjectConfig,
  Deployment,
  DeploymentId,
  CliResult,
  CliError,
  CliErrorCode,
} from './types';
import { CliErrorType } from './types';

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly timestamp: string;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  readonly baseUrl: string;
  readonly timeout: number;
  readonly apiKey?: string;
}

/**
 * Default API configuration
 */
const defaultConfig: ApiClientConfig = {
  baseUrl: process.env['SENTRA_API_URL'] || 'http://localhost:8000/api/v1',
  timeout: 30000,
  ...(process.env['SENTRA_API_KEY'] ? { apiKey: process.env['SENTRA_API_KEY'] } : {}),
};

/**
 * API Client for Sentra backend communication
 */
export class ApiClient {
  private readonly config: ApiClientConfig;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Create a new project
   */
  public readonly createProject = async (
    name: string,
    options: {
      readonly template?: string;
      readonly directory?: string;
    } = {}
  ): Promise<CliResult<ProjectConfig>> => {
    try {
      const response = await this.request<ProjectConfig>('/projects', {
        method: 'POST',
        body: {
          name,
          template: options.template || 'default',
          directory: options.directory,
        },
      });

      return response;

    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  };

  /**
   * Get project by ID
   */
  public readonly getProject = async (projectId: ProjectId): Promise<CliResult<ProjectConfig>> => {
    try {
      const response = await this.request<ProjectConfig>(`/projects/${projectId}`);
      return response;

    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  };

  /**
   * List all projects
   */
  public readonly listProjects = async (): Promise<CliResult<readonly ProjectConfig[]>> => {
    try {
      const response = await this.request<readonly ProjectConfig[]>('/projects');
      return response;

    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  };

  /**
   * Delete a project
   */
  public readonly deleteProject = async (projectId: ProjectId): Promise<CliResult<void>> => {
    try {
      const response = await this.request<void>(`/projects/${projectId}`, {
        method: 'DELETE',
      });
      return response;

    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  };

  /**
   * Start a deployment
   */
  public readonly startDeployment = async (
    projectId: ProjectId,
    options: {
      readonly environment?: 'development' | 'staging' | 'production';
      readonly force?: boolean;
      readonly dryRun?: boolean;
    } = {}
  ): Promise<CliResult<Deployment>> => {
    try {
      const response = await this.request<Deployment>('/deployments', {
        method: 'POST',
        body: {
          projectId,
          environment: options.environment || 'development',
          force: options.force || false,
          dryRun: options.dryRun || false,
        },
      });

      return response;

    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  };

  /**
   * Get deployment by ID
   */
  public readonly getDeployment = async (deploymentId: DeploymentId): Promise<CliResult<Deployment>> => {
    try {
      const response = await this.request<Deployment>(`/deployments/${deploymentId}`);
      return response;

    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  };

  /**
   * List deployments for a project
   */
  public readonly listDeployments = async (
    projectId?: ProjectId
  ): Promise<CliResult<readonly Deployment[]>> => {
    try {
      const url = projectId ? `/deployments?projectId=${projectId}` : '/deployments';
      const response = await this.request<readonly Deployment[]>(url);
      return response;

    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  };

  /**
   * Get system health status
   */
  public readonly getSystemStatus = async (): Promise<CliResult<{
    readonly healthy: boolean;
    readonly version: string;
    readonly uptime: number;
  }>> => {
    try {
      const response = await this.request<{
        readonly healthy: boolean;
        readonly version: string;
        readonly uptime: number;
      }>('/health');
      return response;

    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  };

  /**
   * Make HTTP request to API
   */
  private readonly request = async <T>(
    endpoint: string,
    options: {
      readonly method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      readonly body?: unknown;
      readonly headers?: Record<string, string>;
    } = {}
  ): Promise<CliResult<T>> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        headers,
        signal: controller.signal,
      };

      if (options.body && options.method !== 'GET') {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: CliErrorType.API_ERROR,
            message: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
            details: errorData,
          },
        };
      }

      // Handle empty responses
      if (response.status === 204 || options.method === 'DELETE') {
        return {
          success: true,
          data: undefined as any,
        };
      }

      const data: ApiResponse<T> = await response.json();
      
      if (data.success) {
        return {
          success: true,
          data: data.data,
        };
      } else {
        return {
          success: false,
          error: {
            code: data.error?.code as CliErrorCode || CliErrorType.API_ERROR,
            message: data.error?.message || 'API request failed',
            details: data.error?.details,
          },
        };
      }

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: CliErrorType.NETWORK_ERROR,
            message: 'Request timeout',
            details: error,
          },
        };
      }

      return {
        success: false,
        error: this.handleError(error),
      };
    }
  };

  /**
   * Handle and format errors
   */
  private readonly handleError = (error: unknown): CliError => {
    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
        return {
          code: CliErrorType.NETWORK_ERROR,
          message: 'Unable to connect to Sentra API',
          details: error.message,
          suggestions: [
            'Check if the Sentra API server is running',
            'Verify the API URL in configuration',
            'Check network connectivity',
          ],
        };
      }

      return {
        code: CliErrorType.API_ERROR,
        message: error.message,
        details: error,
      };
    }

    return {
      code: CliErrorType.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
      details: error,
    };
  };
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();