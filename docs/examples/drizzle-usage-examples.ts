/**
 * Drizzle Database Service - Usage Examples
 *
 * These examples show how to use the new Drizzle service layer.
 * All examples are edge-compatible and can be used in Vercel Edge Functions.
 */

// ============================================================================
// Basic Setup
// ============================================================================

import { drizzleDb } from '@/services/database-drizzle';
import type {
  User,
  Project,
  Agent,
  Cost,
  Activity,
} from '@/services/database-drizzle';

// ============================================================================
// User Operations
// ============================================================================

// Create a new user
async function exampleCreateUser() {
  const user = await drizzleDb.createUser({
    email: 'user@example.com',
    password: 'hashed_password_here', // Already hashed with bcrypt
    name: 'John Doe',
  });

  console.log('Created user:', user.id);
  return user;
}

// Get user by email (normalized)
async function exampleGetUserByEmail() {
  const user = await drizzleDb.getUserByEmail('user@example.com');

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

// Update user refresh token (JWT)
async function exampleUpdateRefreshToken(userId: string, token: string) {
  await drizzleDb.updateUserRefreshToken(userId, token);
}

// ============================================================================
// Project Operations
// ============================================================================

// Create a new project
async function exampleCreateProject(userId: string) {
  const project = await drizzleDb.createProject({
    name: 'My Project',
    path: '/Users/john/projects/my-project',
    userId,
    settings: {
      theme: 'dark',
      notifications: true,
      autoSave: true,
    },
  });

  console.log('Created project:', project.id);
  return project;
}

// Get project with relations
async function exampleGetProjectWithRelations(projectId: string) {
  const project = await drizzleDb.getProjectById(projectId, {
    includeUser: true,
    includeAgents: true,
    includeCosts: true,
    includeActivities: true,
  });

  if (!project) {
    throw new Error('Project not found');
  }

  console.log('Project:', project.name);
  console.log('Owner:', project.user?.email);
  console.log('Agents:', project.agents?.length);
  console.log('Total costs:', project.costs?.length);

  return project;
}

// List user's projects
async function exampleListUserProjects(userId: string) {
  const projects = await drizzleDb.listProjectsByUser(userId);

  console.log(`Found ${projects.length} projects`);

  return projects;
}

// Update project settings
async function exampleUpdateProject(projectId: string) {
  const project = await drizzleDb.updateProject(projectId, {
    name: 'Updated Project Name',
    settings: {
      theme: 'light',
      notifications: false,
    },
  });

  return project;
}

// ============================================================================
// Agent Operations
// ============================================================================

// Create a new agent
async function exampleCreateAgent(projectId: string) {
  const agent = await drizzleDb.createAgent({
    projectId,
    status: 'running',
    logs: ['Agent started', 'Processing task...'],
  });

  console.log('Created agent:', agent.id);
  return agent;
}

// Update agent status
async function exampleUpdateAgent(agentId: string) {
  const agent = await drizzleDb.updateAgent(agentId, {
    status: 'completed',
    endTime: new Date(),
    logs: ['Agent started', 'Processing task...', 'Task completed'],
  });

  return agent;
}

// List project agents
async function exampleListAgents(projectId: string) {
  const agents = await drizzleDb.listAgentsByProject(projectId);

  console.log(`Found ${agents.length} agents`);

  return agents;
}

// ============================================================================
// Cost Operations
// ============================================================================

// Track API cost
async function exampleTrackCost(projectId: string) {
  const cost = await drizzleDb.createCost({
    projectId,
    amount: 0.05,
    model: 'gpt-4',
    provider: 'openai',
    inputTokens: 1000,
    outputTokens: 500,
  });

  return cost;
}

// Get total project cost
async function exampleGetTotalCost(projectId: string) {
  const total = await drizzleDb.getTotalCostByProject(projectId);

  console.log(`Total project cost: $${total.toFixed(2)}`);

  return total;
}

// Get costs in time range
async function exampleGetCostsByTimeRange() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);

  const costs = await drizzleDb.getCostsByTimeRange(startOfMonth, endOfMonth);

  console.log(`Found ${costs.length} costs this month`);

  return costs;
}

// Bulk insert costs (performance)
async function exampleBulkInsertCosts(projectId: string) {
  await drizzleDb.bulkCreateCosts([
    {
      projectId,
      amount: 0.01,
      model: 'gpt-3.5-turbo',
      provider: 'openai',
      inputTokens: 100,
      outputTokens: 50,
    },
    {
      projectId,
      amount: 0.02,
      model: 'gpt-4',
      provider: 'openai',
      inputTokens: 200,
      outputTokens: 100,
    },
  ]);
}

// ============================================================================
// Activity Operations
// ============================================================================

// Create activity
async function exampleCreateActivity(projectId: string) {
  const activity = await drizzleDb.createActivity({
    projectId,
    type: 'agent_started',
    message: 'AI agent started processing task',
    metadata: {
      taskId: 'task-123',
      priority: 'high',
    },
  });

  return activity;
}

// Get recent activities across all projects
async function exampleGetRecentActivities(userId: string) {
  const activities = await drizzleDb.getRecentActivities(userId, 10);

  console.log(`Found ${activities.length} recent activities`);

  activities.forEach((activity) => {
    console.log(
      `[${activity.timestamp}] ${activity.project?.name}: ${activity.message}`
    );
  });

  return activities;
}

// ============================================================================
// Transaction Example
// ============================================================================

// Create project with initial activity (atomic)
async function exampleTransaction(userId: string) {
  const result = await drizzleDb.transaction(async (tx) => {
    // Insert project
    const [project] = await tx
      .insert(projects)
      .values({
        name: 'New Project',
        path: '/path/to/project',
        userId,
      })
      .returning();

    // Insert activity for project creation
    await tx.insert(activities).values({
      projectId: project.id,
      type: 'project_created',
      message: `Project "${project.name}" created`,
      timestamp: new Date(),
    });

    return project;
  });

  console.log('Transaction completed, created project:', result.id);
  return result;
}

// ============================================================================
// Edge Runtime Example (Next.js API Route)
// ============================================================================

// src/app/api/projects/route.ts
export const runtime = 'edge'; // ✅ Works with Drizzle!

export async function GET() {
  try {
    // Get user ID from auth (example)
    const userId = 'user-123';

    // List projects
    const projects = await drizzleDb.listProjectsByUser(userId);

    return Response.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = 'user-123'; // From auth

    // Create project
    const project = await drizzleDb.createProject({
      name: body.name,
      path: body.path,
      userId,
      settings: body.settings,
    });

    return Response.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// Error Handling Examples
// ============================================================================

// Handle duplicate email
async function exampleHandleDuplicateEmail() {
  try {
    await drizzleDb.createUser({
      email: 'existing@example.com',
      password: 'hashed',
    });
  } catch (error) {
    if (error.message === 'User with this email already exists') {
      console.error('Email already registered');
      // Show error to user
    } else {
      throw error;
    }
  }
}

// Handle user not found
async function exampleHandleUserNotFound() {
  try {
    await drizzleDb.createProject({
      name: 'Project',
      path: '/path',
      userId: 'invalid-user-id',
    });
  } catch (error) {
    if (error.message === 'User not found') {
      console.error('Invalid user ID');
      // Show error to user
    } else {
      throw error;
    }
  }
}

// ============================================================================
// Migration from Prisma Examples
// ============================================================================

// BEFORE (Prisma)
/*
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: { projects: true }
})
*/

// AFTER (Drizzle)
async function exampleMigrationFromPrisma() {
  const user = await drizzleDb.getUserByEmail('user@example.com');
  if (!user) return null;

  const projects = await drizzleDb.listProjectsByUser(user.id);

  return { ...user, projects };
}

// ============================================================================
// Export Examples
// ============================================================================

export {
  exampleCreateUser,
  exampleGetUserByEmail,
  exampleCreateProject,
  exampleGetProjectWithRelations,
  exampleUpdateProject,
  exampleCreateAgent,
  exampleUpdateAgent,
  exampleTrackCost,
  exampleGetTotalCost,
  exampleCreateActivity,
  exampleGetRecentActivities,
  exampleTransaction,
};
