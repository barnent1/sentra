import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ContextClient } from '../utils/contextClient';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const testTaskSchema = Joi.object({
  type: Joi.string().valid(
    'code_analysis',
    'code_generation',
    'code_review',
    'documentation_generation',
    'refactoring',
    'testing',
    'file_operations',
    'git_operations'
  ).required(),
  data: Joi.object().required(),
  timeout: Joi.number().positive().max(300000).optional(),
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

// Test endpoint for direct task execution (development only)
router.post('/test', validateRequest(testTaskSchema), asyncHandler(async (req: Request, res: Response) => {
  logger.info('Test task execution requested', { taskData: req.body });

  // This is for testing purposes only
  // In production, tasks come through the message queue
  
  res.json({
    success: true,
    message: 'Test task endpoint - tasks are normally executed via message queue',
    data: {
      type: req.body.type,
      received: true,
    },
    timestamp: new Date().toISOString(),
  });
}));

// Get current context information
router.get('/context', asyncHandler(async (req: Request, res: Response) => {
  const contextId = ContextClient.getCurrentContextId();
  
  if (!contextId) {
    res.json({
      success: true,
      data: {
        hasContext: false,
        message: 'No active context',
      },
    });
    return;
  }

  try {
    const context = await ContextClient.getContext(contextId);
    
    res.json({
      success: true,
      data: {
        hasContext: true,
        contextId,
        context: context ? {
          id: context.id,
          type: context.type,
          name: context.name,
          createdAt: context.createdAt,
          updatedAt: context.updatedAt,
          tags: context.tags,
        } : null,
      },
    });
  } catch (error) {
    logger.error('Failed to get context:', error);
    throw createError('Failed to retrieve context information', 500);
  }
}));

// Search contexts
router.get('/context/search', asyncHandler(async (req: Request, res: Response) => {
  const { q: query } = req.query;

  if (!query || typeof query !== 'string') {
    throw createError('Query parameter is required', 400, 'MISSING_QUERY');
  }

  try {
    const contexts = await ContextClient.searchContexts(query);
    
    res.json({
      success: true,
      data: {
        query,
        results: contexts.map(context => ({
          id: context.id,
          type: context.type,
          name: context.name,
          createdAt: context.createdAt,
          updatedAt: context.updatedAt,
          tags: context.tags,
        })),
        count: contexts.length,
      },
    });
  } catch (error) {
    logger.error('Context search failed:', { query, error });
    throw createError('Context search failed', 500);
  }
}));

// Get context history
router.get('/context/:contextId/history', asyncHandler(async (req: Request, res: Response) => {
  const { contextId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!contextId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contextId)) {
    throw createError('Invalid context ID format', 400, 'INVALID_CONTEXT_ID');
  }

  try {
    const history = await ContextClient.getContextHistory(contextId, limit);
    
    res.json({
      success: true,
      data: {
        contextId,
        history,
        count: history.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get context history:', { contextId, error });
    throw createError('Failed to retrieve context history', 500);
  }
}));

// Create manual context snapshot
router.post('/context/:contextId/snapshot', asyncHandler(async (req: Request, res: Response) => {
  const { contextId } = req.params;

  if (!contextId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contextId)) {
    throw createError('Invalid context ID format', 400, 'INVALID_CONTEXT_ID');
  }

  try {
    const snapshotId = await ContextClient.createSnapshot(contextId);
    
    res.status(201).json({
      success: true,
      data: { snapshotId },
      message: 'Context snapshot created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to create context snapshot:', { contextId, error });
    throw createError('Failed to create context snapshot', 500);
  }
}));

// Get agent workspace information
router.get('/workspace', asyncHandler(async (req: Request, res: Response) => {
  const fs = await import('fs-extra');
  const path = await import('path');
  const { config } = await import('../utils/config');

  try {
    const workspaceExists = await fs.pathExists(config.development.workspaceRoot);
    let files: string[] = [];
    let gitStatus: any = null;

    if (workspaceExists) {
      // Get workspace files (limited for performance)
      const { glob } = await import('glob');
      files = await glob('**/*', {
        cwd: config.development.workspaceRoot,
        nodir: true,
        ignore: config.development.ignoredPatterns,
      });
      files = files.slice(0, 100); // Limit for performance

      // Get git status if available
      try {
        const simpleGit = await import('simple-git');
        const git = simpleGit.simpleGit(config.development.workspaceRoot);
        const isRepo = await git.checkIsRepo();
        
        if (isRepo) {
          const status = await git.status();
          gitStatus = {
            branch: status.current,
            ahead: status.ahead,
            behind: status.behind,
            modified: status.modified,
            created: status.created,
            deleted: status.deleted,
          };
        }
      } catch (error) {
        logger.debug('Git status not available:', error);
      }
    }

    res.json({
      success: true,
      data: {
        rootPath: config.development.workspaceRoot,
        exists: workspaceExists,
        fileCount: files.length,
        files: files,
        git: gitStatus,
      },
    });
  } catch (error) {
    logger.error('Failed to get workspace info:', error);
    throw createError('Failed to retrieve workspace information', 500);
  }
}));

// Development endpoint to trigger manual heartbeat
router.post('/heartbeat', asyncHandler(async (req: Request, res: Response) => {
  const { MessageQueue } = await import('../utils/messageQueue');
  
  try {
    await MessageQueue.sendHeartbeat();
    
    res.json({
      success: true,
      message: 'Heartbeat sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to send heartbeat:', error);
    throw createError('Failed to send heartbeat', 500);
  }
}));

export { router as taskRoutes };