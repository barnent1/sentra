/**
 * MCP Tools Registry
 *
 * Defines all tools available to the MCP server.
 * Tools are callable functions that can perform operations.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { taskManagementTools } from './task-management.js';
import { patternLearningTools } from './pattern-learning.js';

/**
 * Registry of all MCP tools
 */
export const tools: Tool[] = [
  ...taskManagementTools,
  ...patternLearningTools,
];

/**
 * Get all registered tools
 */
export function getTools(): Tool[] {
  return tools;
}

/**
 * Execute a tool by name
 */
export async function executeTool(
  toolName: string,
  args: unknown
): Promise<unknown> {
  if (toolName.startsWith('get_task_info') ||
      toolName.startsWith('create_plan') ||
      toolName.startsWith('update_task_phase') ||
      toolName.startsWith('mark_task_complete')) {
    const { executeTaskManagementTool } = await import('./task-management.js');
    return executeTaskManagementTool(toolName, args);
  }

  if (toolName.startsWith('find_similar_implementations') ||
      toolName.startsWith('get_relevant_docs') ||
      toolName.startsWith('search_by_pattern')) {
    const { executePatternLearningTool } = await import('./pattern-learning.js');
    return executePatternLearningTool(toolName, args);
  }

  throw new Error(`Unknown tool: ${toolName}`);
}
