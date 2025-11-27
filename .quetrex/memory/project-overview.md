# Quetrex Project Overview

**Mission:** AI Agent Control Center - Mission Control for Your AI Agents

## What is Quetrex?

Quetrex is a cross-platform application (Mac, Windows, Linux, Web) that provides a visual interface for monitoring, controlling, and optimizing AI agents across all your projects.

**Key Features:**
- 🎤 Voice-driven spec creation (OpenAI Realtime API)
- 📝 Automatic spec generation (Claude AI)
- ✅ Spec approval workflow
- 🤖 Automated agent spawning
- 📊 Real-time monitoring and analytics
- 💰 Cost tracking and controls
- 🔒 Security-first architecture

## Architecture

**Hybrid Deployment:**
- **Native Apps:** Tauri + Next.js (Mac, Windows, Linux)
- **Cloud Web App:** Next.js + Node.js API + PostgreSQL
- **Shared Codebase:** Same frontend works in both modes

## Tech Stack

**Frontend:**
- Next.js 15.x (App Router)
- Tailwind CSS + shadcn/ui
- TypeScript
- Zustand (state management)

**Native Backend:**
- Tauri 2.x (Rust)
- Direct file system access

**Cloud Backend:**
- Node.js + Express
- PostgreSQL + Prisma ORM
- Redis for caching
- GitHub App integration

**External Services:**
- OpenAI Realtime API (voice)
- Anthropic Claude API (spec generation + agents)
- GitHub API (repos, issues, PRs)

## Current Status

**Phase 1:** Native App Core (In Progress - 50%)
- ✅ Voice conversation with echo prevention
- ✅ Spec generation via Claude
- ✅ Backend spec storage commands
- ⏳ SpecViewer component
- ⏳ Project card integration
- ⏳ GitHub issue creation

## Documentation

All documentation lives in the parent project:
- `docs/architecture/quetrex-cloud-architecture.md` - Complete system design
- `docs/QUETREX-IMPLEMENTATION-PLAN.md` - Task breakdown (20+ tasks)
- `docs/adr/0001-hybrid-deployment-model.md` - Architecture decisions
- `docs/SETUP-COMPLETE.md` - Getting started guide

## Building Quetrex

**Meta Strategy:** Use the claude-code-base automation system to build Quetrex!

1. Create GitHub issues from implementation plan
2. Add `ai-feature` label
3. GitHub Actions triggers agent workers
4. Agents implement features
5. Review PRs and merge
6. Repeat!

**Goal:** Quetrex builds itself using the Phase I automation system!
