#!/usr/bin/env node

/**
 * Simple working Sentra Evolution API server for testing
 * Stripped down version to demonstrate basic functionality
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

const app = express();
const PORT = Number(process.env['API_PORT']) || 3001;
const HOST = process.env['API_HOST'] || '0.0.0.0';

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(compression());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date(),
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development',
      services: {
        api: 'operational',
        database: 'mocked',
        dnaEngine: 'mocked',
      },
    },
    timestamp: new Date(),
  });
});

// API documentation endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'Sentra Evolution API',
      version: '1.0.0',
      description: 'Enhanced API layer for Sentra Evolutionary Agent System - EPIC 7 Implementation',
      endpoints: {
        health: '/health',
        patterns: '/api/evolution/patterns',
        agents: '/api/evolution/agents',
        metrics: '/api/metrics',
        docs: '/api',
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

// Mock evolution patterns endpoint
app.get('/api/evolution/patterns', (_req: Request, res: Response) => {
  const mockPatterns = [
    {
      id: 'pattern_001',
      patternType: 'analytical',
      genetics: {
        patternRecognition: 0.8,
        adaptabilityScore: 0.7,
        communicationStyle: 'detailed',
        problemSolvingApproach: 'systematic',
        collaborationPreference: 'team-based',
      },
      performance: {
        successRate: 0.85,
        averageTaskCompletionTime: 4200,
        codeQualityScore: 0.78,
        userSatisfactionRating: 0.82,
        adaptationSpeed: 0.65,
        errorRecoveryRate: 0.73,
      },
      projectContext: {
        projectType: 'web-app',
        techStack: ['typescript', 'react', 'node.js'],
        complexity: 'medium',
        teamSize: 5,
        timeline: '3 months',
        requirements: ['responsive design', 'authentication'],
      },
      generation: 3,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    },
    {
      id: 'pattern_002',
      patternType: 'creative',
      genetics: {
        patternRecognition: 0.6,
        adaptabilityScore: 0.9,
        communicationStyle: 'collaborative',
        problemSolvingApproach: 'innovative',
        collaborationPreference: 'pair-programming',
      },
      performance: {
        successRate: 0.75,
        averageTaskCompletionTime: 5800,
        codeQualityScore: 0.71,
        userSatisfactionRating: 0.88,
        adaptationSpeed: 0.84,
        errorRecoveryRate: 0.69,
      },
      projectContext: {
        projectType: 'api',
        techStack: ['python', 'fastapi', 'postgresql'],
        complexity: 'high',
        teamSize: 3,
        timeline: '6 months',
        requirements: ['scalability', 'real-time processing'],
      },
      generation: 5,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
    },
  ];

  res.json({
    success: true,
    data: {
      items: mockPatterns,
      pagination: {
        page: 1,
        limit: 20,
        total: mockPatterns.length,
        pages: 1,
      },
    },
    timestamp: new Date(),
  });
});

// Mock create pattern endpoint
app.post('/api/evolution/patterns', (req: Request, res: Response) => {
  const newPattern = {
    id: `pattern_${Date.now()}`,
    ...req.body,
    generation: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  res.status(201).json({
    success: true,
    data: newPattern,
    timestamp: new Date(),
  });
});

// Mock evolve pattern endpoint
app.post('/api/evolution/patterns/evolve', (req: Request, res: Response) => {
  const { patternId, feedback } = req.body;
  
  const evolvedPattern = {
    id: `evolved_${Date.now()}`,
    patternType: 'evolved_analytical',
    genetics: {
      patternRecognition: Math.min(1.0, 0.8 + (feedback?.performanceImprovement || 0) * 0.1),
      adaptabilityScore: Math.min(1.0, 0.7 + (feedback?.performanceImprovement || 0) * 0.05),
      communicationStyle: 'enhanced_detailed',
      problemSolvingApproach: 'adaptive_systematic',
      collaborationPreference: 'intelligent_team-based',
    },
    performance: {
      successRate: Math.min(1.0, 0.85 + (feedback?.performanceImprovement || 0) * 0.1),
      averageTaskCompletionTime: Math.max(1000, 4200 - (feedback?.performanceImprovement || 0) * 500),
      codeQualityScore: Math.min(1.0, 0.78 + (feedback?.performanceImprovement || 0) * 0.08),
      userSatisfactionRating: Math.min(1.0, 0.82 + (feedback?.performanceImprovement || 0) * 0.12),
      adaptationSpeed: Math.min(1.0, 0.65 + (feedback?.performanceImprovement || 0) * 0.15),
      errorRecoveryRate: Math.min(1.0, 0.73 + (feedback?.performanceImprovement || 0) * 0.1),
    },
    parentId: patternId,
    generation: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  res.json({
    success: true,
    data: evolvedPattern,
    timestamp: new Date(),
  });
});

// Mock agents endpoint
app.get('/api/evolution/agents', (_req: Request, res: Response) => {
  const mockAgents = [
    {
      id: 'agent_001',
      evolutionDnaId: 'pattern_001',
      name: 'Analytical Agent Alpha',
      role: 'Senior Developer',
      status: 'active',
      spawnedAt: new Date('2024-01-02'),
      lastActiveAt: new Date(),
      performanceHistory: [],
    },
  ];

  res.json({
    success: true,
    data: {
      items: mockAgents,
      pagination: {
        page: 1,
        limit: 20,
        total: mockAgents.length,
        pages: 1,
      },
    },
    timestamp: new Date(),
  });
});

// Mock spawn agent endpoint
app.post('/api/evolution/agents/spawn', (req: Request, res: Response) => {
  const newAgent = {
    id: `agent_${Date.now()}`,
    ...req.body,
    status: 'active',
    spawnedAt: new Date(),
    lastActiveAt: new Date(),
    performanceHistory: [],
  };

  res.status(201).json({
    success: true,
    data: newAgent,
    timestamp: new Date(),
  });
});

// Mock metrics endpoint
app.get('/api/metrics', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      performance: {
        'evolution_operations_total': 42,
        'api_requests_total': 1337,
        'websocket_connections_active': 5,
      },
      websocket: {
        totalConnections: 5,
        connectionsByRole: {
          admin: 1,
          user: 3,
          readonly: 1,
        },
      },
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    },
    timestamp: new Date(),
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
    },
    timestamp: new Date(),
  });
});

// Error handler
app.use((error: Error, _req: Request, res: Response, _next: any) => {
  console.error('Error:', error);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env['NODE_ENV'] === 'production' 
        ? 'Internal server error' 
        : error.message,
    },
    timestamp: new Date(),
  });
});

// Start server
const server = app.listen(PORT, HOST as string, () => {
  console.log('🧬 Sentra Evolution API (Simple Version) is running!');
  console.log(`📡 Server: http://${HOST}:${PORT}`);
  console.log(`🏥 Health: http://${HOST}:${PORT}/health`);
  console.log(`📖 Docs: http://${HOST}:${PORT}/api`);
  console.log(`📊 Metrics: http://${HOST}:${PORT}/api/metrics`);
  console.log('');
  console.log('Available Endpoints:');
  console.log('  GET  /health                           - Health check');
  console.log('  GET  /api                              - API documentation');
  console.log('  GET  /api/evolution/patterns           - List DNA patterns');
  console.log('  POST /api/evolution/patterns           - Create DNA pattern');
  console.log('  POST /api/evolution/patterns/evolve    - Evolve DNA pattern');
  console.log('  GET  /api/evolution/agents             - List agents');
  console.log('  POST /api/evolution/agents/spawn       - Spawn agent');
  console.log('  GET  /api/metrics                      - Performance metrics');
  console.log('');
  console.log('Press Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});