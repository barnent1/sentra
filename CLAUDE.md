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

Sentra is a **voice-first AI assistant web application** that provides:
- **Modern web interface** using Next.js 15 with App Router
- **Universal browser access** on any platform (macOS, Windows, Linux)
- **Cloud backend** for synchronization and collaboration
- **Perfect voice support** with browser echo cancellation

### Vision
Create the most natural way to interact with AI - through voice - while maintaining the power of traditional interfaces.

**Dashboard Vision:** Mission control center for managing multiple AI-powered projects simultaneously. Users should see all project activity at a glance, create new projects without touching the terminal, review PRs in-app, and control voice notifications per-project. The dashboard uses a true dark theme with professional dark cards, violet accents, and actionable intelligence.

## Architecture Overview

### Technology Stack

**Frontend (Web Application) - November 2025 Standards**
- Next.js 15.5 with React 19 (App Router, React Server Components)
- TypeScript 5.6+ (strict mode)
- TailwindCSS v3.4+ for styling
- **ShadCN UI** (accessible components built on Radix UI)
- React Query v5 (TanStack Query) for data fetching
- React Hook Form + Zod for form validation
- Framer Motion for animations

**Backend (Cloud Services)**
- Next.js 15 API Routes (App Router)
- PostgreSQL (primary database)
- Drizzle ORM (edge-compatible, Vercel Edge Runtime)
- Redis (caching, sessions)
- Vercel Edge Runtime (globally distributed)

**AI/Voice - November 2025 Models**
- **Claude Sonnet 4.5** (primary LLM - claude-sonnet-4-5-20250929)
- OpenAI GPT-4o (secondary LLM)
- OpenAI Realtime API (voice conversations)
- OpenAI Whisper (speech-to-text)
- OpenAI TTS (text-to-speech)
- Vercel AI SDK (streaming, structured outputs)

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

**Phase 2: Credential Proxy Service (Weeks 2-4) - IN PRODUCTION**
- Credentials never exposed to agent container environment
- Unix socket-based proxy service validates requests
- GitHub tokens and API keys remain on host, attached by proxy
- Full audit trail of all credential usage
- Prevents credential theft via prompt injection attacks
- Risk reduction: Additional 30% (CRITICAL)
- **Status:** Implemented and deployed
- **Implementation:** `.claude/services/credential-proxy.py`
- **Audit logs:** Uploaded to GitHub Actions artifacts for compliance
- **Request validation:** Service/operation whitelisting with rate limiting
- **Documentation:** `/docs/architecture/SECURITY-PHASE-2.md`

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
│   ├── lib/              # Third-party integrations
│   └── hooks/            # Custom React hooks
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── .claude/              # Claude Code configuration
│   ├── agents/           # Specialized AI agents
│   ├── hooks/            # Quality enforcement hooks
│   └── commands/         # Reusable commands
└── docs/                 # Project documentation
    ├── architecture/     # System design
    ├── deployment/       # Deployment guides
    └── features/         # Feature docs
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

### Voice System Architecture
**Pattern**: Always-on microphone with browser echo cancellation (WebRTC mode)

**CRITICAL DECISION (November 2025):**
We chose **Option A: Trust Industry Pattern** for voice echo cancellation. This is documented in:
- `/docs/architecture/VOICE-SYSTEM.md` - Decision 4
- `/docs/decisions/ADR-001-VOICE-ECHO-CANCELLATION.md` - Full decision record

**How it works**:
- Microphone track remains enabled throughout the conversation
- Browser's native echo cancellation (`echoCancellation: true`) prevents feedback loops
- Audio playback stays in browser pipeline (HTMLAudioElement only)
- Server-side VAD (Voice Activity Detection) handles turn detection
- No manual track toggling needed - this is the industry standard used by ChatGPT voice

**Why AudioWorklet was never needed:**
- Web application runs natively in browser (Chrome, Safari, Firefox, Edge)
- Browser's native echo cancellation works perfectly across all platforms
- No desktop Tauri WKWebView limitations - we're 100% web-based now

**Architecture:**
```
✅ CORRECT (echo cancellation works in all browsers):
Microphone → getUserMedia → RTCPeerConnection → OpenAI
    ↑ AEC compares signals ↓
HTMLAudioElement ← RTCPeerConnection (browser sees both)
```

**Location**: `src/lib/openai-realtime.ts`

**DO NOT**:
- Implement AudioWorklet bypass to native audio
- Manually toggle microphone (pauseRecording/resumeRecording)
- Add artificial delays for echo prevention
- Try to "improve" browser echo cancellation

**Why web-only is better**:
- Echo cancellation works perfectly on all platforms (macOS, Windows, Linux, mobile)
- No WKWebView audio limitations
- No Tauri desktop integration complexity
- Universal access - just open URL, no installation needed
- Easier deployment and updates

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
- **Use voice-architect agent** for multi-session feature planning
- **Auto-generate E2E tests** from screen specifications (≥90% confidence)

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

## Agent + Skill Architecture

**Sentra uses a 2-layer knowledge system:**

### Layer 1: Specialized Skills (10 skills, 51+ files, ~60,000 lines)

**Cross-Cutting Skills** (used by multiple agents):
- **quality-gates** - Checkpoint framework, validation rules, test patterns
- **architecture-patterns** - Pattern index referencing comprehensive skills
- **code-review-standards** - Review framework, severity levels, templates

**Domain-Specific Skills** (deep expertise in specific areas):
- **typescript-strict-guard** - Strict mode standards, type guards, error handling
- **nextjs-15-specialist** - App Router, Server Components, caching, data fetching
- **shadcn-ui-patterns** - ShadCN UI components, Radix UI accessibility, TailwindCSS (Nov 2025)
- **drizzle-orm-patterns** - Edge runtime, queries, transactions, migrations
- **react-19-patterns** - Hooks, Server/Client Components, streaming, Suspense
- **zod-validation-patterns** - Schema patterns, async validation, error handling
- **security-sentinel** - OWASP Top 10, authentication, authorization, input validation
- **tdd-enforcer** - TDD workflow, AAA pattern, coverage requirements

**Project-Specific Skills**:
- **voice-system-expert** - Sentra voice architecture, echo cancellation, WebRTC
- **sentra-architect** - Sentra-specific patterns and architecture decisions
- **semantic-code-hunter** - Serena MCP integration for semantic code search

### Layer 2: Specialized Agents (11 agents, ~7,000 lines)

**Agents are SMALL and FOCUSED** - they reference skills for detailed knowledge:

| Agent | Lines | Skills Used | Purpose |
|-------|-------|------------|---------|
| orchestrator | 297 | architecture-patterns, quality-gates | Plans work, coordinates agents |
| test-writer | 181 | quality-gates, tdd-enforcer, architecture-patterns | Writes tests FIRST (TDD) |
| implementation | 221 | quality-gates, architecture-patterns, typescript-strict-guard, nextjs-15-specialist, drizzle-orm-patterns, react-19-patterns, zod-validation-patterns | Makes tests pass |
| code-reviewer | 175 | code-review-standards, quality-gates, security-sentinel, typescript-strict-guard, nextjs-15-specialist, architecture-patterns | Finds bugs before production |
| test-runner | 451 | quality-gates | Runs tests, reports coverage |
| security-auditor | 456 | security-sentinel, code-review-standards | OWASP Top 10 audits |
| refactoring-agent | 392 | architecture-patterns, typescript-strict-guard, quality-gates | Improves code quality |
| architecture-advisor | 841 | architecture-patterns, nextjs-15-specialist, drizzle-orm-patterns | Architecture decisions |
| meta-orchestrator | 1,306 | architecture-patterns, quality-gates | Multi-project orchestration |
| codebase-archaeologist | 1,538 | architecture-patterns, semantic-code-hunter | Code discovery and analysis |
| voice-architect | 1,234 | voice-system-expert, nextjs-15-specialist | Voice feature planning |

**TOTAL:** 7,092 agent lines + 60,000+ skill lines = ~67,000 lines of AI-powered quality enforcement

### How It Works

**1. Progressive Disclosure:**
- Agents load skill metadata first (SKILL.md files)
- Only load detailed files when needed
- Prevents token budget exhaustion
- Faster agent startup

**2. Knowledge Reuse:**
- TypeScript standards defined ONCE in typescript-strict-guard skill
- Referenced by implementation, code-reviewer, refactoring-agent
- Update once, all agents benefit

**3. Separation of Concerns:**
- Agents = workflow and process
- Skills = detailed technical knowledge
- Agents stay small (<500 lines ideal)
- Skills can be comprehensive (6,000+ lines)

**4. Quality Validation:**
- Each skill includes a validator (Python script)
- quality-gates/validate.py aggregates all validators
- Pre-commit hook runs validation
- CI/CD enforces quality gates

### Skill Loading Example

**Agent prompt references skill:**
```markdown
## TypeScript Quality

→ **See:** typescript-strict-guard skill for complete standards

**Quick rules:**
- No `any` types
- No `@ts-ignore`
- Explicit types on all functions
```

**Claude Code automatically loads:**
1. `.claude/skills/typescript-strict-guard/SKILL.md` (metadata)
2. Supporting files as needed:
   - `strict-mode-violations.md`
   - `type-guards-library.md`
   - `error-handling-types.md`

### Benefits of This Architecture

**For Development:**
- Agents are easy to understand (small, focused)
- Skills are comprehensive (deep expertise)
- Updates are centralized (change skill, all agents benefit)

**For Quality:**
- 6-layer defense system prevents bugs
- Automated validation catches issues early
- Multi-agent review finds 90.2% more issues

**For Maintenance:**
- Add new skill = all agents can use it
- Update skill = all agents get improvements
- Remove skill = clear impact analysis

### Adding a New Skill

1. Create skill directory: `.claude/skills/my-skill/`
2. Create `SKILL.md` with metadata (name, description, when to use)
3. Add detailed knowledge files (patterns, examples, anti-patterns)
4. Create validator: `validate-my-skill.py`
5. Register in `quality-gates/validate.py`
6. Add to relevant agent `skills:` arrays

### Voice Architect Usage

**For complex feature planning, use voice-architect agent**:

The voice-architect agent helps create comprehensive SaaS specifications through multi-session conversations. It maintains memory across sessions and ensures nothing is missed.

**When to use:**
- Planning new features with complex requirements
- Documenting screen behaviors and interactions
- Creating comprehensive specifications that eliminate back-and-forth

**How it works:**
1. Voice Architect maintains session history in `.sentra/architect-sessions/<project>/`
2. Tracks 10 coverage areas: requirements, personas, database, API, UI, security, integrations, performance, deployment, testing
3. Prompts for missing areas and ensures 90%+ completeness before marking ready
4. Documents behavior (not just visuals) for every screen
5. Automatically generates E2E test specifications from screen discussions

**Session files created:**
```
.sentra/architect-sessions/<project>/
├── session-history.md          # Conversation log
├── decisions.yml               # Architectural decisions
├── coverage-checklist.yml      # What's discussed, what's missing
├── requirements.md             # Business requirements
├── database-schema.md          # Database design
├── api-spec.yaml               # API endpoints
├── ui-screens.md               # Screen behaviors + E2E specs
├── user-flows.md               # User journeys
├── security-model.md           # Security architecture
├── integrations.md             # Third-party services
└── progress.json               # Completion percentage
```

**Agent location:** `.claude/agents/voice-architect.md`

### E2E Test Generation Workflow

**Automatic E2E test generation from specifications (Phase 3.2):**

When voice-architect creates screen specifications with ≥90% confidence, E2E tests are automatically generated:

**Process:**
1. Voice Architect documents screen behaviors in YAML format
2. System validates spec using `src/schemas/e2e-spec.schema.ts`
3. Template matcher selects appropriate Playwright template
4. If no template matches, LLM generates custom test
5. Generated tests saved to `tests/e2e/<screen>-interactions.spec.ts`
6. Tests included in GitHub issue for implementation

**Template types available:**
- `crud-operations` - Create, read, update, delete flows
- `form-validation` - Input validation and error states
- `modal-workflow` - Modal open, interact, close sequences
- `navigation` - Route navigation and page transitions
- `loading-states` - Skeleton loaders and async states
- `visual-regression` - Color, position, visibility changes
- `llm` - Force LLM generation for complex scenarios

**Spec format example:**
```yaml
screen: "Dashboard"
description: "Mission control for project management"
route: "/dashboard"
e2e_tests:
  - name: "User toggles project mute button"
    description: "Verify mute state changes visually"
    steps:
      - "Navigate to /dashboard"
      - "Click mute button on first project card"
    assertions:
      - "Button changes to violet color"
      - "Mute icon appears"
    template_hint: "visual-regression"
    priority: "high"
```

**Metrics tracked:**
- Template vs LLM generation ratio
- Test generation success rate
- Test execution time
- Coverage per screen

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev:safe         # Start dev server with crash recovery
npm run build            # Production build
npm run start            # Start production server

# Testing
npm test                 # Run tests in watch mode
npm test -- --run        # Run tests once
npm test -- --coverage   # Run with coverage report

# Quality Checks
npm run type-check       # TypeScript compilation
npm run lint             # ESLint
npm run format           # Prettier formatting

# Database (Drizzle)
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Drizzle Studio (dev only)

# Deployment
# See docs/deployment/WEB-DEPLOYMENT.md
```

## Environment Variables

Required environment variables (create `.env` file in project root):

```bash
# Database (PostgreSQL - edge-compatible with Drizzle)
DATABASE_URL="postgresql://user:pass@localhost:5432/sentra"
# Vercel deployment: Uses @vercel/postgres automatically

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

*Last updated: 2025-11-24 by Glen Barnhardt with help from Claude Code*

---

## Edge-First Architecture

**ORM Decision:** Drizzle (not Prisma)

Sentra uses Drizzle ORM to enable Vercel Edge Runtime capabilities:
- **Vercel Edge Functions** - Ultra-low latency globally
- **Next.js 15 Server Actions** - Full support without limitations
- **Edge Runtime** - 0ms cold starts worldwide

Prisma 6.19.0 blocks Vercel Edge Runtime due to Node.js dependencies. Drizzle is edge-first and works everywhere.

**See:** `docs/decisions/ADR-002-DRIZZLE-ORM-MIGRATION.md` for complete rationale
