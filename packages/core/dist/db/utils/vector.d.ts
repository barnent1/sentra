/**
 * Vector utility functions for pgvector operations
 * Handles embedding operations and similarity searches
 */
import type { EvolutionDnaId, LearningOutcomeId } from '@sentra/types';
/**
 * Vector similarity search options
 */
export interface VectorSearchOptions {
    limit?: number;
    threshold?: number;
    operator?: 'cosine' | 'l2' | 'inner_product';
}
/**
 * Calculate cosine similarity between two vectors
 */
export declare const calculateCosineSimilarity: (vector1: number[], vector2: number[]) => number;
/**
 * Find similar DNA patterns using vector similarity
 */
export declare const findSimilarDnaPatterns: (queryEmbedding: number[], options?: VectorSearchOptions) => Promise<{
    id: string & {
        readonly __brand: "EvolutionDnaId";
    };
    patternType: string;
    genetics: import("@sentra/types").GeneticMarkers;
    performance: import("@sentra/types").PerformanceMetrics;
    projectContext: import("@sentra/types").ProjectContext;
    generation: number | null;
    similarity: unknown;
}[]>;
/**
 * Find similar learning outcomes using vector similarity
 */
export declare const findSimilarLearningOutcomes: (queryEmbedding: number[], options?: VectorSearchOptions) => Promise<{
    id: string & {
        readonly __brand: "LearningOutcomeId";
    };
    agentInstanceId: string & {
        readonly __brand: "AgentInstanceId";
    };
    outcomeType: string;
    lessonLearned: string;
    contextFactors: readonly string[];
    applicabilityScore: number;
    similarity: unknown;
}[]>;
/**
 * Update embedding for evolution DNA
 */
export declare const updateDnaEmbedding: (dnaId: EvolutionDnaId, embedding: number[]) => Promise<void>;
/**
 * Update embedding for learning outcome
 */
export declare const updateLearningOutcomeEmbedding: (outcomeId: LearningOutcomeId, embedding: number[]) => Promise<void>;
/**
 * Generate a random embedding vector for testing purposes
 */
export declare const generateRandomEmbedding: (dimensions?: number) => number[];
//# sourceMappingURL=vector.d.ts.map