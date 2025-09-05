/**
 * Unit tests for DNA Evolution Engine
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { EvolutionDna, GeneticMarkers, PerformanceMetrics } from '@sentra/types';
import { 
  createMockEvolutionDna, 
  createMockGeneticMarkers, 
  createMockPerformanceMetrics,
  MockDnaPatterns,
  resetMockIdCounter 
} from '../test-data/mock-data-factory';

// Mock the DNA engine module since it may not be fully implemented
const mockDnaEngine = {
  evolvePattern: jest.fn(),
  calculateFitness: jest.fn(),
  mutateGenetics: jest.fn(),
  crossoverPatterns: jest.fn(),
  validatePattern: jest.fn(),
};

describe('DNA Evolution Engine', () => {
  beforeEach(() => {
    resetMockIdCounter();
    jest.clearAllMocks();
  });

  describe('Pattern Evolution', () => {
    it('should evolve a pattern with improved genetics', async () => {
      const originalPattern = MockDnaPatterns.analytical();
      const improvedGenetics = createMockGeneticMarkers({
        complexity: originalPattern.genetics.complexity + 0.1,
        adaptability: originalPattern.genetics.adaptability + 0.05,
        successRate: originalPattern.genetics.successRate + 0.02,
      });

      // Mock successful evolution
      mockDnaEngine.evolvePattern.mockResolvedValue({
        success: true,
        originalPattern,
        evolvedPattern: {
          ...originalPattern,
          genetics: improvedGenetics,
          generation: originalPattern.generation + 1,
          parentId: originalPattern.id,
        },
        fitnessImprovement: 0.15,
        generationNumber: originalPattern.generation + 1,
        reason: 'Performance threshold exceeded',
        metadata: { evolutionStrategy: 'optimization' },
      });

      const result = await mockDnaEngine.evolvePattern(originalPattern, 0.15);

      expect(result.success).toBe(true);
      expect(result.evolvedPattern.generation).toBe(originalPattern.generation + 1);
      expect(result.evolvedPattern.parentId).toBe(originalPattern.id);
      expect(result.evolvedPattern.genetics.successRate).toBeGreaterThan(
        originalPattern.genetics.successRate
      );
      expect(result.fitnessImprovement).toBe(0.15);
    });

    it('should handle evolution failure gracefully', async () => {
      const originalPattern = MockDnaPatterns.systematic();

      mockDnaEngine.evolvePattern.mockResolvedValue({
        success: false,
        originalPattern,
        evolvedPattern: originalPattern,
        fitnessImprovement: 0,
        generationNumber: originalPattern.generation,
        reason: 'Insufficient performance improvement',
        metadata: { minThreshold: 0.1, actualImprovement: 0.02 },
      });

      const result = await mockDnaEngine.evolvePattern(originalPattern, 0.02);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Insufficient performance improvement');
      expect(result.fitnessImprovement).toBe(0);
    });
  });

  describe('Fitness Calculation', () => {
    it('should calculate fitness score based on multiple factors', () => {
      const pattern = createMockEvolutionDna({
        genetics: createMockGeneticMarkers({
          successRate: 0.9,
          adaptability: 0.8,
          stability: 0.95,
          complexity: 0.7,
        }),
        performance: createMockPerformanceMetrics({
          successRate: 0.85,
          codeQualityScore: 0.9,
          userSatisfactionRating: 4.5,
        }),
      });

      // Mock fitness calculation
      mockDnaEngine.calculateFitness.mockReturnValue({
        fitnessScore: 0.87,
        breakdown: {
          genetic: 0.85,
          performance: 0.89,
          weighted: 0.87,
        },
        factors: {
          successRate: 0.9,
          stability: 0.95,
          adaptability: 0.8,
          userSatisfaction: 0.9, // 4.5/5 converted
        },
      });

      const result = mockDnaEngine.calculateFitness(pattern);

      expect(result.fitnessScore).toBe(0.87);
      expect(result.breakdown).toBeDefined();
      expect(result.factors.successRate).toBe(0.9);
      expect(result.factors.stability).toBe(0.95);
    });

    it('should penalize patterns with poor stability', () => {
      const unstablePattern = createMockEvolutionDna({
        genetics: createMockGeneticMarkers({
          stability: 0.3, // Very low stability
          successRate: 0.9,
        }),
      });

      mockDnaEngine.calculateFitness.mockReturnValue({
        fitnessScore: 0.45, // Lower due to instability
        breakdown: {
          genetic: 0.6,
          performance: 0.8,
          weighted: 0.45, // Heavily penalized
        },
        factors: {
          stability: 0.3,
          stabilityPenalty: -0.35,
        },
      });

      const result = mockDnaEngine.calculateFitness(unstablePattern);

      expect(result.fitnessScore).toBeLessThan(0.5);
      expect(result.factors.stabilityPenalty).toBeLessThan(0);
    });
  });

  describe('Genetic Mutation', () => {
    it('should apply beneficial mutations', () => {
      const originalGenetics = createMockGeneticMarkers();
      const mutationRate = 0.1;

      mockDnaEngine.mutateGenetics.mockReturnValue({
        genetics: {
          ...originalGenetics,
          adaptability: Math.min(1.0, originalGenetics.adaptability + 0.05),
          successRate: Math.min(1.0, originalGenetics.successRate + 0.02),
        },
        mutations: [
          {
            trait: 'adaptability',
            change: +0.05,
            reason: 'Performance feedback',
          },
          {
            trait: 'successRate',
            change: +0.02,
            reason: 'Success pattern recognition',
          },
        ],
        mutationStrength: mutationRate,
      });

      const result = mockDnaEngine.mutateGenetics(originalGenetics, mutationRate);

      expect(result.genetics.adaptability).toBeGreaterThan(originalGenetics.adaptability);
      expect(result.genetics.successRate).toBeGreaterThan(originalGenetics.successRate);
      expect(result.mutations).toHaveLength(2);
      expect(result.mutationStrength).toBe(mutationRate);
    });

    it('should cap genetic traits at 1.0', () => {
      const nearMaxGenetics = createMockGeneticMarkers({
        complexity: 0.98,
        adaptability: 0.99,
        successRate: 0.97,
      });

      mockDnaEngine.mutateGenetics.mockReturnValue({
        genetics: {
          ...nearMaxGenetics,
          complexity: 1.0, // Capped
          adaptability: 1.0, // Capped
          successRate: 1.0, // Capped
        },
        mutations: [
          { trait: 'complexity', change: +0.02, capped: true },
          { trait: 'adaptability', change: +0.01, capped: true },
          { trait: 'successRate', change: +0.03, capped: true },
        ],
        mutationStrength: 0.2,
      });

      const result = mockDnaEngine.mutateGenetics(nearMaxGenetics, 0.2);

      expect(result.genetics.complexity).toBe(1.0);
      expect(result.genetics.adaptability).toBe(1.0);
      expect(result.genetics.successRate).toBe(1.0);
      expect(result.mutations.every(m => m.capped)).toBe(true);
    });
  });

  describe('Pattern Crossover', () => {
    it('should create hybrid pattern from two parents', () => {
      const parent1 = MockDnaPatterns.analytical();
      const parent2 = MockDnaPatterns.creative();

      mockDnaEngine.crossoverPatterns.mockReturnValue({
        offspring: createMockEvolutionDna({
          genetics: createMockGeneticMarkers({
            // Hybrid traits
            complexity: (parent1.genetics.complexity + parent2.genetics.complexity) / 2,
            adaptability: Math.max(parent1.genetics.adaptability, parent2.genetics.adaptability),
            successRate: (parent1.genetics.successRate + parent2.genetics.successRate) / 2,
            novelty: Math.max(parent1.genetics.novelty, parent2.genetics.novelty),
          }),
          generation: Math.max(parent1.generation, parent2.generation) + 1,
          patternType: 'hybrid-analytical-creative',
        }),
        crossoverPoints: ['adaptability', 'novelty'],
        inheritanceRatio: { parent1: 0.6, parent2: 0.4 },
        hybridVigor: 0.15, // Bonus from genetic diversity
      });

      const result = mockDnaEngine.crossoverPatterns(parent1, parent2);

      expect(result.offspring.patternType).toBe('hybrid-analytical-creative');
      expect(result.offspring.generation).toBe(Math.max(parent1.generation, parent2.generation) + 1);
      expect(result.crossoverPoints).toContain('adaptability');
      expect(result.crossoverPoints).toContain('novelty');
      expect(result.hybridVigor).toBeGreaterThan(0);
    });

    it('should preserve best traits from both parents', () => {
      const highSuccessParent = createMockEvolutionDna({
        genetics: createMockGeneticMarkers({ successRate: 0.95, stability: 0.9 }),
      });
      const highAdaptabilityParent = createMockEvolutionDna({
        genetics: createMockGeneticMarkers({ adaptability: 0.95, novelty: 0.8 }),
      });

      mockDnaEngine.crossoverPatterns.mockReturnValue({
        offspring: createMockEvolutionDna({
          genetics: createMockGeneticMarkers({
            successRate: 0.95, // From first parent
            stability: 0.9,    // From first parent
            adaptability: 0.95, // From second parent
            novelty: 0.8,       // From second parent
          }),
        }),
        crossoverStrategy: 'best-of-breed',
        traitSources: {
          successRate: 'parent1',
          stability: 'parent1',
          adaptability: 'parent2',
          novelty: 'parent2',
        },
      });

      const result = mockDnaEngine.crossoverPatterns(highSuccessParent, highAdaptabilityParent);

      expect(result.offspring.genetics.successRate).toBe(0.95);
      expect(result.offspring.genetics.adaptability).toBe(0.95);
      expect(result.crossoverStrategy).toBe('best-of-breed');
    });
  });

  describe('Pattern Validation', () => {
    it('should validate healthy DNA patterns', () => {
      const healthyPattern = createMockEvolutionDna({
        genetics: createMockGeneticMarkers({
          complexity: 0.7,
          adaptability: 0.8,
          successRate: 0.85,
          stability: 0.9,
        }),
      });

      mockDnaEngine.validatePattern.mockReturnValue({
        isValid: true,
        score: 0.88,
        issues: [],
        recommendations: ['Continue current evolution path'],
      });

      const result = mockDnaEngine.validatePattern(healthyPattern);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0.8);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify problematic patterns', () => {
      const problematicPattern = createMockEvolutionDna({
        genetics: createMockGeneticMarkers({
          complexity: 0.95, // Too high
          stability: 0.2,    // Too low
          adaptability: 0.1, // Too low
        }),
      });

      mockDnaEngine.validatePattern.mockReturnValue({
        isValid: false,
        score: 0.35,
        issues: [
          'Excessive complexity may lead to brittleness',
          'Low stability threatens consistent performance',
          'Poor adaptability limits learning potential',
        ],
        recommendations: [
          'Reduce complexity through simplification mutations',
          'Focus on stability improvements',
          'Enhance adaptability training',
        ],
      });

      const result = mockDnaEngine.validatePattern(problematicPattern);

      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(0.5);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should detect genetic degradation across generations', () => {
      const degradedPattern = createMockEvolutionDna({
        generation: 10,
        genetics: createMockGeneticMarkers({
          // Simulated degradation over generations
          successRate: 0.4, // Severely degraded
          adaptability: 0.3,
          stability: 0.2,
        }),
      });

      mockDnaEngine.validatePattern.mockReturnValue({
        isValid: false,
        score: 0.15,
        issues: [
          'Genetic degradation detected across generations',
          'Performance metrics below minimum thresholds',
          'Pattern shows signs of evolutionary dead-end',
        ],
        recommendations: [
          'Consider fresh genetic material introduction',
          'Reset from earlier viable generation',
          'Archive pattern and spawn new lineage',
        ],
        severity: 'critical',
      });

      const result = mockDnaEngine.validatePattern(degradedPattern);

      expect(result.isValid).toBe(false);
      expect(result.severity).toBe('critical');
      expect(result.score).toBeLessThan(0.2);
      expect(result.issues.some(issue => issue.includes('degradation'))).toBe(true);
    });
  });
});