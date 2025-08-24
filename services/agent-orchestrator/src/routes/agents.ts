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
const createAgentSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid(
    'code_analyzer', 'security_scanner', 'performance_optimizer',
    'documentation_generator', 'test_automator', 'deployment_manager',
    'code_reviewer', 'quality_enforcer'
  ).required(),
  version: Joi.string().default('1.0.0'),
  imageName: Joi.string().required(),
  capabilities: Joi.array().items(Joi.string()).default([]),
  resourceRequirements: Joi.object({
    memory: Joi.string().pattern(/^\d+(k|m|g)$/i).default('512m'),
    cpu: Joi.string().pattern(/^\d+(\.\d+)?$/).default('0.5'),
    disk: Joi.string().pattern(/^\d+(k|m|g)$/i).optional(),
  }).required(),
  configuration: Joi.object().default({}),
  healthCheck: Joi.object({
    endpoint: Joi.string().required(),
    interval: Joi.number().positive().default(30),
    timeout: Joi.number().positive().default(10),
    retries: Joi.number().positive().default(3),
  }).optional(),
});

const startAgentSchema = Joi.object({
  agentId: Joi.string().uuid().required(),
});

const stopAgentSchema = Joi.object({
  agentId: Joi.string().uuid().required(),
});

const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: Function) => {
    const { error, value } = schema.validate({ ...req.body, ...req.params, ...req.query });
    if (error) {
      throw createError(`Validation error: ${error.details[0]!.message}`, 400, 'VALIDATION_ERROR');
    }
    req.body = { ...req.body, ...value };
    next();
  };
};

// Routes

// Create agent
router.post('/', validateRequest(createAgentSchema), asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const agentDefinition = {
    id: uuidv4(),
    ...req.body,
  };

  const agentId = await orchestrator.createAgent(agentDefinition);

  res.status(201).json({
    success: true,
    data: { agentId },
    message: 'Agent created successfully',
    timestamp: new Date().toISOString(),
  });
}));

// Get all agents
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const { type, status } = req.query;
  let agents = orchestrator.getAllAgents();

  // Filter by type
  if (type && typeof type === 'string') {
    agents = agents.filter(agent => agent.definition.type === type);
  }

  // Filter by status
  if (status && typeof status === 'string') {
    agents = agents.filter(agent => agent.status === status);
  }

  res.json({
    success: true,
    data: agents,
    count: agents.length,
    timestamp: new Date().toISOString(),
  });
}));

// Get agent by ID
router.get('/:agentId', asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const { agentId } = req.params;

  if (!agentId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId)) {
    throw createError('Invalid agent ID format', 400, 'INVALID_AGENT_ID');
  }

  const agent = orchestrator.getAgent(agentId);
  if (!agent) {
    throw createError('Agent not found', 404, 'AGENT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: agent,
    timestamp: new Date().toISOString(),
  });
}));

// Start agent
router.post('/:agentId/start', validateRequest(startAgentSchema), asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const { agentId } = req.params;

  await orchestrator.startAgent(agentId);

  res.json({
    success: true,
    message: 'Agent start initiated',
    timestamp: new Date().toISOString(),
  });
}));

// Stop agent
router.post('/:agentId/stop', validateRequest(stopAgentSchema), asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const { agentId } = req.params;

  await orchestrator.stopAgent(agentId);

  res.json({
    success: true,
    message: 'Agent stop initiated',
    timestamp: new Date().toISOString(),
  });
}));

// Get agents by type
router.get('/type/:agentType', asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const { agentType } = req.params;

  const validTypes = [
    'code_analyzer', 'security_scanner', 'performance_optimizer',
    'documentation_generator', 'test_automator', 'deployment_manager',
    'code_reviewer', 'quality_enforcer'
  ];

  if (!validTypes.includes(agentType)) {
    throw createError('Invalid agent type', 400, 'INVALID_AGENT_TYPE');
  }

  const agents = orchestrator.getAgentsByType(agentType);

  res.json({
    success: true,
    data: agents,
    count: agents.length,
    timestamp: new Date().toISOString(),
  });
}));

// Get active agents
router.get('/status/active', asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const agents = orchestrator.getActiveAgents();

  res.json({
    success: true,
    data: agents,
    count: agents.length,
    timestamp: new Date().toISOString(),
  });
}));

// Get agent statistics
router.get('/stats/overview', asyncHandler(async (req: Request, res: Response) => {
  if (!orchestrator) {
    throw createError('Orchestrator not initialized', 500, 'SERVICE_UNAVAILABLE');
  }

  const allAgents = orchestrator.getAllAgents();
  
  const stats = {
    total: allAgents.length,
    byStatus: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    active: 0,
    idle: 0,
    busy: 0,
    error: 0,
  };

  for (const agent of allAgents) {
    // Count by status
    stats.byStatus[agent.status] = (stats.byStatus[agent.status] || 0) + 1;
    
    // Count by type
    stats.byType[agent.definition.type] = (stats.byType[agent.definition.type] || 0) + 1;
    
    // Count specific statuses
    if (agent.status === 'idle') stats.idle++;
    if (agent.status === 'busy') stats.busy++;
    if (agent.status === 'error') stats.error++;
    if (agent.status === 'idle' || agent.status === 'busy') stats.active++;
  }

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
}));

export { router as agentRoutes };