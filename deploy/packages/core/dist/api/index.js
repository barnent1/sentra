/**
 * Sentra API Client Integration Layer
 *
 * Main entry point for all API client functionality including HTTP client,
 * WebSocket communication, project management bridge, authentication,
 * and data synchronization.
 *
 * @module APIIntegration
 */
export { 
// Enum constants
AgentRole, TaskStatus, TaskPriority, SubAgentStatus, WebSocketMessageType, 
// Type guards
isAgentResponse, isTaskResponse, isWebSocketMessage, isAPIError, } from './types';
// ============================================================================
// HTTP CLIENT EXPORTS
// ============================================================================
export { SentraAPIClient, createAPIClient, getDefaultAPIClient, resetDefaultAPIClient, } from './client';
export { SentraWebSocketClient, WebSocketConnectionState, createWebSocketClient, createDefaultWebSocketClient, } from './websocket';
export { ProjectManagementBridge, BridgeEventType, createProjectBridge, createDefaultProjectBridge, } from './bridge';
export { SentraAuthenticationManager, AuthenticationProvider, AuthenticationStatus, createAuthenticationManager, createDefaultAuthManager, } from './auth';
export { DataSynchronizationManager, SyncStatus, ChangeType, ConflictResolution, createDataSyncManager, createDefaultSyncManager, } from './sync';
/**
 * Integrated Sentra Client combining all API functionality
 *
 * Provides a unified interface for HTTP API, WebSocket, authentication,
 * data synchronization, and project management.
 */
export class IntegratedSentraClient {
    api;
    websocket;
    auth;
    sync;
    bridge;
    constructor(_config = {}) {
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
    async initialize() {
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
        }
        catch (error) {
            console.error('[IntegratedClient] Initialization failed:', error);
            throw error;
        }
    }
    async shutdown() {
        try {
            await this.sync.shutdown();
            await this.bridge.shutdown();
            await this.auth.logout();
            console.log('[IntegratedClient] Successfully shut down all components');
        }
        catch (error) {
            console.error('[IntegratedClient] Shutdown failed:', error);
            throw error;
        }
    }
    // ============================================================================
    // AUTHENTICATION HELPERS
    // ============================================================================
    async loginWithSentraCx(authCode) {
        await this.auth.authenticateWithSentraCx(authCode);
        await this.updateAuthenticationForServices();
    }
    async loginWithApiKey(apiKey) {
        await this.auth.authenticateWithApiKey(apiKey);
        await this.updateAuthenticationForServices();
    }
    async loginLocally(credentials) {
        await this.auth.authenticateLocally(credentials);
        await this.updateAuthenticationForServices();
    }
    async logout() {
        await this.auth.logout();
        await this.updateAuthenticationForServices();
    }
    async updateAuthenticationForServices() {
        // const _token = await this.auth.getValidToken();
        // Update API client authentication
        // Note: Would need API client method to update auth config
        // Update WebSocket authentication
        // Note: Would need WebSocket client method to update auth config
    }
    // ============================================================================
    // STATUS METHODS
    // ============================================================================
    isAuthenticated() {
        return this.auth.isAuthenticated();
    }
    isConnected() {
        return this.bridge.isConnected();
    }
    isHealthy() {
        return this.auth.isAuthenticated() &&
            this.bridge.isHealthy() &&
            !this.sync.isSynchronizing();
    }
    getStatus() {
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
export const createSentraClient = (config) => {
    return new IntegratedSentraClient(config);
};
/**
 * Create a default Sentra client with standard configuration
 */
export const createDefaultSentraClient = () => {
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
let defaultClient = null;
/**
 * Get the default singleton client instance
 */
export const getDefaultSentraClient = () => {
    if (!defaultClient) {
        defaultClient = createDefaultSentraClient();
    }
    return defaultClient;
};
/**
 * Reset the default singleton client instance
 */
export const resetDefaultSentraClient = () => {
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
};
export const API_CLIENT_VERSION_STRING = `${API_CLIENT_VERSION.major}.${API_CLIENT_VERSION.minor}.${API_CLIENT_VERSION.patch}${API_CLIENT_VERSION.prerelease ? `-${API_CLIENT_VERSION.prerelease}` : ''}`;
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
};
//# sourceMappingURL=index.js.map