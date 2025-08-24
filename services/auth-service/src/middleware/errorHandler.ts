import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details
  logger.error('Request error occurred', {
    error: {
      name: error.name,
      message: error.message,
      stack: config.environment === 'development' ? error.stack : undefined,
      code: error.code
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: (req as any).user?.id
    },
    details: error.details
  });

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError' || error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Authentication failed';
    code = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Access denied';
    code = 'FORBIDDEN';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
    code = 'NOT_FOUND';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = 'Resource conflict';
    code = 'CONFLICT';
  } else if (error.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Too many requests';
    code = 'RATE_LIMIT_EXCEEDED';
  }

  // Security-sensitive errors should not expose details in production
  const securitySensitiveErrors = [
    'INVALID_CREDENTIALS',
    'USER_NOT_FOUND',
    'INVALID_TOKEN',
    'MFA_VERIFICATION_FAILED'
  ];

  if (config.environment === 'production' && securitySensitiveErrors.includes(code)) {
    message = 'Authentication failed';
  }

  // Error response structure
  const errorResponse: any = {
    error: getErrorTitle(statusCode),
    message,
    code,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId()
  };

  // Include additional details in development
  if (config.environment === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.details = error.details;
  }

  // Include retry information for rate limiting errors
  if (statusCode === 429 && error.details?.retryAfter) {
    errorResponse.retryAfter = error.details.retryAfter;
    res.set('Retry-After', error.details.retryAfter.toString());
  }

  // Security headers for error responses
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });

  res.status(statusCode).json(errorResponse);
};

// Get human-readable error title
function getErrorTitle(statusCode: number): string {
  switch (statusCode) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Unprocessable Entity';
    case 429: return 'Too Many Requests';
    case 500: return 'Internal Server Error';
    case 502: return 'Bad Gateway';
    case 503: return 'Service Unavailable';
    case 504: return 'Gateway Timeout';
    default: return 'Error';
  }
}

// Generate unique request ID for tracking
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create custom error classes
export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';
  
  constructor(message: string = 'Authentication required', public details?: any) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  code = 'FORBIDDEN';
  
  constructor(message: string = 'Access denied', public details?: any) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';
  
  constructor(message: string = 'Resource not found', public details?: any) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';
  
  constructor(message: string = 'Resource conflict', public details?: any) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';
  
  constructor(message: string = 'Rate limit exceeded', public details?: any) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class SecurityError extends Error {
  statusCode = 400;
  
  constructor(public code: string, message: string, public details?: any) {
    super(message);
    this.name = 'SecurityError';
    
    // Set appropriate status codes for different security violations
    switch (code) {
      case 'INVALID_CREDENTIALS':
      case 'INVALID_TOKEN':
      case 'TOKEN_EXPIRED':
      case 'MFA_REQUIRED':
        this.statusCode = 401;
        break;
      case 'ACCOUNT_LOCKED':
      case 'INSUFFICIENT_PERMISSIONS':
        this.statusCode = 403;
        break;
      case 'WEAK_PASSWORD':
      case 'INVALID_MFA_TOKEN':
      case 'XSS_DETECTED':
      case 'SQL_INJECTION_DETECTED':
        this.statusCode = 400;
        break;
      default:
        this.statusCode = 400;
    }
  }
}