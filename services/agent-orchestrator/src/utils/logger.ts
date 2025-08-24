import winston from 'winston';
import { config } from './config';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize(),
  winston.format.simple(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

const transports: winston.transport[] = [];

if (config.logging.enableConsole) {
  transports.push(
    new winston.transports.Console({
      format: config.nodeEnv === 'development' ? consoleFormat : logFormat,
    })
  );
}

if (config.logging.enableFile) {
  transports.push(
    new winston.transports.File({
      filename: config.logging.logFile,
      format: logFormat,
    })
  );
}

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  defaultMeta: { service: 'agent-orchestrator' },
});

// Create a stream for HTTP request logging
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};