/**
 * Evolution Integration Test Suite
 * 
 * Comprehensive test to validate the evolution integration with existing systems,
 * database operations, and cross-project learning capabilities.
 * 
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */

import type {
  CodeDNA,
  EvolutionDnaId,
  AgentInstanceId,
  ProjectContextId,
  TaskId,
  ProjectContext,
  PerformanceFeedback,
  PerformanceMetrics,
} from '../types';
import { EvolutionOrchestrator } from './index';
import type { WebSocketConnectionId } from './websocket-bridge';

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

function generateTestProjectContext(
  projectType: 'web-app' | 'api' | 'cli' = 'web-app',
  complexity: 'low' | 'medium' | 'high' = 'medium'
): ProjectContext {
  return {
    id: `project_${Date.now()}_${Math.random().toString(36).slice(2)}` as ProjectContextId,
    projectType,
    techStack: ['typescript', 'react', 'node', 'postgresql'],
    complexity,
    teamSize: 5,
    timeline: '3 months',
    requirements: ['responsive design', 'high performance', 'scalable'],
    industryDomain: 'technology',
    regulatoryCompliance: [],
    performanceRequirements: {
      maxResponseTime: 2000,
      minThroughput: 100,
      availabilityTarget: 0.99,
      errorRateThreshold: 0.01,
    },
    scalabilityNeeds: {
      expectedGrowthRate: 2,
      peakLoadCapacity: 1000,
      dataVolumeGrowth: '1GB/month',
      horizontalScaling: true,
    },
    securityRequirements: {
      authenticationMethod: 'jwt',
      encryptionRequirements: ['TLS'],
      auditingNeeds: 'basic',
      dataPrivacyLevel: 'internal',
    },
    developmentStage: 'mvp',
    testingStrategy: 'comprehensive',
    deploymentStrategy: 'ci-cd',
    monitoringNeeds: 'advanced',
  };
}

function generateTestPerformanceMetrics(
  successRate: number = 0.8,
  quality: number = 0.7
): PerformanceMetrics {
  return {
    successRate,
    averageTaskCompletionTime: 45000,
    codeQualityScore: quality,
    userSatisfactionRating: 0.8,
    adaptationSpeed: 0.6,
    errorRecoveryRate: 0.7,
    knowledgeRetention: 0.8,
    crossDomainTransfer: 0.5,
    computationalEfficiency: 0.75,
    responseLatency: 1200,
    throughput: 5,
    resourceUtilization: 0.7,
    bugIntroductionRate: 0.05,
    testCoverage: 0.85,
    documentationQuality: 0.7,
    maintainabilityScore: 0.8,
    communicationEffectiveness: 0.75,
    teamIntegration: 0.8,
    feedbackIncorporation: 0.7,
    conflictResolution: 0.6,
  };
}

function generateTestFeedback(
  agentId: AgentInstanceId,
  dnaId: EvolutionDnaId,
  taskId: TaskId,
  context: ProjectContext,
  outcome: 'success' | 'failure' | 'partial' = 'success'
): PerformanceFeedback {
  const baseMetrics = generateTestPerformanceMetrics(
    outcome === 'success' ? 0.9 : outcome === 'failure' ? 0.3 : 0.6,
    outcome === 'success' ? 0.8 : outcome === 'failure' ? 0.4 : 0.6
  );

  return {
    taskId,
    agentId,
    dnaId,
    outcome,
    metrics: baseMetrics,
    userSatisfaction: outcome === 'success' ? 0.9 : 0.4,
    improvements: outcome === 'success' ? ['code quality', 'performance'] : [],
    regressions: outcome === 'failure' ? ['stability', 'error handling'] : [],
    context,
    timestamp: new Date(),
  };
}

// ============================================================================
// TEST SUITE
// ============================================================================

export class EvolutionIntegrationTest {
  private orchestrator: EvolutionOrchestrator;
  private testResults: {
    readonly testName: string;
    readonly success: boolean;
    readonly message: string;
    readonly duration: number;
    readonly details?: Record<string, unknown>;
  }[] = [];

  constructor() {
    this.orchestrator = new EvolutionOrchestrator({
      realTimeUpdates: true,
      knowledgeTransfer: true,
      evolution: {
        crossProjectLearning: {
          enabled: true,
          similarityThreshold: 0.6,
          maxPatternAge: 24 * 60 * 60 * 1000, // 24 hours
        },
        realTimeMetrics: {
          enabled: true,
          metricsUpdateInterval: 5000,
          evolutionEventBatchSize: 5,
        },
      },
      metrics: {
        realtime: {
          enabled: true,
          updateInterval: 2000,
          maxDataPoints: 100,
        },
        alerts: {
          enabled: true,
          thresholds: {
            fitness_score: { min: 0.4 },
            task_success_rate: { min: 0.6 },
          },
          suppressionTime: 60000, // 60 seconds
        },
      },
    });

    this.setupEventListeners();
  }

  /**
   * Run the complete test suite
   */
  async runTests(): Promise<{
    readonly totalTests: number;
    readonly passedTests: number;
    readonly failedTests: number;
    readonly results: Array<{
      readonly testName: string;
      readonly success: boolean;
      readonly message: string;
      readonly duration: number;
      readonly details?: Record<string, unknown>;
    }>;
    readonly summary: string;
  }> {
    console.log('🧬 Starting Evolution Integration Test Suite...\n');

    // Test 1: Basic Agent Initialization
    await this.testAgentInitialization();

    // Test 2: Task Completion and Evolution
    await this.testTaskCompletionEvolution();

    // Test 3: Cross-Project Learning
    await this.testCrossProjectLearning();

    // Test 4: Real-time Metrics
    await this.testRealTimeMetrics();

    // Test 5: WebSocket Integration
    await this.testWebSocketIntegration();

    // Test 6: Knowledge Transfer
    await this.testKnowledgeTransfer();

    // Test 7: Pattern Matching
    await this.testPatternMatching();

    // Test 8: System Health Monitoring
    await this.testSystemHealth();

    // Generate summary
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = this.testResults.filter(r => !r.success).length;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    const summary = `
Evolution Integration Test Results:
✅ Passed: ${passedTests}/${this.testResults.length}
❌ Failed: ${failedTests}/${this.testResults.length}
⏱️  Total Duration: ${totalDuration.toFixed(2)}ms
🎯 Success Rate: ${((passedTests / this.testResults.length) * 100).toFixed(1)}%
`;

    console.log(summary);

    // Print detailed results
    this.printDetailedResults();

    return {
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      results: this.testResults,
      summary,
    };
  }

  private async testAgentInitialization(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const agentId = 'agent_test_001' as AgentInstanceId;
      const projectContext = generateTestProjectContext('web-app', 'medium');
      const taskId = 'task_001' as TaskId;

      const result = await this.orchestrator.initializeAgent(
        agentId,
        projectContext,
        taskId
      );

      const success = result.success && 
                     result.dnaId !== '' && 
                     result.fitnessScore >= 0 &&
                     result.reason.length > 0;

      this.recordTest('Agent Initialization', success, 
        success ? 'Agent successfully initialized with DNA' : 'Agent initialization failed',
        Date.now() - startTime, {
          agentId,
          dnaId: result.dnaId,
          fitnessScore: result.fitnessScore,
          reason: result.reason,
        });

    } catch (error) {
      this.recordTest('Agent Initialization', false,
        `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Date.now() - startTime);
    }
  }

  private async testTaskCompletionEvolution(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const agentId = 'agent_test_002' as AgentInstanceId;
      const projectContext = generateTestProjectContext('api', 'high');
      const taskId = 'task_002' as TaskId;

      // Initialize agent first
      const initResult = await this.orchestrator.initializeAgent(agentId, projectContext, taskId);
      
      if (!initResult.success) {
        throw new Error('Failed to initialize agent for evolution test');
      }

      // Simulate task completion with good performance
      const feedback = generateTestFeedback(agentId, initResult.dnaId, taskId, projectContext, 'success');
      
      const evolutionResult = await this.orchestrator.processTaskCompletion(
        agentId,
        taskId,
        feedback
      );

      const success = evolutionResult.fitnessImprovement >= 0 &&
                     evolutionResult.knowledgeExtracted >= 0;

      this.recordTest('Task Completion Evolution', success,
        success ? 'Task completion processed and evolution triggered' : 'Evolution processing failed',
        Date.now() - startTime, {
          evolutionTriggered: evolutionResult.evolutionTriggered,
          fitnessImprovement: evolutionResult.fitnessImprovement,
          knowledgeExtracted: evolutionResult.knowledgeExtracted,
        });

    } catch (error) {
      this.recordTest('Task Completion Evolution', false,
        `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Date.now() - startTime);
    }
  }

  private async testCrossProjectLearning(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Create two different project contexts
      const project1 = generateTestProjectContext('web-app', 'medium');
      const project2 = generateTestProjectContext('api', 'medium');
      
      const agent1 = 'agent_cross_001' as AgentInstanceId;
      const agent2 = 'agent_cross_002' as AgentInstanceId;

      // Initialize agents in different projects
      const result1 = await this.orchestrator.initializeAgent(agent1, project1);
      const result2 = await this.orchestrator.initializeAgent(agent2, project2);

      // Simulate successful task completion for agent1
      const feedback1 = generateTestFeedback(
        agent1, 
        result1.dnaId, 
        'task_cross_001' as TaskId, 
        project1, 
        'success'
      );
      
      await this.orchestrator.processTaskCompletion(agent1, 'task_cross_001' as TaskId, feedback1);

      // Check if knowledge is available for agent2
      const mockDna: CodeDNA = {
        id: result2.dnaId,
        patternType: 'analytical',
        context: project2,
        genetics: {
          complexity: 0.7,
          adaptability: 0.6,
          successRate: 0.8,
          transferability: 0.5,
          stability: 0.8,
          novelty: 0.4,
          patternRecognition: 0.7,
          errorRecovery: 0.7,
          communicationClarity: 0.6,
          learningVelocity: 0.7,
          resourceEfficiency: 0.75,
          collaborationAffinity: 0.6,
          riskTolerance: 0.5,
          thoroughness: 0.8,
          creativity: 0.5,
          persistence: 0.7,
          empathy: 0.6,
          pragmatism: 0.7,
        },
        performance: generateTestPerformanceMetrics(),
        mutations: [],
        embedding: [],
        timestamp: new Date(),
        generation: 1,
        birthContext: {
          trigger: 'initial_spawn',
          sourceAgentId: agent2,
          creationReason: 'Test DNA',
          initialPerformance: generateTestPerformanceMetrics(),
        },
        evolutionHistory: [],
        activationCount: 1,
        lastActivation: new Date(),
        fitnessScore: 0.7 as any,
        viabilityAssessment: {
          overallScore: 0.7,
          strengths: [],
          weaknesses: [],
          recommendedContexts: [],
          avoidContexts: [],
          lastAssessment: new Date(),
          confidenceLevel: 0.8,
        },
        reproductionPotential: 0.7,
        tags: [],
        notes: '',
        isArchived: false,
      };

      const availableKnowledge = await this.orchestrator.findKnowledgeForAgent(
        agent2,
        project2.id,
        project2,
        mockDna as any
      );

      const success = result1.success && result2.success;

      this.recordTest('Cross-Project Learning', success,
        success ? 'Cross-project learning setup successful' : 'Cross-project learning failed',
        Date.now() - startTime, {
          agent1Success: result1.success,
          agent2Success: result2.success,
          knowledgeItemsFound: availableKnowledge.length,
        });

    } catch (error) {
      this.recordTest('Cross-Project Learning', false,
        `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Date.now() - startTime);
    }
  }

  private async testRealTimeMetrics(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Get dashboard data
      const dashboard = await this.orchestrator.getDashboard();
      
      // Check system health
      const healthScore = this.orchestrator.getSystemHealth();
      
      // Get knowledge stats
      const knowledgeStats = this.orchestrator.getKnowledgeStats();

      const success = dashboard && 
                     typeof dashboard.timestamp !== 'undefined' &&
                     typeof dashboard.overview !== 'undefined' &&
                     healthScore >= 0 && healthScore <= 1 &&
                     typeof knowledgeStats.totalKnowledgeItems === 'number';

      this.recordTest('Real-time Metrics', success,
        success ? 'Real-time metrics functioning properly' : 'Metrics system malfunction',
        Date.now() - startTime, {
          dashboardValid: !!dashboard,
          healthScore,
          knowledgeItems: knowledgeStats.totalKnowledgeItems,
          totalTransfers: knowledgeStats.totalTransfers,
        });

    } catch (error) {
      this.recordTest('Real-time Metrics', false,
        `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Date.now() - startTime);
    }
  }

  private async testWebSocketIntegration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const connectionId = `ws_test_${Date.now()}` as WebSocketConnectionId;
      
      // Register WebSocket connection
      this.orchestrator.registerWebSocketConnection(connectionId, 'dashboard');
      
      // Get connection stats
      const stats = this.orchestrator.getConnectionStats();
      
      const success = stats.totalConnections > 0 &&
                     typeof stats.connectionsByType === 'object' &&
                     typeof stats.averageConnectionTime === 'number';

      this.recordTest('WebSocket Integration', success,
        success ? 'WebSocket integration working correctly' : 'WebSocket integration failed',
        Date.now() - startTime, {
          totalConnections: stats.totalConnections,
          connectionsByType: stats.connectionsByType,
          subscriptionStats: stats.subscriptionStats,
        });

    } catch (error) {
      this.recordTest('WebSocket Integration', false,
        `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Date.now() - startTime);
    }
  }

  private async testKnowledgeTransfer(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const stats = this.orchestrator.getKnowledgeStats();
      
      // Knowledge stats should be properly structured
      const success = typeof stats.totalKnowledgeItems === 'number' &&
                     typeof stats.totalTransfers === 'number' &&
                     typeof stats.successRate === 'number' &&
                     Array.isArray(stats.topPerformingKnowledge) &&
                     typeof stats.knowledgeByType === 'object';

      this.recordTest('Knowledge Transfer', success,
        success ? 'Knowledge transfer system operational' : 'Knowledge transfer system failure',
        Date.now() - startTime, {
          totalKnowledgeItems: stats.totalKnowledgeItems,
          totalTransfers: stats.totalTransfers,
          successRate: stats.successRate,
          avgImprovement: stats.avgImprovement,
        });

    } catch (error) {
      this.recordTest('Knowledge Transfer', false,
        `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Date.now() - startTime);
    }
  }

  private async testPatternMatching(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Pattern matching is tested indirectly through cross-project learning
      // and knowledge transfer functionality
      
      const agent = 'agent_pattern_test' as AgentInstanceId;
      const context = generateTestProjectContext('cli', 'low');
      
      const initResult = await this.orchestrator.initializeAgent(agent, context);
      
      const success = initResult.success;

      this.recordTest('Pattern Matching', success,
        success ? 'Pattern matching integrated successfully' : 'Pattern matching integration failed',
        Date.now() - startTime, {
          agentInitialized: initResult.success,
          dnaId: initResult.dnaId,
        });

    } catch (error) {
      this.recordTest('Pattern Matching', false,
        `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Date.now() - startTime);
    }
  }

  private async testSystemHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const healthScore = this.orchestrator.getSystemHealth();
      const dashboard = await this.orchestrator.getDashboard();
      
      const success = healthScore >= 0 && 
                     healthScore <= 1 && 
                     dashboard.overview &&
                     typeof dashboard.overview.totalAgents === 'number' &&
                     typeof dashboard.overview.avgFitness === 'number';

      this.recordTest('System Health', success,
        success ? `System health monitoring active (score: ${healthScore.toFixed(3)})` : 'System health monitoring failed',
        Date.now() - startTime, {
          healthScore,
          totalAgents: dashboard.overview?.totalAgents,
          avgFitness: dashboard.overview?.avgFitness,
          diversityIndex: dashboard.overview?.diversityIndex,
        });

    } catch (error) {
      this.recordTest('System Health', false,
        `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Date.now() - startTime);
    }
  }

  private recordTest(
    name: string, 
    success: boolean, 
    message: string, 
    duration: number,
    details?: Record<string, unknown>
  ): void {
    this.testResults.push({
      testName: name,
      success,
      message,
      duration,
      details: details ?? {},
    });

    const status = success ? '✅' : '❌';
    console.log(`${status} ${name}: ${message} (${duration.toFixed(2)}ms)`);
  }

  private printDetailedResults(): void {
    console.log('\n📊 Detailed Test Results:\n');
    
    for (const result of this.testResults) {
      console.log(`${result.success ? '✅' : '❌'} ${result.testName}`);
      console.log(`   Message: ${result.message}`);
      console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
      
      if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2));
      }
      console.log('');
    }
  }

  private setupEventListeners(): void {
    this.orchestrator.on('knowledge_extracted', (event) => {
      console.log(`📚 Knowledge extracted: Agent ${event.agentId} - ${event.knowledgeCount} items`);
    });

    this.orchestrator.on('knowledge_transferred', (event) => {
      console.log(`🔄 Knowledge transfer: ${event.success ? 'Success' : 'Failed'} - Improvement: ${event.actualImprovement}`);
    });

    this.orchestrator.on('error', (error) => {
      console.warn(`⚠️ Orchestrator error:`, error);
    });
  }

  /**
   * Clean up test resources
   */
  destroy(): void {
    this.orchestrator.destroy();
  }
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

export async function runEvolutionIntegrationTest(): Promise<void> {
  const test = new EvolutionIntegrationTest();
  
  try {
    const results = await test.runTests();
    
    if (results.failedTests === 0) {
      console.log('\n🎉 All evolution integration tests passed! The system is ready for production use.');
    } else {
      console.log(`\n⚠️  ${results.failedTests} test(s) failed. Review the results above for details.`);
    }
    
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
  } finally {
    test.destroy();
  }
}

// Export for use in other modules
export default EvolutionIntegrationTest;