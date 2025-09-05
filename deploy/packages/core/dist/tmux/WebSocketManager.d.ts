/**
 * TMUX WebSocket Manager
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This class manages real-time WebSocket connections for TMUX session monitoring,
 * broadcasting project activity updates, agent status changes, and system events.
 */
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import type { SessionId, PanelId, WebSocketConnectionId, ActivityStreamId, WebSocketMessage, WebSocketMessageType } from './types';
import type { AgentInstanceId } from '@sentra/types';
/**
 * WebSocket client information
 */
export interface WebSocketClient {
    readonly connectionId: WebSocketConnectionId;
    readonly socket: WebSocket;
    readonly subscribedSessions: readonly SessionId[];
    readonly subscribedPanels: readonly PanelId[];
    readonly connectionTime: Date;
    readonly lastActivity: Date;
    readonly clientInfo: {
        readonly userAgent?: string;
        readonly ipAddress?: string;
        readonly clientType: 'dashboard' | 'cli' | 'mobile' | 'api' | 'unknown';
    };
    readonly permissions: {
        readonly canReceiveUpdates: boolean;
        readonly canSendCommands: boolean;
        readonly canViewAllSessions: boolean;
    };
}
/**
 * Subscription filter configuration
 */
export interface SubscriptionFilter {
    readonly sessionIds?: readonly SessionId[];
    readonly panelIds?: readonly PanelId[];
    readonly messageTypes?: readonly WebSocketMessageType[];
    readonly agentIds?: readonly AgentInstanceId[];
    readonly minSeverity?: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Broadcasting configuration
 */
export interface BroadcastConfig {
    readonly enableHeartbeat: boolean;
    readonly heartbeatInterval: number;
    readonly messageQueueSize: number;
    readonly connectionTimeout: number;
    readonly maxConnections: number;
    readonly compressionEnabled: boolean;
    readonly rateLimiting: {
        readonly enabled: boolean;
        readonly messagesPerSecond: number;
        readonly burstSize: number;
    };
}
/**
 * Activity stream configuration for real-time monitoring
 */
export interface ActivityStreamConfig {
    readonly streamId: ActivityStreamId;
    readonly sessionId: SessionId;
    readonly updateInterval: number;
    readonly bufferSize: number;
    readonly filters: SubscriptionFilter;
    readonly isActive: boolean;
}
/**
 * WebSocket manager statistics
 */
export interface WebSocketStats {
    readonly connectedClients: number;
    readonly totalMessagesReceived: number;
    readonly totalMessagesSent: number;
    readonly totalBytesReceived: number;
    readonly totalBytesSent: number;
    readonly averageMessageSize: number;
    readonly connectionErrors: number;
    readonly activeSubscriptions: number;
    readonly uptime: number;
    readonly lastStatsUpdate: Date;
}
/**
 * Real-time WebSocket manager for TMUX sessions
 */
export declare class WebSocketManager extends EventEmitter {
    private readonly server;
    private readonly wss;
    private readonly config;
    private readonly clients;
    private readonly activityStreams;
    private readonly messageQueue;
    private readonly rateLimiter;
    private heartbeatInterval?;
    private stats;
    private readonly startTime;
    constructor(port: number, config?: Partial<BroadcastConfig>);
    private initialize;
    private setupWebSocketHandlers;
    private startServer;
    private startHeartbeat;
    private startStatsCollection;
    private setupCleanupTimers;
    /**
     * Handle new WebSocket connection
     */
    private handleNewConnection;
    /**
     * Setup handlers for individual client
     */
    private setupClientHandlers;
    /**
     * Handle message from client
     */
    private handleClientMessage;
    /**
     * Process parsed message from client
     */
    private processClientMessage;
    /**
     * Handle client disconnection
     */
    private handleClientDisconnection;
    /**
     * Handle client error
     */
    private handleClientError;
    /**
     * Handle subscription request from client
     */
    private handleSubscriptionRequest;
    /**
     * Handle unsubscription request from client
     */
    private handleUnsubscriptionRequest;
    /**
     * Broadcast message to all relevant clients
     */
    broadcastMessage(message: WebSocketMessage): void;
    /**
     * Find clients that should receive a specific message
     */
    private findRelevantClients;
    /**
     * Send message to specific client
     */
    private sendToClient;
    /**
     * Broadcast heartbeat to all clients
     */
    private broadcastHeartbeat;
    /**
     * Create activity stream for session monitoring
     */
    createActivityStream(config: ActivityStreamConfig): ActivityStreamId;
    /**
     * Start activity stream
     */
    private startActivityStream;
    /**
     * Stop activity stream
     */
    stopActivityStream(streamId: ActivityStreamId): void;
    /**
     * Remove activity stream
     */
    removeActivityStream(streamId: ActivityStreamId): void;
    /**
     * Generate unique connection ID
     */
    private generateConnectionId;
    /**
     * Extract client information from request
     */
    private extractClientInfo;
    /**
     * Determine client permissions based on client info
     */
    private determinePermissions;
    /**
     * Update client activity timestamp
     */
    private updateClientActivity;
    /**
     * Check rate limit for client
     */
    private checkRateLimit;
    /**
     * Send error message to client
     */
    private sendErrorToClient;
    /**
     * Send pong response to client
     */
    private sendPongToClient;
    /**
     * Send welcome message to new client
     */
    private sendWelcomeMessage;
    /**
     * Initialize statistics object
     */
    private initializeStats;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Count active subscriptions across all clients
     */
    private countActiveSubscriptions;
    /**
     * Get current active panel count
     */
    private getActivePanelCount;
    /**
     * Clean up inactive connections
     */
    private cleanupInactiveConnections;
    /**
     * Clean up message queues
     */
    private cleanupMessageQueues;
    /**
     * Get current statistics
     */
    getStats(): WebSocketStats;
    /**
     * Get connected clients
     */
    getConnectedClients(): readonly WebSocketClient[];
    /**
     * Get active activity streams
     */
    getActivityStreams(): readonly ActivityStreamConfig[];
    /**
     * Handle command request from client
     */
    private handleCommandRequest;
    /**
     * Merge default configuration
     */
    private mergeDefaultConfig;
    /**
     * Cleanup and shutdown
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=WebSocketManager.d.ts.map