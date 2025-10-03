/**
 * Task Management MCP Tools
 *
 * Tools for managing tasks through the SDLC workflow.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../../middleware/logger.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  GetTaskInfoSchema,
  CreatePlanSchema,
  UpdateTaskPhaseSchema,
  MarkTaskCompleteSchema,
} from './schemas/task-management-schemas.js';
import {
  getTaskInfo,
  createPlan,
  updateTaskPhase,
  markTaskComplete,
} from './executors/task-management-executor.js';
import type {
  GetTaskInfoInput,
  CreatePlanInput,
  UpdateTaskPhaseInput,
  MarkTaskCompleteInput,
} from '../../types/task-management.js';

/**
 * Task management tools
 */
export const taskManagementTools: Tool[] = [
  {
    name: 'get_task_info',
    description: 'Retrieve task information filtered by SDLC phase. Returns task data with phase-appropriate access controls.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'number',
          description: 'The ID of the task to retrieve',
        },
        phase: {
          type: 'string',
          enum: ['planning', 'development', 'testing', 'review'],
          description: 'The current SDLC phase (determines access level)',
        },
      },
      required: ['taskId', 'phase'],
    },
  },
  {
    name: 'create_plan',
    description: 'Create an implementation plan for a task. Stores the plan in task metadata and initializes workflow state.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'number',
          description: 'The ID of the task to plan',
        },
        plan: {
          type: 'object',
          description: 'The implementation plan',
          properties: {
            overview: {
              type: 'string',
              description: 'High-level overview of the implementation (minimum 10 characters)',
            },
            steps: {
              type: 'array',
              description: 'Detailed implementation steps',
              items: {
                type: 'object',
                properties: {
                  description: {
                    type: 'string',
                    description: 'Step description (minimum 5 characters)',
                  },
                  estimatedMinutes: {
                    type: 'number',
                    description: 'Estimated time in minutes (optional)',
                  },
                  dependencies: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Step dependencies (optional)',
                  },
                },
                required: ['description'],
              },
              minItems: 1,
            },
            technicalApproach: {
              type: 'string',
              description: 'Technical approach and architecture decisions (minimum 10 characters)',
            },
            filesToCreate: {
              type: 'array',
              items: { type: 'string' },
              description: 'Files to be created (optional)',
            },
            filesToModify: {
              type: 'array',
              items: { type: 'string' },
              description: 'Files to be modified (optional)',
            },
            risks: {
              type: 'array',
              items: { type: 'string' },
              description: 'Potential risks (optional)',
            },
            createdAt: {
              type: 'string',
              description: 'ISO 8601 datetime when plan was created',
            },
            createdBy: {
              type: 'string',
              description: 'Identifier of who created the plan',
            },
          },
          required: ['overview', 'steps', 'technicalApproach', 'createdAt', 'createdBy'],
        },
      },
      required: ['taskId', 'plan'],
    },
  },
  {
    name: 'update_task_phase',
    description: 'Transition a task from one SDLC phase to another. Valid transitions: planning→development, development→testing, testing→review/development, review→development.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'number',
          description: 'The ID of the task to transition',
        },
        fromPhase: {
          type: 'string',
          enum: ['planning', 'development', 'testing', 'review'],
          description: 'Current SDLC phase',
        },
        toPhase: {
          type: 'string',
          enum: ['planning', 'development', 'testing', 'review'],
          description: 'Target SDLC phase',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata for the transition (optional)',
        },
      },
      required: ['taskId', 'fromPhase', 'toPhase'],
    },
  },
  {
    name: 'mark_task_complete',
    description: 'Mark a task as completed. Can only be called from the review phase after all work has been approved.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'number',
          description: 'The ID of the task to complete',
        },
        phase: {
          type: 'string',
          enum: ['planning', 'development', 'testing', 'review'],
          description: 'Current SDLC phase (must be review)',
        },
        completionNotes: {
          type: 'string',
          description: 'Optional notes about the completion',
        },
      },
      required: ['taskId', 'phase'],
    },
  },
];

/**
 * Execute a task management tool
 */
export async function executeTaskManagementTool(
  toolName: string,
  args: unknown
): Promise<unknown> {
  logger.debug({ toolName, args }, 'Executing task management tool');

  try {
    switch (toolName) {
      case 'get_task_info': {
        const validated = GetTaskInfoSchema.parse(args);
        return await getTaskInfo(validated as GetTaskInfoInput);
      }

      case 'create_plan': {
        const validated = CreatePlanSchema.parse(args);
        return await createPlan(validated as CreatePlanInput);
      }

      case 'update_task_phase': {
        const validated = UpdateTaskPhaseSchema.parse(args);
        return await updateTaskPhase(validated as UpdateTaskPhaseInput);
      }

      case 'mark_task_complete': {
        const validated = MarkTaskCompleteSchema.parse(args);
        return await markTaskComplete(validated as MarkTaskCompleteInput);
      }

      default:
        throw new AppError(`Unknown task management tool: ${toolName}`, 400, 'UNKNOWN_TOOL');
    }
  } catch (error) {
    logger.error({ error, toolName }, 'Task management tool execution failed');

    if (error instanceof AppError) {
      throw error;
    }

    // Re-throw validation errors
    throw error;
  }
}
