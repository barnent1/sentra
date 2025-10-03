/**
 * CORS Middleware Configuration
 *
 * Configures Cross-Origin Resource Sharing (CORS) for the MCP server.
 */

import cors from 'cors';
import { serverConfig } from '../config/server.js';

/**
 * CORS configuration options
 */
export const corsMiddleware = cors({
  origin: serverConfig.corsOrigin,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
  credentials: true,
  maxAge: 86400, // 24 hours
});
