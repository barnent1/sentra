# Hooks System

## Overview

Sentra uses **Claude Code hooks** to coordinate parallel autonomous development. Hooks are TypeScript scripts that execute at specific lifecycle points, enabling security enforcement, task coordination, and database logging—all without file clutter.

**Key Principle:** Hooks write to PostgreSQL (not files) for queryable, persistent, multi-agent coordination.

## Hook Fundamentals

### **What are Claude Code Hooks?**

Hooks are executable scripts triggered by Claude Code at specific points in the execution lifecycle:

- **`pre-tool-use`** → Before any tool execution (security, validation)
- **`post-tool-use`** → After tool execution (logging, state updates)
- **`pre-compact`** → Before context window compression
- **`notification`** → When notifications occur
- **`user-prompt-submit`** → When user submits a prompt
- **`stop`** → When main session ends
- **`subagent-stop`** → When subagent session ends

### **Hook Location**

Hooks live in `.claude/hooks/` and are **committed to git**:

```
project/
├── .claude/
│   ├── hooks/                  # Hooks (committed to git)
│   │   ├── pre-tool-use.ts     # Security & validation
│   │   ├── post-tool-use.ts    # Logging & coordination
│   │   ├── pre-compact.ts      # Context compression logging
│   │   ├── notification.ts     # Notification logging
│   │   ├── user-prompt-submit.ts # Prompt validation
│   │   ├── stop.ts             # Cleanup & finalization
│   │   └── subagent-stop.ts    # Subagent cleanup
│   └── commands/               # Slash commands
└── .sentra/
    └── worktrees/
        └── task-123/
            └── .claude/        # ✅ Auto from git (same hooks)
```

**Distribution:** Git worktrees automatically get `.claude/hooks/` when created (see `25-worktree-architecture.md`).

## Hook Input/Output

### **Input (stdin)**

Hooks receive JSON via stdin:

```json
{
  "session_id": "task-abc123",
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf /important",
    "description": "Clean up files"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "user_id": "user-xyz",
  "project_id": "proj-123"
}
```

### **Output (exit codes)**

Hooks communicate via exit codes:

- **Exit 0:** Allow execution (success)
- **Exit 1:** Log error but continue
- **Exit 2:** **Block execution** and show error to Claude

```typescript
// Example: Block dangerous command
if (isDangerousCommand(command)) {
  console.error('BLOCKED: Dangerous rm -rf command detected');
  process.exit(2); // ← Blocks tool execution
}
```

### **Error Messages (stderr)**

Messages written to stderr are shown to Claude:

```typescript
console.error('BLOCKED: Access to .env files is prohibited');
process.exit(2);
```

Claude sees: `"BLOCKED: Access to .env files is prohibited"`

## Hook Implementation (TypeScript)

### **Why TypeScript (Not Python)?**

1. ✅ **Same language as codebase** (Next.js/TypeScript)
2. ✅ **Native database access** (Drizzle ORM)
3. ✅ **Type safety** for hook payloads
4. ✅ **Easy to maintain** (one language for everything)
5. ✅ **No Python dependencies** in production

### **Hook Structure**

All hooks follow this pattern:

```typescript
#!/usr/bin/env tsx

import { db } from '@/lib/db';
import { hookEvents } from '@/lib/db/schema';

async function main() {
  try {
    // 1. Read JSON from stdin
    const input = JSON.parse(await readStdin());

    // 2. Extract data
    const { session_id, tool_name, tool_input } = input;

    // 3. Perform hook logic
    // ... (security checks, logging, coordination, etc.)

    // 4. Write to database (not files!)
    await db.insert(hookEvents).values({
      sessionId: session_id,
      hookName: 'pre-tool-use',
      eventData: input,
      timestamp: new Date(),
    });

    // 5. Exit with appropriate code
    process.exit(0); // Allow
  } catch (error) {
    console.error(error.message);
    process.exit(1); // Log error but continue
  }
}

main();
```

### **Shared Utilities**

Create reusable utilities in `.claude/hooks/utils/`:

```typescript
// .claude/hooks/utils/db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

// .claude/hooks/utils/stdin.ts
export async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}
```

## Database Schema

Hooks write to PostgreSQL for coordination:

```typescript
// Database tables for hook events
export const hookEvents = pgTable('hook_events', {
  id: serial('id').primaryKey(),

  sessionId: varchar('session_id', { length: 255 }).notNull(),
  taskId: varchar('task_id', { length: 255 }), // Derived from session
  hookName: varchar('hook_name', { length: 100 }).notNull(),
  // 'pre_tool_use' | 'post_tool_use' | 'stop' | etc.

  eventData: jsonb('event_data').notNull(),
  // Full hook payload

  timestamp: timestamp('timestamp').defaultNow().notNull(),

  // Indexes for fast queries
  sessionIdx: index('hook_session_idx').on(sessionId),
  hookNameIdx: index('hook_name_idx').on(hookName),
});

// Task execution state (updated by hooks)
export const taskExecution = pgTable('task_execution', {
  id: serial('id').primaryKey(),
  taskId: varchar('task_id', { length: 255 }).notNull().unique(),

  sessionId: varchar('session_id', { length: 255 }),
  worktreePath: varchar('worktree_path', { length: 500 }),

  status: varchar('status', { length: 50 }).notNull(),
  // 'pending' | 'running' | 'completed' | 'failed' | 'blocked'

  phase: varchar('phase', { length: 50 }),
  // 'PLAN' | 'CODE' | 'TEST' | 'REVIEW'

  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  metadata: jsonb('metadata'), // Error details, resources, etc.
});
```

## Security Hooks

### **`pre-tool-use.ts` - Security Guard**

Blocks dangerous operations before execution:

```typescript
#!/usr/bin/env tsx

import { readStdin } from './utils/stdin';
import { db } from './utils/db';
import { hookEvents } from '@/lib/db/schema';

// Dangerous command patterns
const DANGEROUS_PATTERNS = [
  /\brm\s+.*-[a-z]*r[a-z]*f/i,        // rm -rf
  /\brm\s+.*-[a-z]*f[a-z]*r/i,        // rm -fr
  /\brm\s+--recursive\s+--force/i,    // rm --recursive --force
];

// Sensitive file patterns
const SENSITIVE_FILES = [
  /\.env$/,                           // .env (not .env.sample)
  /\.env\.local$/,
  /\.env\.production$/,
  /credentials\.json$/,
  /\.ssh\//,
];

async function main() {
  const input = JSON.parse(await readStdin());
  const { session_id, tool_name, tool_input } = input;

  // Check for dangerous bash commands
  if (tool_name === 'Bash') {
    const command = tool_input.command || '';

    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        console.error('BLOCKED: Dangerous rm command detected');
        await logBlock(session_id, 'dangerous_command', { command });
        process.exit(2); // ← Block execution
      }
    }
  }

  // Check for sensitive file access
  if (['Read', 'Edit', 'Write'].includes(tool_name)) {
    const filePath = tool_input.file_path || '';

    for (const pattern of SENSITIVE_FILES) {
      if (pattern.test(filePath)) {
        console.error('BLOCKED: Access to sensitive files prohibited');
        await logBlock(session_id, 'sensitive_file', { filePath });
        process.exit(2); // ← Block execution
      }
    }
  }

  // Log allowed tool use
  await db.insert(hookEvents).values({
    sessionId: session_id,
    hookName: 'pre_tool_use',
    eventData: input,
  });

  process.exit(0); // ✅ Allow
}

async function logBlock(sessionId: string, reason: string, details: any) {
  await db.insert(hookEvents).values({
    sessionId,
    hookName: 'pre_tool_use_blocked',
    eventData: { reason, details },
  });
}

main();
```

### **Dependency Checking**

Block task execution if dependencies not satisfied:

```typescript
// Check task dependencies
const task = await db.query.tasks.findFirst({
  where: eq(tasks.sessionId, session_id),
});

if (!task) {
  console.error('BLOCKED: Task not found in database');
  process.exit(2);
}

// Check if dependencies are completed
const dependencies = await db.query.tasks.findMany({
  where: inArray(tasks.id, task.dependencies),
});

const allComplete = dependencies.every(d => d.status === 'completed');

if (!allComplete) {
  console.error('BLOCKED: Task dependencies not satisfied');
  process.exit(2);
}
```

### **Resource Limits**

Prevent too many concurrent tasks:

```typescript
// Count active worktrees
const activeCount = await db
  .select({ count: sql<number>`count(*)` })
  .from(taskExecution)
  .where(eq(taskExecution.status, 'running'));

const MAX_PARALLEL = 15;

if (activeCount[0].count >= MAX_PARALLEL) {
  console.error(`BLOCKED: Max parallel tasks (${MAX_PARALLEL}) reached`);
  process.exit(2);
}
```

## Coordination Hooks

### **`post-tool-use.ts` - Task State Updates**

Log execution and update task state:

```typescript
#!/usr/bin/env tsx

import { readStdin } from './utils/stdin';
import { db } from './utils/db';
import { hookEvents, taskExecution, tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const input = JSON.parse(await readStdin());
  const { session_id, tool_name, tool_input, result } = input;

  // Log tool execution
  await db.insert(hookEvents).values({
    sessionId: session_id,
    hookName: 'post_tool_use',
    eventData: input,
  });

  // Detect phase transitions
  if (tool_name === 'SlashCommand') {
    const command = tool_input.command;

    // Update phase based on command
    if (command.includes('/plan')) {
      await updatePhase(session_id, 'PLAN');
    } else if (command.includes('/code')) {
      await updatePhase(session_id, 'CODE');
    } else if (command.includes('/test')) {
      await updatePhase(session_id, 'TEST');
    } else if (command.includes('/review')) {
      await updatePhase(session_id, 'REVIEW');
    }
  }

  // Detect task completion (PR created)
  if (tool_name === 'Bash' && tool_input.command?.includes('gh pr create')) {
    await markTaskComplete(session_id);
  }

  process.exit(0);
}

async function updatePhase(sessionId: string, phase: string) {
  await db.update(taskExecution)
    .set({ phase })
    .where(eq(taskExecution.sessionId, sessionId));
}

async function markTaskComplete(sessionId: string) {
  // Update task status
  await db.update(tasks)
    .set({
      status: 'completed',
      completedAt: new Date(),
    })
    .where(eq(tasks.sessionId, sessionId));

  // Unblock dependent tasks
  const completedTask = await db.query.tasks.findFirst({
    where: eq(tasks.sessionId, sessionId),
  });

  if (completedTask) {
    await db.update(tasks)
      .set({ status: 'pending' })
      .where(sql`${completedTask.id} = ANY(dependencies)`);
  }
}

main();
```

### **`stop.ts` - Cleanup & Finalization**

Clean up when task session ends:

```typescript
#!/usr/bin/env tsx

import { readStdin } from './utils/stdin';
import { db } from './utils/db';
import { hookEvents, taskExecution } from '@/lib/db/schema';
import { exec } from 'child_process';
import { promisify } from 'util';
import { eq } from 'drizzle-orm';

const execAsync = promisify(exec);

async function main() {
  const input = JSON.parse(await readStdin());
  const { session_id, transcript_path, stop_hook_active } = input;

  // Log stop event
  await db.insert(hookEvents).values({
    sessionId: session_id,
    hookName: 'stop',
    eventData: input,
  });

  // Get task info
  const execution = await db.query.taskExecution.findFirst({
    where: eq(taskExecution.sessionId, session_id),
  });

  if (!execution) {
    process.exit(0);
  }

  // Store transcript in database (not files!)
  if (transcript_path) {
    const transcript = await readTranscript(transcript_path);
    await db.update(taskExecution)
      .set({ metadata: { transcript } })
      .where(eq(taskExecution.sessionId, session_id));
  }

  // Cleanup worktree if task completed
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.sessionId, session_id),
  });

  if (task?.status === 'completed' && execution.worktreePath) {
    await execAsync(`git worktree remove ${execution.worktreePath} --force`);
    console.log(`Cleaned up worktree: ${execution.worktreePath}`);
  }

  // If task failed, preserve worktree for debugging
  if (task?.status === 'failed') {
    console.log(`Worktree preserved for debugging: ${execution.worktreePath}`);
  }

  process.exit(0);
}

async function readTranscript(path: string): Promise<any[]> {
  const fs = require('fs/promises');
  const content = await fs.readFile(path, 'utf-8');

  // Parse JSONL (one JSON object per line)
  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}

main();
```

## Logging Hooks

### **`notification.ts` - Notification Events**

```typescript
#!/usr/bin/env tsx

import { readStdin } from './utils/stdin';
import { db } from './utils/db';
import { hookEvents } from '@/lib/db/schema';

async function main() {
  const input = JSON.parse(await readStdin());

  await db.insert(hookEvents).values({
    sessionId: input.session_id,
    hookName: 'notification',
    eventData: input,
  });

  process.exit(0);
}

main();
```

### **`pre-compact.ts` - Context Compression**

```typescript
#!/usr/bin/env tsx

import { readStdin } from './utils/stdin';
import { db } from './utils/db';
import { hookEvents } from '@/lib/db/schema';

async function main() {
  const input = JSON.parse(await readStdin());

  // Log context compression event
  await db.insert(hookEvents).values({
    sessionId: input.session_id,
    hookName: 'pre_compact',
    eventData: input,
  });

  // Could warn if compacting too frequently
  const recentCompacts = await db.query.hookEvents.findMany({
    where: and(
      eq(hookEvents.sessionId, input.session_id),
      eq(hookEvents.hookName, 'pre_compact'),
      gt(hookEvents.timestamp, new Date(Date.now() - 5 * 60 * 1000)) // Last 5 min
    ),
  });

  if (recentCompacts.length > 3) {
    console.warn('WARNING: Frequent context compaction detected');
  }

  process.exit(0);
}

main();
```

## Prompt Validation

### **`user-prompt-submit.ts` - Validate User Input**

```typescript
#!/usr/bin/env tsx

import { readStdin } from './utils/stdin';
import { db } from './utils/db';
import { hookEvents } from '@/lib/db/schema';

// Blocked patterns (customize as needed)
const BLOCKED_PATTERNS = [
  /jailbreak/i,
  /ignore.*instructions/i,
  // Add custom rules
];

async function main() {
  const input = JSON.parse(await readStdin());
  const { session_id, prompt } = input;

  // Log prompt
  await db.insert(hookEvents).values({
    sessionId: session_id,
    hookName: 'user_prompt_submit',
    eventData: input,
  });

  // Validate prompt
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      console.error('BLOCKED: Prompt contains blocked pattern');
      process.exit(2); // Block prompt
    }
  }

  // Optionally inject context
  // console.log(`[Context: Running in task ${session_id}]`);

  process.exit(0);
}

main();
```

## Running Hooks (Development)

### **Make Hooks Executable**

```bash
chmod +x .claude/hooks/*.ts
```

### **Test Hook Locally**

```bash
# Test pre-tool-use hook
echo '{
  "session_id": "test-123",
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf /"
  }
}' | .claude/hooks/pre-tool-use.ts

# Should output: BLOCKED: Dangerous rm command detected
# Exit code: 2
```

### **Test with tsx**

```bash
npm install -g tsx

# Run hook
echo '{"session_id": "test"}' | tsx .claude/hooks/pre-tool-use.ts
```

## Hook Execution Flow

```
┌─────────────────┐
│  User Action    │
│  or Agent Task  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  user-prompt-submit hook    │ ← Validate user input
│  (blocks if invalid)         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Claude processes prompt    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  pre-tool-use hook          │ ← Security checks
│  (blocks if dangerous)       │   Dependency checks
└────────┬────────────────────┘   Resource limits
         │
         ▼
┌─────────────────────────────┐
│  Tool executes              │
│  (Bash, Edit, etc.)         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  post-tool-use hook         │ ← Log execution
│  (logs, updates state)       │   Update task phase
└────────┬────────────────────┘   Mark complete
         │
         ▼
┌─────────────────────────────┐
│  Session continues or ends  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  stop hook                  │ ← Cleanup worktree
│  (cleanup, finalize)         │   Store transcript
└─────────────────────────────┘   Update database
```

## Best Practices

1. **Exit codes matter:** Use `0` to allow, `2` to block
2. **Database, not files:** Write to PostgreSQL for coordination
3. **Type safety:** Use TypeScript interfaces for hook payloads
4. **Error handling:** Always try/catch to prevent crashes
5. **Performance:** Keep hooks fast (< 100ms)
6. **Logging:** Use structured JSON for queryable logs
7. **Testing:** Test hooks locally before committing
8. **Security:** Block dangerous operations in `pre-tool-use`
9. **Coordination:** Update task state in `post-tool-use`
10. **Cleanup:** Clean up resources in `stop` hook

## Querying Hook Data

```typescript
// Get all events for a task
const events = await db.query.hookEvents.findMany({
  where: eq(hookEvents.sessionId, 'task-abc123'),
  orderBy: [asc(hookEvents.timestamp)],
});

// Find blocked operations
const blocked = await db.query.hookEvents.findMany({
  where: eq(hookEvents.hookName, 'pre_tool_use_blocked'),
});

// Get task execution timeline
const timeline = await db
  .select({
    phase: taskExecution.phase,
    timestamp: hookEvents.timestamp,
  })
  .from(taskExecution)
  .leftJoin(hookEvents, eq(hookEvents.sessionId, taskExecution.sessionId))
  .where(eq(taskExecution.taskId, 'task-abc123'));
```

## Summary

Sentra's hook system provides:

- ✅ **Security:** Block dangerous operations before execution
- ✅ **Coordination:** Update task state across parallel agents
- ✅ **Logging:** Queryable database logs (not files)
- ✅ **Validation:** Check dependencies and resources
- ✅ **Cleanup:** Automatic worktree cleanup
- ✅ **TypeScript:** Type-safe, maintainable hooks
- ✅ **Git Distribution:** Automatic deployment via worktrees

**Next:** See `27-task-orchestration.md` for how hooks coordinate parallel task execution.
