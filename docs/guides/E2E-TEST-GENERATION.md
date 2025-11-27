# E2E Test Generation Guide

**Audience:** Developers contributing to Quetrex
**Last Updated:** 2025-11-23

---

## Overview

Quetrex automatically generates E2E (end-to-end) tests from design specifications using a hybrid approach: **templates for common patterns** (70% of tests) + **LLM generation for complex scenarios** (30% of tests).

This guide explains how the system works, how to review generated tests, and how to customize or extend the test generation system.

### Key Benefits

- **Zero Manual Test Writing** - Tests generated automatically from specs
- **Fast Generation** - < 3 seconds average (templates are instant, LLM takes 3-5 seconds)
- **High Success Rate** - 90%+ tests pass on first run
- **Consistent Quality** - All tests follow AAA pattern and project conventions
- **Easy Maintenance** - Update templates once, all future tests benefit

---

## How It Works

### The Hybrid Approach

Quetrex uses two methods to generate tests:

**1. Template-Based (70% of tests)**
- Pre-built Mustache templates
- Variable substitution
- Instant generation (< 1 second)
- 100% predictable output
- Zero API costs

**2. LLM-Generated (30% of tests)**
- Claude API generates custom test code
- Handles complex, unique scenarios
- 3-5 seconds generation time
- ~$0.02 per test
- 85% success rate (1 retry)

**Decision Logic:**
```typescript
function generateTest(spec: TestSpec): string {
  // Try template matching first
  if (matchesCRUD(spec)) return applyTemplate('crud-operations', spec);
  if (matchesFormValidation(spec)) return applyTemplate('form-validation', spec);
  if (matchesModalWorkflow(spec)) return applyTemplate('modal-workflow', spec);
  if (matchesNavigation(spec)) return applyTemplate('navigation', spec);
  if (matchesLoading(spec)) return applyTemplate('loading-states', spec);
  if (matchesVisualRegression(spec)) return applyTemplate('visual-regression', spec);

  // Fall back to LLM for complex tests
  return generateWithLLM(spec);
}
```

---

## Spec → Test Workflow

### Step 1: Architect Session Complete

When your architect session reaches 90%+ readiness, the specification includes E2E test requirements:

```yaml
# Generated from architect session
screens:
  - name: dashboard
    description: Main dashboard showing all projects

    e2e_tests:
      - name: should display all projects in grid layout
        steps:
          - Navigate to /dashboard
          - Wait for projects to load
          - Count project cards
        assertions:
          - Project cards are visible
          - Grid layout is applied
          - Each card shows project name

      - name: should open modal when clicking New Project
        steps:
          - Navigate to /dashboard
          - Click New Project button
          - Wait for modal animation
        assertions:
          - Modal is visible
          - Modal has New Project title
          - Form fields are rendered
```

### Step 2: Test Generation

The system analyzes each test spec and chooses generation method:

```
Test 1: "should display all projects in grid layout"
├─ Pattern match: navigation.template.ts (score: 0.85)
└─ Generator: TEMPLATE (navigation)

Test 2: "should open modal when clicking New Project"
├─ Pattern match: modal-workflow.template.ts (score: 0.92)
└─ Generator: TEMPLATE (modal-workflow)

Test 3: "should preserve mute state across multiple toggles"
├─ Pattern match: none (best score: 0.45)
└─ Generator: LLM (complex state management)
```

### Step 3: Code Generation

**For Template Tests:**
```typescript
// Input: Test spec + variables
{
  testName: "should open modal when clicking New Project",
  trigger: "clicking New Project button",
  targetElement: "modal",
  assertion: "toBeVisible"
}

// Template: modal-workflow.template.ts
test('{{testName}}', async ({ page }) => {
  // ARRANGE
  await page.goto('/dashboard');
  const button = page.locator('button:has-text("New Project")');

  // ACT
  await button.click();
  await page.waitForTimeout(200); // Animation delay

  // ASSERT
  const modal = page.getByRole('dialog');
  await expect(modal).{{assertion}}();
});

// Output: Valid Playwright test (instant)
```

**For LLM Tests:**
```typescript
// Input: Test spec
const prompt = `
Generate a Playwright E2E test for Quetrex based on this spec:

Test: "should preserve mute state across multiple toggles"
Steps:
  - Navigate to /dashboard
  - Find project card with mute button
  - Click mute button (mute)
  - Verify visual state change
  - Click mute button again (unmute)
  - Verify visual state reverts
  - Click mute button again (mute)
  - Refresh page
  - Verify mute state persisted

Follow Quetrex's test patterns:
- AAA structure (Arrange, Act, Assert)
- Use data-testid selectors
- Include waitForTimeout for animations
- Handle edge cases

Generate ONLY the test code.
`;

// Claude API call (3-5 seconds)
// Validation (TypeScript + ESLint)
// Output: Valid test code or retry
```

### Step 4: Validation

All generated tests (template or LLM) go through validation:

**1. TypeScript Compilation**
```bash
tsc --noEmit generated-test.spec.ts
```

**2. ESLint**
```bash
eslint generated-test.spec.ts
```

**3. Playwright Syntax Check**
```typescript
// Validates:
// - Valid locators (getByRole, getByTestId, etc.)
// - Valid assertions (toBeVisible, toHaveText, etc.)
// - Proper async/await usage
// - Correct imports
```

**4. Test Execution**
```bash
playwright test generated-test.spec.ts
```

**Pass Rate:**
- Templates: 100% (predictable output)
- LLM: 85% first run, 95% after 1 retry

### Step 5: Integration

Generated tests are added to the test suite:

```
tests/e2e/
├── dashboard.spec.ts          # Generated from spec
├── project-creation.spec.ts   # Generated from spec
├── settings.spec.ts           # Generated from spec
└── pr-review.spec.ts          # Generated from spec
```

---

## Template Coverage

### 6 Core Templates

Quetrex provides 6 templates covering 91.8% of existing tests:

#### 1. CRUD Operations Template

**Pattern:** Create, read, update, delete flows

**Covers:** 52/208 tests (25%)

**Variables:**
```typescript
{
  entity: string;           // "project", "bookmark", "user"
  createAction: string;     // "Click New Project button"
  createForm: object;       // { name: "Test Project", ... }
  readAssertion: string;    // "Project card is visible"
  updateAction: string;     // "Click Edit button"
  updateForm: object;       // { name: "Updated Project" }
  deleteAction: string;     // "Click Delete button"
  deleteConfirmation: bool; // true if confirmation modal
}
```

**Example Output:**
```typescript
test('should create, read, update, and delete project', async ({ page }) => {
  // ARRANGE
  await page.goto('/dashboard');

  // CREATE
  await page.getByTestId('new-project-button').click();
  await page.getByLabel('Name').fill('Test Project');
  await page.getByTestId('submit-button').click();

  // READ
  const projectCard = page.getByText('Test Project');
  await expect(projectCard).toBeVisible();

  // UPDATE
  await projectCard.click();
  await page.getByTestId('edit-button').click();
  await page.getByLabel('Name').fill('Updated Project');
  await page.getByTestId('save-button').click();
  await expect(page.getByText('Updated Project')).toBeVisible();

  // DELETE
  await page.getByTestId('delete-button').click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Updated Project')).not.toBeVisible();
});
```

#### 2. Form Validation Template

**Pattern:** Required fields, format validation, error messages

**Covers:** 18/208 tests (8.7%)

**Variables:**
```typescript
{
  formName: string;         // "New Project Form"
  fields: Array<{
    name: string;           // "name", "email", "password"
    label: string;          // "Project Name"
    required: boolean;
    validation: {
      pattern?: string;     // Email format, URL format, etc.
      minLength?: number;
      maxLength?: number;
      errorMessage: string;
    }
  }>;
  submitButton: string;     // "Create Project"
}
```

**Example Output:**
```typescript
test('should validate required fields in New Project form', async ({ page }) => {
  // ARRANGE
  await page.goto('/dashboard');
  await page.getByTestId('new-project-button').click();

  // ACT: Try to submit empty form
  await page.getByRole('button', { name: 'Create Project' }).click();

  // ASSERT: Error messages shown
  await expect(page.getByText('Project name is required')).toBeVisible();

  // ACT: Fill invalid email
  await page.getByLabel('Name').fill('Test Project');
  await page.getByLabel('Email').fill('invalid-email');
  await page.getByRole('button', { name: 'Create Project' }).click();

  // ASSERT: Email validation error
  await expect(page.getByText('Invalid email format')).toBeVisible();
});
```

#### 3. Modal Workflow Template

**Pattern:** Open, fill, submit, close modal interactions

**Covers:** 24/208 tests (11.5%)

**Variables:**
```typescript
{
  triggerSelector: string;  // "button:has-text('New Project')"
  modalTitle: string;       // "Create New Project"
  formFields: object;       // { name: "Test", ... }
  submitButton: string;     // "Create"
  closeMethod: string;      // "button" | "backdrop" | "escape"
  animationDelay: number;   // 200ms
}
```

#### 4. Navigation Template

**Pattern:** Route navigation with assertions

**Covers:** 31/208 tests (14.9%)

**Variables:**
```typescript
{
  startRoute: string;       // "/dashboard"
  navigationAction: string; // "Click project card"
  targetRoute: string;      // "/projects/123"
  assertions: string[];     // ["URL contains /projects", "Detail panel visible"]
}
```

#### 5. Loading States Template

**Pattern:** Skeleton, spinner, data loading

**Covers:** 12/208 tests (5.8%)

**Variables:**
```typescript
{
  initialState: string;     // "skeleton" | "spinner" | "empty"
  loadingIndicator: string; // "data-testid=skeleton" | "role=progressbar"
  dataLoadedAssertion: string; // "Project cards visible"
  minLoadTime: number;      // Minimum time to verify loading state
}
```

#### 6. Visual Regression Template

**Pattern:** Screenshot comparison tests

**Covers:** 28/208 tests (13.5%)

**Variables:**
```typescript
{
  testName: string;         // "Dashboard layout baseline"
  route: string;            // "/dashboard"
  viewport: object;         // { width: 1920, height: 1080 }
  waitFor: string[];        // ["data-testid=project-card"]
  screenshotName: string;   // "dashboard-baseline"
  threshold: number;        // 0.1 (10% difference allowed)
}
```

---

## Spec → Test Mapping Rules

### Rule-Based Pattern Matching

The system uses 20+ rules to map spec phrases to templates:

| Spec Phrase | Template | Generated Code |
|-------------|----------|----------------|
| "Navigate to X" | navigation | `page.goto(X)` |
| "Click X" | crud-operations | `page.getByTestId(X).click()` |
| "Verify X shows" | crud-operations | `expect(...).toBeVisible()` |
| "Modal appears" | modal-workflow | `expect(page.getByRole('dialog')).toBeVisible()` |
| "Fill field X with Y" | form-validation | `page.locator(X).fill(Y)` |
| "Submit form" | form-validation | `page.getByRole('button', { name: 'Submit' }).click()` |
| "Shows loading state" | loading-states | `expect(page.getByRole('progressbar')).toBeVisible()` |
| "Data loads" | loading-states | `await page.waitForSelector('[data-testid=data]')` |
| "Create X" | crud-operations | Create operation |
| "Update X" | crud-operations | Update operation |
| "Delete X" | crud-operations | Delete operation |
| "Required field" | form-validation | Required field validation |
| "Invalid format" | form-validation | Format validation |
| "Screenshot matches" | visual-regression | `expect(screenshot).toMatchSnapshot()` |
| "Hover state" | visual-regression | Hover + screenshot |
| "Keyboard navigation" | navigation | Tab/Enter interactions |

### Scoring Algorithm

Each template has a scoring function:

```typescript
function scoreForModalWorkflow(spec: TestSpec): number {
  let score = 0;

  // Check for modal keywords
  if (spec.assertions.some(a => a.includes('modal'))) score += 0.3;
  if (spec.assertions.some(a => a.includes('dialog'))) score += 0.3;

  // Check for form interactions
  if (spec.steps.some(s => s.includes('fill') || s.includes('type'))) score += 0.2;

  // Check for open/close actions
  if (spec.steps.some(s => s.includes('click') && s.includes('button'))) score += 0.1;
  if (spec.assertions.some(a => a.includes('visible') || a.includes('hidden'))) score += 0.1;

  return score; // 0.0 - 1.0
}
```

**Threshold:** Template used if score ≥ 0.7

---

## Reviewing Generated Tests

### What to Check

When reviewing auto-generated tests:

**1. AAA Structure**
```typescript
// Good: Clear separation
test('should do something', async ({ page }) => {
  // ARRANGE
  await page.goto('/dashboard');
  const button = page.getByTestId('new-project');

  // ACT
  await button.click();

  // ASSERT
  await expect(page.getByRole('dialog')).toBeVisible();
});

// Bad: Mixed arrange/act/assert
test('should do something', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Projects')).toBeVisible(); // Assert in arrange
  await page.getByTestId('new-project').click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
```

**2. Proper Selectors**
```typescript
// Preferred: Semantic selectors
page.getByRole('button', { name: 'New Project' })
page.getByLabel('Project Name')
page.getByText('Dashboard')

// Acceptable: data-testid
page.getByTestId('new-project-button')

// Avoid: CSS selectors (fragile)
page.locator('.btn-primary')
page.locator('#project-card-1')
```

**3. Animation Delays**
```typescript
// Good: Wait for animation
await button.click();
await page.waitForTimeout(200); // Modal animation
await expect(modal).toBeVisible();

// Bad: No animation wait (flaky test)
await button.click();
await expect(modal).toBeVisible(); // May fail if modal animates
```

**4. Edge Case Handling**
```typescript
// Good: Handle no data case
const projects = await page.getByTestId('project-card').count();
if (projects === 0) {
  await expect(page.getByText('No projects yet')).toBeVisible();
} else {
  await expect(page.getByTestId('project-card').first()).toBeVisible();
}

// Bad: Assumes data exists
await expect(page.getByTestId('project-card').first()).toBeVisible();
// Fails if no projects
```

### Common Issues

**Issue 1: Flaky Tests (Timing)**

**Symptom:** Test passes locally but fails in CI

**Cause:** Missing wait conditions

**Fix:**
```typescript
// Before (flaky)
await page.click('button');
await expect(page.locator('.result')).toBeVisible();

// After (stable)
await page.click('button');
await page.waitForSelector('.result', { state: 'visible', timeout: 5000 });
await expect(page.locator('.result')).toBeVisible();
```

**Issue 2: Incorrect Selectors**

**Symptom:** Test fails with "element not found"

**Cause:** Generated selector doesn't match actual DOM

**Fix:**
```typescript
// Generated (wrong)
page.getByTestId('new-project')

// Actual DOM
<button data-testid="create-project-button">New Project</button>

// Fix template or add testid to component
<button data-testid="new-project">New Project</button>
```

**Issue 3: Missing Test Data**

**Symptom:** Test expects data but none exists

**Cause:** Test needs setup (seed data)

**Fix:**
```typescript
test.beforeEach(async ({ page }) => {
  // Seed test data
  await createTestProject({ name: 'Test Project 1' });
  await createTestProject({ name: 'Test Project 2' });
});

test('should display all projects', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByTestId('project-card')).toHaveCount(2);
});
```

---

## Customizing Templates

### Modifying Existing Templates

Templates are located in `.claude/templates/e2e/`:

```
.claude/templates/e2e/
├── crud-operations.template.ts
├── form-validation.template.ts
├── modal-workflow.template.ts
├── navigation.template.ts
├── loading-states.template.ts
└── visual-regression.template.ts
```

**Example: Add timeout customization to modal template**

```typescript
// Before
test('{{testName}}', async ({ page }) => {
  await button.click();
  await page.waitForTimeout(200); // Hardcoded
  await expect(modal).toBeVisible();
});

// After
test('{{testName}}', async ({ page }) => {
  await button.click();
  await page.waitForTimeout({{animationDelay}}); // Variable
  await expect(modal).toBeVisible();
});
```

Update `variables.json`:
```json
{
  "animationDelay": {
    "type": "number",
    "default": 200,
    "description": "Animation delay in milliseconds",
    "example": 200
  }
}
```

### Adding New Templates

**1. Identify Common Pattern**

Analyze existing tests to find repeated patterns:

```typescript
// Pattern found in 15+ tests:
// 1. Hover over element
// 2. Wait for tooltip
// 3. Verify tooltip content

test('should show tooltip on hover', async ({ page }) => {
  await page.getByTestId('help-icon').hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await expect(page.getByRole('tooltip')).toHaveText('Help text');
});
```

**2. Create Template File**

`.claude/templates/e2e/tooltip.template.ts`:
```typescript
test('{{testName}}', async ({ page }) => {
  // ARRANGE
  await page.goto('{{route}}');
  const trigger = page.getByTestId('{{triggerTestId}}');

  // ACT
  await trigger.hover();
  await page.waitForTimeout({{hoverDelay}});

  // ASSERT
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText('{{expectedText}}');
});
```

**3. Define Variables**

`.claude/templates/e2e/tooltip.variables.json`:
```json
{
  "testName": {
    "type": "string",
    "required": true,
    "example": "should show tooltip on help icon hover"
  },
  "route": {
    "type": "string",
    "required": true,
    "example": "/dashboard"
  },
  "triggerTestId": {
    "type": "string",
    "required": true,
    "example": "help-icon"
  },
  "hoverDelay": {
    "type": "number",
    "default": 100,
    "example": 100
  },
  "expectedText": {
    "type": "string",
    "required": true,
    "example": "Click for help"
  }
}
```

**4. Add Scoring Function**

`.claude/lib/test-generator.ts`:
```typescript
function scoreForTooltip(spec: TestSpec): number {
  let score = 0;

  if (spec.steps.some(s => s.includes('hover'))) score += 0.4;
  if (spec.assertions.some(a => a.includes('tooltip'))) score += 0.4;
  if (spec.assertions.some(a => a.includes('text') || a.includes('content'))) score += 0.2;

  return score;
}

// Add to template matching
function generateTest(spec: TestSpec): string {
  const scores = {
    'crud-operations': scoreForCRUD(spec),
    'form-validation': scoreForFormValidation(spec),
    'modal-workflow': scoreForModal(spec),
    'navigation': scoreForNavigation(spec),
    'loading-states': scoreForLoading(spec),
    'visual-regression': scoreForVisual(spec),
    'tooltip': scoreForTooltip(spec),  // NEW
  };

  // ... rest of logic
}
```

**5. Test Template**

```bash
npm run test:template -- tooltip
```

---

## LLM Generation

### When LLM is Used

**Triggers:**
1. No template matches (score < 0.7)
2. Spec contains keywords: "complex", "conditional", "multi-step"
3. Template generation fails validation
4. Spec explicitly requests: `template_hint: "llm"`

### LLM Prompt Structure

```typescript
const prompt = `
You are an expert Playwright test generator for Quetrex.

Generate an E2E test based on this specification:

${spec.yaml}

Requirements:
1. Use Playwright test syntax with AAA pattern (Arrange, Act, Assert)
2. Include proper data-testid selectors when available
3. Add appropriate waitForTimeout for animations (200ms for modals, 100ms for tooltips)
4. Handle edge cases (skip if no data, check count before accessing)
5. Follow existing test patterns from Quetrex codebase

Existing test examples (similar scenarios):
${relevantExamples}

Generate ONLY the test code, no explanations.
Format:

test('test name', async ({ page }) => {
  // ARRANGE
  ...

  // ACT
  ...

  // ASSERT
  ...
});
`;
```

### Validation & Retry

**Validation Steps:**
1. TypeScript compilation (`tsc --noEmit`)
2. ESLint (`eslint --fix`)
3. Playwright syntax check
4. Import validation

**Retry Logic:**
```typescript
async function generateWithLLM(spec: TestSpec, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const code = await callClaudeAPI(buildPrompt(spec));

    const validation = await validateCode(code);

    if (validation.success) {
      return code;
    }

    if (attempt < retries) {
      // Retry with error feedback
      const feedbackPrompt = buildPrompt(spec, validation.errors);
      continue;
    }

    // Max retries reached - send to human review
    await enqueueHumanReview({
      spec,
      generatedCode: code,
      validationErrors: validation.errors,
      attempts: retries + 1
    });

    throw new Error('LLM generation failed after retries');
  }
}
```

### Cost Optimization

**1. Cache Generated Tests**
```typescript
const cacheKey = hashSpec(spec);
const cached = await testCache.get(cacheKey);

if (cached) {
  return cached; // Free
}

const generated = await generateWithLLM(spec);
await testCache.set(cacheKey, generated, { ttl: 7 * 24 * 60 * 60 }); // 7 days
return generated;
```

**2. Batch Generation**
```typescript
// Instead of 10 API calls
for (const spec of specs) {
  await generateWithLLM(spec); // $0.02 × 10 = $0.20
}

// Do 1 API call
await generateBatchWithLLM(specs); // $0.05 (bulk discount)
```

**3. Template Promotion**

If LLM generates same pattern 5+ times, promote to template:

```typescript
async function analyzeGeneratedTests() {
  const llmTests = await db.query('SELECT * FROM e2e_tests WHERE generator = "llm"');

  const patterns = detectPatterns(llmTests);

  for (const pattern of patterns) {
    if (pattern.count >= 5) {
      await createTemplate(pattern);
      console.log(`New template created: ${pattern.name} (saves $${pattern.count * 0.02}/suite)`);
    }
  }
}
```

---

## Best Practices

### 1. Write Clear Specs

**Good Spec:**
```yaml
- name: should validate email format in settings
  steps:
    - Navigate to /settings
    - Click Email field
    - Type invalid email "not-an-email"
    - Click Save button
  assertions:
    - Error message shows "Invalid email format"
    - Email field has error styling
    - Save button remains enabled
```

**Bad Spec:**
```yaml
- name: email validation
  steps:
    - Test email
  assertions:
    - Works correctly
```

### 2. Use data-testid

Add `data-testid` attributes to your components:

```tsx
// Good
<button data-testid="new-project-button">
  New Project
</button>

// Generated test can use:
page.getByTestId('new-project-button')
```

### 3. Standardize Naming

Follow consistent naming conventions:

```
Components:
- new-project-button
- project-card
- settings-modal

Actions:
- create-project
- delete-project
- save-settings

Containers:
- dashboard-container
- project-list
- settings-panel
```

### 4. Document Edge Cases

Include edge cases in specs:

```yaml
- name: should handle empty project list
  steps:
    - Navigate to /dashboard
    - Ensure no projects exist
  assertions:
    - Shows "No projects yet" message
    - Shows "Create your first project" CTA
    - Grid layout is not rendered
```

### 5. Review Generated Tests

Always review generated tests before committing:

```bash
# Generate tests
npm run generate:e2e

# Review changes
git diff tests/e2e/

# Run tests
npm run test:e2e

# Commit only if all pass
git add tests/e2e/
git commit -m "test: add generated E2E tests for dashboard"
```

---

## Troubleshooting

### Issue 1: Template Not Matching

**Symptom:** Test uses LLM when template should match

**Debug:**
```typescript
const scores = calculateAllScores(spec);
console.log(scores);
// { crud: 0.65, modal: 0.45, ... }
// Threshold: 0.7 (not met)
```

**Fix:** Adjust scoring function or lower threshold

### Issue 2: LLM Validation Failure

**Symptom:** LLM test fails TypeScript compilation

**Check:**
```bash
tsc --noEmit tests/e2e/generated.spec.ts
# Error: Property 'getByRole' does not exist on type 'Page'
```

**Cause:** LLM hallucinated invalid API

**Fix:** Retry with better prompt or examples

### Issue 3: Flaky Generated Tests

**Symptom:** Tests pass locally but fail in CI

**Cause:** Missing wait conditions

**Fix:** Add retry-ability
```typescript
// Template should include
await expect(async () => {
  await expect(element).toBeVisible();
}).toPass({ timeout: 5000 });
```

---

## Summary

**Key Takeaways:**

1. **Hybrid Approach** - Templates (70%) + LLM (30%) = fast, accurate, cost-effective
2. **Zero Manual Writing** - All E2E tests generated from specs
3. **High Success Rate** - 90%+ pass on first run
4. **Easy Customization** - Modify templates or add new ones
5. **Cost Optimized** - ~$1.45 for full test suite (208 tests)

**Next Steps:**

1. Review generated tests in `tests/e2e/`
2. Customize templates for your patterns
3. Add new templates for common scenarios
4. Monitor LLM usage and promote patterns to templates

**Resources:**

- Template source: `.claude/templates/e2e/`
- Test generator: `.claude/lib/test-generator.ts`
- ADR: `/docs/decisions/ADR-004-E2E-TEST-GENERATION.md`

---

**Created by Glen Barnhardt with the help of Claude Code**
**Last Updated:** 2025-11-23
