# Sentra Testing Infrastructure

This directory contains all test files for the Sentra project. The testing infrastructure is built on **Vitest** with comprehensive coverage requirements.

## Directory Structure

```
tests/
├── unit/               # Unit tests (90%+ coverage for services/utils)
│   └── lib/           # Tests for src/lib utilities
├── integration/        # Integration tests (75%+ coverage)
├── e2e/               # End-to-end tests (Playwright)
├── setup/             # Test configuration and setup files
│   └── vitest.setup.ts
└── README.md          # This file
```

## Coverage Requirements

Per CLAUDE.md, the following coverage thresholds are **enforced by CI/CD**:

- **Overall**: 75%+
- **Business Logic** (`src/services/`): 90%+
- **Utilities** (`src/utils/`): 90%+
- **UI Components**: 60%+

## Running Tests

### Unit & Integration Tests (Vitest)

```bash
# Watch mode (recommended during development)
npm test

# Run once
npm run test:run

# Run with coverage report
npm run test:coverage

# Run with UI (visual test runner)
npm run test:ui
```

### End-to-End Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

## Writing Tests

### Test Structure (AAA Pattern)

All tests must follow the **Arrange-Act-Assert** pattern:

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '@/lib/my-module'

describe('myFunction', () => {
  describe('feature description', () => {
    it('should do something specific', () => {
      // ARRANGE: Setup test data and dependencies
      const input = { foo: 'bar' }
      const expectedOutput = { foo: 'bar', processed: true }

      // ACT: Execute the function/behavior being tested
      const result = myFunction(input)

      // ASSERT: Verify the outcome
      expect(result).toEqual(expectedOutput)
    })
  })
})
```

### Unit Test Example

Unit tests focus on testing individual functions/modules in isolation:

```typescript
// tests/unit/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    // ARRANGE
    const classes = ['class1', 'class2']

    // ACT
    const result = cn(...classes)

    // ASSERT
    expect(result).toBe('class1 class2')
  })
})
```

### Component Test Example

Component tests use React Testing Library:

```typescript
// tests/unit/components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/Button'

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    // ARRANGE
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    // ACT
    await userEvent.click(screen.getByText('Click me'))

    // ASSERT
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

### Integration Test Example

Integration tests verify multiple modules working together:

```typescript
// tests/integration/auth-flow.test.ts
import { describe, it, expect } from 'vitest'
import { authService } from '@/services/auth'
import { userRepository } from '@/repositories/user'

describe('Authentication Flow', () => {
  it('should register and login user', async () => {
    // ARRANGE
    const userData = { email: 'test@example.com', password: 'Pass123!' }

    // ACT
    const user = await authService.register(userData)
    const session = await authService.login(userData)

    // ASSERT
    expect(user.email).toBe(userData.email)
    expect(session.token).toBeDefined()
  })
})
```

## Test-Driven Development (TDD)

**REQUIRED WORKFLOW** per CLAUDE.md:

1. **Write tests FIRST** (they should fail)
2. **Verify tests FAIL** (npm test)
3. **Write implementation** to make tests pass
4. **Verify tests PASS** (npm test)
5. **Refactor** as needed (tests still pass)

### Why TDD?

- Tests become the **specification** for behavior
- Prevents regression bugs
- Forces thinking about edge cases upfront
- Makes refactoring safe
- **Enforced by quality gate hooks**

## Mocking

### Mock Functions

```typescript
import { vi } from 'vitest'

const mockFn = vi.fn()
mockFn.mockReturnValue('mocked value')
mockFn.mockResolvedValue('async value')

expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
```

### Mock Modules

```typescript
import { vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mock' }),
}))
```

### Mock Tauri APIs

```typescript
import { vi } from 'vitest'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({ result: 'mock' }),
}))
```

## E2E Testing Requirements

Per CLAUDE.md, E2E tests are **REQUIRED** for:

1. **Critical user journeys**: signup, checkout, payment flows
2. **ALL visual state changes**: color, visibility, position, animation
3. **Multi-step interactions**: click → modal → action → result
4. **User-facing state transitions**: loading → success, enabled → disabled

### E2E Test Example

```typescript
// tests/e2e/voice-interaction.spec.ts
import { test, expect } from '@playwright/test'

test('voice recording workflow', async ({ page }) => {
  // Navigate to app
  await page.goto('/')

  // Start recording
  await page.click('[data-testid="voice-record-button"]')
  await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible()

  // Stop recording
  await page.click('[data-testid="voice-stop-button"]')
  await expect(page.locator('[data-testid="recording-indicator"]')).not.toBeVisible()

  // Verify transcription appears
  await expect(page.locator('[data-testid="transcription"]')).toBeVisible()
})
```

## Coverage Reports

After running `npm run test:coverage`, view the HTML report:

```bash
open coverage/index.html
```

The report shows:

- **Overall coverage** percentages
- **File-by-file** coverage breakdown
- **Line-by-line** highlighting of untested code
- **Branch coverage** for conditionals

## CI/CD Integration

The `.claude/hooks/quality-gate.sh` hook enforces:

1. **All tests must pass** before finishing
2. **Coverage must meet thresholds** (75% overall, 90% services/utils)
3. **TypeScript must compile** without errors
4. **ESLint must pass** (0 errors, 0 warnings)
5. **Build must succeed**

This is **UNBYPASSABLE** and prevents the "9-month bug pain" mentioned in CLAUDE.md.

## Troubleshooting

### Tests timeout

Increase timeout in `vitest.config.ts`:

```typescript
test: {
  testTimeout: 20000, // 20 seconds
}
```

### Module resolution errors

Check path aliases in `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### React component errors

Ensure setup file imports `@testing-library/jest-dom`:

```typescript
// tests/setup/vitest.setup.ts
import '@testing-library/jest-dom'
```

### Coverage not generated

Ensure `@vitest/coverage-v8` is installed:

```bash
npm install -D @vitest/coverage-v8
```

## Best Practices

1. **One assertion per test** (usually)
2. **Test behavior, not implementation** (avoid testing internal state)
3. **Use descriptive test names** (should read like documentation)
4. **Keep tests isolated** (no shared mutable state)
5. **Mock external dependencies** (APIs, file system, databases)
6. **Test edge cases** (null, undefined, empty arrays, etc.)
7. **Follow AAA pattern** (Arrange-Act-Assert)
8. **Write tests FIRST** (TDD)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

*Last updated: 2025-11-13*
