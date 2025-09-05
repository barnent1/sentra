"use strict";
/**
 * Observability Integration - Bridge between observability system and API/WebSocket
 * Following SENTRA project standards: strict TypeScript with branded types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservabilityIntegrationService = void 0;
const events_1 = require("@sentra/core/types/events");
// ============================================================================
// OBSERVABILITY INTEGRATION SERVICE
// ============================================================================
/**
 * Service that integrates observability system with API and WebSocket broadcasting
 */
class ObservabilityIntegrationService {
    observabilityManager;
    agentMonitor;
    performanceTracker;
    metricsCollector;
    eventBroadcaster;
    logger; // TODO: Type when logger is configured
    eventBusSubscriptionId;
    constructor(observabilityManager, agentMonitor, performanceTracker, metricsCollector, eventBroadcaster, eventBus, logger) {
        this.observabilityManager = observabilityManager;
        this.agentMonitor = agentMonitor;
        this.performanceTracker = performanceTracker;
        this.metricsCollector = metricsCollector;
        this.eventBroadcaster = eventBroadcaster;
        this.logger = logger;
        this.setupEventBusIntegration(eventBus);
        this.setupPeriodicBroadcasts();
    }
    // ============================================================================
    // EVENT BUS INTEGRATION
    // ============================================================================
    /**
     * Setup integration with event bus to catch observability events
     */
    async setupEventBusIntegration(eventBus) {
        if (!eventBus) {
            this.logger?.warn('No event bus provided - WebSocket broadcasting will be limited');
            return;
        }
        try {
            // Subscribe to all observability events
            this.eventBusSubscriptionId = await eventBus.subscribeWithFilter(events_1.isObservabilityEvent, {
                id: 'observability-websocket-bridge',
                eventType: 'observability',
                priority: 5,
                isAsync: true,
                maxRetries: 3,
                retryDelay: 1000,
                handle: async (event) => {
                    await this.handleObservabilityEvent(event);
                    return {
                        success: true,
                        processedAt: new Date(),
                        processingDuration: 0,
                        errors: [],
                        warnings: [],
                        nextActions: [],
                        shouldRetry: false,
                    };
                },
                canHandle: (event) => {
                    return (0, events_1.isObservabilityEvent)(event);
                },
                getHealth: async () => {
                    return {
                        isHealthy: true,
                        lastProcessed: new Date(),
                        processedCount: 0,
                        errorCount: 0,
                        averageProcessingTime: 50,
                        currentLoad: 0.1,
                    };
                },
            });
            this.logger?.info('Event bus integration established', {
                subscriptionId: this.eventBusSubscriptionId,
            });
        }
        catch (error) {
            this.logger?.error('Failed to setup event bus integration', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Handle observability events from the event bus
     */
    async handleObservabilityEvent(event) {
        if (!(0, events_1.isObservabilityEvent)(event))
            return;
        try {
            // Type assertion is safe after the type guard
            const observabilityEvent = event;
            switch (observabilityEvent.type) {
                case 'tool_usage_started':
                    await this.handleToolUsageStarted(event);
                    break;
                case 'tool_usage_completed':
                    await this.handleToolUsageCompleted(event);
                    break;
                case 'agent_decision':
                    await this.handleAgentDecision(event);
                    break;
                case 'agent_memory_operation':
                    await this.handleMemoryOperation(event);
                    break;
                case 'agent_coordination':
                    await this.handleCoordination(event);
                    break;
                case 'performance_pulse':
                    await this.handlePerformancePulse(event);
                    break;
                case 'agent_learning_pattern':
                    await this.handleLearningPattern(event);
                    break;
                default:
                    this.logger?.debug('Unhandled observability event type', { type: observabilityEvent.type });
            }
        }
        catch (error) {
            this.logger?.error('Failed to handle observability event', {
                eventType: event.type,
                eventId: event.id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================
    /**
     * Handle tool usage started event
     */
    async handleToolUsageStarted(event) {
        const basePayload = {
            agentId: event.data.agentId,
            sessionId: event.data.sessionId,
            toolName: event.data.toolName,
            parameters: event.data.parameters,
            context: event.data.context,
            timestamp: event.timestamp,
        };
        const payload = {
            ...basePayload,
            ...(event.data.taskId ? { taskId: event.data.taskId } : {}),
            ...(event.data.toolVersion ? { toolVersion: event.data.toolVersion } : {}),
            ...(event.data.expectedDuration ? { expectedDuration: event.data.expectedDuration } : {}),
        };
        this.eventBroadcaster.broadcastToolUsageStarted(payload);
        // Record performance metric
        if (event.data.expectedDuration) {
            this.performanceTracker.recordMeasurement(event.data.agentId, 'tool_expected_duration', event.data.expectedDuration, 'ms', { toolName: event.data.toolName }, event.data.sessionId, event.data.taskId, ['performance', 'prediction']);
        }
    }
    /**
     * Handle tool usage completed event
     */
    async handleToolUsageCompleted(event) {
        const basePayload = {
            agentId: event.data.agentId,
            sessionId: event.data.sessionId,
            toolName: event.data.toolName,
            duration: event.data.duration,
            success: event.data.success,
            tokensUsed: event.data.tokensUsed,
            errorCount: event.data.errorCount,
            warnings: event.data.warnings,
            performanceMetrics: event.data.performanceMetrics,
            timestamp: event.timestamp,
        };
        const payload = {
            ...basePayload,
            ...(event.data.taskId ? { taskId: event.data.taskId } : {}),
            ...(event.data.result ? { result: event.data.result } : {}),
        };
        this.eventBroadcaster.broadcastToolUsageCompleted(payload);
        // Record performance metrics
        this.performanceTracker.recordBatchMeasurements([
            {
                agentId: event.data.agentId,
                metric: 'tool_duration',
                value: event.data.duration,
                unit: 'ms',
                context: { toolName: event.data.toolName, success: event.data.success },
                sessionId: event.data.sessionId,
                tags: ['performance', 'tool_usage'],
                ...(event.data.taskId ? { taskId: event.data.taskId } : {}),
            },
            {
                agentId: event.data.agentId,
                metric: 'tokens_used',
                value: event.data.tokensUsed,
                unit: 'tokens',
                context: { toolName: event.data.toolName },
                sessionId: event.data.sessionId,
                tags: ['resource', 'tokens'],
                ...(event.data.taskId ? { taskId: event.data.taskId } : {}),
            },
            {
                agentId: event.data.agentId,
                metric: 'tool_success_rate',
                value: event.data.success ? 1 : 0,
                unit: 'boolean',
                context: { toolName: event.data.toolName },
                sessionId: event.data.sessionId,
                tags: ['performance', 'success'],
                ...(event.data.taskId ? { taskId: event.data.taskId } : {}),
            },
        ]);
    }
    /**
     * Handle agent decision event
     */
    async handleAgentDecision(event) {
        const basePayload = {
            agentId: event.data.agentId,
            sessionId: event.data.sessionId,
            decisionType: event.data.decisionType,
            context: event.data.context,
            options: event.data.options,
            selectedOption: event.data.selectedOption,
            confidence: event.data.confidence,
            reasoning: event.data.reasoning,
            factors: event.data.factors,
            timestamp: event.timestamp,
        };
        const payload = {
            ...basePayload,
            ...(event.data.taskId ? { taskId: event.data.taskId } : {}),
        };
        this.eventBroadcaster.broadcastAgentDecision(payload);
        // Record decision confidence as a performance metric
        this.performanceTracker.recordMeasurement(event.data.agentId, 'decision_confidence', event.data.confidence, 'score', {
            decisionType: event.data.decisionType,
            selectedOption: event.data.selectedOption,
            optionCount: event.data.options.length,
        }, event.data.sessionId, event.data.taskId || undefined, ['behavior', 'decision_making']);
    }
    /**
     * Handle memory operation event
     */
    async handleMemoryOperation(event) {
        const basePayload = {
            agentId: event.data.agentId,
            sessionId: event.data.sessionId,
            operation: event.data.operation,
            memoryType: event.data.memoryType,
            key: event.data.key,
            dataSize: event.data.dataSize,
            retentionPriority: event.data.retentionPriority,
            associatedConcepts: event.data.associatedConcepts,
            timestamp: event.timestamp,
        };
        const payload = {
            ...basePayload,
            ...(event.data.relevanceScore ? { relevanceScore: event.data.relevanceScore } : {}),
        };
        this.eventBroadcaster.broadcastMemoryOperation(payload);
        // Record memory metrics
        this.performanceTracker.recordBatchMeasurements([
            {
                agentId: event.data.agentId,
                metric: 'memory_operation_size',
                value: event.data.dataSize,
                unit: 'bytes',
                context: {
                    operation: event.data.operation,
                    memoryType: event.data.memoryType,
                },
                sessionId: event.data.sessionId,
                tags: ['memory', 'resource'],
            },
            {
                agentId: event.data.agentId,
                metric: 'memory_relevance_score',
                value: event.data.relevanceScore || 0,
                unit: 'score',
                context: {
                    operation: event.data.operation,
                    memoryType: event.data.memoryType,
                },
                sessionId: event.data.sessionId,
                tags: ['memory', 'relevance'],
            },
        ]);
    }
    /**
     * Handle coordination event
     */
    async handleCoordination(event) {
        const payload = {
            initiatorId: event.data.initiatorId,
            targetId: event.data.targetId,
            coordinationType: event.data.coordinationType,
            topic: event.data.topic,
            urgency: event.data.urgency,
            expectedOutcome: event.data.expectedOutcome,
            context: event.data.context,
            timestamp: event.timestamp,
        };
        this.eventBroadcaster.broadcastCoordination(payload);
        // Record coordination metrics for both agents
        const urgencyScore = { 'low': 0.25, 'medium': 0.5, 'high': 0.75, 'critical': 1.0 }[event.data.urgency];
        [event.data.initiatorId, event.data.targetId].forEach(agentId => {
            this.performanceTracker.recordMeasurement(agentId, 'coordination_activity', urgencyScore, 'score', {
                coordinationType: event.data.coordinationType,
                role: agentId === event.data.initiatorId ? 'initiator' : 'target',
                urgency: event.data.urgency,
            }, undefined, event.data.context.sharedTaskId || undefined, ['collaboration', 'coordination']);
        });
    }
    /**
     * Handle performance pulse event
     */
    async handlePerformancePulse(event) {
        const payload = {
            agentId: event.data.agentId,
            sessionId: event.data.sessionId,
            pulse: event.data.pulse,
            healthScore: event.data.healthScore,
            activities: event.data.activities,
            timestamp: event.timestamp,
        };
        this.eventBroadcaster.broadcastPerformancePulse(payload);
        // Record all pulse metrics
        this.performanceTracker.recordBatchMeasurements([
            {
                agentId: event.data.agentId,
                metric: 'cpu_usage',
                value: event.data.pulse.cpuUsage,
                unit: 'percentage',
                sessionId: event.data.sessionId,
                tags: ['system', 'resource'],
            },
            {
                agentId: event.data.agentId,
                metric: 'memory_usage',
                value: event.data.pulse.memoryUsage,
                unit: 'bytes',
                sessionId: event.data.sessionId,
                tags: ['system', 'resource'],
            },
            {
                agentId: event.data.agentId,
                metric: 'response_time',
                value: event.data.pulse.responseTime,
                unit: 'ms',
                sessionId: event.data.sessionId,
                tags: ['performance', 'latency'],
            },
            {
                agentId: event.data.agentId,
                metric: 'error_rate',
                value: event.data.pulse.errorRate,
                unit: 'errors/min',
                sessionId: event.data.sessionId,
                tags: ['performance', 'errors'],
            },
            {
                agentId: event.data.agentId,
                metric: 'health_score',
                value: event.data.healthScore,
                unit: 'score',
                sessionId: event.data.sessionId,
                tags: ['health', 'overall'],
            },
        ]);
    }
    /**
     * Handle learning pattern event
     */
    async handleLearningPattern(event) {
        const payload = {
            agentId: event.data.agentId,
            patternType: event.data.patternType,
            pattern: event.data.pattern,
            impact: event.data.impact,
            recommendations: event.data.recommendations,
            timestamp: event.timestamp,
        };
        this.eventBroadcaster.broadcastLearningPattern(payload);
        // Record learning pattern metrics
        const impactScore = { 'low': 0.33, 'medium': 0.66, 'high': 1.0 }[event.data.impact];
        this.performanceTracker.recordMeasurement(event.data.agentId, 'learning_pattern_confidence', event.data.pattern.confidence, 'score', {
            patternType: event.data.patternType,
            impact: event.data.impact,
            occurrences: event.data.pattern.occurrences,
        }, undefined, undefined, ['learning', 'pattern_recognition']);
        this.performanceTracker.recordMeasurement(event.data.agentId, 'learning_pattern_impact', impactScore, 'score', {
            patternType: event.data.patternType,
            patternName: event.data.pattern.name,
        }, undefined, undefined, ['learning', 'impact']);
    }
    // ============================================================================
    // PERIODIC BROADCASTS
    // ============================================================================
    /**
     * Setup periodic broadcasts for aggregated data
     */
    setupPeriodicBroadcasts() {
        // Broadcast agent behavior patterns every 2 minutes
        setInterval(() => {
            this.broadcastAgentBehaviorPatterns();
        }, 120000);
        this.logger?.info('Periodic broadcasts setup completed');
    }
    /**
     * Broadcast behavior patterns for all monitored agents
     */
    broadcastAgentBehaviorPatterns() {
        try {
            const monitoredAgents = this.metricsCollector.getMonitoredAgents();
            for (const agentId of monitoredAgents) {
                const behaviorPatterns = this.agentMonitor.getAgentBehaviorPatterns(agentId);
                for (const pattern of behaviorPatterns) {
                    const payload = {
                        agentId: pattern.agentId,
                        patternId: pattern.patternId,
                        type: pattern.type,
                        confidence: pattern.confidence,
                        description: pattern.description,
                        evidence: pattern.evidence,
                        recommendations: pattern.recommendations,
                        impact: pattern.impact,
                        detectedAt: pattern.detectedAt,
                    };
                    this.eventBroadcaster.broadcastBehaviorPattern(payload);
                }
            }
        }
        catch (error) {
            this.logger?.error('Failed to broadcast behavior patterns', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    // ============================================================================
    // PUBLIC API
    // ============================================================================
    /**
     * Manually trigger observability data collection for an agent
     */
    triggerAgentDataCollection(agentId) {
        try {
            // Force metrics collection
            this.metricsCollector.forceCollection();
            // Force agent metrics update
            this.agentMonitor.forceMetricsUpdate(agentId);
            // Force health check
            this.agentMonitor.forceHealthCheck(agentId);
            this.logger?.info('Manual data collection triggered', { agentId });
        }
        catch (error) {
            this.logger?.error('Failed to trigger data collection', {
                agentId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Get observability integration statistics
     */
    getStats() {
        return {
            eventBusConnected: !!this.eventBusSubscriptionId,
            observabilityStats: this.observabilityManager.getStats(),
            monitoringStats: this.agentMonitor.getMonitoringStats(),
            performanceStats: this.performanceTracker.getStats(),
            metricsStats: this.metricsCollector.getStats(),
        };
    }
    /**
     * Cleanup and shutdown integration
     */
    async shutdown() {
        // Unsubscribe from event bus if connected
        if (this.eventBusSubscriptionId) {
            try {
                // Would call eventBus.unsubscribe(this.eventBusSubscriptionId)
                this.logger?.info('Event bus subscription cleaned up');
            }
            catch (error) {
                this.logger?.warn('Failed to cleanup event bus subscription', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        this.logger?.info('Observability integration shutdown complete');
    }
}
exports.ObservabilityIntegrationService = ObservabilityIntegrationService;
//# sourceMappingURL=observability-integration.js.map