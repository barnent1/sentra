/**
 * Evolution Type System for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * Comprehensive type definitions for evolutionary learning, DNA patterns, and genetic operations
 */

import type {
  EvolutionDnaId,
  AgentInstanceId,
  TaskId,
  ProjectContextId,
  Brand,
} from '@sentra/types';

// ============================================================================
// BRANDED TYPES FOR EVOLUTION SUBSYSTEM
// ============================================================================

/**
 * Additional branded types for evolution-specific operations
 */
export type MutationId = Brand<string, 'MutationId'>;
export type PatternId = Brand<string, 'PatternId'>;
export type EmbeddingId = Brand<string, 'EmbeddingId'>;
export type GenerationId = Brand<string, 'GenerationId'>;
export type FitnessScore = Brand<number, 'FitnessScore'>;

// ============================================================================
// PATTERN AND MUTATION TYPES
// ============================================================================

/**
 * Types of evolutionary patterns that can emerge
 */
export const PatternType = {
  ANALYTICAL: 'analytical',
  CREATIVE: 'creative', 
  SYSTEMATIC: 'systematic',
  ADAPTIVE: 'adaptive',
  COLLABORATIVE: 'collaborative',
  OPTIMIZATION_FOCUSED: 'optimization_focused',
  ERROR_RECOVERY: 'error_recovery',
  LEARNING_ACCELERATED: 'learning_accelerated',
} as const;

export type PatternTypeEnum = typeof PatternType[keyof typeof PatternType];

/**
 * Types of mutations that can occur in evolutionary DNA
 */
export const MutationType = {
  GENETIC_DRIFT: 'genetic_drift',           // Random small changes
  TARGETED_IMPROVEMENT: 'targeted_improvement', // Specific skill enhancement
  CROSSOVER: 'crossover',                   // Combining traits from parents
  INNOVATION: 'innovation',                 // Novel approach emergence  
  REGRESSION: 'regression',                 // Reverting unsuccessful changes
  ADAPTATION: 'adaptation',                 // Context-specific adjustments
} as const;

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
  readonly confidence: number; // 0.0-1.0, how confident we are this helps
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

// ============================================================================
// ENHANCED GENETIC MARKERS
// ============================================================================

/**
 * Comprehensive genetic markers for evolutionary agents
 * All values normalized to 0.0-1.0 range for consistency
 */
export interface GeneticMarkers {
  // Core cognitive abilities
  readonly complexity: number;        // 0-1, ability to handle complex problems
  readonly adaptability: number;      // 0-1, speed of adaptation to new contexts
  readonly successRate: number;       // 0-1, historical success in tasks
  readonly transferability: number;   // 0-1, cross-project knowledge transfer
  readonly stability: number;         // 0-1, consistency of performance
  readonly novelty: number;          // 0-1, tendency to find unique solutions
  
  // Specialized capabilities  
  readonly patternRecognition: number;    // 0-1, ability to identify patterns
  readonly errorRecovery: number;         // 0-1, resilience and recovery speed
  readonly communicationClarity: number;  // 0-1, clarity of communication
  readonly learningVelocity: number;      // 0-1, speed of learning from mistakes
  readonly resourceEfficiency: number;    // 0-1, efficient use of computational resources
  readonly collaborationAffinity: number; // 0-1, effectiveness in team environments
  
  // Behavioral traits
  readonly riskTolerance: number;         // 0-1, willingness to try new approaches
  readonly thoroughness: number;          // 0-1, attention to detail and completeness
  readonly creativity: number;            // 0-1, ability to generate novel solutions
  readonly persistence: number;           // 0-1, determination when facing obstacles
  readonly empathy: number;              // 0-1, understanding of user needs
  readonly pragmatism: number;           // 0-1, focus on practical, working solutions
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**
 * Multi-dimensional performance metrics for evolutionary tracking
 */
export interface PerformanceMetrics {
  // Task completion metrics
  readonly successRate: number;                    // 0-1, overall success rate
  readonly averageTaskCompletionTime: number;     // milliseconds
  readonly codeQualityScore: number;              // 0-1, based on static analysis
  readonly userSatisfactionRating: number;        // 0-1, user feedback score
  
  // Learning and adaptation metrics  
  readonly adaptationSpeed: number;               // 0-1, how quickly agent adapts
  readonly errorRecoveryRate: number;             // 0-1, recovery from failures
  readonly knowledgeRetention: number;            // 0-1, retention of learned patterns
  readonly crossDomainTransfer: number;           // 0-1, applying knowledge across domains
  
  // Resource utilization metrics
  readonly computationalEfficiency: number;       // 0-1, CPU/memory efficiency
  readonly responseLatency: number;               // milliseconds, average response time
  readonly throughput: number;                    // tasks per hour
  readonly resourceUtilization: number;           // 0-1, optimal resource usage
  
  // Quality metrics
  readonly bugIntroductionRate: number;           // bugs per task (lower is better)
  readonly testCoverage: number;                  // 0-1, test coverage of generated code
  readonly documentationQuality: number;          // 0-1, quality of documentation
  readonly maintainabilityScore: number;          // 0-1, code maintainability
  
  // Collaboration metrics
  readonly communicationEffectiveness: number;    // 0-1, clarity of communication
  readonly teamIntegration: number;               // 0-1, how well agent works with team
  readonly feedbackIncorporation: number;         // 0-1, how well feedback is used
  readonly conflictResolution: number;            // 0-1, ability to resolve disagreements
}

// ============================================================================
// PROJECT CONTEXT
// ============================================================================

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
  
  // Environmental factors
  readonly industryDomain: string;            // e.g., 'fintech', 'healthcare', 'gaming'
  readonly regulatoryCompliance: readonly string[]; // e.g., ['GDPR', 'HIPAA', 'SOX']
  readonly performanceRequirements: PerformanceRequirements;
  readonly scalabilityNeeds: ScalabilityNeeds;
  readonly securityRequirements: SecurityRequirements;
  
  // Development context
  readonly developmentStage: 'proof-of-concept' | 'mvp' | 'production' | 'legacy-maintenance';
  readonly testingStrategy: 'unit' | 'integration' | 'e2e' | 'comprehensive';
  readonly deploymentStrategy: 'manual' | 'ci-cd' | 'blue-green' | 'canary';
  readonly monitoringNeeds: 'basic' | 'advanced' | 'enterprise';
}

/**
 * Performance requirements for project context
 */
export interface PerformanceRequirements {
  readonly maxResponseTime: number;        // milliseconds
  readonly minThroughput: number;          // requests per second
  readonly availabilityTarget: number;     // 0.0-1.0 (e.g., 0.999 for 99.9%)
  readonly errorRateThreshold: number;     // 0.0-1.0, maximum acceptable error rate
}

/**
 * Scalability requirements 
 */
export interface ScalabilityNeeds {
  readonly expectedGrowthRate: number;     // multiplier per year
  readonly peakLoadCapacity: number;       // peak requests per second
  readonly dataVolumeGrowth: string;       // e.g., "10GB/month"
  readonly horizontalScaling: boolean;     // supports horizontal scaling
}

/**
 * Security requirements
 */
export interface SecurityRequirements {
  readonly authenticationMethod: 'basic' | 'oauth' | 'jwt' | 'saml' | 'custom';
  readonly encryptionRequirements: readonly string[]; // e.g., ['TLS', 'AES-256']
  readonly auditingNeeds: 'basic' | 'comprehensive' | 'regulatory';
  readonly dataPrivacyLevel: 'public' | 'internal' | 'confidential' | 'restricted';
}

// ============================================================================
// CODE DNA - THE CORE EVOLUTION UNIT
// ============================================================================

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
  readonly embedding: readonly number[];   // Vector embedding for similarity matching
  readonly timestamp: Date;
  readonly generation: number;
  readonly parentId?: EvolutionDnaId;
  
  // Lifecycle tracking
  readonly birthContext: BirthContext;
  readonly evolutionHistory: readonly EvolutionStep[];
  readonly activationCount: number;        // How many times this DNA has been used
  readonly lastActivation: Date;
  
  // Fitness and viability
  readonly fitnessScore: FitnessScore;
  readonly viabilityAssessment: ViabilityAssessment;
  readonly reproductionPotential: number; // 0-1, likelihood of being selected for reproduction
  
  // Metadata
  readonly tags: readonly string[];        // User-defined tags for organization
  readonly notes: string;                  // Human-readable notes about this DNA
  readonly isArchived: boolean;           // Whether this DNA is archived
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
  readonly overallScore: number;           // 0-1, overall viability
  readonly strengths: readonly string[];   // Key strengths of this DNA
  readonly weaknesses: readonly string[];  // Areas needing improvement
  readonly recommendedContexts: readonly string[]; // Where this DNA performs best
  readonly avoidContexts: readonly string[];      // Where this DNA performs poorly
  readonly lastAssessment: Date;
  readonly confidenceLevel: number;        // 0-1, confidence in assessment
}

// ============================================================================
// VECTOR OPERATIONS WITH PROPER GENERICS
// ============================================================================

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
  cosineSimilarity<D extends number>(
    a: VectorLike<D>, 
    b: VectorLike<D>
  ): number;
  
  /**
   * Compute Euclidean distance between vectors
   */
  euclideanDistance<D extends number>(
    a: VectorLike<D>, 
    b: VectorLike<D>
  ): number;
  
  /**
   * Normalize vector to unit length
   */
  normalize<D extends number>(vector: VectorLike<D>): VectorLike<D>;
  
  /**
   * Find most similar vectors in a collection
   */
  findSimilar<D extends number>(
    query: VectorLike<D>,
    candidates: readonly VectorLike<D>[],
    topK: number,
    threshold?: number
  ): readonly { vector: VectorLike<D>; similarity: number; index: number }[];
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
  findSimilarDna(
    queryDna: CodeDNA,
    candidates: readonly CodeDNA[],
    threshold?: number
  ): Promise<readonly { dna: CodeDNA; similarity: number }[]>;
  
  /**
   * Cluster DNA patterns by similarity
   */
  clusterDnaPatterns(
    dnaCollection: readonly CodeDNA[],
    numClusters: number
  ): Promise<readonly (readonly CodeDNA[])[]>;
}

// ============================================================================
// EVOLUTION ENGINE INTERFACES  
// ============================================================================

/**
 * Parameters for DNA evolution operations
 */
export interface EvolutionParameters {
  readonly mutationRate: number;           // 0-1, probability of mutation per gene
  readonly crossoverRate: number;          // 0-1, probability of crossover
  readonly selectionPressure: number;      // 0-1, strength of selection pressure
  readonly elitismRatio: number;          // 0-1, ratio of top performers to preserve
  readonly diversityWeight: number;        // 0-1, importance of maintaining diversity
  readonly noveltyBonus: number;          // 0-1, bonus for novel solutions
}

/**
 * Results of evolution operation
 */
export interface EvolutionResult {
  readonly success: boolean;
  readonly newDna?: CodeDNA;
  readonly parentDna: readonly CodeDNA[];
  readonly evolutionType: MutationTypeEnum;
  readonly improvementScore: number;       // -1 to 1, improvement over parent
  readonly confidence: number;             // 0-1, confidence in improvement
  readonly reasoning: string;              // Explanation of changes made
  readonly metadata: Record<string, unknown>;
}

/**
 * Interface for the evolution engine
 */
export interface EvolutionEngine {
  /**
   * Evolve a single DNA based on performance feedback
   */
  evolveDna(
    parentDna: CodeDNA,
    feedback: PerformanceFeedback,
    parameters: EvolutionParameters
  ): Promise<EvolutionResult>;
  
  /**
   * Perform crossover between two DNA patterns
   */
  crossoverDna(
    parent1: CodeDNA,
    parent2: CodeDNA,
    parameters: EvolutionParameters
  ): Promise<EvolutionResult>;
  
  /**
   * Generate a new DNA pattern based on context
   */
  generateNewDna(
    context: ProjectContext,
    seedPatterns?: readonly CodeDNA[]
  ): Promise<CodeDNA>;
  
  /**
   * Assess fitness of DNA in given context
   */
  assessFitness(
    dna: CodeDNA,
    context: ProjectContext,
    historicalData?: readonly PerformanceMetrics[]
  ): Promise<FitnessScore>;
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
  readonly userSatisfaction?: number;      // 0-1, optional user feedback
  readonly improvements: readonly string[]; // Specific areas that improved
  readonly regressions: readonly string[];  // Specific areas that regressed
  readonly context: ProjectContext;
  readonly timestamp: Date;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  // Core types re-exported for convenience
  EvolutionDnaId,
  AgentInstanceId,
  TaskId,
  ProjectContextId,
  LearningOutcomeId,
  EvolutionEventId,
} from '@sentra/types';