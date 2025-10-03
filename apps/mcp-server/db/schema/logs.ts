import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { tasks } from './tasks';

export const logs = pgTable('logs', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer().references(() => tasks.id, { onDelete: 'cascade' }),
  level: text().notNull(), // 'debug' | 'info' | 'warn' | 'error'
  message: text().notNull(),
  agentId: text(),
  metadata: text(), // JSONB stored as text for type safety
  timestamp: timestamp().notNull().defaultNow(),
});

export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;
