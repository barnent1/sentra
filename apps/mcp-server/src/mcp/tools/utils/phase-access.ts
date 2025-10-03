/**
 * Phase Access Control
 *
 * Utilities for managing SDLC phase-based access control and transitions.
 */

import type { SDLCPhase } from '../../../types/task-management.js';
import type { Task } from '../../../../db/schema/tasks.js';

export interface PhaseAccessRules {
  allowedFields: string[];
  canAccessPlan: boolean;
  canAccessCode: boolean;
  canAccessTests: boolean;
  canAccessReview: boolean;
}

/**
 * Phase transition graph defining valid phase transitions
 */
export const PHASE_TRANSITION_GRAPH: Record<SDLCPhase, SDLCPhase[]> = {
  'planning': ['development'],
  'development': ['testing'],
  'testing': ['review', 'development'],
  'review': ['development'],
};

/**
 * Get access rules for a given SDLC phase
 *
 * @param phase - The current SDLC phase
 * @returns Phase access rules
 */
export function getPhaseAccessRules(phase: SDLCPhase): PhaseAccessRules {
  switch (phase) {
    case 'planning':
      return {
        allowedFields: ['id', 'title', 'description', 'status', 'priority', 'metadata'],
        canAccessPlan: false, // Plan doesn't exist yet
        canAccessCode: false,
        canAccessTests: false,
        canAccessReview: false,
      };

    case 'development':
      return {
        allowedFields: ['id', 'title', 'description', 'status', 'priority', 'metadata'],
        canAccessPlan: true,
        canAccessCode: true,
        canAccessTests: false,
        canAccessReview: false,
      };

    case 'testing':
      return {
        allowedFields: ['id', 'title', 'description', 'status', 'priority', 'metadata'],
        canAccessPlan: true,
        canAccessCode: true,
        canAccessTests: true,
        canAccessReview: false,
      };

    case 'review':
      return {
        allowedFields: ['id', 'title', 'description', 'status', 'priority', 'metadata'],
        canAccessPlan: true,
        canAccessCode: true,
        canAccessTests: true,
        canAccessReview: true,
      };
  }
}

/**
 * Filter task data based on phase access rules
 *
 * @param task - The task to filter
 * @param phase - The current SDLC phase
 * @returns Filtered task with only allowed fields
 */
export function filterTaskByPhase(task: Task, phase: SDLCPhase): Partial<Task> {
  const rules = getPhaseAccessRules(phase);
  const filtered: Partial<Task> = {};

  for (const field of rules.allowedFields) {
    const key = field as keyof Task;
    if (key in task) {
      filtered[key] = task[key] as never;
    }
  }

  return filtered;
}

/**
 * Check if a phase transition is valid
 *
 * @param fromPhase - The current phase
 * @param toPhase - The target phase
 * @returns True if the transition is valid
 */
export function canTransitionPhase(fromPhase: SDLCPhase, toPhase: SDLCPhase): boolean {
  const allowedTransitions = PHASE_TRANSITION_GRAPH[fromPhase];
  return allowedTransitions.includes(toPhase);
}
