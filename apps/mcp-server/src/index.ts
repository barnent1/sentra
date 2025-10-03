/**
 * Sentra MCP Server Entry Point
 *
 * Main entry point for the Model Context Protocol server.
 * Implements Streamable HTTP transport with Express.js.
 */

import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';
import { serverConfig, isProduction } from './config/server.js';
import { httpLogger, logger } from './middleware/logger.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { mcpRouter } from './routes/mcp.js';
import { cleanupAllSessions, getActiveSessionCount } from './mcp/transport.js';
import { closeMCPServer } from './mcp/server.js';

// Load environment variables
dotenv.config();

/**
 * Create and configure Express application
 */
function createApp(): express.Application {
  const app = express();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: isProduction() ? undefined : false,
    })
  );

  // CORS middleware
  app.use(corsMiddleware);

  // Request logging
  app.use(httpLogger);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: serverConfig.rateLimitWindowMs,
    max: serverConfig.rateLimitMaxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Routes
  app.use('/', healthRouter);
  app.use('/mcp', mcpRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    const app = createApp();

    const server = app.listen(serverConfig.port, serverConfig.host, () => {
      logger.info(
        {
          port: serverConfig.port,
          host: serverConfig.host,
          env: serverConfig.nodeEnv,
        },
        'MCP server started successfully'
      );
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info({ signal }, 'Received shutdown signal');

      server.close(async () => {
        logger.info('HTTP server closed');

        // Cleanup MCP sessions
        cleanupAllSessions();

        // Close MCP server
        await closeMCPServer();

        logger.info('Shutdown complete');
        process.exit(0);
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Log active sessions periodically in development
    if (!isProduction()) {
      setInterval(() => {
        const count = getActiveSessionCount();
        if (count > 0) {
          logger.debug({ activeSessions: count }, 'Active MCP sessions');
        }
      }, 30000);
    }
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

// Export for testing
export { createApp, startServer };
