import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { initializeDatabase } from './utils/database';
import { initializeRedis } from './utils/redis';
import { SecurityMiddleware } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Routes
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import mfaRoutes from './routes/mfa';
import sessionRoutes from './routes/session';

const app = express();

// Initialize security middleware
const securityMiddleware = new SecurityMiddleware();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  maxAge: 86400 // 24 hours
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too Many Authentication Attempts',
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const mfaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 MFA attempts per windowMs
  message: {
    error: 'Too Many MFA Attempts',
    message: 'Too many MFA attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalLimiter);

// Request parsing
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook signature verification
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(securityMiddleware.inputSanitization);
app.use(securityMiddleware.xssProtection);
app.use(securityMiddleware.sqlInjectionProtection);

// Request logging
app.use(requestLogger);

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/mfa', mfaLimiter, mfaRoutes);
app.use('/api/session', sessionRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    timestamp: new Date().toISOString()
  });
});

// Initialize services and start server
const startServer = async (): Promise<void> => {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Initialize Redis
    await initializeRedis();
    logger.info('Redis initialized successfully');

    // Start server
    const port = config.server.port;
    app.listen(port, () => {
      logger.info(`SENTRA Authentication Service listening on port ${port}`, {
        environment: config.environment,
        nodeVersion: process.version,
        pid: process.pid
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start authentication service:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();