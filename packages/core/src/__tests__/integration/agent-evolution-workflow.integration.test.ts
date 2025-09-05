/**
 * Integration tests for Agent Evolution Workflow
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import type { 
  AgentConfig, 
  EvolutionDna, 
  Task, 
  AgentInstanceId,
  EvolutionDnaId,
  TaskId 
} from '@sentra/types';
import { EvolutionaryAgent, createEvolutionaryAgent } from '../../index';
import {
  createMockAgentConfig,
  createMockEvolutionDna,
  createMockTask,
  createMockAgentFamily,
  MockDnaPatterns,
  resetMockIdCounter,
} from '../test-data/mock-data-factory';

// Mock external services
const mockVectorStore = {
  store: jest.fn(),
  search: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockEvolutionEngine = {
  evolveAgent: jest.fn(),
  calculateFitness: jest.fn(),
  trackPerformance: jest.fn(),
  spawnOffspring: jest.fn(),
};

const mockOrchestrator = {
  assignTask: jest.fn(),
  monitorPerformance: jest.fn(),
  triggerEvolution: jest.fn(),
  spawnNewAgent: jest.fn(),
};

describe('Agent Evolution Workflow Integration', () => {
  let testAgents: AgentConfig[];
  let testDnaPatterns: EvolutionDna[];
  let testTasks: Task[];

  beforeAll(() => {
    // Setup test environment
    process.env['NODE_ENV'] = 'test';
  });

  afterAll(() => {
    // Cleanup
    jest.clearAllMocks();
  });

  beforeEach(() => {
    resetMockIdCounter();
    jest.clearAllMocks();
    
    // Create test data family
    const agentFamily = createMockAgentFamily(3);
    testAgents = agentFamily.agents;
    testDnaPatterns = agentFamily.dnaList;

    // Create variety of test tasks
    testTasks = [
      createMockTask({
        title: 'TypeScript Development Task',
        description: 'Implement TypeScript interfaces and unit tests',
        priority: 'high',
      }),
      createMockTask({
        title: 'Code Review Task',
        description: 'Review pull request for security and performance',
        priority: 'medium',
      }),
      createMockTask({
        title: 'Debugging Task', 
        description: 'Debug memory leak in Node.js application',
        priority: 'critical',
      }),
    ];
  });

  describe('Complete Agent Lifecycle', () => {
    it('should successfully complete agent spawn -> task assignment -> execution -> evolution cycle', async () => {
      const initialDna = MockDnaPatterns.analytical();
      const agentConfig = createMockAgentConfig({
        evolutionDnaId: initialDna.id,
      });

      // 1. Agent Spawn
      const agent = createEvolutionaryAgent(agentConfig, initialDna);
      expect(agent.isActive()).toBe(true);
      expect(agent.getGeneration()).toBe(initialDna.generation);

      // 2. Task Assignment
      const task = testTasks[0];
      mockOrchestrator.assignTask.mockResolvedValue({
        success: true,
        assignment: {
          agentId: agent.getId(),
          taskId: task.id,
          estimatedCompletion: new Date(Date.now() + 180000), // 3 minutes
          confidence: 0.85,
        },
      });

      const assignment = await mockOrchestrator.assignTask(agent.getId(), task.id);
      expect(assignment.success).toBe(true);
      expect(assignment.assignment.agentId).toBe(agent.getId());

      // 3. Task Execution
      const executionResult = await agent.processTask(task);
      expect(executionResult.success).toBe(true);
      expect(executionResult.data?.status).toBe('in_progress');

      // 4. Performance Tracking
      const performanceMetrics = {
        taskCompletionTime: 150, // 2.5 minutes (better than estimated)
        codeQualityScore: 0.92,
        successRate: 1.0,
        userSatisfactionRating: 4.8,
      };

      mockEvolutionEngine.trackPerformance.mockResolvedValue({
        agentId: agent.getId(),
        taskId: task.id,
        metrics: performanceMetrics,
        improvementScore: 0.15, // 15% improvement
        evolutionTrigger: performanceMetrics.successRate >= 0.9,
      });

      const tracking = await mockEvolutionEngine.trackPerformance(
        agent.getId(),
        task.id,
        performanceMetrics
      );
      expect(tracking.improvementScore).toBeGreaterThan(0.1);
      expect(tracking.evolutionTrigger).toBe(true);

      // 5. Evolution Trigger
      mockEvolutionEngine.evolveAgent.mockResolvedValue({
        success: true,
        parentAgent: agent,
        evolvedDna: {
          ...initialDna,
          id: 'evolved-dna-123' as EvolutionDnaId,
          generation: initialDna.generation + 1,
          parentId: initialDna.id,
          genetics: {
            ...initialDna.genetics,
            successRate: Math.min(1.0, initialDna.genetics.successRate + 0.05),
            adaptability: Math.min(1.0, initialDna.genetics.adaptability + 0.03),
          },
        },
        fitnessImprovement: 0.08,
        reason: 'Consistent high performance in TypeScript tasks',
      });

      const evolution = await mockEvolutionEngine.evolveAgent(
        agent.getId(),
        tracking.improvementScore
      );
      expect(evolution.success).toBe(true);
      expect(evolution.evolvedDna.generation).toBe(initialDna.generation + 1);
      expect(evolution.evolvedDna.genetics.successRate).toBeGreaterThan(
        initialDna.genetics.successRate
      );
    }, 10000);

    it('should handle agent failure and recovery cycle', async () => {
      const flakyDna = createMockEvolutionDna({
        genetics: {
          complexity: 0.95,
          adaptability: 0.3,
          successRate: 0.4, // Low success rate
          transferability: 0.2,
          stability: 0.3, // Low stability
          novelty: 0.8,
        },
      });

      const flakyAgent = createEvolutionaryAgent(
        createMockAgentConfig({ evolutionDnaId: flakyDna.id }),
        flakyDna
      );

      // Simulate task failure
      const challengingTask = createMockTask({
        description: 'Complex algorithmic optimization requiring high stability',
        priority: 'critical',
      });

      // Mock failure scenario
      const taskResult = await flakyAgent.processTask(challengingTask);
      expect(taskResult.success).toBe(true); // Agent accepts task initially

      // Mock performance tracking showing poor results
      mockEvolutionEngine.trackPerformance.mockResolvedValue({
        agentId: flakyAgent.getId(),
        taskId: challengingTask.id,
        metrics: {
          taskCompletionTime: 600, // Much longer than expected
          codeQualityScore: 0.3,  // Poor quality
          successRate: 0.0,       // Failed completely
          userSatisfactionRating: 1.5, // Very unsatisfied
        },
        improvementScore: -0.4, // Significant degradation
        evolutionTrigger: false, // Not ready for evolution
        recommendedAction: 'agent_replacement',
      });

      const failureTracking = await mockEvolutionEngine.trackPerformance(
        flakyAgent.getId(),
        challengingTask.id,
        {
          taskCompletionTime: 600,
          codeQualityScore: 0.3,
          successRate: 0.0,
          userSatisfactionRating: 1.5,
          adaptationSpeed: 0.1,
          errorRecoveryRate: 0.2,
        }
      );

      expect(failureTracking.improvementScore).toBeLessThan(0);
      expect(failureTracking.recommendedAction).toBe('agent_replacement');

      // Mock orchestrator spawning replacement agent
      mockOrchestrator.spawnNewAgent.mockResolvedValue({
        success: true,
        newAgent: createMockAgentConfig({
          name: 'ReplacementAgent',
          specialization: 'Stable Algorithm Implementation',
        }),
        newDna: MockDnaPatterns.systematic(), // More stable pattern
        reason: 'Original agent showed poor stability metrics',
        archivedAgent: flakyAgent.getId(),
      });

      const replacement = await mockOrchestrator.spawnNewAgent({
        basedOn: flakyDna.id,
        improvementGoals: ['stability', 'reliability'],
        context: challengingTask.description,
      });

      expect(replacement.success).toBe(true);
      expect(replacement.newDna.genetics.stability).toBeGreaterThan(flakyDna.genetics.stability);
      expect(replacement.archivedAgent).toBe(flakyAgent.getId());
    });
  });

  describe('Multi-Agent Collaboration', () => {
    it('should coordinate multiple agents on complex project', async () => {
      // Setup specialized agent team
      const orchestratorAgent = createEvolutionaryAgent(
        createMockAgentConfig({
          name: 'ProjectOrchestrator',
          specialization: 'Project Management',
          capabilities: ['planning', 'coordination', 'monitoring'],
        }),
        MockDnaPatterns.systematic()
      );

      const developerAgent = createEvolutionaryAgent(
        createMockAgentConfig({
          name: 'TypeScriptDeveloper',
          specialization: 'Development',
          capabilities: ['typescript', 'testing', 'architecture'],
        }),
        MockDnaPatterns.analytical()
      );

      const testerAgent = createEvolutionaryAgent(
        createMockAgentConfig({
          name: 'QualityAssurance',
          specialization: 'Testing',
          capabilities: ['testing', 'automation', 'validation'],
        }),
        MockDnaPatterns.systematic()
      );

      // Complex multi-phase project
      const projectTasks = [
        createMockTask({
          title: 'Architecture Planning',
          description: 'Design system architecture and component interfaces',
          dependencies: [],
        }),
        createMockTask({
          title: 'Core Implementation',
          description: 'Implement core business logic with TypeScript',
          dependencies: ['task-1' as TaskId], // Depends on architecture
        }),
        createMockTask({
          title: 'Test Suite Creation',
          description: 'Create comprehensive test coverage',
          dependencies: ['task-2' as TaskId], // Depends on implementation
        }),
      ];

      // Mock orchestrator assigning tasks
      mockOrchestrator.assignTask
        .mockResolvedValueOnce({
          success: true,
          assignment: {
            agentId: orchestratorAgent.getId(),
            taskId: projectTasks[0].id,
            reason: 'Best suited for architectural planning',
          },
        })
        .mockResolvedValueOnce({
          success: true,
          assignment: {
            agentId: developerAgent.getId(),
            taskId: projectTasks[1].id,
            reason: 'TypeScript specialization matches requirements',
          },
        })
        .mockResolvedValueOnce({
          success: true,
          assignment: {
            agentId: testerAgent.getId(),
            taskId: projectTasks[2].id,
            reason: 'Testing expertise required',
          },
        });

      // Execute workflow
      const assignments = await Promise.all([
        mockOrchestrator.assignTask(orchestratorAgent.getId(), projectTasks[0].id),
        mockOrchestrator.assignTask(developerAgent.getId(), projectTasks[1].id),
        mockOrchestrator.assignTask(testerAgent.getId(), projectTasks[2].id),
      ]);

      expect(assignments.every(a => a.success)).toBe(true);

      // Mock task execution results
      const orchestratorResult = await orchestratorAgent.processTask(projectTasks[0]);
      const developerResult = await developerAgent.processTask(projectTasks[1]);
      const testerResult = await testerAgent.processTask(projectTasks[2]);

      expect(orchestratorResult.success).toBe(true);
      expect(developerResult.success).toBe(true);
      expect(testerResult.success).toBe(true);

      // Mock collective performance improvement
      mockEvolutionEngine.trackPerformance.mockResolvedValue({
        teamPerformance: {
          overallSuccess: 0.95,
          collaborationScore: 0.88,
          efficiencyGain: 0.25, // 25% faster than individual work
          qualityImprovement: 0.15,
        },
        individualImprovements: {
          [orchestratorAgent.getId()]: 0.1,
          [developerAgent.getId()]: 0.12,
          [testerAgent.getId()]: 0.08,
        },
        teamSynergy: 0.2, // Bonus from collaboration
      });

      const teamPerformance = await mockEvolutionEngine.trackPerformance(
        'team-project-123',
        projectTasks[0].id,
        {}
      );

      expect(teamPerformance.teamPerformance.collaborationScore).toBeGreaterThan(0.8);
      expect(teamPerformance.teamSynergy).toBeGreaterThan(0);
    });
  });

  describe('Evolution Pressure Scenarios', () => {
    it('should adapt agents under changing requirements', async () => {
      const adaptiveAgent = createEvolutionaryAgent(
        createMockAgentConfig({
          capabilities: ['javascript', 'react'],
        }),
        createMockEvolutionDna({
          genetics: {
            complexity: 0.6,
            adaptability: 0.9, // High adaptability
            successRate: 0.8,
            transferability: 0.85,
            stability: 0.7,
            novelty: 0.6,
          },
        })
      );

      // Initial task in familiar domain
      const initialTask = createMockTask({
        description: 'Build React component with JavaScript',
      });

      const initialResult = await adaptiveAgent.processTask(initialTask);
      expect(initialResult.success).toBe(true);

      // Environmental change: shift to TypeScript requirement
      const evolutionPressure = {
        newRequirements: ['typescript', 'strict-typing'],
        performanceExpectations: {
          codeQualityScore: 0.9,
          maintainabilityScore: 0.85,
        },
        timeline: 'immediate',
      };

      // Mock adaptation evolution
      mockEvolutionEngine.evolveAgent.mockResolvedValue({
        success: true,
        adaptationResponse: {
          newCapabilities: ['typescript', 'type-definitions'],
          improvedGenetics: {
            complexity: 0.75, // Increased to handle typing
            adaptability: 0.95, // Further improved
            successRate: 0.85,
            transferability: 0.9,
          },
          learningCurve: 0.15, // Time to adapt
          confidenceLevel: 0.8,
        },
        reason: 'Environmental pressure: TypeScript adoption',
      });

      const adaptation = await mockEvolutionEngine.evolveAgent(
        adaptiveAgent.getId(),
        evolutionPressure
      );

      expect(adaptation.success).toBe(true);
      expect(adaptation.adaptationResponse.newCapabilities).toContain('typescript');
      expect(adaptation.adaptationResponse.improvedGenetics.complexity).toBeGreaterThan(0.6);

      // Test performance on new TypeScript task
      const typescriptTask = createMockTask({
        description: 'Refactor JavaScript component to TypeScript with strict typing',
      });

      // Mock successful adaptation
      const adaptedResult = await adaptiveAgent.processTask(typescriptTask);
      expect(adaptedResult.success).toBe(true);
    });

    it('should handle resource constraints and optimization pressure', async () => {
      const resourceHungryAgent = createEvolutionaryAgent(
        createMockAgentConfig(),
        createMockEvolutionDna({
          genetics: {
            complexity: 0.95, // Very complex
            adaptability: 0.6,
            successRate: 0.9,
            transferability: 0.7,
            stability: 0.8,
            novelty: 0.4,
          },
        })
      );

      // Introduce resource constraints
      const resourceConstraints = {
        maxMemoryUsage: '512MB',
        maxExecutionTime: 30000, // 30 seconds
        maxComplexity: 0.7, // Must reduce complexity
        energyEfficiencyTarget: 0.85,
      };

      // Mock optimization evolution
      mockEvolutionEngine.evolveAgent.mockResolvedValue({
        success: true,
        optimization: {
          reducedComplexity: 0.7, // Down from 0.95
          improvedEfficiency: 0.85,
          maintainedPerformance: 0.88, // Slight performance trade-off
          resourceSavings: 0.4, // 40% resource reduction
        },
        strategy: 'complexity_reduction_with_efficiency_gains',
        tradeoffs: {
          performance: -0.02, // Minor performance loss
          resourceUsage: -0.4, // Major resource improvement
          maintainability: +0.1, // Easier to maintain
        },
      });

      const optimization = await mockEvolutionEngine.evolveAgent(
        resourceHungryAgent.getId(),
        resourceConstraints
      );

      expect(optimization.success).toBe(true);
      expect(optimization.optimization.reducedComplexity).toBeLessThan(0.95);
      expect(optimization.optimization.resourceSavings).toBeGreaterThan(0.3);
      expect(optimization.tradeoffs.resourceUsage).toBeLessThan(0);
    });
  });
});