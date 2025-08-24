import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { DatabaseManager } from './utils/database';
import { RedisManager } from './utils/redis';
import { MessageQueue } from './utils/messageQueue';
import { MetricsCollector } from './utils/metrics';
import { contextRoutes } from './routes/context';
import { healthRoutes } from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { ContextEngine } from './services/contextEngine';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Routes
app.use('/health', healthRoutes);
app.use('/api/context', contextRoutes);

// Error handling
app.use(errorHandler);

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

let server: any;
let contextEngine: ContextEngine;

async function startup() {
  try {
    logger.info('Starting SENTRA Context Engine...');

    // Initialize database
    await DatabaseManager.connect();
    logger.info('Database connected');

    // Initialize Redis
    await RedisManager.connect();
    logger.info('Redis connected');

    // Initialize message queue
    await MessageQueue.connect();
    logger.info('Message queue connected');

    // Initialize metrics
    MetricsCollector.initialize();
    logger.info('Metrics initialized');

    // Initialize context engine
    contextEngine = new ContextEngine();
    await contextEngine.initialize();
    logger.info('Context engine initialized');

    // Start server
    server = app.listen(config.port, () => {
      logger.info(`Context Engine server running on port ${config.port}`);
    });

  } catch (error) {
    logger.error('Failed to start Context Engine:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  if (contextEngine) {
    await contextEngine.shutdown();
  }

  await MessageQueue.disconnect();
  await RedisManager.disconnect();
  await DatabaseManager.disconnect();

  logger.info('Graceful shutdown completed');
  process.exit(0);
}

startup();