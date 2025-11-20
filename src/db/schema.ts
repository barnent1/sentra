/**
 * Drizzle Database Schema
 *
 * Edge-compatible database schema for Sentra using Drizzle ORM.
 * Manages users, projects, agents, costs, and activity tracking.
 *
 * This schema is optimized for Vercel Edge Runtime deployment.
 */

import { pgTable, text, timestamp, integer, real, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ============================================================================
// User Table
// ============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // bcrypt hashed password
  name: text('name'),
  refreshToken: text('refresh_token'), // JWT refresh token
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User relations
export const usersRelations = relations(users, ({ many, one }) => ({
  projects: many(projects),
  settings: one(userSettings),
}));

// ============================================================================
// Project Table
// ============================================================================

export const projects = pgTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  path: text('path').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  settings: text('settings'), // JSON string for project settings
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('projects_user_id_idx').on(table.userId),
}));

// Project relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  agents: many(agents),
  costs: many(costs),
  activities: many(activities),
}));

// ============================================================================
// Agent Table
// ============================================================================

export const agents = pgTable('agents', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // running, completed, failed
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  logs: text('logs'), // JSON string array of log lines
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index('agents_project_id_idx').on(table.projectId),
  statusIdx: index('agents_status_idx').on(table.status),
}));

// Agent relations
export const agentsRelations = relations(agents, ({ one }) => ({
  project: one(projects, {
    fields: [agents.projectId],
    references: [projects.id],
  }),
}));

// ============================================================================
// Cost Table
// ============================================================================

export const costs = pgTable('costs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  model: text('model').notNull(),
  provider: text('provider').notNull(), // openai, anthropic
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index('costs_project_id_idx').on(table.projectId),
  timestampIdx: index('costs_timestamp_idx').on(table.timestamp),
  providerIdx: index('costs_provider_idx').on(table.provider),
}));

// Cost relations
export const costsRelations = relations(costs, ({ one }) => ({
  project: one(projects, {
    fields: [costs.projectId],
    references: [projects.id],
  }),
}));

// ============================================================================
// Activity Table
// ============================================================================

export const activities = pgTable('activities', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // agent_started, agent_completed, agent_failed, cost_alert, etc.
  message: text('message').notNull(),
  metadata: text('metadata'), // JSON string for additional data
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index('activities_project_id_idx').on(table.projectId),
  timestampIdx: index('activities_timestamp_idx').on(table.timestamp),
  typeIdx: index('activities_type_idx').on(table.type),
}));

// Activity relations
export const activitiesRelations = relations(activities, ({ one }) => ({
  project: one(projects, {
    fields: [activities.projectId],
    references: [projects.id],
  }),
}));

// ============================================================================
// User Settings Table
// ============================================================================

export const userSettings = pgTable('user_settings', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Encrypted API keys (stored as encrypted strings)
  openaiApiKey: text('openai_api_key'),
  anthropicApiKey: text('anthropic_api_key'),
  githubToken: text('github_token'),

  // GitHub settings
  githubRepoOwner: text('github_repo_owner'),
  githubRepoName: text('github_repo_name'),

  // Voice & UI preferences (JSON)
  voiceSettings: text('voice_settings'),  // JSON: { voiceId, speed, etc }
  notificationSettings: text('notification_settings'), // JSON: { enabled, sound, etc }
  language: text('language').default('en'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: uniqueIndex('user_settings_user_id_idx').on(table.userId),
}));

// User Settings relations
export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export type Cost = typeof costs.$inferSelect;
export type NewCost = typeof costs.$inferInsert;

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
