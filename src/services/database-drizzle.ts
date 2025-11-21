/**
 * Drizzle Database Service
 *
 * Edge-compatible database service layer using Drizzle ORM.
 * Provides CRUD operations for all database models with the same API as Prisma service.
 *
 * Features:
 * - Vercel Edge Runtime compatible
 * - Type-safe database operations
 * - Transaction support
 * - Bulk operations for performance
 * - Proper error handling
 * - Matches Prisma DatabaseService API exactly
 *
 * Usage:
 *   const db = DrizzleDatabaseService.getInstance();
 *   const user = await db().createUser({ email: 'test@example.com', password: 'hashed' });
 */

import { eq, desc, and, sql, gte, lte, sum } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import {
  users,
  projects,
  agents,
  costs,
  activities,
  userSettings,
  type User,
  type Project,
  type Agent,
  type Cost,
  type Activity,
  type UserSettings,
} from '../db/schema';

// Lazy database initialization
let _db: ReturnType<typeof drizzle> | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (_db) {
    return _db;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create postgres-js client (works with Supabase)
  _sql = postgres(databaseUrl, {
    max: 10, // Connection pool size
    idle_timeout: 20,
    connect_timeout: 10,
  });

  _db = drizzle(_sql, { schema });
  return _db;
}

// Helper to get database instance
const db = () => getDb();

export type Database = ReturnType<typeof drizzle>;

// ============================================================================
// Type Exports
// ============================================================================

export type { User, Project, Agent, Cost, Activity, UserSettings };

// ============================================================================
// Input Types (matching Prisma service)
// ============================================================================

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
}

export interface CreateProjectInput {
  name: string;
  path: string;
  userId: string;
  settings?: Record<string, unknown>;
}

export interface UpdateProjectInput {
  name?: string;
  path?: string;
  settings?: Record<string, unknown>;
}

export interface CreateAgentInput {
  projectId: string;
  status: AgentStatus;
  endTime?: Date;
  logs?: string[];
  error?: string | null;
}

export interface UpdateAgentInput {
  status?: AgentStatus;
  endTime?: Date;
  logs?: string[];
  error?: string | null;
}

export interface CreateCostInput {
  projectId: string;
  amount: number;
  model: string;
  provider: 'openai' | 'anthropic';
  inputTokens?: number;
  outputTokens?: number;
}

export interface CreateActivityInput {
  projectId: string;
  type: ActivityType;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSettingsInput {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  githubToken?: string;
  githubRepoOwner?: string;
  githubRepoName?: string;
  voiceSettings?: Record<string, unknown>;
  notificationSettings?: Record<string, unknown>;
  language?: string;
}

// ============================================================================
// Enums
// ============================================================================

export type AgentStatus = 'running' | 'completed' | 'failed';

export type ActivityType =
  | 'agent_started'
  | 'agent_completed'
  | 'agent_failed'
  | 'cost_alert'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted';

const VALID_AGENT_STATUSES: AgentStatus[] = ['running', 'completed', 'failed'];
const VALID_ACTIVITY_TYPES: ActivityType[] = [
  'agent_started',
  'agent_completed',
  'agent_failed',
  'cost_alert',
  'project_created',
  'project_updated',
  'project_deleted',
];

// ============================================================================
// Query Options
// ============================================================================

export interface GetProjectOptions {
  includeUser?: boolean;
  includeAgents?: boolean;
  includeCosts?: boolean;
  includeActivities?: boolean;
}

export interface GetAgentOptions {
  includeProject?: boolean;
}

export interface GetActivitiesOptions {
  limit?: number;
  offset?: number;
}

// ============================================================================
// Extended Types with Relations
// ============================================================================

export type ProjectWithRelations = Project & {
  user?: User;
  agents?: Agent[];
  costs?: Cost[];
  activities?: Activity[];
};

export type AgentWithRelations = Agent & {
  project?: Project;
};

export type ActivityWithRelations = Activity & {
  project?: Project;
};

// ============================================================================
// Database Service Class
// ============================================================================

export class DrizzleDatabaseService {
  private static instance: DrizzleDatabaseService | null = null;
  private isConnected = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  // --------------------------------------------------------------------------
  // Singleton Pattern
  // --------------------------------------------------------------------------

  static getInstance(): DrizzleDatabaseService {
    if (!DrizzleDatabaseService.instance) {
      DrizzleDatabaseService.instance = new DrizzleDatabaseService();
    }
    return DrizzleDatabaseService.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    DrizzleDatabaseService.instance = null;
  }

  // --------------------------------------------------------------------------
  // Connection Management
  // --------------------------------------------------------------------------

  async connect(): Promise<void> {
    // Edge runtime doesn't require explicit connection
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    // Edge runtime doesn't require explicit disconnection
    this.isConnected = false;
  }

  // --------------------------------------------------------------------------
  // User Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new user
   * @throws Error if email format is invalid or user already exists
   */
  async createUser(input: CreateUserInput): Promise<User> {
    this.validateEmail(input.email);

    try {
      const [user] = await db()
        .insert(users)
        .values({
          email: input.email.toLowerCase(),
          password: input.password,
          name: input.name || null,
        })
        .returning();

      return user;
    } catch (error: any) {
      // Handle unique constraint violation (duplicate email)
      if (error.code === '23505') {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const [user] = await db().select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db()
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return user || null;
  }

  /**
   * List all users (ordered by creation date)
   */
  async listUsers(): Promise<User[]> {
    return await db().select().from(users).orderBy(desc(users.createdAt));
  }

  /**
   * Update user refresh token
   */
  async updateUserRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await db().update(users).set({ refreshToken }).where(eq(users.id, userId));
  }

  // --------------------------------------------------------------------------
  // Project Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new project
   * @throws Error if user not found
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    try {
      const [project] = await db()
        .insert(projects)
        .values({
          name: input.name,
          path: input.path,
          userId: input.userId,
          settings: input.settings ? JSON.stringify(input.settings) : null,
        })
        .returning();

      return this.deserializeProject(project);
    } catch (error: any) {
      // Handle foreign key constraint violation (user not found)
      if (error.code === '23503') {
        throw new Error('User not found');
      }
      throw error;
    }
  }

  /**
   * Get project by ID with optional relations
   */
  async getProjectById(
    id: string,
    options: GetProjectOptions = {}
  ): Promise<ProjectWithRelations | null> {
    // Base project query
    const [project] = await db().select().from(projects).where(eq(projects.id, id)).limit(1);

    if (!project) {
      return null;
    }

    const result: ProjectWithRelations = this.deserializeProject(project);

    // Load relations if requested
    if (options.includeUser) {
      const [user] = await db().select().from(users).where(eq(users.id, project.userId)).limit(1);
      result.user = user;
    }

    if (options.includeAgents) {
      result.agents = await db()
        .select()
        .from(agents)
        .where(eq(agents.projectId, id))
        .orderBy(desc(agents.startTime));
    }

    if (options.includeCosts) {
      result.costs = await db()
        .select()
        .from(costs)
        .where(eq(costs.projectId, id))
        .orderBy(desc(costs.timestamp));
    }

    if (options.includeActivities) {
      result.activities = await db()
        .select()
        .from(activities)
        .where(eq(activities.projectId, id))
        .orderBy(desc(activities.timestamp));
    }

    return result;
  }

  /**
   * List all projects for a user
   */
  async listProjectsByUser(userId: string): Promise<Project[]> {
    const projectList = await db()
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));

    return projectList.map((p) => this.deserializeProject(p));
  }

  /**
   * Update project
   */
  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    const updateData: Partial<typeof projects.$inferInsert> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.path !== undefined) updateData.path = input.path;
    if (input.settings !== undefined) {
      updateData.settings = JSON.stringify(input.settings);
    }

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    const [project] = await db()
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();

    return this.deserializeProject(project);
  }

  /**
   * Delete project
   * @returns true if deleted, false if not found
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      const result = await db().delete(projects).where(eq(projects.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Agent Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new agent
   */
  async createAgent(input: CreateAgentInput): Promise<Agent> {
    this.validateAgentStatus(input.status);

    const [agent] = await db()
      .insert(agents)
      .values({
        projectId: input.projectId,
        status: input.status,
        startTime: new Date(),
        endTime: input.endTime || null,
        logs: input.logs ? JSON.stringify(input.logs) : null,
        error: input.error || null,
      })
      .returning();

    return this.deserializeAgent(agent);
  }

  /**
   * Get agent by ID with optional relations
   */
  async getAgentById(id: string, options: GetAgentOptions = {}): Promise<AgentWithRelations | null> {
    const [agent] = await db().select().from(agents).where(eq(agents.id, id)).limit(1);

    if (!agent) {
      return null;
    }

    const result: AgentWithRelations = this.deserializeAgent(agent);

    if (options.includeProject) {
      const [project] = await db()
        .select()
        .from(projects)
        .where(eq(projects.id, agent.projectId))
        .limit(1);
      result.project = project ? this.deserializeProject(project) : undefined;
    }

    return result;
  }

  /**
   * List all agents for a project
   */
  async listAgentsByProject(projectId: string): Promise<Agent[]> {
    const agentList = await db()
      .select()
      .from(agents)
      .where(eq(agents.projectId, projectId))
      .orderBy(desc(agents.startTime));

    return agentList.map((a) => this.deserializeAgent(a));
  }

  /**
   * Update agent
   */
  async updateAgent(id: string, input: UpdateAgentInput): Promise<Agent> {
    if (input.status) {
      this.validateAgentStatus(input.status);
    }

    const updateData: Partial<typeof agents.$inferInsert> = {};

    if (input.status !== undefined) updateData.status = input.status;
    if (input.endTime !== undefined) updateData.endTime = input.endTime;
    if (input.logs !== undefined) updateData.logs = JSON.stringify(input.logs);
    if (input.error !== undefined) updateData.error = input.error;

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    const [agent] = await db().update(agents).set(updateData).where(eq(agents.id, id)).returning();

    return this.deserializeAgent(agent);
  }

  /**
   * Append log lines to an agent (stores as plain text)
   * @param id Agent ID
   * @param newLogs New log lines to append (string or array of strings)
   */
  async appendAgentLogs(id: string, newLogs: string | string[]): Promise<Agent> {
    // Get current agent without deserialization to get raw logs
    const [agent] = await db().select().from(agents).where(eq(agents.id, id)).limit(1);

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Get current logs as plain text (stored as JSON array currently)
    let currentLogsText = '';
    if (agent.logs) {
      try {
        // Parse if it's JSON array
        const parsed = JSON.parse(agent.logs);
        currentLogsText = Array.isArray(parsed) ? parsed.join('\n') : agent.logs;
      } catch {
        // If not JSON, treat as plain text
        currentLogsText = agent.logs;
      }
    }

    // Convert newLogs to text
    const newLogsText = Array.isArray(newLogs) ? newLogs.join('\n') : newLogs;

    // Append new logs
    const updatedLogsText = currentLogsText
      ? `${currentLogsText}\n${newLogsText}`
      : newLogsText;

    // Store as plain text (not JSON)
    const updateData: Partial<typeof agents.$inferInsert> = {
      logs: updatedLogsText,
      updatedAt: new Date(),
    };

    const [updatedAgent] = await db()
      .update(agents)
      .set(updateData)
      .where(eq(agents.id, id))
      .returning();

    return this.deserializeAgent(updatedAgent);
  }

  // --------------------------------------------------------------------------
  // Cost Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new cost entry
   */
  async createCost(input: CreateCostInput): Promise<Cost> {
    this.validatePositiveAmount(input.amount);

    const [cost] = await db()
      .insert(costs)
      .values({
        projectId: input.projectId,
        amount: input.amount,
        model: input.model,
        provider: input.provider,
        inputTokens: input.inputTokens || null,
        outputTokens: input.outputTokens || null,
        timestamp: new Date(),
      })
      .returning();

    return cost;
  }

  /**
   * Get all costs for a project
   */
  async getCostsByProject(projectId: string): Promise<Cost[]> {
    return await db()
      .select()
      .from(costs)
      .where(eq(costs.projectId, projectId))
      .orderBy(desc(costs.timestamp));
  }

  /**
   * Get total cost for a project
   */
  async getTotalCostByProject(projectId: string): Promise<number> {
    const [result] = await db()
      .select({ total: sum(costs.amount) })
      .from(costs)
      .where(eq(costs.projectId, projectId));

    return Number(result?.total || 0);
  }

  /**
   * Get costs within a time range
   */
  async getCostsByTimeRange(start: Date, end: Date): Promise<Cost[]> {
    return await db()
      .select()
      .from(costs)
      .where(and(gte(costs.timestamp, start), lte(costs.timestamp, end)))
      .orderBy(desc(costs.timestamp));
  }

  /**
   * Bulk create costs
   */
  async bulkCreateCosts(costInputs: CreateCostInput[]): Promise<void> {
    // Validate all costs first
    costInputs.forEach((cost) => this.validatePositiveAmount(cost.amount));

    await db().insert(costs).values(
      costInputs.map((cost) => ({
        projectId: cost.projectId,
        amount: cost.amount,
        model: cost.model,
        provider: cost.provider,
        inputTokens: cost.inputTokens || null,
        outputTokens: cost.outputTokens || null,
        timestamp: new Date(),
      }))
    );
  }

  // --------------------------------------------------------------------------
  // Activity Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new activity
   */
  async createActivity(input: CreateActivityInput): Promise<Activity> {
    this.validateActivityType(input.type);

    const [activity] = await db()
      .insert(activities)
      .values({
        projectId: input.projectId,
        type: input.type,
        message: input.message,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        timestamp: new Date(),
      })
      .returning();

    return this.deserializeActivity(activity);
  }

  /**
   * Get activities for a project
   */
  async getActivitiesByProject(
    projectId: string,
    options: GetActivitiesOptions = {}
  ): Promise<Activity[]> {
    let query = db()
      .select()
      .from(activities)
      .where(eq(activities.projectId, projectId))
      .orderBy(desc(activities.timestamp));

    if (options.limit) {
      query = query.limit(options.limit) as any;
    }

    if (options.offset) {
      query = query.offset(options.offset) as any;
    }

    const activityList = await query;
    return activityList.map((a) => this.deserializeActivity(a));
  }

  /**
   * Get recent activities across all user's projects
   */
  async getRecentActivities(userId: string, limit: number = 10): Promise<ActivityWithRelations[]> {
    const activityList = await db()
      .select({
        activity: activities,
        project: projects,
      })
      .from(activities)
      .innerJoin(projects, eq(activities.projectId, projects.id))
      .where(eq(projects.userId, userId))
      .orderBy(desc(activities.timestamp))
      .limit(limit);

    return activityList.map((row) => ({
      ...this.deserializeActivity(row.activity),
      project: this.deserializeProject(row.project),
    }));
  }

  /**
   * Bulk create activities
   */
  async bulkCreateActivities(activityInputs: CreateActivityInput[]): Promise<void> {
    // Validate all activities first
    activityInputs.forEach((activity) => this.validateActivityType(activity.type));

    await db().insert(activities).values(
      activityInputs.map((activity) => ({
        projectId: activity.projectId,
        type: activity.type,
        message: activity.message,
        metadata: activity.metadata ? JSON.stringify(activity.metadata) : null,
        timestamp: new Date(),
      }))
    );
  }

  // --------------------------------------------------------------------------
  // User Settings Operations
  // --------------------------------------------------------------------------

  /**
   * Get settings by user ID
   */
  async getSettingsByUserId(userId: string): Promise<UserSettings | null> {
    const [settings] = await db()
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!settings) {
      return null;
    }

    return this.deserializeUserSettings(settings);
  }

  /**
   * Upsert user settings (update if exists, insert if not)
   */
  async upsertSettings(userId: string, data: UpdateSettingsInput): Promise<UserSettings> {
    const existing = await this.getSettingsByUserId(userId);

    const settingsData: Partial<typeof userSettings.$inferInsert> = {
      userId,
    };

    // Handle encrypted fields (passed as-is, already encrypted)
    if (data.openaiApiKey !== undefined) settingsData.openaiApiKey = data.openaiApiKey;
    if (data.anthropicApiKey !== undefined) settingsData.anthropicApiKey = data.anthropicApiKey;
    if (data.githubToken !== undefined) settingsData.githubToken = data.githubToken;

    // Handle plain text fields
    if (data.githubRepoOwner !== undefined) settingsData.githubRepoOwner = data.githubRepoOwner;
    if (data.githubRepoName !== undefined) settingsData.githubRepoName = data.githubRepoName;
    if (data.language !== undefined) settingsData.language = data.language;

    // Handle JSON fields
    if (data.voiceSettings !== undefined) {
      settingsData.voiceSettings = JSON.stringify(data.voiceSettings);
    }
    if (data.notificationSettings !== undefined) {
      settingsData.notificationSettings = JSON.stringify(data.notificationSettings);
    }

    if (existing) {
      // Update existing settings
      settingsData.updatedAt = new Date();

      const [updated] = await db()
        .update(userSettings)
        .set(settingsData)
        .where(eq(userSettings.userId, userId))
        .returning();

      return this.deserializeUserSettings(updated);
    } else {
      // Insert new settings
      const [created] = await db().insert(userSettings).values(settingsData as any).returning();

      return this.deserializeUserSettings(created);
    }
  }

  // --------------------------------------------------------------------------
  // Transaction Support
  // --------------------------------------------------------------------------

  /**
   * Execute multiple operations in a transaction
   */
  async transaction<T>(
    fn: (tx: any) => Promise<T>
  ): Promise<T> {
    return await db().transaction(fn);
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  /**
   * Clear all data from database (TEST ONLY)
   */
  async clearAll(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('clearAll() is not allowed in production');
    }

    // Delete in order to respect foreign key constraints
    await db().delete(activities);
    await db().delete(costs);
    await db().delete(agents);
    await db().delete(projects);
    await db().delete(userSettings);
    await db().delete(users);
  }

  // --------------------------------------------------------------------------
  // Validation Helpers
  // --------------------------------------------------------------------------

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  private validateAgentStatus(status: string): void {
    if (!VALID_AGENT_STATUSES.includes(status as AgentStatus)) {
      throw new Error(
        `Invalid agent status: ${status}. Must be one of: ${VALID_AGENT_STATUSES.join(', ')}`
      );
    }
  }

  private validateActivityType(type: string): void {
    if (!VALID_ACTIVITY_TYPES.includes(type as ActivityType)) {
      throw new Error(
        `Invalid activity type: ${type}. Must be one of: ${VALID_ACTIVITY_TYPES.join(', ')}`
      );
    }
  }

  private validatePositiveAmount(amount: number): void {
    if (amount < 0) {
      throw new Error('Amount must be positive');
    }
  }

  // --------------------------------------------------------------------------
  // Deserialization Helpers (JSON string -> object)
  // --------------------------------------------------------------------------

  private deserializeProject(project: Project): Project {
    return {
      ...project,
      settings: project.settings ? JSON.parse(project.settings) : null,
    } as Project;
  }

  private deserializeAgent(agent: Agent): Agent {
    // Handle logs: try to parse as JSON array, fallback to plain text
    let logs: string | string[] | null = null;
    if (agent.logs) {
      try {
        const parsed = JSON.parse(agent.logs);
        logs = Array.isArray(parsed) ? parsed : agent.logs;
      } catch {
        // Not JSON, treat as plain text
        logs = agent.logs;
      }
    }

    return {
      ...agent,
      logs,
    } as Agent;
  }

  private deserializeActivity(activity: Activity): Activity {
    return {
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
    } as Activity;
  }

  private deserializeUserSettings(settings: UserSettings): UserSettings {
    return {
      ...settings,
      voiceSettings: settings.voiceSettings ? JSON.parse(settings.voiceSettings) : null,
      notificationSettings: settings.notificationSettings
        ? JSON.parse(settings.notificationSettings)
        : null,
    } as UserSettings;
  }
}

// Export singleton instance
export const drizzleDb = DrizzleDatabaseService.getInstance();
