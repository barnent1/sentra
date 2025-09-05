/**
 * Observability Manager - Central coordinator for Disler-style agent monitoring
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import type { AgentInstanceId, TaskId } from '@sentra/types';
import type { BaseEvent, EventBus } from '../types/events';
import { type SessionId, type PreToolHookData, type PostToolHookData, type AgentDecisionHookData, type MemoryOperationHookData } from './event-hooks';
/**
 * Configuration for observability manager
 */
export interface ObservabilityConfig {
    readonly enabled: boolean;
    readonly realTimeStreaming: boolean;
    readonly performancePulseInterval: number;
    readonly metricsRetentionDays: number;
    readonly maxSessionsInMemory: number;
    readonly eventBufferSize: number;
}
/**
 * Active session tracking
 */
export interface ActiveSession {
    readonly sessionId: SessionId;
    readonly agentId: AgentInstanceId;
    readonly startTime: Date;
    readonly taskId?: TaskId;
    readonly toolsUsed: readonly string[];
    readonly decisionsCount: number;
    readonly memoryOperations: number;
    readonly lastActivity: Date;
}
/**
 * Central observability manager coordinating all monitoring activities
 */
export declare class ObservabilityManager {
    private readonly hookManager;
    private readonly eventBus?;
    private readonly config;
    private readonly logger;
    private readonly activeSessions;
    private readonly sessionsByAgent;
    private performancePulseTimer?;
    private eventBuffer;
    private readonly defaultConfig;
    constructor(eventBus?: EventBus, config?: Partial<ObservabilityConfig>, logger?: any);
    /**
     * Start a new observability session for an agent
     */
    startSession(agentId: AgentInstanceId, taskId?: TaskId): SessionId;
    /**
     * End an observability session
     */
    endSession(sessionId: SessionId): void;
    /**
     * Get active session for agent
     */
    getActiveSession(agentId: AgentInstanceId): SessionId | undefined;
    /**
     * Track tool usage start
     */
    trackToolStart(data: Omit<PreToolHookData, 'sessionId'>): Promise<void>;
    /**
     * Track tool usage completion
     */
    trackToolComplete(data: Omit<PostToolHookData, 'sessionId'>): Promise<void>;
    /**
     * Track agent decision
     */
    trackDecision(data: Omit<AgentDecisionHookData, 'sessionId'>): Promise<void>;
    /**
     * Track memory operation
     */
    trackMemoryOperation(data: Omit<MemoryOperationHookData, 'sessionId'>): Promise<void>;
    /**
     * Track agent coordination
     */
    trackCoordination(initiatorId: AgentInstanceId, targetId: AgentInstanceId, data: {
        readonly coordinationType: 'delegation' | 'collaboration' | 'information_sharing' | 'conflict_resolution';
        readonly topic: string;
        readonly urgency: 'low' | 'medium' | 'high' | 'critical';
        readonly expectedOutcome: string;
        readonly context: {
            readonly sharedTaskId?: TaskId;
            readonly sharedResources: readonly string[];
            readonly dependencies: readonly string[];
        };
    }): Promise<void>;
    /**
     * Start performance monitoring with periodic pulses
     */
    private startPerformanceMonitoring;
    /**
     * Generate performance pulses for all active sessions
     */
    private generatePerformancePulses;
    /**
     * Calculate health score for an agent session
     */
    private calculateHealthScore;
    /**
     * Get current activities for an agent
     */
    private getCurrentActivities;
    /**
     * Calculate average response time for an agent
     */
    private calculateAverageResponseTime;
    /**
     * Setup observability hooks to publish events
     */
    private setupObservabilityHooks;
    /**
     * Create base event structure
     */
    private createBaseEvent;
    /**
     * Create tool usage started event
     */
    private createToolUsageStartedEvent;
    /**
     * Create tool usage completed event
     */
    private createToolUsageCompletedEvent;
    /**
     * Create agent decision event
     */
    private createAgentDecisionEvent;
    /**
     * Create agent memory operation event
     */
    private createAgentMemoryOperationEvent;
    /**
     * Create agent coordination event
     */
    private createAgentCoordinationEvent;
    /**
     * Create performance pulse event
     */
    private createPerformancePulseEvent;
    /**
     * Publish event to event bus and buffer
     */
    private publishEvent;
    /**
     * Generate unique event ID
     */
    private generateEventId;
    /**
     * Create event metadata
     */
    private createEventMetadata;
    /**
     * Update session activity
     */
    private updateSessionActivity;
    /**
     * Cleanup old sessions
     */
    private cleanupOldSessions;
    /**
     * Get current observability statistics
     */
    getStats(): {
        enabled: boolean;
        activeSessions: number;
        eventBufferSize: number;
        hookStats: {
            preToolHooks: number;
            postToolHooks: number;
            decisionHooks: number;
            memoryHooks: number;
            pulseHooks: number;
            totalHooks: number;
            enabled: boolean;
        };
        sessionsByAgent: {
            [k: string]: number;
        };
    };
    /**
     * Get recent events from buffer
     */
    getRecentEvents(limit?: number): BaseEvent[];
    /**
     * Enable/disable observability
     */
    setEnabled(enabled: boolean): void;
    /**
     * Cleanup and shutdown
     */
    shutdown(): void;
}
//# sourceMappingURL=observability-manager.d.ts.map