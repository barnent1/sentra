/**
 * Vector utility functions for pgvector operations
 * Handles embedding operations and similarity searches
 */

import { sql } from 'drizzle-orm';
import { getDatabase } from './connection';
import { evolutionDna, learningOutcomes } from '../schema';
import type { EvolutionDnaId, LearningOutcomeId } from '@sentra/types';

/**
 * Vector similarity search options
 */
export interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
  operator?: 'cosine' | 'l2' | 'inner_product';
}

/**
 * Calculate cosine similarity between two vectors
 */
export const calculateCosineSimilarity = (vector1: number[], vector2: number[]): number => {
  if (vector1.length !== vector2.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  
  const dotProduct = vector1.reduce((sum, a, i) => sum + a * (vector2[i] || 0), 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, a) => sum + a * a, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, a) => sum + a * a, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
};

/**
 * Find similar DNA patterns using vector similarity
 */
export const findSimilarDnaPatterns = async (
  queryEmbedding: number[],
  options: VectorSearchOptions = {}
) => {
  const db = getDatabase();
  const { limit = 10, threshold = 0.7, operator = 'cosine' } = options;
  
  const operatorMap = {
    cosine: '<=>',
    l2: '<->',
    inner_product: '<#>',
  };
  
  const similarityExpression = operator === 'cosine' 
    ? sql`(1 - (${evolutionDna.embedding} <=> ${queryEmbedding}))`
    : operator === 'l2'
    ? sql`(${evolutionDna.embedding} <-> ${queryEmbedding})`
    : sql`(${evolutionDna.embedding} <#> ${queryEmbedding})`;
  
  const results = await db
    .select({
      id: evolutionDna.id,
      patternType: evolutionDna.patternType,
      genetics: evolutionDna.genetics,
      performance: evolutionDna.performance,
      projectContext: evolutionDna.projectContext,
      generation: evolutionDna.generation,
      similarity: similarityExpression,
    })
    .from(evolutionDna)
    .where(sql`${evolutionDna.embedding} IS NOT NULL`)
    .orderBy(sql`${evolutionDna.embedding} ${sql.raw(operatorMap[operator])} ${queryEmbedding}`)
    .limit(limit);
  
  return results.filter(result => (result.similarity as number) >= threshold);
};

/**
 * Find similar learning outcomes using vector similarity
 */
export const findSimilarLearningOutcomes = async (
  queryEmbedding: number[],
  options: VectorSearchOptions = {}
) => {
  const db = getDatabase();
  const { limit = 10, threshold = 0.7, operator = 'cosine' } = options;
  
  const operatorMap = {
    cosine: '<=>',
    l2: '<->',
    inner_product: '<#>',
  };
  
  const similarityExpression = operator === 'cosine' 
    ? sql`(1 - (${learningOutcomes.embedding} <=> ${queryEmbedding}))`
    : operator === 'l2'
    ? sql`(${learningOutcomes.embedding} <-> ${queryEmbedding})`
    : sql`(${learningOutcomes.embedding} <#> ${queryEmbedding})`;
  
  const results = await db
    .select({
      id: learningOutcomes.id,
      agentInstanceId: learningOutcomes.agentInstanceId,
      outcomeType: learningOutcomes.outcomeType,
      lessonLearned: learningOutcomes.lessonLearned,
      contextFactors: learningOutcomes.contextFactors,
      applicabilityScore: learningOutcomes.applicabilityScore,
      similarity: similarityExpression,
    })
    .from(learningOutcomes)
    .where(sql`${learningOutcomes.embedding} IS NOT NULL`)
    .orderBy(sql`${learningOutcomes.embedding} ${sql.raw(operatorMap[operator])} ${queryEmbedding}`)
    .limit(limit);
  
  return results.filter(result => (result.similarity as number) >= threshold);
};

/**
 * Update embedding for evolution DNA
 */
export const updateDnaEmbedding = async (
  dnaId: EvolutionDnaId, 
  embedding: number[]
) => {
  const db = getDatabase();
  
  await db
    .update(evolutionDna)
    .set({ 
      embedding,
      updatedAt: new Date(),
    })
    .where(sql`${evolutionDna.id} = ${dnaId}`);
};

/**
 * Update embedding for learning outcome
 */
export const updateLearningOutcomeEmbedding = async (
  outcomeId: LearningOutcomeId,
  embedding: number[]
) => {
  const db = getDatabase();
  
  await db
    .update(learningOutcomes)
    .set({ embedding })
    .where(sql`${learningOutcomes.id} = ${outcomeId}`);
};

/**
 * Generate a random embedding vector for testing purposes
 */
export const generateRandomEmbedding = (dimensions: number = 1536): number[] => {
  const vector = [];
  for (let i = 0; i < dimensions; i++) {
    vector.push((Math.random() - 0.5) * 2); // Range: -1 to 1
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
};