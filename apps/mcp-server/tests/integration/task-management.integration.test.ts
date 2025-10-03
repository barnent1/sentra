/**
 * Integration Tests: Task Management
 *
 * Tests for task management MCP tools with full SDLC workflow.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestPool, createTestDb, cleanDatabase } from '../helpers/db-test-utils.js';
import { users, projects, tasks, workflowState } from '../../db/schema/index.js';
import { eq, desc } from 'drizzle-orm';
import {
  getTaskInfo,
  createPlan,
  updateTaskPhase,
  markTaskComplete,
} from '../../src/mcp/tools/executors/task-management-executor.js';
import type {
  GetTaskInfoInput,
  CreatePlanInput,
  UpdateTaskPhaseInput,
  MarkTaskCompleteInput,
  TaskMetadata,
  WorkflowStateData,
} from '../../src/types/task-management.js';
import { AppError } from '../../src/middleware/errorHandler.js';
import pg from 'pg';

describe('Task Management Integration Tests', () => {
  let pool: pg.Pool;
  let db: ReturnType<typeof createTestDb>;
  let testUserId: number;
  let testProjectId: number;
  let testTaskId: number;

  beforeAll(() => {
    pool = createTestPool();
    db = createTestDb(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await cleanDatabase(db);

    // Create test user
    const [user] = await db
      .insert(users)
      .values({ email: 'test@example.com', username: 'testuser' })
      .returning();
    testUserId = user.id;

    // Create test project
    const [project] = await db
      .insert(projects)
      .values({ name: 'Test Project', ownerId: testUserId })
      .returning();
    testProjectId = project.id;

    // Create test task
    const [task] = await db
      .insert(tasks)
      .values({
        projectId: testProjectId,
        title: 'Test Task',
        description: 'Test task for integration testing',
        status: 'pending',
        priority: 1,
      })
      .returning();
    testTaskId = task.id;
  });

  describe('Full SDLC Workflow', () => {
    it('should complete full workflow: get_task_info → create_plan → update_task_phase → mark_task_complete', async () => {
      // Step 1: Get task info in planning phase
      const taskInfo = await getTaskInfo({
        taskId: testTaskId,
        phase: 'planning',
      });

      expect(taskInfo.task.id).toBe(testTaskId);
      expect(taskInfo.task.title).toBe('Test Task');
      expect(taskInfo.phaseData.currentPhase).toBe('planning');
      expect(taskInfo.phaseData.canAccessPlan).toBe(false);

      // Step 2: Create plan
      const planInput: CreatePlanInput = {
        taskId: testTaskId,
        plan: {
          overview: 'Implementation plan for test task with detailed overview',
          steps: [
            {
              description: 'Step 1: Implement feature',
              estimatedMinutes: 30,
            },
            {
              description: 'Step 2: Write tests',
              estimatedMinutes: 20,
            },
          ],
          technicalApproach: 'Use TypeScript with Drizzle ORM for database access',
          filesToCreate: ['new-feature.ts'],
          filesToModify: ['existing.ts'],
          risks: ['Database migration required'],
          createdAt: new Date().toISOString(),
          createdBy: 'planner-agent',
        },
      };

      const planResult = await createPlan(planInput);

      expect(planResult.success).toBe(true);
      expect(planResult.taskId).toBe(testTaskId);
      expect(planResult.planId).toMatch(/^plan-/);

      // Verify plan stored in metadata
      const taskWithPlan = await db.query.tasks.findFirst({
        where: eq(tasks.id, testTaskId),
      });
      expect(taskWithPlan?.metadata).toBeTruthy();
      const metadata = JSON.parse(taskWithPlan!.metadata!) as TaskMetadata;
      expect(metadata.plan).toBeDefined();
      expect(metadata.plan?.overview).toBe(planInput.plan.overview);

      // Verify workflow state created
      const workflowRecord = await db.query.workflowState.findFirst({
        where: eq(workflowState.taskId, testTaskId),
      });
      expect(workflowRecord).toBeDefined();
      expect(workflowRecord?.phase).toBe('planning');
      expect(workflowRecord?.step).toBe('plan_created');

      // Step 3: Transition to development
      const devTransition = await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'planning',
        toPhase: 'development',
        metadata: { transitionReason: 'Plan approved' },
      });

      expect(devTransition.success).toBe(true);
      expect(devTransition.previousPhase).toBe('planning');
      expect(devTransition.currentPhase).toBe('development');

      // Verify workflow state updated
      const devWorkflow = await db.query.workflowState.findFirst({
        where: eq(workflowState.taskId, testTaskId),
        orderBy: [desc(workflowState.updatedAt)],
      });
      expect(devWorkflow?.phase).toBe('development');
      const devState = JSON.parse(devWorkflow!.state) as WorkflowStateData;
      expect(devState.currentPhase).toBe('development');
      expect(devState.previousPhases).toContain('planning');

      // Step 4: Get task info in development phase (should have plan access)
      const devTaskInfo = await getTaskInfo({
        taskId: testTaskId,
        phase: 'development',
      });

      expect(devTaskInfo.phaseData.currentPhase).toBe('development');
      expect(devTaskInfo.phaseData.canAccessPlan).toBe(true);
      expect(devTaskInfo.phaseData.canAccessCode).toBe(true);
      expect(devTaskInfo.task.metadata?.plan).toBeDefined();

      // Step 5: Transition to testing
      const testTransition = await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'development',
        toPhase: 'testing',
      });

      expect(testTransition.success).toBe(true);
      expect(testTransition.currentPhase).toBe('testing');

      // Step 6: Transition to review
      const reviewTransition = await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'testing',
        toPhase: 'review',
      });

      expect(reviewTransition.success).toBe(true);
      expect(reviewTransition.currentPhase).toBe('review');

      // Step 7: Get task info in review phase (should have full access)
      const reviewTaskInfo = await getTaskInfo({
        taskId: testTaskId,
        phase: 'review',
      });

      expect(reviewTaskInfo.phaseData.canAccessPlan).toBe(true);
      expect(reviewTaskInfo.phaseData.canAccessCode).toBe(true);
      expect(reviewTaskInfo.phaseData.canAccessTests).toBe(true);
      expect(reviewTaskInfo.phaseData.canAccessReview).toBe(true);

      // Step 8: Mark task complete
      const completeResult = await markTaskComplete({
        taskId: testTaskId,
        phase: 'review',
        completionNotes: 'All tests passed, ready for deployment',
      });

      expect(completeResult.success).toBe(true);
      expect(completeResult.taskId).toBe(testTaskId);
      expect(completeResult.finalStatus).toBe('completed');

      // Verify task marked as completed
      const completedTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, testTaskId),
      });
      expect(completedTask?.status).toBe('completed');
      expect(completedTask?.completedAt).toBeTruthy();

      // Verify completion workflow state
      const completionWorkflow = await db.query.workflowState.findFirst({
        where: eq(workflowState.taskId, testTaskId),
        orderBy: [desc(workflowState.updatedAt)],
      });
      expect(completionWorkflow?.step).toBe('completed');
    });

    it('should handle backward transition from testing to development', async () => {
      // Setup: Create plan and advance to testing
      await createPlan({
        taskId: testTaskId,
        plan: {
          overview: 'Test plan overview here',
          steps: [{ description: 'Test step' }],
          technicalApproach: 'Technical approach',
          createdAt: new Date().toISOString(),
          createdBy: 'planner',
        },
      });

      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'planning',
        toPhase: 'development',
      });

      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'development',
        toPhase: 'testing',
      });

      // Test backward transition
      const backTransition = await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'testing',
        toPhase: 'development',
        metadata: { reason: 'Tests failed, needs code changes' },
      });

      expect(backTransition.success).toBe(true);
      expect(backTransition.previousPhase).toBe('testing');
      expect(backTransition.currentPhase).toBe('development');

      const workflow = await db.query.workflowState.findFirst({
        where: eq(workflowState.taskId, testTaskId),
        orderBy: [desc(workflowState.updatedAt)],
      });

      expect(workflow?.phase).toBe('development');
      const state = JSON.parse(workflow!.state) as WorkflowStateData;
      expect(state.previousPhases).toContain('planning');
      expect(state.previousPhases).toContain('testing');
    });

    it('should handle backward transition from review to development', async () => {
      // Setup: Create plan and advance to review
      await createPlan({
        taskId: testTaskId,
        plan: {
          overview: 'Test plan overview here',
          steps: [{ description: 'Test step' }],
          technicalApproach: 'Technical approach',
          createdAt: new Date().toISOString(),
          createdBy: 'planner',
        },
      });

      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'planning',
        toPhase: 'development',
      });

      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'development',
        toPhase: 'testing',
      });

      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'testing',
        toPhase: 'review',
      });

      // Test backward transition from review
      const backTransition = await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'review',
        toPhase: 'development',
        metadata: { reason: 'Review failed, major changes needed' },
      });

      expect(backTransition.success).toBe(true);
      expect(backTransition.previousPhase).toBe('review');
      expect(backTransition.currentPhase).toBe('development');
    });
  });

  describe('Error Scenarios', () => {
    describe('get_task_info errors', () => {
      it('should return 404 for non-existent task', async () => {
        await expect(async () => {
          await getTaskInfo({
            taskId: 99999,
            phase: 'planning',
          });
        }).rejects.toThrow(AppError);

        try {
          await getTaskInfo({ taskId: 99999, phase: 'planning' });
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(404);
          expect((error as AppError).code).toBe('TASK_NOT_FOUND');
        }
      });

      it('should handle task with malformed metadata gracefully', async () => {
        // Insert task with invalid JSON metadata
        await db
          .update(tasks)
          .set({ metadata: 'invalid json{' })
          .where(eq(tasks.id, testTaskId));

        const result = await getTaskInfo({
          taskId: testTaskId,
          phase: 'planning',
        });

        expect(result.task.metadata).toBeNull();
      });
    });

    describe('create_plan errors', () => {
      it('should return 404 for non-existent task', async () => {
        await expect(async () => {
          await createPlan({
            taskId: 99999,
            plan: {
              overview: 'Plan overview',
              steps: [{ description: 'Step 1' }],
              technicalApproach: 'Approach',
              createdAt: new Date().toISOString(),
              createdBy: 'test',
            },
          });
        }).rejects.toThrow(AppError);

        try {
          await createPlan({
            taskId: 99999,
            plan: {
              overview: 'Plan overview',
              steps: [{ description: 'Step 1' }],
              technicalApproach: 'Approach',
              createdAt: new Date().toISOString(),
              createdBy: 'test',
            },
          });
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(404);
          expect((error as AppError).code).toBe('TASK_NOT_FOUND');
        }
      });

      it('should return 409 when plan already exists', async () => {
        const planInput: CreatePlanInput = {
          taskId: testTaskId,
          plan: {
            overview: 'First plan overview',
            steps: [{ description: 'Step 1' }],
            technicalApproach: 'Technical approach',
            createdAt: new Date().toISOString(),
            createdBy: 'planner',
          },
        };

        // Create plan first time
        await createPlan(planInput);

        // Try to create plan again
        await expect(async () => {
          await createPlan({
            taskId: testTaskId,
            plan: {
              overview: 'Second plan overview',
              steps: [{ description: 'Different step' }],
              technicalApproach: 'Different approach',
              createdAt: new Date().toISOString(),
              createdBy: 'planner',
            },
          });
        }).rejects.toThrow(AppError);

        try {
          await createPlan({
            taskId: testTaskId,
            plan: {
              overview: 'Second plan',
              steps: [{ description: 'Step' }],
              technicalApproach: 'Approach',
              createdAt: new Date().toISOString(),
              createdBy: 'test',
            },
          });
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(409);
          expect((error as AppError).code).toBe('PLAN_EXISTS');
        }
      });
    });

    describe('update_task_phase errors', () => {
      it('should return 404 for non-existent task', async () => {
        await expect(async () => {
          await updateTaskPhase({
            taskId: 99999,
            fromPhase: 'planning',
            toPhase: 'development',
          });
        }).rejects.toThrow(AppError);

        try {
          await updateTaskPhase({
            taskId: 99999,
            fromPhase: 'planning',
            toPhase: 'development',
          });
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(404);
        }
      });

      it('should return 404 when workflow state not found', async () => {
        // Task exists but no workflow state
        await expect(async () => {
          await updateTaskPhase({
            taskId: testTaskId,
            fromPhase: 'planning',
            toPhase: 'development',
          });
        }).rejects.toThrow(AppError);

        try {
          await updateTaskPhase({
            taskId: testTaskId,
            fromPhase: 'planning',
            toPhase: 'development',
          });
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(404);
          expect((error as AppError).code).toBe('WORKFLOW_NOT_FOUND');
        }
      });

      it('should return 400 for invalid phase transition', async () => {
        // Create plan to initialize workflow
        await createPlan({
          taskId: testTaskId,
          plan: {
            overview: 'Plan overview',
            steps: [{ description: 'Step 1' }],
            technicalApproach: 'Approach',
            createdAt: new Date().toISOString(),
            createdBy: 'test',
          },
        });

        // Try invalid transition: planning -> testing (should be planning -> development)
        await expect(async () => {
          await updateTaskPhase({
            taskId: testTaskId,
            fromPhase: 'planning',
            toPhase: 'testing',
          });
        }).rejects.toThrow(AppError);

        try {
          await updateTaskPhase({
            taskId: testTaskId,
            fromPhase: 'planning',
            toPhase: 'testing',
          });
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(400);
          expect((error as AppError).code).toBe('INVALID_PHASE_TRANSITION');
        }
      });

      it('should return 409 for phase mismatch', async () => {
        // Create plan and transition to development
        await createPlan({
          taskId: testTaskId,
          plan: {
            overview: 'Plan overview',
            steps: [{ description: 'Step 1' }],
            technicalApproach: 'Approach',
            createdAt: new Date().toISOString(),
            createdBy: 'test',
          },
        });

        await updateTaskPhase({
          taskId: testTaskId,
          fromPhase: 'planning',
          toPhase: 'development',
        });

        // Try to transition from planning (but task is in development)
        await expect(async () => {
          await updateTaskPhase({
            taskId: testTaskId,
            fromPhase: 'planning',
            toPhase: 'development',
          });
        }).rejects.toThrow(AppError);

        try {
          await updateTaskPhase({
            taskId: testTaskId,
            fromPhase: 'planning',
            toPhase: 'development',
          });
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(409);
          expect((error as AppError).code).toBe('PHASE_MISMATCH');
        }
      });
    });

    describe('mark_task_complete errors', () => {
      it('should return 404 for non-existent task', async () => {
        await expect(async () => {
          await markTaskComplete({
            taskId: 99999,
            phase: 'review',
          });
        }).rejects.toThrow(AppError);

        try {
          await markTaskComplete({
            taskId: 99999,
            phase: 'review',
          });
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(404);
          expect((error as AppError).code).toBe('TASK_NOT_FOUND');
        }
      });

      it('should return 403 when called from non-review phase', async () => {
        await expect(async () => {
          await markTaskComplete({
            taskId: testTaskId,
            phase: 'development',
          });
        }).rejects.toThrow(AppError);

        try {
          await markTaskComplete({
            taskId: testTaskId,
            phase: 'development',
          });
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(403);
          expect((error as AppError).code).toBe('INVALID_COMPLETION_PHASE');
        }
      });

      it('should return 409 when task is not in review phase', async () => {
        // Create plan and advance to development only
        await createPlan({
          taskId: testTaskId,
          plan: {
            overview: 'Plan overview',
            steps: [{ description: 'Step 1' }],
            technicalApproach: 'Approach',
            createdAt: new Date().toISOString(),
            createdBy: 'test',
          },
        });

        await updateTaskPhase({
          taskId: testTaskId,
          fromPhase: 'planning',
          toPhase: 'development',
        });

        // Try to complete from review phase, but task is in development
        await expect(async () => {
          await markTaskComplete({
            taskId: testTaskId,
            phase: 'review',
          });
        }).rejects.toThrow(AppError);

        try {
          await markTaskComplete({
            taskId: testTaskId,
            phase: 'review',
          });
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(409);
          expect((error as AppError).code).toBe('NOT_IN_REVIEW_PHASE');
        }
      });
    });
  });

  describe('Database Persistence', () => {
    it('should persist plan in task metadata', async () => {
      const planInput: CreatePlanInput = {
        taskId: testTaskId,
        plan: {
          overview: 'Detailed implementation plan',
          steps: [
            { description: 'Step 1', estimatedMinutes: 30 },
            { description: 'Step 2', estimatedMinutes: 45, dependencies: ['step1'] },
          ],
          technicalApproach: 'Use TypeScript and Jest',
          filesToCreate: ['new.ts'],
          filesToModify: ['old.ts'],
          risks: ['Breaking change'],
          createdAt: new Date().toISOString(),
          createdBy: 'planner-agent',
        },
      };

      await createPlan(planInput);

      // Retrieve task from database
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, testTaskId),
      });

      expect(task?.metadata).toBeTruthy();
      const metadata = JSON.parse(task!.metadata!) as TaskMetadata;
      expect(metadata.plan).toBeDefined();
      expect(metadata.plan?.overview).toBe(planInput.plan.overview);
      expect(metadata.plan?.steps).toHaveLength(2);
      expect(metadata.plan?.steps[0].estimatedMinutes).toBe(30);
      expect(metadata.plan?.filesToCreate).toEqual(['new.ts']);
      expect(metadata.plan?.risks).toEqual(['Breaking change']);
    });

    it('should create workflow_state record on plan creation', async () => {
      await createPlan({
        taskId: testTaskId,
        plan: {
          overview: 'Plan overview',
          steps: [{ description: 'Step 1' }],
          technicalApproach: 'Approach',
          createdAt: new Date().toISOString(),
          createdBy: 'planner',
        },
      });

      const workflowRecords = await db
        .select()
        .from(workflowState)
        .where(eq(workflowState.taskId, testTaskId));

      expect(workflowRecords).toHaveLength(1);
      expect(workflowRecords[0].phase).toBe('planning');
      expect(workflowRecords[0].step).toBe('plan_created');

      const state = JSON.parse(workflowRecords[0].state) as WorkflowStateData;
      expect(state.currentPhase).toBe('planning');
      expect(state.previousPhases).toEqual([]);
    });

    it('should create new workflow_state record on phase transition', async () => {
      await createPlan({
        taskId: testTaskId,
        plan: {
          overview: 'Plan overview',
          steps: [{ description: 'Step 1' }],
          technicalApproach: 'Approach',
          createdAt: new Date().toISOString(),
          createdBy: 'planner',
        },
      });

      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'planning',
        toPhase: 'development',
      });

      const workflowRecords = await db
        .select()
        .from(workflowState)
        .where(eq(workflowState.taskId, testTaskId));

      expect(workflowRecords.length).toBeGreaterThanOrEqual(2);

      // Get latest record
      const latest = await db.query.workflowState.findFirst({
        where: eq(workflowState.taskId, testTaskId),
        orderBy: [desc(workflowState.updatedAt)],
      });

      expect(latest?.phase).toBe('development');
      expect(latest?.step).toBe('transition_from_planning');
    });

    it('should track phase history in workflow state', async () => {
      await createPlan({
        taskId: testTaskId,
        plan: {
          overview: 'Plan overview',
          steps: [{ description: 'Step 1' }],
          technicalApproach: 'Approach',
          createdAt: new Date().toISOString(),
          createdBy: 'planner',
        },
      });

      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'planning',
        toPhase: 'development',
      });

      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'development',
        toPhase: 'testing',
      });

      const latest = await db.query.workflowState.findFirst({
        where: eq(workflowState.taskId, testTaskId),
        orderBy: [desc(workflowState.updatedAt)],
      });

      const state = JSON.parse(latest!.state) as WorkflowStateData;
      expect(state.currentPhase).toBe('testing');
      expect(state.previousPhases).toContain('planning');
      expect(state.previousPhases).toContain('development');
    });

    it('should update task status when transitioning to development', async () => {
      await createPlan({
        taskId: testTaskId,
        plan: {
          overview: 'Plan overview',
          steps: [{ description: 'Step 1' }],
          technicalApproach: 'Approach',
          createdAt: new Date().toISOString(),
          createdBy: 'planner',
        },
      });

      // Verify task is pending
      let task = await db.query.tasks.findFirst({
        where: eq(tasks.id, testTaskId),
      });
      expect(task?.status).toBe('pending');

      // Transition to development
      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'planning',
        toPhase: 'development',
      });

      // Verify task status updated to in_progress
      task = await db.query.tasks.findFirst({
        where: eq(tasks.id, testTaskId),
      });
      expect(task?.status).toBe('in_progress');
    });

    it('should set completedAt timestamp when marking task complete', async () => {
      // Setup: advance to review phase
      await createPlan({
        taskId: testTaskId,
        plan: {
          overview: 'Plan overview',
          steps: [{ description: 'Step 1' }],
          technicalApproach: 'Approach',
          createdAt: new Date().toISOString(),
          createdBy: 'planner',
        },
      });

      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'planning',
        toPhase: 'development',
      });

      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'development',
        toPhase: 'testing',
      });

      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'testing',
        toPhase: 'review',
      });

      const beforeCompletion = await db.query.tasks.findFirst({
        where: eq(tasks.id, testTaskId),
      });
      expect(beforeCompletion?.completedAt).toBeNull();

      // Mark complete
      await markTaskComplete({
        taskId: testTaskId,
        phase: 'review',
        completionNotes: 'Task completed',
      });

      const afterCompletion = await db.query.tasks.findFirst({
        where: eq(tasks.id, testTaskId),
      });
      expect(afterCompletion?.completedAt).toBeTruthy();
      expect(afterCompletion?.status).toBe('completed');
    });

    it('should preserve metadata when storing transition metadata', async () => {
      await createPlan({
        taskId: testTaskId,
        plan: {
          overview: 'Plan overview',
          steps: [{ description: 'Step 1' }],
          technicalApproach: 'Approach',
          createdAt: new Date().toISOString(),
          createdBy: 'planner',
        },
      });

      const transitionMetadata = {
        reason: 'Plan approved by reviewer',
        approvedBy: 'reviewer-agent',
        timestamp: new Date().toISOString(),
      };

      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'planning',
        toPhase: 'development',
        metadata: transitionMetadata,
      });

      const workflow = await db.query.workflowState.findFirst({
        where: eq(workflowState.taskId, testTaskId),
        orderBy: [desc(workflowState.updatedAt)],
      });

      expect(workflow?.metadata).toBeTruthy();
      const storedMetadata = JSON.parse(workflow!.metadata!);
      expect(storedMetadata).toEqual(transitionMetadata);
    });
  });

  describe('Phase Access Validation', () => {
    it('should return correct phase data for each phase', async () => {
      // Create plan
      await createPlan({
        taskId: testTaskId,
        plan: {
          overview: 'Plan overview',
          steps: [{ description: 'Step 1' }],
          technicalApproach: 'Approach',
          createdAt: new Date().toISOString(),
          createdBy: 'planner',
        },
      });

      // Check planning phase
      let info = await getTaskInfo({ taskId: testTaskId, phase: 'planning' });
      expect(info.phaseData.canAccessPlan).toBe(false);
      expect(info.phaseData.canAccessCode).toBe(false);
      expect(info.phaseData.canAccessTests).toBe(false);

      // Transition to development
      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'planning',
        toPhase: 'development',
      });

      info = await getTaskInfo({ taskId: testTaskId, phase: 'development' });
      expect(info.phaseData.canAccessPlan).toBe(true);
      expect(info.phaseData.canAccessCode).toBe(true);
      expect(info.phaseData.canAccessTests).toBe(false);

      // Transition to testing
      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'development',
        toPhase: 'testing',
      });

      info = await getTaskInfo({ taskId: testTaskId, phase: 'testing' });
      expect(info.phaseData.canAccessPlan).toBe(true);
      expect(info.phaseData.canAccessCode).toBe(true);
      expect(info.phaseData.canAccessTests).toBe(true);

      // Transition to review
      await updateTaskPhase({
        taskId: testTaskId,
        fromPhase: 'testing',
        toPhase: 'review',
      });

      info = await getTaskInfo({ taskId: testTaskId, phase: 'review' });
      expect(info.phaseData.canAccessPlan).toBe(true);
      expect(info.phaseData.canAccessCode).toBe(true);
      expect(info.phaseData.canAccessTests).toBe(true);
      expect(info.phaseData.canAccessReview).toBe(true);
    });
  });
});
