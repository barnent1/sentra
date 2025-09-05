/**
 * Evolution API Routes Unit Tests
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import type {
  EvolutionDnaId,
  CodeDNA,
  PatternTypeEnum,
} from '@sentra/types';

// Import the route handler
import { createEvolutionRouter } from '../../routes/evolution';

// Mock dependencies
jest.mock('@sentra/core', () => ({
  TestDNAEngine: jest.fn().mockImplementation(() => ({
    generateTestPattern: jest.fn(),
    evolvePattern: jest.fn(),
    calculateFitness: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
  })),
  createVectorDatabaseService: jest.fn().mockReturnValue({
    storePattern: jest.fn(),
    findSimilarPatterns: jest.fn(),
    initialize: jest.fn(),
  }),
}));

describe('Evolution API Routes', () => {
  let app: Express;
  let mockDNAEngine: any;
  let mockVectorService: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    const { TestDNAEngine, createVectorDatabaseService } = require('@sentra/core');
    mockDNAEngine = new TestDNAEngine();
    mockVectorService = createVectorDatabaseService();

    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Create router with mocked dependencies
    const evolutionRouter = createEvolutionRouter({
      dnaEngine: mockDNAEngine,
      vectorService: mockVectorService,
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      },
    });
    
    app.use('/api/evolution', evolutionRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/evolution/patterns', () => {
    it('should create a new evolution pattern', async () => {
      const mockPattern: CodeDNA = {
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
          description: 'Test pattern',
          tags: ['test'],
          author: 'test-user',
          version: '1.0.0',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDNAEngine.generateTestPattern.mockResolvedValue(mockPattern);
      mockVectorService.storePattern.mockResolvedValue(mockPattern.id);

      const response = await request(app)
        .post('/api/evolution/patterns')
        .send({
          context: {
            projectName: 'test-project',
            language: 'typescript',
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
          },
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          pattern: expect.objectContaining({
            id: mockPattern.id,
            generation: mockPattern.generation,
            patternType: mockPattern.patternType,
          }),
        },
      });

      expect(mockDNAEngine.generateTestPattern).toHaveBeenCalledTimes(1);
      expect(mockVectorService.storePattern).toHaveBeenCalledWith(mockPattern);
    });

    it('should return 400 for invalid request data', async () => {
      const response = await request(app)
        .post('/api/evolution/patterns')
        .send({
          // Missing required context
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('Invalid request'),
        },
      });
    });

    it('should handle engine errors gracefully', async () => {
      mockDNAEngine.generateTestPattern.mockRejectedValue(new Error('Engine failure'));

      const response = await request(app)
        .post('/api/evolution/patterns')
        .send({
          context: {
            projectName: 'test-project',
            language: 'typescript',
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
          },
        })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: expect.stringContaining('Failed to generate pattern'),
        },
      });
    });
  });

  describe('GET /api/evolution/patterns/:id', () => {
    it('should retrieve a pattern by ID', async () => {
      const mockPattern: CodeDNA = {
        id: 'test-pattern-2' as EvolutionDnaId,
        generation: 2,
        parentId: 'test-pattern-1' as EvolutionDnaId,
        patternType: 'adaptation' as PatternTypeEnum,
        code: 'function adapted() { return "evolved"; }',
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
        metadata: {
          description: 'Adapted pattern',
          tags: ['adapted'],
          author: 'test-user',
          version: '1.1.0',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database/service call
      mockVectorService.getPattern = jest.fn().mockResolvedValue(mockPattern);

      const response = await request(app)
        .get(`/api/evolution/patterns/${mockPattern.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          pattern: expect.objectContaining({
            id: mockPattern.id,
            generation: mockPattern.generation,
          }),
        },
      });
    });

    it('should return 404 for non-existent pattern', async () => {
      mockVectorService.getPattern = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/evolution/patterns/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: expect.stringContaining('Pattern not found'),
        },
      });
    });
  });

  describe('POST /api/evolution/patterns/:id/evolve', () => {
    it('should evolve an existing pattern', async () => {
      const parentPattern: CodeDNA = {
        id: 'parent-pattern' as EvolutionDnaId,
        generation: 1,
        parentId: null,
        patternType: 'optimization' as PatternTypeEnum,
        code: 'function parent() { return "original"; }',
        genetics: {
          successRate: 0.75,
          adaptationRate: 0.65,
          complexityIndex: 0.60,
          diversityScore: 0.55,
          stabilityFactor: 0.85,
        },
        performance: {
          responseTime: 180,
          throughput: 90,
          errorRate: 0.025,
          resourceUtilization: 0.70,
          scalabilityIndex: 0.78,
        },
        metadata: {
          description: 'Parent pattern',
          tags: ['parent'],
          author: 'test-user',
          version: '1.0.0',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const evolvedPattern: CodeDNA = {
        ...parentPattern,
        id: 'evolved-pattern' as EvolutionDnaId,
        generation: 2,
        parentId: parentPattern.id,
        code: 'function evolved() { return "improved"; }',
        genetics: {
          ...parentPattern.genetics,
          successRate: 0.82,
          adaptationRate: 0.71,
        },
        performance: {
          ...parentPattern.performance,
          responseTime: 160,
          throughput: 105,
          errorRate: 0.018,
        },
        metadata: {
          ...parentPattern.metadata,
          description: 'Evolved pattern',
          version: '1.1.0',
        },
      };

      mockVectorService.getPattern = jest.fn().mockResolvedValue(parentPattern);
      mockDNAEngine.evolvePattern = jest.fn().mockResolvedValue(evolvedPattern);
      mockVectorService.storePattern = jest.fn().mockResolvedValue(evolvedPattern.id);

      const response = await request(app)
        .post(`/api/evolution/patterns/${parentPattern.id}/evolve`)
        .send({
          evolutionParams: {
            mutationRate: 0.1,
            crossoverRate: 0.3,
            targetImprovement: 0.1,
          },
          feedback: {
            performanceFeedback: 'Good performance but needs optimization',
            userRating: 4,
          },
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          evolved: expect.objectContaining({
            id: evolvedPattern.id,
            generation: 2,
            parentId: parentPattern.id,
          }),
          improvements: expect.any(Object),
        },
      });

      expect(mockDNAEngine.evolvePattern).toHaveBeenCalledWith(
        parentPattern,
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('POST /api/evolution/patterns/search', () => {
    it('should search for similar patterns', async () => {
      const queryPattern: CodeDNA = {
        id: 'query-pattern' as EvolutionDnaId,
        generation: 1,
        parentId: null,
        patternType: 'optimization' as PatternTypeEnum,
        code: 'function query() { return "search"; }',
        genetics: {
          successRate: 0.80,
          adaptationRate: 0.70,
          complexityIndex: 0.65,
          diversityScore: 0.60,
          stabilityFactor: 0.88,
        },
        performance: {
          responseTime: 170,
          throughput: 95,
          errorRate: 0.020,
          resourceUtilization: 0.73,
          scalabilityIndex: 0.81,
        },
        metadata: {
          description: 'Query pattern',
          tags: ['query'],
          author: 'test-user',
          version: '1.0.0',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const similarPatterns = [
        {
          id: 'similar-1' as EvolutionDnaId,
          similarity: 0.95,
          pattern: queryPattern,
        },
        {
          id: 'similar-2' as EvolutionDnaId,
          similarity: 0.87,
          pattern: { ...queryPattern, id: 'similar-2' as EvolutionDnaId },
        },
      ];

      mockVectorService.findSimilarPatterns = jest.fn().mockResolvedValue(similarPatterns);

      const response = await request(app)
        .post('/api/evolution/patterns/search')
        .send({
          queryPattern,
          options: {
            limit: 10,
            threshold: 0.8,
            filters: {
              patternType: 'optimization',
            },
          },
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          results: expect.arrayContaining([
            expect.objectContaining({
              similarity: expect.any(Number),
              pattern: expect.any(Object),
            }),
          ]),
          totalCount: similarPatterns.length,
        },
      });

      expect(mockVectorService.findSimilarPatterns).toHaveBeenCalledWith(
        queryPattern,
        expect.objectContaining({
          limit: 10,
          threshold: 0.8,
          filters: {
            patternType: 'optimization',
          },
        })
      );
    });
  });

  describe('GET /api/evolution/metrics', () => {
    it('should return evolution metrics', async () => {
      const mockMetrics = {
        totalPatterns: 150,
        totalEvolutions: 1250,
        averageGeneration: 4.2,
        averageFitness: 0.78,
        topPerformingPatterns: [
          { id: 'top-1', fitness: 0.95 },
          { id: 'top-2', fitness: 0.92 },
        ],
        evolutionTrends: {
          daily: [
            { date: '2024-01-01', patterns: 10, evolutions: 45 },
            { date: '2024-01-02', patterns: 12, evolutions: 52 },
          ],
        },
      };

      // Mock metrics service
      const mockMetricsService = {
        getOverallMetrics: jest.fn().mockResolvedValue(mockMetrics),
      };

      // Assume we inject the metrics service
      const response = await request(app)
        .get('/api/evolution/metrics')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          metrics: expect.objectContaining({
            totalPatterns: expect.any(Number),
            totalEvolutions: expect.any(Number),
            averageGeneration: expect.any(Number),
          }),
        },
      });
    });
  });

  describe('error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/evolution/patterns')
        .type('json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.stringContaining('Invalid JSON'),
        },
      });
    });

    it('should handle large payloads', async () => {
      const largePayload = {
        context: {
          projectName: 'large-project',
          language: 'typescript',
          framework: 'express',
          requirements: Array.from({ length: 1000 }, (_, i) => `req-${i}`),
          constraints: Array.from({ length: 1000 }, (_, i) => `constraint-${i}`),
          targetMetrics: {
            responseTime: 200,
            throughput: 1000,
            errorRate: 0.01,
            resourceUtilization: 0.8,
            scalabilityIndex: 0.9,
          },
        },
      };

      // Assuming we have payload size limits
      const response = await request(app)
        .post('/api/evolution/patterns')
        .send(largePayload)
        .expect(413);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: expect.stringContaining('Request too large'),
        },
      });
    });
  });

  describe('performance benchmarks', () => {
    it('should respond within acceptable time limits', async () => {
      const mockPattern: CodeDNA = {
        id: 'perf-test' as EvolutionDnaId,
        generation: 1,
        parentId: null,
        patternType: 'optimization' as PatternTypeEnum,
        code: 'function performance() { return "test"; }',
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
          description: 'Performance test pattern',
          tags: ['performance'],
          author: 'test-user',
          version: '1.0.0',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDNAEngine.generateTestPattern.mockResolvedValue(mockPattern);
      mockVectorService.storePattern.mockResolvedValue(mockPattern.id);

      const start = Date.now();
      
      await request(app)
        .post('/api/evolution/patterns')
        .send({
          context: {
            projectName: 'perf-project',
            language: 'typescript',
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
          },
        })
        .expect(201);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200); // Should respond within 200ms
    });
  });
});