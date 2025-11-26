/**
 * Vector Store Service
 *
 * Semantic search for architect conversations using pgvector.
 * Stores conversation chunks with embeddings and provides cosine similarity search.
 *
 * Features:
 * - Store conversations with automatic embedding generation
 * - Semantic search using vector similarity
 * - Filter by session, category, timestamp
 * - Store and retrieve architectural decisions
 *
 * Pattern: Accept userId, fetch API key from database (via embeddings service)
 */

import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { drizzleDb } from './database-drizzle';
import { generateEmbedding } from './embeddings';
import {
  architectConversations,
  architectDecisions,
  type ArchitectConversation,
  type ArchitectDecision,
} from '../db/schema';

// ============================================================================
// Types
// ============================================================================

export interface StoreConversationInput {
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode: 'voice' | 'text' | 'system';
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  sessionId?: string;
  category?: string;
  similarityThreshold?: number;
  limit?: number;
}

export interface LoadContextOptions {
  category?: string;
  limit?: number;
}

export interface StoreDecisionInput {
  sessionId: string;
  category: string;
  decision: string;
  rationale?: string;
  confidence?: number;
  alternatives?: Array<{
    option: string;
    why_rejected: string;
  }>;
}

export interface SearchResult {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  category: string | null;
  similarity: number;
  timestamp: Date;
}

// ============================================================================
// Store Conversation
// ============================================================================

/**
 * Store conversation with embedding
 *
 * @param conversation - Conversation data
 * @param userId - User ID for API key retrieval
 * @returns Stored conversation with ID
 */
export async function storeConversation(
  conversation: StoreConversationInput,
  userId: string
): Promise<ArchitectConversation> {
  // Generate embedding for conversation content
  const embedding = await generateEmbedding(conversation.content, userId);

  // Store in database with embedding
  const result = await drizzleDb.transaction(async (tx) => {
    const [stored] = await tx
      .insert(architectConversations)
      .values({
        sessionId: conversation.sessionId,
        role: conversation.role,
        content: conversation.content,
        mode: conversation.mode,
        category: conversation.category || null,
        embedding: JSON.stringify(embedding), // Store as JSON string
        metadata: conversation.metadata ? JSON.stringify(conversation.metadata) : null,
        timestamp: new Date(),
      })
      .returning();

    return stored;
  });

  return deserializeConversation(result);
}

// ============================================================================
// Semantic Search
// ============================================================================

/**
 * Search for similar conversations using cosine similarity
 *
 * @param query - Search query text
 * @param userId - User ID for API key retrieval
 * @param options - Search filters and limits
 * @returns Array of similar conversations with similarity scores
 */
export async function searchSimilarConversations(
  query: string,
  userId: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    sessionId,
    category,
    similarityThreshold = 0.7,
    limit = 10,
  } = options;

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query, userId);
  const queryEmbeddingStr = `[${queryEmbedding.join(',')}]`;

  // Build WHERE conditions
  const conditions: any[] = [];
  if (sessionId) {
    conditions.push(sql`${architectConversations.sessionId} = ${sessionId}`);
  }
  if (category) {
    conditions.push(sql`${architectConversations.category} = ${category}`);
  }

  // Build SQL query with vector similarity
  const whereClause = conditions.length > 0
    ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
    : sql``;

  const query_sql = sql`
    SELECT
      id,
      session_id as "sessionId",
      role,
      content,
      category,
      timestamp,
      1 - (embedding::vector <=> ${queryEmbeddingStr}::vector) as similarity
    FROM ${architectConversations}
    ${whereClause}
    ${conditions.length > 0 ? sql`AND` : sql`WHERE`} 1 - (embedding::vector <=> ${queryEmbeddingStr}::vector) > ${similarityThreshold}
    ORDER BY embedding::vector <=> ${queryEmbeddingStr}::vector
    LIMIT ${limit}
  `;

  const results = await drizzleDb.transaction(async (tx) => {
    return await tx.execute(query_sql);
  });

  return results as SearchResult[];
}

// ============================================================================
// Load Session Context
// ============================================================================

/**
 * Load recent conversations for a session
 *
 * @param sessionId - Session ID
 * @param options - Load options (category filter, limit)
 * @returns Array of conversations ordered by timestamp
 */
export async function loadSessionContext(
  sessionId: string,
  options: LoadContextOptions = {}
): Promise<ArchitectConversation[]> {
  const { category, limit = 20 } = options;

  const conditions = [eq(architectConversations.sessionId, sessionId)];
  if (category) {
    conditions.push(eq(architectConversations.category, category));
  }

  const conversations = await drizzleDb.transaction(async (tx) => {
    return await tx
      .select()
      .from(architectConversations)
      .where(and(...conditions))
      .orderBy(desc(architectConversations.timestamp))
      .limit(limit);
  });

  return conversations.map(deserializeConversation);
}

// ============================================================================
// Store Decision
// ============================================================================

/**
 * Store architectural decision
 *
 * @param decision - Decision data
 * @returns Stored decision with ID
 */
export async function storeDecision(
  decision: StoreDecisionInput
): Promise<ArchitectDecision> {
  // Validate confidence
  if (decision.confidence !== undefined) {
    if (decision.confidence < 0 || decision.confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }
  }

  const result = await drizzleDb.transaction(async (tx) => {
    const [stored] = await tx
      .insert(architectDecisions)
      .values({
        sessionId: decision.sessionId,
        category: decision.category,
        decision: decision.decision,
        rationale: decision.rationale || null,
        confidence: decision.confidence || 0,
        alternatives: decision.alternatives ? JSON.stringify(decision.alternatives) : null,
        timestamp: new Date(),
      })
      .returning();

    return stored;
  });

  return deserializeDecision(result);
}

// ============================================================================
// Get Decisions by Category
// ============================================================================

/**
 * Retrieve all decisions for a category
 *
 * @param sessionId - Session ID
 * @param category - Category name
 * @returns Array of decisions ordered by timestamp (newest first)
 */
export async function getDecisionsByCategory(
  sessionId: string,
  category: string
): Promise<ArchitectDecision[]> {
  const decisions = await drizzleDb.transaction(async (tx) => {
    return await tx
      .select()
      .from(architectDecisions)
      .where(
        and(
          eq(architectDecisions.sessionId, sessionId),
          eq(architectDecisions.category, category)
        )
      )
      .orderBy(desc(architectDecisions.timestamp));
  });

  return decisions.map(deserializeDecision);
}

// ============================================================================
// Deserialization Helpers
// ============================================================================

/**
 * Deserialize conversation (parse JSON fields)
 */
function deserializeConversation(conv: any): ArchitectConversation {
  return {
    ...conv,
    metadata: conv.metadata ? JSON.parse(conv.metadata) : null,
    embedding: conv.embedding ? JSON.parse(conv.embedding) : null,
  } as ArchitectConversation;
}

/**
 * Deserialize decision (parse JSON fields)
 */
function deserializeDecision(dec: any): ArchitectDecision {
  return {
    ...dec,
    alternatives: dec.alternatives ? JSON.parse(dec.alternatives) : null,
  } as ArchitectDecision;
}
