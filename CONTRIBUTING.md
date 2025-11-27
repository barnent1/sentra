# Contributing to Quetrex

Thank you for your interest in contributing to Quetrex! This document provides guidelines and standards for development.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Development Standards](#development-standards)
  - [TypeScript Strict Mode](#typescript-strict-mode-mandatory)
  - [Test-Driven Development](#test-driven-development-tdd)
  - [Code Quality](#code-quality)
  - [Security](#security)
- [Git Workflow](#git-workflow)
  - [Branching Strategy](#branching-strategy)
  - [Commit Messages](#commit-messages)
  - [Pull Requests](#pull-requests)
- [Quality Hooks](#quality-hooks)
- [Project Structure](#project-structure)
- [Testing Guidelines](#testing-guidelines)
- [Common Tasks](#common-tasks)
- [Known Gotchas](#known-gotchas)
- [Getting Help](#getting-help)
- [Code of Conduct](#code-of-conduct)

---

## Quick Start

1. **Fork and clone**
   ```bash
   git clone https://github.com/yourusername/quetrex.git
   cd quetrex
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Add your OPENAI_API_KEY
   ```

4. **Run in development**
   ```bash
   npm run tauri:dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

---

## Development Standards

### TypeScript Strict Mode (MANDATORY)

**Always use explicit types. Never use `any` or `@ts-ignore`.**

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

**Type Safety Rules:**
- No `any` type
- No `@ts-ignore` (use `@ts-expect-error` with comment if absolutely necessary)
- No non-null assertions (`!`) without comments
- All functions must have return types
- All parameters must have types

### Test-Driven Development (TDD)

**Always write tests FIRST, then implementation.**

**Process:**
1. Write test that fails
2. Run test to verify it fails
3. Write minimal code to make it pass
4. Run test to verify it passes
5. Refactor if needed
6. Repeat

**Coverage Requirements:**
- **Overall**: 75%+ (enforced by CI/CD)
- **Business logic** (`src/lib/`, `src-tauri/src/`): 90%+
- **UI components**: 60%+
- **E2E for all visual state changes**

**Test Structure (AAA Pattern):**
```typescript
describe('SpecManager', () => {
  describe('createSpec', () => {
    it('should create spec with version 1', async () => {
      // ARRANGE: Setup test data
      const content = '# Feature X'
      const projectName = 'test-project'

      // ACT: Execute the behavior
      const spec = await specManager.createSpec(content, projectName)

      // ASSERT: Verify outcome
      expect(spec.version).toBe(1)
      expect(spec.content).toBe(content)
      expect(spec.projectName).toBe(projectName)
    })
  })
})
```

**E2E Tests Required For:**
- All visual state changes (color, visibility, position, animation)
- Multi-step interactions (click → modal → action → result)
- User-facing state transitions (loading → success, enabled → disabled)
- Critical user journeys

### Code Quality

**Linting:** ESLint with strict rules
- **0 errors, 0 warnings** required
- Run `npm run lint` before committing
- Enforced by pre-commit hooks

**Formatting:** Prettier
- Automatic formatting on save (recommended)
- Run `npm run format` to format all files
- Enforced by pre-commit hooks

**No Debug Code:**
```typescript
// ❌ DON'T: Leave console.log in code
console.log('User data:', user)

// ✅ DO: Remove debug code or use proper logging
// (Currently no logger - just remove debug code)
```

### Security

**Never commit secrets:**
```typescript
// ❌ DON'T: Hardcoded secrets
const apiKey = 'sk_live_abc123'

// ✅ DO: Environment variables
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) throw new Error('OPENAI_API_KEY not configured')
```

**Input validation is mandatory:**
- Validate all user input
- Validate all external data (API responses)
- Use TypeScript types + runtime validation

**Security Checks:**
- `npm audit` must pass (no high/critical vulnerabilities)
- No SQL injection patterns (when DB added)
- No XSS vulnerabilities
- No hardcoded credentials

---

## Git Workflow

### Branching Strategy

- **`main`**: Production-ready code (protected)
- **`feature/*`**: New features (e.g., `feature/voice-commands`)
- **`fix/*`**: Bug fixes (e.g., `fix/audio-echo`)
- **`docs/*`**: Documentation updates

### Branch Naming

```bash
# Feature branches
git checkout -b feature/add-menu-bar-integration

# Bug fix branches
git checkout -b fix/voice-echo-issue

# Documentation branches
git checkout -b docs/update-installation-guide
```

### Commit Messages

**Format:**
```
type(scope): Brief description

Detailed explanation of changes.
Why this change was needed.

Branch created by Glen Barnhardt with help from Claude Code

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `chore`: Updating build tasks, package manager configs, etc.

**Examples:**
```
feat(voice): add Realtime API support with streaming audio

Implemented OpenAI Realtime API integration for lower latency
voice conversations. Includes WebSocket proxy in Rust backend
and React component updates.

- Added realtime_proxy.rs for WebSocket handling
- Updated ArchitectChat to support both implementations
- Added toggle in Settings to switch between HTTP and Realtime

Branch created by Glen Barnhardt with help from Claude Code
```

```
fix(specs): resolve version conflict when saving specs

Fixed race condition where concurrent spec saves could create
conflicting version numbers. Now using atomic file operations
with proper locking.

Fixes #123

Branch created by Glen Barnhardt with help from Claude Code
```

### Pull Requests

**Before Creating PR:**
1. Run all checks locally:
   ```bash
   npm run type-check  # TypeScript
   npm run lint        # ESLint
   npm test:run        # Tests
   npm run build       # Build
   ```

2. Ensure coverage meets thresholds:
   ```bash
   npm test:coverage
   ```

3. Update documentation if needed

**PR Description Template:**
```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- Detailed list of changes
- With explanation of why

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if UI changes)
- [ ] All tests passing
- [ ] Coverage thresholds met

## Screenshots (if UI changes)
Before/after screenshots

## Checklist
- [ ] My code follows the TypeScript strict mode guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

**Review Process:**
- All PRs require review before merge
- CI/CD must pass (tests, lint, build, coverage)
- Address review comments
- Squash and merge to keep history clean

**Automated Quality Gates:**

Every PR runs through comprehensive quality checks via GitHub Actions. All checks must pass before merging.

**Quality Gate Checks:**
1. **TypeScript Type Checking** - Strict mode validation, no `any`, no `@ts-ignore`
2. **ESLint** - 0 errors, 0 warnings required
3. **Test Suite** - All unit and integration tests must pass
4. **Coverage Thresholds** - 75% overall, 90% for services/utils
5. **Build Verification** - Production build must succeed
6. **Security Audit** - No high or critical vulnerabilities
7. **Rust Checks** - Format, Clippy, tests, and build
8. **E2E Tests** - Playwright tests for user journeys

**Local Pre-Push Checks:**

Before pushing, run the same checks locally to catch issues early:

```bash
# Run all quality checks (recommended before push)
npm run type-check && \
npm run lint -- --max-warnings=0 && \
npm run test:coverage && \
npm run build && \
npm audit --audit-level=high

# Or use pre-push hook (see Git Hooks section)
```

**Coverage Report:**

The quality gate automatically comments on your PR with coverage metrics:

```
📊 Quality Gate Report

Coverage Metrics
Metric      | Percentage | Status | Threshold
Lines       | 87.45%     | ✅     | 75%
Branches    | 82.33%     | ✅     | 75%
Functions   | 90.12%     | ✅     | 75%
Statements  | 88.76%     | ✅     | 75%

✅ All quality gates passed!
```

If checks fail, the comment shows which thresholds were not met and links to detailed logs.

---

## Quality Hooks

Quetrex has **3 hooks** that automatically enforce quality:

### 1. PreToolUse Hook (`validate-bash.py`)

**Blocks dangerous commands BEFORE execution:**
- `git commit --no-verify` (bypassing checks)
- `git push -f` to main/master
- Interactive git commands (`git rebase -i`, etc.)
- Recursive deletes on root
- Deletion of test files
- Modification of hook files

**You cannot bypass this.** If blocked, the command is dangerous - find another way.

### 2. PostToolUse Hook (`verify-changes.py`)

**Validates EVERY file edit:**
- TypeScript syntax checking
- Security issue detection:
  - `dangerouslySetInnerHTML` without sanitization
  - SQL injection patterns
  - Hardcoded secrets/API keys
  - `eval()` usage
  - `console.log` in production code
- TypeScript strict mode:
  - `any` type usage
  - `@ts-ignore` comments
  - Non-null assertions without comments

**If your edit is rejected, fix the issue. Don't try to bypass.**

### 3. Stop Hook (`quality-gate.sh`)

**Comprehensive quality gate BEFORE finishing:**
- TypeScript type checking (`tsc --noEmit`)
- ESLint linting
- Tests with coverage (75% threshold)
- Build success
- Security audit (`npm audit --audit-level=high`)
- Git status checks (no sensitive files, not on main)

**This is UNBYPASSABLE. All checks must pass before you can finish work.**

### 4. Pre-Push Hook (Optional but Recommended)

**Prevents pushing failing code to remote:**

Install the pre-push hook to run quality checks before every push:

```bash
# Install pre-push hook
cp .git/hooks/pre-push.sample .git/hooks/pre-push
chmod +x .git/hooks/pre-push

# Or create it manually (see Git Hooks section below)
```

The hook runs the same checks as CI/CD, catching issues before they reach GitHub Actions.

**What it checks:**
- TypeScript type checking
- ESLint (0 errors, 0 warnings)
- Test suite
- Coverage thresholds
- Build verification

**Skipping the hook (NOT recommended):**

```bash
# Only use in emergencies
git push --no-verify

# Note: This only bypasses the local hook
# CI/CD will still enforce all checks
```

---

## Git Hooks

### Installing Pre-Push Hook

Create `.git/hooks/pre-push` to run quality checks before pushing:

```bash
#!/bin/sh

# Quetrex Pre-Push Hook
# Runs quality checks before allowing push to remote

echo "🔍 Running pre-push quality checks..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any check fails
FAILED=0

# 1. TypeScript type checking
echo "📘 TypeScript type checking..."
if ! npm run type-check > /dev/null 2>&1; then
  echo "${RED}❌ TypeScript type checking failed${NC}"
  FAILED=1
else
  echo "${GREEN}✅ TypeScript type checking passed${NC}"
fi

# 2. ESLint
echo "🔍 Running ESLint..."
if ! npm run lint -- --max-warnings=0 > /dev/null 2>&1; then
  echo "${RED}❌ ESLint failed (errors or warnings found)${NC}"
  FAILED=1
else
  echo "${GREEN}✅ ESLint passed${NC}"
fi

# 3. Tests
echo "🧪 Running tests..."
if ! npm run test:run > /dev/null 2>&1; then
  echo "${RED}❌ Tests failed${NC}"
  FAILED=1
else
  echo "${GREEN}✅ Tests passed${NC}"
fi

# 4. Build
echo "🏗️  Building project..."
if ! npm run build > /dev/null 2>&1; then
  echo "${RED}❌ Build failed${NC}"
  FAILED=1
else
  echo "${GREEN}✅ Build successful${NC}"
fi

echo ""

# Exit with error if any check failed
if [ $FAILED -eq 1 ]; then
  echo "${RED}❌ Pre-push checks failed!${NC}"
  echo ""
  echo "Run the following to see detailed errors:"
  echo "  npm run type-check"
  echo "  npm run lint"
  echo "  npm run test:run"
  echo "  npm run build"
  echo ""
  echo "To skip this hook (NOT recommended):"
  echo "  git push --no-verify"
  echo ""
  exit 1
fi

echo "${GREEN}✅ All pre-push checks passed!${NC}"
echo ""
exit 0
```

**Installation:**

```bash
# Navigate to project root
cd /path/to/quetrex

# Create the hook file
cat > .git/hooks/pre-push << 'EOF'
[paste the script above]
EOF

# Make it executable
chmod +x .git/hooks/pre-push
```

**Testing the hook:**

```bash
# Make a change and try to push
git push

# You should see the quality checks run
# If any fail, the push is blocked
```

---

## Project Structure

### Adding New Files

**Frontend (React/TypeScript):**
```
src/
├── app/              # Pages (Next.js App Router)
├── components/       # React components
├── lib/              # Libraries and utilities
└── hooks/            # Custom React hooks
```

**Backend (Rust):**
```
src-tauri/src/
├── lib.rs            # Main app initialization
├── commands.rs       # New IPC commands here
├── {feature}.rs      # Feature-specific modules
```

**Tests:**
```
tests/
├── unit/             # Unit tests (Vitest)
├── integration/      # Integration tests
└── e2e/              # E2E tests (Playwright)
```

### File Naming Conventions

**React Components:** PascalCase
- `ArchitectChat.tsx`
- `SpecViewer.tsx`

**Utilities/Libraries:** camelCase
- `openai-voice.ts`
- `tauri.ts`

**Rust Modules:** snake_case
- `realtime_proxy.rs`
- `specs.rs`

**Tests:** Match source file with `.test.ts` or `.spec.ts`
- `specs.test.ts`
- `voice-conversation.spec.ts`

---

## Testing Guidelines

### Unit Tests (Vitest)

**Test business logic and utilities:**

```typescript
// tests/unit/specs.test.ts
import { describe, it, expect } from 'vitest'
import { createSpec, editSpec } from '@/lib/specs'

describe('Spec Management', () => {
  describe('createSpec', () => {
    it('should create spec with version 1', async () => {
      const spec = await createSpec('# Feature', 'project')
      expect(spec.version).toBe(1)
    })
  })

  describe('editSpec', () => {
    it('should increment version when editing', async () => {
      const spec = await createSpec('# Original', 'project')
      const edited = await editSpec(spec.id, '# Edited')
      expect(edited.version).toBe(2)
    })
  })
})
```

### E2E Tests (Playwright)

**Test user-visible behavior:**

```typescript
// tests/e2e/voice-conversation.spec.ts
import { test, expect } from '@playwright/test'

test('user can start voice conversation', async ({ page }) => {
  await page.goto('/')

  // Click chat button
  await page.click('[data-testid="chat-button"]')

  // Chat modal should open
  await expect(page.getByRole('dialog')).toBeVisible()

  // Microphone button should be visible
  await expect(page.getByTestId('mic-button')).toBeVisible()
})
```

**Visual Testing:**
```typescript
test('spec viewer renders markdown correctly', async ({ page }) => {
  await page.goto('/')
  // ... open spec viewer ...

  // Take screenshot for comparison
  await expect(page).toHaveScreenshot('spec-viewer.png')
})
```

---

## Common Tasks

### Adding a New Tauri Command

1. **Define in Rust** (`src-tauri/src/commands.rs` or new module):
   ```rust
   #[tauri::command]
   pub async fn my_new_command(param: String) -> Result<String, String> {
       // Implementation
       Ok(format!("Result: {}", param))
   }
   ```

2. **Register in** `src-tauri/src/lib.rs`:
   ```rust
   .invoke_handler(tauri::generate_handler![
       // ... existing commands ...
       commands::my_new_command,
   ])
   ```

3. **Call from frontend**:
   ```typescript
   // src/lib/tauri.ts
   export async function myNewCommand(param: string): Promise<string> {
     return invoke('my_new_command', { param })
   }
   ```

4. **Write tests**:
   ```typescript
   // tests/integration/tauri-commands.test.ts
   it('should call my_new_command', async () => {
     const result = await myNewCommand('test')
     expect(result).toBe('Result: test')
   })
   ```

### Adding a New React Component

1. **Create component with tests FIRST**:
   ```typescript
   // tests/unit/MyComponent.test.tsx
   import { render, screen } from '@testing-library/react'
   import { MyComponent } from '@/components/MyComponent'

   describe('MyComponent', () => {
     it('should render with text', () => {
       render(<MyComponent text="Hello" />)
       expect(screen.getByText('Hello')).toBeInTheDocument()
     })
   })
   ```

2. **Implement component**:
   ```typescript
   // src/components/MyComponent.tsx
   interface Props {
     text: string
   }

   export function MyComponent({ text }: Props) {
     return <div>{text}</div>
   }
   ```

3. **Add E2E test if user-visible**:
   ```typescript
   // tests/e2e/my-component.spec.ts
   test('user can interact with MyComponent', async ({ page }) => {
     await page.goto('/')
     await expect(page.getByText('Hello')).toBeVisible()
   })
   ```

---

## Known Gotchas

### Voice Echo Prevention
**Problem:** AI voice output triggers its own microphone
**Solution:** 1000ms delay after speech before re-enabling listening
**Location:** `src/lib/openai-voice.ts:145`

### Tauri IPC Serialization
**Problem:** Complex objects don't serialize across Rust/JS boundary
**Solution:** Use simple types (primitives, arrays, plain objects)
**Example:**
```rust
// ✅ DO: Simple types
#[tauri::command]
fn get_data() -> Vec<String> { }

// ❌ DON'T: Complex types with methods
#[tauri::command]
fn get_service() -> Box<dyn Service> { }
```

### Next.js Server Components
**Problem:** Can't use browser APIs in Server Components
**Solution:** Use `'use client'` directive when needed
**Example:**
```typescript
// Client Component (needs browser APIs)
'use client'
import { useState } from 'react'

export function VoiceRecorder() {
  const [recording, setRecording] = useState(false)
  // Can use browser APIs here
}
```

---

## Getting Help

### Questions

- Check [docs/](docs/) first
- Search [GitHub Issues](https://github.com/yourusername/quetrex/issues)
- Open new issue with `question` label

### Bugs

- Check if already reported
- Include steps to reproduce
- Include environment (OS, versions, logs)
- Use `bug` label

### Feature Requests

- Check [roadmap](docs/roadmap/)
- Open issue with `enhancement` label
- Describe use case and value

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- No harassment or discrimination

---

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

**Thank you for contributing to Quetrex!**

Created by Glen Barnhardt with help from Claude Code
