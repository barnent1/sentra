/**
 * Observability Integration - Bridge between observability system and API/WebSocket
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import type { ObservabilityManager, AgentMonitor, PerformanceTracker, MetricsCollector } from '@sentra/core/observability';
import type { EventBus } from '@sentra/core/types/events';
import type { EvolutionEventBroadcaster } from '../websocket/event-system';
/**
 * Service that integrates observability system with API and WebSocket broadcasting
 */
export declare class ObservabilityIntegrationService {
    private readonly observabilityManager;
    private readonly agentMonitor;
    private readonly performanceTracker;
    private readonly metricsCollector;
    private readonly eventBroadcaster;
    private readonly logger;
    private eventBusSubscriptionId?;
    constructor(observabilityManager: ObservabilityManager, agentMonitor: AgentMonitor, performanceTracker: PerformanceTracker, metricsCollector: MetricsCollector, eventBroadcaster: EvolutionEventBroadcaster, eventBus?: EventBus, logger?: any);
    /**
     * Setup integration with event bus to catch observability events
     */
    private setupEventBusIntegration;
    /**
     * Handle observability events from the event bus
     */
    private handleObservabilityEvent;
    /**
     * Handle tool usage started event
     */
    private handleToolUsageStarted;
    /**
     * Handle tool usage completed event
     */
    private handleToolUsageCompleted;
    /**
     * Handle agent decision event
     */
    private handleAgentDecision;
    /**
     * Handle memory operation event
     */
    private handleMemoryOperation;
    /**
     * Handle coordination event
     */
    private handleCoordination;
    /**
     * Handle performance pulse event
     */
    private handlePerformancePulse;
    /**
     * Handle learning pattern event
     */
    private handleLearningPattern;
    /**
     * Setup periodic broadcasts for aggregated data
     */
    private setupPeriodicBroadcasts;
    /**
     * Broadcast behavior patterns for all monitored agents
     */
    private broadcastAgentBehaviorPatterns;
    /**
     * Manually trigger observability data collection for an agent
     */
    triggerAgentDataCollection(agentId: string): void;
    /**
     * Get observability integration statistics
     */
    getStats(): {
        eventBusConnected: boolean;
        observabilityStats: {
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
        monitoringStats: {
            monitoredAgents: number;
            totalBehaviorPatterns: number;
            healthyAgents: number;
            criticalAgents: number;
        };
        performanceStats: {
            totalMeasurements: number;
            totalBenchmarks: number;
            activeAlerts: number;
            monitoredAgents: number;
            uniqueMetrics: number;
            retentionHours: number;
        };
        metricsStats: {
            registeredMetrics: number;
            enabledMetrics: number;
            monitoredAgents: number;
            metricsInBuffer: number;
            aggregations: number;
            activeTimers: number;
        };
    };
    /**
     * Cleanup and shutdown integration
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=observability-integration.d.ts.map