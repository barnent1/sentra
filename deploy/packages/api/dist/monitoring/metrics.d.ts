/**
 * Performance monitoring and metrics collection for Evolution API
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import { EventEmitter } from 'events';
import type { Logger } from '../logger/config';
/**
 * Metric types for type safety
 */
export declare const MetricType: {
    readonly COUNTER: "counter";
    readonly HISTOGRAM: "histogram";
    readonly GAUGE: "gauge";
    readonly SUMMARY: "summary";
};
export type MetricTypeValue = typeof MetricType[keyof typeof MetricType];
/**
 * Metric data structure
 */
export interface MetricData {
    readonly name: string;
    readonly type: MetricTypeValue;
    readonly value: number;
    readonly timestamp: Date;
    readonly labels?: Record<string, string>;
    readonly description?: string;
}
/**
 * Histogram bucket configuration
 */
export interface HistogramBucket {
    readonly upperBound: number;
    count: number;
}
/**
 * Histogram metric data
 */
export interface HistogramMetric {
    readonly name: string;
    readonly type: 'histogram';
    readonly buckets: HistogramBucket[];
    readonly sum: number;
    readonly count: number;
    readonly timestamp: Date;
    readonly labels?: Record<string, string>;
}
/**
 * Performance metrics collector
 */
export declare class MetricsCollector extends EventEmitter {
    private readonly metrics;
    private readonly histograms;
    private readonly counters;
    private readonly gauges;
    private readonly logger;
    private collectionInterval?;
    constructor(logger?: Logger);
    /**
     * Increment a counter metric
     */
    readonly incrementCounter: (name: string, value?: number, labels?: Record<string, string>, description?: string) => void;
    /**
     * Set a gauge metric value
     */
    readonly setGauge: (name: string, value: number, labels?: Record<string, string>, description?: string) => void;
    /**
     * Record a value in a histogram
     */
    readonly recordHistogram: (name: string, value: number, buckets?: number[], labels?: Record<string, string>) => void;
    /**
     * Time a function execution and record in histogram
     */
    readonly timeFunction: <T>(name: string, fn: () => Promise<T>, labels?: Record<string, string>) => Promise<T>;
    /**
     * Get all metrics in Prometheus format
     */
    readonly getPrometheusMetrics: () => string;
    /**
     * Get metrics as JSON
     */
    readonly getJsonMetrics: () => {
        counters: {
            [k: string]: number;
        };
        gauges: {
            [k: string]: number;
        };
        histograms: HistogramMetric[];
        metrics: MetricData[];
        timestamp: Date;
    };
    /**
     * Start automatic metrics collection
     */
    readonly startCollection: (intervalMs?: number) => void;
    /**
     * Stop metrics collection
     */
    readonly stopCollection: () => void;
    /**
     * Collect system metrics
     */
    private readonly collectSystemMetrics;
    /**
     * Create a unique key for metrics with labels
     */
    private readonly createKey;
    /**
     * Format labels for Prometheus output
     */
    private readonly formatLabels;
}
/**
 * API-specific metrics collector
 */
export declare class ApiMetricsCollector extends MetricsCollector {
    constructor(logger?: Logger);
    /**
     * Record HTTP request metrics
     */
    readonly recordHttpRequest: (method: string, path: string, statusCode: number, duration: number) => void;
    /**
     * Record WebSocket connection metrics
     */
    readonly recordWebSocketConnection: (event: "connect" | "disconnect", userId?: string) => void;
    /**
     * Record evolution operation metrics
     */
    readonly recordEvolutionOperation: (operation: "evolve" | "create" | "spawn" | "learn", success: boolean, duration: number) => void;
    /**
     * Record database operation metrics
     */
    readonly recordDatabaseOperation: (operation: "select" | "insert" | "update" | "delete", table: string, success: boolean, duration: number) => void;
    /**
     * Setup initial API metrics
     */
    private readonly setupApiMetrics;
    /**
     * Normalize API path for consistent metrics
     */
    private readonly normalizePath;
}
/**
 * Metrics middleware for Express
 */
export declare const createMetricsMiddleware: (metricsCollector: ApiMetricsCollector) => (req: any, res: any, next: any) => void;
//# sourceMappingURL=metrics.d.ts.map