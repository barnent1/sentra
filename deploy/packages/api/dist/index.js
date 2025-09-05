"use strict";
/**
 * Sentra Evolution API Server - Enhanced API Layer Implementation
 * Following SENTRA project standards: strict TypeScript with branded types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEvolutionApi = exports.SentraEvolutionApi = void 0;
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const http_1 = require("http");
const cors_1 = tslib_1.__importDefault(require("cors"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const compression_1 = tslib_1.__importDefault(require("compression"));
const express_rate_limit_1 = tslib_1.__importDefault(require("express-rate-limit"));
const dotenv_1 = require("dotenv");
const core_1 = require("@sentra/core");
const config_1 = require("./logger/config");
const auth_1 = require("./middleware/auth");
const error_handler_1 = require("./middleware/error-handler");
const evolution_1 = require("./routes/evolution");
const event_system_1 = require("./websocket/event-system");
// Load environment variables
(0, dotenv_1.config)();
/**
 * Enhanced Sentra Evolution API Server
 */
class SentraEvolutionApi {
    config;
    app;
    httpServer;
    logger;
    authService;
    performanceLogger;
    // Core services
    dnaEngine;
    vectorStore; // TODO: Type when fully integrated
    eventBroadcaster;
    constructor(config) {
        this.config = config;
        this.app = (0, express_1.default)();
        this.httpServer = (0, http_1.createServer)(this.app);
        // Initialize logging
        this.logger = (0, config_1.createLogger)(config.environment);
        this.performanceLogger = new config_1.PerformanceLogger(this.logger);
        // Initialize authentication
        this.authService = (0, auth_1.createAuthService)(config.auth);
        // Initialize core services
        this.dnaEngine = new core_1.TestDNAEngine();
        this.vectorStore = (0, core_1.createVectorDatabaseService)({
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
    setupMiddleware = () => {
        // Security middleware
        this.app.use((0, helmet_1.default)({
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
        this.app.use((0, cors_1.default)({
            origin: [...this.config.environment.api.corsOrigins],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        }));
        // Compression
        this.app.use((0, compression_1.default)());
        // Request parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Request logging
        this.app.use((0, config_1.createRequestLogger)(this.logger));
        // Rate limiting
        if (this.config.rateLimit.enabled) {
            const limiter = (0, express_rate_limit_1.default)({
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
                    const user = req.user;
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
    setupRoutes = () => {
        // Health check endpoint
        this.app.get('/health', (_req, res) => {
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
        this.app.get('/api', (_req, res) => {
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
        const evolutionRouter = (0, evolution_1.createEvolutionRouter)({
            dnaEngine: this.dnaEngine,
            vectorStore: this.vectorStore,
            database: null, // TODO: Inject database connection
            logger: this.logger,
            authService: this.authService,
        });
        this.app.use('/api/evolution', evolutionRouter);
        // Performance metrics endpoint
        this.app.get('/api/metrics', (_req, res) => {
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
    setupWebSocket = () => {
        this.eventBroadcaster = new event_system_1.EvolutionEventBroadcaster(this.httpServer, this.authService, this.config.websocket, this.logger);
        this.logger.info('WebSocket server initialized', {
            corsOrigin: this.config.websocket.cors.origin,
            maxConnections: this.config.websocket.maxConnections,
        });
    };
    /**
     * Setup error handling
     */
    setupErrorHandling = () => {
        // 404 handler for unmatched routes
        this.app.use(error_handler_1.notFoundHandler);
        // Global error handler
        this.app.use((0, error_handler_1.createErrorHandler)(this.logger));
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
    start = async () => {
        return new Promise((resolve, reject) => {
            try {
                this.httpServer.listen(this.config.environment.api.port, this.config.environment.api.host, () => {
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
                });
                this.httpServer.on('error', (error) => {
                    this.logger.error('HTTP server error', { error: error.message });
                    reject(error);
                });
            }
            catch (error) {
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
    stop = async () => {
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
                }
                else {
                    this.logger.info('Sentra Evolution API shutdown complete');
                }
                resolve();
            });
        });
    };
    /**
     * Graceful shutdown handler
     */
    gracefulShutdown = async (signal) => {
        this.logger.info(`Received ${signal}, initiating graceful shutdown...`);
        try {
            await this.stop();
            process.exit(0);
        }
        catch (error) {
            this.logger.error('Error during graceful shutdown', {
                error: error instanceof Error ? error.message : String(error),
            });
            process.exit(1);
        }
    };
    /**
     * Get event broadcaster for external use
     */
    getEventBroadcaster = () => {
        return this.eventBroadcaster;
    };
    /**
     * Get performance logger for external use
     */
    getPerformanceLogger = () => {
        return this.performanceLogger;
    };
}
exports.SentraEvolutionApi = SentraEvolutionApi;
/**
 * Factory function to create server with default configuration
 */
const createEvolutionApi = (environment, overrides) => {
    const defaultConfig = {
        environment,
        auth: {
            jwtSecret: process.env['JWT_SECRET'] || 'development-secret-key',
            jwtExpiresIn: '24h',
            refreshTokenExpiresIn: '7d',
            bcryptRounds: 12,
        },
        websocket: {
            cors: {
                origin: [...environment.api.corsOrigins],
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
exports.createEvolutionApi = createEvolutionApi;
// Export main classes and functions
exports.default = SentraEvolutionApi;
//# sourceMappingURL=index.js.map