import type { AgentConfig, AgentInstanceId, EvolutionDna, EvolutionDnaId, Task, ApiResponse } from '@sentra/types';
/**
 * Core evolutionary agent class following strict TypeScript patterns
 */
export declare class EvolutionaryAgent {
    private readonly config;
    private readonly dna;
    constructor(config: AgentConfig, dna: EvolutionDna);
    readonly getId: () => AgentInstanceId;
    readonly getName: () => string;
    readonly getSpecialization: () => string;
    readonly getCapabilities: () => readonly string[];
    readonly getDnaId: () => EvolutionDnaId;
    readonly getGeneration: () => number;
    readonly isActive: () => boolean;
    /**
     * Process a task using the agent's evolutionary capabilities
     */
    readonly processTask: (task: Task) => Promise<ApiResponse<Task>>;
}
/**
 * Factory function for creating evolutionary agents with proper type safety
 */
export declare const createEvolutionaryAgent: (config: AgentConfig, dna: EvolutionDna) => EvolutionaryAgent;
/**
 * Utility functions for evolutionary system
 */
export declare namespace EvolutionUtils {
    /**
     * Calculate similarity between two DNA profiles using vector operations
     */
    const calculateDnaSimilarity: (dna1: EvolutionDna, dna2: EvolutionDna) => number;
    /**
     * Generate next generation DNA based on performance metrics
     */
    const evolveGeneticMarkers: (parentDna: EvolutionDna, performanceImprovement: number) => EvolutionDna["genetics"];
}
export * from './db';
export * from './types';
export * from './dna';
export { EvolutionOrchestrator, EvolutionIntegrationService, PatternMatchingService, VectorOperations, EvolutionMetricsService, EvolutionWebSocketBridge, KnowledgeTransferService, type EvolutionMetricType, EvolutionWebSocketMessageType, type EvolutionSubscriptionType, type KnowledgeType, type TransferType, } from './evolution';
export type { EvolutionOrchestratorId, EvolutionOrchestratorConfig, EvolutionServiceId, EvolutionServiceConfig, EvolutionIntegrationResult, EvolutionEventData, CrossProjectPattern, EvolutionMetricsUpdate, ProjectLearningContext, PatternMatchingId, EmbeddingVector, PatternSimilarityResult, PatternCluster, CrossProjectTransferCandidate, PatternMatchingConfig, MetricsServiceId, MetricId, EvolutionMetricPoint, MetricsAggregation, EvolutionTrend, EvolutionAlert, RealTimeEvolutionDashboard, MetricsServiceConfig, WebSocketConnectionId, EvolutionWebSocketMessage, EvolutionSubscription, WebSocketConnection, KnowledgeTransferId, LearningSessionId, KnowledgeItemId, KnowledgeItem, KnowledgeContent, KnowledgeApplicability, KnowledgeQuality, KnowledgeTransferRequest, KnowledgeTransferResult, CrossProjectLearningSession, } from './evolution';
export { EvolutionVectorStore, EmbeddingService, PatternSearchEngine, RelevanceScorer, SearchCache, VectorDatabaseService, createVectorDatabaseService, createTestVectorDatabaseService, PerformanceMonitor, OperationType, RankingAlgorithm, } from './storage';
export { TMUXSessionManager, GridLayoutManager, SessionScalingManager, WebSocketManager, SessionPersistenceManager, CLIIntegration, createTMUXSystem, createDefaultSessionManagerConfig, createDefaultScalingConfig, createDefaultPersistenceConfig, validateTMUXSystemConfig, getTMUXSystemHealth, cleanupTMUXSystem, TMUX_MODULE_INFO, } from './tmux';
export type { TMUXSystem, TMUXSystemConfig, SessionId, PanelId, WindowId, TMUXSession, TMUXPanel, TMUXWindow, ProjectActivity, SessionCreationParams, TMUXSessionManagerConfig, SessionMetrics, GridLayoutConfiguration, SessionGridLayout, PanelLayout, SessionLayoutConfig, SessionScalingConfig, ScalingMetrics, ScalingDecision, SessionLoad, LoadBalancingConfig, WebSocketMessage, WebSocketClient, BroadcastConfig, WebSocketStats, PersistenceConfig, RecoveryResult, BackupMetadata, RecoveryStrategy, CLICommandDefinition, CLIExecutionContext, CLIOperationResult, InteractiveSession, } from './tmux';
//# sourceMappingURL=index.d.ts.map