/**
 * Evolution Integration Service for Sentra Evolutionary Agent System
 * 
 * This service connects the existing DNA evolution system to project management workflow,
 * enabling cross-project learning and real-time evolution metrics.
 * 
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */

import { EventEmitter } from 'events';
import type { 
  CodeDNA,
  EvolutionDnaId,
  AgentInstanceId,
  TaskId,
  ProjectContextId,
  ProjectContext,
  EnhancedPerformanceMetrics as PerformanceMetrics,
  EvolutionEventId,
  FitnessScore,
  EnhancedGeneticMarkers as GeneticMarkers,
  Brand
} from '@sentra/types';

import type {
  PerformanceFeedback,
} from '../types';
import { DNAEngine, type DNAEngineConfig, type EvolutionParameters } from '../dna';

// ============================================================================
// EVOLUTION SERVICE TYPES
// ============================================================================

export type EvolutionServiceId = Brand<string, 'EvolutionServiceId'>;

export interface EvolutionServiceConfig {
  readonly dnaEngine: DNAEngineConfig;
  readonly crossProjectLearning: {
    readonly enabled: boolean;
    readonly similarityThreshold: number; // 0-1, minimum similarity for pattern sharing
    readonly maxPatternAge: number; // milliseconds, how old patterns can be to share
  };
  readonly realTimeMetrics: {
    readonly enabled: boolean;
    readonly metricsUpdateInterval: number; // milliseconds
    readonly evolutionEventBatchSize: number;
  };
  readonly vectorDatabase: {
    readonly dimensions: number; // embedding dimensions
    readonly indexType: 'cosine' | 'euclidean' | 'dot_product';
  };
}

export interface EvolutionIntegrationResult {
  readonly success: boolean;
  readonly dnaId: EvolutionDnaId;
  readonly evolutionEvents: readonly EvolutionEventData[];
  readonly crossProjectPatterns: readonly CrossProjectPattern[];
  readonly metricsUpdate: EvolutionMetricsUpdate;
  readonly reason: string;
  readonly confidence: number;
}

export interface EvolutionEventData {
  readonly id: EvolutionEventId;
  readonly type: 'dna_created' | 'dna_evolved' | 'pattern_learned' | 'cross_pollination' | 'fitness_improvement';
  readonly agentId: AgentInstanceId;
  readonly projectId: ProjectContextId;
  readonly taskId?: TaskId;
  readonly dnaId: EvolutionDnaId;
  readonly parentDnaId?: EvolutionDnaId;
  readonly geneticChanges: Record<string, { from: unknown; to: unknown }>;
  readonly performanceDelta: PerformanceMetrics;
  readonly timestamp: Date;
  readonly metadata: Record<string, unknown>;
}

export interface CrossProjectPattern {
  readonly id: string;
  readonly sourceDnaId: EvolutionDnaId;
  readonly sourceProjectId: ProjectContextId;
  readonly targetProjectId: ProjectContextId;
  readonly patternType: string;
  readonly similarity: number; // 0-1, how similar the contexts are
  readonly applicability: number; // 0-1, how applicable this pattern is to target
  readonly transferredAt: Date;
  readonly successPrediction: number; // 0-1, predicted success of transfer
}

export interface EvolutionMetricsUpdate {
  readonly totalEvolutions: number;
  readonly averageFitnessImprovement: number;
  readonly crossProjectTransfers: number;
  readonly activePatterns: number;
  readonly generationDistribution: Record<number, number>;
  readonly topPerformingPatterns: readonly {
    readonly dnaId: EvolutionDnaId;
    readonly fitness: FitnessScore;
    readonly context: string;
  }[];
  readonly evolutionTrends: {
    readonly improvementRate: number; // evolutions per hour
    readonly successRate: number; // % of successful evolutions
    readonly diversityIndex: number; // 0-1, genetic diversity
  };
}

export interface ProjectLearningContext {
  readonly projectId: ProjectContextId;
  readonly activeAgents: readonly AgentInstanceId[];
  readonly completedTasks: number;
  readonly averagePerformance: PerformanceMetrics;
  readonly dominantPatterns: readonly {
    readonly patternType: string;
    readonly frequency: number;
    readonly effectiveness: number;
  }[];
  readonly evolutionActivity: {
    readonly recentEvolutions: number;
    readonly avgFitnessImprovement: number;
    readonly patternDiversity: number;
  };
}

// ============================================================================
// EVOLUTION INTEGRATION SERVICE
// ============================================================================

export class EvolutionIntegrationService extends EventEmitter {
  private readonly config: EvolutionServiceConfig;
  private readonly dnaEngine: DNAEngine;
  private readonly activeDnaPatterns = new Map<EvolutionDnaId, CodeDNA>();
  private readonly crossProjectPatterns = new Map<string, CrossProjectPattern>();
  private readonly projectLearningContexts = new Map<ProjectContextId, ProjectLearningContext>();
  private readonly evolutionEvents: EvolutionEventData[] = [];
  private metricsUpdateTimer?: NodeJS.Timeout;

  constructor(config: Partial<EvolutionServiceConfig> = {}) {
    super();
    
    // Default configuration
    this.config = {
      dnaEngine: {
        mutationRate: 0.1,
        crossoverRate: 0.7,
        maxGenerations: 100,
        populationSize: 50,
        fitnessThreshold: 0.6,
        diversityWeight: 0.2,
        performanceWeight: 0.4,
        contextWeight: 0.4,
        ...config.dnaEngine,
      },
      crossProjectLearning: {
        enabled: true,
        similarityThreshold: 0.7,
        maxPatternAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        ...config.crossProjectLearning,
      },
      realTimeMetrics: {
        enabled: true,
        metricsUpdateInterval: 30000, // 30 seconds
        evolutionEventBatchSize: 10,
        ...config.realTimeMetrics,
      },
      vectorDatabase: {
        dimensions: 1536,
        indexType: 'cosine' as const,
        ...config.vectorDatabase,
      },
    };

    // Initialize DNA engine
    this.dnaEngine = new DNAEngine(this.config.dnaEngine);

    // Set up DNA engine event listeners
    this.setupDnaEngineListeners();

    // Start real-time metrics if enabled
    if (this.config.realTimeMetrics.enabled) {
      this.startMetricsUpdates();
    }
  }

  /**
   * Generate a consistent ProjectContextId from ProjectContext
   */
  private generateProjectContextId(projectContext: ProjectContext): ProjectContextId {
    const contextHash = `${projectContext.projectType}_${projectContext.complexity}_${projectContext.techStack.join('_')}`;
    return contextHash as ProjectContextId;
  }

  /**
   * Initialize a new agent with evolutionary DNA for a project context
   */
  async initializeAgentDna(
    agentId: AgentInstanceId,
    projectContext: ProjectContext,
    taskId?: TaskId,
    seedPatterns?: readonly CodeDNA[]
  ): Promise<EvolutionIntegrationResult> {
    try {
      // Check for existing patterns that might be suitable for this context
      const similarPatterns = await this.findSimilarPatterns(projectContext);
      
      // Generate or select DNA pattern
      let dna: CodeDNA;
      if (similarPatterns.length > 0 && Math.random() > 0.3) {
        // Use existing pattern as base (70% chance if available)
        dna = await this.adaptExistingPattern(
          similarPatterns[0]!.dna,
          projectContext,
          agentId
        );
      } else {
        // Generate new DNA pattern
        dna = await this.dnaEngine.generateNewDna(projectContext, seedPatterns);
      }

      // Store the DNA pattern
      this.activeDnaPatterns.set(dna.id, dna);

      // Update project learning context
      const projectId = this.generateProjectContextId(dna.context);
      await this.updateProjectLearningContext(projectId, agentId);

      // Create evolution event
      const evolutionEvent = await this.createEvolutionEvent(
        'dna_created',
        agentId,
        this.generateProjectContextId(dna.context),
        dna.id,
        undefined,
        {},
        dna.performance,
        taskId
      );

      // Check for cross-project learning opportunities
      const crossProjectPatterns = await this.identifyCrossProjectOpportunities(dna);

      // Generate metrics update
      const metricsUpdate = await this.generateMetricsUpdate();

      this.emit('agent_dna_initialized', {
        agentId,
        dnaId: dna.id,
        projectId: projectContext.id,
        taskId,
        fitness: dna.fitnessScore,
      });

      return {
        success: true,
        dnaId: dna.id,
        evolutionEvents: [evolutionEvent],
        crossProjectPatterns,
        metricsUpdate,
        reason: `Successfully initialized agent ${agentId} with DNA pattern ${dna.patternType}`,
        confidence: 0.85,
      };

    } catch (error) {
      this.emit('evolution_error', { agentId, error });
      throw new Error(`Failed to initialize agent DNA: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process task completion feedback and evolve DNA if needed
   */
  async processTaskFeedback(
    agentId: AgentInstanceId,
    taskId: TaskId,
    feedback: PerformanceFeedback,
    evolutionParameters?: EvolutionParameters
  ): Promise<EvolutionIntegrationResult> {
    try {
      const dna = this.activeDnaPatterns.get(feedback.dnaId);
      if (!dna) {
        throw new Error(`DNA pattern ${feedback.dnaId} not found for agent ${agentId}`);
      }

      // Determine if evolution is needed based on performance
      const shouldEvolve = this.shouldTriggerEvolution(feedback, dna);
      
      if (!shouldEvolve) {
        // Just update metrics without evolution
        const metricsUpdate = await this.generateMetricsUpdate();
        return {
          success: true,
          dnaId: feedback.dnaId,
          evolutionEvents: [],
          crossProjectPatterns: [],
          metricsUpdate,
          reason: 'Performance feedback processed, no evolution needed',
          confidence: 0.6,
        };
      }

      // Evolve the DNA pattern
      const evolutionResult = await this.dnaEngine.evolvePattern(
        dna,
        feedback.context,
        evolutionParameters as any
      );

      if (!evolutionResult.success) {
        return {
          success: false,
          dnaId: feedback.dnaId,
          evolutionEvents: [],
          crossProjectPatterns: [],
          metricsUpdate: await this.generateMetricsUpdate(),
          reason: evolutionResult.reason,
          confidence: 0.3,
        };
      }

      // Update stored pattern
      this.activeDnaPatterns.set(evolutionResult.evolvedPattern.id, evolutionResult.evolvedPattern);

      // Create evolution event
      const evolutionEvent = await this.createEvolutionEvent(
        'dna_evolved',
        agentId,
        this.generateProjectContextId(feedback.context),
        evolutionResult.evolvedPattern.id,
        feedback.dnaId,
        this.calculateGeneticChanges(dna, evolutionResult.evolvedPattern),
        evolutionResult.evolvedPattern.performance,
        taskId
      );

      // Look for cross-project learning opportunities
      const crossProjectPatterns = await this.identifyCrossProjectOpportunities(evolutionResult.evolvedPattern);

      // Apply cross-project patterns if found
      await this.applyCrossProjectLearning(crossProjectPatterns);

      // Generate updated metrics
      const metricsUpdate = await this.generateMetricsUpdate();

      this.emit('dna_evolved', {
        agentId,
        originalDnaId: feedback.dnaId,
        evolvedDnaId: evolutionResult.evolvedPattern.id,
        fitnessImprovement: evolutionResult.fitnessImprovement,
        generation: evolutionResult.evolvedPattern.generation,
      });

      return {
        success: true,
        dnaId: evolutionResult.evolvedPattern.id,
        evolutionEvents: [evolutionEvent],
        crossProjectPatterns,
        metricsUpdate,
        reason: `DNA evolved from generation ${dna.generation} to ${evolutionResult.evolvedPattern.generation}`,
        confidence: 0.9,
      };

    } catch (error) {
      this.emit('evolution_error', { agentId, taskId, error });
      throw new Error(`Failed to process task feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find patterns similar to the given project context for cross-project learning
   */
  async findSimilarPatterns(
    targetContext: ProjectContext,
    maxResults: number = 5
  ): Promise<readonly { dna: CodeDNA; similarity: number }[]> {
    const allPatterns = Array.from(this.activeDnaPatterns.values());
    
    // Calculate similarity scores for each pattern
    const similarityScores = allPatterns.map(dna => ({
      dna,
      similarity: this.calculateContextSimilarity(dna.context, targetContext),
    }));

    // Sort by similarity and return top results
    return similarityScores
      .filter(item => item.similarity >= this.config.crossProjectLearning.similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  /**
   * Get current evolution metrics for dashboard display
   */
  async getEvolutionMetrics(): Promise<EvolutionMetricsUpdate> {
    return await this.generateMetricsUpdate();
  }

  /**
   * Get project-specific learning context
   */
  getProjectLearningContext(projectId: ProjectContextId): ProjectLearningContext | undefined {
    return this.projectLearningContexts.get(projectId);
  }

  /**
   * Get recent evolution events for monitoring
   */
  getRecentEvolutionEvents(limit: number = 50): readonly EvolutionEventData[] {
    return this.evolutionEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setupDnaEngineListeners(): void {
    this.dnaEngine.on('pattern_evolved', (event) => {
      this.emit('pattern_evolved', event);
    });

    this.dnaEngine.on('evolution_error', (event) => {
      this.emit('evolution_error', event);
    });
  }

  private startMetricsUpdates(): void {
    this.metricsUpdateTimer = setInterval(async () => {
      try {
        const metrics = await this.generateMetricsUpdate();
        this.emit('metrics_update', metrics);
      } catch (error) {
        this.emit('metrics_error', error);
      }
    }, this.config.realTimeMetrics.metricsUpdateInterval);
  }

  private shouldTriggerEvolution(
    feedback: PerformanceFeedback,
    currentDna: CodeDNA
  ): boolean {
    // Evolution triggers:
    // 1. Significant performance improvement opportunity
    // 2. Performance regression
    // 3. New context requirements
    // 4. Pattern age and staleness

    const performanceDelta = feedback.metrics.successRate - currentDna.performance.successRate;
    const hasRegression = feedback.outcome === 'failure' || performanceDelta < -0.1;
    const hasImprovementOpportunity = feedback.improvements.length > 0;
    const contextMismatch = this.calculateContextSimilarity(currentDna.context, feedback.context) < 0.6;

    return hasRegression || hasImprovementOpportunity || contextMismatch;
  }

  private async adaptExistingPattern(
    baseDna: CodeDNA,
    newContext: ProjectContext,
    agentId: AgentInstanceId
  ): Promise<CodeDNA> {
    // Create adapted version of existing pattern for new context
    const adaptedGenetics: GeneticMarkers = {
      ...baseDna.genetics,
      adaptability: Math.min(1, baseDna.genetics.adaptability + 0.05),
    };

    const adaptedDna: CodeDNA = {
      ...baseDna,
      id: `adapted_${Date.now()}_${agentId.slice(-8)}` as EvolutionDnaId,
      context: newContext,
      genetics: adaptedGenetics,
      generation: baseDna.generation + 1,
      parentId: baseDna.id,
      timestamp: new Date(),
      birthContext: {
        trigger: 'crossover',
        creationReason: 'Adapted existing pattern for new project context',
        initialPerformance: baseDna.performance,
      },
      evolutionHistory: [
        ...baseDna.evolutionHistory,
        `Adapted from ${baseDna.id} for ${newContext.projectType} context at ${new Date().toISOString()}`,
      ],
      activationCount: 0,
      lastActivation: new Date(),
    };

    return adaptedDna;
  }

  private async createEvolutionEvent(
    type: EvolutionEventData['type'],
    agentId: AgentInstanceId,
    projectId: ProjectContextId,
    dnaId: EvolutionDnaId,
    parentDnaId: EvolutionDnaId | undefined,
    geneticChanges: Record<string, { from: unknown; to: unknown }>,
    performanceDelta: PerformanceMetrics,
    taskId?: TaskId
  ): Promise<EvolutionEventData> {
    const event: EvolutionEventData = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}` as EvolutionEventId,
      type,
      agentId,
      projectId,
      ...(taskId !== undefined && { taskId }),
      dnaId,
      ...(parentDnaId !== undefined && { parentDnaId }),
      geneticChanges,
      performanceDelta,
      timestamp: new Date(),
      metadata: {
        evolutionServiceVersion: '1.0.0',
        contextComplexity: this.activeDnaPatterns.get(dnaId)?.context.complexity,
      },
    };

    // Store event in memory (in production, this would go to database)
    this.evolutionEvents.push(event);
    
    // Keep only recent events to prevent memory bloat
    if (this.evolutionEvents.length > 1000) {
      this.evolutionEvents.splice(0, this.evolutionEvents.length - 1000);
    }

    return event;
  }

  private async identifyCrossProjectOpportunities(
    dna: CodeDNA
  ): Promise<readonly CrossProjectPattern[]> {
    if (!this.config.crossProjectLearning.enabled) {
      return [];
    }

    const similarPatterns = await this.findSimilarPatterns(dna.context);
    const opportunities: CrossProjectPattern[] = [];

    for (const similar of similarPatterns) {
      const similarProjectId = this.generateProjectContextId(similar.dna.context);
      const dnaProjectId = this.generateProjectContextId(dna.context);
      if (similarProjectId !== dnaProjectId) {
        const pattern: CrossProjectPattern = {
          id: `cross_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          sourceDnaId: dna.id,
          sourceProjectId: dnaProjectId,
          targetProjectId: similarProjectId,
          patternType: dna.patternType,
          similarity: similar.similarity,
          applicability: this.calculateApplicability(dna, similar.dna),
          transferredAt: new Date(),
          successPrediction: this.predictTransferSuccess(dna, similar.dna),
        };

        opportunities.push(pattern);
      }
    }

    return opportunities.slice(0, 3); // Limit to top 3 opportunities
  }

  private async applyCrossProjectLearning(
    patterns: readonly CrossProjectPattern[]
  ): Promise<void> {
    for (const pattern of patterns) {
      if (pattern.successPrediction > 0.7) {
        this.crossProjectPatterns.set(pattern.id, pattern);
        
        this.emit('cross_project_pattern_identified', {
          patternId: pattern.id,
          sourceProject: pattern.sourceProjectId,
          targetProject: pattern.targetProjectId,
          similarity: pattern.similarity,
          successPrediction: pattern.successPrediction,
        });
      }
    }
  }

  private calculateContextSimilarity(
    context1: ProjectContext,
    context2: ProjectContext
  ): number {
    let similarity = 0;

    // Project type match (40% weight)
    if (context1.projectType === context2.projectType) {
      similarity += 0.4;
    }

    // Technology stack overlap (30% weight)
    const commonTech = context1.techStack.filter(tech => 
      context2.techStack.includes(tech)
    );
    const techSimilarity = commonTech.length / Math.max(context1.techStack.length, context2.techStack.length, 1);
    similarity += techSimilarity * 0.3;

    // Complexity compatibility (20% weight)
    const complexityLevels = ['low', 'medium', 'high', 'enterprise'];
    const complexityDistance = Math.abs(
      complexityLevels.indexOf(context1.complexity) - 
      complexityLevels.indexOf(context2.complexity)
    );
    similarity += (1 - complexityDistance / 3) * 0.2;

    // Team size compatibility (10% weight)
    const teamSizeSimilarity = 1 - Math.abs(context1.teamSize - context2.teamSize) / Math.max(context1.teamSize, context2.teamSize, 1);
    similarity += teamSizeSimilarity * 0.1;

    return Math.max(0, Math.min(1, similarity));
  }

  private calculateApplicability(dna1: CodeDNA, dna2: CodeDNA): number {
    // Calculate how applicable dna1's patterns are to dna2's context
    const geneticCompatibility = this.calculateGeneticCompatibility(dna1.genetics, dna2.genetics);
    const contextSimilarity = this.calculateContextSimilarity(dna1.context, dna2.context);
    const performanceAlignment = this.calculatePerformanceAlignment(dna1.performance, dna2.performance);

    return (geneticCompatibility * 0.4 + contextSimilarity * 0.4 + performanceAlignment * 0.2);
  }

  private calculateGeneticCompatibility(
    genetics1: GeneticMarkers,
    genetics2: GeneticMarkers
  ): number {
    const keys = Object.keys(genetics1) as (keyof GeneticMarkers)[];
    const distances = keys.map(key => {
      const val1 = genetics1[key] as number;
      const val2 = genetics2[key] as number;
      return 1 - Math.abs(val1 - val2);
    });

    return distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
  }

  private calculatePerformanceAlignment(
    perf1: PerformanceMetrics,
    perf2: PerformanceMetrics
  ): number {
    // Simple alignment based on success rate and quality scores
    const successAlignment = 1 - Math.abs(perf1.successRate - perf2.successRate);
    const qualityAlignment = 1 - Math.abs(perf1.codeQualityScore - perf2.codeQualityScore);
    
    return (successAlignment + qualityAlignment) / 2;
  }

  private predictTransferSuccess(dna1: CodeDNA, dna2: CodeDNA): number {
    // Predict likelihood of successful pattern transfer
    const contextSim = this.calculateContextSimilarity(dna1.context, dna2.context);
    const fitnessGap = Math.abs(dna1.fitnessScore - dna2.fitnessScore);
    const generationGap = Math.abs(dna1.generation - dna2.generation);

    // Higher context similarity, smaller fitness gap, and similar generations = better success
    const successScore = (
      contextSim * 0.5 +
      (1 - fitnessGap) * 0.3 +
      (1 - Math.min(1, generationGap / 10)) * 0.2
    );

    return Math.max(0, Math.min(1, successScore));
  }

  private calculateGeneticChanges(
    oldDna: CodeDNA,
    newDna: CodeDNA
  ): Record<string, { from: unknown; to: unknown }> {
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    
    const keys = Object.keys(oldDna.genetics) as (keyof GeneticMarkers)[];
    for (const key of keys) {
      const oldValue = oldDna.genetics[key];
      const newValue = newDna.genetics[key];
      if (oldValue !== newValue) {
        changes[key] = { from: oldValue, to: newValue };
      }
    }

    return changes;
  }

  private async updateProjectLearningContext(
    projectId: ProjectContextId,
    agentId: AgentInstanceId
  ): Promise<void> {
    const existing = this.projectLearningContexts.get(projectId);
    
    // This is a simplified implementation - in production would query database
    const updatedContext: ProjectLearningContext = {
      projectId,
      activeAgents: existing 
        ? [...new Set([...existing.activeAgents, agentId])]
        : [agentId],
      completedTasks: (existing?.completedTasks ?? 0),
      averagePerformance: existing?.averagePerformance ?? {
        successRate: 0.5,
        averageTaskCompletionTime: 60000,
        codeQualityScore: 0.5,
        userSatisfactionRating: 0.5,
        adaptationSpeed: 0.5,
        errorRecoveryRate: 0.5,
        knowledgeRetention: 0.5,
        crossDomainTransfer: 0.5,
        computationalEfficiency: 0.5,
        responseLatency: 1000,
        throughput: 1,
        resourceUtilization: 0.5,
        bugIntroductionRate: 0.1,
        testCoverage: 0.7,
        documentationQuality: 0.6,
        maintainabilityScore: 0.6,
        communicationEffectiveness: 0.7,
        teamIntegration: 0.6,
        feedbackIncorporation: 0.6,
        conflictResolution: 0.5,
      },
      dominantPatterns: existing?.dominantPatterns ?? [],
      evolutionActivity: {
        recentEvolutions: (existing?.evolutionActivity.recentEvolutions ?? 0) + 1,
        avgFitnessImprovement: existing?.evolutionActivity.avgFitnessImprovement ?? 0.05,
        patternDiversity: this.calculatePatternDiversity(projectId),
      },
    };

    this.projectLearningContexts.set(projectId, updatedContext);
  }

  private calculatePatternDiversity(projectId: ProjectContextId): number {
    const projectPatterns = Array.from(this.activeDnaPatterns.values())
      .filter(dna => this.generateProjectContextId(dna.context) === projectId);

    if (projectPatterns.length < 2) return 0;

    // Calculate average genetic distance between patterns
    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < projectPatterns.length; i++) {
      for (let j = i + 1; j < projectPatterns.length; j++) {
        totalDistance += this.calculateGeneticDistance(
          projectPatterns[i]!.genetics,
          projectPatterns[j]!.genetics
        );
        comparisons++;
      }
    }

    return comparisons > 0 ? totalDistance / comparisons : 0;
  }

  private calculateGeneticDistance(
    genetics1: GeneticMarkers,
    genetics2: GeneticMarkers
  ): number {
    const keys = Object.keys(genetics1) as (keyof GeneticMarkers)[];
    const distances = keys.map(key => {
      const val1 = genetics1[key] as number;
      const val2 = genetics2[key] as number;
      return Math.abs(val1 - val2);
    });

    return distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
  }

  private async generateMetricsUpdate(): Promise<EvolutionMetricsUpdate> {
    const allPatterns = Array.from(this.activeDnaPatterns.values());
    const recentEvents = this.evolutionEvents.filter(
      event => Date.now() - event.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    const generationCounts: Record<number, number> = {};
    let totalFitness = 0;

    for (const pattern of allPatterns) {
      generationCounts[pattern.generation] = (generationCounts[pattern.generation] ?? 0) + 1;
      totalFitness += pattern.fitnessScore;
    }

    const topPerforming = allPatterns
      .sort((a, b) => b.fitnessScore - a.fitnessScore)
      .slice(0, 5)
      .map(dna => ({
        dnaId: dna.id,
        fitness: dna.fitnessScore,
        context: `${dna.context.projectType} (${dna.context.complexity})`,
      }));

    const evolutionSuccessEvents = recentEvents.filter(
      event => event.type === 'dna_evolved' || event.type === 'fitness_improvement'
    );

    return {
      totalEvolutions: this.evolutionEvents.length,
      averageFitnessImprovement: allPatterns.length > 0 ? totalFitness / allPatterns.length : 0,
      crossProjectTransfers: this.crossProjectPatterns.size,
      activePatterns: allPatterns.length,
      generationDistribution: generationCounts,
      topPerformingPatterns: topPerforming,
      evolutionTrends: {
        improvementRate: evolutionSuccessEvents.length, // per hour
        successRate: recentEvents.length > 0 ? evolutionSuccessEvents.length / recentEvents.length : 0,
        diversityIndex: this.calculateOverallDiversity(),
      },
    };
  }

  private calculateOverallDiversity(): number {
    const allPatterns = Array.from(this.activeDnaPatterns.values());
    if (allPatterns.length < 2) return 0;

    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < allPatterns.length; i++) {
      for (let j = i + 1; j < allPatterns.length; j++) {
        totalDistance += this.calculateGeneticDistance(
          allPatterns[i]!.genetics,
          allPatterns[j]!.genetics
        );
        comparisons++;
      }
    }

    return comparisons > 0 ? totalDistance / comparisons : 0;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.metricsUpdateTimer) {
      clearInterval(this.metricsUpdateTimer);
    }
    this.removeAllListeners();
  }
}

export default EvolutionIntegrationService;