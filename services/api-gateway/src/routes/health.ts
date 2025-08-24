import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    services: {
        database: 'healthy' | 'unhealthy';
        redis: 'healthy' | 'unhealthy';
        vault: 'healthy' | 'unhealthy';
        agents: 'healthy' | 'unhealthy';
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    version: string;
}

// Basic health check
router.get('/', (req: Request, res: Response) => {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    const healthStatus: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            database: 'healthy', // TODO: Implement actual health checks
            redis: 'healthy',
            vault: 'healthy',
            agents: 'healthy',
        },
        memory: {
            used: Math.round(usedMemory / 1024 / 1024), // MB
            total: Math.round(totalMemory / 1024 / 1024), // MB
            percentage: Math.round(memoryPercentage),
        },
        version: process.env.npm_package_version || '1.0.0',
    };

    res.json(healthStatus);
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
    try {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        const detailedHealth = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            process: {
                pid: process.pid,
                version: process.version,
                platform: process.platform,
                arch: process.arch,
            },
            memory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                external: Math.round(memoryUsage.external / 1024 / 1024), // MB
                arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024), // MB
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system,
            },
            services: {
                database: await checkDatabaseHealth(),
                redis: await checkRedisHealth(),
                vault: await checkVaultHealth(),
                agentOrchestrator: await checkServiceHealth('agent-orchestrator', 3001),
                contextEngine: await checkServiceHealth('context-engine', 3002),
                qualityGuardian: await checkServiceHealth('quality-guardian', 3003),
                timelineIntelligence: await checkServiceHealth('timeline-intelligence', 3004),
            },
        };

        // Determine overall status
        const serviceStatuses = Object.values(detailedHealth.services);
        const hasUnhealthyService = serviceStatuses.some(status => status === 'unhealthy');
        const hasDegradedService = serviceStatuses.some(status => status === 'degraded');

        if (hasUnhealthyService) {
            detailedHealth.status = 'unhealthy';
        } else if (hasDegradedService) {
            detailedHealth.status = 'degraded';
        }

        const statusCode = detailedHealth.status === 'healthy' ? 200 : 
                          detailedHealth.status === 'degraded' ? 200 : 503;

        res.status(statusCode).json(detailedHealth);
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
        });
    }
});

// Readiness check
router.get('/ready', async (req: Request, res: Response) => {
    try {
        // Check if all critical services are ready
        const databaseReady = await checkDatabaseHealth();
        const redisReady = await checkRedisHealth();
        
        const isReady = databaseReady === 'healthy' && redisReady === 'healthy';
        
        res.status(isReady ? 200 : 503).json({
            ready: isReady,
            timestamp: new Date().toISOString(),
            services: {
                database: databaseReady,
                redis: redisReady,
            },
        });
    } catch (error) {
        logger.error('Readiness check failed:', error);
        res.status(503).json({
            ready: false,
            timestamp: new Date().toISOString(),
            error: 'Readiness check failed',
        });
    }
});

// Liveness check
router.get('/live', (req: Request, res: Response) => {
    res.json({
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Helper functions for service health checks
async function checkDatabaseHealth(): Promise<'healthy' | 'unhealthy' | 'degraded'> {
    try {
        // TODO: Implement actual database health check
        // const result = await db.query('SELECT 1');
        return 'healthy';
    } catch (error) {
        logger.error('Database health check failed:', error);
        return 'unhealthy';
    }
}

async function checkRedisHealth(): Promise<'healthy' | 'unhealthy' | 'degraded'> {
    try {
        // TODO: Implement actual Redis health check
        // const result = await redis.ping();
        return 'healthy';
    } catch (error) {
        logger.error('Redis health check failed:', error);
        return 'unhealthy';
    }
}

async function checkVaultHealth(): Promise<'healthy' | 'unhealthy' | 'degraded'> {
    try {
        // TODO: Implement actual Vault health check
        return 'healthy';
    } catch (error) {
        logger.error('Vault health check failed:', error);
        return 'unhealthy';
    }
}

async function checkServiceHealth(serviceName: string, port: number): Promise<'healthy' | 'unhealthy' | 'degraded'> {
    try {
        // TODO: Implement actual service health check
        // const response = await fetch(`http://${serviceName}:${port}/health`);
        // return response.ok ? 'healthy' : 'unhealthy';
        return 'healthy';
    } catch (error) {
        logger.error(`${serviceName} health check failed:`, error);
        return 'unhealthy';
    }
}

export default router;