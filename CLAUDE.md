# Sentra Project Context

This document is loaded into every Claude Code session. It provides essential context about the Sentra project to ensure consistent, high-quality development.

---

## Table of Contents

- [What is Sentra?](#what-is-sentra)
- [Architecture Overview](#architecture-overview)
  - [Technology Stack](#technology-stack)
  - [Security Architecture](#security-architecture)
  - [Project Structure](#project-structure)
- [Development Standards](#development-standards)
  - [TypeScript](#typescript)
  - [Testing Requirements](#testing-requirements)
  - [Code Quality](#code-quality)
  - [Security](#security)
  - [Git Workflow](#git-workflow)
- [Known Gotchas](#known-gotchas)
- [AI Agent Guidelines](#ai-agent-guidelines)
  - [Multi-Agent Workflow](#multi-agent-workflow)
- [Common Commands](#common-commands)
- [Environment Variables](#environment-variables)
- [Resources](#resources)
- [Notes for Claude Code](#notes-for-claude-code)

---

## What is Sentra?

Sentra is a **voice-first AI assistant platform** that combines:
- **Native desktop apps** (macOS, Windows, Linux) built with Tauri 2.x
- **Modern web interface** using Next.js 15 with App Router
- **Cloud backend** for synchronization and collaboration

### Vision
Create the most natural way to interact with AI - through voice - while maintaining the power of traditional interfaces.

**Dashboard Vision:** Mission control center for managing multiple AI-powered projects simultaneously. Users should see all project activity at a glance, create new projects without touching the terminal, review PRs in-app, and control voice notifications per-project. The dashboard uses a true dark theme with professional dark cards, violet accents, and actionable intelligence.

## Architecture Overview

### Technology Stack

**Frontend (Native Apps)**
- Tauri 2.x (Rust backend, web frontend)
- Next.js 15.5 with React 19 (App Router, React Server Components)
- TypeScript (strict mode)
- TailwindCSS for styling

**Backend (Cloud Services)**
- Node.js + Express
- PostgreSQL (primary database)
- Prisma ORM
- Redis (caching, sessions)

**AI/Voice**
- OpenAI Whisper (speech-to-text)
- OpenAI GPT-4 (language model)
- OpenAI TTS (text-to-speech)

### Security Architecture

**Infrastructure:** GitHub Actions (Phases 1-2), Custom runners with gVisor (Phase 3)

**Approved Security Model (Glen Barnhardt, Nov 12, 2025):**
Sentra implements a 3-phase security architecture for AI agent isolation:

**Phase 1: Docker Containerization (THIS WEEK)**
- AI agents run in isolated Docker containers on GitHub Actions
- Read-only root filesystem with ephemeral tmpfs mounts
- Non-root user execution (claude-agent:claude-agent)
- Capability dropping (CAP_DROP=ALL with minimal additions)
- Resource limits: 2GB RAM, 2 CPU cores, 100 processes max
- Risk reduction: 60-70%

**Phase 2: Credential Proxy Service (Weeks 2-4)**
- Credentials never exposed to agent container environment
- Unix socket-based proxy service validates requests
- GitHub tokens and API keys remain on host, attached by proxy
- Full audit trail of all credential usage
- Prevents credential theft via prompt injection attacks
- Risk reduction: Additional 30% (CRITICAL)

**Phase 3: gVisor Migration (Q1 2026)**
- Custom infrastructure with Google's gVisor runtime
- User-space kernel eliminates direct syscall exposure
- Industry-leading security matching Claude Code for Web
- Requires migration off GitHub Actions
- Risk reduction: Remaining 15% gap

**Current Status:** Phase 1 implementation starting this week

**Agent Execution Engine:** Claude Code CLI (NOT Anthropic SDK)
- We use `claude` CLI command to execute GitHub issues
- DO NOT migrate to direct Anthropic SDK without reading architecture doc
- See: `.claude/docs/ARCHITECTURE-AGENT-WORKER.md` for complete rationale
- Benefits: agent ecosystem, quality hooks, auto-updates, proven reliability

**Why NOT direct SDK?**
- Would lose specialized agents (orchestrator, test-writer, code-reviewer)
- Would lose quality hooks (PreToolUse, PostToolUse, Stop validation)
- Would lose automatic updates from Anthropic
- Would need to build tool execution, context management ourselves
- 2-4 weeks development + ongoing maintenance for no real benefit

**See:** `/docs/architecture/SECURITY-ARCHITECTURE.md` for security design
**See:** `.claude/docs/ARCHITECTURE-AGENT-WORKER.md` for agent architecture

### Project Structure

```
sentra/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── services/         # Business logic (90%+ test coverage)
│   ├── api/              # API routes (75%+ test coverage)
│   ├── utils/            # Utility functions (90%+ test coverage)
│   └── lib/              # Third-party integrations
├── src-tauri/            # Rust backend for native apps
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── .claude/              # Claude Code configuration
│   ├── agents/           # Specialized AI agents
│   ├── hooks/            # Quality enforcement hooks
│   └── commands/         # Reusable commands
└── docs/                 # Project documentation
```

## Development Standards

### TypeScript

**Strict Mode is MANDATORY**
```typescript
// ✅ DO: Explicit types
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ❌ DON'T: Using 'any'
function processData(data: any) { }

// ❌ DON'T: Using @ts-ignore
// @ts-ignore
const value = getData()

// ✅ DO: Use type guards instead
function isCartItem(obj: unknown): obj is CartItem {
  return typeof obj === 'object' && obj !== null && 'price' in obj
}
```

### Testing Requirements

**Coverage Thresholds**
- **Overall**: 75%+ (enforced by CI/CD)
- **Business Logic** (src/services/): 90%+ (enforced by CI/CD)
- **Utilities** (src/utils/): 90%+ (enforced by CI/CD)
- **UI Components**: 60%+ (visual components)

**E2E Tests Required For:**
- Critical user journeys (signup, checkout, payment flows)
- **ALL visual state changes** (color, visibility, position, animation)
- **Multi-step interactions** (click → modal → action → result)
- **User-facing state transitions** (loading → success, enabled → disabled)

**Test-Driven Development (TDD)**
1. Write tests FIRST
2. Verify tests FAIL
3. Write implementation
4. Verify tests PASS
5. Refactor as needed

**Test Structure (AAA Pattern)**
```typescript
describe('AuthService', () => {
  describe('register', () => {
    it('should create user with hashed password', async () => {
      // ARRANGE: Setup test data
      const userData = { email: 'test@example.com', password: 'Pass123!' }

      // ACT: Execute the behavior
      const result = await authService.register(userData)

      // ASSERT: Verify outcome
      expect(result.id).toBeDefined()
      expect(result).not.toHaveProperty('password')
    })
  })
})
```

### Code Quality

**Linting**: ESLint with strict rules (0 errors, 0 warnings)

**Formatting**: Prettier (enforced by pre-commit hooks)

**No Debug Code**
```typescript
// ❌ DON'T: Leave console.log in production code
console.log('User data:', user)

// ✅ DO: Use proper logger
logger.info('User registered', { userId: user.id })
```

### Security

**Never commit secrets**
```typescript
// ❌ DON'T: Hardcoded secrets
const apiKey = 'sk_live_abc123'

// ✅ DO: Environment variables
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) throw new Error('OPENAI_API_KEY not configured')
```

**Input validation is mandatory**
```typescript
// ✅ DO: Validate all input
function createUser(input: unknown) {
  const validated = userSchema.parse(input) // Zod validation
  return db.user.create({ data: validated })
}
```

### Git Workflow

**Branching Strategy**
- `main`: Production-ready code (protected)
- `feature/*`: New features (e.g., `feature/voice-commands`)
- `fix/*`: Bug fixes (e.g., `fix/audio-echo`)

**Commit Messages**
```
type(scope): Brief description (branch created by Glen Barnhardt with help from Claude Code)

Detailed explanation of changes.
Why this change was needed.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Pull Requests**
- All PRs require: Tests passing, coverage ≥ thresholds, build success
- Code review required before merge
- Squash and merge to keep history clean

## Known Gotchas

### Voice Echo Prevention
**Problem**: Sentra's voice output can trigger its own listening, causing echo loops

**Solution**: 1000ms delay after Sentra finishes speaking before re-enabling listening

**Location**: `src/lib/openai-voice.ts:145`

```typescript
// After TTS completes
await new Promise(resolve => setTimeout(resolve, 1000))
// Then resume listening
```

### Tauri IPC Serialization
**Problem**: Complex objects don't serialize properly across Rust/JS boundary

**Solution**: Use simple data structures (primitives, arrays, plain objects)

**Location**: `src-tauri/src/commands.rs`

```rust
// ✅ DO: Simple types
#[tauri::command]
fn get_config() -> ConfigData { }

// ❌ DON'T: Complex types with methods
#[tauri::command]
fn get_service() -> Box<dyn Service> { }
```

### Next.js Server Components
**Problem**: Can't use client-side APIs (localStorage, window) in Server Components

**Solution**: Use `'use client'` directive when needed

```typescript
// Client Component (needs browser APIs)
'use client'
import { useState } from 'react'

export function VoiceRecorder() {
  const [recording, setRecording] = useState(false)
  // Can use browser APIs here
}
```

## AI Agent Guidelines

When working on Sentra with Claude Code agents:

### DO:
- **Write tests FIRST** (TDD approach)
- **Ask for plan approval** before implementing features
- **Use specialized agents** (test-writer, implementation, code-reviewer)
- **Run tests after EVERY change**
- **Verify coverage meets thresholds**
- **Check TypeScript compilation** (npx tsc --noEmit)
- **Follow dashboard design** (true dark theme, mission control layout)
- **Support multi-project workflows** (grid layout, per-project controls)

### DON'T:
- **Modify tests** without explicit permission (tests are the specification)
- **Use `any` or `@ts-ignore`** (TypeScript strict mode)
- **Bypass git hooks** (--no-verify is BLOCKED)
- **Commit without tests passing** (enforced by Stop hook)
- **Skip code review** (multi-agent review is mandatory)
- **Create minimalistic UIs** (use mission control design with rich features)
- **Use light colors** (true dark theme is mandatory)
- **Migrate to Anthropic SDK** (we use Claude Code CLI - see architecture doc)

### Multi-Agent Workflow

**For new features, use orchestrator agent**:
1. Orchestrator creates plan → gets user approval
2. Orchestrator spawns test-writer → writes tests FIRST
3. Orchestrator spawns implementation → makes tests pass
4. Orchestrator spawns code-reviewer → finds bugs
5. Orchestrator spawns test-runner → verifies all pass
6. (Optional) Orchestrator spawns security-auditor for sensitive code

**Why?** Single agents get tunnel vision. Multi-agent review catches 90.2% more issues.

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run tauri dev        # Start Tauri app in dev mode

# Testing
npm test                 # Run tests in watch mode
npm test -- --run        # Run tests once
npm test -- --coverage   # Run with coverage report

# Quality Checks
npm run type-check       # TypeScript compilation
npm run lint             # ESLint
npm run format           # Prettier formatting
npm run build            # Production build

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:reset         # Reset database (dev only)
```

## Environment Variables

Required environment variables (create `.env` file in project root):

```bash
# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL="file:./prisma/dev.db"
# Production: DATABASE_URL="postgresql://user:pass@host:5432/sentra"

# OpenAI (optional for Phase 1)
# OPENAI_API_KEY="sk-..."

# Authentication (optional for Phase 1)
# JWT_SECRET="generate-random-string"

# App
# NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Resources

- **Repository**: https://github.com/barnent1/sentra
- **Documentation**: `/docs` directory
- **Dashboard Design**: `/docs/roadmap/dashboard-redesign.md`
- **Observability Vision**: `/docs/roadmap/observability.md`
- **Issues**: GitHub Issues with `ai-feature` label trigger automation
- **Claude Code Docs**: https://docs.claude.com/claude-code

## Notes for Claude Code

**This project uses the Perfect Agentic Structure**:
- 6-layer defense system prevents bugs from being committed
- PreToolUse hooks BLOCK dangerous operations (git --no-verify)
- PostToolUse hooks VALIDATE every file change
- Stop hook is UNBYPASSABLE - runs comprehensive quality gate

**The 9-month bug pain will NEVER happen again** because:
1. Git bypass is blocked at 3 layers (settings, hook, MCP)
2. Tests must be written FIRST (enforced by workflow)
3. Multi-agent review catches issues single agent misses
4. Stop hook prevents finishing until ALL checks pass
5. CI/CD enforces quality gates (cannot be bypassed)

**Agent Architecture (CRITICAL)**:
- We use Claude Code CLI for agent execution, NOT Anthropic SDK
- DO NOT migrate to SDK - it would lose agent ecosystem, quality hooks, auto-updates
- See `.claude/docs/ARCHITECTURE-AGENT-WORKER.md` for complete rationale
- This decision is final unless ALL criteria in architecture doc are met (they won't be)

**When in doubt**:
- Check PERFECT-AGENTIC-STRUCTURE.md for complete workflow
- Check `.claude/docs/ARCHITECTURE-AGENT-WORKER.md` before changing agent execution
- Use orchestrator agent for complex features
- Write tests FIRST, always
- Get code review before finishing

---

*Last updated: 2025-11-13 by Glen Barnhardt with help from Claude Code*
