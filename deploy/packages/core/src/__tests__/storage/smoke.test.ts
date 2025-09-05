/**
 * Smoke test to verify Vector Database Integration imports work
 */

import { describe, it, expect } from '@jest/globals';

describe('Vector Database Integration - Smoke Test', () => {
  it('should import vector store components without errors', async () => {
    const vectorStoreModule = await import('../../storage/vector-store');
    expect(vectorStoreModule.EvolutionVectorStore).toBeDefined();
    expect(vectorStoreModule.EmbeddingService).toBeDefined();
    expect(vectorStoreModule.DEFAULT_VECTOR_CONFIG).toBeDefined();
  });

  it('should import pattern search engine components without errors', async () => {
    const searchModule = await import('../../storage/pattern-search-engine');
    expect(searchModule.PatternSearchEngine).toBeDefined();
    expect(searchModule.RelevanceScorer).toBeDefined();
    expect(searchModule.SearchCache).toBeDefined();
    expect(searchModule.RankingAlgorithm).toBeDefined();
  });

  it('should import performance monitor components without errors', async () => {
    const perfModule = await import('../../storage/performance-monitor');
    expect(perfModule.PerformanceMonitor).toBeDefined();
    expect(perfModule.OperationType).toBeDefined();
    expect(perfModule.AlertCondition).toBeDefined();
  });

  it('should import main storage index without errors', async () => {
    const storageModule = await import('../../storage');
    expect(storageModule.VectorDatabaseService).toBeDefined();
    expect(storageModule.createVectorDatabaseService).toBeDefined();
    expect(storageModule.createTestVectorDatabaseService).toBeDefined();
  });
});