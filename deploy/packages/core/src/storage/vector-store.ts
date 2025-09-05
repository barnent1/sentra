/**
 * Vector Store Implementation for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * 
 * Provides Qdrant-based vector storage for evolutionary patterns with:
 * - Pattern embedding and storage operations
 * - Similarity search with filtering capabilities
 * - Batch operations for high-throughput scenarios
 * - Error handling with exponential backoff retry logic
 */

// @ts-ignore - Package exists but types may not be fully compatible
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import type {
  CodeDNA,
  EvolutionDnaId,
  PatternTypeEnum,
  PerformanceMetrics,
  GeneticMarkers,
} from '../types/evolution';

// ============================================================================
// CONFIGURATION AND TYPES
// ============================================================================

/**
 * Vector store configuration with Qdrant and OpenAI settings
 */
export interface VectorStoreConfig {
  readonly qdrant: {
    readonly url: string;
    readonly apiKey?: string;
    readonly timeout?: number;
  };
  readonly openai: {
    readonly apiKey: string;
    readonly model?: string;
  };
  readonly collections: {
    readonly evolutionPatterns: string;
  };
  readonly embedding: {
    readonly dimensions: number;
  };
  readonly performance: {
    readonly batchSize: number;
    readonly maxRetries: number;
    readonly retryDelayMs: number;
  };
}

/**
 * Default configuration for vector store
 */
export const DEFAULT_VECTOR_CONFIG: VectorStoreConfig = {
  qdrant: {
    url: process.env['QDRANT_URL'] || 'http://localhost:6333',
    ...(process.env['QDRANT_API_KEY'] && { apiKey: process.env['QDRANT_API_KEY'] }),
    timeout: 30000,
  },
  openai: {
    apiKey: process.env['OPENAI_API_KEY'] || '',
    model: 'text-embedding-3-small',
  },
  collections: {
    evolutionPatterns: 'evolution_patterns',
  },
  embedding: {
    dimensions: 1536,
  },
  performance: {
    batchSize: 100,
    maxRetries: 3,
    retryDelayMs: 1000,
  },
} as const;

/**
 * Search filters for pattern queries
 */
export interface PatternSearchFilter {
  readonly patternTypes?: readonly PatternTypeEnum[];
  readonly generations?: readonly number[];
  readonly technologies?: readonly string[];
  readonly domains?: readonly string[];
  readonly performanceThresholds?: {
    readonly minSuccessRate?: number;
    readonly maxResponseTime?: number;
    readonly minThroughput?: number;
  };
  readonly geneticThresholds?: {
    readonly minComplexity?: number;
    readonly minAdaptability?: number;
    readonly minNovelty?: number;
  };
}

/**
 * Search result with similarity score
 */
export interface PatternSearchResult {
  readonly pattern: CodeDNA;
  readonly similarity: number;
  readonly distance: number;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  readonly success: boolean;
  readonly processedCount: number;
  readonly failedCount: number;
  readonly errors: readonly string[];
  readonly processingTimeMs: number;
}

// ============================================================================
// EMBEDDING OPERATIONS
// ============================================================================

/**
 * Embedding service for generating pattern embeddings
 */
export class EmbeddingService {
  private readonly openai: OpenAI;
  private readonly config: VectorStoreConfig;

  constructor(config: VectorStoreConfig) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Convert CodeDNA pattern to text for embedding generation
   */
  private patternToEmbeddingText(pattern: CodeDNA): string {
    const parts = [
      `Pattern Type: ${pattern.patternType}`,
      `Generation: ${pattern.generation}`,
      `Context: ${pattern.context.projectType} - ${pattern.context.complexity}`,
      `Tech Stack: ${pattern.context.techStack.join(', ')}`,
      `Domain: ${pattern.context.industryDomain}`,
      
      // Genetic markers as features
      `Complexity: ${pattern.genetics.complexity}`,
      `Adaptability: ${pattern.genetics.adaptability}`,
      `Success Rate: ${pattern.genetics.successRate}`,
      `Novelty: ${pattern.genetics.novelty}`,
      `Pattern Recognition: ${pattern.genetics.patternRecognition}`,
      `Learning Velocity: ${pattern.genetics.learningVelocity}`,
      
      // Performance characteristics
      `Task Success: ${pattern.performance.successRate}`,
      `Code Quality: ${pattern.performance.codeQualityScore}`,
      `Adaptation Speed: ${pattern.performance.adaptationSpeed}`,
      `Resource Efficiency: ${pattern.performance.computationalEfficiency}`,
      
      // Context and notes
      `Requirements: ${pattern.context.requirements.join(', ')}`,
      `Notes: ${pattern.notes}`,
    ];

    return parts.join('\n');
  }

  /**
   * Generate embedding for a CodeDNA pattern
   */
  async generatePatternEmbedding(pattern: CodeDNA): Promise<readonly number[]> {
    const text = this.patternToEmbeddingText(pattern);
    
    try {
      const response = await this.openai.embeddings.create({
        model: this.config.openai.model || 'text-embedding-3-small',
        input: text,
        dimensions: this.config.embedding.dimensions,
      });

      if (!response.data[0]?.embedding) {
        throw new Error('No embedding returned from OpenAI API');
      }

      return response.data[0].embedding;
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }

  /**
   * Generate embeddings for multiple patterns in batch
   */
  async generateBatchEmbeddings(
    patterns: readonly CodeDNA[]
  ): Promise<readonly (readonly number[])[]> {
    const texts = patterns.map(pattern => this.patternToEmbeddingText(pattern));
    
    try {
      const response = await this.openai.embeddings.create({
        model: this.config.openai.model || 'text-embedding-3-small',
        input: texts,
        dimensions: this.config.embedding.dimensions,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      throw new Error(`Failed to generate batch embeddings: ${error}`);
    }
  }
}

// ============================================================================
// VECTOR STORE IMPLEMENTATION
// ============================================================================

/**
 * Core vector store implementation using Qdrant
 */
export class EvolutionVectorStore {
  private readonly qdrant: QdrantClient;
  private readonly embedding: EmbeddingService;
  private readonly config: VectorStoreConfig;

  constructor(config: VectorStoreConfig = DEFAULT_VECTOR_CONFIG) {
    this.config = config;
    this.qdrant = new QdrantClient({
      url: config.qdrant.url,
      ...(config.qdrant.apiKey && { apiKey: config.qdrant.apiKey }),
      ...(config.qdrant.timeout && { timeout: config.qdrant.timeout }),
    });
    this.embedding = new EmbeddingService(config);
  }

  /**
   * Initialize the vector store collections
   */
  async initialize(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await this.qdrant.getCollections();
      const collectionExists = collections.collections.some(
        (col: any) => col.name === this.config.collections.evolutionPatterns
      );

      if (!collectionExists) {
        await this.qdrant.createCollection(this.config.collections.evolutionPatterns, {
          vectors: {
            size: this.config.embedding.dimensions,
            distance: 'Cosine',
          },
          optimizers_config: {
            deleted_threshold: 0.2,
            vacuum_min_vector_number: 1000,
            default_segment_number: 0,
          },
          replication_factor: 1,
          write_consistency_factor: 1,
        });
      }
    } catch (error) {
      throw new Error(`Failed to initialize vector store: ${error}`);
    }
  }

  /**
   * Convert pattern to Qdrant payload
   */
  private patternToPayload(pattern: CodeDNA): Record<string, unknown> {
    return {
      // Basic identifiers
      patternId: pattern.id,
      patternType: pattern.patternType,
      generation: pattern.generation,
      parentId: pattern.parentId,
      
      // Context information
      projectType: pattern.context.projectType,
      techStack: pattern.context.techStack,
      complexity: pattern.context.complexity,
      industryDomain: pattern.context.industryDomain,
      teamSize: pattern.context.teamSize,
      
      // Genetic markers (key for similarity matching)
      genetics: {
        complexity: pattern.genetics.complexity,
        adaptability: pattern.genetics.adaptability,
        successRate: pattern.genetics.successRate,
        novelty: pattern.genetics.novelty,
        patternRecognition: pattern.genetics.patternRecognition,
        learningVelocity: pattern.genetics.learningVelocity,
        creativity: pattern.genetics.creativity,
        stability: pattern.genetics.stability,
      },
      
      // Performance metrics
      performance: {
        successRate: pattern.performance.successRate,
        codeQualityScore: pattern.performance.codeQualityScore,
        adaptationSpeed: pattern.performance.adaptationSpeed,
        computationalEfficiency: pattern.performance.computationalEfficiency,
        throughput: pattern.performance.throughput,
        responseLatency: pattern.performance.responseLatency,
      },
      
      // Metadata
      fitnessScore: pattern.fitnessScore,
      activationCount: pattern.activationCount,
      reproductionPotential: pattern.reproductionPotential,
      tags: pattern.tags,
      isArchived: pattern.isArchived,
      
      // Timestamps
      timestamp: pattern.timestamp.toISOString(),
      lastActivation: pattern.lastActivation.toISOString(),
    };
  }

  /**
   * Store a single pattern in the vector store
   */
  async storePattern(pattern: CodeDNA): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Generate embedding if not present
      let embedding: readonly number[] = pattern.embedding;
      if (!embedding || embedding.length === 0) {
        embedding = await this.embedding.generatePatternEmbedding(pattern);
      }

      // Prepare point for insertion
      const point = {
        id: pattern.id,
        vector: Array.from(embedding),
        payload: this.patternToPayload(pattern),
      };

      // Insert into Qdrant with retry logic
      await this.withRetry(async () => {
        await this.qdrant.upsert(this.config.collections.evolutionPatterns, {
          wait: true,
          points: [point],
        });
      });

      const processingTime = Date.now() - startTime;
      if (processingTime > 50) {
        console.warn(`Slow pattern storage: ${processingTime}ms for pattern ${pattern.id}`);
      }
    } catch (error) {
      throw new Error(`Failed to store pattern ${pattern.id}: ${error}`);
    }
  }

  /**
   * Store multiple patterns in batch
   */
  async storePatternsInBatch(patterns: readonly CodeDNA[]): Promise<BatchOperationResult> {
    const startTime = Date.now();
    let processedCount = 0;
    const errors: string[] = [];

    try {
      // Generate embeddings in batch
      const patternsNeedingEmbeddings = patterns.filter(
        p => !p.embedding || p.embedding.length === 0
      );
      
      let embeddings: readonly (readonly number[])[] = [];
      if (patternsNeedingEmbeddings.length > 0) {
        embeddings = await this.embedding.generateBatchEmbeddings(patternsNeedingEmbeddings);
      }

      // Prepare points for batch insertion
      let embeddingIndex = 0;
      const points = patterns.map(pattern => {
        let patternEmbedding = pattern.embedding;
        if (!patternEmbedding || patternEmbedding.length === 0) {
          const newEmbedding = embeddings[embeddingIndex++];
          if (!newEmbedding) {
            throw new Error('Missing embedding for pattern');
          }
          patternEmbedding = newEmbedding;
        }

        return {
          id: pattern.id,
          vector: Array.from(patternEmbedding),
          payload: this.patternToPayload(pattern),
        };
      });

      // Process in batches
      const batchSize = this.config.performance.batchSize;
      for (let i = 0; i < points.length; i += batchSize) {
        const batch = points.slice(i, i + batchSize);
        
        try {
          await this.withRetry(async () => {
            await this.qdrant.upsert(this.config.collections.evolutionPatterns, {
              wait: true,
              points: batch,
            });
          });
          processedCount += batch.length;
        } catch (error) {
          errors.push(`Batch ${i / batchSize}: ${error}`);
        }
      }

      const processingTime = Date.now() - startTime;
      return {
        success: errors.length === 0,
        processedCount,
        failedCount: patterns.length - processedCount,
        errors,
        processingTimeMs: processingTime,
      };
    } catch (error) {
      errors.push(`Batch operation failed: ${error}`);
      return {
        success: false,
        processedCount,
        failedCount: patterns.length - processedCount,
        errors,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Search for similar patterns
   */
  async searchSimilarPatterns(
    queryPattern: CodeDNA,
    options: {
      readonly limit?: number;
      readonly threshold?: number;
      readonly filter?: PatternSearchFilter;
    } = {}
  ): Promise<readonly PatternSearchResult[]> {
    const { limit = 20, threshold = 0.7, filter } = options;

    try {
      // Generate embedding for query pattern
      const queryEmbedding = queryPattern.embedding && queryPattern.embedding.length > 0
        ? queryPattern.embedding
        : await this.embedding.generatePatternEmbedding(queryPattern);

      // Build Qdrant filter
      const qdrantFilter = this.buildQdrantFilter(filter);

      // Perform similarity search
      const searchResult = await this.qdrant.search(
        this.config.collections.evolutionPatterns,
        {
          vector: Array.from(queryEmbedding),
          limit,
          score_threshold: threshold,
          ...(qdrantFilter && { filter: qdrantFilter }),
          with_payload: true,
          with_vector: false,
        }
      );

      // Convert results
      return searchResult.map((result: any) => ({
        pattern: this.payloadToPattern(result.payload as Record<string, unknown>, result.id as EvolutionDnaId),
        similarity: result.score || 0,
        distance: 1 - (result.score || 0),
      }));
    } catch (error) {
      throw new Error(`Failed to search patterns: ${error}`);
    }
  }

  /**
   * Delete pattern from vector store
   */
  async deletePattern(patternId: EvolutionDnaId): Promise<void> {
    try {
      await this.withRetry(async () => {
        await this.qdrant.delete(this.config.collections.evolutionPatterns, {
          wait: true,
          points: [patternId],
        });
      });
    } catch (error) {
      throw new Error(`Failed to delete pattern ${patternId}: ${error}`);
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionInfo(): Promise<{
    readonly vectorCount: number;
    readonly indexedVectorCount: number;
    readonly memoryUsageMb: number;
  }> {
    try {
      const info = await this.qdrant.getCollection(this.config.collections.evolutionPatterns);
      
      return {
        vectorCount: info.vectors_count || 0,
        indexedVectorCount: info.indexed_vectors_count || 0,
        memoryUsageMb: Math.round((info.segments_count || 0) * 0.1), // Rough estimate
      };
    } catch (error) {
      throw new Error(`Failed to get collection info: ${error}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Build Qdrant filter from search criteria
   */
  private buildQdrantFilter(filter?: PatternSearchFilter): Record<string, unknown> | undefined {
    if (!filter) return undefined;

    const conditions: Record<string, unknown>[] = [];

    if (filter.patternTypes?.length) {
      conditions.push({
        key: 'patternType',
        match: {
          any: filter.patternTypes,
        },
      });
    }

    if (filter.generations?.length) {
      conditions.push({
        key: 'generation',
        match: {
          any: filter.generations,
        },
      });
    }

    if (filter.performanceThresholds?.minSuccessRate) {
      conditions.push({
        key: 'performance.successRate',
        range: {
          gte: filter.performanceThresholds.minSuccessRate,
        },
      });
    }

    if (filter.geneticThresholds?.minComplexity) {
      conditions.push({
        key: 'genetics.complexity',
        range: {
          gte: filter.geneticThresholds.minComplexity,
        },
      });
    }

    return conditions.length > 0 ? { must: conditions } : undefined;
  }

  /**
   * Convert Qdrant payload back to CodeDNA (partial reconstruction)
   */
  private payloadToPattern(payload: Record<string, unknown>, id: EvolutionDnaId): CodeDNA {
    // Note: This is a partial reconstruction for search results
    // In practice, you'd typically fetch the full pattern from your database
    return {
      id,
      patternType: payload['patternType'] as PatternTypeEnum,
      generation: payload['generation'] as number,
      parentId: payload['parentId'] as EvolutionDnaId | undefined,
      genetics: payload['genetics'] as GeneticMarkers,
      performance: payload['performance'] as PerformanceMetrics,
      // ... other required fields would be reconstructed or fetched from database
    } as CodeDNA;
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < this.config.performance.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.performance.maxRetries - 1) {
          const delay = this.config.performance.retryDelayMs * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}

// Export statement removed - types are already exported with their declarations