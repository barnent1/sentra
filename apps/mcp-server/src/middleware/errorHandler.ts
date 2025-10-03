/**
 * Error Handler Middleware
 *
 * Global error handling middleware for Express server.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ErrorResponse } from '../types/mcp.js';
import { logger } from './logger.js';

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 *
 * Catches all errors thrown in the application and returns structured error responses.
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error(
    {
      err,
      req: {
        method: req.method,
        url: req.url,
        headers: req.headers,
      },
    },
    'Error occurred'
  );

  // Determine status code
  const statusCode =
    err instanceof AppError ? err.statusCode : 500;

  // Build error response
  const errorResponse: ErrorResponse = {
    error: {
      message: err.message || 'Internal Server Error',
      code: err instanceof AppError ? err.code : 'INTERNAL_ERROR',
      details: err instanceof AppError ? err.details : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const errorResponse: ErrorResponse = {
    error: {
      message: `Cannot ${req.method} ${req.url}`,
      code: 'NOT_FOUND',
    },
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(errorResponse);
}
