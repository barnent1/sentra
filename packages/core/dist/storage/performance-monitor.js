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
// ============================================================================
// PERFORMANCE METRICS AND TYPES
// ============================================================================
/**
 * Operation types for performance tracking
 */
export var OperationType;
(function (OperationType) {
    OperationType["VECTOR_STORE"] = "vector_store";
    OperationType["VECTOR_SEARCH"] = "vector_search";
    OperationType["BATCH_STORE"] = "batch_store";
    OperationType["EMBEDDING_GENERATION"] = "embedding_generation";
    OperationType["CACHE_LOOKUP"] = "cache_lookup";
    OperationType["PATTERN_RANKING"] = "pattern_ranking";
})(OperationType || (OperationType = {}));
/**
 * Alert condition types
 */
export var AlertCondition;
(function (AlertCondition) {
    AlertCondition["AVERAGE_DURATION_EXCEEDS"] = "avg_duration_exceeds";
    AlertCondition["P95_DURATION_EXCEEDS"] = "p95_duration_exceeds";
    AlertCondition["ERROR_RATE_EXCEEDS"] = "error_rate_exceeds";
    AlertCondition["THROUGHPUT_BELOW"] = "throughput_below";
    AlertCondition["MEMORY_USAGE_EXCEEDS"] = "memory_usage_exceeds";
    AlertCondition["CPU_USAGE_EXCEEDS"] = "cpu_usage_exceeds";
    AlertCondition["CACHE_HIT_RATE_BELOW"] = "cache_hit_rate_below";
})(AlertCondition || (AlertCondition = {}));
// ============================================================================
// PERFORMANCE MONITOR IMPLEMENTATION
// ============================================================================
/**
 * High-performance monitoring system for vector operations
 */
export class PerformanceMonitor {
    metrics = new Map();
    alerts = new Map();
    activeAlerts = new Map();
    maxMetricsPerOperation;
    retentionMs;
    cleanupTimer;
    constructor(options = {}) {
        this.maxMetricsPerOperation = options.maxMetricsPerOperation || 10000;
        this.retentionMs = options.retentionMs || 24 * 60 * 60 * 1000; // 24 hours
        // Initialize metric arrays for each operation type
        Object.values(OperationType).forEach(operation => {
            this.metrics.set(operation, []);
        });
        // Setup default alerts
        this.setupDefaultAlerts();
        // Start cleanup timer
        const cleanupInterval = options.cleanupIntervalMs || 5 * 60 * 1000; // 5 minutes
        this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);
    }
    /**
     * Record a performance metric
     */
    recordMetric(metric) {
        const operationMetrics = this.metrics.get(metric.operation);
        if (!operationMetrics)
            return;
        // Add metric
        operationMetrics.push(metric);
        // Enforce size limit
        if (operationMetrics.length > this.maxMetricsPerOperation) {
            operationMetrics.shift(); // Remove oldest
        }
        // Check alerts
        this.checkAlerts(metric.operation);
    }
    /**
     * Record operation with automatic timing
     */
    async measureOperation(operation, fn, metadata = {}) {
        const startTime = Date.now();
        const startCpuUsage = process.cpuUsage();
        let success = true;
        let result;
        try {
            result = await fn();
            return result;
        }
        catch (error) {
            success = false;
            throw error;
        }
        finally {
            const endTime = Date.now();
            const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
            const endCpuUsage = process.cpuUsage(startCpuUsage);
            // Calculate CPU percentage (rough estimate)
            const cpuPercent = ((endCpuUsage.user + endCpuUsage.system) / 1000000) * 100 / (endTime - startTime);
            this.recordMetric({
                timestamp: startTime,
                operation,
                duration: endTime - startTime,
                success,
                resourceUsage: {
                    memoryMb: endMemory,
                    cpuPercent: Math.min(cpuPercent, 100), // Cap at 100%
                },
                metadata,
            });
        }
    }
    /**
     * Get performance statistics for an operation
     */
    getStats(operation, windowMs = 60 * 60 * 1000 // 1 hour default
    ) {
        const operationMetrics = this.metrics.get(operation);
        if (!operationMetrics || operationMetrics.length === 0)
            return undefined;
        const now = Date.now();
        const windowStart = now - windowMs;
        // Filter metrics within time window
        const windowMetrics = operationMetrics.filter(metric => metric.timestamp >= windowStart);
        if (windowMetrics.length === 0)
            return undefined;
        // Calculate basic metrics
        const totalOperations = windowMetrics.length;
        const successfulOperations = windowMetrics.filter(m => m.success).length;
        const failedOperations = totalOperations - successfulOperations;
        const durations = windowMetrics.map(m => m.duration).sort((a, b) => a - b);
        const averageDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
        const medianDuration = durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 0;
        const p95Duration = durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0;
        const p99Duration = durations.length > 0 ? durations[Math.floor(durations.length * 0.99)] : 0;
        const minDuration = durations.length > 0 ? durations[0] : 0;
        const maxDuration = durations.length > 0 ? durations[durations.length - 1] : 0;
        const throughputPerSecond = (totalOperations / (windowMs / 1000));
        // Resource metrics
        const memoryUsages = windowMetrics.map(m => m.resourceUsage.memoryMb);
        const cpuUsages = windowMetrics.map(m => m.resourceUsage.cpuPercent);
        const averageMemoryMb = memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length;
        const peakMemoryMb = Math.max(...memoryUsages);
        const averageCpuPercent = cpuUsages.reduce((sum, c) => sum + c, 0) / cpuUsages.length;
        const peakCpuPercent = Math.max(...cpuUsages);
        // Reliability metrics
        const successRate = successfulOperations / totalOperations;
        const errorRate = failedOperations / totalOperations;
        const retryMetrics = windowMetrics
            .map(m => m.metadata.retryAttempts || 0)
            .filter(r => r > 0);
        const averageRetryAttempts = retryMetrics.length > 0
            ? retryMetrics.reduce((sum, r) => sum + r, 0) / retryMetrics.length
            : 0;
        return {
            operation,
            timeWindow: {
                startTime: windowStart,
                endTime: now,
                windowSizeMs: windowMs,
            },
            metrics: {
                totalOperations,
                successfulOperations,
                failedOperations,
                averageDuration: averageDuration ?? 0,
                medianDuration: medianDuration ?? 0,
                p95Duration: p95Duration ?? 0,
                p99Duration: p99Duration ?? 0,
                minDuration: minDuration ?? 0,
                maxDuration: maxDuration ?? 0,
                throughputPerSecond,
            },
            resources: {
                averageMemoryMb,
                peakMemoryMb,
                averageCpuPercent,
                peakCpuPercent,
            },
            reliability: {
                successRate,
                errorRate,
                averageRetryAttempts,
            },
        };
    }
    /**
     * Get statistics for all operations
     */
    getAllStats(windowMs = 60 * 60 * 1000) {
        const stats = [];
        for (const operation of Object.values(OperationType)) {
            const operationStats = this.getStats(operation, windowMs);
            if (operationStats) {
                stats.push(operationStats);
            }
        }
        return stats;
    }
    /**
     * Register a performance alert
     */
    registerAlert(alert) {
        this.alerts.set(alert.id, alert);
    }
    /**
     * Remove an alert
     */
    removeAlert(alertId) {
        this.alerts.delete(alertId);
        this.activeAlerts.delete(alertId);
    }
    /**
     * Get all active alerts
     */
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }
    /**
     * Get performance trends over time
     */
    getTrends(operation, windowMs = 24 * 60 * 60 * 1000, // 24 hours
    bucketMs = 60 * 60 * 1000 // 1 hour buckets
    ) {
        const operationMetrics = this.metrics.get(operation);
        if (!operationMetrics || operationMetrics.length === 0)
            return [];
        const now = Date.now();
        const windowStart = now - windowMs;
        const windowMetrics = operationMetrics.filter(m => m.timestamp >= windowStart);
        // Group metrics into time buckets
        const buckets = new Map();
        for (const metric of windowMetrics) {
            const bucketTime = Math.floor(metric.timestamp / bucketMs) * bucketMs;
            const bucketMetrics = buckets.get(bucketTime) || [];
            bucketMetrics.push(metric);
            buckets.set(bucketTime, bucketMetrics);
        }
        // Calculate trends for each bucket
        const trends = [];
        for (const [bucketTime, bucketMetrics] of buckets.entries()) {
            const averageDuration = bucketMetrics.reduce((sum, m) => sum + m.duration, 0) / bucketMetrics.length;
            const throughput = bucketMetrics.length / (bucketMs / 1000);
            const errorRate = bucketMetrics.filter(m => !m.success).length / bucketMetrics.length;
            trends.push({
                timestamp: bucketTime,
                averageDuration,
                throughput,
                errorRate,
            });
        }
        return trends.sort((a, b) => a.timestamp - b.timestamp);
    }
    /**
     * Export metrics for external analysis
     */
    exportMetrics(operation, windowMs) {
        const now = Date.now();
        const cutoff = windowMs ? now - windowMs : 0;
        const allMetrics = [];
        const operations = operation ? [operation] : Object.values(OperationType);
        for (const op of operations) {
            const operationMetrics = this.metrics.get(op) || [];
            const filteredMetrics = windowMs
                ? operationMetrics.filter(m => m.timestamp >= cutoff)
                : operationMetrics;
            allMetrics.push(...filteredMetrics);
        }
        return allMetrics.sort((a, b) => a.timestamp - b.timestamp);
    }
    /**
     * Clear all metrics and alerts
     */
    clear() {
        this.metrics.clear();
        this.activeAlerts.clear();
        // Reinitialize metric arrays
        Object.values(OperationType).forEach(operation => {
            this.metrics.set(operation, []);
        });
    }
    /**
     * Cleanup expired data and resolved alerts
     */
    cleanup() {
        const now = Date.now();
        const cutoff = now - this.retentionMs;
        // Clean up old metrics
        for (const [operation, operationMetrics] of this.metrics.entries()) {
            const validMetrics = operationMetrics.filter(m => m.timestamp >= cutoff);
            this.metrics.set(operation, validMetrics);
        }
        // Clean up resolved alerts older than 1 hour
        const alertCutoff = now - (60 * 60 * 1000);
        for (const [alertId, alertInstance] of this.activeAlerts.entries()) {
            if (alertInstance.resolved && alertInstance.resolvedAt && alertInstance.resolvedAt < alertCutoff) {
                this.activeAlerts.delete(alertId);
            }
        }
    }
    /**
     * Setup default performance alerts
     */
    setupDefaultAlerts() {
        const defaultAlerts = [
            {
                id: 'vector_search_slow',
                name: 'Vector Search Performance Degradation',
                operation: OperationType.VECTOR_SEARCH,
                condition: AlertCondition.P95_DURATION_EXCEEDS,
                threshold: 200, // 200ms
                windowSizeMs: 5 * 60 * 1000, // 5 minutes
                cooldownMs: 15 * 60 * 1000, // 15 minutes
                severity: 'warning',
                enabled: true,
            },
            {
                id: 'vector_store_error_rate',
                name: 'High Vector Store Error Rate',
                operation: OperationType.VECTOR_STORE,
                condition: AlertCondition.ERROR_RATE_EXCEEDS,
                threshold: 0.05, // 5%
                windowSizeMs: 10 * 60 * 1000, // 10 minutes
                cooldownMs: 30 * 60 * 1000, // 30 minutes
                severity: 'critical',
                enabled: true,
            },
            {
                id: 'batch_store_throughput',
                name: 'Low Batch Store Throughput',
                operation: OperationType.BATCH_STORE,
                condition: AlertCondition.THROUGHPUT_BELOW,
                threshold: 0.5, // 0.5 operations per second
                windowSizeMs: 15 * 60 * 1000, // 15 minutes
                cooldownMs: 30 * 60 * 1000, // 30 minutes
                severity: 'warning',
                enabled: true,
            },
            {
                id: 'memory_usage_high',
                name: 'High Memory Usage',
                operation: OperationType.EMBEDDING_GENERATION,
                condition: AlertCondition.MEMORY_USAGE_EXCEEDS,
                threshold: 500, // 500MB
                windowSizeMs: 5 * 60 * 1000, // 5 minutes
                cooldownMs: 10 * 60 * 1000, // 10 minutes
                severity: 'warning',
                enabled: true,
            },
        ];
        defaultAlerts.forEach(alert => this.registerAlert(alert));
    }
    /**
     * Check if any alerts should be triggered
     */
    checkAlerts(operation) {
        const operationAlerts = Array.from(this.alerts.values())
            .filter(alert => alert.operation === operation && alert.enabled);
        for (const alert of operationAlerts) {
            // Check cooldown
            const existingAlert = this.activeAlerts.get(alert.id);
            if (existingAlert && !existingAlert.resolved) {
                const timeSinceTriggered = Date.now() - existingAlert.triggeredAt;
                if (timeSinceTriggered < alert.cooldownMs) {
                    continue;
                }
            }
            // Get stats for alert window
            const stats = this.getStats(operation, alert.windowSizeMs);
            if (!stats)
                continue;
            const shouldTrigger = this.evaluateAlertCondition(alert, stats);
            if (shouldTrigger.shouldTrigger) {
                this.triggerAlert(alert, shouldTrigger.value);
            }
            else if (existingAlert && !existingAlert.resolved) {
                // Resolve alert if condition no longer met
                this.resolveAlert(alert.id);
            }
        }
    }
    /**
     * Evaluate if alert condition is met
     */
    evaluateAlertCondition(alert, stats) {
        let value;
        let shouldTrigger;
        switch (alert.condition) {
            case AlertCondition.AVERAGE_DURATION_EXCEEDS:
                value = stats.metrics.averageDuration;
                shouldTrigger = value > alert.threshold;
                break;
            case AlertCondition.P95_DURATION_EXCEEDS:
                value = stats.metrics.p95Duration;
                shouldTrigger = value > alert.threshold;
                break;
            case AlertCondition.ERROR_RATE_EXCEEDS:
                value = stats.reliability.errorRate;
                shouldTrigger = value > alert.threshold;
                break;
            case AlertCondition.THROUGHPUT_BELOW:
                value = stats.metrics.throughputPerSecond;
                shouldTrigger = value < alert.threshold;
                break;
            case AlertCondition.MEMORY_USAGE_EXCEEDS:
                value = stats.resources.peakMemoryMb;
                shouldTrigger = value > alert.threshold;
                break;
            case AlertCondition.CPU_USAGE_EXCEEDS:
                value = stats.resources.peakCpuPercent;
                shouldTrigger = value > alert.threshold;
                break;
            default:
                return { shouldTrigger: false, value: 0 };
        }
        return { shouldTrigger, value };
    }
    /**
     * Trigger an alert
     */
    triggerAlert(alert, value) {
        const alertInstance = {
            alertId: alert.id,
            triggeredAt: Date.now(),
            value,
            threshold: alert.threshold,
            message: `${alert.name}: ${alert.condition} = ${value}, threshold = ${alert.threshold}`,
            severity: alert.severity,
            resolved: false,
        };
        this.activeAlerts.set(alert.id, alertInstance);
        // Log alert (in production, you'd send to monitoring system)
        console.warn(`[ALERT] ${alertInstance.message}`);
    }
    /**
     * Resolve an active alert
     */
    resolveAlert(alertId) {
        const alertInstance = this.activeAlerts.get(alertId);
        if (alertInstance && !alertInstance.resolved) {
            const resolvedAlert = {
                ...alertInstance,
                resolved: true,
                resolvedAt: Date.now(),
            };
            this.activeAlerts.set(alertId, resolvedAlert);
            console.info(`[ALERT RESOLVED] ${alertInstance.message}`);
        }
    }
    /**
     * Cleanup on destruction
     */
    destroy() {
        if (this.cleanupTimer) {
            clearTimeout(this.cleanupTimer);
        }
        this.clear();
    }
}
// Export statement removed - enums and types are already exported with their declarations
//# sourceMappingURL=performance-monitor.js.map