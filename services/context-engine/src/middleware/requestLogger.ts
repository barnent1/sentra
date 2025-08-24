import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface RequestWithId extends Request {
  id: string;
  startTime: number;
}

export const requestLogger = (req: RequestWithId, res: Response, next: NextFunction): void => {
  req.id = uuidv4();
  req.startTime = Date.now();

  // Log request
  logger.info('Request started', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any): Response {
    const duration = Date.now() - req.startTime;
    
    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length'),
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};