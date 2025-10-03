/**
 * Logger Middleware
 *
 * Provides structured logging using Pino for HTTP requests and application events.
 */

import pino from 'pino';
import pinoHttp from 'pino-http';
import { isDevelopment } from '../config/server.js';

/**
 * Pino logger instance
 */
export const logger = pino({
  level: isDevelopment() ? 'debug' : 'info',
  transport: isDevelopment()
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

/**
 * HTTP request logger middleware
 */
export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
  customSuccessMessage: (_req, res) => {
    return `${_req.method} ${_req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (_req, res, err) => {
    return `${_req.method} ${_req.url} - ${res.statusCode} - ${err.message}`;
  },
});
