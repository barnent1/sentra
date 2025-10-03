import { pgTable, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const agentPrompts = pgTable('agent_prompts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  agentName: text().notNull(),
  phase: text().notNull(),
  version: text().notNull(),
  systemPrompt: text().notNull(),
  isActive: boolean().notNull().default(true),
  metadata: text(), // JSONB stored as text for type safety
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const projectPromptOverrides = pgTable('project_prompt_overrides', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer()
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  agentName: text().notNull(),
  phase: text().notNull(),
  systemPrompt: text().notNull(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export type AgentPrompt = typeof agentPrompts.$inferSelect;
export type NewAgentPrompt = typeof agentPrompts.$inferInsert;
export type ProjectPromptOverride = typeof projectPromptOverrides.$inferSelect;
export type NewProjectPromptOverride = typeof projectPromptOverrides.$inferInsert;
