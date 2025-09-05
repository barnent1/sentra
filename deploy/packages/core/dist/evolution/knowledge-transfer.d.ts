/**
 * Knowledge Transfer System for Cross-Project Agent Learning
 *
 * This system enables intelligent pattern sharing and knowledge transfer
 * between agents working on different projects, facilitating collective learning.
 *
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import { EventEmitter } from 'events';
import type { CodeDNA, EvolutionDnaId, AgentInstanceId, ProjectContextId, TaskId, GeneticMarkers, PerformanceMetrics, ProjectContext, Mutation, Brand } from '../types';
export type KnowledgeTransferId = Brand<string, 'KnowledgeTransferId'>;
export type LearningSessionId = Brand<string, 'LearningSessionId'>;
export type KnowledgeItemId = Brand<string, 'KnowledgeItemId'>;
export interface KnowledgeItem {
    readonly id: KnowledgeItemId;
    readonly sourceAgentId: AgentInstanceId;
    readonly sourceDnaId: EvolutionDnaId;
    readonly sourceProjectId: ProjectContextId;
    readonly knowledgeType: KnowledgeType;
    readonly content: KnowledgeContent;
    readonly applicability: KnowledgeApplicability;
    readonly quality: KnowledgeQuality;
    readonly metadata: KnowledgeMetadata;
    readonly createdAt: Date;
    readonly lastUsed: Date;
    readonly useCount: number;
}
export declare const KnowledgeType: {
    readonly PROBLEM_SOLVING_PATTERN: "problem_solving_pattern";
    readonly ERROR_RECOVERY_STRATEGY: "error_recovery_strategy";
    readonly OPTIMIZATION_TECHNIQUE: "optimization_technique";
    readonly COLLABORATION_APPROACH: "collaboration_approach";
    readonly ADAPTATION_STRATEGY: "adaptation_strategy";
    readonly PERFORMANCE_INSIGHT: "performance_insight";
    readonly CONTEXT_UNDERSTANDING: "context_understanding";
    readonly RESOURCE_MANAGEMENT: "resource_management";
};
export type KnowledgeType = typeof KnowledgeType[keyof typeof KnowledgeType];
export interface KnowledgeContent {
    readonly title: string;
    readonly description: string;
    readonly keyInsights: readonly string[];
    readonly geneticMarkerPatterns: Partial<GeneticMarkers>;
    readonly performanceImpacts: Partial<PerformanceMetrics>;
    readonly contextualFactors: readonly string[];
    readonly prerequisites: readonly string[];
    readonly contraindications: readonly string[];
    readonly examples: readonly KnowledgeExample[];
}
export interface KnowledgeExample {
    readonly scenario: string;
    readonly application: string;
    readonly outcome: string;
    readonly lessons: readonly string[];
}
export interface KnowledgeApplicability {
    readonly projectTypes: readonly string[];
    readonly complexityLevels: readonly string[];
    readonly teamSizes: readonly number[];
    readonly techStacks: readonly string[];
    readonly contextualRequirements: readonly string[];
    readonly exclusions: readonly string[];
}
export interface KnowledgeQuality {
    readonly reliability: number;
    readonly generalizability: number;
    readonly specificity: number;
    readonly novelty: number;
    readonly impact: number;
    readonly confidence: number;
}
export interface KnowledgeMetadata {
    readonly sourceTask: TaskId;
    readonly discoveryMethod: 'evolution' | 'analysis' | 'observation' | 'transfer';
    readonly validationStatus: 'unvalidated' | 'partially_validated' | 'validated' | 'invalidated';
    readonly transferCount: number;
    readonly successRate: number;
    readonly avgImprovement: number;
    readonly tags: readonly string[];
    readonly relatedKnowledge: readonly KnowledgeItemId[];
}
export interface KnowledgeTransferRequest {
    readonly id: KnowledgeTransferId;
    readonly sourceKnowledge: KnowledgeItem;
    readonly targetAgentId: AgentInstanceId;
    readonly targetDnaId: EvolutionDnaId;
    readonly targetProjectId: ProjectContextId;
    readonly transferType: TransferType;
    readonly adaptationRequired: KnowledgeAdaptation;
    readonly expectedOutcome: TransferOutcome;
    readonly requestedAt: Date;
    readonly priority: 'low' | 'medium' | 'high' | 'critical';
}
export declare const TransferType: {
    readonly DIRECT_APPLICATION: "direct_application";
    readonly ADAPTIVE_TRANSFER: "adaptive_transfer";
    readonly INSPIRATIONAL_TRANSFER: "inspirational_transfer";
    readonly HYBRID_TRANSFER: "hybrid_transfer";
};
export type TransferType = typeof TransferType[keyof typeof TransferType];
export interface KnowledgeAdaptation {
    readonly geneticModifications: Record<keyof GeneticMarkers, number>;
    readonly contextualAdjustments: readonly string[];
    readonly performanceExpectations: Partial<PerformanceMetrics>;
    readonly riskAssessment: {
        readonly level: 'low' | 'medium' | 'high';
        readonly factors: readonly string[];
        readonly mitigations: readonly string[];
    };
    readonly adaptationSteps: readonly AdaptationStep[];
}
export interface AdaptationStep {
    readonly step: number;
    readonly description: string;
    readonly action: string;
    readonly expectedDuration: number;
    readonly successCriteria: readonly string[];
    readonly rollbackPlan: string;
}
export interface TransferOutcome {
    readonly expectedImprovement: number;
    readonly confidence: number;
    readonly timeline: number;
    readonly successProbability: number;
    readonly riskLevel: 'low' | 'medium' | 'high';
}
export interface KnowledgeTransferResult {
    readonly transferId: KnowledgeTransferId;
    readonly success: boolean;
    readonly actualImprovement: number;
    readonly transferDuration: number;
    readonly adaptationsApplied: readonly string[];
    readonly lessonsLearned: readonly string[];
    readonly followUpActions: readonly string[];
    readonly validationStatus: 'pending' | 'validated' | 'failed';
}
export interface CrossProjectLearningSession {
    readonly id: LearningSessionId;
    readonly participatingProjects: readonly ProjectContextId[];
    readonly participatingAgents: readonly AgentInstanceId[];
    readonly sessionType: 'knowledge_sharing' | 'pattern_exchange' | 'collaborative_learning';
    readonly sharedKnowledge: readonly KnowledgeItem[];
    readonly transfersInitiated: readonly KnowledgeTransferRequest[];
    readonly outcomes: readonly KnowledgeTransferResult[];
    readonly startedAt: Date;
    readonly completedAt?: Date;
    readonly sessionMetrics: SessionMetrics;
}
export interface SessionMetrics {
    readonly knowledgeItemsShared: number;
    readonly transfersAttempted: number;
    readonly transfersSuccessful: number;
    readonly avgImprovementAchieved: number;
    readonly participationLevel: number;
    readonly diversityIndex: number;
    readonly noveltyScore: number;
}
export declare class KnowledgeTransferService extends EventEmitter {
    private readonly knowledgeBase;
    private readonly activeTransfers;
    private readonly transferHistory;
    private readonly learningSessionHistory;
    private sessionCleanupTimer?;
    constructor();
    /**
     * Extract knowledge from agent DNA evolution events
     */
    extractKnowledge(agentId: AgentInstanceId, dnaId: EvolutionDnaId, projectId: ProjectContextId, taskId: TaskId, evolutionHistory: readonly Mutation[], performanceImprovement: number, context: ProjectContext): Promise<readonly KnowledgeItem[]>;
    /**
     * Find relevant knowledge for an agent in a specific context
     */
    findRelevantKnowledge(targetAgentId: AgentInstanceId, targetProjectId: ProjectContextId, targetContext: ProjectContext, currentDna: CodeDNA, maxResults?: number): Promise<readonly KnowledgeItem[]>;
    /**
     * Initiate knowledge transfer
     */
    initiateKnowledgeTransfer(knowledgeId: KnowledgeItemId, targetAgentId: AgentInstanceId, targetDnaId: EvolutionDnaId, targetProjectId: ProjectContextId, priority?: KnowledgeTransferRequest['priority']): Promise<KnowledgeTransferRequest>;
    /**
     * Execute knowledge transfer
     */
    executeKnowledgeTransfer(transferId: KnowledgeTransferId, _targetDna: CodeDNA): Promise<KnowledgeTransferResult>;
    /**
     * Start a cross-project learning session
     */
    startLearningSession(participatingProjects: readonly ProjectContextId[], participatingAgents: readonly AgentInstanceId[], sessionType: CrossProjectLearningSession['sessionType']): Promise<LearningSessionId>;
    /**
     * Get knowledge transfer statistics
     */
    getTransferStatistics(): {
        readonly totalKnowledgeItems: number;
        readonly totalTransfers: number;
        readonly successRate: number;
        readonly avgImprovement: number;
        readonly knowledgeByType: Record<KnowledgeType, number>;
        readonly transfersByType: Record<TransferType, number>;
        readonly topPerformingKnowledge: readonly {
            readonly id: KnowledgeItemId;
            readonly title: string;
            readonly useCount: number;
            readonly successRate: number;
            readonly avgImprovement: number;
        }[];
    };
    private createKnowledgeFromMutation;
    private extractPatternKnowledge;
    private classifyMutationType;
    private createKnowledgeContent;
    private determineApplicability;
    private assessKnowledgeQuality;
    private generateKnowledgeTags;
    private calculateRelevanceScore;
    private calculateContextCompatibility;
    private calculateGeneticRelevance;
    private analyzeAdaptationRequirements;
    private calculateTransferOutcome;
    private determineTransferType;
    private simulateAdaptationStep;
    private simulatePerformanceImprovement;
    private extractLessonsLearned;
    private generateFollowUpActions;
    private updateKnowledgeUsage;
    private gatherSharedKnowledge;
    private facilitateKnowledgeExchange;
    private calculateKnowledgeDiversity;
    private calculateNoveltyScore;
    private findCommonTargetGenes;
    private findCommonTriggers;
    private extractGeneticPatterns;
    private calculatePatternPerformanceImpacts;
    private createPatternExamples;
    private calculatePatternReliability;
    private calculatePatternImpact;
    private startSessionCleanup;
    /**
     * Clean up resources
     */
    destroy(): void;
}
export default KnowledgeTransferService;
//# sourceMappingURL=knowledge-transfer.d.ts.map