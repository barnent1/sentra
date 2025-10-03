# Git Worktree Architecture

## Overview

Sentra uses **git worktrees** to enable **massively parallel autonomous development**. Unlike traditional sequential workflows, Sentra can execute 10-20+ tasks simultaneously, each in complete isolation, dramatically reducing time-to-completion for large projects.

**Key Concept:** Git worktrees allow multiple working directories to share the same `.git` repository, providing true isolation without the overhead of separate clones.

## Why Worktrees? (Not Branch Switching)

### **The Problem: Sequential Development is Slow**

Traditional approach (branch switching):
```bash
# Task 1
git checkout -b feature/auth
# Work on auth... (20 minutes)
git commit && push

# Task 2
git checkout main
git checkout -b feature/contacts
# Work on contacts... (20 minutes)
git commit && push

# Total time: 40 minutes sequential
```

### **The Solution: Parallel Development with Worktrees**

Sentra approach (parallel worktrees):
```bash
# Launch both tasks simultaneously
Task 1: worktree/.sentra/task-001/ → feature/auth
Task 2: worktree/.sentra/task-002/ → feature/contacts

# Both complete in parallel: 20 minutes total
```

**Result:** 10x speed improvement for projects with hundreds of tasks.

## Worktree vs. Branch Switching

| Feature | Branch Switching | Git Worktrees |
|---------|-----------------|---------------|
| **Parallel Execution** | ❌ One task at a time | ✅ 10-20+ tasks simultaneously |
| **Disk Usage** | 1x project size | N × project size (shared .git) |
| **Setup Time** | Fast (git checkout) | Moderate (npm install per worktree) |
| **Isolation** | None (same directory) | Complete (separate directories) |
| **Port Conflicts** | High risk | None (unique ports per task) |
| **Best For** | Solo sequential work | Multi-agent parallel system |

**Verdict:** Worktrees are **essential** for Sentra's parallel autonomous development model.

## Directory Structure

```
project-root/
├── .git/                          # Shared git repository (disk efficient)
├── .claude/                       # Hooks & commands (committed to git)
│   ├── hooks/                     # TypeScript hooks (auto-distributed)
│   └── commands/                  # Shared slash commands
│
├── .sentra/
│   ├── worktrees/                 # All task worktrees live here
│   │   ├── task-abc123/          # Task 1 worktree
│   │   │   ├── .claude/          # ✅ Auto from git
│   │   │   ├── .ports.env        # Unique port config
│   │   │   ├── node_modules/     # Independent dependencies
│   │   │   ├── app/              # Full project copy
│   │   │   └── ...
│   │   │
│   │   ├── task-xyz789/          # Task 2 worktree (parallel)
│   │   │   ├── .claude/          # ✅ Auto from git
│   │   │   ├── .ports.env        # Different ports
│   │   │   └── ...
│   │   │
│   │   └── task-def456/          # Task 3 worktree (parallel)
│   │       └── ...
│   │
│   └── plans/                     # Generated plans (ephemeral)
│
├── main-codebase/                 # Main development (optional)
├── package.json
└── README.md
```

## Worktree Lifecycle

### **1. Task Created (Database)**

```typescript
// Task added to database via Dashboard or AI Analyst
await db.insert(tasks).values({
  id: 'task-abc123',
  title: 'Add JWT authentication',
  status: 'pending',
  dependencies: [],  // No blockers
  projectId: 'proj-xyz',
});
```

### **2. Agent Claims Task**

```typescript
// Orchestrator picks up ready task
const task = await db
  .select()
  .from(tasks)
  .where(eq(tasks.status, 'pending'))
  .where(sql`dependencies_satisfied = true`)
  .limit(1);

// Update status to running
await db.update(tasks)
  .set({ status: 'running' })
  .where(eq(tasks.id, task.id));
```

### **3. Create Worktree**

```typescript
// Create isolated worktree
const worktreePath = `.sentra/worktrees/${task.id}`;
const branchName = `feature/${task.id}-${task.slug}`;

await exec(`git worktree add -b ${branchName} ${worktreePath} origin/main`);
```

**What happens:**
- New directory created at `.sentra/worktrees/task-abc123/`
- Branch `feature/task-abc123-add-jwt-auth` created
- All committed files (including `.claude/`) automatically present
- Shared `.git` repository (no duplication)

### **4. Setup Environment**

```typescript
// Allocate unique ports (deterministic based on task ID)
const { backendPort, frontendPort } = getPortsForTask(task.id);

// Create .ports.env
await writeFile(`${worktreePath}/.ports.env`, `
BACKEND_PORT=${backendPort}
FRONTEND_PORT=${frontendPort}
VITE_BACKEND_URL=http://localhost:${backendPort}
`);

// Install dependencies
await exec('npm install', { cwd: worktreePath });

// Copy .env files if needed
await exec('./scripts/setup-worktree.sh', { cwd: worktreePath });
```

### **5. Spawn Claude Session**

```typescript
// Start Claude Code in the worktree
await exec(`claude-code --session ${task.id}`, {
  cwd: worktreePath,
  env: {
    SESSION_ID: task.id,
    TASK_ID: task.id,
    WORKTREE_PATH: worktreePath,
  }
});
```

**Claude executes SDLC phases:**
- PLAN → CODE → TEST → REVIEW
- Hooks coordinate via database
- Logs written to PostgreSQL

### **6. Create Pull Request**

```typescript
// After successful execution
await exec(`git push -u origin ${branchName}`, { cwd: worktreePath });

await exec(`gh pr create --title "${task.title}" --body "..."`, {
  cwd: worktreePath
});
```

### **7. Cleanup Worktree**

```typescript
// After PR merged or task complete
await exec(`git worktree remove ${worktreePath} --force`);

// Update task status
await db.update(tasks)
  .set({
    status: 'completed',
    completedAt: new Date()
  })
  .where(eq(tasks.id, task.id));

// Unblock dependent tasks
await db.update(tasks)
  .set({ status: 'pending' })
  .where(sql`${task.id} IN dependencies AND all_dependencies_met()`);
```

## Port Allocation Strategy

Sentra uses **dynamic OS-assigned ports** to enable unlimited scalability:

```typescript
import net from 'net';

async function getPortsForTask(taskId: string): Promise<{ backendPort: number, frontendPort: number }> {
  // CRITICAL: Use OS-assigned ephemeral ports instead of fixed ranges
  // This removes the 15-task hardcoded limit and prevents port collisions

  return {
    backendPort: await getAvailablePort(),   // OS assigns from ephemeral range (49152-65535)
    frontendPort: await getAvailablePort(),  // OS assigns from ephemeral range
  };
}

// Request OS to assign available port
async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.listen(0, () => {  // Port 0 = OS assigns random available port
      const address = server.address();
      const port = typeof address === 'object' ? address.port : null;

      server.close(() => {
        if (port) {
          resolve(port);
        } else {
          reject(new Error('Failed to allocate port'));
        }
      });
    });

    server.on('error', reject);
  });
}

// Store allocated ports in database
await db.insert(taskExecution).values({
  taskId: task.id,
  backendPort,
  frontendPort,
  worktreePath,
});
```

**Benefits:**
- ✅ **No hardcoded limits** - Can run 50, 100, or 200+ parallel tasks
- ✅ **Zero port collisions** - OS guarantees uniqueness
- ✅ **Automatic cleanup** - Ports released when process ends
- ✅ **Scalable architecture** - Only limited by CPU/RAM, not port ranges

**Old Approach (deprecated):**
```typescript
// ❌ Don't do this - limits to 15 tasks
backendPort: 9100 + (index % 15),  // 9100-9114
frontendPort: 9200 + (index % 15), // 9200-9214
```

## Resource Management

### **Disk Usage**

Each worktree requires:
- **node_modules:** ~500MB-2GB (depends on project)
- **Source code:** ~50-200MB
- **Build artifacts:** ~100-500MB

**Example:** 15 parallel tasks = 7.5GB - 30GB total disk usage (manageable on modern systems)

### **Memory Usage**

Per worktree (if dev server running):
- **Dev server:** ~200-500MB RAM
- **Build process:** ~500MB-1GB RAM (temporary)

**Strategy:** Only run dev servers for UI tasks or E2E tests to conserve memory.

### **CPU Usage**

- **High during builds:** Parallel `npm run build` across worktrees
- **Low during planning:** Agents writing plans (no builds)
- **High during tests:** Parallel test execution

**Recommendation:** Limit concurrent tasks based on available CPU cores (2-3 tasks per core).

## Optimizations

### **1. Shared node_modules (Optional)**

Instead of `npm install` per worktree, use **pnpm** for content-addressable storage:

```typescript
// pnpm automatically deduplicates across worktrees
await exec('pnpm install', { cwd: worktreePath });
```

**Benefits:**
- Faster installs (hardlinks to global store)
- Lower disk usage (shared packages)
- Perfect for multiple worktrees

### **2. Selective Dev Servers**

Only start dev servers when needed:

```typescript
// UI tasks: start dev server
if (task.type === 'ui' || task.hasE2E) {
  await startDevServer(worktreePath, frontendPort);
}

// Backend/logic tasks: no server needed (just run tests)
```

### **3. Build Caching**

Share build cache across worktrees:

```typescript
// Use shared cache directory
await exec('npm run build', {
  cwd: worktreePath,
  env: {
    VITE_BUILD_CACHE: '/shared/cache/vite',
    NEXT_BUILD_CACHE: '/shared/cache/next',
  }
});
```

## Dependency Management

Tasks can have dependencies to ensure correct execution order:

```typescript
// Task dependencies in database
const task = {
  id: 'task-002',
  title: 'Add auth middleware',
  dependencies: ['task-001'], // Must wait for auth system
  status: 'blocked',
};

// Task becomes ready when dependencies complete
await db.update(tasks)
  .set({ status: 'pending' })
  .where(sql`
    id = 'task-002' AND
    NOT EXISTS (
      SELECT 1 FROM tasks
      WHERE id IN ('task-001')
      AND status != 'completed'
    )
  `);
```

**Dependency Graph Example:**
```
task-001 (Auth System) → task-002 (Auth Middleware) → task-003 (Protected Routes)
                      ↘                             ↗
                        task-004 (Auth Tests)
```

Tasks 001, 004 can run in parallel. Tasks 002, 003 wait for dependencies.

## `.claude/` Auto-Distribution

**Key Feature:** `.claude/` directory is committed to git and automatically distributed to all worktrees.

```bash
# Main project
git add .claude/
git commit -m "Add hooks and commands"

# When creating worktree
git worktree add .sentra/worktrees/task-123 -b feature/task-123

# Result: .sentra/worktrees/task-123/.claude/ exists automatically!
```

**Contents:**
- `.claude/hooks/` → TypeScript hooks (security, logging, coordination)
- `.claude/commands/` → Shared slash commands for all agents

**Benefits:**
- ✅ No copying needed (git handles it)
- ✅ Consistent hooks across all tasks
- ✅ Version controlled with codebase
- ✅ Team collaboration ready

## Parallel Execution Example

### **Scenario: Build CRM with 200 tasks**

Using AI Analyst to decompose project:

```typescript
// AI Analyst creates 200 tasks
const tasks = [
  { id: 'task-001', title: 'Auth system', dependencies: [] },
  { id: 'task-002', title: 'User CRUD', dependencies: ['task-001'] },
  { id: 'task-003', title: 'Contact CRUD', dependencies: [] },
  { id: 'task-004', title: 'Deal pipeline', dependencies: ['task-003'] },
  // ... 196 more tasks
];

// Orchestrator starts 15 tasks in parallel (no dependencies)
const readyTasks = tasks.filter(t => t.dependencies.length === 0);
await Promise.all(
  readyTasks.slice(0, 15).map(task => executeInWorktree(task))
);

// As tasks complete, dependent tasks become ready
// Continuous parallel execution until all 200 tasks done
```

**Timeline:**
- **Sequential:** 200 tasks × 30 min avg = 6000 min (~100 hours / 4+ days)
- **Parallel (15 concurrent):** 200 tasks / 15 × 30 min = 400 min (~7 hours)

**Result:** 14x speed improvement!

## Error Handling

### **Worktree Creation Fails**

```typescript
try {
  await exec(`git worktree add ${worktreePath} -b ${branchName}`);
} catch (error) {
  if (error.message.includes('already exists')) {
    // Branch exists, checkout instead
    await exec(`git worktree add ${worktreePath} ${branchName}`);
  } else {
    throw error;
  }
}
```

### **Port Conflict**

```typescript
const { backendPort, frontendPort } = findAvailablePorts(taskId);

if (!isPortAvailable(backendPort)) {
  // Try next port in range
  const altPort = findNextAvailablePort(backendPort, 9100, 9114);
  if (!altPort) throw new Error('No available ports');
}
```

### **Task Failure**

```typescript
// Hook detects failure in post-tool-use
if (taskFailed) {
  await db.update(tasks)
    .set({
      status: 'failed',
      error: errorDetails,
    })
    .where(eq(tasks.id, taskId));

  // Keep worktree for debugging
  console.log(`Worktree preserved at ${worktreePath} for inspection`);
}
```

## Best Practices

1. **Limit concurrent tasks** based on system resources (CPU/RAM)
2. **Use pnpm** for efficient dependency management across worktrees
3. **Only run dev servers** for UI/E2E tasks (conserve memory)
4. **Clean up completed worktrees** promptly to free disk space
5. **Monitor port usage** to prevent conflicts
6. **Set task dependencies** carefully to avoid deadlocks
7. **Commit `.claude/`** to git for automatic distribution

## Summary

Git worktrees are the **foundation of Sentra's parallel autonomous development**:

- ✅ True isolation for each task
- ✅ Shared .git repository (disk efficient)
- ✅ Automatic `.claude/` distribution via git
- ✅ Deterministic port allocation
- ✅ Support for 10-20+ parallel tasks
- ✅ Hooks coordinate via database
- ✅ 10-14x speed improvement over sequential execution

**Next:** See `26-hooks-system.md` for how hooks coordinate parallel task execution.
