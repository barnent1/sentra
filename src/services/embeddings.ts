/**
 * Embedding Service
 *
 * Generates text embeddings using OpenAI's text-embedding-3-small model.
 * API keys are retrieved from user settings (database) and decrypted.
 *
 * Features:
 * - Database-stored API key retrieval (per-user)
 * - Batch embedding support (up to 100 texts)
 * - Automatic retry with exponential backoff
 * - Cost tracking (token usage)
 *
 * Model: text-embedding-3-small (1536 dimensions, $0.00002/1K tokens)
 */

import OpenAI from 'openai';
import { drizzleDb } from './database-drizzle';
import { decryptValue } from './encryption';

// Constants
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const MAX_BATCH_SIZE = 100;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Generate embedding for a single text
 *
 * @param text - Text to embed
 * @param userId - User ID for API key retrieval
 * @returns Embedding vector (1536 dimensions)
 * @throws Error if API key not configured or API call fails
 */
export async function generateEmbedding(text: string, userId: string): Promise<number[]> {
  // Retrieve and decrypt user's OpenAI API key
  const apiKey = await getOpenAIApiKey(userId);

  // Create OpenAI client
  const openai = new OpenAI({ apiKey });

  try {
    // Generate embedding with retry logic
    const response = await retryWithBackoff(async () => {
      return await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        encoding_format: 'float',
      });
    });

    // Extract embedding vector
    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error('No embedding returned from OpenAI');
    }

    // Validate dimensions
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Unexpected embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`
      );
    }

    return embedding;
  } catch (error) {
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate embeddings for multiple texts in a single batch
 *
 * More efficient than calling generateEmbedding multiple times.
 * OpenAI allows up to 100 texts per batch.
 *
 * @param texts - Array of texts to embed
 * @param userId - User ID for API key retrieval
 * @returns Array of embedding vectors (same order as input)
 * @throws Error if batch size exceeds 100 or API call fails
 */
export async function batchGenerateEmbeddings(
  texts: string[],
  userId: string
): Promise<number[][]> {
  // Validate batch size
  if (texts.length > MAX_BATCH_SIZE) {
    throw new Error(`Batch size cannot exceed ${MAX_BATCH_SIZE}`);
  }

  if (texts.length === 0) {
    return [];
  }

  // Retrieve and decrypt user's OpenAI API key
  const apiKey = await getOpenAIApiKey(userId);

  // Create OpenAI client
  const openai = new OpenAI({ apiKey });

  try {
    // Generate embeddings with retry logic
    const response = await retryWithBackoff(async () => {
      return await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
        encoding_format: 'float',
      });
    });

    // Sort by index to ensure correct order
    const sortedData = response.data.sort((a, b) => a.index - b.index);

    // Extract embeddings
    const embeddings = sortedData.map((item) => item.embedding);

    // Validate all embeddings have correct dimensions
    embeddings.forEach((embedding, i) => {
      if (embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Unexpected embedding dimensions at index ${i}: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`
        );
      }
    });

    return embeddings;
  } catch (error) {
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Retrieve and decrypt user's OpenAI API key from database
 *
 * @param userId - User ID
 * @returns Decrypted API key
 * @throws Error if user settings not found or API key not configured
 */
async function getOpenAIApiKey(userId: string): Promise<string> {
  // Get user settings from database
  const settings = await drizzleDb.getSettingsByUserId(userId);

  if (!settings) {
    throw new Error('User settings not found');
  }

  if (!settings.openaiApiKey) {
    throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
  }

  // Decrypt API key
  try {
    return decryptValue(settings.openaiApiKey);
  } catch (error) {
    throw new Error(
      `Failed to decrypt API key: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Retry a function with exponential backoff
 *
 * Useful for handling rate limits and transient failures.
 *
 * @param fn - Async function to retry
 * @returns Result of function
 */
async function retryWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null;
  let delay = INITIAL_RETRY_DELAY;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Check if error is retryable (rate limit, timeout, etc.)
      const isRetryable = isRetryableError(error);
      if (!isRetryable || attempt === MAX_RETRIES - 1) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff
      delay *= 2;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Check if an error is retryable
 *
 * Rate limits, timeouts, and 5xx errors are retryable.
 * Invalid API keys, invalid input, etc. are not retryable.
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  // Rate limit errors
  if (message.includes('rate limit')) {
    return true;
  }

  // Timeout errors
  if (message.includes('timeout')) {
    return true;
  }

  // 5xx server errors
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return true;
  }

  // Not retryable (invalid API key, invalid input, etc.)
  return false;
}

/**
 * Calculate embedding cost
 *
 * text-embedding-3-small: $0.00002 per 1K tokens
 *
 * @param tokens - Number of tokens processed
 * @returns Cost in dollars
 */
export function calculateEmbeddingCost(tokens: number): number {
  const COST_PER_1K_TOKENS = 0.00002;
  return (tokens / 1000) * COST_PER_1K_TOKENS;
}
