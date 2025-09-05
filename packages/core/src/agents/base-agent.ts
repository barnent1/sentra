/**
 * Base Evolutionary Agent - Abstract foundation for all specialized agents
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */

import { EventEmitter } from 'events';
import type { 
  AgentInstanceId,
  TaskId,
  EvolutionDnaId,
  CodeDNA,
  ProjectContext,
  EnhancedPerformanceMetrics as PerformanceMetrics,
  // EnhancedGeneticMarkers as GeneticMarkers, // Unused import commented out
  AgentCapabilities,
  AgentType,
  AgentStatus,
} from '@sentra/types';

/**
 * Agent learning outcome interface
 */
export interface LearningOutcome {
  readonly taskId: TaskId;
  readonly success: boolean;
  readonly performanceMetrics: PerformanceMetrics;
  readonly lessonsLearned: readonly string[];
  readonly contextFactors: readonly string[];
  readonly timestamp: Date;
}

/**
 * Agent task execution context
 */
export interface TaskExecutionContext {
  readonly taskId: TaskId;
  readonly projectContext: ProjectContext;
  readonly requirements: readonly string[];
  readonly constraints: readonly string[];
  readonly expectedOutputFormat: string;
  readonly timeoutMs?: number;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Agent execution result interface
 */
export interface AgentExecutionResult {
  readonly success: boolean;
  readonly output: unknown;
  readonly performanceMetrics: PerformanceMetrics;
  readonly resourcesUsed: {
    readonly tokensConsumed: number;
    readonly executionTime: number;
    readonly memoryUsed: number;
  };
  readonly errors?: readonly string[];
  readonly warnings?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Abstract base class for all evolutionary agents
 */
export abstract class BaseEvolutionaryAgent extends EventEmitter {
  protected readonly id: AgentInstanceId;
  protected readonly dnaId: EvolutionDnaId;
  protected dna: CodeDNA;
  protected status: AgentStatus = 'active';
  protected readonly spawnedAt: Date;
  protected lastActiveAt: Date;
  protected performanceHistory: readonly PerformanceMetrics[] = [];
  protected currentTaskId?: TaskId;
  
  // Learning and adaptation tracking
  protected learningOutcomes: readonly LearningOutcome[] = [];
  protected adaptationCount = 0;
  protected totalTasksCompleted = 0;
  
  constructor(
    id: AgentInstanceId,
    dna: CodeDNA,
    capabilities: AgentCapabilities
  ) {
    super();
    this.id = id;
    this.dnaId = dna.id;
    this.dna = dna;
    this.spawnedAt = new Date();
    this.lastActiveAt = new Date();
    
    // Validate capabilities match agent type
    this.validateCapabilities(capabilities);
    
    // Set up event listeners for learning
    this.setupLearningHandlers();
  }

  // Abstract methods that must be implemented by specialized agents
  abstract get type(): AgentType;
  abstract get capabilities(): AgentCapabilities;
  abstract executeTask(context: TaskExecutionContext): Promise<AgentExecutionResult>;
  abstract canHandleTask(context: TaskExecutionContext): boolean;
  
  /**
   * Get agent identifier
   */
  getId(): AgentInstanceId {
    return this.id;
  }
  
  /**
   * Get current agent status
   */
  getStatus(): AgentStatus {
    return this.status;
  }
  
  /**
   * Get agent DNA
   */
  getDNA(): CodeDNA {
    return this.dna;
  }
  
  /**
   * Update agent DNA (evolutionary process)
   */
  async evolveDNA(newDNA: CodeDNA): Promise<void> {
    const oldDNA = this.dna;
    this.dna = newDNA;
    this.adaptationCount++;
    
    this.emit('dna_evolved', {
      agentId: this.id,
      oldDNA,
      newDNA,
      adaptationCount: this.adaptationCount,
    });
  }
  
  /**
   * Learn from task execution outcome
   */
  async learn(outcome: LearningOutcome): Promise<void> {
    this.learningOutcomes = [...this.learningOutcomes, outcome];
    
    // Update performance history
    this.performanceHistory = [...this.performanceHistory, outcome.performanceMetrics];
    
    // Keep only last 100 performance records
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }
    
    // Analyze patterns and adapt if needed
    await this.analyzeLearningPatterns();
    
    this.emit('learning_completed', {
      agentId: this.id,
      outcome,
      totalOutcomes: this.learningOutcomes.length,
    });
  }
  
  /**
   * Adapt behavior based on project context
   */
  async adaptToContext(context: ProjectContext): Promise<void> {
    // Analyze how well current DNA fits the context
    const contextFitScore = this.calculateContextFit(context);
    
    if (contextFitScore < 0.7) {
      // Request DNA evolution to better fit context
      this.emit('adaptation_needed', {
        agentId: this.id,
        context,
        currentFitScore: contextFitScore,
        reason: 'Low context fit score',
      });
    }
    
    // Update last active timestamp
    this.lastActiveAt = new Date();
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    readonly averageSuccessRate: number;
    readonly averageExecutionTime: number;
    readonly totalTasksCompleted: number;
    readonly adaptationCount: number;
    readonly recentPerformanceTrend: 'improving' | 'stable' | 'declining';
    readonly contextFitScore: number;
  } {
    if (this.performanceHistory.length === 0) {
      return {
        averageSuccessRate: 0,
        averageExecutionTime: 0,
        totalTasksCompleted: 0,
        adaptationCount: this.adaptationCount,
        recentPerformanceTrend: 'stable',
        contextFitScore: 0.5,
      };
    }
    
    const recent = this.performanceHistory.slice(-10);
    const averageSuccessRate = recent.reduce((sum, p) => sum + p.successRate, 0) / recent.length;
    const averageExecutionTime = recent.reduce((sum, p) => sum + p.averageTaskCompletionTime, 0) / recent.length;
    
    // Calculate performance trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recent.length >= 5) {
      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, p) => sum + p.successRate, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, p) => sum + p.successRate, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 0.05) trend = 'improving';
      else if (secondAvg < firstAvg - 0.05) trend = 'declining';
    }
    
    return {
      averageSuccessRate,
      averageExecutionTime,
      totalTasksCompleted: this.totalTasksCompleted,
      adaptationCount: this.adaptationCount,
      recentPerformanceTrend: trend,
      contextFitScore: this.calculateCurrentContextFit(),
    };
  }
  
  /**
   * Activate agent for task execution
   */
  async activate(taskId: TaskId): Promise<void> {
    if (this.status !== 'active') {
      throw new Error(`Agent ${this.id} is not in active status (current: ${this.status})`);
    }
    
    this.currentTaskId = taskId;
    this.lastActiveAt = new Date();
    
    this.emit('agent_activated', {
      agentId: this.id,
      taskId,
      timestamp: new Date(),
    });
  }
  
  /**
   * Deactivate agent after task completion
   */
  async deactivate(): Promise<void> {
    const completedTaskId = this.currentTaskId;
    delete (this as any).currentTaskId;
    this.totalTasksCompleted++;
    
    this.emit('agent_deactivated', {
      agentId: this.id,
      completedTaskId,
      totalCompleted: this.totalTasksCompleted,
      timestamp: new Date(),
    });
  }
  
  /**
   * Terminate agent (mark as archived)
   */
  async terminate(reason: string): Promise<void> {
    this.status = 'archived';
    
    this.emit('agent_terminated', {
      agentId: this.id,
      reason,
      finalStats: this.getPerformanceStats(),
      timestamp: new Date(),
    });
  }
  
  /**
   * Validate agent capabilities against requirements
   */
  protected validateCapabilities(capabilities: AgentCapabilities): void {
    // Basic validation - specialized agents can override
    if (!capabilities || typeof capabilities !== 'object') {
      throw new Error(`Invalid capabilities for agent ${this.id}`);
    }
  }
  
  /**
   * Set up learning event handlers
   */
  protected setupLearningHandlers(): void {
    this.on('task_completed', this.handleTaskCompletion.bind(this));
    this.on('task_failed', this.handleTaskFailure.bind(this));
  }
  
  /**
   * Handle task completion event
   */
  protected async handleTaskCompletion(event: {
    taskId: TaskId;
    result: AgentExecutionResult;
  }): Promise<void> {
    const outcome: LearningOutcome = {
      taskId: event.taskId,
      success: true,
      performanceMetrics: event.result.performanceMetrics,
      lessonsLearned: ['Task completed successfully'],
      contextFactors: [],
      timestamp: new Date(),
    };
    
    await this.learn(outcome);
  }
  
  /**
   * Handle task failure event
   */
  protected async handleTaskFailure(event: {
    taskId: TaskId;
    errors: readonly string[];
  }): Promise<void> {
    const outcome: LearningOutcome = {
      taskId: event.taskId,
      success: false,
      performanceMetrics: this.createFailureMetrics(),
      lessonsLearned: event.errors,
      contextFactors: ['task_failure'],
      timestamp: new Date(),
    };
    
    await this.learn(outcome);
  }
  
  /**
   * Calculate how well agent fits a project context
   */
  protected calculateContextFit(context: ProjectContext): number {
    // Base implementation - can be overridden by specialized agents
    const genetics = this.dna.genetics;
    
    let fitScore = 0;
    
    // Complexity match
    const contextComplexityMap = {
      'low': 0.2,
      'medium': 0.5,
      'high': 0.8,
      'enterprise': 1.0,
      'research': 1.0,
    } as const;
    const contextComplexity = contextComplexityMap[context.complexity];
    
    const complexityDiff = Math.abs(genetics.complexity - contextComplexity);
    fitScore += (1 - complexityDiff) * 0.3;
    
    // Adaptability for context
    fitScore += genetics.adaptability * 0.3;
    
    // Success rate potential
    fitScore += genetics.successRate * 0.4;
    
    return Math.min(1, Math.max(0, fitScore));
  }
  
  /**
   * Calculate current context fit (if context is available)
   */
  protected calculateCurrentContextFit(): number {
    // Use DNA's project context for current fit calculation
    return this.calculateContextFit(this.dna.context);
  }
  
  /**
   * Analyze learning patterns and trigger adaptations
   */
  protected async analyzeLearningPatterns(): Promise<void> {
    if (this.learningOutcomes.length < 10) return; // Need enough data
    
    const recent = this.learningOutcomes.slice(-10);
    const successRate = recent.filter(o => o.success).length / recent.length;
    
    // If performance is declining, request evolution
    if (successRate < 0.6) {
      this.emit('evolution_requested', {
        agentId: this.id,
        reason: `Performance declining (${(successRate * 100).toFixed(1)}% success rate)`,
        currentPerformance: successRate,
        recommendedChanges: this.generateEvolutionRecommendations(recent),
      });
    }
  }
  
  /**
   * Generate evolution recommendations based on learning outcomes
   */
  protected generateEvolutionRecommendations(outcomes: readonly LearningOutcome[]): readonly string[] {
    const recommendations: string[] = [];
    
    const failures = outcomes.filter(o => !o.success);
    if (failures.length > outcomes.length * 0.4) {
      recommendations.push('Improve error handling and recovery mechanisms');
      recommendations.push('Increase thoroughness in task analysis');
    }
    
    const avgExecutionTime = outcomes.reduce(
      (sum, o) => sum + o.performanceMetrics.averageTaskCompletionTime, 0
    ) / outcomes.length;
    
    if (avgExecutionTime > 30000) { // 30 seconds
      recommendations.push('Optimize for faster execution');
      recommendations.push('Improve resource efficiency');
    }
    
    return recommendations;
  }
  
  /**
   * Create failure performance metrics
   */
  protected createFailureMetrics(): PerformanceMetrics {
    return {
      successRate: 0,
      averageTaskCompletionTime: 0,
      codeQualityScore: 0,
      userSatisfactionRating: 0,
      adaptationSpeed: this.dna.performance.adaptationSpeed,
      errorRecoveryRate: 0,
      knowledgeRetention: this.dna.performance.knowledgeRetention,
      crossDomainTransfer: this.dna.performance.crossDomainTransfer,
      computationalEfficiency: 0,
      responseLatency: Infinity,
      throughput: 0,
      resourceUtilization: 1, // High utilization during failure
      bugIntroductionRate: 1, // Complete failure
      testCoverage: 0,
      documentationQuality: 0,
      maintainabilityScore: 0,
      communicationEffectiveness: 0,
      teamIntegration: this.dna.performance.teamIntegration,
      feedbackIncorporation: this.dna.performance.feedbackIncorporation,
      conflictResolution: this.dna.performance.conflictResolution,
    };
  }
}

export default BaseEvolutionaryAgent;