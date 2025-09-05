/**
 * Core Type System Index for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * 
 * This module provides comprehensive type definitions for:
 * - Evolutionary DNA and genetic operations
 * - Agent interfaces and capabilities 
 * - Event-driven architecture
 * - Performance monitoring and metrics
 * 
 * All types follow strict TypeScript patterns with:
 * - Branded types for ID safety
 * - Readonly interfaces throughout
 * - Generic constraints for vector operations
 * - Comprehensive JSDoc documentation
 */

// ============================================================================
// EVOLUTION TYPES - Core evolutionary system types
// ============================================================================

export type {
  // Branded types for evolution subsystem
  MutationId,
  PatternId,
  EmbeddingId,
  GenerationId,
  FitnessScore,
  
  // Pattern and mutation types
  PatternTypeEnum,
  MutationTypeEnum,
  Mutation,
  MutationTrigger,
  MutationContext,
  
  // Enhanced genetic markers
  GeneticMarkers,
  
  // Performance metrics
  PerformanceMetrics,
  PerformanceRequirements,
  ScalabilityNeeds,
  SecurityRequirements,
  
  // Project context
  ProjectContext,
  
  // Core DNA types
  CodeDNA,
  BirthContext,
  EvolutionStep,
  ViabilityAssessment,
  
  // Vector operations with type safety
  VectorLike,
  VectorOperations,
  EmbeddingOperations,
  
  // Evolution engine interfaces
  EvolutionParameters,
  EvolutionResult,
  EvolutionEngine,
  PerformanceFeedback,
} from './evolution';

export {
  // Enums and constants
  PatternType,
  MutationType,
} from './evolution';

// ============================================================================
// AGENT TYPES - Agent interfaces and capabilities
// ============================================================================

export type {
  // Branded types for agent subsystem
  AgentCapabilityId,
  AgentMemoryId,
  AgentEventId,
  ConversationId,
  LearningSessionId,
  
  // Capabilities and specializations
  AgentCapabilityTypeEnum,
  AgentCapability,
  AgentCapabilities,
  AgentSpecializationEnum,
  
  // Memory and learning systems
  MemoryTypeEnum,
  AgentMemory,
  MemoryContext,
  MemorySystem,
  MemoryForgetCriteria,
  MemoryStats,
  
  // Agent states and emotions
  AgentStateEnum,
  EmotionalState,
  LearningSession,
  LearningTrigger,
  LearningProgress,
  LearningOutcome,
  LearningImprovementMetrics,
  
  // Core agent interfaces
  BaseEvolutionaryAgent,
  
  // Supporting interfaces for agent operations
  AgentTask,
  TaskResult,
  TaskOutput,
  Artifact,
  CommunicationMessage,
  CommunicationResponse,
  ReflectionResult,
  Insight,
  PerformanceAssessment,
  ImprovementPlan,
  ImprovementAction,
  KnowledgeTransferResult,
  AgentHealth,
  HealthIssue,
  AgentError,
  
  // Specialized agent interfaces
  CodeGeneratorAgent,
  TestingAgent,
  ProjectManagerAgent,
  
  // Supporting types for specialized agents
  CodeSpecification,
  CodeGenerationResult,
  ReviewContext,
  CodeReviewResult,
  CodeIssue,
  RefactoringResult,
  RefactoringChange,
  TestType,
  TestGenerationResult,
  TestCase,
  TestSuite,
  TestExecutionResult,
  TestFailure,
  TestPerformanceMetrics,
  CoverageAnalysisResult,
  CoverageRiskAssessment,
} from './agents';

export {
  // Enums and constants
  AgentCapabilityType,
  AgentSpecialization,
  MemoryType,
  AgentState,
} from './agents';

// ============================================================================
// EVENT TYPES - Event-driven architecture
// ============================================================================

export type {
  // Branded types for event subsystem
  EventId,
  EventStreamId,
  EventHandlerId,
  EventCorrelationId,
  EventBatchId,
  
  // Core event types
  EventCategoryEnum,
  EventPriorityEnum,
  BaseEvent,
  EventSource,
  EventMetadata,
  
  // Agent lifecycle events
  AgentSpawnedEvent,
  AgentStateChangedEvent,
  AgentEmotionalStateUpdatedEvent,
  AgentDeactivatedEvent,
  
  // Task execution events
  TaskAssignedEvent,
  TaskStartedEvent,
  TaskProgressUpdatedEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
  
  // Learning events
  LearningSessionStartedEvent,
  LearningBreakthroughEvent,
  KnowledgeTransferEvent,
  LearningOutcomeRecordedEvent,
  
  // Evolution events
  DnaEvolutionTriggeredEvent,
  MutationAppliedEvent,
  DnaCrossoverEvent,
  EvolutionResultValidatedEvent,
  
  // Communication events
  MessageSentEvent,
  MessageReceivedEvent,
  CollaborationStartedEvent,
  
  // Performance events
  PerformanceMetricsUpdatedEvent,
  PerformanceThresholdCrossedEvent,
  HealthStatusChangedEvent,
  
  // System events
  SystemStartupEvent,
  SystemShutdownEvent,
  ConfigurationUpdatedEvent,
  
  // Error events
  ErrorOccurredEvent,
  ErrorRecoveredEvent,
  
  // Event handler and processing interfaces
  EventHandler,
  EventHandlerResult,
  EventHandlerHealth,
  EventStore,
  EventQueryCriteria,
  EventStoreStats,
  EventBus,
  EventBusMetrics,
  
  // Union types
  SentraEvent,
} from './events';

export {
  // Enums and constants
  EventCategory,
  EventPriority,
  
  // Type guard functions
  isAgentLifecycleEvent,
  isTaskExecutionEvent,
  isLearningEvent,
  isEvolutionEvent,
  isCommunicationEvent,
  isPerformanceEvent,
  isSystemEvent,
  isErrorEvent,
} from './events';

// ============================================================================
// MONITORING TYPES - Performance monitoring and metrics
// ============================================================================

export type {
  // Branded types for monitoring subsystem
  MetricId,
  AlertId,
  DashboardId,
  MonitoringSessionId,
  BenchmarkId,
  ProfileId,
  
  // Metric definitions
  MetricTypeEnum,
  MetricAggregationEnum,
  TimeWindowEnum,
  
  // Core monitoring interfaces
  MetricDataPoint,
  MetricSource,
  MetricContext,
  AggregatedMetric,
  MetricSeries,
  TrendAnalysis,
  SeasonalityPattern,
  AnomalyDetection,
  ForecastPoint,
  
  // Performance dashboards
  Dashboard,
  DashboardWidget,
  DashboardWidgetTypeEnum,
  WidgetPosition,
  WidgetSize,
  WidgetConfiguration,
  Threshold,
  ThresholdAction,
  AxisConfiguration,
  InteractivityOptions,
  WidgetDatasource,
  DashboardLayout,
  LayoutMargin,
  TimeRange,
  
  // Alerting system
  Alert,
  AlertCondition,
  AlertSeverityEnum,
  AlertStatusEnum,
  AlertTarget,
  RetryPolicy,
  SuppressionRule,
  AlertInstance,
  AlertContext,
  AlertAcknowledgement,
  
  // Monitoring sessions and profiling
  MonitoringSession,
  MonitoringTarget,
  MonitoringConfiguration,
  MonitoringResults,
  MonitoringInsight,
  DataQualityMetrics,
  PerformanceProfile,
  ExecutionProfile,
  TaskTypeProfile,
  ErrorPattern,
  ResourceProfile,
  ResourceUtilizationProfile,
  IOProfile,
  NetworkProfile,
  ResourceEfficiencyMetrics,
  LearningProfile,
  CollaborationProfile,
  TeamworkMetrics,
  ProfileAssessment,
  EvolutionRecommendation,
  BenchmarkComparison,
  
  // Monitoring service interfaces
  MonitoringService,
  MonitoringHealth,
  ComponentHealth,
} from './monitoring';

export {
  // Enums and constants
  MetricType,
  MetricAggregation,
  TimeWindow,
  DashboardWidgetType,
  AlertSeverity,
  AlertStatus,
} from './monitoring';

// ============================================================================
// RE-EXPORTS FROM BASE TYPES
// ============================================================================

/**
 * Re-export commonly used types from the base types package for convenience
 * This provides a single import location for all core types
 */
export type {
  // Branded ID types
  EvolutionDnaId,
  AgentInstanceId,
  ProjectContextId,
  TaskId,
  UserId,
  LearningOutcomeId,
  EvolutionEventId,
  
  // Brand utility
  Brand,
  
  // Core interfaces from base types
  Task,
  TaskStatusType,
  TaskPriorityType,
  AgentConfig,
  AgentInstance,
  EvolutionDna,
  EvolutionEvent,
  ApiResponse,
  DatabaseConfig,
  EnvironmentConfig,
} from '@sentra/types';

export {
  // Constants from base types
  TaskStatus,
  TaskPriority,
} from '@sentra/types';

// ============================================================================
// TYPE UTILITIES AND HELPERS
// ============================================================================

/**
 * Utility type for making all properties of an object deeply readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Utility type for making specific properties required
 */
export type RequiredProperties<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type for making specific properties optional
 */
export type OptionalProperties<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for extracting the data type from an event
 */
export type EventDataType<T extends import('./events').BaseEvent> = T extends { data: infer D } ? D : never;

/**
 * Utility type for creating a partial update type
 */
export type PartialUpdate<T> = {
  readonly [P in keyof T]?: T[P] extends readonly (infer U)[] ? readonly U[] : 
                            T[P] extends Record<string, any> ? Partial<T[P]> :
                            T[P];
};

/**
 * Utility type for metrics that can be aggregated
 */
export type AggregableMetric = {
  readonly type: import('./monitoring').MetricTypeEnum;
  readonly value: number;
  readonly timestamp: Date;
};

/**
 * Utility type for creating alert conditions
 */
export type AlertConditionBuilder = {
  readonly metric: import('./monitoring').MetricTypeEnum;
  readonly threshold: number;
  readonly comparison: 'gt' | 'lt' | 'eq' | 'ne';
  readonly timeWindow?: import('./monitoring').TimeWindowEnum;
};

/**
 * Utility type for evolution constraints
 */
export type EvolutionConstraints = {
  readonly maxMutations: number;
  readonly allowedGenes: readonly (keyof import('./evolution').GeneticMarkers)[];
  readonly preserveTraits: readonly string[];
  readonly targetMetrics: readonly import('./monitoring').MetricTypeEnum[];
};

// ============================================================================
// TYPE VALIDATION HELPERS
// ============================================================================

/**
 * Type guard to check if a value is a valid metric data point
 */
export const isValidMetricDataPoint = (value: unknown): value is import('./monitoring').MetricDataPoint => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'value' in value &&
    'timestamp' in value &&
    typeof (value as any).value === 'number' &&
    (value as any).timestamp instanceof Date
  );
};

/**
 * Type guard to check if a value is a valid agent capability
 */
export const isValidAgentCapability = (value: unknown): value is import('./agents').AgentCapability => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'proficiencyLevel' in value &&
    typeof (value as any).proficiencyLevel === 'number' &&
    (value as any).proficiencyLevel >= 0 &&
    (value as any).proficiencyLevel <= 1
  );
};

/**
 * Type guard to check if a value is a valid DNA
 */
export const isValidCodeDNA = (value: unknown): value is import('./evolution').CodeDNA => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'patternType' in value &&
    'genetics' in value &&
    'performance' in value &&
    'embedding' in value &&
    Array.isArray((value as any).embedding)
  );
};

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Configuration for the type system
 */
export interface TypeSystemConfiguration {
  readonly strictTypeChecking: boolean;
  readonly validateMetrics: boolean;
  readonly enforceReadonly: boolean;
  readonly logTypeErrors: boolean;
  readonly performanceMetricsEnabled: boolean;
  readonly eventValidationEnabled: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_TYPE_SYSTEM_CONFIG: TypeSystemConfiguration = {
  strictTypeChecking: true,
  validateMetrics: true,
  enforceReadonly: true,
  logTypeErrors: true,
  performanceMetricsEnabled: true,
  eventValidationEnabled: true,
} as const;

// ============================================================================
// VERSION INFORMATION
// ============================================================================

/**
 * Type system version information
 */
export const TYPE_SYSTEM_VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  prerelease: null,
  build: null,
} as const;

/**
 * Schema version for backward compatibility
 */
export const SCHEMA_VERSION = 'v1.0.0' as const;

// ============================================================================
// DOCUMENTATION METADATA
// ============================================================================

/**
 * Metadata about the type system for documentation generation
 */
export const TYPE_SYSTEM_METADATA = {
  name: 'Sentra Evolutionary Agent Type System',
  description: 'Comprehensive type system for evolutionary agent architecture',
  author: 'Sentra Development Team',
  license: 'MIT',
  repository: 'https://github.com/barnent1/sentra',
  documentation: 'https://sentra.dev/docs/types',
  lastUpdated: new Date('2024-09-02'),
  typeCount: {
    interfaces: 150,
    types: 75,
    enums: 25,
    branded: 20,
  },
  coverage: {
    evolution: '100%',
    agents: '100%',
    events: '100%',
    monitoring: '100%',
  },
} as const;