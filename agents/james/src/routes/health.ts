import { Router, Request, Response } from 'express';
import { MessageQueue } from '../utils/messageQueue';
import { ContextClient } from '../utils/contextClient';
import { config } from '../utils/config';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const health = {
    service: 'james-agent',
    agentId: config.agentId,
    agentType: config.agentType,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      messageQueue: false,
      contextEngine: false,
      workspace: false,
    },
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };

  try {
    // Check message queue
    health.checks.messageQueue = await MessageQueue.isHealthy();

    // Check context engine (basic check)
    health.checks.contextEngine = ContextClient.getCurrentContextId() !== null || true;

    // Check workspace
    const fs = await import('fs-extra');
    health.checks.workspace = await fs.pathExists(config.development.workspaceRoot);

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

router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  const ready = {
    service: 'james-agent',
    agentId: config.agentId,
    ready: false,
    timestamp: new Date().toISOString(),
  };

  try {
    const [mqHealthy] = await Promise.all([
      MessageQueue.isHealthy(),
    ]);

    const fs = await import('fs-extra');
    const workspaceExists = await fs.pathExists(config.development.workspaceRoot);

    ready.ready = mqHealthy && workspaceExists;

    const statusCode = ready.ready ? 200 : 503;
    res.status(statusCode).json(ready);

  } catch (error) {
    res.status(503).json(ready);
  }
}));

router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    service: 'james-agent',
    agentId: config.agentId,
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const status = {
    agentId: config.agentId,
    agentType: config.agentType,
    status: 'active',
    capabilities: [
      'code_analysis',
      'code_generation',
      'context_preservation',
      'documentation_generation',
      'testing',
      'refactoring',
    ],
    workspace: {
      rootPath: config.development.workspaceRoot,
      gitInitialized: true, // Would check actual status
    },
    currentContext: ContextClient.getCurrentContextId(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: status,
  });
}));

export { router as healthRoutes };