# Sentra Documentation Index

**Sentra** is an agentic software development layer built on Claude Code, designed as an out-of-loop system where the system builds itself with minimal human intervention.

## Core Architecture
- **MCP Server**: Custom Model Context Protocol server for agent tools
- **Frontend Interface**: Next.js application for monitoring and control
- **Deployment**: Fly.io hosting
- **Foundation**: Claude Code API/SDK for agent orchestration

## Documentation Topics

### 1. System Overview
Agentic development layer architecture, MCP + Frontend integration, high-level design philosophy

### 2. Agent Types
Specialized agents and their specific responsibilities, agent taxonomy

### 3. Tech Stack
Next.js (latest stable), TypeScript, ESLint, Tailwind CSS, App Router, No src dir, ShadCN with Themes, Framer Motion, PostgreSQL, Drizzle ORM

### 4. Claude Code API Integration
SDK usage, query() interface, streaming responses, programmatic agent invocation

### 5. MCP Server Architecture
Custom tools, server setup, transport protocols (stdio/SSE/HTTP), tool creation patterns

### 6. Frontend Interface
User interaction layer, agent monitoring dashboard, real-time status updates

### 7. Agent Orchestration
Multi-agent coordination, task decomposition, parallel execution, context isolation

### 8. Deployment Strategy
Fly.io deployment configuration, environment setup, scaling considerations

### 9. Permission & Security Model
Tool permissions, autonomy levels, security boundaries, access control

### 10. Hooks & Lifecycle Events
Automation workflows, observability, event-driven architecture

### 11. Out-of-Loop System Design
Self-building architecture, autonomous development workflows, human intervention points

### 12. Database Schema
PostgreSQL + Drizzle setup, agent state management, execution history, workflow tracking

### 13. Agent Prompt Templates
Reusable prompts for each agent type, prompt engineering patterns, system prompts

### 14. Workflow Patterns
Common development workflows, task patterns, orchestration examples

### 15. SDLC Cycle Architecture
Task decomposition into PLAN → CODE → TEST → REVIEW phases, context management strategy, agent specialization per phase

### 16. Agentic Workflows
Executable TypeScript code that orchestrates agents, state management, tool coordination, workflow patterns and examples

### 17. Workflow Execution Model
Git worktree isolation, environment setup, database logging, atomic workflow units, workflow composition, hands-off execution

### 18. Agent Prompt Architecture
Detailed stack-oriented prompts, variable substitution, structured templates, prompt engineering best practices, database storage

### 19. Sentra CLI Setup
Global CLI installation, interactive stack detection, user confirmation flow, project configuration, MCP connection, documentation sync

### 20. Multi-Project Architecture
Data separation strategy, stack fingerprinting, shared documentation, project-specific customizations, query optimization, multi-tenant design

### 21. Security & Authentication
CLI automatic key generation, dashboard email/password login, asymmetric encryption, MCP request signing, multi-machine support, audit logging

### 22. Dashboard Architecture
Task management, AI Analyst for large projects, Kanban board, legacy migration planner, dark mode with violet theme, visual design comparison, multi-project views, logging interface, failure management, asset management

### 23. Roles & Permissions
Team roles (Owner, Admin, Developer, Contributor, Viewer), permission matrix, invitation system, task attribution, role-based access control, audit logging

### 24. Dashboard Visual Mockups
Complete visual design guide with ASCII diagrams for all dashboard views: home, kanban board, task details, logs, visual comparison, AI analyst, command palette, multi-project views, team management, analytics, mobile responsive design

### 25. Worktree Architecture
Git worktree fundamentals for parallel task execution, directory structure, worktree lifecycle, port allocation strategy, resource management (disk/memory/CPU), optimizations (pnpm, selective dev servers), dependency management, .claude/ auto-distribution via git, parallel execution benefits (10-14x speed improvement)

### 26. Hooks System
Claude Code hooks overview, TypeScript implementation (not Python), database integration (PostgreSQL not files), security hooks (pre-tool-use blocking), coordination hooks (post-tool-use state updates), session-based logging, hook lifecycle, input/output patterns, exit codes, shared utilities, database schema for hook events

### 27. Task Orchestration
Hook-based parallel task coordination, orchestration architecture, task lifecycle (creation to cleanup), dependency resolution strategies, task orchestrator main loop, resource management (ports, concurrency, memory), failure handling (retry, skip, manual intervention), monitoring and observability, complete CRM example with 200 tasks

### 28. Command Conversion Strategy
TAC-7 to Sentra MCP command conversion, pattern-first development philosophy, MCP tools for pattern learning (find_similar_implementations, get_relevant_docs), replacing bash with MCP tool calls, full-stack TypeScript command structure, PLAN/CODE/TEST/REVIEW command templates, pattern learning examples, documentation structure for pattern discovery, eliminating trial-and-error through codebase learning

### 29. TypeScript Strictness Enforcement
Zero-tolerance strict mode enforcement, pattern-based type learning, pre-emptive type validation, tsconfig strict configuration, MCP tools for type safety (find_type_patterns, validate_types_preemptive, suggest_type_fix), continuous type checking via hooks, common TypeScript patterns (API routes, database queries, React components), pre-commit type validation, CI/CD type checks, pattern-based error fixes, reducing type errors from 20+ to 0-2 per feature

### 30. Agent Separation Model
Fresh context per SDLC phase, strict agent separation for objective quality control, agent roles and responsibilities (Analyst, Coder, Tester, Reviewer, Human), database handoff without file passing, pushback loops for quality enforcement, agent communication restrictions, complete task flow example, benefits of separation vs single agent, professional development team simulation, out-of-loop human validation

---

*Each topic will be expanded into detailed documentation through iterative discussion and refinement.*
