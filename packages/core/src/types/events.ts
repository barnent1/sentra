/**
 * Event System Types for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * Comprehensive event-driven architecture for agent communication and system coordination
 */

import type {
  AgentInstanceId,
  TaskId,
  ProjectContextId,
  EvolutionDnaId,
  LearningOutcomeId,
  EvolutionEventId,
  Brand,
} from '@sentra/types';

import type {
  PerformanceMetrics,
  MutationId,
} from './evolution';

import type {
  AgentCapabilityTypeEnum,
  AgentStateEnum,
  EmotionalState,
  LearningSessionId,
  TaskResult,
  AgentHealth,
} from './agents';

// ============================================================================
// BRANDED TYPES FOR EVENT SUBSYSTEM
// ============================================================================

export type EventId = Brand<string, 'EventId'>;
export type EventStreamId = Brand<string, 'EventStreamId'>;
export type EventHandlerId = Brand<string, 'EventHandlerId'>;
export type EventCorrelationId = Brand<string, 'EventCorrelationId'>;
export type EventBatchId = Brand<string, 'EventBatchId'>;

// ============================================================================
// CORE EVENT TYPES
// ============================================================================

/**
 * Categories of events in the system
 */
export const EventCategory = {
  AGENT_LIFECYCLE: 'agent_lifecycle',       // Agent creation, activation, deactivation
  TASK_EXECUTION: 'task_execution',         // Task-related events
  LEARNING: 'learning',                     // Learning and knowledge events
  EVOLUTION: 'evolution',                   // DNA evolution and mutation events
  COMMUNICATION: 'communication',           // Inter-agent communication
  PERFORMANCE: 'performance',               // Performance monitoring events
  SYSTEM: 'system',                         // System-level events
  ERROR: 'error',                          // Error and exception events
  AUDIT: 'audit',                          // Audit and compliance events
  INTEGRATION: 'integration',               // External system integration events
} as const;

export type EventCategoryEnum = typeof EventCategory[keyof typeof EventCategory];

/**
 * Priority levels for events
 */
export const EventPriority = {
  LOW: 'low',
  NORMAL: 'normal', 
  HIGH: 'high',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency',
} as const;

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
  readonly causationId?: EventId;        // Event that caused this event
  readonly batchId?: EventBatchId;       // Batch of related events
  readonly metadata: EventMetadata;
  readonly version: number;              // Event schema version
}

/**
 * Source of an event
 */
export interface EventSource {
  readonly type: 'agent' | 'system' | 'user' | 'external';
  readonly id: string;                   // ID of the source (agent ID, system component, etc.)
  readonly name: string;                 // Human-readable name
  readonly version?: string;             // Version of source component
}

/**
 * Common metadata for all events
 */
export interface EventMetadata {
  readonly environment: 'development' | 'test' | 'production';
  readonly sessionId?: string;           // User or agent session
  readonly requestId?: string;           // Request ID for tracing
  readonly userId?: string;              // Associated user if applicable
  readonly projectId?: ProjectContextId; // Associated project
  readonly tags: readonly string[];      // Organizational tags
  readonly ttl?: number;                // Time to live in seconds
  readonly retentionPolicy: 'short' | 'medium' | 'long' | 'permanent';
}

// ============================================================================
// AGENT LIFECYCLE EVENTS
// ============================================================================

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
      readonly duration: number;         // Time in previous state (ms)
      readonly taskCount: number;        // Tasks completed in previous state
      readonly efficiency: number;       // 0-1, efficiency in previous state
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
    readonly lifespan: number;           // Total active time in milliseconds
    readonly taskCount: number;          // Total tasks completed
    readonly learningGains: readonly string[];
  };
}

// ============================================================================
// TASK EXECUTION EVENTS
// ============================================================================

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
    readonly estimatedDuration: number;   // milliseconds
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
    readonly approach: string;            // Agent's planned approach
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
    readonly progress: number;            // 0-1, completion percentage
    readonly milestone: string;           // Current milestone
    readonly timeElapsed: number;         // milliseconds since start
    readonly estimatedTimeRemaining: number; // milliseconds
    readonly obstacles: readonly string[]; // Current obstacles
    readonly achievements: readonly string[]; // Recent achievements
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
    readonly duration: number;            // milliseconds
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
    readonly duration: number;            // milliseconds
    readonly partialResults?: string;     // Any partial work completed
    readonly lessonsLearned: readonly string[];
    readonly recoveryStrategy: string;
    readonly requiresIntervention: boolean;
  };
}

// ============================================================================
// LEARNING EVENTS
// ============================================================================

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
    readonly expectedDuration: number;    // milliseconds
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
    readonly confidenceLevel: number;     // 0-1
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
    readonly transferEfficiency: number;  // 0-1
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
    readonly improvementScore: number;    // -1 to 1
    readonly lessonLearned: string;
    readonly applicabilityScore: number;  // 0-1
    readonly contextFactors: readonly string[];
  };
}

// ============================================================================
// EVOLUTION EVENTS
// ============================================================================

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
    readonly confidence: number;          // 0-1
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
    readonly inheritedTraits: Record<string, { from: 'parent1' | 'parent2'; value: unknown }>;
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
    readonly performanceChange: number;   // -1 to 1
    readonly actualVsExpected: number;    // -1 to 1, how close to expectations
    readonly recommendation: 'keep' | 'revert' | 'further_evolve';
    readonly validationMetrics: PerformanceMetrics;
  };
}

// ============================================================================
// COMMUNICATION EVENTS
// ============================================================================

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
    readonly comprehensionScore: number;  // 0-1, how well message was understood
    readonly responseRequired: boolean;
    readonly priority: number;            // Processing priority 1-10
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
    readonly expectedDuration: number;    // milliseconds
    readonly collaborationType: 'pair_programming' | 'code_review' | 'problem_solving' | 'knowledge_sharing';
    readonly sharedResources: readonly string[];
  };
}

// ============================================================================
// PERFORMANCE EVENTS
// ============================================================================

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
    readonly confidenceLevel: number;     // 0-1
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
    readonly metric: string;              // Which metric crossed threshold
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

// ============================================================================
// SYSTEM EVENTS
// ============================================================================

/**
 * System startup event
 */
export interface SystemStartupEvent extends BaseEvent {
  readonly type: 'system_startup';
  readonly category: typeof EventCategory.SYSTEM;
  readonly data: {
    readonly systemVersion: string;
    readonly environment: 'development' | 'test' | 'production';
    readonly startupDuration: number;     // milliseconds
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
    readonly uptime: number;              // milliseconds
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

// ============================================================================
// ERROR EVENTS
// ============================================================================

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
    readonly recoveryDuration: number;    // milliseconds
    readonly recoverySuccess: boolean;
    readonly residualImpact: string;
    readonly lessonsLearned: readonly string[];
    readonly preventionMeasures: readonly string[];
  };
}

// ============================================================================
// EVENT HANDLER AND PROCESSING INTERFACES
// ============================================================================

/**
 * Event handler interface
 */
export interface EventHandler<T extends BaseEvent> {
  readonly id: EventHandlerId;
  readonly eventType: T['type'];
  readonly priority: number;              // 1-10, processing priority
  readonly isAsync: boolean;
  readonly maxRetries: number;
  readonly retryDelay: number;            // milliseconds
  
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
  readonly processingDuration: number;    // milliseconds
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
  readonly averageProcessingTime: number; // milliseconds
  readonly currentLoad: number;           // 0-1, current processing load
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
  subscribe<T extends BaseEvent>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): Promise<string>; // Returns subscription ID
  
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
  readonly eventsPerDay: Record<string, number>; // Date string -> count
  readonly oldestEvent: Date;
  readonly newestEvent: Date;
  readonly averageEventsPerHour: number;
  readonly storageUsage: number;          // bytes
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
  subscribe<T extends BaseEvent>(
    eventType: T['type'] | readonly T['type'][],
    handler: EventHandler<T>
  ): Promise<string>;
  
  /**
   * Subscribe with a filter function
   */
  subscribeWithFilter<T extends BaseEvent>(
    filter: (event: BaseEvent) => event is T,
    handler: EventHandler<T>
  ): Promise<string>;
  
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
  readonly averageProcessingTime: number; // milliseconds
  readonly currentBacklog: number;
  readonly activeSubscriptions: number;
  readonly throughputPerSecond: number;
  readonly errorRate: number;            // 0-1
}

// ============================================================================
// UNION TYPES FOR ALL EVENTS
// ============================================================================

/**
 * Union type of all possible events in the system
 */
export type SentraEvent = 
  // Agent Lifecycle Events
  | AgentSpawnedEvent
  | AgentStateChangedEvent
  | AgentEmotionalStateUpdatedEvent
  | AgentDeactivatedEvent
  // Task Execution Events
  | TaskAssignedEvent
  | TaskStartedEvent
  | TaskProgressUpdatedEvent
  | TaskCompletedEvent
  | TaskFailedEvent
  // Learning Events
  | LearningSessionStartedEvent
  | LearningBreakthroughEvent
  | KnowledgeTransferEvent
  | LearningOutcomeRecordedEvent
  // Evolution Events
  | DnaEvolutionTriggeredEvent
  | MutationAppliedEvent
  | DnaCrossoverEvent
  | EvolutionResultValidatedEvent
  // Communication Events
  | MessageSentEvent
  | MessageReceivedEvent
  | CollaborationStartedEvent
  // Performance Events
  | PerformanceMetricsUpdatedEvent
  | PerformanceThresholdCrossedEvent
  | HealthStatusChangedEvent
  // System Events
  | SystemStartupEvent
  | SystemShutdownEvent
  | ConfigurationUpdatedEvent
  // Error Events
  | ErrorOccurredEvent
  | ErrorRecoveredEvent;

/**
 * Type guard functions for event types
 */
export const isAgentLifecycleEvent = (event: BaseEvent): event is 
  AgentSpawnedEvent | AgentStateChangedEvent | AgentEmotionalStateUpdatedEvent | AgentDeactivatedEvent =>
  event.category === EventCategory.AGENT_LIFECYCLE;

export const isTaskExecutionEvent = (event: BaseEvent): event is
  TaskAssignedEvent | TaskStartedEvent | TaskProgressUpdatedEvent | TaskCompletedEvent | TaskFailedEvent =>
  event.category === EventCategory.TASK_EXECUTION;

export const isLearningEvent = (event: BaseEvent): event is
  LearningSessionStartedEvent | LearningBreakthroughEvent | KnowledgeTransferEvent | LearningOutcomeRecordedEvent =>
  event.category === EventCategory.LEARNING;

export const isEvolutionEvent = (event: BaseEvent): event is
  DnaEvolutionTriggeredEvent | MutationAppliedEvent | DnaCrossoverEvent | EvolutionResultValidatedEvent =>
  event.category === EventCategory.EVOLUTION;

export const isCommunicationEvent = (event: BaseEvent): event is
  MessageSentEvent | MessageReceivedEvent | CollaborationStartedEvent =>
  event.category === EventCategory.COMMUNICATION;

export const isPerformanceEvent = (event: BaseEvent): event is
  PerformanceMetricsUpdatedEvent | PerformanceThresholdCrossedEvent | HealthStatusChangedEvent =>
  event.category === EventCategory.PERFORMANCE;

export const isSystemEvent = (event: BaseEvent): event is
  SystemStartupEvent | SystemShutdownEvent | ConfigurationUpdatedEvent =>
  event.category === EventCategory.SYSTEM;

export const isErrorEvent = (event: BaseEvent): event is
  ErrorOccurredEvent | ErrorRecoveredEvent =>
  event.category === EventCategory.ERROR;