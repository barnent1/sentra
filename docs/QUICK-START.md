# Sentra Quick Start Guide

**Get Sentra running in 5 minutes.** This guide covers the essentials to get you from zero to a working Sentra instance.

---

## Prerequisites

Before you begin:

- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm 9+** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **API Keys:**
  - OpenAI API key ([Get key](https://platform.openai.com/api-keys))
  - Anthropic API key ([Get key](https://console.anthropic.com/))

---

## 5-Minute Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/barnent1/sentra.git
cd sentra
```

### Step 2: Install Dependencies

```bash
npm install
```

This takes 1-2 minutes depending on your internet connection.

### Step 3: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```bash
# Required
OPENAI_API_KEY=sk-proj-...           # Your OpenAI API key
ANTHROPIC_API_KEY=sk-ant-...         # Your Anthropic API key

# Optional (use defaults for local dev)
NEXT_PUBLIC_APP_URL=http://localhost:3007
```

### Step 4: Run Development Server

```bash
npm run dev
```

You should see:

```
 ▲ Next.js 15.5
 - Local:        http://localhost:3007
 - Network:      http://192.168.1.x:3007

 ✓ Ready in 1.2s
```

### Step 5: Open in Browser

Visit **http://localhost:3007** in your browser.

You should see the Sentra dashboard!

---

## First Conversation

### Try the Voice Interface

1. **Click "Chat with Architect"** button on the dashboard
2. **Click the microphone icon** (allow microphone access when prompted)
3. **Speak your project idea:**
   > "I want to build a bookmark manager for developers. Users should be able to save links with tags and search across all bookmarks."
4. **Wait for response** - Architect AI will ask clarifying questions
5. **Answer questions** to refine your specification
6. **Review generated spec** when complete

That's it! You've just had your first conversation with Sentra's voice architect.

---

## Common Commands Cheat Sheet

### Development

```bash
npm run dev              # Start dev server (http://localhost:3007)
npm run dev:safe         # Start with crash recovery
npm run build            # Production build
npm run start            # Start production server
```

### Testing

```bash
npm test                 # Run tests in watch mode
npm test -- --run        # Run tests once
npm run test:coverage    # Check coverage
npm run test:e2e         # Run E2E tests (Playwright)
```

### Quality Checks

```bash
npm run type-check       # TypeScript compilation
npm run lint             # ESLint (must pass with 0 errors)
npm run format           # Format code with Prettier
```

### Database (Future - Phase 2)

```bash
npm run drizzle:generate # Generate migrations
npm run drizzle:migrate  # Run migrations
npm run drizzle:studio   # Open database GUI
```

---

## Troubleshooting

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3007`

**Solution:**
```bash
# Find process using port 3007
lsof -i :3007

# Kill the process
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3008
```

### API Key Errors

**Problem:** `Error: OPENAI_API_KEY is not set`

**Solution:**
1. Check `.env.local` exists in project root
2. Verify API key starts with `sk-proj-` (OpenAI) or `sk-ant-` (Anthropic)
3. Restart dev server after adding keys
4. Check for typos (no extra spaces or quotes)

### Microphone Not Working

**Problem:** Voice interface doesn't respond to speech

**Solution:**
1. **Allow microphone access** when browser prompts
2. **Use HTTPS** (voice requires secure context)
   - For local dev, `localhost` is considered secure
   - For remote dev, use ngrok or similar
3. **Check browser compatibility:**
   - Chrome: Full support
   - Safari: Full support
   - Firefox: Full support
   - Edge: Full support
4. **Test microphone:**
   ```bash
   # macOS
   system_profiler SPAudioDataType

   # Linux
   arecord -l
   ```

### Build Failures

**Problem:** `npm run build` fails with TypeScript errors

**Solution:**
```bash
# Check what's failing
npm run type-check

# Fix errors shown
# TypeScript strict mode requires explicit types

# Common fixes:
# 1. Add type annotations
# 2. Remove 'any' types
# 3. Remove @ts-ignore comments
```

### Tests Failing

**Problem:** Tests fail after fresh install

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests
npm test -- --run

# If still failing, check Node version
node --version  # Should be 18+
```

### Module Not Found

**Problem:** `Cannot find module '@/components/...'`

**Solution:**
```bash
# Restart TypeScript server in VS Code
# Command Palette (Cmd+Shift+P) → "TypeScript: Restart TS Server"

# Or restart dev server
# Ctrl+C, then npm run dev
```

---

## Next Steps

Now that you have Sentra running, here's what to explore next:

### 1. Read Core Documentation

- **[Multi-Session Architect Guide](guides/MULTI-SESSION-ARCHITECT.md)** - How the voice architect works
- **[Contributing Guide](CONTRIBUTING.md)** - Development standards and workflow
- **[Architecture Overview](architecture/SECURITY-ARCHITECTURE.md)** - System design

### 2. Try Key Features

- **Voice Conversations** - Chat with the architect about a project idea
- **Spec Management** - Review generated specifications
- **Dashboard** - See project status and progress
- **Settings** - Configure API keys and preferences

### 3. Run the Test Suite

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Check coverage
npm run test:coverage
```

### 4. Explore the Codebase

```
sentra/
├── src/app/              # Next.js pages (App Router)
├── src/components/       # React components
├── src/lib/              # OpenAI integration
├── src/services/         # Business logic
└── tests/e2e/            # E2E tests
```

### 5. Make Your First Change

Pick a `good first issue` from [GitHub Issues](https://github.com/barnent1/sentra/issues):

```bash
# Create feature branch
git checkout -b feature/my-first-change

# Make changes
# ... edit files ...

# Run tests
npm test -- --run

# Commit
git add .
git commit -m "feat: my first change"

# Push
git push origin feature/my-first-change

# Create PR on GitHub
```

---

## Development Workflow

### Typical Development Loop

```bash
# 1. Start dev server
npm run dev

# 2. Make changes in your editor
# Files auto-reload on save

# 3. Write tests FIRST (TDD)
# Create *.test.tsx files alongside components

# 4. Run tests in watch mode
npm test

# 5. Check types and lint
npm run type-check
npm run lint

# 6. Format code
npm run format

# 7. Commit changes
git add .
git commit -m "feat: description"
```

### Pre-Commit Checklist

Before committing, ensure:

- [ ] All tests pass (`npm test -- --run`)
- [ ] Coverage meets thresholds (`npm run test:coverage`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

Or run all at once:

```bash
npm run type-check && npm run lint && npm test -- --run && npm run build
```

---

## Configuration Files

### Key Configuration Files

**TypeScript:**
- `tsconfig.json` - TypeScript strict mode configuration
- Enforces explicit types, no `any`, no `@ts-ignore`

**ESLint:**
- `.eslintrc.json` - Linting rules
- Must pass with 0 errors, 0 warnings

**Prettier:**
- `.prettierrc` - Code formatting
- Auto-runs on file save (if configured in editor)

**Vitest:**
- `vitest.config.ts` - Test configuration
- Coverage thresholds enforced

**Next.js:**
- `next.config.js` - Next.js configuration
- App Router, React 19, TypeScript 5.6

---

## Environment Setup Tips

### VS Code Users

Install recommended extensions:

```bash
# Open command palette (Cmd+Shift+P)
# Type: "Show Recommended Extensions"
# Click "Install All"
```

Recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

### Terminal Users

Useful aliases:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias sentra-dev='npm run dev'
alias sentra-test='npm test'
alias sentra-check='npm run type-check && npm run lint && npm test -- --run'
```

### Git Configuration

Recommended git config:

```bash
# Auto-detect file renames
git config merge.renameLimit 999999

# Use rebase for pulls
git config pull.rebase true

# Prune remote branches on fetch
git config fetch.prune true
```

---

## Common Gotchas

### 1. Port 3007 vs 3000

Sentra runs on **port 3007** (not the default 3000).

```bash
# Correct
http://localhost:3007

# Wrong
http://localhost:3000  # Will not work
```

### 2. Environment Variables Must Start with NEXT_PUBLIC_

**Client-side variables** (accessed in React components) must have `NEXT_PUBLIC_` prefix:

```bash
# ✅ Accessible in browser
NEXT_PUBLIC_APP_URL=http://localhost:3007

# ❌ Only accessible server-side
APP_URL=http://localhost:3007
```

### 3. TypeScript Strict Mode

Sentra uses **strict mode** with zero tolerance:

```typescript
// ❌ BAD - Will not compile
const data: any = fetchData()

// ✅ GOOD - Explicit types
interface Data {
  id: string
  name: string
}
const data: Data = fetchData()
```

### 4. Test Coverage is Enforced

PRs failing CI? Check coverage:

```bash
npm run test:coverage

# Output shows which files need more tests
File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|--------
src/services/      |   94.2  |   88.5   |   96.7  |   93.8  ✅
src/utils/         |   91.3  |   85.2   |   90.1  |   91.0  ✅
src/components/    |   55.2  |   48.3   |   61.9  |   57.1  ❌ Need 60%+
```

### 5. Quality Hooks Cannot Be Bypassed

Sentra's 6-layer defense system prevents bad commits:

```bash
# ❌ This will FAIL
git commit --no-verify -m "skip tests"
# PreToolUse hook blocks --no-verify

# ✅ This works
npm test -- --run  # Fix tests first
git commit -m "fix: tests passing"
```

---

## Quick Reference

### Keyboard Shortcuts (Dashboard)

- `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) - Open command palette
- `Cmd+N` - New project
- `Cmd+,` - Settings
- `Cmd+/` - Help

### API Endpoints

```
GET  /api/health              # Health check
GET  /api/projects            # List projects
POST /api/projects            # Create project
GET  /api/projects/:id        # Get project details
GET  /api/architect/sessions  # List architect sessions
POST /api/architect/message   # Send message to architect
```

### File Paths

```
/Users/barnent1/Projects/sentra/                # Project root
├── src/                                         # Source code
│   ├── app/                                     # Next.js pages
│   ├── components/                              # React components
│   ├── lib/                                     # Libraries
│   └── services/                                # Business logic
├── .env.local                                   # Environment variables (create this)
├── .env.example                                 # Example env file
└── docs/                                        # Documentation
```

---

## Getting Help

### Resources

- **Documentation:** [docs/](../docs/)
- **Issues:** [GitHub Issues](https://github.com/barnent1/sentra/issues)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)

### Before Asking for Help

1. Check this quick start guide
2. Search existing issues
3. Read error messages carefully
4. Test in clean environment

### How to Ask Good Questions

```
❌ BAD: "It's broken"
✅ GOOD: "npm run dev fails with 'Error: Cannot find module @/lib/openai' on line 5 of src/app/api/chat/route.ts. Steps to reproduce: fresh clone, npm install, npm run dev. Node v18.17.0, macOS 14.0."
```

---

## Summary

**You've learned:**

- How to install and run Sentra (5 minutes)
- Common commands for development
- Troubleshooting tips
- Next steps for learning more

**Commands to remember:**

```bash
npm run dev           # Start development
npm test              # Run tests
npm run type-check    # Check types
npm run lint          # Check code quality
```

**Next:** Read the [Multi-Session Architect Guide](guides/MULTI-SESSION-ARCHITECT.md) to learn how to use the voice architect effectively.

---

**Created by Glen Barnhardt with the help of Claude Code**
**Last Updated:** 2025-11-23
