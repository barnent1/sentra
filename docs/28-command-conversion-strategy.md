# Command Conversion Strategy: TAC → Sentra

## Overview

Sentra converts TAC-7's Python-based bash commands to **MCP tool-based TypeScript commands** with a **pattern-first learning approach**. This eliminates trial-and-error coding and ensures agents learn from existing code to minimize mistakes.

**Core Principle:** Agents study existing patterns → Apply learned patterns → Achieve near-zero errors

## Pattern-First Development Philosophy

### **Traditional Approach (BAD - Trial & Error):**
```
Agent → Guesses implementation → Gets errors → Fixes errors → More errors → ...
Result: 20+ iterations, type errors, bugs
```

### **Sentra Approach (GOOD - Pattern Learning):**
```
Agent → Studies existing code → Learns patterns → Applies patterns → 0-2 errors
Result: 1-2 iterations, clean code, no bugs
```

## Key Differences: TAC vs Sentra

| Aspect | TAC-7 (Python) | Sentra (TypeScript/Next.js) |
|--------|----------------|---------------------------|
| **Language** | Python (uv, pytest) | TypeScript (strict mode) |
| **Stack** | Python backend only | Full-stack (Next.js 15, React, Postgres) |
| **Testing** | pytest | Vitest/Jest + Playwright |
| **Linting** | ruff | ESLint + TypeScript strict |
| **MCP** | None | Custom MCP server with tools |
| **Commands** | Direct bash | **MCP tool invocation** |
| **Learning** | N/A | **Pattern-based from docs/code** |

## MCP Tools Required (New)

### 1. **Pattern Learning Tools** (CRITICAL - NEW)
- `find_similar_implementations` - Find existing code patterns
- `get_relevant_docs` - Get documentation for topic
- `analyze_code_patterns` - Extract patterns from codebase
- `suggest_pattern_application` - Show how to apply pattern

### 2. **Workflow Management Tools**
- `create_plan` - Create task plan in database (not file)
- `get_task_info` - Fetch task details from database
- `update_task_phase` - Update task phase (PLAN → CODE → TEST → REVIEW)
- `mark_task_complete` - Mark task as complete, unblock dependents

### 3. **Code Quality Tools**
- `run_typecheck` - Execute `tsc --noEmit` with strict mode
- `run_lint` - Execute ESLint with auto-fix option
- `run_tests` - Execute unit tests (Vitest)
- `run_e2e_tests` - Execute E2E tests (Playwright)
- `run_build` - Production build validation

### 4. **Git Operation Tools**
- `create_branch` - Create feature branch
- `commit_changes` - Stage and commit with formatted message
- `create_pull_request` - Create PR with metadata
- `get_diff_summary` - Get git diff stats

### 5. **Visual Testing Tools**
- `capture_screenshot` - Take Playwright screenshot, store in DB
- `start_visual_review` - Launch app for visual inspection
- `compare_design` - AI compare mockup vs implementation

### 6. **TypeScript Strictness Tools**
- `validate_types_preemptive` - Check types BEFORE writing code
- `suggest_type_safe_pattern` - Recommend strict type patterns from codebase
- `fix_type_errors` - Auto-fix common type issues

## Pattern Learning MCP Tools (Detailed)

### **1. find_similar_implementations**

```typescript
{
  name: "find_similar_implementations",
  description: "Find existing implementations to learn patterns from",
  inputSchema: {
    feature: "string - Feature being implemented (e.g., 'JWT authentication')",
    filePatterns: "string[] - Glob patterns to search",
    includeTests: "boolean - Include test files in search"
  },
  handler: async (input) => {
    // Search codebase for similar implementations
    const files = await glob(input.filePatterns);
    const implementations = [];

    for (const file of files) {
      const content = await readFile(file);
      const analysis = await analyzeCode(content);

      implementations.push({
        file,
        patterns: {
          typeDefinitions: analysis.types,
          errorHandling: analysis.errorPatterns,
          validation: analysis.validationPatterns,
          structure: analysis.structure
        },
        excerpt: analysis.relevantCode
      });
    }

    return {
      foundPatterns: implementations.length,
      implementations,
      recommendations: [
        "Copy structure from app/api/users/route.ts",
        "Use same error handling pattern",
        "Follow same type definition style"
      ]
    };
  }
}
```

### **2. get_relevant_docs**

```typescript
{
  name: "get_relevant_docs",
  description: "Get documentation for specific topics from project docs",
  inputSchema: {
    topics: "string[] - Topics to get docs for",
    maxResults: "number - Max results per topic"
  },
  handler: async (input) => {
    const docs = [];

    for (const topic of input.topics) {
      // Search project documentation
      const results = await searchDocs(topic);

      // Also get relevant external docs (Next.js, TypeScript)
      const externalDocs = await getExternalDocs(topic);

      docs.push({
        topic,
        projectDocs: results,
        externalDocs,
        codeExamples: extractCodeExamples(results)
      });
    }

    return {
      documentation: docs,
      suggestedReading: [
        "Read project docs first",
        "Then check external docs for gaps",
        "Focus on code examples"
      ]
    };
  }
}
```

## Sentra Command Structure

### **PLAN Phase** - Analyst Agent

**Command:** `.claude/commands/plan.md`

**Pattern-Learning Focus:** Study similar features before planning

```typescript
// 1. FIRST: Find similar features
const similarFeatures = await find_similar_implementations({
  feature: "JWT authentication",
  filePatterns: ["app/api/*/route.ts", "lib/auth/**/*.ts"],
  includeTests: true
});

// 2. Study documentation
const docs = await get_relevant_docs({
  topics: ["API authentication", "Next.js middleware", "JWT best practices"]
});

// 3. Create plan BASED ON patterns (not from scratch)
create_plan({
  taskId: task.id,
  planData: {
    title: "Add JWT authentication",
    description: "...",

    // Reference existing patterns
    referenceImplementations: [
      "app/api/users/route.ts (API structure)",
      "lib/db/schema.ts (type definitions)",
      "app/api/auth/[...nextauth]/route.ts (auth pattern)"
    ],

    // Type definitions copied from existing patterns
    typeDefinitions: `
      // Based on User type pattern
      interface AuthUser {
        id: string;
        email: string;
        role: 'admin' | 'user';
      }

      // Based on API response pattern
      interface AuthToken {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }
    `,

    // Follow existing test patterns
    testStrategy: {
      unit: ["Follow lib/utils/__tests__/*.test.ts pattern"],
      e2e: ["Follow .claude/commands/e2e/test_*.md pattern"]
    }
  }
});
```

### **CODE Phase** - Implementer Agent

**Command:** `.claude/commands/implement.md`

**CRITICAL: Pattern-First Approach** (NOT trial-and-error)

**Workflow:**
```typescript
// 1. FIRST: Study existing patterns (BEFORE coding)
const patterns = await find_similar_implementations({
  feature: "JWT authentication",
  filePatterns: ["app/api/*/route.ts", "lib/auth/*.ts"]
});

// Returns:
// - Existing API routes (structure, error handling, types)
// - Similar auth implementations
// - Type definitions used
// - Testing patterns

// 2. Read documentation for best practices
const docs = await get_relevant_docs({
  topics: ["Next.js 15 API routes", "TypeScript strict mode", "JWT patterns"]
});

// 3. Validate types BEFORE coding (use learned patterns)
const typeValidation = await validate_types_preemptive({
  feature: "JWT authentication",
  expectedFiles: ["app/api/auth/login/route.ts", "lib/auth/jwt.ts"],
  referencePatterns: patterns.typePatterns // Use existing patterns
});

// 4. Get type-safe patterns from codebase
const typePatterns = await suggest_type_safe_pattern({
  context: "API route handler with JWT",
  nextVersion: "15",
  basedOnExisting: true // Learn from codebase, not generic examples
});

// 5. Implement using learned patterns (NOT from scratch)
// Example: Agent reads app/api/users/route.ts
// Copies pattern, adapts for auth
// Result: Consistent structure, fewer errors

// 6. Immediate type check (NO waiting for test phase)
const typecheck = await run_typecheck({
  scope: "changed-files",
  strictMode: true
});

if (!typecheck.success) {
  // Agent reviews pattern again before fixing
  await review_pattern_mismatch({ errors: typecheck.errors });
  await fix_type_errors({ errors: typecheck.errors });
}
```

**Pattern Learning Examples:**

**Bad (Trial & Error):**
```typescript
// Agent guesses at API route structure
export async function POST(req: Request) {
  const data = await req.json(); // any type - ERROR!
  // ... writes code, gets 20 type errors, fixes one by one
}
```

**Good (Pattern-Based):**
```typescript
// 1. Agent reads app/api/users/route.ts
// 2. Learns the pattern:
export async function POST(req: Request) {
  const body = await req.json() as CreateUserInput; // Existing pattern
  const validated = userSchema.parse(body);         // Existing pattern
  // ... follows established error handling pattern
}

// 3. Applies same pattern to auth:
export async function POST(req: Request) {
  const body = await req.json() as LoginInput;      // Same pattern
  const validated = loginSchema.parse(body);        // Same pattern
  // ... same error handling, 0 type errors!
}
```

### **TEST Phase** - Tester Agent (Fresh Context)

**Command:** `.claude/commands/test.md`

**Pattern Learning:** Study existing test patterns before writing tests

```typescript
// 1. Get task info
const task = await get_task_info({ taskId });

// 2. FIRST: Study test patterns
const testPatterns = await find_similar_implementations({
  feature: task.title,
  filePatterns: ["**/*.test.ts", "**/*.spec.ts"],
  includeTests: true
});

// 3. Learn from existing test structure
const docs = await get_relevant_docs({
  topics: ["Vitest patterns", "Playwright E2E", "Test coverage"]
});

// 4. Run tests (should pass if coder followed patterns)
const results = await run_tests({
  backend: { unit: true, integration: true },
  frontend: { unit: true, component: true },
  strictTypeCheck: true,
  lintCheck: true
});

// 5. If fail → Agent reads similar passing tests to understand why
if (!results.allPassed) {
  const passingTests = await find_similar_implementations({
    feature: "working tests for similar feature",
    filePatterns: ["**/*.test.ts"]
  });

  // Compare failed test vs passing tests
  const comparison = await analyze_code_patterns({
    failedCode: results.failedTests,
    successfulCode: passingTests
  });

  // Push back with pattern guidance
  await update_task_phase({
    taskId,
    phase: 'CODE',
    reason: 'Tests fail - code doesn\'t follow test patterns',
    patternGuidance: comparison.recommendations
  });
}
```

### **REVIEW Phase** - Reviewer Agent (Fresh Context)

**Command:** `.claude/commands/review.md`

**Pattern Learning:** Compare against established code quality patterns

```typescript
// 1. Get task context
const task = await get_task_info({ taskId });

// 2. Study code quality patterns
const qualityPatterns = await find_similar_implementations({
  feature: "high-quality implementations",
  filePatterns: ["lib/**/*.ts", "app/**/*.ts"],
  includeTests: false
});

// 3. Compare implementation against patterns
const codeReview = await analyze_code_patterns({
  newCode: task.changedFiles,
  establishedPatterns: qualityPatterns,
  checkFor: [
    "Consistent naming conventions",
    "Proper error handling",
    "Type safety",
    "Code organization"
  ]
});

// 4. Visual review (if UI)
if (task.hasUI) {
  const visualReview = await start_visual_review({
    taskId,
    plan: task.plan,
    compareAgainst: task.mockupUrl
  });

  // Compare against existing UI patterns
  const uiPatterns = await find_similar_implementations({
    feature: "UI components",
    filePatterns: ["app/components/**/*.tsx"]
  });
}

// 5. Approve or reject based on pattern adherence
if (codeReview.adherenceScore < 90) {
  await update_task_phase({
    taskId,
    phase: 'CODE',
    reason: 'Code doesn\'t follow established patterns',
    patternViolations: codeReview.violations
  });
}
```

## Documentation Structure for Pattern Learning

Sentra's documentation is organized for easy pattern discovery:

```
docs/
├── patterns/                    # Code patterns by category
│   ├── api-routes.md           # API route patterns
│   ├── database-queries.md     # Database query patterns
│   ├── error-handling.md       # Error handling patterns
│   ├── type-definitions.md     # TypeScript type patterns
│   └── component-structure.md  # React component patterns
│
├── examples/                    # Complete examples
│   ├── auth-flow/              # Full auth implementation
│   ├── crud-operations/        # CRUD pattern examples
│   └── form-handling/          # Form patterns
│
└── architecture/                # System docs
    ├── 15-sdlc-cycle.md
    ├── 25-worktree-architecture.md
    └── ...
```

**Agent reads in this order:**
1. `patterns/<relevant>.md` - Learn the pattern
2. `examples/<relevant>/` - See it applied
3. Apply to current task
4. Result: Consistent, error-free code

## Sentra Commands List

### Planning
- `plan-feature.md` - Study patterns → Create plan (MCP: find_similar_implementations, create_plan)
- `plan-bug.md` - Study similar bugs → Create fix plan (MCP: find_similar_implementations, create_plan)

### Implementation
- `implement.md` - Learn patterns → Code → Validate types (MCP: find_similar_implementations, run_typecheck)

### Testing
- `test-unit.md` - Learn test patterns → Run tests (MCP: find_similar_implementations, run_tests)
- `test-e2e.md` - Learn E2E patterns → Test with screenshots (MCP: run_e2e_tests)

### Review
- `review.md` - Compare against patterns → Approve/reject (MCP: analyze_code_patterns, start_visual_review)

### Git
- `commit.md` - Follow commit patterns → Create commit (MCP: commit_changes)
- `create-pr.md` - Follow PR template → Create PR (MCP: create_pull_request)

### Utilities
- `find-patterns.md` - Search codebase for patterns (MCP: find_similar_implementations)
- `typecheck.md` - Validate types (MCP: run_typecheck)
- `lint.md` - Check code quality (MCP: run_lint)

## Command Template Example

### **plan-feature.md**

```markdown
# Feature Planning

## Instructions

### Step 1: Learn from Existing Patterns
- **FIRST**: Study similar features in codebase
- Use MCP tool: `find_similar_implementations`
- Read at least 3 similar implementations
- Note patterns: types, structure, error handling, tests

### Step 2: Study Documentation
- Read relevant project documentation
- Use MCP tool: `get_relevant_docs`
- Topics: feature domain, tech stack, best practices

### Step 3: Create Plan Based on Patterns
- **DO NOT** invent new patterns
- **DO** copy existing patterns and adapt
- Reference specific files agents should learn from
- Include type definitions following existing style

### Step 4: Specify Test Patterns
- Reference existing test files to copy
- E.g., "Follow pattern in lib/auth/__tests__/jwt.test.ts"

## MCP Tool Calls

```typescript
// 1. Find patterns
const patterns = await find_similar_implementations({
  feature: "${feature_name}",
  filePatterns: ["app/**/*.ts", "lib/**/*.ts"]
});

// 2. Get docs
const docs = await get_relevant_docs({
  topics: ["${domain}", "Next.js 15", "TypeScript strict"]
});

// 3. Create plan using learned patterns
await create_plan({
  taskId: "${task_id}",
  planData: {
    title: "${title}",
    referenceImplementations: patterns.files,
    typePatterns: patterns.typePatterns,
    testPatterns: patterns.testPatterns,
    // ... rest of plan
  }
});
```

## Report

- Return plan ID from database
- Include list of reference files agent should study during implementation
```

## TypeScript Strictness Through Pattern Learning

Instead of trial-and-error type fixing:

**Agent workflow:**
1. Read existing strictly-typed file
2. Copy type pattern exactly
3. Adapt for new feature
4. Result: 0 type errors

**Example:**

```typescript
// Agent reads lib/db/schema.ts
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 50 }).$type<'admin' | 'user'>().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Agent copies pattern for new auth table
export const authTokens = pgTable('auth_tokens', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  token: varchar('token', { length: 500 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export type AuthToken = typeof authTokens.$inferSelect;
export type NewAuthToken = typeof authTokens.$inferInsert;

// Result: Perfect types, 0 errors, consistent with codebase
```

## Agent Separation with Pattern Learning

**PLAN Agent:**
- Reads similar features
- Learns patterns
- Creates plan with pattern references

**CODE Agent:**
- Reads plan's pattern references
- Studies those files
- Implements using exact patterns
- 0-2 type errors (vs 20+ without patterns)

**TEST Agent:**
- Reads similar tests
- Learns test patterns
- Validates code follows patterns

**REVIEW Agent:**
- Compares against established patterns
- Checks pattern adherence
- Approves only if consistent with codebase

## Summary

Sentra's command conversion strategy:

1. ✅ **Pattern-first learning** - Study before coding
2. ✅ **MCP tools** - Replace bash with tool calls
3. ✅ **Database coordination** - No file passing
4. ✅ **TypeScript strict** - Learn from existing strict code
5. ✅ **Fresh contexts** - Each agent learns independently
6. ✅ **Zero tolerance** - Pattern violations = rejection
7. ✅ **Minimal errors** - Pattern adherence = clean code

**Result:** Agents that code like experienced developers who learn from the codebase, not trial-and-error.
