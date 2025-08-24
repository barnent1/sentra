import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

interface LoggingRequest extends Request {
  startTime?: number;
  requestId?: string;
}

export const requestLogger = (req: LoggingRequest, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.requestId = req.get('X-Request-ID') || uuidv4();
  req.startTime = Date.now();

  // Set request ID header
  res.set('X-Request-ID', req.requestId);
  res.set('X-Agent-Name', 'Sarah');
  res.set('X-Agent-Type', 'qa');

  // Skip logging for health checks in production
  const skipLogging = !config.development.debugMode && 
                     (req.path === '/health' || req.path === '/health/live');

  if (!skipLogging) {
    logger.info('Sarah incoming request:', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      remoteAddress: req.ip,
      timestamp: new Date().toISOString(),
    });
  }

  // Capture response details
  const originalSend = res.send;
  const originalJson = res.json;

  res.send = function(data: any): Response {
    const duration = Date.now() - (req.startTime || Date.now());
    
    if (!skipLogging) {
      logger.info('Sarah response sent:', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        contentLength: res.get('Content-Length') || (data ? data.length : 0),
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    return originalSend.call(this, data);
  };

  res.json = function(data: any): Response {
    const duration = Date.now() - (req.startTime || Date.now());
    
    if (!skipLogging) {
      // Log additional info for QA-specific endpoints
      const additionalInfo: any = {};
      
      if (req.url.includes('/review') && data?.result) {
        additionalInfo.reviewResult = {
          approved: data.result.approved,
          qualityScore: data.result.qualityScore,
          issueCount: data.result.issues?.length || 0,
          criticalIssues: data.result.issues?.filter((i: any) => i.severity === 'critical').length || 0,
        };
      }

      if (req.url.includes('/quality-gate')) {
        additionalInfo.qualityGate = {
          approved: data.approved,
          blocked: data.blocked,
        };
      }

      logger.info('Sarah JSON response sent:', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        responseSize: JSON.stringify(data).length,
        ...additionalInfo,
        timestamp: new Date().toISOString(),
      });
    }

    return originalJson.call(this, data);
  };

  // Log errors
  res.on('error', (error: Error) => {
    logger.error('Sarah response error:', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  });

  // Log slow requests
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now());
    
    if (duration > 5000) { // Log requests taking longer than 5 seconds
      logger.warn('Sarah slow request detected:', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    // Track QA-specific metrics
    if (req.url.includes('/review') && res.statusCode === 200) {
      logger.debug('Sarah code review completed:', {
        requestId: req.requestId,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  next();
};

// Middleware to log request body for debugging (use carefully)
export const requestBodyLogger = (req: Request, res: Response, next: NextFunction): void => {
  if (config.development.debugMode && req.body && Object.keys(req.body).length > 0) {
    logger.debug('Sarah request body:', {
      requestId: (req as any).requestId,
      method: req.method,
      url: req.url,
      body: req.body,
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// Middleware to add security headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  next();
};