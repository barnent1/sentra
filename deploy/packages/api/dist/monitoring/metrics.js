"use strict";
/**
 * Performance monitoring and metrics collection for Evolution API
 * Following SENTRA project standards: strict TypeScript with branded types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMetricsMiddleware = exports.ApiMetricsCollector = exports.MetricsCollector = exports.MetricType = void 0;
const events_1 = require("events");
/**
 * Metric types for type safety
 */
exports.MetricType = {
    COUNTER: 'counter',
    HISTOGRAM: 'histogram',
    GAUGE: 'gauge',
    SUMMARY: 'summary',
};
/**
 * Performance metrics collector
 */
class MetricsCollector extends events_1.EventEmitter {
    metrics;
    histograms;
    counters;
    gauges;
    logger;
    collectionInterval;
    constructor(logger) {
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
    incrementCounter = (name, value = 1, labels, description) => {
        const key = this.createKey(name, labels);
        const current = this.counters.get(key) || 0;
        const newValue = current + value;
        this.counters.set(key, newValue);
        const metric = {
            name,
            type: exports.MetricType.COUNTER,
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
    setGauge = (name, value, labels, description) => {
        const key = this.createKey(name, labels);
        this.gauges.set(key, value);
        const metric = {
            name,
            type: exports.MetricType.GAUGE,
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
    recordHistogram = (name, value, buckets = [0.1, 0.5, 1, 2.5, 5, 10], labels) => {
        const key = this.createKey(name, labels);
        const existing = this.histograms.get(key);
        if (existing) {
            // Update existing histogram
            existing.buckets.forEach(bucket => {
                if (value <= bucket.upperBound) {
                    bucket.count++;
                }
            });
            const updated = {
                ...existing,
                sum: existing.sum + value,
                count: existing.count + 1,
                timestamp: new Date(),
            };
            this.histograms.set(key, updated);
            this.emit('histogram', updated);
        }
        else {
            // Create new histogram
            const histogramBuckets = buckets.map(upperBound => ({
                upperBound,
                count: value <= upperBound ? 1 : 0,
            }));
            const histogram = {
                name,
                type: exports.MetricType.HISTOGRAM,
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
    timeFunction = async (name, fn, labels) => {
        const startTime = Date.now();
        try {
            const result = await fn();
            const duration = (Date.now() - startTime) / 1000; // Convert to seconds
            this.recordHistogram(`${name}_duration_seconds`, duration, undefined, labels);
            this.incrementCounter(`${name}_total`, 1, { ...labels, status: 'success' });
            return result;
        }
        catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            this.recordHistogram(`${name}_duration_seconds`, duration, undefined, labels);
            this.incrementCounter(`${name}_total`, 1, { ...labels, status: 'error' });
            throw error;
        }
    };
    /**
     * Get all metrics in Prometheus format
     */
    getPrometheusMetrics = () => {
        const lines = [];
        // Add counters
        for (const [_key, metric] of this.metrics.entries()) {
            if (metric.type === exports.MetricType.COUNTER || metric.type === exports.MetricType.GAUGE) {
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
    getJsonMetrics = () => {
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
    startCollection = (intervalMs = 30000) => {
        this.collectionInterval = setInterval(() => {
            this.collectSystemMetrics();
        }, intervalMs);
        this.logger?.info('Metrics collection started', { intervalMs: intervalMs });
    };
    /**
     * Stop metrics collection
     */
    stopCollection = () => {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            if (this.collectionInterval) {
                clearInterval(this.collectionInterval);
            }
            this.collectionInterval = undefined;
        }
        this.logger?.info('Metrics collection stopped');
    };
    /**
     * Collect system metrics
     */
    collectSystemMetrics = () => {
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
    createKey = (name, labels) => {
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
    formatLabels = (labels) => {
        if (!labels || Object.keys(labels).length === 0) {
            return '';
        }
        const labelPairs = Object.entries(labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(',');
        return `{${labelPairs}}`;
    };
}
exports.MetricsCollector = MetricsCollector;
/**
 * API-specific metrics collector
 */
class ApiMetricsCollector extends MetricsCollector {
    constructor(logger) {
        super(logger);
        this.setupApiMetrics();
    }
    /**
     * Record HTTP request metrics
     */
    recordHttpRequest = (method, path, statusCode, duration) => {
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
    recordWebSocketConnection = (event, userId) => {
        this.incrementCounter('websocket_connections_total', 1, {
            event,
            user_type: userId ? 'authenticated' : 'anonymous',
        });
        if (event === 'connect') {
            this.incrementCounter('websocket_active_connections', 1);
        }
        else {
            this.incrementCounter('websocket_active_connections', -1);
        }
    };
    /**
     * Record evolution operation metrics
     */
    recordEvolutionOperation = (operation, success, duration) => {
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
    recordDatabaseOperation = (operation, table, success, duration) => {
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
    setupApiMetrics = () => {
        // Initialize counters at 0
        this.setGauge('websocket_active_connections', 0);
        this.setGauge('api_startup_timestamp', Date.now() / 1000);
    };
    /**
     * Normalize API path for consistent metrics
     */
    normalizePath = (path) => {
        // Replace path parameters with placeholders
        return path
            .replace(/\/\d+/g, '/:id')
            .replace(/\/[a-f0-9]{24}/g, '/:id') // MongoDB ObjectId
            .replace(/\/[a-f0-9-]{36}/g, '/:id') // UUID
            .replace(/\?.*$/, ''); // Remove query parameters
    };
}
exports.ApiMetricsCollector = ApiMetricsCollector;
/**
 * Metrics middleware for Express
 */
const createMetricsMiddleware = (metricsCollector) => {
    return (req, res, next) => {
        const startTime = Date.now();
        // Override res.end to capture metrics
        const originalEnd = res.end;
        res.end = function (...args) {
            const duration = Date.now() - startTime;
            metricsCollector.recordHttpRequest(req.method, req.route?.path || req.path, res.statusCode, duration);
            return originalEnd.apply(this, args);
        };
        next();
    };
};
exports.createMetricsMiddleware = createMetricsMiddleware;
//# sourceMappingURL=metrics.js.map