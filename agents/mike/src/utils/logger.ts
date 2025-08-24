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
      agent: 'mike-pm',
      agentType: 'pm',
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
              return `${timestamp} [MIKE-PM] ${level}: ${message} ${metaStr}`;
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
    service: 'mike-pm-agent',
    agentId: config.agentId,
  },
  exceptionHandlers: [
    new winston.transports.Console(),
    ...(config.logging.enableFile ? [new winston.transports.File({ filename: 'logs/mike-exceptions.log' })] : []),
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
    ...(config.logging.enableFile ? [new winston.transports.File({ filename: 'logs/mike-rejections.log' })] : []),
  ],
});

// Add custom logging methods for PM activities
export const pmLogger = {
  storiesCreated: (taskId: string, storyCount: number, totalStoryPoints: number) => {
    logger.info('User stories created', {
      taskId,
      storyCount,
      totalStoryPoints,
      activity: 'story_creation',
      manager: 'Mike',
    });
  },

  timelineEstimated: (taskId: string, estimatedCompletion: Date, confidenceLevel: number) => {
    logger.info('Timeline estimated', {
      taskId,
      estimatedCompletion: estimatedCompletion.toISOString(),
      confidenceLevel,
      activity: 'timeline_estimation',
      manager: 'Mike',
    });
  },

  clientCommunicationSent: (taskId: string, communicationType: string, recipientCount: number, success: boolean) => {
    logger.info('Client communication sent', {
      taskId,
      communicationType,
      recipientCount,
      success,
      activity: 'client_communication',
      manager: 'Mike',
    });
  },

  milestoneCompleted: (milestoneId: string, agentId: string) => {
    logger.info('Milestone completed', {
      milestoneId,
      completedBy: agentId,
      activity: 'milestone_tracking',
      manager: 'Mike',
    });
  },

  taskCompletionRecorded: (taskId: string, agentId: string, actualDuration: number) => {
    logger.info('Task completion recorded for learning', {
      taskId,
      completedBy: agentId,
      actualDuration,
      activity: 'timeline_learning',
      manager: 'Mike',
    });
  },

  qualityGateBlocked: (taskId: string, blockedBy: string[], agentId: string) => {
    logger.warn('Quality gate blocked, stakeholder notification required', {
      taskId,
      blockedBy,
      reportedBy: agentId,
      activity: 'quality_gate_management',
      manager: 'Mike',
    });
  },

  riskIdentified: (projectId: string, riskId: string, severity: string, probability: number) => {
    logger.warn('Project risk identified', {
      projectId,
      riskId,
      severity,
      probability,
      activity: 'risk_management',
      manager: 'Mike',
    });
  },

  velocityUpdated: (projectId: string, newVelocity: number, trend: string) => {
    logger.info('Project velocity updated', {
      projectId,
      velocity: newVelocity,
      trend,
      activity: 'velocity_tracking',
      manager: 'Mike',
    });
  },

  automatedReportSent: (reportType: string, projectCount: number, success: boolean) => {
    logger.info('Automated report sent', {
      reportType,
      projectCount,
      success,
      activity: 'automated_reporting',
      manager: 'Mike',
    });
  },

  stakeholderCommunication: (projectId: string, communicationType: string, stakeholderCount: number) => {
    logger.info('Stakeholder communication initiated', {
      projectId,
      communicationType,
      stakeholderCount,
      activity: 'stakeholder_management',
      manager: 'Mike',
    });
  },

  projectHealthCheck: (projectId: string, healthScore: number, issues: number) => {
    logger.info('Project health assessment completed', {
      projectId,
      healthScore,
      issueCount: issues,
      activity: 'project_health_monitoring',
      manager: 'Mike',
    });
  },
};

export default logger;