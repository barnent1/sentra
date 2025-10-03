# Agentic Workflows

## What Are Agentic Workflows?

Agentic workflows are **NOT** simple prompts or configuration files. They are **executable code** that orchestrates multiple agents, manages state, handles errors, and coordinates complex multi-step operations.

### Key Characteristics

1. **Executable Code** - TypeScript/JavaScript that runs on the server
2. **State Management** - Persist workflow state across steps
3. **Agent Orchestration** - Invoke multiple agents in sequence or parallel
4. **Tool Coordination** - Call MCP tools, git operations, external APIs
5. **Error Handling** - Graceful recovery and retry logic
6. **Side Effects** - Create commits, PRs, update databases, send notifications

## Why Workflows Are Code, Not Configuration

**Configuration/Prompts:**
```typescript
// ❌ This is NOT a workflow - it's just a prompt
const planPrompt = "Create an implementation plan for this issue";
```

**Actual Workflow:**
```typescript
// ✅ This IS a workflow - executable orchestration code
async function planWorkflow(taskId: string, adwId: string) {
  // 1. Load state
  const state = await loadState(adwId);

  // 2. Fetch task from Sentra database
  const task = await fetchTask(taskId);

  // 3. Classify task with agent
  const classification = await classifyTask(task, adwId);

  // 4. Create branch
  await createBranch(classification.branchName);

  // 5. Invoke planning agent
  const plan = await invokePlanningAgent(task, classification);

  // 6. Commit and push
  await commitPlan(plan);

  // 7. Update task in dashboard
  await updateTaskStatus(taskId, 'planned');

  // 8. Save state
  await saveState(adwId, state);
}
```

Workflows contain **logic, conditionals, loops, error handling** - things that prompts cannot do.

## TypeScript Workflow Example: Planning Phase

Below is a complete TypeScript workflow for Sentra's PLAN phase, showing how tasks from the dashboard flow through the system.

```typescript
#!/usr/bin/env node
/**
 * Sentra Planning Workflow
 *
 * Orchestrates the PLAN phase of the SDLC cycle for a given task.
 *
 * Flow:
 * 1. Fetch task from Sentra database
 * 2. Load/initialize workflow state
 * 3. Classify task type (chore/bug/feature)
 * 4. Generate branch name
 * 5. Create isolated git branch
 * 6. Invoke planning agent to create implementation plan
 * 7. Commit plan to branch
 * 8. Push and update task status in dashboard
 * 9. Save workflow state to database
 * 10. Stream real-time updates to dashboard
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { simpleGit, SimpleGit } from 'simple-git';
import { db } from './db';
import { workflowState, agentPrompts, tasks } from './db/schema';
import { eq } from 'drizzle-orm';
import { sendDashboardUpdate } from './realtime';

// ============================================================================
// Types
// ============================================================================

interface SentraTask {
  id: string;
  title: string;
  description: string;
  type?: 'chore' | 'bug' | 'feature';
  status: 'pending' | 'planning' | 'coding' | 'testing' | 'reviewing' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskClassification {
  type: 'chore' | 'bug' | 'feature';
  branchName: string;
  reasoning: string;
}

interface WorkflowState {
  adwId: string;
  taskId: string;
  classification?: TaskClassification;
  branchName?: string;
  planFile?: string;
  phase: 'init' | 'classified' | 'planned' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

interface AgentResponse {
  success: boolean;
  output: string;
  error?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const git: SimpleGit = simpleGit();

// ============================================================================
// State Management
// ============================================================================

async function loadState(adwId: string): Promise<WorkflowState> {
  const result = await db
    .select()
    .from(workflowState)
    .where(eq(workflowState.adwId, adwId))
    .limit(1);

  if (result.length === 0) {
    throw new Error(`Workflow state not found for ADW ID: ${adwId}`);
  }

  return result[0] as WorkflowState;
}

async function saveState(state: WorkflowState): Promise<void> {
  await db
    .update(workflowState)
    .set({
      ...state,
      updatedAt: new Date(),
    })
    .where(eq(workflowState.adwId, state.adwId));
}

async function initState(taskId: string): Promise<WorkflowState> {
  const adwId = `adw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const newState: WorkflowState = {
    adwId,
    taskId,
    phase: 'init',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(workflowState).values(newState);

  return newState;
}

// ============================================================================
// Sentra Task Operations
// ============================================================================

async function fetchTask(taskId: string): Promise<SentraTask> {
  const result = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (result.length === 0) {
    throw new Error(`Task not found: ${taskId}`);
  }

  return result[0] as SentraTask;
}

async function updateTaskStatus(
  taskId: string,
  status: SentraTask['status'],
  message?: string
): Promise<void> {
  // Update task in database
  await db
    .update(tasks)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));

  // Send real-time update to dashboard
  await sendDashboardUpdate(taskId, {
    type: 'status_update',
    status,
    message,
    timestamp: new Date(),
  });
}

// ============================================================================
// Agent Invocations
// ============================================================================

async function getAgentPrompt(agentName: string): Promise<string> {
  // Retrieve agent prompt from database (zero file clutter!)
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

async function invokeAgent(
  agentName: string,
  userPrompt: string,
  allowedTools: string[] = ['Read', 'Grep', 'Glob']
): Promise<AgentResponse> {
  try {
    const systemPrompt = await getAgentPrompt(agentName);

    let fullOutput = '';
    const result = query({
      prompt: userPrompt,
      options: {
        systemPrompt,
        allowedTools,
        permissionMode: 'acceptAll',
        model: 'sonnet',
      },
    });

    // Stream and collect output
    for await (const message of result) {
      if (message.type === 'assistant') {
        fullOutput += message.content;
      }
    }

    return {
      success: true,
      output: fullOutput.trim(),
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function classifyTask(
  task: SentraTask,
  adwId: string
): Promise<TaskClassification> {
  const prompt = `
Classify this Sentra task and suggest a branch name.

Task: ${task.title}
${task.description}

${task.type ? `Suggested type: ${task.type}` : ''}
Priority: ${task.priority}

Determine if this is:
- "chore" (maintenance, refactoring, docs)
- "bug" (fixing broken functionality)
- "feature" (new functionality)

Respond in JSON format:
{
  "type": "bug" | "chore" | "feature",
  "branchName": "type/short-kebab-case-description",
  "reasoning": "Brief explanation"
}
`;

  const response = await invokeAgent('classifier', prompt);

  if (!response.success) {
    throw new Error(`Classification failed: ${response.error}`);
  }

  // Extract JSON from response
  const jsonMatch = response.output.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse classification response');
  }

  return JSON.parse(jsonMatch[0]);
}

async function generatePlan(
  task: SentraTask,
  classification: TaskClassification,
  adwId: string
): Promise<string> {
  const prompt = `
Create a detailed implementation plan for this ${classification.type}.

Task: ${task.title}
${task.description}

Classification: ${classification.type}
Reasoning: ${classification.reasoning}

Generate a comprehensive plan that includes:
1. Technical approach
2. Files to create/modify
3. Dependencies to add
4. Database schema changes (if any)
5. Testing strategy
6. Edge cases to consider

Create a plan file at: .sentra/plans/${adwId}.md

Return only the file path when complete.
`;

  const response = await invokeAgent(
    'planner',
    prompt,
    ['Read', 'Write', 'Grep', 'Glob'] // Allow file creation
  );

  if (!response.success) {
    throw new Error(`Planning failed: ${response.error}`);
  }

  // Extract file path from response
  const planFilePath = response.output.trim();

  if (!planFilePath.includes('.md')) {
    throw new Error(`Invalid plan file path: ${planFilePath}`);
  }

  return planFilePath;
}

// ============================================================================
// Git Operations
// ============================================================================

async function createBranch(branchName: string): Promise<void> {
  await git.checkoutLocalBranch(branchName);
}

async function commitChanges(message: string): Promise<void> {
  await git.add('.sentra/plans/*');
  await git.commit(message);
}

async function pushBranch(branchName: string): Promise<void> {
  await git.push('origin', branchName, ['--set-upstream']);
}

// ============================================================================
// Main Workflow
// ============================================================================

async function planWorkflow(taskId: string, adwId?: string) {
  console.log(`🚀 Starting planning workflow for task ${taskId}`);

  // 1. Initialize or load state
  let state: WorkflowState;
  if (adwId) {
    state = await loadState(adwId);
    console.log(`📂 Loaded existing state: ${adwId}`);
  } else {
    state = await initState(taskId);
    console.log(`✨ Initialized new state: ${state.adwId}`);
  }

  try {
    // 2. Fetch task from Sentra database
    console.log(`📥 Fetching task ${taskId}`);
    const task = await fetchTask(taskId);
    await updateTaskStatus(
      taskId,
      'planning',
      `🤖 ${state.adwId}: Starting planning phase`
    );

    // 3. Classify task
    if (!state.classification) {
      console.log('🔍 Classifying task...');
      const classification = await classifyTask(task, state.adwId);
      state.classification = classification;
      state.branchName = classification.branchName;
      state.phase = 'classified';
      await saveState(state);

      console.log(`✅ Classified as: ${classification.type}`);
      await updateTaskStatus(
        taskId,
        'planning',
        `✅ Task classified as ${classification.type} | Branch: ${classification.branchName}`
      );
    }

    // 4. Create branch
    if (state.branchName) {
      console.log(`🌿 Creating branch: ${state.branchName}`);
      await createBranch(state.branchName);
      await updateTaskStatus(
        taskId,
        'planning',
        `🌿 Created branch: ${state.branchName}`
      );
    }

    // 5. Generate plan
    if (!state.planFile) {
      console.log('📝 Generating implementation plan...');
      await updateTaskStatus(
        taskId,
        'planning',
        '📝 Planning agent is creating implementation plan...'
      );

      const planFile = await generatePlan(task, state.classification!, state.adwId);
      state.planFile = planFile;
      state.phase = 'planned';
      await saveState(state);

      console.log(`✅ Plan created: ${planFile}`);
      await updateTaskStatus(
        taskId,
        'planning',
        `✅ Implementation plan created: ${planFile}`
      );
    }

    // 6. Commit plan
    console.log('💾 Committing plan...');
    const commitMsg = `plan: Add implementation plan for ${task.title}\n\n` +
      `Type: ${state.classification!.type}\n` +
      `Task ID: ${taskId}\n` +
      `ADW: ${state.adwId}`;
    await commitChanges(commitMsg);
    await updateTaskStatus(
      taskId,
      'planning',
      '💾 Plan committed to branch'
    );

    // 7. Push branch
    console.log('⬆️ Pushing branch...');
    await pushBranch(state.branchName!);

    // 8. Mark task as ready for CODE phase
    state.phase = 'completed';
    await saveState(state);
    await updateTaskStatus(
      taskId,
      'planning',
      `✅ Planning complete! Ready for CODE phase.`
    );

    console.log('✨ Planning workflow completed successfully');
  } catch (error) {
    console.error('❌ Workflow failed:', error);
    await updateTaskStatus(
      taskId,
      'planning',
      `❌ Planning failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npm run workflow:plan <task-id> [adw-id]');
    process.exit(1);
  }

  const [taskId, adwId] = args;

  await planWorkflow(taskId, adwId);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { planWorkflow };
```

## Workflow Architecture in Sentra

### Storage Strategy

Workflows are stored in the **database**, not as files:

```typescript
// Workflows stored in PostgreSQL
interface WorkflowDefinition {
  id: string;
  name: string;
  phase: 'plan' | 'code' | 'test' | 'review';
  sourceCode: string; // The actual TypeScript code
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Invocation via MCP Tool

Workflows are executed via custom MCP tools:

```typescript
// MCP tool definition
const executeWorkflowTool = tool(
  'execute_workflow',
  'Execute a Sentra workflow',
  z.object({
    workflowName: z.string(),
    params: z.record(z.any()),
  }),
  async (args) => {
    // 1. Fetch workflow code from database
    const workflow = await getWorkflow(args.workflowName);

    // 2. Execute workflow with params
    const result = await eval(workflow.sourceCode)(args.params);

    return { success: true, result };
  }
);
```

### Frontend Integration

The Next.js dashboard can trigger workflows when users create tasks:

```typescript
// API route: /api/workflows/execute
export async function POST(req: Request) {
  const { workflowName, taskId } = await req.json();

  // Invoke workflow via MCP
  const result = await mcpClient.callTool('execute_workflow', {
    workflowName,
    params: { taskId },
  });

  return Response.json(result);
}
```

**Task Creation Flow:**
1. User creates task in Sentra dashboard UI
2. Task saved to PostgreSQL with status 'pending'
3. Dashboard automatically triggers PLAN workflow
4. Real-time updates stream back to dashboard via WebSocket
5. User sees live progress as agents work

## Key Workflow Patterns

### 1. Sequential Agent Execution
```typescript
async function fullSDLC(taskId: string) {
  await planWorkflow(taskId);
  await codeWorkflow(taskId);
  await testWorkflow(taskId);
  await reviewWorkflow(taskId);
}
```

### 2. Parallel Sub-task Execution
```typescript
async function parallelFeatures(featureIds: string[]) {
  await Promise.all(
    featureIds.map(id => planWorkflow(id))
  );
}
```

### 3. Conditional Branching
```typescript
async function adaptiveWorkflow(task: SentraTask) {
  const classification = await classifyTask(task);

  if (classification.type === 'bug') {
    await bugFixWorkflow(task);
  } else if (classification.type === 'feature') {
    await featureWorkflow(task);
  } else {
    await choreWorkflow(task);
  }
}
```

### 4. Error Recovery
```typescript
async function resilientWorkflow(taskId: string) {
  let retries = 3;

  while (retries > 0) {
    try {
      await executeTask(taskId);
      break;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await delay(1000 * (4 - retries)); // Exponential backoff
    }
  }
}
```

## Benefits of Code-Based Workflows

| Benefit | Description |
|---------|-------------|
| **Full Control** | Access to all programming constructs (loops, conditionals, functions) |
| **Type Safety** | TypeScript ensures correctness at compile time |
| **Testable** | Unit test workflows like any other code |
| **Debuggable** | Use standard debugging tools and logging |
| **Composable** | Combine workflows to create larger workflows |
| **Versionable** | Store in database with version history |
| **Dynamic** | Load and execute workflows at runtime |
| **Observable** | Instrument with metrics, logging, tracing |

## Workflow vs Prompt

| Aspect | Workflow (Code) | Prompt (Text) |
|--------|----------------|---------------|
| **Execution** | Runs as TypeScript | Sent to LLM |
| **Logic** | Full programming logic | Limited to natural language |
| **State** | Can persist to database | Stateless |
| **Tools** | Can call any API/tool | Limited to MCP tools |
| **Error Handling** | try/catch, retry logic | Model-dependent |
| **Composition** | Function calls, imports | Prompt chaining |
| **Performance** | Predictable | Variable |
| **Storage** | Database (no clutter) | Would be .md files (cluttered) |

## Summary

Agentic workflows in Sentra are **executable TypeScript code** that:
1. Orchestrate multiple agents across SDLC phases
2. Manage complex state and side effects
3. Handle errors and edge cases programmatically
4. Are stored in the database (zero file clutter)
5. Are invoked via MCP tools
6. Provide full programming capabilities beyond simple prompts
7. **Fetch tasks from Sentra's own database** (not external systems like GitHub)
8. **Stream real-time updates to Sentra's dashboard** (not external comment systems)

## Sentra's Self-Contained Architecture

Unlike systems that rely on GitHub issues for task management, Sentra is **completely self-contained**:

| Component | Sentra Approach | External Dependency Approach |
|-----------|-----------------|------------------------------|
| **Task Input** | Sentra dashboard UI | GitHub issues |
| **Task Storage** | PostgreSQL database | GitHub API |
| **Progress Updates** | WebSocket to dashboard | GitHub issue comments |
| **Task Status** | Database status field | GitHub labels/milestones |
| **Agent Coordination** | Internal workflows | External webhooks |

**Benefits of Self-Contained Design:**
- No external dependencies for core functionality
- Faster operations (no API rate limits)
- Complete control over data and workflows
- Clean, focused codebase
- Real-time updates without polling
- Works offline or in air-gapped environments

Users interact with **one system**: Sentra. Tasks are created, tracked, and completed entirely within the Sentra dashboard.
