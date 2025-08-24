import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Request error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.body,
  });

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: error.message,
    },
    timestamp: new Date().toISOString(),
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = (message: string, statusCode: number = 500, code?: string): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
};