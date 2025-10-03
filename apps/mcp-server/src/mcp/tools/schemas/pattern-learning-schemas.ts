/**
 * Pattern Learning Validation Schemas
 *
 * Zod schemas for validating pattern learning tool inputs.
 */

import { z } from 'zod';

export const FindSimilarImplementationsSchema = z.object({
  query: z.string().min(1, 'Query must not be empty'),
  filePattern: z.string().optional(),
  excludePatterns: z.array(z.string()).optional(),
  maxResults: z.number().int().positive().max(100).optional().default(20),
  includeContext: z.boolean().optional().default(true),
  contextLines: z.number().int().min(0).max(10).optional().default(3),
});

export const GetRelevantDocsSchema = z.object({
  query: z.string().min(1, 'Query must not be empty'),
  stackNames: z.array(z.string()).optional(),
  maxResults: z.number().int().positive().max(50).optional().default(10),
  embedding: z.array(z.number()).length(1536).optional(),
  useFullTextSearch: z.boolean().optional().default(false),
});

export const SearchByPatternSchema = z.object({
  query: z.string().min(1, 'Query must not be empty'),
  searchCode: z.boolean().optional().default(true),
  searchDocs: z.boolean().optional().default(true),
  filePattern: z.string().optional(),
  excludePatterns: z.array(z.string()).optional(),
  stackNames: z.array(z.string()).optional(),
  maxResults: z.number().int().positive().max(100).optional().default(20),
  embedding: z.array(z.number()).length(1536).optional(),
});
