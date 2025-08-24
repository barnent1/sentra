import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

export const errorMiddleware = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Log the error
    logger.error('Request error', {
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode,
        code: err.code,
        url: req.url,
        method: req.method,
        userAgent: req.get('user-agent'),
        ip: req.ip,
    });

    // Default error response
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: statusCode >= 500 ? 'Internal Server Error' : message,
        message: statusCode >= 500 ? 'An unexpected error occurred' : message,
        statusCode,
        timestamp: new Date().toISOString(),
        path: req.url,
    });
};

export const notFoundMiddleware = (req: Request, res: Response): void => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        statusCode: 404,
        timestamp: new Date().toISOString(),
        path: req.url,
    });
};