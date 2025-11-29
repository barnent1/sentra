/**
 * Drizzle Database Schema
 *
 * Edge-compatible database schema for Quetrex using Drizzle ORM.
 * Manages users, projects, agents, costs, activity tracking, and prototypes.
 *
 * This schema is optimized for Vercel Edge Runtime deployment.
 */

import { pgTable, text, timestamp, integer, real, index, uniqueIndex, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ============================================================================
// Organization Tables
// ============================================================================

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  type: text('type', { enum: ['personal', 'company'] }).notNull().default('personal'),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  subscriptionTier: text('subscription_tier', { enum: ['free', 'pro', 'enterprise'] }).notNull().default('free'),
  subscriptionPrice: real('subscription_price').notNull().default(0),
  billingEmail: text('billing_email'),
  settings: text('settings'), // JSON string
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('organizations_slug_idx').on(table.slug),
}));

export const organizationMembers = pgTable('organization_members', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orgId: text('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // owner, admin, member
  invitedBy: text('invited_by').references(() => users.id, { onDelete: 'set null' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('organization_members_org_id_idx').on(table.orgId),
  userIdIdx: index('organization_members_user_id_idx').on(table.userId),
  uniqueMembership: uniqueIndex('organization_members_org_user_idx').on(table.orgId, table.userId),
}));

export const teams = pgTable('teams', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orgId: text('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('teams_org_id_idx').on(table.orgId),
}));

export const teamMembers = pgTable('team_members', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // lead, member
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  teamIdIdx: index('team_members_team_id_idx').on(table.teamId),
  userIdIdx: index('team_members_user_id_idx').on(table.userId),
  uniqueMembership: uniqueIndex('team_members_team_user_idx').on(table.teamId, table.userId),
}));

export const organizationInvitations = pgTable('organization_invitations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orgId: text('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull(), // admin, member, viewer
  invitedBy: text('invited_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'), // NULL means pending, non-NULL means accepted
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('organization_invitations_org_id_idx').on(table.orgId),
  emailIdx: index('organization_invitations_email_idx').on(table.email),
  tokenIdx: uniqueIndex('organization_invitations_token_idx').on(table.token),
}));

// ============================================================================
// Runner Table (Self-Hosted Runners)
// ============================================================================

export const runners = pgTable('runners', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId: text('org_id').references(() => organizations.id, { onDelete: 'cascade' }),

  // Runner configuration
  name: text('name').notNull(),
  provider: text('provider', { enum: ['hetzner', 'aws', 'gcp', 'azure', 'other'] }).notNull(),
  region: text('region').notNull(),
  serverType: text('server_type').notNull(), // e.g., cx22, cx32, cx42, cx52
  maxConcurrentJobs: integer('max_concurrent_jobs').notNull().default(1), // 1, 2, 4, or 8

  // Connection details (encrypted)
  ipAddress: text('ip_address'),
  sshKeyId: text('ssh_key_id'),
  apiToken: text('api_token'), // Provider API token (encrypted)

  // Status
  status: text('status', { enum: ['pending', 'provisioning', 'active', 'error', 'stopped', 'deleted'] }).notNull().default('pending'),
  lastHeartbeat: timestamp('last_heartbeat'),
  errorMessage: text('error_message'),

  // Resource usage
  cpuUsage: real('cpu_usage'),
  memoryUsage: real('memory_usage'),
  diskUsage: real('disk_usage'),

  // Metadata
  metadata: text('metadata'), // JSON string for additional config
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('runners_user_id_idx').on(table.userId),
  orgIdIdx: index('runners_org_id_idx').on(table.orgId),
  statusIdx: index('runners_status_idx').on(table.status),
}));

// Runner relations
export const runnersRelations = relations(runners, ({ one }) => ({
  user: one(users, {
    fields: [runners.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [runners.orgId],
    references: [organizations.id],
  }),
}));

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
  organizationMemberships: many(organizationMembers),
  teamMemberships: many(teamMembers),
}));

// ============================================================================
// Project Table
// ============================================================================

export const projects = pgTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  path: text('path').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId: text('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'set null' }),
  visibility: text('visibility').notNull().default('private'), // private, team, organization
  settings: text('settings'), // JSON string for project settings
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('projects_user_id_idx').on(table.userId),
  orgIdIdx: index('projects_org_id_idx').on(table.orgId),
  teamIdIdx: index('projects_team_id_idx').on(table.teamId),
}));

// Project relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [projects.orgId],
    references: [organizations.id],
  }),
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
  agents: many(agents),
  costs: many(costs),
  activities: many(activities),
  prototypes: many(prototypes),
}));

// ============================================================================
// Agent Table
// ============================================================================

export const agents = pgTable('agents', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  orgId: text('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  triggeredBy: text('triggered_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // running, completed, failed
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  logs: text('logs'), // JSON string array of log lines
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index('agents_project_id_idx').on(table.projectId),
  orgIdIdx: index('agents_org_id_idx').on(table.orgId),
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
  orgId: text('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  model: text('model').notNull(),
  provider: text('provider').notNull(), // openai, anthropic
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index('costs_project_id_idx').on(table.projectId),
  orgIdIdx: index('costs_org_id_idx').on(table.orgId),
  userIdIdx: index('costs_user_id_idx').on(table.userId),
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
  orgId: text('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // agent_started, agent_completed, agent_failed, cost_alert, etc.
  message: text('message').notNull(),
  metadata: text('metadata'), // JSON string for additional data
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index('activities_project_id_idx').on(table.projectId),
  orgIdIdx: index('activities_org_id_idx').on(table.orgId),
  userIdIdx: index('activities_user_id_idx').on(table.userId),
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
// Organization Relations
// ============================================================================

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  teams: many(teams),
  projects: many(projects),
  invitations: many(organizationInvitations),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [organizationMembers.invitedBy],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.orgId],
    references: [organizations.id],
  }),
  members: many(teamMembers),
  projects: many(projects),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const organizationInvitationsRelations = relations(organizationInvitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvitations.orgId],
    references: [organizations.id],
  }),
  inviter: one(users, {
    fields: [organizationInvitations.invitedBy],
    references: [users.id],
  }),
}));

// ============================================================================
// Architect Session Tables (Phase 3.1: Multi-Session Voice Architect)
// ============================================================================

export const architectSessions = pgTable('architect_sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Session state
  status: text('status').notNull().default('active'), // active, paused, completed
  overallProgress: real('overall_progress').notNull().default(0), // 0-100

  // Category progress (JSON): { requirements: 85, architecture: 60, ... }
  categoryProgress: text('category_progress'),

  // Blockers and gaps (JSON array)
  blockers: text('blockers'),
  gaps: text('gaps'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index('architect_sessions_project_id_idx').on(table.projectId),
  userIdIdx: index('architect_sessions_user_id_idx').on(table.userId),
  statusIdx: index('architect_sessions_status_idx').on(table.status),
}));

// Vector extension for pgvector (requires CREATE EXTENSION vector in database)
// This is a comment - actual extension creation happens in migration
// Embedding: vector(1536) for text-embedding-3-small

export const architectConversations = pgTable('architect_conversations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionId: text('session_id').notNull().references(() => architectSessions.id, { onDelete: 'cascade' }),

  // Conversation turn
  role: text('role').notNull(), // user, assistant, system
  content: text('content').notNull(),
  mode: text('mode').notNull(), // voice, text, system

  // Category this turn relates to
  category: text('category'), // requirements, architecture, data_model, etc.

  // Vector embedding for semantic search (1536 dimensions for text-embedding-3-small)
  // Note: Using text placeholder - will be cast to vector(1536) in migrations
  embedding: text('embedding'),

  // Metadata (JSON): { decisions: [], clarifications: [], ... }
  metadata: text('metadata'),

  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index('architect_conversations_session_id_idx').on(table.sessionId),
  categoryIdx: index('architect_conversations_category_idx').on(table.category),
  timestampIdx: index('architect_conversations_timestamp_idx').on(table.timestamp),
  // Vector index will be created in migration: USING hnsw (embedding vector_cosine_ops)
}));

export const architectDecisions = pgTable('architect_decisions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionId: text('session_id').notNull().references(() => architectSessions.id, { onDelete: 'cascade' }),

  // Decision details
  category: text('category').notNull(), // requirements, architecture, data_model, etc.
  decision: text('decision').notNull(),
  rationale: text('rationale'),
  confidence: real('confidence').notNull().default(0), // 0-100

  // Alternative options considered (JSON array)
  alternatives: text('alternatives'),

  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index('architect_decisions_session_id_idx').on(table.sessionId),
  categoryIdx: index('architect_decisions_category_idx').on(table.category),
}));

// Relations
export const architectSessionsRelations = relations(architectSessions, ({ one, many }) => ({
  project: one(projects, {
    fields: [architectSessions.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [architectSessions.userId],
    references: [users.id],
  }),
  conversations: many(architectConversations),
  decisions: many(architectDecisions),
}));

export const architectConversationsRelations = relations(architectConversations, ({ one }) => ({
  session: one(architectSessions, {
    fields: [architectConversations.sessionId],
    references: [architectSessions.id],
  }),
}));

export const architectDecisionsRelations = relations(architectDecisions, ({ one }) => ({
  session: one(architectSessions, {
    fields: [architectDecisions.sessionId],
    references: [architectSessions.id],
  }),
}));

// ============================================================================
// Prototype Tables (Phase 3.3: Design Generation)
// ============================================================================

/**
 * CodeFile interface for prototype code storage
 */
export interface CodeFile {
  path: string;
  content: string;
  language?: string;
}

export const prototypes = pgTable('prototypes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),

  // v0 Integration
  v0ChatId: text('v0_chat_id').notNull(),
  v0DemoUrl: text('v0_demo_url'),

  // Quetrex Hosting
  deploymentUrl: text('deployment_url').notNull(),
  deploymentStatus: text('deployment_status', {
    enum: ['pending', 'deploying', 'ready', 'error']
  }).notNull(),

  // Metadata
  title: text('title').notNull(),
  description: text('description'),
  specPath: text('spec_path'),

  // Code
  files: json('files').$type<CodeFile[]>(),

  // Iteration tracking
  version: integer('version').notNull().default(1),
  parentId: text('parent_id').references((): any => prototypes.id),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  projectIdIdx: index('prototypes_project_id_idx').on(table.projectId),
  deploymentStatusIdx: index('prototypes_deployment_status_idx').on(table.deploymentStatus),
  createdAtIdx: index('prototypes_created_at_idx').on(table.createdAt),
  parentIdIdx: index('prototypes_parent_id_idx').on(table.parentId),
  v0ChatIdIdx: index('prototypes_v0_chat_id_idx').on(table.v0ChatId),
}));

export const prototypeIterations = pgTable('prototype_iterations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  prototypeId: text('prototype_id').notNull().references(() => prototypes.id, { onDelete: 'cascade' }),

  feedback: text('feedback').notNull(),
  changesApplied: text('changes_applied').notNull(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  prototypeIdIdx: index('prototype_iterations_prototype_id_idx').on(table.prototypeId),
  createdAtIdx: index('prototype_iterations_created_at_idx').on(table.createdAt),
}));

// Prototype relations
export const prototypesRelations = relations(prototypes, ({ one, many }) => ({
  project: one(projects, {
    fields: [prototypes.projectId],
    references: [projects.id],
  }),
  parent: one(prototypes, {
    fields: [prototypes.parentId],
    references: [prototypes.id],
  }),
  iterations: many(prototypeIterations),
}));

export const prototypeIterationsRelations = relations(prototypeIterations, ({ one }) => ({
  prototype: one(prototypes, {
    fields: [prototypeIterations.prototypeId],
    references: [prototypes.id],
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

export type ArchitectSession = typeof architectSessions.$inferSelect;
export type NewArchitectSession = typeof architectSessions.$inferInsert;

export type ArchitectConversation = typeof architectConversations.$inferSelect;
export type NewArchitectConversation = typeof architectConversations.$inferInsert;

export type ArchitectDecision = typeof architectDecisions.$inferSelect;
export type NewArchitectDecision = typeof architectDecisions.$inferInsert;

export type Prototype = typeof prototypes.$inferSelect;
export type NewPrototype = typeof prototypes.$inferInsert;

export type PrototypeIteration = typeof prototypeIterations.$inferSelect;
export type NewPrototypeIteration = typeof prototypeIterations.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;
export type NewOrganizationInvitation = typeof organizationInvitations.$inferInsert;

export type Runner = typeof runners.$inferSelect;
export type NewRunner = typeof runners.$inferInsert;
