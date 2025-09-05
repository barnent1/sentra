/**
 * Pattern Search Engine for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * Provides advanced search and ranking capabilities for evolutionary patterns:
 * - Multi-criteria similarity search with complex filtering
 * - Dynamic relevance scoring algorithms
 * - Caching for frequently accessed patterns
 * - Performance optimization for large datasets
 */
import type { CodeDNA, PatternTypeEnum, ProjectContext, PerformanceMetrics, GeneticMarkers } from '../types/evolution';
import { EvolutionVectorStore, type PatternSearchFilter } from './vector-store';
/**
 * Advanced search criteria with weighted ranking factors
 */
export interface AdvancedSearchCriteria {
    readonly query: CodeDNA | {
        readonly genetics: Partial<GeneticMarkers>;
        readonly performance: Partial<PerformanceMetrics>;
        readonly context: Partial<ProjectContext>;
        readonly patternType?: PatternTypeEnum;
    };
    readonly filters: PatternSearchFilter;
    readonly ranking: {
        readonly weights: SearchWeights;
        readonly algorithms: readonly RankingAlgorithm[];
        readonly diversityFactor: number;
        readonly noveltyBonus: number;
    };
    readonly pagination: {
        readonly limit: number;
        readonly offset: number;
    };
    readonly performance: {
        readonly useCache: boolean;
        readonly cacheTimeout: number;
        readonly maxSearchTime: number;
    };
}
/**
 * Weights for different similarity aspects
 */
export interface SearchWeights {
    readonly genetic: number;
    readonly performance: number;
    readonly context: number;
    readonly semantic: number;
    readonly temporal: number;
}
/**
 * Available ranking algorithms
 */
export declare enum RankingAlgorithm {
    COSINE_SIMILARITY = "cosine_similarity",
    WEIGHTED_EUCLIDEAN = "weighted_euclidean",
    GENETIC_DISTANCE = "genetic_distance",
    PERFORMANCE_BASED = "performance_based",
    CONTEXT_AWARE = "context_aware",
    HYBRID_SCORING = "hybrid_scoring",
    PARETO_OPTIMAL = "pareto_optimal"
}
/**
 * Enhanced search result with detailed scoring
 */
export interface EnhancedSearchResult {
    readonly pattern: CodeDNA;
    readonly scores: {
        readonly overall: number;
        readonly genetic: number;
        readonly performance: number;
        readonly context: number;
        readonly semantic: number;
        readonly novelty: number;
        readonly diversity: number;
    };
    readonly ranking: {
        readonly position: number;
        readonly algorithm: RankingAlgorithm;
        readonly confidence: number;
    };
    readonly explanation: string;
}
/**
 * Search performance metrics
 */
export interface SearchMetrics {
    readonly totalResults: number;
    readonly searchTimeMs: number;
    readonly cacheHit: boolean;
    readonly algorithmsUsed: readonly RankingAlgorithm[];
    readonly filteringTimeMs: number;
    readonly rankingTimeMs: number;
    readonly vectorSearchTimeMs: number;
}
/**
 * Utility class for computing various similarity and relevance scores
 */
export declare class RelevanceScorer {
    /**
     * Compute genetic marker similarity between patterns
     */
    static computeGeneticSimilarity(pattern1: GeneticMarkers, pattern2: GeneticMarkers, weights?: Partial<Record<keyof GeneticMarkers, number>>): number;
    /**
     * Compute performance metrics similarity
     */
    static computePerformanceSimilarity(perf1: PerformanceMetrics, perf2: PerformanceMetrics): number;
    /**
     * Compute context similarity (project, tech stack, domain)
     */
    static computeContextSimilarity(context1: ProjectContext, context2: ProjectContext): number;
    /**
     * Compute novelty score based on pattern uniqueness
     */
    static computeNoveltyScore(pattern: CodeDNA, existingPatterns: readonly CodeDNA[]): number;
    /**
     * Compute diversity score for result set
     */
    static computeDiversityScore(patterns: readonly CodeDNA[]): number;
    /**
     * Helper: Compute overlap ratio between two arrays
     */
    private static computeArrayOverlap;
}
/**
 * Cache entry with TTL and metadata
 */
interface SearchCacheEntry {
    readonly results: readonly EnhancedSearchResult[];
    readonly metrics: SearchMetrics;
    readonly timestamp: number;
    readonly ttl: number;
    readonly hitCount: number;
}
/**
 * High-performance cache for search results
 */
export declare class SearchCache {
    private readonly cache;
    private readonly defaultTtl;
    private readonly maxEntries;
    private cleanupTimer?;
    constructor(defaultTtl?: number, maxEntries?: number);
    /**
     * Generate cache key from search criteria
     */
    private generateCacheKey;
    /**
     * Serialize query for consistent hashing
     */
    private serializeQuery;
    /**
     * Get cached results
     */
    get(criteria: AdvancedSearchCriteria): SearchCacheEntry | undefined;
    /**
     * Store results in cache
     */
    set(criteria: AdvancedSearchCriteria, results: readonly EnhancedSearchResult[], metrics: SearchMetrics, ttl?: number): void;
    /**
     * Clear cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        readonly entries: number;
        readonly hitRate: number;
        readonly memoryUsageMb: number;
    };
    /**
     * Cleanup expired entries
     */
    private cleanup;
    /**
     * Evict least used entries when cache is full
     */
    private evictLeastUsed;
    /**
     * Estimate memory usage in MB
     */
    private estimateMemoryUsage;
    /**
     * Cleanup on destruction
     */
    destroy(): void;
}
/**
 * Advanced pattern search engine with caching and performance optimization
 */
export declare class PatternSearchEngine {
    private readonly vectorStore;
    private readonly cache;
    private readonly defaultWeights;
    constructor(vectorStore: EvolutionVectorStore, options?: {
        readonly cacheConfig?: {
            ttl: number;
            maxEntries: number;
        };
        readonly defaultWeights?: Partial<SearchWeights>;
    });
    /**
     * Perform advanced pattern search with ranking and caching
     */
    searchPatterns(criteria: AdvancedSearchCriteria): Promise<{
        readonly results: readonly EnhancedSearchResult[];
        readonly metrics: SearchMetrics;
    }>;
    /**
     * Get search cache statistics
     */
    getCacheStats(): ReturnType<SearchCache['getStats']>;
    /**
     * Clear search cache
     */
    clearCache(): void;
    /**
     * Prepare query pattern from search criteria
     */
    private prepareQueryPattern;
    /**
     * Apply advanced ranking algorithms to search results
     */
    private rankResults;
    /**
     * Generate human-readable explanation for search result
     */
    private generateExplanation;
}
export {};
//# sourceMappingURL=pattern-search-engine.d.ts.map