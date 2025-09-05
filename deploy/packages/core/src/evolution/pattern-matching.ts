/**
 * Vector-based Pattern Matching System for Cross-Project Learning
 * 
 * This module provides vector similarity matching for DNA patterns,
 * enabling intelligent cross-project knowledge transfer and learning.
 * 
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */

import type {
  CodeDNA,
  EvolutionDnaId,
  ProjectContext,
  ProjectContextId,
  GeneticMarkers,
  PerformanceMetrics,
  PatternTypeEnum,
  VectorLike,
  EmbeddingOperations,
  Brand
} from '../types';
import { PatternType } from '../types';

// ============================================================================
// PATTERN MATCHING TYPES
// ============================================================================

export type PatternMatchingId = Brand<string, 'PatternMatchingId'>;
export type EmbeddingVector = Brand<readonly number[], 'EmbeddingVector'>;

export interface PatternSimilarityResult {
  readonly sourcePattern: CodeDNA;
  readonly targetPattern: CodeDNA;
  readonly similarity: number; // 0-1, cosine similarity
  readonly contextCompatibility: number; // 0-1, how compatible the contexts are
  readonly geneticAlignment: number; // 0-1, how aligned the genetic markers are
  readonly performanceAlignment: number; // 0-1, performance metrics alignment
  readonly overallScore: number; // weighted combination of all factors
  readonly transferPotential: number; // 0-1, potential for successful transfer
  readonly reasoning: string;
}

export interface PatternCluster {
  readonly id: string;
  readonly centroid: EmbeddingVector;
  readonly patterns: readonly CodeDNA[];
  readonly dominantCharacteristics: {
    readonly patternType: PatternTypeEnum;
    readonly avgGeneration: number;
    readonly avgFitness: number;
    readonly commonTechStack: readonly string[];
    readonly contextTypes: readonly string[];
  };
  readonly diversity: number; // 0-1, internal genetic diversity
}

export interface CrossProjectTransferCandidate {
  readonly id: string;
  readonly sourceDnaId: EvolutionDnaId;
  readonly targetProjectId: ProjectContextId;
  readonly similarity: number;
  readonly adaptationRequired: {
    readonly geneticModifications: Record<keyof GeneticMarkers, number>;
    readonly contextualChanges: readonly string[];
    readonly riskLevel: 'low' | 'medium' | 'high';
  };
  readonly expectedOutcome: {
    readonly fitnessImprovement: number; // expected improvement
    readonly confidence: number; // 0-1, confidence in prediction
    readonly timeline: number; // expected adaptation time in milliseconds
  };
}

export interface PatternMatchingConfig {
  readonly embeddingDimensions: number;
  readonly similarityThreshold: number; // minimum similarity for matches
  readonly contextWeight: number; // 0-1, weight of context in overall score
  readonly geneticWeight: number; // 0-1, weight of genetic markers
  readonly performanceWeight: number; // 0-1, weight of performance metrics
  readonly diversityWeight: number; // 0-1, weight of diversity in clustering
  readonly maxClusters: number; // maximum number of pattern clusters
  readonly adaptationRiskThreshold: number; // threshold for high-risk adaptations
}

// ============================================================================
// VECTOR OPERATIONS IMPLEMENTATION
// ============================================================================

export class VectorOperations implements EmbeddingOperations {
  /**
   * Compute cosine similarity between two vectors
   */
  cosineSimilarity<D extends number>(a: VectorLike<D>, b: VectorLike<D>): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Compute Euclidean distance between vectors
   */
  euclideanDistance<D extends number>(a: VectorLike<D>, b: VectorLike<D>): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i]! - b[i]!;
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Normalize vector to unit length
   */
  normalize<D extends number>(vector: VectorLike<D>): VectorLike<D> {
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i]! * vector[i]!;
    }

    norm = Math.sqrt(norm);
    if (norm === 0) {
      return vector; // Return original if zero vector
    }

    const normalized = Array.from(vector).map(val => val / norm) as unknown as VectorLike<D>;
    return normalized;
  }

  /**
   * Find most similar vectors in a collection
   */
  findSimilar<D extends number>(
    query: VectorLike<D>,
    candidates: readonly VectorLike<D>[],
    topK: number,
    threshold?: number
  ): readonly { vector: VectorLike<D>; similarity: number; index: number }[] {
    const similarities = candidates.map((candidate, index) => ({
      vector: candidate,
      similarity: this.cosineSimilarity(query, candidate),
      index,
    }));

    // Filter by threshold if provided
    const filtered = threshold 
      ? similarities.filter(item => item.similarity >= threshold)
      : similarities;

    // Sort by similarity (descending) and take top K
    return filtered
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Generate embedding for DNA pattern
   */
  async generateDnaEmbedding(dna: CodeDNA): Promise<readonly number[]> {
    // Create a comprehensive embedding from DNA characteristics
    const features: number[] = [];

    // Genetic markers (normalized to 0-1)
    const geneticValues = Object.values(dna.genetics) as number[];
    features.push(...geneticValues);

    // Performance metrics (normalized)
    const performanceFeatures = [
      dna.performance.successRate,
      dna.performance.codeQualityScore,
      dna.performance.errorRecoveryRate,
      dna.performance.adaptationSpeed,
      dna.performance.computationalEfficiency,
      dna.performance.userSatisfactionRating,
      dna.performance.maintainabilityScore,
      dna.performance.communicationEffectiveness,
      dna.performance.teamIntegration,
      // Normalize time-based metrics
      Math.min(1, 60000 / dna.performance.averageTaskCompletionTime), // Faster = higher score
      Math.min(1, 1000 / dna.performance.responseLatency), // Lower latency = higher score
      Math.min(1, dna.performance.throughput / 10), // Normalize throughput
      Math.max(0, 1 - dna.performance.bugIntroductionRate), // Fewer bugs = higher score
    ];
    features.push(...performanceFeatures);

    // Context features
    const contextFeatures = this.encodeContext(dna.context);
    features.push(...contextFeatures);

    // Pattern type encoding (one-hot)
    const patternTypes = Object.values(PatternType);
    const patternEncoding = patternTypes.map(type => type === dna.patternType ? 1 : 0);
    features.push(...patternEncoding);

    // Generation and fitness
    features.push(
      Math.min(1, dna.generation / 100), // Normalize generation
      dna.fitnessScore,
      dna.activationCount > 0 ? Math.min(1, dna.activationCount / 100) : 0
    );

    // Pad or truncate to desired dimensions (1536 to match typical embedding size)
    const targetDim = 1536;
    if (features.length < targetDim) {
      // Pad with zeros
      features.push(...new Array(targetDim - features.length).fill(0));
    } else if (features.length > targetDim) {
      // Truncate
      features.splice(targetDim);
    }

    return features;
  }

  /**
   * Find similar DNA patterns based on embeddings
   */
  async findSimilarDna(
    queryDna: CodeDNA,
    candidates: readonly CodeDNA[],
    threshold: number = 0.7
  ): Promise<readonly { dna: CodeDNA; similarity: number }[]> {
    const queryEmbedding = await this.generateDnaEmbedding(queryDna);
    
    const similarities: { dna: CodeDNA; similarity: number }[] = [];

    for (const candidate of candidates) {
      if (candidate.id === queryDna.id) continue; // Skip self

      const candidateEmbedding = await this.generateDnaEmbedding(candidate);
      const similarity = this.cosineSimilarity(
        queryEmbedding as VectorLike<1536>,
        candidateEmbedding as VectorLike<1536>
      );

      if (similarity >= threshold) {
        similarities.push({ dna: candidate, similarity });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Cluster DNA patterns by similarity
   */
  async clusterDnaPatterns(
    dnaCollection: readonly CodeDNA[],
    numClusters: number
  ): Promise<readonly (readonly CodeDNA[])[]> {
    if (dnaCollection.length === 0 || numClusters <= 0) {
      return [];
    }

    if (dnaCollection.length <= numClusters) {
      return dnaCollection.map(dna => [dna]);
    }

    // Generate embeddings for all DNA patterns
    const embeddings = await Promise.all(
      dnaCollection.map(async dna => ({
        dna,
        embedding: await this.generateDnaEmbedding(dna),
      }))
    );

    // Simple k-means clustering implementation
    const clusters = this.kMeansClustering(embeddings, numClusters);
    
    return clusters;
  }

  private encodeContext(context: ProjectContext): number[] {
    const features: number[] = [];

    // Project type encoding (one-hot)
    const projectTypes = ['web-app', 'api', 'cli', 'library', 'infrastructure', 'ai-ml', 'blockchain', 'embedded'];
    features.push(...projectTypes.map(type => type === context.projectType ? 1 : 0));

    // Complexity encoding
    const complexityLevels = ['low', 'medium', 'high', 'enterprise', 'research'];
    features.push(...complexityLevels.map(level => level === context.complexity ? 1 : 0));

    // Tech stack encoding (simplified - use common technologies)
    const commonTech = ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'react', 'vue', 'angular', 'node', 'express', 'fastapi', 'spring', 'docker', 'kubernetes'];
    features.push(...commonTech.map(tech => context.techStack.some(t => t.toLowerCase().includes(tech)) ? 1 : 0));

    // Numerical features
    features.push(
      Math.min(1, context.teamSize / 20), // Normalize team size
      context.performanceRequirements.maxResponseTime > 0 ? Math.min(1, 5000 / context.performanceRequirements.maxResponseTime) : 0,
      context.performanceRequirements.availabilityTarget,
      Math.min(1, context.scalabilityNeeds.expectedGrowthRate / 5),
    );

    return features;
  }

  private kMeansClustering(
    embeddings: readonly { dna: CodeDNA; embedding: readonly number[] }[],
    k: number
  ): readonly (readonly CodeDNA[])[] {
    const maxIterations = 100;
    const tolerance = 1e-4;

    // Initialize centroids randomly
    let centroids = this.initializeCentroids(embeddings, k);
    
    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign each point to the nearest centroid
      const clusters: CodeDNA[][] = Array.from({ length: k }, () => []);
      
      for (const item of embeddings) {
        let minDistance = Infinity;
        let closestCluster = 0;

        for (let i = 0; i < centroids.length; i++) {
          const distance = this.euclideanDistance(
            item.embedding as VectorLike<1536>,
            centroids[i]! as VectorLike<1536>
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestCluster = i;
          }
        }

        clusters[closestCluster]!.push(item.dna);
      }

      // Update centroids
      const newCentroids = this.updateCentroids(clusters, embeddings);
      
      // Check for convergence
      const converged = this.checkConvergence(centroids, newCentroids, tolerance);
      centroids = newCentroids;
      
      if (converged) break;
    }

    // Final cluster assignment
    const finalClusters: CodeDNA[][] = Array.from({ length: k }, () => []);
    
    for (const item of embeddings) {
      let minDistance = Infinity;
      let closestCluster = 0;

      for (let i = 0; i < centroids.length; i++) {
        const distance = this.euclideanDistance(
          item.embedding as VectorLike<1536>,
          centroids[i]! as VectorLike<1536>
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = i;
        }
      }

      finalClusters[closestCluster]!.push(item.dna);
    }

    return finalClusters.filter(cluster => cluster.length > 0);
  }

  private initializeCentroids(
    embeddings: readonly { dna: CodeDNA; embedding: readonly number[] }[],
    k: number
  ): readonly (readonly number[])[] {
    const centroids: (readonly number[])[] = [];
    const used = new Set<number>();

    // Use k-means++ initialization for better results
    if (embeddings.length > 0) {
      // Choose first centroid randomly
      const firstIndex = Math.floor(Math.random() * embeddings.length);
      centroids.push(embeddings[firstIndex]!.embedding);
      used.add(firstIndex);

      // Choose remaining centroids
      for (let i = 1; i < k && i < embeddings.length; i++) {
        const distances: number[] = [];
        
        for (let j = 0; j < embeddings.length; j++) {
          if (used.has(j)) {
            distances.push(0);
            continue;
          }

          let minDistToCentroid = Infinity;
          for (const centroid of centroids) {
            const dist = this.euclideanDistance(
              embeddings[j]!.embedding as VectorLike<1536>,
              centroid as VectorLike<1536>
            );
            minDistToCentroid = Math.min(minDistToCentroid, dist);
          }
          distances.push(minDistToCentroid * minDistToCentroid); // Square for probability weighting
        }

        // Choose next centroid based on weighted probability
        const totalDistance = distances.reduce((sum, d) => sum + d, 0);
        let random = Math.random() * totalDistance;
        
        for (let j = 0; j < distances.length; j++) {
          if (used.has(j)) continue;
          
          random -= distances[j]!;
          if (random <= 0) {
            centroids.push(embeddings[j]!.embedding);
            used.add(j);
            break;
          }
        }
      }
    }

    return centroids;
  }

  private updateCentroids(
    clusters: readonly (readonly CodeDNA[])[],
    embeddings: readonly { dna: CodeDNA; embedding: readonly number[] }[]
  ): readonly (readonly number[])[] {
    return clusters.map(cluster => {
      if (cluster.length === 0) {
        // Return a random embedding if cluster is empty
        const randomIndex = Math.floor(Math.random() * embeddings.length);
        return embeddings[randomIndex]!.embedding;
      }

      // Calculate centroid as average of cluster members
      const embeddingMap = new Map<string, readonly number[]>();
      for (const item of embeddings) {
        embeddingMap.set(item.dna.id, item.embedding);
      }

      const clusterEmbeddings = cluster.map(dna => embeddingMap.get(dna.id)!);
      const centroid = new Array(clusterEmbeddings[0]!.length).fill(0);

      for (const embedding of clusterEmbeddings) {
        for (let i = 0; i < embedding.length; i++) {
          centroid[i] += embedding[i]!;
        }
      }

      return centroid.map(sum => sum / clusterEmbeddings.length);
    });
  }

  private checkConvergence(
    oldCentroids: readonly (readonly number[])[],
    newCentroids: readonly (readonly number[])[],
    tolerance: number
  ): boolean {
    if (oldCentroids.length !== newCentroids.length) return false;

    for (let i = 0; i < oldCentroids.length; i++) {
      const distance = this.euclideanDistance(
        oldCentroids[i]! as VectorLike<1536>,
        newCentroids[i]! as VectorLike<1536>
      );
      
      if (distance > tolerance) {
        return false;
      }
    }

    return true;
  }
}

// ============================================================================
// PATTERN MATCHING SERVICE
// ============================================================================

export class PatternMatchingService {
  private readonly config: PatternMatchingConfig;
  private readonly vectorOps: VectorOperations;
  private patternEmbeddingCache = new Map<EvolutionDnaId, EmbeddingVector>();

  constructor(config: Partial<PatternMatchingConfig> = {}) {
    this.config = {
      embeddingDimensions: 1536,
      similarityThreshold: 0.7,
      contextWeight: 0.3,
      geneticWeight: 0.4,
      performanceWeight: 0.3,
      diversityWeight: 0.2,
      maxClusters: 10,
      adaptationRiskThreshold: 0.7,
      ...config,
    };

    this.vectorOps = new VectorOperations();
  }

  /**
   * Find patterns similar to the given DNA pattern
   */
  async findSimilarPatterns(
    queryDna: CodeDNA,
    candidatePatterns: readonly CodeDNA[],
    maxResults: number = 10
  ): Promise<readonly PatternSimilarityResult[]> {
    const results: PatternSimilarityResult[] = [];

    for (const candidate of candidatePatterns) {
      if (candidate.id === queryDna.id) continue;

      const similarity = await this.calculatePatternSimilarity(queryDna, candidate);
      
      if (similarity.overallScore >= this.config.similarityThreshold) {
        results.push(similarity);
      }
    }

    return results
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, maxResults);
  }

  /**
   * Calculate detailed similarity between two DNA patterns
   */
  async calculatePatternSimilarity(
    sourcePattern: CodeDNA,
    targetPattern: CodeDNA
  ): Promise<PatternSimilarityResult> {
    // Vector similarity
    const sourceEmbedding = await this.getOrGenerateEmbedding(sourcePattern);
    const targetEmbedding = await this.getOrGenerateEmbedding(targetPattern);
    const vectorSimilarity = this.vectorOps.cosineSimilarity(
      sourceEmbedding as VectorLike<1536>,
      targetEmbedding as VectorLike<1536>
    );

    // Context compatibility
    const contextCompatibility = this.calculateContextCompatibility(
      sourcePattern.context,
      targetPattern.context
    );

    // Genetic alignment
    const geneticAlignment = this.calculateGeneticAlignment(
      sourcePattern.genetics,
      targetPattern.genetics
    );

    // Performance alignment
    const performanceAlignment = this.calculatePerformanceAlignment(
      sourcePattern.performance,
      targetPattern.performance
    );

    // Calculate weighted overall score
    const overallScore = (
      vectorSimilarity * 0.3 +
      contextCompatibility * this.config.contextWeight +
      geneticAlignment * this.config.geneticWeight +
      performanceAlignment * this.config.performanceWeight
    );

    // Calculate transfer potential
    const transferPotential = this.calculateTransferPotential(
      sourcePattern,
      targetPattern,
      overallScore
    );

    // Generate reasoning
    const reasoning = this.generateSimilarityReasoning(
      vectorSimilarity,
      contextCompatibility,
      geneticAlignment,
      performanceAlignment,
      overallScore
    );

    return {
      sourcePattern,
      targetPattern,
      similarity: vectorSimilarity,
      contextCompatibility,
      geneticAlignment,
      performanceAlignment,
      overallScore,
      transferPotential,
      reasoning,
    };
  }

  /**
   * Generate transfer candidates for cross-project learning
   */
  async generateTransferCandidates(
    sourceDna: CodeDNA,
    targetProjectId: ProjectContextId,
    candidateProjects: readonly { projectId: ProjectContextId; patterns: readonly CodeDNA[] }[]
  ): Promise<readonly CrossProjectTransferCandidate[]> {
    const candidates: CrossProjectTransferCandidate[] = [];

    for (const project of candidateProjects) {
      if (project.projectId === targetProjectId) continue;

      for (const pattern of project.patterns) {
        const similarity = await this.calculatePatternSimilarity(sourceDna, pattern);
        
        if (similarity.overallScore >= this.config.similarityThreshold) {
          const candidate = await this.createTransferCandidate(
            sourceDna,
            targetProjectId,
            similarity
          );
          
          candidates.push(candidate);
        }
      }
    }

    return candidates.sort((a, b) => b.expectedOutcome.fitnessImprovement - a.expectedOutcome.fitnessImprovement);
  }

  /**
   * Cluster DNA patterns for analysis
   */
  async clusterPatterns(
    patterns: readonly CodeDNA[],
    numClusters?: number
  ): Promise<readonly PatternCluster[]> {
    const k = numClusters ?? Math.min(this.config.maxClusters, Math.max(2, Math.floor(patterns.length / 5)));
    
    const rawClusters = await this.vectorOps.clusterDnaPatterns(patterns, k);
    
    const clusters: PatternCluster[] = [];

    for (let i = 0; i < rawClusters.length; i++) {
      const clusterPatterns = rawClusters[i]!;
      if (clusterPatterns.length === 0) continue;

      const cluster = await this.analyzeCluster(clusterPatterns, i);
      clusters.push(cluster);
    }

    return clusters;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async getOrGenerateEmbedding(dna: CodeDNA): Promise<EmbeddingVector> {
    let embedding = this.patternEmbeddingCache.get(dna.id);
    
    if (!embedding) {
      const generated = await this.vectorOps.generateDnaEmbedding(dna);
      embedding = generated as EmbeddingVector;
      this.patternEmbeddingCache.set(dna.id, embedding);
    }

    return embedding;
  }

  private calculateContextCompatibility(
    context1: ProjectContext,
    context2: ProjectContext
  ): number {
    let compatibility = 0;

    // Project type compatibility
    if (context1.projectType === context2.projectType) {
      compatibility += 0.4;
    } else {
      // Partial compatibility for related types
      const relatedTypes: Record<string, string[]> = {
        'web-app': ['api', 'library'],
        'api': ['web-app', 'library'],
        'cli': ['library'],
        'library': ['web-app', 'api', 'cli'],
      };
      
      if (relatedTypes[context1.projectType]?.includes(context2.projectType)) {
        compatibility += 0.2;
      }
    }

    // Technology stack overlap
    const commonTech = context1.techStack.filter(tech => 
      context2.techStack.includes(tech)
    );
    const techCompatibility = commonTech.length / Math.max(
      context1.techStack.length,
      context2.techStack.length,
      1
    );
    compatibility += techCompatibility * 0.3;

    // Complexity compatibility
    const complexityLevels = ['low', 'medium', 'high', 'enterprise', 'research'];
    const complexityDistance = Math.abs(
      complexityLevels.indexOf(context1.complexity) - 
      complexityLevels.indexOf(context2.complexity)
    );
    compatibility += (1 - complexityDistance / 4) * 0.2;

    // Team size compatibility
    const teamSizeRatio = Math.min(context1.teamSize, context2.teamSize) / 
                          Math.max(context1.teamSize, context2.teamSize, 1);
    compatibility += teamSizeRatio * 0.1;

    return Math.max(0, Math.min(1, compatibility));
  }

  private calculateGeneticAlignment(
    genetics1: GeneticMarkers,
    genetics2: GeneticMarkers
  ): number {
    const keys = Object.keys(genetics1) as (keyof GeneticMarkers)[];
    let totalAlignment = 0;

    for (const key of keys) {
      const val1 = genetics1[key] as number;
      const val2 = genetics2[key] as number;
      const alignment = 1 - Math.abs(val1 - val2);
      totalAlignment += alignment;
    }

    return totalAlignment / keys.length;
  }

  private calculatePerformanceAlignment(
    perf1: PerformanceMetrics,
    perf2: PerformanceMetrics
  ): number {
    const keyMetrics = [
      'successRate',
      'codeQualityScore',
      'errorRecoveryRate',
      'adaptationSpeed',
      'userSatisfactionRating',
      'computationalEfficiency',
      'maintainabilityScore',
    ] as const;

    let totalAlignment = 0;
    
    for (const metric of keyMetrics) {
      const val1 = perf1[metric] as number;
      const val2 = perf2[metric] as number;
      const alignment = 1 - Math.abs(val1 - val2);
      totalAlignment += alignment;
    }

    return totalAlignment / keyMetrics.length;
  }

  private calculateTransferPotential(
    sourcePattern: CodeDNA,
    targetPattern: CodeDNA,
    similarity: number
  ): number {
    // Higher similarity, better fitness, and lower generation gap = higher potential
    const fitnessGap = Math.abs(sourcePattern.fitnessScore - targetPattern.fitnessScore);
    const generationGap = Math.abs(sourcePattern.generation - targetPattern.generation);
    
    const potential = (
      similarity * 0.4 +
      (1 - fitnessGap) * 0.3 +
      (1 - Math.min(1, generationGap / 20)) * 0.3
    );

    return Math.max(0, Math.min(1, potential));
  }

  private generateSimilarityReasoning(
    vectorSim: number,
    contextComp: number,
    geneticAlign: number,
    perfAlign: number,
    overall: number
  ): string {
    const reasons: string[] = [];

    if (vectorSim > 0.8) reasons.push('high vector similarity');
    else if (vectorSim > 0.6) reasons.push('moderate vector similarity');

    if (contextComp > 0.7) reasons.push('compatible project contexts');
    else if (contextComp > 0.5) reasons.push('somewhat compatible contexts');

    if (geneticAlign > 0.8) reasons.push('closely aligned genetic markers');
    if (perfAlign > 0.7) reasons.push('similar performance characteristics');

    if (overall > 0.8) return `Strong match: ${reasons.join(', ')}`;
    else if (overall > 0.6) return `Good match: ${reasons.join(', ')}`;
    else return `Moderate match: ${reasons.join(', ')}`;
  }

  private async createTransferCandidate(
    sourceDna: CodeDNA,
    targetProjectId: ProjectContextId,
    similarity: PatternSimilarityResult
  ): Promise<CrossProjectTransferCandidate> {
    // Calculate required genetic modifications
    const geneticModifications: Record<keyof GeneticMarkers, number> = {} as any;
    const keys = Object.keys(sourceDna.genetics) as (keyof GeneticMarkers)[];
    
    for (const key of keys) {
      const sourceValue = sourceDna.genetics[key] as number;
      const targetValue = similarity.targetPattern.genetics[key] as number;
      if (Math.abs(sourceValue - targetValue) > 0.1) {
        geneticModifications[key] = targetValue - sourceValue;
      }
    }

    // Calculate risk level
    const modificationCount = Object.keys(geneticModifications).length;
    const avgModification = Object.values(geneticModifications)
      .reduce((sum, val) => sum + Math.abs(val), 0) / Math.max(1, modificationCount);
    
    let riskLevel: 'low' | 'medium' | 'high';
    if (avgModification < 0.2) riskLevel = 'low';
    else if (avgModification < 0.4) riskLevel = 'medium';
    else riskLevel = 'high';

    // Calculate expected outcomes
    const fitnessImprovement = similarity.transferPotential * 0.1; // Conservative estimate
    const confidence = similarity.overallScore * 0.8; // Reduce confidence for transfer
    const timeline = riskLevel === 'low' ? 60000 : riskLevel === 'medium' ? 300000 : 900000; // 1min, 5min, 15min

    return {
      id: `transfer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      sourceDnaId: sourceDna.id,
      targetProjectId,
      similarity: similarity.overallScore,
      adaptationRequired: {
        geneticModifications,
        contextualChanges: this.identifyContextualChanges(sourceDna.context, similarity.targetPattern.context),
        riskLevel,
      },
      expectedOutcome: {
        fitnessImprovement,
        confidence,
        timeline,
      },
    };
  }

  private identifyContextualChanges(
    sourceContext: ProjectContext,
    targetContext: ProjectContext
  ): readonly string[] {
    const changes: string[] = [];

    if (sourceContext.projectType !== targetContext.projectType) {
      changes.push(`Project type change: ${sourceContext.projectType} → ${targetContext.projectType}`);
    }

    if (sourceContext.complexity !== targetContext.complexity) {
      changes.push(`Complexity change: ${sourceContext.complexity} → ${targetContext.complexity}`);
    }

    const newTech = targetContext.techStack.filter(tech => !sourceContext.techStack.includes(tech));
    const removedTech = sourceContext.techStack.filter(tech => !targetContext.techStack.includes(tech));

    if (newTech.length > 0) {
      changes.push(`New technologies: ${newTech.join(', ')}`);
    }

    if (removedTech.length > 0) {
      changes.push(`Removed technologies: ${removedTech.join(', ')}`);
    }

    if (Math.abs(sourceContext.teamSize - targetContext.teamSize) > 2) {
      changes.push(`Team size change: ${sourceContext.teamSize} → ${targetContext.teamSize}`);
    }

    return changes;
  }

  private async analyzeCluster(
    patterns: readonly CodeDNA[],
    clusterId: number
  ): Promise<PatternCluster> {
    // Calculate centroid embedding
    const embeddings = await Promise.all(patterns.map(p => this.getOrGenerateEmbedding(p)));
    const centroid = this.calculateCentroid(embeddings);

    // Analyze dominant characteristics
    const patternTypes = patterns.map(p => p.patternType);
    const dominantPatternType = this.getMostFrequent(patternTypes);

    const avgGeneration = patterns.reduce((sum, p) => sum + p.generation, 0) / patterns.length;
    const avgFitness = patterns.reduce((sum, p) => sum + p.fitnessScore, 0) / patterns.length;

    const allTechStack = patterns.flatMap(p => p.context.techStack);
    const commonTechStack = this.getMostFrequentItems(allTechStack, 3);

    const contextTypes = patterns.map(p => p.context.projectType);
    const uniqueContextTypes = [...new Set(contextTypes)];

    // Calculate diversity
    const diversity = this.calculateClusterDiversity(patterns);

    return {
      id: `cluster_${clusterId}`,
      centroid: centroid as EmbeddingVector,
      patterns,
      dominantCharacteristics: {
        patternType: dominantPatternType,
        avgGeneration,
        avgFitness,
        commonTechStack,
        contextTypes: uniqueContextTypes,
      },
      diversity,
    };
  }

  private calculateCentroid(embeddings: readonly EmbeddingVector[]): readonly number[] {
    if (embeddings.length === 0) return [];

    const dimensions = embeddings[0]!.length;
    const centroid = new Array(dimensions).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += embedding[i]!;
      }
    }

    return centroid.map(sum => sum / embeddings.length);
  }

  private getMostFrequent<T>(items: readonly NonNullable<T>[]): NonNullable<T> {
    const counts = new Map<NonNullable<T>, number>();
    
    for (const item of items) {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }

    let mostFrequent = items[0]!;
    let maxCount = 0;

    for (const [item, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    }

    return mostFrequent;
  }

  private getMostFrequentItems<T>(items: readonly T[], limit: number): readonly T[] {
    const counts = new Map<T, number>();
    
    for (const item of items) {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item);
  }

  private calculateClusterDiversity(patterns: readonly CodeDNA[]): number {
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

  private calculateGeneticDistance(
    genetics1: GeneticMarkers,
    genetics2: GeneticMarkers
  ): number {
    const keys = Object.keys(genetics1) as (keyof GeneticMarkers)[];
    let totalDistance = 0;

    for (const key of keys) {
      const val1 = genetics1[key] as number;
      const val2 = genetics2[key] as number;
      totalDistance += Math.abs(val1 - val2);
    }

    return totalDistance / keys.length;
  }

  /**
   * Clear embedding cache to free memory
   */
  clearCache(): void {
    this.patternEmbeddingCache.clear();
  }
}

export default PatternMatchingService;