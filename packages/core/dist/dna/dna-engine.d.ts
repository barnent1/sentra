/**
 * Production DNA Evolution Engine for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This engine handles:
 * - Pattern mutation and evolution
 * - Multi-criteria fitness evaluation
 * - Vector-based similarity matching
 * - Cross-project learning
 * - Performance optimization
 */
import { EventEmitter } from 'events';
import type { CodeDNA, ProjectContext, EvolutionResult } from '@sentra/types';
/**
 * DNA Engine configuration interface
 */
export interface DNAEngineConfig {
    readonly mutationRate: number;
    readonly crossoverRate: number;
    readonly maxGenerations: number;
    readonly populationSize: number;
    readonly fitnessThreshold: number;
    readonly diversityWeight: number;
    readonly performanceWeight: number;
    readonly contextWeight: number;
}
/**
 * Evolution parameters for specific evolution requests
 */
export interface EvolutionParameters {
    readonly targetFitness?: number;
    readonly maxIterations?: number;
    readonly allowableRisk?: number;
    readonly priorityWeights?: {
        readonly performance?: number;
        readonly stability?: number;
        readonly adaptability?: number;
        readonly novelty?: number;
    };
}
/**
 * Mutation strategy types
 */
export declare const MutationStrategy: {
    readonly OPTIMIZATION: "optimization";
    readonly ADAPTATION: "adaptation";
    readonly SIMPLIFICATION: "simplification";
    readonly DIVERSIFICATION: "diversification";
    readonly SPECIALIZATION: "specialization";
};
export type MutationStrategyType = typeof MutationStrategy[keyof typeof MutationStrategy];
/**
 * Production DNA Evolution Engine
 */
export declare class DNAEngine extends EventEmitter {
    private readonly config;
    private readonly patterns;
    private generationCounter;
    constructor(config?: Partial<DNAEngineConfig>);
    /**
     * Evolve a DNA pattern based on performance feedback and context
     */
    evolvePattern(pattern: CodeDNA, context: ProjectContext, parameters?: EvolutionParameters): Promise<EvolutionResult>;
    /**
     * Generate multiple evolution candidates using different strategies
     */
    private generateEvolutionCandidates;
    /**
     * Apply optimization mutation to improve performance metrics
     */
    private applyOptimizationMutation;
    /**
     * Apply adaptation mutation to better fit project context
     */
    private applyAdaptationMutation;
    /**
     * Apply simplification mutation to reduce complexity
     */
    private applySimplificationMutation;
    /**
     * Apply diversification mutation to explore new solutions
     */
    private applyDiversificationMutation;
    /**
     * Apply specialization mutation for specific project contexts
     */
    private applySpecializationMutation;
    /**
     * Evaluate fitness of a DNA pattern for a given context
     */
    private evaluateFitness;
    /**
     * Calculate performance score from metrics
     */
    private calculatePerformanceScore;
    /**
     * Calculate context matching score
     */
    private calculateContextMatch;
    /**
     * Calculate genetic health score
     */
    private calculateGeneticHealth;
    /**
     * Calculate diversity score to encourage genetic diversity
     */
    private calculateDiversityScore;
    /**
     * Calculate genetic distance between two genetic markers
     */
    private calculateGeneticDistance;
    /**
     * Select best candidate from evolution candidates
     */
    private selectBestCandidate;
    /**
     * Validate that evolution is beneficial and safe
     */
    private validateEvolution;
    /**
     * Determine the best mutation strategy from candidates
     */
    private determineBestStrategy;
    /**
     * Get evolution statistics
     */
    getEvolutionStats(): {
        totalPatterns: number;
        generationCounter: number;
        averageFitness: number;
        diversityIndex: number;
        config: DNAEngineConfig;
    };
    private calculateAverageFitness;
    private calculateDiversityIndex;
    /**
     * Generate new DNA pattern from scratch or based on seed patterns
     */
    generateNewDna(projectContext: ProjectContext, seedPatterns?: readonly CodeDNA[]): Promise<CodeDNA>;
    private averageGenetics;
    private generateDefaultGenetics;
    private applyGeneticRandomization;
    private generateEmbedding;
    private determinePatternType;
}
export default DNAEngine;
//# sourceMappingURL=dna-engine.d.ts.map