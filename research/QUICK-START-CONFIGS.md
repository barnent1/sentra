# Quick Start: Copy-Paste Configurations

**Ready-to-use configurations for zero-bug setup**

All configurations below are production-ready. Copy, paste, and adjust as needed.

---

## Package.json Dependencies

```bash
# Static Analysis & Linting
npm install -D \
  eslint \
  @eslint/js \
  @next/eslint-plugin-next \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-import \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  prettier \
  eslint-config-prettier

# Git Hooks
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional

# Testing
npm install -D \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  @playwright/test

# Type Coverage & Dead Code
npm install -D type-coverage knip dpdm

# Security
npm install -D snyk

# Bundle Size & Performance
npm install -D @next/bundle-analyzer @size-limit/preset-next @lhci/cli

# Code Review
npm install -D danger

# Advanced (Optional)
npm install -D @stryker-mutator/core @stryker-mutator/jest-runner @stryker-mutator/typescript-checker
```

---

## 1. TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    },

    // Strict Type Checking
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,

    // Additional Checks
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
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 2. ESLint Configuration (Flat Config)

```javascript
// eslint.config.mjs
import eslint from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import typescriptPlugin from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
      'import': importPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Next.js Core Web Vitals
      ...nextPlugin.configs['core-web-vitals'].rules,

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // React
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // Import
      'import/no-cycle': 'error',
      'import/no-duplicates': 'error',
      'import/order': ['error', {
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        'alphabetize': { 'order': 'asc', 'caseInsensitive': true },
      }],

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
    ],
  },
]
```

---

## 3. Prettier Configuration

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

```
// .prettierignore
node_modules
.next
out
dist
build
coverage
*.log
.DS_Store
```

---

## 4. Git Hooks Setup

```bash
# Initialize Husky
npx husky init
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit $1
```

```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run tests on changed files
npm test -- --changedSince=main --passWithNoTests --bail

# Check for circular dependencies
npx dpdm src/app/page.tsx --exit-code circular:1 || echo "Warning: Circular dependencies detected"
```

---

## 5. Lint-Staged Configuration

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

---

## 6. Commitlint Configuration

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'revert',
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

---

## 7. Jest Configuration

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
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/app/layout.tsx',
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
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  maxWorkers: '50%',
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
      back: jest.fn(),
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

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
}
```

---

## 8. Playwright Configuration

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
  timeout: 30000,

  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
    timeout: 120000,
  },
})
```

---

## 9. Type Coverage Configuration

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
  },
  "scripts": {
    "type-coverage": "type-coverage --at-least 90"
  }
}
```

---

## 10. Dead Code Detection (Knip)

```json
// knip.json
{
  "entry": ["src/app/page.tsx"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": [
    "**/*.test.{ts,tsx}",
    "**/*.spec.{ts,tsx}"
  ],
  "ignoreDependencies": [],
  "ignoreExportsUsedInFile": true
}
```

---

## 11. Bundle Size Limits

```json
// .size-limit.json
[
  {
    "name": "Total bundle",
    "path": ".next/static/**/*.js",
    "limit": "250 KB"
  },
  {
    "name": "Main page",
    "path": ".next/static/chunks/pages/index*.js",
    "limit": "100 KB"
  }
]
```

```json
// package.json scripts
{
  "scripts": {
    "size": "size-limit",
    "size:why": "size-limit --why"
  }
}
```

---

## 12. Lighthouse CI Configuration

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
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
```

---

## 13. Danger.js Configuration

```typescript
// dangerfile.ts
import { danger, warn, fail, message } from 'danger'

const pr = danger.github.pr
const modified = danger.git.modified_files
const created = danger.git.created_files
const allFiles = [...modified, ...created]

// PR Size Check
const changedLines = (pr.additions || 0) + (pr.deletions || 0)
if (changedLines > 400) {
  warn(`Large PR (${changedLines} lines). Consider breaking it up.`)
}

// PR Description
if (pr.body.length < 10) {
  fail('Please add a description to your PR.')
}

// Test Coverage
const hasSourceChanges = allFiles.some(f => f.startsWith('src/') && !f.includes('.test.'))
const hasTestChanges = allFiles.some(f => f.includes('.test.') || f.includes('.spec.'))

if (hasSourceChanges && !hasTestChanges) {
  warn('Source files changed but no tests updated.')
}

// Package Changes
if (allFiles.includes('package.json') && !allFiles.includes('package-lock.json')) {
  fail('package.json changed but package-lock.json not updated.')
}

// Console Statements
const tsFiles = allFiles.filter(f => f.match(/\.(ts|tsx)$/))
for (const file of tsFiles) {
  const content = await danger.github.utils.fileContents(file)
  if (content.includes('console.log(')) {
    warn(`${file} contains console.log statements.`)
  }
}
```

---

## 14. GitHub Actions Workflow

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
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint -- --max-warnings 0
      - run: npx prettier --check .

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage --watchAll=false
      - uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm audit --audit-level=high

  build:
    name: Build Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

---

## 15. CODEOWNERS File

```
# .github/CODEOWNERS

# Default owner
* @glen-barnhardt

# CI/CD and workflows
/.github/workflows/ @glen-barnhardt
/.github/CODEOWNERS @glen-barnhardt

# Core application
/src/app/ @glen-barnhardt
/src/lib/ @glen-barnhardt

# Tauri (Rust) code
/src-tauri/ @glen-barnhardt

# Configuration files
/*.config.js @glen-barnhardt
/*.config.ts @glen-barnhardt
/tsconfig.json @glen-barnhardt
```

---

## 16. Next.js Configuration (with Bundle Analyzer)

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  swcMinify: true,

  // Never ignore errors in production
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Output standalone for smaller Docker images
  output: 'standalone',

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )?.[1]
              return `npm.${packageName?.replace('@', '')}`
            },
          },
        },
      }
    }
    return config
  },
})
```

---

## 17. Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run lint && npm test && npm run test:e2e",
    "type-check": "tsc --noEmit",
    "type-coverage": "type-coverage --at-least 90",
    "check-circular": "dpdm src/app/page.tsx --exit-code circular:1",
    "check-dead-code": "knip",
    "analyze": "ANALYZE=true npm run build",
    "size": "size-limit",
    "lighthouse": "lhci autorun",
    "prepare": "husky install"
  }
}
```

---

## 18. Branch Protection Settings (Manual Setup)

**GitHub Repository Settings → Branches → Add Branch Protection Rule**

```yaml
Branch name pattern: main

Settings:
☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☑ Dismiss stale pull request approvals when new commits are pushed
  ☑ Require review from Code Owners

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Status checks that are required:
    - static-analysis
    - unit-tests
    - e2e-tests
    - security
    - build

☑ Require conversation resolution before merging
☑ Require linear history
☑ Include administrators

☐ Allow force pushes (NEVER CHECK THIS)
☐ Allow deletions (NEVER CHECK THIS)
```

---

## 19. VSCode Settings (Optional)

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "jest.autoRun": "off",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-playwright.playwright",
    "orta.vscode-jest",
    "firsttris.vscode-jest-runner"
  ]
}
```

---

## Installation Commands Summary

```bash
# 1. Initialize project (if not done)
npx create-next-app@latest . --typescript --tailwind --app --src-dir

# 2. Install all dependencies
npm install -D \
  eslint @eslint/js @next/eslint-plugin-next \
  eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-import \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  prettier eslint-config-prettier \
  husky lint-staged @commitlint/cli @commitlint/config-conventional \
  jest @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  jest-environment-jsdom @playwright/test \
  type-coverage knip dpdm \
  @next/bundle-analyzer @size-limit/preset-next @lhci/cli \
  danger

# 3. Initialize Husky
npx husky init

# 4. Install Playwright browsers
npx playwright install

# 5. Create configuration files (copy from this document)

# 6. Run initial checks
npm run lint
npm run type-check
npm run test
npm run build
```

---

## Quick Verification Checklist

After setting up, verify everything works:

```bash
# ✅ TypeScript compiles
npm run type-check

# ✅ Linting passes
npm run lint

# ✅ Formatting is correct
npm run format:check

# ✅ Tests pass
npm test

# ✅ Build succeeds
npm run build

# ✅ E2E tests pass
npm run test:e2e

# ✅ Type coverage meets threshold
npm run type-coverage

# ✅ No circular dependencies
npm run check-circular

# ✅ No dead code (warning only initially)
npm run check-dead-code

# ✅ Git hooks work
git commit -m "test: verify git hooks" --allow-empty
git reset HEAD~1
```

---

## Troubleshooting

### Issue: Husky hooks not running

```bash
chmod +x .husky/*
```

### Issue: Jest can't find modules

```bash
npm install -D ts-node
```

### Issue: Playwright tests fail to start server

```bash
# Make sure port 3000 is free
lsof -ti:3000 | xargs kill -9
```

### Issue: Type coverage fails

```bash
# Start with lower threshold and increase gradually
npx type-coverage --at-least 50
```

### Issue: ESLint flat config not working

```bash
# Make sure you're using ESLint 8.57+ or 9.x
npm install -D eslint@latest
```

---

## What to Commit

```bash
# Commit these files
git add .github/
git add .husky/
git add .vscode/
git add *.config.js
git add *.config.ts
git add .eslintrc.js  # or eslint.config.mjs
git add .prettierrc
git add .prettierignore
git add jest.setup.js
git add .size-limit.json
git add lighthouserc.js
git add knip.json
git add dangerfile.ts
git add commitlint.config.js

# DO NOT commit
echo "coverage/" >> .gitignore
echo "playwright-report/" >> .gitignore
echo ".stryker-tmp/" >> .gitignore
echo "stryker.log" >> .gitignore
echo ".lhci/" >> .gitignore
```

---

## Next Steps

1. Copy all configurations from this file
2. Install dependencies
3. Run verification checklist
4. Make a test commit to verify hooks
5. Create a test PR to verify CI/CD
6. Set up branch protection rules
7. Start Phase 1 of implementation roadmap

**You're now ready for zero bugs in production!**
