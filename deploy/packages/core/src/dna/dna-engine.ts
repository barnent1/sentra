/**
 * Production DNA Evolution Engine for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * 
 * This engine handles:
 * - Pattern mutation and evolution
 * - Multi-criteria fitness evaluation
 * - Vector-based similarity matching
 * - Cross-project learning
 * - Performance optimization
 */

import { EventEmitter } from 'events';
import type { 
  CodeDNA,
  ProjectContext,
  FitnessScore,
  EvolutionDnaId,
  EnhancedGeneticMarkers as GeneticMarkers,
  EnhancedPerformanceMetrics as PerformanceMetrics,
  EvolutionResult,
} from '@sentra/types';

/**
 * DNA Engine configuration interface
 */
export interface DNAEngineConfig {
  readonly mutationRate: number; // 0-1, probability of mutation
  readonly crossoverRate: number; // 0-1, probability of crossover
  readonly maxGenerations: number; // Maximum evolution generations
  readonly populationSize: number; // Size of DNA population
  readonly fitnessThreshold: number; // Minimum fitness for reproduction
  readonly diversityWeight: number; // Weight for genetic diversity
  readonly performanceWeight: number; // Weight for performance metrics
  readonly contextWeight: number; // Weight for context matching
}

/**
 * Evolution parameters for specific evolution requests
 */
export interface EvolutionParameters {
  readonly targetFitness?: number;
  readonly maxIterations?: number;
  readonly allowableRisk?: number; // 0-1, risk tolerance for mutations
  readonly priorityWeights?: {
    readonly performance?: number;
    readonly stability?: number;
    readonly adaptability?: number;
    readonly novelty?: number;
  };
}

/**
 * Mutation strategy types
 */
export const MutationStrategy = {
  OPTIMIZATION: 'optimization',
  ADAPTATION: 'adaptation', 
  SIMPLIFICATION: 'simplification',
  DIVERSIFICATION: 'diversification',
  SPECIALIZATION: 'specialization',
} as const;

export type MutationStrategyType = typeof MutationStrategy[keyof typeof MutationStrategy];

/**
 * Production DNA Evolution Engine
 */
export class DNAEngine extends EventEmitter {
  private readonly config: DNAEngineConfig;
  private readonly patterns = new Map<EvolutionDnaId, CodeDNA>();
  // Evolution history tracking (for future use)
  // private readonly evolutionHistory = new Map<EvolutionDnaId, readonly Mutation[]>();
  private generationCounter = 0;

  constructor(config: Partial<DNAEngineConfig> = {}) {
    super();
    
    // Default configuration
    this.config = {
      mutationRate: 0.1,
      crossoverRate: 0.7,
      maxGenerations: 100,
      populationSize: 50,
      fitnessThreshold: 0.6,
      diversityWeight: 0.2,
      performanceWeight: 0.4,
      contextWeight: 0.4,
      ...config,
    };
  }

  /**
   * Evolve a DNA pattern based on performance feedback and context
   */
  async evolvePattern(
    pattern: CodeDNA,
    context: ProjectContext,
    parameters?: EvolutionParameters
  ): Promise<EvolutionResult> {
    try {
      // Store original pattern
      this.patterns.set(pattern.id, pattern);
      
      // Evaluate current fitness
      const currentFitness = await this.evaluateFitness(pattern, context);
      
      // Generate multiple evolution candidates
      const candidates = await this.generateEvolutionCandidates(
        pattern,
        context,
        parameters
      );
      
      // Select best candidate
      const bestCandidate = await this.selectBestCandidate(
        candidates,
        context,
        parameters
      );
      
      // Validate evolution
      const isValid = await this.validateEvolution(
        pattern,
        bestCandidate,
        context
      );
      
      if (!isValid) {
        return {
          success: false,
          originalPattern: pattern,
          evolvedPattern: pattern,
          fitnessImprovement: 0,
          generationNumber: pattern.generation,
          reason: 'Evolution validation failed',
          metadata: {
            candidatesGenerated: candidates.length,
            validationFailed: true,
          },
        };
      }
      
      // Create evolved pattern
      const evolvedPattern: CodeDNA = {
        ...bestCandidate,
        id: `${pattern.id}_gen_${pattern.generation + 1}` as EvolutionDnaId,
        generation: pattern.generation + 1,
        parentId: pattern.id,
        timestamp: new Date(),
        fitnessScore: await this.evaluateFitness(bestCandidate, context),
      };
      
      // Store evolved pattern
      this.patterns.set(evolvedPattern.id, evolvedPattern);
      
      // Emit evolution event
      this.emit('pattern_evolved', {
        original: pattern,
        evolved: evolvedPattern,
        context,
        improvement: evolvedPattern.fitnessScore - currentFitness,
      });
      
      return {
        success: true,
        originalPattern: pattern,
        evolvedPattern,
        fitnessImprovement: evolvedPattern.fitnessScore - currentFitness,
        generationNumber: evolvedPattern.generation,
        reason: `Fitness improved from ${currentFitness.toFixed(3)} to ${evolvedPattern.fitnessScore.toFixed(3)}`,
        metadata: {
          candidatesGenerated: candidates.length,
          mutationStrategy: this.determineBestStrategy(candidates),
          validationPassed: true,
        },
      };
      
    } catch (error) {
      this.emit('evolution_error', { pattern, context, error });
      throw new Error(`DNA Evolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate multiple evolution candidates using different strategies
   */
  private async generateEvolutionCandidates(
    pattern: CodeDNA,
    context: ProjectContext,
    _parameters?: EvolutionParameters
  ): Promise<readonly CodeDNA[]> {
    const candidates: CodeDNA[] = [];
    
    // Strategy 1: Performance Optimization
    const optimizedCandidate = await this.applyOptimizationMutation(pattern, context);
    candidates.push(optimizedCandidate);
    
    // Strategy 2: Context Adaptation
    const adaptedCandidate = await this.applyAdaptationMutation(pattern, context);
    candidates.push(adaptedCandidate);
    
    // Strategy 3: Simplification
    const simplifiedCandidate = await this.applySimplificationMutation(pattern);
    candidates.push(simplifiedCandidate);
    
    // Strategy 4: Diversification (if needed)
    if (pattern.fitnessScore > this.config.fitnessThreshold) {
      const diversifiedCandidate = await this.applyDiversificationMutation(pattern);
      candidates.push(diversifiedCandidate);
    }
    
    // Strategy 5: Specialization based on context
    const specializedCandidate = await this.applySpecializationMutation(pattern, context);
    candidates.push(specializedCandidate);
    
    return candidates.filter(c => c !== null);
  }

  /**
   * Apply optimization mutation to improve performance metrics
   */
  private async applyOptimizationMutation(
    pattern: CodeDNA,
    _context: ProjectContext
  ): Promise<CodeDNA> {
    const mutatedGenetics: GeneticMarkers = {
      ...pattern.genetics,
      // Optimize for efficiency and quality
      resourceEfficiency: Math.min(1, pattern.genetics.resourceEfficiency + 0.1),
      errorRecovery: Math.min(1, pattern.genetics.errorRecovery + 0.05),
      thoroughness: Math.min(1, pattern.genetics.thoroughness + 0.05),
    };
    
    const mutatedPerformance: PerformanceMetrics = {
      ...pattern.performance,
      // Target performance improvements
      averageTaskCompletionTime: Math.max(
        pattern.performance.averageTaskCompletionTime * 0.9, 
        1000
      ),
      codeQualityScore: Math.min(1, pattern.performance.codeQualityScore + 0.05),
      errorRecoveryRate: Math.min(1, pattern.performance.errorRecoveryRate + 0.03),
    };
    
    return {
      ...pattern,
      genetics: mutatedGenetics,
      performance: mutatedPerformance,
      mutations: [
        ...pattern.mutations,
        {
          id: `opt_${Date.now()}`,
          strategy: MutationStrategy.OPTIMIZATION,
          changes: {
            genetics: { resourceEfficiency: '+0.1', errorRecovery: '+0.05' },
            performance: { averageTaskCompletionTime: '-10%', codeQualityScore: '+0.05' },
          },
          timestamp: new Date(),
          reason: 'Performance optimization mutation',
          impact: 0.05,
        },
      ],
    };
  }

  /**
   * Apply adaptation mutation to better fit project context
   */
  private async applyAdaptationMutation(
    pattern: CodeDNA,
    context: ProjectContext
  ): Promise<CodeDNA> {
    const contextComplexityFactor = context.complexity === 'high' ? 0.1 : 
                                   context.complexity === 'medium' ? 0.05 : 0;
    
    const mutatedGenetics: GeneticMarkers = {
      ...pattern.genetics,
      adaptability: Math.min(1, pattern.genetics.adaptability + contextComplexityFactor),
      complexity: Math.max(0.1, Math.min(1, 
        context.complexity === 'high' ? pattern.genetics.complexity + 0.1 :
        context.complexity === 'low' ? pattern.genetics.complexity - 0.05 :
        pattern.genetics.complexity
      )),
    };
    
    return {
      ...pattern,
      genetics: mutatedGenetics,
      context: {
        ...pattern.context,
        // Adapt to new context while maintaining core characteristics
        techStack: [...new Set([...pattern.context.techStack, ...context.techStack])],
        complexity: context.complexity,
      },
      mutations: [
        ...pattern.mutations,
        {
          id: `adapt_${Date.now()}`,
          strategy: MutationStrategy.ADAPTATION,
          changes: {
            genetics: { adaptability: `+${contextComplexityFactor}`, complexity: 'context-adjusted' },
            context: { techStack: 'merged', complexity: context.complexity },
          },
          timestamp: new Date(),
          reason: `Adaptation to ${context.complexity} complexity project`,
          impact: contextComplexityFactor * 0.5,
        },
      ],
    };
  }

  /**
   * Apply simplification mutation to reduce complexity
   */
  private async applySimplificationMutation(pattern: CodeDNA): Promise<CodeDNA> {
    const mutatedGenetics: GeneticMarkers = {
      ...pattern.genetics,
      complexity: Math.max(0.1, pattern.genetics.complexity - 0.1),
      pragmatism: Math.min(1, pattern.genetics.pragmatism + 0.05),
      resourceEfficiency: Math.min(1, pattern.genetics.resourceEfficiency + 0.05),
    };
    
    return {
      ...pattern,
      genetics: mutatedGenetics,
      mutations: [
        ...pattern.mutations,
        {
          id: `simp_${Date.now()}`,
          strategy: MutationStrategy.SIMPLIFICATION,
          changes: {
            genetics: { 
              complexity: '-0.1', 
              pragmatism: '+0.05', 
              resourceEfficiency: '+0.05' 
            },
          },
          timestamp: new Date(),
          reason: 'Simplification for better maintainability',
          impact: 0.03,
        },
      ],
    };
  }

  /**
   * Apply diversification mutation to explore new solutions
   */
  private async applyDiversificationMutation(pattern: CodeDNA): Promise<CodeDNA> {
    const mutatedGenetics: GeneticMarkers = {
      ...pattern.genetics,
      novelty: Math.min(1, pattern.genetics.novelty + 0.15),
      creativity: Math.min(1, pattern.genetics.creativity + 0.1),
      riskTolerance: Math.min(1, pattern.genetics.riskTolerance + 0.05),
    };
    
    return {
      ...pattern,
      genetics: mutatedGenetics,
      mutations: [
        ...pattern.mutations,
        {
          id: `div_${Date.now()}`,
          strategy: MutationStrategy.DIVERSIFICATION,
          changes: {
            genetics: { 
              novelty: '+0.15', 
              creativity: '+0.1', 
              riskTolerance: '+0.05' 
            },
          },
          timestamp: new Date(),
          reason: 'Diversification to explore new approaches',
          impact: 0.08,
        },
      ],
    };
  }

  /**
   * Apply specialization mutation for specific project contexts
   */
  private async applySpecializationMutation(
    pattern: CodeDNA,
    context: ProjectContext
  ): Promise<CodeDNA> {
    // Specialize based on project type
    let specialization: Partial<GeneticMarkers> = {};
    
    switch (context.projectType) {
      case 'web-app':
        specialization = {
          communicationClarity: Math.min(1, pattern.genetics.communicationClarity + 0.1),
          collaborationAffinity: Math.min(1, pattern.genetics.collaborationAffinity + 0.08),
        };
        break;
      case 'api':
        specialization = {
          thoroughness: Math.min(1, pattern.genetics.thoroughness + 0.1),
          resourceEfficiency: Math.min(1, pattern.genetics.resourceEfficiency + 0.08),
        };
        break;
      case 'cli':
        specialization = {
          pragmatism: Math.min(1, pattern.genetics.pragmatism + 0.1),
          resourceEfficiency: Math.min(1, pattern.genetics.resourceEfficiency + 0.05),
        };
        break;
      default:
        specialization = {
          adaptability: Math.min(1, pattern.genetics.adaptability + 0.05),
        };
    }
    
    const mutatedGenetics: GeneticMarkers = {
      ...pattern.genetics,
      ...specialization,
    };
    
    return {
      ...pattern,
      genetics: mutatedGenetics,
      mutations: [
        ...pattern.mutations,
        {
          id: `spec_${Date.now()}`,
          strategy: MutationStrategy.SPECIALIZATION,
          changes: {
            genetics: specialization,
          },
          timestamp: new Date(),
          reason: `Specialization for ${context.projectType} projects`,
          impact: 0.06,
        },
      ],
    };
  }

  /**
   * Evaluate fitness of a DNA pattern for a given context
   */
  private async evaluateFitness(
    pattern: CodeDNA,
    context: ProjectContext
  ): Promise<FitnessScore> {
    // Multi-criteria fitness evaluation
    const performanceScore = this.calculatePerformanceScore(pattern.performance);
    const contextMatchScore = this.calculateContextMatch(pattern.context, context);
    const geneticHealthScore = this.calculateGeneticHealth(pattern.genetics);
    const diversityScore = this.calculateDiversityScore(pattern);
    
    // Weighted combination
    const fitness = (
      performanceScore * this.config.performanceWeight +
      contextMatchScore * this.config.contextWeight +
      geneticHealthScore * 0.3 +
      diversityScore * this.config.diversityWeight
    );
    
    return Math.max(0, Math.min(1, fitness)) as FitnessScore;
  }

  /**
   * Calculate performance score from metrics
   */
  private calculatePerformanceScore(performance: PerformanceMetrics): number {
    const weights = {
      successRate: 0.25,
      codeQualityScore: 0.20,
      errorRecoveryRate: 0.15,
      adaptationSpeed: 0.15,
      userSatisfactionRating: 0.10,
      computationalEfficiency: 0.10,
      maintainabilityScore: 0.05,
    };
    
    return (
      performance.successRate * weights.successRate +
      performance.codeQualityScore * weights.codeQualityScore +
      performance.errorRecoveryRate * weights.errorRecoveryRate +
      performance.adaptationSpeed * weights.adaptationSpeed +
      performance.userSatisfactionRating * weights.userSatisfactionRating +
      performance.computationalEfficiency * weights.computationalEfficiency +
      performance.maintainabilityScore * weights.maintainabilityScore
    );
  }

  /**
   * Calculate context matching score
   */
  private calculateContextMatch(
    patternContext: ProjectContext,
    targetContext: ProjectContext
  ): number {
    let score = 0;
    
    // Project type match
    score += patternContext.projectType === targetContext.projectType ? 0.4 : 0;
    
    // Complexity compatibility
    const complexityMatch = patternContext.complexity === targetContext.complexity ? 1 :
      Math.abs(['low', 'medium', 'high', 'enterprise'].indexOf(patternContext.complexity) -
               ['low', 'medium', 'high', 'enterprise'].indexOf(targetContext.complexity)) <= 1 ? 0.5 : 0;
    score += complexityMatch * 0.3;
    
    // Technology stack overlap
    const commonTech = patternContext.techStack.filter(tech => 
      targetContext.techStack.includes(tech)
    );
    const techOverlap = commonTech.length / Math.max(targetContext.techStack.length, 1);
    score += techOverlap * 0.3;
    
    return score;
  }

  /**
   * Calculate genetic health score
   */
  private calculateGeneticHealth(genetics: GeneticMarkers): number {
    const values = Object.values(genetics) as number[];
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    
    // Prefer balanced genetics with good average but not too extreme variance
    return average * (1 - Math.min(0.3, variance));
  }

  /**
   * Calculate diversity score to encourage genetic diversity
   */
  private calculateDiversityScore(pattern: CodeDNA): number {
    // Simple diversity score based on how different this pattern is from others
    const otherPatterns = Array.from(this.patterns.values())
      .filter(p => p.id !== pattern.id && p.generation <= pattern.generation);
    
    if (otherPatterns.length === 0) return 0.5; // Neutral for first pattern
    
    const differences = otherPatterns.map(other => 
      this.calculateGeneticDistance(pattern.genetics, other.genetics)
    );
    
    return Math.min(1, differences.reduce((sum, diff) => sum + diff, 0) / differences.length);
  }

  /**
   * Calculate genetic distance between two genetic markers
   */
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

  /**
   * Select best candidate from evolution candidates
   */
  private async selectBestCandidate(
    candidates: readonly CodeDNA[],
    context: ProjectContext,
    _parameters?: EvolutionParameters
  ): Promise<CodeDNA> {
    const fitnessScores = await Promise.all(
      candidates.map(async candidate => ({
        candidate,
        fitness: await this.evaluateFitness(candidate, context),
      }))
    );
    
    // Sort by fitness and return best
    fitnessScores.sort((a, b) => b.fitness - a.fitness);
    return fitnessScores[0]?.candidate ?? candidates[0]!;
  }

  /**
   * Validate that evolution is beneficial and safe
   */
  private async validateEvolution(
    original: CodeDNA,
    evolved: CodeDNA,
    context: ProjectContext
  ): Promise<boolean> {
    // Basic validation rules
    const originalFitness = await this.evaluateFitness(original, context);
    const evolvedFitness = await this.evaluateFitness(evolved, context);
    
    // Must improve or maintain fitness
    if (evolvedFitness < originalFitness - 0.05) return false;
    
    // Genetic health checks
    const geneticValues = Object.values(evolved.genetics) as number[];
    if (geneticValues.some(val => val < 0 || val > 1)) return false;
    
    // Performance regression check
    if (evolved.performance.successRate < original.performance.successRate * 0.8) return false;
    
    return true;
  }

  /**
   * Determine the best mutation strategy from candidates
   */
  private determineBestStrategy(candidates: readonly CodeDNA[]): string {
    const strategies = candidates
      .flatMap(c => c.mutations)
      .map(m => m.strategy);
    
    // Return most common strategy or first one
    const strategyCounts = strategies.reduce((acc, strategy) => {
      acc[strategy] = (acc[strategy] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(strategyCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] ?? MutationStrategy.OPTIMIZATION;
  }

  /**
   * Get evolution statistics
   */
  getEvolutionStats() {
    return {
      totalPatterns: this.patterns.size,
      generationCounter: this.generationCounter,
      averageFitness: this.calculateAverageFitness(),
      diversityIndex: this.calculateDiversityIndex(),
      config: this.config,
    };
  }

  private calculateAverageFitness(): number {
    const patterns = Array.from(this.patterns.values());
    if (patterns.length === 0) return 0;
    
    return patterns.reduce((sum, pattern) => sum + pattern.fitnessScore, 0) / patterns.length;
  }

  private calculateDiversityIndex(): number {
    const patterns = Array.from(this.patterns.values());
    if (patterns.length < 2) return 0;
    
    let totalDistance = 0;
    let comparisons = 0;
    
    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        totalDistance += this.calculateGeneticDistance(
          patterns[i]!.genetics,
          patterns[j]!.genetics
        );
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalDistance / comparisons : 0;
  }

  /**
   * Generate new DNA pattern from scratch or based on seed patterns
   */
  async generateNewDna(
    projectContext: ProjectContext,
    seedPatterns?: readonly CodeDNA[]
  ): Promise<CodeDNA> {
    // Generate ID for new DNA
    const dnaId = `dna_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as EvolutionDnaId;
    
    // Base genetic markers - either from seeds or default values
    let baseGenetics: GeneticMarkers;
    if (seedPatterns && seedPatterns.length > 0) {
      // Average genetic markers from seed patterns
      baseGenetics = this.averageGenetics(seedPatterns.map(p => p.genetics));
    } else {
      // Generate default genetic markers
      baseGenetics = this.generateDefaultGenetics(projectContext);
    }

    // Apply some randomization for diversity
    const genetics = this.applyGeneticRandomization(baseGenetics);

    // Create initial performance metrics
    const performance: PerformanceMetrics = {
      // Base performance metrics
      successRate: 0.5,
      averageTaskCompletionTime: 1000,
      codeQualityScore: 0.7,
      userSatisfactionRating: 0.6,
      adaptationSpeed: genetics.adaptability,
      errorRecoveryRate: genetics.errorRecovery,
      
      // Enhanced performance metrics
      knowledgeRetention: genetics.patternRecognition,
      crossDomainTransfer: genetics.adaptability,
      computationalEfficiency: genetics.resourceEfficiency,
      responseLatency: 100,
      throughput: genetics.resourceEfficiency * 100,
      resourceUtilization: 0.5,
      bugIntroductionRate: 0.1,
      testCoverage: 0.7,
      documentationQuality: genetics.communicationClarity,
      maintainabilityScore: 0.7,
      communicationEffectiveness: genetics.communicationClarity,
      teamIntegration: genetics.collaborationAffinity,
      feedbackIncorporation: genetics.learningVelocity,
      conflictResolution: genetics.empathy,
    };

    // Generate vector embedding
    const embedding = this.generateEmbedding(genetics, projectContext);

    // Determine pattern type based on genetics
    const patternType = this.determinePatternType(genetics);

    const now = new Date();
    
    const newDNA: CodeDNA = {
      id: dnaId,
      patternType,
      context: projectContext,
      genetics,
      performance,
      mutations: [],
      embedding,
      timestamp: now,
      generation: 0,
      birthContext: {
        trigger: 'initialization',
        creationReason: seedPatterns ? 'seed_based_generation' : 'random_generation',
        initialPerformance: performance,
      },
      evolutionHistory: [],
      activationCount: 0,
      lastActivation: now,
      fitnessScore: 0.5 as FitnessScore,
      viabilityAssessment: {
        overallScore: 0.7,
        strengths: ['New genetic pattern', 'Potential for learning'],
        weaknesses: ['Untested pattern', 'No historical performance'],
        recommendedContexts: [projectContext.projectType],
        avoidContexts: [],
        lastAssessment: now,
        confidenceLevel: 0.6,
      },
      reproductionPotential: 0.5,
      tags: seedPatterns ? ['seed-based'] : ['generated'],
      notes: `Generated DNA pattern for ${projectContext.projectType} project`,
      isArchived: false,
    };

    // Store the new pattern
    this.patterns.set(dnaId, newDNA);
    
    return newDNA;
  }

  private averageGenetics(geneticsArray: readonly GeneticMarkers[]): GeneticMarkers {
    if (geneticsArray.length === 0) {
      throw new Error('Cannot average empty genetics array');
    }

    const avg = (key: keyof GeneticMarkers) =>
      geneticsArray.reduce((sum, g) => sum + g[key], 0) / geneticsArray.length;

    return {
      // Base GeneticMarkers properties
      complexity: avg('complexity'),
      adaptability: avg('adaptability'),
      successRate: avg('successRate'),
      transferability: avg('transferability'),
      stability: avg('stability'),
      novelty: avg('novelty'),
      
      // EnhancedGeneticMarkers properties
      patternRecognition: avg('patternRecognition'),
      errorRecovery: avg('errorRecovery'),
      communicationClarity: avg('communicationClarity'),
      learningVelocity: avg('learningVelocity'),
      resourceEfficiency: avg('resourceEfficiency'),
      collaborationAffinity: avg('collaborationAffinity'),
      riskTolerance: avg('riskTolerance'),
      thoroughness: avg('thoroughness'),
      creativity: avg('creativity'),
      persistence: avg('persistence'),
      empathy: avg('empathy'),
      pragmatism: avg('pragmatism'),
    };
  }

  private generateDefaultGenetics(_projectContext: ProjectContext): GeneticMarkers {
    // Base genetics with some variation based on project type
    const base = 0.5;
    const variation = 0.2;

    const randomize = () => Math.max(0, Math.min(1, base + (Math.random() - 0.5) * variation));

    return {
      // Base GeneticMarkers properties
      complexity: randomize(),
      adaptability: randomize(),
      successRate: randomize(),
      transferability: randomize(),
      stability: randomize(),
      novelty: randomize(),
      
      // EnhancedGeneticMarkers properties
      patternRecognition: randomize(),
      errorRecovery: randomize(),
      communicationClarity: randomize(),
      learningVelocity: randomize(),
      resourceEfficiency: randomize(),
      collaborationAffinity: randomize(),
      riskTolerance: randomize(),
      thoroughness: randomize(),
      creativity: randomize(),
      persistence: randomize(),
      empathy: randomize(),
      pragmatism: randomize(),
    };
  }

  private applyGeneticRandomization(genetics: GeneticMarkers): GeneticMarkers {
    const noise = 0.05; // Small randomization
    
    const randomizeGene = (value: number) =>
      Math.max(0, Math.min(1, value + (Math.random() - 0.5) * noise));

    return {
      // Base GeneticMarkers properties
      complexity: randomizeGene(genetics.complexity),
      adaptability: randomizeGene(genetics.adaptability),
      successRate: randomizeGene(genetics.successRate),
      transferability: randomizeGene(genetics.transferability),
      stability: randomizeGene(genetics.stability),
      novelty: randomizeGene(genetics.novelty),
      
      // EnhancedGeneticMarkers properties
      patternRecognition: randomizeGene(genetics.patternRecognition),
      errorRecovery: randomizeGene(genetics.errorRecovery),
      communicationClarity: randomizeGene(genetics.communicationClarity),
      learningVelocity: randomizeGene(genetics.learningVelocity),
      resourceEfficiency: randomizeGene(genetics.resourceEfficiency),
      collaborationAffinity: randomizeGene(genetics.collaborationAffinity),
      riskTolerance: randomizeGene(genetics.riskTolerance),
      thoroughness: randomizeGene(genetics.thoroughness),
      creativity: randomizeGene(genetics.creativity),
      persistence: randomizeGene(genetics.persistence),
      empathy: randomizeGene(genetics.empathy),
      pragmatism: randomizeGene(genetics.pragmatism),
    };
  }

  private generateEmbedding(genetics: GeneticMarkers, context: ProjectContext): readonly number[] {
    // Simple embedding generation based on genetics and context
    const embedding: number[] = [];
    
    // Add genetic marker values as features
    Object.values(genetics).forEach(value => embedding.push(value));
    
    // Add context-based features
    embedding.push(
      context.projectType === 'web-app' ? 1 : 0,
      context.projectType === 'api' ? 1 : 0,
      context.projectType === 'cli' ? 1 : 0,
      context.complexity === 'high' ? 1 : context.complexity === 'medium' ? 0.5 : 0,
    );

    // Pad to consistent length
    while (embedding.length < 32) {
      embedding.push(0);
    }

    return embedding.slice(0, 32); // Ensure consistent size
  }

  private determinePatternType(genetics: GeneticMarkers): string {
    // Choose pattern type based on dominant genetic traits
    const traits = [
      { type: 'analytical', score: genetics.complexity + genetics.patternRecognition },
      { type: 'creative', score: genetics.creativity + genetics.novelty },
      { type: 'systematic', score: genetics.thoroughness + genetics.stability },
      { type: 'optimization', score: genetics.resourceEfficiency + genetics.pragmatism },
      { type: 'debugging', score: genetics.errorRecovery + genetics.persistence },
      { type: 'integration', score: genetics.collaborationAffinity + genetics.communicationClarity },
    ];

    // Return the pattern type with the highest score
    return traits.reduce((max, trait) => trait.score > max.score ? trait : max).type;
  }
}

export default DNAEngine;