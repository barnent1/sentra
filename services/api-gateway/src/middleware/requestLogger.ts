import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger, createChildLogger } from '../utils/logger';

export interface RequestWithId extends Request {
    requestId?: string;
}

export const requestLogger = (
    req: RequestWithId,
    res: Response,
    next: NextFunction
): void => {
    const startTime = process.hrtime();
    
    // Generate unique request ID
    req.requestId = uuidv4();
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.requestId);
    
    // Create child logger with request context
    const requestLogger = createChildLogger({
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get('user-agent'),
        ip: req.ip,
    });
    
    // Log incoming request
    requestLogger.info('Incoming request', {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: {
            authorization: req.headers.authorization ? '[REDACTED]' : undefined,
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
        },
    });
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any, ...args: any[]) {
        const diff = process.hrtime(startTime);
        const duration = diff[0] * 1000 + diff[1] * 1e-6; // Convert to milliseconds
        
        requestLogger.info('Request completed', {
            statusCode: res.statusCode,
            duration: `${duration.toFixed(2)}ms`,
            contentLength: res.get('content-length') || 0,
        });
        
        // Call original end method
        originalEnd.call(this, chunk, encoding, ...args);
    };
    
    next();
};