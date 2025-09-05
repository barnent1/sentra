/**
 * WebSocket Client for Real-time Sentra API Communication
 * 
 * Provides type-safe WebSocket connection management for real-time updates
 * from the FastAPI backend including project status, task updates, and 
 * system notifications.
 * 
 * @module WebSocketClient
 */

import type {
  WebSocketMessage,
  WebSocketMessageTypeEnum,
  ProjectUpdateMessage,
  TaskUpdateMessage,
  AgentUpdateMessage,
  SystemUpdateMessage,
  WebSocketConnectionId,
  ProjectId,
  TaskId,
  AgentId
} from './types';
import { isWebSocketMessage, WebSocketMessageType } from './types';

// ============================================================================
// WEBSOCKET CONNECTION STATES
// ============================================================================

export const WebSocketConnectionState = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTING: 'disconnecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
} as const;

export type WebSocketConnectionStateType = typeof WebSocketConnectionState[keyof typeof WebSocketConnectionState];

// ============================================================================
// WEBSOCKET CLIENT CONFIGURATION
// ============================================================================

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

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

export type MessageHandler<T = unknown> = (message: WebSocketMessage<T>) => void | Promise<void>;

export interface MessageHandlers {
  readonly onProjectUpdate?: MessageHandler<ProjectUpdateMessage>;
  readonly onTaskUpdate?: MessageHandler<TaskUpdateMessage>;
  readonly onAgentUpdate?: MessageHandler<AgentUpdateMessage>;
  readonly onSystemUpdate?: MessageHandler<SystemUpdateMessage>;
  readonly onError?: MessageHandler<{ readonly error: string; readonly code?: string }>;
  readonly onHeartbeat?: MessageHandler<{ readonly timestamp: string }>;
  readonly onGeneric?: MessageHandler<unknown>;
}

// ============================================================================
// CONNECTION EVENTS
// ============================================================================

export interface ConnectionEventHandlers {
  readonly onConnect?: (connectionId: WebSocketConnectionId) => void | Promise<void>;
  readonly onDisconnect?: (code?: number, reason?: string) => void | Promise<void>;
  readonly onError?: (error: Event) => void | Promise<void>;
  readonly onReconnect?: (attempt: number) => void | Promise<void>;
  readonly onReconnectFailed?: () => void | Promise<void>;
}

// ============================================================================
// WEBSOCKET CLIENT METRICS
// ============================================================================

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

// ============================================================================
// PENDING MESSAGE TRACKING
// ============================================================================

interface PendingMessage {
  readonly id: string;
  readonly timestamp: Date;
  readonly resolve: (value: WebSocketMessage) => void;
  readonly reject: (error: Error) => void;
  readonly timeout: NodeJS.Timeout;
}

// ============================================================================
// WEBSOCKET CLIENT CLASS
// ============================================================================

export class SentraWebSocketClient {
  private readonly config: WebSocketClientConfig;
  private websocket: WebSocket | null = null;
  private connectionId: WebSocketConnectionId | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageHandlers: MessageHandlers = {};
  private connectionEventHandlers: ConnectionEventHandlers = {};
  private metrics: WebSocketClientMetrics;
  private pendingMessages: Map<string, PendingMessage> = new Map();
  private lastPingTime: Date | null = null;

  constructor(config: WebSocketClientConfig) {
    this.config = config;
    this.metrics = {
      connectionState: WebSocketConnectionState.DISCONNECTED,
      messagesSent: 0,
      messagesReceived: 0,
      reconnectAttempts: 0,
      errors: 0,
      averageLatency: 0,
    };
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  async connect(): Promise<WebSocketConnectionId> {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      return this.connectionId!;
    }

    this.updateMetrics({ connectionState: WebSocketConnectionState.CONNECTING });

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.buildWebSocketUrl();
        this.websocket = new WebSocket(wsUrl, this.config.protocols ? [...this.config.protocols] : undefined);

        this.websocket.onopen = async () => {
          this.updateMetrics({ 
            connectionState: WebSocketConnectionState.CONNECTED,
            connectTime: new Date(),
          });

          // Generate connection ID (in real implementation, server would provide this)
          this.connectionId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as WebSocketConnectionId;
          
          this.startHeartbeat();
          
          if (this.connectionEventHandlers.onConnect) {
            await this.connectionEventHandlers.onConnect(this.connectionId);
          }

          this.log('info', `WebSocket connected with ID: ${this.connectionId}`);
          resolve(this.connectionId);
        };

        this.websocket.onmessage = async (event) => {
          await this.handleMessage(event.data);
        };

        this.websocket.onclose = async (event) => {
          this.updateMetrics({ connectionState: WebSocketConnectionState.DISCONNECTED });
          this.stopHeartbeat();
          
          if (this.connectionEventHandlers.onDisconnect) {
            await this.connectionEventHandlers.onDisconnect(event.code, event.reason);
          }

          this.log('warn', `WebSocket disconnected: ${event.code} - ${event.reason}`);

          // Attempt reconnection if not manually closed
          if (event.code !== 1000 && this.metrics.reconnectAttempts < this.config.reconnectAttempts) {
            await this.attemptReconnect();
          }
        };

        this.websocket.onerror = async (event) => {
          this.updateMetrics({ errors: this.metrics.errors + 1 });
          
          if (this.connectionEventHandlers.onError) {
            await this.connectionEventHandlers.onError(event);
          }

          this.log('error', 'WebSocket error:', event);
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        this.updateMetrics({ connectionState: WebSocketConnectionState.ERROR });
        this.log('error', 'Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    this.clearReconnectTimer();
    this.stopHeartbeat();
    
    if (this.websocket) {
      this.updateMetrics({ connectionState: WebSocketConnectionState.DISCONNECTING });
      this.websocket.close(1000, 'Client disconnecting');
      this.websocket = null;
    }

    this.connectionId = null;
    this.updateMetrics({ connectionState: WebSocketConnectionState.DISCONNECTED });
  }

  private async attemptReconnect(): Promise<void> {
    this.updateMetrics({ reconnectAttempts: this.metrics.reconnectAttempts + 1 });
    
    if (this.connectionEventHandlers.onReconnect) {
      await this.connectionEventHandlers.onReconnect(this.metrics.reconnectAttempts);
    }

    this.log('info', `Attempting to reconnect (${this.metrics.reconnectAttempts}/${this.config.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        this.updateMetrics({ reconnectAttempts: 0 }); // Reset on successful reconnect
      } catch (error) {
        if (this.metrics.reconnectAttempts >= this.config.reconnectAttempts) {
          if (this.connectionEventHandlers.onReconnectFailed) {
            await this.connectionEventHandlers.onReconnectFailed();
          }
          this.log('error', 'Max reconnection attempts reached');
        } else {
          await this.attemptReconnect();
        }
      }
    }, this.config.reconnectDelay * this.metrics.reconnectAttempts);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  private async handleMessage(data: string): Promise<void> {
    try {
      const parsed = JSON.parse(data);
      
      if (!isWebSocketMessage(parsed)) {
        this.log('warn', 'Received invalid message format:', parsed);
        return;
      }

      const message = parsed as WebSocketMessage;
      this.updateMetrics({ 
        messagesReceived: this.metrics.messagesReceived + 1,
        lastMessageTime: new Date(),
      });

      // Handle pending message responses
      if (this.pendingMessages.has(message.id)) {
        const pending = this.pendingMessages.get(message.id)!;
        clearTimeout(pending.timeout);
        this.pendingMessages.delete(message.id);
        
        // Calculate latency for heartbeat messages
        if (message.type === 'heartbeat' && this.lastPingTime) {
          const latency = Date.now() - this.lastPingTime.getTime();
          this.updateLatency(latency);
        }

        pending.resolve(message);
        return;
      }

      // Route message to appropriate handler
      await this.routeMessage(message);

    } catch (error) {
      this.log('error', 'Failed to parse WebSocket message:', error);
      this.updateMetrics({ errors: this.metrics.errors + 1 });
    }
  }

  private async routeMessage(message: WebSocketMessage): Promise<void> {
    try {
      switch (message.type) {
        case 'project_update':
          if (this.messageHandlers.onProjectUpdate) {
            await this.messageHandlers.onProjectUpdate(message as WebSocketMessage<ProjectUpdateMessage>);
          }
          break;

        case 'task_update':
          if (this.messageHandlers.onTaskUpdate) {
            await this.messageHandlers.onTaskUpdate(message as WebSocketMessage<TaskUpdateMessage>);
          }
          break;

        case 'agent_update':
          if (this.messageHandlers.onAgentUpdate) {
            await this.messageHandlers.onAgentUpdate(message as WebSocketMessage<AgentUpdateMessage>);
          }
          break;

        case 'system_update':
          if (this.messageHandlers.onSystemUpdate) {
            await this.messageHandlers.onSystemUpdate(message as WebSocketMessage<SystemUpdateMessage>);
          }
          break;

        case 'error':
          if (this.messageHandlers.onError) {
            await this.messageHandlers.onError(message as WebSocketMessage<{ readonly error: string; readonly code?: string }>);
          }
          break;

        case 'heartbeat':
          if (this.messageHandlers.onHeartbeat) {
            await this.messageHandlers.onHeartbeat(message as WebSocketMessage<{ readonly timestamp: string }>);
          }
          break;

        default:
          if (this.messageHandlers.onGeneric) {
            await this.messageHandlers.onGeneric(message);
          }
          this.log('debug', 'Unhandled message type:', message.type);
          break;
      }
    } catch (error) {
      this.log('error', `Error handling ${message.type} message:`, error);
    }
  }

  // ============================================================================
  // MESSAGE SENDING
  // ============================================================================

  async sendMessage<T = unknown>(
    type: WebSocketMessageTypeEnum,
    data: T,
    waitForResponse: boolean = false
  ): Promise<WebSocketMessage | void> {
    if (!this.isConnected()) {
      throw new Error('WebSocket is not connected');
    }

    const message: WebSocketMessage<T> = {
      type,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      data,
    };

    if (waitForResponse) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingMessages.delete(message.id);
          reject(new Error(`Message timeout: ${message.id}`));
        }, this.config.messageTimeout);

        this.pendingMessages.set(message.id, {
          id: message.id,
          timestamp: new Date(),
          resolve,
          reject,
          timeout,
        });

        this.sendMessageInternal(message);
      });
    } else {
      this.sendMessageInternal(message);
    }
  }

  private sendMessageInternal(message: WebSocketMessage): void {
    try {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify(message));
        this.updateMetrics({ messagesSent: this.metrics.messagesSent + 1 });
        this.log('debug', `Sent message: ${message.type} (${message.id})`);
      } else {
        throw new Error('WebSocket is not open');
      }
    } catch (error) {
      this.log('error', 'Failed to send message:', error);
      this.updateMetrics({ errors: this.metrics.errors + 1 });
      throw error;
    }
  }

  // ============================================================================
  // HEARTBEAT MANAGEMENT
  // ============================================================================

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        this.lastPingTime = new Date();
        await this.sendMessage(WebSocketMessageType.HEARTBEAT, { timestamp: new Date().toISOString() });
      } catch (error) {
        this.log('error', 'Heartbeat failed:', error);
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ============================================================================
  // SUBSCRIPTION METHODS
  // ============================================================================

  subscribeToProject(projectId: ProjectId): void {
    this.sendMessage(WebSocketMessageType.SUBSCRIBE, { type: 'project', project_id: projectId });
  }

  subscribeToTask(taskId: TaskId): void {
    this.sendMessage(WebSocketMessageType.SUBSCRIBE, { type: 'task', task_id: taskId });
  }

  subscribeToAgent(agentId: AgentId): void {
    this.sendMessage(WebSocketMessageType.SUBSCRIBE, { type: 'agent', agent_id: agentId });
  }

  unsubscribeFromProject(projectId: ProjectId): void {
    this.sendMessage(WebSocketMessageType.UNSUBSCRIBE, { type: 'project', project_id: projectId });
  }

  unsubscribeFromTask(taskId: TaskId): void {
    this.sendMessage(WebSocketMessageType.UNSUBSCRIBE, { type: 'task', task_id: taskId });
  }

  unsubscribeFromAgent(agentId: AgentId): void {
    this.sendMessage(WebSocketMessageType.UNSUBSCRIBE, { type: 'agent', agent_id: agentId });
  }

  // ============================================================================
  // EVENT HANDLER REGISTRATION
  // ============================================================================

  setMessageHandlers(handlers: MessageHandlers): void {
    this.messageHandlers = { ...this.messageHandlers, ...handlers };
  }

  setConnectionEventHandlers(handlers: ConnectionEventHandlers): void {
    this.connectionEventHandlers = { ...this.connectionEventHandlers, ...handlers };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  getConnectionId(): WebSocketConnectionId | null {
    return this.connectionId;
  }

  getMetrics(): WebSocketClientMetrics {
    return { ...this.metrics };
  }

  getConfig(): WebSocketClientConfig {
    return { ...this.config };
  }

  private buildWebSocketUrl(): string {
    const url = new URL(this.config.url);
    
    if (this.config.authentication?.token) {
      url.searchParams.append('token', this.config.authentication.token);
    }
    
    if (this.config.authentication?.apiKey) {
      url.searchParams.append('api_key', this.config.authentication.apiKey);
    }

    return url.toString();
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateMetrics(updates: Partial<WebSocketClientMetrics>): void {
    Object.assign(this.metrics, updates);
  }

  private updateLatency(latency: number): void {
    const totalMessages = this.metrics.messagesReceived;
    const newAverageLatency = 
      (this.metrics.averageLatency * (totalMessages - 1) + latency) / totalMessages;
    this.updateMetrics({ averageLatency: newAverageLatency });
  }

  private log(level: string, message: string, ...args: unknown[]): void {
    if (this.config.logging.enabled && 
        ['debug', 'info', 'warn', 'error'].indexOf(level) >= 
        ['debug', 'info', 'warn', 'error'].indexOf(this.config.logging.level)) {
      const logLevel = level as 'debug' | 'info' | 'warn' | 'error';
      (console[logLevel] as (...args: any[]) => void)(`[WebSocket] ${message}`, ...args);
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export const createWebSocketClient = (config: WebSocketClientConfig): SentraWebSocketClient => {
  return new SentraWebSocketClient(config);
};

export const createDefaultWebSocketClient = (baseUrl: string = 'ws://localhost:8000'): SentraWebSocketClient => {
  return createWebSocketClient({
    url: `${baseUrl}/ws/projects`,
    reconnectAttempts: 5,
    reconnectDelay: 2000,
    heartbeatInterval: 30000,
    messageTimeout: 10000,
    logging: {
      enabled: true,
      level: 'info',
    },
  });
};