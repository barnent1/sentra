import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { AgentOrchestrator } from '../services/agentOrchestrator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// This will be injected by the main application
let orchestrator: AgentOrchestrator;

export const setOrchestrator = (orch: AgentOrchestrator) => {
  orchestrator = orch;
};

// Validation schemas
const createTaskSchema = Joi.object({
  type: Joi.string().min(1).max(100).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  agentType: Joi.string().valid(
    'code_analyzer', 'security_scanner', 'performance_optimizer',
    'documentation_generator', 'test_automator', 'deployment_manager',
    'code_reviewer', 'quality_enforcer'
  ).optional(),
  data: Joi.object().required(),
  timeout: Joi.number().positive().max(3600000).optional(), // Max 1 hour
  retries: Joi.number().integer().min(0).max(5).default(3),
  requiresContext: Joi.array().items(Joi.string().uuid()).optional(),
  callbacks: Joi.object({
    onProgress: Joi.string().uri().optional(),
    onComplete: Joi.string().uri().optional(),
    onError: Joi.string().uri().optional(),
  }).optional(),
});

const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: Function) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      throw createError(`Validation error: ${error.details[0]!.message}`, 400, 'VALIDATION_ERROR');
    }
    req.body = value;
    next();
  };
};

// Routes

// Create and queue task
router.post('/', validateRequest(createTaskSchema), asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const taskRequest = {
    id: uuidv4(),
    ...req.body,
  };

  await orchestrator.assignTask(taskRequest);

  res.status(201).json({
    success: true,
    data: { taskId: taskRequest.id },
    message: 'Task queued successfully',
    timestamp: new Date().toISOString(),
  });
}));

// Get queue status
router.get('/queue/status', asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const queueStatus = await orchestrator.getQueueStatus();

  const totalTasks = Object.values(queueStatus).reduce((sum, count) => sum + count, 0);

  res.json({
    success: true,
    data: {
      queues: queueStatus,
      totalTasks,
    },
    timestamp: new Date().toISOString(),
  });
}));

// Get queue details by priority
router.get('/queue/:priority', asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const { priority } = req.params;

  if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
    throw createError('Invalid priority level', 400, 'INVALID_PRIORITY');
  }

  const queueStatus = await orchestrator.getQueueStatus();
  const queueLength = queueStatus[priority] || 0;

  res.json({
    success: true,
    data: {
      priority,
      queueLength,
    },
    timestamp: new Date().toISOString(),
  });
}));

// Get task processing statistics
router.get('/stats/processing', asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const agents = orchestrator.getAllAgents();
  const activeAgents = orchestrator.getActiveAgents();
  const queueStatus = await orchestrator.getQueueStatus();

  const stats = {
    agents: {
      total: agents.length,
      active: activeAgents.length,
      idle: activeAgents.filter(a => a.status === 'idle').length,
      busy: activeAgents.filter(a => a.status === 'busy').length,
    },
    queues: queueStatus,
    processing: {
      totalQueued: Object.values(queueStatus).reduce((sum, count) => sum + count, 0),
      currentlyProcessing: activeAgents.filter(a => a.status === 'busy').length,
      availableCapacity: activeAgents.filter(a => a.status === 'idle').length,
    },
  };

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
}));

// Bulk task creation
router.post('/bulk', asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const { tasks } = req.body;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw createError('Tasks array is required and must not be empty', 400, 'INVALID_TASKS');
  }

  if (tasks.length > 100) {
    throw createError('Maximum 100 tasks allowed per bulk request', 400, 'TOO_MANY_TASKS');
  }

  const results = [];
  const errors = [];

  for (let i = 0; i < tasks.length; i++) {
    try {
      const { error, value } = createTaskSchema.validate(tasks[i]);
      if (error) {
        errors.push({
          index: i,
          task: tasks[i],
          error: `Validation error: ${error.details[0]!.message}`,
        });
        continue;
      }

      const taskRequest = {
        id: uuidv4(),
        ...value,
      };

      await orchestrator.assignTask(taskRequest);
      results.push({
        index: i,
        taskId: taskRequest.id,
        status: 'queued',
      });

    } catch (error: any) {
      errors.push({
        index: i,
        task: tasks[i],
        error: error.message,
      });
    }
  }

  const response = {
    success: errors.length === 0,
    data: {
      successful: results.length,
      failed: errors.length,
      results,
    },
    timestamp: new Date().toISOString(),
  };

  if (errors.length > 0) {
    (response as any).errors = errors;
  }

  const statusCode = errors.length === 0 ? 201 : (results.length > 0 ? 207 : 400);
  res.status(statusCode).json(response);
}));

// Task type statistics
router.get('/stats/types', asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  // This would require tracking task types in the orchestrator
  // For now, return agent type distribution as a proxy
  const agents = orchestrator.getAllAgents();
  const typeStats: Record<string, { available: number; busy: number; total: number }> = {};

  for (const agent of agents) {
    const type = agent.definition.type;
    if (!typeStats[type]) {
      typeStats[type] = { available: 0, busy: 0, total: 0 };
    }

    typeStats[type].total++;
    if (agent.status === 'idle') {
      typeStats[type].available++;
    } else if (agent.status === 'busy') {
      typeStats[type].busy++;
    }
  }

  res.json({
    success: true,
    data: typeStats,
    timestamp: new Date().toISOString(),
  });
}));

// Health check for task processing
router.get('/health/processing', asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const activeAgents = orchestrator.getActiveAgents();
  const queueStatus = await orchestrator.getQueueStatus();
  const totalQueued = Object.values(queueStatus).reduce((sum, count) => sum + count, 0);
  const availableCapacity = activeAgents.filter(a => a.status === 'idle').length;

  const health = {
    healthy: true,
    issues: [] as string[],
    stats: {
      activeAgents: activeAgents.length,
      availableCapacity,
      totalQueued,
      processing: activeAgents.filter(a => a.status === 'busy').length,
    },
  };

  // Check for potential issues
  if (activeAgents.length === 0) {
    health.healthy = false;
    health.issues.push('No active agents available');
  }

  if (totalQueued > 100) {
    health.healthy = false;
    health.issues.push('High queue backlog detected');
  }

  if (availableCapacity === 0 && totalQueued > 0) {
    health.healthy = false;
    health.issues.push('No available capacity for queued tasks');
  }

  const statusCode = health.healthy ? 200 : 503;
  res.status(statusCode).json({
    success: true,
    data: health,
    timestamp: new Date().toISOString(),
  });
}));

export { router as taskRoutes };