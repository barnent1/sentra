/**
 * Performance Tracker - Detailed performance monitoring and analysis
 * Following SENTRA project standards: strict TypeScript with branded types
 */
// ============================================================================
// PERFORMANCE TRACKER
// ============================================================================
/**
 * Advanced performance tracking and analysis system
 */
export class PerformanceTracker {
    logger; // TODO: Type when logger is configured
    // Data storage
    measurements = new Map();
    benchmarks = new Map();
    alerts = new Map();
    // Indexing for fast queries
    measurementsByAgent = new Map();
    measurementsByMetric = new Map();
    measurementsByTime = new Map(); // Hour buckets
    // Configuration
    config = {
        retentionHours: 24 * 7, // 7 days
        maxMeasurements: 100000, // Maximum measurements to keep in memory
        alertCooldown: 300000, // 5 minutes between duplicate alerts
        trendAnalysisWindow: 3600000, // 1 hour for trend analysis
    };
    constructor(logger) {
        this.logger = logger;
        this.setupCleanupTimer();
    }
    // ============================================================================
    // MEASUREMENT RECORDING
    // ============================================================================
    /**
     * Record a performance measurement
     */
    recordMeasurement(agentId, metric, value, unit, context, sessionId, taskId, tags) {
        const id = this.generateMeasurementId();
        const measurement = {
            id,
            agentId,
            sessionId,
            taskId,
            timestamp: new Date(),
            metric,
            value,
            unit,
            context: context || {},
            tags: tags || [],
        };
        // Store measurement
        this.measurements.set(id, measurement);
        // Update indexes
        this.updateIndexes(id, measurement);
        // Check against benchmarks and generate alerts
        this.checkBenchmarks(measurement);
        // Clean up old measurements if needed
        this.cleanupOldMeasurements();
        this.logger?.debug('Performance measurement recorded', {
            agentId,
            metric,
            value,
            unit,
        });
        return id;
    }
    /**
     * Record multiple measurements at once
     */
    recordBatchMeasurements(measurements) {
        return measurements.map(m => this.recordMeasurement(m.agentId, m.metric, m.value, m.unit, m.context, m.sessionId, m.taskId, m.tags));
    }
    // ============================================================================
    // BENCHMARK MANAGEMENT
    // ============================================================================
    /**
     * Create a performance benchmark
     */
    createBenchmark(name, description, metric, target, threshold, unit, category) {
        const id = this.generateBenchmarkId();
        const benchmark = {
            id,
            name,
            description,
            metric,
            target,
            threshold,
            unit,
            category,
            createdAt: new Date(),
        };
        this.benchmarks.set(id, benchmark);
        this.logger?.info('Performance benchmark created', {
            id,
            name,
            metric,
            target,
            threshold,
        });
        return id;
    }
    /**
     * Update a benchmark
     */
    updateBenchmark(id, updates) {
        const benchmark = this.benchmarks.get(id);
        if (!benchmark)
            return false;
        const updatedBenchmark = {
            ...benchmark,
            ...updates,
        };
        this.benchmarks.set(id, updatedBenchmark);
        this.logger?.info('Performance benchmark updated', { id, updates });
        return true;
    }
    /**
     * Delete a benchmark
     */
    deleteBenchmark(id) {
        const deleted = this.benchmarks.delete(id);
        if (deleted) {
            this.logger?.info('Performance benchmark deleted', { id });
        }
        return deleted;
    }
    // ============================================================================
    // PERFORMANCE ANALYSIS
    // ============================================================================
    /**
     * Analyze performance trends for a specific metric
     */
    analyzeTrend(agentId, metric, timeRange) {
        const endTime = timeRange?.end || new Date();
        const startTime = timeRange?.start || new Date(endTime.getTime() - this.config.trendAnalysisWindow);
        const measurements = this.getMeasurements({
            agentId,
            metric,
            startTime,
            endTime,
        });
        if (measurements.length < 3) {
            return null; // Insufficient data for trend analysis
        }
        // Sort by timestamp
        const sortedMeasurements = measurements.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const values = sortedMeasurements.map(m => m.value);
        const statistics = this.calculateStatistics(values);
        // Calculate trend
        const trend = this.calculateTrend(sortedMeasurements);
        const changeRate = this.calculateChangeRate(sortedMeasurements);
        // Predict future values
        const predictions = this.predictFutureValues(sortedMeasurements, changeRate);
        return {
            metric,
            agentId,
            timeRange: { start: startTime, end: endTime },
            trend,
            confidence: this.calculateTrendConfidence(sortedMeasurements, trend),
            changeRate,
            statistics,
            predictions,
        };
    }
    /**
     * Get performance summary for an agent
     */
    getAgentPerformanceSummary(agentId, timeRange) {
        const measurements = this.getMeasurements({
            agentId,
            startTime: timeRange?.start,
            endTime: timeRange?.end,
        });
        // Group by metric
        const metricGroups = new Map();
        measurements.forEach(measurement => {
            const group = metricGroups.get(measurement.metric) || [];
            group.push(measurement);
            metricGroups.set(measurement.metric, group);
        });
        // Calculate summary for each metric
        const metricSummaries = Array.from(metricGroups.entries()).map(([metric, measurements]) => {
            const values = measurements.map(m => m.value);
            const statistics = this.calculateStatistics(values);
            const trend = this.analyzeTrend(agentId, metric, timeRange);
            return {
                metric,
                measurementCount: measurements.length,
                statistics,
                trend: trend?.trend || 'stable',
                lastValue: measurements[measurements.length - 1]?.value,
                lastMeasurement: measurements[measurements.length - 1]?.timestamp,
            };
        });
        return {
            agentId,
            timeRange: timeRange || {
                start: new Date(Date.now() - this.config.trendAnalysisWindow),
                end: new Date()
            },
            totalMeasurements: measurements.length,
            uniqueMetrics: metricGroups.size,
            metricSummaries,
            alerts: this.getActiveAlertsForAgent(agentId),
        };
    }
    /**
     * Compare agent performance against benchmarks
     */
    compareAgainstBenchmarks(agentId) {
        const comparisons = [];
        for (const benchmark of this.benchmarks.values()) {
            const recentMeasurements = this.getMeasurements({
                agentId,
                metric: benchmark.metric,
                limit: 10,
            });
            if (recentMeasurements.length === 0) {
                continue;
            }
            const currentValue = recentMeasurements[recentMeasurements.length - 1].value;
            const gap = benchmark.target - currentValue;
            let performance;
            if (currentValue >= benchmark.target) {
                performance = 'exceeding';
            }
            else if (currentValue >= benchmark.threshold) {
                performance = 'meeting';
            }
            else if (currentValue >= benchmark.threshold * 0.5) {
                performance = 'below';
            }
            else {
                performance = 'critical';
            }
            const trendAnalysis = this.analyzeTrend(agentId, benchmark.metric);
            comparisons.push({
                benchmark,
                currentValue,
                performance,
                gap,
                trend: trendAnalysis?.trend,
            });
        }
        return comparisons;
    }
    // ============================================================================
    // ALERTING
    // ============================================================================
    /**
     * Check measurement against benchmarks and generate alerts
     */
    checkBenchmarks(measurement) {
        for (const benchmark of this.benchmarks.values()) {
            if (benchmark.metric !== measurement.metric)
                continue;
            const alertKey = `${measurement.agentId}_${benchmark.metric}`;
            const existingAlert = this.alerts.get(alertKey);
            // Check if we're in cooldown period
            if (existingAlert && !existingAlert.resolved) {
                const timeSinceAlert = Date.now() - existingAlert.triggerTime.getTime();
                if (timeSinceAlert < this.config.alertCooldown) {
                    continue;
                }
            }
            // Determine alert level
            let level = null;
            if (measurement.value < benchmark.threshold * 0.5) {
                level = 'critical';
            }
            else if (measurement.value < benchmark.threshold) {
                level = 'warning';
            }
            else if (measurement.value >= benchmark.target) {
                level = 'info';
                // Resolve existing alerts if performance is good
                if (existingAlert && !existingAlert.resolved) {
                    this.resolveAlert(alertKey);
                }
                continue;
            }
            if (level) {
                this.createAlert(alertKey, measurement.agentId, benchmark.metric, level, `Performance ${level}: ${benchmark.metric} is ${measurement.value}${benchmark.unit}, threshold is ${benchmark.threshold}${benchmark.unit}`, measurement.value, benchmark.threshold, { benchmark: benchmark.id, measurement: measurement.id });
            }
        }
    }
    /**
     * Create a performance alert
     */
    createAlert(alertKey, agentId, metric, level, message, currentValue, threshold, context) {
        const alert = {
            id: alertKey,
            agentId,
            metric,
            level,
            message,
            currentValue,
            threshold,
            triggerTime: new Date(),
            resolved: false,
            context,
        };
        this.alerts.set(alertKey, alert);
        this.logger?.warn('Performance alert created', {
            alertKey,
            agentId,
            metric,
            level,
            currentValue,
            threshold,
        });
    }
    /**
     * Resolve a performance alert
     */
    resolveAlert(alertKey) {
        const alert = this.alerts.get(alertKey);
        if (!alert || alert.resolved)
            return;
        const resolvedAlert = {
            ...alert,
            resolved: true,
            resolvedAt: new Date(),
        };
        this.alerts.set(alertKey, resolvedAlert);
        this.logger?.info('Performance alert resolved', {
            alertKey,
            agentId: alert.agentId,
            metric: alert.metric,
            level: alert.level,
        });
    }
    /**
     * Get active alerts for an agent
     */
    getActiveAlertsForAgent(agentId) {
        return Array.from(this.alerts.values())
            .filter(alert => alert.agentId === agentId && !alert.resolved);
    }
    // ============================================================================
    // DATA QUERIES
    // ============================================================================
    /**
     * Get measurements based on criteria
     */
    getMeasurements(criteria) {
        let measurements = [];
        // Start with all measurements or filter by agent/metric
        if (criteria.agentId) {
            const measurementIds = this.measurementsByAgent.get(criteria.agentId);
            if (measurementIds) {
                measurements = Array.from(measurementIds)
                    .map(id => this.measurements.get(id))
                    .filter((m) => m !== undefined);
            }
        }
        else if (criteria.metric) {
            const measurementIds = this.measurementsByMetric.get(criteria.metric);
            if (measurementIds) {
                measurements = Array.from(measurementIds)
                    .map(id => this.measurements.get(id))
                    .filter((m) => m !== undefined);
            }
        }
        else {
            measurements = Array.from(this.measurements.values());
        }
        // Apply additional filters
        if (criteria.metric && criteria.agentId) {
            measurements = measurements.filter(m => m.metric === criteria.metric && m.agentId === criteria.agentId);
        }
        else if (criteria.metric && !criteria.agentId) {
            measurements = measurements.filter(m => m.metric === criteria.metric);
        }
        if (criteria.startTime) {
            measurements = measurements.filter(m => m.timestamp >= criteria.startTime);
        }
        if (criteria.endTime) {
            measurements = measurements.filter(m => m.timestamp <= criteria.endTime);
        }
        if (criteria.tags && criteria.tags.length > 0) {
            measurements = measurements.filter(m => criteria.tags.some(tag => m.tags.includes(tag)));
        }
        // Sort by timestamp (newest first) and limit
        measurements.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        if (criteria.limit) {
            measurements = measurements.slice(0, criteria.limit);
        }
        return measurements;
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    /**
     * Calculate basic statistics for a set of values
     */
    calculateStatistics(values) {
        if (values.length === 0) {
            return {
                mean: 0,
                median: 0,
                stdDev: 0,
                min: 0,
                max: 0,
                count: 0,
            };
        }
        const sorted = [...values].sort((a, b) => a - b);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        return {
            mean,
            median,
            stdDev,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            count: values.length,
        };
    }
    /**
     * Calculate trend direction
     */
    calculateTrend(measurements) {
        if (measurements.length < 3)
            return 'stable';
        const values = measurements.map(m => m.value);
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        const change = (secondAvg - firstAvg) / firstAvg;
        // Calculate volatility
        const statistics = this.calculateStatistics(values);
        const volatility = statistics.stdDev / statistics.mean;
        if (volatility > 0.2)
            return 'volatile';
        if (Math.abs(change) < 0.05)
            return 'stable';
        return change > 0 ? 'improving' : 'declining';
    }
    /**
     * Calculate rate of change
     */
    calculateChangeRate(measurements) {
        if (measurements.length < 2)
            return 0;
        const first = measurements[0];
        const last = measurements[measurements.length - 1];
        const timeDiff = last.timestamp.getTime() - first.timestamp.getTime();
        const valueDiff = last.value - first.value;
        // Return change per hour
        return (valueDiff / timeDiff) * (1000 * 60 * 60);
    }
    /**
     * Calculate trend confidence
     */
    calculateTrendConfidence(measurements, trend) {
        if (measurements.length < 5)
            return 0.3;
        const values = measurements.map(m => m.value);
        const statistics = this.calculateStatistics(values);
        // Higher confidence for more data points and consistent trends
        let confidence = Math.min(0.9, measurements.length / 20);
        // Adjust based on volatility
        const volatility = statistics.stdDev / Math.max(statistics.mean, 1);
        confidence *= Math.max(0.1, 1 - volatility);
        return confidence;
    }
    /**
     * Predict future values based on trend
     */
    predictFutureValues(measurements, changeRate) {
        if (measurements.length === 0) {
            return { nextHour: 0, nextDay: 0, confidence: 0 };
        }
        const lastValue = measurements[measurements.length - 1].value;
        const nextHour = lastValue + changeRate;
        const nextDay = lastValue + (changeRate * 24);
        // Confidence based on data consistency and recency
        const confidence = this.calculateTrendConfidence(measurements, 'prediction');
        return {
            nextHour,
            nextDay,
            confidence,
        };
    }
    /**
     * Update indexes when adding a measurement
     */
    updateIndexes(id, measurement) {
        // Agent index
        if (!this.measurementsByAgent.has(measurement.agentId)) {
            this.measurementsByAgent.set(measurement.agentId, new Set());
        }
        this.measurementsByAgent.get(measurement.agentId).add(id);
        // Metric index
        if (!this.measurementsByMetric.has(measurement.metric)) {
            this.measurementsByMetric.set(measurement.metric, new Set());
        }
        this.measurementsByMetric.get(measurement.metric).add(id);
        // Time index (hour buckets)
        const hourBucket = Math.floor(measurement.timestamp.getTime() / (1000 * 60 * 60));
        if (!this.measurementsByTime.has(hourBucket)) {
            this.measurementsByTime.set(hourBucket, new Set());
        }
        this.measurementsByTime.get(hourBucket).add(id);
    }
    /**
     * Setup cleanup timer for old measurements
     */
    setupCleanupTimer() {
        setInterval(() => {
            this.cleanupOldMeasurements();
            this.cleanupOldAlerts();
        }, 60000); // Run every minute
    }
    /**
     * Clean up old measurements
     */
    cleanupOldMeasurements() {
        const cutoffTime = new Date(Date.now() - (this.config.retentionHours * 60 * 60 * 1000));
        // If we're over the limit, be more aggressive
        const maxAge = this.measurements.size > this.config.maxMeasurements
            ? Date.now() - (this.config.retentionHours * 60 * 60 * 1000 / 2)
            : cutoffTime.getTime();
        let removedCount = 0;
        for (const [id, measurement] of this.measurements.entries()) {
            if (measurement.timestamp.getTime() < maxAge) {
                this.removeMeasurement(id, measurement);
                removedCount++;
            }
        }
        if (removedCount > 0) {
            this.logger?.debug('Cleaned up old measurements', { removedCount });
        }
    }
    /**
     * Remove a measurement and update indexes
     */
    removeMeasurement(id, measurement) {
        this.measurements.delete(id);
        // Update indexes
        this.measurementsByAgent.get(measurement.agentId)?.delete(id);
        this.measurementsByMetric.get(measurement.metric)?.delete(id);
        const hourBucket = Math.floor(measurement.timestamp.getTime() / (1000 * 60 * 60));
        this.measurementsByTime.get(hourBucket)?.delete(id);
    }
    /**
     * Clean up old resolved alerts
     */
    cleanupOldAlerts() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 1 day
        let removedCount = 0;
        for (const [key, alert] of this.alerts.entries()) {
            if (alert.resolved && alert.resolvedAt && alert.resolvedAt.getTime() < cutoffTime) {
                this.alerts.delete(key);
                removedCount++;
            }
        }
        if (removedCount > 0) {
            this.logger?.debug('Cleaned up old alerts', { removedCount });
        }
    }
    /**
     * Generate unique measurement ID
     */
    generateMeasurementId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2);
        return `perf_${timestamp}_${random}`;
    }
    /**
     * Generate unique benchmark ID
     */
    generateBenchmarkId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2);
        return `bench_${timestamp}_${random}`;
    }
    // ============================================================================
    // PUBLIC API
    // ============================================================================
    /**
     * Get all benchmarks
     */
    getAllBenchmarks() {
        return Array.from(this.benchmarks.values());
    }
    /**
     * Get benchmark by ID
     */
    getBenchmark(id) {
        return this.benchmarks.get(id);
    }
    /**
     * Get all active alerts
     */
    getAllActiveAlerts() {
        return Array.from(this.alerts.values())
            .filter(alert => !alert.resolved);
    }
    /**
     * Get performance statistics
     */
    getStats() {
        return {
            totalMeasurements: this.measurements.size,
            totalBenchmarks: this.benchmarks.size,
            activeAlerts: this.getAllActiveAlerts().length,
            monitoredAgents: this.measurementsByAgent.size,
            uniqueMetrics: this.measurementsByMetric.size,
            retentionHours: this.config.retentionHours,
        };
    }
    /**
     * Cleanup and shutdown
     */
    shutdown() {
        this.measurements.clear();
        this.benchmarks.clear();
        this.alerts.clear();
        this.measurementsByAgent.clear();
        this.measurementsByMetric.clear();
        this.measurementsByTime.clear();
        this.logger?.info('Performance tracker shutdown complete');
    }
}
//# sourceMappingURL=performance-tracker.js.map