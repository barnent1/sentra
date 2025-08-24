import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Capture original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Track response body size
  let responseSize = 0;
  
  // Override response methods to capture metrics
  res.send = function(body: any) {
    if (body) {
      responseSize = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body.toString());
    }
    return originalSend.call(this, body);
  };
  
  res.json = function(obj: any) {
    const jsonString = JSON.stringify(obj);
    responseSize = Buffer.byteLength(jsonString);
    return originalJson.call(this, obj);
  };
  
  // Log request completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const contentLength = res.get('content-length');
    const finalResponseSize = contentLength ? parseInt(contentLength, 10) : responseSize;
    
    // Determine log level based on status code
    let logLevel: 'info' | 'warn' | 'error' = 'info';
    if (res.statusCode >= 500) {
      logLevel = 'error';
    } else if (res.statusCode >= 400) {
      logLevel = 'warn';
    }
    
    // Extract user ID if available
    const userId = (req as any).user?.id;
    const sessionId = (req as any).sessionId;
    
    // Log request details
    logger[logLevel]('HTTP Request', {
      request: {
        method: req.method,
        url: req.originalUrl,
        path: req.path,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        userAgent: req.get('user-agent'),
        referer: req.get('referer'),
        contentType: req.get('content-type'),
        contentLength: req.get('content-length'),
        accept: req.get('accept'),
        acceptEncoding: req.get('accept-encoding'),
        acceptLanguage: req.get('accept-language'),
        origin: req.get('origin')
      },
      response: {
        statusCode: res.statusCode,
        contentType: res.get('content-type'),
        contentLength: finalResponseSize,
        duration: `${duration}ms`
      },
      client: {
        ip: req.ip,
        ips: req.ips.length > 0 ? req.ips : undefined,
        userId,
        sessionId
      },
      security: {
        rateLimitRemaining: res.get('x-ratelimit-remaining'),
        rateLimitLimit: res.get('x-ratelimit-limit'),
        rateLimitReset: res.get('x-ratelimit-reset')
      },
      performance: {
        duration,
        slow: duration > 1000 // Mark as slow if > 1 second
      }
    });
    
    // Log additional warning for slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        ip: req.ip,
        userId
      });
    }
    
    // Log security-related events
    if (res.statusCode === 401) {
      logger.warn('Authentication failed', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    } else if (res.statusCode === 403) {
      logger.warn('Authorization failed', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId,
        userAgent: req.get('user-agent')
      });
    } else if (res.statusCode === 429) {
      logger.warn('Rate limit exceeded', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId,
        retryAfter: res.get('retry-after')
      });
    }
  });
  
  // Log request errors
  res.on('error', (error) => {
    logger.error('Response error', {
      error: error.message,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: (req as any).user?.id
    });
  });
  
  next();
};