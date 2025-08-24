import express from 'express';
import { SarahAgent } from './services/sarahAgent';
import { MessageQueue } from './utils/messageQueue';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { healthRouter } from './routes/health';
import { tasksRouter } from './routes/tasks';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

async function startSarahAgent(): Promise<void> {
  logger.info('Starting Sarah QA Agent...');

  try {
    // Initialize Express app
    const app = express();

    // Middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(requestLogger);

    // Routes
    app.use('/health', healthRouter);
    app.use('/api/tasks', tasksRouter);

    // Error handling
    app.use(errorHandler);

    // Initialize message queue
    await MessageQueue.initialize();

    // Initialize Sarah agent
    const sarah = new SarahAgent();
    await sarah.initialize();

    // Store agent instance for routes
    app.locals.sarahAgent = sarah;

    // Start server
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info('Sarah QA Agent started successfully', {
        port: config.server.port,
        host: config.server.host,
        agentId: config.agentId,
        agentType: config.agentType,
        capabilities: [
          'adversarial_code_review',
          'security_vulnerability_scanning',
          'performance_analysis', 
          'architecture_review',
          'quality_gate_enforcement',
          'test_coverage_analysis'
        ]
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Sarah received ${signal}, initiating graceful shutdown...`);
      
      server.close(async () => {
        try {
          await sarah.shutdown();
          await MessageQueue.shutdown();
          logger.info('Sarah QA Agent shutdown complete');
          process.exit(0);
        } catch (error) {
          logger.error('Error during Sarah shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Sarah forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Sarah uncaught exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Sarah unhandled rejection:', { reason, promise });
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start Sarah QA Agent:', error);
    process.exit(1);
  }
}

// Start the agent
if (require.main === module) {
  startSarahAgent();
}

export { startSarahAgent };