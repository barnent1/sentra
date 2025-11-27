---
title: "[BM-006] Setup CI/CD pipeline (GitHub Actions)"
labels: ["ai-feature", "bookmark-test", "p1", "foundation"]
---

## Description
Configure GitHub Actions workflows for automated testing, type checking, linting, and deployment.

## Acceptance Criteria
- [ ] Test workflow created (.github/workflows/test.yml)
- [ ] Runs on pull requests and pushes to main
- [ ] Executes: type-check, lint, unit tests, E2E tests
- [ ] Coverage report generated
- [ ] Deployment workflow created (.github/workflows/deploy.yml)
- [ ] All workflows pass on sample PR
- [ ] Badge added to README.md

## Dependencies
- BM-001 (requires project structure)
- BM-003 (requires test configuration)

## Blocks
None (improves development workflow)

## Files to Create/Modify
- `.github/workflows/test.yml` - Test automation
- `.github/workflows/deploy.yml` - Deployment automation
- `README.md` - Add CI/CD badge

## Technical Context
**Test Workflow:**

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
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
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Run unit tests with coverage
        run: npm run test:coverage

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

**Deploy Workflow:**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Environment Secrets Required:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## E2E Test Requirements
Not applicable for CI/CD setup.

## Estimated Complexity
**Medium** (4-6 hours)
- GitHub Actions configuration
- Testing all workflow steps
- Secrets configuration
