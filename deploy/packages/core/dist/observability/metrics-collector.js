/**
 * Metrics Collector - Automated metrics collection and aggregation
 * Following SENTRA project standards: strict TypeScript with branded types
 */
// ============================================================================
// BUILT-IN METRIC COLLECTORS
// ============================================================================
/**
 * Built-in metric collectors for common measurements
 */
export class BuiltInCollectors {
    /**
     * Collect response time metric
     */
    static responseTime = async (agentId, context) => {
        // This would measure actual response time
        // For now, return a mock value based on recent activity
        return Math.random() * 1000 + 100; // 100-1100ms
    };
    /**
     * Collect CPU usage metric
     */
    static cpuUsage = async (agentId, context) => {
        const usage = process.cpuUsage();
        return (usage.user + usage.system) / 1_000_000; // Convert to percentage
    };
    /**
     * Collect memory usage metric
     */
    static memoryUsage = async (agentId, context) => {
        const usage = process.memoryUsage();
        return usage.heapUsed;
    };
    /**
     * Collect task completion rate
     */
    static taskCompletionRate = async (agentId, context) => {
        // This would calculate actual completion rate
        return Math.random() * 0.3 + 0.7; // 70-100%
    };
    /**
     * Collect error rate metric
     */
    static errorRate = async (agentId, context) => {
        // This would calculate actual error rate
        return Math.random() * 5; // 0-5 errors per minute
    };
    /**
     * Collect learning progress metric
     */
    static learningProgress = async (agentId, context) => {
        // This would measure actual learning progress
        return Math.random() * 0.1 + 0.05; // 5-15% improvement
    };
    /**
     * Collect collaboration score
     */
    static collaborationScore = async (agentId, context) => {
        // This would measure collaboration effectiveness
        return Math.random() * 0.3 + 0.7; // 70-100%
    };
    /**
     * Collect throughput metric
     */
    static throughput = async (agentId, context) => {
        // This would measure actual throughput
        return Math.random() * 10 + 5; // 5-15 tasks per minute
    };
    /**
     * Collect quality score metric
     */
    static qualityScore = async (agentId, context) => {
        // This would measure actual quality
        return Math.random() * 0.2 + 0.8; // 80-100%
    };
    /**
     * Collect resource efficiency metric
     */
    static resourceEfficiency = async (agentId, context) => {
        const cpu = await BuiltInCollectors.cpuUsage(agentId, context) || 0;
        const memory = await BuiltInCollectors.memoryUsage(agentId, context) || 0;
        // Simple efficiency calculation (inverse of resource usage)
        return 1 - Math.min(1, (cpu / 100 + memory / 1_000_000_000) / 2);
    };
}
// ============================================================================
// METRICS COLLECTOR
// ============================================================================
/**
 * Automated metrics collection and aggregation system
 */
export class MetricsCollector {
    performanceTracker;
    logger; // TODO: Type when logger is configured
    // Metric definitions and collection state
    metricDefinitions = new Map();
    collectionTimers = new Map();
    lastCollectionTime = new Map();
    // Active agents to monitor
    monitoredAgents = new Set();
    // Collected metrics buffer
    metricsBuffer = [];
    maxBufferSize = 10000;
    // Aggregation state
    aggregationTimer;
    aggregationInterval = 60000; // 1 minute
    aggregatedMetrics = new Map();
    constructor(performanceTracker, logger) {
        this.performanceTracker = performanceTracker;
        this.logger = logger;
        this.setupBuiltInMetrics();
        this.startAggregation();
    }
    // ============================================================================
    // METRIC DEFINITION MANAGEMENT
    // ============================================================================
    /**
     * Register a custom metric
     */
    registerMetric(definition) {
        this.metricDefinitions.set(definition.name, definition);
        if (definition.enabled) {
            this.startMetricCollection(definition.name);
        }
        this.logger?.info('Metric registered', {
            name: definition.name,
            category: definition.category,
            interval: definition.interval,
            enabled: definition.enabled,
        });
    }
    /**
     * Unregister a metric
     */
    unregisterMetric(name) {
        this.stopMetricCollection(name);
        const removed = this.metricDefinitions.delete(name);
        if (removed) {
            this.logger?.info('Metric unregistered', { name });
        }
        return removed;
    }
    /**
     * Enable metric collection
     */
    enableMetric(name) {
        const definition = this.metricDefinitions.get(name);
        if (!definition)
            return false;
        const updatedDefinition = {
            ...definition,
            enabled: true,
        };
        this.metricDefinitions.set(name, updatedDefinition);
        this.startMetricCollection(name);
        this.logger?.info('Metric enabled', { name });
        return true;
    }
    /**
     * Disable metric collection
     */
    disableMetric(name) {
        const definition = this.metricDefinitions.get(name);
        if (!definition)
            return false;
        const updatedDefinition = {
            ...definition,
            enabled: false,
        };
        this.metricDefinitions.set(name, updatedDefinition);
        this.stopMetricCollection(name);
        this.logger?.info('Metric disabled', { name });
        return true;
    }
    // ============================================================================
    // AGENT MONITORING
    // ============================================================================
    /**
     * Add agent to monitoring
     */
    addAgent(agentId) {
        if (this.monitoredAgents.has(agentId))
            return;
        this.monitoredAgents.add(agentId);
        this.logger?.info('Agent added to metrics monitoring', { agentId });
        // Trigger initial collection for all enabled metrics
        this.triggerInitialCollection(agentId);
    }
    /**
     * Remove agent from monitoring
     */
    removeAgent(agentId) {
        const removed = this.monitoredAgents.delete(agentId);
        if (removed) {
            this.logger?.info('Agent removed from metrics monitoring', { agentId });
        }
        return removed;
    }
    /**
     * Get monitored agents
     */
    getMonitoredAgents() {
        return Array.from(this.monitoredAgents);
    }
    // ============================================================================
    // METRIC COLLECTION
    // ============================================================================
    /**
     * Start collection for a specific metric
     */
    startMetricCollection(metricName) {
        const definition = this.metricDefinitions.get(metricName);
        if (!definition || !definition.enabled)
            return;
        // Clear existing timer if any
        this.stopMetricCollection(metricName);
        // Start new collection timer
        const timer = setInterval(() => {
            this.collectMetricForAllAgents(metricName);
        }, definition.interval);
        this.collectionTimers.set(metricName, timer);
        this.logger?.debug('Started metric collection', { metricName, interval: definition.interval });
    }
    /**
     * Stop collection for a specific metric
     */
    stopMetricCollection(metricName) {
        const timer = this.collectionTimers.get(metricName);
        if (timer) {
            clearInterval(timer);
            this.collectionTimers.delete(metricName);
            this.logger?.debug('Stopped metric collection', { metricName });
        }
    }
    /**
     * Collect a metric for all monitored agents
     */
    async collectMetricForAllAgents(metricName) {
        const definition = this.metricDefinitions.get(metricName);
        if (!definition || !definition.enabled)
            return;
        const collectionPromises = Array.from(this.monitoredAgents).map(agentId => this.collectMetricForAgent(metricName, agentId));
        await Promise.allSettled(collectionPromises);
        this.lastCollectionTime.set(metricName, new Date());
    }
    /**
     * Collect a metric for a specific agent
     */
    async collectMetricForAgent(metricName, agentId) {
        const definition = this.metricDefinitions.get(metricName);
        if (!definition || !definition.enabled)
            return;
        try {
            const context = this.buildCollectionContext(agentId);
            const value = await definition.collector(agentId, context);
            if (value !== null && typeof value === 'number' && !isNaN(value)) {
                const metric = {
                    name: metricName,
                    value,
                    unit: definition.unit,
                    timestamp: new Date(),
                    agentId,
                    context,
                    tags: definition.tags,
                };
                this.recordMetric(metric);
            }
        }
        catch (error) {
            this.logger?.warn('Failed to collect metric', {
                metricName,
                agentId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Record a collected metric
     */
    recordMetric(metric) {
        // Add to buffer
        this.metricsBuffer.push(metric);
        // Trim buffer if needed
        if (this.metricsBuffer.length > this.maxBufferSize) {
            this.metricsBuffer.splice(0, this.metricsBuffer.length - this.maxBufferSize);
        }
        // Record in performance tracker
        this.performanceTracker.recordMeasurement(metric.agentId, metric.name, metric.value, metric.unit, metric.context, metric.sessionId, metric.taskId, metric.tags);
        this.logger?.debug('Metric recorded', {
            name: metric.name,
            value: metric.value,
            unit: metric.unit,
            agentId: metric.agentId,
        });
    }
    /**
     * Build collection context for an agent
     */
    buildCollectionContext(agentId) {
        return {
            agentId,
            timestamp: new Date().toISOString(),
            collector: 'metrics-collector',
        };
    }
    /**
     * Trigger initial collection for a new agent
     */
    triggerInitialCollection(agentId) {
        // Collect all enabled metrics immediately for the new agent
        for (const [metricName, definition] of this.metricDefinitions.entries()) {
            if (definition.enabled) {
                this.collectMetricForAgent(metricName, agentId);
            }
        }
    }
    // ============================================================================
    // METRIC AGGREGATION
    // ============================================================================
    /**
     * Start periodic aggregation
     */
    startAggregation() {
        this.aggregationTimer = setInterval(() => {
            this.performAggregation();
        }, this.aggregationInterval);
        this.logger?.info('Started metrics aggregation', {
            interval: this.aggregationInterval,
        });
    }
    /**
     * Perform metric aggregation
     */
    performAggregation() {
        const now = new Date();
        const windowStart = new Date(now.getTime() - this.aggregationInterval);
        // Get metrics from the time window
        const windowMetrics = this.metricsBuffer.filter(m => m.timestamp >= windowStart && m.timestamp <= now);
        if (windowMetrics.length === 0)
            return;
        // Group by agent and metric name
        const groupedMetrics = this.groupMetrics(windowMetrics);
        // Calculate aggregations for each group
        for (const [groupKey, metrics] of groupedMetrics.entries()) {
            const aggregated = this.calculateAggregation(metrics, windowStart, now);
            this.aggregatedMetrics.set(groupKey, aggregated);
        }
        // Cleanup old aggregations
        this.cleanupOldAggregations();
        this.logger?.debug('Metrics aggregation completed', {
            windowMetrics: windowMetrics.length,
            aggregatedGroups: groupedMetrics.size,
        });
    }
    /**
     * Group metrics by agent and type
     */
    groupMetrics(metrics) {
        const grouped = new Map();
        for (const metric of metrics) {
            // Create grouping keys for different aggregation levels
            const agentKey = `${metric.agentId}_${metric.name}`;
            const globalKey = `global_${metric.name}`;
            // Agent-specific aggregation
            if (!grouped.has(agentKey)) {
                grouped.set(agentKey, []);
            }
            grouped.get(agentKey).push(metric);
            // Global aggregation
            if (!grouped.has(globalKey)) {
                grouped.set(globalKey, []);
            }
            grouped.get(globalKey).push(metric);
        }
        return grouped;
    }
    /**
     * Calculate aggregation for a group of metrics
     */
    calculateAggregation(metrics, windowStart, windowEnd) {
        const values = metrics.map(m => m.value);
        const sortedValues = [...values].sort((a, b) => a - b);
        const count = values.length;
        const sum = values.reduce((acc, val) => acc + val, 0);
        const avg = sum / count;
        const min = sortedValues[0];
        const max = sortedValues[sortedValues.length - 1];
        // Calculate standard deviation
        const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / count;
        const stdDev = Math.sqrt(variance);
        // Calculate percentiles
        const percentiles = {
            p50: this.calculatePercentile(sortedValues, 50),
            p90: this.calculatePercentile(sortedValues, 90),
            p95: this.calculatePercentile(sortedValues, 95),
            p99: this.calculatePercentile(sortedValues, 99),
        };
        // Extract agent ID if this is agent-specific aggregation
        const agentId = metrics[0].agentId;
        const metricName = metrics[0].name;
        // Collect all unique tags
        const allTags = new Set();
        metrics.forEach(m => m.tags.forEach(tag => allTags.add(tag)));
        return {
            timeWindow: {
                start: windowStart,
                end: windowEnd,
                duration: windowEnd.getTime() - windowStart.getTime(),
            },
            agentId,
            metrics: {
                [metricName]: {
                    count,
                    sum,
                    avg,
                    min,
                    max,
                    stdDev,
                    percentiles,
                },
            },
            tags: Array.from(allTags),
        };
    }
    /**
     * Calculate percentile value
     */
    calculatePercentile(sortedValues, percentile) {
        if (sortedValues.length === 0)
            return 0;
        const index = (percentile / 100) * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) {
            return sortedValues[lower];
        }
        const weight = index - lower;
        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }
    /**
     * Cleanup old aggregations
     */
    cleanupOldAggregations() {
        const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours
        let removedCount = 0;
        for (const [key, aggregation] of this.aggregatedMetrics.entries()) {
            if (aggregation.timeWindow.end < cutoffTime) {
                this.aggregatedMetrics.delete(key);
                removedCount++;
            }
        }
        if (removedCount > 0) {
            this.logger?.debug('Cleaned up old aggregations', { removedCount });
        }
    }
    // ============================================================================
    // BUILT-IN METRICS SETUP
    // ============================================================================
    /**
     * Setup built-in metrics
     */
    setupBuiltInMetrics() {
        const builtInMetrics = [
            {
                name: 'response_time',
                description: 'Average response time for agent operations',
                unit: 'ms',
                category: 'performance',
                collector: BuiltInCollectors.responseTime,
                interval: 30000, // 30 seconds
                enabled: true,
                tags: ['performance', 'latency'],
            },
            {
                name: 'cpu_usage',
                description: 'CPU usage percentage',
                unit: '%',
                category: 'resource',
                collector: BuiltInCollectors.cpuUsage,
                interval: 15000, // 15 seconds
                enabled: true,
                tags: ['resource', 'system'],
            },
            {
                name: 'memory_usage',
                description: 'Memory usage in bytes',
                unit: 'bytes',
                category: 'resource',
                collector: BuiltInCollectors.memoryUsage,
                interval: 15000, // 15 seconds
                enabled: true,
                tags: ['resource', 'system'],
            },
            {
                name: 'task_completion_rate',
                description: 'Rate of successful task completions',
                unit: 'rate',
                category: 'performance',
                collector: BuiltInCollectors.taskCompletionRate,
                interval: 60000, // 1 minute
                enabled: true,
                tags: ['performance', 'success'],
            },
            {
                name: 'error_rate',
                description: 'Number of errors per minute',
                unit: 'errors/min',
                category: 'performance',
                collector: BuiltInCollectors.errorRate,
                interval: 30000, // 30 seconds
                enabled: true,
                tags: ['performance', 'errors'],
            },
            {
                name: 'learning_progress',
                description: 'Rate of learning improvement',
                unit: 'rate',
                category: 'behavior',
                collector: BuiltInCollectors.learningProgress,
                interval: 300000, // 5 minutes
                enabled: true,
                tags: ['behavior', 'learning'],
            },
            {
                name: 'collaboration_score',
                description: 'Effectiveness of agent collaboration',
                unit: 'score',
                category: 'behavior',
                collector: BuiltInCollectors.collaborationScore,
                interval: 120000, // 2 minutes
                enabled: true,
                tags: ['behavior', 'collaboration'],
            },
            {
                name: 'throughput',
                description: 'Number of tasks processed per minute',
                unit: 'tasks/min',
                category: 'performance',
                collector: BuiltInCollectors.throughput,
                interval: 60000, // 1 minute
                enabled: true,
                tags: ['performance', 'throughput'],
            },
            {
                name: 'quality_score',
                description: 'Quality assessment of agent output',
                unit: 'score',
                category: 'business',
                collector: BuiltInCollectors.qualityScore,
                interval: 180000, // 3 minutes
                enabled: true,
                tags: ['business', 'quality'],
            },
            {
                name: 'resource_efficiency',
                description: 'Efficiency of resource utilization',
                unit: 'efficiency',
                category: 'resource',
                collector: BuiltInCollectors.resourceEfficiency,
                interval: 45000, // 45 seconds
                enabled: true,
                tags: ['resource', 'efficiency'],
            },
        ];
        // Register all built-in metrics
        builtInMetrics.forEach(metric => {
            this.registerMetric(metric);
        });
        this.logger?.info('Built-in metrics registered', {
            count: builtInMetrics.length,
        });
    }
    // ============================================================================
    // PUBLIC API
    // ============================================================================
    /**
     * Get all metric definitions
     */
    getAllMetricDefinitions() {
        return Array.from(this.metricDefinitions.values());
    }
    /**
     * Get metric definition by name
     */
    getMetricDefinition(name) {
        return this.metricDefinitions.get(name);
    }
    /**
     * Get recent metrics for an agent
     */
    getRecentMetrics(agentId, limit = 100) {
        return this.metricsBuffer
            .filter(m => m.agentId === agentId)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    /**
     * Get aggregated metrics
     */
    getAggregatedMetrics(agentId, metricName) {
        return Array.from(this.aggregatedMetrics.values())
            .filter(agg => !agentId || agg.agentId === agentId)
            .filter(agg => !metricName || Object.keys(agg.metrics).includes(metricName));
    }
    /**
     * Force metric collection for all agents
     */
    forceCollection() {
        for (const metricName of this.metricDefinitions.keys()) {
            this.collectMetricForAllAgents(metricName);
        }
    }
    /**
     * Get collection statistics
     */
    getStats() {
        return {
            registeredMetrics: this.metricDefinitions.size,
            enabledMetrics: Array.from(this.metricDefinitions.values()).filter(m => m.enabled).length,
            monitoredAgents: this.monitoredAgents.size,
            metricsInBuffer: this.metricsBuffer.length,
            aggregations: this.aggregatedMetrics.size,
            activeTimers: this.collectionTimers.size,
        };
    }
    /**
     * Shutdown metrics collection
     */
    shutdown() {
        // Stop all collection timers
        for (const timer of this.collectionTimers.values()) {
            clearInterval(timer);
        }
        this.collectionTimers.clear();
        // Stop aggregation timer
        if (this.aggregationTimer) {
            clearInterval(this.aggregationTimer);
        }
        // Clear data
        this.metricDefinitions.clear();
        this.monitoredAgents.clear();
        this.metricsBuffer.length = 0;
        this.aggregatedMetrics.clear();
        this.lastCollectionTime.clear();
        this.logger?.info('Metrics collector shutdown complete');
    }
}
//# sourceMappingURL=metrics-collector.js.map