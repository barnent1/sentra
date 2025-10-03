import { pgTable, text, timestamp, integer, boolean, vector } from 'drizzle-orm/pg-core';

export const stacks = pgTable('stacks', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull().unique(),
  version: text().notNull(),
  description: text(),
  docsUrl: text(),
  homepage: text(),
  isActive: boolean().notNull().default(true),
  metadata: text(), // JSONB stored as text for type safety
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const documentationChunks = pgTable('documentation_chunks', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  stackId: integer()
    .notNull()
    .references(() => stacks.id, { onDelete: 'cascade' }),
  content: text().notNull(),
  url: text(),
  title: text(),
  chunkIndex: integer().notNull(),
  embedding: vector({ dimensions: 1536 }), // OpenAI ada-002 embeddings
  metadata: text(), // JSONB stored as text for type safety
  createdAt: timestamp().notNull().defaultNow(),
});

export type Stack = typeof stacks.$inferSelect;
export type NewStack = typeof stacks.$inferInsert;
export type DocumentationChunk = typeof documentationChunks.$inferSelect;
export type NewDocumentationChunk = typeof documentationChunks.$inferInsert;
