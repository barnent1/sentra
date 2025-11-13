# Sentra

**Stop context switching. Start building.**

A voice-first AI control center that lets you talk to your codebase and watch AI agents implement features while you review in-app.

Created by Glen Barnhardt with the help of Claude Code

[![macOS](https://img.shields.io/badge/macOS-10.15+-blue.svg)](https://www.apple.com/macos)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-orange.svg)](https://tauri.app/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## The Problem

**You're building a feature. Here's what your workflow looks like:**

1. Open ChatGPT/Claude → describe what you want
2. Copy code → paste into VS Code
3. Realize it doesn't quite fit your architecture
4. Back to AI chat → explain your codebase structure
5. Copy more code → paste again
6. Switch to terminal → `npm test`
7. Tests fail → back to AI chat with error logs
8. Finally works → manually create GitHub issue
9. Write detailed spec (again, you just told the AI)
10. Assign to yourself
11. Open new terminal → `git checkout -b feature/...`
12. Make changes → commit → push
13. Open GitHub in browser → create PR
14. Wait for CI/CD
15. Review in GitHub UI (small viewport, no IDE context)
16. Repeat for next feature...

**30 minutes of context switching for what should be a 2-minute conversation.**

Sound familiar?

---

## The Solution

**With Sentra, you just talk:**

> "Add user authentication with email and password, magic link fallback, and session management"

**Sentra does the rest:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🎤 Architect AI (listening...)                              │
│                                                              │
│  "I'll create a spec for email/magic link authentication    │
│   with session management using NextAuth.js..."             │
│                                                              │
│  ✓ Database schema (User, Session, VerificationToken)       │
│  ✓ API routes (/api/auth/[...nextauth])                    │
│  ✓ Email provider integration                               │
│  ✓ Session middleware                                       │
│  ✓ Protected route HOC                                      │
│  ✓ Unit tests (90%+ coverage)                              │
│                                                              │
│  [Approve Spec] [Revise] [Cancel]                          │
└─────────────────────────────────────────────────────────────┘

  ↓ You click "Approve"

┌─────────────────────────────────────────────────────────────┐
│ 🤖 Agent: auth-feature-20251113 (running...)                │
│                                                              │
│  ✓ Created GitHub issue #42                                 │
│  ✓ Created branch: feature/email-magic-link-auth            │
│  ✓ Installed dependencies: next-auth, nodemailer           │
│  ✓ Created database schema (3 models)                      │
│  ✓ Generated API routes (5 endpoints)                      │
│  ✓ Added session middleware                                 │
│  ⟳ Running tests... (14/18 passing)                        │
└─────────────────────────────────────────────────────────────┘

  ↓ 8 minutes later

┌─────────────────────────────────────────────────────────────┐
│ ✅ Pull Request #43 Ready for Review                        │
│                                                              │
│  📝 feat: add email/magic link authentication               │
│  🔍 18 files changed (+847, -12)                           │
│  ✓ All tests passing (94% coverage)                        │
│  ✓ TypeScript checks passed                                │
│  ✓ Linting passed                                          │
│  ✓ Build successful                                         │
│                                                              │
│  [Review Changes] [Approve & Merge] [Request Changes]      │
└─────────────────────────────────────────────────────────────┘
```

**Result: 30 seconds of talking. 8 minutes of implementation. Zero context switching.**

You stay in Sentra. No browser tabs. No terminal windows. No copying code.

---

## What Makes Sentra Different

### 1. Voice-First, Always

Most AI coding tools make you type. Sentra makes you talk.

- **Natural conversation** with AI architect about what you want to build
- **2 implementations**: HTTP API (works everywhere) + Realtime API (1-2s latency)
- **Smart context**: Sentra knows your codebase, your patterns, your standards
- **Versioned specs**: See exactly what will be built before approving

### 2. Mission Control for Multiple Projects

Stop juggling terminal windows and GitHub tabs. See everything at once.

```
┌────────────────────────────────────────────────────────────────────────┐
│  📊 Sentra Dashboard                                    🔔 3   ⚙️      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🟢 sentra-frontend               🟡 auth-service                      │
│  ├─ feat: PR review UI            ├─ fix: token refresh               │
│  ├─ ▓▓▓▓▓▓▓▓▓░░░░░ 67%          ├─ ▓▓░░░░░░░░░░░ 18%               │
│  └─ Agent: Building...  $1.23     └─ Waiting for approval  $0        │
│                                                                         │
│  ⚪ analytics-dashboard           🟢 api-gateway                       │
│  ├─ Idle                          ├─ feat: rate limiting               │
│  ├─ ░░░░░░░░░░░░░ 0%             ├─ ▓▓▓▓▓▓▓▓▓▓▓▓ 100%               │
│  └─ Ready  $0                     └─ PR ready for review  $2.45       │
│                                                                         │
│  [+ New Project]                                                       │
│                                                                         │
├────────────────────────────────────────────────────────────────────────┤
│  Recent Activity                                                       │
│  • auth-service: Tests passing (94% coverage)            2 mins ago   │
│  • api-gateway: Pull request #67 created                 8 mins ago   │
│  • sentra-frontend: Agent started implementation         12 mins ago  │
└────────────────────────────────────────────────────────────────────────┘
```

*Note: Dashboard redesign in progress - current version shows mock data*

### 3. In-App PR Review (No GitHub Tab Needed)

Review, approve, and merge pull requests without leaving Sentra.

- **Inline diff viewer** with syntax highlighting
- **File tree navigation** to jump between changes
- **Full Git visibility** - see every commit, every change
- **One-click approval** when everything looks good
- **Cost tracking** - know exactly what each feature cost to build

### 4. Automation That Actually Works

Most CI/CD breaks when you need it most. Sentra's automation is bulletproof.

**6-Layer Defense System:**
1. **PreToolUse Hook** - Blocks dangerous commands before execution (`git commit --no-verify` → BLOCKED)
2. **PostToolUse Hook** - Validates every file change (TypeScript errors, hardcoded secrets, `any` types)
3. **Stop Hook** - Unbypassable quality gate (tests, coverage, linting, build, security audit)
4. **TypeScript Strict Mode** - No escape hatches, no `any`, no `@ts-ignore`
5. **Test Coverage** - 75%+ required (90%+ for business logic)
6. **CI/CD** - GitHub Actions enforces everything again

**Result:** The 9-month bug that hides in a commit you forgot to test? **Impossible.**

### 5. Enterprise-Grade Security

Running AI agents that execute code is risky. We take security seriously.

**3-Phase Security Model:**

**Phase 1: Docker Isolation (Implemented)**
- AI agents run in isolated containers on GitHub Actions
- Read-only filesystem + ephemeral storage
- Non-root execution with dropped capabilities
- Resource limits: 2GB RAM, 2 CPU cores, 45-minute timeout
- Risk reduction: 60-70%

**Phase 2: Credential Proxy (Weeks 2-4)**
- Credentials never exposed to agent environment
- Unix socket-based validation
- Full audit trail of all API calls
- Prevents prompt injection credential theft
- Risk reduction: Additional 30% (CRITICAL)

**Phase 3: gVisor Runtime (Q1 2026)**
- User-space kernel isolation
- Industry-leading security (Claude Code for Web level)
- Custom infrastructure with Google's gVisor
- Risk reduction: Final 15%

See [Security Architecture](docs/architecture/SECURITY-ARCHITECTURE.md) for complete design.

---

## Current Status: Early But Working

Let's be honest about what's done and what's coming.

### ✅ What's Working Today

**Voice Conversations**
- Two implementations (HTTP + Realtime API)
- Natural language spec generation
- Project context awareness
- Conversation history

**Spec Management**
- Automatic versioning (v1, v2, v3...)
- Approval workflow
- Markdown formatting with syntax highlighting
- Rollback support

**GitHub Actions Automation**
- Triggered by `ai-feature` label on issues
- Docker container isolation (Phase 1 security)
- Automatic PR creation
- Progress updates via issue comments
- 45-minute timeout protection

**Quality Enforcement**
- All 6 defense layers operational
- PreToolUse hook blocks dangerous operations
- PostToolUse hook validates every change
- Stop hook prevents finishing with failures
- Git bypass is impossible

**Native macOS App**
- Tauri 2.x (95% smaller than Electron)
- Next.js 15 + React 19
- TypeScript strict mode
- Fast, native, beautiful

### 🚧 What's In Progress

**Dashboard Redesign** (Weeks 1-2)
- Multi-project card grid (currently single project focus)
- True dark theme with violet accents
- Real data instead of mocks
- Drill-down detail panels

**Agent Worker SDK** (This Week)
- Replacing non-existent CLI with Anthropic Python SDK
- Multi-turn conversation implementation
- Proper token tracking
- Better error recovery

### 📋 What's Planned

**Phase 2: Cross-Platform** (Months 3-4)
- Linux desktop support
- Windows desktop support
- Database layer (PostgreSQL + Prisma)
- Cloud sync between devices
- Credential proxy service (Security Phase 2)

**Phase 3: Web Application** (Months 5-6)
- Browser-based version (Vercel/Railway)
- TOTP 2FA authentication
- OAuth (GitHub, Google)
- Multi-user teams
- Real-time collaboration

**Phase 4: Enterprise** (Months 7-12)
- gVisor security (Phase 3)
- Custom agent runners
- Advanced analytics
- Cost optimization
- Team management

See [Roadmap](docs/roadmap/) for detailed plans.

---

## Quick Start

### Prerequisites

- macOS 10.15+ (Catalina or later)
- Node.js 18+
- OpenAI API key
- Anthropic API key (for automation)

### Installation (5 Minutes)

```bash
# 1. Clone repository
git clone https://github.com/barnent1/sentra.git
cd sentra

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

### First Conversation

1. Click **"Chat with Architect"** in the dashboard
2. Click the microphone button
3. Describe what you want to build:
   > "Add a contact form with name, email, message fields. Validate email format. Store submissions in a database table. Send notification email to admin."
4. Architect AI will ask clarifying questions
5. Review the generated specification
6. Click **"Approve"** to create GitHub issue and start automation

That's it. The agent takes over from there.

---

## Technology Stack

**Frontend (Native App)**
- [Tauri 2.x](https://tauri.app/) - Rust backend, native WebView
- [Next.js 15.5](https://nextjs.org/) - React 19, App Router, Server Components
- [TypeScript 5.6](https://www.typescriptlang.org/) - Strict mode (no `any`, no `@ts-ignore`)
- [TailwindCSS](https://tailwindcss.com/) - Utility-first styling
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful components

**AI Services**
- [OpenAI Whisper](https://openai.com/research/whisper) - Speech-to-text
- [OpenAI GPT-4o](https://openai.com/gpt-4) - Language model
- [OpenAI TTS](https://platform.openai.com/docs/guides/text-to-speech) - Text-to-speech
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) - Low-latency voice
- [Claude Sonnet 4.5](https://www.anthropic.com/claude) - Agent implementation

**Automation**
- [GitHub Actions](https://github.com/features/actions) - Agent execution
- [Docker](https://www.docker.com/) - Container isolation
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-python) - Python agent worker

**Testing**
- [Vitest](https://vitest.dev/) - Unit tests (75%+ coverage)
- [Playwright](https://playwright.dev/) - E2E tests
- [TypeScript](https://www.typescriptlang.org/) - Type safety

---

## Project Structure

```
sentra/
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
├── .sentra/                  # Project data
│   ├── specs/                # Versioned specifications
│   ├── memory/               # Project context
│   └── config.yml            # Automation settings
│
└── docs/                     # Documentation
    ├── architecture/         # System design, security
    ├── features/             # Feature documentation
    └── roadmap/              # Future plans
```

---

## Why Tauri?

**vs Electron:**
- **95% smaller bundle** (~600KB vs 100MB+)
- **50% less memory usage**
- **Better security** (no Node.js in renderer)
- **Native OS integration** (menu bar, notifications)
- **Rust performance** + safety

**Trade-offs:**
- macOS-first development (Linux/Windows coming in Phase 2)
- Smaller ecosystem than Electron
- Rust learning curve for contributors

We prioritize **native experience** and **low resource usage** over broad platform support initially.

---

## Development

### Commands

```bash
# Development
npm run dev              # Start Next.js dev server (web preview)
npm run tauri:dev        # Start Tauri app (native)

# Testing
npm test                 # Run tests in watch mode
npm test:run             # Run tests once
npm test:coverage        # Run with coverage report
npm test:e2e             # Run E2E tests (Playwright)

# Quality Checks
npm run type-check       # TypeScript compilation (strict mode)
npm run lint             # ESLint (0 errors, 0 warnings required)
npm run format           # Prettier formatting
npm run build            # Production build

# Tauri
npm run tauri:build      # Build native app for distribution
```

### Development Standards

**TypeScript Strict Mode (Mandatory)**
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
```

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

**Code Quality**
- ESLint: 0 errors, 0 warnings
- Prettier: Enforced by pre-commit hooks
- No console.log in production code
- Input validation mandatory
- No secrets in code (environment variables only)

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete guidelines.

---

## Documentation

**Getting Started**
- [Installation Guide](docs/getting-started/installation.md)
- [Quick Start (5 minutes)](docs/getting-started/quick-start.md)
- [Development Setup](docs/getting-started/development-setup.md)

**Architecture**
- [System Design](docs/architecture/system-design.md)
- [Security Architecture](docs/architecture/SECURITY-ARCHITECTURE.md)
- [Data Fetching Patterns](docs/architecture/DATA-FETCHING.md)

**Features**
- [Voice Interface](docs/features/voice-interface.md)
- [Spec Approval Workflow](docs/features/spec-approval.md)
- [Agent Automation](docs/features/agent-automation.md)
- [Dashboard](docs/features/dashboard.md)

**Roadmap**
- [Unfinished Features](docs/roadmap/unfinished-features.md) - What's not done yet
- [Dashboard Redesign](docs/roadmap/dashboard-redesign.md) - Mission control vision
- [Platform Support](docs/roadmap/platform-support.md) - Linux/Windows plans

Full documentation: [docs/README.md](docs/README.md)

---

## Real-World Example

**Scenario:** You need to add a real-time notification system to your app.

**Traditional Workflow:**
1. Research WebSocket vs Server-Sent Events (30 minutes)
2. Open ChatGPT, describe requirements (10 minutes)
3. Copy/paste code, realize you need Redis (20 minutes)
4. Install Redis, configure Docker Compose (30 minutes)
5. Write tests (45 minutes)
6. Debug failing tests (60 minutes)
7. Create PR manually (15 minutes)
8. Wait for review...

**Total: 3+ hours of active work**

**Sentra Workflow:**

```
You: "Add real-time notifications using WebSockets. Store in
     Redis for multi-server support. Show toast notifications
     in UI. Support notification preferences per user."

Architect: "I'll design a WebSocket notification system with
           Redis pub/sub. Here's the spec..."

[8 minutes later]

Agent: "✓ Pull request #87 created
        - Added WebSocket server (Socket.io)
        - Redis pub/sub integration
        - Notification preferences model
        - Toast component with animations
        - 23 tests added (96% coverage)
        - All checks passing"

You: [Reviews in-app] "Looks good!"
     [Clicks Approve & Merge]

Done.
```

**Total: 30 seconds of talking + 8 minutes of implementation + 2 minutes of review = 10 minutes**

This is the future of development.

---

## Contributing

We welcome contributions! This is an early-stage project with lots of opportunities to make an impact.

**How to Contribute:**
1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Check [Issues](https://github.com/barnent1/sentra/issues) for `good first issue` label
3. Fork the repo and create a feature branch
4. Write tests FIRST (TDD approach)
5. Ensure all quality checks pass
6. Submit PR with clear description

**Key Points:**
- TypeScript strict mode (no `any`, no `@ts-ignore`)
- 75%+ test coverage required (enforced by CI/CD)
- Quality hooks prevent bypassing checks
- Write tests before implementation
- Run `npm run type-check && npm test && npm run lint` before committing

**Areas Needing Help:**
- Dashboard redesign (React components)
- Linux/Windows testing
- E2E test coverage
- Documentation improvements
- Agent worker SDK implementation

---

## Vision

**We're building the operating system for AI-powered development.**

Today, Sentra is a macOS app that helps you build features faster with voice and automation.

Tomorrow, Sentra will be:
- **Cross-platform** (macOS, Linux, Windows, Web)
- **Multi-user** (teams, real-time collaboration)
- **Fully voice-controlled** (never touch keyboard)
- **Hyper-personalized** (learns your patterns, your style)
- **Cost-optimized** (AI model selection, caching, smart retries)
- **Enterprise-ready** (SSO, audit logs, compliance)

**The goal:** Make building software as easy as having a conversation.

---

## FAQ

**Q: Does this replace developers?**
A: No. Sentra makes developers more productive. You still make all the decisions - what to build, how to architect it, whether the implementation is correct. Sentra just handles the tedious parts (writing boilerplate, running tests, creating PRs).

**Q: What if the AI makes mistakes?**
A: That's why we have the 6-layer defense system and in-app PR review. Every change goes through TypeScript checks, linting, tests, and human review. Nothing gets merged without your approval.

**Q: How much does it cost to run?**
A: Depends on usage. Typical costs:
- Voice conversations: ~$0.01-0.05 per conversation (OpenAI)
- Agent implementation: ~$0.50-3.00 per feature (Anthropic)
- GitHub Actions: Free tier covers ~2000 minutes/month
- Estimate: ~$10-30/month for active solo developer

**Q: Is my code secure?**
A: Yes. See [Security Architecture](docs/architecture/SECURITY-ARCHITECTURE.md). Phase 1 (Docker isolation) is implemented. Phase 2 (credential proxy) is in progress. Phase 3 (gVisor) planned for Q1 2026.

**Q: Can I use this in production?**
A: Sentra itself is early-stage (use at your own risk). But the code Sentra generates? Absolutely - just review it carefully like you would any PR.

**Q: Linux/Windows support?**
A: Planned for Phase 2 (Months 3-4). Tauri supports all platforms, we just need to test and package for each one.

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

## Credits

**Created by:** [Glen Barnhardt](https://github.com/barnent1) with the help of [Claude Code](https://claude.com/claude-code)

**Powered by:**
- [Tauri](https://tauri.app/) - Native app framework
- [Next.js](https://nextjs.org/) - React framework
- [OpenAI](https://openai.com/) - Voice and language models
- [Anthropic](https://anthropic.com/) - Claude AI for agent execution
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components

**Special Thanks:**
- The Tauri team for building an amazing framework
- Anthropic for Claude and the vision of helpful, honest, and harmless AI
- OpenAI for pushing the boundaries of what's possible with voice
- The open-source community for inspiration and building blocks

---

## Get Started

```bash
git clone https://github.com/barnent1/sentra.git
cd sentra
npm install
npm run tauri:dev
```

**Questions?** Open a [GitHub Issue](https://github.com/barnent1/sentra/issues)

**Want to contribute?** Read [CONTRIBUTING.md](CONTRIBUTING.md)

**Follow progress:** Star this repo and watch for updates

---

**Stop context switching. Start building.**

Talk to your codebase. Watch AI implement features. Review in-app. Merge with one click.

**[Download for macOS](#quick-start)** | **[Read the Docs](docs/)** | **[View Roadmap](docs/roadmap/)**
