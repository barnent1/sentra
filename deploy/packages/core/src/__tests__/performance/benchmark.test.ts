/**
 * Performance Benchmark Tests
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import type {
  EvolutionDnaId,
  CodeDNA,
  PatternTypeEnum,
} from '../../types/evolution';

// Import components under test
import { EvolutionVectorStore } from '../../storage/vector-store';
import { TestDNAEngine } from '../../dna/test-engine';
import { PatternSearchEngine } from '../../storage/pattern-search-engine';

// Import mocks for controlled testing
import { createMockQdrantClient } from '../mocks/qdrant.mock';
import { createMockOpenAI } from '../mocks/openai.mock';

/**
 * Performance threshold constants (in milliseconds)
 */
const PERFORMANCE_THRESHOLDS = {
  DNA_EVOLUTION: 200,
  VECTOR_SEARCH: 100,
  PATTERN_EMBEDDING: 150,
  BATCH_PROCESSING: 5000,
  CONCURRENT_OPERATIONS: 1000,
} as const;

/**
 * Test data generators
 */
const createTestPattern = (id: string, overrides: Partial<CodeDNA> = {}): CodeDNA => ({
  id: id as EvolutionDnaId,
  generation: 1,
  parentId: null,
  patternType: 'optimization' as PatternTypeEnum,
  code: `function test${id.replace(/\D/g, '')}() { return "performance test"; }`,
  genetics: {
    successRate: 0.5 + Math.random() * 0.5,
    adaptationRate: 0.5 + Math.random() * 0.5,
    complexityIndex: 0.3 + Math.random() * 0.4,
    diversityScore: 0.4 + Math.random() * 0.6,
    stabilityFactor: 0.6 + Math.random() * 0.4,
  },
  performance: {
    responseTime: 100 + Math.random() * 100,
    throughput: 50 + Math.random() * 100,
    errorRate: Math.random() * 0.05,
    resourceUtilization: 0.3 + Math.random() * 0.7,
    scalabilityIndex: 0.5 + Math.random() * 0.5,
  },
  metadata: {
    description: `Performance test pattern ${id}`,
    tags: ['performance', 'benchmark'],
    author: 'benchmark-test',
    version: '1.0.0',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createTestPatterns = (count: number): CodeDNA[] => {
  return Array.from({ length: count }, (_, i) => 
    createTestPattern(`perf-pattern-${i}`)
  );
};

describe('Performance Benchmarks', () => {
  let vectorStore: EvolutionVectorStore;
  let dnaEngine: TestDNAEngine;
  let searchEngine: PatternSearchEngine;

  beforeAll(async () => {
    // Set up mocked dependencies
    jest.mocked(require('@qdrant/js-client-rest').QdrantClient).mockImplementation(() => createMockQdrantClient());
    jest.mocked(require('openai').default).mockImplementation(() => createMockOpenAI());

    // Initialize test instances
    const config = {
      qdrant: {
        url: 'http://localhost:6333',
        timeout: 5000,
      },
      openai: {
        apiKey: 'test-key',
        model: 'text-embedding-ada-002',
      },
      collections: {
        evolutionPatterns: 'test-evolution-patterns',
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

    vectorStore = new EvolutionVectorStore(config);
    await vectorStore.initialize();

    dnaEngine = new TestDNAEngine();
    
    searchEngine = new PatternSearchEngine({
      vectorStore,
      cacheSize: 1000,
      cacheTtl: 300000,
    });
  });

  describe('DNA Evolution Performance', () => {
    it('should generate patterns within performance threshold', async () => {
      const context = {
        projectName: 'performance-test',
        language: 'typescript' as const,
        framework: 'express',
        requirements: ['performance'],
        constraints: ['memory-limited'],
        targetMetrics: {
          responseTime: 200,
          throughput: 1000,
          errorRate: 0.01,
          resourceUtilization: 0.8,
          scalabilityIndex: 0.9,
        },
      };

      const iterations = 10;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const { result, duration } = await global.measurePerformance(
          () => dnaEngine.generateTestPattern(context)
        );

        expect(result).toBeDefined();
        expect(result.id).toBeTruthy();
        durations.push(duration);
      }

      // Calculate statistics
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      console.log(`DNA Generation - Avg: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms, Min: ${minDuration.toFixed(2)}ms`);

      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.DNA_EVOLUTION);
      expect(maxDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.DNA_EVOLUTION * 2); // Allow some variance
    });

    it('should handle batch pattern generation efficiently', async () => {
      const context = {
        projectName: 'batch-performance-test',
        language: 'typescript' as const,
        framework: 'vue',
        requirements: ['scalability'],
        constraints: [],
        targetMetrics: {
          responseTime: 150,
          throughput: 1500,
          errorRate: 0.005,
          resourceUtilization: 0.7,
          scalabilityIndex: 0.95,
        },
      };

      const batchSize = 50;
      const { result, duration } = await global.measurePerformance(async () => {
        return Promise.all(
          Array.from({ length: batchSize }, () => dnaEngine.generateTestPattern(context))
        );
      });

      expect(result).toHaveLength(batchSize);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_PROCESSING);

      // Calculate per-pattern average
      const avgPerPattern = duration / batchSize;
      console.log(`Batch Generation (${batchSize} patterns) - Total: ${duration.toFixed(2)}ms, Per Pattern: ${avgPerPattern.toFixed(2)}ms`);
      
      expect(avgPerPattern).toBeLessThan(PERFORMANCE_THRESHOLDS.DNA_EVOLUTION);
    });
  });

  describe('Vector Operations Performance', () => {
    it('should store patterns within performance threshold', async () => {
      const testPatterns = createTestPatterns(10);
      const durations: number[] = [];

      for (const pattern of testPatterns) {
        const { result, duration } = await global.measurePerformance(
          () => vectorStore.storePattern(pattern)
        );

        expect(result).toBe(pattern.id);
        durations.push(duration);
      }

      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      console.log(`Vector Store - Avg: ${avgDuration.toFixed(2)}ms`);

      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.PATTERN_EMBEDDING);
    });

    it('should perform similarity search within performance threshold', async () => {
      // First, store some test patterns
      const testPatterns = createTestPatterns(100);
      await vectorStore.batchStore(testPatterns);

      // Perform similarity searches
      const queryPattern = createTestPattern('query-pattern');
      const iterations = 20;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const { result, duration } = await global.measurePerformance(
          () => vectorStore.findSimilarPatterns(queryPattern, { limit: 10 })
        );

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        durations.push(duration);
      }

      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      console.log(`Vector Search - Avg: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);

      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.VECTOR_SEARCH);
      expect(maxDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.VECTOR_SEARCH * 2);
    });

    it('should handle batch storage efficiently', async () => {
      const batchSizes = [10, 50, 100, 250];
      
      for (const batchSize of batchSizes) {
        const testPatterns = createTestPatterns(batchSize);
        
        const { result, duration } = await global.measurePerformance(
          () => vectorStore.batchStore(testPatterns)
        );

        expect(result).toHaveLength(batchSize);
        
        const avgPerPattern = duration / batchSize;
        console.log(`Batch Store (${batchSize}) - Total: ${duration.toFixed(2)}ms, Per Pattern: ${avgPerPattern.toFixed(2)}ms`);

        // Batch operations should be more efficient than individual operations
        if (batchSize >= 50) {
          expect(avgPerPattern).toBeLessThan(PERFORMANCE_THRESHOLDS.PATTERN_EMBEDDING * 0.8);
        }
      }
    });
  });

  describe('Pattern Search Performance', () => {
    beforeAll(async () => {
      // Populate search engine with test data
      const testPatterns = createTestPatterns(500);
      await vectorStore.batchStore(testPatterns);
    });

    it('should perform complex searches within performance threshold', async () => {
      const searchQueries = [
        {
          text: 'optimization performance',
          filters: { patternType: 'optimization' },
          limit: 20,
        },
        {
          text: 'scalability throughput',
          filters: { 
            generation: { gte: 2 },
            successRate: { gte: 0.8 },
          },
          limit: 15,
        },
        {
          text: 'error handling resilience',
          filters: { 
            patternType: 'adaptation',
            complexityIndex: { lte: 0.7 },
          },
          limit: 25,
        },
      ];

      for (const query of searchQueries) {
        const iterations = 10;
        const durations: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const { result, duration } = await global.measurePerformance(
            () => searchEngine.search(query.text, {
              limit: query.limit,
              filters: query.filters,
            })
          );

          expect(result).toBeDefined();
          expect(result.results.length).toBeGreaterThanOrEqual(0);
          durations.push(duration);
        }

        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        console.log(`Complex Search (${query.text}) - Avg: ${avgDuration.toFixed(2)}ms`);

        expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.VECTOR_SEARCH);
      }
    });

    it('should handle cached searches efficiently', async () => {
      const searchQuery = 'cached performance test';
      const searchOptions = { limit: 10 };

      // First search (cache miss)
      const { duration: firstDuration } = await global.measurePerformance(
        () => searchEngine.search(searchQuery, searchOptions)
      );

      // Second search (cache hit)
      const { duration: cachedDuration } = await global.measurePerformance(
        () => searchEngine.search(searchQuery, searchOptions)
      );

      console.log(`Search Caching - First: ${firstDuration.toFixed(2)}ms, Cached: ${cachedDuration.toFixed(2)}ms`);

      // Cached search should be significantly faster
      expect(cachedDuration).toBeLessThan(firstDuration * 0.1);
      expect(cachedDuration).toBeLessThan(10); // Should be very fast
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent pattern generation', async () => {
      const concurrentOperations = 10;
      const context = {
        projectName: 'concurrent-test',
        language: 'typescript' as const,
        framework: 'express',
        requirements: ['performance'],
        constraints: [],
        targetMetrics: {
          responseTime: 200,
          throughput: 1000,
          errorRate: 0.01,
          resourceUtilization: 0.8,
          scalabilityIndex: 0.9,
        },
      };

      const { result, duration } = await global.measurePerformance(async () => {
        return Promise.all(
          Array.from({ length: concurrentOperations }, (_, i) => 
            dnaEngine.generateTestPattern({
              ...context,
              projectName: `concurrent-test-${i}`,
            })
          )
        );
      });

      expect(result).toHaveLength(concurrentOperations);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_OPERATIONS);

      const avgPerOperation = duration / concurrentOperations;
      console.log(`Concurrent Generation (${concurrentOperations}) - Total: ${duration.toFixed(2)}ms, Per Operation: ${avgPerOperation.toFixed(2)}ms`);
    });

    it('should handle concurrent vector operations', async () => {
      const testPatterns = createTestPatterns(20);
      const concurrentBatches = 5;
      const batchSize = Math.ceil(testPatterns.length / concurrentBatches);

      const batches = [];
      for (let i = 0; i < concurrentBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, testPatterns.length);
        batches.push(testPatterns.slice(start, end));
      }

      const { result, duration } = await global.measurePerformance(async () => {
        return Promise.all(
          batches.map(batch => vectorStore.batchStore(batch))
        );
      });

      expect(result).toHaveLength(concurrentBatches);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_OPERATIONS);

      console.log(`Concurrent Vector Operations (${concurrentBatches} batches) - Duration: ${duration.toFixed(2)}ms`);
    });

    it('should handle concurrent search operations', async () => {
      // Populate with test data first
      const testPatterns = createTestPatterns(100);
      await vectorStore.batchStore(testPatterns);

      const concurrentSearches = 15;
      const searchQueries = Array.from({ length: concurrentSearches }, (_, i) => ({
        pattern: createTestPattern(`concurrent-search-${i}`),
        options: { limit: 10 + (i % 5) },
      }));

      const { result, duration } = await global.measurePerformance(async () => {
        return Promise.all(
          searchQueries.map(({ pattern, options }) => 
            vectorStore.findSimilarPatterns(pattern, options)
          )
        );
      });

      expect(result).toHaveLength(concurrentSearches);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_OPERATIONS);

      const avgPerSearch = duration / concurrentSearches;
      console.log(`Concurrent Searches (${concurrentSearches}) - Total: ${duration.toFixed(2)}ms, Per Search: ${avgPerSearch.toFixed(2)}ms`);

      // Individual searches should still be within threshold
      expect(avgPerSearch).toBeLessThan(PERFORMANCE_THRESHOLDS.VECTOR_SEARCH * 1.5);
    });
  });

  describe('Memory Performance', () => {
    it('should handle large datasets without memory leaks', async () => {
      const initialMemory = process.memoryUsage();
      
      // Process large number of patterns
      const largeDatasetSize = 1000;
      const testPatterns = createTestPatterns(largeDatasetSize);
      
      // Process in chunks to simulate real-world usage
      const chunkSize = 100;
      for (let i = 0; i < testPatterns.length; i += chunkSize) {
        const chunk = testPatterns.slice(i, i + chunkSize);
        await vectorStore.batchStore(chunk);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerPattern = memoryIncrease / largeDatasetSize;

      console.log(`Memory Usage - Total Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB, Per Pattern: ${(memoryIncreasePerPattern / 1024).toFixed(2)}KB`);

      // Memory increase should be reasonable (less than 1MB per 100 patterns)
      expect(memoryIncreasePerPattern).toBeLessThan(10 * 1024); // 10KB per pattern max
    });
  });

  describe('Stress Testing', () => {
    it('should maintain performance under load', async () => {
      const stressTestDuration = 10000; // 10 seconds
      const operationsPerSecond = 5;
      const expectedOperations = Math.floor(stressTestDuration / 1000) * operationsPerSecond;
      
      const context = {
        projectName: 'stress-test',
        language: 'typescript' as const,
        framework: 'express',
        requirements: ['performance'],
        constraints: [],
        targetMetrics: {
          responseTime: 200,
          throughput: 1000,
          errorRate: 0.01,
          resourceUtilization: 0.8,
          scalabilityIndex: 0.9,
        },
      };

      let completedOperations = 0;
      const operationDurations: number[] = [];
      
      const startTime = Date.now();
      const interval = setInterval(async () => {
        if (Date.now() - startTime >= stressTestDuration) {
          clearInterval(interval);
          return;
        }

        const { duration } = await global.measurePerformance(
          () => dnaEngine.generateTestPattern(context)
        );
        
        completedOperations++;
        operationDurations.push(duration);
      }, 1000 / operationsPerSecond);

      // Wait for stress test to complete
      await new Promise(resolve => setTimeout(resolve, stressTestDuration + 1000));

      const avgDuration = operationDurations.reduce((sum, d) => sum + d, 0) / operationDurations.length;
      const maxDuration = Math.max(...operationDurations);
      
      console.log(`Stress Test - Completed: ${completedOperations}/${expectedOperations}, Avg Duration: ${avgDuration.toFixed(2)}ms, Max Duration: ${maxDuration.toFixed(2)}ms`);

      expect(completedOperations).toBeGreaterThanOrEqual(expectedOperations * 0.9); // Allow 10% tolerance
      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.DNA_EVOLUTION * 1.5); // Allow 50% degradation under stress
      expect(maxDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.DNA_EVOLUTION * 3); // Allow 3x degradation for outliers
    });
  });
});