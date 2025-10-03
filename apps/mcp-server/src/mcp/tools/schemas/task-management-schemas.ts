/**
 * Task Management Validation Schemas
 *
 * Zod schemas for validating task management tool inputs.
 */

import { z } from 'zod';

export const SDLCPhaseSchema = z.enum(['planning', 'development', 'testing', 'review']);

export const GetTaskInfoSchema = z.object({
  taskId: z.number().int().positive(),
  phase: SDLCPhaseSchema,
});

export const TaskPlanSchema = z.object({
  overview: z.string().min(10),
  steps: z.array(z.object({
    description: z.string().min(5),
    estimatedMinutes: z.number().positive().optional(),
    dependencies: z.array(z.string()).optional(),
  })).min(1),
  technicalApproach: z.string().min(10),
  filesToCreate: z.array(z.string()).optional(),
  filesToModify: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  createdBy: z.string(),
});

export const CreatePlanSchema = z.object({
  taskId: z.number().int().positive(),
  plan: TaskPlanSchema,
});

export const UpdateTaskPhaseSchema = z.object({
  taskId: z.number().int().positive(),
  fromPhase: SDLCPhaseSchema,
  toPhase: SDLCPhaseSchema,
  metadata: z.record(z.unknown()).optional(),
});

export const MarkTaskCompleteSchema = z.object({
  taskId: z.number().int().positive(),
  phase: SDLCPhaseSchema,
  completionNotes: z.string().optional(),
});
