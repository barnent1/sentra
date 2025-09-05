/**
 * Knowledge Transfer System for Cross-Project Agent Learning
 * 
 * This system enables intelligent pattern sharing and knowledge transfer
 * between agents working on different projects, facilitating collective learning.
 * 
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */

import { EventEmitter } from 'events';
import type {
  CodeDNA,
  EvolutionDnaId,
  AgentInstanceId,
  ProjectContextId,
  TaskId,
  GeneticMarkers,
  PerformanceMetrics,
  ProjectContext,
  Mutation,
  Brand
} from '../types';

// ============================================================================
// KNOWLEDGE TRANSFER TYPES
// ============================================================================

export type KnowledgeTransferId = Brand<string, 'KnowledgeTransferId'>;
export type LearningSessionId = Brand<string, 'LearningSessionId'>;
export type KnowledgeItemId = Brand<string, 'KnowledgeItemId'>;

export interface KnowledgeItem {
  readonly id: KnowledgeItemId;
  readonly sourceAgentId: AgentInstanceId;
  readonly sourceDnaId: EvolutionDnaId;
  readonly sourceProjectId: ProjectContextId;
  readonly knowledgeType: KnowledgeType;
  readonly content: KnowledgeContent;
  readonly applicability: KnowledgeApplicability;
  readonly quality: KnowledgeQuality;
  readonly metadata: KnowledgeMetadata;
  readonly createdAt: Date;
  readonly lastUsed: Date;
  readonly useCount: number;
}

export const KnowledgeType = {
  PROBLEM_SOLVING_PATTERN: 'problem_solving_pattern',
  ERROR_RECOVERY_STRATEGY: 'error_recovery_strategy',
  OPTIMIZATION_TECHNIQUE: 'optimization_technique',
  COLLABORATION_APPROACH: 'collaboration_approach',
  ADAPTATION_STRATEGY: 'adaptation_strategy',
  PERFORMANCE_INSIGHT: 'performance_insight',
  CONTEXT_UNDERSTANDING: 'context_understanding',
  RESOURCE_MANAGEMENT: 'resource_management',
} as const;

export type KnowledgeType = typeof KnowledgeType[keyof typeof KnowledgeType];

export interface KnowledgeContent {
  readonly title: string;
  readonly description: string;
  readonly keyInsights: readonly string[];
  readonly geneticMarkerPatterns: Partial<GeneticMarkers>;
  readonly performanceImpacts: Partial<PerformanceMetrics>;
  readonly contextualFactors: readonly string[];
  readonly prerequisites: readonly string[];
  readonly contraindications: readonly string[]; // When NOT to use this knowledge
  readonly examples: readonly KnowledgeExample[];
}

export interface KnowledgeExample {
  readonly scenario: string;
  readonly application: string;
  readonly outcome: string;
  readonly lessons: readonly string[];
}

export interface KnowledgeApplicability {
  readonly projectTypes: readonly string[];
  readonly complexityLevels: readonly string[];
  readonly teamSizes: readonly number[];
  readonly techStacks: readonly string[];
  readonly contextualRequirements: readonly string[];
  readonly exclusions: readonly string[]; // Contexts where this doesn't apply
}

export interface KnowledgeQuality {
  readonly reliability: number; // 0-1, how reliable this knowledge is
  readonly generalizability: number; // 0-1, how well it generalizes across contexts
  readonly specificity: number; // 0-1, how specific vs. general the knowledge is
  readonly novelty: number; // 0-1, how novel this insight is
  readonly impact: number; // 0-1, potential performance impact
  readonly confidence: number; // 0-1, confidence in the knowledge
}

export interface KnowledgeMetadata {
  readonly sourceTask: TaskId;
  readonly discoveryMethod: 'evolution' | 'analysis' | 'observation' | 'transfer';
  readonly validationStatus: 'unvalidated' | 'partially_validated' | 'validated' | 'invalidated';
  readonly transferCount: number; // How many times this was transferred
  readonly successRate: number; // Success rate when applied
  readonly avgImprovement: number; // Average improvement when applied
  readonly tags: readonly string[];
  readonly relatedKnowledge: readonly KnowledgeItemId[];
}

export interface KnowledgeTransferRequest {
  readonly id: KnowledgeTransferId;
  readonly sourceKnowledge: KnowledgeItem;
  readonly targetAgentId: AgentInstanceId;
  readonly targetDnaId: EvolutionDnaId;
  readonly targetProjectId: ProjectContextId;
  readonly transferType: TransferType;
  readonly adaptationRequired: KnowledgeAdaptation;
  readonly expectedOutcome: TransferOutcome;
  readonly requestedAt: Date;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
}

export const TransferType = {
  DIRECT_APPLICATION: 'direct_application',
  ADAPTIVE_TRANSFER: 'adaptive_transfer',
  INSPIRATIONAL_TRANSFER: 'inspirational_transfer',
  HYBRID_TRANSFER: 'hybrid_transfer',
} as const;

export type TransferType = typeof TransferType[keyof typeof TransferType];

export interface KnowledgeAdaptation {
  readonly geneticModifications: Record<keyof GeneticMarkers, number>;
  readonly contextualAdjustments: readonly string[];
  readonly performanceExpectations: Partial<PerformanceMetrics>;
  readonly riskAssessment: {
    readonly level: 'low' | 'medium' | 'high';
    readonly factors: readonly string[];
    readonly mitigations: readonly string[];
  };
  readonly adaptationSteps: readonly AdaptationStep[];
}

export interface AdaptationStep {
  readonly step: number;
  readonly description: string;
  readonly action: string;
  readonly expectedDuration: number; // milliseconds
  readonly successCriteria: readonly string[];
  readonly rollbackPlan: string;
}

export interface TransferOutcome {
  readonly expectedImprovement: number; // 0-1, expected performance improvement
  readonly confidence: number; // 0-1, confidence in successful transfer
  readonly timeline: number; // milliseconds to complete transfer
  readonly successProbability: number; // 0-1, probability of success
  readonly riskLevel: 'low' | 'medium' | 'high';
}

export interface KnowledgeTransferResult {
  readonly transferId: KnowledgeTransferId;
  readonly success: boolean;
  readonly actualImprovement: number;
  readonly transferDuration: number;
  readonly adaptationsApplied: readonly string[];
  readonly lessonsLearned: readonly string[];
  readonly followUpActions: readonly string[];
  readonly validationStatus: 'pending' | 'validated' | 'failed';
}

export interface CrossProjectLearningSession {
  readonly id: LearningSessionId;
  readonly participatingProjects: readonly ProjectContextId[];
  readonly participatingAgents: readonly AgentInstanceId[];
  readonly sessionType: 'knowledge_sharing' | 'pattern_exchange' | 'collaborative_learning';
  readonly sharedKnowledge: readonly KnowledgeItem[];
  readonly transfersInitiated: readonly KnowledgeTransferRequest[];
  readonly outcomes: readonly KnowledgeTransferResult[];
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly sessionMetrics: SessionMetrics;
}

export interface SessionMetrics {
  readonly knowledgeItemsShared: number;
  readonly transfersAttempted: number;
  readonly transfersSuccessful: number;
  readonly avgImprovementAchieved: number;
  readonly participationLevel: number; // 0-1, how actively agents participated
  readonly diversityIndex: number; // 0-1, diversity of knowledge shared
  readonly noveltyScore: number; // 0-1, how much novel knowledge was generated
}

// ============================================================================
// KNOWLEDGE TRANSFER SERVICE
// ============================================================================

export class KnowledgeTransferService extends EventEmitter {
  private readonly knowledgeBase = new Map<KnowledgeItemId, KnowledgeItem>();
  private readonly activeTransfers = new Map<KnowledgeTransferId, KnowledgeTransferRequest>();
  private readonly transferHistory: KnowledgeTransferResult[] = [];
  private readonly learningSessionHistory: CrossProjectLearningSession[] = [];
  private sessionCleanupTimer?: NodeJS.Timeout;

  constructor() {
    super();
    this.startSessionCleanup();
  }

  /**
   * Extract knowledge from agent DNA evolution events
   */
  async extractKnowledge(
    agentId: AgentInstanceId,
    dnaId: EvolutionDnaId,
    projectId: ProjectContextId,
    taskId: TaskId,
    evolutionHistory: readonly Mutation[],
    performanceImprovement: number,
    context: ProjectContext
  ): Promise<readonly KnowledgeItem[]> {
    const extractedKnowledge: KnowledgeItem[] = [];

    // Extract knowledge from successful mutations
    const successfulMutations = evolutionHistory.filter(mutation => {
      // Consider mutations that led to positive outcomes
      return mutation.delta > 0 && mutation.confidence > 0.6;
    });

    for (const mutation of successfulMutations) {
      const knowledgeItem = await this.createKnowledgeFromMutation(
        agentId,
        dnaId,
        projectId,
        taskId,
        mutation,
        performanceImprovement,
        context
      );

      if (knowledgeItem) {
        extractedKnowledge.push(knowledgeItem);
        this.knowledgeBase.set(knowledgeItem.id, knowledgeItem);
      }
    }

    // Extract pattern-based knowledge
    if (evolutionHistory.length > 0) {
      const patternKnowledge = await this.extractPatternKnowledge(
        agentId,
        dnaId,
        projectId,
        evolutionHistory,
        context
      );

      if (patternKnowledge) {
        extractedKnowledge.push(patternKnowledge);
        this.knowledgeBase.set(patternKnowledge.id, patternKnowledge);
      }
    }

    this.emit('knowledge_extracted', {
      agentId,
      dnaId,
      projectId,
      knowledgeCount: extractedKnowledge.length,
    });

    return extractedKnowledge;
  }

  /**
   * Find relevant knowledge for an agent in a specific context
   */
  async findRelevantKnowledge(
    targetAgentId: AgentInstanceId,
    targetProjectId: ProjectContextId,
    targetContext: ProjectContext,
    currentDna: CodeDNA,
    maxResults: number = 10
  ): Promise<readonly KnowledgeItem[]> {
    const allKnowledge = Array.from(this.knowledgeBase.values());
    const scoredKnowledge: { knowledge: KnowledgeItem; relevanceScore: number }[] = [];

    for (const knowledge of allKnowledge) {
      // Skip knowledge from the same agent and project
      if (knowledge.sourceAgentId === targetAgentId && knowledge.sourceProjectId === targetProjectId) {
        continue;
      }

      const relevanceScore = await this.calculateRelevanceScore(
        knowledge,
        targetContext,
        currentDna
      );

      if (relevanceScore > 0.3) { // Minimum relevance threshold
        scoredKnowledge.push({ knowledge, relevanceScore });
      }
    }

    // Sort by relevance and return top results
    return scoredKnowledge
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)
      .map(item => item.knowledge);
  }

  /**
   * Initiate knowledge transfer
   */
  async initiateKnowledgeTransfer(
    knowledgeId: KnowledgeItemId,
    targetAgentId: AgentInstanceId,
    targetDnaId: EvolutionDnaId,
    targetProjectId: ProjectContextId,
    priority: KnowledgeTransferRequest['priority'] = 'medium'
  ): Promise<KnowledgeTransferRequest> {
    const knowledge = this.knowledgeBase.get(knowledgeId);
    if (!knowledge) {
      throw new Error(`Knowledge item ${knowledgeId} not found`);
    }

    // Analyze adaptation requirements
    const adaptationRequired = await this.analyzeAdaptationRequirements(
      knowledge,
      targetProjectId
    );

    // Calculate expected outcome
    const expectedOutcome = await this.calculateTransferOutcome(
      knowledge,
      adaptationRequired
    );

    const transferRequest: KnowledgeTransferRequest = {
      id: `transfer_${Date.now()}_${Math.random().toString(36).slice(2)}` as KnowledgeTransferId,
      sourceKnowledge: knowledge,
      targetAgentId,
      targetDnaId,
      targetProjectId,
      transferType: this.determineTransferType(adaptationRequired),
      adaptationRequired,
      expectedOutcome,
      requestedAt: new Date(),
      priority,
    };

    this.activeTransfers.set(transferRequest.id, transferRequest);

    this.emit('transfer_initiated', {
      transferId: transferRequest.id,
      sourceKnowledge: knowledgeId,
      targetAgent: targetAgentId,
      expectedImprovement: expectedOutcome.expectedImprovement,
    });

    return transferRequest;
  }

  /**
   * Execute knowledge transfer
   */
  async executeKnowledgeTransfer(
    transferId: KnowledgeTransferId,
    _targetDna: CodeDNA
  ): Promise<KnowledgeTransferResult> {
    const transferRequest = this.activeTransfers.get(transferId);
    if (!transferRequest) {
      throw new Error(`Transfer request ${transferId} not found`);
    }

    const startTime = Date.now();

    try {
      // Apply adaptations step by step
      const adaptationsApplied: string[] = [];
      for (const step of transferRequest.adaptationRequired.adaptationSteps) {
        // Simulate adaptation step execution
        adaptationsApplied.push(`${step.step}: ${step.description}`);
        
        // In production, this would apply actual genetic modifications
        await this.simulateAdaptationStep(step);
      }

      // Calculate actual improvement (simulated)
      const actualImprovement = this.simulatePerformanceImprovement(
        transferRequest.sourceKnowledge,
        transferRequest.expectedOutcome.expectedImprovement
      );

      const transferDuration = Date.now() - startTime;
      const success = actualImprovement > 0;

      const result: KnowledgeTransferResult = {
        transferId,
        success,
        actualImprovement,
        transferDuration,
        adaptationsApplied,
        lessonsLearned: this.extractLessonsLearned(transferRequest, actualImprovement),
        followUpActions: this.generateFollowUpActions(transferRequest, actualImprovement),
        validationStatus: success ? 'validated' : 'failed',
      };

      // Update knowledge usage statistics
      this.updateKnowledgeUsage(transferRequest.sourceKnowledge.id, success, actualImprovement);

      // Store result
      this.transferHistory.push(result);
      this.activeTransfers.delete(transferId);

      this.emit('transfer_completed', {
        transferId,
        success,
        actualImprovement,
        duration: transferDuration,
      });

      return result;

    } catch (error) {
      const result: KnowledgeTransferResult = {
        transferId,
        success: false,
        actualImprovement: 0,
        transferDuration: Date.now() - startTime,
        adaptationsApplied: [],
        lessonsLearned: [`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        followUpActions: ['Review transfer requirements', 'Consider alternative approaches'],
        validationStatus: 'failed',
      };

      this.transferHistory.push(result);
      this.activeTransfers.delete(transferId);

      this.emit('transfer_failed', { transferId, error });
      return result;
    }
  }

  /**
   * Start a cross-project learning session
   */
  async startLearningSession(
    participatingProjects: readonly ProjectContextId[],
    participatingAgents: readonly AgentInstanceId[],
    sessionType: CrossProjectLearningSession['sessionType']
  ): Promise<LearningSessionId> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}` as LearningSessionId;

    // Gather relevant knowledge from participating agents
    const sharedKnowledge = await this.gatherSharedKnowledge(participatingAgents, participatingProjects);

    const session: CrossProjectLearningSession = {
      id: sessionId,
      participatingProjects,
      participatingAgents,
      sessionType,
      sharedKnowledge,
      transfersInitiated: [],
      outcomes: [],
      startedAt: new Date(),
      sessionMetrics: {
        knowledgeItemsShared: sharedKnowledge.length,
        transfersAttempted: 0,
        transfersSuccessful: 0,
        avgImprovementAchieved: 0,
        participationLevel: 0,
        diversityIndex: this.calculateKnowledgeDiversity(sharedKnowledge),
        noveltyScore: this.calculateNoveltyScore(sharedKnowledge),
      },
    };

    this.learningSessionHistory.push(session);

    // Automatically identify and initiate promising transfers
    await this.facilitateKnowledgeExchange(session);

    this.emit('learning_session_started', {
      sessionId,
      participatingProjects: participatingProjects.length,
      participatingAgents: participatingAgents.length,
      sharedKnowledge: sharedKnowledge.length,
    });

    return sessionId;
  }

  /**
   * Get knowledge transfer statistics
   */
  getTransferStatistics(): {
    readonly totalKnowledgeItems: number;
    readonly totalTransfers: number;
    readonly successRate: number;
    readonly avgImprovement: number;
    readonly knowledgeByType: Record<KnowledgeType, number>;
    readonly transfersByType: Record<TransferType, number>;
    readonly topPerformingKnowledge: readonly {
      readonly id: KnowledgeItemId;
      readonly title: string;
      readonly useCount: number;
      readonly successRate: number;
      readonly avgImprovement: number;
    }[];
  } {
    const totalKnowledgeItems = this.knowledgeBase.size;
    const totalTransfers = this.transferHistory.length;
    const successfulTransfers = this.transferHistory.filter(t => t.success).length;
    const successRate = totalTransfers > 0 ? successfulTransfers / totalTransfers : 0;

    const totalImprovement = this.transferHistory
      .filter(t => t.success)
      .reduce((sum, t) => sum + t.actualImprovement, 0);
    const avgImprovement = successfulTransfers > 0 ? totalImprovement / successfulTransfers : 0;

    // Count knowledge by type
    const knowledgeByType = Array.from(this.knowledgeBase.values()).reduce(
      (acc, knowledge) => {
        acc[knowledge.knowledgeType] = (acc[knowledge.knowledgeType] ?? 0) + 1;
        return acc;
      },
      {} as Record<KnowledgeType, number>
    );

    // Count transfers by type (from active and completed transfers)
    const allTransfers = [...this.transferHistory, ...Array.from(this.activeTransfers.values())];
    const transfersByType = allTransfers.reduce(
      (acc, transfer) => {
        const type = 'transferType' in transfer ? transfer.transferType : TransferType.DIRECT_APPLICATION;
        acc[type] = (acc[type] ?? 0) + 1;
        return acc;
      },
      {} as Record<TransferType, number>
    );

    // Get top performing knowledge
    const topPerformingKnowledge = Array.from(this.knowledgeBase.values())
      .filter(k => k.useCount > 0)
      .sort((a, b) => b.metadata.successRate - a.metadata.successRate)
      .slice(0, 10)
      .map(k => ({
        id: k.id,
        title: k.content.title,
        useCount: k.useCount,
        successRate: k.metadata.successRate,
        avgImprovement: k.metadata.avgImprovement,
      }));

    return {
      totalKnowledgeItems,
      totalTransfers,
      successRate,
      avgImprovement,
      knowledgeByType,
      transfersByType,
      topPerformingKnowledge,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async createKnowledgeFromMutation(
    agentId: AgentInstanceId,
    dnaId: EvolutionDnaId,
    projectId: ProjectContextId,
    taskId: TaskId,
    mutation: Mutation,
    performanceImprovement: number,
    context: ProjectContext
  ): Promise<KnowledgeItem | null> {
    // Only create knowledge from significant improvements
    if (mutation.confidence < 0.6 || mutation.delta < 0.05) {
      return null;
    }

    const knowledgeType = this.classifyMutationType(mutation);
    const content = this.createKnowledgeContent(mutation, context);
    const applicability = this.determineApplicability(mutation, context);
    const quality = this.assessKnowledgeQuality(mutation, performanceImprovement);

    const knowledgeItem: KnowledgeItem = {
      id: `knowledge_${Date.now()}_${Math.random().toString(36).slice(2)}` as KnowledgeItemId,
      sourceAgentId: agentId,
      sourceDnaId: dnaId,
      sourceProjectId: projectId,
      knowledgeType,
      content,
      applicability,
      quality,
      metadata: {
        sourceTask: taskId,
        discoveryMethod: 'evolution',
        validationStatus: 'unvalidated',
        transferCount: 0,
        successRate: 0,
        avgImprovement: 0,
        tags: this.generateKnowledgeTags(mutation, context),
        relatedKnowledge: [],
      },
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 0,
    };

    return knowledgeItem;
  }

  private async extractPatternKnowledge(
    agentId: AgentInstanceId,
    dnaId: EvolutionDnaId,
    projectId: ProjectContextId,
    evolutionHistory: readonly Mutation[],
    context: ProjectContext
  ): Promise<KnowledgeItem | null> {
    // Look for patterns in the evolution history
    if (evolutionHistory.length < 3) return null;

    const recentMutations = evolutionHistory.slice(-5); // Last 5 mutations
    const successfulMutations = recentMutations.filter(m => m.delta > 0);

    if (successfulMutations.length < 2) return null;

    // Find common patterns
    const commonGenes = this.findCommonTargetGenes(successfulMutations);
    const commonTriggers = this.findCommonTriggers(successfulMutations);

    if (commonGenes.length === 0 && commonTriggers.length === 0) return null;

    const knowledgeItem: KnowledgeItem = {
      id: `pattern_${Date.now()}_${Math.random().toString(36).slice(2)}` as KnowledgeItemId,
      sourceAgentId: agentId,
      sourceDnaId: dnaId,
      sourceProjectId: projectId,
      knowledgeType: KnowledgeType.PROBLEM_SOLVING_PATTERN,
      content: {
        title: `Evolution Pattern: ${commonGenes.join(', ')} Optimization`,
        description: `Successful pattern involving ${commonGenes.length} genetic markers`,
        keyInsights: [
          `Mutations targeting ${commonGenes.join(', ')} show consistent positive results`,
          `Common triggers: ${commonTriggers.join(', ')}`,
          `Pattern observed across ${successfulMutations.length} successful mutations`,
        ],
        geneticMarkerPatterns: this.extractGeneticPatterns(successfulMutations),
        performanceImpacts: this.calculatePatternPerformanceImpacts(successfulMutations),
        contextualFactors: [context.projectType, context.complexity],
        prerequisites: ['Sufficient genetic diversity', 'Stable performance baseline'],
        contraindications: ['High-risk environments', 'Critical system changes'],
        examples: this.createPatternExamples(successfulMutations, context),
      },
      applicability: {
        projectTypes: [context.projectType],
        complexityLevels: [context.complexity],
        teamSizes: [context.teamSize],
        techStacks: context.techStack,
        contextualRequirements: ['Evolutionary pressure', 'Performance optimization needs'],
        exclusions: [],
      },
      quality: {
        reliability: this.calculatePatternReliability(successfulMutations),
        generalizability: 0.6, // Moderate generalizability for patterns
        specificity: 0.7,
        novelty: 0.5,
        impact: this.calculatePatternImpact(successfulMutations),
        confidence: 0.8,
      },
      metadata: {
        sourceTask: '' as TaskId, // Pattern spans multiple tasks
        discoveryMethod: 'analysis',
        validationStatus: 'partially_validated',
        transferCount: 0,
        successRate: 0,
        avgImprovement: 0,
        tags: ['pattern', 'evolution', context.projectType],
        relatedKnowledge: [],
      },
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 0,
    };

    return knowledgeItem;
  }

  private classifyMutationType(mutation: Mutation): KnowledgeType {
    switch (mutation.trigger.type) {
      case 'performance_decline':
        return KnowledgeType.ERROR_RECOVERY_STRATEGY;
      case 'pattern_recognition':
        return KnowledgeType.PROBLEM_SOLVING_PATTERN;
      case 'user_feedback':
        return KnowledgeType.ADAPTATION_STRATEGY;
      default:
        return KnowledgeType.OPTIMIZATION_TECHNIQUE;
    }
  }

  private createKnowledgeContent(mutation: Mutation, context: ProjectContext): KnowledgeContent {
    return {
      title: `${mutation.targetGene} Optimization Strategy`,
      description: `Successful optimization of ${mutation.targetGene} genetic marker`,
      keyInsights: [
        `${mutation.targetGene} responds well to ${mutation.delta > 0 ? 'increases' : 'decreases'}`,
        `Trigger: ${mutation.trigger.details}`,
        `Context: ${context.projectType} project with ${context.complexity} complexity`,
      ],
      geneticMarkerPatterns: { [mutation.targetGene]: mutation.newValue } as Partial<GeneticMarkers>,
      performanceImpacts: {}, // Would be populated based on actual performance data
      contextualFactors: [context.projectType, context.complexity],
      prerequisites: [`Baseline ${mutation.targetGene} value around ${mutation.previousValue}`],
      contraindications: [`Avoid when ${mutation.targetGene} is already optimized`],
      examples: [{
        scenario: `${context.projectType} project requiring ${mutation.targetGene} improvement`,
        application: `Applied ${mutation.delta > 0 ? 'positive' : 'negative'} adjustment`,
        outcome: `Improved performance by ${(mutation.delta * 100).toFixed(1)}%`,
        lessons: [`${mutation.targetGene} is sensitive to contextual changes`],
      }],
    };
  }

  private determineApplicability(mutation: Mutation, context: ProjectContext): KnowledgeApplicability {
    return {
      projectTypes: [context.projectType],
      complexityLevels: [context.complexity],
      teamSizes: [context.teamSize],
      techStacks: context.techStack,
      contextualRequirements: [mutation.trigger.type],
      exclusions: [],
    };
  }

  private assessKnowledgeQuality(mutation: Mutation, performanceImprovement: number): KnowledgeQuality {
    return {
      reliability: mutation.confidence,
      generalizability: 0.5, // Default moderate generalizability
      specificity: Math.abs(mutation.delta), // More specific if bigger change
      novelty: mutation.targetGene === 'novelty' ? 0.8 : 0.4, // Higher if novelty-related
      impact: Math.min(1, performanceImprovement * 2), // Scale performance improvement
      confidence: mutation.confidence,
    };
  }

  private generateKnowledgeTags(mutation: Mutation, context: ProjectContext): readonly string[] {
    return [
      mutation.targetGene,
      mutation.trigger.type,
      context.projectType,
      context.complexity,
      'genetic_optimization',
    ];
  }

  private async calculateRelevanceScore(
    knowledge: KnowledgeItem,
    targetContext: ProjectContext,
    targetDna: CodeDNA
  ): Promise<number> {
    let score = 0;

    // Context compatibility (40% weight)
    const contextScore = this.calculateContextCompatibility(knowledge, targetContext);
    score += contextScore * 0.4;

    // Genetic marker relevance (30% weight)
    const geneticScore = this.calculateGeneticRelevance(knowledge, targetDna.genetics);
    score += geneticScore * 0.3;

    // Knowledge quality (20% weight)
    const qualityScore = (knowledge.quality.reliability + knowledge.quality.impact) / 2;
    score += qualityScore * 0.2;

    // Usage success rate (10% weight)
    score += knowledge.metadata.successRate * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private calculateContextCompatibility(knowledge: KnowledgeItem, targetContext: ProjectContext): number {
    let compatibility = 0;

    // Project type match
    if (knowledge.applicability.projectTypes.includes(targetContext.projectType)) {
      compatibility += 0.4;
    }

    // Complexity level match
    if (knowledge.applicability.complexityLevels.includes(targetContext.complexity)) {
      compatibility += 0.3;
    }

    // Tech stack overlap
    const commonTech = knowledge.applicability.techStacks.filter(tech => 
      targetContext.techStack.includes(tech)
    );
    const techOverlap = commonTech.length / Math.max(knowledge.applicability.techStacks.length, 1);
    compatibility += techOverlap * 0.3;

    return compatibility;
  }

  private calculateGeneticRelevance(knowledge: KnowledgeItem, targetGenetics: GeneticMarkers): number {
    const knowledgePatterns = knowledge.content.geneticMarkerPatterns;
    const relevantGenes = Object.keys(knowledgePatterns) as (keyof GeneticMarkers)[];

    if (relevantGenes.length === 0) return 0.5; // Neutral if no genetic patterns

    let relevanceSum = 0;
    for (const gene of relevantGenes) {
      const knowledgeValue = knowledgePatterns[gene] as number;
      const targetValue = targetGenetics[gene] as number;
      
      // Higher relevance if target has room for improvement in this area
      const improvementPotential = Math.max(0, 1 - targetValue);
      const alignment = 1 - Math.abs(knowledgeValue - targetValue);
      
      relevanceSum += (improvementPotential + alignment) / 2;
    }

    return relevanceSum / relevantGenes.length;
  }

  private async analyzeAdaptationRequirements(
    knowledge: KnowledgeItem,
    _targetProjectId: ProjectContextId
  ): Promise<KnowledgeAdaptation> {
    // Simulate adaptation analysis (would be more sophisticated in production)
    const riskLevel = knowledge.quality.generalizability > 0.7 ? 'low' : 
                     knowledge.quality.generalizability > 0.4 ? 'medium' : 'high';

    return {
      geneticModifications: knowledge.content.geneticMarkerPatterns as Record<keyof GeneticMarkers, number>,
      contextualAdjustments: ['Project type adaptation', 'Tech stack alignment'],
      performanceExpectations: knowledge.content.performanceImpacts,
      riskAssessment: {
        level: riskLevel,
        factors: ['Context mismatch', 'Genetic compatibility'],
        mitigations: ['Gradual application', 'Performance monitoring'],
      },
      adaptationSteps: [
        {
          step: 1,
          description: 'Prepare genetic modifications',
          action: 'Calculate required genetic adjustments',
          expectedDuration: 5000,
          successCriteria: ['Genetic compatibility confirmed'],
          rollbackPlan: 'Revert to original genetic markers',
        },
        {
          step: 2,
          description: 'Apply adaptations',
          action: 'Modify genetic markers according to knowledge patterns',
          expectedDuration: 10000,
          successCriteria: ['Genetic markers updated', 'No regression detected'],
          rollbackPlan: 'Restore previous genetic state',
        },
      ],
    };
  }

  private async calculateTransferOutcome(
    knowledge: KnowledgeItem,
    adaptation: KnowledgeAdaptation
  ): Promise<TransferOutcome> {
    const baseImprovement = knowledge.quality.impact;
    const adaptationPenalty = adaptation.riskAssessment.level === 'high' ? 0.3 : 
                             adaptation.riskAssessment.level === 'medium' ? 0.1 : 0;
    
    const expectedImprovement = Math.max(0, baseImprovement - adaptationPenalty);
    const confidence = knowledge.quality.confidence * (1 - adaptationPenalty);
    
    return {
      expectedImprovement,
      confidence,
      timeline: adaptation.adaptationSteps.reduce((sum, step) => sum + step.expectedDuration, 0),
      successProbability: confidence * knowledge.quality.reliability,
      riskLevel: adaptation.riskAssessment.level,
    };
  }

  private determineTransferType(adaptation: KnowledgeAdaptation): TransferType {
    const modificationCount = Object.keys(adaptation.geneticModifications).length;
    const riskLevel = adaptation.riskAssessment.level;

    if (modificationCount === 0) return TransferType.DIRECT_APPLICATION;
    if (riskLevel === 'low' && modificationCount < 3) return TransferType.ADAPTIVE_TRANSFER;
    if (riskLevel === 'high') return TransferType.INSPIRATIONAL_TRANSFER;
    return TransferType.HYBRID_TRANSFER;
  }

  private async simulateAdaptationStep(step: AdaptationStep): Promise<void> {
    // Simulate step execution with delay
    await new Promise(resolve => setTimeout(resolve, Math.min(step.expectedDuration, 1000)));
  }

  private simulatePerformanceImprovement(
    _knowledge: KnowledgeItem,
    expectedImprovement: number
  ): number {
    // Add some realistic variance to expected improvement
    const variance = 0.2; // 20% variance
    const randomFactor = (Math.random() - 0.5) * 2 * variance;
    return Math.max(0, expectedImprovement * (1 + randomFactor));
  }

  private extractLessonsLearned(
    transfer: KnowledgeTransferRequest,
    actualImprovement: number
  ): readonly string[] {
    const lessons: string[] = [];

    if (actualImprovement > transfer.expectedOutcome.expectedImprovement) {
      lessons.push('Transfer exceeded expectations');
      lessons.push('Knowledge generalizes better than anticipated');
    } else if (actualImprovement < transfer.expectedOutcome.expectedImprovement * 0.5) {
      lessons.push('Transfer underperformed significantly');
      lessons.push('More adaptation may be required for this context');
    }

    lessons.push(`${transfer.transferType} transfer approach was used`);
    lessons.push(`Adaptation risk level: ${transfer.adaptationRequired.riskAssessment.level}`);

    return lessons;
  }

  private generateFollowUpActions(
    transfer: KnowledgeTransferRequest,
    actualImprovement: number
  ): readonly string[] {
    const actions: string[] = [];

    if (actualImprovement > 0) {
      actions.push('Monitor long-term performance stability');
      actions.push('Consider sharing this successful transfer pattern');
    } else {
      actions.push('Analyze failure causes');
      actions.push('Consider alternative knowledge sources');
      actions.push('Review adaptation strategy');
    }

    if (transfer.expectedOutcome.riskLevel === 'high') {
      actions.push('Validate risk mitigation effectiveness');
    }

    return actions;
  }

  private updateKnowledgeUsage(
    knowledgeId: KnowledgeItemId,
    success: boolean,
    improvement: number
  ): void {
    const knowledge = this.knowledgeBase.get(knowledgeId);
    if (!knowledge) return;

    const updatedMetadata = {
      ...knowledge.metadata,
      transferCount: knowledge.metadata.transferCount + 1,
      successRate: (knowledge.metadata.successRate * knowledge.useCount + (success ? 1 : 0)) / (knowledge.useCount + 1),
      avgImprovement: (knowledge.metadata.avgImprovement * knowledge.useCount + improvement) / (knowledge.useCount + 1),
    };

    const updatedKnowledge: KnowledgeItem = {
      ...knowledge,
      metadata: updatedMetadata,
      lastUsed: new Date(),
      useCount: knowledge.useCount + 1,
    };

    this.knowledgeBase.set(knowledgeId, updatedKnowledge);
  }

  private async gatherSharedKnowledge(
    participatingAgents: readonly AgentInstanceId[],
    participatingProjects: readonly ProjectContextId[]
  ): Promise<readonly KnowledgeItem[]> {
    return Array.from(this.knowledgeBase.values()).filter(knowledge => 
      participatingAgents.includes(knowledge.sourceAgentId) ||
      participatingProjects.includes(knowledge.sourceProjectId)
    );
  }

  private async facilitateKnowledgeExchange(session: CrossProjectLearningSession): Promise<void> {
    // Automatically identify and suggest promising knowledge transfers
    // This is a simplified implementation
    const transfers: KnowledgeTransferRequest[] = [];

    for (const knowledge of session.sharedKnowledge) {
      for (const targetProject of session.participatingProjects) {
        if (targetProject === knowledge.sourceProjectId) continue;

        // Find target agents in this project
        const targetAgents = session.participatingAgents.filter(_agentId => {
          // In production, would query database for agent-project associations
          return true; // Simplified
        });

        for (const targetAgent of targetAgents.slice(0, 1)) { // Limit to prevent spam
          try {
            const transfer = await this.initiateKnowledgeTransfer(
              knowledge.id,
              targetAgent,
              'temp_dna_id' as EvolutionDnaId, // Would get actual DNA ID
              targetProject,
              'low'
            );
            transfers.push(transfer);
          } catch (error) {
            // Continue with other transfers
          }
        }
      }
    }

    // In production, would store the initiated transfers in the database
    // For now, we just emit an event about the transfers initiated during this session
    if (transfers.length > 0) {
      this.emit('session_transfers_initiated', {
        sessionId: session.id,
        transferCount: transfers.length,
        transfers: transfers.map(t => t.id)
      });
    }
  }

  private calculateKnowledgeDiversity(knowledge: readonly KnowledgeItem[]): number {
    if (knowledge.length === 0) return 0;

    const types = new Set(knowledge.map(k => k.knowledgeType));
    const projects = new Set(knowledge.map(k => k.sourceProjectId));
    
    // Simple diversity measure based on type and project variety
    return Math.min(1, (types.size + projects.size) / (knowledge.length + 1));
  }

  private calculateNoveltyScore(knowledge: readonly KnowledgeItem[]): number {
    if (knowledge.length === 0) return 0;

    const avgNovelty = knowledge.reduce((sum, k) => sum + k.quality.novelty, 0) / knowledge.length;
    return avgNovelty;
  }

  private findCommonTargetGenes(mutations: readonly Mutation[]): readonly string[] {
    const geneCounts = new Map<string, number>();
    
    for (const mutation of mutations) {
      const gene = mutation.targetGene;
      geneCounts.set(gene, (geneCounts.get(gene) ?? 0) + 1);
    }

    return Array.from(geneCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([gene]) => gene);
  }

  private findCommonTriggers(mutations: readonly Mutation[]): readonly string[] {
    const triggerCounts = new Map<string, number>();
    
    for (const mutation of mutations) {
      const trigger = mutation.trigger.type;
      triggerCounts.set(trigger, (triggerCounts.get(trigger) ?? 0) + 1);
    }

    return Array.from(triggerCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([trigger]) => trigger);
  }

  private extractGeneticPatterns(mutations: readonly Mutation[]): Partial<GeneticMarkers> {
    const patterns = new Map<keyof GeneticMarkers, number>();
    
    for (const mutation of mutations) {
      const gene = mutation.targetGene as keyof GeneticMarkers;
      const existingValue = patterns.get(gene);
      
      if (existingValue === undefined) {
        patterns.set(gene, mutation.newValue);
      } else {
        // Average multiple values
        patterns.set(gene, (existingValue + mutation.newValue) / 2);
      }
    }

    // Convert Map to Partial<GeneticMarkers> using Object.fromEntries
    return Object.fromEntries(patterns.entries()) as Partial<GeneticMarkers>;
  }

  private calculatePatternPerformanceImpacts(_mutations: readonly Mutation[]): Partial<PerformanceMetrics> {
    // Simplified - would analyze actual performance correlations
    return {};
  }

  private createPatternExamples(
    mutations: readonly Mutation[],
    context: ProjectContext
  ): readonly KnowledgeExample[] {
    return mutations.slice(0, 3).map((mutation, index) => ({
      scenario: `${context.projectType} optimization scenario ${index + 1}`,
      application: `Applied ${mutation.targetGene} adjustment`,
      outcome: `Performance improvement of ${(mutation.delta * 100).toFixed(1)}%`,
      lessons: [`${mutation.targetGene} responds well to ${mutation.trigger.type} triggers`],
    }));
  }

  private calculatePatternReliability(mutations: readonly Mutation[]): number {
    const avgConfidence = mutations.reduce((sum, m) => sum + m.confidence, 0) / mutations.length;
    return avgConfidence;
  }

  private calculatePatternImpact(mutations: readonly Mutation[]): number {
    const avgImpact = mutations.reduce((sum, m) => sum + Math.abs(m.delta), 0) / mutations.length;
    return Math.min(1, avgImpact * 2); // Scale to 0-1 range
  }

  private startSessionCleanup(): void {
    this.sessionCleanupTimer = setInterval(() => {
      // Clean up old completed sessions
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const initialLength = this.learningSessionHistory.length;

      for (let i = this.learningSessionHistory.length - 1; i >= 0; i--) {
        const session = this.learningSessionHistory[i]!;
        if (session.completedAt && session.completedAt < cutoff) {
          this.learningSessionHistory.splice(i, 1);
        }
      }

      const cleaned = initialLength - this.learningSessionHistory.length;
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} old learning sessions`);
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.sessionCleanupTimer) clearInterval(this.sessionCleanupTimer);
    this.removeAllListeners();
  }
}

export default KnowledgeTransferService;