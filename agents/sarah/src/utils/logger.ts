import winston from 'winston';
import { config } from './config';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      agent: 'sarah-qa',
      agentType: 'qa',
      message,
      ...meta,
    });
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport
if (config.logging.enableConsole) {
  transports.push(
    new winston.transports.Console({
      format: config.development.debugMode 
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [SARAH-QA] ${level}: ${message} ${metaStr}`;
            })
          )
        : logFormat,
    })
  );
}

// File transport
if (config.logging.enableFile) {
  transports.push(
    new winston.transports.File({
      filename: config.logging.filename,
      format: logFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  defaultMeta: {
    service: 'sarah-qa-agent',
    agentId: config.agentId,
  },
  exceptionHandlers: [
    new winston.transports.Console(),
    ...(config.logging.enableFile ? [new winston.transports.File({ filename: 'logs/sarah-exceptions.log' })] : []),
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
    ...(config.logging.enableFile ? [new winston.transports.File({ filename: 'logs/sarah-rejections.log' })] : []),
  ],
});

// Add custom logging methods for Sarah's QA activities
export const qaLogger = {
  reviewStarted: (taskId: string, filePaths: string[]) => {
    logger.info('Adversarial code review started', {
      taskId,
      filePaths,
      reviewType: 'adversarial',
      reviewer: 'Sarah',
    });
  },

  reviewCompleted: (taskId: string, approved: boolean, qualityScore: number, issueCount: number) => {
    logger.info('Code review completed', {
      taskId,
      approved,
      qualityScore,
      issueCount,
      reviewType: 'adversarial',
      reviewer: 'Sarah',
    });
  },

  criticalIssueFound: (taskId: string, issue: any) => {
    logger.warn('Critical issue detected', {
      taskId,
      severity: 'critical',
      category: issue.category,
      title: issue.title,
      file: issue.file,
      reviewer: 'Sarah',
    });
  },

  securityVulnerabilityFound: (taskId: string, vulnerability: any) => {
    logger.error('Security vulnerability detected', {
      taskId,
      severity: vulnerability.severity,
      title: vulnerability.title,
      file: vulnerability.file,
      impact: vulnerability.impact,
      reviewer: 'Sarah',
    });
  },

  qualityGateBlocked: (taskId: string, reason: string, blockedBy: string[]) => {
    logger.warn('Quality gate blocked', {
      taskId,
      reason,
      blockedBy,
      action: 'BLOCK_MERGE',
      reviewer: 'Sarah',
    });
  },

  performanceIssueFound: (taskId: string, issue: any) => {
    logger.warn('Performance issue detected', {
      taskId,
      severity: issue.severity,
      title: issue.title,
      file: issue.file,
      impact: issue.impact,
      reviewer: 'Sarah',
    });
  },

  architectureViolation: (taskId: string, violation: any) => {
    logger.error('Architecture violation detected', {
      taskId,
      violation: violation.title,
      file: violation.file,
      standardViolated: violation.rule,
      reviewer: 'Sarah',
    });
  },

  taskProgress: (taskId: string, progress: number, phase: string) => {
    logger.debug('Review progress updated', {
      taskId,
      progress,
      phase,
      reviewer: 'Sarah',
    });
  },
};

export default logger;