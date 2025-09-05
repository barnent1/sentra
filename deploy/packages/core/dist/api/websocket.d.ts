/**
 * WebSocket Client for Real-time Sentra API Communication
 *
 * Provides type-safe WebSocket connection management for real-time updates
 * from the FastAPI backend including project status, task updates, and
 * system notifications.
 *
 * @module WebSocketClient
 */
import type { WebSocketMessage, WebSocketMessageTypeEnum, ProjectUpdateMessage, TaskUpdateMessage, AgentUpdateMessage, SystemUpdateMessage, WebSocketConnectionId, ProjectId, TaskId, AgentId } from './types';
export declare const WebSocketConnectionState: {
    readonly CONNECTING: "connecting";
    readonly CONNECTED: "connected";
    readonly DISCONNECTING: "disconnecting";
    readonly DISCONNECTED: "disconnected";
    readonly ERROR: "error";
};
export type WebSocketConnectionStateType = typeof WebSocketConnectionState[keyof typeof WebSocketConnectionState];
export interface WebSocketClientConfig {
    readonly url: string;
    readonly protocols?: readonly string[];
    readonly reconnectAttempts: number;
    readonly reconnectDelay: number;
    readonly heartbeatInterval: number;
    readonly messageTimeout: number;
    readonly authentication?: {
        readonly token?: string;
        readonly apiKey?: string;
    };
    readonly logging: {
        readonly enabled: boolean;
        readonly level: 'debug' | 'info' | 'warn' | 'error';
    };
}
export type MessageHandler<T = unknown> = (message: WebSocketMessage<T>) => void | Promise<void>;
export interface MessageHandlers {
    readonly onProjectUpdate?: MessageHandler<ProjectUpdateMessage>;
    readonly onTaskUpdate?: MessageHandler<TaskUpdateMessage>;
    readonly onAgentUpdate?: MessageHandler<AgentUpdateMessage>;
    readonly onSystemUpdate?: MessageHandler<SystemUpdateMessage>;
    readonly onError?: MessageHandler<{
        readonly error: string;
        readonly code?: string;
    }>;
    readonly onHeartbeat?: MessageHandler<{
        readonly timestamp: string;
    }>;
    readonly onGeneric?: MessageHandler<unknown>;
}
export interface ConnectionEventHandlers {
    readonly onConnect?: (connectionId: WebSocketConnectionId) => void | Promise<void>;
    readonly onDisconnect?: (code?: number, reason?: string) => void | Promise<void>;
    readonly onError?: (error: Event) => void | Promise<void>;
    readonly onReconnect?: (attempt: number) => void | Promise<void>;
    readonly onReconnectFailed?: () => void | Promise<void>;
}
export interface WebSocketClientMetrics {
    readonly connectionState: WebSocketConnectionStateType;
    readonly connectTime?: Date;
    readonly lastMessageTime?: Date;
    readonly messagesSent: number;
    readonly messagesReceived: number;
    readonly reconnectAttempts: number;
    readonly errors: number;
    readonly averageLatency: number;
}
export declare class SentraWebSocketClient {
    private readonly config;
    private websocket;
    private connectionId;
    private reconnectTimer;
    private heartbeatTimer;
    private messageHandlers;
    private connectionEventHandlers;
    private metrics;
    private pendingMessages;
    private lastPingTime;
    constructor(config: WebSocketClientConfig);
    connect(): Promise<WebSocketConnectionId>;
    disconnect(): Promise<void>;
    private attemptReconnect;
    private clearReconnectTimer;
    private handleMessage;
    private routeMessage;
    sendMessage<T = unknown>(type: WebSocketMessageTypeEnum, data: T, waitForResponse?: boolean): Promise<WebSocketMessage | void>;
    private sendMessageInternal;
    private startHeartbeat;
    private stopHeartbeat;
    subscribeToProject(projectId: ProjectId): void;
    subscribeToTask(taskId: TaskId): void;
    subscribeToAgent(agentId: AgentId): void;
    unsubscribeFromProject(projectId: ProjectId): void;
    unsubscribeFromTask(taskId: TaskId): void;
    unsubscribeFromAgent(agentId: AgentId): void;
    setMessageHandlers(handlers: MessageHandlers): void;
    setConnectionEventHandlers(handlers: ConnectionEventHandlers): void;
    isConnected(): boolean;
    getConnectionId(): WebSocketConnectionId | null;
    getMetrics(): WebSocketClientMetrics;
    getConfig(): WebSocketClientConfig;
    private buildWebSocketUrl;
    private generateMessageId;
    private updateMetrics;
    private updateLatency;
    private log;
}
export declare const createWebSocketClient: (config: WebSocketClientConfig) => SentraWebSocketClient;
export declare const createDefaultWebSocketClient: (baseUrl?: string) => SentraWebSocketClient;
//# sourceMappingURL=websocket.d.ts.map