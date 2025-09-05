/**
 * Metrics Collector - Automated metrics collection and aggregation
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import type { AgentInstanceId, TaskId } from '@sentra/types';
import type { SessionId } from './event-hooks';
import type { PerformanceTracker } from './performance-tracker';
/**
 * Metric definition
 */
export interface MetricDefinition {
    readonly name: string;
    readonly description: string;
    readonly unit: string;
    readonly category: 'performance' | 'behavior' | 'resource' | 'business';
    readonly collector: MetricCollector;
    readonly interval: number;
    readonly enabled: boolean;
    readonly tags: readonly string[];
}
/**
 * Collected metric value
 */
export interface CollectedMetric {
    readonly name: string;
    readonly value: number;
    readonly unit: string;
    readonly timestamp: Date;
    readonly agentId: AgentInstanceId;
    readonly sessionId?: SessionId;
    readonly taskId?: TaskId;
    readonly context: Record<string, unknown>;
    readonly tags: readonly string[];
}
/**
 * Aggregated metrics
 */
export interface AggregatedMetrics {
    readonly timeWindow: {
        readonly start: Date;
        readonly end: Date;
        readonly duration: number;
    };
    readonly agentId?: AgentInstanceId;
    readonly metrics: Record<string, {
        readonly count: number;
        readonly sum: number;
        readonly avg: number;
        readonly min: number;
        readonly max: number;
        readonly stdDev: number;
        readonly percentiles: {
            readonly p50: number;
            readonly p90: number;
            readonly p95: number;
            readonly p99: number;
        };
    }>;
    readonly tags: readonly string[];
}
/**
 * Metric collector function type
 */
export type MetricCollector = (agentId: AgentInstanceId, context?: Record<string, unknown>) => Promise<number | null>;
/**
 * Built-in metric collectors for common measurements
 */
export declare class BuiltInCollectors {
    /**
     * Collect response time metric
     */
    static responseTime: MetricCollector;
    /**
     * Collect CPU usage metric
     */
    static cpuUsage: MetricCollector;
    /**
     * Collect memory usage metric
     */
    static memoryUsage: MetricCollector;
    /**
     * Collect task completion rate
     */
    static taskCompletionRate: MetricCollector;
    /**
     * Collect error rate metric
     */
    static errorRate: MetricCollector;
    /**
     * Collect learning progress metric
     */
    static learningProgress: MetricCollector;
    /**
     * Collect collaboration score
     */
    static collaborationScore: MetricCollector;
    /**
     * Collect throughput metric
     */
    static throughput: MetricCollector;
    /**
     * Collect quality score metric
     */
    static qualityScore: MetricCollector;
    /**
     * Collect resource efficiency metric
     */
    static resourceEfficiency: MetricCollector;
}
/**
 * Automated metrics collection and aggregation system
 */
export declare class MetricsCollector {
    private readonly performanceTracker;
    private readonly logger;
    private readonly metricDefinitions;
    private readonly collectionTimers;
    private readonly lastCollectionTime;
    private readonly monitoredAgents;
    private readonly metricsBuffer;
    private readonly maxBufferSize;
    private aggregationTimer?;
    private readonly aggregationInterval;
    private readonly aggregatedMetrics;
    constructor(performanceTracker: PerformanceTracker, logger?: any);
    /**
     * Register a custom metric
     */
    registerMetric(definition: MetricDefinition): void;
    /**
     * Unregister a metric
     */
    unregisterMetric(name: string): boolean;
    /**
     * Enable metric collection
     */
    enableMetric(name: string): boolean;
    /**
     * Disable metric collection
     */
    disableMetric(name: string): boolean;
    /**
     * Add agent to monitoring
     */
    addAgent(agentId: AgentInstanceId): void;
    /**
     * Remove agent from monitoring
     */
    removeAgent(agentId: AgentInstanceId): boolean;
    /**
     * Get monitored agents
     */
    getMonitoredAgents(): readonly AgentInstanceId[];
    /**
     * Start collection for a specific metric
     */
    private startMetricCollection;
    /**
     * Stop collection for a specific metric
     */
    private stopMetricCollection;
    /**
     * Collect a metric for all monitored agents
     */
    private collectMetricForAllAgents;
    /**
     * Collect a metric for a specific agent
     */
    private collectMetricForAgent;
    /**
     * Record a collected metric
     */
    private recordMetric;
    /**
     * Build collection context for an agent
     */
    private buildCollectionContext;
    /**
     * Trigger initial collection for a new agent
     */
    private triggerInitialCollection;
    /**
     * Start periodic aggregation
     */
    private startAggregation;
    /**
     * Perform metric aggregation
     */
    private performAggregation;
    /**
     * Group metrics by agent and type
     */
    private groupMetrics;
    /**
     * Calculate aggregation for a group of metrics
     */
    private calculateAggregation;
    /**
     * Calculate percentile value
     */
    private calculatePercentile;
    /**
     * Cleanup old aggregations
     */
    private cleanupOldAggregations;
    /**
     * Setup built-in metrics
     */
    private setupBuiltInMetrics;
    /**
     * Get all metric definitions
     */
    getAllMetricDefinitions(): MetricDefinition[];
    /**
     * Get metric definition by name
     */
    getMetricDefinition(name: string): MetricDefinition | undefined;
    /**
     * Get recent metrics for an agent
     */
    getRecentMetrics(agentId: AgentInstanceId, limit?: number): CollectedMetric[];
    /**
     * Get aggregated metrics
     */
    getAggregatedMetrics(agentId?: AgentInstanceId, metricName?: string): AggregatedMetrics[];
    /**
     * Force metric collection for all agents
     */
    forceCollection(): void;
    /**
     * Get collection statistics
     */
    getStats(): {
        registeredMetrics: number;
        enabledMetrics: number;
        monitoredAgents: number;
        metricsInBuffer: number;
        aggregations: number;
        activeTimers: number;
    };
    /**
     * Shutdown metrics collection
     */
    shutdown(): void;
}
//# sourceMappingURL=metrics-collector.d.ts.map