/**
 * WebSocket Bridge for Real-time Evolution Updates
 *
 * This module connects the evolution system to WebSocket streams for real-time
 * updates to dashboard, mobile, and TMUX interfaces.
 *
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import { EventEmitter } from 'events';
import type { EvolutionDnaId, AgentInstanceId, ProjectContextId, TaskId, Brand } from '../types';
import type { EvolutionMetricsUpdate } from './evolution-service';
import type { RealTimeEvolutionDashboard, EvolutionAlert, EvolutionTrend } from './metrics-service';
export type WebSocketConnectionId = Brand<string, 'WebSocketConnectionId'>;
export declare const EvolutionWebSocketMessageType: {
    readonly DNA_CREATED: "dna_created";
    readonly DNA_EVOLVED: "dna_evolved";
    readonly DNA_MUTATED: "dna_mutated";
    readonly PATTERN_LEARNED: "pattern_learned";
    readonly CROSS_PROJECT_PATTERN_IDENTIFIED: "cross_project_pattern_identified";
    readonly PATTERN_TRANSFER_INITIATED: "pattern_transfer_initiated";
    readonly PATTERN_TRANSFER_COMPLETED: "pattern_transfer_completed";
    readonly METRICS_UPDATE: "metrics_update";
    readonly DASHBOARD_UPDATE: "dashboard_update";
    readonly ALERT_TRIGGERED: "alert_triggered";
    readonly TREND_DETECTED: "trend_detected";
    readonly AGENT_DNA_INITIALIZED: "agent_dna_initialized";
    readonly AGENT_PERFORMANCE_UPDATE: "agent_performance_update";
    readonly AGENT_EVOLUTION_PROGRESS: "agent_evolution_progress";
    readonly SYSTEM_HEALTH_UPDATE: "system_health_update";
    readonly EVOLUTION_STATISTICS: "evolution_statistics";
    readonly SUBSCRIBE: "subscribe";
    readonly UNSUBSCRIBE: "unsubscribe";
    readonly SUBSCRIPTION_CONFIRMED: "subscription_confirmed";
    readonly ERROR: "error";
    readonly HEARTBEAT: "heartbeat";
};
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
export type EvolutionWebSocketMessage = DnaCreatedMessage | DnaEvolvedMessage | CrossProjectPatternMessage | MetricsUpdateMessage | DashboardUpdateMessage | AlertMessage | AgentPerformanceMessage | SystemHealthMessage | SubscriptionMessage | ErrorMessage;
export declare const EvolutionSubscriptionType: {
    readonly ALL_EVENTS: "all_events";
    readonly DNA_EVOLUTION: "dna_evolution";
    readonly CROSS_PROJECT_LEARNING: "cross_project_learning";
    readonly METRICS_UPDATES: "metrics_updates";
    readonly ALERTS: "alerts";
    readonly AGENT_SPECIFIC: "agent_specific";
    readonly PROJECT_SPECIFIC: "project_specific";
    readonly DASHBOARD: "dashboard";
    readonly SYSTEM_HEALTH: "system_health";
};
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
export declare class EvolutionWebSocketBridge extends EventEmitter {
    private readonly connections;
    private readonly messageQueue;
    private heartbeatInterval?;
    private cleanupInterval?;
    constructor();
    /**
     * Register a new WebSocket connection
     */
    registerConnection(connectionId: WebSocketConnectionId, clientType?: WebSocketConnection['clientType'], metadata?: Record<string, unknown>): void;
    /**
     * Remove a WebSocket connection
     */
    removeConnection(connectionId: WebSocketConnectionId): void;
    /**
     * Update connection subscriptions
     */
    updateSubscriptions(connectionId: WebSocketConnectionId, subscriptions: readonly EvolutionSubscription[]): void;
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
    }): void;
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
    }): void;
    /**
     * Broadcast metrics update
     */
    broadcastMetricsUpdate(metricsUpdate: EvolutionMetricsUpdate): void;
    /**
     * Broadcast dashboard update
     */
    broadcastDashboardUpdate(dashboard: RealTimeEvolutionDashboard): void;
    /**
     * Broadcast alert
     */
    broadcastAlert(alert: EvolutionAlert): void;
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
    }): void;
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
    }): void;
    /**
     * Get connection statistics
     */
    getConnectionStats(): {
        readonly totalConnections: number;
        readonly connectionsByType: Record<string, number>;
        readonly subscriptionStats: Record<string, number>;
        readonly averageConnectionTime: number;
    };
    /**
     * Get queued messages for a connection
     */
    getQueuedMessages(connectionId: WebSocketConnectionId): readonly EvolutionWebSocketMessage[];
    /**
     * Clear message queue for a connection
     */
    clearMessageQueue(connectionId: WebSocketConnectionId): void;
    private broadcastToSubscribers;
    private shouldReceiveMessage;
    private sendMessage;
    private sendError;
    private generateMessageId;
    private startHeartbeat;
    private startCleanup;
    /**
     * Clean up resources
     */
    destroy(): void;
}
export default EvolutionWebSocketBridge;
//# sourceMappingURL=websocket-bridge.d.ts.map