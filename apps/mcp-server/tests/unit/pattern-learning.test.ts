/**
 * Unit Tests: Pattern Learning
 *
 * Tests for pattern learning tools, search cache, and validation schemas.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { z } from 'zod';
import {
  FindSimilarImplementationsSchema,
  GetRelevantDocsSchema,
  SearchByPatternSchema,
} from '../../src/mcp/tools/schemas/pattern-learning-schemas.js';
import { SearchCache } from '../../src/mcp/tools/utils/search-cache.js';

describe('Pattern Learning - Validation Schemas', () => {
  describe('FindSimilarImplementationsSchema', () => {
    it('should accept valid input with all fields', () => {
      const validInput = {
        query: 'function getUserData',
        filePattern: '*.ts',
        excludePatterns: ['test', 'spec'],
        maxResults: 50,
        includeContext: true,
        contextLines: 5,
      };

      const result = FindSimilarImplementationsSchema.parse(validInput);
      expect(result.query).toBe('function getUserData');
      expect(result.filePattern).toBe('*.ts');
      expect(result.excludePatterns).toEqual(['test', 'spec']);
      expect(result.maxResults).toBe(50);
      expect(result.includeContext).toBe(true);
      expect(result.contextLines).toBe(5);
    });

    it('should accept minimal valid input', () => {
      const minimalInput = {
        query: 'search pattern',
      };

      const result = FindSimilarImplementationsSchema.parse(minimalInput);
      expect(result.query).toBe('search pattern');
      expect(result.maxResults).toBe(20); // Default
      expect(result.includeContext).toBe(true); // Default
      expect(result.contextLines).toBe(3); // Default
    });

    it('should reject empty query', () => {
      expect(() => FindSimilarImplementationsSchema.parse({ query: '' })).toThrow(z.ZodError);
    });

    it('should reject negative maxResults', () => {
      expect(() =>
        FindSimilarImplementationsSchema.parse({ query: 'test', maxResults: -1 })
      ).toThrow(z.ZodError);
    });

    it('should reject maxResults over 100', () => {
      expect(() =>
        FindSimilarImplementationsSchema.parse({ query: 'test', maxResults: 101 })
      ).toThrow(z.ZodError);
    });

    it('should reject non-integer maxResults', () => {
      expect(() =>
        FindSimilarImplementationsSchema.parse({ query: 'test', maxResults: 10.5 })
      ).toThrow(z.ZodError);
    });

    it('should reject negative contextLines', () => {
      expect(() =>
        FindSimilarImplementationsSchema.parse({ query: 'test', contextLines: -1 })
      ).toThrow(z.ZodError);
    });

    it('should reject contextLines over 10', () => {
      expect(() =>
        FindSimilarImplementationsSchema.parse({ query: 'test', contextLines: 11 })
      ).toThrow(z.ZodError);
    });

    it('should accept contextLines at boundary values', () => {
      const result1 = FindSimilarImplementationsSchema.parse({ query: 'test', contextLines: 0 });
      expect(result1.contextLines).toBe(0);

      const result2 = FindSimilarImplementationsSchema.parse({ query: 'test', contextLines: 10 });
      expect(result2.contextLines).toBe(10);
    });

    it('should accept valid excludePatterns array', () => {
      const result = FindSimilarImplementationsSchema.parse({
        query: 'test',
        excludePatterns: ['*.test.ts', '*.spec.ts', 'fixtures'],
      });
      expect(result.excludePatterns).toHaveLength(3);
    });
  });

  describe('GetRelevantDocsSchema', () => {
    it('should accept valid input with all fields', () => {
      const embedding = new Array(1536).fill(0.1);
      const validInput = {
        query: 'React hooks documentation',
        stackNames: ['react', 'typescript'],
        maxResults: 25,
        embedding,
        useFullTextSearch: false,
      };

      const result = GetRelevantDocsSchema.parse(validInput);
      expect(result.query).toBe('React hooks documentation');
      expect(result.stackNames).toEqual(['react', 'typescript']);
      expect(result.maxResults).toBe(25);
      expect(result.embedding).toHaveLength(1536);
      expect(result.useFullTextSearch).toBe(false);
    });

    it('should accept minimal valid input', () => {
      const minimalInput = {
        query: 'API documentation',
      };

      const result = GetRelevantDocsSchema.parse(minimalInput);
      expect(result.query).toBe('API documentation');
      expect(result.maxResults).toBe(10); // Default
      expect(result.useFullTextSearch).toBe(false); // Default
    });

    it('should reject empty query', () => {
      expect(() => GetRelevantDocsSchema.parse({ query: '' })).toThrow(z.ZodError);
    });

    it('should reject maxResults over 50', () => {
      expect(() =>
        GetRelevantDocsSchema.parse({ query: 'test', maxResults: 51 })
      ).toThrow(z.ZodError);
    });

    it('should reject embedding with wrong dimension', () => {
      const wrongEmbedding = new Array(768).fill(0.1); // Wrong size
      expect(() =>
        GetRelevantDocsSchema.parse({ query: 'test', embedding: wrongEmbedding })
      ).toThrow(z.ZodError);
    });

    it('should accept embedding with correct dimension (1536)', () => {
      const correctEmbedding = new Array(1536).fill(0.1);
      const result = GetRelevantDocsSchema.parse({ query: 'test', embedding: correctEmbedding });
      expect(result.embedding).toHaveLength(1536);
    });

    it('should accept empty stackNames array', () => {
      const result = GetRelevantDocsSchema.parse({ query: 'test', stackNames: [] });
      expect(result.stackNames).toEqual([]);
    });

    it('should accept multiple stack names', () => {
      const result = GetRelevantDocsSchema.parse({
        query: 'test',
        stackNames: ['react', 'vue', 'angular', 'svelte'],
      });
      expect(result.stackNames).toHaveLength(4);
    });
  });

  describe('SearchByPatternSchema', () => {
    it('should accept valid input with all fields', () => {
      const embedding = new Array(1536).fill(0.1);
      const validInput = {
        query: 'authentication pattern',
        searchCode: true,
        searchDocs: true,
        filePattern: '*.{ts,tsx}',
        excludePatterns: ['test', '__mocks__'],
        stackNames: ['passport', 'jwt'],
        maxResults: 30,
        embedding,
      };

      const result = SearchByPatternSchema.parse(validInput);
      expect(result.query).toBe('authentication pattern');
      expect(result.searchCode).toBe(true);
      expect(result.searchDocs).toBe(true);
      expect(result.filePattern).toBe('*.{ts,tsx}');
      expect(result.excludePatterns).toEqual(['test', '__mocks__']);
      expect(result.stackNames).toEqual(['passport', 'jwt']);
      expect(result.maxResults).toBe(30);
      expect(result.embedding).toHaveLength(1536);
    });

    it('should accept minimal valid input', () => {
      const minimalInput = {
        query: 'pattern',
      };

      const result = SearchByPatternSchema.parse(minimalInput);
      expect(result.query).toBe('pattern');
      expect(result.searchCode).toBe(true); // Default
      expect(result.searchDocs).toBe(true); // Default
      expect(result.maxResults).toBe(20); // Default
    });

    it('should reject empty query', () => {
      expect(() => SearchByPatternSchema.parse({ query: '' })).toThrow(z.ZodError);
    });

    it('should reject maxResults over 100', () => {
      expect(() =>
        SearchByPatternSchema.parse({ query: 'test', maxResults: 101 })
      ).toThrow(z.ZodError);
    });

    it('should accept searchCode and searchDocs as false', () => {
      const result = SearchByPatternSchema.parse({
        query: 'test',
        searchCode: false,
        searchDocs: false,
      });
      expect(result.searchCode).toBe(false);
      expect(result.searchDocs).toBe(false);
    });

    it('should reject embedding with wrong dimension', () => {
      const wrongEmbedding = new Array(512).fill(0.1);
      expect(() =>
        SearchByPatternSchema.parse({ query: 'test', embedding: wrongEmbedding })
      ).toThrow(z.ZodError);
    });
  });
});

describe('Pattern Learning - SearchCache', () => {
  describe('constructor', () => {
    it('should create cache with default values', () => {
      const cache = new SearchCache();
      const stats = cache.getStats();
      expect(stats.maxSize).toBe(100);
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should create cache with custom maxSize', () => {
      const cache = new SearchCache(50);
      const stats = cache.getStats();
      expect(stats.maxSize).toBe(50);
    });

    it('should create cache with custom TTL', () => {
      const cache = new SearchCache(100, 10); // 10 minutes
      expect(cache).toBeDefined();
    });
  });

  describe('get and set', () => {
    let cache: SearchCache<string>;

    beforeEach(() => {
      cache = new SearchCache<string>(5, 1); // Small cache, 1 minute TTL
    });

    it('should return null for non-existent key', () => {
      const result = cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should increment misses for non-existent key', () => {
      cache.get('nonexistent');
      const stats = cache.getStats();
      expect(stats.misses).toBe(1);
    });

    it('should store and retrieve value', () => {
      cache.set('key1', 'value1');
      const result = cache.get('key1');
      expect(result).toBe('value1');
    });

    it('should increment hits for successful retrieval', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
    });

    it('should update cache size after set', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });

    it('should overwrite existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      const result = cache.get('key1');
      expect(result).toBe('value2');
      const stats = cache.getStats();
      expect(stats.size).toBe(1);
    });
  });

  describe('LRU eviction', () => {
    let cache: SearchCache<string>;

    beforeEach(() => {
      cache = new SearchCache<string>(3); // Small cache for testing
    });

    it('should evict oldest entry when cache is full', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // This should evict key1

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should maintain size limit', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      const stats = cache.getStats();
      expect(stats.size).toBe(3);
    });

    it('should update LRU order on get', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Access key1 to make it most recently used
      cache.get('key1');

      // Add key4, should evict key2 (oldest)
      cache.set('key4', 'value4');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should update LRU order on set of existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Update key1 to make it most recently used
      cache.set('key1', 'value1-updated');

      // Add key4, should evict key2 (oldest)
      cache.set('key4', 'value4');

      expect(cache.get('key1')).toBe('value1-updated');
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      const cache = new SearchCache<string>(10, 0.01); // 0.01 minutes = 600ms
      cache.set('key1', 'value1');

      // Immediately should work
      expect(cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 700));

      // Should be expired
      expect(cache.get('key1')).toBeNull();
    });

    it('should increment misses for expired entries', async () => {
      const cache = new SearchCache<string>(10, 0.01);
      cache.set('key1', 'value1');
      cache.get('key1'); // Hit

      await new Promise((resolve) => setTimeout(resolve, 700));

      cache.get('key1'); // Miss (expired)
      const stats = cache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(1);
    });

    it('should remove expired entry from cache', async () => {
      const cache = new SearchCache<string>(10, 0.01);
      cache.set('key1', 'value1');

      await new Promise((resolve) => setTimeout(resolve, 700));

      cache.get('key1'); // Triggers removal
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      const cache = new SearchCache<string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });

    it('should reset size to zero', () => {
      const cache = new SearchCache<string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();

      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });

    it('should preserve hits and misses stats', () => {
      const cache = new SearchCache<string>();
      cache.set('key1', 'value1');
      cache.get('key1'); // Hit
      cache.get('nonexistent'); // Miss

      cache.clear();

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return copy of stats', () => {
      const cache = new SearchCache<string>(50);
      const stats1 = cache.getStats();
      const stats2 = cache.getStats();

      expect(stats1).toEqual(stats2);
      expect(stats1).not.toBe(stats2); // Different objects
    });

    it('should track hits and misses correctly', () => {
      const cache = new SearchCache<string>();
      cache.set('key1', 'value1');

      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      cache.get('key2'); // Miss
      cache.get('key3'); // Miss
      cache.get('key3'); // Miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(3);
    });
  });

  describe('generateKey', () => {
    it('should generate consistent key for same params', () => {
      const params = { query: 'test', maxResults: 20 };
      const key1 = SearchCache.generateKey('prefix', params);
      const key2 = SearchCache.generateKey('prefix', params);
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different params', () => {
      const params1 = { query: 'test1', maxResults: 20 };
      const params2 = { query: 'test2', maxResults: 20 };
      const key1 = SearchCache.generateKey('prefix', params1);
      const key2 = SearchCache.generateKey('prefix', params2);
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different prefixes', () => {
      const params = { query: 'test', maxResults: 20 };
      const key1 = SearchCache.generateKey('prefix1', params);
      const key2 = SearchCache.generateKey('prefix2', params);
      expect(key1).not.toBe(key2);
    });

    it('should generate same key regardless of param order', () => {
      const params1 = { query: 'test', maxResults: 20, filePattern: '*.ts' };
      const params2 = { filePattern: '*.ts', query: 'test', maxResults: 20 };
      const key1 = SearchCache.generateKey('prefix', params1);
      const key2 = SearchCache.generateKey('prefix', params2);
      expect(key1).toBe(key2);
    });

    it('should handle complex nested params', () => {
      const params = {
        query: 'test',
        excludePatterns: ['node_modules', 'dist'],
        maxResults: 20,
      };
      const key = SearchCache.generateKey('prefix', params);
      expect(key).toContain('prefix:');
      expect(key).toContain('query:"test"');
    });

    it('should handle undefined values in params', () => {
      const params = { query: 'test', optional: undefined };
      const key = SearchCache.generateKey('prefix', params);
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
    });
  });

  describe('complex data types', () => {
    it('should store and retrieve objects', () => {
      const cache = new SearchCache<{ data: string; count: number }>();
      const obj = { data: 'test', count: 42 };
      cache.set('key1', obj);
      const result = cache.get('key1');
      expect(result).toEqual(obj);
    });

    it('should store and retrieve arrays', () => {
      const cache = new SearchCache<string[]>();
      const arr = ['item1', 'item2', 'item3'];
      cache.set('key1', arr);
      const result = cache.get('key1');
      expect(result).toEqual(arr);
    });

    it('should store and retrieve null values', () => {
      const cache = new SearchCache<string | null>();
      cache.set('key1', null);
      const result = cache.get('key1');
      expect(result).toBeNull();
    });
  });
});
