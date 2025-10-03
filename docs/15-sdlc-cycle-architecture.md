# SDLC Cycle Architecture

## The Core Problem: Agent Context Limitations

Claude Code agents operate within finite context windows. As tasks grow in complexity and context accumulates, agents can:
- Lose track of what they're doing
- Experience context clutter
- Run out of context space
- Become confused about objectives

## The Solution: Micro-Task SDLC Decomposition

**Every task in Sentra goes through a complete, isolated SDLC cycle:**

```
Task
  ↓
[PLAN] → [CODE] → [TEST] → [REVIEW]
  ↓        ↓        ↓         ↓
Sub-tasks with specialized agents
```

### Key Principle

**One Task = One Complete SDLC Cycle**

Each task, regardless of size, is broken down into small, manageable pieces that flow through all four phases. This ensures:
1. Clear objectives at each phase
2. Isolated context per phase
3. Specialized agent focus
4. No context overflow

## The Four SDLC Phases

### 1. PLAN Phase
**Agent Type:** Planning Agent
**Responsibility:**
- Analyze the task requirements
- Break down into actionable steps
- Identify dependencies
- Create implementation strategy
- Output: Detailed plan document

### 2. CODE Phase
**Agent Type:** Coding Agent
**Responsibility:**
- Implement the plan
- Write code following the plan's specifications
- Create/modify files as needed
- Follow tech stack conventions
- Output: Working implementation

### 3. TEST Phase
**Agent Type:** Testing Agent
**Responsibility:**
- Write tests for the implementation
- Run tests and capture results
- Identify failures or edge cases
- Verify code meets requirements
- Output: Test results and coverage report

### 4. REVIEW Phase
**Agent Type:** Review Agent
**Responsibility:**
- Code quality review
- Architecture validation
- Performance considerations
- Security audit
- Output: Approval or revision requests

## Why This Architecture is ULTRA IMPORTANT

### 1. Eliminates Confusion
Each agent has ONE job in ONE phase. No ambiguity about what needs to be done.

### 2. Prevents Context Clutter
Each phase starts with a clean slate:
- Planning agent doesn't need to hold implementation details
- Coding agent doesn't need to hold test strategies
- Testing agent doesn't need to hold review criteria
- Review agent doesn't need to hold planning decisions

### 3. Prevents Context Exhaustion
Small, focused tasks complete quickly before context limits are reached. Each phase operates within manageable context bounds.

### 4. Enables True Isolation
Each phase is a separate agent invocation with:
- Fresh context
- Specific tools allowed
- Targeted system prompt
- Clear success criteria

## Task Flow Example

```
User Request: "Add user authentication to the dashboard"

Task Decomposition:
├── Sub-task 1: Database schema for users
│   ├── PLAN: Design user table schema
│   ├── CODE: Create Drizzle migration
│   ├── TEST: Verify migration runs
│   └── REVIEW: Check schema design
│
├── Sub-task 2: Auth API endpoints
│   ├── PLAN: Design login/logout/register endpoints
│   ├── CODE: Implement Next.js API routes
│   ├── TEST: Write endpoint tests
│   └── REVIEW: Security audit
│
├── Sub-task 3: Frontend auth UI
│   ├── PLAN: Design login form component
│   ├── CODE: Build with ShadCN + Tailwind
│   ├── TEST: Component testing
│   └── REVIEW: UX/accessibility review
│
└── Sub-task 4: Auth state management
    ├── PLAN: Design auth context
    ├── CODE: Implement React context
    ├── TEST: State transition tests
    └── REVIEW: Integration review
```

## Agent Context Boundaries

Each agent operates within strict boundaries:

### Planning Agent
- **Input:** Task description, requirements
- **Context:** Architecture docs, tech stack specifications
- **Output:** Structured plan
- **Tools:** Read (docs), Grep (codebase search)

### Coding Agent
- **Input:** Plan from planning phase
- **Context:** Relevant code files, plan document
- **Output:** Implementation
- **Tools:** Read, Write, Edit, Bash (for dependencies)

### Testing Agent
- **Input:** Implementation from coding phase
- **Context:** Test files, implementation files
- **Output:** Test suite + results
- **Tools:** Read, Write, Bash (test runner)

### Review Agent
- **Input:** Implementation + tests
- **Context:** Code files, test results, quality standards
- **Output:** Review report
- **Tools:** Read, Grep (pattern checking)

## Benefits Summary

| Benefit | Description |
|---------|-------------|
| **Clear Focus** | Each agent knows exactly what to do |
| **Context Efficiency** | No wasted context on irrelevant information |
| **Scalability** | Can handle arbitrarily complex projects |
| **Quality** | Each phase has dedicated quality gates |
| **Parallelization** | Independent sub-tasks can run concurrently |
| **Debuggability** | Easy to identify which phase failed |
| **Maintainability** | Clear separation of concerns |

## Implementation in Sentra

Sentra's orchestration layer will:
1. Accept high-level tasks from users
2. Decompose into sub-tasks automatically
3. For each sub-task, spawn 4 agents (PLAN, CODE, TEST, REVIEW)
4. Store results in PostgreSQL for traceability
5. Coordinate dependencies between sub-tasks
6. Present unified progress in the frontend dashboard

This architecture is the **foundation** of how Sentra achieves autonomous, context-efficient development.
