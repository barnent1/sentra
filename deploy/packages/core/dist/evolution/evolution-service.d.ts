/**
 * Evolution Integration Service for Sentra Evolutionary Agent System
 *
 * This service connects the existing DNA evolution system to project management workflow,
 * enabling cross-project learning and real-time evolution metrics.
 *
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import { EventEmitter } from 'events';
import type { CodeDNA, EvolutionDnaId, AgentInstanceId, TaskId, ProjectContextId, ProjectContext, EnhancedPerformanceMetrics as PerformanceMetrics, EvolutionEventId, FitnessScore, Brand } from '@sentra/types';
import type { PerformanceFeedback } from '../types';
import { type DNAEngineConfig, type EvolutionParameters } from '../dna';
export type EvolutionServiceId = Brand<string, 'EvolutionServiceId'>;
export interface EvolutionServiceConfig {
    readonly dnaEngine: DNAEngineConfig;
    readonly crossProjectLearning: {
        readonly enabled: boolean;
        readonly similarityThreshold: number;
        readonly maxPatternAge: number;
    };
    readonly realTimeMetrics: {
        readonly enabled: boolean;
        readonly metricsUpdateInterval: number;
        readonly evolutionEventBatchSize: number;
    };
    readonly vectorDatabase: {
        readonly dimensions: number;
        readonly indexType: 'cosine' | 'euclidean' | 'dot_product';
    };
}
export interface EvolutionIntegrationResult {
    readonly success: boolean;
    readonly dnaId: EvolutionDnaId;
    readonly evolutionEvents: readonly EvolutionEventData[];
    readonly crossProjectPatterns: readonly CrossProjectPattern[];
    readonly metricsUpdate: EvolutionMetricsUpdate;
    readonly reason: string;
    readonly confidence: number;
}
export interface EvolutionEventData {
    readonly id: EvolutionEventId;
    readonly type: 'dna_created' | 'dna_evolved' | 'pattern_learned' | 'cross_pollination' | 'fitness_improvement';
    readonly agentId: AgentInstanceId;
    readonly projectId: ProjectContextId;
    readonly taskId?: TaskId;
    readonly dnaId: EvolutionDnaId;
    readonly parentDnaId?: EvolutionDnaId;
    readonly geneticChanges: Record<string, {
        from: unknown;
        to: unknown;
    }>;
    readonly performanceDelta: PerformanceMetrics;
    readonly timestamp: Date;
    readonly metadata: Record<string, unknown>;
}
export interface CrossProjectPattern {
    readonly id: string;
    readonly sourceDnaId: EvolutionDnaId;
    readonly sourceProjectId: ProjectContextId;
    readonly targetProjectId: ProjectContextId;
    readonly patternType: string;
    readonly similarity: number;
    readonly applicability: number;
    readonly transferredAt: Date;
    readonly successPrediction: number;
}
export interface EvolutionMetricsUpdate {
    readonly totalEvolutions: number;
    readonly averageFitnessImprovement: number;
    readonly crossProjectTransfers: number;
    readonly activePatterns: number;
    readonly generationDistribution: Record<number, number>;
    readonly topPerformingPatterns: readonly {
        readonly dnaId: EvolutionDnaId;
        readonly fitness: FitnessScore;
        readonly context: string;
    }[];
    readonly evolutionTrends: {
        readonly improvementRate: number;
        readonly successRate: number;
        readonly diversityIndex: number;
    };
}
export interface ProjectLearningContext {
    readonly projectId: ProjectContextId;
    readonly activeAgents: readonly AgentInstanceId[];
    readonly completedTasks: number;
    readonly averagePerformance: PerformanceMetrics;
    readonly dominantPatterns: readonly {
        readonly patternType: string;
        readonly frequency: number;
        readonly effectiveness: number;
    }[];
    readonly evolutionActivity: {
        readonly recentEvolutions: number;
        readonly avgFitnessImprovement: number;
        readonly patternDiversity: number;
    };
}
export declare class EvolutionIntegrationService extends EventEmitter {
    private readonly config;
    private readonly dnaEngine;
    private readonly activeDnaPatterns;
    private readonly crossProjectPatterns;
    private readonly projectLearningContexts;
    private readonly evolutionEvents;
    private metricsUpdateTimer?;
    constructor(config?: Partial<EvolutionServiceConfig>);
    /**
     * Generate a consistent ProjectContextId from ProjectContext
     */
    private generateProjectContextId;
    /**
     * Initialize a new agent with evolutionary DNA for a project context
     */
    initializeAgentDna(agentId: AgentInstanceId, projectContext: ProjectContext, taskId?: TaskId, seedPatterns?: readonly CodeDNA[]): Promise<EvolutionIntegrationResult>;
    /**
     * Process task completion feedback and evolve DNA if needed
     */
    processTaskFeedback(agentId: AgentInstanceId, taskId: TaskId, feedback: PerformanceFeedback, evolutionParameters?: EvolutionParameters): Promise<EvolutionIntegrationResult>;
    /**
     * Find patterns similar to the given project context for cross-project learning
     */
    findSimilarPatterns(targetContext: ProjectContext, maxResults?: number): Promise<readonly {
        dna: CodeDNA;
        similarity: number;
    }[]>;
    /**
     * Get current evolution metrics for dashboard display
     */
    getEvolutionMetrics(): Promise<EvolutionMetricsUpdate>;
    /**
     * Get project-specific learning context
     */
    getProjectLearningContext(projectId: ProjectContextId): ProjectLearningContext | undefined;
    /**
     * Get recent evolution events for monitoring
     */
    getRecentEvolutionEvents(limit?: number): readonly EvolutionEventData[];
    private setupDnaEngineListeners;
    private startMetricsUpdates;
    private shouldTriggerEvolution;
    private adaptExistingPattern;
    private createEvolutionEvent;
    private identifyCrossProjectOpportunities;
    private applyCrossProjectLearning;
    private calculateContextSimilarity;
    private calculateApplicability;
    private calculateGeneticCompatibility;
    private calculatePerformanceAlignment;
    private predictTransferSuccess;
    private calculateGeneticChanges;
    private updateProjectLearningContext;
    private calculatePatternDiversity;
    private calculateGeneticDistance;
    private generateMetricsUpdate;
    private calculateOverallDiversity;
    /**
     * Clean up resources
     */
    destroy(): void;
}
export default EvolutionIntegrationService;
//# sourceMappingURL=evolution-service.d.ts.map