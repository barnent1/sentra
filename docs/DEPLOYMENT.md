# Quetrex Deployment Guide

**Production deployment guide for Quetrex**

Last Updated: 2025-11-13 by Glen Barnhardt with help from Claude Code

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Building for Production](#building-for-production)
- [GitHub Actions Setup](#github-actions-setup)
- [Security Configuration](#security-configuration)
- [Database Setup (Phase 2)](#database-setup-phase-2)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

---

## Overview

Quetrex is currently a **native macOS application** with GitHub Actions-based automation. This guide covers:

- **Phase 1** (Current): macOS app + GitHub Actions + Docker isolation
- **Phase 2** (Weeks 2-4): Credential proxy + Database layer
- **Phase 3** (Q1 2026): gVisor security + Custom infrastructure

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│ User's Mac                                              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Quetrex.app (Tauri)                                  │ │
│ │ - Voice interface (OpenAI APIs)                     │ │
│ │ - Spec management (local .quetrex/ directory)        │ │
│ │ - Dashboard UI (Next.js)                            │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Creates GitHub Issue
                          ↓
┌─────────────────────────────────────────────────────────┐
│ GitHub (github.com/barnent1/quetrex)                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ GitHub Actions                                      │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Docker Container (AI Agent)                     │ │ │
│ │ │ - Claude Code CLI                               │ │ │
│ │ │ - Python + Anthropic SDK                        │ │ │
│ │ │ - Isolated environment                          │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Creates Pull Request
                          ↓
┌─────────────────────────────────────────────────────────┐
│ User Reviews PR in Quetrex                               │
│ - In-app diff viewer                                    │
│ - Approve & merge without leaving app                   │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Tools

- **Node.js 18+** (LTS recommended)
- **Rust** (latest stable via rustup)
- **Tauri CLI** (installed via cargo)
- **Git** (for version control)
- **GitHub account** (for automation)

### Required API Keys

- **OpenAI API key** - For voice features (Whisper, GPT-4, TTS, Realtime API)
- **Anthropic API key** - For AI agent automation (Claude Sonnet 4.5)
- **GitHub Personal Access Token** - For creating issues and PRs

### Platform Requirements

**Phase 1 (Current):**
- macOS 10.15+ (Catalina or later)
- 8GB RAM minimum, 16GB recommended
- 2GB free disk space

**Phase 2 (Planned):**
- Linux support (Ubuntu 20.04+, Fedora 35+)
- Windows 10/11 support

---

## Environment Variables

### Required Variables

Create `.env.local` in project root:

```bash
# ===== REQUIRED: OpenAI =====
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# ===== REQUIRED: Anthropic =====
# Get from: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-...

# ===== REQUIRED: GitHub =====
# Get from: https://github.com/settings/tokens
# Scopes needed: repo, workflow, read:org
GITHUB_TOKEN=ghp_...
```

### Optional Variables

```bash
# ===== App Configuration =====
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=production

# ===== Voice Configuration =====
# Which voice implementation to use by default
NEXT_PUBLIC_DEFAULT_VOICE_MODE=realtime  # or "http"

# ===== Tauri =====
# Only needed for custom build configurations
TAURI_SKIP_DEVSERVER_CHECK=false
```

### Phase 2 Variables (Database & Cloud Sync)

```bash
# ===== Database (PostgreSQL) =====
DATABASE_URL=postgresql://user:password@localhost:5432/quetrex

# ===== Redis (Caching) =====
REDIS_URL=redis://localhost:6379

# ===== Session Management =====
JWT_SECRET=generate-random-string-min-32-chars
SESSION_TIMEOUT=86400  # 24 hours in seconds
```

### Phase 3 Variables (Enterprise)

```bash
# ===== Monitoring (Sentry) =====
SENTRY_DSN=https://...@sentry.io/...

# ===== Analytics =====
ANALYTICS_ENDPOINT=https://analytics.quetrex.dev
ANALYTICS_API_KEY=...

# ===== Custom Runners =====
RUNNER_ENDPOINT=https://runners.quetrex.dev
RUNNER_API_KEY=...
```

### Security Best Practices

**NEVER commit `.env.local` to git:**

```bash
# .gitignore
.env.local
.env.*.local
```

**Use different keys for development and production:**

```bash
# Development
.env.development.local

# Production
.env.production.local
```

**Rotate keys regularly:**
- OpenAI keys: Every 90 days
- Anthropic keys: Every 90 days
- GitHub tokens: Every 180 days

---

## Building for Production

### macOS Application

#### 1. Install Dependencies

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node dependencies
npm install

# Install Tauri CLI
cargo install tauri-cli
```

#### 2. Configure Build

```bash
# Set production environment
export NODE_ENV=production

# Verify configuration
npm run type-check  # TypeScript
npm run lint        # ESLint
npm test:run        # Tests
```

#### 3. Build Application

```bash
# Build for macOS
npm run tauri:build

# Output location:
# src-tauri/target/release/bundle/macos/Quetrex.app
# src-tauri/target/release/bundle/dmg/Quetrex_1.0.0_x64.dmg
```

#### 4. Code Signing (Optional but Recommended)

```bash
# Generate signing certificate
# Apple Developer Account required: https://developer.apple.com/

# Update tauri.conf.json
{
  "tauri": {
    "bundle": {
      "macOS": {
        "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
      }
    }
  }
}

# Build with signing
npm run tauri:build
```

#### 5. Notarization (Required for Distribution)

```bash
# Notarize with Apple
xcrun notarytool submit \
  "src-tauri/target/release/bundle/dmg/Quetrex_1.0.0_x64.dmg" \
  --apple-id "your@email.com" \
  --team-id "TEAM_ID" \
  --password "app-specific-password" \
  --wait

# Staple notarization ticket
xcrun stapler staple \
  "src-tauri/target/release/bundle/dmg/Quetrex_1.0.0_x64.dmg"
```

### Distribution Options

**Option 1: Direct Download**
- Host .dmg file on website
- Users download and install manually
- Simple but no auto-updates

**Option 2: GitHub Releases**
- Attach .dmg to GitHub release
- Users download from releases page
- Can integrate with Tauri updater

**Option 3: Homebrew Cask (Future)**
```bash
brew install --cask quetrex
```

---

## GitHub Actions Setup

### 1. Create GitHub Secrets

Navigate to: `https://github.com/barnent1/quetrex/settings/secrets/actions`

Add the following secrets:

```
ANTHROPIC_API_KEY     = sk-ant-...
GITHUB_TOKEN          = ghp_... (or use built-in GITHUB_TOKEN)
```

**Note:** OpenAI keys are NOT stored in GitHub Actions (Phase 2 credential proxy will handle this).

### 2. Workflow Configuration

The workflow is already configured in `.github/workflows/ai-agent.yml`:

```yaml
name: AI Agent Automation

on:
  issues:
    types: [labeled]

jobs:
  ai-agent:
    if: github.event.label.name == 'ai-feature'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Run AI Agent in Docker
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          docker run --rm \
            -v $(pwd):/workspace \
            -w /workspace \
            -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
            -e GITHUB_TOKEN=$GITHUB_TOKEN \
            quetrex-agent:latest \
            python .claude/scripts/ai-agent-worker.py ${{ github.event.issue.number }}
```

### 3. Docker Image Setup

Build and push the agent Docker image:

```bash
# Build image
docker build -t quetrex-agent:latest -f .claude/Dockerfile .

# Test locally
docker run --rm \
  -v $(pwd):/workspace \
  -w /workspace \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  quetrex-agent:latest \
  python .claude/scripts/ai-agent-worker.py

# Push to registry (if using private registry)
docker tag quetrex-agent:latest ghcr.io/barnent1/quetrex-agent:latest
docker push ghcr.io/barnent1/quetrex-agent:latest
```

### 4. Testing the Workflow

```bash
# Create test issue
gh issue create \
  --title "Test: Add sample feature" \
  --body "This is a test issue for AI agent automation" \
  --label "ai-feature"

# Monitor workflow
gh run watch

# View logs
gh run view --log
```

---

## Security Configuration

### Phase 1: Docker Isolation (Current)

**Status:** ✅ Implemented

**Security Measures:**
- Docker container isolation
- Read-only root filesystem
- Non-root user execution
- Capability dropping (CAP_DROP=ALL)
- Resource limits (2GB RAM, 2 CPU cores, 45min timeout)

**Docker Configuration:**

```dockerfile
# .claude/Dockerfile
FROM python:3.8-slim

# Create non-root user
RUN useradd -m -u 1000 claude-agent

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Switch to non-root user
USER claude-agent

# Set read-only filesystem
VOLUME ["/workspace"]
WORKDIR /workspace

CMD ["python", ".claude/scripts/ai-agent-worker.py"]
```

**Risk Reduction:** 60-70%

See [Security Architecture](architecture/SECURITY-ARCHITECTURE.md) for complete details.

### Phase 2: Credential Proxy (Weeks 2-4)

**Status:** 📋 Planned

**Purpose:** Prevent prompt injection credential theft

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ GitHub Actions Runner (Host)                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Credential Proxy Service                            │ │
│ │ - Validates API requests                            │ │
│ │ - Attaches credentials on host                      │ │
│ │ - Full audit trail                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│         ↕ Unix socket                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Docker Container (Agent)                            │ │
│ │ - NO credentials in environment                     │ │
│ │ - Requests proxied through socket                   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Risk Reduction:** Additional 30% (CRITICAL)

### Phase 3: gVisor Migration (Q1 2026)

**Status:** 📋 Planned

**Purpose:** Industry-leading security (Claude Code for Web level)

**Requirements:**
- Custom infrastructure (migrate off GitHub Actions)
- Google's gVisor runtime
- User-space kernel

**Risk Reduction:** Remaining 15%

---

## Database Setup (Phase 2)

**Status:** 📋 Planned for Weeks 2-4

### PostgreSQL Installation

```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Linux (Ubuntu)
sudo apt-get install postgresql-15
sudo systemctl start postgresql

# Create database
createdb quetrex

# Create user
createuser -P quetrex_user
# Enter password when prompted
```

### Prisma Setup

```bash
# Install Prisma
npm install -D prisma
npm install @prisma/client

# Initialize Prisma
npx prisma init

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://quetrex_user:password@localhost:5432/quetrex"

# Create schema
# Edit prisma/schema.prisma

# Run migration
npx prisma migrate dev --name init

# Generate client
npx prisma generate
```

### Schema (Planned)

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  projects  Project[]
  sessions  Session[]
}

model Project {
  id          String   @id @default(uuid())
  name        String
  path        String
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  specs       Spec[]
  agents      Agent[]
}

model Spec {
  id          String   @id @default(uuid())
  version     Int
  content     String   @db.Text
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId, version])
}

model Agent {
  id          String   @id @default(uuid())
  status      String   // running, idle, error
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  cost        Decimal  @db.Decimal(10, 4)
  progress    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  logs        AgentLog[]
}

model AgentLog {
  id          String   @id @default(uuid())
  agentId     String
  agent       Agent    @relation(fields: [agentId], references: [id])
  message     String   @db.Text
  level       String   // info, warn, error
  createdAt   DateTime @default(now())

  @@index([agentId, createdAt])
}

model Session {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  token       String   @unique
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@index([token])
}
```

### Redis Setup (Optional but Recommended)

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Linux (Ubuntu)
sudo apt-get install redis-server
sudo systemctl start redis

# Test connection
redis-cli ping
# Expected: PONG
```

**Usage in Quetrex:**
- Session caching
- Real-time updates (pub/sub)
- Rate limiting
- Cost tracking cache

---

## Monitoring and Logging

### Current Status (Phase 1)

**Logging:**
- Console logs in Tauri app (development)
- GitHub Actions logs (agent execution)
- No centralized logging yet

**Monitoring:**
- Manual cost tracking in UI
- No automated alerting

### Planned (Phase 2+)

#### Sentry Integration

```bash
# Install Sentry
npm install @sentry/nextjs @sentry/tauri

# Configure
# sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

#### Logging Best Practices

```typescript
// Use structured logging
logger.info('Agent started', {
  agentId: agent.id,
  projectName: project.name,
  cost: 0,
})

// Log errors with context
logger.error('Agent failed', {
  agentId: agent.id,
  error: error.message,
  stack: error.stack,
})

// Track metrics
logger.metric('agent.cost', {
  value: cost,
  projectName: project.name,
})
```

---

## Troubleshooting

### Build Failures

**Problem:** `npm run tauri:build` fails

**Solutions:**

```bash
# 1. Clean build cache
rm -rf src-tauri/target
npm run build

# 2. Check Rust installation
rustc --version
cargo --version

# 3. Update dependencies
npm install
cd src-tauri && cargo update

# 4. Check Tauri CLI version
cargo install tauri-cli --force
```

### Runtime Errors

**Problem:** App crashes on startup

**Solutions:**

1. Check logs:
   ```bash
   # macOS
   ~/Library/Logs/Quetrex/
   ```

2. Verify environment variables:
   ```bash
   # In app console (Dev Tools)
   console.log(process.env.OPENAI_API_KEY)
   ```

3. Reset app data:
   ```bash
   rm -rf ~/.quetrex
   ```

### GitHub Actions Failures

**Problem:** AI agent workflow fails

**Solutions:**

1. Check workflow logs:
   ```bash
   gh run view --log
   ```

2. Verify secrets are set:
   ```bash
   gh secret list
   ```

3. Test Docker image locally:
   ```bash
   docker run --rm -it quetrex-agent:latest bash
   # Test commands inside container
   ```

### API Rate Limits

**Problem:** OpenAI/Anthropic rate limit errors

**Solutions:**

1. Check rate limits:
   ```bash
   curl https://api.openai.com/v1/usage \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

2. Implement exponential backoff:
   ```typescript
   async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn()
       } catch (error) {
         if (error.status === 429 && i < maxRetries - 1) {
           await new Promise(r => setTimeout(r, 2 ** i * 1000))
           continue
         }
         throw error
       }
     }
   }
   ```

---

## Production Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test:run`)
- [ ] Coverage thresholds met (`npm test:coverage`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Production build succeeds (`npm run tauri:build`)
- [ ] Environment variables configured
- [ ] GitHub secrets set
- [ ] Docker image built and tested

### Post-Deployment

- [ ] App launches successfully
- [ ] Voice conversation works
- [ ] Spec creation/editing works
- [ ] GitHub Actions trigger correctly
- [ ] Agent automation completes successfully
- [ ] PR creation works
- [ ] Cost tracking accurate
- [ ] Error monitoring configured
- [ ] Backup strategy in place

### Ongoing Maintenance

- [ ] Monitor error rates (daily)
- [ ] Review API costs (weekly)
- [ ] Update dependencies (monthly)
- [ ] Rotate API keys (every 90 days)
- [ ] Review security logs (weekly)
- [ ] Performance monitoring (continuous)

---

## Additional Resources

### Official Documentation

- **[Tauri Deployment Guide](https://tauri.app/v2/guides/deploy/)** - Official Tauri docs
- **[GitHub Actions](https://docs.github.com/en/actions)** - Workflow documentation
- **[Docker](https://docs.docker.com/)** - Container documentation

### Quetrex-Specific

- **[Security Architecture](architecture/SECURITY-ARCHITECTURE.md)** - Complete security design
- **[CLAUDE.md](../CLAUDE.md)** - Project context and standards
- **[Contributing Guide](../CONTRIBUTING.md)** - Development standards

---

**Questions?** Open a [GitHub Issue](https://github.com/barnent1/quetrex/issues) with the `deployment` label.

**Need help with deployment?** Check existing issues or ask in Discussions.

---

*Last Updated: 2025-11-13*
*Maintained by: Glen Barnhardt with help from Claude Code*
