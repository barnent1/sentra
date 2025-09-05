/**
 * Event System Types for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * Comprehensive event-driven architecture for agent communication and system coordination
 */
import type { AgentInstanceId, TaskId, ProjectContextId, EvolutionDnaId, LearningOutcomeId, EvolutionEventId, Brand } from '@sentra/types';
import type { PerformanceMetrics, MutationId } from './evolution';
import type { AgentCapabilityTypeEnum, AgentStateEnum, EmotionalState, LearningSessionId, TaskResult, AgentHealth } from './agents';
export type EventId = Brand<string, 'EventId'>;
export type EventStreamId = Brand<string, 'EventStreamId'>;
export type EventHandlerId = Brand<string, 'EventHandlerId'>;
export type EventCorrelationId = Brand<string, 'EventCorrelationId'>;
export type EventBatchId = Brand<string, 'EventBatchId'>;
/**
 * Categories of events in the system
 */
export declare const EventCategory: {
    readonly AGENT_LIFECYCLE: "agent_lifecycle";
    readonly TASK_EXECUTION: "task_execution";
    readonly LEARNING: "learning";
    readonly EVOLUTION: "evolution";
    readonly COMMUNICATION: "communication";
    readonly PERFORMANCE: "performance";
    readonly SYSTEM: "system";
    readonly ERROR: "error";
    readonly AUDIT: "audit";
    readonly INTEGRATION: "integration";
};
export type EventCategoryEnum = typeof EventCategory[keyof typeof EventCategory];
/**
 * Priority levels for events
 */
export declare const EventPriority: {
    readonly LOW: "low";
    readonly NORMAL: "normal";
    readonly HIGH: "high";
    readonly CRITICAL: "critical";
    readonly EMERGENCY: "emergency";
};
export type EventPriorityEnum = typeof EventPriority[keyof typeof EventPriority];
/**
 * Base event interface that all events must implement
 */
export interface BaseEvent {
    readonly id: EventId;
    readonly type: string;
    readonly category: EventCategoryEnum;
    readonly priority: EventPriorityEnum;
    readonly timestamp: Date;
    readonly source: EventSource;
    readonly correlationId?: EventCorrelationId;
    readonly causationId?: EventId;
    readonly batchId?: EventBatchId;
    readonly metadata: EventMetadata;
    readonly version: number;
}
/**
 * Source of an event
 */
export interface EventSource {
    readonly type: 'agent' | 'system' | 'user' | 'external';
    readonly id: string;
    readonly name: string;
    readonly version?: string;
}
/**
 * Common metadata for all events
 */
export interface EventMetadata {
    readonly environment: 'development' | 'test' | 'production';
    readonly sessionId?: string;
    readonly requestId?: string;
    readonly userId?: string;
    readonly projectId?: ProjectContextId;
    readonly tags: readonly string[];
    readonly ttl?: number;
    readonly retentionPolicy: 'short' | 'medium' | 'long' | 'permanent';
}
/**
 * Agent spawned event
 */
export interface AgentSpawnedEvent extends BaseEvent {
    readonly type: 'agent_spawned';
    readonly category: typeof EventCategory.AGENT_LIFECYCLE;
    readonly data: {
        readonly agentId: AgentInstanceId;
        readonly dnaId: EvolutionDnaId;
        readonly specialization: string;
        readonly capabilities: readonly AgentCapabilityTypeEnum[];
        readonly initialContext: ProjectContextId;
        readonly spawnReason: 'user_request' | 'system_need' | 'evolution' | 'scaling';
        readonly parentAgentId?: AgentInstanceId;
    };
}
/**
 * Agent state changed event
 */
export interface AgentStateChangedEvent extends BaseEvent {
    readonly type: 'agent_state_changed';
    readonly category: typeof EventCategory.AGENT_LIFECYCLE;
    readonly data: {
        readonly agentId: AgentInstanceId;
        readonly previousState: AgentStateEnum;
        readonly newState: AgentStateEnum;
        readonly reason: string;
        readonly stateMetrics: {
            readonly duration: number;
            readonly taskCount: number;
            readonly efficiency: number;
        };
    };
}
/**
 * Agent emotional state updated event
 */
export interface AgentEmotionalStateUpdatedEvent extends BaseEvent {
    readonly type: 'agent_emotional_state_updated';
    readonly category: typeof EventCategory.AGENT_LIFECYCLE;
    readonly data: {
        readonly agentId: AgentInstanceId;
        readonly previousState: EmotionalState;
        readonly newState: EmotionalState;
        readonly trigger: string;
        readonly impact: 'minor' | 'moderate' | 'significant' | 'major';
    };
}
/**
 * Agent deactivated event
 */
export interface AgentDeactivatedEvent extends BaseEvent {
    readonly type: 'agent_deactivated';
    readonly category: typeof EventCategory.AGENT_LIFECYCLE;
    readonly data: {
        readonly agentId: AgentInstanceId;
        readonly reason: 'user_request' | 'poor_performance' | 'resource_constraint' | 'evolution' | 'maintenance';
        readonly finalMetrics: PerformanceMetrics;
        readonly lifespan: number;
        readonly taskCount: number;
        readonly learningGains: readonly string[];
    };
}
/**
 * Task assigned to agent event
 */
export interface TaskAssignedEvent extends BaseEvent {
    readonly type: 'task_assigned';
    readonly category: typeof EventCategory.TASK_EXECUTION;
    readonly data: {
        readonly taskId: TaskId;
        readonly agentId: AgentInstanceId;
        readonly taskType: AgentCapabilityTypeEnum;
        readonly priority: 'low' | 'medium' | 'high' | 'critical';
        readonly estimatedDuration: number;
        readonly requirements: readonly string[];
        readonly dependencies: readonly TaskId[];
        readonly assignmentReason: string;
    };
}
/**
 * Task started event
 */
export interface TaskStartedEvent extends BaseEvent {
    readonly type: 'task_started';
    readonly category: typeof EventCategory.TASK_EXECUTION;
    readonly data: {
        readonly taskId: TaskId;
        readonly agentId: AgentInstanceId;
        readonly startTime: Date;
        readonly agentState: AgentStateEnum;
        readonly emotionalState: EmotionalState;
        readonly contextFactors: readonly string[];
        readonly approach: string;
    };
}
/**
 * Task progress updated event
 */
export interface TaskProgressUpdatedEvent extends BaseEvent {
    readonly type: 'task_progress_updated';
    readonly category: typeof EventCategory.TASK_EXECUTION;
    readonly data: {
        readonly taskId: TaskId;
        readonly agentId: AgentInstanceId;
        readonly progress: number;
        readonly milestone: string;
        readonly timeElapsed: number;
        readonly estimatedTimeRemaining: number;
        readonly obstacles: readonly string[];
        readonly achievements: readonly string[];
    };
}
/**
 * Task completed event
 */
export interface TaskCompletedEvent extends BaseEvent {
    readonly type: 'task_completed';
    readonly category: typeof EventCategory.TASK_EXECUTION;
    readonly data: {
        readonly taskId: TaskId;
        readonly agentId: AgentInstanceId;
        readonly result: TaskResult;
        readonly completionTime: Date;
        readonly duration: number;
        readonly successMetrics: PerformanceMetrics;
        readonly learningOutcomes: readonly string[];
        readonly nextRecommendations: readonly string[];
    };
}
/**
 * Task failed event
 */
export interface TaskFailedEvent extends BaseEvent {
    readonly type: 'task_failed';
    readonly category: typeof EventCategory.TASK_EXECUTION;
    readonly data: {
        readonly taskId: TaskId;
        readonly agentId: AgentInstanceId;
        readonly failureReason: string;
        readonly errorDetails: string;
        readonly failureTime: Date;
        readonly duration: number;
        readonly partialResults?: string;
        readonly lessonsLearned: readonly string[];
        readonly recoveryStrategy: string;
        readonly requiresIntervention: boolean;
    };
}
/**
 * Learning session started event
 */
export interface LearningSessionStartedEvent extends BaseEvent {
    readonly type: 'learning_session_started';
    readonly category: typeof EventCategory.LEARNING;
    readonly data: {
        readonly sessionId: LearningSessionId;
        readonly agentId: AgentInstanceId;
        readonly trigger: string;
        readonly objectives: readonly string[];
        readonly expectedDuration: number;
        readonly learningContext: string;
        readonly resources: readonly string[];
    };
}
/**
 * Learning breakthrough event
 */
export interface LearningBreakthroughEvent extends BaseEvent {
    readonly type: 'learning_breakthrough';
    readonly category: typeof EventCategory.LEARNING;
    readonly data: {
        readonly sessionId: LearningSessionId;
        readonly agentId: AgentInstanceId;
        readonly breakthroughType: 'skill_unlock' | 'pattern_recognition' | 'insight' | 'capability_improvement';
        readonly description: string;
        readonly impact: 'minor' | 'moderate' | 'significant' | 'transformative';
        readonly applicableTo: readonly string[];
        readonly confidenceLevel: number;
    };
}
/**
 * Knowledge transfer event
 */
export interface KnowledgeTransferEvent extends BaseEvent {
    readonly type: 'knowledge_transfer';
    readonly category: typeof EventCategory.LEARNING;
    readonly data: {
        readonly fromAgentId: AgentInstanceId;
        readonly toAgentId: AgentInstanceId;
        readonly knowledgeType: 'skill' | 'pattern' | 'experience' | 'insight';
        readonly topic: string;
        readonly transferMethod: 'direct' | 'demonstration' | 'documentation' | 'collaboration';
        readonly transferEfficiency: number;
        readonly verificationResult: boolean;
    };
}
/**
 * Learning outcome recorded event
 */
export interface LearningOutcomeRecordedEvent extends BaseEvent {
    readonly type: 'learning_outcome_recorded';
    readonly category: typeof EventCategory.LEARNING;
    readonly data: {
        readonly outcomeId: LearningOutcomeId;
        readonly agentId: AgentInstanceId;
        readonly taskId: TaskId;
        readonly outcomeType: 'success' | 'failure' | 'partial' | 'blocked';
        readonly improvementScore: number;
        readonly lessonLearned: string;
        readonly applicabilityScore: number;
        readonly contextFactors: readonly string[];
    };
}
/**
 * DNA evolution triggered event
 */
export interface DnaEvolutionTriggeredEvent extends BaseEvent {
    readonly type: 'dna_evolution_triggered';
    readonly category: typeof EventCategory.EVOLUTION;
    readonly data: {
        readonly dnaId: EvolutionDnaId;
        readonly agentId: AgentInstanceId;
        readonly trigger: 'performance_threshold' | 'manual' | 'time_based' | 'pattern_recognition';
        readonly currentPerformance: PerformanceMetrics;
        readonly targetImprovement: readonly string[];
        readonly evolutionParameters: {
            readonly mutationRate: number;
            readonly crossoverRate: number;
            readonly selectionPressure: number;
        };
    };
}
/**
 * Mutation applied event
 */
export interface MutationAppliedEvent extends BaseEvent {
    readonly type: 'mutation_applied';
    readonly category: typeof EventCategory.EVOLUTION;
    readonly data: {
        readonly mutationId: MutationId;
        readonly dnaId: EvolutionDnaId;
        readonly agentId: AgentInstanceId;
        readonly mutationType: string;
        readonly targetGene: string;
        readonly previousValue: number;
        readonly newValue: number;
        readonly expectedImpact: string;
        readonly confidence: number;
    };
}
/**
 * DNA crossover event
 */
export interface DnaCrossoverEvent extends BaseEvent {
    readonly type: 'dna_crossover';
    readonly category: typeof EventCategory.EVOLUTION;
    readonly data: {
        readonly parent1DnaId: EvolutionDnaId;
        readonly parent2DnaId: EvolutionDnaId;
        readonly childDnaId: EvolutionDnaId;
        readonly crossoverPoints: readonly string[];
        readonly inheritedTraits: Record<string, {
            from: 'parent1' | 'parent2';
            value: unknown;
        }>;
        readonly novelTraits: readonly string[];
        readonly expectedPerformance: PerformanceMetrics;
    };
}
/**
 * Evolution result validated event
 */
export interface EvolutionResultValidatedEvent extends BaseEvent {
    readonly type: 'evolution_result_validated';
    readonly category: typeof EventCategory.EVOLUTION;
    readonly data: {
        readonly evolutionEventId: EvolutionEventId;
        readonly dnaId: EvolutionDnaId;
        readonly agentId: AgentInstanceId;
        readonly validationResult: 'success' | 'failure' | 'inconclusive';
        readonly performanceChange: number;
        readonly actualVsExpected: number;
        readonly recommendation: 'keep' | 'revert' | 'further_evolve';
        readonly validationMetrics: PerformanceMetrics;
    };
}
/**
 * Message sent event
 */
export interface MessageSentEvent extends BaseEvent {
    readonly type: 'message_sent';
    readonly category: typeof EventCategory.COMMUNICATION;
    readonly data: {
        readonly messageId: string;
        readonly fromAgentId: AgentInstanceId;
        readonly toAgentId: AgentInstanceId | 'user';
        readonly messageType: 'question' | 'answer' | 'request' | 'notification' | 'status';
        readonly urgency: 'low' | 'medium' | 'high' | 'critical';
        readonly contentLength: number;
        readonly requiresResponse: boolean;
        readonly relatedTaskId?: TaskId;
    };
}
/**
 * Message received event
 */
export interface MessageReceivedEvent extends BaseEvent {
    readonly type: 'message_received';
    readonly category: typeof EventCategory.COMMUNICATION;
    readonly data: {
        readonly messageId: string;
        readonly fromAgentId: AgentInstanceId | 'user';
        readonly toAgentId: AgentInstanceId;
        readonly processingStartTime: Date;
        readonly comprehensionScore: number;
        readonly responseRequired: boolean;
        readonly priority: number;
    };
}
/**
 * Collaboration started event
 */
export interface CollaborationStartedEvent extends BaseEvent {
    readonly type: 'collaboration_started';
    readonly category: typeof EventCategory.COMMUNICATION;
    readonly data: {
        readonly collaborationId: string;
        readonly participantIds: readonly AgentInstanceId[];
        readonly initiatorId: AgentInstanceId;
        readonly purpose: string;
        readonly expectedDuration: number;
        readonly collaborationType: 'pair_programming' | 'code_review' | 'problem_solving' | 'knowledge_sharing';
        readonly sharedResources: readonly string[];
    };
}
/**
 * Performance metrics updated event
 */
export interface PerformanceMetricsUpdatedEvent extends BaseEvent {
    readonly type: 'performance_metrics_updated';
    readonly category: typeof EventCategory.PERFORMANCE;
    readonly data: {
        readonly agentId: AgentInstanceId;
        readonly previousMetrics: PerformanceMetrics;
        readonly newMetrics: PerformanceMetrics;
        readonly improvementAreas: readonly string[];
        readonly regressionAreas: readonly string[];
        readonly overallTrend: 'improving' | 'stable' | 'declining';
        readonly confidenceLevel: number;
    };
}
/**
 * Performance threshold crossed event
 */
export interface PerformanceThresholdCrossedEvent extends BaseEvent {
    readonly type: 'performance_threshold_crossed';
    readonly category: typeof EventCategory.PERFORMANCE;
    readonly data: {
        readonly agentId: AgentInstanceId;
        readonly metric: string;
        readonly thresholdType: 'minimum' | 'maximum' | 'target';
        readonly threshold: number;
        readonly actualValue: number;
        readonly direction: 'above' | 'below';
        readonly severity: 'info' | 'warning' | 'critical';
        readonly actionRequired: string;
        readonly historicalContext: string;
    };
}
/**
 * Health status changed event
 */
export interface HealthStatusChangedEvent extends BaseEvent {
    readonly type: 'health_status_changed';
    readonly category: typeof EventCategory.PERFORMANCE;
    readonly data: {
        readonly agentId: AgentInstanceId;
        readonly previousStatus: AgentHealth;
        readonly newStatus: AgentHealth;
        readonly changedComponents: readonly string[];
        readonly severity: 'info' | 'warning' | 'critical';
        readonly requiresAttention: boolean;
        readonly recommendedActions: readonly string[];
    };
}
/**
 * System startup event
 */
export interface SystemStartupEvent extends BaseEvent {
    readonly type: 'system_startup';
    readonly category: typeof EventCategory.SYSTEM;
    readonly data: {
        readonly systemVersion: string;
        readonly environment: 'development' | 'test' | 'production';
        readonly startupDuration: number;
        readonly componentsLoaded: readonly string[];
        readonly configurationHash: string;
        readonly resourcesAvailable: {
            readonly memory: number;
            readonly cpu: number;
            readonly storage: number;
        };
    };
}
/**
 * System shutdown event
 */
export interface SystemShutdownEvent extends BaseEvent {
    readonly type: 'system_shutdown';
    readonly category: typeof EventCategory.SYSTEM;
    readonly data: {
        readonly reason: 'maintenance' | 'upgrade' | 'error' | 'user_request';
        readonly graceful: boolean;
        readonly activeAgents: readonly AgentInstanceId[];
        readonly activeTasks: readonly TaskId[];
        readonly uptime: number;
        readonly finalStats: {
            readonly tasksCompleted: number;
            readonly agentsSpawned: number;
            readonly evolutionsPerformed: number;
        };
    };
}
/**
 * Configuration updated event
 */
export interface ConfigurationUpdatedEvent extends BaseEvent {
    readonly type: 'configuration_updated';
    readonly category: typeof EventCategory.SYSTEM;
    readonly data: {
        readonly configurationKey: string;
        readonly previousValue: unknown;
        readonly newValue: unknown;
        readonly updateReason: string;
        readonly affectedComponents: readonly string[];
        readonly requiresRestart: boolean;
        readonly validationResult: boolean;
    };
}
/**
 * Error occurred event
 */
export interface ErrorOccurredEvent extends BaseEvent {
    readonly type: 'error_occurred';
    readonly category: typeof EventCategory.ERROR;
    readonly data: {
        readonly errorId: string;
        readonly errorType: 'system' | 'agent' | 'task' | 'integration' | 'validation';
        readonly severity: 'low' | 'medium' | 'high' | 'critical';
        readonly message: string;
        readonly stackTrace?: string;
        readonly contextData: Record<string, unknown>;
        readonly affectedAgents: readonly AgentInstanceId[];
        readonly affectedTasks: readonly TaskId[];
        readonly recoverable: boolean;
        readonly recoveryAction?: string;
    };
}
/**
 * Error recovered event
 */
export interface ErrorRecoveredEvent extends BaseEvent {
    readonly type: 'error_recovered';
    readonly category: typeof EventCategory.ERROR;
    readonly data: {
        readonly originalErrorId: string;
        readonly recoveryMethod: 'automatic' | 'manual' | 'agent_initiative';
        readonly recoveryDuration: number;
        readonly recoverySuccess: boolean;
        readonly residualImpact: string;
        readonly lessonsLearned: readonly string[];
        readonly preventionMeasures: readonly string[];
    };
}
/**
 * Event handler interface
 */
export interface EventHandler<T extends BaseEvent> {
    readonly id: EventHandlerId;
    readonly eventType: T['type'];
    readonly priority: number;
    readonly isAsync: boolean;
    readonly maxRetries: number;
    readonly retryDelay: number;
    /**
     * Handle the event
     */
    handle(event: T): Promise<EventHandlerResult>;
    /**
     * Check if this handler can process the event
     */
    canHandle(event: BaseEvent): boolean;
    /**
     * Get handler health status
     */
    getHealth(): Promise<EventHandlerHealth>;
}
/**
 * Result of event handling
 */
export interface EventHandlerResult {
    readonly success: boolean;
    readonly processedAt: Date;
    readonly processingDuration: number;
    readonly resultData?: unknown;
    readonly errors: readonly string[];
    readonly warnings: readonly string[];
    readonly nextActions: readonly string[];
    readonly shouldRetry: boolean;
}
/**
 * Handler health status
 */
export interface EventHandlerHealth {
    readonly isHealthy: boolean;
    readonly lastProcessed: Date;
    readonly processedCount: number;
    readonly errorCount: number;
    readonly averageProcessingTime: number;
    readonly currentLoad: number;
}
/**
 * Event store interface
 */
export interface EventStore {
    /**
     * Store an event
     */
    store(event: BaseEvent): Promise<void>;
    /**
     * Store multiple events
     */
    storeBatch(events: readonly BaseEvent[]): Promise<void>;
    /**
     * Retrieve events by criteria
     */
    query(criteria: EventQueryCriteria): Promise<readonly BaseEvent[]>;
    /**
     * Subscribe to events
     */
    subscribe<T extends BaseEvent>(eventType: T['type'], handler: EventHandler<T>): Promise<string>;
    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId: string): Promise<void>;
    /**
     * Get event statistics
     */
    getStats(): Promise<EventStoreStats>;
}
/**
 * Criteria for querying events
 */
export interface EventQueryCriteria {
    readonly eventTypes?: readonly string[];
    readonly categories?: readonly EventCategoryEnum[];
    readonly sources?: readonly EventSource[];
    readonly fromTime?: Date;
    readonly toTime?: Date;
    readonly correlationIds?: readonly EventCorrelationId[];
    readonly priorities?: readonly EventPriorityEnum[];
    readonly limit?: number;
    readonly offset?: number;
    readonly sortBy?: 'timestamp' | 'priority' | 'type';
    readonly sortOrder?: 'asc' | 'desc';
}
/**
 * Event store statistics
 */
export interface EventStoreStats {
    readonly totalEvents: number;
    readonly eventsByType: Record<string, number>;
    readonly eventsByCategory: Record<EventCategoryEnum, number>;
    readonly eventsByPriority: Record<EventPriorityEnum, number>;
    readonly eventsPerDay: Record<string, number>;
    readonly oldestEvent: Date;
    readonly newestEvent: Date;
    readonly averageEventsPerHour: number;
    readonly storageUsage: number;
}
/**
 * Event bus interface for real-time event processing
 */
export interface EventBus {
    /**
     * Publish an event
     */
    publish(event: BaseEvent): Promise<void>;
    /**
     * Publish multiple events
     */
    publishBatch(events: readonly BaseEvent[]): Promise<void>;
    /**
     * Subscribe to events with a handler
     */
    subscribe<T extends BaseEvent>(eventType: T['type'] | readonly T['type'][], handler: EventHandler<T>): Promise<string>;
    /**
     * Subscribe with a filter function
     */
    subscribeWithFilter<T extends BaseEvent>(filter: (event: BaseEvent) => event is T, handler: EventHandler<T>): Promise<string>;
    /**
     * Unsubscribe a handler
     */
    unsubscribe(subscriptionId: string): Promise<void>;
    /**
     * Get current event processing metrics
     */
    getMetrics(): Promise<EventBusMetrics>;
}
/**
 * Event bus metrics
 */
export interface EventBusMetrics {
    readonly eventsPublished: number;
    readonly eventsProcessed: number;
    readonly eventsFailed: number;
    readonly averageProcessingTime: number;
    readonly currentBacklog: number;
    readonly activeSubscriptions: number;
    readonly throughputPerSecond: number;
    readonly errorRate: number;
}
/**
 * Union type of all possible events in the system
 */
export type SentraEvent = AgentSpawnedEvent | AgentStateChangedEvent | AgentEmotionalStateUpdatedEvent | AgentDeactivatedEvent | TaskAssignedEvent | TaskStartedEvent | TaskProgressUpdatedEvent | TaskCompletedEvent | TaskFailedEvent | LearningSessionStartedEvent | LearningBreakthroughEvent | KnowledgeTransferEvent | LearningOutcomeRecordedEvent | DnaEvolutionTriggeredEvent | MutationAppliedEvent | DnaCrossoverEvent | EvolutionResultValidatedEvent | MessageSentEvent | MessageReceivedEvent | CollaborationStartedEvent | PerformanceMetricsUpdatedEvent | PerformanceThresholdCrossedEvent | HealthStatusChangedEvent | SystemStartupEvent | SystemShutdownEvent | ConfigurationUpdatedEvent | ErrorOccurredEvent | ErrorRecoveredEvent;
/**
 * Type guard functions for event types
 */
export declare const isAgentLifecycleEvent: (event: BaseEvent) => event is AgentSpawnedEvent | AgentStateChangedEvent | AgentEmotionalStateUpdatedEvent | AgentDeactivatedEvent;
export declare const isTaskExecutionEvent: (event: BaseEvent) => event is TaskAssignedEvent | TaskStartedEvent | TaskProgressUpdatedEvent | TaskCompletedEvent | TaskFailedEvent;
export declare const isLearningEvent: (event: BaseEvent) => event is LearningSessionStartedEvent | LearningBreakthroughEvent | KnowledgeTransferEvent | LearningOutcomeRecordedEvent;
export declare const isEvolutionEvent: (event: BaseEvent) => event is DnaEvolutionTriggeredEvent | MutationAppliedEvent | DnaCrossoverEvent | EvolutionResultValidatedEvent;
export declare const isCommunicationEvent: (event: BaseEvent) => event is MessageSentEvent | MessageReceivedEvent | CollaborationStartedEvent;
export declare const isPerformanceEvent: (event: BaseEvent) => event is PerformanceMetricsUpdatedEvent | PerformanceThresholdCrossedEvent | HealthStatusChangedEvent;
export declare const isSystemEvent: (event: BaseEvent) => event is SystemStartupEvent | SystemShutdownEvent | ConfigurationUpdatedEvent;
export declare const isErrorEvent: (event: BaseEvent) => event is ErrorOccurredEvent | ErrorRecoveredEvent;
//# sourceMappingURL=events.d.ts.map