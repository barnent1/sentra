/**
 * Performance monitoring and metrics collection for Evolution API
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { EventEmitter } from 'events';
import type { Logger } from '../logger/config';

/**
 * Metric types for type safety
 */
export const MetricType = {
  COUNTER: 'counter',
  HISTOGRAM: 'histogram',
  GAUGE: 'gauge',
  SUMMARY: 'summary',
} as const;

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
export class MetricsCollector extends EventEmitter {
  private readonly metrics: Map<string, MetricData>;
  private readonly histograms: Map<string, HistogramMetric>;
  private readonly counters: Map<string, number>;
  private readonly gauges: Map<string, number>;
  private readonly logger: Logger | undefined;
  private collectionInterval?: NodeJS.Timeout;

  constructor(logger?: Logger) {
    super();
    this.metrics = new Map();
    this.histograms = new Map();
    this.counters = new Map();
    this.gauges = new Map();
    this.logger = logger;
  }

  /**
   * Increment a counter metric
   */
  public readonly incrementCounter = (
    name: string,
    value: number = 1,
    labels?: Record<string, string>,
    description?: string
  ): void => {
    const key = this.createKey(name, labels);
    const current = this.counters.get(key) || 0;
    const newValue = current + value;
    
    this.counters.set(key, newValue);
    
    const metric: MetricData = {
      name,
      type: MetricType.COUNTER,
      value: newValue,
      timestamp: new Date(),
      ...(labels && { labels }),
      ...(description && { description }),
    };
    
    this.metrics.set(key, metric);
    this.emit('metric', metric);
  };

  /**
   * Set a gauge metric value
   */
  public readonly setGauge = (
    name: string,
    value: number,
    labels?: Record<string, string>,
    description?: string
  ): void => {
    const key = this.createKey(name, labels);
    
    this.gauges.set(key, value);
    
    const metric: MetricData = {
      name,
      type: MetricType.GAUGE,
      value,
      timestamp: new Date(),
      ...(labels !== undefined && { labels }),
      ...(description !== undefined && { description }),
    };
    
    this.metrics.set(key, metric);
    this.emit('metric', metric);
  };

  /**
   * Record a value in a histogram
   */
  public readonly recordHistogram = (
    name: string,
    value: number,
    buckets: number[] = [0.1, 0.5, 1, 2.5, 5, 10],
    labels?: Record<string, string>
  ): void => {
    const key = this.createKey(name, labels);
    const existing = this.histograms.get(key);
    
    if (existing) {
      // Update existing histogram
      existing.buckets.forEach(bucket => {
        if (value <= bucket.upperBound) {
          bucket.count++;
        }
      });
      
      const updated: HistogramMetric = {
        ...existing,
        sum: existing.sum + value,
        count: existing.count + 1,
        timestamp: new Date(),
      };
      
      this.histograms.set(key, updated);
      this.emit('histogram', updated);
    } else {
      // Create new histogram
      const histogramBuckets: HistogramBucket[] = buckets.map(upperBound => ({
        upperBound,
        count: value <= upperBound ? 1 : 0,
      }));
      
      const histogram: HistogramMetric = {
        name,
        type: MetricType.HISTOGRAM,
        buckets: histogramBuckets,
        sum: value,
        count: 1,
        timestamp: new Date(),
        ...(labels !== undefined && { labels }),
      };
      
      this.histograms.set(key, histogram);
      this.emit('histogram', histogram);
    }
  };

  /**
   * Time a function execution and record in histogram
   */
  public readonly timeFunction = async <T>(
    name: string,
    fn: () => Promise<T>,
    labels?: Record<string, string>
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      
      this.recordHistogram(`${name}_duration_seconds`, duration, undefined, labels);
      this.incrementCounter(`${name}_total`, 1, { ...labels, status: 'success' });
      
      return result;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      
      this.recordHistogram(`${name}_duration_seconds`, duration, undefined, labels);
      this.incrementCounter(`${name}_total`, 1, { ...labels, status: 'error' });
      
      throw error;
    }
  };

  /**
   * Get all metrics in Prometheus format
   */
  public readonly getPrometheusMetrics = (): string => {
    const lines: string[] = [];
    
    // Add counters
    for (const [_key, metric] of this.metrics.entries()) {
      if (metric.type === MetricType.COUNTER || metric.type === MetricType.GAUGE) {
        const labelsStr = this.formatLabels(metric.labels);
        lines.push(`# HELP ${metric.name} ${metric.description || ''}`);
        lines.push(`# TYPE ${metric.name} ${metric.type}`);
        lines.push(`${metric.name}${labelsStr} ${metric.value} ${metric.timestamp.getTime()}`);
      }
    }
    
    // Add histograms
    for (const [_key, histogram] of this.histograms.entries()) {
      const labelsStr = this.formatLabels(histogram.labels);
      
      lines.push(`# HELP ${histogram.name} ${histogram.name} histogram`);
      lines.push(`# TYPE ${histogram.name} histogram`);
      
      // Add buckets
      histogram.buckets.forEach(bucket => {
        const bucketLabels = this.formatLabels({
          ...histogram.labels,
          le: bucket.upperBound.toString(),
        });
        lines.push(`${histogram.name}_bucket${bucketLabels} ${bucket.count} ${histogram.timestamp.getTime()}`);
      });
      
      // Add sum and count
      lines.push(`${histogram.name}_sum${labelsStr} ${histogram.sum} ${histogram.timestamp.getTime()}`);
      lines.push(`${histogram.name}_count${labelsStr} ${histogram.count} ${histogram.timestamp.getTime()}`);
    }
    
    return lines.join('\n');
  };

  /**
   * Get metrics as JSON
   */
  public readonly getJsonMetrics = () => {
    return {
      counters: Object.fromEntries(this.counters.entries()),
      gauges: Object.fromEntries(this.gauges.entries()),
      histograms: Array.from(this.histograms.values()),
      metrics: Array.from(this.metrics.values()),
      timestamp: new Date(),
    };
  };

  /**
   * Start automatic metrics collection
   */
  public readonly startCollection = (intervalMs: number = 30000): void => {
    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, intervalMs);
    
    this.logger?.info('Metrics collection started', { intervalMs: intervalMs } as any);
  };

  /**
   * Stop metrics collection
   */
  public readonly stopCollection = (): void => {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    this.collectionInterval = undefined as any;
    }
    
    this.logger?.info('Metrics collection stopped');
  };

  /**
   * Collect system metrics
   */
  private readonly collectSystemMetrics = (): void => {
    // Memory metrics
    const memUsage = process.memoryUsage();
    this.setGauge('nodejs_heap_size_used_bytes', memUsage.heapUsed);
    this.setGauge('nodejs_heap_size_total_bytes', memUsage.heapTotal);
    this.setGauge('nodejs_external_memory_bytes', memUsage.external);
    this.setGauge('nodejs_rss_bytes', memUsage.rss);
    
    // CPU metrics
    const cpuUsage = process.cpuUsage();
    this.setGauge('nodejs_cpu_user_microseconds', cpuUsage.user);
    this.setGauge('nodejs_cpu_system_microseconds', cpuUsage.system);
    
    // Process metrics
    this.setGauge('nodejs_process_uptime_seconds', process.uptime());
    this.setGauge('nodejs_version_info', 1, { version: process.version });
    
    // Event loop lag (approximate)
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds
      this.recordHistogram('nodejs_eventloop_lag_seconds', lag / 1000);
    });
  };

  /**
   * Create a unique key for metrics with labels
   */
  private readonly createKey = (name: string, labels?: Record<string, string>): string => {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    
    return `${name}{${labelStr}}`;
  };

  /**
   * Format labels for Prometheus output
   */
  private readonly formatLabels = (labels?: Record<string, string>): string => {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    
    const labelPairs = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    
    return `{${labelPairs}}`;
  };
}

/**
 * API-specific metrics collector
 */
export class ApiMetricsCollector extends MetricsCollector {
  constructor(logger?: Logger) {
    super(logger);
    this.setupApiMetrics();
  }

  /**
   * Record HTTP request metrics
   */
  public readonly recordHttpRequest = (
    method: string,
    path: string,
    statusCode: number,
    duration: number
  ): void => {
    const labels = {
      method: method.toUpperCase(),
      path: this.normalizePath(path),
      status: statusCode.toString(),
    };
    
    this.incrementCounter('http_requests_total', 1, labels);
    this.recordHistogram('http_request_duration_seconds', duration / 1000, undefined, labels);
    
    // Record status code categories
    const statusCategory = Math.floor(statusCode / 100);
    this.incrementCounter(`http_requests_${statusCategory}xx_total`, 1, {
      method: method.toUpperCase(),
      path: this.normalizePath(path),
    });
  };

  /**
   * Record WebSocket connection metrics
   */
  public readonly recordWebSocketConnection = (event: 'connect' | 'disconnect', userId?: string): void => {
    this.incrementCounter('websocket_connections_total', 1, { 
      event,
      user_type: userId ? 'authenticated' : 'anonymous',
    });
    
    if (event === 'connect') {
      this.incrementCounter('websocket_active_connections', 1);
    } else {
      this.incrementCounter('websocket_active_connections', -1);
    }
  };

  /**
   * Record evolution operation metrics
   */
  public readonly recordEvolutionOperation = (
    operation: 'evolve' | 'create' | 'spawn' | 'learn',
    success: boolean,
    duration: number
  ): void => {
    const labels = {
      operation,
      status: success ? 'success' : 'failure',
    };
    
    this.incrementCounter('evolution_operations_total', 1, labels);
    this.recordHistogram('evolution_operation_duration_seconds', duration / 1000, undefined, labels);
  };

  /**
   * Record database operation metrics
   */
  public readonly recordDatabaseOperation = (
    operation: 'select' | 'insert' | 'update' | 'delete',
    table: string,
    success: boolean,
    duration: number
  ): void => {
    const labels = {
      operation,
      table,
      status: success ? 'success' : 'failure',
    };
    
    this.incrementCounter('database_operations_total', 1, labels);
    this.recordHistogram('database_operation_duration_seconds', duration / 1000, undefined, labels);
  };

  /**
   * Setup initial API metrics
   */
  private readonly setupApiMetrics = (): void => {
    // Initialize counters at 0
    this.setGauge('websocket_active_connections', 0);
    this.setGauge('api_startup_timestamp', Date.now() / 1000);
  };

  /**
   * Normalize API path for consistent metrics
   */
  private readonly normalizePath = (path: string): string => {
    // Replace path parameters with placeholders
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9]{24}/g, '/:id') // MongoDB ObjectId
      .replace(/\/[a-f0-9-]{36}/g, '/:id') // UUID
      .replace(/\?.*$/, ''); // Remove query parameters
  };
}

/**
 * Metrics middleware for Express
 */
export const createMetricsMiddleware = (metricsCollector: ApiMetricsCollector) => {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Override res.end to capture metrics
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      
      metricsCollector.recordHttpRequest(
        req.method,
        req.route?.path || req.path,
        res.statusCode,
        duration
      );
      
      return originalEnd.apply(this, args);
    };
    
    next();
  };
};