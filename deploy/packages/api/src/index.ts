/**
 * Sentra Evolution API Server - Enhanced API Layer Implementation
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import express, { Express, Request, Response } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config as dotenvConfig } from 'dotenv';

import type { EnvironmentConfig } from '@sentra/types';
import {
  TestDNAEngine,
  createVectorDatabaseService,
} from '@sentra/core';

import { createLogger, createRequestLogger, PerformanceLogger, type Logger } from './logger/config';
import { createAuthService, type AuthService } from './middleware/auth';
import { createErrorHandler, notFoundHandler, type ErrorLogger } from './middleware/error-handler';
import { createEvolutionRouter } from './routes/evolution';
import { EvolutionEventBroadcaster, type WebSocketConfig } from './websocket/event-system';

// Load environment variables
dotenvConfig();

/**
 * Server configuration interface
 */
export interface ServerConfig {
  readonly environment: EnvironmentConfig;
  readonly auth: {
    readonly jwtSecret: string;
    readonly jwtExpiresIn: string;
    readonly refreshTokenExpiresIn: string;
    readonly bcryptRounds: number;
  };
  readonly websocket: WebSocketConfig;
  readonly rateLimit: {
    readonly enabled: boolean;
    readonly windowMs: number;
    readonly maxRequests: number;
  };
}

/**
 * Enhanced Sentra Evolution API Server
 */
export class SentraEvolutionApi {
  private readonly config: ServerConfig;
  private readonly app: Express;
  private readonly httpServer: HTTPServer;
  private readonly logger: Logger;
  private readonly authService: AuthService;
  private readonly performanceLogger: PerformanceLogger;
  
  // Core services
  private readonly dnaEngine: TestDNAEngine;
  private readonly vectorStore: any; // TODO: Type when fully integrated
  private eventBroadcaster?: EvolutionEventBroadcaster;

  constructor(config: ServerConfig) {
    this.config = config;
    this.app = express();
    this.httpServer = createServer(this.app);
    
    // Initialize logging
    this.logger = createLogger(config.environment);
    this.performanceLogger = new PerformanceLogger(this.logger);
    
    // Initialize authentication
    this.authService = createAuthService(config.auth);
    
    // Initialize core services
    this.dnaEngine = new TestDNAEngine();
    this.vectorStore = createVectorDatabaseService({
      openaiApiKey: process.env['OPENAI_API_KEY'] || '',
      ...(process.env['QDRANT_URL'] && { qdrantUrl: process.env['QDRANT_URL'] }),
      ...(process.env['QDRANT_API_KEY'] && { qdrantApiKey: process.env['QDRANT_API_KEY'] }),
      ...(process.env['QDRANT_COLLECTION_NAME'] && { collectionName: process.env['QDRANT_COLLECTION_NAME'] })
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
    
    this.logger.info('Sentra Evolution API initialized', {
      environment: config.environment.nodeEnv,
      port: config.environment.api.port,
    });
  }

  /**
   * Setup Express middleware
   */
  private readonly setupMiddleware = (): void => {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: [...this.config.environment.api.corsOrigins] as string[],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Compression
    this.app.use(compression());

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(createRequestLogger(this.logger));

    // Rate limiting
    if (this.config.rateLimit.enabled) {
      const limiter = rateLimit({
        windowMs: this.config.rateLimit.windowMs,
        max: this.config.rateLimit.maxRequests,
        message: {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later.',
          },
          timestamp: new Date(),
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
          // Use authenticated user ID for rate limiting if available
          const user = (req as any).user;
          return user ? `user_${user.userId}` : req.ip || 'unknown';
        },
        skip: (req) => {
          // Skip rate limiting for health checks
          return req.path === '/health' || req.path === '/api/health';
        },
      });

      this.app.use('/api/', limiter);
    }
  };

  /**
   * Setup API routes
   */
  private readonly setupRoutes = (): void => {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date(),
          version: process.env['npm_package_version'] || '1.0.0',
          uptime: process.uptime(),
          environment: this.config.environment.nodeEnv,
          services: {
            database: 'operational', // TODO: Add actual health checks
            vectorStore: 'operational',
            dnaEngine: 'operational',
          },
        },
        timestamp: new Date(),
      });
    });

    // API documentation endpoint
    this.app.get('/api', (_req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        data: {
          name: 'Sentra Evolution API',
          version: process.env['npm_package_version'] || '1.0.0',
          description: 'Enhanced API layer for Sentra Evolutionary Agent System',
          endpoints: {
            evolution: '/api/evolution',
            health: '/health',
            docs: '/api/docs',
          },
          websocket: {
            endpoint: '/socket.io',
            events: [
              'pattern:evolved',
              'agent:status',
              'learning:outcome',
              'metrics:update',
              'system:health',
            ],
          },
        },
        timestamp: new Date(),
      });
    });

    // Evolution API routes
    const evolutionRouter = createEvolutionRouter({
      dnaEngine: this.dnaEngine,
      vectorStore: this.vectorStore,
      database: null, // TODO: Inject database connection
      logger: this.logger,
      authService: this.authService,
    });

    this.app.use('/api/evolution', evolutionRouter);

    // Performance metrics endpoint
    this.app.get('/api/metrics', (_req: Request, res: Response) => {
      const metrics = this.performanceLogger.getMetrics();
      const wsStats = this.eventBroadcaster?.getStats();

      res.status(200).json({
        success: true,
        data: {
          performance: metrics,
          websocket: wsStats,
          server: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
          },
        },
        timestamp: new Date(),
      });
    });
  };

  /**
   * Setup WebSocket server
   */
  private readonly setupWebSocket = (): void => {
    this.eventBroadcaster = new EvolutionEventBroadcaster(
      this.httpServer,
      this.authService,
      this.config.websocket,
      this.logger
    );

    this.logger.info('WebSocket server initialized', {
      corsOrigin: this.config.websocket.cors.origin,
      maxConnections: this.config.websocket.maxConnections,
    });
  };

  /**
   * Setup error handling
   */
  private readonly setupErrorHandling = (): void => {
    // 404 handler for unmatched routes
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(createErrorHandler(this.logger as ErrorLogger));

    // Graceful shutdown handlers
    process.on('SIGTERM', this.gracefulShutdown);
    process.on('SIGINT', this.gracefulShutdown);
    
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection', { 
        reason: reason instanceof Error ? reason.message : String(reason),
        promise: String(promise),
      });
    });
  };

  /**
   * Start the server
   */
  public readonly start = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer.listen(
          this.config.environment.api.port, 
          this.config.environment.api.host,
          () => {
            this.logger.info('Sentra Evolution API started', {
              host: this.config.environment.api.host,
              port: this.config.environment.api.port,
              environment: this.config.environment.nodeEnv,
              websocketEnabled: !!this.eventBroadcaster,
            });

            // Log performance metrics every 5 minutes
            setInterval(() => {
              this.performanceLogger.logSummary();
            }, 5 * 60 * 1000);

            resolve();
          }
        );

        this.httpServer.on('error', (error) => {
          this.logger.error('HTTP server error', { error: error.message });
          reject(error);
        });

      } catch (error) {
        this.logger.error('Failed to start server', { 
          error: error instanceof Error ? error.message : String(error),
        });
        reject(error);
      }
    });
  };

  /**
   * Stop the server gracefully
   */
  public readonly stop = async (): Promise<void> => {
    return new Promise((resolve) => {
      this.logger.info('Shutting down Sentra Evolution API...');

      // Close WebSocket connections
      if (this.eventBroadcaster) {
        this.eventBroadcaster.shutdown();
      }

      // Close HTTP server
      this.httpServer.close((error) => {
        if (error) {
          this.logger.error('Error during server shutdown', { error: error.message });
        } else {
          this.logger.info('Sentra Evolution API shutdown complete');
        }
        resolve();
      });
    });
  };

  /**
   * Graceful shutdown handler
   */
  private readonly gracefulShutdown = async (signal: string): Promise<void> => {
    this.logger.info(`Received ${signal}, initiating graceful shutdown...`);
    
    try {
      await this.stop();
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during graceful shutdown', { 
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  };

  /**
   * Get event broadcaster for external use
   */
  public readonly getEventBroadcaster = (): EvolutionEventBroadcaster | undefined => {
    return this.eventBroadcaster;
  };

  /**
   * Get performance logger for external use
   */
  public readonly getPerformanceLogger = (): PerformanceLogger => {
    return this.performanceLogger;
  };
}

/**
 * Factory function to create server with default configuration
 */
export const createEvolutionApi = (
  environment: EnvironmentConfig,
  overrides?: Partial<ServerConfig>
): SentraEvolutionApi => {
  const defaultConfig: ServerConfig = {
    environment,
    auth: {
      jwtSecret: process.env['JWT_SECRET'] || 'development-secret-key',
      jwtExpiresIn: '24h',
      refreshTokenExpiresIn: '7d',
      bcryptRounds: 12,
    },
    websocket: {
      cors: {
        origin: [...environment.api.corsOrigins] as string[],
        methods: ['GET', 'POST'],
      },
      connectionTimeout: 30000,
      maxConnections: 1000,
      heartbeatInterval: 60000,
    },
    rateLimit: {
      enabled: environment.nodeEnv === 'production',
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
  };

  const config = { ...defaultConfig, ...overrides };
  return new SentraEvolutionApi(config);
};

// Export main classes and functions
export default SentraEvolutionApi;