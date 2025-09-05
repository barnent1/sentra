/**
 * Type compatibility fixes for branded types
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import type {
  EvolutionDnaId,
  AgentInstanceId,
  TaskId,
  UserId,
} from '@sentra/types';

/**
 * Helper functions to create branded IDs with proper type compatibility
 */
export const createEvolutionDnaId = (value: string): EvolutionDnaId => {
  return value as EvolutionDnaId;
};

export const createAgentInstanceId = (value: string): AgentInstanceId => {
  return value as AgentInstanceId;
};

export const createTaskId = (value: string): TaskId => {
  return value as TaskId;
};

export const createUserId = (value: string): UserId => {
  return value as UserId;
};

/**
 * Type guards for branded types
 */
export const isEvolutionDnaId = (value: unknown): value is EvolutionDnaId => {
  return typeof value === 'string' && value.length > 0;
};

export const isAgentInstanceId = (value: unknown): value is AgentInstanceId => {
  return typeof value === 'string' && value.length > 0;
};

export const isTaskId = (value: unknown): value is TaskId => {
  return typeof value === 'string' && value.length > 0;
};

export const isUserId = (value: unknown): value is UserId => {
  return typeof value === 'string' && value.length > 0;
};