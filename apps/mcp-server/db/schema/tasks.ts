import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { users } from './users';

export const tasks = pgTable('tasks', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer()
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  description: text(),
  status: text().notNull().default('pending'), // 'pending' | 'in_progress' | 'completed' | 'failed'
  assignedTo: integer().references(() => users.id, { onDelete: 'set null' }),
  priority: integer().notNull().default(0),
  estimatedMinutes: integer(),
  actualMinutes: integer(),
  metadata: text(), // JSONB stored as text for type safety
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  completedAt: timestamp(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
