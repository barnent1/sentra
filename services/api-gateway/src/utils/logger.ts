import winston from 'winston';
import { config } from './config';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Tell winston about our colors
winston.addColors(colors);

// Define format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => {
        return `${info.timestamp} [${info.level}]: ${info.message}`;
    })
);

// Define format for file output
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
        format: config.logging.format === 'json' ? fileFormat : consoleFormat,
        level: config.logging.level,
    }),
];

// Add file transports in production
if (config.nodeEnv === 'production') {
    transports.push(
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
}

// Create the logger
export const logger = winston.createLogger({
    level: config.logging.level,
    levels,
    transports,
    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({ 
            filename: 'logs/exceptions.log',
            format: fileFormat 
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({ 
            filename: 'logs/rejections.log',
            format: fileFormat 
        }),
    ],
    // Don't exit on handled exceptions
    exitOnError: false,
});

// Create a stream for Morgan HTTP logging
export const loggerStream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};

// Add request context to logger
export const createChildLogger = (context: Record<string, any>) => {
    return logger.child(context);
};

// Performance logging utility
export const logPerformance = (label: string, startTime: [number, number]) => {
    const diff = process.hrtime(startTime);
    const duration = diff[0] * 1000 + diff[1] * 1e-6; // Convert to milliseconds
    logger.debug(`Performance: ${label} took ${duration.toFixed(2)}ms`);
    return duration;
};

// Error logging utility with context
export const logError = (error: Error, context?: Record<string, any>) => {
    logger.error('Application error occurred', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...context,
    });
};

// Security event logging
export const logSecurityEvent = (event: string, details: Record<string, any>) => {
    logger.warn('Security event', {
        event,
        timestamp: new Date().toISOString(),
        ...details,
    });
};

// Audit logging for compliance
export const logAuditEvent = (
    action: string, 
    resource: string, 
    userId?: string, 
    details?: Record<string, any>
) => {
    logger.info('Audit event', {
        action,
        resource,
        userId,
        timestamp: new Date().toISOString(),
        ...details,
    });
};