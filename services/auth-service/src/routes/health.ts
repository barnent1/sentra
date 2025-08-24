import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../utils/database';
import { checkRedisHealth } from '../utils/redis';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

const router = Router();

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
    };
    redis: {
      status: 'up' | 'down';
      responseTime?: number;
    };
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

// Basic health check
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();
    
    // Check database health
    const dbStartTime = Date.now();
    const databaseHealthy = await checkDatabaseHealth();
    const dbResponseTime = Date.now() - dbStartTime;

    // Check Redis health
    const redisStartTime = Date.now();
    const redisHealthy = await checkRedisHealth();
    const redisResponseTime = Date.now() - redisStartTime;

    // Get system metrics
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const healthCheck: HealthCheck = {
      status: (databaseHealthy && redisHealthy) ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.environment,
      uptime: Math.floor(process.uptime()),
      services: {
        database: {
          status: databaseHealthy ? 'up' : 'down',
          responseTime: dbResponseTime
        },
        redis: {
          status: redisHealthy ? 'up' : 'down',
          responseTime: redisResponseTime
        }
      },
      system: {
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        },
        cpu: {
          usage: Math.round((cpuUsage.user + cpuUsage.system) / 1000) // Convert to milliseconds
        }
      }
    };

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(healthCheck);

    // Log health check if unhealthy
    if (healthCheck.status !== 'healthy') {
      logger.warn('Health check failed', {
        services: healthCheck.services,
        duration: Date.now() - startTime
      });
    }

  } catch (error) {
    logger.error('Health check error:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Readiness probe (for Kubernetes)
router.get('/ready', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check critical dependencies
    const databaseReady = await checkDatabaseHealth();
    const redisReady = await checkRedisHealth();

    const isReady = databaseReady && redisReady;

    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        services: {
          database: 'ready',
          redis: 'ready'
        }
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        services: {
          database: databaseReady ? 'ready' : 'not ready',
          redis: redisReady ? 'ready' : 'not ready'
        }
      });
    }
  } catch (error) {
    logger.error('Readiness check error:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Liveness probe (for Kubernetes)
router.get('/live', (req: Request, res: Response): void => {
  // Simple liveness check - if the server is responding, it's alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    pid: process.pid
  });
});

// Detailed health metrics (for monitoring systems)
router.get('/metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Check service response times
    const dbStartTime = Date.now();
    const databaseHealthy = await checkDatabaseHealth();
    const dbResponseTime = Date.now() - dbStartTime;

    const redisStartTime = Date.now();
    const redisHealthy = await checkRedisHealth();
    const redisResponseTime = Date.now() - redisStartTime;

    const metrics = {
      timestamp: new Date().toISOString(),
      service: {
        name: 'sentra-auth-service',
        version: process.env.npm_package_version || '1.0.0',
        environment: config.environment,
        uptime: process.uptime(),
        pid: process.pid
      },
      system: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          rss: memUsage.rss,
          heap_total: memUsage.heapTotal,
          heap_used: memUsage.heapUsed,
          heap_usage_percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
          external: memUsage.external,
          array_buffers: memUsage.arrayBuffers
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          total: cpuUsage.user + cpuUsage.system
        }
      },
      services: {
        database: {
          status: databaseHealthy ? 'up' : 'down',
          response_time_ms: dbResponseTime
        },
        redis: {
          status: redisHealthy ? 'up' : 'down',
          response_time_ms: redisResponseTime
        }
      }
    };

    res.status(200).json(metrics);
  } catch (error) {
    logger.error('Metrics endpoint error:', error);
    res.status(500).json({
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;