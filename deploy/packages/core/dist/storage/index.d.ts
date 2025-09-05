/**
 * Vector Database Integration Module for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * Comprehensive vector storage and search capabilities for evolutionary patterns:
 * - Qdrant-based vector storage with OpenAI embeddings
 * - Advanced pattern search engine with multi-criteria filtering
 * - Performance monitoring and caching for production use
 * - High-throughput batch operations and error handling
 */
export { EvolutionVectorStore, EmbeddingService, DEFAULT_VECTOR_CONFIG, } from './vector-store';
export type { VectorStoreConfig, PatternSearchFilter, PatternSearchResult, BatchOperationResult, } from './vector-store';
export { PatternSearchEngine, RelevanceScorer, SearchCache, RankingAlgorithm, } from './pattern-search-engine';
export type { AdvancedSearchCriteria, SearchWeights, EnhancedSearchResult, SearchMetrics, } from './pattern-search-engine';
export { PerformanceMonitor, OperationType, AlertCondition, } from './performance-monitor';
export type { PerformanceMetric, PerformanceStats, PerformanceAlert, AlertInstance, } from './performance-monitor';
/**
 * Create a production-ready vector database service with optimized defaults
 */
export declare function createVectorDatabaseService(options: {
    readonly qdrantUrl?: string;
    readonly qdrantApiKey?: string;
    readonly openaiApiKey: string;
    readonly collectionName?: string;
}): any;
/**
 * Create a development/testing vector database service with fast defaults
 */
export declare function createTestVectorDatabaseService(options: {
    readonly openaiApiKey: string;
}): any;
/**
 * Simple vector database service interface
 */
export declare const VectorDatabaseService: {
    create: typeof createVectorDatabaseService;
    createTest: typeof createTestVectorDatabaseService;
};
//# sourceMappingURL=index.d.ts.map