/**
 * MCP Transport Layer
 *
 * Implements the Streamable HTTP transport for the MCP server.
 */

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import { logger } from '../middleware/logger.js';

/**
 * Session storage for MCP connections
 *
 * Maps session IDs to transport instances for stateful connections.
 */
const sessions = new Map<string, StreamableHTTPServerTransport>();

/**
 * Create a new MCP transport instance
 *
 * @param sessionId - Unique identifier for the session
 * @returns StreamableHTTPServerTransport instance
 */
export function createTransport(sessionId: string): StreamableHTTPServerTransport {
  logger.debug({ sessionId }, 'Creating new MCP transport');

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => sessionId,
    onsessionclosed: async (closedSessionId: string) => {
      logger.debug({ sessionId: closedSessionId }, 'Session closed callback');
      sessions.delete(closedSessionId);
    },
  });

  // Store the transport in the session map
  sessions.set(sessionId, transport);

  // Clean up session when transport closes
  transport.onclose = () => {
    logger.debug({ sessionId }, 'Transport closed, cleaning up session');
    sessions.delete(sessionId);
  };

  return transport;
}

/**
 * Get existing transport for a session
 *
 * @param sessionId - Session identifier
 * @returns Transport instance if exists, undefined otherwise
 */
export function getTransport(sessionId: string): StreamableHTTPServerTransport | undefined {
  return sessions.get(sessionId);
}

/**
 * Handle incoming HTTP request for MCP transport
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param sessionId - Session identifier
 * @returns Transport instance
 */
export async function handleTransportRequest(
  req: Request,
  res: Response,
  sessionId: string
): Promise<StreamableHTTPServerTransport> {
  let transport = getTransport(sessionId);

  if (!transport) {
    transport = createTransport(sessionId);
  }

  // Handle the HTTP request through the transport
  // Use handleRequest which is the unified method for all HTTP methods
  await transport.handleRequest(req, res, req.body);

  return transport;
}

/**
 * Clean up all sessions
 */
export function cleanupAllSessions(): void {
  logger.info({ count: sessions.size }, 'Cleaning up all MCP sessions');

  for (const [sessionId, transport] of sessions.entries()) {
    try {
      transport.close();
      sessions.delete(sessionId);
    } catch (error) {
      logger.error({ sessionId, error }, 'Error closing transport');
    }
  }
}

/**
 * Get count of active sessions
 */
export function getActiveSessionCount(): number {
  return sessions.size;
}
