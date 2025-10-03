/**
 * MCP Resources Registry
 *
 * Defines all resources available to the MCP server.
 * Resources are readable data sources that can be queried.
 */

import type { Resource } from '@modelcontextprotocol/sdk/types.js';

/**
 * Registry of all MCP resources
 *
 * Initially empty - resources will be added in future tasks.
 */
export const resources: Resource[] = [];

/**
 * Get all registered resources
 */
export function getResources(): Resource[] {
  return resources;
}
