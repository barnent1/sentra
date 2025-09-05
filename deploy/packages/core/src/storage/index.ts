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

// ============================================================================
// CORE VECTOR STORE EXPORTS
// ============================================================================

export {
  EvolutionVectorStore,
  EmbeddingService,
  DEFAULT_VECTOR_CONFIG,
} from './vector-store';

export type {
  VectorStoreConfig,
  PatternSearchFilter,
  PatternSearchResult,
  BatchOperationResult,
} from './vector-store';

// ============================================================================
// PATTERN SEARCH ENGINE EXPORTS
// ============================================================================

export {
  PatternSearchEngine,
  RelevanceScorer,
  SearchCache,
  RankingAlgorithm,
} from './pattern-search-engine';

export type {
  AdvancedSearchCriteria,
  SearchWeights,
  EnhancedSearchResult,
  SearchMetrics,
} from './pattern-search-engine';

// ============================================================================
// PERFORMANCE MONITORING EXPORTS
// ============================================================================

export {
  PerformanceMonitor,
  OperationType,
  AlertCondition,
} from './performance-monitor';

export type {
  PerformanceMetric,
  PerformanceStats,
  PerformanceAlert,
  AlertInstance,
} from './performance-monitor';

// ============================================================================
// CONVENIENCE FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a production-ready vector database service with optimized defaults
 */
export function createVectorDatabaseService(options: {
  readonly qdrantUrl?: string;
  readonly qdrantApiKey?: string;
  readonly openaiApiKey: string;
  readonly collectionName?: string;
}): any {
  const { EvolutionVectorStore } = require('./vector-store');
  const { PatternSearchEngine } = require('./pattern-search-engine');
  const { PerformanceMonitor } = require('./performance-monitor');

  const config = {
    qdrant: {
      url: options.qdrantUrl || 'http://localhost:6333',
      apiKey: options.qdrantApiKey,
      timeout: 30000,
    },
    openai: {
      apiKey: options.openaiApiKey,
      model: 'text-embedding-3-small',
    },
    collections: {
      evolutionPatterns: options.collectionName || 'evolution_patterns',
    },
    embedding: {
      dimensions: 1536,
    },
    performance: {
      batchSize: 100,
      maxRetries: 3,
      retryDelayMs: 1000,
    },
  };

  return {
    vectorStore: new EvolutionVectorStore(config),
    searchEngine: new PatternSearchEngine(new EvolutionVectorStore(config)),
    performanceMonitor: new PerformanceMonitor(),
  };
}

/**
 * Create a development/testing vector database service with fast defaults
 */
export function createTestVectorDatabaseService(options: {
  readonly openaiApiKey: string;
}): any {
  const { EvolutionVectorStore } = require('./vector-store');
  const { PatternSearchEngine } = require('./pattern-search-engine');
  const { PerformanceMonitor } = require('./performance-monitor');

  const config = {
    qdrant: {
      url: 'http://localhost:6333',
      timeout: 5000,
    },
    openai: {
      apiKey: options.openaiApiKey,
      model: 'text-embedding-3-small',
    },
    collections: {
      evolutionPatterns: 'test_evolution_patterns',
    },
    embedding: {
      dimensions: 1536,
    },
    performance: {
      batchSize: 10,
      maxRetries: 1,
      retryDelayMs: 100,
    },
  };

  return {
    vectorStore: new EvolutionVectorStore(config),
    searchEngine: new PatternSearchEngine(new EvolutionVectorStore(config)),
    performanceMonitor: new PerformanceMonitor(),
  };
}

/**
 * Simple vector database service interface
 */
export const VectorDatabaseService = {
  create: createVectorDatabaseService,
  createTest: createTestVectorDatabaseService,
};