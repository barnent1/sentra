# Workflow Execution Model

## Overview

Sentra's workflow execution model is designed for **hands-off, parallel, isolated execution** of small atomic units of work. Each task runs in its own git worktree, with complete environment isolation, comprehensive database logging, and real-time dashboard updates.

## The Sentra Workflow Pattern

```
Task Dashboard → MCP Server → Worktree Creation → Environment Setup → Agent Execution → Git Operations → Database Logging → Dashboard Updates
```

Every workflow follows this pattern, ensuring consistency, isolation, and observability.

## 1. Task Dashboard (Command Center)

**Naming:** The central UI where users create and monitor tasks. Potential names:
- **Task Dashboard** (simple, clear)
- **Command Center** (emphasizes control)
- **Work Dashboard** (general purpose)
- **Mission Control** (space-age feel)

**Recommendation:** **Task Dashboard** - clear, professional, intuitive

### Task Creation UI

```typescript
interface TaskCreationForm {
  title: string;
  description: string;
  type: 'chore' | 'bug' | 'feature'; // Dropdown selector
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
}
```

**UI Features:**
- **Type Dropdown**: Preset classification (chore/bug/feature)
- **Auto-start**: Optionally trigger workflow immediately on creation
- **Template**: Pre-fill from common task patterns

### Task Detail View

```
┌─────────────────────────────────────────────────┐
│ Task: Add user authentication                   │
│ Type: feature  Priority: high  Status: coding   │
├─────────────────────────────────────────────────┤
│ [📋 Details] [📊 Progress] [📝 Logs] [🌿 Branch]│
│                                                 │
│ Phase Progress:                                 │
│ ✅ PLAN    ▶️ CODE    ⏸ TEST    ⏸ REVIEW       │
│                                                 │
│ Real-time Updates:                              │
│ [Stream of status messages from agents...]      │
│                                                 │
│ [📝 View Logs] ← Click to open log viewer       │
└─────────────────────────────────────────────────┘
```

**Log Viewer Icon**: Opens modal/drawer with filterable logs
- Filter by phase (PLAN/CODE/TEST/REVIEW)
- Filter by level (info/warn/error)
- Search logs
- Real-time streaming

## 2. Git Worktree Isolation

### Why Worktrees?

Git worktrees enable **parallel execution** of multiple tasks without interference:
- Each task = separate working directory
- All share the same .git repository
- No conflicts between concurrent tasks
- Easy cleanup when done

### Worktree Structure

```
project-root/
├── .git/                    # Shared git repository
├── main-codebase/           # Main development branch
│   ├── app/
│   ├── lib/
│   └── package.json
│
└── .sentra/
    └── worktrees/           # Isolated task worktrees
        ├── task-abc123/     # Task 1 worktree
        │   ├── app/
        │   ├── lib/
        │   ├── package.json
        │   ├── .env.local   # Custom ports for this task
        │   └── node_modules/
        │
        └── task-xyz789/     # Task 2 worktree (parallel)
            ├── app/
            ├── lib/
            └── ...
```

### MCP Server Worktree Management

**Challenge:** MCP server needs filesystem access to create/manage worktrees

**Solution:** MCP server runs on Fly.io with persistent volume

```typescript
// MCP tool for worktree creation
const createWorktreeTool = tool(
  'create_worktree',
  'Create an isolated git worktree for a task',
  z.object({
    taskId: z.string(),
    branchName: z.string(),
  }),
  async (args) => {
    const worktreePath = `/app/.sentra/worktrees/${args.taskId}`;

    // Create worktree
    await git.raw([
      'worktree',
      'add',
      '-b',
      args.branchName,
      worktreePath,
      'main'
    ]);

    // Store worktree info in database
    await db.insert(worktrees).values({
      taskId: args.taskId,
      path: worktreePath,
      branchName: args.branchName,
      createdAt: new Date(),
    });

    return { success: true, path: worktreePath };
  }
);
```

### Worktree Lifecycle

1. **Create**: When task starts PLAN phase
2. **Setup**: Install dependencies, configure environment
3. **Execute**: Run all SDLC phases in this worktree
4. **Cleanup**: Remove worktree after merge or cancellation

```typescript
// Cleanup after PR merge
async function cleanupWorktree(taskId: string) {
  const worktree = await getWorktree(taskId);

  // Remove worktree
  await git.raw(['worktree', 'remove', worktree.path]);

  // Update database
  await db.update(worktrees)
    .set({ deletedAt: new Date() })
    .where(eq(worktrees.taskId, taskId));
}
```

## 3. Environment Setup

### Port Allocation

Each worktree needs unique ports to avoid conflicts when running the app:

```typescript
// Deterministic port assignment
function allocatePorts(taskId: string): { backend: number; frontend: number } {
  const hash = hashString(taskId);
  const basePort = 3000;
  const range = 1000; // Ports 3000-3999

  const offset = hash % range;

  return {
    frontend: basePort + offset,
    backend: basePort + offset + 100,
  };
}
```

### Environment Configuration

```typescript
// .sentra/worktrees/task-abc123/.env.local
NEXT_PUBLIC_FRONTEND_PORT=3142
BACKEND_PORT=3242
DATABASE_URL=postgresql://localhost:5432/sentra_dev
TASK_ID=task-abc123
ADW_ID=adw-1234567890
```

### Dependency Installation

```typescript
async function setupWorktreeEnvironment(worktreePath: string) {
  // Install dependencies
  await exec('npm install', { cwd: worktreePath });

  // Run database migrations (if needed)
  await exec('npm run db:migrate', { cwd: worktreePath });

  // Build application (if needed)
  await exec('npm run build', { cwd: worktreePath });

  logger.info('Worktree environment ready');
}
```

### Agent Execution Context

All agents execute with worktree as working directory:

```typescript
const result = query({
  prompt: 'Implement user authentication feature',
  options: {
    systemPrompt: await getAgentPrompt('coder'),
    allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'],
    cwd: worktreePath, // Execute in worktree
    permissionMode: 'acceptAll',
  },
});
```

## 4. Git Workflow Pattern

Every task follows this git workflow:

```
main
 │
 ├─→ feature/task-branch (in worktree)
 │   │
 │   ├─ Commit: "plan: Implementation plan for X"
 │   ├─ Commit: "code: Implement X"
 │   ├─ Commit: "test: Add tests for X"
 │   └─ Commit: "review: Address review feedback"
 │   │
 │   └─→ Pull Request
 │       │
 │       └─→ Merge to main
 │
main (updated)
```

### Branch Naming Convention

```typescript
function generateBranchName(
  type: 'chore' | 'bug' | 'feature',
  title: string,
  taskId: string
): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 40);

  return `${type}/${slug}-${taskId.substring(0, 8)}`;
}

// Examples:
// feature/add-user-auth-abc12345
// bug/fix-login-redirect-xyz67890
// chore/update-deps-def45678
```

### Commit Message Pattern

```
<phase>: <description>

Type: <chore|bug|feature>
Task ID: <task-id>
ADW ID: <adw-id>

[Additional context]
```

**Examples:**
```
plan: Add implementation plan for user authentication

Type: feature
Task ID: task-abc123
ADW ID: adw-1234567890
```

```
code: Implement JWT authentication middleware

Type: feature
Task ID: task-abc123
ADW ID: adw-1234567890

- Added JWT token generation
- Created auth middleware
- Updated API routes
```

## 5. Database Logging Architecture

### The Problem with Console Logs

Traditional `console.log()` goes to stdout and is lost. In a multi-agent, parallel system, logs must be:
- **Persistent**: Stored in database
- **Queryable**: Filter by task, phase, level
- **Streamable**: Real-time to dashboard
- **Contextual**: Include task/agent/phase metadata

### Log Schema

```typescript
// Drizzle schema
export const logs = pgTable('logs', {
  id: serial('id').primaryKey(),
  taskId: varchar('task_id', { length: 255 }).notNull(),
  adwId: varchar('adw_id', { length: 255 }).notNull(),
  phase: varchar('phase', { length: 50 }), // PLAN, CODE, TEST, REVIEW
  level: varchar('level', { length: 20 }).notNull(), // info, warn, error, debug
  message: text('message').notNull(),
  metadata: jsonb('metadata'), // Additional context
  timestamp: timestamp('timestamp').defaultNow().notNull(),

  // Indexes for fast queries
  taskIdIdx: index('task_id_idx').on(taskId),
  timestampIdx: index('timestamp_idx').on(timestamp),
});

interface LogMetadata {
  agentName?: string;
  toolUsed?: string;
  duration?: number;
  error?: string;
  [key: string]: any;
}
```

### Logger Implementation

```typescript
class DatabaseLogger {
  constructor(
    private taskId: string,
    private adwId: string,
    private phase: string
  ) {}

  async info(message: string, metadata?: LogMetadata) {
    await this.log('info', message, metadata);
    console.log(`[${this.taskId}] ${message}`); // Also console for debugging
  }

  async warn(message: string, metadata?: LogMetadata) {
    await this.log('warn', message, metadata);
    console.warn(`[${this.taskId}] ${message}`);
  }

  async error(message: string, metadata?: LogMetadata) {
    await this.log('error', message, metadata);
    console.error(`[${this.taskId}] ${message}`);
  }

  private async log(
    level: string,
    message: string,
    metadata?: LogMetadata
  ) {
    await db.insert(logs).values({
      taskId: this.taskId,
      adwId: this.adwId,
      phase: this.phase,
      level,
      message,
      metadata,
    });

    // Stream to dashboard via WebSocket
    await broadcastLog({
      taskId: this.taskId,
      level,
      message,
      phase: this.phase,
      timestamp: new Date(),
    });
  }
}
```

### Usage in Workflows

```typescript
async function planWorkflow(taskId: string, adwId: string) {
  const logger = new DatabaseLogger(taskId, adwId, 'PLAN');

  logger.info('Starting planning workflow');

  const task = await fetchTask(taskId);
  logger.info('Task fetched', { taskTitle: task.title });

  const classification = await classifyTask(task, adwId);
  logger.info('Task classified', {
    type: classification.type,
    branchName: classification.branchName,
  });

  // ... continue workflow
}
```

### Log Viewer UI

```typescript
// API route: /api/logs/[taskId]
export async function GET(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  const { searchParams } = new URL(req.url);
  const phase = searchParams.get('phase');
  const level = searchParams.get('level');

  let query = db
    .select()
    .from(logs)
    .where(eq(logs.taskId, params.taskId))
    .orderBy(desc(logs.timestamp));

  if (phase) {
    query = query.where(eq(logs.phase, phase));
  }

  if (level) {
    query = query.where(eq(logs.level, level));
  }

  const taskLogs = await query;

  return Response.json(taskLogs);
}
```

**Dashboard Component:**
```tsx
function LogViewer({ taskId }: { taskId: string }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [phaseFilter, setPhaseFilter] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  // Fetch logs
  useEffect(() => {
    fetchLogs();
  }, [taskId, phaseFilter, levelFilter]);

  // Real-time updates via WebSocket
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000/logs/${taskId}`);

    ws.onmessage = (event) => {
      const newLog = JSON.parse(event.data);
      setLogs(prev => [newLog, ...prev]);
    };

    return () => ws.close();
  }, [taskId]);

  return (
    <div className="log-viewer">
      <div className="filters">
        <Select value={phaseFilter} onChange={setPhaseFilter}>
          <option value="">All Phases</option>
          <option value="PLAN">PLAN</option>
          <option value="CODE">CODE</option>
          <option value="TEST">TEST</option>
          <option value="REVIEW">REVIEW</option>
        </Select>

        <Select value={levelFilter} onChange={setLevelFilter}>
          <option value="">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </Select>
      </div>

      <div className="log-list">
        {logs.map(log => (
          <LogEntry key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}
```

## 6. Atomic Workflow Units

### The Philosophy

**Every SDLC phase is a separate, small, focused workflow.**

Why?
- **Clarity**: Each workflow does ONE thing
- **Reusability**: Compose workflows in different ways
- **Resilience**: Retry individual phases without restarting entire process
- **Parallelization**: Run independent phases concurrently
- **Observability**: Clear boundaries for monitoring

### Atomic Workflow Files

```
workflows/
├── atomic/
│   ├── plan.ts          # PLAN phase only
│   ├── code.ts          # CODE phase only
│   ├── test.ts          # TEST phase only
│   └── review.ts        # REVIEW phase only
│
└── composed/
    ├── plan_code.ts              # PLAN → CODE
    ├── full_sdlc.ts              # PLAN → CODE → TEST → REVIEW
    ├── code_test.ts              # CODE → TEST (skip plan)
    └── iterative_code_test.ts   # CODE ↔ TEST (loop until pass)
```

### Atomic Workflow Example

```typescript
// workflows/atomic/plan.ts
export async function planWorkflow(taskId: string, adwId?: string) {
  const logger = new DatabaseLogger(taskId, adwId || generateAdwId(), 'PLAN');

  logger.info('🚀 PLAN workflow started');

  // 1. Load state
  const state = adwId ? await loadState(adwId) : await initState(taskId);

  // 2. Fetch task
  const task = await fetchTask(taskId);

  // 3. Classify
  const classification = await classifyTask(task, state.adwId);

  // 4. Create worktree & branch
  const worktreePath = await createWorktree(taskId, classification.branchName);

  // 5. Setup environment
  await setupEnvironment(worktreePath);

  // 6. Generate plan
  const planFile = await invokePlanningAgent(task, classification, worktreePath);

  // 7. Commit
  await commitPlan(planFile, worktreePath);

  // 8. Push
  await pushBranch(classification.branchName, worktreePath);

  logger.info('✅ PLAN workflow completed');

  return { success: true, state, worktreePath, planFile };
}
```

```typescript
// workflows/atomic/code.ts
export async function codeWorkflow(taskId: string, adwId: string) {
  const logger = new DatabaseLogger(taskId, adwId, 'CODE');

  logger.info('🚀 CODE workflow started');

  // 1. Load state from PLAN phase
  const state = await loadState(adwId);

  // 2. Load plan file
  const plan = await readPlanFile(state.planFile, state.worktreePath);

  // 3. Invoke coding agent
  const implementation = await invokeCodingAgent(plan, state.worktreePath);

  // 4. Commit code
  await commitCode(implementation, state.worktreePath);

  // 5. Push
  await pushBranch(state.branchName, state.worktreePath);

  logger.info('✅ CODE workflow completed');

  return { success: true, state, implementation };
}
```

### Composed Workflow Example

```typescript
// workflows/composed/full_sdlc.ts
export async function fullSDLCWorkflow(taskId: string) {
  const composedLogger = new DatabaseLogger(taskId, generateAdwId(), 'FULL_SDLC');

  composedLogger.info('🚀 Full SDLC workflow started');

  try {
    // Execute each phase sequentially
    const planResult = await planWorkflow(taskId);
    composedLogger.info('✅ PLAN phase complete');

    const codeResult = await codeWorkflow(taskId, planResult.state.adwId);
    composedLogger.info('✅ CODE phase complete');

    const testResult = await testWorkflow(taskId, planResult.state.adwId);
    composedLogger.info('✅ TEST phase complete');

    const reviewResult = await reviewWorkflow(taskId, planResult.state.adwId);
    composedLogger.info('✅ REVIEW phase complete');

    composedLogger.info('🎉 Full SDLC workflow completed successfully');

    return { success: true, results: { planResult, codeResult, testResult, reviewResult } };
  } catch (error) {
    composedLogger.error('❌ Full SDLC workflow failed', { error: error.message });
    throw error;
  }
}
```

### Iterative Workflow Example

```typescript
// workflows/composed/iterative_code_test.ts
export async function iterativeCodeTestWorkflow(taskId: string, adwId: string) {
  const logger = new DatabaseLogger(taskId, adwId, 'CODE_TEST_LOOP');

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    logger.info(`🔄 Attempt ${attempts + 1}/${maxAttempts}`);

    // Code phase
    await codeWorkflow(taskId, adwId);

    // Test phase
    const testResult = await testWorkflow(taskId, adwId);

    if (testResult.allPassed) {
      logger.info('✅ All tests passed!');
      return { success: true, attempts: attempts + 1 };
    }

    logger.warn(`⚠️ Tests failed, refining implementation...`);

    // Invoke fix agent to address failures
    await fixFailedTests(taskId, adwId, testResult.failures);

    attempts++;
  }

  logger.error('❌ Max attempts reached, tests still failing');
  throw new Error('Tests failed after maximum attempts');
}
```

## 7. Workflow Invocation

### From Dashboard

```typescript
// API route: /api/tasks/[taskId]/execute
export async function POST(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  const { workflowType } = await req.json();

  // Workflow type: 'plan', 'code', 'test', 'review', 'full_sdlc'
  const workflowMap = {
    plan: planWorkflow,
    code: codeWorkflow,
    test: testWorkflow,
    review: reviewWorkflow,
    full_sdlc: fullSDLCWorkflow,
  };

  const workflow = workflowMap[workflowType];

  if (!workflow) {
    return Response.json({ error: 'Invalid workflow type' }, { status: 400 });
  }

  // Execute workflow asynchronously
  executeWorkflowAsync(workflow, params.taskId);

  return Response.json({ message: 'Workflow started' });
}

async function executeWorkflowAsync(
  workflow: (taskId: string) => Promise<any>,
  taskId: string
) {
  try {
    const result = await workflow(taskId);

    // Notify dashboard of completion
    await broadcastTaskUpdate(taskId, {
      type: 'workflow_complete',
      result,
    });
  } catch (error) {
    await broadcastTaskUpdate(taskId, {
      type: 'workflow_failed',
      error: error.message,
    });
  }
}
```

### From MCP Tool

```typescript
const executeWorkflowTool = tool(
  'execute_workflow',
  'Execute a Sentra workflow',
  z.object({
    workflowName: z.enum(['plan', 'code', 'test', 'review', 'full_sdlc']),
    taskId: z.string(),
    adwId: z.string().optional(),
  }),
  async (args) => {
    const workflow = await getWorkflow(args.workflowName);
    const result = await workflow(args.taskId, args.adwId);

    return { success: true, result };
  }
);
```

## 8. Benefits of This Model

| Benefit | Description |
|---------|-------------|
| **Isolation** | Each task in separate worktree = zero interference |
| **Parallelization** | Multiple tasks execute simultaneously |
| **Atomicity** | Small workflows = easy to understand, test, debug |
| **Composability** | Combine atomic workflows for complex orchestration |
| **Observability** | Database logging + real-time streaming = full visibility |
| **Resilience** | Retry individual phases without full restart |
| **Clean Codebase** | No task artifacts in main branch until merged |
| **Hands-off** | Entire SDLC runs autonomously |

## 9. Complete Execution Flow

```
1. User creates task in Task Dashboard
   ↓
2. Task saved to PostgreSQL
   ↓
3. User clicks "Start Full SDLC" button
   ↓
4. Dashboard calls /api/tasks/{taskId}/execute with workflowType: 'full_sdlc'
   ↓
5. Server invokes fullSDLCWorkflow(taskId)
   ↓
6. PLAN phase:
   - Create worktree (.sentra/worktrees/task-{id}/)
   - Create branch (feature/task-branch)
   - Setup environment (npm install, ports)
   - Invoke planning agent
   - Generate plan file
   - Commit plan
   - Push branch
   - Logs streamed to dashboard
   ↓
7. CODE phase:
   - Load plan from worktree
   - Invoke coding agent in worktree
   - Generate implementation
   - Commit code
   - Push
   - Logs streamed to dashboard
   ↓
8. TEST phase:
   - Run test suite in worktree
   - Invoke test generation agent if needed
   - Verify all tests pass
   - Commit tests
   - Push
   - Logs streamed to dashboard
   ↓
9. REVIEW phase:
   - Invoke review agent
   - Code quality checks
   - Security audit
   - Performance review
   - Create PR with review summary
   - Logs streamed to dashboard
   ↓
10. Dashboard shows "✅ All phases complete"
    ↓
11. User reviews PR, merges
    ↓
12. Worktree cleaned up
    ↓
13. Task marked complete in database
```

## Summary

Sentra's workflow execution model achieves **hands-off, autonomous development** through:

1. **Task Dashboard**: Central UI for creating/monitoring tasks
2. **Git Worktree Isolation**: Parallel execution without conflicts
3. **Environment Setup**: Each task has isolated environment
4. **Database Logging**: All logs stored, queryable, streamable
5. **Atomic Workflows**: Small, focused units (plan.ts, code.ts, test.ts, review.ts)
6. **Composed Workflows**: Chain atomics for full SDLC (full_sdlc.ts)
7. **Real-time Updates**: WebSocket streaming to dashboard
8. **Git Workflow**: Branch-per-task, commit-per-phase, PR for review

This architecture enables Sentra to execute complex development workflows with minimal human intervention while maintaining full observability and control.
