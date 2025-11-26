/**
 * Embedding Service Tests
 *
 * Tests for generating text embeddings using OpenAI API.
 * API keys are retrieved from user settings (database) and decrypted.
 *
 * Coverage requirement: 90%+
 * Following TDD approach - tests written FIRST
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { generateEmbedding, batchGenerateEmbeddings } from '@/services/embeddings';
import { drizzleDb } from '@/services/database-drizzle';
import { decryptValue } from '@/services/encryption';

// Mock dependencies
vi.mock('@/services/database-drizzle', () => ({
  drizzleDb: {
    getSettingsByUserId: vi.fn(),
  },
}));

vi.mock('@/services/encryption', () => ({
  decryptValue: vi.fn(),
}));

// Mock OpenAI - will be configured per test
const mockCreate = vi.fn();
vi.mock('openai', () => {
  return {
    default: class OpenAI {
      embeddings = {
        create: mockCreate,
      };
    },
  };
});

describe('EmbeddingService', () => {
  const mockUserId = 'user_123';
  const mockApiKey = 'sk-test-key';
  const mockEncryptedKey = 'encrypted:key:data';
  const mockEmbedding = new Array(1536).fill(0).map((_, i) => i / 1536);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should retrieve API key from user settings', async () => {
      // ARRANGE: Mock user settings
      vi.mocked(drizzleDb.getSettingsByUserId).mockResolvedValue({
        id: 'settings_1',
        userId: mockUserId,
        openaiApiKey: mockEncryptedKey,
        anthropicApiKey: null,
        githubToken: null,
        githubRepoOwner: null,
        githubRepoName: null,
        voiceSettings: null,
        notificationSettings: null,
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(decryptValue).mockReturnValue(mockApiKey);

      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
        model: 'text-embedding-3-small',
        usage: { prompt_tokens: 10, total_tokens: 10 },
      });

      // ACT: Generate embedding
      const result = await generateEmbedding('test text', mockUserId);

      // ASSERT: Verify API key retrieval
      expect(drizzleDb.getSettingsByUserId).toHaveBeenCalledWith(mockUserId);
      expect(decryptValue).toHaveBeenCalledWith(mockEncryptedKey);
      expect(result).toHaveLength(1536);
    });

    it('should throw error if user has no API key configured', async () => {
      // ARRANGE: User settings with no API key
      vi.mocked(drizzleDb.getSettingsByUserId).mockResolvedValue({
        id: 'settings_1',
        userId: mockUserId,
        openaiApiKey: null,
        anthropicApiKey: null,
        githubToken: null,
        githubRepoOwner: null,
        githubRepoName: null,
        voiceSettings: null,
        notificationSettings: null,
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // ACT & ASSERT: Should throw clear error
      await expect(generateEmbedding('test text', mockUserId)).rejects.toThrow(
        'OpenAI API key not configured'
      );
    });

    it('should throw error if user settings not found', async () => {
      // ARRANGE: No user settings
      vi.mocked(drizzleDb.getSettingsByUserId).mockResolvedValue(null);

      // ACT & ASSERT: Should throw clear error
      await expect(generateEmbedding('test text', mockUserId)).rejects.toThrow(
        'User settings not found'
      );
    });

    it('should call OpenAI with correct parameters', async () => {
      // ARRANGE: Mock valid settings
      vi.mocked(drizzleDb.getSettingsByUserId).mockResolvedValue({
        id: 'settings_1',
        userId: mockUserId,
        openaiApiKey: mockEncryptedKey,
        anthropicApiKey: null,
        githubToken: null,
        githubRepoOwner: null,
        githubRepoName: null,
        voiceSettings: null,
        notificationSettings: null,
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(decryptValue).mockReturnValue(mockApiKey);

      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
        model: 'text-embedding-3-small',
        usage: { prompt_tokens: 10, total_tokens: 10 },
      });

      // ACT: Generate embedding
      await generateEmbedding('test input text', mockUserId);

      // ASSERT: Verify OpenAI call
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'test input text',
        encoding_format: 'float',
      });
    });

    it('should return embedding vector with 1536 dimensions', async () => {
      // ARRANGE
      vi.mocked(drizzleDb.getSettingsByUserId).mockResolvedValue({
        id: 'settings_1',
        userId: mockUserId,
        openaiApiKey: mockEncryptedKey,
        anthropicApiKey: null,
        githubToken: null,
        githubRepoOwner: null,
        githubRepoName: null,
        voiceSettings: null,
        notificationSettings: null,
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(decryptValue).mockReturnValue(mockApiKey);

      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
        model: 'text-embedding-3-small',
        usage: { prompt_tokens: 10, total_tokens: 10 },
      });

      // ACT
      const result = await generateEmbedding('test text', mockUserId);

      // ASSERT
      expect(result).toHaveLength(1536);
      expect(result.every((n) => typeof n === 'number')).toBe(true);
    });

    it('should handle OpenAI API errors gracefully', async () => {
      // ARRANGE: Valid settings but API error
      vi.mocked(drizzleDb.getSettingsByUserId).mockResolvedValue({
        id: 'settings_1',
        userId: mockUserId,
        openaiApiKey: mockEncryptedKey,
        anthropicApiKey: null,
        githubToken: null,
        githubRepoOwner: null,
        githubRepoName: null,
        voiceSettings: null,
        notificationSettings: null,
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(decryptValue).mockReturnValue(mockApiKey);

      mockCreate.mockRejectedValue(new Error('Rate limit exceeded'));

      // ACT & ASSERT
      await expect(generateEmbedding('test text', mockUserId)).rejects.toThrow(
        'Failed to generate embedding'
      );
    });
  });

  describe('batchGenerateEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      // ARRANGE
      vi.mocked(drizzleDb.getSettingsByUserId).mockResolvedValue({
        id: 'settings_1',
        userId: mockUserId,
        openaiApiKey: mockEncryptedKey,
        anthropicApiKey: null,
        githubToken: null,
        githubRepoOwner: null,
        githubRepoName: null,
        voiceSettings: null,
        notificationSettings: null,
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(decryptValue).mockReturnValue(mockApiKey);

      mockCreate.mockResolvedValue({
        data: [
          { embedding: mockEmbedding, index: 0 },
          { embedding: mockEmbedding, index: 1 },
          { embedding: mockEmbedding, index: 2 },
        ],
        model: 'text-embedding-3-small',
        usage: { prompt_tokens: 30, total_tokens: 30 },
      });

      // ACT
      const texts = ['text 1', 'text 2', 'text 3'];
      const result = await batchGenerateEmbeddings(texts, mockUserId);

      // ASSERT
      expect(result).toHaveLength(3);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: texts,
        encoding_format: 'float',
      });
    });

    it('should throw error if batch size exceeds 100', async () => {
      // ARRANGE: More than 100 texts
      const texts = new Array(101).fill('test');

      // ACT & ASSERT
      await expect(batchGenerateEmbeddings(texts, mockUserId)).rejects.toThrow(
        'Batch size cannot exceed 100'
      );
    });

    it('should return embeddings in same order as input', async () => {
      // ARRANGE
      vi.mocked(drizzleDb.getSettingsByUserId).mockResolvedValue({
        id: 'settings_1',
        userId: mockUserId,
        openaiApiKey: mockEncryptedKey,
        anthropicApiKey: null,
        githubToken: null,
        githubRepoOwner: null,
        githubRepoName: null,
        voiceSettings: null,
        notificationSettings: null,
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(decryptValue).mockReturnValue(mockApiKey);

      const embedding1 = new Array(1536).fill(1);
      const embedding2 = new Array(1536).fill(2);
      mockCreate.mockResolvedValue({
        data: [
          { embedding: embedding1, index: 0 },
          { embedding: embedding2, index: 1 },
        ],
        model: 'text-embedding-3-small',
        usage: { prompt_tokens: 20, total_tokens: 20 },
      });

      // ACT
      const result = await batchGenerateEmbeddings(['first', 'second'], mockUserId);

      // ASSERT
      expect(result[0]).toEqual(embedding1);
      expect(result[1]).toEqual(embedding2);
    });
  });
});
