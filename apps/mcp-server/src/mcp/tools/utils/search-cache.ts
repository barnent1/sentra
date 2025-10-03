/**
 * Search Cache Utility
 *
 * LRU cache implementation for caching search results.
 */

import type { CacheEntry, CacheStats } from '../../../types/pattern-learning.js';
import { logger } from '../../../middleware/logger.js';

export class SearchCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private ttlMs: number;
  private stats: CacheStats;

  constructor(maxSize = 100, ttlMinutes = 5) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize,
    };
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      logger.debug({ key }, 'Cache miss');
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      logger.debug({ key, age: now - entry.timestamp }, 'Cache entry expired');
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.stats.hits++;
    logger.debug({ key }, 'Cache hit');
    return entry.data;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T): void {
    // If key exists, delete it first to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // If cache is full, remove oldest entry (first in Map)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
        logger.debug({ evictedKey: firstKey }, 'Cache eviction');
      }
    }

    // Add new entry
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
    logger.debug({ key, cacheSize: this.stats.size }, 'Cache set');
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    logger.debug('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Generate cache key from query parameters
   */
  static generateKey(prefix: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }
}

// Global cache instances
// Note: Type parameters will be inferred at usage site
export const codeSearchCache = new SearchCache<unknown>(100, 5);
export const docsSearchCache = new SearchCache<unknown>(100, 5);
export const patternSearchCache = new SearchCache<unknown>(100, 5);
