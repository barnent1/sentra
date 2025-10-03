# Agent Prompt Architecture

## Philosophy

Sentra's agent prompts are **detailed, prescriptive, and stack-oriented**. Unlike generic prompts, Sentra prompts:

- Provide **explicit templates** for output formats
- Use **variable substitution** for dynamic context
- Include **IMPORTANT** callouts for critical instructions
- Reference **specific files and patterns** in the codebase
- Enforce **conventions and standards**
- Guide **reasoning** ("THINK HARD about...")
- Require **structured reporting** (return file paths, JSON, specific outputs)

This approach ensures **consistent, high-quality output** across all agents.

## Prompt Storage: Database, Not Files

**Critical Design Decision:** Agent prompts are **stored in PostgreSQL**, not as .md files in the codebase.

### Why Database Storage?

| Aspect | Database Storage | File Storage |
|--------|------------------|--------------|
| **Codebase Clutter** | Zero clutter | Many .md files |
| **Version Control** | Database versioning | Git commits for prompts |
| **Dynamic Updates** | Update without deployment | Requires code deployment |
| **Retrieval** | Fast queries | File system reads |
| **Management** | UI-based editing | Manual file editing |
| **History** | Built-in versioning | Git history |

### Database Schema

```typescript
// Drizzle schema
export const agentPrompts = pgTable('agent_prompts', {
  id: serial('id').primaryKey(),
  agentName: varchar('agent_name', { length: 255 }).notNull().unique(),
  phase: varchar('phase', { length: 50 }), // PLAN, CODE, TEST, REVIEW
  prompt: text('prompt').notNull(), // The full prompt text
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Index for fast lookups
  agentNameIdx: index('agent_name_idx').on(agentName),
});

export const promptVersions = pgTable('prompt_versions', {
  id: serial('id').primaryKey(),
  agentName: varchar('agent_name', { length: 255 }).notNull(),
  prompt: text('prompt').notNull(),
  version: integer('version').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  notes: text('notes'), // What changed in this version

  // Index for version queries
  versionIdx: index('version_idx').on(agentName, version),
});
```

### Retrieving Prompts

```typescript
async function getAgentPrompt(agentName: string): Promise<string> {
  const result = await db
    .select()
    .from(agentPrompts)
    .where(eq(agentPrompts.agentName, agentName))
    .limit(1);

  if (result.length === 0) {
    throw new Error(`Agent prompt not found: ${agentName}`);
  }

  return result[0].prompt;
}

// Usage in workflows
const planningPrompt = await getAgentPrompt('planner');
const codingPrompt = await getAgentPrompt('coder');
```

### Updating Prompts

```typescript
async function updateAgentPrompt(
  agentName: string,
  newPrompt: string,
  notes?: string
): Promise<void> {
  // Get current version
  const current = await db
    .select()
    .from(agentPrompts)
    .where(eq(agentPrompts.agentName, agentName))
    .limit(1);

  if (current.length === 0) {
    throw new Error(`Agent prompt not found: ${agentName}`);
  }

  const currentVersion = current[0].version;
  const newVersion = currentVersion + 1;

  // Archive old version
  await db.insert(promptVersions).values({
    agentName,
    prompt: current[0].prompt,
    version: currentVersion,
    notes,
  });

  // Update to new version
  await db
    .update(agentPrompts)
    .set({
      prompt: newPrompt,
      version: newVersion,
      updatedAt: new Date(),
    })
    .where(eq(agentPrompts.agentName, agentName));
}
```

### Frontend Prompt Editor

```tsx
// Dashboard component for managing prompts
function PromptEditor({ agentName }: { agentName: string }) {
  const [prompt, setPrompt] = useState('');
  const [versions, setVersions] = useState<PromptVersion[]>([]);

  async function savePrompt() {
    await fetch(`/api/prompts/${agentName}`, {
      method: 'PUT',
      body: JSON.stringify({ prompt, notes: 'Updated via dashboard' }),
    });
  }

  return (
    <div className="prompt-editor">
      <h2>Agent: {agentName}</h2>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={30}
      />

      <button onClick={savePrompt}>Save Prompt</button>

      <h3>Version History</h3>
      <PromptVersionList versions={versions} />
    </div>
  );
}
```

## Prompt Structure Template

All Sentra agent prompts follow this template:

```markdown
# <Agent Purpose>

<Brief description of what this agent does>

## Variables
<list input variables that will be substituted>

## Instructions
<detailed instructions for the agent>
- Use IMPORTANT callouts for critical points
- Be explicit about requirements
- Reference specific files and patterns
- Guide reasoning process

## Relevant Files
<list files the agent should read/consider>

## <Output Format Name>
<prescriptive output format template>
- Use placeholders: <placeholder>
- Provide structure
- Show examples

## Report
<what the agent should output when done>
- IMPORTANT: Be explicit about what to return
```

## Example: Feature Planning Agent (Sentra Adapted)

Below is the feature planning agent prompt, adapted for Sentra's Next.js/TypeScript stack:

```markdown
# Feature Planning Agent

Create a detailed implementation plan for a new feature using the exact specified markdown Plan Format. Follow the Instructions to create the plan using the Relevant Files to focus on the right files.

## Variables
task_id: $1
adw_id: $2
task_json: $3

## Instructions

- IMPORTANT: You're writing a plan to implement a net new feature based on the Feature that will add value to the application.
- IMPORTANT: The Feature describes the feature that will be implemented but remember we're not implementing the feature, we're creating the plan that will be used to implement the feature based on the Plan Format below.
- Store the plan in the database in the 'plans' table with columns: task_id, adw_id, content, created_at
- Use the Plan Format below to create the plan content.
- Research the codebase to understand existing patterns, architecture, and conventions before planning the feature.
- IMPORTANT: Replace every <placeholder> in the Plan Format with the requested value. Add as much detail as needed to implement the feature successfully.
- Use your reasoning model: THINK HARD about the feature requirements, design, and implementation approach.
- Follow existing patterns and conventions in the codebase. Don't reinvent the wheel.
- Design for extensibility and maintainability.
- If you need a new library, use `npm install` or `bun add` and be sure to report it in the Notes section of the Plan Format.
- IMPORTANT: If the feature includes UI components or user interactions:
  - Add a task in the Step by Step Tasks section to create end-to-end tests
  - Add E2E test validation to your Validation Commands section
  - Use Playwright for E2E tests (see existing tests in __tests__/e2e/)
- Respect the Sentra tech stack:
  - Next.js (App Router, no src directory)
  - TypeScript
  - Tailwind CSS + ShadCN
  - Framer Motion for animations
  - PostgreSQL + Drizzle ORM
  - ESLint
- Start your research by reading the README.md file.

## Relevant Files

**IMPORTANT:** Project structure varies by codebase. Always start by reading `README.md` to understand the specific project layout.

For Sentra-managed projects using Next.js (App Router, no src directory):
- `README.md` - Contains the project overview and instructions
- `app/**` - Next.js App Router pages, layouts, and API routes
- `components/**` - React components (typically ShadCN based)
- `lib/**` - Shared utilities, helpers, and business logic
- `db/**` - Database schema (Drizzle ORM) and migrations
- `__tests__/**` - Test files (unit and E2E)

**Note:** Sentra's agentic workflows are invoked via MCP tool calls and live in Sentra's MCP server, NOT in user project codebases. There is no `adws/` or `workflows/` directory in user projects.

Ignore configuration files, build artifacts, and other non-source files unless specifically relevant to the task.

## Plan Format

```md
# Feature: <feature name>

## Metadata
task_id: `{task_id}`
adw_id: `{adw_id}`
task_json: `{task_json}`

## Feature Description
<describe the feature in detail, including its purpose and value to users>

## User Story
As a <type of user>
I want to <action/goal>
So that <benefit/value>

## Problem Statement
<clearly define the specific problem or opportunity this feature addresses>

## Solution Statement
<describe the proposed solution approach and how it solves the problem>

## Relevant Files
Use these files to implement the feature:

<find and list the files that are relevant to the feature describe why they are relevant in bullet points. If there are new files that need to be created to implement the feature, list them in an h3 'New Files' section.>

## Implementation Plan
### Phase 1: Foundation
<describe the foundational work needed before implementing the main feature>

### Phase 2: Core Implementation
<describe the main implementation work for the feature>

### Phase 3: Integration
<describe how the feature will integrate with existing functionality>

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

<list step by step tasks as h3 headers plus bullet points. use as many h3 headers as needed to implement the feature. Order matters, start with the foundational shared changes required then move on to the specific implementation. Include creating tests throughout the implementation process.>

<If the feature affects UI, include a task to create Playwright E2E tests as one of your early tasks. Those tests should validate the feature works as expected, be specific with the steps to demonstrate the new functionality. We want the minimal set of steps to validate the feature works as expected.>

<Your last step should be running the Validation Commands to validate the feature works correctly with zero regressions.>

## Testing Strategy
### Unit Tests
<describe unit tests needed for the feature using Jest/Vitest>

### E2E Tests
<describe E2E tests needed using Playwright>

### Edge Cases
<list edge cases that need to be tested>

## Acceptance Criteria
<list specific, measurable criteria that must be met for the feature to be considered complete>

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

<list commands you'll use to validate with 100% confidence the feature is implemented correctly with zero regressions. every command must execute without errors so be specific about what you want to run to validate the feature works as expected. Include commands to test the feature end-to-end.>

- `npm run test` - Run unit tests to validate the feature works with zero regressions
- `npm run type-check` - Run TypeScript type checking
- `npm run build` - Run production build to validate no build errors
- `npm run test:e2e` - Run E2E tests to validate feature functionality

## Notes
<optionally list any additional notes, future considerations, or context that are relevant to the feature that will be helpful to the developer>
```

## Feature
Extract the feature details from the `task_json` variable (parse the JSON and use the title and description fields).

## Report

- IMPORTANT: After storing the plan in the database, return exclusively the plan ID and nothing else in this format: `PLAN_ID:<id>`
```

### Key Elements Breakdown

#### 1. Variables Section
```markdown
## Variables
task_id: $1
adw_id: $2
task_json: $3
```

- **Purpose**: Define dynamic inputs that will be substituted at runtime
- **Naming**: Use descriptive names (task_id, not x)
- **Convention**: $1, $2, $3 for positional arguments OR named keys

#### 2. Instructions Section
```markdown
## Instructions

- IMPORTANT: You're writing a plan...
- IMPORTANT: The Feature describes...
- Use your reasoning model: THINK HARD about...
```

- **IMPORTANT callouts**: Highlight critical requirements
- **Explicit guidance**: Tell agent exactly what to do
- **Reasoning prompts**: Encourage thoughtful analysis
- **Constraints**: "Don't reinvent the wheel"
- **Stack specificity**: Reference Sentra's stack

#### 3. Relevant Files Section
```markdown
## Relevant Files

**IMPORTANT:** Always read README.md first to understand project structure.

For Next.js projects (typical):
- `README.md` - Project overview
- `app/**` - Pages and API routes
- `components/**` - React components
- `lib/**` - Utilities

Ignore all other files in the codebase.
```

- **Focus**: Tell agent where to look
- **Context**: Explain why each file matters
- **Boundaries**: Explicitly exclude irrelevant files
- **Adaptability**: Recognize project structures vary

#### 4. Output Format Section
```markdown
## Plan Format

```md
# Feature: <feature name>
...
```
```

- **Template**: Provide exact structure
- **Placeholders**: Use `<placeholder>` for agent to fill
- **Examples**: Show what good looks like
- **Prescriptive**: Leave no ambiguity

#### 5. Report Section
```markdown
## Report

- IMPORTANT: After storing the plan in the database, return exclusively the plan ID and nothing else in this format: `PLAN_ID:<id>`
```

- **Explicit output**: Tell agent exactly what to return
- **Format**: Specify the exact format (e.g., `PLAN_ID:<id>`)
- **Nothing else**: Prevent extra commentary

## Other Agent Prompt Examples

### Coding Agent Prompt

```markdown
# Coding Agent

Implement the planned feature based on the Implementation Plan.

## Variables
task_id: $1
adw_id: $2
plan_id: $3

## Instructions

- IMPORTANT: You are implementing code based on an existing plan. Read the plan first.
- Follow the Step by Step Tasks exactly as written in the plan
- Use existing patterns and conventions in the codebase
- THINK HARD about edge cases and error handling
- Write clean, maintainable, well-documented code
- Add TypeScript types to all functions and components
- Use ShadCN components for UI (import from @/components/ui)
- Follow Tailwind CSS conventions for styling
- Add inline comments for complex logic
- IMPORTANT: After each significant change, run `npm run type-check` to validate TypeScript

## Relevant Files

Read the plan to determine relevant files. Focus on:
- Files listed in the plan's "Relevant Files" section
- New files listed in the plan's "New Files" section

## Implementation Requirements

### Code Quality
- TypeScript strict mode compliance
- Proper error handling (try/catch, error boundaries)
- Accessibility (ARIA labels, keyboard navigation)
- Performance (memoization, lazy loading)

### Naming Conventions
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Functions: camelCase (e.g., `fetchUserData`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- Database tables: snake_case (e.g., `user_profiles`)

### File Organization
- Components: `components/<feature>/<ComponentName>.tsx`
- Pages: `app/<route>/page.tsx`
- API routes: `app/api/<endpoint>/route.ts`
- Database: `db/schema/<table>.ts`
- Utilities: `lib/<utility>.ts`

## Report

- IMPORTANT: Return a JSON summary of changes in this exact format:
```json
{
  "filesModified": ["path/to/file1.ts", "path/to/file2.tsx"],
  "filesCreated": ["path/to/newfile.ts"],
  "summary": "Brief description of implementation"
}
```
```

### Testing Agent Prompt

```markdown
# Testing Agent

Create comprehensive tests for the implemented feature.

## Variables
task_id: $1
adw_id: $2
implementation_summary: $3

## Instructions

- IMPORTANT: Create both unit tests and E2E tests
- Read the implementation to understand what needs testing
- THINK HARD about edge cases and failure scenarios
- Write tests that validate behavior, not implementation details
- Use descriptive test names that explain what's being tested
- Aim for high coverage but focus on critical paths
- IMPORTANT: All tests must pass before reporting completion

## Relevant Files

- Implementation files from the CODE phase
- Existing test files for patterns
- `__tests__/unit/**` - Unit test examples
- `__tests__/e2e/**` - E2E test examples

## Test Requirements

### Unit Tests
- Use Jest or Vitest
- Test utility functions
- Test React components (React Testing Library)
- Test API route handlers
- Mock external dependencies
- Test error scenarios

### E2E Tests
- Use Playwright
- Test user flows end-to-end
- Test critical paths only (not every edge case)
- Include screenshots for visual validation
- Test responsive behavior if UI is involved

### Test Structure
```typescript
describe('Feature: <feature name>', () => {
  describe('<component/function name>', () => {
    it('should <expected behavior>', () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle <edge case>', () => {
      // ...
    });
  });
});
```

## Validation Commands

Run these commands to validate tests work correctly:
- `npm run test` - Run all unit tests
- `npm run test:e2e` - Run all E2E tests
- `npm run test:coverage` - Check test coverage

## Report

- IMPORTANT: Return test results in this format:
```json
{
  "unitTests": {
    "total": 15,
    "passed": 15,
    "failed": 0,
    "coverage": 85
  },
  "e2eTests": {
    "total": 3,
    "passed": 3,
    "failed": 0
  },
  "summary": "All tests passing"
}
```
```

### Review Agent Prompt

```markdown
# Review Agent

Perform comprehensive code review of the implemented feature.

## Variables
task_id: $1
adw_id: $2
implementation_summary: $3

## Instructions

- IMPORTANT: You are a senior code reviewer focusing on quality, security, and maintainability
- Read all modified and created files
- THINK HARD about potential bugs, security vulnerabilities, and performance issues
- Check adherence to Sentra's conventions and patterns
- Validate that tests are comprehensive
- Look for opportunities to improve code quality
- Be constructive in feedback

## Review Checklist

### Code Quality
- [ ] TypeScript types are correct and comprehensive
- [ ] Error handling is robust
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Functions are focused and single-purpose
- [ ] Comments explain "why", not "what"
- [ ] No unused imports or variables
- [ ] Consistent naming conventions

### Security
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (using Drizzle parameterized queries)
- [ ] XSS prevention (React escapes by default, but check dangerouslySetInnerHTML)
- [ ] Authentication/authorization checks
- [ ] Sensitive data not exposed in logs or errors
- [ ] Environment variables used for secrets

### Performance
- [ ] Database queries are optimized (indexes, pagination)
- [ ] Components memoized where appropriate
- [ ] Large lists virtualized
- [ ] Images optimized
- [ ] Code splitting for large features

### Accessibility
- [ ] Semantic HTML elements
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support
- [ ] Color contrast meets WCAG standards

### Testing
- [ ] Unit tests cover critical logic
- [ ] E2E tests cover user flows
- [ ] Edge cases tested
- [ ] Error scenarios tested

## Report

- IMPORTANT: Return review results in this exact format:
```json
{
  "approved": true,
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "file": "path/to/file.ts",
      "line": 42,
      "description": "Description of issue",
      "suggestion": "How to fix it"
    }
  ],
  "summary": "Overall assessment"
}
```

- If approved: true, the feature is ready to merge
- If approved: false, issues must be addressed first
```

## Variable Substitution System

### How It Works

```typescript
// Workflow invokes agent with variables
const prompt = await getAgentPrompt('planner');

// Substitute variables
const populatedPrompt = substituteVariables(prompt, {
  task_id: 'task-abc123',
  adw_id: 'adw-1234567890',
  task_json: JSON.stringify(task),
});

// Invoke agent
const result = await query({
  prompt: populatedPrompt,
  options: { /* ... */ },
});
```

### Variable Substitution Function

```typescript
function substituteVariables(
  prompt: string,
  variables: Record<string, string>
): string {
  let result = prompt;

  // Replace named variables
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  }

  // Replace positional variables ($1, $2, $3)
  const positionalValues = Object.values(variables);
  positionalValues.forEach((value, index) => {
    const regex = new RegExp(`\\$${index + 1}`, 'g');
    result = result.replace(regex, value);
  });

  return result;
}
```

### Usage Example

```typescript
// Planning workflow
async function planWorkflow(taskId: string, adwId: string) {
  const task = await fetchTask(taskId);

  // Get prompt template from database
  const promptTemplate = await getAgentPrompt('planner');

  // Substitute variables
  const prompt = substituteVariables(promptTemplate, {
    task_id: taskId,
    adw_id: adwId,
    task_json: JSON.stringify(task),
  });

  // Invoke agent
  const result = await invokeAgent('planner', prompt);

  return result;
}
```

## Prompt Engineering Best Practices

### 1. Be Explicit and Prescriptive

❌ **Bad:**
```markdown
Create a plan for the feature.
```

✅ **Good:**
```markdown
Create a detailed implementation plan using the exact Plan Format below.
Include:
- User story
- Step by step tasks
- Testing strategy
- Validation commands

IMPORTANT: Replace every <placeholder> with actual values.
```

### 2. Use Structured Formats

❌ **Bad:**
```markdown
Write some tests.
```

✅ **Good:**
```markdown
## Test Structure
```typescript
describe('Feature: <name>', () => {
  it('should <behavior>', () => {
    // Arrange
    // Act
    // Assert
  });
});
```
```

### 3. Include Validation Steps

❌ **Bad:**
```markdown
Implement the feature.
```

✅ **Good:**
```markdown
Implement the feature following these steps:
1. Read the plan
2. Create files
3. Write code
4. Run type-check
5. Run tests
6. Validate all pass

IMPORTANT: Run validation commands before reporting completion.
```

### 4. Reference Existing Patterns

❌ **Bad:**
```markdown
Create a component.
```

✅ **Good:**
```markdown
Create a component following existing patterns:
- See `components/ui/button.tsx` for ShadCN pattern
- See `components/dashboard/task-card.tsx` for layout pattern
- Use Tailwind CSS for styling
- Export as default from component file
```

### 5. Enforce Naming Conventions

❌ **Bad:**
```markdown
Create a file for the plan.
```

✅ **Good:**
```markdown
Create the plan in the database with:
- Filename format: `task-{task_id}-adw-{adw_id}-plan.md`
- Store in 'plans' table
- Return plan ID in format: `PLAN_ID:<id>`
```

### 6. Require Specific Reporting

❌ **Bad:**
```markdown
Return the results.
```

✅ **Good:**
```markdown
## Report

IMPORTANT: Return exclusively in this JSON format and nothing else:
```json
{
  "success": true,
  "planId": "123",
  "summary": "Brief description"
}
```

Do not include any additional commentary.
```

## Self-Improving Prompts

Sentra can improve its own prompts over time:

```typescript
// After workflow completes, analyze results
async function analyzeworkflowOutcome(
  taskId: string,
  agentName: string,
  success: boolean,
  feedback?: string
) {
  // If failure or feedback provided, suggest prompt improvement
  if (!success || feedback) {
    const currentPrompt = await getAgentPrompt(agentName);

    // Use a meta-agent to suggest improvements
    const improvementSuggestion = await invokeAgent('prompt-improver', `
      Analyze this agent prompt and the failure/feedback:

      Current Prompt:
      ${currentPrompt}

      Outcome: ${success ? 'Success' : 'Failure'}
      Feedback: ${feedback || 'None'}

      Suggest improvements to make the prompt more effective.
    `);

    // Store suggestion for review
    await db.insert(promptImprovements).values({
      agentName,
      currentVersion: (await getAgentPromptVersion(agentName)),
      suggestion: improvementSuggestion,
      feedback,
      createdAt: new Date(),
    });
  }
}
```

## MCP Integration: Workflows as Tool Calls

A critical architectural distinction: **Sentra's workflows are invoked via MCP tool calls, not as scripts in user projects.**

### Traditional Approach (Python ADW Example)
```bash
# Scripts live in user project
project/
├── adws/
│   ├── adw_plan_iso.py
│   ├── adw_code.py
│   └── ...
└── ...

# Invoked via shell
uv run adws/adw_plan_iso.py 123
```

**Problems:**
- Clutters user codebase with workflow scripts
- Tied to specific language (Python)
- Requires dependencies in user project
- Hard to update workflows globally

### Sentra Approach (MCP Tools)
```typescript
// Workflows live in Sentra's MCP server
sentra-mcp-server/
├── workflows/
│   ├── plan.ts
│   ├── code.ts
│   └── ...
└── ...

// User project remains clean
user-project/
├── app/
├── components/
└── README.md  # No workflow scripts!
```

**Invoked via MCP tool:**
```typescript
// From Sentra dashboard or orchestration layer
await mcpClient.callTool('sentra_execute_workflow', {
  workflowName: 'plan',
  taskId: 'task-abc123',
  projectPath: '/path/to/user/project',
});
```

### Benefits

| Aspect | MCP Tool Approach | Script-in-Project Approach |
|--------|-------------------|---------------------------|
| **Codebase Clutter** | Zero (no scripts in project) | High (scripts + dependencies) |
| **Updates** | Update MCP server globally | Update each project |
| **Language** | Any (MCP is language-agnostic) | Tied to script language |
| **Dependencies** | Isolated in MCP server | Required in every project |
| **Reusability** | One set of workflows for all projects | Duplicate per project |

### MCP Tool Definition Example

```typescript
// In Sentra's MCP server
const executePlanWorkflowTool = tool(
  'sentra_execute_workflow',
  'Execute a Sentra workflow in a user project',
  z.object({
    workflowName: z.enum(['plan', 'code', 'test', 'review', 'full_sdlc']),
    taskId: z.string(),
    projectPath: z.string(),
    adwId: z.string().optional(),
  }),
  async (args) => {
    // Load workflow from Sentra's codebase (not user's)
    const workflow = await loadWorkflow(args.workflowName);

    // Execute in user's project context
    const result = await workflow({
      taskId: args.taskId,
      projectPath: args.projectPath,
      adwId: args.adwId,
    });

    return { success: true, result };
  }
);
```

This approach keeps user projects clean while enabling Sentra to manage and evolve workflows centrally.

## Project-Agnostic Prompts

Since Sentra works across different projects, prompts should be **adaptable**, not assume specific structures.

### Bad (Assumes Structure)
```markdown
## Relevant Files
- `app/server/**` - Backend code
- `app/client/**` - Frontend code
- `adws/**` - Workflow scripts
```

### Good (Discovers Structure)
```markdown
## Relevant Files

**IMPORTANT:** Always read `README.md` first to understand this project's structure.

Typical Next.js structure (adapt if different):
- `README.md` - Project overview
- `app/**` - App Router pages/API routes
- `components/**` - React components
- `lib/**` - Utilities

**Note:** Do NOT look for `adws/` or workflow directories - Sentra workflows live externally in the MCP server.
```

### Discovery Pattern

Prompts should instruct agents to:
1. Read README.md first
2. Use `ls` or `Glob` to discover actual structure
3. Adapt to what exists
4. Follow patterns found in the codebase

## Summary

Sentra's agent prompt architecture is characterized by:

1. **Database Storage**: Prompts stored in PostgreSQL, not files (zero clutter)
2. **Detailed Templates**: Explicit, prescriptive prompts with structured formats
3. **Variable Substitution**: Dynamic context injection ($1, $2, ${var})
4. **IMPORTANT Callouts**: Highlight critical instructions
5. **Reasoning Guidance**: Encourage thoughtful analysis ("THINK HARD")
6. **Structured Output**: Require specific formats (JSON, markdown templates)
7. **Validation Requirements**: Enforce running checks before completion
8. **Pattern References**: Point to existing code patterns
9. **Convention Enforcement**: Mandate naming, file organization, tech stack
10. **Specific Reporting**: Exact output formats, no extra commentary
11. **MCP Integration**: Workflows invoked as tools, not scripts in user projects
12. **Project Agnostic**: Discover structure, don't assume it

This architecture ensures that Sentra's agents produce consistent, high-quality, stack-aligned output that follows conventions and meets requirements with minimal human intervention, while keeping user projects clean and free of workflow clutter.
