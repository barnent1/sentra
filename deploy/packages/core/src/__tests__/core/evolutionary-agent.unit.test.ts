/**
 * Unit tests for EvolutionaryAgent class
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { EvolutionaryAgent, createEvolutionaryAgent, EvolutionUtils } from '../../index';
import type {
  AgentConfig,
  EvolutionDna,
  Task,
  AgentInstanceId,
  EvolutionDnaId,
  TaskId,
  ProjectContextId,
} from '@sentra/types';

describe('EvolutionaryAgent', () => {
  let mockAgentConfig: AgentConfig;
  let mockEvolutionDna: EvolutionDna;
  let agent: EvolutionaryAgent;

  beforeEach(() => {
    mockAgentConfig = {
      id: 'agent-123' as AgentInstanceId,
      name: 'TestAgent',
      specialization: 'TypeScript Development',
      capabilities: ['typescript', 'testing', 'debugging'],
      evolutionDnaId: 'dna-456' as EvolutionDnaId,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    mockEvolutionDna = {
      id: 'dna-456' as EvolutionDnaId,
      patternType: 'analytical',
      genetics: {
        complexity: 0.7,
        adaptability: 0.8,
        successRate: 0.9,
        transferability: 0.6,
        stability: 0.85,
        novelty: 0.5,
      },
      performance: {
        successRate: 0.9,
        averageTaskCompletionTime: 120,
        codeQualityScore: 0.85,
        userSatisfactionRating: 4.2,
        adaptationSpeed: 0.7,
        errorRecoveryRate: 0.8,
      },
      projectContext: {
        projectType: 'web-app',
        techStack: ['typescript', 'react', 'node.js'],
        complexity: 'medium',
        teamSize: 5,
        timeline: '6 months',
        requirements: ['scalable', 'maintainable', 'tested'],
      },
      generation: 3,
      parentId: 'dna-parent-123' as EvolutionDnaId,
      embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    agent = new EvolutionaryAgent(mockAgentConfig, mockEvolutionDna);
  });

  describe('Initialization', () => {
    it('should create an agent with correct configuration', () => {
      expect(agent.getId()).toBe(mockAgentConfig.id);
      expect(agent.getName()).toBe(mockAgentConfig.name);
      expect(agent.getSpecialization()).toBe(mockAgentConfig.specialization);
      expect(agent.getCapabilities()).toEqual(mockAgentConfig.capabilities);
      expect(agent.getDnaId()).toBe(mockEvolutionDna.id);
      expect(agent.getGeneration()).toBe(mockEvolutionDna.generation);
      expect(agent.isActive()).toBe(true);
    });

    it('should return readonly capabilities array', () => {
      const capabilities = agent.getCapabilities();
      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.length).toBe(3);
      // Test that it's readonly by checking TypeScript compile-time readonly
      expect(capabilities).toEqual(['typescript', 'testing', 'debugging']);
    });
  });

  describe('Task Processing', () => {
    let mockTask: Task;

    beforeEach(() => {
      mockTask = {
        id: 'task-789' as TaskId,
        title: 'Implement TypeScript tests',
        description: 'Create comprehensive TypeScript unit tests for the core module',
        status: 'pending',
        priority: 'medium',
        projectContextId: 'context-123' as ProjectContextId,
        dependencies: [],
        estimatedDuration: 180,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
    });

    it('should successfully process a matching task', async () => {
      const result = await agent.processTask(mockTask);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.status).toBe('in_progress');
      expect(result.data?.assignedAgentId).toBe(mockAgentConfig.id);
      expect(result.error).toBeUndefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should fail when agent is inactive', async () => {
      const inactiveConfig = { ...mockAgentConfig, isActive: false };
      const inactiveAgent = new EvolutionaryAgent(inactiveConfig, mockEvolutionDna);
      
      const result = await inactiveAgent.processTask(mockTask);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('AGENT_INACTIVE');
      expect(result.error?.message).toContain('TestAgent is not active');
      expect(result.data).toBeUndefined();
    });

    it('should fail when task requires capabilities agent lacks', async () => {
      const mismatchedTask = {
        ...mockTask,
        description: 'Implement Python machine learning algorithms',
      };
      
      const result = await agent.processTask(mismatchedTask);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('CAPABILITY_MISMATCH');
      expect(result.error?.message).toContain('lacks required capabilities');
      expect(result.data).toBeUndefined();
    });

    it('should handle processing errors gracefully', async () => {
      // Create a task that would cause an error in the processing logic
      const problematicTask = {
        ...mockTask,
        description: null as any, // This should cause an error
      };
      
      const result = await agent.processTask(problematicTask);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('PROCESSING_ERROR');
      expect(result.data).toBeUndefined();
    });
  });

  describe('Factory Function', () => {
    it('should create agent using factory function', () => {
      const factoryAgent = createEvolutionaryAgent(mockAgentConfig, mockEvolutionDna);
      
      expect(factoryAgent).toBeInstanceOf(EvolutionaryAgent);
      expect(factoryAgent.getId()).toBe(mockAgentConfig.id);
      expect(factoryAgent.getName()).toBe(mockAgentConfig.name);
    });
  });
});

describe('EvolutionUtils', () => {
  let dna1: EvolutionDna;
  let dna2: EvolutionDna;

  beforeEach(() => {
    dna1 = {
      id: 'dna-1' as EvolutionDnaId,
      patternType: 'analytical',
      genetics: {
        complexity: 0.5,
        adaptability: 0.6,
        successRate: 0.7,
        transferability: 0.8,
        stability: 0.9,
        novelty: 0.4,
      },
      performance: {
        successRate: 0.85,
        averageTaskCompletionTime: 100,
        codeQualityScore: 0.9,
        userSatisfactionRating: 4.5,
        adaptationSpeed: 0.75,
        errorRecoveryRate: 0.8,
      },
      projectContext: {
        projectType: 'api',
        techStack: ['typescript', 'node.js'],
        complexity: 'medium',
        teamSize: 3,
        timeline: '3 months',
        requirements: ['performant', 'secure'],
      },
      generation: 1,
      embedding: [1, 0, 0, 0, 0],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    dna2 = {
      ...dna1,
      id: 'dna-2' as EvolutionDnaId,
      embedding: [0, 1, 0, 0, 0],
    };
  });

  describe('calculateDnaSimilarity', () => {
    it('should calculate similarity between identical DNA', () => {
      const similarity = EvolutionUtils.calculateDnaSimilarity(dna1, dna1);
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should calculate similarity between different DNA', () => {
      const similarity = EvolutionUtils.calculateDnaSimilarity(dna1, dna2);
      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it('should handle missing embeddings gracefully', () => {
      const dnaWithoutEmbedding = { ...dna1, embedding: undefined };
      const similarity = EvolutionUtils.calculateDnaSimilarity(dnaWithoutEmbedding, dna2);
      expect(similarity).toBe(0);
    });

    it('should handle zero magnitude vectors', () => {
      const zeroEmbedding = { ...dna1, embedding: [0, 0, 0, 0, 0] };
      const similarity = EvolutionUtils.calculateDnaSimilarity(zeroEmbedding, dna2);
      expect(similarity).toBe(0);
    });
  });

  describe('evolveGeneticMarkers', () => {
    it('should improve genetic markers with positive performance improvement', () => {
      const performanceImprovement = 0.2; // 20% improvement
      const newGenetics = EvolutionUtils.evolveGeneticMarkers(dna1, performanceImprovement);

      expect(newGenetics.complexity).toBeGreaterThan(dna1.genetics.complexity);
      expect(newGenetics.adaptability).toBeGreaterThan(dna1.genetics.adaptability);
      expect(newGenetics.successRate).toBeGreaterThan(dna1.genetics.successRate);
      expect(newGenetics.transferability).toBeGreaterThan(dna1.genetics.transferability);
      expect(newGenetics.stability).toBeGreaterThan(dna1.genetics.stability);
      expect(newGenetics.novelty).toBeGreaterThan(dna1.genetics.novelty);
    });

    it('should cap genetic markers at 1.0', () => {
      const performanceImprovement = 10.0; // Extreme improvement
      const newGenetics = EvolutionUtils.evolveGeneticMarkers(dna1, performanceImprovement);

      expect(newGenetics.complexity).toBeLessThanOrEqual(1.0);
      expect(newGenetics.adaptability).toBeLessThanOrEqual(1.0);
      expect(newGenetics.successRate).toBeLessThanOrEqual(1.0);
      expect(newGenetics.transferability).toBeLessThanOrEqual(1.0);
      expect(newGenetics.stability).toBeLessThanOrEqual(1.0);
      expect(newGenetics.novelty).toBeLessThanOrEqual(1.0);
    });

    it('should handle negative performance improvement', () => {
      const performanceImprovement = -0.1; // 10% degradation
      const newGenetics = EvolutionUtils.evolveGeneticMarkers(dna1, performanceImprovement);

      expect(newGenetics.complexity).toBeLessThan(dna1.genetics.complexity);
      expect(newGenetics.adaptability).toBeLessThan(dna1.genetics.adaptability);
      expect(newGenetics.successRate).toBeLessThan(dna1.genetics.successRate);
    });

    it('should maintain different evolution rates for different traits', () => {
      const performanceImprovement = 0.1;
      const newGenetics = EvolutionUtils.evolveGeneticMarkers(dna1, performanceImprovement);

      const complexityIncrease = newGenetics.complexity - dna1.genetics.complexity;
      const adaptabilityIncrease = newGenetics.adaptability - dna1.genetics.adaptability;
      const successRateIncrease = newGenetics.successRate - dna1.genetics.successRate;

      // Success rate should improve more than complexity due to different multipliers
      expect(successRateIncrease).toBeGreaterThan(complexityIncrease);
      expect(adaptabilityIncrease).toBeGreaterThan(complexityIncrease);
    });
  });
});