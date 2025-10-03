/**
 * Pattern Learning Types
 *
 * Type definitions for pattern learning and code search operations.
 */

export interface CodeSearchResult {
  filePath: string;
  lineNumber: number;
  content: string;
  context?: string[];
  relevanceScore: number;
}

export interface DocumentationResult {
  id: number;
  stackId: number;
  stackName?: string;
  title: string | null;
  content: string;
  url: string | null;
  relevanceScore: number;
  chunkIndex: number;
}

export interface PatternSearchResult {
  type: 'code' | 'documentation';
  result: CodeSearchResult | DocumentationResult;
  relevanceScore: number;
}

export interface FindSimilarImplementationsInput {
  query: string;
  filePattern?: string;
  excludePatterns?: string[];
  maxResults?: number;
  includeContext?: boolean;
  contextLines?: number;
}

export interface FindSimilarImplementationsOutput {
  results: CodeSearchResult[];
  totalFound: number;
  query: string;
  executionTimeMs: number;
}

export interface GetRelevantDocsInput {
  query: string;
  stackNames?: string[];
  maxResults?: number;
  embedding?: number[];
  useFullTextSearch?: boolean;
}

export interface GetRelevantDocsOutput {
  results: DocumentationResult[];
  totalFound: number;
  query: string;
  searchMethod: 'vector' | 'fulltext';
  executionTimeMs: number;
}

export interface SearchByPatternInput {
  query: string;
  searchCode?: boolean;
  searchDocs?: boolean;
  filePattern?: string;
  excludePatterns?: string[];
  stackNames?: string[];
  maxResults?: number;
  embedding?: number[];
}

export interface SearchByPatternOutput {
  codeResults: CodeSearchResult[];
  docResults: DocumentationResult[];
  combinedResults: PatternSearchResult[];
  totalFound: number;
  query: string;
  executionTimeMs: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}
