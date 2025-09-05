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
export type { MutationId, PatternId, EmbeddingId, GenerationId, FitnessScore, PatternTypeEnum, MutationTypeEnum, Mutation, MutationTrigger, MutationContext, GeneticMarkers, PerformanceMetrics, PerformanceRequirements, ScalabilityNeeds, SecurityRequirements, ProjectContext, CodeDNA, BirthContext, EvolutionStep, ViabilityAssessment, VectorLike, VectorOperations, EmbeddingOperations, EvolutionParameters, EvolutionResult, EvolutionEngine, PerformanceFeedback, } from './evolution';
export { PatternType, MutationType, } from './evolution';
export type { AgentCapabilityId, AgentMemoryId, AgentEventId, ConversationId, LearningSessionId, AgentCapabilityTypeEnum, AgentCapability, AgentCapabilities, AgentSpecializationEnum, MemoryTypeEnum, AgentMemory, MemoryContext, MemorySystem, MemoryForgetCriteria, MemoryStats, AgentStateEnum, EmotionalState, LearningSession, LearningTrigger, LearningProgress, LearningOutcome, LearningImprovementMetrics, BaseEvolutionaryAgent, AgentTask, TaskResult, TaskOutput, Artifact, CommunicationMessage, CommunicationResponse, ReflectionResult, Insight, PerformanceAssessment, ImprovementPlan, ImprovementAction, KnowledgeTransferResult, AgentHealth, HealthIssue, AgentError, CodeGeneratorAgent, TestingAgent, ProjectManagerAgent, CodeSpecification, CodeGenerationResult, ReviewContext, CodeReviewResult, CodeIssue, RefactoringResult, RefactoringChange, TestType, TestGenerationResult, TestCase, TestSuite, TestExecutionResult, TestFailure, TestPerformanceMetrics, CoverageAnalysisResult, CoverageRiskAssessment, } from './agents';
export { AgentCapabilityType, AgentSpecialization, MemoryType, AgentState, } from './agents';
export type { EventId, EventStreamId, EventHandlerId, EventCorrelationId, EventBatchId, EventCategoryEnum, EventPriorityEnum, BaseEvent, EventSource, EventMetadata, AgentSpawnedEvent, AgentStateChangedEvent, AgentEmotionalStateUpdatedEvent, AgentDeactivatedEvent, TaskAssignedEvent, TaskStartedEvent, TaskProgressUpdatedEvent, TaskCompletedEvent, TaskFailedEvent, LearningSessionStartedEvent, LearningBreakthroughEvent, KnowledgeTransferEvent, LearningOutcomeRecordedEvent, DnaEvolutionTriggeredEvent, MutationAppliedEvent, DnaCrossoverEvent, EvolutionResultValidatedEvent, MessageSentEvent, MessageReceivedEvent, CollaborationStartedEvent, PerformanceMetricsUpdatedEvent, PerformanceThresholdCrossedEvent, HealthStatusChangedEvent, SystemStartupEvent, SystemShutdownEvent, ConfigurationUpdatedEvent, ErrorOccurredEvent, ErrorRecoveredEvent, EventHandler, EventHandlerResult, EventHandlerHealth, EventStore, EventQueryCriteria, EventStoreStats, EventBus, EventBusMetrics, ToolUsageStartedEvent, ToolUsageCompletedEvent, AgentDecisionEvent, AgentMemoryOperationEvent, AgentCoordinationEvent, PerformancePulseEvent, AgentLearningPatternEvent, SentraEvent, } from './events';
export { EventCategory, EventPriority, isAgentLifecycleEvent, isTaskExecutionEvent, isLearningEvent, isEvolutionEvent, isCommunicationEvent, isPerformanceEvent, isSystemEvent, isErrorEvent, isObservabilityEvent, } from './events';
export type { MetricId, AlertId, DashboardId, MonitoringSessionId, BenchmarkId, ProfileId, MetricTypeEnum, MetricAggregationEnum, TimeWindowEnum, MetricDataPoint, MetricSource, MetricContext, AggregatedMetric, MetricSeries, TrendAnalysis, SeasonalityPattern, AnomalyDetection, ForecastPoint, Dashboard, DashboardWidget, DashboardWidgetTypeEnum, WidgetPosition, WidgetSize, WidgetConfiguration, Threshold, ThresholdAction, AxisConfiguration, InteractivityOptions, WidgetDatasource, DashboardLayout, LayoutMargin, TimeRange, Alert, AlertCondition, AlertSeverityEnum, AlertStatusEnum, AlertTarget, RetryPolicy, SuppressionRule, AlertInstance, AlertContext, AlertAcknowledgement, MonitoringSession, MonitoringTarget, MonitoringConfiguration, MonitoringResults, MonitoringInsight, DataQualityMetrics, PerformanceProfile, ExecutionProfile, TaskTypeProfile, ErrorPattern, ResourceProfile, ResourceUtilizationProfile, IOProfile, NetworkProfile, ResourceEfficiencyMetrics, LearningProfile, CollaborationProfile, TeamworkMetrics, ProfileAssessment, EvolutionRecommendation, BenchmarkComparison, MonitoringService, MonitoringHealth, ComponentHealth, } from './monitoring';
export { MetricType, MetricAggregation, TimeWindow, DashboardWidgetType, AlertSeverity, AlertStatus, } from './monitoring';
/**
 * Re-export commonly used types from the base types package for convenience
 * This provides a single import location for all core types
 */
export type { EvolutionDnaId, AgentInstanceId, ProjectContextId, TaskId, UserId, LearningOutcomeId, EvolutionEventId, Brand, Task, TaskStatusType, TaskPriorityType, AgentConfig, AgentInstance, EvolutionDna, EvolutionEvent, ApiResponse, DatabaseConfig, EnvironmentConfig, } from '@sentra/types';
export { TaskStatus, TaskPriority, } from '@sentra/types';
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
export type EventDataType<T extends import('./events').BaseEvent> = T extends {
    data: infer D;
} ? D : never;
/**
 * Utility type for creating a partial update type
 */
export type PartialUpdate<T> = {
    readonly [P in keyof T]?: T[P] extends readonly (infer U)[] ? readonly U[] : T[P] extends Record<string, any> ? Partial<T[P]> : T[P];
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
/**
 * Type guard to check if a value is a valid metric data point
 */
export declare const isValidMetricDataPoint: (value: unknown) => value is import("./monitoring").MetricDataPoint;
/**
 * Type guard to check if a value is a valid agent capability
 */
export declare const isValidAgentCapability: (value: unknown) => value is import("./agents").AgentCapability;
/**
 * Type guard to check if a value is a valid DNA
 */
export declare const isValidCodeDNA: (value: unknown) => value is import("./evolution").CodeDNA;
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
export declare const DEFAULT_TYPE_SYSTEM_CONFIG: TypeSystemConfiguration;
/**
 * Type system version information
 */
export declare const TYPE_SYSTEM_VERSION: {
    readonly major: 1;
    readonly minor: 0;
    readonly patch: 0;
    readonly prerelease: null;
    readonly build: null;
};
/**
 * Schema version for backward compatibility
 */
export declare const SCHEMA_VERSION: "v1.0.0";
/**
 * Metadata about the type system for documentation generation
 */
export declare const TYPE_SYSTEM_METADATA: {
    readonly name: "Sentra Evolutionary Agent Type System";
    readonly description: "Comprehensive type system for evolutionary agent architecture";
    readonly author: "Sentra Development Team";
    readonly license: "MIT";
    readonly repository: "https://github.com/barnent1/sentra";
    readonly documentation: "https://sentra.dev/docs/types";
    readonly lastUpdated: Date;
    readonly typeCount: {
        readonly interfaces: 150;
        readonly types: 75;
        readonly enums: 25;
        readonly branded: 20;
    };
    readonly coverage: {
        readonly evolution: "100%";
        readonly agents: "100%";
        readonly events: "100%";
        readonly monitoring: "100%";
    };
};
//# sourceMappingURL=index.d.ts.map