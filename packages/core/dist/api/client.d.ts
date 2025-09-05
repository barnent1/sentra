/**
 * HTTP API Client for Sentra FastAPI Backend
 *
 * Provides a robust HTTP client with automatic retries, error handling,
 * and strict TypeScript interfaces for all FastAPI endpoints.
 *
 * @module APIClient
 */
import type { APIClientConfig, APIClientMetrics, APIResponse, APIError, AgentCreateRequest, AgentResponse, SubAgentSpawnRequest, SubAgentResponse, TaskCreateRequest, TaskResponse, ProjectCreateRequest, ProjectResponse, ProjectStatusResponse, EventResponse, EventQueryParams, MemoryCreateRequest, MemoryResponse, MemoryQueryParams, ApprovalCreateRequest, ApprovalResponse, SystemHealthResponse, DeploymentRequest, DeploymentResponse, HealthCheckResponse, AuthenticationRequest, AuthenticationResponse, ProjectId, SubAgentId, ApprovalId, TaskStatusType, SubAgentStatusType } from './types';
export declare class SentraAPIClient {
    private readonly config;
    private metrics;
    private abortController;
    constructor(config?: Partial<APIClientConfig>);
    private makeRequest;
    private fetchWithRetry;
    private parseResponse;
    private buildUrl;
    private buildHeaders;
    private transformError;
    private updateMetrics;
    private delay;
    private log;
    healthCheck(): Promise<APIResponse<HealthCheckResponse>>;
    getSystemHealth(): Promise<APIResponse<SystemHealthResponse>>;
    listAgents(activeOnly?: boolean): Promise<APIResponse<readonly AgentResponse[]>>;
    createAgent(request: AgentCreateRequest): Promise<APIResponse<AgentResponse>>;
    seedDefaultAgents(): Promise<APIResponse<{
        readonly message: string;
    }>>;
    spawnSubAgent(request: SubAgentSpawnRequest): Promise<APIResponse<SubAgentResponse>>;
    listSubAgents(machineId?: string, status?: SubAgentStatusType): Promise<APIResponse<readonly SubAgentResponse[]>>;
    updateSubAgentHeartbeat(subAgentId: SubAgentId): Promise<APIResponse<{
        readonly ok: true;
        readonly last_seen: string;
    }>>;
    createTask(request: TaskCreateRequest): Promise<APIResponse<TaskResponse>>;
    listTasks(projectName?: string, status?: TaskStatusType, limit?: number): Promise<APIResponse<readonly TaskResponse[]>>;
    createProject(request: ProjectCreateRequest): Promise<APIResponse<ProjectResponse>>;
    getProjectStatus(projectId: ProjectId): Promise<APIResponse<ProjectStatusResponse>>;
    listEvents(params: EventQueryParams): Promise<APIResponse<readonly EventResponse[]>>;
    createMemory(request: MemoryCreateRequest): Promise<APIResponse<MemoryResponse>>;
    searchMemory(params: MemoryQueryParams): Promise<APIResponse<readonly MemoryResponse[]>>;
    createApproval(request: ApprovalCreateRequest): Promise<APIResponse<ApprovalResponse>>;
    listApprovals(status?: 'pending' | 'approved' | 'rejected'): Promise<APIResponse<readonly ApprovalResponse[]>>;
    approveRequest(approvalId: ApprovalId): Promise<APIResponse<ApprovalResponse>>;
    rejectRequest(approvalId: ApprovalId, reason?: string): Promise<APIResponse<ApprovalResponse>>;
    deploy(request: DeploymentRequest): Promise<APIResponse<DeploymentResponse>>;
    authenticate(request: AuthenticationRequest): Promise<APIResponse<AuthenticationResponse>>;
    getMetrics(): APIClientMetrics;
    getConfig(): APIClientConfig;
    abort(): void;
    validateAgentResponse(data: unknown): data is AgentResponse;
    validateTaskResponse(data: unknown): data is TaskResponse;
    validateAPIError(data: unknown): data is APIError;
    createMultipleTasks(requests: readonly TaskCreateRequest[]): Promise<APIResponse<readonly TaskResponse[]>>;
}
export declare const createAPIClient: (config?: Partial<APIClientConfig>) => SentraAPIClient;
export declare const getDefaultAPIClient: (config?: Partial<APIClientConfig>) => SentraAPIClient;
export declare const resetDefaultAPIClient: () => void;
//# sourceMappingURL=client.d.ts.map