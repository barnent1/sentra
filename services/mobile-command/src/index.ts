/**
 * SENTRA Mobile Command & Control Engine
 * Work-From-Anywhere system with intelligent agent autonomy
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { setupRoutes } from './routes';
import { setupMiddleware } from './middleware';
import { MobileCommandEngine } from './engines/MobileCommandEngine';
import { VoiceCommandProcessor } from './processors/VoiceCommandProcessor';
import { AgentAutonomyManager } from './managers/AgentAutonomyManager';
import { DeviceSync } from './sync/DeviceSync';
import { logger } from './utils/logger';
import { NotificationService } from './services/NotificationService';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Core Services
const mobileCommandEngine = new MobileCommandEngine();
const voiceCommandProcessor = new VoiceCommandProcessor();
const agentAutonomyManager = new AgentAutonomyManager();
const deviceSync = new DeviceSync();
const notificationService = new NotificationService();

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
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
  mobileCommandEngine,
  voiceCommandProcessor,
  agentAutonomyManager,
  deviceSync,
  notificationService
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Mobile client connected: ${socket.id}`);

  socket.on('authenticate', async (data) => {
    try {
      const { userId, deviceType, deviceId } = data;
      
      // Register device with sync system
      await deviceSync.registerDevice(userId, deviceType, deviceId, socket);
      
      socket.emit('authenticated', { 
        success: true, 
        deviceId,
        syncStatus: 'ready' 
      });
      
      // Send initial project status
      const projects = await mobileCommandEngine.getUserProjects(userId);
      socket.emit('projectsUpdate', projects);
      
    } catch (error) {
      logger.error('Authentication failed:', error);
      socket.emit('authError', { message: 'Authentication failed' });
    }
  });

  socket.on('voiceCommand', async (data) => {
    try {
      const { userId, command, context } = data;
      
      logger.info(`Voice command received: ${command}`);
      
      const result = await voiceCommandProcessor.processCommand(
        userId, 
        command, 
        context
      );
      
      socket.emit('commandResult', result);
      
      // Broadcast command execution to all user devices
      await deviceSync.broadcastToUserDevices(userId, 'commandExecuted', {
        command,
        result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Voice command processing failed:', error);
      socket.emit('commandError', { message: 'Command processing failed' });
    }
  });

  socket.on('requestProjectStatus', async (data) => {
    try {
      const { userId, projectId } = data;
      
      const status = await mobileCommandEngine.getProjectStatus(
        userId, 
        projectId
      );
      
      socket.emit('projectStatusUpdate', { projectId, status });
      
    } catch (error) {
      logger.error('Project status request failed:', error);
      socket.emit('statusError', { message: 'Status request failed' });
    }
  });

  socket.on('agentAction', async (data) => {
    try {
      const { userId, action, agentId, parameters } = data;
      
      const result = await agentAutonomyManager.handleMobileAction(
        userId,
        action,
        agentId,
        parameters
      );
      
      socket.emit('agentActionResult', result);
      
    } catch (error) {
      logger.error('Agent action failed:', error);
      socket.emit('agentActionError', { message: 'Agent action failed' });
    }
  });

  socket.on('syncRequest', async (data) => {
    try {
      const { userId, deviceId, syncType } = data;
      
      const syncData = await deviceSync.getSyncData(
        userId, 
        deviceId, 
        syncType
      );
      
      socket.emit('syncData', syncData);
      
    } catch (error) {
      logger.error('Sync request failed:', error);
      socket.emit('syncError', { message: 'Sync request failed' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Mobile client disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mobile-command',
    version: '1.0.0'
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3006;

server.listen(PORT, () => {
  logger.info(`🚀 SENTRA Mobile Command Engine running on port ${PORT}`);
  logger.info('✅ Work-From-Anywhere capabilities enabled');
  logger.info('📱 Mobile command & control ready');
  logger.info('🎤 Voice command processing active');
  logger.info('🔄 Device synchronization enabled');
});

export { app, server, io };