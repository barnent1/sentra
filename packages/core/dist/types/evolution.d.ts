/**
 * Evolution Type System for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * Comprehensive type definitions for evolutionary learning, DNA patterns, and genetic operations
 */
import type { EvolutionDnaId, AgentInstanceId, TaskId, ProjectContextId, Brand } from '@sentra/types';
/**
 * Additional branded types for evolution-specific operations
 */
export type MutationId = Brand<string, 'MutationId'>;
export type PatternId = Brand<string, 'PatternId'>;
export type EmbeddingId = Brand<string, 'EmbeddingId'>;
export type GenerationId = Brand<string, 'GenerationId'>;
export type FitnessScore = Brand<number, 'FitnessScore'>;
/**
 * Types of evolutionary patterns that can emerge
 */
export declare const PatternType: {
    readonly ANALYTICAL: "analytical";
    readonly CREATIVE: "creative";
    readonly SYSTEMATIC: "systematic";
    readonly ADAPTIVE: "adaptive";
    readonly COLLABORATIVE: "collaborative";
    readonly OPTIMIZATION_FOCUSED: "optimization_focused";
    readonly ERROR_RECOVERY: "error_recovery";
    readonly LEARNING_ACCELERATED: "learning_accelerated";
};
export type PatternTypeEnum = typeof PatternType[keyof typeof PatternType];
/**
 * Types of mutations that can occur in evolutionary DNA
 */
export declare const MutationType: {
    readonly GENETIC_DRIFT: "genetic_drift";
    readonly TARGETED_IMPROVEMENT: "targeted_improvement";
    readonly CROSSOVER: "crossover";
    readonly INNOVATION: "innovation";
    readonly REGRESSION: "regression";
    readonly ADAPTATION: "adaptation";
};
export type MutationTypeEnum = typeof MutationType[keyof typeof MutationType];
/**
 * Individual mutation record with comprehensive tracking
 */
export interface Mutation {
    readonly id: MutationId;
    readonly type: MutationTypeEnum;
    readonly targetGene: keyof GeneticMarkers;
    readonly previousValue: number;
    readonly newValue: number;
    readonly delta: number;
    readonly trigger: MutationTrigger;
    readonly confidence: number;
    readonly timestamp: Date;
    readonly context: MutationContext;
}
/**
 * What triggered this specific mutation
 */
export interface MutationTrigger {
    readonly type: 'performance_decline' | 'pattern_recognition' | 'user_feedback' | 'cross_pollination' | 'scheduled_evolution';
    readonly details: string;
    readonly sourceAgentId?: AgentInstanceId;
    readonly sourceTaskId?: TaskId;
}
/**
 * Context in which mutation occurred
 */
export interface MutationContext {
    readonly projectType: string;
    readonly taskComplexity: 'low' | 'medium' | 'high' | 'extreme';
    readonly teamDynamics: 'solo' | 'small_team' | 'large_team' | 'distributed';
    readonly pressureLevel: 'low' | 'moderate' | 'high' | 'critical';
    readonly environmentFactors: readonly string[];
}
/**
 * Comprehensive genetic markers for evolutionary agents
 * All values normalized to 0.0-1.0 range for consistency
 */
export interface GeneticMarkers {
    readonly complexity: number;
    readonly adaptability: number;
    readonly successRate: number;
    readonly transferability: number;
    readonly stability: number;
    readonly novelty: number;
    readonly patternRecognition: number;
    readonly errorRecovery: number;
    readonly communicationClarity: number;
    readonly learningVelocity: number;
    readonly resourceEfficiency: number;
    readonly collaborationAffinity: number;
    readonly riskTolerance: number;
    readonly thoroughness: number;
    readonly creativity: number;
    readonly persistence: number;
    readonly empathy: number;
    readonly pragmatism: number;
}
/**
 * Multi-dimensional performance metrics for evolutionary tracking
 */
export interface PerformanceMetrics {
    readonly successRate: number;
    readonly averageTaskCompletionTime: number;
    readonly codeQualityScore: number;
    readonly userSatisfactionRating: number;
    readonly adaptationSpeed: number;
    readonly errorRecoveryRate: number;
    readonly knowledgeRetention: number;
    readonly crossDomainTransfer: number;
    readonly computationalEfficiency: number;
    readonly responseLatency: number;
    readonly throughput: number;
    readonly resourceUtilization: number;
    readonly bugIntroductionRate: number;
    readonly testCoverage: number;
    readonly documentationQuality: number;
    readonly maintainabilityScore: number;
    readonly communicationEffectiveness: number;
    readonly teamIntegration: number;
    readonly feedbackIncorporation: number;
    readonly conflictResolution: number;
}
/**
 * Enhanced project context for specialized agent evolution
 */
export interface ProjectContext {
    readonly id: ProjectContextId;
    readonly projectType: 'web-app' | 'api' | 'cli' | 'library' | 'infrastructure' | 'ai-ml' | 'blockchain' | 'embedded';
    readonly techStack: readonly string[];
    readonly complexity: 'low' | 'medium' | 'high' | 'enterprise' | 'research';
    readonly teamSize: number;
    readonly timeline: string;
    readonly requirements: readonly string[];
    readonly industryDomain: string;
    readonly regulatoryCompliance: readonly string[];
    readonly performanceRequirements: PerformanceRequirements;
    readonly scalabilityNeeds: ScalabilityNeeds;
    readonly securityRequirements: SecurityRequirements;
    readonly developmentStage: 'proof-of-concept' | 'mvp' | 'production' | 'legacy-maintenance';
    readonly testingStrategy: 'unit' | 'integration' | 'e2e' | 'comprehensive';
    readonly deploymentStrategy: 'manual' | 'ci-cd' | 'blue-green' | 'canary';
    readonly monitoringNeeds: 'basic' | 'advanced' | 'enterprise';
}
/**
 * Performance requirements for project context
 */
export interface PerformanceRequirements {
    readonly maxResponseTime: number;
    readonly minThroughput: number;
    readonly availabilityTarget: number;
    readonly errorRateThreshold: number;
}
/**
 * Scalability requirements
 */
export interface ScalabilityNeeds {
    readonly expectedGrowthRate: number;
    readonly peakLoadCapacity: number;
    readonly dataVolumeGrowth: string;
    readonly horizontalScaling: boolean;
}
/**
 * Security requirements
 */
export interface SecurityRequirements {
    readonly authenticationMethod: 'basic' | 'oauth' | 'jwt' | 'saml' | 'custom';
    readonly encryptionRequirements: readonly string[];
    readonly auditingNeeds: 'basic' | 'comprehensive' | 'regulatory';
    readonly dataPrivacyLevel: 'public' | 'internal' | 'confidential' | 'restricted';
}
/**
 * Complete DNA record representing an evolutionary agent's genetic makeup
 * This is the core unit that evolves over time
 */
export interface CodeDNA {
    readonly id: EvolutionDnaId;
    readonly patternType: PatternTypeEnum;
    readonly context: ProjectContext;
    readonly genetics: GeneticMarkers;
    readonly performance: PerformanceMetrics;
    readonly mutations: readonly Mutation[];
    readonly embedding: readonly number[];
    readonly timestamp: Date;
    readonly generation: number;
    readonly parentId?: EvolutionDnaId;
    readonly birthContext: BirthContext;
    readonly evolutionHistory: readonly EvolutionStep[];
    readonly activationCount: number;
    readonly lastActivation: Date;
    readonly fitnessScore: FitnessScore;
    readonly viabilityAssessment: ViabilityAssessment;
    readonly reproductionPotential: number;
    readonly tags: readonly string[];
    readonly notes: string;
    readonly isArchived: boolean;
}
/**
 * Context in which this DNA was created
 */
export interface BirthContext {
    readonly trigger: 'initial_spawn' | 'evolution' | 'crossover' | 'manual_creation';
    readonly sourceAgentId?: AgentInstanceId;
    readonly sourceTaskId?: TaskId;
    readonly creationReason: string;
    readonly initialPerformance: PerformanceMetrics;
}
/**
 * Individual step in evolution history
 */
export interface EvolutionStep {
    readonly stepId: string;
    readonly timestamp: Date;
    readonly trigger: MutationTrigger;
    readonly changes: readonly Mutation[];
    readonly performanceBefore: PerformanceMetrics;
    readonly performanceAfter: PerformanceMetrics;
    readonly outcome: 'improvement' | 'degradation' | 'neutral';
}
/**
 * Assessment of DNA viability and potential
 */
export interface ViabilityAssessment {
    readonly overallScore: number;
    readonly strengths: readonly string[];
    readonly weaknesses: readonly string[];
    readonly recommendedContexts: readonly string[];
    readonly avoidContexts: readonly string[];
    readonly lastAssessment: Date;
    readonly confidenceLevel: number;
}
/**
 * Constraint for vector operations ensuring proper dimensionality
 */
export interface VectorLike<D extends number = number> {
    readonly length: D;
    readonly [index: number]: number;
}
/**
 * Vector operations with type safety
 */
export interface VectorOperations {
    /**
     * Compute cosine similarity between two vectors
     */
    cosineSimilarity<D extends number>(a: VectorLike<D>, b: VectorLike<D>): number;
    /**
     * Compute Euclidean distance between vectors
     */
    euclideanDistance<D extends number>(a: VectorLike<D>, b: VectorLike<D>): number;
    /**
     * Normalize vector to unit length
     */
    normalize<D extends number>(vector: VectorLike<D>): VectorLike<D>;
    /**
     * Find most similar vectors in a collection
     */
    findSimilar<D extends number>(query: VectorLike<D>, candidates: readonly VectorLike<D>[], topK: number, threshold?: number): readonly {
        vector: VectorLike<D>;
        similarity: number;
        index: number;
    }[];
}
/**
 * Embedding operations for DNA similarity
 */
export interface EmbeddingOperations extends VectorOperations {
    /**
     * Generate embedding for DNA pattern
     */
    generateDnaEmbedding(dna: CodeDNA): Promise<readonly number[]>;
    /**
     * Find similar DNA patterns based on embeddings
     */
    findSimilarDna(queryDna: CodeDNA, candidates: readonly CodeDNA[], threshold?: number): Promise<readonly {
        dna: CodeDNA;
        similarity: number;
    }[]>;
    /**
     * Cluster DNA patterns by similarity
     */
    clusterDnaPatterns(dnaCollection: readonly CodeDNA[], numClusters: number): Promise<readonly (readonly CodeDNA[])[]>;
}
/**
 * Parameters for DNA evolution operations
 */
export interface EvolutionParameters {
    readonly mutationRate: number;
    readonly crossoverRate: number;
    readonly selectionPressure: number;
    readonly elitismRatio: number;
    readonly diversityWeight: number;
    readonly noveltyBonus: number;
}
/**
 * Results of evolution operation
 */
export interface EvolutionResult {
    readonly success: boolean;
    readonly newDna?: CodeDNA;
    readonly parentDna: readonly CodeDNA[];
    readonly evolutionType: MutationTypeEnum;
    readonly improvementScore: number;
    readonly confidence: number;
    readonly reasoning: string;
    readonly metadata: Record<string, unknown>;
}
/**
 * Interface for the evolution engine
 */
export interface EvolutionEngine {
    /**
     * Evolve a single DNA based on performance feedback
     */
    evolveDna(parentDna: CodeDNA, feedback: PerformanceFeedback, parameters: EvolutionParameters): Promise<EvolutionResult>;
    /**
     * Perform crossover between two DNA patterns
     */
    crossoverDna(parent1: CodeDNA, parent2: CodeDNA, parameters: EvolutionParameters): Promise<EvolutionResult>;
    /**
     * Generate a new DNA pattern based on context
     */
    generateNewDna(context: ProjectContext, seedPatterns?: readonly CodeDNA[]): Promise<CodeDNA>;
    /**
     * Assess fitness of DNA in given context
     */
    assessFitness(dna: CodeDNA, context: ProjectContext, historicalData?: readonly PerformanceMetrics[]): Promise<FitnessScore>;
}
/**
 * Performance feedback for evolution
 */
export interface PerformanceFeedback {
    readonly taskId: TaskId;
    readonly agentId: AgentInstanceId;
    readonly dnaId: EvolutionDnaId;
    readonly outcome: 'success' | 'failure' | 'partial';
    readonly metrics: PerformanceMetrics;
    readonly userSatisfaction?: number;
    readonly improvements: readonly string[];
    readonly regressions: readonly string[];
    readonly context: ProjectContext;
    readonly timestamp: Date;
}
export type { EvolutionDnaId, AgentInstanceId, TaskId, ProjectContextId, LearningOutcomeId, EvolutionEventId, } from '@sentra/types';
//# sourceMappingURL=evolution.d.ts.map