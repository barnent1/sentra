/**
 * Sentra API Client Integration Layer
 *
 * Main entry point for all API client functionality including HTTP client,
 * WebSocket communication, project management bridge, authentication,
 * and data synchronization.
 *
 * @module APIIntegration
 */
export type { ProjectId, TaskId, AgentId, SubAgentId, EventId, MemoryId, ApprovalId, MonitoringSessionId, AuthTokenId, WebSocketConnectionId, AgentCreateRequest, AgentResponse, SubAgentSpawnRequest, SubAgentResponse, TaskCreateRequest, TaskResponse, ProjectCreateRequest, ProjectResponse, ProjectStatusResponse, EventResponse, EventQueryParams, MemoryCreateRequest, MemoryResponse, MemoryQueryParams, ApprovalCreateRequest, ApprovalResponse, SystemHealthResponse, DeploymentRequest, DeploymentResponse, HealthCheckResponse, AuthenticationRequest, AuthenticationResponse, WebSocketMessage, WebSocketMessageTypeEnum, ProjectUpdateMessage, TaskUpdateMessage, AgentUpdateMessage, SystemUpdateMessage, APIError, ValidationError, APIResponse, PaginatedResponse, APIMethod, APIEndpoint, RequestParams, RequestBody, APIClientConfig, APIClientMetrics, AgentRoleType, TaskStatusType, TaskPriorityType, SubAgentStatusType, } from './types';
export { AgentRole, TaskStatus, TaskPriority, SubAgentStatus, WebSocketMessageType, isAgentResponse, isTaskResponse, isWebSocketMessage, isAPIError, } from './types';
export { SentraAPIClient, createAPIClient, getDefaultAPIClient, resetDefaultAPIClient, } from './client';
export type { MessageHandler, MessageHandlers, ConnectionEventHandlers, WebSocketClientConfig, WebSocketClientMetrics, } from './websocket';
export { SentraWebSocketClient, WebSocketConnectionState, createWebSocketClient, createDefaultWebSocketClient, } from './websocket';
export type { ProjectBridgeConfig, ProjectState, ProjectMetrics, BridgeEventTypeEnum, BridgeEvent, BridgeEventHandler, } from './bridge';
export { ProjectManagementBridge, BridgeEventType, createProjectBridge, createDefaultProjectBridge, } from './bridge';
export type { SessionId, RefreshTokenId, ApiKeyId, AuthenticationProviderType, AuthenticationStatusType, AuthenticationCredentials, AuthenticationSession, AuthenticationConfig, TokenValidationResult, AuthenticationStorage, } from './auth';
export { SentraAuthenticationManager, AuthenticationProvider, AuthenticationStatus, createAuthenticationManager, createDefaultAuthManager, } from './auth';
export type { SyncId, VersionId, SyncStatusType, ChangeTypeEnum, ConflictResolutionType, SyncedEntity, SyncChange, SyncConflict, SyncConfiguration, SyncMetrics, SyncStorage, } from './sync';
export { DataSynchronizationManager, SyncStatus, ChangeType, ConflictResolution, createDataSyncManager, createDefaultSyncManager, } from './sync';
export interface IntegratedSentraClientConfig {
    readonly api?: any;
    readonly websocket?: any;
    readonly auth?: any;
    readonly sync?: any;
    readonly bridge?: any;
}
/**
 * Integrated Sentra Client combining all API functionality
 *
 * Provides a unified interface for HTTP API, WebSocket, authentication,
 * data synchronization, and project management.
 */
export declare class IntegratedSentraClient {
    readonly api: any;
    readonly websocket: any;
    readonly auth: any;
    readonly sync: any;
    readonly bridge: any;
    constructor(_config?: IntegratedSentraClientConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    loginWithSentraCx(authCode: string): Promise<void>;
    loginWithApiKey(apiKey: string): Promise<void>;
    loginLocally(credentials: {
        readonly userId: string;
        readonly token: string;
    }): Promise<void>;
    logout(): Promise<void>;
    private updateAuthenticationForServices;
    isAuthenticated(): boolean;
    isConnected(): boolean;
    isHealthy(): boolean;
    getStatus(): {
        readonly authenticated: boolean;
        readonly connected: boolean;
        readonly healthy: boolean;
        readonly syncStatus: any;
        readonly authProvider?: any;
        readonly userId?: string;
    };
}
/**
 * Create a new integrated Sentra client
 */
export declare const createSentraClient: (config?: IntegratedSentraClientConfig) => IntegratedSentraClient;
/**
 * Create a default Sentra client with standard configuration
 */
export declare const createDefaultSentraClient: () => IntegratedSentraClient;
/**
 * Get the default singleton client instance
 */
export declare const getDefaultSentraClient: () => IntegratedSentraClient;
/**
 * Reset the default singleton client instance
 */
export declare const resetDefaultSentraClient: () => void;
export declare const API_CLIENT_VERSION: {
    readonly major: 1;
    readonly minor: 0;
    readonly patch: 0;
    readonly prerelease: null;
};
export declare const API_CLIENT_VERSION_STRING: string;
export declare const API_CLIENT_METADATA: {
    readonly name: "Sentra API Client";
    readonly description: "TypeScript client library for Sentra FastAPI backend integration";
    readonly version: string;
    readonly author: "Sentra Development Team";
    readonly license: "MIT";
    readonly repository: "https://github.com/barnent1/sentra";
    readonly features: readonly ["HTTP REST API client", "WebSocket real-time communication", "Authentication management", "Data synchronization", "Project management bridge", "Offline mode support", "Conflict resolution", "Type-safe interfaces"];
    readonly endpoints: readonly ["/health", "/api/agents", "/api/tasks", "/api/projects", "/api/events", "/api/memory", "/api/approvals", "/api/monitoring", "/deploy", "/ws/projects"];
};
//# sourceMappingURL=index.d.ts.map