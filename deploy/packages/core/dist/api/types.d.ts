/**
 * API Client Types for Sentra FastAPI Backend Integration
 *
 * Provides strict TypeScript interfaces for all FastAPI endpoints
 * following SENTRA project standards with branded types and readonly interfaces.
 *
 * @module APITypes
 */
import type { Brand } from '@sentra/types';
export type ProjectId = Brand<string, 'ProjectId'>;
export type TaskId = Brand<string, 'TaskId'>;
export type AgentId = Brand<string, 'AgentId'>;
export type SubAgentId = Brand<string, 'SubAgentId'>;
export type EventId = Brand<string, 'EventId'>;
export type MemoryId = Brand<string, 'MemoryId'>;
export type ApprovalId = Brand<string, 'ApprovalId'>;
export type MonitoringSessionId = Brand<string, 'MonitoringSessionId'>;
export type AuthTokenId = Brand<string, 'AuthTokenId'>;
export type WebSocketConnectionId = Brand<string, 'WebSocketConnectionId'>;
export declare const AgentRole: {
    readonly ANALYST: "analyst";
    readonly PM: "pm";
    readonly DEV: "dev";
    readonly QA: "qa";
    readonly UIUX: "uiux";
    readonly ORCHESTRATOR: "orchestrator";
};
export type AgentRoleType = typeof AgentRole[keyof typeof AgentRole];
export declare const TaskStatus: {
    readonly QUEUED: "queued";
    readonly IN_PROGRESS: "in_progress";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
};
export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];
export declare const TaskPriority: {
    readonly HIGH: 1;
    readonly MEDIUM: 3;
    readonly LOW: 5;
};
export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];
export declare const SubAgentStatus: {
    readonly ACTIVE: "active";
    readonly IDLE: "idle";
    readonly TERMINATED: "terminated";
};
export type SubAgentStatusType = typeof SubAgentStatus[keyof typeof SubAgentStatus];
export interface AgentCreateRequest {
    readonly name: string;
    readonly role: AgentRoleType;
    readonly prompt: string;
    readonly config?: Record<string, unknown>;
}
export interface AgentResponse {
    readonly id: AgentId;
    readonly name: string;
    readonly role: AgentRoleType;
    readonly prompt: string;
    readonly config: Record<string, unknown>;
    readonly active: boolean;
    readonly created_at: string;
    readonly updated_at: string;
}
export interface SubAgentSpawnRequest {
    readonly task_id: TaskId;
    readonly machine_id: string;
    readonly tmux_target: string;
    readonly context_summary?: string;
}
export interface SubAgentResponse {
    readonly id: SubAgentId;
    readonly agent_id: AgentId;
    readonly task_id: TaskId;
    readonly machine_id: string;
    readonly tmux_target: string;
    readonly status: SubAgentStatusType;
    readonly context_summary?: string;
    readonly created_at: string;
    readonly last_seen: string;
}
export interface TaskCreateRequest {
    readonly project_name: string;
    readonly title: string;
    readonly spec: string;
    readonly priority?: TaskPriorityType;
    readonly assigned_agent_role?: AgentRoleType;
}
export interface TaskResponse {
    readonly id: TaskId;
    readonly project_id: ProjectId;
    readonly project_name: string;
    readonly title: string;
    readonly spec: string;
    readonly status: TaskStatusType;
    readonly assigned_agent?: AgentId;
    readonly assigned_agent_name?: string;
    readonly priority: TaskPriorityType;
    readonly metadata: Record<string, unknown>;
    readonly created_at: string;
    readonly updated_at: string;
}
export interface ProjectCreateRequest {
    readonly name: string;
    readonly description?: string;
}
export interface ProjectResponse {
    readonly id: ProjectId;
    readonly name: string;
    readonly description?: string;
    readonly status: string;
    readonly created_at: string;
    readonly updated_at: string;
}
export interface ProjectStatusResponse {
    readonly project_id: ProjectId;
    readonly name: string;
    readonly status: string;
    readonly tasks_total: number;
    readonly tasks_completed: number;
    readonly tasks_in_progress: number;
    readonly tasks_queued: number;
    readonly last_activity: string;
}
export interface EventResponse {
    readonly id: EventId;
    readonly project_id?: ProjectId;
    readonly task_id?: TaskId;
    readonly agent_id?: AgentId;
    readonly event_type: string;
    readonly event_data: Record<string, unknown>;
    readonly timestamp: string;
}
export interface EventQueryParams {
    readonly project_id?: ProjectId;
    readonly task_id?: TaskId;
    readonly agent_id?: AgentId;
    readonly event_type?: string;
    readonly limit?: number;
    readonly since?: string;
}
export interface MemoryCreateRequest {
    readonly content: string;
    readonly context: Record<string, unknown>;
    readonly importance_score?: number;
    readonly tags?: readonly string[];
}
export interface MemoryResponse {
    readonly id: MemoryId;
    readonly content: string;
    readonly context: Record<string, unknown>;
    readonly importance_score: number;
    readonly tags: readonly string[];
    readonly created_at: string;
    readonly last_accessed: string;
}
export interface MemoryQueryParams {
    readonly query: string;
    readonly limit?: number;
    readonly threshold?: number;
}
export interface ApprovalCreateRequest {
    readonly title: string;
    readonly description: string;
    readonly proposed_changes: Record<string, unknown>;
    readonly priority?: 'low' | 'medium' | 'high';
    readonly requester_id?: string;
}
export interface ApprovalResponse {
    readonly id: ApprovalId;
    readonly title: string;
    readonly description: string;
    readonly proposed_changes: Record<string, unknown>;
    readonly status: 'pending' | 'approved' | 'rejected';
    readonly priority: 'low' | 'medium' | 'high';
    readonly requester_id?: string;
    readonly reviewer_id?: string;
    readonly created_at: string;
    readonly updated_at: string;
}
export interface MonitoringMetrics {
    readonly cpu_usage: number;
    readonly memory_usage: number;
    readonly active_agents: number;
    readonly active_tasks: number;
    readonly events_per_minute: number;
    readonly error_rate: number;
}
export interface SystemHealthResponse {
    readonly status: 'healthy' | 'degraded' | 'unhealthy';
    readonly components: readonly {
        readonly name: string;
        readonly status: 'healthy' | 'degraded' | 'unhealthy';
        readonly details?: string;
    }[];
    readonly metrics: MonitoringMetrics;
    readonly timestamp: string;
}
export interface DeploymentRequest {
    readonly improvements: readonly {
        readonly component: string;
        readonly changes: Record<string, unknown>;
        readonly reasoning: string;
    }[];
    readonly validation_required?: boolean;
    readonly rollback_enabled?: boolean;
}
export interface DeploymentResponse {
    readonly deployment_id: string;
    readonly status: 'initiated' | 'validating' | 'deploying' | 'completed' | 'failed';
    readonly progress: number;
    readonly steps_completed: readonly string[];
    readonly current_step?: string;
    readonly error?: string;
    readonly started_at: string;
    readonly completed_at?: string;
}
export declare const WebSocketMessageType: {
    readonly PROJECT_UPDATE: "project_update";
    readonly TASK_UPDATE: "task_update";
    readonly AGENT_UPDATE: "agent_update";
    readonly SYSTEM_UPDATE: "system_update";
    readonly ERROR: "error";
    readonly HEARTBEAT: "heartbeat";
    readonly SUBSCRIBE: "subscribe";
    readonly UNSUBSCRIBE: "unsubscribe";
};
export type WebSocketMessageTypeEnum = typeof WebSocketMessageType[keyof typeof WebSocketMessageType];
export interface WebSocketMessage<T = unknown> {
    readonly type: WebSocketMessageTypeEnum;
    readonly id: string;
    readonly timestamp: string;
    readonly data: T;
}
export interface ProjectUpdateMessage {
    readonly project_id: ProjectId;
    readonly event_type: string;
    readonly changes: Record<string, unknown>;
}
export interface TaskUpdateMessage {
    readonly task_id: TaskId;
    readonly project_id: ProjectId;
    readonly status: TaskStatusType;
    readonly progress?: number;
    readonly agent_id?: AgentId;
    readonly updates: Record<string, unknown>;
}
export interface AgentUpdateMessage {
    readonly agent_id: AgentId;
    readonly event_type: string;
    readonly status: string;
    readonly details: Record<string, unknown>;
}
export interface SystemUpdateMessage {
    readonly component: string;
    readonly event_type: string;
    readonly details: Record<string, unknown>;
}
export interface AuthenticationRequest {
    readonly token?: string;
    readonly api_key?: string;
    readonly user_id?: string;
}
export interface AuthenticationResponse {
    readonly authenticated: boolean;
    readonly token?: AuthTokenId;
    readonly refresh_token?: string;
    readonly user_id?: string;
    readonly permissions: readonly string[];
    readonly expires_at?: string;
}
export interface APIError {
    readonly status_code: number;
    readonly error_code?: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
    readonly timestamp: string;
}
export interface ValidationError extends APIError {
    readonly field_errors: readonly {
        readonly field: string;
        readonly message: string;
        readonly value?: unknown;
    }[];
}
export interface HealthCheckResponse {
    readonly status: 'healthy' | 'degraded' | 'unhealthy';
    readonly database: 'connected' | 'disconnected';
    readonly version: string;
    readonly uptime?: number;
    readonly checks?: readonly {
        readonly name: string;
        readonly status: 'pass' | 'fail';
        readonly details?: string;
    }[];
}
export interface APIClientConfig {
    readonly baseUrl: string;
    readonly timeout: number;
    readonly retryAttempts: number;
    readonly retryDelay: number;
    readonly authentication?: {
        readonly type: 'token' | 'api_key';
        readonly value: string;
    };
    readonly websocket?: {
        readonly enabled: boolean;
        readonly reconnectAttempts: number;
        readonly reconnectDelay: number;
    };
    readonly logging?: {
        readonly enabled: boolean;
        readonly level: 'debug' | 'info' | 'warn' | 'error';
    };
}
export interface APIClientMetrics {
    requests_total: number;
    requests_successful: number;
    requests_failed: number;
    average_response_time: number;
    websocket_connections: number;
    websocket_messages_sent: number;
    websocket_messages_received: number;
}
export declare const isAgentResponse: (value: unknown) => value is AgentResponse;
export declare const isTaskResponse: (value: unknown) => value is TaskResponse;
export declare const isWebSocketMessage: (value: unknown) => value is WebSocketMessage;
export declare const isAPIError: (value: unknown) => value is APIError;
export type APIResponse<T> = {
    readonly success: true;
    readonly data: T;
    readonly timestamp: string;
} | {
    readonly success: false;
    readonly error: APIError;
    readonly timestamp: string;
};
export type PaginatedResponse<T> = {
    readonly items: readonly T[];
    readonly total: number;
    readonly page: number;
    readonly page_size: number;
    readonly has_next: boolean;
    readonly has_previous: boolean;
};
export type APIMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type APIEndpoint = '/health' | '/api/agents' | '/api/agents/seed' | '/api/agents/spawn' | '/api/agents/subagents' | '/api/tasks' | '/api/events' | '/api/memory' | '/api/approvals' | '/api/monitoring/health' | '/api/monitoring/metrics' | '/deploy' | '/ws/projects';
export type RequestParams = Record<string, string | number | boolean | undefined>;
export type RequestBody = Record<string, unknown> | unknown[];
//# sourceMappingURL=types.d.ts.map