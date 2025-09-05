/**
 * Real-time Evolution Metrics Service for Sentra Evolutionary Agent System
 *
 * This service provides real-time monitoring and metrics collection for DNA evolution,
 * cross-project learning, and agent performance across the system.
 *
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import { EventEmitter } from 'events';
export const EvolutionMetricType = {
    // DNA Evolution Metrics
    FITNESS_SCORE: 'fitness_score',
    GENERATION_COUNT: 'generation_count',
    MUTATION_RATE: 'mutation_rate',
    EVOLUTION_SUCCESS_RATE: 'evolution_success_rate',
    // Performance Metrics
    TASK_SUCCESS_RATE: 'task_success_rate',
    COMPLETION_TIME: 'completion_time',
    CODE_QUALITY: 'code_quality',
    ERROR_RECOVERY: 'error_recovery',
    // Learning Metrics
    ADAPTATION_SPEED: 'adaptation_speed',
    KNOWLEDGE_RETENTION: 'knowledge_retention',
    CROSS_DOMAIN_TRANSFER: 'cross_domain_transfer',
    PATTERN_RECOGNITION: 'pattern_recognition',
    // System Metrics
    ACTIVE_AGENTS: 'active_agents',
    TOTAL_PATTERNS: 'total_patterns',
    DIVERSITY_INDEX: 'diversity_index',
    CROSS_PROJECT_TRANSFERS: 'cross_project_transfers',
    // Collaboration Metrics
    TEAM_INTEGRATION: 'team_integration',
    COMMUNICATION_EFFECTIVENESS: 'communication_effectiveness',
    CONFLICT_RESOLUTION: 'conflict_resolution',
    // Resource Metrics
    COMPUTATIONAL_EFFICIENCY: 'computational_efficiency',
    MEMORY_USAGE: 'memory_usage',
    RESPONSE_LATENCY: 'response_latency',
    THROUGHPUT: 'throughput',
};
// ============================================================================
// METRICS SERVICE
// ============================================================================
export class EvolutionMetricsService extends EventEmitter {
    config;
    rawMetrics = [];
    aggregatedMetrics = new Map();
    alertHistory = new Map();
    metricsTimer;
    aggregationTimer;
    cleanupTimer;
    constructor(config = {}) {
        super();
        this.config = {
            retention: {
                raw: 24 * 60 * 60 * 1000, // 24 hours
                hourly: 7 * 24 * 60 * 60 * 1000, // 7 days
                daily: 30 * 24 * 60 * 60 * 1000, // 30 days
                ...config.retention,
            },
            aggregation: {
                enabled: true,
                intervals: [60 * 60 * 1000, 24 * 60 * 60 * 1000], // hourly, daily
                batchSize: 1000,
                ...config.aggregation,
            },
            alerts: {
                enabled: true,
                thresholds: {
                    fitness_score: { min: 0.3 },
                    evolution_success_rate: { min: 0.5 },
                    task_success_rate: { min: 0.6 },
                    error_recovery: { min: 0.4 },
                    diversity_index: { min: 0.2 },
                    ...config.alerts?.thresholds,
                },
                suppressionTime: 5 * 60 * 1000, // 5 minutes
                ...config.alerts,
            },
            realtime: {
                enabled: true,
                updateInterval: 5000, // 5 seconds
                maxDataPoints: 1000,
                ...config.realtime,
            },
        };
        this.startTimers();
    }
    /**
     * Record a new evolution metric point
     */
    recordMetric(metricType, value, context) {
        const metricPoint = {
            id: `metric_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            timestamp: new Date(),
            metricType,
            value,
            ...(context?.agentId && { agentId: context.agentId }),
            ...(context?.projectId && { projectId: context.projectId }),
            ...(context?.dnaId && { dnaId: context.dnaId }),
            ...(context?.taskId && { taskId: context.taskId }),
            metadata: context?.metadata ?? {},
        };
        this.rawMetrics.push(metricPoint);
        // Check for alerts
        if (this.config.alerts.enabled) {
            this.checkAlerts(metricPoint);
        }
        // Emit real-time event
        this.emit('metric_recorded', metricPoint);
        return metricPoint.id;
    }
    /**
     * Record DNA evolution event metrics
     */
    recordEvolutionEvent(agentId, dnaId, parentDnaId, projectId, fitnessImprovement, generation, evolutionType) {
        this.recordMetric(EvolutionMetricType.FITNESS_SCORE, fitnessImprovement, {
            agentId,
            projectId,
            dnaId,
            metadata: { parentDnaId, evolutionType },
        });
        this.recordMetric(EvolutionMetricType.GENERATION_COUNT, generation, {
            agentId,
            projectId,
            dnaId,
        });
        // Record evolution success (improvement > 0)
        this.recordMetric(EvolutionMetricType.EVOLUTION_SUCCESS_RATE, fitnessImprovement > 0 ? 1 : 0, {
            agentId,
            projectId,
            dnaId,
        });
        this.emit('evolution_recorded', {
            agentId,
            dnaId,
            parentDnaId,
            projectId,
            fitnessImprovement,
            generation,
            evolutionType,
        });
    }
    /**
     * Record agent performance metrics
     */
    recordAgentPerformance(agentId, dnaId, projectId, taskId, performance) {
        const context = { agentId, projectId, dnaId, taskId };
        // Record key performance metrics
        this.recordMetric(EvolutionMetricType.TASK_SUCCESS_RATE, performance.successRate, context);
        this.recordMetric(EvolutionMetricType.COMPLETION_TIME, performance.averageTaskCompletionTime, context);
        this.recordMetric(EvolutionMetricType.CODE_QUALITY, performance.codeQualityScore, context);
        this.recordMetric(EvolutionMetricType.ERROR_RECOVERY, performance.errorRecoveryRate, context);
        this.recordMetric(EvolutionMetricType.ADAPTATION_SPEED, performance.adaptationSpeed, context);
        this.recordMetric(EvolutionMetricType.KNOWLEDGE_RETENTION, performance.knowledgeRetention, context);
        this.recordMetric(EvolutionMetricType.CROSS_DOMAIN_TRANSFER, performance.crossDomainTransfer, context);
        this.recordMetric(EvolutionMetricType.COMPUTATIONAL_EFFICIENCY, performance.computationalEfficiency, context);
        this.recordMetric(EvolutionMetricType.RESPONSE_LATENCY, performance.responseLatency, context);
        this.recordMetric(EvolutionMetricType.THROUGHPUT, performance.throughput, context);
        this.recordMetric(EvolutionMetricType.TEAM_INTEGRATION, performance.teamIntegration, context);
        this.recordMetric(EvolutionMetricType.COMMUNICATION_EFFECTIVENESS, performance.communicationEffectiveness, context);
        this.emit('performance_recorded', { agentId, dnaId, projectId, taskId, performance });
    }
    /**
     * Record system-level metrics
     */
    recordSystemMetrics(activeAgents, totalPatterns, diversityIndex, crossProjectTransfers) {
        this.recordMetric(EvolutionMetricType.ACTIVE_AGENTS, activeAgents);
        this.recordMetric(EvolutionMetricType.TOTAL_PATTERNS, totalPatterns);
        this.recordMetric(EvolutionMetricType.DIVERSITY_INDEX, diversityIndex);
        this.recordMetric(EvolutionMetricType.CROSS_PROJECT_TRANSFERS, crossProjectTransfers);
        this.emit('system_metrics_recorded', {
            activeAgents,
            totalPatterns,
            diversityIndex,
            crossProjectTransfers,
        });
    }
    /**
     * Get metrics within a time range
     */
    getMetrics(metricType, startTime, endTime, filters) {
        return this.rawMetrics.filter(metric => {
            if (metric.metricType !== metricType)
                return false;
            if (metric.timestamp < startTime || metric.timestamp > endTime)
                return false;
            if (filters?.agentId && metric.agentId !== filters.agentId)
                return false;
            if (filters?.projectId && metric.projectId !== filters.projectId)
                return false;
            if (filters?.dnaId && metric.dnaId !== filters.dnaId)
                return false;
            return true;
        });
    }
    /**
     * Get aggregated metrics
     */
    getAggregatedMetrics(metricType, timeWindow, aggregationType) {
        const key = `${metricType}_${timeWindow}_${aggregationType}`;
        return this.aggregatedMetrics.get(key) ?? [];
    }
    /**
     * Calculate evolution trends
     */
    calculateTrends(metricTypes, timeSpan = 60 * 60 * 1000 // 1 hour
    ) {
        const trends = [];
        const now = new Date();
        const startTime = new Date(now.getTime() - timeSpan);
        for (const metricType of metricTypes) {
            const metrics = this.getMetrics(metricType, startTime, now);
            if (metrics.length < 2)
                continue;
            const trend = this.calculateTrend(metrics, timeSpan);
            if (trend) {
                trends.push(trend);
            }
        }
        return trends;
    }
    /**
     * Get real-time dashboard data
     */
    generateDashboard() {
        const now = new Date();
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        // Calculate overview metrics
        const recentMetrics = this.rawMetrics.filter(m => m.timestamp > hourAgo);
        const activeAgentsMetric = this.getLatestMetric(EvolutionMetricType.ACTIVE_AGENTS);
        // const totalPatternsMetric = this.getLatestMetric(EvolutionMetricType.TOTAL_PATTERNS);
        const diversityMetric = this.getLatestMetric(EvolutionMetricType.DIVERSITY_INDEX);
        const transfersMetric = this.getLatestMetric(EvolutionMetricType.CROSS_PROJECT_TRANSFERS);
        // Get fitness metrics for average
        const fitnessMetrics = recentMetrics.filter(m => m.metricType === EvolutionMetricType.FITNESS_SCORE);
        const avgFitness = fitnessMetrics.length > 0
            ? fitnessMetrics.reduce((sum, m) => sum + m.value, 0) / fitnessMetrics.length
            : 0;
        // Get evolution counts
        const evolutionMetrics = recentMetrics.filter(m => m.metricType === EvolutionMetricType.EVOLUTION_SUCCESS_RATE);
        const activeEvolutions = evolutionMetrics.length;
        // Get top performers (mock data - would query from database in production)
        const topPerformers = this.getTopPerformers();
        // Get recent evolutions
        const recentEvolutions = this.getRecentEvolutions();
        // Calculate trends
        const trends = this.calculateTrends([
            EvolutionMetricType.FITNESS_SCORE,
            EvolutionMetricType.TASK_SUCCESS_RATE,
            EvolutionMetricType.DIVERSITY_INDEX,
            EvolutionMetricType.EVOLUTION_SUCCESS_RATE,
        ]);
        // Get active alerts
        const alerts = this.getActiveAlerts();
        // Get project breakdown
        const projectBreakdown = this.getProjectBreakdown();
        return {
            timestamp: now,
            overview: {
                totalAgents: activeAgentsMetric?.value ?? 0,
                activeEvolutions,
                avgFitness,
                diversityIndex: diversityMetric?.value ?? 0,
                crossProjectTransfers: transfersMetric?.value ?? 0,
            },
            topPerformers,
            recentEvolutions,
            trends,
            alerts,
            projectBreakdown,
        };
    }
    /**
     * Get evolution health score (0-1)
     */
    getSystemHealthScore() {
        const weights = {
            averageFitness: 0.3,
            evolutionSuccessRate: 0.25,
            diversityIndex: 0.2,
            taskSuccessRate: 0.25,
        };
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        // Get recent metrics
        const fitnessMetrics = this.rawMetrics
            .filter(m => m.metricType === EvolutionMetricType.FITNESS_SCORE && m.timestamp > hourAgo)
            .map(m => m.value);
        const evolutionSuccessMetrics = this.rawMetrics
            .filter(m => m.metricType === EvolutionMetricType.EVOLUTION_SUCCESS_RATE && m.timestamp > hourAgo)
            .map(m => m.value);
        const diversityMetrics = this.rawMetrics
            .filter(m => m.metricType === EvolutionMetricType.DIVERSITY_INDEX && m.timestamp > hourAgo)
            .map(m => m.value);
        const taskSuccessMetrics = this.rawMetrics
            .filter(m => m.metricType === EvolutionMetricType.TASK_SUCCESS_RATE && m.timestamp > hourAgo)
            .map(m => m.value);
        // Calculate averages
        const avgFitness = fitnessMetrics.length > 0
            ? fitnessMetrics.reduce((sum, val) => sum + val, 0) / fitnessMetrics.length
            : 0.5;
        const avgEvolutionSuccess = evolutionSuccessMetrics.length > 0
            ? evolutionSuccessMetrics.reduce((sum, val) => sum + val, 0) / evolutionSuccessMetrics.length
            : 0.5;
        const avgDiversity = diversityMetrics.length > 0
            ? diversityMetrics.reduce((sum, val) => sum + val, 0) / diversityMetrics.length
            : 0.3;
        const avgTaskSuccess = taskSuccessMetrics.length > 0
            ? taskSuccessMetrics.reduce((sum, val) => sum + val, 0) / taskSuccessMetrics.length
            : 0.7;
        // Calculate weighted health score
        const healthScore = (avgFitness * weights.averageFitness +
            avgEvolutionSuccess * weights.evolutionSuccessRate +
            avgDiversity * weights.diversityIndex +
            avgTaskSuccess * weights.taskSuccessRate);
        return Math.max(0, Math.min(1, healthScore));
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    startTimers() {
        if (this.config.realtime.enabled) {
            this.metricsTimer = setInterval(() => {
                this.emit('dashboard_update', this.generateDashboard());
            }, this.config.realtime.updateInterval);
        }
        if (this.config.aggregation.enabled) {
            this.aggregationTimer = setInterval(() => {
                this.performAggregation();
            }, 60 * 1000); // Run every minute
        }
        // Cleanup old metrics every hour
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, 60 * 60 * 1000);
    }
    checkAlerts(metric) {
        const threshold = this.config.alerts.thresholds[metric.metricType];
        if (!threshold)
            return;
        let alertTriggered = false;
        let alertMessage = '';
        if (threshold.min !== undefined && metric.value < threshold.min) {
            alertTriggered = true;
            alertMessage = `${metric.metricType} below minimum threshold: ${metric.value} < ${threshold.min}`;
        }
        else if (threshold.max !== undefined && metric.value > threshold.max) {
            alertTriggered = true;
            alertMessage = `${metric.metricType} above maximum threshold: ${metric.value} > ${threshold.max}`;
        }
        if (alertTriggered) {
            const alertKey = `${metric.metricType}_${metric.agentId || 'system'}_${metric.projectId || 'global'}`;
            const lastAlert = this.alertHistory.get(alertKey);
            // Suppress frequent alerts
            if (!lastAlert || Date.now() - lastAlert.getTime() > this.config.alerts.suppressionTime) {
                const alert = {
                    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                    timestamp: new Date(),
                    severity: this.determineSeverity(metric.metricType, metric.value, threshold),
                    metricType: metric.metricType,
                    message: alertMessage,
                    threshold: threshold.min ?? threshold.max ?? 0,
                    actualValue: metric.value,
                    ...(metric.projectId && { projectId: metric.projectId }),
                    ...(metric.agentId && { agentId: metric.agentId }),
                    ...(metric.dnaId && { dnaId: metric.dnaId }),
                    recommended_actions: this.getRecommendedActions(metric.metricType, metric.value, threshold),
                };
                this.alertHistory.set(alertKey, new Date());
                this.emit('alert', alert);
            }
        }
    }
    determineSeverity(metricType, value, threshold) {
        const criticalMetrics = [
            EvolutionMetricType.TASK_SUCCESS_RATE,
            EvolutionMetricType.ERROR_RECOVERY,
            EvolutionMetricType.FITNESS_SCORE,
        ];
        const deviation = threshold.min
            ? (threshold.min - value) / threshold.min
            : threshold.max
                ? (value - threshold.max) / threshold.max
                : 0;
        if (criticalMetrics.includes(metricType) && Math.abs(deviation) > 0.5) {
            return 'critical';
        }
        else if (Math.abs(deviation) > 0.3) {
            return 'error';
        }
        else if (Math.abs(deviation) > 0.1) {
            return 'warning';
        }
        else {
            return 'info';
        }
    }
    getRecommendedActions(metricType, value, threshold) {
        const actions = [];
        switch (metricType) {
            case EvolutionMetricType.FITNESS_SCORE:
                if (threshold.min && value < threshold.min) {
                    actions.push('Increase mutation rate to explore new solutions');
                    actions.push('Review genetic markers for optimization opportunities');
                    actions.push('Consider crossover with high-performing patterns');
                }
                break;
            case EvolutionMetricType.TASK_SUCCESS_RATE:
                if (threshold.min && value < threshold.min) {
                    actions.push('Analyze failed tasks for common patterns');
                    actions.push('Adjust genetic markers for better task handling');
                    actions.push('Consider additional training data');
                }
                break;
            case EvolutionMetricType.DIVERSITY_INDEX:
                if (threshold.min && value < threshold.min) {
                    actions.push('Increase genetic diversity through mutation');
                    actions.push('Introduce new pattern types');
                    actions.push('Reduce selection pressure temporarily');
                }
                break;
            case EvolutionMetricType.ERROR_RECOVERY:
                if (threshold.min && value < threshold.min) {
                    actions.push('Enhance error handling genetic markers');
                    actions.push('Review and improve error recovery patterns');
                    actions.push('Increase error recovery training scenarios');
                }
                break;
            default:
                actions.push('Review system configuration and thresholds');
                actions.push('Monitor related metrics for additional insights');
        }
        return actions;
    }
    calculateTrend(metrics, timeSpan) {
        if (metrics.length < 2)
            return null;
        // Sort by timestamp
        const sortedMetrics = [...metrics].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        // Simple linear regression
        const n = sortedMetrics.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        const startTime = sortedMetrics[0].timestamp.getTime();
        for (let i = 0; i < n; i++) {
            const x = (sortedMetrics[i].timestamp.getTime() - startTime) / 1000; // seconds
            const y = sortedMetrics[i].value;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const ratePerHour = slope * 3600; // convert to per hour
        // Calculate R-squared for confidence
        const meanY = sumY / n;
        let totalSumSquares = 0, residualSumSquares = 0;
        for (let i = 0; i < n; i++) {
            const x = (sortedMetrics[i].timestamp.getTime() - startTime) / 1000;
            const actualY = sortedMetrics[i].value;
            const predictedY = (slope * x) + (sumY - slope * sumX) / n;
            totalSumSquares += (actualY - meanY) ** 2;
            residualSumSquares += (actualY - predictedY) ** 2;
        }
        const rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
        const confidence = Math.max(0, Math.min(1, rSquared));
        // Determine direction and significance
        let direction;
        if (Math.abs(ratePerHour) < 0.001) {
            direction = 'stable';
        }
        else if (ratePerHour > 0) {
            direction = 'increasing';
        }
        else {
            direction = 'decreasing';
        }
        let significance;
        if (confidence > 0.7 && Math.abs(ratePerHour) > 0.01) {
            significance = 'high';
        }
        else if (confidence > 0.4 && Math.abs(ratePerHour) > 0.005) {
            significance = 'medium';
        }
        else {
            significance = 'low';
        }
        return {
            metricType: sortedMetrics[0].metricType,
            direction,
            rate: ratePerHour,
            confidence,
            significance,
            dataPoints: n,
            timeSpan,
        };
    }
    getLatestMetric(metricType) {
        const metrics = this.rawMetrics
            .filter(m => m.metricType === metricType)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return metrics[0];
    }
    getTopPerformers() {
        // Mock implementation - would query from database in production
        const recentFitnessMetrics = this.rawMetrics
            .filter(m => m.metricType === EvolutionMetricType.FITNESS_SCORE)
            .filter(m => m.agentId && m.dnaId)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        return recentFitnessMetrics.map(metric => ({
            agentId: metric.agentId,
            dnaId: metric.dnaId,
            fitness: metric.value,
            generation: metric.metadata['generation'] ?? 1,
            projectContext: metric.metadata['projectType'] ?? 'Unknown',
        }));
    }
    getRecentEvolutions() {
        // Mock implementation - would query from database in production
        const recentEvolutions = this.rawMetrics
            .filter(m => m.metricType === EvolutionMetricType.EVOLUTION_SUCCESS_RATE)
            .filter(m => m.agentId && m.dnaId)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);
        return recentEvolutions.map(metric => ({
            agentId: metric.agentId,
            dnaId: metric.dnaId,
            parentDnaId: metric.metadata['parentDnaId'] ?? undefined,
            fitnessImprovement: metric.value,
            timestamp: metric.timestamp,
            evolutionType: metric.metadata['evolutionType'] ?? 'mutation',
        }));
    }
    getActiveAlerts() {
        // Return recent alerts - would query from database in production
        // For now, return empty array as alerts are emitted in real-time
        return [];
    }
    getProjectBreakdown() {
        // Mock implementation - would query from database in production
        const projectMetrics = new Map();
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        this.rawMetrics
            .filter(m => m.timestamp > hourAgo && m.projectId)
            .forEach(metric => {
            const existing = projectMetrics.get(metric.projectId) ?? {
                agents: new Set(),
                fitnessSum: 0,
                fitnessCount: 0,
                activity: 0,
            };
            if (metric.agentId)
                existing.agents.add(metric.agentId);
            if (metric.metricType === EvolutionMetricType.FITNESS_SCORE) {
                existing.fitnessSum += metric.value;
                existing.fitnessCount++;
            }
            existing.activity++;
            projectMetrics.set(metric.projectId, existing);
        });
        return Array.from(projectMetrics.entries()).map(([projectId, data]) => ({
            projectId,
            name: `Project ${projectId.slice(-8)}`, // Mock name
            activeAgents: data.agents.size,
            avgFitness: data.fitnessCount > 0 ? data.fitnessSum / data.fitnessCount : 0,
            recentActivity: data.activity,
        }));
    }
    performAggregation() {
        // Implementation would aggregate raw metrics into hourly/daily summaries
        // For brevity, this is simplified
        console.log('Performing metrics aggregation...');
    }
    cleanup() {
        const now = Date.now();
        const rawRetentionTime = now - this.config.retention.raw;
        // Remove old raw metrics
        const initialLength = this.rawMetrics.length;
        for (let i = this.rawMetrics.length - 1; i >= 0; i--) {
            if (this.rawMetrics[i].timestamp.getTime() < rawRetentionTime) {
                this.rawMetrics.splice(i, 1);
            }
        }
        const removed = initialLength - this.rawMetrics.length;
        if (removed > 0) {
            console.log(`Cleaned up ${removed} old metric points`);
        }
        // Clean up alert history
        const alertSuppressionTime = now - this.config.alerts.suppressionTime * 2;
        for (const [key, timestamp] of this.alertHistory.entries()) {
            if (timestamp.getTime() < alertSuppressionTime) {
                this.alertHistory.delete(key);
            }
        }
    }
    /**
     * Stop all timers and clean up
     */
    destroy() {
        if (this.metricsTimer)
            clearInterval(this.metricsTimer);
        if (this.aggregationTimer)
            clearInterval(this.aggregationTimer);
        if (this.cleanupTimer)
            clearInterval(this.cleanupTimer);
        this.removeAllListeners();
    }
}
export default EvolutionMetricsService;
//# sourceMappingURL=metrics-service.js.map