/**
 * MCP Prompts Registry
 *
 * Defines all prompts available to the MCP server.
 * Prompts are reusable templates that can be filled with context.
 */

import type { Prompt } from '@modelcontextprotocol/sdk/types.js';

/**
 * Registry of all MCP prompts
 *
 * Initially empty - prompts will be added in future tasks.
 */
export const prompts: Prompt[] = [];

/**
 * Get all registered prompts
 */
export function getPrompts(): Prompt[] {
  return prompts;
}
