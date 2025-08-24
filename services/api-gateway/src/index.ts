import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Server } from 'http';
import { WebSocketServer } from 'ws';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

import { logger } from './utils/logger';
import { config } from './utils/config';
import { DatabaseManager } from './utils/database';
import { RedisManager } from './utils/redis';
import { VaultManager } from './utils/vault';
import { MetricsManager } from './utils/metrics';
import { authMiddleware } from './middleware/auth';
import { validationMiddleware } from './middleware/validation';
import { errorMiddleware } from './middleware/error';
import { requestLogger } from './middleware/requestLogger';

import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import apiRoutes from './routes/api';

class APIGateway {
    private app: express.Application;
    private server: Server;
    private wsServer: WebSocketServer;
    private db: DatabaseManager;
    private redis: RedisManager;
    private vault: VaultManager;
    private metrics: MetricsManager;

    constructor() {
        this.app = express();
        this.db = new DatabaseManager();
        this.redis = new RedisManager();
        this.vault = new VaultManager();
        this.metrics = new MetricsManager();
    }

    async initialize(): Promise<void> {
        try {
            // Initialize external dependencies
            await this.db.connect();
            await this.redis.connect();
            await this.vault.connect();
            await this.metrics.initialize();

            // Setup middleware
            this.setupMiddleware();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup service proxies
            this.setupServiceProxies();
            
            // Setup WebSocket server
            this.setupWebSocket();
            
            // Setup error handling
            this.setupErrorHandling();

            logger.info('API Gateway initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize API Gateway:', error);
            throw error;
        }
    }

    private setupMiddleware(): void {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));

        // CORS configuration
        this.app.use(cors({
            origin: config.cors.origins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        }));

        // Compression
        this.app.use(compression());

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: config.rateLimiting.windowMs,
            max: config.rateLimiting.maxRequests,
            message: 'Too many requests from this IP',
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);

        // Slow down repeated requests
        const speedLimiter = slowDown({
            windowMs: config.rateLimiting.windowMs,
            delayAfter: Math.floor(config.rateLimiting.maxRequests * 0.5),
            delayMs: 500,
        });
        this.app.use(speedLimiter);

        // Request logging
        this.app.use(requestLogger);

        // Metrics collection
        this.app.use(this.metrics.collectHttpMetrics());
    }

    private setupRoutes(): void {
        // Health check routes
        this.app.use('/health', healthRoutes);
        
        // Authentication routes
        this.app.use('/auth', authRoutes);
        
        // API routes (protected)
        this.app.use('/api/v1', authMiddleware, apiRoutes);
        
        // Metrics endpoint
        this.app.get('/metrics', (req, res) => {
            res.set('Content-Type', this.metrics.getContentType());
            res.end(this.metrics.getMetrics());
        });
    }

    private setupServiceProxies(): void {
        // Agent Orchestrator proxy
        this.app.use('/api/v1/agents', 
            authMiddleware,
            createProxyMiddleware({
                target: `http://agent-orchestrator:${config.services.agentOrchestrator.port}`,
                changeOrigin: true,
                pathRewrite: { '^/api/v1/agents': '/api/v1' },
                onError: (err, req, res) => {
                    logger.error('Agent Orchestrator proxy error:', err);
                    res.status(503).json({ error: 'Service temporarily unavailable' });
                },
            })
        );

        // Context Engine proxy
        this.app.use('/api/v1/contexts',
            authMiddleware,
            createProxyMiddleware({
                target: `http://context-engine:${config.services.contextEngine.port}`,
                changeOrigin: true,
                pathRewrite: { '^/api/v1/contexts': '/api/v1' },
                onError: (err, req, res) => {
                    logger.error('Context Engine proxy error:', err);
                    res.status(503).json({ error: 'Service temporarily unavailable' });
                },
            })
        );

        // Quality Guardian proxy
        this.app.use('/api/v1/quality',
            authMiddleware,
            createProxyMiddleware({
                target: `http://quality-guardian:${config.services.qualityGuardian.port}`,
                changeOrigin: true,
                pathRewrite: { '^/api/v1/quality': '/api/v1' },
                onError: (err, req, res) => {
                    logger.error('Quality Guardian proxy error:', err);
                    res.status(503).json({ error: 'Service temporarily unavailable' });
                },
            })
        );

        // Timeline Intelligence proxy
        this.app.use('/api/v1/timeline',
            authMiddleware,
            createProxyMiddleware({
                target: `http://timeline-intelligence:${config.services.timelineIntelligence.port}`,
                changeOrigin: true,
                pathRewrite: { '^/api/v1/timeline': '/api/v1' },
                onError: (err, req, res) => {
                    logger.error('Timeline Intelligence proxy error:', err);
                    res.status(503).json({ error: 'Service temporarily unavailable' });
                },
            })
        );
    }

    private setupWebSocket(): void {
        this.wsServer = new WebSocketServer({ 
            port: config.websocket.port,
            path: '/ws'
        });

        this.wsServer.on('connection', (ws, request) => {
            logger.info('WebSocket connection established');
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    logger.error('Invalid WebSocket message format:', error);
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        message: 'Invalid message format' 
                    }));
                }
            });

            ws.on('close', () => {
                logger.info('WebSocket connection closed');
            });

            ws.on('error', (error) => {
                logger.error('WebSocket error:', error);
            });
        });
    }

    private async handleWebSocketMessage(ws: any, message: any): Promise<void> {
        switch (message.type) {
            case 'subscribe':
                // Handle subscription to real-time updates
                logger.info(`Client subscribed to: ${message.channel}`);
                break;
            
            case 'unsubscribe':
                // Handle unsubscription
                logger.info(`Client unsubscribed from: ${message.channel}`);
                break;
            
            default:
                ws.send(JSON.stringify({ 
                    type: 'error', 
                    message: 'Unknown message type' 
                }));
        }
    }

    private setupErrorHandling(): void {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: 'The requested resource was not found',
                path: req.originalUrl,
            });
        });

        // Global error handler
        this.app.use(errorMiddleware);
    }

    async start(): Promise<void> {
        try {
            this.server = this.app.listen(config.port, () => {
                logger.info(`API Gateway running on port ${config.port}`);
                logger.info(`Environment: ${config.nodeEnv}`);
                logger.info(`WebSocket server running on port ${config.websocket.port}`);
            });

            // Graceful shutdown handlers
            process.on('SIGTERM', this.gracefulShutdown.bind(this));
            process.on('SIGINT', this.gracefulShutdown.bind(this));
            
        } catch (error) {
            logger.error('Failed to start API Gateway:', error);
            throw error;
        }
    }

    private async gracefulShutdown(): Promise<void> {
        logger.info('Starting graceful shutdown...');
        
        // Close WebSocket server
        this.wsServer.close();
        
        // Close HTTP server
        this.server.close(async () => {
            try {
                // Close database connections
                await this.db.disconnect();
                await this.redis.disconnect();
                await this.vault.disconnect();
                
                logger.info('Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                logger.error('Error during shutdown:', error);
                process.exit(1);
            }
        });
    }
}

// Initialize and start the API Gateway
async function main() {
    const gateway = new APIGateway();
    
    try {
        await gateway.initialize();
        await gateway.start();
    } catch (error) {
        logger.error('Failed to start API Gateway:', error);
        process.exit(1);
    }
}

// Start the application
main().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
});