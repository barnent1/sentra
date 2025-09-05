/**
 * WebSocket Bridge for Real-time Evolution Updates
 * 
 * This module connects the evolution system to WebSocket streams for real-time
 * updates to dashboard, mobile, and TMUX interfaces.
 * 
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */

import { EventEmitter } from 'events';
import type {
  EvolutionDnaId,
  AgentInstanceId,
  ProjectContextId,
  TaskId,
  Brand
} from '../types';
import type { 
  EvolutionMetricsUpdate
} from './evolution-service';
import type {
  RealTimeEvolutionDashboard,
  EvolutionAlert,
  EvolutionTrend
} from './metrics-service';

// ============================================================================
// WEBSOCKET MESSAGE TYPES
// ============================================================================

export type WebSocketConnectionId = Brand<string, 'WebSocketConnectionId'>;

export const EvolutionWebSocketMessageType = {
  // DNA Evolution Events
  DNA_CREATED: 'dna_created',
  DNA_EVOLVED: 'dna_evolved',
  DNA_MUTATED: 'dna_mutated',
  PATTERN_LEARNED: 'pattern_learned',
  
  // Cross-project Learning
  CROSS_PROJECT_PATTERN_IDENTIFIED: 'cross_project_pattern_identified',
  PATTERN_TRANSFER_INITIATED: 'pattern_transfer_initiated',
  PATTERN_TRANSFER_COMPLETED: 'pattern_transfer_completed',
  
  // Real-time Metrics
  METRICS_UPDATE: 'metrics_update',
  DASHBOARD_UPDATE: 'dashboard_update',
  ALERT_TRIGGERED: 'alert_triggered',
  TREND_DETECTED: 'trend_detected',
  
  // Agent Updates
  AGENT_DNA_INITIALIZED: 'agent_dna_initialized',
  AGENT_PERFORMANCE_UPDATE: 'agent_performance_update',
  AGENT_EVOLUTION_PROGRESS: 'agent_evolution_progress',
  
  // System Updates
  SYSTEM_HEALTH_UPDATE: 'system_health_update',
  EVOLUTION_STATISTICS: 'evolution_statistics',
  
  // Subscription Management
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  SUBSCRIPTION_CONFIRMED: 'subscription_confirmed',
  
  // Error Handling
  ERROR: 'error',
  HEARTBEAT: 'heartbeat',
} as const;

export type EvolutionWebSocketMessageType = typeof EvolutionWebSocketMessageType[keyof typeof EvolutionWebSocketMessageType];

export interface BaseWebSocketMessage {
  readonly type: EvolutionWebSocketMessageType;
  readonly id: string;
  readonly timestamp: string;
  readonly connectionId?: WebSocketConnectionId;
}

export interface DnaCreatedMessage extends BaseWebSocketMessage {
  readonly type: typeof EvolutionWebSocketMessageType.DNA_CREATED;
  readonly data: {
    readonly agentId: AgentInstanceId;
    readonly dnaId: EvolutionDnaId;
    readonly projectId: ProjectContextId;
    readonly patternType: string;
    readonly fitness: number;
    readonly generation: number;
  };
}

export interface DnaEvolvedMessage extends BaseWebSocketMessage {
  readonly type: typeof EvolutionWebSocketMessageType.DNA_EVOLVED;
  readonly data: {
    readonly agentId: AgentInstanceId;
    readonly originalDnaId: EvolutionDnaId;
    readonly evolvedDnaId: EvolutionDnaId;
    readonly projectId: ProjectContextId;
    readonly fitnessImprovement: number;
    readonly generation: number;
    readonly evolutionType: string;
    readonly confidence: number;
  };
}

export interface CrossProjectPatternMessage extends BaseWebSocketMessage {
  readonly type: typeof EvolutionWebSocketMessageType.CROSS_PROJECT_PATTERN_IDENTIFIED;
  readonly data: {
    readonly patternId: string;
    readonly sourceProject: ProjectContextId;
    readonly targetProject: ProjectContextId;
    readonly similarity: number;
    readonly transferPotential: number;
    readonly patternType: string;
  };
}

export interface MetricsUpdateMessage extends BaseWebSocketMessage {
  readonly type: typeof EvolutionWebSocketMessageType.METRICS_UPDATE;
  readonly data: EvolutionMetricsUpdate;
}

export interface DashboardUpdateMessage extends BaseWebSocketMessage {
  readonly type: typeof EvolutionWebSocketMessageType.DASHBOARD_UPDATE;
  readonly data: RealTimeEvolutionDashboard;
}

export interface AlertMessage extends BaseWebSocketMessage {
  readonly type: typeof EvolutionWebSocketMessageType.ALERT_TRIGGERED;
  readonly data: EvolutionAlert;
}

export interface AgentPerformanceMessage extends BaseWebSocketMessage {
  readonly type: typeof EvolutionWebSocketMessageType.AGENT_PERFORMANCE_UPDATE;
  readonly data: {
    readonly agentId: AgentInstanceId;
    readonly dnaId: EvolutionDnaId;
    readonly projectId: ProjectContextId;
    readonly taskId: TaskId;
    readonly metrics: {
      readonly successRate: number;
      readonly codeQuality: number;
      readonly adaptationSpeed: number;
      readonly errorRecovery: number;
    };
    readonly trends: readonly EvolutionTrend[];
  };
}

export interface SystemHealthMessage extends BaseWebSocketMessage {
  readonly type: typeof EvolutionWebSocketMessageType.SYSTEM_HEALTH_UPDATE;
  readonly data: {
    readonly healthScore: number;
    readonly activeAgents: number;
    readonly totalEvolutions: number;
    readonly averageFitness: number;
    readonly diversityIndex: number;
    readonly issues: readonly string[];
  };
}

export interface SubscriptionMessage extends BaseWebSocketMessage {
  readonly type: typeof EvolutionWebSocketMessageType.SUBSCRIBE | typeof EvolutionWebSocketMessageType.UNSUBSCRIBE;
  readonly data: {
    readonly subscriptions: readonly EvolutionSubscription[];
  };
}

export interface ErrorMessage extends BaseWebSocketMessage {
  readonly type: typeof EvolutionWebSocketMessageType.ERROR;
  readonly data: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
}

export type EvolutionWebSocketMessage = 
  | DnaCreatedMessage
  | DnaEvolvedMessage
  | CrossProjectPatternMessage
  | MetricsUpdateMessage
  | DashboardUpdateMessage
  | AlertMessage
  | AgentPerformanceMessage
  | SystemHealthMessage
  | SubscriptionMessage
  | ErrorMessage;

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export const EvolutionSubscriptionType = {
  ALL_EVENTS: 'all_events',
  DNA_EVOLUTION: 'dna_evolution',
  CROSS_PROJECT_LEARNING: 'cross_project_learning',
  METRICS_UPDATES: 'metrics_updates',
  ALERTS: 'alerts',
  AGENT_SPECIFIC: 'agent_specific',
  PROJECT_SPECIFIC: 'project_specific',
  DASHBOARD: 'dashboard',
  SYSTEM_HEALTH: 'system_health',
} as const;

export type EvolutionSubscriptionType = typeof EvolutionSubscriptionType[keyof typeof EvolutionSubscriptionType];

export interface EvolutionSubscription {
  readonly type: EvolutionSubscriptionType;
  readonly filters?: {
    readonly agentId?: AgentInstanceId;
    readonly projectId?: ProjectContextId;
    readonly dnaId?: EvolutionDnaId;
    readonly metricTypes?: readonly string[];
    readonly minFitnessImprovement?: number;
    readonly alertSeverities?: readonly string[];
  };
}

export interface WebSocketConnection {
  readonly id: WebSocketConnectionId;
  readonly subscriptions: readonly EvolutionSubscription[];
  readonly connectedAt: Date;
  readonly lastActivity: Date;
  readonly clientType: 'dashboard' | 'mobile' | 'tmux' | 'api' | 'unknown';
  readonly metadata: Record<string, unknown>;
}

// ============================================================================
// WEBSOCKET BRIDGE SERVICE
// ============================================================================

export class EvolutionWebSocketBridge extends EventEmitter {
  private readonly connections = new Map<WebSocketConnectionId, WebSocketConnection>();
  private readonly messageQueue = new Map<WebSocketConnectionId, EvolutionWebSocketMessage[]>();
  private heartbeatInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.startHeartbeat();
    this.startCleanup();
  }

  /**
   * Register a new WebSocket connection
   */
  registerConnection(
    connectionId: WebSocketConnectionId,
    clientType: WebSocketConnection['clientType'] = 'unknown',
    metadata: Record<string, unknown> = {}
  ): void {
    const connection: WebSocketConnection = {
      id: connectionId,
      subscriptions: [],
      connectedAt: new Date(),
      lastActivity: new Date(),
      clientType,
      metadata,
    };

    this.connections.set(connectionId, connection);
    this.messageQueue.set(connectionId, []);

    this.emit('connection_registered', { connectionId, clientType });

    // Send connection confirmation
    this.sendMessage(connectionId, {
      type: EvolutionWebSocketMessageType.SUBSCRIPTION_CONFIRMED,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      connectionId,
      data: { subscriptions: [] },
    } as unknown as SubscriptionMessage);
  }

  /**
   * Remove a WebSocket connection
   */
  removeConnection(connectionId: WebSocketConnectionId): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      this.messageQueue.delete(connectionId);
      
      this.emit('connection_removed', { 
        connectionId, 
        duration: Date.now() - connection.connectedAt.getTime() 
      });
    }
  }

  /**
   * Update connection subscriptions
   */
  updateSubscriptions(
    connectionId: WebSocketConnectionId,
    subscriptions: readonly EvolutionSubscription[]
  ): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      this.sendError(connectionId, 'CONNECTION_NOT_FOUND', 'Connection not found');
      return;
    }

    const updatedConnection: WebSocketConnection = {
      ...connection,
      subscriptions,
      lastActivity: new Date(),
    };

    this.connections.set(connectionId, updatedConnection);

    // Confirm subscription update
    this.sendMessage(connectionId, {
      type: EvolutionWebSocketMessageType.SUBSCRIPTION_CONFIRMED,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      connectionId,
      data: { subscriptions },
    } as unknown as SubscriptionMessage);

    this.emit('subscriptions_updated', { connectionId, subscriptions });
  }

  /**
   * Broadcast DNA evolution event
   */
  broadcastDnaEvolution(data: {
    readonly agentId: AgentInstanceId;
    readonly originalDnaId: EvolutionDnaId;
    readonly evolvedDnaId: EvolutionDnaId;
    readonly projectId: ProjectContextId;
    readonly fitnessImprovement: number;
    readonly generation: number;
    readonly evolutionType: string;
    readonly confidence: number;
  }): void {
    const message: DnaEvolvedMessage = {
      type: EvolutionWebSocketMessageType.DNA_EVOLVED,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      data,
    };

    this.broadcastToSubscribers(message, {
      subscriptionTypes: [
        EvolutionSubscriptionType.ALL_EVENTS,
        EvolutionSubscriptionType.DNA_EVOLUTION,
      ],
      filters: {
        agentId: data.agentId,
        projectId: data.projectId,
        dnaId: data.evolvedDnaId,
      },
    });
  }

  /**
   * Broadcast cross-project pattern identified
   */
  broadcastCrossProjectPattern(data: {
    readonly patternId: string;
    readonly sourceProject: ProjectContextId;
    readonly targetProject: ProjectContextId;
    readonly similarity: number;
    readonly transferPotential: number;
    readonly patternType: string;
  }): void {
    const message: CrossProjectPatternMessage = {
      type: EvolutionWebSocketMessageType.CROSS_PROJECT_PATTERN_IDENTIFIED,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      data,
    };

    this.broadcastToSubscribers(message, {
      subscriptionTypes: [
        EvolutionSubscriptionType.ALL_EVENTS,
        EvolutionSubscriptionType.CROSS_PROJECT_LEARNING,
      ],
      filters: {
        projectId: data.sourceProject, // Will also match targetProject in filtering logic
      },
    });
  }

  /**
   * Broadcast metrics update
   */
  broadcastMetricsUpdate(metricsUpdate: EvolutionMetricsUpdate): void {
    const message: MetricsUpdateMessage = {
      type: EvolutionWebSocketMessageType.METRICS_UPDATE,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      data: metricsUpdate,
    };

    this.broadcastToSubscribers(message, {
      subscriptionTypes: [
        EvolutionSubscriptionType.ALL_EVENTS,
        EvolutionSubscriptionType.METRICS_UPDATES,
      ],
    });
  }

  /**
   * Broadcast dashboard update
   */
  broadcastDashboardUpdate(dashboard: RealTimeEvolutionDashboard): void {
    const message: DashboardUpdateMessage = {
      type: EvolutionWebSocketMessageType.DASHBOARD_UPDATE,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      data: dashboard,
    };

    this.broadcastToSubscribers(message, {
      subscriptionTypes: [
        EvolutionSubscriptionType.ALL_EVENTS,
        EvolutionSubscriptionType.DASHBOARD,
        EvolutionSubscriptionType.METRICS_UPDATES,
      ],
    });
  }

  /**
   * Broadcast alert
   */
  broadcastAlert(alert: EvolutionAlert): void {
    const message: AlertMessage = {
      type: EvolutionWebSocketMessageType.ALERT_TRIGGERED,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      data: alert,
    };

    this.broadcastToSubscribers(message, {
      subscriptionTypes: [
        EvolutionSubscriptionType.ALL_EVENTS,
        EvolutionSubscriptionType.ALERTS,
      ],
      filters: {
        ...(alert.projectId && { projectId: alert.projectId }),
        ...(alert.agentId && { agentId: alert.agentId }),
      },
      alertSeverity: alert.severity,
    });
  }

  /**
   * Broadcast agent performance update
   */
  broadcastAgentPerformance(data: {
    readonly agentId: AgentInstanceId;
    readonly dnaId: EvolutionDnaId;
    readonly projectId: ProjectContextId;
    readonly taskId: TaskId;
    readonly metrics: {
      readonly successRate: number;
      readonly codeQuality: number;
      readonly adaptationSpeed: number;
      readonly errorRecovery: number;
    };
    readonly trends: readonly EvolutionTrend[];
  }): void {
    const message: AgentPerformanceMessage = {
      type: EvolutionWebSocketMessageType.AGENT_PERFORMANCE_UPDATE,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      data,
    };

    this.broadcastToSubscribers(message, {
      subscriptionTypes: [
        EvolutionSubscriptionType.ALL_EVENTS,
        EvolutionSubscriptionType.AGENT_SPECIFIC,
      ],
      filters: {
        agentId: data.agentId,
        projectId: data.projectId,
        dnaId: data.dnaId,
      },
    });
  }

  /**
   * Broadcast system health update
   */
  broadcastSystemHealth(data: {
    readonly healthScore: number;
    readonly activeAgents: number;
    readonly totalEvolutions: number;
    readonly averageFitness: number;
    readonly diversityIndex: number;
    readonly issues: readonly string[];
  }): void {
    const message: SystemHealthMessage = {
      type: EvolutionWebSocketMessageType.SYSTEM_HEALTH_UPDATE,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      data,
    };

    this.broadcastToSubscribers(message, {
      subscriptionTypes: [
        EvolutionSubscriptionType.ALL_EVENTS,
        EvolutionSubscriptionType.SYSTEM_HEALTH,
      ],
    });
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    readonly totalConnections: number;
    readonly connectionsByType: Record<string, number>;
    readonly subscriptionStats: Record<string, number>;
    readonly averageConnectionTime: number;
  } {
    const connections = Array.from(this.connections.values());
    const now = Date.now();

    const connectionsByType = connections.reduce((acc, conn) => {
      acc[conn.clientType] = (acc[conn.clientType] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const subscriptionStats = connections.reduce((acc, conn) => {
      for (const sub of conn.subscriptions) {
        acc[sub.type] = (acc[sub.type] ?? 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalConnectionTime = connections.reduce(
      (sum, conn) => sum + (now - conn.connectedAt.getTime()),
      0
    );
    const averageConnectionTime = connections.length > 0 
      ? totalConnectionTime / connections.length 
      : 0;

    return {
      totalConnections: connections.length,
      connectionsByType,
      subscriptionStats,
      averageConnectionTime,
    };
  }

  /**
   * Get queued messages for a connection
   */
  getQueuedMessages(connectionId: WebSocketConnectionId): readonly EvolutionWebSocketMessage[] {
    return this.messageQueue.get(connectionId) ?? [];
  }

  /**
   * Clear message queue for a connection
   */
  clearMessageQueue(connectionId: WebSocketConnectionId): void {
    this.messageQueue.set(connectionId, []);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private broadcastToSubscribers(
    message: EvolutionWebSocketMessage,
    criteria: {
      readonly subscriptionTypes: readonly EvolutionSubscriptionType[];
      readonly filters?: {
        readonly agentId?: AgentInstanceId;
        readonly projectId?: ProjectContextId;
        readonly dnaId?: EvolutionDnaId;
      };
      readonly alertSeverity?: string;
    }
  ): void {
    for (const [connectionId, connection] of this.connections.entries()) {
      if (this.shouldReceiveMessage(connection, message, criteria)) {
        this.sendMessage(connectionId, message);
      }
    }
  }

  private shouldReceiveMessage(
    connection: WebSocketConnection,
    message: EvolutionWebSocketMessage,
    criteria: {
      readonly subscriptionTypes: readonly EvolutionSubscriptionType[];
      readonly filters?: {
        readonly agentId?: AgentInstanceId;
        readonly projectId?: ProjectContextId;
        readonly dnaId?: EvolutionDnaId;
      };
      readonly alertSeverity?: string;
    }
  ): boolean {
    // Check if connection has matching subscription types
    const hasMatchingSubscription = connection.subscriptions.some(sub => 
      criteria.subscriptionTypes.includes(sub.type)
    );

    if (!hasMatchingSubscription) return false;

    // Apply filters if specified
    for (const subscription of connection.subscriptions) {
      if (!criteria.subscriptionTypes.includes(subscription.type)) continue;

      const filters = subscription.filters;
      if (!filters) return true; // No filters means accept all

      // Check agent filter
      if (filters.agentId && criteria.filters?.agentId !== filters.agentId) {
        continue;
      }

      // Check project filter
      if (filters.projectId && criteria.filters?.projectId !== filters.projectId) {
        // For cross-project messages, check both source and target
        if (message.type === EvolutionWebSocketMessageType.CROSS_PROJECT_PATTERN_IDENTIFIED) {
          const data = (message as CrossProjectPatternMessage).data;
          if (data.sourceProject !== filters.projectId && data.targetProject !== filters.projectId) {
            continue;
          }
        } else {
          continue;
        }
      }

      // Check DNA filter
      if (filters.dnaId && criteria.filters?.dnaId !== filters.dnaId) {
        continue;
      }

      // Check alert severity filter
      if (criteria.alertSeverity && filters.alertSeverities && 
          !filters.alertSeverities.includes(criteria.alertSeverity)) {
        continue;
      }

      // If we reach here, all filters match
      return true;
    }

    return false;
  }

  private sendMessage(connectionId: WebSocketConnectionId, message: EvolutionWebSocketMessage): void {
    const queue = this.messageQueue.get(connectionId);
    if (!queue) return;

    // Add to queue (in production, this would send via actual WebSocket)
    queue.push({
      ...message,
      connectionId,
    });

    // Limit queue size to prevent memory issues
    if (queue.length > 100) {
      queue.splice(0, queue.length - 100);
    }

    // Update connection activity
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.set(connectionId, {
        ...connection,
        lastActivity: new Date(),
      });
    }

    this.emit('message_sent', { connectionId, messageType: message.type });
  }

  private sendError(connectionId: WebSocketConnectionId, code: string, message: string): void {
    const errorMessage: ErrorMessage = {
      type: EvolutionWebSocketMessageType.ERROR,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      connectionId,
      data: {
        code,
        message,
      },
    };

    this.sendMessage(connectionId, errorMessage);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const heartbeatMessage = {
        type: EvolutionWebSocketMessageType.HEARTBEAT,
        id: this.generateMessageId(),
        timestamp: new Date().toISOString(),
        data: {
          serverTime: new Date().toISOString(),
          activeConnections: this.connections.size,
        },
      };

      // Send heartbeat to all connections
      for (const connectionId of this.connections.keys()) {
        this.sendMessage(connectionId, heartbeatMessage as any);
      }
    }, 30000); // 30 seconds
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxInactivity = 5 * 60 * 1000; // 5 minutes

      // Remove inactive connections
      for (const [connectionId, connection] of this.connections.entries()) {
        if (now - connection.lastActivity.getTime() > maxInactivity) {
          this.removeConnection(connectionId);
        }
      }

      // Clean up message queues
      for (const [connectionId, queue] of this.messageQueue.entries()) {
        if (!this.connections.has(connectionId)) {
          this.messageQueue.delete(connectionId);
        } else if (queue.length > 50) {
          // Keep only recent messages
          queue.splice(0, queue.length - 50);
        }
      }
    }, 60000); // 1 minute
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.connections.clear();
    this.messageQueue.clear();
    this.removeAllListeners();
  }
}

export default EvolutionWebSocketBridge;