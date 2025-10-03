/**
 * Unit Tests: Task Management
 *
 * Tests for task management tools, phase access control, and validation schemas.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { z } from 'zod';
import {
  getPhaseAccessRules,
  canTransitionPhase,
  filterTaskByPhase,
  PHASE_TRANSITION_GRAPH,
} from '../../src/mcp/tools/utils/phase-access.js';
import {
  SDLCPhaseSchema,
  GetTaskInfoSchema,
  TaskPlanSchema,
  CreatePlanSchema,
  UpdateTaskPhaseSchema,
  MarkTaskCompleteSchema,
} from '../../src/mcp/tools/schemas/task-management-schemas.js';
import type { SDLCPhase } from '../../src/types/task-management.js';
import type { Task } from '../../db/schema/tasks.js';

describe('Task Management - Phase Access Control', () => {
  describe('PHASE_TRANSITION_GRAPH', () => {
    it('should define valid transitions from planning', () => {
      expect(PHASE_TRANSITION_GRAPH.planning).toEqual(['development']);
    });

    it('should define valid transitions from development', () => {
      expect(PHASE_TRANSITION_GRAPH.development).toEqual(['testing']);
    });

    it('should define valid transitions from testing', () => {
      expect(PHASE_TRANSITION_GRAPH.testing).toEqual(['review', 'development']);
    });

    it('should define valid transitions from review', () => {
      expect(PHASE_TRANSITION_GRAPH.review).toEqual(['development']);
    });

    it('should have all SDLC phases defined', () => {
      const phases: SDLCPhase[] = ['planning', 'development', 'testing', 'review'];
      phases.forEach(phase => {
        expect(PHASE_TRANSITION_GRAPH[phase]).toBeDefined();
        expect(Array.isArray(PHASE_TRANSITION_GRAPH[phase])).toBe(true);
      });
    });
  });

  describe('getPhaseAccessRules', () => {
    describe('planning phase', () => {
      it('should return correct access rules for planning phase', () => {
        const rules = getPhaseAccessRules('planning');

        expect(rules.allowedFields).toEqual([
          'id', 'title', 'description', 'status', 'priority', 'metadata'
        ]);
        expect(rules.canAccessPlan).toBe(false);
        expect(rules.canAccessCode).toBe(false);
        expect(rules.canAccessTests).toBe(false);
        expect(rules.canAccessReview).toBe(false);
      });
    });

    describe('development phase', () => {
      it('should return correct access rules for development phase', () => {
        const rules = getPhaseAccessRules('development');

        expect(rules.allowedFields).toEqual([
          'id', 'title', 'description', 'status', 'priority', 'metadata'
        ]);
        expect(rules.canAccessPlan).toBe(true);
        expect(rules.canAccessCode).toBe(true);
        expect(rules.canAccessTests).toBe(false);
        expect(rules.canAccessReview).toBe(false);
      });
    });

    describe('testing phase', () => {
      it('should return correct access rules for testing phase', () => {
        const rules = getPhaseAccessRules('testing');

        expect(rules.allowedFields).toEqual([
          'id', 'title', 'description', 'status', 'priority', 'metadata'
        ]);
        expect(rules.canAccessPlan).toBe(true);
        expect(rules.canAccessCode).toBe(true);
        expect(rules.canAccessTests).toBe(true);
        expect(rules.canAccessReview).toBe(false);
      });
    });

    describe('review phase', () => {
      it('should return correct access rules for review phase', () => {
        const rules = getPhaseAccessRules('review');

        expect(rules.allowedFields).toEqual([
          'id', 'title', 'description', 'status', 'priority', 'metadata'
        ]);
        expect(rules.canAccessPlan).toBe(true);
        expect(rules.canAccessCode).toBe(true);
        expect(rules.canAccessTests).toBe(true);
        expect(rules.canAccessReview).toBe(true);
      });
    });

    it('should include required fields for all phases', () => {
      const phases: SDLCPhase[] = ['planning', 'development', 'testing', 'review'];
      const requiredFields = ['id', 'title', 'description', 'status', 'priority', 'metadata'];

      phases.forEach(phase => {
        const rules = getPhaseAccessRules(phase);
        requiredFields.forEach(field => {
          expect(rules.allowedFields).toContain(field);
        });
      });
    });

    it('should progressively enable access through phases', () => {
      const planningRules = getPhaseAccessRules('planning');
      const developmentRules = getPhaseAccessRules('development');
      const testingRules = getPhaseAccessRules('testing');
      const reviewRules = getPhaseAccessRules('review');

      // Planning has no access
      expect(planningRules.canAccessPlan).toBe(false);
      expect(planningRules.canAccessCode).toBe(false);

      // Development gains plan and code access
      expect(developmentRules.canAccessPlan).toBe(true);
      expect(developmentRules.canAccessCode).toBe(true);
      expect(developmentRules.canAccessTests).toBe(false);

      // Testing gains test access
      expect(testingRules.canAccessPlan).toBe(true);
      expect(testingRules.canAccessCode).toBe(true);
      expect(testingRules.canAccessTests).toBe(true);
      expect(testingRules.canAccessReview).toBe(false);

      // Review has full access
      expect(reviewRules.canAccessPlan).toBe(true);
      expect(reviewRules.canAccessCode).toBe(true);
      expect(reviewRules.canAccessTests).toBe(true);
      expect(reviewRules.canAccessReview).toBe(true);
    });
  });

  describe('canTransitionPhase', () => {
    it('should allow transition from planning to development', () => {
      expect(canTransitionPhase('planning', 'development')).toBe(true);
    });

    it('should allow transition from development to testing', () => {
      expect(canTransitionPhase('development', 'testing')).toBe(true);
    });

    it('should allow transition from testing to review', () => {
      expect(canTransitionPhase('testing', 'review')).toBe(true);
    });

    it('should allow transition from testing back to development', () => {
      expect(canTransitionPhase('testing', 'development')).toBe(true);
    });

    it('should allow transition from review back to development', () => {
      expect(canTransitionPhase('review', 'development')).toBe(true);
    });

    it('should not allow transition from planning to testing', () => {
      expect(canTransitionPhase('planning', 'testing')).toBe(false);
    });

    it('should not allow transition from planning to review', () => {
      expect(canTransitionPhase('planning', 'review')).toBe(false);
    });

    it('should not allow transition from development to review', () => {
      expect(canTransitionPhase('development', 'review')).toBe(false);
    });

    it('should not allow transition from development to planning', () => {
      expect(canTransitionPhase('development', 'planning')).toBe(false);
    });

    it('should not allow transition from testing to planning', () => {
      expect(canTransitionPhase('testing', 'planning')).toBe(false);
    });

    it('should not allow transition from review to testing', () => {
      expect(canTransitionPhase('review', 'testing')).toBe(false);
    });

    it('should not allow transition from review to planning', () => {
      expect(canTransitionPhase('review', 'planning')).toBe(false);
    });

    it('should not allow same-phase transitions', () => {
      expect(canTransitionPhase('planning', 'planning')).toBe(false);
      expect(canTransitionPhase('development', 'development')).toBe(false);
      expect(canTransitionPhase('testing', 'testing')).toBe(false);
      expect(canTransitionPhase('review', 'review')).toBe(false);
    });
  });

  describe('filterTaskByPhase', () => {
    const mockTask: Task = {
      id: 1,
      projectId: 1,
      title: 'Test Task',
      description: 'Test Description',
      status: 'pending',
      priority: 1,
      metadata: null,
      assignedTo: null,
      estimatedMinutes: null,
      actualMinutes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
    };

    it('should filter task to allowed fields for planning phase', () => {
      const filtered = filterTaskByPhase(mockTask, 'planning');

      expect(filtered.id).toBe(1);
      expect(filtered.title).toBe('Test Task');
      expect(filtered.description).toBe('Test Description');
      expect(filtered.status).toBe('pending');
      expect(filtered.priority).toBe(1);
      expect(filtered.metadata).toBeNull();

      // Fields should be included based on allowedFields
      expect(Object.keys(filtered)).toContain('id');
      expect(Object.keys(filtered)).toContain('title');
    });

    it('should filter task to allowed fields for development phase', () => {
      const filtered = filterTaskByPhase(mockTask, 'development');

      expect(filtered.id).toBe(1);
      expect(filtered.title).toBe('Test Task');
      expect(filtered.description).toBe('Test Description');
      expect(filtered.status).toBe('pending');
      expect(filtered.priority).toBe(1);
      expect(filtered.metadata).toBeNull();
    });

    it('should only include allowed fields', () => {
      const filtered = filterTaskByPhase(mockTask, 'planning');
      const rules = getPhaseAccessRules('planning');

      // All keys in filtered should be in allowedFields
      Object.keys(filtered).forEach(key => {
        expect(rules.allowedFields).toContain(key);
      });
    });

    it('should handle task with metadata', () => {
      const taskWithMetadata: Task = {
        ...mockTask,
        metadata: '{"key": "value"}',
      };

      const filtered = filterTaskByPhase(taskWithMetadata, 'development');
      expect(filtered.metadata).toBe('{"key": "value"}');
    });

    it('should handle null metadata', () => {
      const filtered = filterTaskByPhase(mockTask, 'testing');
      expect(filtered.metadata).toBeNull();
    });
  });
});

describe('Task Management - Validation Schemas', () => {
  describe('SDLCPhaseSchema', () => {
    it('should accept valid SDLC phases', () => {
      expect(SDLCPhaseSchema.parse('planning')).toBe('planning');
      expect(SDLCPhaseSchema.parse('development')).toBe('development');
      expect(SDLCPhaseSchema.parse('testing')).toBe('testing');
      expect(SDLCPhaseSchema.parse('review')).toBe('review');
    });

    it('should reject invalid phase values', () => {
      expect(() => SDLCPhaseSchema.parse('invalid')).toThrow(z.ZodError);
      expect(() => SDLCPhaseSchema.parse('code')).toThrow(z.ZodError);
      expect(() => SDLCPhaseSchema.parse('')).toThrow(z.ZodError);
      expect(() => SDLCPhaseSchema.parse(null)).toThrow(z.ZodError);
      expect(() => SDLCPhaseSchema.parse(undefined)).toThrow(z.ZodError);
    });
  });

  describe('GetTaskInfoSchema', () => {
    it('should accept valid input', () => {
      const validInput = {
        taskId: 1,
        phase: 'development',
      };

      const result = GetTaskInfoSchema.parse(validInput);
      expect(result.taskId).toBe(1);
      expect(result.phase).toBe('development');
    });

    it('should reject non-positive task IDs', () => {
      expect(() => GetTaskInfoSchema.parse({ taskId: 0, phase: 'planning' })).toThrow(z.ZodError);
      expect(() => GetTaskInfoSchema.parse({ taskId: -1, phase: 'planning' })).toThrow(z.ZodError);
    });

    it('should reject non-integer task IDs', () => {
      expect(() => GetTaskInfoSchema.parse({ taskId: 1.5, phase: 'planning' })).toThrow(z.ZodError);
    });

    it('should reject invalid phases', () => {
      expect(() => GetTaskInfoSchema.parse({ taskId: 1, phase: 'invalid' })).toThrow(z.ZodError);
    });

    it('should reject missing required fields', () => {
      expect(() => GetTaskInfoSchema.parse({ taskId: 1 })).toThrow(z.ZodError);
      expect(() => GetTaskInfoSchema.parse({ phase: 'planning' })).toThrow(z.ZodError);
      expect(() => GetTaskInfoSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe('TaskPlanSchema', () => {
    const validPlan = {
      overview: 'This is a valid overview of at least 10 characters',
      steps: [
        {
          description: 'Step 1 description',
          estimatedMinutes: 30,
          dependencies: ['step0'],
        },
      ],
      technicalApproach: 'Technical approach with sufficient detail',
      filesToCreate: ['file1.ts', 'file2.ts'],
      filesToModify: ['existing.ts'],
      risks: ['Risk 1', 'Risk 2'],
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'test-agent',
    };

    it('should accept valid plan', () => {
      const result = TaskPlanSchema.parse(validPlan);
      expect(result.overview).toBe(validPlan.overview);
      expect(result.steps).toHaveLength(1);
      expect(result.technicalApproach).toBe(validPlan.technicalApproach);
    });

    it('should reject overview shorter than 10 characters', () => {
      const invalidPlan = { ...validPlan, overview: 'Short' };
      expect(() => TaskPlanSchema.parse(invalidPlan)).toThrow(z.ZodError);
    });

    it('should reject technicalApproach shorter than 10 characters', () => {
      const invalidPlan = { ...validPlan, technicalApproach: 'Short' };
      expect(() => TaskPlanSchema.parse(invalidPlan)).toThrow(z.ZodError);
    });

    it('should reject empty steps array', () => {
      const invalidPlan = { ...validPlan, steps: [] };
      expect(() => TaskPlanSchema.parse(invalidPlan)).toThrow(z.ZodError);
    });

    it('should reject step description shorter than 5 characters', () => {
      const invalidPlan = {
        ...validPlan,
        steps: [{ description: 'Hi' }],
      };
      expect(() => TaskPlanSchema.parse(invalidPlan)).toThrow(z.ZodError);
    });

    it('should accept plan without optional fields', () => {
      const minimalPlan = {
        overview: 'Minimal valid overview here',
        steps: [{ description: 'Step description' }],
        technicalApproach: 'Technical approach',
        createdAt: '2025-01-01T00:00:00.000Z',
        createdBy: 'test-agent',
      };

      const result = TaskPlanSchema.parse(minimalPlan);
      expect(result.filesToCreate).toBeUndefined();
      expect(result.filesToModify).toBeUndefined();
      expect(result.risks).toBeUndefined();
    });

    it('should accept step without optional fields', () => {
      const planWithMinimalStep = {
        ...validPlan,
        steps: [{ description: 'Step description only' }],
      };

      const result = TaskPlanSchema.parse(planWithMinimalStep);
      expect(result.steps[0].estimatedMinutes).toBeUndefined();
      expect(result.steps[0].dependencies).toBeUndefined();
    });

    it('should reject invalid datetime format for createdAt', () => {
      const invalidPlan = { ...validPlan, createdAt: 'not-a-datetime' };
      expect(() => TaskPlanSchema.parse(invalidPlan)).toThrow(z.ZodError);
    });

    it('should reject negative estimatedMinutes', () => {
      const invalidPlan = {
        ...validPlan,
        steps: [{ description: 'Step', estimatedMinutes: -10 }],
      };
      expect(() => TaskPlanSchema.parse(invalidPlan)).toThrow(z.ZodError);
    });

    it('should accept multiple steps', () => {
      const planWithMultipleSteps = {
        ...validPlan,
        steps: [
          { description: 'Step 1' },
          { description: 'Step 2', estimatedMinutes: 45 },
          { description: 'Step 3', dependencies: ['step1', 'step2'] },
        ],
      };

      const result = TaskPlanSchema.parse(planWithMultipleSteps);
      expect(result.steps).toHaveLength(3);
    });
  });

  describe('CreatePlanSchema', () => {
    const validPlan = {
      overview: 'Valid overview here',
      steps: [{ description: 'Step 1' }],
      technicalApproach: 'Technical approach',
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'test-agent',
    };

    it('should accept valid input', () => {
      const validInput = {
        taskId: 1,
        plan: validPlan,
      };

      const result = CreatePlanSchema.parse(validInput);
      expect(result.taskId).toBe(1);
      expect(result.plan.overview).toBe(validPlan.overview);
    });

    it('should reject non-positive task IDs', () => {
      expect(() => CreatePlanSchema.parse({ taskId: 0, plan: validPlan })).toThrow(z.ZodError);
      expect(() => CreatePlanSchema.parse({ taskId: -1, plan: validPlan })).toThrow(z.ZodError);
    });

    it('should reject invalid plan', () => {
      const invalidInput = {
        taskId: 1,
        plan: { overview: 'Short' },
      };
      expect(() => CreatePlanSchema.parse(invalidInput)).toThrow(z.ZodError);
    });

    it('should reject missing required fields', () => {
      expect(() => CreatePlanSchema.parse({ taskId: 1 })).toThrow(z.ZodError);
      expect(() => CreatePlanSchema.parse({ plan: validPlan })).toThrow(z.ZodError);
    });
  });

  describe('UpdateTaskPhaseSchema', () => {
    it('should accept valid input', () => {
      const validInput = {
        taskId: 1,
        fromPhase: 'planning',
        toPhase: 'development',
        metadata: { reason: 'Plan approved' },
      };

      const result = UpdateTaskPhaseSchema.parse(validInput);
      expect(result.taskId).toBe(1);
      expect(result.fromPhase).toBe('planning');
      expect(result.toPhase).toBe('development');
      expect(result.metadata).toEqual({ reason: 'Plan approved' });
    });

    it('should accept input without metadata', () => {
      const validInput = {
        taskId: 1,
        fromPhase: 'development',
        toPhase: 'testing',
      };

      const result = UpdateTaskPhaseSchema.parse(validInput);
      expect(result.metadata).toBeUndefined();
    });

    it('should reject non-positive task IDs', () => {
      expect(() => UpdateTaskPhaseSchema.parse({
        taskId: 0,
        fromPhase: 'planning',
        toPhase: 'development',
      })).toThrow(z.ZodError);
    });

    it('should reject invalid phases', () => {
      expect(() => UpdateTaskPhaseSchema.parse({
        taskId: 1,
        fromPhase: 'invalid',
        toPhase: 'development',
      })).toThrow(z.ZodError);

      expect(() => UpdateTaskPhaseSchema.parse({
        taskId: 1,
        fromPhase: 'planning',
        toPhase: 'invalid',
      })).toThrow(z.ZodError);
    });

    it('should reject missing required fields', () => {
      expect(() => UpdateTaskPhaseSchema.parse({
        taskId: 1,
        fromPhase: 'planning',
      })).toThrow(z.ZodError);

      expect(() => UpdateTaskPhaseSchema.parse({
        taskId: 1,
        toPhase: 'development',
      })).toThrow(z.ZodError);
    });

    it('should accept metadata with various types', () => {
      const input = {
        taskId: 1,
        fromPhase: 'testing',
        toPhase: 'review',
        metadata: {
          string: 'value',
          number: 123,
          boolean: true,
          array: [1, 2, 3],
          nested: { key: 'value' },
        },
      };

      const result = UpdateTaskPhaseSchema.parse(input);
      expect(result.metadata).toEqual(input.metadata);
    });
  });

  describe('MarkTaskCompleteSchema', () => {
    it('should accept valid input with completion notes', () => {
      const validInput = {
        taskId: 1,
        phase: 'review',
        completionNotes: 'Task completed successfully',
      };

      const result = MarkTaskCompleteSchema.parse(validInput);
      expect(result.taskId).toBe(1);
      expect(result.phase).toBe('review');
      expect(result.completionNotes).toBe('Task completed successfully');
    });

    it('should accept input without completion notes', () => {
      const validInput = {
        taskId: 1,
        phase: 'review',
      };

      const result = MarkTaskCompleteSchema.parse(validInput);
      expect(result.completionNotes).toBeUndefined();
    });

    it('should reject non-positive task IDs', () => {
      expect(() => MarkTaskCompleteSchema.parse({
        taskId: 0,
        phase: 'review',
      })).toThrow(z.ZodError);

      expect(() => MarkTaskCompleteSchema.parse({
        taskId: -5,
        phase: 'review',
      })).toThrow(z.ZodError);
    });

    it('should reject invalid phases', () => {
      expect(() => MarkTaskCompleteSchema.parse({
        taskId: 1,
        phase: 'invalid',
      })).toThrow(z.ZodError);
    });

    it('should accept any valid SDLC phase', () => {
      // Note: Schema validation allows any phase, business logic enforces review only
      const phases: SDLCPhase[] = ['planning', 'development', 'testing', 'review'];

      phases.forEach(phase => {
        const result = MarkTaskCompleteSchema.parse({
          taskId: 1,
          phase,
        });
        expect(result.phase).toBe(phase);
      });
    });

    it('should reject missing required fields', () => {
      expect(() => MarkTaskCompleteSchema.parse({ taskId: 1 })).toThrow(z.ZodError);
      expect(() => MarkTaskCompleteSchema.parse({ phase: 'review' })).toThrow(z.ZodError);
      expect(() => MarkTaskCompleteSchema.parse({})).toThrow(z.ZodError);
    });

    it('should accept empty string for completion notes', () => {
      const input = {
        taskId: 1,
        phase: 'review',
        completionNotes: '',
      };

      const result = MarkTaskCompleteSchema.parse(input);
      expect(result.completionNotes).toBe('');
    });
  });
});
