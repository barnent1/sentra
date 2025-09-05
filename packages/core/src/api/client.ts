/**
 * HTTP API Client for Sentra FastAPI Backend
 * 
 * Provides a robust HTTP client with automatic retries, error handling,
 * and strict TypeScript interfaces for all FastAPI endpoints.
 * 
 * @module APIClient
 */

import type {
  APIClientConfig,
  APIClientMetrics,
  APIResponse,
  APIError,
  APIMethod,
  APIEndpoint,
  RequestParams,
  RequestBody,
  AgentCreateRequest,
  AgentResponse,
  SubAgentSpawnRequest,
  SubAgentResponse,
  TaskCreateRequest,
  TaskResponse,
  ProjectCreateRequest,
  ProjectResponse,
  ProjectStatusResponse,
  EventResponse,
  EventQueryParams,
  MemoryCreateRequest,
  MemoryResponse,
  MemoryQueryParams,
  ApprovalCreateRequest,
  ApprovalResponse,
  SystemHealthResponse,
  DeploymentRequest,
  DeploymentResponse,
  HealthCheckResponse,
  AuthenticationRequest,
  AuthenticationResponse,
  ProjectId,
  SubAgentId,
  ApprovalId,
  TaskStatusType,
  SubAgentStatusType,
} from './types';

// ============================================================================
// HTTP CLIENT CLASS
// ============================================================================

export class SentraAPIClient {
  private readonly config: APIClientConfig;
  private metrics: APIClientMetrics;
  private abortController: AbortController;

  constructor(config: Partial<APIClientConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:8000',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      websocket: {
        enabled: true,
        reconnectAttempts: 5,
        reconnectDelay: 2000,
      },
      logging: {
        enabled: true,
        level: 'info',
      },
      ...config,
    };

    this.metrics = {
      requests_total: 0,
      requests_successful: 0,
      requests_failed: 0,
      average_response_time: 0,
      websocket_connections: 0,
      websocket_messages_sent: 0,
      websocket_messages_received: 0,
    };

    this.abortController = new AbortController();
  }

  // ============================================================================
  // CORE HTTP METHODS
  // ============================================================================

  private async makeRequest<T>(
    method: APIMethod,
    endpoint: APIEndpoint | string,
    options: {
      readonly params?: RequestParams;
      readonly body?: RequestBody;
      readonly headers?: Record<string, string>;
    } = {}
  ): Promise<APIResponse<T>> {
    const startTime = performance.now();
    this.metrics.requests_total++;

    try {
      const url = this.buildUrl(endpoint, options.params);
      const headers = this.buildHeaders(options.headers);

      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: this.abortController.signal,
      };
      
      if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }
      
      const response = await this.fetchWithRetry(url, fetchOptions);

      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, true);

      const data = await this.parseResponse<T>(response);
      
      if (this.config.logging?.enabled) {
        this.log('info', `${method} ${endpoint} - ${response.status} (${responseTime.toFixed(2)}ms)`);
      }

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, false);

      if (this.config.logging?.enabled) {
        this.log('error', `${method} ${endpoint} failed:`, error);
      }

      return {
        success: false,
        error: this.transformError(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;

    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        await this.delay(this.config.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json() as T;
    } else {
      return await response.text() as unknown as T;
    }
  }

  private buildUrl(endpoint: string, params?: RequestParams): string {
    const url = new URL(endpoint, this.config.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.config.authentication) {
      if (this.config.authentication.type === 'token') {
        headers['Authorization'] = `Bearer ${this.config.authentication.value}`;
      } else if (this.config.authentication.type === 'api_key') {
        headers['X-API-Key'] = this.config.authentication.value;
      }
    }

    return { ...headers, ...additionalHeaders };
  }

  private transformError(error: unknown): APIError {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          status_code: 408,
          message: 'Request timeout',
          timestamp: new Date().toISOString(),
        };
      }

      if (error.message.startsWith('HTTP ')) {
        const statusMatch = error.message.match(/HTTP (\d+):/);
        const statusCode = statusMatch && statusMatch[1] ? parseInt(statusMatch[1], 10) : 500;
        
        return {
          status_code: statusCode,
          message: error.message,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status_code: 500,
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status_code: 500,
      message: 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    };
  }

  private updateMetrics(responseTime: number, success: boolean): void {
    if (success) {
      this.metrics.requests_successful++;
    } else {
      this.metrics.requests_failed++;
    }

    // Update rolling average response time
    const totalRequests = this.metrics.requests_successful + this.metrics.requests_failed;
    this.metrics.average_response_time = 
      (this.metrics.average_response_time * (totalRequests - 1) + responseTime) / totalRequests;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private log(level: string, message: string, ...args: unknown[]): void {
    if (this.config.logging?.enabled && 
        ['debug', 'info', 'warn', 'error'].indexOf(level) >= 
        ['debug', 'info', 'warn', 'error'].indexOf(this.config.logging.level)) {
      const logMethod = (console as any)[level];
      if (typeof logMethod === 'function') {
        logMethod(message, ...args);
      }
    }
  }

  // ============================================================================
  // HEALTH AND STATUS ENDPOINTS
  // ============================================================================

  async healthCheck(): Promise<APIResponse<HealthCheckResponse>> {
    return this.makeRequest<HealthCheckResponse>('GET', '/health');
  }

  async getSystemHealth(): Promise<APIResponse<SystemHealthResponse>> {
    return this.makeRequest<SystemHealthResponse>('GET', '/api/monitoring/health');
  }

  // ============================================================================
  // AGENT MANAGEMENT ENDPOINTS
  // ============================================================================

  async listAgents(activeOnly: boolean = true): Promise<APIResponse<readonly AgentResponse[]>> {
    return this.makeRequest<readonly AgentResponse[]>('GET', '/api/agents', {
      params: { active_only: activeOnly },
    });
  }

  async createAgent(request: AgentCreateRequest): Promise<APIResponse<AgentResponse>> {
    return this.makeRequest<AgentResponse>('POST', '/api/agents', {
      body: request as unknown as Record<string, unknown>,
    });
  }

  async seedDefaultAgents(): Promise<APIResponse<{ readonly message: string }>> {
    return this.makeRequest<{ readonly message: string }>('POST', '/api/agents/seed');
  }

  async spawnSubAgent(request: SubAgentSpawnRequest): Promise<APIResponse<SubAgentResponse>> {
    return this.makeRequest<SubAgentResponse>('POST', '/api/agents/spawn', {
      body: request as unknown as Record<string, unknown>,
    });
  }

  async listSubAgents(
    machineId?: string, 
    status?: SubAgentStatusType
  ): Promise<APIResponse<readonly SubAgentResponse[]>> {
    return this.makeRequest<readonly SubAgentResponse[]>('GET', '/api/agents/subagents', {
      params: {
        machine_id: machineId,
        status,
      },
    });
  }

  async updateSubAgentHeartbeat(subAgentId: SubAgentId): Promise<APIResponse<{ readonly ok: true; readonly last_seen: string }>> {
    return this.makeRequest<{ readonly ok: true; readonly last_seen: string }>('PUT', `/api/agents/subagents/${subAgentId}/heartbeat`);
  }

  // ============================================================================
  // TASK MANAGEMENT ENDPOINTS
  // ============================================================================

  async createTask(request: TaskCreateRequest): Promise<APIResponse<TaskResponse>> {
    return this.makeRequest<TaskResponse>('POST', '/api/tasks', {
      body: request as unknown as Record<string, unknown>,
    });
  }

  async listTasks(
    projectName?: string,
    status?: TaskStatusType,
    limit: number = 50
  ): Promise<APIResponse<readonly TaskResponse[]>> {
    return this.makeRequest<readonly TaskResponse[]>('GET', '/api/tasks', {
      params: {
        project_name: projectName,
        status,
        limit,
      },
    });
  }

  // ============================================================================
  // PROJECT MANAGEMENT ENDPOINTS
  // ============================================================================

  async createProject(request: ProjectCreateRequest): Promise<APIResponse<ProjectResponse>> {
    return this.makeRequest<ProjectResponse>('POST', '/projects/create', {
      body: request as unknown as Record<string, unknown>,
    });
  }

  async getProjectStatus(projectId: ProjectId): Promise<APIResponse<ProjectStatusResponse>> {
    return this.makeRequest<ProjectStatusResponse>('GET', '/projects/status', {
      params: { project_id: projectId },
    });
  }

  // ============================================================================
  // EVENT MANAGEMENT ENDPOINTS
  // ============================================================================

  async listEvents(params: EventQueryParams): Promise<APIResponse<readonly EventResponse[]>> {
    return this.makeRequest<readonly EventResponse[]>('GET', '/api/events', {
      params: params as RequestParams,
    });
  }

  // ============================================================================
  // MEMORY MANAGEMENT ENDPOINTS
  // ============================================================================

  async createMemory(request: MemoryCreateRequest): Promise<APIResponse<MemoryResponse>> {
    return this.makeRequest<MemoryResponse>('POST', '/api/memory', {
      body: request as unknown as Record<string, unknown>,
    });
  }

  async searchMemory(params: MemoryQueryParams): Promise<APIResponse<readonly MemoryResponse[]>> {
    return this.makeRequest<readonly MemoryResponse[]>('GET', '/api/memory/search', {
      params: params as any as RequestParams,
    });
  }

  // ============================================================================
  // APPROVAL MANAGEMENT ENDPOINTS
  // ============================================================================

  async createApproval(request: ApprovalCreateRequest): Promise<APIResponse<ApprovalResponse>> {
    return this.makeRequest<ApprovalResponse>('POST', '/api/approvals', {
      body: request as unknown as Record<string, unknown>,
    });
  }

  async listApprovals(status?: 'pending' | 'approved' | 'rejected'): Promise<APIResponse<readonly ApprovalResponse[]>> {
    return this.makeRequest<readonly ApprovalResponse[]>('GET', '/api/approvals', {
      params: { status },
    });
  }

  async approveRequest(approvalId: ApprovalId): Promise<APIResponse<ApprovalResponse>> {
    return this.makeRequest<ApprovalResponse>('PUT', `/api/approvals/${approvalId}/approve`);
  }

  async rejectRequest(approvalId: ApprovalId, reason?: string): Promise<APIResponse<ApprovalResponse>> {
    return this.makeRequest<ApprovalResponse>('PUT', `/api/approvals/${approvalId}/reject`, {
      body: { reason },
    });
  }

  // ============================================================================
  // DEPLOYMENT ENDPOINTS
  // ============================================================================

  async deploy(request: DeploymentRequest): Promise<APIResponse<DeploymentResponse>> {
    return this.makeRequest<DeploymentResponse>('POST', '/deploy', {
      body: request as unknown as Record<string, unknown>,
    });
  }

  // ============================================================================
  // AUTHENTICATION ENDPOINTS
  // ============================================================================

  async authenticate(request: AuthenticationRequest): Promise<APIResponse<AuthenticationResponse>> {
    return this.makeRequest<AuthenticationResponse>('POST', '/auth/authenticate', {
      body: request as unknown as Record<string, unknown>,
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getMetrics(): APIClientMetrics {
    return { ...this.metrics };
  }

  getConfig(): APIClientConfig {
    return { ...this.config };
  }

  abort(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  // ============================================================================
  // TYPE VALIDATION HELPERS
  // ============================================================================

  validateAgentResponse(data: unknown): data is AgentResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      'id' in data &&
      'name' in data &&
      'role' in data &&
      'active' in data &&
      typeof (data as any).active === 'boolean'
    );
  }

  validateTaskResponse(data: unknown): data is TaskResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      'id' in data &&
      'title' in data &&
      'status' in data &&
      'priority' in data &&
      typeof (data as any).priority === 'number'
    );
  }

  validateAPIError(data: unknown): data is APIError {
    return (
      typeof data === 'object' &&
      data !== null &&
      'status_code' in data &&
      'message' in data &&
      'timestamp' in data &&
      typeof (data as any).status_code === 'number'
    );
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async createMultipleTasks(requests: readonly TaskCreateRequest[]): Promise<APIResponse<readonly TaskResponse[]>> {
    const results = await Promise.allSettled(
      requests.map(request => this.createTask(request))
    );

    const successful: TaskResponse[] = [];
    const errors: APIError[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successful.push(result.value.data);
        } else {
          errors.push((result.value as any).error);
        }
      } else if (result.status === 'rejected') {
        errors.push({
          status_code: 500,
          message: `Failed to create task ${index}: ${result.reason}`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    if (errors.length > 0) {
      return {
        success: false,
        error: {
          status_code: 207, // Multi-status
          message: `${errors.length} of ${requests.length} tasks failed to create`,
          details: { errors, successful },
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: successful,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export const createAPIClient = (config?: Partial<APIClientConfig>): SentraAPIClient => {
  return new SentraAPIClient(config);
};

// ============================================================================
// SINGLETON INSTANCE (OPTIONAL)
// ============================================================================

let defaultClient: SentraAPIClient | null = null;

export const getDefaultAPIClient = (config?: Partial<APIClientConfig>): SentraAPIClient => {
  if (!defaultClient) {
    defaultClient = createAPIClient(config);
  }
  return defaultClient;
};

export const resetDefaultAPIClient = (): void => {
  defaultClient = null;
};