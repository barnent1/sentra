import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { MessageQueue } from './utils/messageQueue';
import { ContextClient } from './utils/contextClient';
import { healthRoutes } from './routes/health';
import { taskRoutes } from './routes/tasks';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { JamesAgent } from './services/jamesAgent';

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
app.use('/api/tasks', taskRoutes);

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
let jamesAgent: JamesAgent;

async function startup() {
  try {
    logger.info('Starting James Development Agent...');

    // Initialize message queue
    await MessageQueue.connect();
    logger.info('Message queue connected');

    // Initialize context client
    await ContextClient.initialize();
    logger.info('Context client initialized');

    // Initialize James agent
    jamesAgent = new JamesAgent();
    await jamesAgent.initialize();
    logger.info('James agent initialized');

    // Start server
    server = app.listen(config.port, () => {
      logger.info(`James agent running on port ${config.port}`);
    });

    // Send ready signal to orchestrator
    await MessageQueue.publishAgentEvent('ready', config.agentId, {
      agentType: 'code_analyzer',
      capabilities: [
        'code_analysis',
        'code_generation',
        'context_preservation',
        'documentation_generation',
        'testing',
        'refactoring',
      ],
      version: '1.0.0',
    });

  } catch (error) {
    logger.error('Failed to start James agent:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Send shutdown signal to orchestrator
  await MessageQueue.publishAgentEvent('shutting_down', config.agentId, {});

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  if (jamesAgent) {
    await jamesAgent.shutdown();
  }

  await ContextClient.shutdown();
  await MessageQueue.disconnect();

  logger.info('Graceful shutdown completed');
  process.exit(0);
}

startup();