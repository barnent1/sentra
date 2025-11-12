# Zero Bugs in Production: Bulletproof Testing & Quality Gates

**Mission:** Make it IMPOSSIBLE to ship broken code to production.

**Last Updated:** November 12, 2025
**Project:** Sentra - AI Agent Control Center
**Author:** Glen Barnhardt (with Claude Code)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Multi-Stage Testing Pyramid](#multi-stage-testing-pyramid)
3. [Git Hook Strategies](#git-hook-strategies)
4. [CI/CD Quality Gates](#cicd-quality-gates)
5. [Static Analysis](#static-analysis)
6. [Testing Frameworks Best Practices](#testing-frameworks-best-practices)
7. [Automated Code Review](#automated-code-review)
8. [Build Verification](#build-verification)
9. [Agent-Specific Testing](#agent-specific-testing)
10. [Industry Standards & Real Numbers](#industry-standards--real-numbers)
11. [Actionable Implementation Roadmap](#actionable-implementation-roadmap)

---

## Executive Summary

Based on research from industry leaders (Meta, Netflix, Google) and testing experts (Kent C. Dodds, Martin Fowler), this document provides **actionable configurations** to prevent bugs from reaching production.

### Key Insight: The Testing Trophy

Kent C. Dodds' philosophy: **"Write tests. Not too many. Mostly integration."**

The Testing Trophy prioritizes:
1. **Static** (TypeScript, ESLint, Prettier) - Catch typos and type errors as you write
2. **Unit** - Verify individual, isolated parts work as expected
3. **Integration** - Verify several units work together (BIGGEST ROI)
4. **E2E** - A helper robot that behaves like a user

### Critical Numbers from Google:
- **60%** coverage = Acceptable
- **75%** coverage = Commendable
- **80-90%** coverage = Strong (industry standard)
- **90%+** coverage = Exemplary

### Meta's Approach:
- Developers own code quality (no QA silos)
- Multi-stage deployment: Employees → 2% production → 100%
- Automated testing with Sapienz (75% actionable bug reports)

### Netflix's Approach:
- Unit, integration, and smoke tests in CI/CD
- Automated canary analysis
- Microservice architecture enables independent testing
- Spinnaker for continuous delivery

---

## Multi-Stage Testing Pyramid

### 1. Static Testing (Foundation - FASTEST)

**Purpose:** Catch errors before runtime without executing code.

**Tools & Configuration:**

#### TypeScript Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,

    // Additional strict checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Block on:** Any TypeScript compilation errors

#### ESLint Strict Configuration
```javascript
// eslint.config.mjs (Modern flat config)
import eslint from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import typescriptPlugin from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      // Next.js Core Web Vitals rules
      ...nextPlugin.configs['core-web-vitals'].rules,

      // TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // React strict rules
      'react/prop-types': 'off', // TypeScript handles this
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // Code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'no-implicit-coercion': 'error'
    }
  }
]
```

**Block on:** Any ESLint errors (warnings should be reviewed)

#### Prettier Configuration
```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Block on:** Formatting violations (automated fix in pre-commit)

### 2. Unit Tests (Second Layer)

**Purpose:** Test individual functions/components in isolation.

**Coverage Target:** 70-80% for utility functions and business logic

**Tools:** Jest + React Testing Library

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

**Block on:**
- Any failing tests
- Coverage below 70% on changed files
- Regression in coverage percentage

### 3. Integration Tests (BIGGEST ROI - Kent C. Dodds)

**Purpose:** Test multiple units working together, closer to user behavior.

**Coverage Target:** 80-90% of critical user flows

**Tools:** Jest + React Testing Library + MSW (Mock Service Worker)

**Best Practices:**
- Use `getByRole` as default query (accessibility-first)
- Test user behavior, not implementation details
- Mock network requests with MSW
- Use `userEvent` for realistic interactions

```typescript
// Example: User-centric integration test
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentDashboard } from '@/components/AgentDashboard'

describe('AgentDashboard', () => {
  it('allows user to create and start an agent', async () => {
    const user = userEvent.setup()
    render(<AgentDashboard />)

    // Find elements by role (accessible)
    const createButton = screen.getByRole('button', { name: /create agent/i })
    await user.click(createButton)

    // Fill form
    const nameInput = screen.getByRole('textbox', { name: /agent name/i })
    await user.type(nameInput, 'Test Agent')

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    // Verify outcome
    expect(await screen.findByText('Test Agent')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start/i })).toBeEnabled()
  })
})
```

**Block on:**
- Any failing integration tests
- Critical user flows not covered

### 4. E2E Tests (Top of Pyramid)

**Purpose:** Test entire application flow as a real user would.

**Coverage Target:** 20-30% of critical paths (expensive to maintain)

**Tools:** Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Block on:**
- Any failing E2E tests on critical paths
- Smoke tests must pass before deployment

### 5. Visual Regression Tests

**Purpose:** Catch unintended UI changes.

**Tools:** Playwright + Percy/Chromatic

**Percy Configuration:**
```javascript
// .percy.yml
version: 2
static:
  include: '*.html'
snapshot:
  widths: [375, 768, 1280]
  min-height: 1024
  percy-css: |
    /* Hide dynamic content */
    [data-testid="timestamp"] { visibility: hidden; }
```

**Chromatic Configuration (Storybook):**
```javascript
// .storybook/main.js
module.exports = {
  addons: ['@storybook/addon-essentials'],
  features: {
    buildStoriesJson: true,
  },
}
```

**Block on:** Visual diffs on UI components (requires manual approval)

### 6. Performance Tests

**Purpose:** Ensure performance doesn't regress.

**Tools:** Lighthouse CI

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
```

**Block on:**
- Performance score below 90
- LCP > 2.5s
- CLS > 0.1
- TBT > 300ms

### 7. Security Tests

**Purpose:** Catch vulnerabilities before deployment.

**Tools:** Snyk + npm audit

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run npm audit
        run: npm audit --audit-level=high
```

**Block on:**
- High or critical vulnerabilities in production dependencies
- Medium vulnerabilities should be reviewed

---

## Git Hook Strategies

### Critical Truth: Git Hooks CAN Be Bypassed

**Reality:** Developers can use `git commit --no-verify` to bypass any local hooks.

**Solution:** Enforce quality at the CI/CD level, use pre-commit hooks for fast feedback only.

### Pre-Commit Hook (Fast Checks)

**Purpose:** Catch obvious issues before committing.

**Tools:** Husky + lint-staged

```bash
# Install
npm install --save-dev husky lint-staged
npx husky init
```

```javascript
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "tsc-files --noEmit"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

**Checks:**
- ESLint (auto-fix)
- Prettier (auto-format)
- TypeScript type checking (staged files only)
- **Time limit:** < 10 seconds

**DO NOT run in pre-commit:**
- Full test suite (too slow)
- E2E tests (way too slow)
- Build process (too slow)

### Commit Message Validation

**Purpose:** Enforce conventional commits for automated changelog.

**Tools:** commitlint

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Formatting
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvement
        'test',     // Adding tests
        'chore',    // Maintenance
        'ci',       // CI/CD changes
        'revert',   // Revert previous commit
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'never', ['upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
}
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit $1
```

**Block on:** Invalid commit message format

### Pre-Push Hook (Heavier Checks)

**Purpose:** Run tests before pushing to remote.

```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run tests on changed files
npm test -- --changedSince=main --passWithNoTests

# Check for circular dependencies
npx dpdm src/index.ts --exit-code circular:1

# Check type coverage
npx type-coverage --at-least 90
```

**Checks:**
- Unit tests (changed files)
- Integration tests (changed files)
- Circular dependency detection
- Type coverage check
- **Time limit:** < 2 minutes

**DO NOT run in pre-push:**
- Full E2E test suite (save for CI)
- Visual regression tests (save for CI)

---

## CI/CD Quality Gates

### GitHub Actions Workflow (The REAL Enforcement)

This is where we **truly block** bad code. Local hooks are advisory; CI is mandatory.

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  static-analysis:
    name: Static Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript Check
        run: npx tsc --noEmit

      - name: ESLint
        run: npm run lint -- --max-warnings 0

      - name: Prettier Check
        run: npx prettier --check .

      - name: Check Type Coverage
        run: |
          npm install -g type-coverage
          type-coverage --at-least 90

  circular-dependencies:
    name: Circular Dependency Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Check Circular Dependencies
        run: npx dpdm src/index.ts --exit-code circular:1

  dead-code:
    name: Dead Code Detection
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Knip
        run: npm install -g knip

      - name: Detect Dead Code
        run: knip --no-exit-code || true
        # Note: Set --exit-code in strict mode

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Unit Tests
        run: npm test -- --coverage --watchAll=false

      - name: Coverage Check
        run: |
          npm test -- --coverage --coverageThreshold='{"global":{"branches":70,"functions":70,"lines":70,"statements":70}}'

      - name: Upload Coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Integration Tests
        run: npm test -- --testPathPattern=integration

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test

      - name: Upload Playwright Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: npm audit
        run: npm audit --audit-level=high

  bundle-size:
    name: Bundle Size Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Analyze bundle size
        uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}

  lighthouse:
    name: Lighthouse CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun

  build:
    name: Production Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build

      - name: Check build output
        run: |
          if [ ! -d ".next" ]; then
            echo "Build failed - .next directory not found"
            exit 1
          fi
```

### Branch Protection Rules (GitHub Settings)

**Navigate to:** Repository Settings → Branches → Add rule

**Required Configuration:**

```yaml
Branch name pattern: main

Protect matching branches:
  ✅ Require a pull request before merging
    ✅ Require approvals: 1
    ✅ Dismiss stale pull request approvals when new commits are pushed
    ✅ Require review from Code Owners

  ✅ Require status checks to pass before merging
    ✅ Require branches to be up to date before merging
    Required status checks:
      - static-analysis
      - unit-tests
      - integration-tests
      - e2e-tests
      - security-scan
      - build
      - lighthouse
      - bundle-size
      - circular-dependencies

  ✅ Require conversation resolution before merging

  ✅ Require linear history

  ✅ Include administrators (enforce on everyone)

  ❌ Allow force pushes (NEVER)

  ❌ Allow deletions (NEVER)
```

### CODEOWNERS File

**Purpose:** Require specific team members to review changes to critical files.

```bash
# .github/CODEOWNERS

# Default owner for everything
* @glen-barnhardt

# Infrastructure and CI/CD
/.github/workflows/ @glen-barnhardt @devops-team
/src-tauri/ @glen-barnhardt @rust-team

# Core application logic
/src/lib/ @glen-barnhardt @senior-devs

# Security-sensitive files
/src/lib/auth/ @glen-barnhardt @security-team

# API routes
/src/app/api/ @glen-barnhardt @backend-team

# Database migrations
/prisma/ @glen-barnhardt @database-team
```

**Enforcement:** Branch protection must enable "Require review from Code Owners"

---

## Static Analysis

### 1. Type Coverage Enforcement

**Tool:** type-coverage

```bash
npm install -g type-coverage
```

```json
// package.json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-coverage": "type-coverage --at-least 90 --strict"
  }
}
```

**Configuration:**
```json
// package.json
{
  "typeCoverage": {
    "atLeast": 90,
    "strict": true,
    "ignoreCatch": true,
    "ignoreFiles": [
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/*.d.ts"
    ]
  }
}
```

**Block on:** Type coverage below 90%

### 2. Unused Code Detection

**Tool:** Knip (recommended over ts-prune)

```bash
npm install -D knip
```

```json
// knip.json
{
  "entry": ["src/index.ts", "src/app/**/*.tsx"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
  "ignoreDependencies": [],
  "ignoreExportsUsedInFile": true,
  "ignoreUnusedExports": ["src/types/**"]
}
```

**Usage:**
```bash
npx knip --no-exit-code  # Report only
npx knip                 # Exit with code 1 if issues found
```

**Block on (CI):** Unused exports in critical files (configurable)

### 3. Circular Dependency Detection

**Tool:** dpdm (more accurate than madge for TS)

```bash
npm install -D dpdm
```

```json
// package.json
{
  "scripts": {
    "check-circular": "dpdm src/index.ts --exit-code circular:1"
  }
}
```

**Block on:** Any circular dependencies

### 4. Import Organization

**Tool:** eslint-plugin-import

```bash
npm install -D eslint-plugin-import
```

```javascript
// eslint.config.mjs
{
  plugins: ['import'],
  rules: {
    'import/no-cycle': 'error',
    'import/no-duplicates': 'error',
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
      'alphabetize': {
        'order': 'asc',
        'caseInsensitive': true
      }
    }]
  }
}
```

---

## Testing Frameworks Best Practices

### Jest Configuration for Next.js

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/app/layout.tsx',
    '!src/app/**/layout.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/lib/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  maxWorkers: '50%',
  testTimeout: 10000,
}

module.exports = createJestConfig(customJestConfig)
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock Tauri API
jest.mock('@tauri-apps/api', () => ({
  invoke: jest.fn(),
}))
```

### React Testing Library Best Practices

**Query Priority (Accessibility-First):**

1. `getByRole` (PREFERRED)
2. `getByLabelText` (forms)
3. `getByPlaceholderText` (if no label)
4. `getByText` (non-interactive content)
5. `getByDisplayValue` (current input value)
6. `getByAltText` (images)
7. `getByTitle` (last resort)
8. `getByTestId` (LAST RESORT ONLY)

**Example Test:**

```typescript
// src/components/AgentCard/__tests__/AgentCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentCard } from '../AgentCard'

describe('AgentCard', () => {
  const mockAgent = {
    id: '1',
    name: 'Test Agent',
    status: 'idle',
  }

  it('renders agent information', () => {
    render(<AgentCard agent={mockAgent} />)

    // Use getByRole for accessible elements
    expect(screen.getByRole('heading', { name: /test agent/i })).toBeInTheDocument()
    expect(screen.getByText(/idle/i)).toBeInTheDocument()
  })

  it('starts agent when start button is clicked', async () => {
    const user = userEvent.setup()
    const onStart = jest.fn()

    render(<AgentCard agent={mockAgent} onStart={onStart} />)

    const startButton = screen.getByRole('button', { name: /start/i })
    await user.click(startButton)

    expect(onStart).toHaveBeenCalledWith(mockAgent.id)
  })

  it('disables start button when agent is running', () => {
    render(<AgentCard agent={{ ...mockAgent, status: 'running' }} />)

    const startButton = screen.getByRole('button', { name: /start/i })
    expect(startButton).toBeDisabled()
  })
})
```

### Playwright Best Practices

**Page Object Model:**

```typescript
// e2e/pages/AgentDashboard.page.ts
import { Page, Locator } from '@playwright/test'

export class AgentDashboardPage {
  readonly page: Page
  readonly createAgentButton: Locator
  readonly agentList: Locator

  constructor(page: Page) {
    this.page = page
    this.createAgentButton = page.getByRole('button', { name: /create agent/i })
    this.agentList = page.getByRole('list', { name: /agents/i })
  }

  async goto() {
    await this.page.goto('/dashboard')
  }

  async createAgent(name: string) {
    await this.createAgentButton.click()
    await this.page.getByRole('textbox', { name: /name/i }).fill(name)
    await this.page.getByRole('button', { name: /submit/i }).click()
  }

  async getAgentByName(name: string): Promise<Locator> {
    return this.agentList.getByText(name)
  }
}
```

**Test Example:**

```typescript
// e2e/agent-dashboard.spec.ts
import { test, expect } from '@playwright/test'
import { AgentDashboardPage } from './pages/AgentDashboard.page'

test.describe('Agent Dashboard', () => {
  test('user can create and manage agents', async ({ page }) => {
    const dashboard = new AgentDashboardPage(page)
    await dashboard.goto()

    // Create agent
    await dashboard.createAgent('E2E Test Agent')

    // Verify agent appears
    const agent = await dashboard.getAgentByName('E2E Test Agent')
    await expect(agent).toBeVisible()

    // Start agent
    await page.getByRole('button', { name: /start/i }).first().click()
    await expect(page.getByText(/running/i)).toBeVisible()
  })
})
```

### Mutation Testing with Stryker

**Purpose:** Test the quality of your tests by introducing bugs.

```bash
npm install -D @stryker-mutator/core @stryker-mutator/jest-runner @stryker-mutator/typescript-checker
```

```javascript
// stryker.conf.json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "testRunner": "jest",
  "checkers": ["typescript"],
  "mutate": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}"
  ],
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  },
  "incremental": true,
  "incrementalFile": ".stryker-tmp/incremental.json"
}
```

**Usage:**
```bash
npx stryker run  # Weekly or before major releases
```

**Target:** 80%+ mutation score on critical code

---

## Automated Code Review

### Danger.js

**Purpose:** Automate code review chores.

```bash
npm install -D danger
```

```typescript
// dangerfile.ts
import { danger, warn, fail, message } from 'danger'

const pr = danger.github.pr
const modified = danger.git.modified_files
const created = danger.git.created_files
const allFiles = [...modified, ...created]

// 1. PR Size Check
const bigPRThreshold = 400
const additions = pr.additions || 0
const deletions = pr.deletions || 0
const changedLines = additions + deletions

if (changedLines > bigPRThreshold) {
  warn(`This PR is quite large (${changedLines} lines changed). Consider breaking it into smaller PRs.`)
}

// 2. PR Description Check
if (pr.body.length < 10) {
  fail('Please add a description to your PR.')
}

// 3. Test Coverage Check
const hasChangedSrcFiles = allFiles.some(f => f.startsWith('src/') && !f.includes('.test.'))
const hasChangedTestFiles = allFiles.some(f => f.includes('.test.') || f.includes('.spec.'))

if (hasChangedSrcFiles && !hasChangedTestFiles) {
  warn('Source files changed but no test files updated. Consider adding tests.')
}

// 4. Package.json Change Check
const hasPackageJsonChanges = allFiles.includes('package.json')
const hasLockfileChanges = allFiles.includes('package-lock.json')

if (hasPackageJsonChanges && !hasLockfileChanges) {
  fail('package.json changed but package-lock.json was not updated.')
}

// 5. Migration Files Check
const hasMigrations = allFiles.some(f => f.includes('migrations/'))
if (hasMigrations) {
  warn('This PR includes database migrations. Ensure backward compatibility.')
}

// 6. Console.log Check
allFiles
  .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
  .forEach(async file => {
    const content = await danger.github.utils.fileContents(file)
    if (content.includes('console.log(')) {
      warn(`${file} contains console.log statements. Consider removing them or using a proper logger.`)
    }
  })

// 7. TODO Check
allFiles.forEach(async file => {
  const content = await danger.github.utils.fileContents(file)
  const todoCount = (content.match(/TODO:/g) || []).length
  if (todoCount > 0) {
    message(`${file} has ${todoCount} TODO comment(s). Consider creating issues for them.`)
  }
})

// 8. Changelog Check
const hasChangelog = allFiles.includes('CHANGELOG.md')
if (!hasChangelog && changedLines > 20) {
  warn('Consider updating CHANGELOG.md for this PR.')
}
```

**GitHub Actions Integration:**

```yaml
# .github/workflows/danger.yml
name: Danger

on: [pull_request]

jobs:
  danger:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run danger ci
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Build Verification

### 1. Bundle Size Limits

**Tool:** size-limit

```bash
npm install -D @size-limit/preset-next
```

```json
// .size-limit.json
[
  {
    "name": "Main bundle",
    "path": ".next/static/**/*.js",
    "limit": "250 KB"
  },
  {
    "name": "First Load JS",
    "path": ".next/static/chunks/pages/_app-*.js",
    "limit": "150 KB"
  }
]
```

```json
// package.json
{
  "scripts": {
    "size": "size-limit",
    "size:why": "size-limit --why"
  }
}
```

**Block on:** Bundle size exceeds limit

### 2. Next.js Bundle Analyzer

```bash
npm install -D @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... your next config
})
```

**Usage:**
```bash
ANALYZE=true npm run build
```

### 3. Type Checking in Build

```json
// next.config.js
module.exports = {
  typescript: {
    // ❌ DO NOT use ignoreBuildErrors: true in production
    ignoreBuildErrors: false,
  },
  eslint: {
    // ❌ DO NOT use ignoreDuringBuilds: true in production
    ignoreDuringBuilds: false,
  },
}
```

**Block on:** TypeScript or ESLint errors during build

---

## Agent-Specific Testing

### Challenge: How to Test AI-Generated Code?

AI agents can introduce bugs through:
- Inconsistent code style
- Missing edge cases
- Incorrect assumptions
- Broken dependencies

### Solution: Multi-Layer Verification

#### 1. Pre-Generation Schema Validation

```typescript
// src/lib/agent/validators.ts
import { z } from 'zod'

const CodeChangeSchema = z.object({
  filePath: z.string().regex(/^src\//),
  operation: z.enum(['create', 'update', 'delete']),
  content: z.string().min(1),
  testPath: z.string().regex(/\.test\.(ts|tsx)$/),
  testContent: z.string().min(1),
})

export function validateCodeChange(change: unknown) {
  return CodeChangeSchema.parse(change)
}
```

#### 2. Post-Generation Verification Pipeline

```typescript
// src/lib/agent/verification.ts
export async function verifyAgentOutput(change: CodeChange): Promise<VerificationResult> {
  const checks = [
    verifyTypeScriptCompiles,
    verifyLintPasses,
    verifyTestsExist,
    verifyTestsPass,
    verifyNoBannedPatterns,
  ]

  const results = await Promise.all(
    checks.map(check => check(change))
  )

  return {
    passed: results.every(r => r.passed),
    failures: results.filter(r => !r.passed),
  }
}
```

#### 3. Agent Test Harness

```typescript
// src/lib/agent/__tests__/agent-harness.test.ts
import { AgentRunner } from '../AgentRunner'

describe('Agent Code Generation', () => {
  it('generates valid TypeScript', async () => {
    const agent = new AgentRunner()
    const result = await agent.generateComponent('TestComponent')

    // Verify syntax
    expect(() => parseTypeScript(result.code)).not.toThrow()

    // Verify types
    expect(result.code).toInclude('export')
    expect(result.code).toInclude('function TestComponent')
  })

  it('generates corresponding tests', async () => {
    const agent = new AgentRunner()
    const result = await agent.generateComponent('TestComponent')

    expect(result.testCode).toBeDefined()
    expect(result.testCode).toInclude('describe')
    expect(result.testCode).toInclude('it')
  })

  it('generated code passes all checks', async () => {
    const agent = new AgentRunner()
    const result = await agent.generateComponent('TestComponent')

    const verification = await verifyAgentOutput(result)
    expect(verification.passed).toBe(true)
  })
})
```

#### 4. Red-Green-Refactor with Agents

```typescript
// Agent workflow
async function agentWorkflow(feature: FeatureSpec) {
  // 1. RED: Generate failing test first
  const test = await agent.generateTest(feature)
  await runTests(test) // Should fail

  // 2. GREEN: Generate implementation
  const implementation = await agent.generateImplementation(feature, test)
  await runTests(test) // Should pass

  // 3. REFACTOR: Let agent improve code
  const refactored = await agent.refactor(implementation)
  await runTests(test) // Should still pass

  return { test, implementation: refactored }
}
```

#### 5. Banned Patterns for AI Code

```typescript
// .eslintrc.js
module.exports = {
  rules: {
    // Ban console.log (agents love to add them)
    'no-console': ['error', { allow: ['warn', 'error'] }],

    // Ban any types (agents sometimes use them)
    '@typescript-eslint/no-explicit-any': 'error',

    // Ban TODO comments without issue numbers
    'no-warning-comments': ['error', {
      terms: ['todo', 'fixme'],
      location: 'start'
    }],
  }
}
```

---

## Industry Standards & Real Numbers

### Coverage Requirements by Component Type

| Component Type | Coverage Target | Reasoning |
|---------------|-----------------|-----------|
| Utility Functions | 90-100% | Pure logic, easy to test |
| Business Logic | 80-90% | Critical for app function |
| React Components | 70-80% | Balance testing value and effort |
| API Routes | 85-95% | External contracts |
| Type Definitions | 95-100% | Foundation of type safety |
| UI Components | 60-70% | Visual, harder to unit test |
| E2E Critical Paths | 100% | Must never break |

### Google's Testing Metrics

From Google Testing Blog:
- **60%** = Acceptable
- **75%** = Commendable
- **80-90%** = Strong
- **90%+** = Exemplary

Industry average across 47 projects: **74-76%** coverage

### Test Speed Targets

| Test Type | Max Duration | Why |
|-----------|-------------|-----|
| Unit Tests | < 1 second per test | Fast feedback loop |
| Integration Tests | < 5 seconds per test | Reasonable for I/O |
| E2E Tests | < 30 seconds per test | Allow for browser startup |
| Full Test Suite | < 10 minutes | Maintain developer flow |
| Pre-commit Hooks | < 10 seconds | Don't block commits |
| Pre-push Hooks | < 2 minutes | Don't discourage pushes |

### Performance Budgets

Based on Core Web Vitals:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| FID | ≤ 100ms | 100ms - 300ms | > 300ms |
| CLS | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| TTFB | ≤ 800ms | 800ms - 1.8s | > 1.8s |
| TBT | ≤ 200ms | 200ms - 600ms | > 600ms |

**Block on:** Any metric in "Poor" range

### Bundle Size Limits

For Next.js apps:

| Bundle | Limit | Warning |
|--------|-------|---------|
| First Load JS | 100KB | 150KB |
| Total Bundle | 250KB | 400KB |
| Individual Page | 50KB | 100KB |
| Vendor Chunks | 150KB | 200KB |

### Security Vulnerability Response

| Severity | Max Time to Fix | Action |
|----------|----------------|--------|
| Critical | 24 hours | Immediate patch + deploy |
| High | 1 week | Scheduled patch |
| Medium | 1 month | Quarterly maintenance |
| Low | 3 months | Backlog |

---

## Actionable Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Day 1-2: Static Analysis**
- [ ] Enable TypeScript strict mode
- [ ] Configure ESLint with strict rules
- [ ] Add Prettier with auto-formatting
- [ ] Set up pre-commit hooks (Husky + lint-staged)
- [ ] Add commitlint for conventional commits

**Day 3-4: Testing Infrastructure**
- [ ] Install Jest + React Testing Library
- [ ] Configure test environment
- [ ] Write first 5 unit tests
- [ ] Set up coverage reporting
- [ ] Configure coverage thresholds (start at 50%)

**Day 5: CI/CD Setup**
- [ ] Create GitHub Actions workflow
- [ ] Add static analysis job
- [ ] Add unit test job
- [ ] Configure branch protection (require passing tests)

### Phase 2: Testing (Week 2)

**Day 1-2: Unit Tests**
- [ ] Write tests for utility functions (80%+ coverage)
- [ ] Write tests for business logic (70%+ coverage)
- [ ] Add test scripts to package.json

**Day 3-4: Integration Tests**
- [ ] Set up MSW for API mocking
- [ ] Write integration tests for critical flows
- [ ] Add integration test job to CI

**Day 5: E2E Setup**
- [ ] Install Playwright
- [ ] Configure Playwright
- [ ] Write first E2E test (critical path)
- [ ] Add E2E job to CI

### Phase 3: Quality Gates (Week 3)

**Day 1: Code Quality**
- [ ] Add type-coverage tool (90% target)
- [ ] Add knip for dead code detection
- [ ] Add dpdm for circular dependencies
- [ ] Add jobs to CI

**Day 2: Security**
- [ ] Set up Snyk account
- [ ] Configure Snyk scanning
- [ ] Add npm audit to CI
- [ ] Fix any high/critical vulnerabilities

**Day 3: Performance**
- [ ] Install Lighthouse CI
- [ ] Configure performance budgets
- [ ] Add bundle size monitoring
- [ ] Add jobs to CI

**Day 4: Code Review**
- [ ] Set up Danger.js
- [ ] Configure automated checks
- [ ] Create CODEOWNERS file
- [ ] Document review process

**Day 5: Documentation**
- [ ] Update README with testing instructions
- [ ] Document quality gate requirements
- [ ] Create troubleshooting guide

### Phase 4: Enforcement (Week 4)

**Day 1-2: Branch Protection**
- [ ] Enable all required status checks
- [ ] Require code owner reviews
- [ ] Disable force push
- [ ] Test with dummy PR

**Day 3: Visual Testing**
- [ ] Set up Percy or Chromatic
- [ ] Add visual regression tests
- [ ] Configure visual diff threshold
- [ ] Add to CI workflow

**Day 4: Advanced Testing**
- [ ] Set up mutation testing (Stryker)
- [ ] Run first mutation test
- [ ] Document mutation testing process
- [ ] Schedule weekly mutation runs

**Day 5: Polish**
- [ ] Increase coverage thresholds to target
- [ ] Fix any flaky tests
- [ ] Optimize test performance
- [ ] Team training session

### Phase 5: Continuous Improvement

**Ongoing:**
- [ ] Review and adjust coverage targets monthly
- [ ] Update ESLint rules as needed
- [ ] Refine Danger.js checks
- [ ] Monitor test suite performance
- [ ] Keep dependencies updated
- [ ] Run mutation tests weekly
- [ ] Review security scans daily
- [ ] Adjust performance budgets quarterly

---

## Quick Reference Checklist

### Before Every Commit
- [ ] Code compiles (TypeScript)
- [ ] Linting passes (ESLint)
- [ ] Formatting applied (Prettier)
- [ ] Tests pass locally
- [ ] No console.log statements
- [ ] Conventional commit message

### Before Every PR
- [ ] All tests pass
- [ ] Coverage doesn't decrease
- [ ] No new TypeScript errors
- [ ] PR description filled out
- [ ] Tests for new features
- [ ] Documentation updated
- [ ] No security vulnerabilities

### Before Every Merge
- [ ] All CI checks pass
- [ ] Code review approved
- [ ] Conflicts resolved
- [ ] Branch up to date with main
- [ ] Performance budgets met
- [ ] Bundle size within limits

### Before Every Release
- [ ] Full test suite passes
- [ ] E2E tests pass
- [ ] Security scan clean
- [ ] Performance benchmarks met
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Mutation test score > 80%

---

## Tools Summary

### Essential (Must Have)
- **TypeScript** - Type safety
- **ESLint** - Code quality
- **Prettier** - Formatting
- **Husky** - Git hooks
- **Jest** - Unit/integration testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **GitHub Actions** - CI/CD

### Highly Recommended
- **type-coverage** - Type coverage
- **dpdm** - Circular dependencies
- **knip** - Dead code detection
- **Snyk** - Security scanning
- **Danger.js** - Automated code review
- **commitlint** - Commit messages
- **Lighthouse CI** - Performance
- **size-limit** - Bundle size

### Advanced (Nice to Have)
- **Stryker** - Mutation testing
- **Percy/Chromatic** - Visual regression
- **SonarQube** - Code quality platform
- **Codecov** - Coverage reporting
- **Sentry** - Error tracking
- **Pact** - Contract testing (microservices)

---

## Configuration Files Reference

All configuration files mentioned in this document:

```
project/
├── .github/
│   ├── workflows/
│   │   ├── quality-gates.yml
│   │   ├── danger.yml
│   │   └── security.yml
│   └── CODEOWNERS
├── .husky/
│   ├── pre-commit
│   ├── commit-msg
│   └── pre-push
├── e2e/
│   └── *.spec.ts
├── src/
│   └── **/*.test.{ts,tsx}
├── .eslintrc.js (or eslint.config.mjs)
├── .prettierrc
├── .size-limit.json
├── commitlint.config.js
├── dangerfile.ts
├── jest.config.js
├── jest.setup.js
├── knip.json
├── lighthouserc.js
├── playwright.config.ts
├── stryker.conf.json
└── tsconfig.json
```

---

## Final Thoughts

**The Goal:** Not 100% coverage. The goal is **confidence**.

You want to be confident that:
1. Your code works as expected
2. Changes don't break existing functionality
3. Performance doesn't degrade
4. Security vulnerabilities are caught
5. Code quality remains high
6. Team velocity stays high

**Balance is Key:**
- Too few tests = bugs in production
- Too many tests = slow development
- Focus on **integration tests** for best ROI
- Use **E2E tests** for critical paths only
- **Static analysis** catches 80% of issues for free

**Remember Meta's Philosophy:**
Developers own quality. There is no separate QA team catching bugs. You catch your own bugs through:
1. Fast feedback (git hooks)
2. Automated testing (CI/CD)
3. Code review (human + automated)
4. Production monitoring

**Start small, iterate, improve.**

Don't try to implement everything at once. Start with Phase 1, get it working, then move to Phase 2. Each phase adds value independently.

---

**Next Steps:**
1. Review this document with your team
2. Prioritize which phases to implement first
3. Set up tracking/metrics for quality improvements
4. Start with Phase 1 tomorrow
5. Iterate and improve every sprint

**Zero bugs is not a dream. It's a process.**
