import winston from 'winston';
import { config } from './config';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

// Custom format for security logging
const securityFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
  const logEntry = {
    timestamp,
    level,
    message,
    service: 'auth-service',
    environment: config.environment,
    ...meta
  };

  // Mask sensitive data in logs
  if (logEntry.password) logEntry.password = '[MASKED]';
  if (logEntry.token) logEntry.token = '[MASKED]';
  if (logEntry.secret) logEntry.secret = '[MASKED]';
  if (logEntry.apiKey) logEntry.apiKey = '[MASKED]';
  if (logEntry.authorization) logEntry.authorization = '[MASKED]';

  return JSON.stringify(logEntry);
});

// Create logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    errors({ stack: true }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    config.logging.format === 'json' ? json() : simple()
  ),
  defaultMeta: {
    service: 'sentra-auth-service',
    environment: config.environment
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.environment === 'development' 
        ? combine(colorize(), simple())
        : securityFormat
    }),

    // File transports for production
    ...(config.environment === 'production' ? [
      // Error logs
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: securityFormat,
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 5,
        tailable: true
      }),

      // Combined logs
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: securityFormat,
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10,
        tailable: true
      }),

      // Security audit logs
      new winston.transports.File({
        filename: 'logs/security-audit.log',
        format: securityFormat,
        maxsize: 100 * 1024 * 1024, // 100MB
        maxFiles: 20,
        tailable: true
      })
    ] : [])
  ],

  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.Console({
      format: combine(
        errors({ stack: true }),
        securityFormat
      )
    })
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: combine(
        errors({ stack: true }),
        securityFormat
      )
    })
  ]
});

// Security audit logger
export class SecurityAuditLogger {
  static logAuthenticationAttempt(params: {
    email?: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    reason?: string;
    userId?: string;
    mfaUsed?: boolean;
  }) {
    logger.info('Authentication attempt', {
      event: 'authentication_attempt',
      email: params.email,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      success: params.success,
      reason: params.reason,
      userId: params.userId,
      mfaUsed: params.mfaUsed,
      timestamp: new Date().toISOString(),
      severity: params.success ? 'info' : 'warn'
    });
  }

  static logAccountLockout(params: {
    email: string;
    ipAddress: string;
    failedAttempts: number;
    lockoutDuration: number;
  }) {
    logger.warn('Account locked due to failed attempts', {
      event: 'account_lockout',
      email: params.email,
      ipAddress: params.ipAddress,
      failedAttempts: params.failedAttempts,
      lockoutDuration: params.lockoutDuration,
      timestamp: new Date().toISOString(),
      severity: 'high'
    });
  }

  static logPrivilegeEscalation(params: {
    userId: string;
    fromRole: string;
    toRole: string;
    ipAddress: string;
    success: boolean;
  }) {
    logger.warn('Privilege escalation attempt', {
      event: 'privilege_escalation',
      userId: params.userId,
      fromRole: params.fromRole,
      toRole: params.toRole,
      ipAddress: params.ipAddress,
      success: params.success,
      timestamp: new Date().toISOString(),
      severity: 'critical'
    });
  }

  static logSecurityViolation(params: {
    type: string;
    description: string;
    ipAddress?: string;
    userId?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    additionalData?: any;
  }) {
    logger.error('Security violation detected', {
      event: 'security_violation',
      type: params.type,
      description: params.description,
      ipAddress: params.ipAddress,
      userId: params.userId,
      severity: params.severity,
      additionalData: params.additionalData,
      timestamp: new Date().toISOString()
    });
  }

  static logDataAccess(params: {
    userId: string;
    resourceType: string;
    resourceId?: string;
    action: 'read' | 'write' | 'delete' | 'create';
    ipAddress: string;
    success: boolean;
  }) {
    logger.info('Data access event', {
      event: 'data_access',
      userId: params.userId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      action: params.action,
      ipAddress: params.ipAddress,
      success: params.success,
      timestamp: new Date().toISOString(),
      severity: 'info'
    });
  }

  static logMfaEvent(params: {
    userId: string;
    event: 'setup' | 'verify' | 'backup_code_used' | 'reset';
    success: boolean;
    ipAddress: string;
    method?: string;
  }) {
    logger.info('MFA event', {
      event: 'mfa_event',
      userId: params.userId,
      mfaEvent: params.event,
      success: params.success,
      ipAddress: params.ipAddress,
      method: params.method,
      timestamp: new Date().toISOString(),
      severity: params.success ? 'info' : 'warn'
    });
  }

  static logSessionEvent(params: {
    userId?: string;
    sessionId: string;
    event: 'created' | 'expired' | 'revoked' | 'extended';
    ipAddress: string;
    userAgent?: string;
  }) {
    logger.info('Session event', {
      event: 'session_event',
      userId: params.userId,
      sessionId: params.sessionId,
      sessionEvent: params.event,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date().toISOString(),
      severity: 'info'
    });
  }
}

export { winston };