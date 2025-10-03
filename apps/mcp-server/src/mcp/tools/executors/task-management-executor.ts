/**
 * Task Management Tool Executors
 *
 * Core business logic for task management operations.
 */

import { eq, desc } from 'drizzle-orm';
import { db } from '../../../../db/index.js';
import { tasks } from '../../../../db/schema/tasks.js';
import { workflowState } from '../../../../db/schema/workflows.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { logger } from '../../../middleware/logger.js';
import type {
  GetTaskInfoInput,
  GetTaskInfoOutput,
  CreatePlanInput,
  CreatePlanOutput,
  UpdateTaskPhaseInput,
  UpdateTaskPhaseOutput,
  MarkTaskCompleteInput,
  MarkTaskCompleteOutput,
  TaskMetadata,
  WorkflowStateData,
  SDLCPhase,
} from '../../../types/task-management.js';
import { getPhaseAccessRules, canTransitionPhase } from '../utils/phase-access.js';

/**
 * Get task information filtered by SDLC phase
 */
export async function getTaskInfo(input: GetTaskInfoInput): Promise<GetTaskInfoOutput> {
  logger.debug({ input }, 'Getting task info');

  // Query task from database
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, input.taskId),
  });

  if (!task) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  // Get current workflow state
  const currentWorkflow = await db.query.workflowState.findFirst({
    where: eq(workflowState.taskId, input.taskId),
    orderBy: [desc(workflowState.updatedAt)],
  });

  const currentPhase: SDLCPhase = currentWorkflow?.phase as SDLCPhase || 'planning';

  // Get phase access rules
  const rules = getPhaseAccessRules(input.phase);

  // Parse metadata
  let metadata: TaskMetadata | null = null;
  if (task.metadata) {
    try {
      metadata = JSON.parse(task.metadata) as TaskMetadata;
    } catch (error) {
      logger.warn({ error, taskId: task.id }, 'Failed to parse task metadata');
    }
  }

  // Build response
  const output: GetTaskInfoOutput = {
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      metadata,
    },
    allowedFields: rules.allowedFields,
    phaseData: {
      currentPhase,
      canAccessPlan: rules.canAccessPlan,
      canAccessCode: rules.canAccessCode,
      canAccessTests: rules.canAccessTests,
      canAccessReview: rules.canAccessReview,
    },
  };

  logger.debug({ output }, 'Task info retrieved successfully');
  return output;
}

/**
 * Create implementation plan for a task
 */
export async function createPlan(input: CreatePlanInput): Promise<CreatePlanOutput> {
  logger.debug({ taskId: input.taskId }, 'Creating task plan');

  // Query task from database
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, input.taskId),
  });

  if (!task) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  // Check if plan already exists
  let existingMetadata: TaskMetadata | null = null;
  if (task.metadata) {
    try {
      existingMetadata = JSON.parse(task.metadata) as TaskMetadata;
      if (existingMetadata?.plan) {
        throw new AppError('Plan already exists for this task', 409, 'PLAN_EXISTS');
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.warn({ error, taskId: task.id }, 'Failed to parse existing metadata');
    }
  }

  // Update task metadata with plan
  const updatedMetadata: TaskMetadata = {
    ...existingMetadata,
    plan: input.plan,
  };

  await db
    .update(tasks)
    .set({
      metadata: JSON.stringify(updatedMetadata),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, input.taskId));

  // Create workflow state record
  const workflowData: WorkflowStateData = {
    currentPhase: 'planning',
    previousPhases: [],
    startedAt: new Date().toISOString(),
  };

  await db.insert(workflowState).values({
    taskId: input.taskId,
    phase: 'planning',
    step: 'plan_created',
    state: JSON.stringify(workflowData),
    metadata: JSON.stringify({
      planCreatedAt: input.plan.createdAt,
      planCreatedBy: input.plan.createdBy,
    }),
  });

  const output: CreatePlanOutput = {
    success: true,
    taskId: input.taskId,
    planId: `plan-${input.taskId}-${Date.now()}`,
    message: 'Plan created successfully',
  };

  logger.info({ taskId: input.taskId }, 'Task plan created successfully');
  return output;
}

/**
 * Update task phase (SDLC phase transition)
 */
export async function updateTaskPhase(input: UpdateTaskPhaseInput): Promise<UpdateTaskPhaseOutput> {
  logger.debug({ input }, 'Updating task phase');

  // Validate phase transition
  if (!canTransitionPhase(input.fromPhase, input.toPhase)) {
    throw new AppError(
      `Invalid phase transition from ${input.fromPhase} to ${input.toPhase}`,
      400,
      'INVALID_PHASE_TRANSITION'
    );
  }

  // Query task from database
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, input.taskId),
  });

  if (!task) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  // Get current workflow state
  const currentWorkflow = await db.query.workflowState.findFirst({
    where: eq(workflowState.taskId, input.taskId),
    orderBy: [desc(workflowState.updatedAt)],
  });

  if (!currentWorkflow) {
    throw new AppError('Workflow state not found', 404, 'WORKFLOW_NOT_FOUND');
  }

  // Verify current phase matches fromPhase
  if (currentWorkflow.phase !== input.fromPhase) {
    throw new AppError(
      `Current phase is ${currentWorkflow.phase}, not ${input.fromPhase}`,
      409,
      'PHASE_MISMATCH'
    );
  }

  // Parse previous workflow data
  let previousWorkflowData: WorkflowStateData;
  try {
    previousWorkflowData = JSON.parse(currentWorkflow.state) as WorkflowStateData;
  } catch (error) {
    logger.warn({ error }, 'Failed to parse workflow state, using defaults');
    previousWorkflowData = {
      currentPhase: input.fromPhase,
      previousPhases: [],
      startedAt: new Date().toISOString(),
    };
  }

  // Create new workflow state
  const newWorkflowData: WorkflowStateData = {
    currentPhase: input.toPhase,
    previousPhases: [...previousWorkflowData.previousPhases, input.fromPhase],
    startedAt: previousWorkflowData.startedAt,
    metadata: input.metadata,
  };

  const transitionedAt = new Date();

  await db.insert(workflowState).values({
    taskId: input.taskId,
    phase: input.toPhase,
    step: `transition_from_${input.fromPhase}`,
    state: JSON.stringify(newWorkflowData),
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });

  // Update task status based on phase
  let newStatus = task.status;
  if (input.toPhase === 'development' && task.status === 'pending') {
    newStatus = 'in_progress';
  }

  if (newStatus !== task.status) {
    await db
      .update(tasks)
      .set({
        status: newStatus,
        updatedAt: transitionedAt,
      })
      .where(eq(tasks.id, input.taskId));
  }

  const output: UpdateTaskPhaseOutput = {
    success: true,
    taskId: input.taskId,
    previousPhase: input.fromPhase,
    currentPhase: input.toPhase,
    transitionedAt: transitionedAt.toISOString(),
  };

  logger.info({ output }, 'Task phase updated successfully');
  return output;
}

/**
 * Mark task as complete (only from review phase)
 */
export async function markTaskComplete(input: MarkTaskCompleteInput): Promise<MarkTaskCompleteOutput> {
  logger.debug({ input }, 'Marking task as complete');

  // Verify phase is review
  if (input.phase !== 'review') {
    throw new AppError(
      'Task can only be marked complete from review phase',
      403,
      'INVALID_COMPLETION_PHASE'
    );
  }

  // Query task from database
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, input.taskId),
  });

  if (!task) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  // Verify task is in review phase
  const currentWorkflow = await db.query.workflowState.findFirst({
    where: eq(workflowState.taskId, input.taskId),
    orderBy: [desc(workflowState.updatedAt)],
  });

  if (!currentWorkflow || currentWorkflow.phase !== 'review') {
    throw new AppError(
      'Task must be in review phase to mark as complete',
      409,
      'NOT_IN_REVIEW_PHASE'
    );
  }

  const completedAt = new Date();

  // Update task status and completion time
  await db
    .update(tasks)
    .set({
      status: 'completed',
      completedAt,
      updatedAt: completedAt,
    })
    .where(eq(tasks.id, input.taskId));

  // Create final workflow state
  await db.insert(workflowState).values({
    taskId: input.taskId,
    phase: 'review',
    step: 'completed',
    state: JSON.stringify({
      currentPhase: 'review',
      completedAt: completedAt.toISOString(),
    }),
    metadata: input.completionNotes ? JSON.stringify({ completionNotes: input.completionNotes }) : null,
  });

  const output: MarkTaskCompleteOutput = {
    success: true,
    taskId: input.taskId,
    completedAt: completedAt.toISOString(),
    finalStatus: 'completed',
  };

  logger.info({ taskId: input.taskId }, 'Task marked as complete');
  return output;
}
