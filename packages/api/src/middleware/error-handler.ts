/**
 * Comprehensive error handling middleware for Evolution API
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthError } from './auth';

/**
 * Custom error types for the Evolution API
 */
export class ValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly statusCode = 400;
  public readonly details: z.ZodIssue[];

  constructor(message: string, details: z.ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class NotFoundError extends Error {
  public readonly code = 'NOT_FOUND';
  public readonly statusCode = 404;

  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  public readonly code = 'CONFLICT';
  public readonly statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  public readonly code = 'RATE_LIMIT_EXCEEDED';
  public readonly statusCode = 429;
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number = 60) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class DatabaseError extends Error {
  public readonly code = 'DATABASE_ERROR';
  public readonly statusCode = 500;
  public readonly operation?: string;

  constructor(message: string, operation?: string) {
    super(message);
    this.name = 'DatabaseError';
    if (operation !== undefined) {
      this.operation = operation;
    }
  }
}

export class ExternalServiceError extends Error {
  public readonly code = 'EXTERNAL_SERVICE_ERROR';
  public readonly statusCode = 502;
  public readonly service: string;

  constructor(service: string, message: string) {
    super(`${service}: ${message}`);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

export class BusinessLogicError extends Error {
  public readonly code = 'BUSINESS_LOGIC_ERROR';
  public readonly statusCode = 422;

  constructor(message: string) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

/**
 * Union type of all custom errors
 */
export type ApiError = 
  | ValidationError
  | NotFoundError
  | ConflictError
  | RateLimitError
  | DatabaseError
  | ExternalServiceError
  | BusinessLogicError
  | AuthError;

/**
 * Error response interface matching ApiResponse type from @sentra/types
 */
interface ErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly timestamp: Date;
}

/**
 * Helper to determine if error is operational (expected) vs programming error
 */
const isOperationalError = (error: Error): error is ApiError => {
  return (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ConflictError ||
    error instanceof RateLimitError ||
    error instanceof DatabaseError ||
    error instanceof ExternalServiceError ||
    error instanceof BusinessLogicError ||
    error instanceof AuthError
  );
};

/**
 * Helper to extract error details based on error type
 */
const getErrorDetails = (error: ApiError): unknown => {
  if (error instanceof ValidationError) {
    return {
      validationErrors: error.details.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    };
  }

  if (error instanceof DatabaseError && error.operation) {
    return {
      operation: error.operation,
    };
  }

  if (error instanceof ExternalServiceError) {
    return {
      service: error.service,
    };
  }

  if (error instanceof RateLimitError) {
    return {
      retryAfter: error.retryAfter,
    };
  }

  return undefined;
};

/**
 * Logger interface for error handling
 */
export interface ErrorLogger {
  error(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Error handling middleware factory
 */
export const createErrorHandler = (logger?: ErrorLogger) => {
  return (error: Error, req: Request, res: Response, next: NextFunction): void => {
    // Don't handle if response already sent
    if (res.headersSent) {
      return next(error);
    }

    // Check if it's an operational error
    if (isOperationalError(error)) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: getErrorDetails(error),
        },
        timestamp: new Date(),
      };

      // Log based on severity
      const logMeta = {
        code: error.code,
        statusCode: error.statusCode,
        path: req.path,
        method: req.method,
        userId: (req as any).user?.userId,
      };

      if (error.statusCode >= 500) {
        logger?.error(error.message, { ...logMeta, stack: error.stack });
      } else if (error.statusCode >= 400) {
        logger?.warn(error.message, logMeta);
      }

      // Set rate limit header for rate limit errors
      if (error instanceof RateLimitError) {
        res.setHeader('Retry-After', error.retryAfter.toString());
      }

      res.status(error.statusCode).json(errorResponse);
      return;
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        'Request validation failed',
        error.issues
      );

      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: validationError.code,
          message: validationError.message,
          details: getErrorDetails(validationError),
        },
        timestamp: new Date(),
      };

      logger?.warn('Validation error', {
        path: req.path,
        method: req.method,
        issues: error.issues,
      });

      res.status(validationError.statusCode).json(errorResponse);
      return;
    }

    // Handle programming errors (unexpected)
    logger?.error('Unhandled error', {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.userId,
    });

    // Don't expose internal error details in production
    const isProduction = process.env['NODE_ENV'] === 'production';
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: isProduction 
          ? 'Internal server error' 
          : error.message,
        details: isProduction ? undefined : { stack: error.stack },
      },
      timestamp: new Date(),
    };

    res.status(500).json(errorResponse);
    return;
  };
};

/**
 * Async error wrapper utility
 * Wraps async route handlers to automatically catch and forward errors
 */
export const asyncHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) => {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Async handler specifically for authenticated requests
 */
export const asyncAuthHandler = (
  fn: (req: any, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: any, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found middleware for unmatched routes
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError('Route', req.path));
};

/**
 * Validation middleware factory
 * Creates middleware to validate request parts against Zod schemas
 */
export const validateRequest = <
  TBody = any,
  TQuery = any,
  TParams = any
>(schemas: {
  body?: z.ZodType<TBody>;
  query?: z.ZodType<TQuery>;
  params?: z.ZodType<TParams>;
}) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper functions for throwing specific errors
 */
export const throwNotFound = (resource: string, id?: string): never => {
  throw new NotFoundError(resource, id);
};

export const throwValidation = (message: string, details: z.ZodIssue[]): never => {
  throw new ValidationError(message, details);
};

export const throwConflict = (message: string): never => {
  throw new ConflictError(message);
};

export const throwBusinessLogic = (message: string): never => {
  throw new BusinessLogicError(message);
};

export const throwDatabaseError = (message: string, operation?: string): never => {
  throw new DatabaseError(message, operation);
};

export const throwExternalService = (service: string, message: string): never => {
  throw new ExternalServiceError(service, message);
};