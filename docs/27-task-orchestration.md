# Task Orchestration

## Overview

Sentra orchestrates **massively parallel autonomous development** using hooks, worktrees, and database-driven coordination. This document details how tasks are created, claimed, executed, and completed in a parallel multi-agent system.

**Key Concept:** Hooks act as coordinators, reading/writing to PostgreSQL to manage task state, dependencies, and resource allocation across 10-20+ concurrent agents.

## Orchestration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Task Orchestrator                       │
│  (Polls database, spawns agents, monitors execution)        │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ├─ Checks: Ready tasks (dependencies met)
                 ├─ Limits: Max parallel tasks (15)
                 ├─ Claims: Update status to 'running'
                 ├─ Spawns: Claude sessions in worktrees
                 └─ Monitors: Hook events for completion
                 │
    ┌────────────┴────────────┬────────────────┬──────────────┐
    │                         │                │              │
    ▼                         ▼                ▼              ▼
┌─────────┐             ┌─────────┐      ┌─────────┐    ┌─────────┐
│ Task 1  │             │ Task 2  │      │ Task 3  │    │ Task N  │
│ Agent   │             │ Agent   │      │ Agent   │    │ Agent   │
│         │             │         │      │         │    │         │
│ Hooks ↔ Database ↔ Hooks       │      │ Hooks   │    │ Hooks   │
└─────────┘             └─────────┘      └─────────┘    └─────────┘
                                  │
                                  ↓
                        ┌───────────────────┐
                        │   PostgreSQL      │
                        │                   │
                        │ - Task state      │
                        │ - Dependencies    │
                        │ - Hook events     │
                        │ - Execution logs  │
                        └───────────────────┘
```

## Task Lifecycle

### **1. Task Creation**

Tasks are created by:
- **Dashboard UI** - User creates tasks manually
- **AI Analyst** - Decomposes large projects into atomic tasks
- **Workflow Triggers** - Automated task generation

```typescript
// Create task in database
await db.insert(tasks).values({
  id: 'task-abc123',
  projectId: 'proj-xyz',
  title: 'Add JWT authentication',
  description: 'Implement JWT-based auth with refresh tokens',
  type: 'feature',
  priority: 'high',
  status: 'pending',
  dependencies: [], // No blockers
  createdBy: 'user-123',
  createdAt: new Date(),
});
```

### **2. Dependency Resolution**

Tasks can depend on other tasks:

```typescript
// Task with dependencies
await db.insert(tasks).values({
  id: 'task-002',
  title: 'Add auth middleware',
  dependencies: ['task-001'], // Must wait for JWT auth
  status: 'blocked', // Not ready yet
});

// When task-001 completes, task-002 becomes ready
await db.update(tasks)
  .set({ status: 'pending' })
  .where(and(
    eq(tasks.id, 'task-002'),
    sql`NOT EXISTS (
      SELECT 1 FROM tasks
      WHERE id IN ('task-001')
      AND status != 'completed'
    )`
  ));
```

**Dependency Graph Example:**

```
task-001 (Auth System)
    ├─→ task-002 (Auth Middleware)
    │       └─→ task-005 (Protected Routes)
    ├─→ task-003 (Auth Tests)
    └─→ task-004 (Login UI)

task-006 (User CRUD) ← Independent, can run in parallel
task-007 (Settings Page) ← Independent, can run in parallel
```

### **3. Task Orchestrator (Main Loop)**

```typescript
class TaskOrchestrator {
  private maxConcurrent = 15;
  private pollInterval = 5000; // 5 seconds

  // CRITICAL: Circuit breaker to prevent cascading failures
  private circuitBreaker = {
    failureThreshold: 5, // Open circuit after 5 consecutive failures
    resetTimeout: 60000, // Try again after 60 seconds
    consecutiveFailures: 0,
    state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN',
    lastFailureTime: null as Date | null,
  };

  async start() {
    console.log('Task orchestrator started');

    while (true) {
      await this.executeCycle();
      await sleep(this.pollInterval);
    }
  }

  async executeCycle() {
    // CRITICAL: Check circuit breaker state
    if (this.circuitBreaker.state === 'OPEN') {
      const timeSinceFailure = Date.now() - (this.circuitBreaker.lastFailureTime?.getTime() || 0);

      if (timeSinceFailure > this.circuitBreaker.resetTimeout) {
        console.log('Circuit breaker: Transitioning to HALF_OPEN');
        this.circuitBreaker.state = 'HALF_OPEN';
      } else {
        console.warn(`Circuit breaker OPEN - skipping task execution (${Math.round((this.circuitBreaker.resetTimeout - timeSinceFailure) / 1000)}s remaining)`);
        return;
      }
    }

    // 1. Get ready tasks (dependencies satisfied, status = pending)
    const readyTasks = await this.getReadyTasks();

    // 2. Check current concurrency
    const running = await this.getRunningTaskCount();
    const available = this.maxConcurrent - running;

    if (available <= 0) {
      return; // At capacity
    }

    // 3. Claim tasks (up to available slots)
    const toExecute = readyTasks.slice(0, available);

    // 4. Execute in parallel (with circuit breaker protection)
    try {
      await Promise.all(
        toExecute.map(task => this.executeTask(task))
      );

      // Success - reset circuit breaker
      if (this.circuitBreaker.state === 'HALF_OPEN') {
        console.log('Circuit breaker: Success in HALF_OPEN - closing circuit');
        this.circuitBreaker.state = 'CLOSED';
      }
      this.circuitBreaker.consecutiveFailures = 0;
    } catch (error) {
      // Failure - increment counter
      this.circuitBreaker.consecutiveFailures++;
      this.circuitBreaker.lastFailureTime = new Date();

      console.error(`Task execution failed (${this.circuitBreaker.consecutiveFailures}/${this.circuitBreaker.failureThreshold}):`, error);

      // Open circuit if threshold exceeded
      if (this.circuitBreaker.consecutiveFailures >= this.circuitBreaker.failureThreshold) {
        console.error('Circuit breaker: OPEN - too many consecutive failures');
        this.circuitBreaker.state = 'OPEN';

        // Log critical event
        await db.insert(auditLog).values({
          action: 'circuit_breaker_open',
          metadata: {
            consecutiveFailures: this.circuitBreaker.consecutiveFailures,
            error: String(error),
          },
          timestamp: new Date(),
        });
      }
    }
  }

  async getReadyTasks() {
    return await db.query.tasks.findMany({
      where: and(
        eq(tasks.status, 'pending'),
        sql`NOT EXISTS (
          SELECT 1 FROM tasks AS deps
          WHERE deps.id = ANY(${tasks.dependencies})
          AND deps.status != 'completed'
        )`
      ),
      orderBy: [desc(tasks.priority), asc(tasks.createdAt)],
    });
  }

  async getRunningTaskCount() {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(eq(tasks.status, 'running'));

    return result[0].count;
  }

  async executeTask(task: Task) {
    // 1. Claim task
    await this.claimTask(task.id);

    // 2. Create worktree
    const worktreePath = await this.createWorktree(task);

    // 3. Setup environment
    await this.setupWorktree(task, worktreePath);

    // 4. Spawn Claude agent
    await this.spawnAgent(task, worktreePath);

    // Note: Agent runs asynchronously, hooks will update state
  }

  async claimTask(taskId: string) {
    await db.update(tasks)
      .set({
        status: 'running',
        startedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));
  }

  async createWorktree(task: Task) {
    const worktreePath = `.sentra/worktrees/${task.id}`;
    const branchName = `${task.type}/${task.id}-${task.slug}`;

    await exec(`git worktree add -b ${branchName} ${worktreePath} origin/main`);

    // Store worktree path in database
    await db.insert(taskExecution).values({
      taskId: task.id,
      sessionId: task.id, // Will be updated when agent spawns
      worktreePath,
      status: 'running',
      phase: 'SETUP',
      startedAt: new Date(),
    });

    return worktreePath;
  }

  async setupWorktree(task: Task, worktreePath: string) {
    // Allocate unique ports
    const { backendPort, frontendPort } = getPortsForTask(task.id);

    // Create .ports.env
    await writeFile(`${worktreePath}/.ports.env`, `
BACKEND_PORT=${backendPort}
FRONTEND_PORT=${frontendPort}
VITE_BACKEND_URL=http://localhost:${backendPort}
    `);

    // Install dependencies (use pnpm for efficiency)
    await exec('pnpm install', { cwd: worktreePath });

    // Run setup script if exists
    if (await exists(`${worktreePath}/scripts/setup-worktree.sh`)) {
      await exec('./scripts/setup-worktree.sh', { cwd: worktreePath });
    }
  }

  async spawnAgent(task: Task, worktreePath: string) {
    // Generate initial prompt based on task type
    const prompt = this.generatePrompt(task);

    // Spawn Claude Code session
    const sessionId = task.id;

    // Run in background (don't wait for completion)
    exec(
      `claude-code --session ${sessionId} --input "${prompt}"`,
      {
        cwd: worktreePath,
        env: {
          SESSION_ID: sessionId,
          TASK_ID: task.id,
          WORKTREE_PATH: worktreePath,
          DATABASE_URL: process.env.DATABASE_URL,
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          this.handleAgentError(task, error);
        }
      }
    );

    console.log(`Spawned agent for task ${task.id} in ${worktreePath}`);
  }

  generatePrompt(task: Task): string {
    switch (task.type) {
      case 'feature':
        return `Read the plan at .sentra/plans/${task.id}.md and implement the feature: ${task.title}`;
      case 'bug':
        return `Read the bug report at .sentra/plans/${task.id}.md and fix the bug: ${task.title}`;
      case 'test':
        return `Read the test requirements at .sentra/plans/${task.id}.md and write tests for: ${task.title}`;
      default:
        return `Complete the task: ${task.title}. Description: ${task.description}`;
    }
  }

  async handleAgentError(task: Task, error: Error) {
    console.error(`Agent error for task ${task.id}:`, error);

    // CRITICAL: Automatic rollback on failure
    await this.rollbackFailedTask(task);

    await db.update(tasks)
      .set({
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
        rollbackCompleted: true,
      })
      .where(eq(tasks.id, task.id));
  }

  async rollbackFailedTask(task: Task) {
    const execution = await db.query.taskExecution.findFirst({
      where: eq(taskExecution.taskId, task.id),
    });

    if (!execution?.worktreePath) return;

    console.log(`Rolling back failed task ${task.id} in ${execution.worktreePath}`);

    try {
      // 1. Get git worktree branch name
      const branchName = `sentra/task-${task.id}`;

      // 2. Hard reset worktree to original state (before agent changes)
      await exec(`git reset --hard origin/main`, { cwd: execution.worktreePath });

      // 3. Clean untracked files
      await exec(`git clean -fd`, { cwd: execution.worktreePath });

      // 4. Log rollback event
      await db.insert(auditLog).values({
        action: 'task_rollback',
        metadata: {
          taskId: task.id,
          worktreePath: execution.worktreePath,
          reason: 'agent_error',
        },
        timestamp: new Date(),
      });

      console.log(`✅ Rollback completed for task ${task.id}`);
    } catch (rollbackError) {
      console.error(`❌ Rollback failed for task ${task.id}:`, rollbackError);

      // Log rollback failure - requires manual intervention
      await db.insert(auditLog).values({
        action: 'rollback_failed',
        metadata: {
          taskId: task.id,
          worktreePath: execution.worktreePath,
          error: String(rollbackError),
        },
        timestamp: new Date(),
      });
    }
  }
}
```

### **4. Hook Coordination During Execution**

Hooks update task state as agent progresses:

#### **Phase Transitions (post-tool-use.ts)**

```typescript
// Detect phase transitions based on slash commands
if (tool_name === 'SlashCommand') {
  const command = tool_input.command;

  let phase = null;
  if (command.includes('/plan')) phase = 'PLAN';
  if (command.includes('/code')) phase = 'CODE';
  if (command.includes('/test')) phase = 'TEST';
  if (command.includes('/review')) phase = 'REVIEW';

  if (phase) {
    await db.update(taskExecution)
      .set({ phase })
      .where(eq(taskExecution.sessionId, session_id));

    console.log(`Task ${session_id} entered ${phase} phase`);
  }
}
```

#### **Progress Tracking**

```typescript
// Update progress based on file changes
if (tool_name === 'Write' || tool_name === 'Edit') {
  const filePath = tool_input.file_path;

  // Increment files changed counter
  await db.update(taskExecution)
    .set({
      metadata: sql`jsonb_set(
        metadata,
        '{filesChanged}',
        (COALESCE(metadata->>'filesChanged', '0')::int + 1)::text::jsonb
      )`
    })
    .where(eq(taskExecution.sessionId, session_id));
}
```

#### **Completion Detection (post-tool-use.ts)**

```typescript
// Detect PR creation (task complete)
if (tool_name === 'Bash' && tool_input.command?.includes('gh pr create')) {
  await markTaskComplete(session_id);
}

async function markTaskComplete(sessionId: string) {
  // Update task status
  await db.update(tasks)
    .set({
      status: 'completed',
      completedAt: new Date(),
    })
    .where(eq(tasks.sessionId, sessionId));

  // Get completed task
  const completedTask = await db.query.tasks.findFirst({
    where: eq(tasks.sessionId, sessionId),
  });

  if (!completedTask) return;

  // Unblock dependent tasks
  await db.update(tasks)
    .set({ status: 'pending' })
    .where(and(
      sql`${completedTask.id} = ANY(dependencies)`,
      sql`NOT EXISTS (
        SELECT 1 FROM tasks AS deps
        WHERE deps.id = ANY(dependencies)
        AND deps.id != ${completedTask.id}
        AND deps.status != 'completed'
      )`
    ));

  console.log(`Task ${completedTask.id} completed, unblocked dependents`);
}
```

### **5. Cleanup (stop.ts)**

When agent session ends:

```typescript
async function main() {
  const input = JSON.parse(await readStdin());
  const { session_id } = input;

  // Get task and execution info
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.sessionId, session_id),
  });

  const execution = await db.query.taskExecution.findFirst({
    where: eq(taskExecution.sessionId, session_id),
  });

  if (!task || !execution) {
    process.exit(0);
  }

  // Remove worktree if task completed successfully
  if (task.status === 'completed' && execution.worktreePath) {
    await exec(`git worktree remove ${execution.worktreePath} --force`);
    console.log(`Cleaned up worktree: ${execution.worktreePath}`);
  }

  // Preserve worktree if task failed (for debugging)
  if (task.status === 'failed') {
    console.log(`Worktree preserved for debugging: ${execution.worktreePath}`);
  }

  process.exit(0);
}
```

## Resource Management

### **Port Allocation**

Each worktree gets unique ports:

```typescript
function getPortsForTask(taskId: string): { backendPort: number, frontendPort: number } {
  // Deterministic hash to index (0-14)
  const index = hashString(taskId) % 15;

  return {
    backendPort: 9100 + index,   // 9100-9114
    frontendPort: 9200 + index,  // 9200-9214
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
```

**Conflict Resolution:**

```typescript
async function findAvailablePorts(taskId: string): Promise<{ backendPort: number, frontendPort: number }> {
  const { backendPort, frontendPort } = getPortsForTask(taskId);

  // Check if ports available
  if (await isPortAvailable(backendPort) && await isPortAvailable(frontendPort)) {
    return { backendPort, frontendPort };
  }

  // Try next ports in range
  for (let offset = 1; offset < 15; offset++) {
    const index = (hashString(taskId) + offset) % 15;
    const altBackend = 9100 + index;
    const altFrontend = 9200 + index;

    if (await isPortAvailable(altBackend) && await isPortAvailable(altFrontend)) {
      return { backendPort: altBackend, frontendPort: altFrontend };
    }
  }

  throw new Error('No available ports in allocated range');
}
```

### **Concurrency Limits**

Pre-tool-use hook enforces limits:

```typescript
// Check max parallel tasks before allowing execution
const runningCount = await db
  .select({ count: sql<number>`count(*)` })
  .from(taskExecution)
  .where(eq(taskExecution.status, 'running'));

const MAX_PARALLEL = 15;

if (runningCount[0].count >= MAX_PARALLEL) {
  console.error(`BLOCKED: Max concurrent tasks (${MAX_PARALLEL}) reached`);
  process.exit(2); // Block execution
}
```

### **Memory Management**

Only run dev servers when necessary:

```typescript
async function setupWorktree(task: Task, worktreePath: string) {
  // Install dependencies
  await exec('pnpm install', { cwd: worktreePath });

  // Only start dev server for UI tasks or E2E tests
  if (task.type === 'ui' || task.hasE2E) {
    const { frontendPort, backendPort } = getPortsForTask(task.id);

    // Start servers in background
    exec(`npm run dev -- --port ${frontendPort}`, {
      cwd: `${worktreePath}/app/client`,
      detached: true,
    });

    exec(`npm run dev -- --port ${backendPort}`, {
      cwd: `${worktreePath}/app/server`,
      detached: true,
    });
  }
  // For backend/logic tasks: no server needed
}
```

## Dependency Strategies

### **Simple Dependencies (Sequential)**

```typescript
const tasks = [
  { id: 'task-001', dependencies: [] },
  { id: 'task-002', dependencies: ['task-001'] },
  { id: 'task-003', dependencies: ['task-002'] },
];

// Execution: 001 → 002 → 003 (sequential)
```

### **Parallel Dependencies**

```typescript
const tasks = [
  { id: 'task-001', dependencies: [] },
  { id: 'task-002', dependencies: [] },
  { id: 'task-003', dependencies: [] },
  { id: 'task-004', dependencies: ['task-001', 'task-002', 'task-003'] },
];

// Execution: 001, 002, 003 run in parallel → then 004
```

### **Complex Dependency Graph**

```typescript
const tasks = [
  { id: 'auth', dependencies: [] },
  { id: 'users', dependencies: [] },
  { id: 'auth-middleware', dependencies: ['auth'] },
  { id: 'user-crud', dependencies: ['users', 'auth-middleware'] },
  { id: 'profile-page', dependencies: ['user-crud'] },
];

// Execution timeline:
// Wave 1: auth, users (parallel)
// Wave 2: auth-middleware (waits for auth)
// Wave 3: user-crud (waits for users + auth-middleware)
// Wave 4: profile-page (waits for user-crud)
```

### **Dependency Checking Query**

```sql
-- Check if task is ready (all dependencies completed)
SELECT t.*
FROM tasks t
WHERE t.status = 'pending'
AND NOT EXISTS (
  SELECT 1
  FROM tasks deps
  WHERE deps.id = ANY(t.dependencies)
  AND deps.status != 'completed'
)
ORDER BY t.priority DESC, t.created_at ASC;
```

## Failure Handling

### **Task Failure Detection**

```typescript
// Hook detects failure based on error patterns
if (tool_name === 'Bash' && result?.exitCode !== 0) {
  // Check for critical failures
  const criticalErrors = [
    'FATAL',
    'cannot resolve',
    'module not found',
    'test failed',
  ];

  const isCritical = criticalErrors.some(err =>
    result.stderr?.includes(err)
  );

  if (isCritical) {
    await markTaskFailed(session_id, result.stderr);
  }
}

async function markTaskFailed(sessionId: string, error: string) {
  await db.update(tasks)
    .set({
      status: 'failed',
      error,
      completedAt: new Date(),
    })
    .where(eq(tasks.sessionId, sessionId));

  // Optionally: Fail dependent tasks or mark as blocked
  await db.update(tasks)
    .set({ status: 'blocked' })
    .where(sql`${sessionId} = ANY(dependencies)`);
}
```

### **Retry Strategy**

```typescript
// Retry failed tasks (up to 3 attempts)
const failedTask = await db.query.tasks.findFirst({
  where: eq(tasks.status, 'failed'),
});

if (failedTask && failedTask.retryCount < 3) {
  await db.update(tasks)
    .set({
      status: 'pending',
      retryCount: failedTask.retryCount + 1,
      error: null,
    })
    .where(eq(tasks.id, failedTask.id));

  console.log(`Retrying task ${failedTask.id} (attempt ${failedTask.retryCount + 1})`);
}
```

### **Manual Intervention**

```typescript
// Dashboard allows manual retry or skip
async function manualRetry(taskId: string) {
  await db.update(tasks)
    .set({
      status: 'pending',
      error: null,
      retryCount: 0,
    })
    .where(eq(tasks.id, taskId));
}

async function skipTask(taskId: string) {
  // Mark as completed (skip) and unblock dependents
  await db.update(tasks)
    .set({
      status: 'skipped',
      completedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));

  // Unblock dependents
  await db.update(tasks)
    .set({ status: 'pending' })
    .where(sql`${taskId} = ANY(dependencies)`);
}
```

## Monitoring & Observability

### **Real-time Task Dashboard**

```typescript
// API endpoint for live task status
export async function GET() {
  const stats = {
    pending: await countTasks('pending'),
    running: await countTasks('running'),
    completed: await countTasks('completed'),
    failed: await countTasks('failed'),
    blocked: await countTasks('blocked'),
  };

  const runningTasks = await db.query.tasks.findMany({
    where: eq(tasks.status, 'running'),
    with: {
      execution: true,
    },
  });

  return Response.json({ stats, runningTasks });
}

async function countTasks(status: string) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(eq(tasks.status, status));

  return result[0].count;
}
```

### **Task Timeline Visualization**

```typescript
// Get execution timeline for a task
const timeline = await db
  .select({
    timestamp: hookEvents.timestamp,
    hookName: hookEvents.hookName,
    phase: taskExecution.phase,
    data: hookEvents.eventData,
  })
  .from(hookEvents)
  .leftJoin(taskExecution, eq(hookEvents.sessionId, taskExecution.sessionId))
  .where(eq(hookEvents.sessionId, taskId))
  .orderBy(asc(hookEvents.timestamp));

// Returns:
// [
//   { timestamp: '10:00:00', hookName: 'start', phase: 'SETUP' },
//   { timestamp: '10:01:30', hookName: 'post_tool_use', phase: 'PLAN' },
//   { timestamp: '10:05:00', hookName: 'post_tool_use', phase: 'CODE' },
//   { timestamp: '10:20:00', hookName: 'post_tool_use', phase: 'TEST' },
//   { timestamp: '10:25:00', hookName: 'stop', phase: 'REVIEW' },
// ]
```

### **Performance Metrics**

```typescript
// Calculate average task completion time by type
const metrics = await db
  .select({
    taskType: tasks.type,
    avgDuration: sql<number>`AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))`,
    count: sql<number>`COUNT(*)`,
  })
  .from(tasks)
  .where(eq(tasks.status, 'completed'))
  .groupBy(tasks.type);

// Returns:
// [
//   { taskType: 'feature', avgDuration: 1800, count: 45 },  // 30 min avg
//   { taskType: 'bug', avgDuration: 900, count: 23 },       // 15 min avg
//   { taskType: 'test', avgDuration: 600, count: 12 },      // 10 min avg
// ]
```

## Complete Orchestration Example

### **Scenario: CRM Project with 200 Tasks**

```typescript
// 1. AI Analyst creates tasks
const projectTasks = await analyzeAndCreateTasks({
  projectId: 'crm-proj',
  description: 'Build enterprise CRM system',
});

// 200 tasks created with dependencies

// 2. Start orchestrator
const orchestrator = new TaskOrchestrator({ maxConcurrent: 15 });
await orchestrator.start();

// 3. Wave 1: 15 tasks start (no dependencies)
// Worktrees: task-001 to task-015
// Agents: Spawned in parallel

// 4. As tasks complete, hooks unblock dependents
// Wave 2: task-016 to task-030 start
// Wave 3: task-031 to task-045 start
// ...

// 5. Timeline:
// Hour 1: 15 tasks complete (auth, users, CRUD)
// Hour 2: 20 tasks complete (middleware, APIs)
// Hour 3: 25 tasks complete (UI components)
// Hour 4: 30 tasks complete (features, integrations)
// Hour 5: 25 tasks complete (tests)
// Hour 6: 20 tasks complete (E2E tests, docs)
// Hour 7: 15 tasks complete (review, polish)

// Total: 200 tasks in ~7 hours (vs. ~100 hours sequential)
```

## Observability Without Expensive APM

### **Structured Logging to PostgreSQL**

Instead of expensive APM tools (Datadog, New Relic), use PostgreSQL-based observability:

```typescript
// Execution logs table (already exists)
export const executionLogs = pgTable('execution_logs', {
  id: serial('id').primaryKey(),
  taskId: varchar('task_id', { length: 255 }),
  sessionId: varchar('session_id', { length: 255 }),

  level: varchar('level', { length: 20 }).notNull(), // info, warn, error, debug
  message: text('message').notNull(),
  metadata: jsonb('metadata'), // Structured data

  timestamp: timestamp('timestamp').defaultNow().notNull(),

  // Performance tracking
  duration: integer('duration'), // milliseconds
  memoryUsage: integer('memory_usage'), // MB
});

// Hook logging example (post-tool-use.ts)
await db.insert(executionLogs).values({
  taskId: session_id,
  sessionId: session_id,
  level: 'info',
  message: `Tool executed: ${tool_name}`,
  metadata: {
    tool: tool_name,
    success: !error,
    exitCode: result?.exitCode,
  },
  timestamp: new Date(),
  duration: Date.now() - startTime,
});
```

### **Real-Time Monitoring Queries**

```sql
-- Active tasks dashboard
SELECT
  t.id,
  t.title,
  t.status,
  te.phase,
  te.started_at,
  EXTRACT(EPOCH FROM (NOW() - te.started_at)) as running_seconds
FROM tasks t
JOIN task_execution te ON te.task_id = t.id
WHERE t.status = 'running'
ORDER BY te.started_at;

-- Error rate by task type (last hour)
SELECT
  t.type,
  COUNT(*) as total,
  SUM(CASE WHEN el.level = 'error' THEN 1 ELSE 0 END) as errors,
  ROUND(100.0 * SUM(CASE WHEN el.level = 'error' THEN 1 ELSE 0 END) / COUNT(*), 2) as error_rate
FROM execution_logs el
JOIN tasks t ON t.id = el.task_id
WHERE el.timestamp > NOW() - INTERVAL '1 hour'
GROUP BY t.type;

-- Slowest tasks (for optimization)
SELECT
  t.id,
  t.title,
  te.phase,
  EXTRACT(EPOCH FROM (te.completed_at - te.started_at)) as duration_seconds
FROM tasks t
JOIN task_execution te ON te.task_id = t.id
WHERE te.completed_at IS NOT NULL
ORDER BY duration_seconds DESC
LIMIT 20;

-- Circuit breaker events
SELECT *
FROM audit_log
WHERE action IN ('circuit_breaker_open', 'task_rollback', 'rollback_failed')
ORDER BY timestamp DESC
LIMIT 50;
```

### **Simple Performance Tracking**

```typescript
// Add to hooks for automatic performance tracking
class PerformanceTracker {
  private startTimes = new Map<string, number>();

  start(key: string) {
    this.startTimes.set(key, Date.now());
  }

  end(key: string, metadata?: any) {
    const start = this.startTimes.get(key);
    if (!start) return;

    const duration = Date.now() - start;

    // Log to database (no external APM needed)
    db.insert(executionLogs).values({
      taskId: process.env.TASK_ID,
      level: 'info',
      message: `Performance: ${key}`,
      metadata: { ...metadata, duration },
      duration,
      timestamp: new Date(),
    });

    this.startTimes.delete(key);
  }
}

// Usage in hooks
const perf = new PerformanceTracker();

perf.start('tool-execution');
// ... tool executes ...
perf.end('tool-execution', { tool: tool_name });
```

### **Alert Conditions (Database Queries)**

```typescript
// Run periodically to check for issues
async function checkAlertConditions() {
  // 1. Too many failures
  const recentFailures = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(
      and(
        eq(tasks.status, 'failed'),
        sql`created_at > NOW() - INTERVAL '10 minutes'`
      )
    );

  if (recentFailures[0].count > 5) {
    console.error('ALERT: High failure rate detected');
    // Send notification (email, Slack, etc.)
  }

  // 2. Circuit breaker opened
  const circuitBreakerEvents = await db
    .select()
    .from(auditLog)
    .where(
      and(
        eq(auditLog.action, 'circuit_breaker_open'),
        sql`timestamp > NOW() - INTERVAL '5 minutes'`
      )
    );

  if (circuitBreakerEvents.length > 0) {
    console.error('ALERT: Circuit breaker opened - system paused');
  }

  // 3. Slow tasks (over 30 minutes)
  const slowTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.status, 'running'),
        sql`created_at < NOW() - INTERVAL '30 minutes'`
      )
    );

  if (slowTasks.length > 0) {
    console.warn('WARNING: Long-running tasks detected:', slowTasks.map(t => t.id));
  }
}

// Run every 5 minutes
setInterval(checkAlertConditions, 5 * 60 * 1000);
```

### **Cost: $0 (uses existing PostgreSQL)**

This approach provides:
- ✅ Structured logging with full-text search
- ✅ Performance metrics and duration tracking
- ✅ Real-time queries for monitoring
- ✅ Alert conditions without external services
- ✅ Historical analysis via SQL

**Future enhancement:** Export logs to cheap object storage (S3) for long-term retention.

## Cost Governance & Token Tracking

### **Token Usage Tracking**

Track AI API costs in real-time without expensive third-party tools:

```typescript
// Add to database schema
export const tokenUsage = pgTable('token_usage', {
  id: serial('id').primaryKey(),
  taskId: varchar('task_id', { length: 255 }),
  projectId: varchar('project_id', { length: 255 }),
  userId: varchar('user_id', { length: 255 }),

  phase: varchar('phase', { length: 50 }), // PLAN, CODE, TEST, REVIEW
  model: varchar('model', { length: 100 }), // claude-sonnet-4.5, etc.

  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),

  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 6 }), // USD

  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Hook integration (post-tool-use.ts)
// Track token usage from Claude API responses
if (result?.usage) {
  const { input_tokens, output_tokens } = result.usage;

  // Calculate cost (example rates for Claude Sonnet 4.5)
  const inputCostPer1M = 3.00;  // $3 per 1M input tokens
  const outputCostPer1M = 15.00; // $15 per 1M output tokens

  const cost = (
    (input_tokens / 1_000_000) * inputCostPer1M +
    (output_tokens / 1_000_000) * outputCostPer1M
  );

  await db.insert(tokenUsage).values({
    taskId: process.env.TASK_ID,
    projectId: process.env.PROJECT_ID,
    userId: process.env.USER_ID,
    phase: getCurrentPhase(),
    model: 'claude-sonnet-4.5',
    inputTokens: input_tokens,
    outputTokens: output_tokens,
    totalTokens: input_tokens + output_tokens,
    estimatedCost: cost.toFixed(6),
    timestamp: new Date(),
  });
}
```

### **Budget Enforcement**

```typescript
// Project budget limits
export const projectBudgets = pgTable('project_budgets', {
  projectId: varchar('project_id', { length: 255 }).primaryKey(),
  monthlyBudget: decimal('monthly_budget', { precision: 10, scale: 2 }), // USD
  alertThreshold: decimal('alert_threshold', { precision: 5, scale: 2 }), // Percentage (e.g., 80.00)
});

// Check budget before executing task
async function checkBudget(projectId: string): Promise<boolean> {
  // Get current month's spending
  const spending = await db
    .select({
      total: sql<number>`COALESCE(SUM(estimated_cost), 0)`,
    })
    .from(tokenUsage)
    .where(
      and(
        eq(tokenUsage.projectId, projectId),
        sql`timestamp >= date_trunc('month', CURRENT_DATE)`
      )
    );

  // Get budget limit
  const budget = await db.query.projectBudgets.findFirst({
    where: eq(projectBudgets.projectId, projectId),
  });

  if (!budget) return true; // No budget set

  const currentSpending = Number(spending[0].total);
  const budgetLimit = Number(budget.monthlyBudget);
  const threshold = Number(budget.alertThreshold);

  // Check if over budget
  if (currentSpending >= budgetLimit) {
    console.error(`❌ BUDGET EXCEEDED: Project ${projectId} spent $${currentSpending.toFixed(2)} (limit: $${budgetLimit})`);

    // Log budget violation
    await db.insert(auditLog).values({
      action: 'budget_exceeded',
      metadata: {
        projectId,
        currentSpending,
        budgetLimit,
      },
      timestamp: new Date(),
    });

    return false; // Block execution
  }

  // Check if approaching limit
  if (currentSpending >= budgetLimit * (threshold / 100)) {
    console.warn(`⚠️  BUDGET WARNING: Project ${projectId} at ${((currentSpending / budgetLimit) * 100).toFixed(1)}% of budget`);

    // Send alert (email, Slack, etc.)
  }

  return true; // Proceed
}

// Add to task orchestrator
async executeTask(task: Task) {
  // Check budget before execution
  const withinBudget = await checkBudget(task.projectId);

  if (!withinBudget) {
    await db.update(tasks)
      .set({
        status: 'blocked',
        error: 'Monthly budget exceeded',
      })
      .where(eq(tasks.id, task.id));

    return;
  }

  // Continue with execution...
}
```

### **Cost Analytics Queries**

```sql
-- Monthly spending by project
SELECT
  project_id,
  DATE_TRUNC('month', timestamp) as month,
  SUM(estimated_cost) as total_cost,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens
FROM token_usage
WHERE timestamp >= NOW() - INTERVAL '6 months'
GROUP BY project_id, DATE_TRUNC('month', timestamp)
ORDER BY month DESC, total_cost DESC;

-- Cost by phase (identify expensive phases)
SELECT
  phase,
  COUNT(*) as executions,
  AVG(estimated_cost) as avg_cost,
  SUM(estimated_cost) as total_cost
FROM token_usage
WHERE project_id = 'proj-123'
GROUP BY phase
ORDER BY total_cost DESC;

-- Most expensive tasks
SELECT
  t.id,
  t.title,
  SUM(tu.estimated_cost) as total_cost,
  SUM(tu.total_tokens) as total_tokens
FROM tasks t
JOIN token_usage tu ON tu.task_id = t.id
GROUP BY t.id, t.title
ORDER BY total_cost DESC
LIMIT 20;

-- Daily burn rate (predict budget exhaustion)
SELECT
  DATE(timestamp) as date,
  SUM(estimated_cost) as daily_cost,
  AVG(SUM(estimated_cost)) OVER (
    ORDER BY DATE(timestamp)
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as seven_day_avg
FROM token_usage
WHERE project_id = 'proj-123'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

### **Cost Dashboard (Simple HTML/React)**

```typescript
// API endpoint: GET /api/projects/:id/costs
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const projectId = params.id;

  // Current month spending
  const monthSpending = await db
    .select({ total: sql<number>`SUM(estimated_cost)` })
    .from(tokenUsage)
    .where(
      and(
        eq(tokenUsage.projectId, projectId),
        sql`timestamp >= date_trunc('month', CURRENT_DATE)`
      )
    );

  // Budget limit
  const budget = await db.query.projectBudgets.findFirst({
    where: eq(projectBudgets.projectId, projectId),
  });

  // Phase breakdown
  const byPhase = await db
    .select({
      phase: tokenUsage.phase,
      cost: sql<number>`SUM(estimated_cost)`,
    })
    .from(tokenUsage)
    .where(eq(tokenUsage.projectId, projectId))
    .groupBy(tokenUsage.phase);

  return Response.json({
    currentSpending: Number(monthSpending[0]?.total || 0),
    budgetLimit: Number(budget?.monthlyBudget || 0),
    percentUsed: budget
      ? (Number(monthSpending[0]?.total || 0) / Number(budget.monthlyBudget)) * 100
      : 0,
    byPhase,
  });
}
```

### **Benefits of Database-Based Cost Tracking**

- ✅ **Real-time visibility** - No waiting for monthly bills
- ✅ **Granular tracking** - Per task, phase, and project
- ✅ **Budget enforcement** - Prevent runaway costs
- ✅ **Trend analysis** - Identify expensive patterns
- ✅ **Zero third-party costs** - Uses existing PostgreSQL

**Cost: $0 (uses existing infrastructure)**

## Best Practices

1. **Design tasks to be independent** - Minimize dependencies for max parallelism
2. **Set realistic dependencies** - Don't over-constrain (allows more parallel execution)
3. **Monitor resource usage** - Adjust maxConcurrent based on CPU/RAM
4. **Use pnpm for installs** - Faster, less disk usage across worktrees
5. **Cleanup completed worktrees** - Free disk space promptly
6. **Preserve failed worktrees** - Keep for debugging, clean manually later
7. **Log everything to database** - Queryable audit trail via hooks
8. **Set task priorities** - High-priority tasks execute first
9. **Handle failures gracefully** - Automatic rollback + circuit breaker
10. **Monitor dashboard in real-time** - Track progress, identify bottlenecks
11. **CRITICAL: Check circuit breaker alerts** - Manual intervention needed if triggered
12. **Review audit logs regularly** - Look for rollback failures or security events

## Summary

Sentra's task orchestration enables:

- ✅ **Massively parallel execution** - 10-20+ tasks simultaneously
- ✅ **Hook-based coordination** - Database-driven state management
- ✅ **Dependency resolution** - Automatic unblocking of dependent tasks
- ✅ **Resource management** - Port allocation, concurrency limits
- ✅ **Failure handling** - Retry, skip, manual intervention
- ✅ **Real-time monitoring** - Live dashboard with task status
- ✅ **10-14x speed improvement** - Complete projects in hours, not days

**Result:** Build complex applications autonomously at unprecedented speed.
