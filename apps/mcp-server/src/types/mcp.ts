/**
 * MCP Server Type Definitions
 *
 * Type definitions for the Model Context Protocol server implementation.
 */

import type { Request } from 'express';

/**
 * Server configuration options
 */
export interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  authEnabled: boolean;
  authTimestampMaxAge: number;
  authClockSkew: number;
}

/**
 * MCP session information
 */
export interface MCPSession {
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
}

/**
 * Extended Express Request with MCP session
 */
export interface MCPRequest extends Request {
  mcpSession?: MCPSession;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
}

/**
 * Readiness check response
 */
export interface ReadinessCheckResponse extends HealthCheckResponse {
  database: {
    connected: boolean;
    latency?: number;
  };
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
  timestamp: string;
}
