"use strict";
/**
 * Logging configuration for Evolution API
 * Following SENTRA project standards: strict TypeScript with branded types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityLogger = exports.PerformanceLogger = exports.createRequestLogger = exports.createLogger = exports.LogLevel = void 0;
const tslib_1 = require("tslib");
const winston_1 = tslib_1.__importDefault(require("winston"));
/**
 * Log levels with strict typing
 */
exports.LogLevel = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
};
/**
 * Create Winston logger configuration
 */
const createLogger = (config) => {
    const isDevelopment = config.nodeEnv === 'development';
    const isProduction = config.nodeEnv === 'production';
    // Define log format
    const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
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
    }));
    // Create Winston logger
    const winstonLogger = winston_1.default.createLogger({
        level: config.logging.level,
        format: logFormat,
        defaultMeta: {
            service: 'sentra-evolution-api',
            version: process.env['npm_package_version'] || '1.0.0',
        },
        transports: [
            // Console transport
            new winston_1.default.transports.Console({
                handleExceptions: true,
                handleRejections: true,
            }),
        ],
    });
    // Add file transports in production
    if (isProduction) {
        winstonLogger.add(new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
            tailable: true,
        }));
        winstonLogger.add(new winston_1.default.transports.File({
            filename: 'logs/combined.log',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 10,
            tailable: true,
        }));
    }
    // Create typed logger interface
    const logger = {
        error: (message, context) => {
            winstonLogger.error(message, context);
        },
        warn: (message, context) => {
            winstonLogger.warn(message, context);
        },
        info: (message, context) => {
            winstonLogger.info(message, context);
        },
        debug: (message, context) => {
            winstonLogger.debug(message, context);
        },
    };
    return logger;
};
exports.createLogger = createLogger;
/**
 * Request logging middleware for Express
 */
const createRequestLogger = (logger) => {
    return (req, res, next) => {
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
        res.send = function (body) {
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
exports.createRequestLogger = createRequestLogger;
/**
 * Performance metrics logger
 */
class PerformanceLogger {
    logger;
    metrics;
    constructor(logger) {
        this.logger = logger;
        this.metrics = new Map();
    }
    /**
     * Track operation performance
     */
    trackOperation = async (operationName, operation, context) => {
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
        }
        catch (error) {
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
    recordMetric = (operationName, duration, _success) => {
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
        }
        else {
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
    getMetrics = () => {
        const result = {};
        for (const [operation, metrics] of this.metrics.entries()) {
            result[operation] = { ...metrics };
        }
        return result;
    };
    /**
     * Log performance summary
     */
    logSummary = () => {
        const metrics = this.getMetrics();
        this.logger.info('Performance metrics summary', {
            operationCount: Object.keys(metrics).length,
            metrics,
        });
    };
}
exports.PerformanceLogger = PerformanceLogger;
/**
 * Security event logger
 */
class SecurityLogger {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    logAuthAttempt = (success, userId, ip, userAgent) => {
        const logData = {
            event: 'auth_attempt',
            success,
            severity: success ? 'info' : 'warn',
        };
        if (userId !== undefined)
            logData.userId = userId;
        if (ip !== undefined)
            logData.ip = ip;
        if (userAgent !== undefined)
            logData.userAgent = userAgent;
        this.logger.info('Authentication attempt', logData);
    };
    logAuthFailure = (reason, ip, userAgent) => {
        this.logger.warn('Authentication failed', {
            event: 'auth_failure',
            reason,
            ip,
            userAgent,
            severity: 'warn',
        });
    };
    logPermissionDenied = (userId, resource, action, ip) => {
        this.logger.warn('Permission denied', {
            event: 'permission_denied',
            userId,
            resource,
            action,
            ip,
            severity: 'warn',
        });
    };
    logSuspiciousActivity = (userId, activity, details) => {
        this.logger.warn('Suspicious activity detected', {
            event: 'suspicious_activity',
            userId,
            activity,
            details,
            severity: 'high',
        });
    };
}
exports.SecurityLogger = SecurityLogger;
//# sourceMappingURL=config.js.map