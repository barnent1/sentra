/**
 * Task Management Types
 *
 * Type definitions for task management operations and SDLC phase management.
 */

export type SDLCPhase = 'planning' | 'development' | 'testing' | 'review';

export interface TaskMetadata {
  branchName?: string;
  worktreePath?: string;
  adwId?: string;
  estimatedComplexity?: 'low' | 'medium' | 'high';
  plan?: TaskPlan;
  [key: string]: unknown;
}

export interface TaskPlan {
  overview: string;
  steps: Array<{
    description: string;
    estimatedMinutes?: number;
    dependencies?: string[];
  }>;
  technicalApproach: string;
  filesToCreate?: string[];
  filesToModify?: string[];
  risks?: string[];
  createdAt: string;
  createdBy: string;
}

export interface WorkflowStateData {
  currentPhase: SDLCPhase;
  previousPhases: SDLCPhase[];
  startedAt: string;
  metadata?: Record<string, unknown>;
}

export interface GetTaskInfoInput {
  taskId: number;
  phase: SDLCPhase;
}

export interface GetTaskInfoOutput {
  task: {
    id: number;
    title: string;
    description: string | null;
    status: string;
    priority: number;
    metadata: TaskMetadata | null;
  };
  allowedFields: string[];
  phaseData: {
    currentPhase: SDLCPhase;
    canAccessPlan: boolean;
    canAccessCode: boolean;
    canAccessTests: boolean;
    canAccessReview: boolean;
  };
}

export interface CreatePlanInput {
  taskId: number;
  plan: TaskPlan;
}

export interface CreatePlanOutput {
  success: boolean;
  taskId: number;
  planId: string;
  message: string;
}

export interface UpdateTaskPhaseInput {
  taskId: number;
  fromPhase: SDLCPhase;
  toPhase: SDLCPhase;
  metadata?: Record<string, unknown>;
}

export interface UpdateTaskPhaseOutput {
  success: boolean;
  taskId: number;
  previousPhase: SDLCPhase;
  currentPhase: SDLCPhase;
  transitionedAt: string;
}

export interface MarkTaskCompleteInput {
  taskId: number;
  phase: SDLCPhase;
  completionNotes?: string;
}

export interface MarkTaskCompleteOutput {
  success: boolean;
  taskId: number;
  completedAt: string;
  finalStatus: string;
}
