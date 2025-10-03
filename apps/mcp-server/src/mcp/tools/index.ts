/**
 * MCP Tools Registry
 *
 * Defines all tools available to the MCP server.
 * Tools are callable functions that can perform operations.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Registry of all MCP tools
 *
 * Initially empty - tools will be added in future tasks.
 */
export const tools: Tool[] = [];

/**
 * Get all registered tools
 */
export function getTools(): Tool[] {
  return tools;
}
