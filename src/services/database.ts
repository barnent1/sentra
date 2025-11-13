/**
 * Database Service
 *
 * Provides CRUD operations for all database models using Prisma ORM.
 * Supports both SQLite (dev) and PostgreSQL (production).
 *
 * Features:
 * - Type-safe database operations
 * - Connection pooling
 * - Transaction support
 * - Bulk operations for performance
 * - Proper error handling
 *
 * Usage:
 *   const db = DatabaseService.getInstance();
 *   const user = await db.createUser({ email: 'test@example.com', name: 'Test' });
 */

import { PrismaClient, Prisma } from '@prisma/client';

// ============================================================================
// Type Exports (from Prisma)
// ============================================================================

export type User = Prisma.UserGetPayload<object>;
export type Project = Prisma.ProjectGetPayload<object>;
export type Agent = Prisma.AgentGetPayload<object>;
export type Cost = Prisma.CostGetPayload<object>;
export type Activity = Prisma.ActivityGetPayload<object>;

// ============================================================================
// Input Types
// ============================================================================

export interface CreateUserInput {
  email: string;
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
// Database Service Class
// ============================================================================

export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private prisma: PrismaClient;
  private isConnected = false;

  private constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  // --------------------------------------------------------------------------
  // Singleton Pattern
  // --------------------------------------------------------------------------

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Create test instance with provided Prisma client
   * Used for testing only
   */
  static createTestInstance(prisma: PrismaClient): DatabaseService {
    return new DatabaseService(prisma);
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    DatabaseService.instance = null;
  }

  // --------------------------------------------------------------------------
  // Connection Management
  // --------------------------------------------------------------------------

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.prisma.$connect();
      this.isConnected = true;
    } catch (error) {
      throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
    } catch (error) {
      // Ignore disconnect errors, just mark as disconnected
      this.isConnected = false;
    }
  }

  // --------------------------------------------------------------------------
  // User Operations
  // --------------------------------------------------------------------------

  async createUser(input: CreateUserInput): Promise<User> {
    this.validateEmail(input.email);

    try {
      return await this.prisma.user.create({
        data: {
          email: input.email.toLowerCase(), // Normalize email
          name: input.name || null,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('User with this email already exists');
        }
      }
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async listUsers(): Promise<User[]> {
    return await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // --------------------------------------------------------------------------
  // Project Operations
  // --------------------------------------------------------------------------

  async createProject(input: CreateProjectInput): Promise<Project> {
    try {
      const project = await this.prisma.project.create({
        data: {
          name: input.name,
          path: input.path,
          userId: input.userId,
          settings: input.settings ? JSON.stringify(input.settings) : null,
        },
      });
      return this.deserializeProject(project);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new Error('User not found');
        }
      }
      throw error;
    }
  }

  async getProjectById(id: string, options: GetProjectOptions = {}): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        user: options.includeUser || false,
        agents: options.includeAgents || false,
        costs: options.includeCosts || false,
        activities: options.includeActivities || false,
      },
    });
    return project ? this.deserializeProject(project) : null;
  }

  async listProjectsByUser(userId: string): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return projects.map(p => this.deserializeProject(p));
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        name: input.name,
        path: input.path,
        settings: input.settings ? JSON.stringify(input.settings) : undefined,
      },
    });
    return this.deserializeProject(project);
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      await this.prisma.project.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return false; // Record not found
        }
      }
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Agent Operations
  // --------------------------------------------------------------------------

  async createAgent(input: CreateAgentInput): Promise<Agent> {
    this.validateAgentStatus(input.status);

    const agent = await this.prisma.agent.create({
      data: {
        projectId: input.projectId,
        status: input.status,
        startTime: new Date(),
        endTime: input.endTime || null,
        logs: input.logs ? JSON.stringify(input.logs) : null,
        error: input.error || null,
      },
    });
    return this.deserializeAgent(agent);
  }

  async getAgentById(id: string, options: GetAgentOptions = {}): Promise<Agent | null> {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        project: options.includeProject || false,
      },
    });
    return agent ? this.deserializeAgent(agent) : null;
  }

  async listAgentsByProject(projectId: string): Promise<Agent[]> {
    const agents = await this.prisma.agent.findMany({
      where: { projectId },
      orderBy: { startTime: 'desc' },
    });
    return agents.map(a => this.deserializeAgent(a));
  }

  async updateAgent(id: string, input: UpdateAgentInput): Promise<Agent> {
    if (input.status) {
      this.validateAgentStatus(input.status);
    }

    const agent = await this.prisma.agent.update({
      where: { id },
      data: {
        status: input.status,
        endTime: input.endTime,
        logs: input.logs ? JSON.stringify(input.logs) : undefined,
        error: input.error,
      },
    });
    return this.deserializeAgent(agent);
  }

  // --------------------------------------------------------------------------
  // Cost Operations
  // --------------------------------------------------------------------------

  async createCost(input: CreateCostInput): Promise<Cost> {
    this.validatePositiveAmount(input.amount);

    return await this.prisma.cost.create({
      data: {
        projectId: input.projectId,
        amount: input.amount,
        model: input.model,
        provider: input.provider,
        inputTokens: input.inputTokens || null,
        outputTokens: input.outputTokens || null,
        timestamp: new Date(),
      },
    });
  }

  async getCostsByProject(projectId: string): Promise<Cost[]> {
    return await this.prisma.cost.findMany({
      where: { projectId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getTotalCostByProject(projectId: string): Promise<number> {
    const result = await this.prisma.cost.aggregate({
      where: { projectId },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  async getCostsByTimeRange(start: Date, end: Date): Promise<Cost[]> {
    return await this.prisma.cost.findMany({
      where: {
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async bulkCreateCosts(costs: CreateCostInput[]): Promise<void> {
    // Validate all costs first
    costs.forEach(cost => this.validatePositiveAmount(cost.amount));

    await this.prisma.cost.createMany({
      data: costs.map(cost => ({
        projectId: cost.projectId,
        amount: cost.amount,
        model: cost.model,
        provider: cost.provider,
        inputTokens: cost.inputTokens || null,
        outputTokens: cost.outputTokens || null,
        timestamp: new Date(),
      })),
    });
  }

  // --------------------------------------------------------------------------
  // Activity Operations
  // --------------------------------------------------------------------------

  async createActivity(input: CreateActivityInput): Promise<Activity> {
    this.validateActivityType(input.type);

    const activity = await this.prisma.activity.create({
      data: {
        projectId: input.projectId,
        type: input.type,
        message: input.message,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        timestamp: new Date(),
      },
    });
    return this.deserializeActivity(activity);
  }

  async getActivitiesByProject(
    projectId: string,
    options: GetActivitiesOptions = {}
  ): Promise<Activity[]> {
    const activities = await this.prisma.activity.findMany({
      where: { projectId },
      orderBy: { timestamp: 'desc' },
      take: options.limit,
      skip: options.offset,
    });
    return activities.map(a => this.deserializeActivity(a));
  }

  async getRecentActivities(userId: string, limit: number = 10): Promise<Activity[]> {
    const activities = await this.prisma.activity.findMany({
      where: {
        project: {
          userId,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        project: true,
      },
    });
    return activities.map(a => this.deserializeActivity(a));
  }

  async bulkCreateActivities(activities: CreateActivityInput[]): Promise<void> {
    // Validate all activities first
    activities.forEach(activity => this.validateActivityType(activity.type));

    await this.prisma.activity.createMany({
      data: activities.map(activity => ({
        projectId: activity.projectId,
        type: activity.type,
        message: activity.message,
        metadata: activity.metadata ? JSON.stringify(activity.metadata) : null,
        timestamp: new Date(),
      })),
    });
  }

  // --------------------------------------------------------------------------
  // Transaction Support
  // --------------------------------------------------------------------------

  async transaction<T>(
    fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return await this.prisma.$transaction(fn);
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
    await this.prisma.activity.deleteMany();
    await this.prisma.cost.deleteMany();
    await this.prisma.agent.deleteMany();
    await this.prisma.project.deleteMany();
    await this.prisma.user.deleteMany();
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
      throw new Error(`Invalid agent status: ${status}. Must be one of: ${VALID_AGENT_STATUSES.join(', ')}`);
    }
  }

  private validateActivityType(type: string): void {
    if (!VALID_ACTIVITY_TYPES.includes(type as ActivityType)) {
      throw new Error(`Invalid activity type: ${type}. Must be one of: ${VALID_ACTIVITY_TYPES.join(', ')}`);
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

  private deserializeProject(project: any): Project {
    return {
      ...project,
      settings: project.settings ? JSON.parse(project.settings) : null,
    };
  }

  private deserializeAgent(agent: any): Agent {
    return {
      ...agent,
      logs: agent.logs ? JSON.parse(agent.logs) : null,
    };
  }

  private deserializeActivity(activity: any): Activity {
    return {
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
    };
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance();
