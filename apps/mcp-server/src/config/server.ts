/**
 * Server Configuration
 *
 * Centralized configuration for the MCP server, loaded from environment variables.
 */

import type { ServerConfig } from '../types/mcp.js';

/**
 * Parse environment variable as integer with fallback
 */
function parseEnvInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Server configuration loaded from environment variables
 */
export const serverConfig: ServerConfig = {
  port: parseEnvInt(process.env.PORT, 3000),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindowMs: parseEnvInt(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  rateLimitMaxRequests: parseEnvInt(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  authEnabled: process.env.AUTH_ENABLED === 'true',
  authTimestampMaxAge: parseEnvInt(process.env.AUTH_TIMESTAMP_MAX_AGE, 60),
  authClockSkew: parseEnvInt(process.env.AUTH_CLOCK_SKEW, 5),
};

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return serverConfig.nodeEnv === 'production';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return serverConfig.nodeEnv === 'development';
}
