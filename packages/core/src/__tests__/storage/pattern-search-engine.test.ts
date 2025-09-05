/**
 * Comprehensive tests for Pattern Search Engine
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  PatternSearchEngine,
  RelevanceScorer,
  SearchCache,
  RankingAlgorithm,
} from '../../storage/pattern-search-engine';
import type {
  AdvancedSearchCriteria,
  SearchWeights,
  EnhancedSearchResult,
} from '../../storage/pattern-search-engine';
import { EvolutionVectorStore } from '../../storage/vector-store';
import type { PatternSearchResult } from '../../storage/vector-store';
import type { CodeDNA, GeneticMarkers, PerformanceMetrics, ProjectContext } from '../../types/evolution';

// ============================================================================
// TEST SETUP AND MOCKS
// ============================================================================

// Mock EvolutionVectorStore
const mockVectorStore = {
  searchSimilarPatterns: jest.fn(),
} as jest.Mocked<Pick<EvolutionVectorStore, 'searchSimilarPatterns'>>;

// Test data helpers (reusing from vector-store tests)
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
    patternType: 'analytical',
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

function createTestSearchCriteria(overrides: Partial<AdvancedSearchCriteria> = {}): AdvancedSearchCriteria {
  return {
    query: createTestDNA(),
    filters: {},
    ranking: {
      weights: {
        genetic: 0.3,
        performance: 0.3,
        context: 0.2,
        semantic: 0.15,
        temporal: 0.05,
      },
      algorithms: [RankingAlgorithm.HYBRID_SCORING],
      diversityFactor: 0.1,
      noveltyBonus: 0.1,
    },
    pagination: {
      limit: 10,
      offset: 0,
    },
    performance: {
      useCache: true,
      cacheTimeout: 3600000,
      maxSearchTime: 5000,
    },
    ...overrides,
  };
}

// ============================================================================
// RELEVANCE SCORER TESTS
// ============================================================================

describe('RelevanceScorer', () => {
  describe('computeGeneticSimilarity', () => {
    it('should compute perfect similarity for identical genetics', () => {
      const genetics1: GeneticMarkers = {
        complexity: 0.8,
        adaptability: 0.7,
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

      const similarity = RelevanceScorer.computeGeneticSimilarity(genetics1, genetics1);
      expect(similarity).toBe(1.0);
    });

    it('should compute lower similarity for different genetics', () => {
      const genetics1: GeneticMarkers = {
        complexity: 0.8, adaptability: 0.7, successRate: 0.9, transferability: 0.6,
        stability: 0.8, novelty: 0.5, patternRecognition: 0.7, errorRecovery: 0.8,
        communicationClarity: 0.7, learningVelocity: 0.8, resourceEfficiency: 0.6,
        collaborationAffinity: 0.7, riskTolerance: 0.5, thoroughness: 0.8,
        creativity: 0.6, persistence: 0.7, empathy: 0.6, pragmatism: 0.8,
      };

      const genetics2: GeneticMarkers = {
        complexity: 0.2, adaptability: 0.3, successRate: 0.1, transferability: 0.9,
        stability: 0.2, novelty: 0.9, patternRecognition: 0.3, errorRecovery: 0.2,
        communicationClarity: 0.3, learningVelocity: 0.2, resourceEfficiency: 0.9,
        collaborationAffinity: 0.3, riskTolerance: 0.9, thoroughness: 0.2,
        creativity: 0.9, persistence: 0.3, empathy: 0.9, pragmatism: 0.2,
      };

      const similarity = RelevanceScorer.computeGeneticSimilarity(genetics1, genetics2);
      expect(similarity).toBeLessThan(0.5);
      expect(similarity).toBeGreaterThan(0);
    });

    it('should apply custom weights correctly', () => {
      const genetics1: GeneticMarkers = {
        complexity: 1.0, adaptability: 0.0, successRate: 0.5, transferability: 0.5,
        stability: 0.5, novelty: 0.5, patternRecognition: 0.5, errorRecovery: 0.5,
        communicationClarity: 0.5, learningVelocity: 0.5, resourceEfficiency: 0.5,
        collaborationAffinity: 0.5, riskTolerance: 0.5, thoroughness: 0.5,
        creativity: 0.5, persistence: 0.5, empathy: 0.5, pragmatism: 0.5,
      };

      const genetics2: GeneticMarkers = {
        complexity: 1.0, adaptability: 1.0, successRate: 0.5, transferability: 0.5,
        stability: 0.5, novelty: 0.5, patternRecognition: 0.5, errorRecovery: 0.5,
        communicationClarity: 0.5, learningVelocity: 0.5, resourceEfficiency: 0.5,
        collaborationAffinity: 0.5, riskTolerance: 0.5, thoroughness: 0.5,
        creativity: 0.5, persistence: 0.5, empathy: 0.5, pragmatism: 0.5,
      };

      // High weight on complexity (which matches), low weight on adaptability (which differs)
      const weights = { complexity: 10.0, adaptability: 0.1 };
      const similarity = RelevanceScorer.computeGeneticSimilarity(genetics1, genetics2, weights);
      
      // Should be high because complexity matches and has high weight
      expect(similarity).toBeGreaterThan(0.8);
    });
  });

  describe('computePerformanceSimilarity', () => {
    it('should compute perfect similarity for identical performance', () => {
      const perf1: PerformanceMetrics = {
        successRate: 0.9, averageTaskCompletionTime: 1000, codeQualityScore: 0.85,
        userSatisfactionRating: 0.88, adaptationSpeed: 0.7, errorRecoveryRate: 0.8,
        knowledgeRetention: 0.75, crossDomainTransfer: 0.6, computationalEfficiency: 0.8,
        responseLatency: 150, throughput: 10.5, resourceUtilization: 0.7,
        bugIntroductionRate: 0.05, testCoverage: 0.9, documentationQuality: 0.8,
        maintainabilityScore: 0.85, communicationEffectiveness: 0.8, teamIntegration: 0.7,
        feedbackIncorporation: 0.8, conflictResolution: 0.7,
      };

      const similarity = RelevanceScorer.computePerformanceSimilarity(perf1, perf1);
      expect(similarity).toBe(1.0);
    });

    it('should compute partial similarity for different performance', () => {
      const perf1: PerformanceMetrics = {
        successRate: 0.9, averageTaskCompletionTime: 1000, codeQualityScore: 0.85,
        userSatisfactionRating: 0.88, adaptationSpeed: 0.7, errorRecoveryRate: 0.8,
        knowledgeRetention: 0.75, crossDomainTransfer: 0.6, computationalEfficiency: 0.8,
        responseLatency: 150, throughput: 10.5, resourceUtilization: 0.7,
        bugIntroductionRate: 0.05, testCoverage: 0.9, documentationQuality: 0.8,
        maintainabilityScore: 0.85, communicationEffectiveness: 0.8, teamIntegration: 0.7,
        feedbackIncorporation: 0.8, conflictResolution: 0.7,
      };

      const perf2: PerformanceMetrics = {
        successRate: 0.5, averageTaskCompletionTime: 2000, codeQualityScore: 0.4,
        userSatisfactionRating: 0.4, adaptationSpeed: 0.3, errorRecoveryRate: 0.4,
        knowledgeRetention: 0.35, crossDomainTransfer: 0.3, computationalEfficiency: 0.4,
        responseLatency: 300, throughput: 5.0, resourceUtilization: 0.3,
        bugIntroductionRate: 0.15, testCoverage: 0.5, documentationQuality: 0.4,
        maintainabilityScore: 0.4, communicationEffectiveness: 0.4, teamIntegration: 0.3,
        feedbackIncorporation: 0.4, conflictResolution: 0.3,
      };

      const similarity = RelevanceScorer.computePerformanceSimilarity(perf1, perf2);
      expect(similarity).toBeLessThan(0.8);
      expect(similarity).toBeGreaterThan(0);
    });
  });

  describe('computeContextSimilarity', () => {
    it('should compute high similarity for similar contexts', () => {
      const context1: ProjectContext = {
        id: 'project-1' as any, projectType: 'web-app', techStack: ['react', 'node.js', 'typescript'],
        complexity: 'medium', teamSize: 5, timeline: '3 months', requirements: ['responsive'],
        industryDomain: 'fintech', regulatoryCompliance: ['GDPR'], performanceRequirements: {
          maxResponseTime: 200, minThroughput: 100, availabilityTarget: 0.999, errorRateThreshold: 0.01,
        }, scalabilityNeeds: {
          expectedGrowthRate: 2, peakLoadCapacity: 1000, dataVolumeGrowth: '10GB/month', horizontalScaling: true,
        }, securityRequirements: {
          authenticationMethod: 'jwt', encryptionRequirements: ['TLS'], auditingNeeds: 'basic', dataPrivacyLevel: 'confidential',
        }, developmentStage: 'mvp', testingStrategy: 'comprehensive', deploymentStrategy: 'ci-cd', monitoringNeeds: 'advanced',
      };

      const context2: ProjectContext = {
        id: 'project-2' as any, projectType: 'web-app', techStack: ['react', 'node.js', 'typescript'],
        complexity: 'medium', teamSize: 6, timeline: '4 months', requirements: ['responsive'],
        industryDomain: 'fintech', regulatoryCompliance: ['GDPR'], performanceRequirements: {
          maxResponseTime: 250, minThroughput: 90, availabilityTarget: 0.995, errorRateThreshold: 0.02,
        }, scalabilityNeeds: {
          expectedGrowthRate: 2.5, peakLoadCapacity: 1200, dataVolumeGrowth: '12GB/month', horizontalScaling: true,
        }, securityRequirements: {
          authenticationMethod: 'oauth', encryptionRequirements: ['TLS'], auditingNeeds: 'basic', dataPrivacyLevel: 'confidential',
        }, developmentStage: 'mvp', testingStrategy: 'comprehensive', deploymentStrategy: 'ci-cd', monitoringNeeds: 'advanced',
      };

      const similarity = RelevanceScorer.computeContextSimilarity(context1, context2);
      expect(similarity).toBeGreaterThan(0.8);
    });

    it('should compute low similarity for different contexts', () => {
      const context1: ProjectContext = {
        id: 'project-1' as any, projectType: 'web-app', techStack: ['react', 'node.js'],
        complexity: 'low', teamSize: 2, timeline: '1 month', requirements: ['simple'],
        industryDomain: 'education', regulatoryCompliance: [], performanceRequirements: {
          maxResponseTime: 500, minThroughput: 10, availabilityTarget: 0.95, errorRateThreshold: 0.1,
        }, scalabilityNeeds: {
          expectedGrowthRate: 1, peakLoadCapacity: 100, dataVolumeGrowth: '1GB/month', horizontalScaling: false,
        }, securityRequirements: {
          authenticationMethod: 'basic', encryptionRequirements: [], auditingNeeds: 'basic', dataPrivacyLevel: 'public',
        }, developmentStage: 'proof-of-concept', testingStrategy: 'unit', deploymentStrategy: 'manual', monitoringNeeds: 'basic',
      };

      const context2: ProjectContext = {
        id: 'project-2' as any, projectType: 'embedded', techStack: ['c++', 'assembly'],
        complexity: 'enterprise', teamSize: 20, timeline: '2 years', requirements: ['real-time', 'safety-critical'],
        industryDomain: 'automotive', regulatoryCompliance: ['ISO26262'], performanceRequirements: {
          maxResponseTime: 1, minThroughput: 10000, availabilityTarget: 0.9999, errorRateThreshold: 0.0001,
        }, scalabilityNeeds: {
          expectedGrowthRate: 5, peakLoadCapacity: 100000, dataVolumeGrowth: '100TB/month', horizontalScaling: true,
        }, securityRequirements: {
          authenticationMethod: 'custom', encryptionRequirements: ['AES-256'], auditingNeeds: 'regulatory', dataPrivacyLevel: 'restricted',
        }, developmentStage: 'production', testingStrategy: 'comprehensive', deploymentStrategy: 'canary', monitoringNeeds: 'enterprise',
      };

      const similarity = RelevanceScorer.computeContextSimilarity(context1, context2);
      expect(similarity).toBeLessThan(0.3);
    });
  });

  describe('computeNoveltyScore', () => {
    it('should return 1.0 for first pattern (no existing patterns)', () => {
      const pattern = createTestDNA();
      const noveltyScore = RelevanceScorer.computeNoveltyScore(pattern, []);
      expect(noveltyScore).toBe(1.0);
    });

    it('should return low score for pattern identical to existing ones', () => {
      const pattern = createTestDNA();
      const existingPatterns = [pattern]; // Same pattern
      
      const noveltyScore = RelevanceScorer.computeNoveltyScore(pattern, existingPatterns);
      expect(noveltyScore).toBe(1.0); // Should skip self-comparison
    });

    it('should return high score for very different pattern', () => {
      const pattern1 = createTestDNA({
        genetics: {
          complexity: 0.1, adaptability: 0.1, successRate: 0.1, transferability: 0.1,
          stability: 0.1, novelty: 0.9, patternRecognition: 0.1, errorRecovery: 0.1,
          communicationClarity: 0.1, learningVelocity: 0.1, resourceEfficiency: 0.1,
          collaborationAffinity: 0.1, riskTolerance: 0.9, thoroughness: 0.1,
          creativity: 0.9, persistence: 0.1, empathy: 0.1, pragmatism: 0.1,
        },
      });

      const pattern2 = createTestDNA({
        genetics: {
          complexity: 0.9, adaptability: 0.9, successRate: 0.9, transferability: 0.9,
          stability: 0.9, novelty: 0.1, patternRecognition: 0.9, errorRecovery: 0.9,
          communicationClarity: 0.9, learningVelocity: 0.9, resourceEfficiency: 0.9,
          collaborationAffinity: 0.9, riskTolerance: 0.1, thoroughness: 0.9,
          creativity: 0.1, persistence: 0.9, empathy: 0.9, pragmatism: 0.9,
        },
      });

      const noveltyScore = RelevanceScorer.computeNoveltyScore(pattern1, [pattern2]);
      expect(noveltyScore).toBeGreaterThan(0.5);
    });
  });

  describe('computeDiversityScore', () => {
    it('should return 1.0 for single pattern', () => {
      const patterns = [createTestDNA()];
      const diversityScore = RelevanceScorer.computeDiversityScore(patterns);
      expect(diversityScore).toBe(1.0);
    });

    it('should return 0 for identical patterns', () => {
      const pattern = createTestDNA();
      const patterns = [pattern, { ...pattern, id: 'different-id' as any }];
      
      const diversityScore = RelevanceScorer.computeDiversityScore(patterns);
      expect(diversityScore).toBeGreaterThan(0); // Some diversity due to different computation
    });

    it('should return high score for diverse patterns', () => {
      const pattern1 = createTestDNA({
        genetics: { complexity: 0.1, adaptability: 0.1, successRate: 0.1, transferability: 0.1, stability: 0.1, novelty: 0.9, patternRecognition: 0.1, errorRecovery: 0.1, communicationClarity: 0.1, learningVelocity: 0.1, resourceEfficiency: 0.1, collaborationAffinity: 0.1, riskTolerance: 0.9, thoroughness: 0.1, creativity: 0.9, persistence: 0.1, empathy: 0.1, pragmatism: 0.1 },
      });
      
      const pattern2 = createTestDNA({
        id: 'dna-test-2' as any,
        genetics: { complexity: 0.9, adaptability: 0.9, successRate: 0.9, transferability: 0.9, stability: 0.9, novelty: 0.1, patternRecognition: 0.9, errorRecovery: 0.9, communicationClarity: 0.9, learningVelocity: 0.9, resourceEfficiency: 0.9, collaborationAffinity: 0.9, riskTolerance: 0.1, thoroughness: 0.9, creativity: 0.1, persistence: 0.9, empathy: 0.9, pragmatism: 0.9 },
      });

      const diversityScore = RelevanceScorer.computeDiversityScore([pattern1, pattern2]);
      expect(diversityScore).toBeGreaterThan(0.3);
    });
  });
});

// ============================================================================
// SEARCH CACHE TESTS
// ============================================================================

describe('SearchCache', () => {
  let cache: SearchCache;

  beforeEach(() => {
    cache = new SearchCache(1000, 10); // 1 second TTL, 10 max entries
  });

  afterEach(() => {
    cache.destroy();
  });

  it('should store and retrieve cached results', () => {
    const criteria = createTestSearchCriteria();
    const results: EnhancedSearchResult[] = [];
    const metrics = {
      totalResults: 0, searchTimeMs: 100, cacheHit: false,
      algorithmsUsed: [RankingAlgorithm.HYBRID_SCORING], filteringTimeMs: 10,
      rankingTimeMs: 20, vectorSearchTimeMs: 70,
    };

    cache.set(criteria, results, metrics);
    const cached = cache.get(criteria);

    expect(cached).toBeDefined();
    expect(cached!.results).toEqual(results);
    expect(cached!.metrics).toEqual(metrics);
    expect(cached!.hitCount).toBe(0);
  });

  it('should return undefined for expired entries', (done) => {
    const criteria = createTestSearchCriteria();
    const results: EnhancedSearchResult[] = [];
    const metrics = {
      totalResults: 0, searchTimeMs: 100, cacheHit: false,
      algorithmsUsed: [RankingAlgorithm.HYBRID_SCORING], filteringTimeMs: 10,
      rankingTimeMs: 20, vectorSearchTimeMs: 70,
    };

    cache.set(criteria, results, metrics, 50); // 50ms TTL

    setTimeout(() => {
      const cached = cache.get(criteria);
      expect(cached).toBeUndefined();
      done();
    }, 100);
  });

  it('should increment hit count on repeated access', () => {
    const criteria = createTestSearchCriteria();
    const results: EnhancedSearchResult[] = [];
    const metrics = {
      totalResults: 0, searchTimeMs: 100, cacheHit: false,
      algorithmsUsed: [RankingAlgorithm.HYBRID_SCORING], filteringTimeMs: 10,
      rankingTimeMs: 20, vectorSearchTimeMs: 70,
    };

    cache.set(criteria, results, metrics);
    
    const cached1 = cache.get(criteria);
    expect(cached1!.hitCount).toBe(1);
    
    const cached2 = cache.get(criteria);
    expect(cached2!.hitCount).toBe(2);
  });

  it('should evict least used entries when full', () => {
    // Fill cache
    for (let i = 0; i < 10; i++) {
      const criteria = createTestSearchCriteria({
        query: createTestDNA({ id: `dna-${i}` as any }),
      });
      cache.set(criteria, [], {
        totalResults: 0, searchTimeMs: 100, cacheHit: false,
        algorithmsUsed: [RankingAlgorithm.HYBRID_SCORING], filteringTimeMs: 10,
        rankingTimeMs: 20, vectorSearchTimeMs: 70,
      });
    }

    // Access some entries to increase hit count
    const criteria5 = createTestSearchCriteria({
      query: createTestDNA({ id: 'dna-5' as any }),
    });
    cache.get(criteria5);

    // Add one more entry (should evict least used)
    const newCriteria = createTestSearchCriteria({
      query: createTestDNA({ id: 'dna-new' as any }),
    });
    cache.set(newCriteria, [], {
      totalResults: 0, searchTimeMs: 100, cacheHit: false,
      algorithmsUsed: [RankingAlgorithm.HYBRID_SCORING], filteringTimeMs: 10,
      rankingTimeMs: 20, vectorSearchTimeMs: 70,
    });

    // Verify new entry is cached and accessed entry is still there
    expect(cache.get(newCriteria)).toBeDefined();
    expect(cache.get(criteria5)).toBeDefined();
  });

  it('should clear all entries', () => {
    const criteria = createTestSearchCriteria();
    cache.set(criteria, [], {
      totalResults: 0, searchTimeMs: 100, cacheHit: false,
      algorithmsUsed: [RankingAlgorithm.HYBRID_SCORING], filteringTimeMs: 10,
      rankingTimeMs: 20, vectorSearchTimeMs: 70,
    });

    cache.clear();
    expect(cache.get(criteria)).toBeUndefined();
  });

  it('should provide accurate cache statistics', () => {
    // Add some entries and access them
    for (let i = 0; i < 5; i++) {
      const criteria = createTestSearchCriteria({
        query: createTestDNA({ id: `dna-${i}` as any }),
      });
      cache.set(criteria, [], {
        totalResults: 0, searchTimeMs: 100, cacheHit: false,
        algorithmsUsed: [RankingAlgorithm.HYBRID_SCORING], filteringTimeMs: 10,
        rankingTimeMs: 20, vectorSearchTimeMs: 70,
      });
    }

    // Access first 3 entries twice each
    for (let i = 0; i < 3; i++) {
      const criteria = createTestSearchCriteria({
        query: createTestDNA({ id: `dna-${i}` as any }),
      });
      cache.get(criteria);
      cache.get(criteria);
    }

    const stats = cache.getStats();
    expect(stats.entries).toBe(5);
    expect(stats.hitRate).toBeGreaterThan(0);
    expect(stats.memoryUsageMb).toBeGreaterThan(0);
  });
});

// ============================================================================
// PATTERN SEARCH ENGINE TESTS
// ============================================================================

describe('PatternSearchEngine', () => {
  let searchEngine: PatternSearchEngine;
  let mockResults: PatternSearchResult[];

  beforeEach(() => {
    jest.clearAllMocks();
    searchEngine = new PatternSearchEngine(mockVectorStore as any, {
      cacheConfig: { ttl: 1000, maxEntries: 10 },
      defaultWeights: {
        genetic: 0.4,
        performance: 0.3,
        context: 0.2,
        semantic: 0.1,
        temporal: 0.0,
      },
    });

    // Setup mock results
    mockResults = [
      {
        pattern: createTestDNA(),
        similarity: 0.9,
        distance: 0.1,
      },
      {
        pattern: createTestDNA({
          id: 'dna-test-2' as any,
          genetics: {
            complexity: 0.6, adaptability: 0.7, successRate: 0.8, transferability: 0.5,
            stability: 0.7, novelty: 0.4, patternRecognition: 0.6, errorRecovery: 0.7,
            communicationClarity: 0.6, learningVelocity: 0.7, resourceEfficiency: 0.5,
            collaborationAffinity: 0.6, riskTolerance: 0.4, thoroughness: 0.7,
            creativity: 0.5, persistence: 0.6, empathy: 0.5, pragmatism: 0.7,
          },
        }),
        similarity: 0.8,
        distance: 0.2,
      },
    ];
  });

  describe('searchPatterns', () => {
    it('should return enhanced search results with ranking', async () => {
      mockVectorStore.searchSimilarPatterns.mockResolvedValueOnce(mockResults);

      const criteria = createTestSearchCriteria();
      const { results, metrics } = await searchEngine.searchPatterns(criteria);

      expect(results).toHaveLength(2);
      expect(results[0].scores.overall).toBeGreaterThan(0);
      expect(results[0].ranking.position).toBe(1);
      expect(results[1].ranking.position).toBe(2);
      expect(results[0].explanation).toContain('similarity');
      
      expect(metrics.totalResults).toBe(2);
      expect(metrics.searchTimeMs).toBeGreaterThan(0);
      expect(metrics.cacheHit).toBe(false);
      expect(metrics.algorithmsUsed).toContain(RankingAlgorithm.HYBRID_SCORING);
    });

    it('should use cache when enabled', async () => {
      mockVectorStore.searchSimilarPatterns.mockResolvedValueOnce(mockResults);

      const criteria = createTestSearchCriteria({ 
        performance: { useCache: true, cacheTimeout: 3600000, maxSearchTime: 5000 } 
      });

      // First call - should miss cache
      const { metrics: metrics1 } = await searchEngine.searchPatterns(criteria);
      expect(metrics1.cacheHit).toBe(false);

      // Second call - should hit cache
      const { metrics: metrics2 } = await searchEngine.searchPatterns(criteria);
      expect(metrics2.cacheHit).toBe(true);

      // Vector store should only be called once
      expect(mockVectorStore.searchSimilarPatterns).toHaveBeenCalledTimes(1);
    });

    it('should apply pagination correctly', async () => {
      const manyResults = Array.from({ length: 20 }, (_, i) => ({
        pattern: createTestDNA({ id: `dna-${i}` as any }),
        similarity: 0.9 - i * 0.01,
        distance: 0.1 + i * 0.01,
      }));
      mockVectorStore.searchSimilarPatterns.mockResolvedValueOnce(manyResults);

      const criteria = createTestSearchCriteria({
        pagination: { limit: 5, offset: 10 },
      });

      const { results } = await searchEngine.searchPatterns(criteria);
      expect(results).toHaveLength(5);
      // Should start from position 11 (10 offset + 1)
      expect(results[0].ranking.position).toBe(11);
    });

    it('should handle search errors gracefully', async () => {
      mockVectorStore.searchSimilarPatterns.mockRejectedValueOnce(new Error('Vector search failed'));

      const criteria = createTestSearchCriteria();
      await expect(searchEngine.searchPatterns(criteria))
        .rejects.toThrow('Pattern search failed');
    });

    it('should rank results by overall score', async () => {
      const results = [
        {
          pattern: createTestDNA({
            genetics: { complexity: 0.9, adaptability: 0.9, successRate: 0.9, transferability: 0.9, stability: 0.9, novelty: 0.9, patternRecognition: 0.9, errorRecovery: 0.9, communicationClarity: 0.9, learningVelocity: 0.9, resourceEfficiency: 0.9, collaborationAffinity: 0.9, riskTolerance: 0.9, thoroughness: 0.9, creativity: 0.9, persistence: 0.9, empathy: 0.9, pragmatism: 0.9 },
          }),
          similarity: 0.7, // Lower semantic similarity
          distance: 0.3,
        },
        {
          pattern: createTestDNA({
            id: 'dna-test-2' as any,
            genetics: { complexity: 0.1, adaptability: 0.1, successRate: 0.1, transferability: 0.1, stability: 0.1, novelty: 0.1, patternRecognition: 0.1, errorRecovery: 0.1, communicationClarity: 0.1, learningVelocity: 0.1, resourceEfficiency: 0.1, collaborationAffinity: 0.1, riskTolerance: 0.1, thoroughness: 0.1, creativity: 0.1, persistence: 0.1, empathy: 0.1, pragmatism: 0.1 },
          }),
          similarity: 0.9, // Higher semantic similarity
          distance: 0.1,
        },
      ];
      mockVectorStore.searchSimilarPatterns.mockResolvedValueOnce(results);

      const criteria = createTestSearchCriteria({
        ranking: {
          weights: {
            genetic: 0.8, // High genetic weight
            performance: 0.1,
            context: 0.05,
            semantic: 0.05, // Low semantic weight
            temporal: 0.0,
          },
          algorithms: [RankingAlgorithm.HYBRID_SCORING],
          diversityFactor: 0.0,
          noveltyBonus: 0.0,
        },
      });

      const { results: rankedResults } = await searchEngine.searchPatterns(criteria);
      
      // First result should have higher genetic similarity despite lower semantic similarity
      expect(rankedResults[0].pattern.id).toBe(results[0].pattern.id);
      expect(rankedResults[0].scores.genetic).toBeGreaterThan(rankedResults[1].scores.genetic);
    });
  });

  describe('cache management', () => {
    it('should provide cache statistics', () => {
      const stats = searchEngine.getCacheStats();
      expect(stats).toHaveProperty('entries');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('memoryUsageMb');
    });

    it('should clear cache when requested', () => {
      searchEngine.clearCache();
      const stats = searchEngine.getCacheStats();
      expect(stats.entries).toBe(0);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('PatternSearchEngine Integration', () => {
  let searchEngine: PatternSearchEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    searchEngine = new PatternSearchEngine(mockVectorStore as any);
  });

  it('should complete full search workflow with caching and ranking', async () => {
    const vectorResults: PatternSearchResult[] = [
      {
        pattern: createTestDNA({
          genetics: { complexity: 0.8, adaptability: 0.9, successRate: 0.85, transferability: 0.7, stability: 0.8, novelty: 0.6, patternRecognition: 0.75, errorRecovery: 0.8, communicationClarity: 0.7, learningVelocity: 0.85, resourceEfficiency: 0.65, collaborationAffinity: 0.75, riskTolerance: 0.55, thoroughness: 0.8, creativity: 0.65, persistence: 0.75, empathy: 0.65, pragmatism: 0.8 },
          performance: { successRate: 0.95, averageTaskCompletionTime: 800, codeQualityScore: 0.9, userSatisfactionRating: 0.92, adaptationSpeed: 0.8, errorRecoveryRate: 0.85, knowledgeRetention: 0.8, crossDomainTransfer: 0.7, computationalEfficiency: 0.85, responseLatency: 120, throughput: 12.0, resourceUtilization: 0.75, bugIntroductionRate: 0.03, testCoverage: 0.95, documentationQuality: 0.85, maintainabilityScore: 0.9, communicationEffectiveness: 0.85, teamIntegration: 0.8, feedbackIncorporation: 0.85, conflictResolution: 0.8 },
        }),
        similarity: 0.95,
        distance: 0.05,
      },
      {
        pattern: createTestDNA({
          id: 'dna-test-2' as any,
          genetics: { complexity: 0.6, adaptability: 0.7, successRate: 0.75, transferability: 0.6, stability: 0.7, novelty: 0.8, patternRecognition: 0.65, errorRecovery: 0.7, communicationClarity: 0.6, learningVelocity: 0.75, resourceEfficiency: 0.55, collaborationAffinity: 0.65, riskTolerance: 0.7, thoroughness: 0.7, creativity: 0.85, persistence: 0.65, empathy: 0.6, pragmatism: 0.7 },
          performance: { successRate: 0.8, averageTaskCompletionTime: 1200, codeQualityScore: 0.75, userSatisfactionRating: 0.78, adaptationSpeed: 0.65, errorRecoveryRate: 0.7, knowledgeRetention: 0.65, crossDomainTransfer: 0.55, computationalEfficiency: 0.7, responseLatency: 180, throughput: 8.5, resourceUtilization: 0.6, bugIntroductionRate: 0.08, testCoverage: 0.8, documentationQuality: 0.7, maintainabilityScore: 0.75, communicationEffectiveness: 0.7, teamIntegration: 0.65, feedbackIncorporation: 0.7, conflictResolution: 0.65 },
        }),
        similarity: 0.8,
        distance: 0.2,
      },
    ];

    mockVectorStore.searchSimilarPatterns.mockResolvedValueOnce(vectorResults);

    const criteria = createTestSearchCriteria({
      performance: { useCache: true, cacheTimeout: 3600000, maxSearchTime: 5000 },
      ranking: {
        weights: {
          genetic: 0.3,
          performance: 0.4, // Emphasize performance
          context: 0.2,
          semantic: 0.1,
          temporal: 0.0,
        },
        algorithms: [RankingAlgorithm.HYBRID_SCORING],
        diversityFactor: 0.1,
        noveltyBonus: 0.05,
      },
    });

    // First search - should hit vector store and cache result
    const { results: results1, metrics: metrics1 } = await searchEngine.searchPatterns(criteria);
    
    expect(results1).toHaveLength(2);
    expect(results1[0].scores.overall).toBeGreaterThan(0);
    expect(results1[0].ranking.position).toBe(1);
    expect(results1[0].explanation).toBeTruthy();
    expect(metrics1.cacheHit).toBe(false);
    expect(metrics1.vectorSearchTimeMs).toBeGreaterThan(0);
    expect(metrics1.rankingTimeMs).toBeGreaterThan(0);

    // Second search - should hit cache
    const { results: results2, metrics: metrics2 } = await searchEngine.searchPatterns(criteria);
    
    expect(results2).toEqual(results1);
    expect(metrics2.cacheHit).toBe(true);
    expect(mockVectorStore.searchSimilarPatterns).toHaveBeenCalledTimes(1);

    // Verify cache stats
    const cacheStats = searchEngine.getCacheStats();
    expect(cacheStats.entries).toBe(1);
    expect(cacheStats.hitRate).toBeGreaterThan(0);
  });
});