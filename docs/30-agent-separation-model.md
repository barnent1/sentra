# Agent Separation Model

## Overview

Sentra uses **strict agent separation** with **fresh context per phase** to ensure objective quality control. Each SDLC phase (PLAN → CODE → TEST → REVIEW) is executed by a completely independent agent with zero knowledge of previous phases, mimicking a professional development team.

**Core Principle:** No agent reviews their own work. Fresh eyes catch errors that the original implementer would miss.

## Why Agent Separation Matters

### **The Problem: Single Agent Blindness**

When one agent does everything:

```
Agent A: Plans feature
↓
Agent A: Implements feature (knows the plan intimately)
↓
Agent A: Tests feature (knows the implementation tricks)
↓
Agent A: Reviews feature (already convinced it's correct)
↓
Result: Bugs slip through, biased validation
```

**Issues:**
- **Confirmation bias** - Agent sees what they expect
- **Blind spots** - Agent doesn't test edge cases they didn't consider
- **Shortcuts** - Agent knows implementation details, skips validation
- **No challenge** - No one questions design decisions

### **The Solution: Fresh Context Per Phase**

Sentra's approach:

```
Analyst Agent (Fresh) → Creates plan from requirements
↓ [Database handoff]
Coder Agent (Fresh) → Implements plan (no planning context)
↓ [Database handoff]
Tester Agent (Fresh) → Tests code (no coding context)
↓ [Database handoff]
Reviewer Agent (Fresh) → Reviews implementation (no coding/testing context)
↓ [Database handoff]
Human (Out-of-loop) → Views screenshots, approves/rejects
```

**Benefits:**
- ✅ **Objective testing** - Tester doesn't know coding shortcuts
- ✅ **Critical review** - Reviewer challenges implementation
- ✅ **Fresh perspectives** - Each agent catches different issues
- ✅ **Quality enforcement** - No rubber-stamping
- ✅ **Pushback loops** - Agents reject substandard work

## Agent Roles & Responsibilities

### **1. Analyst Agent** (PLAN Phase)

**Context:** Task requirements from database or user input

**Responsibilities:**
- Study existing patterns in codebase
- Research similar features
- Create detailed implementation plan
- Define types, APIs, test strategy
- Store plan in database (not files)

**Knowledge:**
- ✅ Requirements and user stories
- ✅ Existing codebase patterns
- ✅ Technical documentation
- ❌ Nothing about upcoming implementation
- ❌ Nothing about who will code it

**MCP Tools:**
- `find_similar_implementations` - Study patterns
- `get_relevant_docs` - Read documentation
- `create_plan` - Store plan in DB

**Output:**
- Plan stored in database
- Type definitions
- Pattern references
- Test specifications

**Success Criteria:**
- Plan is detailed enough for unfamiliar coder
- All types specified
- Test strategy defined
- Pattern references included

---

### **2. Coder Agent** (CODE Phase)

**Context:** Plan from database (ONLY)

**Responsibilities:**
- Read plan from database
- Study referenced patterns
- Implement following strict TypeScript rules
- Run typecheck after each file
- Create clean commits
- NO testing (that's next phase)

**Knowledge:**
- ✅ Plan from database
- ✅ Referenced code patterns
- ✅ Type definitions from plan
- ❌ Nothing about why plan was created
- ❌ Nothing about original requirements (ONLY the plan)
- ❌ Nothing about testing (happens later)

**MCP Tools:**
- `get_task_info` - Get plan from DB
- `find_similar_implementations` - Study patterns
- `run_typecheck` - Validate types continuously
- `commit_changes` - Create commit

**Output:**
- Implementation code
- Git commit
- Database update: phase = 'CODE' → 'TEST'

**Success Criteria:**
- Code follows plan exactly
- All types pass strict mode
- Pattern consistency with codebase
- Clean, readable code

---

### **3. Tester Agent** (TEST Phase)

**Context:** Plan + Code (from database), FRESH CONTEXT

**Responsibilities:**
- Read plan (NOT code implementation details)
- Study existing test patterns
- Write comprehensive tests
- Run all test suites
- Run E2E tests with screenshots
- Validate against plan requirements
- **Push back to CODE if failures**

**Knowledge:**
- ✅ Plan requirements
- ✅ What features should exist
- ✅ Test patterns from codebase
- ❌ Implementation details (doesn't read code files)
- ❌ Why coder chose specific approach
- ❌ Coding challenges faced

**Why no implementation knowledge?**
- Prevents "testing around bugs"
- Forces comprehensive testing
- Catches edge cases coder didn't consider
- Validates against spec, not implementation

**MCP Tools:**
- `get_task_info` - Get plan from DB
- `find_similar_implementations` - Study test patterns
- `run_tests` - Unit/integration tests
- `run_e2e_tests` - E2E with screenshots
- `update_task_phase` - Push back if failures

**Output:**
- Test results (pass/fail)
- Screenshots (stored in DB)
- Phase update: 'TEST' → 'REVIEW' (if pass) or 'CODE' (if fail)

**Success Criteria:**
- All tests pass
- E2E screenshots captured
- Edge cases covered
- No type errors
- No lint errors

**Failure Handling:**
```typescript
if (!allTestsPassed) {
  await update_task_phase({
    taskId,
    phase: 'CODE', // Push back!
    reason: 'Test failures',
    failures: testResults.failures,
    guidance: "Review similar passing tests for pattern"
  });
  return { status: 'needs_fixes' };
}
```

---

### **4. Reviewer Agent** (REVIEW Phase)

**Context:** Plan + Screenshots (from database), FRESH CONTEXT

**Responsibilities:**
- Read plan (NOT code or test details)
- Study code quality patterns
- Visual review (screenshots)
- AI design comparison (if UI)
- Code quality check (lint)
- **Critical evaluation** (not rubber-stamping)
- Create PR if approved
- **Push back to CODE if issues**

**Knowledge:**
- ✅ Plan requirements
- ✅ Screenshots from E2E tests
- ✅ What output should look like
- ✅ Code quality patterns
- ❌ Implementation details
- ❌ Test implementation
- ❌ Coding/testing challenges

**Why no code/test knowledge?**
- Fresh eyes spot visual issues
- Challenges implementation choices
- Validates user experience, not technical details
- Ensures plan was followed

**MCP Tools:**
- `get_task_info` - Get plan + screenshots from DB
- `start_visual_review` - Launch app for review
- `compare_design` - AI visual comparison
- `run_lint` - Code quality check
- `create_pull_request` - Create PR
- `mark_task_complete` - Finalize
- `update_task_phase` - Push back if issues

**Output:**
- Review summary
- Issues found (if any)
- Screenshots of critical paths
- PR created (if approved)
- Phase update: 'REVIEW' → 'COMPLETE' or 'CODE'

**Success Criteria:**
- Implementation matches plan
- Visual design correct (if UI)
- Code quality passes
- Screenshots showcase functionality
- No blocking issues

**Failure Handling:**
```typescript
if (hasBlockingIssues) {
  await update_task_phase({
    taskId,
    phase: 'CODE', // Push back!
    reason: 'Review found blocking issues',
    issues: reviewIssues,
    screenshots: issueScreenshots
  });
  return { status: 'needs_refactor' };
}
```

---

### **5. Human** (Out-of-Loop Validation)

**Context:** PR + Screenshots in Dashboard

**Responsibilities:**
- View screenshots in dashboard
- Quick visual verification
- Approve or reject as bug
- **Only intervene if needed**

**Knowledge:**
- ✅ Screenshots showing functionality
- ✅ PR summary
- ✅ What was supposed to be built
- ❌ Implementation details (unless they look)

**Dashboard View:**
```
┌─────────────────────────────────────────────┐
│ Task #123: Add JWT Authentication           │
│ Status: ✅ COMPLETED (Awaiting Approval)    │
│                                             │
│ Screenshots (5):                            │
│ ├─ 01_login_form.png      [View]           │
│ ├─ 02_successful_login.png [View]          │
│ ├─ 03_token_refresh.png   [View]           │
│ ├─ 04_protected_route.png [View]           │
│ └─ 05_logout.png          [View]           │
│                                             │
│ Review Summary:                             │
│ JWT authentication implemented with login,  │
│ token refresh, and protected routes. All   │
│ tests passing. Visual design matches spec. │
│                                             │
│ [👍 Approve & Merge]  [👎 Reject as Bug]   │
└─────────────────────────────────────────────┘
```

**Actions:**
- **Approve** → Auto-merge PR
- **Reject** → Create bug task, restart from CODE

---

## Database Handoff (No File Passing)

### **Traditional Approach (Files):**
```
Planner → writes specs/plan.md
Coder → reads specs/plan.md, writes code
Tester → reads specs/plan.md + code, runs tests
Reviewer → reads everything, reviews

Problem: Agents can peek at anything, no clean separation
```

### **Sentra Approach (Database):**

```typescript
// 1. PLAN Phase
await create_plan({
  taskId: 'task-123',
  planData: {
    title: "Add JWT auth",
    requirements: "...",
    types: "...",
    patterns: [...]
  }
});

// Database now has:
// tasks { id: 'task-123', status: 'pending', phase: 'CODE', plan: {...} }

// 2. CODE Phase (new agent spawned)
const task = await get_task_info({ taskId: 'task-123' });
// Agent ONLY gets: task.plan
// Agent CANNOT see: original requirements, chat history

// ... implements code ...

await update_task_phase({ taskId: 'task-123', phase: 'TEST' });

// 3. TEST Phase (new agent spawned)
const task = await get_task_info({ taskId: 'task-123' });
// Agent ONLY gets: task.plan
// Agent CANNOT see: code comments, implementation details

// ... runs tests ...

await update_task_phase({ taskId: 'task-123', phase: 'REVIEW' });

// 4. REVIEW Phase (new agent spawned)
const task = await get_task_info({ taskId: 'task-123' });
// Agent ONLY gets: task.plan + screenshots
// Agent CANNOT see: code, tests, previous agent thoughts
```

**Database Schema:**

```typescript
export const tasks = pgTable('tasks', {
  id: varchar('id').primaryKey(),
  status: varchar('status'), // 'pending' | 'running' | 'completed' | 'failed'
  phase: varchar('phase'),   // 'PLAN' | 'CODE' | 'TEST' | 'REVIEW'

  // Plan (from Analyst)
  plan: jsonb('plan'), // Only this is shared between agents

  // Implementation metadata (NOT shared with other agents)
  implementationNotes: jsonb('implementation_notes'), // Coder's notes
  testResults: jsonb('test_results'), // Tester's results
  reviewNotes: jsonb('review_notes'), // Reviewer's notes

  // Handoff data
  currentPhase: varchar('current_phase'),
  phaseHistory: jsonb('phase_history'),
});

export const screenshots = pgTable('screenshots', {
  id: serial('id').primaryKey(),
  taskId: varchar('task_id').references(() => tasks.id),
  phase: varchar('phase'), // 'test' | 'review'
  agentName: varchar('agent_name'),
  description: varchar('description'),
  imageData: bytea('image_data'), // Binary screenshot
  timestamp: timestamp('timestamp'),
});
```

## Agent Spawning & Isolation

### **Orchestrator Spawns Fresh Agents:**

```typescript
class TaskOrchestrator {
  async executeTask(task: Task) {
    // PLAN Phase
    await this.spawnAgent({
      phase: 'PLAN',
      taskId: task.id,
      sessionId: `${task.id}-plan`,
      context: { requirements: task.requirements },
      prompt: `Read requirements and create a detailed plan.
               Study existing patterns first.
               Store plan in database using create_plan().`
    });

    // Wait for phase completion
    await this.waitForPhaseComplete(task.id, 'PLAN');

    // CODE Phase (FRESH AGENT)
    await this.spawnAgent({
      phase: 'CODE',
      taskId: task.id,
      sessionId: `${task.id}-code`, // NEW SESSION
      context: {}, // EMPTY! No previous context
      prompt: `Get plan from database using get_task_info().
               Study referenced patterns.
               Implement following strict TypeScript rules.`
    });

    await this.waitForPhaseComplete(task.id, 'CODE');

    // TEST Phase (FRESH AGENT)
    await this.spawnAgent({
      phase: 'TEST',
      taskId: task.id,
      sessionId: `${task.id}-test`, // NEW SESSION
      context: {}, // EMPTY! No previous context
      prompt: `Get plan from database.
               Study test patterns.
               Write comprehensive tests.
               Push back to CODE if failures.`
    });

    await this.waitForPhaseComplete(task.id, 'TEST');

    // REVIEW Phase (FRESH AGENT)
    await this.spawnAgent({
      phase: 'REVIEW',
      taskId: task.id,
      sessionId: `${task.id}-review`, // NEW SESSION
      context: {}, // EMPTY! No previous context
      prompt: `Get plan and screenshots from database.
               Visual review and code quality check.
               Create PR if approved, push back if issues.`
    });
  }

  async spawnAgent(config: AgentConfig) {
    // Each agent gets isolated worktree + fresh Claude session
    const worktreePath = `.sentra/worktrees/${config.taskId}`;

    await exec(`claude-code --session ${config.sessionId}`, {
      cwd: worktreePath,
      env: {
        SESSION_ID: config.sessionId,
        TASK_ID: config.taskId,
        PHASE: config.phase,
        DATABASE_URL: process.env.DATABASE_URL,
        // NO CONTEXT PASSING - agent must use MCP tools
      }
    });
  }
}
```

## Pushback Loops (Critical Quality Control)

### **Scenario: Test Failures**

```typescript
// CODE Phase completes
await update_task_phase({ taskId: 'task-123', phase: 'TEST' });

// TEST Phase starts (fresh agent)
const testResults = await run_tests({ taskId: 'task-123' });

if (!testResults.allPassed) {
  // PUSH BACK TO CODE
  await update_task_phase({
    taskId: 'task-123',
    phase: 'CODE', // Back to coding!
    reason: 'Test failures detected',
    failures: testResults.failures,
    iteration: 2
  });

  // Orchestrator spawns ANOTHER fresh coder agent
  await spawnAgent({
    phase: 'CODE',
    taskId: 'task-123',
    sessionId: 'task-123-code-iter2',
    prompt: `Get plan and test failures from database.
             Fix the failing tests.
             Study passing test patterns to understand requirements.`
  });

  // Loop continues until tests pass
}
```

### **Scenario: Review Issues**

```typescript
// REVIEW Phase
const reviewResults = await start_visual_review({ taskId: 'task-123' });

if (reviewResults.hasBlockingIssues) {
  // PUSH BACK TO CODE
  await update_task_phase({
    taskId: 'task-123',
    phase: 'CODE',
    reason: 'Review found blocking issues',
    issues: reviewResults.issues,
    screenshots: reviewResults.issueScreenshots,
    iteration: 3
  });

  // Fresh coder fixes issues
  // Then re-tests
  // Then re-reviews
  // Loop until perfect
}
```

### **Maximum Iterations:**

```typescript
const MAX_ITERATIONS = 5;

if (task.iteration > MAX_ITERATIONS) {
  // Escalate to human
  await update_task_phase({
    taskId,
    phase: 'BLOCKED',
    reason: 'Max iterations exceeded',
    status: 'needs_human_intervention'
  });

  // Notify dashboard
  await notifyUser({
    taskId,
    message: 'Task stuck after 5 iterations. Please review.'
  });
}
```

## Agent Communication (Strictly Controlled)

### **What Agents CAN Access:**

```typescript
// get_task_info returns:
{
  taskId: 'task-123',
  title: 'Add JWT authentication',
  plan: {
    requirements: '...',
    types: '...',
    patterns: [...]
  },
  phase: 'CODE',
  iteration: 1,

  // Phase-specific data
  testResults: null, // Only if phase >= TEST
  screenshots: null, // Only if phase >= REVIEW
  failures: null,    // Only if iteration > 1
}
```

### **What Agents CANNOT Access:**

- ❌ Other agents' conversation history
- ❌ Implementation notes from previous agents
- ❌ Code files (unless explicitly studying patterns)
- ❌ Private thoughts/reasoning from other agents
- ❌ User's original request (only refined plan)

### **Enforcement via MCP Tools:**

```typescript
// MCP tool restricts data access by phase
{
  name: "get_task_info",
  description: "Get task information for current phase",
  inputSchema: {
    taskId: "string"
  },
  handler: async (input, context) => {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, input.taskId)
    });

    // Filter data based on current agent's phase
    const phase = context.env.PHASE;

    return {
      taskId: task.id,
      title: task.title,
      plan: task.plan, // Always available

      // Conditional data
      testResults: phase === 'REVIEW' ? task.testResults : null,
      screenshots: phase === 'REVIEW' ? await getScreenshots(task.id) : null,
      failures: task.iteration > 1 ? task.failures : null,

      // Never shared
      implementationNotes: null, // Private to coder
      reviewNotes: null,         // Private to reviewer
    };
  }
}
```

## Example: Complete Task Flow

### **Task: Add User Profile Page**

#### **1. PLAN Phase (Analyst Agent)**

```typescript
// Analyst spawned with fresh context
const analyst = await spawnAgent({
  phase: 'PLAN',
  prompt: 'Create plan for user profile page'
});

// Analyst workflow:
// 1. Studies existing page patterns
const patterns = await find_similar_implementations({
  feature: 'user page',
  filePatterns: ['app/**/page.tsx']
});

// 2. Creates plan
await create_plan({
  taskId: 'task-456',
  planData: {
    title: 'User Profile Page',
    requirements: 'Display user info with edit capability',
    referencePatterns: [
      'app/dashboard/page.tsx (page structure)',
      'app/components/UserForm.tsx (form pattern)'
    ],
    types: `
      interface UserProfile {
        id: string;
        name: string;
        email: string;
        avatar: string;
      }
    `,
    implementation: {
      files: [
        'app/profile/page.tsx',
        'app/components/ProfileForm.tsx'
      ],
      apis: ['GET /api/user/profile', 'PUT /api/user/profile']
    },
    tests: {
      unit: ['ProfileForm validation'],
      e2e: ['Navigate to profile, edit name, save, verify']
    }
  }
});

// Phase complete
await update_task_phase({ taskId: 'task-456', phase: 'CODE' });
```

#### **2. CODE Phase (Coder Agent - FRESH)**

```typescript
// New agent spawned (no knowledge of planning)
const coder = await spawnAgent({
  phase: 'CODE',
  sessionId: 'task-456-code',
  prompt: 'Implement the plan from database'
});

// Coder workflow:
// 1. Gets plan
const task = await get_task_info({ taskId: 'task-456' });

// 2. Studies referenced patterns
const pagePattern = await read('app/dashboard/page.tsx');
const formPattern = await read('app/components/UserForm.tsx');

// 3. Implements following patterns
await write('app/profile/page.tsx', `
  // Copied structure from dashboard/page.tsx
  export default function ProfilePage() {
    return <ProfileForm />;
  }
`);

await write('app/components/ProfileForm.tsx', `
  // Copied pattern from UserForm.tsx
  interface ProfileFormProps { ... }

  export function ProfileForm({ }: ProfileFormProps) {
    // Same validation pattern
    // Same error handling pattern
  }
`);

// 4. Immediate typecheck
await run_typecheck({ scope: 'changed-files' });

// 5. Commit
await commit_changes({ message: 'Add user profile page' });

// Phase complete
await update_task_phase({ taskId: 'task-456', phase: 'TEST' });
```

#### **3. TEST Phase (Tester Agent - FRESH)**

```typescript
// New agent spawned (no knowledge of coding)
const tester = await spawnAgent({
  phase: 'TEST',
  sessionId: 'task-456-test',
  prompt: 'Test the implementation against plan'
});

// Tester workflow:
// 1. Gets plan (NOT code details)
const task = await get_task_info({ taskId: 'task-456' });

// 2. Studies test patterns
const testPatterns = await find_similar_implementations({
  feature: 'form tests',
  filePatterns: ['**/*.test.tsx']
});

// 3. Runs all tests
const unitResults = await run_tests({
  backend: true,
  frontend: true,
  strictTypeCheck: true
});

// FAILURE: TypeScript error
if (!unitResults.success) {
  // PUSH BACK TO CODE
  await update_task_phase({
    taskId: 'task-456',
    phase: 'CODE',
    reason: 'Type errors in ProfileForm',
    failures: unitResults.errors,
    iteration: 2
  });
  return;
}

// 4. E2E tests with screenshots
const e2eResults = await run_e2e_tests({
  taskId: 'task-456',
  spec: task.plan.tests.e2e,
  captureScreenshots: true
});

// SUCCESS: All tests pass
await update_task_phase({ taskId: 'task-456', phase: 'REVIEW' });
```

#### **4. REVIEW Phase (Reviewer Agent - FRESH)**

```typescript
// New agent spawned (no knowledge of code/tests)
const reviewer = await spawnAgent({
  phase: 'REVIEW',
  sessionId: 'task-456-review',
  prompt: 'Review implementation against plan'
});

// Reviewer workflow:
// 1. Gets plan + screenshots
const task = await get_task_info({ taskId: 'task-456' });
const screenshots = task.screenshots;

// 2. Visual review
const visual = await start_visual_review({
  taskId: 'task-456',
  plan: task.plan
});

// 3. Code quality
const lint = await run_lint({ autoFix: false });

// ISSUE FOUND: Design doesn't match mockup
if (visual.matchScore < 85) {
  // PUSH BACK TO CODE
  await update_task_phase({
    taskId: 'task-456',
    phase: 'CODE',
    reason: 'Visual design mismatch',
    issues: visual.issues,
    screenshots: visual.comparisonScreenshots,
    iteration: 3
  });
  return;
}

// SUCCESS: All approved
await create_pull_request({
  taskId: 'task-456',
  title: 'feat: Add user profile page',
  screenshots: screenshots
});

await mark_task_complete({ taskId: 'task-456' });
```

#### **5. HUMAN (Out-of-Loop)**

```
Dashboard shows:
- 5 screenshots of working profile page
- PR summary
- All tests passed ✅

Human clicks: [👍 Approve & Merge]
PR auto-merged to main
```

## Benefits of Agent Separation

### **1. Objective Quality Control**
- Fresh eyes catch bugs original coder would miss
- No confirmation bias
- Critical evaluation at each phase

### **2. Comprehensive Testing**
- Tester doesn't know implementation shortcuts
- Tests against spec, not code
- Catches edge cases coder didn't consider

### **3. True Code Review**
- Reviewer challenges design choices
- Validates user experience
- Ensures pattern consistency

### **4. Faster Iteration**
- Pushback loops force quality
- Issues caught early (not in production)
- Each agent specializes in their phase

### **5. Out-of-Loop Operation**
- Human only sees final screenshots
- Intervenes only when needed
- System self-corrects via pushback loops

## Comparison: Single Agent vs Separation

| Aspect | Single Agent | Separated Agents |
|--------|--------------|------------------|
| **Bias** | High (reviews own work) | None (fresh context) |
| **Testing** | Knows shortcuts | Comprehensive |
| **Review** | Rubber-stamps | Critical evaluation |
| **Quality** | Misses bugs | Catches more issues |
| **Iterations** | Fewer (but bugs slip through) | More (but higher quality) |
| **Human Intervention** | Frequent (bugs in prod) | Rare (caught before merge) |

## Summary

Sentra's agent separation model ensures:

1. ✅ **Fresh context per phase** - No contamination between agents
2. ✅ **Database handoff** - Clean separation, no file peeking
3. ✅ **Objective validation** - No agent reviews their own work
4. ✅ **Pushback loops** - Quality enforcement through rejection
5. ✅ **Specialized agents** - Each excels at their phase
6. ✅ **Out-of-loop operation** - Human sees only final screenshots
7. ✅ **Professional team simulation** - Like working with real developers

**Result:** Code that passes rigorous multi-agent review before reaching production, minimizing bugs and human intervention.
