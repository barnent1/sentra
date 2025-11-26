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
  prototypes,
  prototypeIterations,
  organizations,
  organizationMembers,
  teams,
  teamMembers,
  organizationInvitations,
  architectSessions,
  type User,
  type Project,
  type Agent,
  type Cost,
  type Activity,
  type UserSettings,
  type Prototype,
  type PrototypeIteration,
  type CodeFile,
  type Organization,
  type OrganizationMember,
  type Team,
  type TeamMember,
  type OrganizationInvitation,
  type ArchitectSession,
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

export type {
  User,
  Project,
  Agent,
  Cost,
  Activity,
  UserSettings,
  Prototype,
  PrototypeIteration,
  CodeFile,
  Organization,
  OrganizationMember,
  Team,
  TeamMember,
  OrganizationInvitation,
  ArchitectSession,
};

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
  orgId: string;
  teamId?: string;
  visibility?: 'private' | 'team' | 'organization';
  settings?: Record<string, unknown>;
}

export interface UpdateProjectInput {
  name?: string;
  path?: string;
  settings?: Record<string, unknown>;
}

export interface CreateAgentInput {
  projectId: string;
  orgId: string;
  triggeredBy: string;
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
  orgId: string;
  userId: string;
  amount: number;
  model: string;
  provider: 'openai' | 'anthropic';
  inputTokens?: number;
  outputTokens?: number;
}

export interface CreateActivityInput {
  projectId: string;
  orgId: string;
  userId: string;
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

export interface CreatePrototypeInput {
  projectId: string;
  v0ChatId: string;
  v0DemoUrl?: string;
  deploymentUrl: string;
  deploymentStatus: 'pending' | 'deploying' | 'ready' | 'error';
  title: string;
  description?: string;
  specPath?: string;
  files?: CodeFile[];
  version?: number;
  parentId?: string;
}

export interface UpdatePrototypeInput {
  deploymentStatus?: 'pending' | 'deploying' | 'ready' | 'error';
  files?: CodeFile[];
  version?: number;
}

export interface CreatePrototypeIterationInput {
  prototypeId: string;
  feedback: string;
  changesApplied: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  description?: string;
}

export interface AddOrganizationMemberInput {
  orgId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  invitedBy?: string;
}

export interface CreateTeamInput {
  orgId: string;
  name: string;
  description?: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
}

export interface AddTeamMemberInput {
  teamId: string;
  userId: string;
  role: 'lead' | 'member';
}

export interface CreateInvitationInput {
  orgId: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  token: string;
  expiresAt: Date;
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

  /**
   * Clear all data from database (for testing only)
   * WARNING: This deletes all data - use only in test environments
   */
  async clearDatabase(): Promise<void> {
    // Delete in order to respect foreign key constraints
    await db().delete(prototypeIterations);
    await db().delete(prototypes);
    await db().delete(activities);
    await db().delete(costs);
    await db().delete(agents);
    await db().delete(userSettings);
    await db().delete(projects);
    await db().delete(organizationInvitations);
    await db().delete(teamMembers);
    await db().delete(teams);
    await db().delete(organizationMembers);
    await db().delete(organizations);
    await db().delete(users);
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
   * Note: Password field is excluded for security
   */
  async listUsers(): Promise<Omit<User, 'password'>[]> {
    return await db()
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        refreshToken: users.refreshToken,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
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
          orgId: input.orgId,
          teamId: input.teamId || null,
          visibility: input.visibility || 'private',
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
        orgId: input.orgId,
        triggeredBy: input.triggeredBy,
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
        orgId: input.orgId,
        userId: input.userId,
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
        orgId: cost.orgId,
        userId: cost.userId,
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
        orgId: input.orgId,
        userId: input.userId,
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
        orgId: activity.orgId,
        userId: activity.userId,
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
  // Architect Session Operations
  // --------------------------------------------------------------------------

  /**
   * Get architect sessions by user ID, optionally filtered by project
   */
  async getArchitectSessionsByUser(
    userId: string,
    projectId?: string
  ): Promise<ArchitectSession[]> {
    const conditions = [eq(architectSessions.userId, userId)];
    if (projectId) {
      conditions.push(eq(architectSessions.projectId, projectId));
    }

    const sessions = await db()
      .select()
      .from(architectSessions)
      .where(and(...conditions))
      .orderBy(desc(architectSessions.lastActiveAt));

    return sessions.map((session) => this.deserializeArchitectSession(session));
  }

  /**
   * Get architect session by ID
   */
  async getArchitectSessionById(id: string): Promise<ArchitectSession | null> {
    const [session] = await db()
      .select()
      .from(architectSessions)
      .where(eq(architectSessions.id, id))
      .limit(1);

    return session ? this.deserializeArchitectSession(session) : null;
  }

  /**
   * Deserialize architect session (parse JSON fields)
   */
  private deserializeArchitectSession(session: ArchitectSession): ArchitectSession {
    return {
      ...session,
      categoryProgress: session.categoryProgress,
      blockers: session.blockers,
      gaps: session.gaps,
    } as ArchitectSession;
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
    await db().delete(prototypeIterations);
    await db().delete(prototypes);
    await db().delete(activities);
    await db().delete(costs);
    await db().delete(agents);
    await db().delete(projects);
    await db().delete(userSettings);
    await db().delete(organizationInvitations);
    await db().delete(teamMembers);
    await db().delete(teams);
    await db().delete(organizationMembers);
    await db().delete(organizations);
    await db().delete(users);
  }

  // --------------------------------------------------------------------------
  // Prototype Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new prototype
   */
  async createPrototype(input: CreatePrototypeInput): Promise<Prototype> {
    const [prototype] = await db()
      .insert(prototypes)
      .values({
        projectId: input.projectId,
        v0ChatId: input.v0ChatId,
        v0DemoUrl: input.v0DemoUrl || null,
        deploymentUrl: input.deploymentUrl,
        deploymentStatus: input.deploymentStatus,
        title: input.title,
        description: input.description || null,
        specPath: input.specPath || null,
        files: input.files as any || null,
        version: input.version || 1,
        parentId: input.parentId || null,
      })
      .returning();

    return prototype;
  }

  /**
   * Get prototype by ID
   */
  async getPrototypeById(id: string): Promise<Prototype | null> {
    const [prototype] = await db()
      .select()
      .from(prototypes)
      .where(eq(prototypes.id, id))
      .limit(1);

    return prototype || null;
  }

  /**
   * List prototypes by project
   */
  async listPrototypesByProject(projectId: string): Promise<Prototype[]> {
    return await db()
      .select()
      .from(prototypes)
      .where(eq(prototypes.projectId, projectId))
      .orderBy(desc(prototypes.createdAt));
  }

  /**
   * Update prototype
   */
  async updatePrototype(id: string, input: UpdatePrototypeInput): Promise<Prototype> {
    const updateData: Partial<typeof prototypes.$inferInsert> = {};

    if (input.deploymentStatus !== undefined) {
      updateData.deploymentStatus = input.deploymentStatus;
    }
    if (input.files !== undefined) {
      updateData.files = input.files as any;
    }
    if (input.version !== undefined) {
      updateData.version = input.version;
    }

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    const [prototype] = await db()
      .update(prototypes)
      .set(updateData)
      .where(eq(prototypes.id, id))
      .returning();

    return prototype;
  }

  /**
   * Delete prototype
   */
  async deletePrototype(id: string): Promise<boolean> {
    try {
      const result = await db()
        .delete(prototypes)
        .where(eq(prototypes.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Prototype Iteration Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new prototype iteration
   */
  async createPrototypeIteration(input: CreatePrototypeIterationInput): Promise<PrototypeIteration> {
    const [iteration] = await db()
      .insert(prototypeIterations)
      .values({
        prototypeId: input.prototypeId,
        feedback: input.feedback,
        changesApplied: input.changesApplied,
      })
      .returning();

    return iteration;
  }

  /**
   * Get iterations for a prototype
   */
  async getPrototypeIterations(prototypeId: string): Promise<PrototypeIteration[]> {
    return await db()
      .select()
      .from(prototypeIterations)
      .where(eq(prototypeIterations.prototypeId, prototypeId))
      .orderBy(desc(prototypeIterations.createdAt));
  }

  // --------------------------------------------------------------------------
  // Organization Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new organization
   */
  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    try {
      const [organization] = await db()
        .insert(organizations)
        .values({
          name: input.name,
          slug: input.slug.toLowerCase(),
          description: input.description || null,
        })
        .returning();

      return organization;
    } catch (error: any) {
      // Handle unique constraint violation (duplicate slug)
      if (error.code === '23505') {
        throw new Error('Organization with this slug already exists');
      }
      throw error;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string): Promise<Organization | null> {
    const [organization] = await db()
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    return organization || null;
  }

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    const [organization] = await db()
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug.toLowerCase()))
      .limit(1);

    return organization || null;
  }

  /**
   * Update organization
   */
  async updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    const updateData: Partial<typeof organizations.$inferInsert> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.slug !== undefined) updateData.slug = input.slug.toLowerCase();
    if (input.description !== undefined) updateData.description = input.description;

    updateData.updatedAt = new Date();

    try {
      const [organization] = await db()
        .update(organizations)
        .set(updateData)
        .where(eq(organizations.id, id))
        .returning();

      return organization;
    } catch (error: any) {
      // Handle unique constraint violation (duplicate slug)
      if (error.code === '23505') {
        throw new Error('Organization with this slug already exists');
      }
      throw error;
    }
  }

  /**
   * Delete organization
   */
  async deleteOrganization(id: string): Promise<boolean> {
    try {
      const result = await db()
        .delete(organizations)
        .where(eq(organizations.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * List all organizations for a user
   */
  async listUserOrganizations(userId: string): Promise<Organization[]> {
    const memberships = await db()
      .select({
        organization: organizations,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.orgId, organizations.id))
      .where(eq(organizationMembers.userId, userId))
      .orderBy(desc(organizations.createdAt));

    return memberships.map((m) => m.organization);
  }

  // --------------------------------------------------------------------------
  // Organization Member Operations
  // --------------------------------------------------------------------------

  /**
   * Add a member to an organization
   */
  async addOrganizationMember(input: AddOrganizationMemberInput): Promise<OrganizationMember> {
    try {
      const [member] = await db()
        .insert(organizationMembers)
        .values({
          orgId: input.orgId,
          userId: input.userId,
          role: input.role,
          invitedBy: input.invitedBy || null,
        })
        .returning();

      return member;
    } catch (error: any) {
      // Handle unique constraint violation (user already in org)
      if (error.code === '23505') {
        throw new Error('User is already a member of this organization');
      }
      throw error;
    }
  }

  /**
   * Remove a member from an organization
   */
  async removeOrganizationMember(orgId: string, userId: string): Promise<boolean> {
    try {
      const result = await db()
        .delete(organizationMembers)
        .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)))
        .returning();
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all members of an organization
   */
  async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    return await db()
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.orgId, orgId))
      .orderBy(desc(organizationMembers.joinedAt));
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(
    orgId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member'
  ): Promise<OrganizationMember> {
    const [member] = await db()
      .update(organizationMembers)
      .set({ role })
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)))
      .returning();

    if (!member) {
      throw new Error('Member not found');
    }

    return member;
  }

  /**
   * Get a user's role in an organization
   */
  async getUserOrganizationRole(
    orgId: string,
    userId: string
  ): Promise<'owner' | 'admin' | 'member' | null> {
    const [member] = await db()
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)))
      .limit(1);

    return member ? (member.role as 'owner' | 'admin' | 'member') : null;
  }

  // --------------------------------------------------------------------------
  // Team Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new team
   */
  async createTeam(input: CreateTeamInput): Promise<Team> {
    const [team] = await db()
      .insert(teams)
      .values({
        orgId: input.orgId,
        name: input.name,
        description: input.description || null,
      })
      .returning();

    return team;
  }

  /**
   * Get team by ID
   */
  async getTeamById(id: string): Promise<Team | null> {
    const [team] = await db().select().from(teams).where(eq(teams.id, id)).limit(1);

    return team || null;
  }

  /**
   * List all teams in an organization
   */
  async listOrganizationTeams(orgId: string): Promise<Team[]> {
    return await db()
      .select()
      .from(teams)
      .where(eq(teams.orgId, orgId))
      .orderBy(desc(teams.createdAt));
  }

  /**
   * Update team
   */
  async updateTeam(id: string, input: UpdateTeamInput): Promise<Team> {
    const updateData: Partial<typeof teams.$inferInsert> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    updateData.updatedAt = new Date();

    const [team] = await db().update(teams).set(updateData).where(eq(teams.id, id)).returning();

    return team;
  }

  /**
   * Delete team
   */
  async deleteTeam(id: string): Promise<boolean> {
    try {
      const result = await db().delete(teams).where(eq(teams.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Team Member Operations
  // --------------------------------------------------------------------------

  /**
   * Add a member to a team
   */
  async addTeamMember(input: AddTeamMemberInput): Promise<TeamMember> {
    try {
      const [member] = await db()
        .insert(teamMembers)
        .values({
          teamId: input.teamId,
          userId: input.userId,
          role: input.role,
        })
        .returning();

      return member;
    } catch (error: any) {
      // Handle unique constraint violation (user already in team)
      if (error.code === '23505') {
        throw new Error('User is already a member of this team');
      }
      throw error;
    }
  }

  /**
   * Remove a member from a team
   */
  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    try {
      const result = await db()
        .delete(teamMembers)
        .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
        .returning();
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all members of a team
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return await db()
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(desc(teamMembers.joinedAt));
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
