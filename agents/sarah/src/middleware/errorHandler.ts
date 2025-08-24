import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details
  logger.error('Sarah API error:', {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    code: error.code,
    details: error.details,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Set default status code
  const statusCode = error.statusCode || 500;
  
  // Handle specific error types
  let errorResponse: any = {
    error: true,
    message: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    agent: 'Sarah QA Agent',
  };

  switch (error.code) {
    case 'ANTHROPIC_API_ERROR':
      errorResponse = {
        ...errorResponse,
        message: 'AI service temporarily unavailable',
        code: 'AI_SERVICE_ERROR',
        retryAfter: 30,
      };
      break;

    case 'CONTEXT_ENGINE_ERROR':
      errorResponse = {
        ...errorResponse,
        message: 'Context service unavailable',
        code: 'CONTEXT_SERVICE_ERROR',
        retryAfter: 10,
      };
      break;

    case 'QUALITY_GATE_ERROR':
      errorResponse = {
        ...errorResponse,
        message: 'Quality gate validation failed',
        code: 'QUALITY_VALIDATION_ERROR',
        details: error.details,
      };
      break;

    case 'TASK_TIMEOUT':
      errorResponse = {
        ...errorResponse,
        message: 'Code review task timed out',
        code: 'TASK_TIMEOUT_ERROR',
        timeout: true,
      };
      break;

    case 'INVALID_FILE_PATH':
      errorResponse = {
        ...errorResponse,
        message: 'Invalid or inaccessible file path',
        code: 'FILE_ACCESS_ERROR',
        statusCode: 400,
      };
      break;

    case 'SECURITY_SCAN_FAILED':
      errorResponse = {
        ...errorResponse,
        message: 'Security vulnerability scan failed',
        code: 'SECURITY_SCAN_ERROR',
        details: error.details,
      };
      break;

    default:
      if (statusCode === 400) {
        errorResponse.message = 'Bad Request';
        errorResponse.details = error.message;
      } else if (statusCode === 401) {
        errorResponse.message = 'Unauthorized';
      } else if (statusCode === 403) {
        errorResponse.message = 'Forbidden';
      } else if (statusCode === 404) {
        errorResponse.message = 'Not Found';
      } else if (statusCode === 409) {
        errorResponse.message = 'Conflict';
        errorResponse.details = error.details;
      } else if (statusCode === 422) {
        errorResponse.message = 'Validation Error';
        errorResponse.details = error.details;
      } else if (statusCode === 429) {
        errorResponse.message = 'Too Many Requests';
        errorResponse.retryAfter = 60;
      } else if (statusCode === 503) {
        errorResponse.message = 'Service Unavailable';
        errorResponse.retryAfter = 30;
      } else {
        errorResponse.message = error.message || 'Internal Server Error';
      }
      break;
  }

  // Add request context for debugging
  if (statusCode >= 500) {
    errorResponse.requestId = req.get('X-Request-ID') || 'unknown';
    errorResponse.debug = {
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    };
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error classes
export class QualityGateError extends Error {
  statusCode: number;
  code: string;
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'QualityGateError';
    this.statusCode = 422;
    this.code = 'QUALITY_GATE_ERROR';
    this.details = details;
  }
}

export class TaskTimeoutError extends Error {
  statusCode: number;
  code: string;

  constructor(taskId: string, timeout: number) {
    super(`Task ${taskId} timed out after ${timeout}ms`);
    this.name = 'TaskTimeoutError';
    this.statusCode = 408;
    this.code = 'TASK_TIMEOUT';
  }
}

export class SecurityScanError extends Error {
  statusCode: number;
  code: string;
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'SecurityScanError';
    this.statusCode = 500;
    this.code = 'SECURITY_SCAN_FAILED';
    this.details = details;
  }
}

export class FileAccessError extends Error {
  statusCode: number;
  code: string;

  constructor(filePath: string) {
    super(`Cannot access file: ${filePath}`);
    this.name = 'FileAccessError';
    this.statusCode = 400;
    this.code = 'INVALID_FILE_PATH';
  }
}

export class AnthropicAPIError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string) {
    super(`Anthropic AI API error: ${message}`);
    this.name = 'AnthropicAPIError';
    this.statusCode = 503;
    this.code = 'ANTHROPIC_API_ERROR';
  }
}

export class ContextEngineError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string) {
    super(`Context Engine error: ${message}`);
    this.name = 'ContextEngineError';
    this.statusCode = 503;
    this.code = 'CONTEXT_ENGINE_ERROR';
  }
}