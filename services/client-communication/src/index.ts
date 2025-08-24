/**
 * SENTRA Client Communication & Change Order Management Service
 * Professional project management with automated impact analysis
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { setupRoutes } from './routes';
import { setupMiddleware } from './middleware';
import { ChangeOrderProcessor } from './processors/ChangeOrderProcessor';
import { ClientCommunicationEngine } from './engines/ClientCommunicationEngine';
import { ImpactAnalysisService } from './services/ImpactAnalysisService';
import { EmailService } from './services/EmailService';
import { ReportGenerator } from './services/ReportGenerator';
import { logger } from './utils/logger';

dotenv.config();

const app = express();

// Core Services
const changeOrderProcessor = new ChangeOrderProcessor();
const clientCommunicationEngine = new ClientCommunicationEngine();
const impactAnalysisService = new ImpactAnalysisService();
const emailService = new EmailService();
const reportGenerator = new ReportGenerator();

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup middleware and routes
setupMiddleware(app);
setupRoutes(app, {
  changeOrderProcessor,
  clientCommunicationEngine,
  impactAnalysisService,
  emailService,
  reportGenerator
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'client-communication',
    version: '1.0.0',
    capabilities: [
      'change_order_processing',
      'impact_analysis',
      'client_communication',
      'professional_reporting',
      'timeline_adjustment'
    ]
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3007;

app.listen(PORT, () => {
  logger.info(`🚀 SENTRA Client Communication Service running on port ${PORT}`);
  logger.info('💼 Professional change order management enabled');
  logger.info('📧 Automated client communication ready');
  logger.info('📊 Impact analysis and timeline adjustment active');
  logger.info('📋 Executive reporting capabilities online');
});

export { app };