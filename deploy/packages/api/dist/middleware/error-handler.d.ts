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
export declare class ValidationError extends Error {
    readonly code = "VALIDATION_ERROR";
    readonly statusCode = 400;
    readonly details: z.ZodIssue[];
    constructor(message: string, details: z.ZodIssue[]);
}
export declare class NotFoundError extends Error {
    readonly code = "NOT_FOUND";
    readonly statusCode = 404;
    constructor(resource: string, id?: string);
}
export declare class ConflictError extends Error {
    readonly code = "CONFLICT";
    readonly statusCode = 409;
    constructor(message: string);
}
export declare class RateLimitError extends Error {
    readonly code = "RATE_LIMIT_EXCEEDED";
    readonly statusCode = 429;
    readonly retryAfter: number;
    constructor(message: string, retryAfter?: number);
}
export declare class DatabaseError extends Error {
    readonly code = "DATABASE_ERROR";
    readonly statusCode = 500;
    readonly operation?: string;
    constructor(message: string, operation?: string);
}
export declare class ExternalServiceError extends Error {
    readonly code = "EXTERNAL_SERVICE_ERROR";
    readonly statusCode = 502;
    readonly service: string;
    constructor(service: string, message: string);
}
export declare class BusinessLogicError extends Error {
    readonly code = "BUSINESS_LOGIC_ERROR";
    readonly statusCode = 422;
    constructor(message: string);
}
/**
 * Union type of all custom errors
 */
export type ApiError = ValidationError | NotFoundError | ConflictError | RateLimitError | DatabaseError | ExternalServiceError | BusinessLogicError | AuthError;
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
export declare const createErrorHandler: (logger?: ErrorLogger) => (error: Error, req: Request, res: Response, next: NextFunction) => void;
/**
 * Async error wrapper utility
 * Wraps async route handlers to automatically catch and forward errors
 */
export declare const asyncHandler: <T extends Request, U extends Response>(fn: (req: T, res: U, next: NextFunction) => Promise<void>) => (req: T, res: U, next: NextFunction) => void;
/**
 * Async handler specifically for authenticated requests
 */
export declare const asyncAuthHandler: (fn: (req: any, res: Response, next: NextFunction) => Promise<void>) => (req: any, res: Response, next: NextFunction) => void;
/**
 * Not found middleware for unmatched routes
 */
export declare const notFoundHandler: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Validation middleware factory
 * Creates middleware to validate request parts against Zod schemas
 */
export declare const validateRequest: <TBody = any, TQuery = any, TParams = any>(schemas: {
    body?: z.ZodType<TBody>;
    query?: z.ZodType<TQuery>;
    params?: z.ZodType<TParams>;
}) => (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Helper functions for throwing specific errors
 */
export declare const throwNotFound: (resource: string, id?: string) => never;
export declare const throwValidation: (message: string, details: z.ZodIssue[]) => never;
export declare const throwConflict: (message: string) => never;
export declare const throwBusinessLogic: (message: string) => never;
export declare const throwDatabaseError: (message: string, operation?: string) => never;
export declare const throwExternalService: (service: string, message: string) => never;
//# sourceMappingURL=error-handler.d.ts.map