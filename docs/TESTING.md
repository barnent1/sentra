# Sentra Testing Guide

**Comprehensive guide to testing in Sentra**

Last Updated: 2025-11-13 by Glen Barnhardt with help from Claude Code

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Test-Driven Development (TDD)](#test-driven-development-tdd)
- [Coverage Requirements](#coverage-requirements)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Rust Testing](#rust-testing)
- [Mock vs Real Mode](#mock-vs-real-mode)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

Sentra uses a comprehensive testing strategy with **mandatory coverage requirements** enforced by the 6-layer defense system.

### Testing Stack

- **Vitest** - Unit and integration tests
- **Playwright** - End-to-end tests
- **Testing Library** - React component tests
- **Coverage: V8** - Code coverage reporting
- **Cargo Test** - Rust tests for Tauri backend

### Why Testing Matters

From CLAUDE.md:

> The 9-month bug pain will NEVER happen again because:
> 1. Tests must be written FIRST (enforced by workflow)
> 2. Multi-agent review catches issues single agent misses
> 3. Stop hook prevents finishing until ALL checks pass
> 4. CI/CD enforces quality gates (cannot be bypassed)

**Result:** Bugs are caught before they're committed, not months later.

---

## Quick Start

### Running Tests

```bash
# Unit & Integration Tests (Vitest)
npm test                 # Watch mode (recommended for development)
npm test:run             # Run once
npm test:coverage        # Run with coverage report
npm run test:ui          # Visual test runner (Vitest UI)

# End-to-End Tests (Playwright)
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Run with Playwright UI
npm run test:e2e:debug   # Debug mode

# Rust Tests (Tauri Backend)
cd src-tauri
cargo test               # Run all Rust tests
cargo test --verbose     # With detailed output
```

### Pre-Commit Checks

Before committing, **always** run:

```bash
npm run type-check       # TypeScript compilation (0 errors required)
npm test:run             # All tests passing
npm test:coverage        # Coverage thresholds met
npm run lint             # ESLint (0 errors, 0 warnings)
npm run build            # Production build succeeds
```

**Note:** The Stop Hook (`quality-gate.sh`) runs these automatically and is **UNBYPASSABLE**.

---

## Test-Driven Development (TDD)

### The TDD Workflow (MANDATORY)

From CLAUDE.md:

> **For new features, use orchestrator agent**:
> 1. Orchestrator creates plan → gets user approval
> 2. Orchestrator spawns test-writer → writes tests FIRST
> 3. Orchestrator spawns implementation → makes tests pass
> 4. Orchestrator spawns code-reviewer → finds bugs
> 5. Orchestrator spawns test-runner → verifies all pass

**Manual TDD Workflow:**

1. **Write Test FIRST** (should fail)
   ```typescript
   describe('createSpec', () => {
     it('should create spec with version 1', async () => {
       const spec = await createSpec('# Feature X', 'project')
       expect(spec.version).toBe(1)
     })
   })
   ```

2. **Run Test** (verify it fails)
   ```bash
   npm test createSpec
   # Expected: FAIL (function doesn't exist yet)
   ```

3. **Write Minimal Implementation**
   ```typescript
   export async function createSpec(content: string, projectName: string) {
     return {
       id: crypto.randomUUID(),
       version: 1,
       content,
       projectName,
       createdAt: new Date(),
     }
   }
   ```

4. **Run Test Again** (verify it passes)
   ```bash
   npm test createSpec
   # Expected: PASS
   ```

5. **Refactor** (if needed)
   ```typescript
   // Improve code while keeping tests green
   ```

6. **Repeat** for next feature

### Why TDD Works

- **Tests become the specification** for behavior
- **Forces thinking about edge cases** upfront
- **Makes refactoring safe** (tests catch regressions)
- **Prevents "works on my machine"** syndrome
- **Enforced by quality hooks** (can't bypass)

---

## Coverage Requirements

### Mandatory Thresholds (Enforced by CI/CD)

From CLAUDE.md:

| Category | Threshold | Enforced By |
|----------|-----------|-------------|
| **Overall** | 75%+ | Stop Hook + CI/CD |
| **Business Logic** (`src/services/`) | 90%+ | Stop Hook + CI/CD |
| **Utilities** (`src/utils/`) | 90%+ | Stop Hook + CI/CD |
| **UI Components** | 60%+ | Stop Hook + CI/CD |

### Checking Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Report Shows

- **Overall coverage** percentages (statements, branches, functions, lines)
- **File-by-file** coverage breakdown
- **Line-by-line** highlighting of untested code (red)
- **Branch coverage** for conditionals (if/else, switch, ternary)

### What to Do If Coverage Fails

```bash
# Example failure:
ERROR: Coverage for services: 87.5% < threshold 90%

# 1. Find untested code
open coverage/index.html
# Look for red-highlighted lines

# 2. Add tests for uncovered code
# 3. Run coverage again
npm run test:coverage

# 4. Repeat until threshold met
```

---

## Unit Testing

### What to Unit Test

**Test individual functions/modules in isolation:**

- **Business logic** (services, utilities)
- **Pure functions** (same input = same output)
- **Edge cases** (null, undefined, empty arrays, boundary values)
- **Error handling** (throw errors, return error states)

### AAA Pattern (MANDATORY)

From CLAUDE.md:

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

**Always** structure tests as Arrange-Act-Assert.

### Unit Test Examples

#### Testing Utilities

```typescript
// tests/unit/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    // ARRANGE
    const classes = ['text-red-500', 'bg-blue-500']

    // ACT
    const result = cn(...classes)

    // ASSERT
    expect(result).toBe('text-red-500 bg-blue-500')
  })

  it('should handle conditional classes', () => {
    // ARRANGE
    const isActive = true

    // ACT
    const result = cn('base-class', isActive && 'active-class')

    // ASSERT
    expect(result).toBe('base-class active-class')
  })

  it('should filter out falsy values', () => {
    // ARRANGE
    const classes = ['class1', null, undefined, false, 'class2']

    // ACT
    const result = cn(...classes)

    // ASSERT
    expect(result).toBe('class1 class2')
  })
})
```

#### Testing Business Logic

```typescript
// tests/unit/lib/specs.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { SpecManager } from '@/lib/specs'

describe('SpecManager', () => {
  let specManager: SpecManager

  beforeEach(() => {
    specManager = new SpecManager()
  })

  describe('createSpec', () => {
    it('should create spec with version 1', async () => {
      // ARRANGE
      const content = '# Feature X'
      const projectName = 'test-project'

      // ACT
      const spec = await specManager.createSpec(content, projectName)

      // ASSERT
      expect(spec.version).toBe(1)
      expect(spec.id).toBeDefined()
      expect(spec.createdAt).toBeInstanceOf(Date)
    })

    it('should throw error if content is empty', async () => {
      // ARRANGE
      const content = ''
      const projectName = 'test-project'

      // ACT & ASSERT
      await expect(
        specManager.createSpec(content, projectName)
      ).rejects.toThrow('Content cannot be empty')
    })
  })

  describe('editSpec', () => {
    it('should increment version when editing', async () => {
      // ARRANGE
      const original = await specManager.createSpec('# Original', 'project')

      // ACT
      const edited = await specManager.editSpec(original.id, '# Edited')

      // ASSERT
      expect(edited.version).toBe(2)
      expect(edited.id).toBe(original.id)
      expect(edited.content).toBe('# Edited')
    })

    it('should preserve previous versions in history', async () => {
      // ARRANGE
      const original = await specManager.createSpec('# v1', 'project')
      await specManager.editSpec(original.id, '# v2')

      // ACT
      const history = await specManager.getHistory(original.id)

      // ASSERT
      expect(history).toHaveLength(2)
      expect(history[0].version).toBe(1)
      expect(history[1].version).toBe(2)
    })
  })
})
```

### Mocking

#### Mock Functions

```typescript
import { vi } from 'vitest'

// Create mock function
const mockFn = vi.fn()

// Set return value
mockFn.mockReturnValue('mocked value')

// Set async return value
mockFn.mockResolvedValue({ data: 'async value' })

// Set implementation
mockFn.mockImplementation((arg) => arg * 2)

// Assertions
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFn).toHaveBeenCalledTimes(3)
```

#### Mock Modules

```typescript
import { vi } from 'vitest'

// Mock entire module
vi.mock('@/lib/openai', () => ({
  transcribeAudio: vi.fn().mockResolvedValue('transcribed text'),
  synthesizeSpeech: vi.fn().mockResolvedValue(new Blob()),
}))

// Use in test
import { transcribeAudio } from '@/lib/openai'

it('should transcribe audio', async () => {
  const result = await transcribeAudio(audioBlob)
  expect(result).toBe('transcribed text')
  expect(transcribeAudio).toHaveBeenCalledWith(audioBlob)
})
```

#### Mock Tauri APIs

```typescript
import { vi } from 'vitest'

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({ success: true }),
}))

// Use in test
import { invoke } from '@tauri-apps/api/core'
import { getSpecs } from '@/lib/tauri'

it('should call Tauri command', async () => {
  const specs = await getSpecs()
  expect(invoke).toHaveBeenCalledWith('get_specs')
})
```

---

## Integration Testing

### What to Integration Test

**Test multiple modules working together:**

- **API routes** (request → handler → database → response)
- **Data flow** (component → hook → service → storage)
- **Authentication** (login → session → protected route)
- **File operations** (read → parse → validate → save)

### Integration Test Examples

#### Testing API Routes

```typescript
// tests/integration/api/specs.test.ts
import { describe, it, expect } from 'vitest'
import { POST, GET } from '@/app/api/specs/route'

describe('Specs API', () => {
  describe('POST /api/specs', () => {
    it('should create new spec', async () => {
      // ARRANGE
      const request = new Request('http://localhost:3000/api/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '# Feature X',
          projectName: 'test-project',
        }),
      })

      // ACT
      const response = await POST(request)
      const data = await response.json()

      // ASSERT
      expect(response.status).toBe(201)
      expect(data.spec.version).toBe(1)
      expect(data.spec.content).toBe('# Feature X')
    })

    it('should return 400 if content is missing', async () => {
      // ARRANGE
      const request = new Request('http://localhost:3000/api/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: 'test-project' }),
      })

      // ACT
      const response = await POST(request)

      // ASSERT
      expect(response.status).toBe(400)
    })
  })
})
```

#### Testing Data Flow

```typescript
// tests/integration/spec-workflow.test.ts
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpecViewer } from '@/components/SpecViewer'

describe('Spec Workflow Integration', () => {
  it('should create, edit, and view spec', async () => {
    // ARRANGE
    const user = userEvent.setup()
    render(<SpecViewer />)

    // ACT: Create spec
    await user.click(screen.getByRole('button', { name: /create spec/i }))
    await user.type(screen.getByRole('textbox'), '# Feature X')
    await user.click(screen.getByRole('button', { name: /save/i }))

    // ASSERT: Spec created
    await waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument()
    })

    // ACT: Edit spec
    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), '# Feature X Updated')
    await user.click(screen.getByRole('button', { name: /save/i }))

    // ASSERT: Version incremented
    await waitFor(() => {
      expect(screen.getByText('Version 2')).toBeInTheDocument()
      expect(screen.getByText('# Feature X Updated')).toBeInTheDocument()
    })
  })
})
```

---

## End-to-End Testing

### What Requires E2E Tests

From CLAUDE.md:

**E2E Tests Required For:**
1. **Critical user journeys** (signup, checkout, payment flows)
2. **ALL visual state changes** (color, visibility, position, animation)
3. **Multi-step interactions** (click → modal → action → result)
4. **User-facing state transitions** (loading → success, enabled → disabled)

### E2E Test Structure

```typescript
// tests/e2e/voice-conversation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Voice Conversation', () => {
  test('user can start and complete voice conversation', async ({ page }) => {
    // Navigate to app
    await page.goto('/')

    // Click "Chat with Architect" button
    await page.click('[data-testid="chat-button"]')

    // Verify chat modal opens
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click microphone button
    await page.click('[data-testid="mic-button"]')

    // Verify recording indicator appears (visual state change)
    const indicator = page.locator('[data-testid="recording-indicator"]')
    await expect(indicator).toBeVisible()
    await expect(indicator).toHaveCSS('background-color', 'rgb(239, 68, 68)') // red

    // Stop recording
    await page.click('[data-testid="mic-button"]')

    // Verify recording indicator disappears (visual state change)
    await expect(indicator).not.toBeVisible()

    // Verify loading state appears (state transition)
    await expect(page.getByText(/processing/i)).toBeVisible()

    // Wait for response
    await expect(page.getByText(/processing/i)).not.toBeVisible({ timeout: 10000 })

    // Verify transcript appears
    await expect(page.locator('[data-testid="transcript"]')).toBeVisible()
  })

  test('user can approve spec and trigger automation', async ({ page }) => {
    // Navigate to spec viewer
    await page.goto('/')
    await page.click('[data-testid="spec-viewer"]')

    // Verify spec is displayed
    await expect(page.getByRole('heading', { name: /feature x/i })).toBeVisible()

    // Click approve button
    await page.click('[data-testid="approve-button"]')

    // Verify confirmation modal (multi-step interaction)
    await expect(page.getByText(/create github issue/i)).toBeVisible()
    await page.click('[data-testid="confirm-approve"]')

    // Verify success state (state transition)
    await expect(page.getByText(/github issue created/i)).toBeVisible()
    await expect(page.getByText(/agent starting/i)).toBeVisible()
  })
})
```

### Visual Testing

```typescript
// tests/e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Visual Regression', () => {
  test('dashboard renders correctly', async ({ page }) => {
    await page.goto('/')

    // Take full page screenshot
    await expect(page).toHaveScreenshot('dashboard.png')
  })

  test('spec viewer renders markdown correctly', async ({ page }) => {
    await page.goto('/specs/test-spec')

    // Take screenshot of specific element
    const viewer = page.locator('[data-testid="spec-content"]')
    await expect(viewer).toHaveScreenshot('spec-viewer.png')
  })

  test('dark theme is applied correctly', async ({ page }) => {
    await page.goto('/')

    // Verify background color (visual state)
    const body = page.locator('body')
    await expect(body).toHaveCSS('background-color', 'rgb(10, 10, 20)')
  })
})
```

### E2E Best Practices

1. **Use data-testid** for selectors (stable, doesn't change with UI updates)
2. **Test user behavior** (click, type, navigate) not implementation
3. **Wait for state changes** (use `waitFor`, `expect(...).toBeVisible()`)
4. **Test both happy path and error cases**
5. **Keep tests independent** (each test should work in isolation)
6. **Use page objects** for complex flows (reduce duplication)

---

## Rust Testing

### Testing Tauri Commands

```rust
// src-tauri/src/commands.rs
#[cfg(test)]
mod tests {
    use super::*

    #[test]
    fn test_get_specs() {
        // Arrange
        let project_name = "test-project";

        // Act
        let result = get_specs(project_name.to_string());

        // Assert
        assert!(result.is_ok());
        let specs = result.unwrap();
        assert_eq!(specs.len(), 0); // No specs initially
    }

    #[test]
    fn test_save_spec() {
        // Arrange
        let content = "# Feature X";
        let project_name = "test-project";

        // Act
        let result = save_spec(content.to_string(), project_name.to_string());

        // Assert
        assert!(result.is_ok());
        let spec = result.unwrap();
        assert_eq!(spec.version, 1);
        assert_eq!(spec.content, content);
    }

    #[test]
    fn test_save_spec_empty_content() {
        // Arrange
        let content = "";
        let project_name = "test-project";

        // Act
        let result = save_spec(content.to_string(), project_name.to_string());

        // Assert
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Content cannot be empty");
    }
}
```

### Running Rust Tests

```bash
cd src-tauri

# Run all tests
cargo test

# Run specific test
cargo test test_save_spec

# Run with output
cargo test -- --nocapture

# Run with verbose logging
cargo test --verbose
```

---

## Mock vs Real Mode

### What is Mock Mode?

Sentra supports **mock mode** for development and testing without real API calls.

### Configuring Mock Mode

```typescript
// src/lib/tauri.ts
const MOCK_MODE = process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

export async function getSpecs(): Promise<Spec[]> {
  if (MOCK_MODE) {
    // Return mock data
    return [
      {
        id: 'spec-1',
        version: 1,
        content: '# Feature X',
        projectName: 'test-project',
        createdAt: new Date(),
      },
    ]
  }

  // Real Tauri command
  return invoke('get_specs')
}
```

### Using Mock Mode in Tests

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    env: {
      NODE_ENV: 'test', // Enables mock mode automatically
    },
  },
})
```

### When to Use Mock Mode

- **Unit tests** - Always use mocks (fast, isolated)
- **Integration tests** - Mix of mocks and real (test integration points)
- **E2E tests** - Mostly real (test actual user experience)
- **Development** - Optional (faster feedback loop)

---

## Best Practices

### General Testing Principles

1. **Write tests FIRST** (TDD mandatory)
2. **One assertion per test** (usually)
3. **Test behavior, not implementation**
4. **Keep tests isolated** (no shared mutable state)
5. **Use descriptive test names** (should read like documentation)
6. **Follow AAA pattern** (Arrange-Act-Assert)
7. **Mock external dependencies** (APIs, file system, databases)
8. **Test edge cases** (null, undefined, empty, boundary values)

### Naming Conventions

```typescript
// ✅ DO: Descriptive test names
it('should create spec with version 1 when content is provided')
it('should throw error when content is empty')
it('should increment version when editing existing spec')

// ❌ DON'T: Vague test names
it('works')
it('test 1')
it('spec creation')
```

### Test Organization

```typescript
// ✅ DO: Organize with describe blocks
describe('SpecManager', () => {
  describe('createSpec', () => {
    it('should create spec with version 1', () => {})
    it('should throw error if content is empty', () => {})
  })

  describe('editSpec', () => {
    it('should increment version', () => {})
    it('should preserve history', () => {})
  })
})

// ❌ DON'T: Flat structure
it('create spec version 1', () => {})
it('create spec empty error', () => {})
it('edit spec version increment', () => {})
it('edit spec history', () => {})
```

### Setup and Teardown

```typescript
import { beforeEach, afterEach, describe, it, expect } from 'vitest'

describe('SpecManager', () => {
  let specManager: SpecManager

  beforeEach(() => {
    // Setup runs before EACH test
    specManager = new SpecManager()
  })

  afterEach(async () => {
    // Cleanup runs after EACH test
    await specManager.cleanup()
  })

  it('should create spec', async () => {
    const spec = await specManager.createSpec('# Feature X', 'project')
    expect(spec.version).toBe(1)
  })
})
```

---

## Troubleshooting

### Tests Timeout

**Problem:** Tests hang or timeout

**Solution:**
```typescript
// Increase timeout in test
it('should complete async operation', async () => {
  // ...
}, { timeout: 10000 }) // 10 seconds

// Or in vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 20000, // 20 seconds for all tests
  },
})
```

### Module Resolution Errors

**Problem:** Cannot find module '@/...'

**Solution:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // ...
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### React Component Errors

**Problem:** toBeInTheDocument is not a function

**Solution:**
```typescript
// tests/setup/vitest.setup.ts
import '@testing-library/jest-dom'

// Now matchers like toBeInTheDocument work
expect(element).toBeInTheDocument()
```

### Coverage Not Generated

**Problem:** npm run test:coverage doesn't generate coverage

**Solution:**
```bash
# Install coverage package
npm install -D @vitest/coverage-v8

# Update package.json
"scripts": {
  "test:coverage": "vitest run --coverage"
}
```

### Playwright Tests Fail

**Problem:** E2E tests fail in CI but pass locally

**Solution:**
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    headless: true, // Run headless in CI
    screenshot: 'only-on-failure', // Debug failures
    video: 'retain-on-failure', // Debug failures
  },
})
```

---

## Additional Resources

### Official Documentation

- **[Vitest](https://vitest.dev/)** - Unit testing framework
- **[Playwright](https://playwright.dev/)** - E2E testing
- **[Testing Library](https://testing-library.com/)** - React testing utilities
- **[Jest DOM](https://github.com/testing-library/jest-dom)** - Custom matchers

### Sentra-Specific

- **[Contributing Guide](../CONTRIBUTING.md)** - Development standards
- **[CLAUDE.md](../CLAUDE.md)** - Project context and standards
- **[tests/README.md](../tests/README.md)** - Test infrastructure overview

### Testing Best Practices

- **[Kent C. Dodds - Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)**
- **[Martin Fowler - Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html)**
- **[TDD by Example](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)**

---

**Questions?** Open a [GitHub Issue](https://github.com/barnent1/sentra/issues) with the `testing` label.

**Found a bug in tests?** Please report it - tests should never lie!

---

*Last Updated: 2025-11-13*
*Maintained by: Glen Barnhardt with help from Claude Code*
