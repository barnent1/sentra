/**
 * Evolution Integration System - Main Index
 * 
 * This module exports all evolution integration components and provides
 * a unified interface for connecting DNA evolution to project management workflow.
 * 
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */

// ============================================================================
// CORE EVOLUTION SERVICES
// ============================================================================

export { EvolutionIntegrationService } from './evolution-service';
export type {
  EvolutionServiceId,
  EvolutionServiceConfig,
  EvolutionIntegrationResult,
  EvolutionEventData,
  CrossProjectPattern,
  EvolutionMetricsUpdate,
  ProjectLearningContext,
} from './evolution-service';

// ============================================================================
// PATTERN MATCHING AND VECTOR OPERATIONS
// ============================================================================

export { PatternMatchingService, VectorOperations } from './pattern-matching';
export type {
  PatternMatchingId,
  EmbeddingVector,
  PatternSimilarityResult,
  PatternCluster,
  CrossProjectTransferCandidate,
  PatternMatchingConfig,
} from './pattern-matching';

// ============================================================================
// REAL-TIME METRICS AND MONITORING
// ============================================================================

export { EvolutionMetricsService } from './metrics-service';
export type {
  MetricsServiceId,
  MetricId,
  EvolutionMetricPoint,
  MetricsAggregation,
  EvolutionTrend,
  EvolutionAlert,
  RealTimeEvolutionDashboard,
  MetricsServiceConfig,
} from './metrics-service';
export { EvolutionMetricType } from './metrics-service';

// ============================================================================
// WEBSOCKET BRIDGE FOR REAL-TIME UPDATES
// ============================================================================

export { EvolutionWebSocketBridge } from './websocket-bridge';
export type {
  WebSocketConnectionId,
  EvolutionWebSocketMessage,
  EvolutionSubscription,
  WebSocketConnection,
} from './websocket-bridge';
export { EvolutionWebSocketMessageType, EvolutionSubscriptionType } from './websocket-bridge';

// ============================================================================
// KNOWLEDGE TRANSFER AND CROSS-PROJECT LEARNING
// ============================================================================

export { KnowledgeTransferService } from './knowledge-transfer';
export type {
  KnowledgeTransferId,
  LearningSessionId,
  KnowledgeItemId,
  KnowledgeItem,
  KnowledgeContent,
  KnowledgeApplicability,
  KnowledgeQuality,
  KnowledgeTransferRequest,
  KnowledgeTransferResult,
  CrossProjectLearningSession,
} from './knowledge-transfer';
export { KnowledgeType, TransferType } from './knowledge-transfer';

// ============================================================================
// UNIFIED EVOLUTION ORCHESTRATOR
// ============================================================================

import { EventEmitter } from 'events';
import type {
  CodeDNA,
  EvolutionDnaId,
  AgentInstanceId,
  ProjectContextId,
  TaskId,
  ProjectContext,
  Brand
} from '@sentra/types';
import type {
  PerformanceFeedback,
} from '../types';
import { EvolutionIntegrationService, type EvolutionServiceConfig } from './evolution-service';
import { PatternMatchingService, type PatternMatchingConfig } from './pattern-matching';
import { EvolutionMetricsService, type MetricsServiceConfig } from './metrics-service';
import { EvolutionWebSocketBridge } from './websocket-bridge';
import { KnowledgeTransferService } from './knowledge-transfer';

export type EvolutionOrchestratorId = Brand<string, 'EvolutionOrchestratorId'>;

export interface EvolutionOrchestratorConfig {
  readonly evolution: Partial<EvolutionServiceConfig>;
  readonly patternMatching: Partial<PatternMatchingConfig>;
  readonly metrics: Partial<MetricsServiceConfig>;
  readonly realTimeUpdates: boolean;
  readonly knowledgeTransfer: boolean;
}

/**
 * Main orchestrator that coordinates all evolution integration services
 */
export class EvolutionOrchestrator extends EventEmitter {
  readonly id: EvolutionOrchestratorId;
  private readonly evolutionService: EvolutionIntegrationService;
  private readonly patternMatchingService: PatternMatchingService;
  private readonly metricsService: EvolutionMetricsService;
  private readonly webSocketBridge: EvolutionWebSocketBridge;
  private readonly knowledgeTransferService: KnowledgeTransferService;
  private readonly config: EvolutionOrchestratorConfig;

  constructor(config: Partial<EvolutionOrchestratorConfig> = {}) {
    super();
    
    this.id = `orchestrator_${Date.now()}_${Math.random().toString(36).slice(2)}` as EvolutionOrchestratorId;
    
    this.config = {
      evolution: {},
      patternMatching: {},
      metrics: {},
      realTimeUpdates: true,
      knowledgeTransfer: true,
      ...config,
    };

    // Initialize services
    this.evolutionService = new EvolutionIntegrationService(this.config.evolution);
    this.patternMatchingService = new PatternMatchingService(this.config.patternMatching);
    this.metricsService = new EvolutionMetricsService(this.config.metrics);
    this.webSocketBridge = new EvolutionWebSocketBridge();
    this.knowledgeTransferService = new KnowledgeTransferService();

    this.setupServiceIntegration();
  }

  /**
   * Initialize agent with DNA for a project
   */
  async initializeAgent(
    agentId: AgentInstanceId,
    projectContext: ProjectContext,
    taskId?: TaskId,
    seedPatterns?: readonly CodeDNA[]
  ): Promise<{
    readonly success: boolean;
    readonly dnaId: EvolutionDnaId;
    readonly fitnessScore: number;
    readonly reason: string;
  }> {
    try {
      // Initialize DNA through evolution service
      const result = await this.evolutionService.initializeAgentDna(
        agentId,
        projectContext,
        taskId,
        seedPatterns
      );

      if (result.success) {
        // Record metrics
        this.metricsService.recordMetric('fitness_score', result.metricsUpdate.averageFitnessImprovement, {
          agentId,
          projectId: projectContext.id,
          dnaId: result.dnaId,
          ...(taskId && { taskId }),
        });

        // Broadcast via WebSocket if enabled
        if (this.config.realTimeUpdates) {
          this.webSocketBridge.broadcastAgentPerformance({
            agentId,
            dnaId: result.dnaId,
            projectId: projectContext.id,
            taskId: taskId ?? '' as TaskId,
            metrics: {
              successRate: 0.5, // Initial baseline
              codeQuality: 0.5,
              adaptationSpeed: 0.5,
              errorRecovery: 0.5,
            },
            trends: [],
          });
        }

        return {
          success: true,
          dnaId: result.dnaId,
          fitnessScore: result.metricsUpdate.averageFitnessImprovement,
          reason: result.reason,
        };
      }

      return {
        success: false,
        dnaId: result.dnaId,
        fitnessScore: 0,
        reason: result.reason,
      };

    } catch (error) {
      this.emit('error', { operation: 'initialize_agent', agentId, error });
      return {
        success: false,
        dnaId: '' as EvolutionDnaId,
        fitnessScore: 0,
        reason: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Process task completion and trigger evolution if needed
   */
  async processTaskCompletion(
    agentId: AgentInstanceId,
    taskId: TaskId,
    feedback: PerformanceFeedback
  ): Promise<{
    readonly evolutionTriggered: boolean;
    readonly newDnaId?: EvolutionDnaId;
    readonly fitnessImprovement: number;
    readonly knowledgeExtracted: number;
  }> {
    try {
      // Process through evolution service
      const evolutionResult = await this.evolutionService.processTaskFeedback(
        agentId,
        taskId,
        feedback
      );

      // Record performance metrics
      this.metricsService.recordAgentPerformance(
        agentId,
        feedback.dnaId,
        feedback.context.id,
        taskId,
        feedback.metrics
      );

      let knowledgeExtracted = 0;

      // Extract knowledge if enabled
      if (this.config.knowledgeTransfer && evolutionResult.success) {
        try {
          // Mock DNA for knowledge extraction (would get actual DNA in production)  
          // Skipping DNA construction for knowledge extraction as it's unused

          const extractedKnowledge = await this.knowledgeTransferService.extractKnowledge(
            agentId,
            feedback.dnaId,
            feedback.context.id,
            taskId,
            [], // Would pass actual mutations
            evolutionResult.success ? 0.1 : 0,
            feedback.context
          );

          knowledgeExtracted = extractedKnowledge.length;

        } catch (error) {
          console.warn('Knowledge extraction failed:', error);
        }
      }

      // Broadcast evolution event if successful
      if (evolutionResult.success && evolutionResult.dnaId && this.config.realTimeUpdates) {
        this.webSocketBridge.broadcastDnaEvolution({
          agentId,
          originalDnaId: feedback.dnaId,
          evolvedDnaId: evolutionResult.dnaId,
          projectId: feedback.context.id,
          fitnessImprovement: evolutionResult.metricsUpdate.averageFitnessImprovement,
          generation: 1, // Would get actual generation
          evolutionType: 'task_feedback',
          confidence: evolutionResult.confidence,
        });
      }

      return {
        evolutionTriggered: evolutionResult.success,
        newDnaId: evolutionResult.dnaId,
        fitnessImprovement: evolutionResult.metricsUpdate.averageFitnessImprovement,
        knowledgeExtracted,
      };

    } catch (error) {
      this.emit('error', { operation: 'process_task_completion', agentId, taskId, error });
      return {
        evolutionTriggered: false,
        fitnessImprovement: 0,
        knowledgeExtracted: 0,
      };
    }
  }

  /**
   * Get real-time evolution dashboard
   */
  async getDashboard(): Promise<import('./metrics-service').RealTimeEvolutionDashboard> {
    return this.metricsService.generateDashboard();
  }

  /**
   * Get system health score
   */
  getSystemHealth(): number {
    return this.metricsService.getSystemHealthScore();
  }

  /**
   * Find knowledge for agent
   */
  async findKnowledgeForAgent(
    agentId: AgentInstanceId,
    projectId: ProjectContextId,
    context: ProjectContext,
    currentDna: CodeDNA
  ): Promise<readonly import('./knowledge-transfer').KnowledgeItem[]> {
    if (!this.config.knowledgeTransfer) return [];
    
    return this.knowledgeTransferService.findRelevantKnowledge(
      agentId,
      projectId,
      context as any,
      currentDna as any
    );
  }

  /**
   * Get transfer statistics
   */
  getKnowledgeStats(): ReturnType<KnowledgeTransferService['getTransferStatistics']> {
    return this.knowledgeTransferService.getTransferStatistics();
  }

  /**
   * Register WebSocket connection
   */
  registerWebSocketConnection(
    connectionId: import('./websocket-bridge').WebSocketConnectionId,
    clientType: 'dashboard' | 'mobile' | 'tmux' | 'api' = 'api'
  ): void {
    if (this.config.realTimeUpdates) {
      this.webSocketBridge.registerConnection(connectionId, clientType);
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): ReturnType<EvolutionWebSocketBridge['getConnectionStats']> {
    return this.webSocketBridge.getConnectionStats();
  }

  private setupServiceIntegration(): void {
    // Connect evolution service events to metrics
    this.evolutionService.on('agent_dna_initialized', (event) => {
      this.metricsService.recordMetric('fitness_score', event.fitness, {
        agentId: event.agentId,
        projectId: event.projectId,
        dnaId: event.dnaId,
        taskId: event.taskId,
      });
    });

    this.evolutionService.on('dna_evolved', (event) => {
      this.metricsService.recordEvolutionEvent(
        event.agentId,
        event.evolvedDnaId,
        event.originalDnaId,
        event.originalDnaId, // Mock project ID
        event.fitnessImprovement,
        event.generation,
        'fitness_improvement'
      );
    });

    // Connect evolution service events to WebSocket
    if (this.config.realTimeUpdates) {
      this.evolutionService.on('cross_project_pattern_identified', (event) => {
        this.webSocketBridge.broadcastCrossProjectPattern({
          patternId: `pattern_${Date.now()}`,
          sourceProject: event.sourceProject,
          targetProject: event.targetProject,
          similarity: event.similarity,
          transferPotential: event.successPrediction,
          patternType: 'unknown',
        });
      });
    }

    // Connect metrics to WebSocket broadcasts
    if (this.config.realTimeUpdates) {
      this.metricsService.on('dashboard_update', (dashboard) => {
        this.webSocketBridge.broadcastDashboardUpdate(dashboard);
      });

      this.metricsService.on('alert', (alert) => {
        this.webSocketBridge.broadcastAlert(alert);
      });
    }

    // Connect knowledge transfer events
    if (this.config.knowledgeTransfer) {
      this.knowledgeTransferService.on('knowledge_extracted', (event) => {
        this.emit('knowledge_extracted', event);
      });

      this.knowledgeTransferService.on('transfer_completed', (event) => {
        this.emit('knowledge_transferred', event);
      });
    }

    // Forward all service errors
    const services = [
      this.evolutionService,
      this.patternMatchingService,
      this.metricsService,
      this.webSocketBridge,
      this.knowledgeTransferService,
    ];

    for (const service of services) {
      if ('on' in service && typeof service.on === 'function') {
        service.on('error', (error: any) => {
          this.emit('error', error);
        });
      }
    }
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.evolutionService.destroy();
    this.patternMatchingService.clearCache();
    this.metricsService.destroy();
    this.webSocketBridge.destroy();
    this.knowledgeTransferService.destroy();
    this.removeAllListeners();
  }
}

export default EvolutionOrchestrator;