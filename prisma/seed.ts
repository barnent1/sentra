/**
 * Database Seed Script
 *
 * Populates the database with sample data for development.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users (password: demo123)
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'glen@sentra.ai',
      name: 'Glen Barnhardt',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'demo@sentra.ai',
      name: 'Demo User',
      password: hashedPassword,
    },
  });

  console.log('✓ Created 2 users');

  // Create projects for user1
  const sentraProject = await prisma.project.create({
    data: {
      name: 'Sentra',
      path: '/Users/glen/Projects/sentra',
      userId: user1.id,
      settings: JSON.stringify({
        notifications: { enabled: true, voice: true },
        theme: 'dark',
        autoApprove: false,
      }),
    },
  });

  const blogProject = await prisma.project.create({
    data: {
      name: 'Personal Blog',
      path: '/Users/glen/Projects/blog',
      userId: user1.id,
      settings: JSON.stringify({
        notifications: { enabled: false, voice: false },
        theme: 'dark',
      }),
    },
  });

  // Create project for user2
  const demoProject = await prisma.project.create({
    data: {
      name: 'Demo Project',
      path: '/Users/demo/Projects/demo',
      userId: user2.id,
      settings: JSON.stringify({
        notifications: { enabled: true, voice: true },
        theme: 'light',
      }),
    },
  });

  console.log('✓ Created 3 projects');

  // Create agents
  const completedAgent = await prisma.agent.create({
    data: {
      projectId: sentraProject.id,
      status: 'completed',
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(Date.now() - 1800000), // 30 min ago
      logs: JSON.stringify([
        'Agent started: Processing issue #123',
        'Running tests...',
        'Tests passed',
        'Creating pull request...',
        'Pull request #124 created successfully',
      ]),
      error: null,
    },
  });

  const runningAgent = await prisma.agent.create({
    data: {
      projectId: sentraProject.id,
      status: 'running',
      startTime: new Date(Date.now() - 600000), // 10 min ago
      endTime: null,
      logs: JSON.stringify([
        'Agent started: Processing issue #125',
        'Analyzing codebase...',
        'Writing tests...',
      ]),
      error: null,
    },
  });

  const failedAgent = await prisma.agent.create({
    data: {
      projectId: blogProject.id,
      status: 'failed',
      startTime: new Date(Date.now() - 7200000), // 2 hours ago
      endTime: new Date(Date.now() - 7000000),
      logs: JSON.stringify(['Agent started: Processing issue #42', 'Error encountered']),
      error: 'Failed to compile TypeScript: Type error in src/utils.ts',
    },
  });

  console.log('✓ Created 3 agents (1 completed, 1 running, 1 failed)');

  // Create costs
  const costs = [
    // Sentra project costs
    {
      projectId: sentraProject.id,
      amount: 0.045,
      model: 'gpt-4o',
      provider: 'openai',
      inputTokens: 1500,
      outputTokens: 800,
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      projectId: sentraProject.id,
      amount: 0.036,
      model: 'claude-sonnet-4-5',
      provider: 'anthropic',
      inputTokens: 2000,
      outputTokens: 1000,
      timestamp: new Date(Date.now() - 3000000),
    },
    {
      projectId: sentraProject.id,
      amount: 0.009,
      model: 'whisper-1',
      provider: 'openai',
      inputTokens: null,
      outputTokens: null,
      timestamp: new Date(Date.now() - 2400000),
    },
    // Blog project costs
    {
      projectId: blogProject.id,
      amount: 0.0012,
      model: 'gpt-3.5-turbo',
      provider: 'openai',
      inputTokens: 500,
      outputTokens: 300,
      timestamp: new Date(Date.now() - 7200000),
    },
    // Demo project costs
    {
      projectId: demoProject.id,
      amount: 0.015,
      model: 'gpt-4o-mini',
      provider: 'openai',
      inputTokens: 3000,
      outputTokens: 1500,
      timestamp: new Date(Date.now() - 600000),
    },
  ];

  await prisma.cost.createMany({ data: costs });
  console.log('✓ Created 5 cost records');

  // Create activities
  const activities = [
    // Sentra project activities
    {
      projectId: sentraProject.id,
      type: 'agent_started',
      message: 'Agent started working on issue #125',
      metadata: JSON.stringify({ issueNumber: 125, estimatedCost: 0.5 }),
      timestamp: new Date(Date.now() - 600000),
    },
    {
      projectId: sentraProject.id,
      type: 'agent_completed',
      message: 'Agent completed issue #123 - Pull request #124 created',
      metadata: JSON.stringify({
        issueNumber: 123,
        prNumber: 124,
        actualCost: 0.081,
        duration: 1800,
      }),
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      projectId: sentraProject.id,
      type: 'cost_alert',
      message: 'Project costs have exceeded $1.00 this week',
      metadata: JSON.stringify({ threshold: 1.0, actual: 1.23 }),
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
    },
    // Blog project activities
    {
      projectId: blogProject.id,
      type: 'agent_failed',
      message: 'Agent failed on issue #42 - TypeScript compilation error',
      metadata: JSON.stringify({ issueNumber: 42, error: 'Type error in src/utils.ts' }),
      timestamp: new Date(Date.now() - 7000000),
    },
    {
      projectId: blogProject.id,
      type: 'project_updated',
      message: 'Project settings updated',
      metadata: JSON.stringify({ changed: ['notifications'] }),
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
    },
    // Demo project activities
    {
      projectId: demoProject.id,
      type: 'project_created',
      message: 'Demo project created',
      metadata: null,
      timestamp: new Date(Date.now() - 604800000), // 7 days ago
    },
  ];

  await prisma.activity.createMany({ data: activities });
  console.log('✓ Created 6 activity records');

  console.log('\nSeed completed successfully! 🌱');
  console.log('Summary:');
  console.log('  - 2 users');
  console.log('  - 3 projects');
  console.log('  - 3 agents');
  console.log('  - 5 cost records');
  console.log('  - 6 activity records');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
