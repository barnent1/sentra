import { EventEmitter } from 'events';
import { CronJob } from 'cron';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { RedisManager } from '../utils/redis';
import { MetricsCollector } from '../utils/metrics';

export interface DocumentationSource {
  name: string;
  url: string;
  version: string;
  selectors: {
    content: string;
    title: string;
    navigation: string;
    codeBlocks: string;
  };
  patterns: {
    apiRoutes: RegExp[];
    components: RegExp[];
    hooks: RegExp[];
    utilities: RegExp[];
  };
}

export interface DocumentationEntry {
  id: string;
  source: string;
  version: string;
  url: string;
  title: string;
  content: string;
  codeExamples: string[];
  patterns: string[];
  tags: string[];
  lastUpdated: Date;
  checksum: string;
}

export interface PatternExtraction {
  apiRoutes: string[];
  components: string[];
  hooks: string[];
  utilities: string[];
  bestPractices: string[];
  codePatterns: string[];
}

export class DocumentationCacheService extends EventEmitter {
  private refreshJob: CronJob | null = null;
  private sources: DocumentationSource[] = [];
  private isRefreshing = false;

  constructor() {
    super();
    this.initializeSources();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Documentation Cache Service...');

    try {
      // Start scheduled refresh
      this.startScheduledRefresh();

      // Perform initial refresh if cache is empty
      await this.performInitialRefresh();

      logger.info('Documentation Cache Service initialized');
    } catch (error) {
      logger.error('Failed to initialize Documentation Cache Service:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Documentation Cache Service...');

    if (this.refreshJob) {
      this.refreshJob.stop();
      this.refreshJob = null;
    }

    logger.info('Documentation Cache Service shutdown complete');
  }

  private initializeSources(): void {
    this.sources = [
      {
        name: 'nextjs',
        url: config.documentation.sources.nextjs,
        version: 'latest',
        selectors: {
          content: '.main-content, .content, article',
          title: 'h1, .title',
          navigation: '.nav, .sidebar',
          codeBlocks: 'pre code, .code-block',
        },
        patterns: {
          apiRoutes: [
            /export\s+(default\s+)?async?\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g,
            /app\/api\/.*\.ts/g,
            /pages\/api\/.*\.ts/g,
          ],
          components: [
            /export\s+(default\s+)?function\s+[A-Z][a-zA-Z0-9]*\s*\(/g,
            /const\s+[A-Z][a-zA-Z0-9]*\s*[:=]\s*\(/g,
          ],
          hooks: [
            /use[A-Z][a-zA-Z0-9]*/g,
            /export\s+function\s+use[A-Z][a-zA-Z0-9]*/g,
          ],
          utilities: [
            /export\s+(const|function)\s+[a-z][a-zA-Z0-9]*/g,
          ],
        },
      },
      {
        name: 'react',
        url: config.documentation.sources.react,
        version: 'latest',
        selectors: {
          content: '.main-content, .content, article',
          title: 'h1, .title',
          navigation: '.nav, .sidebar',
          codeBlocks: 'pre code, .code-block',
        },
        patterns: {
          apiRoutes: [],
          components: [
            /function\s+[A-Z][a-zA-Z0-9]*\s*\(/g,
            /const\s+[A-Z][a-zA-Z0-9]*\s*[:=]\s*\(/g,
            /React\.Component/g,
          ],
          hooks: [
            /use[A-Z][a-zA-Z0-9]*/g,
            /React\.use[A-Z][a-zA-Z0-9]*/g,
          ],
          utilities: [
            /React\.[a-z][a-zA-Z0-9]*/g,
          ],
        },
      },
      {
        name: 'typescript',
        url: config.documentation.sources.typescript,
        version: 'latest',
        selectors: {
          content: '.main-content, .content, article',
          title: 'h1, .title',
          navigation: '.nav, .sidebar',
          codeBlocks: 'pre code, .code-block',
        },
        patterns: {
          apiRoutes: [],
          components: [
            /interface\s+[A-Z][a-zA-Z0-9]*/g,
            /type\s+[A-Z][a-zA-Z0-9]*\s*=/g,
            /class\s+[A-Z][a-zA-Z0-9]*/g,
          ],
          hooks: [],
          utilities: [
            /export\s+(const|function|interface|type)\s+[a-z][a-zA-Z0-9]*/g,
          ],
        },
      },
      {
        name: 'drizzle',
        url: config.documentation.sources.drizzle,
        version: 'latest',
        selectors: {
          content: '.main-content, .content, article',
          title: 'h1, .title',
          navigation: '.nav, .sidebar',
          codeBlocks: 'pre code, .code-block',
        },
        patterns: {
          apiRoutes: [],
          components: [],
          hooks: [],
          utilities: [
            /drizzle\([^)]*\)/g,
            /\.select\(\)/g,
            /\.insert\(\)/g,
            /\.update\(\)/g,
            /\.delete\(\)/g,
            /eq\(/g,
            /and\(/g,
            /or\(/g,
          ],
        },
      },
    ];
  }

  private startScheduledRefresh(): void {
    // Run daily at 2 AM
    this.refreshJob = new CronJob(
      '0 2 * * *',
      async () => {
        try {
          await this.refreshAllDocumentation();
        } catch (error) {
          logger.error('Scheduled documentation refresh failed:', error);
        }
      },
      null,
      true,
      'UTC'
    );

    logger.info(`Documentation refresh scheduled for every ${config.documentation.refreshIntervalHours} hours`);
  }

  private async performInitialRefresh(): Promise<void> {
    try {
      // Check if we have cached documentation
      let hasCache = false;
      for (const source of this.sources) {
        const cached = await RedisManager.getDocumentationIndex(source.name);
        if (cached) {
          hasCache = true;
          break;
        }
      }

      if (!hasCache) {
        logger.info('No cached documentation found, performing initial refresh...');
        await this.refreshAllDocumentation();
      }
    } catch (error) {
      logger.error('Initial documentation refresh failed:', error);
    }
  }

  async refreshAllDocumentation(): Promise<void> {
    if (this.isRefreshing) {
      logger.info('Documentation refresh already in progress');
      return;
    }

    this.isRefreshing = true;
    const startTime = Date.now();

    try {
      logger.info('Starting documentation refresh for all sources');

      const refreshPromises = this.sources.map(source =>
        this.refreshDocumentationSource(source).catch(error => {
          logger.error(`Failed to refresh documentation for ${source.name}:`, error);
          return null;
        })
      );

      const results = await Promise.all(refreshPromises);
      const successCount = results.filter(result => result !== null).length;

      const duration = Date.now() - startTime;
      logger.info(`Documentation refresh completed: ${successCount}/${this.sources.length} sources updated in ${duration}ms`);

      this.emit('refresh_completed', { successCount, totalSources: this.sources.length, duration });

    } finally {
      this.isRefreshing = false;
    }
  }

  private async refreshDocumentationSource(source: DocumentationSource): Promise<void> {
    logger.info(`Refreshing documentation for ${source.name}`);

    try {
      // Fetch main documentation page
      const response = await axios.get(source.url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'SENTRA Documentation Bot/1.0',
        },
      });

      const $ = cheerio.load(response.data);

      // Extract navigation links
      const links = new Set<string>();
      $(source.selectors.navigation).find('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const fullUrl = new URL(href, source.url).toString();
          links.add(fullUrl);
        }
      });

      // Process each documentation page
      const entries: DocumentationEntry[] = [];
      const maxPages = 50; // Limit to prevent overwhelming
      let processedCount = 0;

      for (const link of Array.from(links).slice(0, maxPages)) {
        try {
          const entry = await this.processDocumentationPage(source, link);
          if (entry) {
            entries.push(entry);
            processedCount++;
          }
        } catch (error) {
          logger.debug(`Failed to process page ${link}:`, error);
        }

        // Add small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Extract patterns from all entries
      const patterns = await this.extractPatterns(source, entries);

      // Cache the documentation
      await this.cacheDocumentation(source, entries, patterns);

      // Update metrics
      MetricsCollector.recordDocumentationCacheHit(source.name);

      logger.info(`Successfully refreshed ${source.name}: ${processedCount} pages processed`);

    } catch (error) {
      MetricsCollector.recordDocumentationCacheMiss(source.name);
      logger.error(`Failed to refresh documentation for ${source.name}:`, error);
      throw error;
    }
  }

  private async processDocumentationPage(source: DocumentationSource, url: string): Promise<DocumentationEntry | null> {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'SENTRA Documentation Bot/1.0',
        },
      });

      const $ = cheerio.load(response.data);

      // Extract content
      const title = $(source.selectors.title).first().text().trim();
      const content = $(source.selectors.content).text().trim();

      if (!title || !content || content.length < 100) {
        return null; // Skip pages with insufficient content
      }

      // Extract code examples
      const codeExamples: string[] = [];
      $(source.selectors.codeBlocks).each((_, element) => {
        const code = $(element).text().trim();
        if (code && code.length > 10) {
          codeExamples.push(code);
        }
      });

      // Generate checksum
      const checksum = require('crypto')
        .createHash('md5')
        .update(content + JSON.stringify(codeExamples))
        .digest('hex');

      const entry: DocumentationEntry = {
        id: uuidv4(),
        source: source.name,
        version: source.version,
        url,
        title,
        content,
        codeExamples,
        patterns: [],
        tags: this.extractTags(title, content),
        lastUpdated: new Date(),
        checksum,
      };

      return entry;

    } catch (error) {
      logger.debug(`Failed to process documentation page ${url}:`, error);
      return null;
    }
  }

  private async extractPatterns(source: DocumentationSource, entries: DocumentationEntry[]): Promise<PatternExtraction> {
    const patterns: PatternExtraction = {
      apiRoutes: [],
      components: [],
      hooks: [],
      utilities: [],
      bestPractices: [],
      codePatterns: [],
    };

    if (!config.documentation.enablePatternExtraction) {
      return patterns;
    }

    for (const entry of entries) {
      const allText = [entry.content, ...entry.codeExamples].join('\n');

      // Extract API routes
      for (const pattern of source.patterns.apiRoutes) {
        const matches = allText.match(pattern);
        if (matches) {
          patterns.apiRoutes.push(...matches);
        }
      }

      // Extract components
      for (const pattern of source.patterns.components) {
        const matches = allText.match(pattern);
        if (matches) {
          patterns.components.push(...matches);
        }
      }

      // Extract hooks
      for (const pattern of source.patterns.hooks) {
        const matches = allText.match(pattern);
        if (matches) {
          patterns.hooks.push(...matches);
        }
      }

      // Extract utilities
      for (const pattern of source.patterns.utilities) {
        const matches = allText.match(pattern);
        if (matches) {
          patterns.utilities.push(...matches);
        }
      }

      // Extract best practices (simple heuristic)
      const bestPracticeKeywords = ['should', 'avoid', 'recommended', 'best practice', 'tip:', 'note:'];
      for (const keyword of bestPracticeKeywords) {
        if (allText.toLowerCase().includes(keyword)) {
          const sentences = allText.split('.').filter(s => 
            s.toLowerCase().includes(keyword) && s.length > 20 && s.length < 200
          );
          patterns.bestPractices.push(...sentences.map(s => s.trim()));
        }
      }
    }

    // Remove duplicates and clean up
    patterns.apiRoutes = [...new Set(patterns.apiRoutes)].slice(0, 100);
    patterns.components = [...new Set(patterns.components)].slice(0, 100);
    patterns.hooks = [...new Set(patterns.hooks)].slice(0, 100);
    patterns.utilities = [...new Set(patterns.utilities)].slice(0, 100);
    patterns.bestPractices = [...new Set(patterns.bestPractices)].slice(0, 50);

    return patterns;
  }

  private extractTags(title: string, content: string): string[] {
    const tags: string[] = [];
    const text = (title + ' ' + content).toLowerCase();

    // Technology tags
    const techKeywords = ['react', 'nextjs', 'typescript', 'javascript', 'jsx', 'tsx', 'api', 'database', 'sql'];
    for (const keyword of techKeywords) {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    }

    // Feature tags
    const featureKeywords = ['routing', 'authentication', 'middleware', 'components', 'hooks', 'styling', 'deployment'];
    for (const keyword of featureKeywords) {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    }

    return tags.slice(0, 10); // Limit tags
  }

  private async cacheDocumentation(
    source: DocumentationSource,
    entries: DocumentationEntry[],
    patterns: PatternExtraction
  ): Promise<void> {
    try {
      // Cache individual entries
      for (const entry of entries) {
        const key = `${source.name}:${entry.id}`;
        await RedisManager.setDocumentation(source.name, key, entry);
      }

      // Cache source index
      const index = {
        source: source.name,
        version: source.version,
        entryCount: entries.length,
        patterns,
        lastUpdated: new Date(),
        entries: entries.map(e => ({
          id: e.id,
          title: e.title,
          url: e.url,
          tags: e.tags,
          checksum: e.checksum,
        })),
      };

      await RedisManager.setDocumentationIndex(source.name, index);

      logger.info(`Cached documentation for ${source.name}: ${entries.length} entries`);

    } catch (error) {
      logger.error(`Failed to cache documentation for ${source.name}:`, error);
      throw error;
    }
  }

  async getDocumentation(source: string, query?: string): Promise<DocumentationEntry[]> {
    try {
      const index = await RedisManager.getDocumentationIndex(source);
      if (!index) {
        MetricsCollector.recordDocumentationCacheMiss(source);
        return [];
      }

      MetricsCollector.recordDocumentationCacheHit(source);

      let entries = index.entries;

      // Filter by query if provided
      if (query) {
        const queryLower = query.toLowerCase();
        entries = entries.filter((entry: any) =>
          entry.title.toLowerCase().includes(queryLower) ||
          entry.tags.some((tag: string) => tag.includes(queryLower))
        );
      }

      // Get full entries for results
      const fullEntries: DocumentationEntry[] = [];
      for (const entryRef of entries.slice(0, 20)) { // Limit results
        const fullEntry = await RedisManager.getDocumentation(source, `${source}:${entryRef.id}`);
        if (fullEntry) {
          fullEntries.push(fullEntry);
        }
      }

      return fullEntries;

    } catch (error) {
      logger.error(`Failed to get documentation for ${source}:`, error);
      MetricsCollector.recordDocumentationCacheMiss(source);
      return [];
    }
  }

  async getPatterns(source: string): Promise<PatternExtraction | null> {
    try {
      const index = await RedisManager.getDocumentationIndex(source);
      return index?.patterns || null;
    } catch (error) {
      logger.error(`Failed to get patterns for ${source}:`, error);
      return null;
    }
  }

  async searchDocumentation(query: string, sources?: string[]): Promise<DocumentationEntry[]> {
    const searchSources = sources || this.sources.map(s => s.name);
    const results: DocumentationEntry[] = [];

    for (const source of searchSources) {
      try {
        const sourceResults = await this.getDocumentation(source, query);
        results.push(...sourceResults);
      } catch (error) {
        logger.debug(`Failed to search ${source} for query "${query}":`, error);
      }
    }

    // Sort by relevance (simple scoring)
    const queryLower = query.toLowerCase();
    results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, queryLower);
      const scoreB = this.calculateRelevanceScore(b, queryLower);
      return scoreB - scoreA;
    });

    return results.slice(0, 10); // Return top 10 results
  }

  private calculateRelevanceScore(entry: DocumentationEntry, query: string): number {
    let score = 0;

    // Title match
    if (entry.title.toLowerCase().includes(query)) {
      score += 10;
    }

    // Tag match
    score += entry.tags.filter(tag => tag.includes(query)).length * 5;

    // Content match (simplified)
    const contentLower = entry.content.toLowerCase();
    const matches = (contentLower.match(new RegExp(query, 'g')) || []).length;
    score += Math.min(matches, 5);

    return score;
  }

  async getCacheStatus(): Promise<{
    sources: Array<{
      name: string;
      hasCache: boolean;
      entryCount?: number;
      lastUpdated?: Date;
    }>;
    totalSize: number;
  }> {
    const sources = [];
    let totalSize = 0;

    for (const source of this.sources) {
      try {
        const index = await RedisManager.getDocumentationIndex(source.name);
        sources.push({
          name: source.name,
          hasCache: !!index,
          entryCount: index?.entryCount,
          lastUpdated: index?.lastUpdated ? new Date(index.lastUpdated) : undefined,
        });

        if (index) {
          totalSize += index.entryCount || 0;
        }
      } catch (error) {
        sources.push({
          name: source.name,
          hasCache: false,
        });
      }
    }

    return { sources, totalSize };
  }
}