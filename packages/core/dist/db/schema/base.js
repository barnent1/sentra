/**
 * Base schema definitions for existing Sentra tables
 * These correspond to the existing PostgreSQL schema in services/api/db/schema.sql
 */
import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
// Enable UUID generation
export const uuidGenerateV4 = sql `uuid_generate_v4()`;
// Custom vector type for pgvector
export const vector = (name, config) => {
    return customType({
        dataType() {
            return config ? `vector(${config.dimensions})` : 'vector';
        },
    })(name);
};
/**
 * Projects table - existing table from base schema
 */
export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().$type().default(uuidGenerateV4),
    name: text('name').unique().notNull(),
    repoUrl: text('repo_url'),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
/**
 * Agents table - existing table from base schema
 */
export const agents = pgTable('agents', {
    id: uuid('id').primaryKey().default(uuidGenerateV4),
    name: text('name').notNull(),
    role: text('role').notNull(), // analyst, pm, dev, qa, uiux, orchestrator
    prompt: text('prompt').notNull(), // canonical persona prompt
    config: jsonb('config').$type().default({}),
    active: boolean('active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
/**
 * Tasks table - existing table from base schema
 */
export const tasks = pgTable('tasks', {
    id: uuid('id').primaryKey().$type().default(uuidGenerateV4),
    projectId: uuid('project_id').$type().references(() => projects.id),
    title: text('title').notNull(),
    spec: text('spec').notNull(),
    status: text('status').notNull().default('queued'), // queued|running|waiting_approval|blocked|done|failed
    assignedAgent: uuid('assigned_agent').references(() => agents.id),
    parentTaskId: uuid('parent_task_id').$type(),
    priority: integer('priority').default(1), // 1=high, 5=low
    metadata: jsonb('metadata').$type().default({}),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
/**
 * Approvals table - existing table from base schema
 */
export const approvals = pgTable('approvals', {
    id: uuid('id').primaryKey().default(uuidGenerateV4),
    projectId: uuid('project_id').$type().references(() => projects.id),
    machineId: text('machine_id').notNull(),
    tmuxTarget: text('tmux_target'), // e.g. "dev:ProjectA.1"
    command: text('command').notNull(),
    riskLevel: text('risk_level').default('medium'), // low|medium|high|critical
    status: text('status').notNull().default('pending'), // pending|approved|rejected|expired|completed
    decisionReason: text('decision_reason'),
    createdAt: timestamp('created_at').defaultNow(),
    decidedAt: timestamp('decided_at'),
    expiresAt: timestamp('expires_at').default(sql `now() + interval '1 hour'`),
});
/**
 * Events table - existing table from base schema
 */
export const events = pgTable('events', {
    id: uuid('id').primaryKey().default(uuidGenerateV4),
    projectId: uuid('project_id').$type().references(() => projects.id),
    agentId: uuid('agent_id').references(() => agents.id),
    taskId: uuid('task_id').$type().references(() => tasks.id),
    approvalId: uuid('approval_id').references(() => approvals.id),
    eventType: text('event_type').notNull(), // task_started, approval_requested, command_executed, etc.
    eventData: jsonb('event_data').$type().default({}),
    machineId: text('machine_id'),
    createdAt: timestamp('created_at').defaultNow(),
});
/**
 * Memory items table - existing table from base schema with vector embeddings
 */
export const memoryItems = pgTable('memory_items', {
    id: uuid('id').primaryKey().default(uuidGenerateV4),
    projectId: uuid('project_id').$type().references(() => projects.id),
    taskId: uuid('task_id').$type().references(() => tasks.id),
    kind: text('kind').notNull(), // doc, code, note, decision, log, artifact
    title: text('title').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }), // text-embedding-3-small
    metadata: jsonb('metadata').$type().default({}),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
/**
 * Sub-agents table - existing table from base schema
 */
export const subagents = pgTable('subagents', {
    id: uuid('id').primaryKey().default(uuidGenerateV4),
    agentId: uuid('agent_id').references(() => agents.id),
    taskId: uuid('task_id').$type().references(() => tasks.id),
    machineId: text('machine_id').notNull(),
    tmuxTarget: text('tmux_target').notNull(), // where the subagent is running
    status: text('status').default('active'), // active|idle|terminated
    contextSummary: text('context_summary'), // brief context for the subagent
    createdAt: timestamp('created_at').defaultNow(),
    lastSeen: timestamp('last_seen').defaultNow(),
});
//# sourceMappingURL=base.js.map