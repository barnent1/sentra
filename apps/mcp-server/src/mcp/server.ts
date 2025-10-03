/**
 * MCP Server Core
 *
 * Implements the core MCP server using the official SDK.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../middleware/logger.js';
import { getTools } from './tools/index.js';
import { getResources } from './resources/index.js';
import { getPrompts } from './prompts/index.js';

/**
 * MCP Server instance
 */
let mcpServer: Server | null = null;

/**
 * Server information
 */
const SERVER_INFO = {
  name: 'sentra-mcp-server',
  version: '1.0.0',
};

/**
 * Initialize the MCP server
 *
 * Creates and configures the MCP server with tools, resources, and prompts.
 *
 * @returns Configured Server instance
 */
export function initializeMCPServer(): Server {
  if (mcpServer) {
    logger.debug('MCP server already initialized, returning existing instance');
    return mcpServer;
  }

  logger.info('Initializing MCP server');

  // Create new server instance
  mcpServer = new Server(
    SERVER_INFO,
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // Register tools list handler
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Handling tools/list request');
    return {
      tools: getTools(),
    };
  });

  // Register tool call handler
  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    logger.debug({ tool: request.params.name }, 'Handling tools/call request');

    // Tool execution will be implemented in future tasks
    throw new Error(`Tool not implemented: ${request.params.name}`);
  });

  // Register resources list handler
  mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
    logger.debug('Handling resources/list request');
    return {
      resources: getResources(),
    };
  });

  // Register resource read handler
  mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    logger.debug({ uri: request.params.uri }, 'Handling resources/read request');

    // Resource reading will be implemented in future tasks
    throw new Error(`Resource not implemented: ${request.params.uri}`);
  });

  // Register prompts list handler
  mcpServer.setRequestHandler(ListPromptsRequestSchema, async () => {
    logger.debug('Handling prompts/list request');
    return {
      prompts: getPrompts(),
    };
  });

  // Register prompt get handler
  mcpServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
    logger.debug({ name: request.params.name }, 'Handling prompts/get request');

    // Prompt retrieval will be implemented in future tasks
    throw new Error(`Prompt not implemented: ${request.params.name}`);
  });

  logger.info('MCP server initialized successfully');

  return mcpServer;
}

/**
 * Get the MCP server instance
 *
 * @returns Server instance or null if not initialized
 */
export function getMCPServer(): Server | null {
  return mcpServer;
}

/**
 * Close the MCP server
 */
export async function closeMCPServer(): Promise<void> {
  if (mcpServer) {
    logger.info('Closing MCP server');
    await mcpServer.close();
    mcpServer = null;
  }
}
