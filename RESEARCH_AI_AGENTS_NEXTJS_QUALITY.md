# Research: How Large Next.js Teams Use AI Agents Without Creating Bugs

**Research Date:** 2025-11-12
**Goal:** Find production-ready patterns for using AI agents in Next.js development that prevent bugs

---

## Executive Summary

Large teams using AI agents successfully follow a consistent pattern: **automation + validation + human oversight**. The key insight is that preventing bugs requires treating AI agents as intelligent junior developers that need guardrails, not as autonomous systems that can work unsupervised.

### Key Findings:
1. **Vercel's Philosophy**: Use AI for reasoning, use deterministic code for everything else
2. **Multi-Layer Testing**: Unit → Integration → E2E → Performance
3. **Pre-Commit Hooks**: Catch errors before they enter the codebase
4. **CI/CD Validation**: Build, lint, type-check, test on every commit
5. **Human-in-the-Loop**: Always review AI-generated code, especially for critical paths

---

## 1. Vercel's AI Agent Development Philosophy

### Source: [Vercel Engineering Blog](https://vercel.com/blog/the-no-nonsense-approach-to-ai-agent-development)

### Three-Step Framework

**Step 1: Manual Prototyping First**
- Simulate the agent manually using real inputs
- Validate whether an LLM can actually solve the problem
- Quote: "If the model consistently fails to make progress, even with adjustments, the task may not be a good fit"

**Step 2: Automate with Hybrid Logic**
- Critical principle: Distinguish AI reasoning vs deterministic code
- Quote: "LLMs are non-deterministic. If you can write a normal function to handle a step, do it"
- Use APIs/tools for data gathering, AI for analysis only

**Step 3: Optimize for Reliability**
- Structured evaluations across diverse real-world inputs
- Iterative refinement of prompts
- Replace model calls with deterministic functions wherever possible

### Key Principles
- **Narrow scope**: Domain-specific, tightly bounded agents
- **Plain programming**: Conditional logic for non-reasoning tasks
- **Hands-on testing**: Iterate against real examples before formal evaluations
- **No complexity for complexity's sake**: Sound software fundamentals, not novel abstractions

---

## 2. V0.dev Architecture: AI Code Generation with Quality Control

### Source: [V0.dev Technical Analysis](https://skywork.ai/blog/vercel-v0-review-2025-ai-ui-code-generation-nextjs/)

### Quality Control Architecture

```
┌─────────────────────┐
│  Retrieval System   │  ← Grounds the model with context
│  (RAG)              │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Frontier LLM       │  ← Reasoning and code generation
│  (Claude Sonnet)    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  AutoFix            │  ← Post-processor that scans for:
│  (Streaming)        │     • Errors
│                     │     • Best-practice violations
│                     │     • Common mistakes
└─────────────────────┘
```

### Results
- **94% error-free UI generation**
- Clean, modular, editable code
- Follows TypeScript, React, and Tailwind best practices

### Limitations (Important!)
- Quote: "AutoFix helps stabilize generations, but it does not obviate standard engineering rigor—tests, reviews, and accessibility checks remain essential"
- **For production-critical surfaces, keep humans firmly in the loop**

### Best Practices for Using V0-Generated Code
1. **Unit tests**: Create corresponding unit test for every component
2. **Integration testing**: Verify dynamically-generated components work together
3. **Type safety**: Use TypeScript to reduce runtime errors
4. **React Error Boundaries**: Capture rendering errors
5. **Git version control**: Enable rollback to stable versions

---

## 3. Next.js Evaluation Framework (Vercel's Internal Tool)

### Source: [next-evals-oss Repository](https://github.com/vercel/next-evals-oss)

### How Vercel Tests AI Model Competency

This is the actual framework Vercel uses internally to test AI models on Next.js tasks.

#### Evaluation Structure
Each evaluation consists of:
1. **Input Directory**: Complete Next.js app with intentionally failing tests
2. **Prompt File**: Instructions for the AI
3. **Output Directory**: AI-modified project

#### Validation Pipeline
```
1. Copy input baseline
2. Start dev server (optional)
3. Run pre-eval hooks
4. AI analyzes and modifies code
5. Apply changes via git diff
6. Validate:
   ├─ Build (TypeScript compilation)
   ├─ Lint (Code style enforcement)
   └─ Test (Unit + Integration)
7. Run post-eval hooks
8. Score: 1.0 (pass) or 0.0 (fail)
```

#### Quality Control Measures
- **Dependency consistency**: Centralized `template/package.json` prevents version conflicts
- **Automated synchronization**: `sync-templates.ts` propagates updates across 50+ evaluations
- **Multi-phase validation**: Build → Lint → Test catches common issues
- **Dev server integration**: AI can test changes interactively
- **Parallel execution**: True parallelism with memory isolation

#### Key Insight
Binary pass/fail scoring forces the AI to generate code that:
- Compiles without TypeScript errors
- Passes all linting rules
- Passes all unit and integration tests

---

## 4. Enterprise Next.js Boilerplate: Production Setup

### Source: [next-enterprise Repository](https://github.com/Blazity/next-enterprise)

### Multi-Layer Testing Strategy

#### 1. Unit Testing (Vitest)
- Fast test execution for isolated functions
- Optimized for modern JavaScript projects

#### 2. Component Testing (React Testing Library)
- Focus on user interactions, not implementation details
- Tests how components behave from user perspective

#### 3. E2E Testing (Playwright)
- Complete user workflows
- Real browser environments

### Pre-Commit Quality Checks

```yaml
# .pre-commit-config.yaml structure
- TypeScript type checking
- ESLint (code consistency)
- Prettier (formatting)
- Conventional commits enforcement
```

### CI/CD Automation

**Automated checks on every PR:**
- Bundle size analysis
- Performance metrics tracking
- Code consistency validation
- Build verification

### Additional Quality Controls
- **Strict TypeScript**: Enhanced type safety prevents runtime bugs
- **ts-reset library**: Additional type safety patterns
- **Semantic Release**: Automated versioning and changelog
- **Bundle monitoring**: Prevents performance regressions

---

## 5. Specific Configurations for Next.js

### 5.1 TypeScript Strict Mode Configuration

#### Recommended `tsconfig.json`

```json
{
  "compilerOptions": {
    // Default Next.js strict settings
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    // Additional strict options for production
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false
  }
}
```

#### Production Best Practices
- Next.js **fails the build** if TypeScript errors exist
- Use `next typegen && tsc --noEmit` for CI/CD type checking without full build
- Enable `incremental` type checking for large applications
- Set `reactStrictMode: true` in `next.config.js`

### 5.2 ESLint Configuration for Next.js

#### Base Configuration

```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "warn",
    "no-console": "warn"
  }
}
```

#### Server/Client Component Validation

**Use these ESLint plugins to prevent common mistakes:**

1. **eslint-plugin-react-server-components**
   - Enforces proper `'use client'` usage
   - Validates hooks are only used in client components

2. **eslint-plugin-next-recommended**
   - `require-use-client`: Enforces hooks need "use client"
   - `async-component-no-hooks`: Prevents hooks in async server components
   - `async-server-actions`: Ensures server actions are async

3. **Custom rules** (example)
   - Prevent node built-in modules in client components
   - Allow `fs`, `path`, etc. only in server components, API routes, and data fetching functions

### 5.3 Pre-Commit Hooks with Husky + Lint-Staged

#### Installation

```bash
npm install -D husky lint-staged
npx husky init
```

#### `.lintstagedrc.js`

```javascript
module.exports = {
  // Type check all TypeScript files
  '**/*.(ts|tsx)': () => 'yarn tsc --noEmit',

  // Lint and format TS/JS files
  '**/*.(ts|tsx|js)': (filenames) => [
    `yarn eslint --fix ${filenames.join(' ')}`,
    `yarn prettier --write ${filenames.join(' ')}`
  ],

  // Format other files
  '**/*.(md|json)': (filenames) =>
    `yarn prettier --write ${filenames.join(' ')}`
};
```

#### `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

yarn lint-staged
```

#### What This Does
- Runs **only on staged files** (fast!)
- TypeScript type checking
- ESLint with auto-fix
- Prettier auto-formatting
- **Blocks commit if checks fail**

### 5.4 GitHub Actions CI/CD Workflow

#### Complete Workflow Example

```yaml
name: Next.js CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality-check:
    runs-on: ubuntu-latest

    steps:
      # 1. Checkout code
      - uses: actions/checkout@v4

      # 2. Setup Node.js with caching
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # 3. Install dependencies
      - name: Install dependencies
        run: npm ci

      # 4. Type checking
      - name: Type check
        run: npx next typegen && npx tsc --noEmit

      # 5. Linting
      - name: Lint
        run: npm run lint

      # 6. Unit & Integration tests
      - name: Run tests
        run: npm test

      # 7. Build verification
      - name: Build
        run: npm run build
        env:
          CI: true

      # 8. E2E tests (optional)
      - name: E2E tests
        run: npx playwright test
        if: github.event_name == 'pull_request'

  bundle-size-check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Analyze bundle size
        uses: hashicorp/nextjs-bundle-analysis@v1
        with:
          workflow-id: bundle_analysis.yml
          default-branch: main
```

### 5.5 Bundle Size Monitoring

#### Tools
1. **hashicorp/nextjs-bundle-analysis** - PR comments with bundle diff
2. **BundleWatch** - Fails build if bundle crosses threshold
3. **size-limit-action** - Comments on PR with size comparison

#### Why This Matters
- Prevents performance regressions
- Forces developers to think about bundle impact
- Catches accidental imports of large libraries

### 5.6 Lighthouse CI for Performance

#### Configuration (`.lighthouserc.json`)

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run start",
      "url": ["http://localhost:3000"]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

#### GitHub Action

```yaml
- name: Run Lighthouse CI
  run: |
    npm run build
    npm install -g @lhci/cli
    lhci autorun
```

---

## 6. Claude Code Configuration for Next.js

### Source: [claude-code-configs Repository](https://github.com/Matt-Dionis/claude-code-configs)

### .claude Directory Structure

```
.claude/
├── settings.json          # Permissions and environment variables
├── CLAUDE.md             # Project-specific instructions
├── agents/               # Specialized AI agents
│   ├── nextjs-pro.md    # Next.js specialist
│   ├── test-automator.md # Testing specialist
│   ├── code-reviewer.md  # Code review agent
│   └── debugger.md       # Debugging specialist
├── commands/             # Custom slash commands
│   ├── create-page.md
│   ├── setup-testing.md
│   └── analyze-performance.md
└── hooks/                # Automation scripts
    ├── post-tool-use.sh  # Runs after AI makes changes
    └── pre-commit.sh     # Additional validation
```

### Key Agents for Quality Control

#### 1. nextjs-pro Agent
- Specialist for SSR, SSG, and full-stack React
- Understands Next.js conventions
- Generates Server/Client components correctly

#### 2. code-reviewer Agent
- Analyzes PRs for best practices
- Checks architectural consistency
- Flags potential issues

#### 3. test-automator Agent
- Creates comprehensive test suites
- Unit, integration, and E2E tests
- Follows testing best practices

#### 4. debugger Agent
- Investigates test failures
- Specialized in finding root causes

### Quality Control Mechanisms

#### Multi-Agent Code Review
Tasks automatically route through specialist reviewers:
1. **nextjs-pro** generates code
2. **code-reviewer** analyzes for best practices
3. **test-automator** creates tests
4. **debugger** investigates any failures

#### Orchestrated Workflows
The **agent-organizer** coordinates:
- Multi-phase collaboration
- Quality gates between phases
- Validation checkpoints
- Ensures all specialists review before merging

### Hooks for Automation

#### Post-Tool-Use Hook Example

```bash
#!/bin/bash
# .claude/hooks/post-tool-use.sh

# Run type checking
echo "Type checking..."
npx tsc --noEmit

# Run linting
echo "Linting..."
npm run lint

# Run tests
echo "Testing..."
npm test

# If any command fails, alert the user
if [ $? -ne 0 ]; then
  echo "❌ Quality checks failed! Please review."
  exit 1
fi

echo "✅ All quality checks passed!"
```

### CLAUDE.md Best Practices

Example structure for Next.js projects:

```markdown
# Project: [Your Project Name]

## Tech Stack
- Next.js 15 with App Router
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui components
- React Query for data fetching
- Vitest + React Testing Library
- Playwright for E2E

## Code Standards
- Always use TypeScript (no `any` types)
- Prefer arrow functions with return type annotations
- Destructure props
- Server Components by default, use 'use client' only when needed
- Validate all server-side inputs

## Testing Requirements
- Every component must have a unit test
- Test user interactions, not implementation
- Mock external dependencies with MSW
- E2E tests for critical user flows

## Before Committing
- Run `npm run type-check`
- Run `npm run lint`
- Run `npm test`
- Run `npm run build` to verify build succeeds

## AI Agent Instructions
- Generate Server Components by default
- Add 'use client' only for hooks/interactivity
- Include error boundaries for error handling
- Write tests alongside components
- Follow Next.js 15 best practices
- Use shadcn/ui components, not custom UI
```

---

## 7. Human-in-the-Loop Best Practices

### Source: [Multiple Industry Sources]

### Core Principle
**Treat AI agents as intelligent junior developers—efficient, but always needing supervision**

### HITL Workflow

```
┌─────────────────────┐
│  1. Agent receives  │
│     task            │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  2. Agent proposes  │
│     action          │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  3. Agent pauses    │  ← Uses interrupt()
│     and routes to   │
│     human approver  │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  4. Human reviews   │
│     context and     │
│     approves/rejects│
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  5. Agent resumes   │
│     only if approved│
└─────────────────────┘
```

### When to Use HITL

**Always require approval for:**
- Database schema changes
- API contract modifications
- Security-related code
- Third-party integrations
- Production deployments
- Dependency version updates

**Can skip approval for:**
- UI component styling
- Adding unit tests
- Updating documentation
- Fixing typos
- Formatting changes

### Review Best Practices

#### Incremental Review
Quote: "When implementing large changes, avoid accumulating review debt by reviewing changes after each sub-task"

**Instead of:**
```
Task 1 → Task 2 → Task 3 → Task 4 → Review all at once
```

**Do this:**
```
Task 1 → Review → Task 2 → Review → Task 3 → Review
```

#### What to Check
1. **Logic correctness**: Does it solve the problem?
2. **Edge cases**: What happens with invalid inputs?
3. **Performance**: Are there obvious bottlenecks?
4. **Security**: Any injection risks? Sensitive data exposure?
5. **Tests**: Do tests cover the main scenarios?
6. **Design alignment**: Does this fit the architecture?

### AI Code Review Benefits

From Microsoft's Engineering blog:
- **Catches issues in minutes** vs waiting for human reviewer
- **Fewer back-and-forth cycles** for minor fixes
- **Catches common bugs**:
  - Missing null checks
  - Memory leaks
  - Race conditions
  - Unhandled exceptions
  - Incorrectly ordered API calls

### Avoiding Over-Reliance

**AI is not good at:**
- Complex business logic reasoning
- Architectural decisions
- Understanding organizational context
- Political/interpersonal considerations

**AI is good at:**
- Syntax and style checking
- Common bug patterns
- Security vulnerabilities (basic)
- Code formatting
- Boilerplate generation

### Hybrid Approach Success Pattern

```
Step 1: AI performs initial scan
        ├─ Syntax
        ├─ Style
        ├─ Common bugs
        └─ Obvious security flaws

Step 2: Human reviews
        ├─ Business logic
        ├─ Architecture
        ├─ Complex edge cases
        └─ Context-specific decisions

Step 3: Both work together
        ├─ AI catches low-hanging fruit
        ├─ Human focuses on high-value review
        └─ Faster overall process
```

---

## 8. Testing Strategies for AI-Generated Code

### Multi-Layer Testing Pyramid

```
         /\
        /  \
       / E2E \          ← Few, slow, high-value
      /      \             (Playwright/Cypress)
     /───────\
    /         \
   / Integration \       ← Some, medium speed
  /             \           (Component + API tests)
 /───────────────\
/                 \
/   Unit Tests    \      ← Many, fast
/                  \        (Jest/Vitest)
└────────────────────┘
```

### Unit Testing Strategy

**Tools**: Jest or Vitest + React Testing Library

**What to test:**
```typescript
// ✅ Good: Test behavior
test('shows error message when form submission fails', async () => {
  render(<ContactForm />);

  const submitButton = screen.getByRole('button', { name: /submit/i });
  await userEvent.click(submitButton);

  expect(await screen.findByText(/error/i)).toBeInTheDocument();
});

// ❌ Bad: Test implementation
test('calls setError when handleSubmit throws', () => {
  const setError = jest.fn();
  // Testing internal implementation details
});
```

**Coverage targets:**
- Critical business logic: 100%
- UI components: 80%+
- Utility functions: 90%+

### Integration Testing Strategy

**Purpose**: Verify components work together

**Example scenario:**
```
User fills form → Submits → API call → Success message → Data updates
```

**Test the whole flow**, not just individual pieces

### E2E Testing Strategy

**Tools**: Playwright (recommended) or Cypress

**When to use:**
- Critical user journeys (signup, checkout, etc.)
- Happy path through main features
- Auth flows
- Payment processing

**Example:**
```typescript
test('user can complete signup flow', async ({ page }) => {
  await page.goto('/signup');

  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

**Best practice**: Run E2E tests **against production build**
```bash
npm run build
npm run start
npm run test:e2e
```

### Performance Testing

**Tools**: Lighthouse CI, k6

**Metrics to track:**
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.8s
- Total Blocking Time (TBT) < 200ms
- Cumulative Layout Shift (CLS) < 0.1

### Snapshot Testing

**Purpose**: Catch unintended UI changes

**Example:**
```typescript
test('renders UserProfile correctly', () => {
  const { container } = render(<UserProfile user={mockUser} />);
  expect(container).toMatchSnapshot();
});
```

**When snapshot fails:**
1. Review the diff
2. If change is intentional → update snapshot
3. If change is unexpected → fix the code

---

## 9. Real-World Case Studies

### Case Study 1: Fortune 100 Retailer (Qodo AI)

**Results:**
- Saved 450,000 developer hours in one year
- Each developer saves ~50 hours per month
- Shortened review cycles
- Reduced issues slipping into production

**How:**
- AI code review on every PR
- Automated quality checks
- Human reviewers focus on high-level architecture

### Case Study 2: African Payment Provider

**Results:**
- Cut regression testing from **3 months to 3 hours**
- AI-powered QA automation

**How:**
- Automated test generation
- AI agents create comprehensive test suites
- Human QA focuses on exploratory testing

### Case Study 3: IBM watsonx Code Assistant

**Study:** N=669 developers surveyed

**Key Findings:**
- Net productivity increase for most users
- **But not all users benefited equally**
- Success required proper training and workflow integration
- Most effective when paired with existing good practices

**Lesson:** AI tools amplify existing practices—good or bad

### Case Study 4: Netflix's Quality Control

**Approach:**
- Automated quality checks throughout pipeline
- Detects encoding issues early:
  - Picture corruption
  - Inserted black frames
  - Frame rate conversion issues
  - Interlacing artifacts
  - Frozen frames

**Lesson:** Automated checks catch issues humans would miss

### Case Study 5: Airbnb's CI/CD Evolution

**Journey:**
- Reduced build times from **1 hour → 6 minutes**
- Migrated to Spinnaker (Netflix's CD tool)
- Implemented data quality scoring

**Key Practices:**
- Parallel test execution
- Smart caching strategies
- Incremental builds
- Quality gates at every stage

---

## 10. Common Mistakes and How to Avoid Them

### Mistake 1: Treating AI as a Senior Developer

**Problem:** Giving AI too much autonomy without review

**Solution:**
- Always review AI-generated code
- Use HITL for critical changes
- Treat AI as a junior developer that needs mentoring

### Mistake 2: Skipping Tests Because "AI Generated It"

**Problem:** Assuming AI code is correct without testing

**Solution:**
- Write tests for AI-generated code
- Better yet: Have AI generate tests too, then review both

### Mistake 3: No Pre-Commit Validation

**Problem:** Bad code enters the repository

**Solution:**
- Set up Husky + lint-staged
- Type check, lint, and test on every commit
- Make it impossible to commit broken code

### Mistake 4: No CI/CD Validation

**Problem:** Pre-commit checks can be bypassed with `--no-verify`

**Solution:**
- GitHub Actions that runs full validation
- Block merge if checks fail
- No exceptions, even for "urgent" fixes

### Mistake 5: Ignoring Bundle Size

**Problem:** Performance degrades over time

**Solution:**
- Automated bundle analysis on every PR
- Set budgets and fail builds that exceed them
- Make bundle size a first-class metric

### Mistake 6: Not Using TypeScript Strict Mode

**Problem:** Type safety holes allow bugs through

**Solution:**
- Enable all strict TypeScript options
- Fail builds on TypeScript errors
- Use `next typegen` for route type safety

### Mistake 7: No Server/Client Component Validation

**Problem:** Using hooks in Server Components or vice versa

**Solution:**
- Use `eslint-plugin-react-server-components`
- Add custom rules for node module imports
- Educate AI agents about the distinction

### Mistake 8: Over-Reliance on AI for Complex Logic

**Problem:** AI makes subtle logic errors in complex business rules

**Solution:**
- Use deterministic code for business logic
- Let AI handle boilerplate
- Human review all business-critical paths

### Mistake 9: No Performance Testing

**Problem:** App gets slower without anyone noticing

**Solution:**
- Lighthouse CI on every PR
- Set performance budgets
- Track Core Web Vitals trends

### Mistake 10: Single-Pass Review

**Problem:** Reviewing large AI-generated changes all at once

**Solution:**
- Break work into smaller tasks
- Review after each task
- Iterative approach prevents review debt

---

## 11. Recommended Setup for Your Sentra Project

### Phase 1: Foundation (Week 1)

#### 1. TypeScript Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    // ... all strict options from Section 5.1
  }
}
```

#### 2. ESLint Configuration
```bash
npm install -D eslint-plugin-react-server-components
npm install -D @felipstein/eslint-plugin-next-recommended
```

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@felipstein/next-recommended/recommended",
    "prettier"
  ],
  "plugins": ["react-server-components", "prettier"],
  "rules": {
    "prettier/prettier": "warn",
    "no-console": "warn",
    "@felipstein/next-recommended/require-use-client": "error",
    "@felipstein/next-recommended/async-component-no-hooks": "error"
  }
}
```

#### 3. Prettier
```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true
}
```

#### 4. Pre-Commit Hooks
```bash
npm install -D husky lint-staged
npx husky init
```

Use the configuration from Section 5.3

### Phase 2: Testing (Week 2)

#### 1. Unit Testing
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
});
```

#### 2. E2E Testing
```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run build && npm run start',
    port: 3000,
  },
});
```

### Phase 3: CI/CD (Week 3)

#### 1. GitHub Actions Workflow
Use the complete workflow from Section 5.4

#### 2. Bundle Size Monitoring
```bash
npm install -D @hashicorp/nextjs-bundle-analysis
```

Add the GitHub Action from Section 5.5

#### 3. Lighthouse CI
```bash
npm install -D @lhci/cli
```

Use configuration from Section 5.6

### Phase 4: Claude Code Integration (Week 4)

#### 1. Create .claude Directory
```bash
mkdir -p .claude/{agents,commands,hooks}
```

#### 2. Set Up Agents
Create specialized agents:
- `nextjs-pro.md` - Next.js specialist
- `code-reviewer.md` - Code review
- `test-automator.md` - Test generation
- `debugger.md` - Debugging

Use examples from Section 6

#### 3. Create CLAUDE.md
Use template from Section 6

#### 4. Set Up Hooks
Create post-tool-use hook from Section 6

### Phase 5: Ongoing Practices

#### Daily
- Review all AI-generated code before committing
- Run tests locally before pushing
- Check bundle size impacts for new features

#### Weekly
- Review test coverage reports
- Check Lighthouse CI trends
- Update dependencies and run full test suite

#### Monthly
- Review and update .claude/CLAUDE.md
- Analyze CI/CD metrics (build times, failure rates)
- Update ESLint rules based on common issues

---

## 12. Checklist: AI Agent Quality Assurance

### Before AI Makes Changes
- [ ] Clear instructions provided
- [ ] Scope is well-defined and bounded
- [ ] Example code/patterns shared
- [ ] Tests exist for area being modified

### After AI Makes Changes (Pre-Commit)
- [ ] Code reviewed by human
- [ ] TypeScript type checking passes
- [ ] ESLint passes
- [ ] Prettier formatting applied
- [ ] Unit tests pass
- [ ] Integration tests pass (if applicable)
- [ ] Manual smoke test performed
- [ ] No console.log or debugging code left
- [ ] No TODO comments without tickets

### Before Merge (CI/CD)
- [ ] All GitHub Action checks pass
- [ ] Build succeeds
- [ ] Bundle size within budget
- [ ] Lighthouse CI scores acceptable
- [ ] E2E tests pass (critical paths)
- [ ] No TypeScript errors
- [ ] Code review approved by human

### After Merge (Production)
- [ ] Deployment successful
- [ ] Smoke tests in production pass
- [ ] Error monitoring checked (first 24h)
- [ ] Performance metrics normal
- [ ] User feedback monitored

---

## 13. Key Takeaways

### 1. Automation + Validation = Success
AI agents are powerful when paired with automated validation. The combination catches errors that either would miss alone.

### 2. Treat AI as a Junior Developer
- Needs clear instructions
- Requires review and mentoring
- Good at boilerplate, struggles with complexity
- Benefits from examples and patterns

### 3. Multi-Layer Defense
No single check is enough:
- Pre-commit hooks (local)
- CI/CD validation (remote)
- Human review (always)
- Production monitoring (safety net)

### 4. Vercel's Hybrid Approach Works
- Use AI for reasoning
- Use deterministic code for everything else
- Manual prototyping before automation
- Iterative refinement

### 5. Testing is Non-Negotiable
AI-generated code must be tested like any other code:
- Unit tests for logic
- Integration tests for interactions
- E2E tests for critical flows
- Performance tests for optimization

### 6. Human-in-the-Loop is Critical
Especially for:
- Complex business logic
- Security-sensitive code
- Database changes
- API contracts
- Production deployments

### 7. Next.js-Specific Considerations
- Server vs Client Components validation
- TypeScript strict mode
- Build-time verification
- Bundle size monitoring
- Performance testing (Core Web Vitals)

### 8. The Pattern That Works

```
┌──────────────────────────────────────┐
│  1. AI Agent (Reasoning + Code Gen) │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│  2. Automated Checks                 │
│     - Type check                     │
│     - Lint                           │
│     - Tests                          │
│     - Build                          │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│  3. Human Review                     │
│     - Logic correctness              │
│     - Architecture fit               │
│     - Security considerations        │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│  4. CI/CD Validation (Same Checks)   │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│  5. Production Monitoring            │
└──────────────────────────────────────┘
```

This pattern prevents bugs at multiple stages while maintaining development velocity.

---

## 14. Resources and References

### Official Documentation
- [Next.js Testing Docs](https://nextjs.org/docs/app/building-your-application/testing)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Next.js TypeScript Config](https://nextjs.org/docs/app/api-reference/config/typescript)
- [Next.js ESLint Config](https://nextjs.org/docs/app/api-reference/config/eslint)

### Tools
- [Husky](https://typicode.github.io/husky/) - Git hooks
- [lint-staged](https://github.com/okonet/lint-staged) - Run linters on staged files
- [Vitest](https://vitest.dev/) - Unit testing
- [Playwright](https://playwright.dev/) - E2E testing
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) - Performance testing

### Repositories
- [vercel/next-evals-oss](https://github.com/vercel/next-evals-oss) - AI evaluation framework
- [Blazity/next-enterprise](https://github.com/Blazity/next-enterprise) - Enterprise boilerplate
- [Matt-Dionis/claude-code-configs](https://github.com/Matt-Dionis/claude-code-configs) - Claude configs
- [hashicorp/nextjs-bundle-analysis](https://github.com/hashicorp/nextjs-bundle-analysis) - Bundle analysis

### Articles
- [Vercel: No-Nonsense AI Agent Development](https://vercel.com/blog/the-no-nonsense-approach-to-ai-agent-development)
- [Building Robust React Apps with Husky](https://blog.logrocket.com/build-robust-react-app-husky-pre-commit-hooks-github-actions/)
- [Next.js Testing Guide](https://caisy.io/blog/nextjs-testing-guide)

### ESLint Plugins for Next.js
- [eslint-plugin-react-server-components](https://www.npmjs.com/package/eslint-plugin-react-server-components)
- [@felipstein/eslint-plugin-next-recommended](https://github.com/Felipstein/eslint-plugin-next-recommended)
- [next-no-use-client-page](https://github.com/Frozies/next-no-use-client-page)

---

## Conclusion

Large Next.js teams successfully use AI agents by following a consistent pattern: **combine AI automation with robust validation and human oversight**.

The key is not preventing AI from making mistakes—that's impossible. The key is **catching mistakes before they reach production** through multiple layers of automated and manual checks.

This research shows that the teams succeeding with AI agents are those who:
1. Set up comprehensive testing
2. Use pre-commit and CI/CD validation
3. Maintain human-in-the-loop review processes
4. Treat AI as a tool to augment, not replace, human developers

**The technology works. The patterns exist. Now it's about implementation.**

---

*Research compiled by: Glen Barnhardt with the help of Claude Code*
*Date: 2025-11-12*
*Sources: Vercel Engineering Blog, GitHub repositories, industry case studies, and technical documentation*
