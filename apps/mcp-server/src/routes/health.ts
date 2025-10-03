/**
 * Health Check Routes
 *
 * Provides endpoints for liveness and readiness probes.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import type { HealthCheckResponse, ReadinessCheckResponse } from '../types/mcp.js';
import { logger } from '../middleware/logger.js';

export const healthRouter = Router();

/**
 * Ping endpoint
 * Simple endpoint to check if server is responding
 */
healthRouter.get('/ping', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'pong' });
});

/**
 * Liveness probe
 * Indicates whether the server is running
 */
healthRouter.get('/health', (_req: Request, res: Response) => {
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  res.status(200).json(response);
});

/**
 * Readiness probe
 * Indicates whether the server is ready to accept requests
 * Includes database connectivity check
 */
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  let dbConnected = false;
  let dbLatency: number | undefined;

  try {
    // Simple database ping query
    await db.execute(sql`SELECT 1`);
    dbConnected = true;
    dbLatency = Date.now() - startTime;
  } catch (error) {
    logger.error({ error }, 'Database health check failed');
    dbConnected = false;
  }

  const response: ReadinessCheckResponse = {
    status: dbConnected ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: dbConnected,
      latency: dbLatency,
    },
  };

  const statusCode = dbConnected ? 200 : 503;
  res.status(statusCode).json(response);
});
