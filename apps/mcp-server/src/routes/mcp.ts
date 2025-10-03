/**
 * MCP Routes
 *
 * Handles MCP protocol requests via Streamable HTTP transport.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { handleTransportRequest } from '../mcp/transport.js';
import { initializeMCPServer } from '../mcp/server.js';
import { logger } from '../middleware/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { authenticatedRateLimiter } from '../middleware/rateLimiter.js';
import { serverConfig } from '../config/server.js';

export const mcpRouter = Router();

/**
 * Extract or generate session ID from request
 */
function getSessionId(req: Request): string {
  // Check for session ID in header
  const headerSessionId = req.headers['x-session-id'];
  if (headerSessionId && typeof headerSessionId === 'string') {
    return headerSessionId;
  }

  // Check for session ID in query
  const querySessionId = req.query.sessionId;
  if (querySessionId && typeof querySessionId === 'string') {
    return querySessionId;
  }

  // Generate new session ID
  return randomUUID();
}

/**
 * Apply authentication middleware if enabled
 */
if (serverConfig.authEnabled) {
  mcpRouter.use(authenticate);
  mcpRouter.use(authenticatedRateLimiter);
}

/**
 * Initialize MCP server middleware
 * Ensures the MCP server is initialized before handling requests
 */
mcpRouter.use((_req: Request, _res: Response, next: NextFunction) => {
  try {
    initializeMCPServer();
    next();
  } catch (error) {
    logger.error({ error }, 'Failed to initialize MCP server');
    next(new AppError('Failed to initialize MCP server', 500, 'MCP_INIT_ERROR'));
  }
});

/**
 * POST /mcp
 * Handle MCP JSON-RPC 2.0 messages
 */
mcpRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req);

    logger.debug({ sessionId, method: 'POST' }, 'Handling MCP POST request');

    // Get the MCP server instance
    const mcpServer = initializeMCPServer();

    // Handle the request through the transport
    const transport = await handleTransportRequest(req, res, sessionId);

    // Connect the transport to the server
    await mcpServer.connect(transport);
  } catch (error) {
    logger.error({ error }, 'Error handling MCP POST request');
    next(error);
  }
});

/**
 * GET /mcp
 * Handle MCP Streamable HTTP transport GET endpoint
 */
mcpRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req);

    logger.debug({ sessionId, method: 'GET' }, 'Handling MCP GET request');

    // Get the MCP server instance
    const mcpServer = initializeMCPServer();

    // Handle the request through the transport
    const transport = await handleTransportRequest(req, res, sessionId);

    // Connect the transport to the server
    await mcpServer.connect(transport);
  } catch (error) {
    logger.error({ error }, 'Error handling MCP GET request');
    next(error);
  }
});
