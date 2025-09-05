/**
 * Sentra API Client Integration Layer
 * 
 * Main entry point for all API client functionality including HTTP client,
 * WebSocket communication, project management bridge, authentication,
 * and data synchronization.
 * 
 * @module APIIntegration
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Core API types
  ProjectId,
  TaskId,
  AgentId,
  SubAgentId,
  EventId,
  MemoryId,
  ApprovalId,
  MonitoringSessionId,
  AuthTokenId,
  WebSocketConnectionId,
  
  // Request/Response interfaces
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
  
  // WebSocket types
  WebSocketMessage,
  WebSocketMessageTypeEnum,
  ProjectUpdateMessage,
  TaskUpdateMessage,
  AgentUpdateMessage,
  SystemUpdateMessage,
  
  // Error types
  APIError,
  ValidationError,
  
  // Utility types
  APIResponse,
  PaginatedResponse,
  APIMethod,
  APIEndpoint,
  RequestParams,
  RequestBody,
  
  // Configuration types
  APIClientConfig,
  APIClientMetrics,
  
  // Enum types
  AgentRoleType,
  TaskStatusType,
  TaskPriorityType,
  SubAgentStatusType,
} from './types';

export {
  // Enum constants
  AgentRole,
  TaskStatus,
  TaskPriority,
  SubAgentStatus,
  WebSocketMessageType,
  
  // Type guards
  isAgentResponse,
  isTaskResponse,
  isWebSocketMessage,
  isAPIError,
} from './types';

// ============================================================================
// HTTP CLIENT EXPORTS
// ============================================================================

export {
  SentraAPIClient,
  createAPIClient,
  getDefaultAPIClient,
  resetDefaultAPIClient,
} from './client';

// ============================================================================
// WEBSOCKET CLIENT EXPORTS
// ============================================================================

export type {
  MessageHandler,
  MessageHandlers,
  ConnectionEventHandlers,
  WebSocketClientConfig,
  WebSocketClientMetrics,
} from './websocket';

export {
  SentraWebSocketClient,
  WebSocketConnectionState,
  createWebSocketClient,
  createDefaultWebSocketClient,
} from './websocket';

// ============================================================================
// PROJECT BRIDGE EXPORTS
// ============================================================================

export type {
  ProjectBridgeConfig,
  ProjectState,
  ProjectMetrics,
  BridgeEventTypeEnum,
  BridgeEvent,
  BridgeEventHandler,
} from './bridge';

export {
  ProjectManagementBridge,
  BridgeEventType,
  createProjectBridge,
  createDefaultProjectBridge,
} from './bridge';

// ============================================================================
// AUTHENTICATION EXPORTS
// ============================================================================

export type {
  SessionId,
  RefreshTokenId,
  ApiKeyId,
  AuthenticationProviderType,
  AuthenticationStatusType,
  AuthenticationCredentials,
  AuthenticationSession,
  AuthenticationConfig,
  TokenValidationResult,
  AuthenticationStorage,
} from './auth';

export {
  SentraAuthenticationManager,
  AuthenticationProvider,
  AuthenticationStatus,
  createAuthenticationManager,
  createDefaultAuthManager,
} from './auth';

// ============================================================================
// DATA SYNCHRONIZATION EXPORTS
// ============================================================================

export type {
  SyncId,
  VersionId,
  SyncStatusType,
  ChangeTypeEnum,
  ConflictResolutionType,
  SyncedEntity,
  SyncChange,
  SyncConflict,
  SyncConfiguration,
  SyncMetrics,
  SyncStorage,
} from './sync';

export {
  DataSynchronizationManager,
  SyncStatus,
  ChangeType,
  ConflictResolution,
  createDataSyncManager,
  createDefaultSyncManager,
} from './sync';

// ============================================================================
// INTEGRATED CLIENT CLASS
// ============================================================================

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
export class IntegratedSentraClient {
  public readonly api: any;
  public readonly websocket: any;
  public readonly auth: any;
  public readonly sync: any;
  public readonly bridge: any;

  constructor(_config: IntegratedSentraClientConfig = {}) {
    // TODO: Initialize authentication first
    this.auth = null; // config.auth 
      // ? new SentraAuthenticationManager(config.auth)
      // : createDefaultAuthManager();

    // TODO: Initialize API client with auth
    this.api = null; // new SentraAPIClient({
      // baseUrl: 'http://localhost:8000',
      // timeout: 30000,
      // retryAttempts: 3,
      // logging: { enabled: true, level: 'info' },
      // ...config.api,
    // });

    // TODO: Initialize WebSocket client
    this.websocket = null; // new SentraWebSocketClient({
      // url: 'ws://localhost:8000/ws/projects',
      // reconnectAttempts: 5,
      // reconnectDelay: 2000,
      // heartbeatInterval: 30000,
      // messageTimeout: 10000,
      // logging: { enabled: true, level: 'info' },
      // ...config.websocket,
    // });

    // TODO: Initialize data synchronization
    this.sync = null; // config.sync
      // ? new DataSynchronizationManager(config.sync, this.api, this.websocket)
      // : createDefaultSyncManager(this.api, this.websocket);

    // TODO: Initialize project bridge
    this.bridge = null; // config.bridge
      // ? new ProjectManagementBridge(config.bridge)
      // : createDefaultProjectBridge();
  }

  // ============================================================================
  // LIFECYCLE MANAGEMENT
  // ============================================================================

  async initialize(): Promise<void> {
    try {
      // Initialize authentication
      await this.auth.initialize();

      // Setup authentication for API client
      const session = this.auth.getCurrentSession();
      if (session) {
        // Update API client with authentication
        const token = await this.auth.getValidToken();
        if (token) {
          // Note: Would need to update API client config with token
        }
      }

      // Initialize bridge (which includes API and WebSocket)
      await this.bridge.initialize();

      // Initialize data sync
      await this.sync.initialize();

      console.log('[IntegratedClient] Successfully initialized all components');

    } catch (error) {
      console.error('[IntegratedClient] Initialization failed:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      await this.sync.shutdown();
      await this.bridge.shutdown();
      await this.auth.logout();
      
      console.log('[IntegratedClient] Successfully shut down all components');

    } catch (error) {
      console.error('[IntegratedClient] Shutdown failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // AUTHENTICATION HELPERS
  // ============================================================================

  async loginWithSentraCx(authCode: string): Promise<void> {
    await this.auth.authenticateWithSentraCx(authCode);
    await this.updateAuthenticationForServices();
  }

  async loginWithApiKey(apiKey: string): Promise<void> {
    await this.auth.authenticateWithApiKey(apiKey);
    await this.updateAuthenticationForServices();
  }

  async loginLocally(credentials: { readonly userId: string; readonly token: string }): Promise<void> {
    await this.auth.authenticateLocally(credentials);
    await this.updateAuthenticationForServices();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.updateAuthenticationForServices();
  }

  private async updateAuthenticationForServices(): Promise<void> {
    // const _token = await this.auth.getValidToken();
    
    // Update API client authentication
    // Note: Would need API client method to update auth config
    
    // Update WebSocket authentication
    // Note: Would need WebSocket client method to update auth config
  }

  // ============================================================================
  // STATUS METHODS
  // ============================================================================

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  isConnected(): boolean {
    return this.bridge.isConnected();
  }

  isHealthy(): boolean {
    return this.auth.isAuthenticated() && 
           this.bridge.isHealthy() && 
           !this.sync.isSynchronizing();
  }

  getStatus(): {
    readonly authenticated: boolean;
    readonly connected: boolean;
    readonly healthy: boolean;
    readonly syncStatus: any;
    readonly authProvider?: any;
    readonly userId?: string;
  } {
    return {
      authenticated: this.isAuthenticated(),
      connected: this.isConnected(),
      healthy: this.isHealthy(),
      syncStatus: this.sync.getMetrics(),
      authProvider: this.auth.getProvider() || undefined,
      userId: this.auth.getUserId() || undefined,
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new integrated Sentra client
 */
export const createSentraClient = (config?: IntegratedSentraClientConfig): IntegratedSentraClient => {
  return new IntegratedSentraClient(config);
};

/**
 * Create a default Sentra client with standard configuration
 */
export const createDefaultSentraClient = (): IntegratedSentraClient => {
  return createSentraClient({
    api: {
      baseUrl: process.env['SENTRA_API_URL'] || 'http://localhost:8000',
      logging: { enabled: true, level: 'info' },
    },
    websocket: {
      url: process.env['SENTRA_WS_URL'] || 'ws://localhost:8000/ws/projects',
      logging: { enabled: true, level: 'info' },
    },
  });
};

// ============================================================================
// SINGLETON INSTANCE (OPTIONAL)
// ============================================================================

let defaultClient: IntegratedSentraClient | null = null;

/**
 * Get the default singleton client instance
 */
export const getDefaultSentraClient = (): IntegratedSentraClient => {
  if (!defaultClient) {
    defaultClient = createDefaultSentraClient();
  }
  return defaultClient;
};

/**
 * Reset the default singleton client instance
 */
export const resetDefaultSentraClient = (): void => {
  if (defaultClient) {
    defaultClient.shutdown().catch(console.error);
    defaultClient = null;
  }
};

// ============================================================================
// VERSION INFORMATION
// ============================================================================

export const API_CLIENT_VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  prerelease: null,
} as const;

export const API_CLIENT_VERSION_STRING = `${API_CLIENT_VERSION.major}.${API_CLIENT_VERSION.minor}.${API_CLIENT_VERSION.patch}${
  API_CLIENT_VERSION.prerelease ? `-${API_CLIENT_VERSION.prerelease}` : ''
}`;

// ============================================================================
// DOCUMENTATION METADATA
// ============================================================================

export const API_CLIENT_METADATA = {
  name: 'Sentra API Client',
  description: 'TypeScript client library for Sentra FastAPI backend integration',
  version: API_CLIENT_VERSION_STRING,
  author: 'Sentra Development Team',
  license: 'MIT',
  repository: 'https://github.com/barnent1/sentra',
  features: [
    'HTTP REST API client',
    'WebSocket real-time communication', 
    'Authentication management',
    'Data synchronization',
    'Project management bridge',
    'Offline mode support',
    'Conflict resolution',
    'Type-safe interfaces',
  ],
  endpoints: [
    '/health',
    '/api/agents',
    '/api/tasks', 
    '/api/projects',
    '/api/events',
    '/api/memory',
    '/api/approvals',
    '/api/monitoring',
    '/deploy',
    '/ws/projects',
  ],
} as const;