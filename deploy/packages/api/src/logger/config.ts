/**
 * Logging configuration for Evolution API
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import winston from 'winston';
import type { EnvironmentConfig } from '@sentra/types';

/**
 * Log levels with strict typing
 */
export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

export type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

/**
 * Log context interface for structured logging
 */
export interface LogContext {
  readonly requestId?: string;
  readonly userId?: string;
  readonly agentId?: string;
  readonly operationType?: string;
  readonly duration?: number;
  readonly statusCode?: number;
  readonly error?: Error | string;
  readonly metadata?: Record<string, unknown>;
  // Server-specific context
  readonly environment?: string;
  readonly host?: string;
  readonly corsOrigin?: string | string[];
  readonly stack?: string | undefined;
  readonly reason?: string;
  readonly promise?: string;
  // HTTP-specific context  
  readonly method?: string;
  readonly url?: string;
  readonly userAgent?: string | undefined;
  readonly ip?: string | undefined;
  readonly contentLength?: string;
  // Operation result context
  readonly success?: boolean;
  readonly event?: string;
  readonly severity?: string;
  // Additional context
  readonly port?: number;
  readonly websocketEnabled?: boolean;
  readonly maxConnections?: number;
  readonly resource?: string;
  readonly action?: string;
  readonly activity?: string;
  readonly details?: Record<string, unknown> | undefined;
  // Performance metrics
  readonly operationCount?: number;
  readonly metrics?: Record<string, any>;
}

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  readonly error: (message: string, context?: LogContext) => void;
  readonly warn: (message: string, context?: LogContext) => void;
  readonly info: (message: string, context?: LogContext) => void;
  readonly debug: (message: string, context?: LogContext) => void;
}

/**
 * Create Winston logger configuration
 */
export const createLogger = (config: EnvironmentConfig): Logger => {
  const isDevelopment = config.nodeEnv === 'development';
  const isProduction = config.nodeEnv === 'production';

  // Define log format
  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const logEntry = {
        timestamp,
        level,
        message,
        service: 'sentra-evolution-api',
        environment: config.nodeEnv,
        ...meta,
      };

      if (isDevelopment && config.logging.format === 'pretty') {
        // Pretty format for development
        const contextStr = Object.keys(meta).length > 0 
          ? `\n${JSON.stringify(meta, null, 2)}` 
          : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
      }

      return JSON.stringify(logEntry);
    })
  );

  // Create Winston logger
  const winstonLogger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: {
      service: 'sentra-evolution-api',
      version: process.env['npm_package_version'] || '1.0.0',
    },
    transports: [
      // Console transport
      new winston.transports.Console({
        handleExceptions: true,
        handleRejections: true,
      }),
    ],
  });

  // Add file transports in production
  if (isProduction) {
    winstonLogger.add(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
        tailable: true,
      })
    );

    winstonLogger.add(
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
        tailable: true,
      })
    );
  }

  // Create typed logger interface
  const logger: Logger = {
    error: (message: string, context?: LogContext) => {
      winstonLogger.error(message, context);
    },
    warn: (message: string, context?: LogContext) => {
      winstonLogger.warn(message, context);
    },
    info: (message: string, context?: LogContext) => {
      winstonLogger.info(message, context);
    },
    debug: (message: string, context?: LogContext) => {
      winstonLogger.debug(message, context);
    },
  };

  return logger;
};

/**
 * Request logging middleware for Express
 */
export const createRequestLogger = (logger: Logger) => {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add request ID to request object
    req.requestId = requestId;

    // Log incoming request
    logger.info('Incoming request', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId: req.user?.userId,
    });

    // Log response
    const originalSend = res.send;
    res.send = function(body: any) {
      const duration = Date.now() - startTime;
      
      logger.info('Request completed', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.userId,
        contentLength: res.get('content-length'),
      });

      return originalSend.call(this, body);
    };

    next();
  };
};

/**
 * Performance metrics logger
 */
export class PerformanceLogger {
  private readonly logger: Logger;
  private readonly metrics: Map<string, {
    count: number;
    totalDuration: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    lastExecution: Date;
  }>;

  constructor(logger: Logger) {
    this.logger = logger;
    this.metrics = new Map();
  }

  /**
   * Track operation performance
   */
  public readonly trackOperation = async <T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      this.recordMetric(operationName, duration, true);
      
      this.logger.debug('Operation completed', {
        operationType: operationName,
        duration,
        success: true,
        ...context,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.recordMetric(operationName, duration, false);
      
      this.logger.error('Operation failed', {
        operationType: operationName,
        duration,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        ...context,
      });

      throw error;
    }
  };

  /**
   * Record performance metric
   */
  private readonly recordMetric = (
    operationName: string,
    duration: number,
    _success: boolean
  ): void => {
    const existing = this.metrics.get(operationName);
    
    if (existing) {
      const newCount = existing.count + 1;
      const newTotal = existing.totalDuration + duration;
      
      this.metrics.set(operationName, {
        count: newCount,
        totalDuration: newTotal,
        avgDuration: newTotal / newCount,
        minDuration: Math.min(existing.minDuration, duration),
        maxDuration: Math.max(existing.maxDuration, duration),
        lastExecution: new Date(),
      });
    } else {
      this.metrics.set(operationName, {
        count: 1,
        totalDuration: duration,
        avgDuration: duration,
        minDuration: duration,
        maxDuration: duration,
        lastExecution: new Date(),
      });
    }
  };

  /**
   * Get performance metrics
   */
  public readonly getMetrics = (): Record<string, any> => {
    const result: Record<string, any> = {};
    
    for (const [operation, metrics] of this.metrics.entries()) {
      result[operation] = { ...metrics };
    }
    
    return result;
  };

  /**
   * Log performance summary
   */
  public readonly logSummary = (): void => {
    const metrics = this.getMetrics();
    
    this.logger.info('Performance metrics summary', {
      operationCount: Object.keys(metrics).length,
      metrics,
    });
  };
}

/**
 * Security event logger
 */
export class SecurityLogger {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public readonly logAuthAttempt = (
    success: boolean,
    userId?: string,
    ip?: string,
    userAgent?: string
  ): void => {
    const logData: any = {
      event: 'auth_attempt',
      success,
      severity: success ? 'info' : 'warn',
    };
    
    if (userId !== undefined) logData.userId = userId;
    if (ip !== undefined) logData.ip = ip;
    if (userAgent !== undefined) logData.userAgent = userAgent;
    
    this.logger.info('Authentication attempt', logData);
  };

  public readonly logAuthFailure = (
    reason: string,
    ip?: string,
    userAgent?: string
  ): void => {
    this.logger.warn('Authentication failed', {
      event: 'auth_failure',
      reason,
      ip,
      userAgent,
      severity: 'warn',
    });
  };

  public readonly logPermissionDenied = (
    userId: string,
    resource: string,
    action: string,
    ip?: string
  ): void => {
    this.logger.warn('Permission denied', {
      event: 'permission_denied',
      userId,
      resource,
      action,
      ip,
      severity: 'warn',
    });
  };

  public readonly logSuspiciousActivity = (
    userId: string,
    activity: string,
    details?: Record<string, unknown>
  ): void => {
    this.logger.warn('Suspicious activity detected', {
      event: 'suspicious_activity',
      userId,
      activity,
      details,
      severity: 'high',
    });
  };
}