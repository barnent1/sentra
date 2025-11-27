# Quetrex Documentation

**Complete guide to Quetrex - Voice-First AI Control Center**

Last Updated: 2025-11-13 by Glen Barnhardt with help from Claude Code

---

## Table of Contents

- [Quick Navigation](#quick-navigation)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Features](#features)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [FAQ](#faq)

---

## Quick Navigation

### New to Quetrex? Start Here

1. **[Installation Guide](getting-started/installation.md)** - Get Quetrex running in 10 minutes
2. **[Main README](../README.md)** - Project overview, vision, and quick start
3. **[Feature Overview](#features)** - What Quetrex can do

### Developers? Go Here

1. **[Development Guide](../DEVELOPMENT.md)** - Setup and development workflow
2. **[Testing Guide](TESTING.md)** - TDD workflow, coverage, E2E tests
3. **[Contributing Guide](../CONTRIBUTING.md)** - Standards and best practices
4. **[Architecture Overview](#architecture)** - System design and patterns

### Deploying Quetrex?

1. **[Deployment Guide](DEPLOYMENT.md)** - Production setup and configuration
2. **[Security Architecture](architecture/SECURITY-ARCHITECTURE.md)** - 3-phase security model
3. **[Environment Variables](#environment-variables)** - Required configuration

---

## Getting Started

### Installation

| Guide | Description | Time | Audience |
|-------|-------------|------|----------|
| [Installation Guide](getting-started/installation.md) | Install dependencies and run Quetrex | 10 min | Everyone |

### Prerequisites

- **macOS 10.15+** (Catalina or later)
- **Node.js 18+** (LTS recommended)
- **Rust** (latest stable)
- **OpenAI API key** (for voice features)
- **Anthropic API key** (for AI agents)

### Quick Start (5 Minutes)

```bash
# 1. Clone repository
git clone https://github.com/barnent1/quetrex.git
cd quetrex

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local and add:
#   OPENAI_API_KEY=sk-...
#   ANTHROPIC_API_KEY=sk-ant-...

# 4. Start the app
npm run tauri:dev
```

**First time using Quetrex?** See [Installation Guide](getting-started/installation.md) for detailed instructions.

---

## Architecture

### System Design

| Document | Description | Status | Audience |
|----------|-------------|--------|----------|
| [System Design](architecture/system-design.md) | Complete architecture overview | ✅ Complete | Developers |
| [Security Architecture](architecture/SECURITY-ARCHITECTURE.md) | 3-phase security design | ✅ Complete | Security-focused |
| [Data Fetching](architecture/DATA-FETCHING.md) | Next.js App Router patterns | ✅ Complete | Frontend devs |
| [Spec Versioning](architecture/SPEC-VERSIONING-SYSTEM.md) | Specification management | ✅ Complete | Developers |
| [Agent Architecture](../.claude/docs/ARCHITECTURE-AGENT-WORKER.md) | Claude Code CLI approach | ✅ Complete | Developers |

### Technology Stack

**Frontend (Native App)**
- **Tauri 2.x** - Rust backend, native WebView (95% smaller than Electron)
- **Next.js 15.5** - React 19, App Router, Server Components
- **TypeScript 5.6** - Strict mode (no `any`, no `@ts-ignore`)
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Beautiful components

**Backend (Cloud Services - Planned)**
- **Node.js + Express** - API server
- **PostgreSQL** - Primary database
- **Prisma ORM** - Type-safe database access
- **Redis** - Caching and sessions

**AI/Voice**
- **OpenAI Whisper** - Speech-to-text
- **OpenAI GPT-4o** - Language model (Architect AI)
- **OpenAI TTS** - Text-to-speech
- **OpenAI Realtime API** - Low-latency voice (1-2s)
- **Claude Sonnet 4.5** - AI agent execution

**Automation**
- **GitHub Actions** - CI/CD and agent execution
- **Docker** - Container isolation (Phase 1 security)
- **Anthropic SDK** - Python agent worker
- **Claude Code CLI** - Agent execution engine

**Testing**
- **Vitest** - Unit and integration tests
- **Playwright** - End-to-end tests
- **Testing Library** - React component tests
- **Coverage: 75%+** overall, **90%+** for services/utils

### Project Structure

```
quetrex/
├── src/                      # Next.js frontend
│   ├── app/                  # App Router pages
│   ├── components/           # React components
│   ├── lib/                  # OpenAI integration, Tauri IPC
│   └── hooks/                # Custom React hooks
│
├── src-tauri/                # Rust backend
│   └── src/
│       ├── commands.rs       # Dashboard data (specs, projects)
│       ├── specs.rs          # Spec management (save, version)
│       ├── realtime_proxy.rs # WebSocket proxy for Realtime API
│       └── settings.rs       # Settings storage
│
├── .github/workflows/        # GitHub Actions
│   └── ai-agent.yml          # Agent automation workflow
│
├── .claude/                  # Claude Code configuration
│   ├── hooks/                # Quality enforcement (3 hooks)
│   │   ├── validate-bash.py  # PreToolUse (block dangerous commands)
│   │   ├── verify-changes.py # PostToolUse (validate edits)
│   │   └── quality-gate.sh   # Stop (unbypassable checks)
│   ├── scripts/
│   │   └── ai-agent-worker.py # Agent implementation worker
│   └── settings.json         # Agent configuration
│
├── .quetrex/                  # Project data
│   ├── specs/                # Versioned specifications
│   ├── memory/               # Project context
│   └── config.yml            # Automation settings
│
├── tests/                    # All test files
│   ├── unit/                 # Unit tests (90%+ for services)
│   ├── integration/          # Integration tests (75%+)
│   ├── e2e/                  # End-to-end tests (Playwright)
│   └── setup/                # Test configuration
│
└── docs/                     # Documentation
    ├── architecture/         # System design, security
    ├── features/             # Feature documentation
    ├── getting-started/      # Installation, setup
    ├── roadmap/              # Future plans
    ├── TESTING.md            # Testing guide
    └── DEPLOYMENT.md         # Production deployment
```

---

## Features

### What's Working Today (✅)

| Feature | Description | Documentation |
|---------|-------------|---------------|
| **Voice Conversations** | Two implementations (HTTP + Realtime API) | [Voice Interface](features/voice-interface.md) |
| **Spec Management** | Versioning, approval, rollback | [Spec Approval](features/pr-approval.md) |
| **GitHub Automation** | Docker isolation, auto PR creation | [AI Agent Automation](AI-AGENT-AUTOMATION-STATUS.md) |
| **Quality Enforcement** | 6-layer defense system | [Contributing](../CONTRIBUTING.md) |
| **Native macOS App** | Tauri 2.x desktop app | [Main README](../README.md) |

### Feature Documentation

| Document | Description | Status | Audience |
|----------|-------------|--------|----------|
| [Voice Interface](features/voice-interface.md) | HTTP and Realtime API implementations | ✅ Complete | Everyone |
| [Spec Approval](features/pr-approval.md) | Versioning and approval workflow | ✅ Complete | Everyone |
| [Dashboard](features/dashboard.md) | Mission control interface | 🚧 In Progress | Everyone |
| [Project Creation](features/project-creation.md) | Creating new projects | ✅ Complete | Users |
| [Menu Bar Integration](features/MENUBAR-INTEGRATION.md) | macOS menu bar app | 📋 Planned | macOS users |

### Core Capabilities

#### 1. Voice-First Interface

Talk to Quetrex's Architect AI using natural language:
- **HTTP API** (3-5s latency) - Simple, reliable, works everywhere
- **Realtime API** (1-2s latency) - Fast, streaming, better UX
- **Auto-silence detection** - No need to press stop
- **Context-aware** - Architect knows your codebase

See [Voice Interface](features/voice-interface.md) for details.

#### 2. Specification Management

Every conversation creates a versioned specification:
- **Automatic versioning** (v1, v2, v3...)
- **Approval workflow** - Review before implementation
- **History tracking** - See all versions
- **Rollback support** - Revert to previous versions
- **GitHub integration** - Creates issues automatically

See [Spec Approval](features/pr-approval.md) for details.

#### 3. AI Agent Automation

Approved specs trigger automated implementation:
- **GitHub Actions** - Runs in isolated containers
- **Docker isolation** - Phase 1 security (60-70% risk reduction)
- **Auto PR creation** - Code review ready
- **Progress tracking** - Real-time updates
- **Cost tracking** - Know exactly what each feature costs

See [AI Agent Automation](AI-AGENT-AUTOMATION-STATUS.md) for details.

#### 4. Quality Enforcement

6-layer defense system prevents bugs from being committed:
1. **PreToolUse Hook** - Blocks dangerous commands
2. **PostToolUse Hook** - Validates every file edit
3. **Stop Hook** - Unbypassable quality gate
4. **TypeScript Strict** - No `any`, no `@ts-ignore`
5. **Test Coverage** - 75%+ overall, 90%+ services
6. **CI/CD** - Build, lint, test, security audit

See [Contributing](../CONTRIBUTING.md) for standards.

---

## Development

### Setup

See [Development Guide](../DEVELOPMENT.md) for complete setup instructions.

### Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run tauri:dev        # Start Tauri app in dev mode

# Testing
npm test                 # Run tests in watch mode
npm test:run             # Run tests once
npm test:coverage        # Run with coverage report
npm test:e2e             # Run E2E tests (Playwright)

# Quality Checks
npm run type-check       # TypeScript compilation
npm run lint             # ESLint
npm run format           # Prettier formatting
npm run build            # Production build

# Tauri
npm run tauri:build      # Build native app for distribution
```

### Development Standards

**TypeScript Strict Mode (MANDATORY)**
- No `any` type
- No `@ts-ignore`
- All functions must have return types
- All parameters must have types

**Test-Driven Development (TDD)**
1. Write tests FIRST
2. Verify tests FAIL
3. Write implementation
4. Verify tests PASS
5. Refactor as needed

**Coverage Requirements**
- Overall: 75%+
- Business Logic (services): 90%+
- Utilities: 90%+
- UI Components: 60%+

See [Contributing Guide](../CONTRIBUTING.md) for complete standards.

---

## Testing

### Overview

Quetrex uses **Vitest** for unit/integration tests and **Playwright** for E2E tests.

### Quick Start

```bash
# Unit & Integration Tests
npm test                 # Watch mode
npm test:run             # Run once
npm test:coverage        # With coverage

# E2E Tests
npm test:e2e             # Run all E2E tests
npm test:e2e:ui          # With UI mode
```

### Coverage Requirements (Enforced by CI/CD)

- **Overall**: 75%+
- **Business Logic** (`src/services/`, `src/lib/`): 90%+
- **Utilities** (`src/utils/`): 90%+
- **UI Components**: 60%+

### E2E Tests Required For

- **Critical user journeys** (signup, checkout, payment)
- **ALL visual state changes** (color, visibility, position, animation)
- **Multi-step interactions** (click → modal → action → result)
- **User-facing state transitions** (loading → success, enabled → disabled)

### Detailed Guide

See [TESTING.md](TESTING.md) for comprehensive testing documentation.

---

## Deployment

### Quick Deployment

```bash
# Build production app
npm run tauri:build

# Output: src-tauri/target/release/bundle/
# - macOS: .dmg installer
# - Linux: .AppImage, .deb (Phase 2)
# - Windows: .msi installer (Phase 2)
```

### Production Checklist

- [ ] Set environment variables
- [ ] Configure GitHub Actions secrets
- [ ] Set up credential proxy (Phase 2)
- [ ] Enable gVisor security (Phase 3)
- [ ] Configure database (Phase 2)
- [ ] Set up Redis cache (Phase 2)

### Detailed Guide

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment documentation.

---

## Environment Variables

### Required

```bash
# OpenAI (Voice Features)
OPENAI_API_KEY=sk-...              # Required for voice conversations

# Anthropic (AI Agents)
ANTHROPIC_API_KEY=sk-ant-...       # Required for agent automation

# GitHub (Automation)
GITHUB_TOKEN=ghp_...               # Required for PR creation
```

### Optional

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database (Phase 2)
DATABASE_URL=postgresql://...

# Redis (Phase 2)
REDIS_URL=redis://localhost:6379

# Monitoring (Future)
SENTRY_DSN=https://...
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete configuration guide.

---

## Roadmap

### Current Status (Phase 1)

**What's Working:**
- Voice conversations (HTTP + Realtime)
- Spec management and versioning
- GitHub Actions automation
- Docker container isolation
- Native macOS app

**What's In Progress:**
- Dashboard improvements (mock → real data)
- Agent worker refinements
- E2E test coverage expansion

### Near-Term (Weeks 2-4)

**Phase 2: Security Enhancement**
- Credential proxy service (CRITICAL)
- Prevents prompt injection credential theft
- Unix socket-based validation
- Full audit trail

See [Security Architecture](architecture/SECURITY-ARCHITECTURE.md).

### Mid-Term (Months 3-6)

**Platform Expansion**
- Linux desktop app
- Windows desktop app
- Database layer (PostgreSQL + Prisma)
- Cloud sync between devices
- Web application version
- TOTP 2FA authentication

See [Roadmap](roadmap/).

### Long-Term (Months 6-12)

**Enterprise Features**
- gVisor security (Phase 3)
- Custom agent runners
- Team management
- Usage analytics
- Cost optimization
- SSO integration

See [Roadmap](roadmap/).

---

## Contributing

We welcome contributions! Here's how to get started:

1. **Read Standards**
   - [Contributing Guide](../CONTRIBUTING.md) - Development standards
   - [Testing Guide](TESTING.md) - TDD workflow
   - [Main README](../README.md) - Project overview

2. **Find Work**
   - Check [GitHub Issues](https://github.com/barnent1/quetrex/issues)
   - Look for `good first issue` label
   - Review [Roadmap](roadmap/) for planned features

3. **Set Up Environment**
   ```bash
   git clone https://github.com/yourusername/quetrex.git
   cd quetrex
   npm install
   npm run tauri:dev
   ```

4. **Follow Workflow**
   - Create feature branch
   - Write tests FIRST (TDD)
   - Implement feature
   - Ensure all checks pass
   - Submit pull request

### Areas Needing Help

- **Dashboard redesign** - React components, true dark theme
- **Linux/Windows testing** - Cross-platform support
- **E2E test coverage** - More Playwright tests
- **Documentation** - Tutorials, examples, translations
- **Agent worker** - SDK improvements

See [Contributing Guide](../CONTRIBUTING.md) for complete guidelines.

---

## FAQ

### General

**Q: What is Quetrex?**
A: Quetrex is a voice-first AI control center that lets you talk to your codebase and watch AI agents implement features while you review in-app.

**Q: Why "voice-first"?**
A: Talking is faster than typing. Quetrex makes AI coding feel like having a conversation with a senior developer.

**Q: How is this different from ChatGPT/Claude?**
A: Quetrex integrates directly with your codebase, creates GitHub issues, runs agents in isolation, and handles the entire implementation workflow - all without leaving the app.

### Technical

**Q: Why Tauri instead of Electron?**
A: 95% smaller (600KB vs 100MB+), 50% less memory, better security, native OS integration.

**Q: Why file-based storage instead of database?**
A: Simpler for Phase 1, easy to version control, transparent, no server dependency. Database coming in Phase 2.

**Q: How secure is the agent automation?**
A: Phase 1 (current): 60-70% risk reduction via Docker. Phase 2 (weeks 2-4): Additional 30% via credential proxy. Phase 3 (Q1 2026): Remaining 15% via gVisor.

**Q: Can I use this in production?**
A: Quetrex itself is early-stage (use at your own risk). But the code Quetrex generates? Absolutely - just review it carefully like any PR.

### Support

**Q: Where do I get help?**
A: Check [docs/](.), search [GitHub Issues](https://github.com/barnent1/quetrex/issues), or open a new issue.

**Q: How do I report bugs?**
A: Open GitHub issue with `bug` label. Include steps to reproduce, environment details, and logs.

**Q: How do I request features?**
A: Check [Roadmap](roadmap/) first, then open GitHub issue with `enhancement` label.

---

## Additional Resources

### External Documentation

- **[Tauri Documentation](https://tauri.app/v2/guides/)** - Native app framework
- **[Next.js Documentation](https://nextjs.org/docs)** - React framework
- **[OpenAI API](https://platform.openai.com/docs)** - Voice and language models
- **[Anthropic API](https://docs.anthropic.com/)** - Claude AI
- **[Vitest](https://vitest.dev/)** - Testing framework
- **[Playwright](https://playwright.dev/)** - E2E testing

### Community

- **[GitHub Repository](https://github.com/barnent1/quetrex)** - Source code
- **[GitHub Issues](https://github.com/barnent1/quetrex/issues)** - Bugs and features
- **[GitHub Discussions](https://github.com/barnent1/quetrex/discussions)** - Q&A and ideas

---

## Document History

**2025-11-13** - Complete documentation consolidation
- Created comprehensive documentation hub
- Restructured all documentation sections
- Added testing and deployment guides
- Improved navigation and discoverability
- Fixed broken links and outdated information

---

**Questions?** Check the documentation above or open a [GitHub Issue](https://github.com/barnent1/quetrex/issues).

**Want to contribute?** Read [CONTRIBUTING.md](../CONTRIBUTING.md) and start building!

---

*Last Updated: 2025-11-13*
*Maintained by: Glen Barnhardt with help from Claude Code*
