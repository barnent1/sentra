# Sentra Development Tasks

**Breakdown of PRD into individual atomic tasks for autonomous execution**

---

## Phase 1: Foundation (Weeks 1-3)

### Module 1: Database Setup

#### Task 1.1: Initialize Database Schema
- **Type:** chore
- **Priority:** high
- **Description:** Set up PostgreSQL database with Drizzle ORM, create initial schema for core tables (projects, tasks, stacks, users)
- **Acceptance Criteria:**
  - Drizzle ORM configured with PostgreSQL
  - Schema files created in db/schema/
  - Migrations setup
  - Database connection tested

#### Task 1.2: Create Project Tables
- **Type:** feature
- **Priority:** high
- **Description:** Implement projects, stacks, and documentationChunks tables with proper relationships and indexes
- **Acceptance Criteria:**
  - Tables created with correct columns and types
  - Foreign key relationships established
  - Indexes on frequently queried columns
  - Stack fingerprinting hash column

#### Task 1.3: Create Task & Workflow Tables
- **Type:** feature
- **Priority:** high
- **Description:** Implement tasks, workflowState, logs, and worktrees tables
- **Acceptance Criteria:**
  - Task table with JSONB fields for plan/results
  - Workflow state tracking
  - Log table with project/task/phase indexing
  - Worktree lifecycle tracking

#### Task 1.4: Create Authentication Tables
- **Type:** feature
- **Priority:** high
- **Description:** Implement users, userKeys, sessions, and auditLog tables with security features
- **Acceptance Criteria:**
  - User table with password hash
  - UserKeys for Ed25519 public keys
  - Sessions for JWT management
  - AuditLog with immutability triggers

#### Task 1.5: Create Asset Tables
- **Type:** feature
- **Priority:** medium
- **Description:** Implement screenshots and designAssets tables for visual comparison
- **Acceptance Criteria:**
  - Screenshot storage with task reference
  - Design asset tracking (R2/S3 URLs)
  - Phase and agent attribution

### Module 2: MCP Server Core

#### Task 2.1: Initialize MCP Server
- **Type:** chore
- **Priority:** high
- **Description:** Set up Express/Hono server with MCP protocol support
- **Acceptance Criteria:**
  - Server runs on configurable port
  - Health check endpoint
  - MCP protocol handlers
  - Error handling middleware

#### Task 2.2: Implement Request Authentication
- **Type:** feature
- **Priority:** high
- **Description:** Add Ed25519 signature verification for all MCP requests
- **Acceptance Criteria:**
  - Signature verification function
  - Timestamp validation (60s window)
  - Public key registry check
  - Rate limiting middleware

#### Task 2.3: Create Task Management Tools
- **Type:** feature
- **Priority:** high
- **Description:** Implement MCP tools: get_task_info, create_plan, update_task_phase, mark_task_complete
- **Acceptance Criteria:**
  - Phase-filtered data access
  - Plan creation in database
  - Phase transition logic
  - Task completion workflow

#### Task 2.4: Create Pattern Learning Tools
- **Type:** feature
- **Priority:** high
- **Description:** Implement find_similar_implementations and get_relevant_docs MCP tools
- **Acceptance Criteria:**
  - Grep-based pattern search
  - Vector similarity search for docs
  - Results ranked by relevance
  - Caching for performance

#### Task 2.5: Create Code Execution Tools
- **Type:** feature
- **Priority:** high
- **Description:** Implement run_typecheck, run_lint, run_tests, run_e2e_tests, run_build MCP tools
- **Acceptance Criteria:**
  - Execute validation commands in worktree
  - Capture stdout/stderr
  - Parse results for errors
  - Screenshot capture for E2E

#### Task 2.6: Create Git Operation Tools
- **Type:** feature
- **Priority:** high
- **Description:** Implement create_branch, commit_changes, push_branch, create_pull_request MCP tools
- **Acceptance Criteria:**
  - Git worktree operations
  - Branch creation and switching
  - Commit with proper messages
  - PR creation via GitHub API

### Module 3: Claude Code Integration

#### Task 3.1: Install Claude Code SDK
- **Type:** chore
- **Priority:** high
- **Description:** Add @anthropic-ai/claude-agent-sdk dependency and configure
- **Acceptance Criteria:**
  - SDK installed
  - API key configured
  - Query interface tested
  - Streaming responses working

#### Task 3.2: Implement Agent Spawning
- **Type:** feature
- **Priority:** high
- **Description:** Create agent spawning system with fresh context per phase
- **Acceptance Criteria:**
  - Spawn isolated Claude sessions
  - Phase-specific prompts
  - Worktree context injection
  - Session cleanup after phase

#### Task 3.3: Create Agent Prompt Retrieval
- **Type:** feature
- **Priority:** high
- **Description:** Implement prompt composition system (base + stack + override)
- **Acceptance Criteria:**
  - Load base prompts from database
  - Generate stack-specific additions
  - Apply project overrides if present
  - Variable substitution

### Module 4: Workflow Engine

#### Task 4.1: Create Atomic PLAN Workflow
- **Type:** feature
- **Priority:** high
- **Description:** Implement plan.ts workflow for PLAN phase
- **Acceptance Criteria:**
  - Fetch task from database
  - Invoke analyst agent
  - Study existing patterns
  - Store plan in database
  - Transition to CODE phase

#### Task 4.2: Create Atomic CODE Workflow
- **Type:** feature
- **Priority:** high
- **Description:** Implement code.ts workflow for CODE phase
- **Acceptance Criteria:**
  - Load plan from database
  - Invoke coder agent
  - Implement following patterns
  - Run typecheck continuously
  - Create commit
  - Transition to TEST phase

#### Task 4.3: Create Atomic TEST Workflow
- **Type:** feature
- **Priority:** high
- **Description:** Implement test.ts workflow for TEST phase
- **Acceptance Criteria:**
  - Load plan from database
  - Invoke tester agent
  - Write and run tests
  - Capture E2E screenshots
  - Pushback to CODE if failures
  - Transition to REVIEW phase if pass

#### Task 4.4: Create Atomic REVIEW Workflow
- **Type:** feature
- **Priority:** high
- **Description:** Implement review.ts workflow for REVIEW phase
- **Acceptance Criteria:**
  - Load plan + screenshots
  - Invoke reviewer agent
  - Visual comparison
  - Code quality check
  - Create PR if approved
  - Pushback to CODE if issues

#### Task 4.5: Create Full SDLC Composed Workflow
- **Type:** feature
- **Priority:** high
- **Description:** Implement full_sdlc.ts that chains all phases
- **Acceptance Criteria:**
  - Sequential execution: PLAN → CODE → TEST → REVIEW
  - Error handling and retries
  - State persistence between phases
  - Cleanup on completion

### Module 5: CLI Foundation

#### Task 5.1: Create CLI Package Structure
- **Type:** chore
- **Priority:** high
- **Description:** Set up npm package for global CLI (@sentra/cli)
- **Acceptance Criteria:**
  - Package.json with bin entry
  - TypeScript configuration
  - Commander.js setup
  - Help text and version

#### Task 5.2: Implement Stack Detection
- **Type:** feature
- **Priority:** high
- **Description:** Auto-detect framework, language, database from project files
- **Acceptance Criteria:**
  - Read package.json dependencies
  - Detect TypeScript/JavaScript
  - Identify framework (Next.js, React, etc.)
  - Database client detection

#### Task 5.3: Implement CLI Authentication Flow
- **Type:** feature
- **Priority:** high
- **Description:** Generate Ed25519 keypair and register with backend
- **Acceptance Criteria:**
  - Generate keypair with tweetnacl
  - Store private key in OS keychain
  - Send public key to backend
  - Handle existing user login

#### Task 5.4: Implement Setup Command
- **Type:** feature
- **Priority:** high
- **Description:** Create sentra setup command with interactive flow
- **Acceptance Criteria:**
  - Stack detection and presentation
  - User confirmation/adjustment
  - Convention discovery (brownfield)
  - MCP connection test
  - Config file creation

#### Task 5.5: Implement Project Configuration
- **Type:** feature
- **Priority:** medium
- **Description:** Create .sentra/config.json with stack profile and settings
- **Acceptance Criteria:**
  - Save detected stack
  - Store conventions
  - Validation commands
  - MCP connection info

### Module 6: Git Worktree Management

#### Task 6.1: Create Worktree Lifecycle Manager
- **Type:** feature
- **Priority:** high
- **Description:** Implement worktree creation, setup, and cleanup
- **Acceptance Criteria:**
  - Create worktree in .sentra/worktrees/
  - Initialize with branch
  - Environment setup (ports, env vars)
  - Cleanup after merge

#### Task 6.2: Implement Port Allocation
- **Type:** feature
- **Priority:** medium
- **Description:** Deterministic port assignment for parallel tasks
- **Acceptance Criteria:**
  - Hash-based port calculation
  - Port range management (3000-3999)
  - .env.local generation per worktree
  - Conflict detection

#### Task 6.3: Create Dependency Installation
- **Type:** feature
- **Priority:** medium
- **Description:** Auto-install dependencies in worktree (npm/pnpm/bun)
- **Acceptance Criteria:**
  - Detect package manager
  - Run install in worktree
  - Share node_modules when possible
  - Database migration execution

---

## Phase 2: Dashboard MVP (Weeks 4-6)

### Module 7: Next.js Dashboard Setup

#### Task 7.1: Initialize Next.js Project
- **Type:** chore
- **Priority:** high
- **Description:** Create Next.js 15 project with App Router and TypeScript
- **Acceptance Criteria:**
  - Next.js 15 installed
  - App Router configured (no src dir)
  - TypeScript strict mode
  - ESLint + Prettier setup

#### Task 7.2: Configure Tailwind + ShadCN
- **Type:** chore
- **Priority:** high
- **Description:** Set up Tailwind CSS with ShadCN theme system
- **Acceptance Criteria:**
  - Tailwind CSS installed
  - ShadCN components initialized
  - Dark mode with violet theme
  - CSS variables for all themes

#### Task 7.3: Set up Framer Motion
- **Type:** chore
- **Priority:** medium
- **Description:** Install and configure Framer Motion for animations
- **Acceptance Criteria:**
  - Framer Motion installed
  - Page transition animations
  - Micro-interaction examples
  - Performance optimized

### Module 8: Dashboard Authentication

#### Task 8.1: Implement NextAuth Setup
- **Type:** feature
- **Priority:** high
- **Description:** Configure NextAuth.js for email/password authentication
- **Acceptance Criteria:**
  - NextAuth.js configured
  - Credentials provider
  - JWT session strategy
  - Protected routes middleware

#### Task 8.2: Create Login Page
- **Type:** feature
- **Priority:** high
- **Description:** Build login UI with email/password form
- **Acceptance Criteria:**
  - Login form with validation
  - Error message display
  - Remember me checkbox
  - Redirect after login

#### Task 8.3: Create Registration Flow
- **Type:** feature
- **Priority:** high
- **Description:** Build registration UI and API endpoint
- **Acceptance Criteria:**
  - Registration form
  - Password strength validation
  - Email uniqueness check
  - Auto-login after registration

### Module 9: Dashboard Home View

#### Task 9.1: Create Layout Component
- **Type:** feature
- **Priority:** high
- **Description:** Build dashboard layout with sidebar navigation
- **Acceptance Criteria:**
  - Responsive sidebar
  - Navigation menu
  - User avatar + dropdown
  - Project switcher in header

#### Task 9.2: Implement Home Page
- **Type:** feature
- **Priority:** high
- **Description:** Build home view with project cards and stats
- **Acceptance Criteria:**
  - Project cards grid
  - Quick stats overview
  - Recent activity feed
  - Quick action buttons

#### Task 9.3: Create Project Card Component
- **Type:** feature
- **Priority:** medium
- **Description:** Build reusable project card with stack badges
- **Acceptance Criteria:**
  - Project name and icon
  - Stack badges display
  - Task count stats
  - View/edit actions

### Module 10: Kanban Board

#### Task 10.1: Create Kanban Layout
- **Type:** feature
- **Priority:** high
- **Description:** Build kanban board with 6 columns (Backlog, Plan, Code, Test, Review, Done)
- **Acceptance Criteria:**
  - 6-column layout
  - Horizontal scroll support
  - Column headers with counts
  - Empty state display

#### Task 10.2: Implement Task Card Component
- **Type:** feature
- **Priority:** high
- **Description:** Build task card for kanban display
- **Acceptance Criteria:**
  - Title, ID, type display
  - Phase indicators
  - Progress percentage
  - Agent and time info

#### Task 10.3: Add Drag-Drop Functionality
- **Type:** feature
- **Priority:** medium
- **Description:** Implement drag-drop between columns (react-beautiful-dnd or dnd-kit)
- **Acceptance Criteria:**
  - Drag task cards
  - Drop in any column
  - Phase update on drop
  - Optimistic UI update

#### Task 10.4: Create Failed Task Highlighting
- **Type:** feature
- **Priority:** medium
- **Description:** Auto-highlight failed tasks with error info
- **Acceptance Criteria:**
  - Red border/background for failures
  - Error message preview
  - Retry/Skip action buttons
  - Auto-scroll to failed tasks

### Module 11: Task Detail View

#### Task 11.1: Create Task Detail Drawer
- **Type:** feature
- **Priority:** high
- **Description:** Build slide-out drawer for task details
- **Acceptance Criteria:**
  - Drawer animation (Framer Motion)
  - Close on ESC or click outside
  - Tabbed interface
  - Mobile responsive

#### Task 11.2: Implement Overview Tab
- **Type:** feature
- **Priority:** high
- **Description:** Show task overview with status, branch, description
- **Acceptance Criteria:**
  - Phase progress indicator
  - Branch and worktree info
  - Description display
  - Action buttons (Retry, Skip, Cancel)

#### Task 11.3: Create Logs Tab
- **Type:** feature
- **Priority:** high
- **Description:** Real-time log viewer with filtering
- **Acceptance Criteria:**
  - WebSocket connection for streaming
  - Phase and level filters
  - Search functionality
  - Auto-scroll toggle

#### Task 11.4: Build Files Tab
- **Type:** feature
- **Priority:** medium
- **Description:** Show files changed with diff view
- **Acceptance Criteria:**
  - List modified/created files
  - Diff viewer per file
  - Syntax highlighting
  - Expand/collapse

#### Task 11.5: Create Visual Diff Tab
- **Type:** feature
- **Priority:** medium
- **Description:** Side-by-side design comparison
- **Acceptance Criteria:**
  - Reference design display
  - Implementation screenshot
  - AI comparison results
  - Issue highlighting

### Module 12: Real-Time Updates

#### Task 12.1: Implement WebSocket Server
- **Type:** feature
- **Priority:** high
- **Description:** Set up WebSocket server for real-time log streaming
- **Acceptance Criteria:**
  - WebSocket endpoint on MCP server
  - Room-based broadcasting (per task)
  - Connection management
  - Heartbeat/reconnect logic

#### Task 12.2: Create Log Streaming Client
- **Type:** feature
- **Priority:** high
- **Description:** Dashboard client for receiving real-time logs
- **Acceptance Criteria:**
  - useWebSocket hook
  - Auto-reconnect on disconnect
  - Message parsing and display
  - Performance optimization (virtual scroll)

#### Task 12.3: Implement Task Status Updates
- **Type:** feature
- **Priority:** high
- **Description:** Real-time task phase and status updates
- **Acceptance Criteria:**
  - Phase change broadcasts
  - Status update rendering
  - Optimistic UI updates
  - Error state handling

---

## Phase 3: Multi-Project (Weeks 7-8)

### Module 13: Stack Fingerprinting

#### Task 13.1: Implement Stack Hash Generation
- **Type:** feature
- **Priority:** high
- **Description:** Generate deterministic hash from stack components
- **Acceptance Criteria:**
  - Canonical form normalization
  - SHA-256 hash generation
  - Version normalization (major.minor)
  - Hash uniqueness constraint

#### Task 13.2: Create Stack Lookup/Create Logic
- **Type:** feature
- **Priority:** high
- **Description:** Find existing stack or create new one based on hash
- **Acceptance Criteria:**
  - Hash-based lookup
  - Auto-create if not found
  - Associate project with stack
  - Documentation fetch trigger

#### Task 13.3: Implement Documentation Sharing
- **Type:** feature
- **Priority:** high
- **Description:** Share documentation chunks across projects with same stack
- **Acceptance Criteria:**
  - Stack-based doc queries
  - Vector similarity search
  - Cache documentation per stack
  - Deduplication verification

### Module 14: Multi-Project Dashboard

#### Task 14.1: Create Project Switcher Component
- **Type:** feature
- **Priority:** high
- **Description:** Build dropdown project switcher in header
- **Acceptance Criteria:**
  - Project list with search
  - Recent projects section
  - Active project indicator
  - Keyboard navigation

#### Task 14.2: Implement Multi-Project View
- **Type:** feature
- **Priority:** medium
- **Description:** Split-screen view for 2-4 projects
- **Acceptance Criteria:**
  - Layout options (2-col, grid, unified)
  - Independent kanban per project
  - Synchronized scrolling option
  - Resize panels

#### Task 14.3: Create Cross-Project Task List
- **Type:** feature
- **Priority:** medium
- **Description:** Unified task list across all projects
- **Acceptance Criteria:**
  - Aggregate tasks from selected projects
  - Project badge per task
  - Cross-project filters
  - Sort by priority/date

### Module 15: Command Palette

#### Task 15.1: Implement Command Palette UI
- **Type:** feature
- **Priority:** medium
- **Description:** Build Cmd+K command palette (cmdk library)
- **Acceptance Criteria:**
  - Cmd+K to open
  - Fuzzy search
  - Command categories
  - Keyboard navigation

#### Task 15.2: Add Quick Actions
- **Type:** feature
- **Priority:** medium
- **Description:** Implement common actions in command palette
- **Acceptance Criteria:**
  - Create Task
  - Create Project
  - Switch Project
  - View Logs
  - View Failures

#### Task 15.3: Implement Search Functionality
- **Type:** feature
- **Priority:** medium
- **Description:** Search across tasks, projects, logs from palette
- **Acceptance Criteria:**
  - Fuzzy search algorithm
  - Recent searches history
  - Jump to results
  - Highlight matches

---

## Phase 4: Quality Enforcement (Weeks 9-10)

### Module 16: TypeScript Strictness

#### Task 16.1: Create Pre-emptive Type Validation
- **Type:** feature
- **Priority:** high
- **Description:** Run typecheck after each file change during CODE phase
- **Acceptance Criteria:**
  - Auto-run tsc on file write
  - Parse error output
  - Block commit if errors
  - Error guidance from patterns

#### Task 16.2: Implement Type Pattern Learning
- **Type:** feature
- **Priority:** high
- **Description:** MCP tool to find similar type patterns in codebase
- **Acceptance Criteria:**
  - Search for type definitions
  - Find usage examples
  - Suggest type fixes
  - Cache common patterns

#### Task 16.3: Create Strict Mode Enforcement
- **Type:** feature
- **Priority:** high
- **Description:** Ensure tsconfig.json strict mode enabled
- **Acceptance Criteria:**
  - Validate tsconfig on setup
  - Enforce strict: true
  - All strict flags enabled
  - No any types allowed

### Module 17: Pushback Loops

#### Task 17.1: Implement Test Failure Pushback
- **Type:** feature
- **Priority:** high
- **Description:** Auto-pushback to CODE when tests fail in TEST phase
- **Acceptance Criteria:**
  - Detect test failures
  - Update task phase to CODE
  - Include failure details
  - Increment iteration counter

#### Task 17.2: Create Review Issue Pushback
- **Type:** feature
- **Priority:** high
- **Description:** Pushback to CODE when review finds issues
- **Acceptance Criteria:**
  - Detect blocking issues
  - Phase transition with context
  - Screenshot attachments
  - Guidance for fixes

#### Task 17.3: Add Iteration Limit
- **Type:** feature
- **Priority:** medium
- **Description:** Max 5 iterations before human escalation
- **Acceptance Criteria:**
  - Track iteration count
  - Block phase at max
  - Dashboard notification
  - Human intervention required

### Module 18: Visual Design Comparison

#### Task 18.1: Implement Design Asset Upload
- **Type:** feature
- **Priority:** high
- **Description:** Allow users to upload reference designs
- **Acceptance Criteria:**
  - File upload component
  - R2/S3 integration
  - Store asset URL in database
  - Link to task

#### Task 18.2: Create Screenshot Capture
- **Type:** feature
- **Priority:** high
- **Description:** Playwright screenshot capture during E2E tests
- **Acceptance Criteria:**
  - Auto-screenshot key pages
  - Store in R2/S3
  - Link to task + phase
  - Thumbnail generation

#### Task 18.3: Implement AI Visual Comparison
- **Type:** feature
- **Priority:** high
- **Description:** Use Claude Vision API to compare designs
- **Acceptance Criteria:**
  - Pass reference + implementation images
  - AI identifies differences
  - Parse JSON response
  - Calculate match score

#### Task 18.4: Build Visual Diff UI
- **Type:** feature
- **Priority:** medium
- **Description:** Dashboard view for visual comparison
- **Acceptance Criteria:**
  - Side-by-side image display
  - Pixel diff overlay
  - Issue list with locations
  - Accept/Retry actions

### Module 19: Failure Dashboard

#### Task 19.1: Create Failed Tasks Query
- **Type:** feature
- **Priority:** high
- **Description:** API endpoint to fetch all failed tasks
- **Acceptance Criteria:**
  - Filter by status = failed
  - Include error details
  - Sort by recency
  - Pagination support

#### Task 19.2: Build Failure Dashboard View
- **Type:** feature
- **Priority:** high
- **Description:** Dedicated view for failed tasks
- **Acceptance Criteria:**
  - List all failures
  - Error message display
  - Quick actions (Retry, Skip, Fix)
  - Auto-refresh

#### Task 19.3: Implement Retry Action
- **Type:** feature
- **Priority:** high
- **Description:** One-click retry for failed tasks
- **Acceptance Criteria:**
  - Reset task to last successful phase
  - Clear error state
  - Re-trigger workflow
  - UI feedback

---

## Phase 5: AI Features (Weeks 11-13)

### Module 20: AI Project Analyst

#### Task 20.1: Create Project Analysis Prompt
- **Type:** feature
- **Priority:** high
- **Description:** Claude prompt to decompose large projects
- **Acceptance Criteria:**
  - Input: project description
  - Output: modules, features, tasks (JSON)
  - Dependency identification
  - Time estimation

#### Task 20.2: Build Project Breakdown UI
- **Type:** feature
- **Priority:** high
- **Description:** Wizard interface for project decomposition
- **Acceptance Criteria:**
  - Input form (name, description, stack)
  - Loading state during analysis
  - Module breakdown display
  - Dependency graph visualization

#### Task 20.3: Implement Task Generation
- **Type:** feature
- **Priority:** high
- **Description:** Auto-create tasks from AI breakdown
- **Acceptance Criteria:**
  - Parse AI response
  - Create task records in bulk
  - Set dependencies
  - Assign priorities

#### Task 20.4: Create Dependency Graph
- **Type:** feature
- **Priority:** medium
- **Description:** Visualize task dependencies
- **Acceptance Criteria:**
  - Graph rendering (D3.js or similar)
  - Interactive nodes
  - Critical path highlighting
  - Export as image

### Module 21: Legacy Migration Planner

#### Task 21.1: Implement Code Scanner
- **Type:** feature
- **Priority:** high
- **Description:** Scan legacy codebase for structure
- **Acceptance Criteria:**
  - File count and types
  - Database table discovery
  - API endpoint extraction
  - Page/route detection

#### Task 21.2: Create Component Mapping AI
- **Type:** feature
- **Priority:** high
- **Description:** AI-powered mapping of legacy → new
- **Acceptance Criteria:**
  - Analyze legacy patterns
  - Map to modern equivalents
  - Field name conversion
  - API route mapping

#### Task 21.3: Build Migration Planner UI
- **Type:** feature
- **Priority:** high
- **Description:** Wizard for legacy migration planning
- **Acceptance Criteria:**
  - Legacy system input
  - Target stack selection
  - Mapping review/edit
  - Strategy recommendation

#### Task 21.4: Generate Migration Tasks
- **Type:** feature
- **Priority:** high
- **Description:** Create rewrite tasks from migration plan
- **Acceptance Criteria:**
  - Component-by-component tasks
  - Include rollback plans
  - Field mapping context
  - Phased execution

---

## Phase 6: Polish & Launch (Weeks 14-16)

### Module 22: Analytics

#### Task 22.1: Create Analytics Data Collection
- **Type:** feature
- **Priority:** medium
- **Description:** Track task velocity, agent performance, completion times
- **Acceptance Criteria:**
  - Log task events (start, complete, fail)
  - Calculate metrics (velocity, duration)
  - Store aggregated data
  - Retention policy

#### Task 22.2: Build Analytics Dashboard
- **Type:** feature
- **Priority:** medium
- **Description:** Visualize metrics and insights
- **Acceptance Criteria:**
  - Task velocity graph
  - Agent performance table
  - Time to completion metrics
  - Export reports

### Module 23: Resource Monitor

#### Task 23.1: Implement Resource Tracking
- **Type:** feature
- **Priority:** medium
- **Description:** Monitor agent usage, worktrees, API limits
- **Acceptance Criteria:**
  - Active agent count
  - Worktree disk usage
  - MCP request quota
  - API rate limit status

#### Task 23.2: Create Resource Dashboard
- **Type:** feature
- **Priority:** medium
- **Description:** Real-time resource utilization view
- **Acceptance Criteria:**
  - Gauges for utilization
  - Worktree cleanup action
  - Alert on quota near limit
  - Historical trends

### Module 24: Mobile Responsive

#### Task 24.1: Optimize Home View for Mobile
- **Type:** feature
- **Priority:** medium
- **Description:** Responsive layout for home page
- **Acceptance Criteria:**
  - Stack project cards vertically
  - Touch-friendly buttons
  - Mobile navigation menu
  - Optimized font sizes

#### Task 24.2: Adapt Kanban for Mobile
- **Type:** feature
- **Priority:** medium
- **Description:** Mobile-friendly kanban view
- **Acceptance Criteria:**
  - Horizontal swipe between columns
  - Compact task cards
  - Bottom sheet for details
  - Touch drag-drop

### Module 25: Documentation

#### Task 25.1: Write User Documentation
- **Type:** chore
- **Priority:** medium
- **Description:** User guide for CLI and dashboard
- **Acceptance Criteria:**
  - Installation guide
  - Setup walkthrough
  - Task creation tutorial
  - Troubleshooting section

#### Task 25.2: Create API Documentation
- **Type:** chore
- **Priority:** medium
- **Description:** Document MCP tools and API endpoints
- **Acceptance Criteria:**
  - Tool descriptions
  - Parameter schemas
  - Example requests/responses
  - Authentication guide

#### Task 25.3: Add In-App Help
- **Type:** feature
- **Priority:** low
- **Description:** Contextual help tooltips in dashboard
- **Acceptance Criteria:**
  - Tooltip component
  - Help icons on key features
  - Link to full docs
  - Dismissible

### Module 26: Deployment

#### Task 26.1: Configure Fly.io Deployment
- **Type:** chore
- **Priority:** high
- **Description:** Set up Fly.io for MCP server and dashboard
- **Acceptance Criteria:**
  - fly.toml configuration
  - Persistent volume for worktrees
  - Environment variables
  - SSL certificates

#### Task 26.2: Set up CI/CD Pipeline
- **Type:** chore
- **Priority:** high
- **Description:** GitHub Actions for automated deployment
- **Acceptance Criteria:**
  - Build and test on push
  - Auto-deploy to staging
  - Manual approval for production
  - Rollback capability

#### Task 26.3: Implement Monitoring
- **Type:** feature
- **Priority:** high
- **Description:** Application monitoring and alerting
- **Acceptance Criteria:**
  - Error tracking (Sentry or similar)
  - Performance monitoring
  - Uptime checks
  - Slack/email alerts

### Module 27: Security Hardening

#### Task 27.1: Audit Log Review
- **Type:** chore
- **Priority:** high
- **Description:** Verify audit log immutability and coverage
- **Acceptance Criteria:**
  - Test UPDATE/DELETE prevention
  - All critical events logged
  - Log retention policy
  - Export capability

#### Task 27.2: Penetration Testing
- **Type:** chore
- **Priority:** high
- **Description:** Security testing of auth and APIs
- **Acceptance Criteria:**
  - Test signature verification
  - Attempt replay attacks
  - Test rate limiting
  - SQL injection prevention

#### Task 27.3: Secrets Management Review
- **Type:** chore
- **Priority:** medium
- **Description:** Ensure no secrets in logs or errors
- **Acceptance Criteria:**
  - Scrub private keys from logs
  - Sanitize error messages
  - Environment variable usage
  - Secret rotation plan

---

## Summary

**Total Tasks:** 120+ atomic tasks across 27 modules

**Execution Strategy:**
- Each task follows: PLAN → CODE → TEST → REVIEW
- Tasks within modules can be parallelized (e.g., all Task 1.x database tasks)
- Modules have dependencies (Module 2 requires Module 1)
- ONE agent, ONE task at a time per execution

**Quality Gates:**
- TypeScript strict mode enforcement
- Comprehensive test coverage (>85%)
- Visual design validation (>85% match)
- Code review approval before PR

**Timeline:** 16 weeks (4 months) to production-ready MVP

---

**Document Version:** 1.0
**Last Updated:** 2025-10-03
**Status:** Ready for Orchestrator
