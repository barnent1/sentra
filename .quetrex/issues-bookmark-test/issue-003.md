---
title: "[BM-003] Setup Vitest + Playwright testing infrastructure"
labels: ["ai-feature", "bookmark-test", "p0", "foundation"]
---

## Description
Configure Vitest for unit/integration testing and Playwright for E2E testing with proper coverage thresholds.

## Acceptance Criteria
- [ ] Vitest installed and configured
- [ ] Playwright installed and configured
- [ ] Coverage thresholds set (75% overall, 90% services)
- [ ] Test scripts added to package.json
- [ ] Sample test runs successfully
- [ ] Coverage report generates correctly
- [ ] CI/CD compatible configuration

## Dependencies
- BM-001 (requires project structure)

## Blocks
All other issues (testing is required for all features)

## Files to Create/Modify
- `vitest.config.ts` - Vitest configuration with coverage
- `playwright.config.ts` - Playwright configuration
- `tests/setup.ts` - Global test setup
- `tests/e2e/setup.ts` - E2E test helpers
- `package.json` - Add test scripts

## Technical Context
**Vitest Configuration:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '.next/'],
      thresholds: {
        global: {
          lines: 75,
          functions: 75,
          branches: 75,
          statements: 75
        },
        'src/services/**/*.ts': {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90
        },
        'src/utils/**/*.ts': {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90
        }
      }
    }
  }
})
```

**Playwright Configuration:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Package.json Scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## E2E Test Requirements
Create sample E2E test to verify setup:
```typescript
// tests/e2e/sample.spec.ts
import { test, expect } from '@playwright/test'

test('homepage loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Bookmark Manager/)
})
```

## Estimated Complexity
**Medium** (4-6 hours)
- Vitest configuration
- Playwright configuration
- Coverage thresholds setup
- Sample tests
