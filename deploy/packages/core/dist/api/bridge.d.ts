/**
 * Project Management Bridge for CLI to Orchestrator Communication
 *
 * Provides a high-level interface connecting the TypeScript CLI to the Python
 * orchestrator through the FastAPI backend. Manages project lifecycle, task
 * orchestration, and real-time synchronization.
 *
 * @module ProjectBridge
 */
import type { ProjectId, TaskId, AgentId, ProjectCreateRequest, ProjectResponse, ProjectStatusResponse, TaskCreateRequest, TaskResponse, AgentResponse, SubAgentSpawnRequest, SubAgentResponse, DeploymentRequest, DeploymentResponse, AgentRoleType } from './types';
import { SentraAPIClient } from './client';
import { SentraWebSocketClient } from './websocket';
import type { WebSocketClientConfig } from './websocket';
export interface ProjectBridgeConfig {
    readonly api: {
        readonly baseUrl: string;
        readonly timeout: number;
        readonly retryAttempts: number;
        readonly authentication?: {
            readonly type: 'token' | 'api_key';
            readonly value: string;
        };
    };
    readonly websocket: WebSocketClientConfig;
    readonly orchestrator: {
        readonly enabled: boolean;
        readonly healthCheckInterval: number;
        readonly taskSyncInterval: number;
    };
    readonly logging: {
        readonly enabled: boolean;
        readonly level: 'debug' | 'info' | 'warn' | 'error';
    };
}
export interface ProjectState {
    readonly project: ProjectResponse;
    readonly tasks: Map<TaskId, TaskResponse>;
    readonly agents: Map<AgentId, AgentResponse>;
    readonly subAgents: Map<TaskId, SubAgentResponse>;
    readonly lastUpdate: Date;
    readonly isActive: boolean;
}
export interface ProjectMetrics {
    readonly totalTasks: number;
    readonly completedTasks: number;
    readonly inProgressTasks: number;
    readonly queuedTasks: number;
    readonly activeAgents: number;
    readonly averageTaskCompletionTime: number;
    readonly successRate: number;
}
export declare const BridgeEventType: {
    readonly PROJECT_CREATED: "project_created";
    readonly PROJECT_STATUS_UPDATED: "project_status_updated";
    readonly TASK_ASSIGNED: "task_assigned";
    readonly TASK_STARTED: "task_started";
    readonly TASK_COMPLETED: "task_completed";
    readonly TASK_FAILED: "task_failed";
    readonly AGENT_SPAWNED: "agent_spawned";
    readonly AGENT_STATUS_CHANGED: "agent_status_changed";
    readonly DEPLOYMENT_INITIATED: "deployment_initiated";
    readonly DEPLOYMENT_COMPLETED: "deployment_completed";
    readonly BRIDGE_ERROR: "bridge_error";
};
export type BridgeEventTypeEnum = typeof BridgeEventType[keyof typeof BridgeEventType];
export interface BridgeEvent<T = unknown> {
    readonly type: BridgeEventTypeEnum;
    readonly projectId: ProjectId;
    readonly timestamp: Date;
    readonly data: T;
}
export type BridgeEventHandler<T = unknown> = (event: BridgeEvent<T>) => void | Promise<void>;
export declare class ProjectManagementBridge {
    private readonly config;
    private readonly apiClient;
    private readonly wsClient;
    private readonly projectStates;
    private readonly eventHandlers;
    private healthCheckTimer;
    private syncTimer;
    private isInitialized;
    constructor(config: ProjectBridgeConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    createProject(request: ProjectCreateRequest): Promise<ProjectResponse>;
    getProjectStatus(projectId: ProjectId): Promise<ProjectStatusResponse>;
    getProjectState(projectId: ProjectId): ProjectState | undefined;
    getProjectMetrics(projectId: ProjectId): ProjectMetrics | null;
    createTask(request: TaskCreateRequest): Promise<TaskResponse>;
    assignTaskToAgent(taskId: TaskId, agentRole: AgentRoleType): Promise<void>;
    spawnSubAgent(request: SubAgentSpawnRequest): Promise<SubAgentResponse>;
    deployImprovements(request: DeploymentRequest): Promise<DeploymentResponse>;
    on<T = unknown>(eventType: BridgeEventTypeEnum, handler: BridgeEventHandler<T>): void;
    off<T = unknown>(eventType: BridgeEventTypeEnum, handler: BridgeEventHandler<T>): void;
    private emitEvent;
    private setupWebSocketHandlers;
    private handleProjectUpdate;
    private handleTaskUpdate;
    private handleAgentUpdate;
    private startHealthCheck;
    private stopHealthCheck;
    private startTaskSync;
    private stopTaskSync;
    private syncProjectStates;
    private ensureInitialized;
    private findTaskInProjects;
    private calculateAverageCompletionTime;
    private log;
    getApiClient(): SentraAPIClient;
    getWebSocketClient(): SentraWebSocketClient;
    getConfig(): ProjectBridgeConfig;
    getActiveProjects(): readonly ProjectResponse[];
    isConnected(): boolean;
    isHealthy(): boolean;
}
export declare const createProjectBridge: (config: ProjectBridgeConfig) => ProjectManagementBridge;
export declare const createDefaultProjectBridge: (baseUrl?: string) => ProjectManagementBridge;
//# sourceMappingURL=bridge.d.ts.map