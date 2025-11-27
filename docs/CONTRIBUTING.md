# Contributing to Quetrex

**Thank you for considering contributing to Quetrex!** This guide will help you get started with development, testing, and submitting changes.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Git Workflow](#git-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Code Review Process](#code-review-process)
- [Issue Templates](#issue-templates)
- [Quality Enforcement](#quality-enforcement)
- [Common Tasks](#common-tasks)
- [Getting Help](#getting-help)

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** (LTS recommended)
- **npm 9+** or **pnpm 8+**
- **Git** (latest version)
- **GitHub account** with SSH key configured
- **Code editor** (VS Code recommended with TypeScript extension)

**Optional but recommended:**
- **Docker** (for testing agent containers)
- **PostgreSQL** (for database development)
- **GitHub CLI** (`gh`) for PR management

### Quick Setup

```bash
# 1. Fork the repository on GitHub
# Click "Fork" button at https://github.com/barnent1/quetrex

# 2. Clone your fork
git clone git@github.com:YOUR_USERNAME/quetrex.git
cd quetrex

# 3. Add upstream remote
git remote add upstream git@github.com:barnent1/quetrex.git

# 4. Install dependencies
npm install

# 5. Set up environment variables
cp .env.example .env.local

# Edit .env.local and add your API keys:
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# DATABASE_URL=postgresql://... (optional for Phase 1)

# 6. Run type check
npm run type-check

# 7. Run tests
npm test -- --run

# 8. Start development server
npm run dev
```

Visit http://localhost:3007 to see your local instance.

---

## Development Setup

### Environment Variables

Create `.env.local` in the project root:

```bash
# Required
OPENAI_API_KEY=sk-...              # OpenAI API key for voice/LLM
ANTHROPIC_API_KEY=sk-ant-...       # Anthropic API key for agents

# Optional (Phase 1)
NEXT_PUBLIC_APP_URL=http://localhost:3007  # App URL for development
DATABASE_URL=postgresql://...      # PostgreSQL connection string (future)

# GitHub Integration (for agent automation)
GITHUB_TOKEN=ghp_...               # Personal access token
GITHUB_OWNER=barnent1              # Repository owner
GITHUB_REPO=quetrex                 # Repository name
```

**Security Note:** Never commit `.env.local` to git. It's already in `.gitignore`.

### Database Setup (Future - Phase 2)

Currently, Quetrex uses file-based storage. Database integration coming in Phase 2.

When database is added:

```bash
# Generate Drizzle schema
npm run drizzle:generate

# Run migrations
npm run drizzle:migrate

# Open Drizzle Studio (database GUI)
npm run drizzle:studio
```

### IDE Configuration

**VS Code (Recommended):**

Install these extensions:
- **TypeScript and JavaScript Language Features** (built-in)
- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

---

## Git Workflow

### Branching Strategy

**Main Branch:**
- `main` - Production-ready code (protected)

**Feature Branches:**
- `feature/your-feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/what-you-changed` - Documentation updates
- `refactor/what-you-refactored` - Code refactoring

**Branch Naming:**
```bash
# Good
feature/multi-project-dashboard
fix/voice-echo-cancellation
docs/contributing-guide

# Bad
my-branch
test
feature
```

### Creating a Branch

```bash
# 1. Start from main
git checkout main
git pull upstream main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes
# ... edit files ...

# 4. Commit (see commit message format below)
git add .
git commit -m "feat: add multi-project dashboard"

# 5. Push to your fork
git push origin feature/your-feature-name

# 6. Create pull request on GitHub
```

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): brief description (branch created by Glen Barnhardt with help from Claude Code)

Detailed explanation of changes.
Why this change was needed.
What problem it solves.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring (no behavior change)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (dependencies, config)
- `perf:` - Performance improvements
- `style:` - Code formatting (no logic change)

**Scopes (optional but recommended):**
- `voice` - Voice interface changes
- `dashboard` - Dashboard UI changes
- `agent` - AI agent automation
- `auth` - Authentication/authorization
- `db` - Database changes
- `api` - API routes

**Examples:**
```bash
feat(dashboard): add multi-project grid layout (branch created by Glen Barnhardt with help from Claude Code)

Added grid layout to dashboard showing all projects simultaneously.
Each card displays project name, status, progress, and cost.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

```bash
fix(voice): prevent echo feedback in Safari (branch created by Glen Barnhardt with help from Claude Code)

Set echoCancellation: true on microphone track to prevent
audio feedback loops in Safari browser.

Tested on:
- Safari 18.0 (macOS)
- Safari 17.5 (iOS)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Pull Request Process

1. **Create PR from feature branch to `main`**
2. **Fill out PR template** (describe changes, testing, screenshots)
3. **Ensure all CI checks pass:**
   - TypeScript compilation
   - ESLint (0 errors, 0 warnings)
   - Unit tests (75%+ coverage)
   - Build success
4. **Request review** from maintainers
5. **Address feedback** if changes requested
6. **Squash and merge** when approved

**PR Title Format:**
```
feat: add multi-project dashboard grid layout
fix: resolve voice echo in Safari
docs: update contributing guide with testing requirements
```

---

## Code Standards

### TypeScript Strict Mode (Mandatory)

Quetrex uses **TypeScript strict mode** with zero tolerance for type violations.

**✅ DO:**
```typescript
// Explicit types
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// Type guards
function isCartItem(obj: unknown): obj is CartItem {
  return typeof obj === 'object' && obj !== null && 'price' in obj
}

// Proper error handling
try {
  const result = await apiCall()
  return result
} catch (error) {
  if (error instanceof ApiError) {
    throw new Error(`API failed: ${error.message}`)
  }
  throw error
}
```

**❌ DON'T:**
```typescript
// Using 'any'
function processData(data: any) { }

// Using @ts-ignore
// @ts-ignore
const value = getData()

// Non-null assertions
const user = users.find(u => u.id === id)!  // Bad - could be undefined

// Implicit any
function calculate(x, y) {  // Bad - parameters have implicit 'any'
  return x + y
}
```

### Code Style

**Prettier Configuration:**

Prettier enforces consistent formatting. Run before committing:

```bash
npm run format
```

**ESLint Rules:**

Must pass with 0 errors, 0 warnings:

```bash
npm run lint
```

**Common Rules:**
- No `console.log` in production code (use logger)
- No magic numbers (use named constants)
- Max line length: 100 characters
- Prefer `const` over `let`, never `var`
- Use async/await over `.then()` chains
- Always handle errors explicitly

### File Organization

```typescript
// Component file structure
import React from 'react'  // 1. External imports
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'  // 2. Internal imports
import { useAuth } from '@/hooks/useAuth'
import { fetchProjects } from '@/services/projects'  // 3. Services

import type { Project } from '@/types'  // 4. Types

// 5. Component definition
export function Dashboard() {
  // a. Hooks
  const { user } = useAuth()
  const { data: projects } = useQuery({ /* ... */ })

  // b. Event handlers
  const handleCreateProject = () => { /* ... */ }

  // c. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `Dashboard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Constants: `UPPER_SNAKE_CASE.ts` (e.g., `API_ENDPOINTS.ts`)
- Types: `types.ts` or `index.d.ts`

**Variables:**
- Components: `PascalCase` (e.g., `UserProfile`)
- Functions: `camelCase` (e.g., `getUserData`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- Private methods: `_privateMethod` (prefix with underscore)

**React-Specific:**
- Props interfaces: `ComponentNameProps` (e.g., `DashboardProps`)
- Event handlers: `handleEventName` (e.g., `handleClick`)
- Boolean props: `is/has/should` prefix (e.g., `isLoading`, `hasError`)

---

## Testing Requirements

### Test-Driven Development (TDD)

**Quetrex follows TDD strictly. Write tests FIRST, then implementation.**

**TDD Workflow:**
1. **Write test** describing desired behavior
2. **Run test** - verify it fails (Red)
3. **Write minimal code** to make test pass
4. **Run test** - verify it passes (Green)
5. **Refactor** while keeping tests green
6. **Repeat** for next requirement

### Coverage Thresholds

**Enforced by CI/CD:**
- **Overall:** 75%+ (entire codebase)
- **Business Logic** (`src/services/`): 90%+
- **Utilities** (`src/utils/`): 90%+
- **UI Components:** 60%+

**Check coverage:**
```bash
npm run test:coverage
```

Output shows coverage by file:
```
File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|--------
src/services/      |   94.2  |   88.5   |   96.7  |   93.8
src/utils/         |   91.3  |   85.2   |   90.1  |   91.0
src/components/    |   62.8  |   55.3   |   68.9  |   64.2
All files          |   78.4  |   72.1   |   81.5  |   77.9
```

### AAA Pattern (Arrange, Act, Assert)

**All tests must follow AAA structure:**

```typescript
import { describe, it, expect } from 'vitest'
import { calculateTotal } from './cart'

describe('calculateTotal', () => {
  it('should sum item prices correctly', () => {
    // ARRANGE: Set up test data
    const items = [
      { name: 'Item 1', price: 10 },
      { name: 'Item 2', price: 20 },
      { name: 'Item 3', price: 30 },
    ]

    // ACT: Execute the function
    const result = calculateTotal(items)

    // ASSERT: Verify the outcome
    expect(result).toBe(60)
  })

  it('should return 0 for empty cart', () => {
    // ARRANGE
    const items: CartItem[] = []

    // ACT
    const result = calculateTotal(items)

    // ASSERT
    expect(result).toBe(0)
  })
})
```

### Test Categories

**1. Unit Tests (Vitest)**

Test individual functions/components in isolation:

```bash
npm test                    # Watch mode
npm test -- --run           # Run once
npm test -- --coverage      # With coverage report
```

**Location:** `src/**/*.test.ts` (colocated with source files)

**2. Integration Tests (Vitest)**

Test multiple units working together:

```bash
npm test -- integration
```

**Location:** `tests/integration/`

**3. E2E Tests (Playwright)**

Test complete user workflows:

```bash
npm run test:e2e            # Run all E2E tests
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:debug      # Debug mode
```

**Location:** `tests/e2e/`

**When E2E tests are required:**
- Critical user journeys (signup, checkout, payment)
- Visual state changes (color, visibility, animations)
- Multi-step interactions (modal → form → submit)
- Cross-page workflows

### Running Tests

**Before committing:**
```bash
# Run all checks
npm run type-check && npm run lint && npm test -- --run

# Or use pre-commit hook (automatic)
git commit -m "your message"
```

**During development:**
```bash
# Watch mode (reruns on file changes)
npm test

# Run specific test file
npm test -- Dashboard.test.tsx

# Run tests matching pattern
npm test -- --grep "should display projects"
```

---

## Code Review Process

### Checklist for Authors

Before submitting PR:

- [ ] All tests pass locally (`npm test -- --run`)
- [ ] Coverage meets thresholds (`npm run test:coverage`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed
- [ ] PR description filled out
- [ ] Screenshots added (if UI changes)
- [ ] Breaking changes documented

### Checklist for Reviewers

When reviewing PRs:

- [ ] Code follows TypeScript strict mode
- [ ] Tests cover new functionality
- [ ] Coverage thresholds maintained
- [ ] AAA pattern used in tests
- [ ] No `console.log` left in code
- [ ] No hardcoded secrets
- [ ] Error handling is comprehensive
- [ ] Component props are typed
- [ ] Naming conventions followed
- [ ] Comments explain "why" not "what"

### Review Process

1. **Author creates PR** with clear description
2. **CI runs automatically** (tests, lint, build)
3. **Reviewer(s) assigned** (1-2 reviewers)
4. **Reviewer comments** on specific lines or overall
5. **Author addresses feedback** with new commits
6. **Reviewer approves** when satisfied
7. **Author squashes and merges**

**Response Time Expectations:**
- Initial review: Within 2 business days
- Follow-up comments: Within 1 business day
- Approval: Within 1 business day after final changes

---

## Issue Templates

### Bug Report

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.17.0]
- Quetrex version: [e.g., 0.1.0]

**Additional context**
Any other context about the problem.
```

### Feature Request

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Mockups, diagrams, or examples.
```

### Task Template

```markdown
**Description**
What needs to be done and why.

**Acceptance Criteria**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

**Implementation Notes**
Technical approach or constraints.

**Related Issues**
Links to related issues or PRs.
```

---

## Quality Enforcement

### 6-Layer Defense System

Quetrex's quality enforcement prevents bugs from being committed:

**Layer 1: PreToolUse Hook**
- Blocks dangerous commands before execution
- Prevents `git commit --no-verify`
- Prevents `npm install --force`
- **Location:** `.claude/hooks/validate-bash.py`

**Layer 2: PostToolUse Hook**
- Validates every file change
- Catches TypeScript errors
- Detects hardcoded secrets
- Blocks `any` types
- **Location:** `.claude/hooks/verify-changes.py`

**Layer 3: Stop Hook**
- Unbypassable quality gate
- Runs before task completion
- Checks: tests, coverage, linting, build, security
- **Location:** `.claude/hooks/quality-gate.sh`

**Layer 4: TypeScript Strict Mode**
- Compiler enforces type safety
- No escape hatches
- **Config:** `tsconfig.json`

**Layer 5: Test Coverage**
- Vitest enforces thresholds
- **Config:** `vitest.config.ts`

**Layer 6: CI/CD**
- GitHub Actions re-runs all checks
- Prevents merging if any check fails
- **Config:** `.github/workflows/`

### Manual Override (Emergency Only)

**Never bypass quality hooks unless absolutely necessary.**

If you must bypass (e.g., documentation-only change):

```bash
# AVOID THIS - USE ONLY IN EMERGENCIES
git commit --no-verify -m "docs: fix typo"
```

**Note:** PreToolUse hook blocks `--no-verify` by default.

---

## Common Tasks

### Adding a New Component

```bash
# 1. Create component file
touch src/components/MyComponent.tsx

# 2. Write test FIRST
touch src/components/MyComponent.test.tsx

# 3. Write test
cat > src/components/MyComponent.test.tsx << EOF
import { render, screen } from '@testing-library/react'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    // ARRANGE
    render(<MyComponent />)

    // ACT
    const element = screen.getByRole('button')

    // ASSERT
    expect(element).toBeInTheDocument()
  })
})
EOF

# 4. Run test (should fail)
npm test -- MyComponent.test.tsx

# 5. Implement component
# ... write code ...

# 6. Run test (should pass)
npm test -- MyComponent.test.tsx

# 7. Check coverage
npm run test:coverage -- MyComponent
```

### Adding a New API Route

```bash
# 1. Create route file
touch src/app/api/my-route/route.ts

# 2. Write test FIRST
touch src/app/api/my-route/route.test.ts

# 3. Implement route
cat > src/app/api/my-route/route.ts << EOF
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Implementation
  return NextResponse.json({ data: 'response' })
}
EOF

# 4. Test manually
npm run dev
# Visit http://localhost:3007/api/my-route
```

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update specific package
npm install package@latest

# Update all packages (careful)
npm update

# Test after updating
npm run type-check
npm test -- --run
npm run build
```

### Debugging Tests

```bash
# Run single test file
npm test -- Dashboard.test.tsx

# Run tests matching pattern
npm test -- --grep "should display"

# Run with coverage
npm test -- --coverage Dashboard

# Debug in UI mode
npm run test:ui
```

---

## Getting Help

### Resources

- **Documentation:** `/docs` directory
- **Architecture:** `/docs/architecture/`
- **Examples:** Look at existing components in `/src`
- **Roadmap:** `/docs/roadmap/`

### Communication

- **Questions:** Open a [GitHub Issue](https://github.com/barnent1/quetrex/issues) with `question` label
- **Bugs:** Use bug report template
- **Feature Ideas:** Use feature request template
- **Security:** Email security@quetrex.app (do not open public issue)

### Before Asking

1. Search existing issues
2. Check documentation
3. Review code examples
4. Test in clean environment

### Good Questions

```
❌ BAD: "It doesn't work"
✅ GOOD: "Voice interface throws 'MediaStream not supported' error in Firefox 120 on Ubuntu 22.04. Steps to reproduce: ..."

❌ BAD: "How do I add a feature?"
✅ GOOD: "I want to add user avatars to the dashboard. Should I store them in PostgreSQL as base64 or use external storage like S3?"
```

---

## Summary

**Key Takeaways:**

1. **Write tests FIRST** (TDD is mandatory)
2. **TypeScript strict mode** (no `any`, no `@ts-ignore`)
3. **Coverage thresholds** (75%+ overall, 90%+ for services/utils)
4. **Quality hooks prevent bad commits** (cannot be bypassed)
5. **Follow conventions** (naming, file structure, commit messages)
6. **Review checklist** (both author and reviewer responsibilities)

**Quick Commands:**
```bash
npm run type-check          # TypeScript compilation
npm test -- --run           # Run all tests once
npm run test:coverage       # Check coverage
npm run lint                # ESLint
npm run format              # Prettier
npm run build               # Production build
```

**Next Steps:**

1. Set up your development environment
2. Read through existing code
3. Pick a `good first issue` from GitHub
4. Follow TDD workflow
5. Submit your first PR

**Welcome to the Quetrex community!**

---

**Created by Glen Barnhardt with the help of Claude Code**
**Last Updated:** 2025-11-23
