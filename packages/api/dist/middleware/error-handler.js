"use strict";
/**
 * Comprehensive error handling middleware for Evolution API
 * Following SENTRA project standards: strict TypeScript with branded types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwExternalService = exports.throwDatabaseError = exports.throwBusinessLogic = exports.throwConflict = exports.throwValidation = exports.throwNotFound = exports.validateRequest = exports.notFoundHandler = exports.asyncAuthHandler = exports.asyncHandler = exports.createErrorHandler = exports.BusinessLogicError = exports.ExternalServiceError = exports.DatabaseError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.ValidationError = void 0;
const zod_1 = require("zod");
const auth_1 = require("./auth");
/**
 * Custom error types for the Evolution API
 */
class ValidationError extends Error {
    code = 'VALIDATION_ERROR';
    statusCode = 400;
    details;
    constructor(message, details) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    code = 'NOT_FOUND';
    statusCode = 404;
    constructor(resource, id) {
        const message = id
            ? `${resource} with id '${id}' not found`
            : `${resource} not found`;
        super(message);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends Error {
    code = 'CONFLICT';
    statusCode = 409;
    constructor(message) {
        super(message);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends Error {
    code = 'RATE_LIMIT_EXCEEDED';
    statusCode = 429;
    retryAfter;
    constructor(message, retryAfter = 60) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}
exports.RateLimitError = RateLimitError;
class DatabaseError extends Error {
    code = 'DATABASE_ERROR';
    statusCode = 500;
    operation;
    constructor(message, operation) {
        super(message);
        this.name = 'DatabaseError';
        if (operation !== undefined) {
            this.operation = operation;
        }
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends Error {
    code = 'EXTERNAL_SERVICE_ERROR';
    statusCode = 502;
    service;
    constructor(service, message) {
        super(`${service}: ${message}`);
        this.name = 'ExternalServiceError';
        this.service = service;
    }
}
exports.ExternalServiceError = ExternalServiceError;
class BusinessLogicError extends Error {
    code = 'BUSINESS_LOGIC_ERROR';
    statusCode = 422;
    constructor(message) {
        super(message);
        this.name = 'BusinessLogicError';
    }
}
exports.BusinessLogicError = BusinessLogicError;
/**
 * Helper to determine if error is operational (expected) vs programming error
 */
const isOperationalError = (error) => {
    return (error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof ConflictError ||
        error instanceof RateLimitError ||
        error instanceof DatabaseError ||
        error instanceof ExternalServiceError ||
        error instanceof BusinessLogicError ||
        error instanceof auth_1.AuthError);
};
/**
 * Helper to extract error details based on error type
 */
const getErrorDetails = (error) => {
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
 * Error handling middleware factory
 */
const createErrorHandler = (logger) => {
    return (error, req, res, next) => {
        // Don't handle if response already sent
        if (res.headersSent) {
            return next(error);
        }
        // Check if it's an operational error
        if (isOperationalError(error)) {
            const errorResponse = {
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
                userId: req.user?.userId,
            };
            if (error.statusCode >= 500) {
                logger?.error(error.message, { ...logMeta, stack: error.stack });
            }
            else if (error.statusCode >= 400) {
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
        if (error instanceof zod_1.z.ZodError) {
            const validationError = new ValidationError('Request validation failed', error.issues);
            const errorResponse = {
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
            userId: req.user?.userId,
        });
        // Don't expose internal error details in production
        const isProduction = process.env['NODE_ENV'] === 'production';
        const errorResponse = {
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
exports.createErrorHandler = createErrorHandler;
/**
 * Async error wrapper utility
 * Wraps async route handlers to automatically catch and forward errors
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Async handler specifically for authenticated requests
 */
const asyncAuthHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncAuthHandler = asyncAuthHandler;
/**
 * Not found middleware for unmatched routes
 */
const notFoundHandler = (req, _res, next) => {
    next(new NotFoundError('Route', req.path));
};
exports.notFoundHandler = notFoundHandler;
/**
 * Validation middleware factory
 * Creates middleware to validate request parts against Zod schemas
 */
const validateRequest = (schemas) => {
    return (req, _res, next) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
/**
 * Helper functions for throwing specific errors
 */
const throwNotFound = (resource, id) => {
    throw new NotFoundError(resource, id);
};
exports.throwNotFound = throwNotFound;
const throwValidation = (message, details) => {
    throw new ValidationError(message, details);
};
exports.throwValidation = throwValidation;
const throwConflict = (message) => {
    throw new ConflictError(message);
};
exports.throwConflict = throwConflict;
const throwBusinessLogic = (message) => {
    throw new BusinessLogicError(message);
};
exports.throwBusinessLogic = throwBusinessLogic;
const throwDatabaseError = (message, operation) => {
    throw new DatabaseError(message, operation);
};
exports.throwDatabaseError = throwDatabaseError;
const throwExternalService = (service, message) => {
    throw new ExternalServiceError(service, message);
};
exports.throwExternalService = throwExternalService;
//# sourceMappingURL=error-handler.js.map