/**
 * Logging configuration for Evolution API
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import type { EnvironmentConfig } from '@sentra/types';
/**
 * Log levels with strict typing
 */
export declare const LogLevel: {
    readonly ERROR: "error";
    readonly WARN: "warn";
    readonly INFO: "info";
    readonly DEBUG: "debug";
};
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
    readonly environment?: string;
    readonly host?: string;
    readonly corsOrigin?: string | string[];
    readonly stack?: string | undefined;
    readonly reason?: string;
    readonly promise?: string;
    readonly method?: string;
    readonly url?: string;
    readonly userAgent?: string | undefined;
    readonly ip?: string | undefined;
    readonly contentLength?: string;
    readonly success?: boolean;
    readonly event?: string;
    readonly severity?: string;
    readonly port?: number;
    readonly websocketEnabled?: boolean;
    readonly maxConnections?: number;
    readonly resource?: string;
    readonly action?: string;
    readonly activity?: string;
    readonly details?: Record<string, unknown> | undefined;
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
export declare const createLogger: (config: EnvironmentConfig) => Logger;
/**
 * Request logging middleware for Express
 */
export declare const createRequestLogger: (logger: Logger) => (req: any, res: any, next: any) => void;
/**
 * Performance metrics logger
 */
export declare class PerformanceLogger {
    private readonly logger;
    private readonly metrics;
    constructor(logger: Logger);
    /**
     * Track operation performance
     */
    readonly trackOperation: <T>(operationName: string, operation: () => Promise<T>, context?: Record<string, unknown>) => Promise<T>;
    /**
     * Record performance metric
     */
    private readonly recordMetric;
    /**
     * Get performance metrics
     */
    readonly getMetrics: () => Record<string, any>;
    /**
     * Log performance summary
     */
    readonly logSummary: () => void;
}
/**
 * Security event logger
 */
export declare class SecurityLogger {
    private readonly logger;
    constructor(logger: Logger);
    readonly logAuthAttempt: (success: boolean, userId?: string, ip?: string, userAgent?: string) => void;
    readonly logAuthFailure: (reason: string, ip?: string, userAgent?: string) => void;
    readonly logPermissionDenied: (userId: string, resource: string, action: string, ip?: string) => void;
    readonly logSuspiciousActivity: (userId: string, activity: string, details?: Record<string, unknown>) => void;
}
//# sourceMappingURL=config.d.ts.map