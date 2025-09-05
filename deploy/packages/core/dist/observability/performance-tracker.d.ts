/**
 * Performance Tracker - Detailed performance monitoring and analysis
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import type { AgentInstanceId, TaskId, Brand } from '@sentra/types';
import type { SessionId } from './event-hooks';
export type PerformanceMetricId = Brand<string, 'PerformanceMetricId'>;
export type BenchmarkId = Brand<string, 'BenchmarkId'>;
/**
 * Performance measurement point
 */
export interface PerformanceMeasurement {
    readonly id: PerformanceMetricId;
    readonly agentId: AgentInstanceId;
    readonly sessionId?: SessionId;
    readonly taskId?: TaskId;
    readonly timestamp: Date;
    readonly metric: string;
    readonly value: number;
    readonly unit: string;
    readonly context: Record<string, unknown>;
    readonly tags: readonly string[];
}
/**
 * Performance benchmark
 */
export interface PerformanceBenchmark {
    readonly id: BenchmarkId;
    readonly name: string;
    readonly description: string;
    readonly metric: string;
    readonly target: number;
    readonly threshold: number;
    readonly unit: string;
    readonly category: 'latency' | 'throughput' | 'accuracy' | 'efficiency' | 'reliability';
    readonly createdAt: Date;
}
/**
 * Performance trend analysis
 */
export interface PerformanceTrend {
    readonly metric: string;
    readonly agentId: AgentInstanceId;
    readonly timeRange: {
        readonly start: Date;
        readonly end: Date;
    };
    readonly trend: 'improving' | 'stable' | 'declining' | 'volatile';
    readonly confidence: number;
    readonly changeRate: number;
    readonly statistics: {
        readonly mean: number;
        readonly median: number;
        readonly stdDev: number;
        readonly min: number;
        readonly max: number;
        readonly count: number;
    };
    readonly predictions: {
        readonly nextHour: number;
        readonly nextDay: number;
        readonly confidence: number;
    };
}
/**
 * Performance alert
 */
export interface PerformanceAlert {
    readonly id: string;
    readonly agentId: AgentInstanceId;
    readonly metric: string;
    readonly level: 'info' | 'warning' | 'critical';
    readonly message: string;
    readonly currentValue: number;
    readonly threshold: number;
    readonly triggerTime: Date;
    readonly resolved: boolean;
    readonly resolvedAt?: Date;
    readonly context: Record<string, unknown>;
}
/**
 * Advanced performance tracking and analysis system
 */
export declare class PerformanceTracker {
    private readonly logger;
    private readonly measurements;
    private readonly benchmarks;
    private readonly alerts;
    private readonly measurementsByAgent;
    private readonly measurementsByMetric;
    private readonly measurementsByTime;
    private readonly config;
    constructor(logger?: any);
    /**
     * Record a performance measurement
     */
    recordMeasurement(agentId: AgentInstanceId, metric: string, value: number, unit: string, context?: Record<string, unknown>, sessionId?: SessionId, taskId?: TaskId, tags?: readonly string[]): PerformanceMetricId;
    /**
     * Record multiple measurements at once
     */
    recordBatchMeasurements(measurements: Array<{
        readonly agentId: AgentInstanceId;
        readonly metric: string;
        readonly value: number;
        readonly unit: string;
        readonly context?: Record<string, unknown>;
        readonly sessionId?: SessionId;
        readonly taskId?: TaskId;
        readonly tags?: readonly string[];
    }>): PerformanceMetricId[];
    /**
     * Create a performance benchmark
     */
    createBenchmark(name: string, description: string, metric: string, target: number, threshold: number, unit: string, category: 'latency' | 'throughput' | 'accuracy' | 'efficiency' | 'reliability'): BenchmarkId;
    /**
     * Update a benchmark
     */
    updateBenchmark(id: BenchmarkId, updates: Partial<Omit<PerformanceBenchmark, 'id' | 'createdAt'>>): boolean;
    /**
     * Delete a benchmark
     */
    deleteBenchmark(id: BenchmarkId): boolean;
    /**
     * Analyze performance trends for a specific metric
     */
    analyzeTrend(agentId: AgentInstanceId, metric: string, timeRange?: {
        start: Date;
        end: Date;
    }): PerformanceTrend | null;
    /**
     * Get performance summary for an agent
     */
    getAgentPerformanceSummary(agentId: AgentInstanceId, timeRange?: {
        start: Date;
        end: Date;
    }): {
        agentId: AgentInstanceId;
        timeRange: {
            start: Date;
            end: Date;
        };
        totalMeasurements: number;
        uniqueMetrics: number;
        metricSummaries: {
            metric: string;
            measurementCount: number;
            statistics: {
                mean: number;
                median: number | undefined;
                stdDev: number;
                min: number | undefined;
                max: number | undefined;
                count: number;
            };
            trend: "improving" | "stable" | "declining" | "volatile";
            lastValue: number | undefined;
            lastMeasurement: Date | undefined;
        }[];
        alerts: PerformanceAlert[];
    };
    /**
     * Compare agent performance against benchmarks
     */
    compareAgainstBenchmarks(agentId: AgentInstanceId): {
        readonly benchmark: PerformanceBenchmark;
        readonly currentValue?: number;
        readonly performance: "exceeding" | "meeting" | "below" | "critical";
        readonly gap: number;
        readonly trend?: "improving" | "stable" | "declining" | "volatile";
    }[];
    /**
     * Check measurement against benchmarks and generate alerts
     */
    private checkBenchmarks;
    /**
     * Create a performance alert
     */
    private createAlert;
    /**
     * Resolve a performance alert
     */
    private resolveAlert;
    /**
     * Get active alerts for an agent
     */
    getActiveAlertsForAgent(agentId: AgentInstanceId): PerformanceAlert[];
    /**
     * Get measurements based on criteria
     */
    getMeasurements(criteria: {
        readonly agentId?: AgentInstanceId;
        readonly metric?: string;
        readonly startTime?: Date;
        readonly endTime?: Date;
        readonly limit?: number;
        readonly tags?: readonly string[];
    }): PerformanceMeasurement[];
    /**
     * Calculate basic statistics for a set of values
     */
    private calculateStatistics;
    /**
     * Calculate trend direction
     */
    private calculateTrend;
    /**
     * Calculate rate of change
     */
    private calculateChangeRate;
    /**
     * Calculate trend confidence
     */
    private calculateTrendConfidence;
    /**
     * Predict future values based on trend
     */
    private predictFutureValues;
    /**
     * Update indexes when adding a measurement
     */
    private updateIndexes;
    /**
     * Setup cleanup timer for old measurements
     */
    private setupCleanupTimer;
    /**
     * Clean up old measurements
     */
    private cleanupOldMeasurements;
    /**
     * Remove a measurement and update indexes
     */
    private removeMeasurement;
    /**
     * Clean up old resolved alerts
     */
    private cleanupOldAlerts;
    /**
     * Generate unique measurement ID
     */
    private generateMeasurementId;
    /**
     * Generate unique benchmark ID
     */
    private generateBenchmarkId;
    /**
     * Get all benchmarks
     */
    getAllBenchmarks(): PerformanceBenchmark[];
    /**
     * Get benchmark by ID
     */
    getBenchmark(id: BenchmarkId): PerformanceBenchmark | undefined;
    /**
     * Get all active alerts
     */
    getAllActiveAlerts(): PerformanceAlert[];
    /**
     * Get performance statistics
     */
    getStats(): {
        totalMeasurements: number;
        totalBenchmarks: number;
        activeAlerts: number;
        monitoredAgents: number;
        uniqueMetrics: number;
        retentionHours: number;
    };
    /**
     * Cleanup and shutdown
     */
    shutdown(): void;
}
//# sourceMappingURL=performance-tracker.d.ts.map