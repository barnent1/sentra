/**
 * Vector Store Unit Tests
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type {
  EvolutionDnaId,
  CodeDNA,
  PatternTypeEnum,
} from '../../types/evolution';

// Import mocks
import { createMockQdrantClient, MockQdrantClient } from '../mocks/qdrant.mock';
import { createMockOpenAI, MockOpenAI } from '../mocks/openai.mock';

// Import the actual implementations
import {
  EvolutionVectorStore,
  EmbeddingService,
  VectorStoreConfig,
  DEFAULT_VECTOR_CONFIG,
} from '../../storage/vector-store';

describe('EvolutionVectorStore', () => {
  let vectorStore: EvolutionVectorStore;
  let mockQdrantClient: MockQdrantClient;
  let mockOpenAI: MockOpenAI;
  let config: VectorStoreConfig;

  beforeEach(async () => {
    // Create mocks
    mockQdrantClient = createMockQdrantClient();
    mockOpenAI = createMockOpenAI({ apiKey: 'test-key' });
    
    // Mock the constructors
    jest.mocked(require('@qdrant/js-client-rest').QdrantClient).mockImplementation(() => mockQdrantClient);
    jest.mocked(require('openai').default).mockImplementation(() => mockOpenAI);

    config = {
      ...DEFAULT_VECTOR_CONFIG,
      qdrant: {
        url: 'http://localhost:6333',
        timeout: 5000,
      },
      openai: {
        apiKey: 'test-key',
        model: 'text-embedding-ada-002',
      },
    };

    vectorStore = new EvolutionVectorStore(config);
    await vectorStore.initialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize collections successfully', async () => {
      expect(mockQdrantClient.recreateCollection).toHaveBeenCalledWith(
        config.collections.evolutionPatterns,
        expect.objectContaining({
          vectors: {
            size: config.embedding.dimensions,
            distance: 'Cosine',
          },
        })
      );
    });

    it('should handle initialization errors gracefully', async () => {
      mockQdrantClient.recreateCollection.mockRejectedValueOnce(new Error('Connection failed'));
      
      const newVectorStore = new EvolutionVectorStore(config);
      
      await expect(newVectorStore.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('storePattern', () => {
    it('should store a single pattern successfully', async () => {
      const testPattern: CodeDNA = {
        id: 'test-pattern-1' as EvolutionDnaId,
        generation: 1,
        parentId: null,
        patternType: 'optimization' as PatternTypeEnum,
        code: 'function test() { return "hello"; }',
        genetics: {
          successRate: 0.85,
          adaptationRate: 0.72,
          complexityIndex: 0.65,
          diversityScore: 0.58,
          stabilityFactor: 0.91,
        },
        performance: {
          responseTime: 150,
          throughput: 100,
          errorRate: 0.02,
          resourceUtilization: 0.75,
          scalabilityIndex: 0.83,
        },
        metadata: {
          description: 'Test optimization pattern',
          tags: ['test', 'optimization'],
          author: 'test-author',
          version: '1.0.0',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await vectorStore.storePattern(testPattern);

      expect(result).toBe(testPattern.id);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        input: expect.stringContaining(testPattern.code),
        model: config.openai.model,
      });
      expect(mockQdrantClient.upsert).toHaveBeenCalledWith(
        config.collections.evolutionPatterns,
        expect.objectContaining({
          points: expect.arrayContaining([
            expect.objectContaining({
              id: testPattern.id,
              payload: expect.objectContaining({
                generation: testPattern.generation,
                patternType: testPattern.patternType,
                genetics: testPattern.genetics,
                performance: testPattern.performance,
              }),
            }),
          ]),
        })
      );
    });

    it('should handle embedding generation errors', async () => {
      mockOpenAI.embeddings.create.mockRejectedValueOnce(new Error('OpenAI API error'));
      
      const testPattern: CodeDNA = {
        id: 'test-pattern-error' as EvolutionDnaId,
        generation: 1,
        parentId: null,
        patternType: 'optimization' as PatternTypeEnum,
        code: 'function test() { return "error"; }',
        genetics: {
          successRate: 0.5,
          adaptationRate: 0.5,
          complexityIndex: 0.5,
          diversityScore: 0.5,
          stabilityFactor: 0.5,
        },
        performance: {
          responseTime: 100,
          throughput: 50,
          errorRate: 0.01,
          resourceUtilization: 0.5,
          scalabilityIndex: 0.5,
        },
        metadata: {
          description: 'Error test pattern',
          tags: ['test', 'error'],
          author: 'test-author',
          version: '1.0.0',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(vectorStore.storePattern(testPattern)).rejects.toThrow('OpenAI API error');
    });
  });

  describe('findSimilarPatterns', () => {
    beforeEach(async () => {
      // Add test data to mock client
      mockQdrantClient.addTestPoint({
        id: 'similar-pattern-1' as EvolutionDnaId,
        vector: Array.from({ length: 1536 }, () => Math.random()),
        payload: {
          generation: 2,
          patternType: 'optimization' as PatternTypeEnum,
          successRate: 0.88,
          genetics: {
            successRate: 0.88,
            adaptationRate: 0.75,
            complexityIndex: 0.68,
            diversityScore: 0.62,
            stabilityFactor: 0.94,
          },
          performance: {
            responseTime: 140,
            throughput: 110,
            errorRate: 0.015,
            resourceUtilization: 0.72,
            scalabilityIndex: 0.86,
          },
          timestamp: new Date().toISOString(),
        },
      });
    });

    it('should find similar patterns with correct similarity scores', async () => {
      const queryPattern: CodeDNA = {
        id: 'query-pattern' as EvolutionDnaId,
        generation: 1,
        parentId: null,
        patternType: 'optimization' as PatternTypeEnum,
        code: 'function similar() { return "test"; }',
        genetics: {
          successRate: 0.85,
          adaptationRate: 0.72,
          complexityIndex: 0.65,
          diversityScore: 0.58,
          stabilityFactor: 0.91,
        },
        performance: {
          responseTime: 150,
          throughput: 100,
          errorRate: 0.02,
          resourceUtilization: 0.75,
          scalabilityIndex: 0.83,
        },
        metadata: {
          description: 'Query pattern for similarity search',
          tags: ['test', 'query'],
          author: 'test-author',
          version: '1.0.0',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const results = await vectorStore.findSimilarPatterns(queryPattern, { limit: 5 });

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'similar-pattern-1',
        similarity: expect.any(Number),
        pattern: expect.objectContaining({
          generation: 2,
          patternType: 'optimization',
        }),
      });
      expect(results[0].similarity).toBeGreaterThan(0.5);
      expect(results[0].similarity).toBeLessThanOrEqual(1.0);
    });

    it('should apply filters correctly', async () => {
      const queryPattern: CodeDNA = {
        id: 'filtered-query' as EvolutionDnaId,
        generation: 1,
        parentId: null,
        patternType: 'adaptation' as PatternTypeEnum,
        code: 'function filtered() { return "test"; }',
        genetics: {
          successRate: 0.75,
          adaptationRate: 0.68,
          complexityIndex: 0.72,
          diversityScore: 0.65,
          stabilityFactor: 0.88,
        },
        performance: {
          responseTime: 160,
          throughput: 95,
          errorRate: 0.025,
          resourceUtilization: 0.78,
          scalabilityIndex: 0.81,
        },
        metadata: {
          description: 'Filtered query pattern',
          tags: ['test', 'filtered'],
          author: 'test-author',
          version: '1.0.0',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const results = await vectorStore.findSimilarPatterns(queryPattern, {
        limit: 10,
        filters: {
          generation: { gte: 2 },
          successRate: { gte: 0.8 },
        },
      });

      expect(mockQdrantClient.search).toHaveBeenCalledWith(
        config.collections.evolutionPatterns,
        expect.objectContaining({
          filter: expect.objectContaining({
            must: expect.arrayContaining([
              expect.objectContaining({
                range: expect.objectContaining({
                  generation: { gte: 2 },
                }),
              }),
              expect.objectContaining({
                range: expect.objectContaining({
                  successRate: { gte: 0.8 },
                }),
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('batchStore', () => {
    it('should store multiple patterns in batches', async () => {
      const testPatterns: CodeDNA[] = Array.from({ length: 150 }, (_, i) => ({
        id: `batch-pattern-${i}` as EvolutionDnaId,
        generation: Math.floor(i / 10) + 1,
        parentId: i > 0 ? (`batch-pattern-${i - 1}` as EvolutionDnaId) : null,
        patternType: (i % 2 === 0 ? 'optimization' : 'adaptation') as PatternTypeEnum,
        code: `function batch${i}() { return ${i}; }`,
        genetics: {
          successRate: Math.random(),
          adaptationRate: Math.random(),
          complexityIndex: Math.random(),
          diversityScore: Math.random(),
          stabilityFactor: Math.random(),
        },
        performance: {
          responseTime: 100 + Math.random() * 100,
          throughput: 50 + Math.random() * 50,
          errorRate: Math.random() * 0.1,
          resourceUtilization: Math.random(),
          scalabilityIndex: Math.random(),
        },
        metadata: {
          description: `Batch test pattern ${i}`,
          tags: ['batch', 'test'],
          author: 'test-author',
          version: '1.0.0',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const results = await vectorStore.batchStore(testPatterns);

      expect(results).toHaveLength(testPatterns.length);
      expect(results).toEqual(testPatterns.map(p => p.id));
      
      // Should have been called in batches (default batch size is 100)
      expect(mockQdrantClient.upsert).toHaveBeenCalledTimes(2);
    });
  });
});

describe('EmbeddingService', () => {
  let embeddingService: EmbeddingService;
  let mockOpenAI: MockOpenAI;

  beforeEach(() => {
    mockOpenAI = createMockOpenAI({ apiKey: 'test-key' });
    jest.mocked(require('openai').default).mockImplementation(() => mockOpenAI);
    
    embeddingService = new EmbeddingService({
      apiKey: 'test-key',
      model: 'text-embedding-ada-002',
    });
  });

  describe('generateEmbedding', () => {
    it('should generate embeddings for text input', async () => {
      const testText = 'function test() { return "hello world"; }';
      
      const embedding = await embeddingService.generateEmbedding(testText);
      
      expect(embedding).toHaveLength(1536);
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        input: testText,
        model: 'text-embedding-ada-002',
      });
    });

    it('should handle batch embedding generation', async () => {
      const testTexts = [
        'function test1() { return 1; }',
        'function test2() { return 2; }',
        'function test3() { return 3; }',
      ];
      
      const embeddings = await embeddingService.generateBatchEmbeddings(testTexts);
      
      expect(embeddings).toHaveLength(3);
      embeddings.forEach(embedding => {
        expect(embedding).toHaveLength(1536);
        expect(embedding.every(val => typeof val === 'number')).toBe(true);
      });
    });

    it('should handle API errors gracefully', async () => {
      mockOpenAI.embeddings.create.mockRejectedValueOnce(new Error('Rate limit exceeded'));
      
      await expect(embeddingService.generateEmbedding('test')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('performance benchmarks', () => {
    it('should generate embeddings within performance threshold', async () => {
      const testText = 'function performance() { return "test"; }';
      
      const { result, duration } = await global.measurePerformance(
        () => embeddingService.generateEmbedding(testText)
      );
      
      expect(result).toHaveLength(1536);
      expect(duration).toBeLessThan(100); // Should complete within 100ms for mocked service
    });
  });
});