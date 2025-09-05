/**
 * Master Orchestrator Agent - Coordinates all other agents and ensures quality
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * 
 * This agent:
 * - Never compromises on quality (100% test coverage, current docs, etc.)
 * - Coordinates multiple sub-agents for complex tasks
 * - Manages context to never exceed 50% window
 * - Routes tasks to appropriate specialized agents
 */

import { BaseEvolutionaryAgent, type TaskExecutionContext, type AgentExecutionResult } from './base-agent';
import type { 
  AgentInstanceId,
  CodeDNA,
  AgentCapabilities,
  AgentType,
  TaskId,
  // ProjectContext, // Unused import commented out
} from '@sentra/types';

/**
 * Task decomposition result
 */
interface TaskDecomposition {
  readonly subtasks: readonly {
    readonly id: TaskId;
    readonly title: string;
    readonly description: string;
    readonly requiredAgent: AgentType;
    readonly estimatedTokens: number;
    readonly dependencies: readonly TaskId[];
    readonly priority: 'low' | 'medium' | 'high' | 'critical';
  }[];
  readonly parallelizable: readonly TaskId[][];
  readonly totalEstimatedTokens: number;
  readonly estimatedDuration: number;
}

/**
 * Quality assessment result
 */
interface QualityAssessment {
  readonly overall: 'excellent' | 'good' | 'acceptable' | 'needs_improvement' | 'unacceptable';
  readonly score: number; // 0-1
  readonly categories: {
    readonly documentation: number;
    readonly codeQuality: number;
    readonly testing: number;
    readonly performance: number;
    readonly security: number;
    readonly maintainability: number;
    readonly accessibility: number;
  };
  readonly issues: readonly string[];
  readonly improvements: readonly string[];
  readonly blockers: readonly string[];
}

/**
 * Master Orchestrator Agent - The quality guardian and task coordinator
 */
export class OrchestratorAgent extends BaseEvolutionaryAgent {
  private readonly maxContextUsage = 0.5; // Never exceed 50% context
  // private readonly qualityThreshold = 0.9; // Minimum quality score - unused
  // private activeSubAgents = new Set<AgentInstanceId>(); // unused
  
  constructor(id: AgentInstanceId, dna: CodeDNA) {
    const capabilities: AgentCapabilities = {
      canCode: false, // Orchestrator doesn't code directly
      canTest: true,
      canReview: true,
      canDeploy: false, // Reviews deployments but doesn't execute
      canAnalyze: true,
      canDesign: true, // Architectural design
      languages: [], // Works with all languages via sub-agents
      frameworks: [], // Works with all frameworks via sub-agents
      tools: ['git', 'testing', 'linting', 'documentation', 'monitoring'],
      maxComplexity: 'enterprise',
    };
    
    super(id, dna, capabilities);
  }

  get type(): AgentType {
    return 'orchestrator';
  }

  get capabilities(): AgentCapabilities {
    return {
      canCode: false,
      canTest: true,
      canReview: true,
      canDeploy: false,
      canAnalyze: true,
      canDesign: true,
      languages: [],
      frameworks: [],
      tools: ['git', 'testing', 'linting', 'documentation', 'monitoring'],
      maxComplexity: 'enterprise',
    };
  }

  /**
   * Check if orchestrator can handle a task (it can handle any task by delegation)
   */
  canHandleTask(_context: TaskExecutionContext): boolean {
    // Orchestrator can handle any task by decomposing and delegating
    return true;
  }

  /**
   * Execute task by orchestrating sub-agents
   */
  async executeTask(context: TaskExecutionContext): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Decompose task into manageable sub-tasks
      const decomposition = await this.decomposeTask(context);
      
      // Step 2: Validate context usage won't exceed limits
      if (decomposition.totalEstimatedTokens > this.estimateContextLimit() * this.maxContextUsage) {
        return this.createErrorResult('Task exceeds context limits and cannot be safely decomposed', startTime);
      }
      
      // Step 3: Execute sub-tasks with parallel optimization
      const results = await this.executeSubTasks(decomposition, context);
      
      // Step 4: Perform comprehensive quality assessment
      const qualityAssessment = await this.assessQuality(results, context);
      
      // Step 5: Apply GOLDEN RULES validation
      const goldenRulesValid = await this.validateGoldenRules(results, context);
      
      if (!goldenRulesValid || qualityAssessment.overall === 'unacceptable') {
        return this.createRejectionResult(qualityAssessment, startTime);
      }
      
      // Step 6: Compile final result
      const finalResult = await this.compileFinalResult(results, qualityAssessment);
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        output: finalResult,
        performanceMetrics: this.calculatePerformanceMetrics(executionTime, qualityAssessment),
        resourcesUsed: {
          tokensConsumed: decomposition.totalEstimatedTokens,
          executionTime,
          memoryUsed: this.estimateMemoryUsage(decomposition),
        },
        metadata: {
          subtasksExecuted: decomposition.subtasks.length,
          parallelBatches: decomposition.parallelizable.length,
          qualityScore: qualityAssessment.score,
          contextUsagePercent: (decomposition.totalEstimatedTokens / this.estimateContextLimit()) * 100,
        },
      };
      
    } catch (error) {
      return this.createErrorResult(
        `Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        startTime
      );
    }
  }

  /**
   * Decompose complex task into manageable sub-tasks
   */
  private async decomposeTask(context: TaskExecutionContext): Promise<TaskDecomposition> {
    // Analyze task complexity and requirements
    // const complexity = this.analyzeTaskComplexity(context); // Unused for now
    const subtasks: Array<{ readonly id: TaskId; readonly title: string; readonly description: string; readonly requiredAgent: AgentType; readonly estimatedTokens: number; readonly dependencies: readonly TaskId[]; readonly priority: "medium" | "low" | "high" | "critical"; }> = [];
    
    // Standard decomposition patterns
    if (this.isCodeTask(context)) {
      subtasks.push(
        {
          id: `${context.taskId}_analysis` as TaskId,
          title: 'Task Analysis and Planning',
          description: 'Analyze requirements and create implementation plan',
          requiredAgent: 'analyst',
          estimatedTokens: 2000,
          dependencies: [],
          priority: 'high',
        },
        {
          id: `${context.taskId}_implementation` as TaskId,
          title: 'Code Implementation',
          description: 'Implement the core functionality',
          requiredAgent: 'developer',
          estimatedTokens: 8000,
          dependencies: [`${context.taskId}_analysis` as TaskId],
          priority: 'high',
        },
        {
          id: `${context.taskId}_testing` as TaskId,
          title: 'Testing and Validation',
          description: 'Create comprehensive tests and validate implementation',
          requiredAgent: 'tester',
          estimatedTokens: 4000,
          dependencies: [`${context.taskId}_implementation` as TaskId],
          priority: 'critical',
        },
        {
          id: `${context.taskId}_review` as TaskId,
          title: 'Code Review and Quality Check',
          description: 'Perform thorough code review and quality assessment',
          requiredAgent: 'reviewer',
          estimatedTokens: 3000,
          dependencies: [`${context.taskId}_testing` as TaskId],
          priority: 'critical',
        }
      );
    }
    
    // UI/UX tasks get design agent involvement
    if (this.isUITask(context)) {
      subtasks.unshift({
        id: `${context.taskId}_design` as TaskId,
        title: 'UI/UX Design',
        description: 'Create user interface design and interaction patterns',
        requiredAgent: 'designer',
        estimatedTokens: 3000,
        dependencies: [],
        priority: 'high',
      });
    }
    
    // Calculate parallelization opportunities
    const parallelizable = this.identifyParallelTasks(subtasks);
    const totalEstimatedTokens = subtasks.reduce((sum, task) => sum + task.estimatedTokens, 0);
    
    return {
      subtasks: subtasks as readonly typeof subtasks[number][],
      parallelizable,
      totalEstimatedTokens,
      estimatedDuration: this.estimateTotalDuration(subtasks, parallelizable),
    };
  }

  /**
   * Execute sub-tasks with parallel optimization
   */
  private async executeSubTasks(
    decomposition: TaskDecomposition,
    context: TaskExecutionContext
  ): Promise<Map<TaskId, AgentExecutionResult>> {
    const results = new Map<TaskId, AgentExecutionResult>();
    
    // Execute tasks in parallel batches based on dependencies
    for (const parallelBatch of decomposition.parallelizable) {
      const batchPromises = parallelBatch.map(async (taskId) => {
        const subtask = decomposition.subtasks.find(t => t.id === taskId);
        if (!subtask) throw new Error(`Subtask ${taskId} not found`);
        
        // Create execution context for subtask
        const subtaskContext: TaskExecutionContext = {
          ...context,
          taskId: subtask.id,
          requirements: [subtask.description, ...context.requirements],
          expectedOutputFormat: this.determineOutputFormat(subtask.requiredAgent),
          priority: subtask.priority,
        };
        
        // Execute via appropriate specialized agent (simulation for now)
        const result = await this.executeViaSpecializedAgent(subtask.requiredAgent, subtaskContext);
        return { taskId, result };
      });
      
      // Wait for all tasks in this batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Store results and validate each one
      for (const { taskId, result } of batchResults) {
        if (!result.success) {
          throw new Error(`Subtask ${taskId} failed: ${result.errors?.join(', ') || 'Unknown error'}`);
        }
        results.set(taskId, result);
      }
    }
    
    return results;
  }

  /**
   * Perform comprehensive quality assessment
   */
  private async assessQuality(
    results: Map<TaskId, AgentExecutionResult>,
    _context: TaskExecutionContext
  ): Promise<QualityAssessment> {
    const categories = {
      documentation: 0,
      codeQuality: 0,
      testing: 0,
      performance: 0,
      security: 0,
      maintainability: 0,
      accessibility: 0,
    };
    
    const issues: string[] = [];
    const improvements: string[] = [];
    const blockers: string[] = [];
    
    // Assess each result
    for (const [taskId, result] of results.entries()) {
      if (result.performanceMetrics.successRate < 1.0) {
        issues.push(`Task ${taskId} has ${((1 - result.performanceMetrics.successRate) * 100).toFixed(1)}% failure rate`);
      }
      
      if (result.performanceMetrics.codeQualityScore < 0.9) {
        blockers.push(`Task ${taskId} code quality below threshold (${result.performanceMetrics.codeQualityScore.toFixed(2)})`);
      }
      
      if (result.performanceMetrics.testCoverage < 1.0) {
        blockers.push(`Task ${taskId} test coverage incomplete (${(result.performanceMetrics.testCoverage * 100).toFixed(1)}%)`);
      }
      
      // Update category scores
      categories.codeQuality += result.performanceMetrics.codeQualityScore;
      categories.testing += result.performanceMetrics.testCoverage;
      categories.documentation += result.performanceMetrics.documentationQuality;
      categories.maintainability += result.performanceMetrics.maintainabilityScore;
    }
    
    // Average category scores
    const resultCount = results.size;
    Object.keys(categories).forEach(key => {
      categories[key as keyof typeof categories] /= resultCount;
    });
    
    // Calculate overall score
    const overallScore = Object.values(categories).reduce((sum, score) => sum + score, 0) / Object.keys(categories).length;
    
    // Determine overall assessment
    const overall = overallScore >= 0.95 ? 'excellent' :
                   overallScore >= 0.90 ? 'good' :
                   overallScore >= 0.80 ? 'acceptable' :
                   overallScore >= 0.60 ? 'needs_improvement' : 'unacceptable';
    
    return {
      overall,
      score: overallScore,
      categories,
      issues,
      improvements,
      blockers,
    };
  }

  /**
   * Validate GOLDEN RULES compliance
   */
  private async validateGoldenRules(
    results: Map<TaskId, AgentExecutionResult>,
    _context: TaskExecutionContext
  ): Promise<boolean> {
    // GOLDEN RULE 1: ALWAYS use CURRENT documentation
    // Check if any task used outdated documentation
    for (const [taskId, result] of results.entries()) {
      if (result.metadata?.['documentationVersion'] && !this.isCurrentDocumentation(result.metadata['documentationVersion'] as string)) {
        this.emit('golden_rule_violation', {
          rule: 'current_documentation',
          taskId,
          violation: `Outdated documentation version: ${result.metadata['documentationVersion']}`,
        });
        return false;
      }
    }
    
    // GOLDEN RULE 2: ALWAYS know current date
    const currentDate = new Date().toISOString().split('T')[0];
    for (const [taskId, result] of results.entries()) {
      if (result.metadata?.['dateAware'] !== currentDate) {
        this.emit('golden_rule_violation', {
          rule: 'current_date',
          taskId,
          violation: 'Task not executed with current date awareness',
        });
        return false;
      }
    }
    
    // GOLDEN RULE 3: PERFECT execution (context < 50%, comprehensive prompts, right models)
    const totalTokensUsed = Array.from(results.values()).reduce(
      (sum, result) => sum + result.resourcesUsed.tokensConsumed, 0
    );
    
    if (totalTokensUsed > this.estimateContextLimit() * this.maxContextUsage) {
      this.emit('golden_rule_violation', {
        rule: 'perfect_execution',
        violation: `Context usage exceeded 50% limit (${((totalTokensUsed / this.estimateContextLimit()) * 100).toFixed(1)}%)`,
      });
      return false;
    }
    
    return true;
  }

  /**
   * Create error result for failed executions
   */
  private createErrorResult(error: string, startTime: number): AgentExecutionResult {
    return {
      success: false,
      output: null,
      performanceMetrics: this.createFailureMetrics(),
      resourcesUsed: {
        tokensConsumed: 0,
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
      },
      errors: [error],
    };
  }

  /**
   * Create rejection result for quality failures
   */
  private createRejectionResult(assessment: QualityAssessment, startTime: number): AgentExecutionResult {
    return {
      success: false,
      output: assessment,
      performanceMetrics: this.createFailureMetrics(),
      resourcesUsed: {
        tokensConsumed: 0,
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
      },
      errors: [
        `Quality assessment: ${assessment.overall}`,
        ...assessment.blockers,
      ],
      warnings: assessment.issues,
      metadata: {
        qualityScore: assessment.score,
        categories: assessment.categories,
      },
    };
  }

  // Helper methods for task analysis and execution
  // analyzeTaskComplexity method removed as unused

  private isCodeTask(context: TaskExecutionContext): boolean {
    const codeKeywords = ['implement', 'code', 'function', 'class', 'method', 'algorithm', 'api'];
    return context.requirements.some(req => 
      codeKeywords.some(keyword => req.toLowerCase().includes(keyword))
    );
  }

  private isUITask(context: TaskExecutionContext): boolean {
    const uiKeywords = ['ui', 'interface', 'component', 'design', 'visual', 'layout', 'responsive'];
    return context.requirements.some(req => 
      uiKeywords.some(keyword => req.toLowerCase().includes(keyword))
    );
  }

  private identifyParallelTasks(subtasks: readonly TaskDecomposition['subtasks'][number][]): readonly TaskId[][] {
    // Simple dependency-based parallelization
    const batches: TaskId[][] = [];
    const completed = new Set<TaskId>();
    const remaining = [...subtasks];
    
    while (remaining.length > 0) {
      const batch: TaskId[] = [];
      
      // Find tasks with no unmet dependencies
      const ready = remaining.filter(task => 
        task.dependencies.every(dep => completed.has(dep))
      );
      
      if (ready.length === 0 && remaining.length > 0) {
        // Circular dependency or other issue
        batch.push(remaining[0]!.id);
        remaining.splice(0, 1);
      } else {
        ready.forEach(task => {
          batch.push(task.id);
          completed.add(task.id);
          const index = remaining.indexOf(task);
          if (index > -1) remaining.splice(index, 1);
        });
      }
      
      batches.push(batch);
    }
    
    return batches;
  }

  private estimateTotalDuration(
    subtasks: readonly TaskDecomposition['subtasks'][number][],
    parallelizable: readonly TaskId[][]
  ): number {
    // Estimate duration based on parallel execution
    return parallelizable.reduce((totalTime, batch) => {
      const batchTime = Math.max(
        ...batch.map(taskId => {
          const task = subtasks.find(t => t.id === taskId);
          return task ? task.estimatedTokens / 100 : 0; // Rough estimate: 100 tokens per second
        })
      );
      return totalTime + batchTime;
    }, 0);
  }

  private determineOutputFormat(agentType: AgentType): string {
    const formats = {
      analyst: 'Detailed analysis with recommendations and technical specifications',
      developer: 'Working code with comprehensive comments and documentation',
      tester: 'Complete test suite with coverage report and validation results',
      reviewer: 'Code review report with quality metrics and improvement suggestions',
      designer: 'UI/UX design with specifications, mockups, and interaction patterns',
      orchestrator: 'Orchestration plan with task breakdown and execution strategy',
    };
    
    return formats[agentType as keyof typeof formats] || 'Structured output appropriate for task type';
  }

  private async executeViaSpecializedAgent(
    agentType: AgentType,
    context: TaskExecutionContext
  ): Promise<AgentExecutionResult> {
    // Simulation of specialized agent execution
    // In production, this would route to actual specialized agents
    
    const simulationDelay = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, simulationDelay));
    
    return {
      success: true,
      output: `Simulated output from ${agentType} agent for task ${context.taskId}`,
      performanceMetrics: {
        successRate: 0.95 + Math.random() * 0.05, // 95-100%
        averageTaskCompletionTime: simulationDelay,
        codeQualityScore: 0.90 + Math.random() * 0.10, // 90-100%
        userSatisfactionRating: 0.85 + Math.random() * 0.15, // 85-100%
        adaptationSpeed: 0.80 + Math.random() * 0.20, // 80-100%
        errorRecoveryRate: 0.90 + Math.random() * 0.10, // 90-100%
        knowledgeRetention: 0.85,
        crossDomainTransfer: 0.75,
        computationalEfficiency: 0.80,
        responseLatency: simulationDelay,
        throughput: 1,
        resourceUtilization: 0.60,
        bugIntroductionRate: 0.05,
        testCoverage: 1.0,
        documentationQuality: 0.90,
        maintainabilityScore: 0.85,
        communicationEffectiveness: 0.90,
        teamIntegration: 0.85,
        feedbackIncorporation: 0.80,
        conflictResolution: 0.85,
      },
      resourcesUsed: {
        tokensConsumed: Math.floor(Math.random() * 5000 + 1000),
        executionTime: simulationDelay,
        memoryUsed: Math.floor(Math.random() * 100 + 50),
      },
      metadata: {
        agentType,
        documentationVersion: 'latest',
        dateAware: new Date().toISOString().split('T')[0],
      },
    };
  }

  private compileFinalResult(
    results: Map<TaskId, AgentExecutionResult>,
    assessment: QualityAssessment
  ): unknown {
    return {
      subtasks: Object.fromEntries(results.entries()),
      qualityAssessment: assessment,
      overallSuccess: assessment.overall !== 'unacceptable',
      summary: `Task completed with ${assessment.overall} quality (${(assessment.score * 100).toFixed(1)}%)`,
    };
  }

  private calculatePerformanceMetrics(executionTime: number, assessment: QualityAssessment) {
    return {
      successRate: assessment.score,
      averageTaskCompletionTime: executionTime,
      codeQualityScore: assessment.categories.codeQuality,
      userSatisfactionRating: assessment.score,
      adaptationSpeed: 0.85,
      errorRecoveryRate: 0.90,
      knowledgeRetention: 0.85,
      crossDomainTransfer: 0.75,
      computationalEfficiency: 0.80,
      responseLatency: executionTime / 2,
      throughput: 1,
      resourceUtilization: 0.60,
      bugIntroductionRate: 1 - assessment.categories.testing,
      testCoverage: assessment.categories.testing,
      documentationQuality: assessment.categories.documentation,
      maintainabilityScore: assessment.categories.maintainability,
      communicationEffectiveness: 0.90,
      teamIntegration: 0.85,
      feedbackIncorporation: 0.80,
      conflictResolution: 0.85,
    };
  }

  private estimateContextLimit(): number {
    return 200000; // Assume 200k token context limit (Claude-3.5 Sonnet)
  }

  private estimateMemoryUsage(decomposition: TaskDecomposition): number {
    return decomposition.subtasks.length * 10; // Rough estimate: 10MB per subtask
  }

  private isCurrentDocumentation(version: string): boolean {
    // Simple check - in production this would verify against actual current versions
    return version === 'latest' || version.includes('2024') || version.includes('2025');
  }
}

export default OrchestratorAgent;