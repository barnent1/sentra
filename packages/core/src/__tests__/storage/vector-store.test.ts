/**
 * Comprehensive tests for Vector Store Implementation
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EvolutionVectorStore, EmbeddingService } from '../../storage/vector-store';
import type { VectorStoreConfig, PatternSearchFilter } from '../../storage/vector-store';
import type { CodeDNA, PatternTypeEnum, PerformanceMetrics, GeneticMarkers, ProjectContext } from '../../types/evolution';

// ============================================================================
// TEST SETUP AND MOCKS
// ============================================================================

// Mock QdrantClient
const mockQdrantClient = {
  getCollections: jest.fn(),
  createCollection: jest.fn(),
  upsert: jest.fn(),
  search: jest.fn(),
  delete: jest.fn(),
  getCollection: jest.fn(),
};

// Mock OpenAI
const mockOpenAI = {
  embeddings: {
    create: jest.fn(),
  },
};

jest.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: jest.fn(() => mockQdrantClient),
}));

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => mockOpenAI),
}));

// Test configuration
const testConfig: VectorStoreConfig = {
  qdrant: {
    url: 'http://localhost:6333',
    timeout: 5000,
  },
  openai: {
    apiKey: 'test-api-key',
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
    maxRetries: 2,
    retryDelayMs: 100,
  },
};

// Test data helpers
function createTestDNA(overrides: Partial<CodeDNA> = {}): CodeDNA {
  const baseGenetics: GeneticMarkers = {
    complexity: 0.7,
    adaptability: 0.8,
    successRate: 0.9,
    transferability: 0.6,
    stability: 0.8,
    novelty: 0.5,
    patternRecognition: 0.7,
    errorRecovery: 0.8,
    communicationClarity: 0.7,
    learningVelocity: 0.8,
    resourceEfficiency: 0.6,
    collaborationAffinity: 0.7,
    riskTolerance: 0.5,
    thoroughness: 0.8,
    creativity: 0.6,
    persistence: 0.7,
    empathy: 0.6,
    pragmatism: 0.8,
  };

  const basePerformance: PerformanceMetrics = {
    successRate: 0.9,
    averageTaskCompletionTime: 1000,
    codeQualityScore: 0.85,
    userSatisfactionRating: 0.88,
    adaptationSpeed: 0.7,
    errorRecoveryRate: 0.8,
    knowledgeRetention: 0.75,
    crossDomainTransfer: 0.6,
    computationalEfficiency: 0.8,
    responseLatency: 150,
    throughput: 10.5,
    resourceUtilization: 0.7,
    bugIntroductionRate: 0.05,
    testCoverage: 0.9,
    documentationQuality: 0.8,
    maintainabilityScore: 0.85,
    communicationEffectiveness: 0.8,
    teamIntegration: 0.7,
    feedbackIncorporation: 0.8,
    conflictResolution: 0.7,
  };

  const baseContext: ProjectContext = {
    id: 'project-1' as any,
    projectType: 'web-app',
    techStack: ['typescript', 'react', 'node.js'],
    complexity: 'medium',
    teamSize: 5,
    timeline: '3 months',
    requirements: ['responsive design', 'api integration'],
    industryDomain: 'fintech',
    regulatoryCompliance: ['GDPR'],
    performanceRequirements: {
      maxResponseTime: 200,
      minThroughput: 100,
      availabilityTarget: 0.999,
      errorRateThreshold: 0.01,
    },
    scalabilityNeeds: {
      expectedGrowthRate: 2,
      peakLoadCapacity: 1000,
      dataVolumeGrowth: '10GB/month',
      horizontalScaling: true,
    },
    securityRequirements: {
      authenticationMethod: 'jwt',
      encryptionRequirements: ['TLS'],
      auditingNeeds: 'basic',
      dataPrivacyLevel: 'confidential',
    },
    developmentStage: 'mvp',
    testingStrategy: 'comprehensive',
    deploymentStrategy: 'ci-cd',
    monitoringNeeds: 'advanced',
  };

  return {
    id: 'dna-test-1' as any,
    patternType: 'analytical' as PatternTypeEnum,
    context: baseContext,
    genetics: baseGenetics,
    performance: basePerformance,
    mutations: [],
    embedding: new Array(1536).fill(0.1),
    timestamp: new Date(),
    generation: 1,
    birthContext: {
      trigger: 'initial_spawn',
      creationReason: 'Test DNA creation',
      initialPerformance: basePerformance,
    },
    evolutionHistory: [],
    activationCount: 0,
    lastActivation: new Date(),
    fitnessScore: 0.85 as any,
    viabilityAssessment: {
      overallScore: 0.8,
      strengths: ['high adaptability', 'good performance'],
      weaknesses: ['low novelty'],
      recommendedContexts: ['web development'],
      avoidContexts: ['embedded systems'],
      lastAssessment: new Date(),
      confidenceLevel: 0.9,
    },
    reproductionPotential: 0.8,
    tags: ['test', 'analytical'],
    notes: 'Test DNA pattern',
    isArchived: false,
    ...overrides,
  };
}

function createTestEmbedding(): number[] {
  return new Array(1536).fill(0).map(() => Math.random() - 0.5);
}

// ============================================================================
// EMBEDDING SERVICE TESTS
// ============================================================================

describe('EmbeddingService', () => {
  let embeddingService: EmbeddingService;

  beforeEach(() => {
    jest.clearAllMocks();
    embeddingService = new EmbeddingService(testConfig);
  });

  describe('generatePatternEmbedding', () => {
    it('should generate embeddings for a pattern', async () => {
      const testEmbedding = createTestEmbedding();
      mockOpenAI.embeddings.create.mockResolvedValueOnce({
        data: [{ embedding: testEmbedding }],
      });

      const testDNA = createTestDNA();
      const result = await embeddingService.generatePatternEmbedding(testDNA);

      expect(result).toEqual(testEmbedding);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: expect.stringContaining('Pattern Type: analytical'),
        dimensions: 1536,
      });
    });

    it('should handle embedding generation errors', async () => {
      mockOpenAI.embeddings.create.mockRejectedValueOnce(new Error('API Error'));

      const testDNA = createTestDNA();
      await expect(embeddingService.generatePatternEmbedding(testDNA))
        .rejects.toThrow('Failed to generate embedding');
    });

    it('should handle empty embedding response', async () => {
      mockOpenAI.embeddings.create.mockResolvedValueOnce({
        data: [{}],
      });

      const testDNA = createTestDNA();
      await expect(embeddingService.generatePatternEmbedding(testDNA))
        .rejects.toThrow('No embedding returned from OpenAI API');
    });
  });

  describe('generateBatchEmbeddings', () => {
    it('should generate embeddings for multiple patterns', async () => {
      const embeddings = [createTestEmbedding(), createTestEmbedding()];
      mockOpenAI.embeddings.create.mockResolvedValueOnce({
        data: embeddings.map(embedding => ({ embedding })),
      });

      const patterns = [createTestDNA(), createTestDNA({ id: 'dna-test-2' as any })];
      const result = await embeddingService.generateBatchEmbeddings(patterns);

      expect(result).toEqual(embeddings);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: expect.arrayContaining([
          expect.stringContaining('Pattern Type: analytical'),
          expect.stringContaining('Pattern Type: analytical'),
        ]),
        dimensions: 1536,
      });
    });
  });
});

// ============================================================================
// VECTOR STORE TESTS
// ============================================================================

describe('EvolutionVectorStore', () => {
  let vectorStore: EvolutionVectorStore;

  beforeEach(() => {
    jest.clearAllMocks();
    vectorStore = new EvolutionVectorStore(testConfig);
  });

  afterEach(() => {
    // Clean up any timers or resources
  });

  describe('initialize', () => {
    it('should create collection if it does not exist', async () => {
      mockQdrantClient.getCollections.mockResolvedValueOnce({
        collections: [],
      });
      mockQdrantClient.createCollection.mockResolvedValueOnce({});

      await vectorStore.initialize();

      expect(mockQdrantClient.createCollection).toHaveBeenCalledWith(
        'test_evolution_patterns',
        expect.objectContaining({
          vectors: {
            size: 1536,
            distance: 'Cosine',
          },
        })
      );
    });

    it('should not create collection if it already exists', async () => {
      mockQdrantClient.getCollections.mockResolvedValueOnce({
        collections: [{ name: 'test_evolution_patterns' }],
      });

      await vectorStore.initialize();

      expect(mockQdrantClient.createCollection).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockQdrantClient.getCollections.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(vectorStore.initialize())
        .rejects.toThrow('Failed to initialize vector store');
    });
  });

  describe('storePattern', () => {
    beforeEach(() => {
      // Mock embedding generation for patterns without embeddings
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: createTestEmbedding() }],
      });
      mockQdrantClient.upsert.mockResolvedValue({});
    });

    it('should store a pattern with existing embedding', async () => {
      const testDNA = createTestDNA();
      await vectorStore.storePattern(testDNA);

      expect(mockQdrantClient.upsert).toHaveBeenCalledWith(
        'test_evolution_patterns',
        {
          wait: true,
          points: [{
            id: testDNA.id,
            vector: Array.from(testDNA.embedding),
            payload: expect.objectContaining({
              patternId: testDNA.id,
              patternType: testDNA.patternType,
              generation: testDNA.generation,
            }),
          }],
        }
      );
    });

    it('should generate embedding for pattern without one', async () => {
      const testDNA = createTestDNA({ embedding: [] });
      await vectorStore.storePattern(testDNA);

      expect(mockOpenAI.embeddings.create).toHaveBeenCalled();
      expect(mockQdrantClient.upsert).toHaveBeenCalled();
    });

    it('should retry on failure', async () => {
      mockQdrantClient.upsert
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({});

      const testDNA = createTestDNA();
      await vectorStore.storePattern(testDNA);

      expect(mockQdrantClient.upsert).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      mockQdrantClient.upsert
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockRejectedValueOnce(new Error('Failure 3'));

      const testDNA = createTestDNA();
      await expect(vectorStore.storePattern(testDNA))
        .rejects.toThrow('Failed to store pattern');
    });
  });

  describe('storePatternsInBatch', () => {
    beforeEach(() => {
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [
          { embedding: createTestEmbedding() },
          { embedding: createTestEmbedding() },
        ],
      });
      mockQdrantClient.upsert.mockResolvedValue({});
    });

    it('should store multiple patterns successfully', async () => {
      const patterns = [
        createTestDNA(),
        createTestDNA({ id: 'dna-test-2' as any }),
      ];

      const result = await vectorStore.storePatternsInBatch(patterns);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockQdrantClient.upsert).toHaveBeenCalledWith(
        'test_evolution_patterns',
        expect.objectContaining({
          points: expect.arrayContaining([
            expect.objectContaining({ id: patterns[0].id }),
            expect.objectContaining({ id: patterns[1].id }),
          ]),
        })
      );
    });

    it('should handle partial failures in batch processing', async () => {
      mockQdrantClient.upsert
        .mockResolvedValueOnce({}) // First batch succeeds
        .mockRejectedValueOnce(new Error('Batch failed')); // Second batch fails

      const patterns = Array.from({ length: 15 }, (_, i) => 
        createTestDNA({ id: `dna-test-${i}` as any })
      );

      const result = await vectorStore.storePatternsInBatch(patterns);

      expect(result.success).toBe(false);
      expect(result.processedCount).toBe(10); // First batch size
      expect(result.failedCount).toBe(5);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate embeddings for patterns that need them', async () => {
      const patterns = [
        createTestDNA({ embedding: [] }),
        createTestDNA({ id: 'dna-test-2' as any, embedding: [] }),
      ];

      await vectorStore.storePatternsInBatch(patterns);

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.arrayContaining([
            expect.stringContaining('Pattern Type: analytical'),
            expect.stringContaining('Pattern Type: analytical'),
          ]),
        })
      );
    });
  });

  describe('searchSimilarPatterns', () => {
    beforeEach(() => {
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: createTestEmbedding() }],
      });
    });

    it('should search for similar patterns', async () => {
      const searchResults = [
        {
          id: 'dna-result-1',
          score: 0.9,
          payload: {
            patternId: 'dna-result-1',
            patternType: 'analytical',
            generation: 2,
          },
        },
      ];
      mockQdrantClient.search.mockResolvedValueOnce(searchResults);

      const queryPattern = createTestDNA();
      const results = await vectorStore.searchSimilarPatterns(queryPattern, {
        limit: 10,
        threshold: 0.7,
      });

      expect(results).toHaveLength(1);
      expect(results[0].similarity).toBe(0.9);
      expect(results[0].distance).toBe(0.1);
      expect(mockQdrantClient.search).toHaveBeenCalledWith(
        'test_evolution_patterns',
        expect.objectContaining({
          vector: expect.any(Array),
          limit: 10,
          score_threshold: 0.7,
          with_payload: true,
          with_vector: false,
        })
      );
    });

    it('should apply filters in search', async () => {
      mockQdrantClient.search.mockResolvedValueOnce([]);

      const queryPattern = createTestDNA();
      const filter: PatternSearchFilter = {
        patternTypes: ['analytical', 'creative'],
        generations: [1, 2],
        performanceThresholds: {
          minSuccessRate: 0.8,
        },
      };

      await vectorStore.searchSimilarPatterns(queryPattern, {
        limit: 10,
        filter,
      });

      expect(mockQdrantClient.search).toHaveBeenCalledWith(
        'test_evolution_patterns',
        expect.objectContaining({
          filter: expect.objectContaining({
            must: expect.arrayContaining([
              expect.objectContaining({
                key: 'patternType',
                match: { any: ['analytical', 'creative'] },
              }),
              expect.objectContaining({
                key: 'generation',
                match: { any: [1, 2] },
              }),
            ]),
          }),
        })
      );
    });

    it('should generate embedding for query pattern if needed', async () => {
      mockQdrantClient.search.mockResolvedValueOnce([]);
      
      const queryPattern = createTestDNA({ embedding: [] });
      await vectorStore.searchSimilarPatterns(queryPattern);

      expect(mockOpenAI.embeddings.create).toHaveBeenCalled();
    });

    it('should handle search errors', async () => {
      mockQdrantClient.search.mockRejectedValueOnce(new Error('Search failed'));

      const queryPattern = createTestDNA();
      await expect(vectorStore.searchSimilarPatterns(queryPattern))
        .rejects.toThrow('Failed to search patterns');
    });
  });

  describe('deletePattern', () => {
    it('should delete a pattern', async () => {
      mockQdrantClient.delete.mockResolvedValueOnce({});

      const patternId = 'dna-test-1' as any;
      await vectorStore.deletePattern(patternId);

      expect(mockQdrantClient.delete).toHaveBeenCalledWith(
        'test_evolution_patterns',
        {
          wait: true,
          points: [patternId],
        }
      );
    });

    it('should handle deletion errors', async () => {
      mockQdrantClient.delete.mockRejectedValueOnce(new Error('Delete failed'));

      const patternId = 'dna-test-1' as any;
      await expect(vectorStore.deletePattern(patternId))
        .rejects.toThrow('Failed to delete pattern');
    });
  });

  describe('getCollectionInfo', () => {
    it('should return collection statistics', async () => {
      mockQdrantClient.getCollection.mockResolvedValueOnce({
        vectors_count: 1000,
        indexed_vectors_count: 950,
        segments_count: 10,
      });

      const info = await vectorStore.getCollectionInfo();

      expect(info).toEqual({
        vectorCount: 1000,
        indexedVectorCount: 950,
        memoryUsageMb: 1, // 10 * 0.1 rounded
      });
    });

    it('should handle missing collection', async () => {
      mockQdrantClient.getCollection.mockRejectedValueOnce(new Error('Collection not found'));

      await expect(vectorStore.getCollectionInfo())
        .rejects.toThrow('Failed to get collection info');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('VectorStore Integration', () => {
  let vectorStore: EvolutionVectorStore;

  beforeEach(() => {
    jest.clearAllMocks();
    vectorStore = new EvolutionVectorStore(testConfig);
    
    // Setup successful mocks for integration tests
    mockQdrantClient.getCollections.mockResolvedValue({ collections: [] });
    mockQdrantClient.createCollection.mockResolvedValue({});
    mockQdrantClient.upsert.mockResolvedValue({});
    mockOpenAI.embeddings.create.mockResolvedValue({
      data: [{ embedding: createTestEmbedding() }],
    });
  });

  it('should complete full pattern lifecycle', async () => {
    // Initialize
    await vectorStore.initialize();

    // Store pattern
    const testDNA = createTestDNA();
    await vectorStore.storePattern(testDNA);

    // Search for similar patterns
    mockQdrantClient.search.mockResolvedValueOnce([
      {
        id: testDNA.id,
        score: 1.0,
        payload: {
          patternId: testDNA.id,
          patternType: testDNA.patternType,
          generation: testDNA.generation,
          genetics: testDNA.genetics,
          performance: testDNA.performance,
        },
      },
    ]);

    const searchResults = await vectorStore.searchSimilarPatterns(testDNA, {
      limit: 5,
      threshold: 0.8,
    });

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].similarity).toBe(1.0);

    // Delete pattern
    await vectorStore.deletePattern(testDNA.id);

    // Verify all operations were called
    expect(mockQdrantClient.createCollection).toHaveBeenCalled();
    expect(mockQdrantClient.upsert).toHaveBeenCalled();
    expect(mockQdrantClient.search).toHaveBeenCalled();
    expect(mockQdrantClient.delete).toHaveBeenCalled();
  });

  it('should handle concurrent operations', async () => {
    await vectorStore.initialize();

    const patterns = Array.from({ length: 5 }, (_, i) => 
      createTestDNA({ id: `dna-concurrent-${i}` as any })
    );

    // Store patterns concurrently
    const storePromises = patterns.map(pattern => 
      vectorStore.storePattern(pattern)
    );

    await Promise.all(storePromises);

    expect(mockQdrantClient.upsert).toHaveBeenCalledTimes(5);
  });
});