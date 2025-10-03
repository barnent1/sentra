# Sentra Product Requirements Document (PRD)

## Executive Summary

**Sentra** is an autonomous AI development layer that builds software with minimal human intervention. Using Claude Code's agent orchestration and a custom MCP server, Sentra decomposes complex projects into atomic tasks, executes them through specialized SDLC phases (PLAN → CODE → TEST → REVIEW), and delivers production-ready code with strict quality enforcement.

**Core Innovation:** Multi-agent separation with fresh context per phase ensures objective quality control. No agent reviews their own work—mimicking a professional development team where coders don't test their own code.

## Vision & Goals

### Vision
Enable developers to manage autonomous AI development across multiple projects simultaneously, with complete visibility and minimal intervention.

### Primary Goals
1. **Zero-intervention development** - Tasks complete autonomously from requirements to PR
2. **Multi-project scalability** - Manage 10+ projects simultaneously
3. **Quality enforcement** - Strict TypeScript, comprehensive testing, visual validation
4. **Context efficiency** - Small atomic tasks prevent context overflow
5. **Out-of-loop operation** - Human approves via screenshots, not code review

## Core Architecture

### 1. SDLC Cycle Architecture (Foundation)

**Problem:** Agent context limitations cause confusion, clutter, and exhaustion.

**Solution:** Micro-task SDLC decomposition where every task flows through:
```
PLAN → CODE → TEST → REVIEW
```

**Key Principles:**
- One task = one complete SDLC cycle
- Each phase = isolated agent with fresh context
- Small, focused tasks complete before context limits
- Database handoff between phases (no file passing)

**Phase Agents:**
- **Analyst Agent (PLAN):** Creates detailed implementation plan from requirements
- **Coder Agent (CODE):** Implements plan with strict TypeScript compliance
- **Tester Agent (TEST):** Writes/runs tests, captures screenshots, pushback if failures
- **Reviewer Agent (REVIEW):** Visual review, code quality, create PR if approved

### 2. Agent Separation Model (Quality Control)

**Core Principle:** No agent reviews their own work.

**Implementation:**
- Fresh Claude session per phase
- Database-only communication (plan, screenshots, test results)
- Agents cannot access previous agent's context
- Strict MCP tool restrictions by phase

**Benefits:**
- Objective testing (tester doesn't know implementation shortcuts)
- Critical review (reviewer challenges decisions)
- Fresh perspectives catch more bugs
- Pushback loops enforce quality

### 3. Multi-Project Architecture (Scalability)

**Data Separation Strategy:**
- **Isolated per project:** Tasks, logs, worktrees, workflow state
- **Shared per stack:** Documentation, patterns, prompts (deduplication via fingerprinting)
- **Global:** Base agent prompts, user accounts, MCP config

**Stack Fingerprinting:**
- Generate hash from stack components (framework, language, database)
- Projects with identical stacks share documentation
- ~36% storage reduction for documentation

**3-Level Prompt System:**
1. Base prompt (global)
2. Stack additions (per stack)
3. Project override (per project, optional)

### 4. Agentic Workflows (Executable Code)

**Not prompts or config—TypeScript code that:**
- Orchestrates multiple agents
- Manages state in database
- Handles errors and retries
- Coordinates tools (git, MCP, external APIs)
- Performs side effects (commits, PRs, notifications)

**Workflow Types:**
- Atomic: `plan.ts`, `code.ts`, `test.ts`, `review.ts`
- Composed: `full_sdlc.ts`, `iterative_code_test.ts`
- Invoked via MCP tools (not scripts in user projects)

### 5. Git Worktree Isolation (Parallel Execution)

**Why Worktrees:**
- Each task = separate working directory
- Parallel execution without conflicts
- Easy cleanup after merge

**Structure:**
```
project-root/
├── .git/
├── main-codebase/
└── .sentra/worktrees/
    ├── task-abc123/  (isolated env, unique ports)
    └── task-xyz789/  (parallel execution)
```

**Benefits:**
- 10-14x speed improvement via parallelization
- No interference between tasks
- Clean main branch until merge

## Tech Stack

### Backend (MCP Server + API)
- **Runtime:** Node.js + TypeScript
- **Framework:** Express or Hono (for API routes)
- **Database:** PostgreSQL + Drizzle ORM
- **Vector Search:** pgvector (documentation embeddings)
- **MCP:** Custom Model Context Protocol server
- **Agent Orchestration:** Claude Code SDK (`@anthropic-ai/claude-agent-sdk`)
- **Authentication:** Ed25519 asymmetric encryption (CLI), NextAuth (dashboard)
- **Rate Limiting:** express-rate-limit
- **Deployment:** Fly.io with persistent volumes

### Frontend (Dashboard)
- **Framework:** Next.js 15 (App Router, no src directory)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + ShadCN
- **Animations:** Framer Motion
- **State Management:** React Context
- **Real-time:** WebSockets (for log streaming)
- **Theme:** Dark mode with violet primary (full ShadCN theme support)
- **Testing:** Jest + Playwright (E2E)
- **Deployment:** Vercel or Fly.io

### CLI
- **Runtime:** Node.js
- **Package Manager:** npm (global install: `@sentra/cli`)
- **Key Management:** tweetnacl (Ed25519)
- **Secure Storage:** OS-native keychain (macOS Keychain, Linux libsecret, Windows Credential Manager)

### Infrastructure
- **Hosting:** Fly.io (MCP + Dashboard)
- **Asset Storage:** Cloudflare R2 or AWS S3 (screenshots, design references)
- **CI/CD:** GitHub Actions
- **Monitoring:** Application-level logging, audit trail

## User Flows

### 1. Initial Setup (CLI)

**New User:**
```bash
sentra setup

# Flow:
1. Email + password registration
2. Auto-generate Ed25519 keypair
3. Private key → OS keychain (encrypted)
4. Public key → backend registration
5. Detect project stack (framework, language, database)
6. User confirms/adjusts stack
7. Discover conventions (brownfield) or apply best practices (greenfield)
8. Connect to MCP server
9. Sync documentation for stack
10. Create .sentra/config.json
11. Register project in dashboard
```

**Existing User (New Machine):**
```bash
sentra setup

# Flow:
1. Email + password login
2. Generate NEW keypair for this machine
3. Register public key (multi-machine support)
4. Detect/configure project
5. Ready to use
```

### 2. Task Creation (Dashboard)

**Manual Task:**
```
1. User creates task in dashboard
2. Title, description, type (chore/bug/feature)
3. Optional: Upload design reference images
4. Click "Start Task"
5. Dashboard triggers PLAN workflow via MCP
6. Real-time updates stream to dashboard
```

**AI-Assisted Project Breakdown:**
```
1. User describes large project (e.g., "Build a CRM system")
2. AI Analyst analyzes description
3. Decomposes into modules, features, tasks
4. Shows dependency graph
5. User reviews/approves
6. 200+ tasks created automatically
7. Each task follows PLAN → CODE → TEST → REVIEW
```

**Legacy Migration Planner:**
```
1. User provides legacy system path
2. AI scans codebase (files, tables, endpoints, pages)
3. Maps legacy → new system (field names, routes, schema)
4. Generates migration strategy
5. Creates tasks for component-by-component rewrite
6. Each task includes rollback plan
```

### 3. Task Execution (Autonomous)

**Full SDLC Workflow:**
```
PLAN Phase:
- Analyst agent spawned (fresh context)
- Studies existing patterns via MCP tools
- Creates detailed plan
- Stores plan in database
- Updates phase: PLAN → CODE

CODE Phase:
- Coder agent spawned (fresh context)
- Reads plan from database
- Studies referenced patterns
- Implements code
- Runs typecheck after each file
- Commits changes
- Updates phase: CODE → TEST

TEST Phase:
- Tester agent spawned (fresh context)
- Reads plan from database
- Studies test patterns
- Writes comprehensive tests
- Runs all test suites
- Captures E2E screenshots
- IF FAILURES → Pushback to CODE (iteration++)
- IF SUCCESS → Updates phase: TEST → REVIEW

REVIEW Phase:
- Reviewer agent spawned (fresh context)
- Reads plan + screenshots from database
- Visual review (compare design vs implementation via AI)
- Code quality check (lint)
- IF ISSUES → Pushback to CODE (iteration++)
- IF APPROVED → Create PR, mark complete

Human Approval (Out-of-Loop):
- Dashboard shows screenshots
- User approves via 👍 → auto-merge
- User rejects via 👎 → create bug task
```

### 4. Dashboard Usage (Multi-Project)

**Home View:**
- Project cards with quick stats
- Recent activity feed
- Failed tasks highlighted
- Quick actions (+ Task, + Project)

**Project View (Kanban):**
- Columns: Backlog, Planning, Coding, Testing, Review, Done
- Drag-drop between columns
- Real-time phase updates
- Failed tasks auto-highlighted

**Task Detail View:**
- Tabs: Overview, Logs, Files, Visual Diff, Activity
- Real-time log streaming
- Screenshot carousel
- AI visual comparison (reference vs implementation)
- Actions: Retry, Skip, Cancel

**Multi-Project View:**
- Split-screen (2-4 projects)
- Unified task list across projects
- Cross-project filters

**Command Palette (Cmd+K):**
- Fuzzy search across tasks, projects, logs
- Quick actions
- Recent items

### 5. Visual Design Comparison

**Workflow:**
```
1. User uploads design reference (mockup, wireframe)
2. Task stores design asset in R2/S3
3. CODE phase implements
4. TEST phase captures Playwright screenshots
5. REVIEW phase compares via Claude Vision API
6. AI identifies differences (layout, color, spacing, typography)
7. Dashboard shows pixel diff overlay
8. IF MATCH < 85% → Pushback to CODE with corrections
9. IF MATCH >= 85% → Approved
```

## Database Schema

### Core Tables

**projects**
- id (PK), userId, name, path, stackId (FK)
- stackFramework, stackLanguage (denormalized)
- conventions (JSONB), validation (JSONB)

**tasks**
- id (PK), projectId (FK), title, description, type, status, priority, phase
- plan (JSONB), implementationNotes (JSONB), testResults (JSONB), reviewNotes (JSONB)

**stacks**
- id (PK), framework, frameworkVersion, language, database, orm, styling (JSONB), stateManagement
- hash (unique, for deduplication)

**documentationChunks**
- id (PK), stackId (FK), framework, version, category, title, content
- embedding (vector), keywords (text[])

**workflowState**
- id (PK), projectId (FK), taskId (FK), adwId, phase, state (JSONB)

**logs**
- id (PK), projectId (FK), taskId, adwId, phase, level, message, metadata (JSONB), timestamp

**worktrees**
- id (PK), projectId (FK), taskId (FK), path, branchName, createdAt, deletedAt

**agentPrompts**
- id (PK), agentName (unique), phase, prompt (text), version

**projectPromptOverrides**
- id (PK), projectId (FK), agentName, customPrompt (text), reason

**users**
- id (PK), email (unique), passwordHash, createdAt

**userKeys**
- id (PK), userId (FK), publicKey (unique), machineName, registeredAt, lastUsedAt, revokedAt

**auditLog** (immutable via triggers)
- id (PK), userId, action, metadata (JSONB), ipAddress, userAgent, timestamp

**screenshots**
- id (PK), taskId (FK), phase, agentName, description, url (R2/S3), timestamp

**designAssets**
- id (PK), taskId (FK), fileName, url (R2/S3), type (reference | implementation), uploadedAt

## MCP Tools

### Task Management
- `get_task_info` - Retrieve task data (filtered by phase)
- `create_plan` - Store plan in database
- `update_task_phase` - Transition phase or pushback
- `mark_task_complete` - Finalize task

### Pattern Learning
- `find_similar_implementations` - Study existing patterns in codebase
- `get_relevant_docs` - Retrieve documentation for stack

### Code Execution
- `run_typecheck` - TypeScript strict mode validation
- `run_lint` - ESLint checks
- `run_tests` - Unit/integration tests
- `run_e2e_tests` - Playwright with screenshot capture
- `run_build` - Production build validation

### Git Operations
- `create_branch` - Create feature branch
- `commit_changes` - Create commit
- `push_branch` - Push to remote
- `create_pull_request` - Create PR with screenshots

### Visual Review
- `start_visual_review` - Launch app for visual inspection
- `compare_design` - AI comparison (Claude Vision API)
- `capture_screenshot` - Manual screenshot

### Workflow Execution
- `execute_workflow` - Run atomic or composed workflow

## Security & Authentication

### CLI Authentication (Asymmetric Encryption)

**Key Generation:**
- Ed25519 keypair generated locally on first setup
- Private key encrypted in OS keychain (Keychain/libsecret/DPAPI)
- Public key registered with backend
- Multi-machine support (each device = unique keypair)

**Request Signing:**
```typescript
payload = { projectId, taskId, workflowName, timestamp }
signature = sign(payload, privateKey)
request = { ...payload, signature, publicKey }
```

**Signature Verification (MCP):**
- Verify signature with public key
- Check timestamp (max 60s age, prevent replay)
- Verify public key is registered and not revoked
- Rate limiting (1000 requests/hour per user)

### Dashboard Authentication (Traditional)

**Email/Password:**
- bcrypt password hashing
- JWT session tokens (7-day expiry)
- HTTP-only cookies
- Optional 2FA (TOTP)

**Device Management:**
- Dashboard shows registered devices
- User can revoke keys remotely
- Audit log tracks all auth events

### Audit Logging

**Immutable Log:**
- All security events logged
- Database triggers prevent UPDATE/DELETE
- Application role has INSERT/SELECT only
- Events: login, key generation/revocation, MCP calls, workflow execution

## Dashboard Features

### Core Views

1. **Home**
   - Project overview cards
   - Quick stats (active/completed/failed tasks)
   - Recent activity feed

2. **Kanban Board**
   - Columns: Backlog, Planning, Coding, Testing, Review, Done
   - Real-time task updates
   - Drag-drop support
   - Failed task highlighting

3. **Task Detail**
   - Overview, Logs, Files, Visual Diff, Activity tabs
   - Real-time log streaming
   - Screenshot carousel
   - AI visual comparison
   - Code review interface

4. **AI Analyst (Project Breakdown)**
   - Input: Large project description
   - Output: Modules, features, tasks (200+ atomic tasks)
   - Dependency graph visualization
   - One-click task generation

5. **Legacy Migration Planner**
   - Input: Legacy system path
   - Output: Component mapping, migration strategy
   - Field name mapping (user_id → id)
   - Task generation for rewrite

6. **Multi-Project View**
   - Split-screen (2-4 projects)
   - Unified task list
   - Cross-project filters

7. **Logs Viewer**
   - Global logs across all projects
   - Filter by project, task, phase, level
   - Real-time streaming
   - Export functionality

8. **Failure Dashboard**
   - All failed tasks
   - Quick actions (Retry, Fix Manually, Skip)
   - Auto-refresh

9. **Analytics**
   - Task velocity (graph)
   - Agent performance metrics
   - Time to completion averages
   - Resource utilization

### Visual Design

**Theme:**
- Dark mode with violet primary (#8B5CF6)
- Full ShadCN theme support (seamless switching)
- Glassmorphism effects
- Framer Motion animations
- Micro-interactions

**Command Palette (Cmd+K):**
- Fuzzy search
- Quick actions
- Recent items
- Keyboard navigation

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
**Goal:** Core infrastructure + basic SDLC

**Deliverables:**
- [ ] PostgreSQL + Drizzle setup
- [ ] MCP server with basic tools
- [ ] Claude Code SDK integration
- [ ] CLI setup command (stack detection)
- [ ] Database schema + migrations
- [ ] Basic authentication (Ed25519 + JWT)
- [ ] Atomic workflows: plan.ts, code.ts, test.ts, review.ts
- [ ] Git worktree management

**Test:** Single task through full SDLC (PLAN → CODE → TEST → REVIEW)

### Phase 2: Dashboard MVP (Weeks 4-6)
**Goal:** Basic task management UI

**Deliverables:**
- [ ] Next.js dashboard (App Router)
- [ ] Home view + project cards
- [ ] Kanban board
- [ ] Task detail view
- [ ] Real-time log streaming (WebSocket)
- [ ] Screenshot display
- [ ] Manual task creation
- [ ] Theme system (dark + violet)

**Test:** Create task in dashboard, watch it complete autonomously

### Phase 3: Multi-Project (Weeks 7-8)
**Goal:** Scalability across projects

**Deliverables:**
- [ ] Stack fingerprinting
- [ ] Documentation sharing
- [ ] Multi-project view
- [ ] Project switcher
- [ ] Cross-project task list
- [ ] Command palette (Cmd+K)

**Test:** Manage 3+ projects simultaneously

### Phase 4: Quality Enforcement (Weeks 9-10)
**Goal:** Strict validation + pushback loops

**Deliverables:**
- [ ] TypeScript strict mode enforcement
- [ ] Pre-emptive type validation
- [ ] Pushback loop implementation
- [ ] Visual design comparison (Claude Vision)
- [ ] Playwright screenshot capture
- [ ] Failure dashboard
- [ ] Retry/skip actions

**Test:** Task with intentional bugs → pushback → auto-fix → approval

### Phase 5: AI Features (Weeks 11-13)
**Goal:** Project decomposition + legacy migration

**Deliverables:**
- [ ] AI Analyst (project breakdown)
- [ ] Dependency graph visualization
- [ ] Legacy migration planner
- [ ] Code scanning + mapping
- [ ] Field name mapping
- [ ] Migration task generation

**Test:** CRM project → 200+ tasks created → execute autonomously

### Phase 6: Polish & Launch (Weeks 14-16)
**Goal:** Production-ready

**Deliverables:**
- [ ] Analytics dashboard
- [ ] Resource monitor
- [ ] Audit log viewer
- [ ] Mobile responsive design
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Documentation (user + API)
- [ ] Deploy to Fly.io

**Test:** Full dogfooding (use Sentra to build Sentra features)

## Success Metrics

### Technical Metrics
- **Task Success Rate:** >90% of tasks complete without human intervention
- **Iteration Average:** <2 iterations per task (pushback loops)
- **Type Error Rate:** 0-2 type errors per feature (strict mode)
- **Test Coverage:** >85% coverage on generated code
- **Visual Match Score:** >85% match to design references

### Performance Metrics
- **Task Completion Time:** <60 minutes average per task
- **Agent Utilization:** <70% (room for scaling)
- **MCP Request Latency:** <500ms average
- **Dashboard Load Time:** <2s initial, <500ms navigation

### User Experience Metrics
- **Setup Time:** <5 minutes from install to first task
- **Tasks/Day Velocity:** >10 tasks per project
- **Human Intervention Rate:** <5% of tasks
- **Time to First PR:** <10 minutes from task creation

## Risk Mitigation

### Technical Risks

**Risk:** Context window exhaustion in complex tasks
- **Mitigation:** Strict atomic task decomposition, context monitoring

**Risk:** Worktree disk usage explosion
- **Mitigation:** Auto-cleanup after merge, configurable retention

**Risk:** Agent hallucination/infinite loops
- **Mitigation:** Max iteration limits (5), human escalation, audit logging

**Risk:** Database performance degradation (logs, embeddings)
- **Mitigation:** Indexes, pagination, log rotation, vector index optimization

### Security Risks

**Risk:** Private key compromise
- **Mitigation:** OS keychain encryption, multi-machine support, revocation

**Risk:** Audit log tampering
- **Mitigation:** Immutable log (DB triggers), append-only design

**Risk:** MCP request replay attacks
- **Mitigation:** Timestamp validation (60s window), nonce tracking

### Business Risks

**Risk:** Claude API rate limits
- **Mitigation:** User-level quotas, graceful degradation, queue system

**Risk:** Infrastructure costs (Fly.io, storage)
- **Mitigation:** Usage monitoring, tiered pricing, resource limits

## Future Enhancements (Post-MVP)

1. **Team Collaboration**
   - Role-based access (Owner, Admin, Developer, Contributor, Viewer)
   - Task assignment
   - Team activity feed
   - Shared projects

2. **Custom Workflows**
   - Visual workflow builder (drag-drop)
   - Conditional branching
   - Custom agent prompts per project

3. **Integrations**
   - GitHub Actions (auto-deploy on merge)
   - Slack notifications
   - Jira sync
   - Linear integration

4. **Advanced AI**
   - Self-healing code (auto-fix common errors)
   - Performance optimization agent
   - Security vulnerability scanner
   - Accessibility compliance checker

5. **Enterprise Features**
   - On-premise deployment
   - SSO (SAML, OAuth)
   - Custom model endpoints
   - SLA guarantees

## Appendix

### Key Documentation References
- `docs/15-sdlc-cycle-architecture.md` - SDLC phases
- `docs/16-agentic-workflows.md` - Workflow patterns
- `docs/17-workflow-execution-model.md` - Worktree isolation
- `docs/18-agent-prompt-architecture.md` - Prompt engineering
- `docs/19-sentra-cli-setup.md` - CLI setup flow
- `docs/20-multi-project-architecture.md` - Data separation
- `docs/21-security-authentication.md` - Auth implementation
- `docs/22-dashboard-architecture.md` - Dashboard design
- `docs/30-agent-separation-model.md` - Quality control

### Tech Stack Justifications

**PostgreSQL over MongoDB:**
- Structured relational data (projects, tasks, logs)
- pgvector for semantic search
- ACID compliance for audit log
- Mature Drizzle ORM support

**Ed25519 over JWT for CLI:**
- No token copying/pasting
- Multi-machine support
- Secure signature verification
- OS keychain integration

**Next.js App Router over Pages:**
- React Server Components
- Built-in API routes
- Streaming SSR
- File-based routing

**Tailwind + ShadCN over CSS-in-JS:**
- Zero runtime cost
- Theme switching via CSS variables
- Component library included
- Dark mode support

**Fly.io over AWS:**
- Simpler deployment
- Persistent volumes
- Global edge deployment
- Cost-effective for MVP

---

**Document Version:** 1.0
**Last Updated:** 2025-10-03
**Status:** Ready for Development
