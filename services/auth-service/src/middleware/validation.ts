import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

export const validationHandler = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : error.type,
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: errorDetails,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(400).json({
      error: 'Validation Error',
      message: 'Request validation failed',
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
};