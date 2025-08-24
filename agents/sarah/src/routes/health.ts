import { Router, Request, Response } from 'express';
import { config } from '../utils/config';
import { MessageQueue } from '../utils/messageQueue';
import { logger } from '../utils/logger';

const healthRouter = Router();

// Basic health check
healthRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    agent: 'Sarah QA Agent',
    agentId: config.agentId,
    agentType: config.agentType,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Detailed status check
healthRouter.get('/status', (req: Request, res: Response) => {
  const sarah = req.app.locals.sarahAgent;
  
  const status = {
    agent: {
      name: 'Sarah',
      type: 'qa',
      id: config.agentId,
      version: '1.0.0',
      specialization: 'adversarial_code_review',
      capabilities: [
        'adversarial_code_review',
        'security_vulnerability_scanning',
        'performance_analysis',
        'architecture_review',
        'quality_gate_enforcement',
        'test_coverage_analysis',
        'typescript_compliance_validation',
        'drizzle_orm_enforcement'
      ],
    },
    health: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
    services: {
      messageQueue: {
        status: MessageQueue.isChannelReady() ? 'connected' : 'disconnected',
      },
      contextEngine: {
        status: 'unknown', // Would need to ping context engine
        url: config.contextEngine.url,
      },
      anthropicAI: {
        status: config.anthropic.apiKey ? 'configured' : 'not_configured',
        model: config.anthropic.model,
      },
    },
    qualityStandards: {
      minimumQualityScore: config.qualityAssurance.minimumQualityScore,
      criticalIssuesThreshold: config.qualityAssurance.criticalIssuesThreshold,
      highIssuesThreshold: config.qualityAssurance.highIssuesThreshold,
      enforceStrictTypeScript: config.qualityAssurance.enforceStrictTypeScript,
      allowAnyType: config.qualityAssurance.allowAnyType,
      allowTsIgnore: config.qualityAssurance.allowTsIgnore,
      minimumTestCoverage: config.qualityAssurance.minimumTestCoverage,
    },
    activeTasks: sarah ? sarah.getActiveTasks().length : 0,
    lastActivity: new Date().toISOString(),
  };

  res.status(200).json(status);
});

// Readiness probe for Kubernetes
healthRouter.get('/ready', async (req: Request, res: Response) => {
  try {
    const checks = {
      messageQueue: MessageQueue.isChannelReady(),
      anthropicAPI: !!config.anthropic.apiKey,
      agent: !!req.app.locals.sarahAgent,
    };

    const allReady = Object.values(checks).every(check => check);

    if (allReady) {
      res.status(200).json({
        status: 'ready',
        checks,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        checks,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Liveness probe for Kubernetes
healthRouter.get('/live', (req: Request, res: Response) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    agent: 'Sarah QA Agent',
    agentId: config.agentId,
    timestamp: new Date().toISOString(),
  });
});

// Quality standards endpoint
healthRouter.get('/quality-standards', (req: Request, res: Response) => {
  const standards = {
    agent: 'Sarah QA Agent',
    philosophy: 'Zero-tolerance adversarial code review',
    standards: {
      quality: {
        minimumScore: config.qualityAssurance.minimumQualityScore,
        criticalIssuesAllowed: config.qualityAssurance.criticalIssuesThreshold,
        highIssuesThreshold: config.qualityAssurance.highIssuesThreshold,
      },
      typescript: {
        strictMode: config.qualityAssurance.enforceStrictTypeScript,
        anyTypeAllowed: config.qualityAssurance.allowAnyType,
        tsIgnoreAllowed: config.qualityAssurance.allowTsIgnore,
        enforceTypes: true,
      },
      security: {
        vulnerabilityTolerance: 0,
        mandatorySecurityScan: config.qualityAssurance.enableSecurityScan,
        securityVulnerabilityThreshold: config.qualityAssurance.securityVulnerabilityThreshold,
      },
      architecture: {
        forbiddenPackages: config.qualityAssurance.forbiddenPackages,
        requiredPackages: config.qualityAssurance.requiredPackages,
        enforcePatterns: true,
      },
      testing: {
        minimumCoverage: config.qualityAssurance.minimumTestCoverage,
        requireTests: true,
      },
      complexity: {
        maxCyclomaticComplexity: config.qualityAssurance.maxCyclomaticComplexity,
        maxCognitiveComplexity: config.qualityAssurance.maxCognitiveComplexity,
        maxLinesPerFunction: config.qualityAssurance.maxLinesPerFunction,
        maxFunctionParameters: config.qualityAssurance.maxFunctionParameters,
      },
      performance: {
        enableAnalysis: config.qualityAssurance.enablePerformanceAnalysis,
        issueThreshold: config.qualityAssurance.performanceIssueThreshold,
      },
    },
    enforcement: {
      reviewType: 'adversarial',
      blockOnCritical: true,
      blockOnHighIssues: true,
      requiresHumanOverride: false,
    },
    lastUpdated: new Date().toISOString(),
  };

  res.status(200).json(standards);
});

export { healthRouter };