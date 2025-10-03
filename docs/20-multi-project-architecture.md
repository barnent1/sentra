# Multi-Project Architecture

## Overview

Sentra is designed to manage **multiple projects simultaneously** with intelligent data separation: project-specific data is isolated per project, while stack-specific data (like documentation) is shared across projects with the same stack for maximum efficiency.

## The Core Principle

**Share what's common, isolate what's unique.**

- **Documentation for Next.js 15** is the same for all projects using Next.js 15 → **shared**
- **Task history for Project A** is different from Project B → **isolated**
- **Base agent prompts** are the same for all projects → **shared**
- **Project conventions** are unique per project → **isolated**

## Data Separation Strategy

### Project-Specific Data (Isolated Per Project)

Data that is unique to each project and must not be shared:

| Data Type | Description | Storage |
|-----------|-------------|---------|
| **Project metadata** | Name, path, owner, created date | `projects` table |
| **Tasks** | User-created tasks for this project | `tasks` table (FK to projectId) |
| **Workflow state** | ADW IDs, phase, state data | `workflowState` table (FK to projectId) |
| **Execution logs** | Agent logs, tool calls, errors | `logs` table (FK to projectId) |
| **Git worktrees** | Active worktree paths, branches | `worktrees` table (FK to projectId) |
| **Custom prompts** | Project-specific prompt overrides | `projectPromptOverrides` table |
| **Conventions** | Discovered or specified conventions | JSON field in `projects` table |
| **Validation commands** | Project-specific npm scripts | JSON field in `projects` table |

### Stack-Specific Data (Shared Across Projects)

Data that is identical for all projects using the same stack combination:

| Data Type | Description | Storage |
|-----------|-------------|---------|
| **Documentation** | Framework/library official docs | `documentationChunks` table (FK to stackId) |
| **Code patterns** | Best practices, examples | `stackPatterns` table (FK to stackId) |
| **Stack profile** | Framework, version, language | `stacks` table |
| **Version metadata** | Release notes, migration guides | `stackVersions` table (FK to stackId) |

### Global Data (Shared Across All Projects)

Data that is universal to Sentra:

| Data Type | Description | Storage |
|-----------|-------------|---------|
| **Base agent prompts** | Default prompts for all agents | `agentPrompts` table |
| **User accounts** | User info, authentication | `users` table |
| **MCP configuration** | Server URLs, endpoints | `mcpServers` table |
| **System settings** | Global Sentra configuration | `systemSettings` table |

## Database Schema

### Project-Specific Tables

```typescript
// Project metadata
export const projects = pgTable('projects', {
  id: varchar('id', { length: 255 }).primaryKey(), // proj_abc123
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  path: text('path').notNull(), // Local file path

  // Stack reference (for shared documentation)
  stackId: varchar('stack_id', { length: 255 }).notNull(),

  // Denormalized for fast queries (no JOIN needed)
  stackFramework: varchar('stack_framework', { length: 100 }),
  stackLanguage: varchar('stack_language', { length: 50 }),

  // Project-specific data
  conventions: jsonb('conventions'), // Discovered conventions
  validation: jsonb('validation'), // npm run commands

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks (isolated per project)
export const tasks = pgTable('tasks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  projectId: varchar('project_id', { length: 255 }).notNull(),

  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }), // chore, bug, feature
  status: varchar('status', { length: 50 }).notNull(),
  priority: varchar('priority', { length: 50 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Workflow state (isolated per project)
export const workflowState = pgTable('workflow_state', {
  id: serial('id').primaryKey(),
  projectId: varchar('project_id', { length: 255 }).notNull(),
  taskId: varchar('task_id', { length: 255 }).notNull(),
  adwId: varchar('adw_id', { length: 255 }).notNull(),

  phase: varchar('phase', { length: 50 }).notNull(),
  state: jsonb('state').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Logs (isolated per project)
export const logs = pgTable('logs', {
  id: serial('id').primaryKey(),
  projectId: varchar('project_id', { length: 255 }).notNull(),
  taskId: varchar('task_id', { length: 255 }),
  adwId: varchar('adw_id', { length: 255 }),

  phase: varchar('phase', { length: 50 }),
  level: varchar('level', { length: 20 }).notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),

  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Git worktrees (isolated per project)
export const worktrees = pgTable('worktrees', {
  id: serial('id').primaryKey(),
  projectId: varchar('project_id', { length: 255 }).notNull(),
  taskId: varchar('task_id', { length: 255 }).notNull(),

  path: text('path').notNull(),
  branchName: varchar('branch_name', { length: 255 }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Project-specific prompt overrides
export const projectPromptOverrides = pgTable('project_prompt_overrides', {
  id: serial('id').primaryKey(),
  projectId: varchar('project_id', { length: 255 }).notNull(),
  agentName: varchar('agent_name', { length: 255 }).notNull(),

  customPrompt: text('custom_prompt').notNull(),
  reason: text('reason'), // Why this override exists

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Unique constraint: one override per agent per project
  uniqueProjectAgent: unique('project_agent').on(projectId, agentName),
});
```

### Stack-Specific Tables

```typescript
// Stack definitions (shared resource)
export const stacks = pgTable('stacks', {
  id: varchar('id', { length: 255 }).primaryKey(), // stack_abc123

  // Stack components
  framework: varchar('framework', { length: 100 }).notNull(),
  frameworkVersion: varchar('framework_version', { length: 50 }),
  language: varchar('language', { length: 50 }).notNull(),
  database: varchar('database', { length: 100 }),
  orm: varchar('orm', { length: 100 }),
  styling: jsonb('styling'), // Array of styling solutions
  stateManagement: varchar('state_management', { length: 100 }),

  // Hash for deduplication
  hash: varchar('hash', { length: 64 }).notNull().unique(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Documentation chunks (shared per stack)
export const documentationChunks = pgTable('documentation_chunks', {
  id: serial('id').primaryKey(),
  stackId: varchar('stack_id', { length: 255 }).notNull(),

  framework: varchar('framework', { length: 100 }).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  category: varchar('category', { length: 100 }), // api, components, hooks
  title: varchar('title', { length: 500 }),

  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }), // pgvector
  keywords: text('keywords').array(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Stack patterns (shared per stack)
export const stackPatterns = pgTable('stack_patterns', {
  id: serial('id').primaryKey(),
  stackId: varchar('stack_id', { length: 255 }).notNull(),

  patternName: varchar('pattern_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  description: text('description'),
  example: text('example').notNull(),
  bestPractice: text('best_practice'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Global Tables

```typescript
// Base agent prompts (global resource)
export const agentPrompts = pgTable('agent_prompts', {
  id: serial('id').primaryKey(),
  agentName: varchar('agent_name', { length: 255 }).notNull().unique(),
  phase: varchar('phase', { length: 50 }), // PLAN, CODE, TEST, REVIEW

  prompt: text('prompt').notNull(),
  version: integer('version').default(1).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Users (global resource)
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  plan: varchar('plan', { length: 50 }).default('free'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// MCP servers (global resource)
export const mcpServers = pgTable('mcp_servers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url').notNull(),
  transport: varchar('transport', { length: 50 }), // stdio, sse, http

  isDefault: boolean('is_default').default(false),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## Stack Fingerprinting

### The Problem

Multiple projects with identical stacks should not duplicate documentation:

```
❌ Without fingerprinting:
Project A: Next.js 15 + TS + PostgreSQL → stores 50 doc chunks
Project B: Next.js 15 + TS + PostgreSQL → stores 50 doc chunks (duplicate!)
Project C: React 18 + JS + MongoDB → stores 40 doc chunks

Total: 140 chunks (90 are duplicates)
```

```
✅ With fingerprinting:
Stack 1 (Next.js 15 + TS + PostgreSQL) → stores 50 doc chunks
  ├─ Project A → references Stack 1
  └─ Project B → references Stack 1

Stack 2 (React 18 + JS + MongoDB) → stores 40 doc chunks
  └─ Project C → references Stack 2

Total: 90 chunks (no duplicates)
```

### Stack Hash Generation

```typescript
function generateStackHash(stackProfile: StackProfile): string {
  // Normalize to canonical form
  const canonical = {
    framework: stackProfile.framework.toLowerCase(),
    frameworkVersion: normalizeVersion(stackProfile.frameworkVersion),
    language: stackProfile.language.toLowerCase(),
    database: stackProfile.database?.toLowerCase() || null,
    orm: stackProfile.orm?.toLowerCase() || null,
    styling: stackProfile.styling?.sort() || [],
    stateManagement: stackProfile.stateManagement?.toLowerCase() || null,
  };

  // Create deterministic JSON string
  const jsonString = JSON.stringify(canonical, Object.keys(canonical).sort());

  // Hash with SHA-256
  return createHash('sha256').update(jsonString).digest('hex');
}

// Normalize version to major.minor (ignore patch)
function normalizeVersion(version: string): string {
  const parts = version.split('.');
  return `${parts[0]}.${parts[1] || 0}`;
}
```

### Examples

```typescript
// These generate the SAME hash:
generateStackHash({
  framework: 'Next.js',
  frameworkVersion: '15.0.2',
  language: 'TypeScript',
  database: 'PostgreSQL',
  orm: 'Drizzle',
  styling: ['Tailwind', 'ShadCN'],
});
// → hash: abc123...

generateStackHash({
  framework: 'nextjs',  // case difference
  frameworkVersion: '15.0.5',  // patch difference ignored
  language: 'typescript',
  database: 'postgresql',
  orm: 'drizzle',
  styling: ['ShadCN', 'Tailwind'],  // order doesn't matter (sorted)
});
// → hash: abc123...  (SAME!)

// This generates a DIFFERENT hash:
generateStackHash({
  framework: 'nextjs',
  frameworkVersion: '15.0.0',
  language: 'javascript',  // Different language
  database: 'postgresql',
  orm: 'drizzle',
  styling: ['Tailwind', 'ShadCN'],
});
// → hash: def456...  (DIFFERENT)
```

### Stack Lookup or Create

```typescript
async function getOrCreateStack(stackProfile: StackProfile): Promise<string> {
  const hash = generateStackHash(stackProfile);

  // Check if stack exists
  const existing = await db
    .select()
    .from(stacks)
    .where(eq(stacks.hash, hash))
    .limit(1);

  if (existing.length > 0) {
    console.log('♻️  Stack already exists, reusing...');
    return existing[0].id;
  }

  // Create new stack
  const stackId = `stack_${generateId()}`;

  await db.insert(stacks).values({
    id: stackId,
    framework: stackProfile.framework,
    frameworkVersion: stackProfile.frameworkVersion,
    language: stackProfile.language,
    database: stackProfile.database,
    orm: stackProfile.orm,
    styling: stackProfile.styling,
    stateManagement: stackProfile.stateManagement,
    hash,
  });

  console.log('✨ New stack created, fetching documentation...');

  // Fetch and store documentation for this stack
  await fetchAndStoreDocumentation(stackId, stackProfile);

  return stackId;
}
```

## Documentation Sharing

### Shared Documentation Storage

```typescript
// When Project A or Project B queries documentation:
async function lookupDocumentation(
  query: string,
  projectId: string
): Promise<DocumentationChunk[]> {
  // Get project's stack ID
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const stackId = project[0].stackId;

  // Search documentation for this stack
  const docs = await db
    .select()
    .from(documentationChunks)
    .where(eq(documentationChunks.stackId, stackId))
    .where(sql`embedding <=> ${queryEmbedding} < 0.3`) // Vector similarity
    .limit(5);

  return docs;
}
```

**Key point:** Both Project A and Project B have `stackId: stack_abc123`, so they query the **same documentation chunks**.

### Documentation Update Propagation

When documentation is updated, **all projects with that stack benefit**:

```typescript
// Update Next.js documentation
async function updateStackDocumentation(
  framework: string,
  version: string
): Promise<void> {
  // Find all stacks using this framework + version
  const affectedStacks = await db
    .select()
    .from(stacks)
    .where(eq(stacks.framework, framework))
    .where(eq(stacks.frameworkVersion, version));

  for (const stack of affectedStacks) {
    // Delete old docs
    await db
      .delete(documentationChunks)
      .where(eq(documentationChunks.stackId, stack.id));

    // Fetch and store new docs
    await fetchAndStoreDocumentation(stack.id, framework, version);
  }

  console.log(`✅ Updated documentation for ${affectedStacks.length} stacks`);
}
```

**All projects using Next.js 15** automatically get the updated documentation.

## Agent Prompt Hierarchy

### 3-Level Prompt System

Prompts are composed from three sources:

```
Final Prompt = Base Prompt + Stack Additions + Project Override
```

#### Level 1: Base Prompt (Global)

Stored in `agentPrompts` table, shared across all projects:

```markdown
# Planning Agent

Create a detailed implementation plan...

## Instructions
- Research the codebase
- THINK HARD about requirements
- Follow existing patterns
...
```

#### Level 2: Stack Additions (Per Stack)

Stack-specific instructions (stored in `stacks` table or generated dynamically):

```markdown
## Stack Context

This project uses:
- Framework: Next.js 15.0.0
- Language: TypeScript 5.3.0
- Database: PostgreSQL (Drizzle ORM)

## Stack-Specific Requirements
- Use App Router (not Pages Router)
- Avoid 'any' types
- Use Drizzle queries (not raw SQL)
...
```

#### Level 3: Project Override (Per Project)

Project-specific customizations (stored in `projectPromptOverrides` table):

```markdown
## Project-Specific Override

IMPORTANT: This project uses a custom monorepo structure:
- API routes: /server/api/ (not /app/api/)
- Components: /client/components/
- Shared libs: /packages/

Follow this structure when creating files.
```

### Prompt Composition

```typescript
async function getAgentPrompt(
  agentName: string,
  projectId: string
): Promise<string> {
  // 1. Get base prompt (global)
  const basePromptResult = await db
    .select()
    .from(agentPrompts)
    .where(eq(agentPrompts.agentName, agentName))
    .limit(1);

  if (basePromptResult.length === 0) {
    throw new Error(`Agent prompt not found: ${agentName}`);
  }

  const basePrompt = basePromptResult[0].prompt;

  // 2. Get project and stack info
  const projectResult = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const project = projectResult[0];

  const stackResult = await db
    .select()
    .from(stacks)
    .where(eq(stacks.id, project.stackId))
    .limit(1);

  const stack = stackResult[0];

  // 3. Generate stack-specific additions
  const stackAdditions = generateStackContext(stack, project);

  // 4. Check for project-specific override
  const overrideResult = await db
    .select()
    .from(projectPromptOverrides)
    .where(eq(projectPromptOverrides.projectId, projectId))
    .where(eq(projectPromptOverrides.agentName, agentName))
    .limit(1);

  // If override exists, use it entirely (replaces base + stack)
  if (overrideResult.length > 0) {
    return overrideResult[0].customPrompt;
  }

  // Otherwise, compose: base + stack
  return `${basePrompt}\n\n${stackAdditions}`;
}

function generateStackContext(stack: Stack, project: Project): string {
  return `
## Project Stack

This project uses:
- Framework: ${stack.framework} ${stack.frameworkVersion}
- Language: ${stack.language}
- Database: ${stack.database}${stack.orm ? ` (via ${stack.orm})` : ''}
- Styling: ${Array.isArray(stack.styling) ? stack.styling.join(', ') : stack.styling}

## Project Conventions

${JSON.stringify(project.conventions, null, 2)}

## Validation Requirements

Before completing tasks, run:
${project.validation.typeCheck ? `- ${project.validation.typeCheck}` : ''}
${project.validation.lint ? `- ${project.validation.lint}` : ''}
${project.validation.build ? `- ${project.validation.build}` : ''}
`;
}
```

## Project-Specific Customizations

### When to Override Prompts

Most projects use base + stack prompts. Override when:

1. **Custom file structure** (not standard for the framework)
2. **Unusual conventions** (e.g., kebab-case instead of PascalCase)
3. **Special requirements** (e.g., accessibility mandates)
4. **Legacy constraints** (e.g., must use old API)

### Creating an Override

```typescript
async function createProjectPromptOverride(
  projectId: string,
  agentName: string,
  customPrompt: string,
  reason: string
): Promise<void> {
  await db.insert(projectPromptOverrides).values({
    projectId,
    agentName,
    customPrompt,
    reason,
  });
}

// Example usage
await createProjectPromptOverride(
  'proj_002',
  'coder',
  `
# Coding Agent (Project Override)

... (full custom prompt here) ...

IMPORTANT: This project uses custom structure:
- API: /server/api/
- Components: /client/components/
  `,
  'Custom monorepo structure incompatible with standard Next.js layout'
);
```

## Query Performance Optimization

### Problem: Frequent JOINs

Without optimization, every query needs JOINs:

```sql
-- Get project with stack info (requires JOIN)
SELECT p.*, s.*
FROM projects p
JOIN stacks s ON p.stack_id = s.id
WHERE p.id = 'proj_001';
```

### Solution: Denormalization

Store frequently accessed stack fields on the `projects` table:

```typescript
projects {
  id
  stackId (FK)
  // Denormalized for fast access
  stackFramework
  stackLanguage
  stackVersion
}

// Now queries are fast (no JOIN)
SELECT * FROM projects WHERE stack_framework = 'nextjs';
```

### Index Strategy

```sql
-- Projects table
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_stack_id ON projects(stack_id);
CREATE INDEX idx_projects_stack_framework ON projects(stack_framework);

-- Tasks table
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Logs table
CREATE INDEX idx_logs_project_id ON logs(project_id);
CREATE INDEX idx_logs_task_id ON logs(task_id);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);

-- Documentation chunks table
CREATE INDEX idx_docs_stack_id ON documentation_chunks(stack_id);
CREATE INDEX idx_docs_framework ON documentation_chunks(framework, version);
```

### Vector Index for Documentation Search

```sql
-- pgvector index for fast semantic search
CREATE INDEX idx_docs_embedding ON documentation_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

## Multi-Tenant Considerations

### User Isolation

Users only see their own projects:

```typescript
// Get projects for a user
async function getUserProjects(userId: string): Promise<Project[]> {
  return await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId));
}

// Get tasks for a project (with user check)
async function getProjectTasks(
  projectId: string,
  userId: string
): Promise<Task[]> {
  // Verify user owns project
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .where(eq(projects.userId, userId))
    .limit(1);

  if (project.length === 0) {
    throw new Error('Project not found or unauthorized');
  }

  // Get tasks
  return await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));
}
```

### Shared Resources (Stacks & Docs)

Stacks and documentation are **global** (not user-scoped):

```typescript
// Any user can reference any stack
// This is safe because stacks only contain public information

const stack = await db
  .select()
  .from(stacks)
  .where(eq(stacks.hash, stackHash))
  .limit(1);

// Documentation is also global
const docs = await db
  .select()
  .from(documentationChunks)
  .where(eq(documentationChunks.stackId, stackId))
  .limit(10);
```

### Row-Level Security (RLS) with Drizzle

For extra security, implement RLS policies (if using Supabase or similar):

```sql
-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own projects
CREATE POLICY projects_user_isolation ON projects
  FOR ALL
  USING (user_id = auth.uid());

-- Tasks inherit security from projects via FK
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_user_isolation ON tasks
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
```

## Data Flow Example

### Scenario: User has 3 projects

**User:** user_123

**Projects:**
- Project A: Next.js 15 + TypeScript + PostgreSQL
- Project B: Next.js 15 + TypeScript + PostgreSQL (same stack!)
- Project C: React 18 + JavaScript + MongoDB

### Database State

```
users table:
  user_123

stacks table:
  stack_abc123: Next.js 15 + TS + PostgreSQL (hash: abc123...)
  stack_def456: React 18 + JS + MongoDB (hash: def456...)

projects table:
  proj_001 (userId: user_123, stackId: stack_abc123)
  proj_002 (userId: user_123, stackId: stack_abc123)  ← shares stack
  proj_003 (userId: user_123, stackId: stack_def456)

documentationChunks table:
  [50 chunks] → stackId: stack_abc123  ← shared by proj_001 & proj_002
  [40 chunks] → stackId: stack_def456  ← used by proj_003

tasks table:
  task_001 (projectId: proj_001, title: "Add auth")
  task_002 (projectId: proj_001, title: "Fix bug")
  task_003 (projectId: proj_002, title: "Add feature")
  task_004 (projectId: proj_003, title: "Refactor")
```

### Storage Efficiency

**Without sharing:**
- Proj 001: 50 doc chunks
- Proj 002: 50 doc chunks (duplicate)
- Proj 003: 40 doc chunks
- **Total:** 140 chunks

**With sharing:**
- Stack abc123: 50 doc chunks (shared by proj_001 & proj_002)
- Stack def456: 40 doc chunks
- **Total:** 90 chunks

**Savings:** 36% reduction in documentation storage.

## Summary

Sentra's multi-project architecture achieves:

1. **Efficient Storage**: Stack-specific data (docs, patterns) shared across projects
2. **Project Isolation**: Tasks, logs, worktrees isolated per project
3. **Smart Deduplication**: Stack fingerprinting eliminates duplicate documentation
4. **Fast Queries**: Denormalized fields and indexes for performance
5. **Flexible Customization**: 3-level prompt system (base + stack + project)
6. **Multi-Tenancy**: User-scoped projects, global shared resources
7. **Scalability**: Designed to handle hundreds of projects per user

**Key Principle:** Share what's common (documentation for Next.js), isolate what's unique (tasks for Project A).

This architecture ensures Sentra scales efficiently while maintaining perfect code quality for every project, regardless of stack.