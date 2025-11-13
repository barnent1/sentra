# Sentra Documentation

**Complete guide to Sentra - AI Agent Control Center**

Last Updated: 2025-11-13

---

## Quick Navigation

### New User? Start Here

1. [Installation Guide](getting-started/installation.md) - Get Sentra running in 10 minutes
2. [Quick Start](getting-started/quick-start.md) - Your first voice conversation
3. [First Steps](getting-started/first-steps.md) - Using the Architect AI

### Developer? Go Here

1. [Development Setup](getting-started/development-setup.md) - Complete dev environment
2. [System Design](architecture/system-design.md) - Architecture overview
3. [Contributing Guide](../CONTRIBUTING.md) - Development standards

### Looking for Specific Features?

- [Voice Interface](features/voice-interface.md) - How voice conversations work
- [Spec Approval](features/spec-approval.md) - Versioning and approval workflow
- [Agent Automation](features/agent-automation.md) - GitHub Actions integration

---

## Documentation Structure

### Getting Started

Essential guides to get up and running:

| Document | Description | Time | Audience |
|----------|-------------|------|----------|
| [Installation](getting-started/installation.md) | Install dependencies and run Sentra | 10 min | Everyone |
| [Quick Start](getting-started/quick-start.md) | First voice conversation walkthrough | 5 min | New users |
| [Development Setup](getting-started/development-setup.md) | Complete dev environment (tests, tools) | 30 min | Developers |
| [First Steps](getting-started/first-steps.md) | Using Architect, reviewing specs | 10 min | New users |

### Architecture

Technical design and system internals:

| Document | Description | Status | Audience |
|----------|-------------|--------|----------|
| [System Design](architecture/system-design.md) | Complete architecture overview | ✅ New | Developers |
| [Security Architecture](architecture/SECURITY-ARCHITECTURE.md) | 3-phase security design | ✅ Complete | Security-focused |
| [Data Fetching](architecture/DATA-FETCHING.md) | Next.js App Router patterns | ✅ Complete | Frontend devs |

### Features

How each feature works:

| Document | Description | Status | Audience |
|----------|-------------|--------|----------|
| [Voice Interface](features/voice-interface.md) | Two voice implementations (HTTP + Realtime) | ✅ New | Everyone |
| [Spec Approval](features/spec-approval.md) | Versioning, approval, GitHub integration | ✅ New | Everyone |
| [Agent Automation](features/agent-automation.md) | GitHub Actions, Docker, quality hooks | ✅ New | Developers |
| [Native App](features/native-app.md) | Tauri desktop app features | ✅ New | Users |

### Roadmap

Future plans and vision:

| Document | Description | Status | Audience |
|----------|-------------|--------|----------|
| [Platform Support](roadmap/platform-support.md) | macOS → Linux → Windows | ✅ New | Everyone |
| [Web App Vision](roadmap/web-app.md) | Future web version with auth | ✅ New | Product planning |
| [Unfinished Features](roadmap/unfinished-features.md) | What's not done yet | ✅ New | Developers |
| [Observability](roadmap/observability.md) | Monitoring, logs, costs | ✅ New | Product planning |

---

## Reading Paths

### Path 1: New User (30 minutes)

Perfect if you just want to use Sentra:

1. [Installation Guide](getting-started/installation.md) ← Start here
2. [Quick Start](getting-started/quick-start.md) ← Try it out
3. [First Steps](getting-started/first-steps.md) ← Learn the basics
4. [Voice Interface](features/voice-interface.md) ← Understand how it works
5. [Spec Approval](features/spec-approval.md) ← Learn the workflow

### Path 2: Developer (1-2 hours)

Perfect if you're contributing code:

1. [Installation Guide](getting-started/installation.md) ← Get it running
2. [Development Setup](getting-started/development-setup.md) ← Set up tests/tools
3. [System Design](architecture/system-design.md) ← Understand architecture
4. [Contributing Guide](../CONTRIBUTING.md) ← Learn standards
5. [Agent Automation](features/agent-automation.md) ← See automation system

### Path 3: Security Reviewer (45 minutes)

Perfect if you're evaluating security:

1. [Security Architecture](architecture/SECURITY-ARCHITECTURE.md) ← Main security doc
2. [Agent Automation](features/agent-automation.md) ← See isolation approach
3. [System Design](architecture/system-design.md) ← Understand data flow
4. [Credential Proxy Plan](roadmap/unfinished-features.md#credential-proxy) ← Phase 2

### Path 4: Product Manager (30 minutes)

Perfect if you're planning features:

1. [Quick Start](getting-started/quick-start.md) ← Try the product
2. [System Design](architecture/system-design.md) ← Current architecture
3. [Platform Support](roadmap/platform-support.md) ← Platform plans
4. [Web App Vision](roadmap/web-app.md) ← Web version plans
5. [Unfinished Features](roadmap/unfinished-features.md) ← Known gaps

---

## Current Status Overview

### What's Working (✅)

**Core Features:**
- Voice conversations with AI architect
  - HTTP API implementation (3-5s latency)
  - Realtime API implementation (1-2s latency)
  - Auto-silence detection (VAD)
- Spec management
  - Automatic versioning (v1, v2, v3...)
  - Approval workflow
  - History and rollback
- GitHub Actions automation
  - Docker container isolation
  - AI agent worker (Python + Anthropic SDK)
  - Automatic PR creation
- Quality enforcement
  - 6-layer defense system (hooks + checks)
  - TypeScript strict mode
  - 75%+ test coverage requirement

**Platform:**
- macOS native app (Tauri 2.x)
- Next.js 15.5 frontend
- File-based storage (.sentra/ directory)
- WebSocket proxy for Realtime API

### What's In Progress (🚧)

- Dashboard improvements (mock data → real data)
- Agent worker refinements (SDK usage)
- E2E test coverage expansion

### What's Planned (📋)

**Near-term (1-2 months):**
- Menu bar integration
- Database layer (PostgreSQL + Prisma)
- Credential proxy service (security Phase 2)

**Mid-term (3-6 months):**
- Linux desktop app
- Windows desktop app
- Cloud sync between devices
- Web application version
- TOTP 2FA authentication

**Long-term (6-12 months):**
- gVisor security (Phase 3)
- Custom agent runners
- Team management
- Usage analytics
- Cost optimization

See [roadmap/](roadmap/) for detailed plans.

---

## Document Status Legend

- **✅ Complete** - Fully written and accurate
- **✅ New** - Just created/updated to match reality
- **🚧 In Progress** - Being written or updated
- **📋 Planned** - Not yet written
- **⚠️ Outdated** - Needs updating to match current code

---

## Key Concepts

### Architect AI

The "Architect" is the AI you talk to via voice. It:
- Listens to your feature requirements
- Asks clarifying questions
- Generates detailed technical specifications
- Hands off to automation agents for implementation

Think of it as a **product manager** that translates your ideas into technical specs.

### Specifications (Specs)

After each voice conversation, Architect creates a **specification document** containing:
- Feature description
- Technical requirements
- Acceptance criteria
- Implementation notes

Specs are:
- **Versioned** (v1, v2, v3...) - Edit and refine over time
- **Reviewable** - Approve before agent implementation
- **Traceable** - Linked to GitHub issues

### AI Agent Automation

Once you approve a spec, Sentra:
1. Creates GitHub issue with `ai-feature` label
2. Triggers GitHub Actions workflow
3. Spins up isolated Docker container
4. Runs AI agent (Claude via Anthropic SDK)
5. Agent implements features, writes tests
6. Creates pull request with changes
7. Posts progress updates

Think of it as **automated developer** that follows the Architect's specifications.

### Quality Hooks

Sentra enforces quality with **6 layers of defense**:

1. **PreToolUse Hook** - Blocks dangerous bash commands
2. **PostToolUse Hook** - Validates every file edit
3. **Stop Hook** - Comprehensive quality gate (unbypassable)
4. **TypeScript Strict** - No `any`, no `@ts-ignore`
5. **Test Coverage** - 75%+ required (90%+ for business logic)
6. **CI/CD** - Build, lint, test, security audit

These prevent bugs from being committed. See [Agent Automation](features/agent-automation.md).

---

## Technology Reference

### Frontend Stack

- **Tauri 2.x** - Native app framework (Rust + WebView)
- **Next.js 15.5** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.6** - Type-safe JavaScript (strict mode)
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Component library

### Backend Stack

- **Rust** - Tauri backend (IPC commands)
- **File System** - Local storage (.sentra/ directory)
- **WebSocket** - Realtime API proxy (port 9001)
- No database layer yet (planned Phase 2)

### AI Services

- **OpenAI Whisper** - Speech-to-text (STT)
- **OpenAI GPT-4o** - Language model
- **OpenAI TTS** - Text-to-speech
- **OpenAI Realtime API** - Low-latency voice (WebSocket)
- **Anthropic Claude** - Agent execution (via Python SDK)

### Automation Stack

- **GitHub Actions** - CI/CD and agent execution
- **Docker** - Container isolation
- **Python 3.8+** - Agent worker scripts
- **Anthropic SDK** - Claude API client
- **gh CLI** - GitHub integration

### Testing Stack

- **Vitest** - Unit and integration tests
- **Playwright** - End-to-end tests
- **Testing Library** - React component tests
- **Coverage: V8** - Code coverage reports

---

## Common Questions

### Why Tauri instead of Electron?

**Size:** 95% smaller (600KB vs 100MB+)
**Memory:** 50% less usage
**Security:** No Node.js in renderer
**Native:** True macOS integration

Trade-off: Smaller ecosystem, macOS-first development.

See [Why Tauri?](../README.md#why-tauri) in main README.

### Why two voice implementations?

**HTTP API** (Whisper + GPT-4 + TTS):
- Works everywhere (browser, native)
- Simple, reliable
- 3-5 second latency
- Better for testing

**Realtime API** (WebSocket streaming):
- Much faster (1-2 second latency)
- Better user experience
- More complex setup
- Requires proxy server

We offer both for flexibility. See [Voice Interface](features/voice-interface.md).

### Why file-based storage instead of database?

**Current:** File-based (.sentra/ directory)
- Simpler for Phase 1
- Easy to version control
- Transparent (you can see files)
- No server dependency

**Future:** PostgreSQL + Prisma (Phase 2)
- Cloud sync between devices
- Multi-user support
- Better querying
- Scalability

See [Unfinished Features](roadmap/unfinished-features.md).

### How secure is the agent automation?

**Current (Phase 1):** 60-70% risk reduction
- Docker isolation
- Read-only filesystem
- Resource limits
- Non-root user

**Phase 2 (planned):** Additional 30% reduction
- Credential proxy (CRITICAL)
- Prevents prompt injection attacks

**Phase 3 (Q1 2026):** Remaining 15%
- gVisor isolation
- Industry-leading security

See [Security Architecture](architecture/SECURITY-ARCHITECTURE.md).

---

## Getting Help

### Documentation Issues

Found a typo or inaccuracy? Please:
1. Open GitHub issue with label `documentation`
2. Include document path and section
3. Suggest correction if possible

### Feature Questions

Not sure how something works? Check:
1. This README (you are here)
2. [Features section](features/)
3. [System Design](architecture/system-design.md)
4. Open GitHub issue if still unclear

### Bug Reports

Found a bug? Please:
1. Check if already reported (GitHub issues)
2. Include steps to reproduce
3. Include environment (OS, version, logs)
4. Use `bug` label

### Feature Requests

Want a new feature? Please:
1. Check [Roadmap](roadmap/) to see if already planned
2. Open GitHub issue with `enhancement` label
3. Describe use case and value
4. Include mockups/examples if helpful

---

## Contributing to Docs

Want to improve documentation? We'd love help!

**What we need:**
- More examples and screenshots
- Video walkthroughs
- Tutorials for specific use cases
- Translation to other languages
- Fixing typos and clarifications

**How to contribute:**
1. Read [Contributing Guide](../CONTRIBUTING.md)
2. Fork repository
3. Make documentation changes
4. Submit pull request
5. Use `documentation` label

**Style Guide:**
- Use clear, concise language
- Include code examples where helpful
- Add diagrams for complex concepts
- Reference actual file paths
- Use proper markdown formatting
- Test all commands/code snippets

---

## Document History

**2025-11-13** - Complete documentation rewrite
- Rewrote all docs to match actual codebase
- Added getting-started, features, roadmap sections
- Created comprehensive documentation index
- Marked status of all features accurately

**Previous** - Initial documentation
- Mostly aspirational/planned features
- Did not reflect actual implementation
- Mixed completed and planned features

---

**Last Updated:** 2025-11-13
**Maintained by:** Glen Barnhardt with help from Claude Code
**Questions?** Open a GitHub issue or check the docs above.
