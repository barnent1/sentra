import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { ContextEngine } from '../services/contextEngine';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const contextEngine = new ContextEngine();

// Validation schemas
const createContextSchema = Joi.object({
  type: Joi.string().valid('conversation', 'project', 'file', 'function', 'class', 'module').required(),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  parentId: Joi.string().uuid().optional(),
  projectId: Joi.string().uuid().optional(),
  userId: Joi.string().uuid().required(),
  data: Joi.object().default({}),
  metadata: Joi.object().default({}),
  tags: Joi.array().items(Joi.string()).default([]),
  expiresAt: Joi.date().iso().optional(),
});

const updateContextSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional(),
  data: Joi.object().optional(),
  metadata: Joi.object().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  expiresAt: Joi.date().iso().optional(),
});

const contextInjectionSchema = Joi.object({
  agentId: Joi.string().uuid().required(),
  contextIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  maxSizeMB: Joi.number().positive().max(100).optional(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  includeHistory: Joi.boolean().default(false),
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

// Create context
router.post('/', validateRequest(createContextSchema), asyncHandler(async (req: Request, res: Response) => {
  const contextId = await contextEngine.createContext(req.body);

  res.status(201).json({
    success: true,
    data: { contextId },
    message: 'Context created successfully',
    timestamp: new Date().toISOString(),
  });
}));

// Get context
router.get('/:contextId', asyncHandler(async (req: Request, res: Response) => {
  const { contextId } = req.params;
  const includeHistory = req.query.includeHistory === 'true';

  if (!contextId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contextId)) {
    throw createError('Invalid context ID format', 400, 'INVALID_CONTEXT_ID');
  }

  const context = await contextEngine.getContext(contextId, includeHistory);

  if (!context) {
    throw createError('Context not found', 404, 'CONTEXT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: context,
    timestamp: new Date().toISOString(),
  });
}));

// Update context
router.put('/:contextId', validateRequest(updateContextSchema), asyncHandler(async (req: Request, res: Response) => {
  const { contextId } = req.params;

  if (!contextId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contextId)) {
    throw createError('Invalid context ID format', 400, 'INVALID_CONTEXT_ID');
  }

  await contextEngine.updateContext(contextId, req.body);

  res.json({
    success: true,
    message: 'Context updated successfully',
    timestamp: new Date().toISOString(),
  });
}));

// Delete context
router.delete('/:contextId', asyncHandler(async (req: Request, res: Response) => {
  const { contextId } = req.params;

  if (!contextId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contextId)) {
    throw createError('Invalid context ID format', 400, 'INVALID_CONTEXT_ID');
  }

  await contextEngine.deleteContext(contextId);

  res.json({
    success: true,
    message: 'Context deleted successfully',
    timestamp: new Date().toISOString(),
  });
}));

// Context injection for agents
router.post('/inject', validateRequest(contextInjectionSchema), asyncHandler(async (req: Request, res: Response) => {
  const response = await contextEngine.injectContext(req.body);

  res.json({
    success: true,
    data: response,
    timestamp: new Date().toISOString(),
  });
}));

// Create context snapshot
router.post('/:contextId/snapshot', asyncHandler(async (req: Request, res: Response) => {
  const { contextId } = req.params;

  if (!contextId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contextId)) {
    throw createError('Invalid context ID format', 400, 'INVALID_CONTEXT_ID');
  }

  const snapshotId = await contextEngine.createSnapshot(contextId);

  res.status(201).json({
    success: true,
    data: { snapshotId },
    message: 'Context snapshot created successfully',
    timestamp: new Date().toISOString(),
  });
}));

// Get context history/snapshots
router.get('/:contextId/history', asyncHandler(async (req: Request, res: Response) => {
  const { contextId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!contextId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contextId)) {
    throw createError('Invalid context ID format', 400, 'INVALID_CONTEXT_ID');
  }

  if (limit > 50) {
    throw createError('Limit cannot exceed 50', 400, 'INVALID_LIMIT');
  }

  const history = await contextEngine.getContextHistory(contextId, limit);

  res.json({
    success: true,
    data: history,
    timestamp: new Date().toISOString(),
  });
}));

// Search contexts
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { q: query, userId, projectId } = req.query as {
    q?: string;
    userId?: string;
    projectId?: string;
  };

  if (!query) {
    throw createError('Search query is required', 400, 'MISSING_QUERY');
  }

  if (!userId) {
    throw createError('User ID is required', 400, 'MISSING_USER_ID');
  }

  const contexts = await contextEngine.searchContexts(query, userId, projectId);

  res.json({
    success: true,
    data: contexts,
    count: contexts.length,
    timestamp: new Date().toISOString(),
  });
}));

export { router as contextRoutes };