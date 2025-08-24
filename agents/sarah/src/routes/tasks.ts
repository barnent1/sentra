import { Router, Request, Response } from 'express';
import { config } from '../utils/config';
import { logger, qaLogger } from '../utils/logger';

const tasksRouter = Router();

// Get current task context and workspace info
tasksRouter.get('/context', (req: Request, res: Response) => {
  const sarah = req.app.locals.sarahAgent;
  
  if (!sarah) {
    return res.status(503).json({
      error: 'Sarah QA Agent not initialized',
      timestamp: new Date().toISOString(),
    });
  }

  const context = {
    agent: {
      name: 'Sarah',
      type: 'qa',
      id: config.agentId,
      specialization: 'adversarial_code_review',
    },
    activeTasks: sarah.getActiveTasks().map((task: any) => ({
      id: task.id,
      type: task.type,
      status: task.status,
      progress: task.progress,
      startedAt: task.startedAt,
      contextId: task.contextId,
    })),
    qualityStandards: {
      minimumScore: config.qualityAssurance.minimumQualityScore,
      criticalTolerance: config.qualityAssurance.criticalIssuesThreshold,
      highTolerance: config.qualityAssurance.highIssuesThreshold,
      testCoverageMinimum: config.qualityAssurance.minimumTestCoverage,
      strictTypeScript: config.qualityAssurance.enforceStrictTypeScript,
    },
    capabilities: [
      'adversarial_code_review',
      'security_vulnerability_scanning',
      'performance_bottleneck_detection',
      'architecture_validation',
      'typescript_compliance_enforcement',
      'quality_gate_blocking',
      'zero_tolerance_enforcement'
    ],
    reviewPhilosophy: {
      approach: 'adversarial',
      tolerance: 'zero',
      focus: 'finding_problems',
      blocking: 'critical_and_high_issues',
    },
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(context);
});

// Get workspace information
tasksRouter.get('/workspace', (req: Request, res: Response) => {
  const workspace = {
    agent: 'Sarah QA Agent',
    workspaceType: 'quality_assurance',
    capabilities: {
      staticCodeAnalysis: true,
      securityScanning: true,
      performanceAnalysis: true,
      architectureValidation: true,
      testCoverageAnalysis: true,
      complexityAnalysis: true,
      adversarialReview: true,
    },
    supportedFileTypes: [
      '.ts', '.tsx', '.js', '.jsx',
      '.json', '.md', '.yml', '.yaml'
    ],
    reviewTypes: [
      'code_review',
      'security_review', 
      'performance_review',
      'architecture_review',
      'quality_audit',
      'test_coverage_analysis'
    ],
    qualityGates: {
      criticalIssueBlock: true,
      highIssueThreshold: config.qualityAssurance.highIssuesThreshold,
      securityVulnerabilityBlock: true,
      testCoverageEnforcement: true,
      typeScriptStrictnessEnforcement: true,
      architecturePatternEnforcement: true,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(workspace);
});

// Trigger manual code review
tasksRouter.post('/review', async (req: Request, res: Response) => {
  try {
    const sarah = req.app.locals.sarahAgent;
    
    if (!sarah) {
      return res.status(503).json({
        error: 'Sarah QA Agent not initialized',
        timestamp: new Date().toISOString(),
      });
    }

    const { filePaths, reviewType = 'code_review', options = {} } = req.body;

    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return res.status(400).json({
        error: 'filePaths array is required',
        timestamp: new Date().toISOString(),
      });
    }

    const taskId = `manual_review_${Date.now()}`;
    
    // Log review initiation
    qaLogger.reviewStarted(taskId, filePaths);

    // Trigger manual review task
    const taskData = {
      taskId,
      type: reviewType,
      data: {
        filePaths,
        reviewMode: 'adversarial',
        triggeredBy: 'manual',
        ...options,
      },
    };

    // Execute review asynchronously
    sarah.executeTaskDirectly(taskData)
      .then((result: any) => {
        qaLogger.reviewCompleted(taskId, result.approved, result.qualityScore, result.issues.length);
      })
      .catch((error: Error) => {
        logger.error('Manual review failed:', { taskId, error });
      });

    res.status(202).json({
      message: 'Code review initiated by Sarah',
      taskId,
      reviewType,
      filePaths,
      status: 'in_progress',
      estimatedDuration: filePaths.length * 30, // 30 seconds per file estimate
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Manual review request failed:', error);
    res.status(500).json({
      error: 'Failed to initiate code review',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Get review results
tasksRouter.get('/review/:taskId', (req: Request, res: Response) => {
  const sarah = req.app.locals.sarahAgent;
  const { taskId } = req.params;
  
  if (!sarah) {
    return res.status(503).json({
      error: 'Sarah QA Agent not initialized',
      timestamp: new Date().toISOString(),
    });
  }

  const task = sarah.getTask(taskId);
  
  if (!task) {
    return res.status(404).json({
      error: 'Review task not found',
      taskId,
      timestamp: new Date().toISOString(),
    });
  }

  const response = {
    taskId,
    status: task.status,
    progress: task.progress,
    startedAt: task.startedAt,
    type: task.type,
    contextId: task.contextId,
    ...(task.result && { result: task.result }),
    ...(task.error && { error: task.error }),
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
});

// Get quality gate status
tasksRouter.get('/quality-gate/:taskId', (req: Request, res: Response) => {
  const sarah = req.app.locals.sarahAgent;
  const { taskId } = req.params;
  
  if (!sarah) {
    return res.status(503).json({
      error: 'Sarah QA Agent not initialized',
      timestamp: new Date().toISOString(),
    });
  }

  const task = sarah.getTask(taskId);
  
  if (!task || !task.result) {
    return res.status(404).json({
      error: 'Quality gate results not available',
      taskId,
      timestamp: new Date().toISOString(),
    });
  }

  const result = task.result;
  const criticalIssues = result.issues?.filter((i: any) => i.severity === 'critical').length || 0;
  const highIssues = result.issues?.filter((i: any) => i.severity === 'high').length || 0;

  const qualityGateStatus = {
    taskId,
    approved: result.approved,
    blocked: !result.approved,
    qualityScore: result.qualityScore,
    gate: {
      criticalIssues: {
        count: criticalIssues,
        threshold: config.qualityAssurance.criticalIssuesThreshold,
        passed: criticalIssues <= config.qualityAssurance.criticalIssuesThreshold,
        blocking: criticalIssues > config.qualityAssurance.criticalIssuesThreshold,
      },
      highIssues: {
        count: highIssues,
        threshold: config.qualityAssurance.highIssuesThreshold,
        passed: highIssues <= config.qualityAssurance.highIssuesThreshold,
        blocking: highIssues > config.qualityAssurance.highIssuesThreshold,
      },
      qualityScore: {
        score: result.qualityScore,
        threshold: config.qualityAssurance.minimumQualityScore,
        passed: result.qualityScore >= config.qualityAssurance.minimumQualityScore,
      },
      securityScan: {
        vulnerabilities: result.securityAssessment?.vulnerabilities?.length || 0,
        criticalVulnerabilities: result.securityAssessment?.vulnerabilities?.filter((v: any) => v.severity === 'critical').length || 0,
        passed: (result.securityAssessment?.vulnerabilities?.filter((v: any) => v.severity === 'critical').length || 0) === 0,
      },
    },
    reviewedBy: 'Sarah',
    reviewType: 'adversarial',
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(qualityGateStatus);
});

// Cancel active review task
tasksRouter.delete('/review/:taskId', async (req: Request, res: Response) => {
  try {
    const sarah = req.app.locals.sarahAgent;
    const { taskId } = req.params;
    
    if (!sarah) {
      return res.status(503).json({
        error: 'Sarah QA Agent not initialized',
        timestamp: new Date().toISOString(),
      });
    }

    const cancelled = await sarah.cancelTask(taskId);
    
    if (cancelled) {
      logger.info('Review task cancelled:', { taskId });
      res.status(200).json({
        message: 'Review task cancelled by request',
        taskId,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(404).json({
        error: 'Review task not found or not cancellable',
        taskId,
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error('Task cancellation failed:', { taskId: req.params.taskId, error });
    res.status(500).json({
      error: 'Failed to cancel review task',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Get Sarah's review statistics
tasksRouter.get('/stats', (req: Request, res: Response) => {
  const sarah = req.app.locals.sarahAgent;
  
  if (!sarah) {
    return res.status(503).json({
      error: 'Sarah QA Agent not initialized',
      timestamp: new Date().toISOString(),
    });
  }

  const stats = sarah.getReviewStatistics();
  
  res.status(200).json({
    agent: 'Sarah QA Agent',
    reviewType: 'adversarial',
    statistics: {
      ...stats,
      qualityPhilosophy: 'Zero tolerance for critical issues',
      averageReviewTime: stats.averageReviewTime || 'N/A',
      rejectionRate: stats.rejectionRate || 0,
      mostCommonIssues: stats.mostCommonIssues || [],
    },
    timestamp: new Date().toISOString(),
  });
});

export { tasksRouter };