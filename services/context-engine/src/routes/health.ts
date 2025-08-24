import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../utils/database';
import { RedisManager } from '../utils/redis';
import { MessageQueue } from '../utils/messageQueue';
import { MetricsCollector } from '../utils/metrics';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const health = {
    service: 'context-engine',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: false,
      redis: false,
      messageQueue: false,
    },
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };

  try {
    // Check database
    health.checks.database = await DatabaseManager.isHealthy();

    // Check Redis
    health.checks.redis = await RedisManager.isHealthy();

    // Check message queue
    health.checks.messageQueue = await MessageQueue.isHealthy();

    // Overall health status
    const allHealthy = Object.values(health.checks).every(check => check === true);
    health.status = allHealthy ? 'healthy' : 'degraded';

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    health.status = 'unhealthy';
    res.status(503).json(health);
  }
}));

router.get('/health/ready', asyncHandler(async (req: Request, res: Response) => {
  const ready = {
    service: 'context-engine',
    ready: false,
    timestamp: new Date().toISOString(),
  };

  try {
    const [dbHealthy, redisHealthy, mqHealthy] = await Promise.all([
      DatabaseManager.isHealthy(),
      RedisManager.isHealthy(),
      MessageQueue.isHealthy(),
    ]);

    ready.ready = dbHealthy && redisHealthy && mqHealthy;

    const statusCode = ready.ready ? 200 : 503;
    res.status(statusCode).json(ready);

  } catch (error) {
    res.status(503).json(ready);
  }
}));

router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    service: 'context-engine',
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

router.get('/metrics/summary', asyncHandler(async (req: Request, res: Response) => {
  const summary = await MetricsCollector.getMetricsSummary();
  const cacheStats = await RedisManager.getCacheStats();

  res.json({
    success: true,
    data: {
      metrics: summary,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    },
  });
}));

export { router as healthRoutes };