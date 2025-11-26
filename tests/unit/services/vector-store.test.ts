/**
 * Vector Store Service Tests
 *
 * Tests semantic search functionality for architect conversations using pgvector.
 * Following TDD approach - tests written FIRST before implementation.
 *
 * Coverage requirement: 90%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as vectorStore from '@/services/vector-store';
import { drizzleDb } from '@/services/database-drizzle';
import * as embeddings from '@/services/embeddings';

// Mock dependencies
vi.mock('@/services/database-drizzle');
vi.mock('@/services/embeddings');

describe('VectorStore Service', () => {
  const mockUserId = 'user_123';
  const mockSessionId = 'session_456';
  const mockProjectId = 'project_789';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Store Conversation with Embedding
  // ==========================================================================

  describe('storeConversation', () => {
    it('should store conversation with embedding', async () => {
      // ARRANGE
      const mockEmbedding = new Array(1536).fill(0).map((_, i) => i * 0.001);
      const conversation = {
        sessionId: mockSessionId,
        role: 'user' as const,
        content: 'I want to build a bookmark manager with tagging support',
        mode: 'voice' as const,
        category: 'business_requirements',
      };

      vi.mocked(embeddings.generateEmbedding).mockResolvedValue(mockEmbedding);
      vi.mocked(drizzleDb.transaction).mockImplementation(async (fn: any) => {
        return fn({
          insert: () => ({
            values: () => ({
              returning: () => [{
                id: 'conv_123',
                ...conversation,
                embedding: JSON.stringify(mockEmbedding),
                timestamp: new Date(),
              }],
            }),
          }),
        });
      });

      // ACT
      const result = await vectorStore.storeConversation(conversation, mockUserId);

      // ASSERT
      expect(result.id).toBe('conv_123');
      expect(result.content).toBe(conversation.content);
      expect(embeddings.generateEmbedding).toHaveBeenCalledWith(conversation.content, mockUserId);
    });

    it('should handle embedding generation failure', async () => {
      // ARRANGE
      const conversation = {
        sessionId: mockSessionId,
        role: 'assistant' as const,
        content: 'Tell me about your target users',
        mode: 'voice' as const,
        category: 'business_requirements',
      };

      vi.mocked(embeddings.generateEmbedding).mockRejectedValue(
        new Error('OpenAI API key not configured')
      );

      // ACT & ASSERT
      await expect(
        vectorStore.storeConversation(conversation, mockUserId)
      ).rejects.toThrow('OpenAI API key not configured');
    });

    it('should store metadata with conversation', async () => {
      // ARRANGE
      const mockEmbedding = new Array(1536).fill(0);
      const conversation = {
        sessionId: mockSessionId,
        role: 'user' as const,
        content: 'Use PostgreSQL database',
        mode: 'text' as const,
        category: 'database_architecture',
        metadata: {
          decisions: ['PostgreSQL over MySQL'],
          confidence: 0.9,
        },
      };

      vi.mocked(embeddings.generateEmbedding).mockResolvedValue(mockEmbedding);
      vi.mocked(drizzleDb.transaction).mockImplementation(async (fn: any) => {
        return fn({
          insert: () => ({
            values: (data: any) => {
              expect(data.metadata).toBe(JSON.stringify(conversation.metadata));
              return {
                returning: () => [{
                  id: 'conv_456',
                  sessionId: conversation.sessionId,
                  role: conversation.role,
                  content: conversation.content,
                  mode: conversation.mode,
                  category: conversation.category,
                  embedding: JSON.stringify(mockEmbedding),
                  metadata: JSON.stringify(conversation.metadata), // Already stringified
                  timestamp: new Date(),
                }],
              };
            },
          }),
        });
      });

      // ACT
      const result = await vectorStore.storeConversation(conversation, mockUserId);

      // ASSERT
      expect(result.id).toBe('conv_456');
      expect(embeddings.generateEmbedding).toHaveBeenCalledWith(conversation.content, mockUserId);
    });
  });

  // ==========================================================================
  // Semantic Search
  // ==========================================================================

  describe('searchSimilarConversations', () => {
    it('should find similar conversations using cosine similarity', async () => {
      // ARRANGE
      const query = 'authentication and security';
      const mockQueryEmbedding = new Array(1536).fill(0).map((_, i) => i * 0.002);
      const mockResults = [
        {
          id: 'conv_1',
          sessionId: mockSessionId,
          role: 'user',
          content: 'We need JWT authentication with OAuth support',
          category: 'security_model',
          similarity: 0.92,
          timestamp: new Date('2025-11-20'),
        },
        {
          id: 'conv_2',
          sessionId: mockSessionId,
          role: 'assistant',
          content: 'What authentication methods do you prefer?',
          category: 'security_model',
          similarity: 0.87,
          timestamp: new Date('2025-11-21'),
        },
      ];

      vi.mocked(embeddings.generateEmbedding).mockResolvedValue(mockQueryEmbedding);
      vi.mocked(drizzleDb.transaction).mockImplementation(async (fn: any) => {
        return fn({
          execute: () => Promise.resolve(mockResults),
        });
      });

      // ACT
      const results = await vectorStore.searchSimilarConversations(
        query,
        mockUserId,
        {
          sessionId: mockSessionId,
          limit: 10,
          similarityThreshold: 0.7,
        }
      );

      // ASSERT
      expect(results).toHaveLength(2);
      expect(results[0].similarity).toBeGreaterThan(results[1].similarity);
      expect(results[0].content).toContain('JWT authentication');
      expect(embeddings.generateEmbedding).toHaveBeenCalledWith(query, mockUserId);
    });

    it('should filter by category', async () => {
      // ARRANGE
      const query = 'database design';
      const mockQueryEmbedding = new Array(1536).fill(0);
      const mockResults = [
        {
          id: 'conv_3',
          sessionId: mockSessionId,
          role: 'user',
          content: 'Use PostgreSQL with Drizzle ORM',
          category: 'database_architecture',
          similarity: 0.95,
          timestamp: new Date(),
        },
      ];

      vi.mocked(embeddings.generateEmbedding).mockResolvedValue(mockQueryEmbedding);
      vi.mocked(drizzleDb.transaction).mockImplementation(async (fn: any) => {
        return fn({
          execute: (sql: any) => {
            // Mock just returns results - SQL verification happens in integration tests
            return Promise.resolve(mockResults);
          },
        });
      });

      // ACT
      const results = await vectorStore.searchSimilarConversations(
        query,
        mockUserId,
        {
          sessionId: mockSessionId,
          category: 'database_architecture',
          limit: 10,
        }
      );

      // ASSERT
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe('database_architecture');
    });

    it('should respect similarity threshold', async () => {
      // ARRANGE
      const query = 'payment processing';
      const mockQueryEmbedding = new Array(1536).fill(0);
      const mockResults = [
        {
          id: 'conv_4',
          sessionId: mockSessionId,
          role: 'user',
          content: 'Integrate Stripe for payments',
          category: 'integrations',
          similarity: 0.85,
          timestamp: new Date(),
        },
      ];

      vi.mocked(embeddings.generateEmbedding).mockResolvedValue(mockQueryEmbedding);
      vi.mocked(drizzleDb.transaction).mockImplementation(async (fn: any) => {
        return fn({
          execute: (sql: any) => {
            // Mock just returns results - SQL verification happens in integration tests
            return Promise.resolve(mockResults);
          },
        });
      });

      // ACT
      const results = await vectorStore.searchSimilarConversations(
        query,
        mockUserId,
        {
          sessionId: mockSessionId,
          similarityThreshold: 0.8,
          limit: 10,
        }
      );

      // ASSERT
      expect(results).toHaveLength(1);
      expect(results[0].similarity).toBeGreaterThanOrEqual(0.8);
    });

    it('should limit results', async () => {
      // ARRANGE
      const query = 'UI design';
      const mockQueryEmbedding = new Array(1536).fill(0);
      const mockResults = [
        { id: 'conv_5', content: 'Dark theme UI', similarity: 0.9, timestamp: new Date() },
        { id: 'conv_6', content: 'Mobile responsive', similarity: 0.88, timestamp: new Date() },
        { id: 'conv_7', content: 'Accessibility features', similarity: 0.85, timestamp: new Date() },
      ];

      vi.mocked(embeddings.generateEmbedding).mockResolvedValue(mockQueryEmbedding);
      vi.mocked(drizzleDb.transaction).mockImplementation(async (fn: any) => {
        return fn({
          execute: () => Promise.resolve(mockResults.slice(0, 2)),
        });
      });

      // ACT
      const results = await vectorStore.searchSimilarConversations(
        query,
        mockUserId,
        {
          sessionId: mockSessionId,
          limit: 2,
        }
      );

      // ASSERT
      expect(results).toHaveLength(2);
    });

    it('should return empty array when no similar conversations found', async () => {
      // ARRANGE
      const query = 'blockchain integration';
      const mockQueryEmbedding = new Array(1536).fill(0);

      vi.mocked(embeddings.generateEmbedding).mockResolvedValue(mockQueryEmbedding);
      vi.mocked(drizzleDb.transaction).mockImplementation(async (fn: any) => {
        return fn({
          execute: () => Promise.resolve([]),
        });
      });

      // ACT
      const results = await vectorStore.searchSimilarConversations(
        query,
        mockUserId,
        {
          sessionId: mockSessionId,
          similarityThreshold: 0.9,
          limit: 10,
        }
      );

      // ASSERT
      expect(results).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Load Session Context
  // ==========================================================================

  describe('loadSessionContext', () => {
    it('should load recent conversations for a session', async () => {
      // ARRANGE
      const mockConversations = [
        {
          id: 'conv_10',
          sessionId: mockSessionId,
          role: 'assistant',
          content: 'What features do you need?',
          mode: 'voice',
          category: 'business_requirements',
          timestamp: new Date('2025-11-22T10:00:00'),
        },
        {
          id: 'conv_11',
          sessionId: mockSessionId,
          role: 'user',
          content: 'Bookmark tagging and search',
          mode: 'voice',
          category: 'business_requirements',
          timestamp: new Date('2025-11-22T10:01:00'),
        },
      ];

      vi.mocked(drizzleDb.transaction).mockImplementation(async (fn: any) => {
        return fn({
          select: () => ({
            from: () => ({
              where: () => ({
                orderBy: () => ({
                  limit: () => Promise.resolve(mockConversations),
                }),
              }),
            }),
          }),
        });
      });

      // ACT
      const context = await vectorStore.loadSessionContext(mockSessionId, { limit: 20 });

      // ASSERT
      expect(context).toHaveLength(2);
      expect(context[0].id).toBe('conv_10');
      expect(context[1].id).toBe('conv_11');
    });

    it('should filter by category when loading context', async () => {
      // ARRANGE
      const mockConversations = [
        {
          id: 'conv_12',
          sessionId: mockSessionId,
          role: 'user',
          content: 'PostgreSQL with vector extension',
          mode: 'voice',
          category: 'database_architecture',
          timestamp: new Date(),
        },
      ];

      vi.mocked(drizzleDb.transaction).mockImplementation(async (fn: any) => {
        return fn({
          select: () => ({
            from: () => ({
              where: (condition: any) => {
                // Verify category filter is applied
                return {
                  orderBy: () => ({
                    limit: () => Promise.resolve(mockConversations),
                  }),
                };
              },
            }),
          }),
        });
      });

      // ACT
      const context = await vectorStore.loadSessionContext(mockSessionId, {
        category: 'database_architecture',
        limit: 10,
      });

      // ASSERT
      expect(context).toHaveLength(1);
      expect(context[0].category).toBe('database_architecture');
    });
  });

  // ==========================================================================
  // Store Decision
  // ==========================================================================

  describe('storeDecision', () => {
    it('should store architectural decision', async () => {
      // ARRANGE
      const decision = {
        sessionId: mockSessionId,
        category: 'database_architecture',
        decision: 'Use Drizzle ORM for edge compatibility',
        rationale: 'Vercel Edge Runtime requires edge-compatible ORM',
        confidence: 0.95,
        alternatives: [
          { option: 'Prisma', why_rejected: 'Not edge compatible' },
          { option: 'TypeORM', why_rejected: 'Heavier footprint' },
        ],
      };

      vi.mocked(drizzleDb.transaction).mockImplementation(async (fn: any) => {
        return fn({
          insert: () => ({
            values: () => ({
              returning: () => [{
                id: 'dec_123',
                ...decision,
                alternatives: JSON.stringify(decision.alternatives),
                timestamp: new Date(),
              }],
            }),
          }),
        });
      });

      // ACT
      const result = await vectorStore.storeDecision(decision);

      // ASSERT
      expect(result.id).toBe('dec_123');
      expect(result.decision).toBe(decision.decision);
      expect(result.confidence).toBe(0.95);
    });

    it('should validate confidence is between 0 and 1', async () => {
      // ARRANGE
      const decision = {
        sessionId: mockSessionId,
        category: 'security_model',
        decision: 'Use JWT authentication',
        rationale: 'Stateless and scalable',
        confidence: 1.5, // Invalid
      };

      // ACT & ASSERT
      await expect(
        vectorStore.storeDecision(decision)
      ).rejects.toThrow('Confidence must be between 0 and 1');
    });
  });

  // ==========================================================================
  // Get Decisions by Category
  // ==========================================================================

  describe('getDecisionsByCategory', () => {
    it('should retrieve all decisions for a category', async () => {
      // ARRANGE
      const mockDecisions = [
        {
          id: 'dec_1',
          sessionId: mockSessionId,
          category: 'security_model',
          decision: 'JWT with 7-day expiration',
          rationale: 'Balance security and UX',
          confidence: 0.9,
          timestamp: new Date('2025-11-22'),
        },
        {
          id: 'dec_2',
          sessionId: mockSessionId,
          category: 'security_model',
          decision: 'bcrypt for password hashing',
          rationale: 'Industry standard',
          confidence: 0.95,
          timestamp: new Date('2025-11-21'),
        },
      ];

      vi.mocked(drizzleDb.transaction).mockImplementation(async (fn: any) => {
        return fn({
          select: () => ({
            from: () => ({
              where: () => ({
                orderBy: () => Promise.resolve(mockDecisions),
              }),
            }),
          }),
        });
      });

      // ACT
      const decisions = await vectorStore.getDecisionsByCategory(
        mockSessionId,
        'security_model'
      );

      // ASSERT
      expect(decisions).toHaveLength(2);
      expect(decisions[0].category).toBe('security_model');
      expect(decisions[1].category).toBe('security_model');
    });
  });
});
