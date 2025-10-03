import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { tasks } from './tasks';

export const workflowState = pgTable('workflow_state', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer()
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  phase: text().notNull(), // 'planning' | 'development' | 'testing' | 'review'
  step: text().notNull(),
  agentId: text(),
  state: text().notNull(), // JSONB stored as text for type safety
  metadata: text(), // JSONB stored as text for type safety
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export type WorkflowState = typeof workflowState.$inferSelect;
export type NewWorkflowState = typeof workflowState.$inferInsert;
