import { pgTable, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { stacks } from './stacks';

export const projects = pgTable('projects', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  description: text(),
  ownerId: integer()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stackId: integer().references(() => stacks.id, { onDelete: 'set null' }),
  repoPath: text(),
  mainBranch: text().notNull().default('main'),
  status: text().notNull().default('active'), // 'active' | 'archived' | 'paused'
  metadata: text(), // JSONB stored as text for type safety
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const worktrees = pgTable('worktrees', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer()
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  path: text().notNull(),
  branch: text().notNull(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Worktree = typeof worktrees.$inferSelect;
export type NewWorktree = typeof worktrees.$inferInsert;
