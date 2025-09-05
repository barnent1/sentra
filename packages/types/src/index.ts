// Sentra Evolutionary Agent System - Core Types
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces

/**
 * Brand utility type for creating nominal types
 */
export type Brand<T, U> = T & { readonly __brand: U };

/**
 * Branded ID types for type safety
 */
export type EvolutionDnaId = Brand<string, 'EvolutionDnaId'>;
export type AgentInstanceId = Brand<string, 'AgentInstanceId'>;
export type ProjectContextId = Brand<string, 'ProjectContextId'>;
export type TaskId = Brand<string, 'TaskId'>;
export type UserId = Brand<string, 'UserId'>;
export type LearningOutcomeId = Brand<string, 'LearningOutcomeId'>;
export type EvolutionEventId = Brand<string, 'EvolutionEventId'>;

/**
 * Core evolutionary genetics interface
 */
export interface GeneticMarkers {
  readonly complexity: number;
  readonly adaptability: number;
  readonly successRate: number;
  readonly transferability: number;
  readonly stability: number;
  readonly novelty: number;
}

/**
 * Performance metrics for evolutionary tracking
 */
export interface PerformanceMetrics {
  readonly successRate: number;
  readonly averageTaskCompletionTime: number;
  readonly codeQualityScore: number;
  readonly userSatisfactionRating: number;
  readonly adaptationSpeed: number;
  readonly errorRecoveryRate: number;
}

/**
 * Project context for agent specialization
 */
export interface ProjectContext {
  readonly id: ProjectContextId;
  readonly projectType: 'web-app' | 'api' | 'cli' | 'library' | 'infrastructure' | 'ai-ml' | 'blockchain' | 'embedded';
  readonly techStack: readonly string[];
  readonly complexity: 'low' | 'medium' | 'high' | 'enterprise' | 'research';
  readonly teamSize: number;
  readonly timeline: string;
  readonly requirements: readonly string[];
}

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  readonly id: AgentInstanceId;
  readonly name: string;
  readonly specialization: string;
  readonly capabilities: readonly string[];
  readonly evolutionDnaId: EvolutionDnaId;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Pattern types for evolutionary DNA
 */
export const PatternType = {
  ANALYTICAL: 'analytical',
  CREATIVE: 'creative', 
  SYSTEMATIC: 'systematic',
  OPTIMIZATION: 'optimization',
  DEBUGGING: 'debugging',
  INTEGRATION: 'integration',
} as const;

export type PatternType = typeof PatternType[keyof typeof PatternType];

/**
 * Agent types for specialized roles
 */
export const AgentType = {
  DEVELOPER: 'developer',
  TESTER: 'tester',
  REVIEWER: 'reviewer',
  ORCHESTRATOR: 'orchestrator',
  ANALYST: 'analyst',
  DESIGNER: 'designer',
} as const;

export type AgentType = typeof AgentType[keyof typeof AgentType];

/**
 * Agent status enumeration
 */
export const AgentStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive', 
  ARCHIVED: 'archived',
  SPAWNING: 'spawning',
  TERMINATING: 'terminating',
} as const;

export type AgentStatus = typeof AgentStatus[keyof typeof AgentStatus];

/**
 * Task types for classification
 */
export const TaskType = {
  DEVELOPMENT: 'development',
  TESTING: 'testing',
  REVIEW: 'review',
  DEPLOYMENT: 'deployment',
  ANALYSIS: 'analysis',
  DESIGN: 'design',
} as const;

export type TaskType = typeof TaskType[keyof typeof TaskType];

/**
 * Learning outcome types
 */
export const OutcomeType = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  PARTIAL: 'partial',
  BLOCKED: 'blocked',
  IMPROVEMENT: 'improvement',
} as const;

export type OutcomeType = typeof OutcomeType[keyof typeof OutcomeType];

/**
 * Evolution event types
 */
export const EventType = {
  DNA_EVOLUTION: 'dna_evolution',
  AGENT_SPAWN: 'agent_spawn',
  AGENT_TERMINATE: 'agent_terminate',
  LEARNING_EVENT: 'learning_event',
  PERFORMANCE_MILESTONE: 'performance_milestone',
} as const;

export type EventType = typeof EventType[keyof typeof EventType];

/**
 * Task status enumeration
 */
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress', 
  COMPLETED: 'completed',
  FAILED: 'failed',
  BLOCKED: 'blocked',
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];

/**
 * Task priority levels
 */
export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];

/**
 * Agent capabilities interface
 */
export interface AgentCapabilities {
  readonly canCode: boolean;
  readonly canTest: boolean;
  readonly canReview: boolean;
  readonly canDeploy: boolean;
  readonly canAnalyze: boolean;
  readonly canDesign: boolean;
  readonly languages: readonly string[];
  readonly frameworks: readonly string[];
  readonly tools: readonly string[];
  readonly maxComplexity: 'low' | 'medium' | 'high' | 'enterprise';
}

/**
 * Enhanced genetic markers for evolutionary DNA
 */
export interface EnhancedGeneticMarkers extends GeneticMarkers {
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
 * Enhanced performance metrics for comprehensive tracking
 */
export interface EnhancedPerformanceMetrics extends PerformanceMetrics {
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
 * Mutation interface for tracking genetic changes
 */
export interface Mutation {
  readonly id: string;
  readonly strategy: string;
  readonly changes: Record<string, unknown>;
  readonly timestamp: Date;
  readonly reason: string;
  readonly impact: number;
}

/**
 * Birth context for DNA patterns
 */
export interface BirthContext {
  readonly trigger: string;
  readonly creationReason: string;
  readonly initialPerformance: EnhancedPerformanceMetrics;
}

/**
 * Viability assessment for DNA patterns
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
 * Fitness score branded type
 */
export type FitnessScore = Brand<number, 'FitnessScore'>;

/**
 * Enhanced CodeDNA interface
 */
export interface CodeDNA {
  readonly id: EvolutionDnaId;
  readonly patternType: string;
  readonly context: ProjectContext;
  readonly genetics: EnhancedGeneticMarkers;
  readonly performance: EnhancedPerformanceMetrics;
  readonly mutations: readonly Mutation[];
  readonly embedding: readonly number[];
  readonly timestamp: Date;
  readonly generation: number;
  readonly parentId?: EvolutionDnaId;
  readonly birthContext: BirthContext;
  readonly evolutionHistory: readonly string[];
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
 * Evolution result interface
 */
export interface EvolutionResult {
  readonly success: boolean;
  readonly originalPattern: CodeDNA;
  readonly evolvedPattern: CodeDNA;
  readonly fitnessImprovement: number;
  readonly generationNumber: number;
  readonly reason: string;
  readonly metadata: Record<string, unknown>;
}

/**
 * Task interface with strict typing
 */
export interface Task {
  readonly id: TaskId;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatusType;
  readonly priority: TaskPriorityType;
  readonly assignedAgentId?: AgentInstanceId;
  readonly projectContextId: ProjectContextId;
  readonly dependencies: readonly TaskId[];
  readonly estimatedDuration: number; // in minutes
  readonly actualDuration?: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly completedAt?: Date;
}

/**
 * Evolution DNA record interface
 */
export interface EvolutionDna {
  readonly id: EvolutionDnaId;
  readonly patternType: string;
  readonly genetics: GeneticMarkers;
  readonly performance: PerformanceMetrics;
  readonly projectContext: ProjectContext;
  readonly generation: number;
  readonly parentId?: EvolutionDnaId;
  readonly embedding?: readonly number[]; // Vector embedding for similarity
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Agent instance record interface
 */
export interface AgentInstance {
  readonly id: AgentInstanceId;
  readonly evolutionDnaId: EvolutionDnaId;
  readonly name: string;
  readonly role: string;
  readonly status: 'active' | 'inactive' | 'archived';
  readonly currentTaskId?: TaskId;
  readonly spawnedAt: Date;
  readonly lastActiveAt: Date;
  readonly performanceHistory: readonly PerformanceMetrics[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Learning outcome record interface
 */
export interface LearningOutcome {
  readonly id: LearningOutcomeId;
  readonly agentInstanceId: AgentInstanceId;
  readonly evolutionDnaId: EvolutionDnaId;
  readonly taskId: TaskId;
  readonly outcomeType: 'success' | 'failure' | 'partial' | 'blocked';
  readonly performanceImprovement: number; // -1.0 to 1.0
  readonly lessonLearned: string;
  readonly contextFactors: readonly string[];
  readonly applicabilityScore: number; // 0.0 to 1.0
  readonly embedding?: readonly number[]; // Vector embedding for similarity
  readonly createdAt: Date;
}

/**
 * Evolution event record interface  
 */
export interface EvolutionEvent {
  readonly id: EvolutionEventId;
  readonly parentDnaId: EvolutionDnaId;
  readonly childDnaId: EvolutionDnaId;
  readonly agentInstanceId: AgentInstanceId;
  readonly evolutionTrigger: 'performance_threshold' | 'manual' | 'time_based' | 'pattern_recognition';
  readonly geneticChanges: Record<string, { from: unknown; to: unknown }>;
  readonly performanceDelta: PerformanceMetrics;
  readonly confidenceScore: number; // 0.0 to 1.0
  readonly createdAt: Date;
}

/**
 * API Response wrapper with error handling
 */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly timestamp: Date;
}

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly username: string;
  readonly password: string;
  readonly ssl?: boolean;
  readonly maxConnections?: number;
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly database: DatabaseConfig;
  readonly api: {
    readonly port: number;
    readonly host: string;
    readonly corsOrigins: readonly string[];
  };
  readonly logging: {
    readonly level: 'debug' | 'info' | 'warn' | 'error';
    readonly format: 'json' | 'pretty';
  };
}

// Re-export all types for convenience
export * from './index';