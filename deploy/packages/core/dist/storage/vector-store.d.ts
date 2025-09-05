/**
 * Vector Store Implementation for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * Provides Qdrant-based vector storage for evolutionary patterns with:
 * - Pattern embedding and storage operations
 * - Similarity search with filtering capabilities
 * - Batch operations for high-throughput scenarios
 * - Error handling with exponential backoff retry logic
 */
import type { CodeDNA, EvolutionDnaId, PatternTypeEnum } from '../types/evolution';
/**
 * Vector store configuration with Qdrant and OpenAI settings
 */
export interface VectorStoreConfig {
    readonly qdrant: {
        readonly url: string;
        readonly apiKey?: string;
        readonly timeout?: number;
    };
    readonly openai: {
        readonly apiKey: string;
        readonly model?: string;
    };
    readonly collections: {
        readonly evolutionPatterns: string;
    };
    readonly embedding: {
        readonly dimensions: number;
    };
    readonly performance: {
        readonly batchSize: number;
        readonly maxRetries: number;
        readonly retryDelayMs: number;
    };
}
/**
 * Default configuration for vector store
 */
export declare const DEFAULT_VECTOR_CONFIG: VectorStoreConfig;
/**
 * Search filters for pattern queries
 */
export interface PatternSearchFilter {
    readonly patternTypes?: readonly PatternTypeEnum[];
    readonly generations?: readonly number[];
    readonly technologies?: readonly string[];
    readonly domains?: readonly string[];
    readonly performanceThresholds?: {
        readonly minSuccessRate?: number;
        readonly maxResponseTime?: number;
        readonly minThroughput?: number;
    };
    readonly geneticThresholds?: {
        readonly minComplexity?: number;
        readonly minAdaptability?: number;
        readonly minNovelty?: number;
    };
}
/**
 * Search result with similarity score
 */
export interface PatternSearchResult {
    readonly pattern: CodeDNA;
    readonly similarity: number;
    readonly distance: number;
}
/**
 * Batch operation result
 */
export interface BatchOperationResult {
    readonly success: boolean;
    readonly processedCount: number;
    readonly failedCount: number;
    readonly errors: readonly string[];
    readonly processingTimeMs: number;
}
/**
 * Embedding service for generating pattern embeddings
 */
export declare class EmbeddingService {
    private readonly openai;
    private readonly config;
    constructor(config: VectorStoreConfig);
    /**
     * Convert CodeDNA pattern to text for embedding generation
     */
    private patternToEmbeddingText;
    /**
     * Generate embedding for a CodeDNA pattern
     */
    generatePatternEmbedding(pattern: CodeDNA): Promise<readonly number[]>;
    /**
     * Generate embeddings for multiple patterns in batch
     */
    generateBatchEmbeddings(patterns: readonly CodeDNA[]): Promise<readonly (readonly number[])[]>;
}
/**
 * Core vector store implementation using Qdrant
 */
export declare class EvolutionVectorStore {
    private readonly qdrant;
    private readonly embedding;
    private readonly config;
    constructor(config?: VectorStoreConfig);
    /**
     * Initialize the vector store collections
     */
    initialize(): Promise<void>;
    /**
     * Convert pattern to Qdrant payload
     */
    private patternToPayload;
    /**
     * Store a single pattern in the vector store
     */
    storePattern(pattern: CodeDNA): Promise<void>;
    /**
     * Store multiple patterns in batch
     */
    storePatternsInBatch(patterns: readonly CodeDNA[]): Promise<BatchOperationResult>;
    /**
     * Search for similar patterns
     */
    searchSimilarPatterns(queryPattern: CodeDNA, options?: {
        readonly limit?: number;
        readonly threshold?: number;
        readonly filter?: PatternSearchFilter;
    }): Promise<readonly PatternSearchResult[]>;
    /**
     * Delete pattern from vector store
     */
    deletePattern(patternId: EvolutionDnaId): Promise<void>;
    /**
     * Get collection statistics
     */
    getCollectionInfo(): Promise<{
        readonly vectorCount: number;
        readonly indexedVectorCount: number;
        readonly memoryUsageMb: number;
    }>;
    /**
     * Build Qdrant filter from search criteria
     */
    private buildQdrantFilter;
    /**
     * Convert Qdrant payload back to CodeDNA (partial reconstruction)
     */
    private payloadToPattern;
    /**
     * Retry wrapper with exponential backoff
     */
    private withRetry;
}
//# sourceMappingURL=vector-store.d.ts.map