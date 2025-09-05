/**
 * Performance Monitoring for Vector Database Operations
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * Provides comprehensive monitoring and metrics for:
 * - Vector store operations (store, search, batch)
 * - Search engine performance and cache efficiency
 * - Resource utilization and bottleneck detection
 * - Real-time alerts and performance trends
 */
/**
 * Operation types for performance tracking
 */
export declare enum OperationType {
    VECTOR_STORE = "vector_store",
    VECTOR_SEARCH = "vector_search",
    BATCH_STORE = "batch_store",
    EMBEDDING_GENERATION = "embedding_generation",
    CACHE_LOOKUP = "cache_lookup",
    PATTERN_RANKING = "pattern_ranking"
}
/**
 * Performance metric data point
 */
export interface PerformanceMetric {
    readonly timestamp: number;
    readonly operation: OperationType;
    readonly duration: number;
    readonly success: boolean;
    readonly resourceUsage: {
        readonly memoryMb: number;
        readonly cpuPercent: number;
    };
    readonly metadata: {
        readonly recordCount?: number;
        readonly cacheHit?: boolean;
        readonly retryAttempts?: number;
        readonly errorCode?: string;
        readonly batchSize?: number;
        readonly filterComplexity?: number;
    };
}
/**
 * Aggregated performance statistics
 */
export interface PerformanceStats {
    readonly operation: OperationType;
    readonly timeWindow: {
        readonly startTime: number;
        readonly endTime: number;
        readonly windowSizeMs: number;
    };
    readonly metrics: {
        readonly totalOperations: number;
        readonly successfulOperations: number;
        readonly failedOperations: number;
        readonly averageDuration: number;
        readonly medianDuration: number;
        readonly p95Duration: number;
        readonly p99Duration: number;
        readonly minDuration: number;
        readonly maxDuration: number;
        readonly throughputPerSecond: number;
    };
    readonly resources: {
        readonly averageMemoryMb: number;
        readonly peakMemoryMb: number;
        readonly averageCpuPercent: number;
        readonly peakCpuPercent: number;
    };
    readonly reliability: {
        readonly successRate: number;
        readonly errorRate: number;
        readonly averageRetryAttempts: number;
    };
}
/**
 * Performance alert configuration
 */
export interface PerformanceAlert {
    readonly id: string;
    readonly name: string;
    readonly operation: OperationType;
    readonly condition: AlertCondition;
    readonly threshold: number;
    readonly windowSizeMs: number;
    readonly cooldownMs: number;
    readonly severity: 'info' | 'warning' | 'critical';
    readonly enabled: boolean;
}
/**
 * Alert condition types
 */
export declare enum AlertCondition {
    AVERAGE_DURATION_EXCEEDS = "avg_duration_exceeds",
    P95_DURATION_EXCEEDS = "p95_duration_exceeds",
    ERROR_RATE_EXCEEDS = "error_rate_exceeds",
    THROUGHPUT_BELOW = "throughput_below",
    MEMORY_USAGE_EXCEEDS = "memory_usage_exceeds",
    CPU_USAGE_EXCEEDS = "cpu_usage_exceeds",
    CACHE_HIT_RATE_BELOW = "cache_hit_rate_below"
}
/**
 * Triggered alert instance
 */
export interface AlertInstance {
    readonly alertId: string;
    readonly triggeredAt: number;
    readonly value: number;
    readonly threshold: number;
    readonly message: string;
    readonly severity: PerformanceAlert['severity'];
    readonly resolved: boolean;
    readonly resolvedAt?: number;
}
/**
 * High-performance monitoring system for vector operations
 */
export declare class PerformanceMonitor {
    private readonly metrics;
    private readonly alerts;
    private readonly activeAlerts;
    private readonly maxMetricsPerOperation;
    private readonly retentionMs;
    private cleanupTimer?;
    constructor(options?: {
        readonly maxMetricsPerOperation?: number;
        readonly retentionMs?: number;
        readonly cleanupIntervalMs?: number;
    });
    /**
     * Record a performance metric
     */
    recordMetric(metric: PerformanceMetric): void;
    /**
     * Record operation with automatic timing
     */
    measureOperation<T>(operation: OperationType, fn: () => Promise<T>, metadata?: PerformanceMetric['metadata']): Promise<T>;
    /**
     * Get performance statistics for an operation
     */
    getStats(operation: OperationType, windowMs?: number): PerformanceStats | undefined;
    /**
     * Get statistics for all operations
     */
    getAllStats(windowMs?: number): readonly PerformanceStats[];
    /**
     * Register a performance alert
     */
    registerAlert(alert: PerformanceAlert): void;
    /**
     * Remove an alert
     */
    removeAlert(alertId: string): void;
    /**
     * Get all active alerts
     */
    getActiveAlerts(): readonly AlertInstance[];
    /**
     * Get performance trends over time
     */
    getTrends(operation: OperationType, windowMs?: number, // 24 hours
    bucketMs?: number): readonly {
        readonly timestamp: number;
        readonly averageDuration: number;
        readonly throughput: number;
        readonly errorRate: number;
    }[];
    /**
     * Export metrics for external analysis
     */
    exportMetrics(operation?: OperationType, windowMs?: number): readonly PerformanceMetric[];
    /**
     * Clear all metrics and alerts
     */
    clear(): void;
    /**
     * Cleanup expired data and resolved alerts
     */
    private cleanup;
    /**
     * Setup default performance alerts
     */
    private setupDefaultAlerts;
    /**
     * Check if any alerts should be triggered
     */
    private checkAlerts;
    /**
     * Evaluate if alert condition is met
     */
    private evaluateAlertCondition;
    /**
     * Trigger an alert
     */
    private triggerAlert;
    /**
     * Resolve an active alert
     */
    private resolveAlert;
    /**
     * Cleanup on destruction
     */
    destroy(): void;
}
//# sourceMappingURL=performance-monitor.d.ts.map