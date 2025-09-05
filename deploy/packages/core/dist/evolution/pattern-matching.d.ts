/**
 * Vector-based Pattern Matching System for Cross-Project Learning
 *
 * This module provides vector similarity matching for DNA patterns,
 * enabling intelligent cross-project knowledge transfer and learning.
 *
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import type { CodeDNA, EvolutionDnaId, ProjectContextId, GeneticMarkers, PatternTypeEnum, VectorLike, EmbeddingOperations, Brand } from '../types';
export type PatternMatchingId = Brand<string, 'PatternMatchingId'>;
export type EmbeddingVector = Brand<readonly number[], 'EmbeddingVector'>;
export interface PatternSimilarityResult {
    readonly sourcePattern: CodeDNA;
    readonly targetPattern: CodeDNA;
    readonly similarity: number;
    readonly contextCompatibility: number;
    readonly geneticAlignment: number;
    readonly performanceAlignment: number;
    readonly overallScore: number;
    readonly transferPotential: number;
    readonly reasoning: string;
}
export interface PatternCluster {
    readonly id: string;
    readonly centroid: EmbeddingVector;
    readonly patterns: readonly CodeDNA[];
    readonly dominantCharacteristics: {
        readonly patternType: PatternTypeEnum;
        readonly avgGeneration: number;
        readonly avgFitness: number;
        readonly commonTechStack: readonly string[];
        readonly contextTypes: readonly string[];
    };
    readonly diversity: number;
}
export interface CrossProjectTransferCandidate {
    readonly id: string;
    readonly sourceDnaId: EvolutionDnaId;
    readonly targetProjectId: ProjectContextId;
    readonly similarity: number;
    readonly adaptationRequired: {
        readonly geneticModifications: Record<keyof GeneticMarkers, number>;
        readonly contextualChanges: readonly string[];
        readonly riskLevel: 'low' | 'medium' | 'high';
    };
    readonly expectedOutcome: {
        readonly fitnessImprovement: number;
        readonly confidence: number;
        readonly timeline: number;
    };
}
export interface PatternMatchingConfig {
    readonly embeddingDimensions: number;
    readonly similarityThreshold: number;
    readonly contextWeight: number;
    readonly geneticWeight: number;
    readonly performanceWeight: number;
    readonly diversityWeight: number;
    readonly maxClusters: number;
    readonly adaptationRiskThreshold: number;
}
export declare class VectorOperations implements EmbeddingOperations {
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
    private encodeContext;
    private kMeansClustering;
    private initializeCentroids;
    private updateCentroids;
    private checkConvergence;
}
export declare class PatternMatchingService {
    private readonly config;
    private readonly vectorOps;
    private patternEmbeddingCache;
    constructor(config?: Partial<PatternMatchingConfig>);
    /**
     * Find patterns similar to the given DNA pattern
     */
    findSimilarPatterns(queryDna: CodeDNA, candidatePatterns: readonly CodeDNA[], maxResults?: number): Promise<readonly PatternSimilarityResult[]>;
    /**
     * Calculate detailed similarity between two DNA patterns
     */
    calculatePatternSimilarity(sourcePattern: CodeDNA, targetPattern: CodeDNA): Promise<PatternSimilarityResult>;
    /**
     * Generate transfer candidates for cross-project learning
     */
    generateTransferCandidates(sourceDna: CodeDNA, targetProjectId: ProjectContextId, candidateProjects: readonly {
        projectId: ProjectContextId;
        patterns: readonly CodeDNA[];
    }[]): Promise<readonly CrossProjectTransferCandidate[]>;
    /**
     * Cluster DNA patterns for analysis
     */
    clusterPatterns(patterns: readonly CodeDNA[], numClusters?: number): Promise<readonly PatternCluster[]>;
    private getOrGenerateEmbedding;
    private calculateContextCompatibility;
    private calculateGeneticAlignment;
    private calculatePerformanceAlignment;
    private calculateTransferPotential;
    private generateSimilarityReasoning;
    private createTransferCandidate;
    private identifyContextualChanges;
    private analyzeCluster;
    private calculateCentroid;
    private getMostFrequent;
    private getMostFrequentItems;
    private calculateClusterDiversity;
    private calculateGeneticDistance;
    /**
     * Clear embedding cache to free memory
     */
    clearCache(): void;
}
export default PatternMatchingService;
//# sourceMappingURL=pattern-matching.d.ts.map