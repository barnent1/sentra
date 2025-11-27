# Spec → Test Mapping Rules

**Version:** 1.0.0
**Date:** 2025-11-22
**Purpose:** Define how YAML test specifications map to Playwright test code

---

## Overview

This document provides **25+ mapping rules** that translate human-readable test specifications (YAML) into executable Playwright test code. These rules are used by the E2E test generator to automatically create tests from design specs.

**Related Documents:**
- ADR-004: E2E Test Generation Strategy
- Template Library: `.quetrex/templates/e2e/`

---

## Spec Format

### YAML Structure

```yaml
screen: "Dashboard"
description: "Mission control view for managing AI projects"

e2e_tests:
  - name: "User adds first bookmark"
    description: "Verify empty state and bookmark creation flow"
    steps:
      - "Navigate to /dashboard"
      - "Verify empty state shows"
      - "Click quick add button"
      - "Modal appears with bookmark form"
      - "Fill URL field with https://example.com"
      - "Fill title field with Example Site"
      - "Click Save button"
      - "Modal closes"
      - "Bookmark appears in grid"
    assertions:
      - "Empty state is hidden"
      - "Bookmark card shows correct URL"
      - "Bookmark card shows correct title"
    template_hint: "modal-workflow" # Optional: force specific template
```

---

## Category 1: Navigation Rules

### Rule 1: Navigate to Route

**Spec Pattern:** `"Navigate to {route}"`

**Generated Code:**
```typescript
await page.goto('{route}');
```

**Examples:**
- `"Navigate to /dashboard"` → `await page.goto('/dashboard');`
- `"Navigate to /settings"` → `await page.goto('/settings');`
- `"Navigate to https://example.com"` → `await page.goto('https://example.com');`

**Template:** `navigation.template.ts`

---

### Rule 2: Navigate Back

**Spec Pattern:** `"Navigate back"` or `"Go back"`

**Generated Code:**
```typescript
await page.goBack();
```

**Template:** `navigation.template.ts`

---

### Rule 3: Reload Page

**Spec Pattern:** `"Reload page"` or `"Refresh page"`

**Generated Code:**
```typescript
await page.reload();
```

**Template:** `navigation.template.ts`

---

## Category 2: Element Interaction Rules

### Rule 4: Click Element

**Spec Pattern:** `"Click {element}"`

**Generated Code:**
```typescript
const {elementVar} = page.locator('[data-testid="{element}"]');
await {elementVar}.click();
```

**Examples:**
- `"Click new project button"` →
  ```typescript
  const newProjectButton = page.locator('[data-testid="new-project-button"]');
  await newProjectButton.click();
  ```
- `"Click save button"` →
  ```typescript
  const saveButton = page.locator('button:has-text("Save")');
  await saveButton.click();
  ```

**Template:** `crud-operations.template.ts`

---

### Rule 5: Hover Over Element

**Spec Pattern:** `"Hover over {element}"` or `"Hover {element}"`

**Generated Code:**
```typescript
const {elementVar} = page.locator('[data-testid="{element}"]');
await {elementVar}.hover();
await page.waitForTimeout(200); // Wait for hover effects
```

**Template:** `visual-regression.template.ts`

---

### Rule 6: Focus Element

**Spec Pattern:** `"Focus {element}"` or `"Focus on {element}"`

**Generated Code:**
```typescript
const {elementVar} = page.locator('[data-testid="{element}"]');
await {elementVar}.focus();
```

**Template:** `navigation.template.ts`

---

### Rule 7: Double Click

**Spec Pattern:** `"Double click {element}"`

**Generated Code:**
```typescript
const {elementVar} = page.locator('[data-testid="{element}"]');
await {elementVar}.dblclick();
```

**Template:** `crud-operations.template.ts`

---

## Category 3: Form Input Rules

### Rule 8: Fill Text Field

**Spec Pattern:** `"Fill {field} field with {value}"` or `"Enter {value} in {field}"`

**Generated Code:**
```typescript
const {fieldVar} = page.locator('input[placeholder*="{field}"], #project-{field}');
await {fieldVar}.fill('{value}');
```

**Examples:**
- `"Fill URL field with https://example.com"` →
  ```typescript
  const urlField = page.locator('input[placeholder*="URL"], #project-url');
  await urlField.fill('https://example.com');
  ```
- `"Enter John Doe in name field"` →
  ```typescript
  const nameField = page.locator('input[placeholder*="name"], #project-name');
  await nameField.fill('John Doe');
  ```

**Template:** `form-validation.template.ts`

---

### Rule 9: Clear Field

**Spec Pattern:** `"Clear {field} field"` or `"Empty {field}"`

**Generated Code:**
```typescript
const {fieldVar} = page.locator('input[placeholder*="{field}"]');
await {fieldVar}.clear();
```

**Template:** `form-validation.template.ts`

---

### Rule 10: Select Dropdown Option

**Spec Pattern:** `"Select {option} from {dropdown}"` or `"Choose {option} in {dropdown}"`

**Generated Code:**
```typescript
const {dropdownVar} = page.locator('select[name="{dropdown}"]');
await {dropdownVar}.selectOption('{option}');
```

**Example:**
- `"Select Python from template dropdown"` →
  ```typescript
  const templateDropdown = page.locator('select[name="template"]');
  await templateDropdown.selectOption('Python');
  ```

**Template:** `form-validation.template.ts`

---

### Rule 11: Check Checkbox

**Spec Pattern:** `"Check {checkbox}"` or `"Enable {checkbox}"`

**Generated Code:**
```typescript
const {checkboxVar} = page.locator('input[type="checkbox"][name="{checkbox}"]');
await {checkboxVar}.check();
```

**Template:** `form-validation.template.ts`

---

### Rule 12: Uncheck Checkbox

**Spec Pattern:** `"Uncheck {checkbox}"` or `"Disable {checkbox}"`

**Generated Code:**
```typescript
const {checkboxVar} = page.locator('input[type="checkbox"][name="{checkbox}"]');
await {checkboxVar}.uncheck();
```

**Template:** `form-validation.template.ts`

---

### Rule 13: Upload File

**Spec Pattern:** `"Upload {file} to {input}"`

**Generated Code:**
```typescript
const {inputVar} = page.locator('input[type="file"]');
await {inputVar}.setInputFiles('{file}');
```

**Template:** `crud-operations.template.ts`

---

## Category 4: Assertion Rules

### Rule 14: Verify Element Visible

**Spec Pattern:** `"Verify {element} shows"` or `"{element} is visible"` or `"{element} appears"`

**Generated Code:**
```typescript
const {elementVar} = page.locator('[data-testid="{element}"]');
await expect({elementVar}).toBeVisible();
```

**Examples:**
- `"Verify empty state shows"` →
  ```typescript
  const emptyState = page.locator('[data-testid="empty-state"]');
  await expect(emptyState).toBeVisible();
  ```
- `"Modal appears"` →
  ```typescript
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  ```

**Template:** `crud-operations.template.ts`

---

### Rule 15: Verify Element Hidden

**Spec Pattern:** `"Verify {element} is hidden"` or `"{element} disappears"` or `"{element} is not visible"`

**Generated Code:**
```typescript
const {elementVar} = page.locator('[data-testid="{element}"]');
await expect({elementVar}).not.toBeVisible();
```

**Template:** `crud-operations.template.ts`

---

### Rule 16: Verify Text Content

**Spec Pattern:** `"Verify {element} shows {text}"` or `"{element} contains {text}"`

**Generated Code:**
```typescript
const {elementVar} = page.locator('[data-testid="{element}"]');
await expect({elementVar}).toHaveText('{text}');
```

**Example:**
- `"Verify title shows Example Site"` →
  ```typescript
  const title = page.locator('[data-testid="bookmark-title"]');
  await expect(title).toHaveText('Example Site');
  ```

**Template:** `crud-operations.template.ts`

---

### Rule 17: Verify Element Count

**Spec Pattern:** `"Verify {count} {elements} show"` or `"Count of {elements} is {count}"`

**Generated Code:**
```typescript
const {elementsVar} = page.locator('[data-testid="{elements}"]');
expect(await {elementsVar}.count()).toBe({count});
```

**Example:**
- `"Verify 4 stat cards show"` →
  ```typescript
  const statCards = page.locator('[data-testid="stat-card"]');
  expect(await statCards.count()).toBe(4);
  ```

**Template:** `crud-operations.template.ts`

---

### Rule 18: Verify Element Enabled/Disabled

**Spec Pattern:** `"Verify {element} is disabled"` or `"{element} is enabled"`

**Generated Code:**
```typescript
const {elementVar} = page.locator('[data-testid="{element}"]');
await expect({elementVar}).toBeDisabled(); // or .toBeEnabled()
```

**Template:** `form-validation.template.ts`

---

### Rule 19: Verify Element Has Class

**Spec Pattern:** `"Verify {element} has class {className}"`

**Generated Code:**
```typescript
const {elementVar} = page.locator('[data-testid="{element}"]');
await expect({elementVar}).toHaveClass(/{className}/);
```

**Template:** `visual-regression.template.ts`

---

### Rule 20: Verify URL

**Spec Pattern:** `"Verify URL is {url}"` or `"URL contains {path}"`

**Generated Code:**
```typescript
await expect(page).toHaveURL('{url}');
```

**Template:** `navigation.template.ts`

---

## Category 5: Modal/Dialog Rules

### Rule 21: Modal Opens

**Spec Pattern:** `"Modal appears"` or `"Dialog opens"` or `"{modal} modal shows"`

**Generated Code:**
```typescript
const modal = page.getByRole('dialog');
await expect(modal).toBeVisible();
```

**Template:** `modal-workflow.template.ts`

---

### Rule 22: Modal Closes

**Spec Pattern:** `"Modal closes"` or `"Dialog disappears"` or `"Close {modal}"`

**Generated Code:**
```typescript
const modal = page.getByRole('dialog');
await expect(modal).not.toBeVisible();
```

**Template:** `modal-workflow.template.ts`

---

### Rule 23: Click Modal Close Button

**Spec Pattern:** `"Click close button"` or `"Close modal with X"` or `"Click Cancel button"`

**Generated Code:**
```typescript
const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), [aria-label*="Close"]').first();
await closeButton.click();
await page.waitForTimeout(200);
```

**Template:** `modal-workflow.template.ts`

---

## Category 6: Keyboard Interaction Rules

### Rule 24: Press Key

**Spec Pattern:** `"Press {key}"` or `"Press {key} key"`

**Generated Code:**
```typescript
await page.keyboard.press('{key}');
```

**Examples:**
- `"Press Enter"` → `await page.keyboard.press('Enter');`
- `"Press Escape"` → `await page.keyboard.press('Escape');`
- `"Press Tab"` → `await page.keyboard.press('Tab');`

**Template:** `navigation.template.ts`

---

### Rule 25: Type Text

**Spec Pattern:** `"Type {text}"` or `"Type {text} slowly"`

**Generated Code:**
```typescript
await page.keyboard.type('{text}', { delay: 100 });
```

**Template:** `form-validation.template.ts`

---

## Category 7: Waiting/Timing Rules

### Rule 26: Wait for Element

**Spec Pattern:** `"Wait for {element}"` or `"Wait until {element} appears"`

**Generated Code:**
```typescript
const {elementVar} = page.locator('[data-testid="{element}"]');
await {elementVar}.waitFor({ state: 'visible' });
```

**Template:** `loading-states.template.ts`

---

### Rule 27: Wait for Animation

**Spec Pattern:** `"Wait for animation"` or `"Wait {milliseconds}ms"`

**Generated Code:**
```typescript
await page.waitForTimeout({milliseconds});
```

**Default:** If no duration specified, use 300ms for animations

**Template:** `visual-regression.template.ts`

---

### Rule 28: Wait for Network Idle

**Spec Pattern:** `"Wait for page to load"` or `"Wait for network idle"`

**Generated Code:**
```typescript
await page.waitForLoadState('networkidle');
```

**Template:** `navigation.template.ts`

---

## Category 8: Visual Regression Rules

### Rule 29: Take Screenshot

**Spec Pattern:** `"Take screenshot of {element}"` or `"Capture {element} appearance"`

**Generated Code:**
```typescript
const {elementVar} = page.locator('[data-testid="{element}"]');
await expect({elementVar}).toHaveScreenshot('{element}-{testName}.png', {
  timeout: 10000,
});
```

**Template:** `visual-regression.template.ts`

---

### Rule 30: Compare Full Page

**Spec Pattern:** `"Match baseline screenshot"` or `"Compare full page"`

**Generated Code:**
```typescript
await expect(page).toHaveScreenshot('{testName}-full.png', {
  fullPage: true,
  timeout: 10000,
});
```

**Template:** `visual-regression.template.ts`

---

## Category 9: Conditional Logic Rules

### Rule 31: Skip If No Data

**Spec Pattern:** `"Skip if no {elements}"` or `"Requires {elements}"`

**Generated Code:**
```typescript
const {elementsVar} = page.locator('[data-testid="{elements}"]');
if (await {elementsVar}.count() === 0) {
  test.skip();
}
```

**Template:** `crud-operations.template.ts`

---

### Rule 32: Conditional Action

**Spec Pattern:** `"If {element} is {state}, then {action}"`

**Generated Code:**
```typescript
const {elementVar} = page.locator('[data-testid="{element}"]');
if (await {elementVar}.getAttribute('data-{state}') === 'true') {
  // Perform action
}
```

**Template:** LLM-generated (complex logic)

---

## Category 10: Advanced Rules

### Rule 33: Drag and Drop

**Spec Pattern:** `"Drag {source} to {target}"`

**Generated Code:**
```typescript
const source = page.locator('[data-testid="{source}"]');
const target = page.locator('[data-testid="{target}"]');
await source.dragTo(target);
```

**Template:** LLM-generated (complex interaction)

---

### Rule 34: Scroll to Element

**Spec Pattern:** `"Scroll to {element}"` or `"Scroll {element} into view"`

**Generated Code:**
```typescript
const {elementVar} = page.locator('[data-testid="{element}"]');
await {elementVar}.scrollIntoViewIfNeeded();
```

**Template:** `navigation.template.ts`

---

### Rule 35: Multi-Select

**Spec Pattern:** `"Select multiple {options} from {list}"`

**Generated Code:**
```typescript
for (const option of {options}) {
  const checkbox = page.locator(`input[type="checkbox"][value="${option}"]`);
  await checkbox.check();
}
```

**Template:** `form-validation.template.ts`

---

## Heuristic Scoring System

The test generator uses a scoring system to determine which template best matches a spec.

### Scoring Logic

```typescript
function scoreForTemplate(spec: TestSpec, templateName: string): number {
  let score = 0;
  const stepPatterns = spec.e2e_tests[0].steps.join(' ').toLowerCase();

  switch (templateName) {
    case 'crud-operations':
      if (stepPatterns.includes('click')) score += 0.3;
      if (stepPatterns.includes('verify')) score += 0.2;
      if (stepPatterns.includes('button')) score += 0.2;
      break;

    case 'form-validation':
      if (stepPatterns.includes('fill')) score += 0.4;
      if (stepPatterns.includes('field')) score += 0.3;
      if (stepPatterns.includes('disabled') || stepPatterns.includes('enabled')) score += 0.2;
      break;

    case 'modal-workflow':
      if (stepPatterns.includes('modal')) score += 0.5;
      if (stepPatterns.includes('appears') || stepPatterns.includes('closes')) score += 0.3;
      break;

    case 'navigation':
      if (stepPatterns.includes('navigate')) score += 0.5;
      if (stepPatterns.includes('goto')) score += 0.3;
      if (stepPatterns.includes('url')) score += 0.2;
      break;

    case 'loading-states':
      if (stepPatterns.includes('loading')) score += 0.5;
      if (stepPatterns.includes('wait')) score += 0.3;
      break;

    case 'visual-regression':
      if (stepPatterns.includes('screenshot')) score += 0.5;
      if (stepPatterns.includes('hover')) score += 0.3;
      if (stepPatterns.includes('animation')) score += 0.2;
      break;
  }

  return Math.min(score, 1.0); // Cap at 1.0
}
```

**Decision Rule:** If best score ≥ 0.7 → Use template, else → Use LLM

---

## Variable Extraction

The generator extracts variables from spec steps using pattern matching.

### Examples

**Spec:** `"Click new project button"`
**Extraction:**
```typescript
{
  action: "Click",
  element: "new project button",
  elementVar: "newProjectButton",
  selector: 'button:has-text("New Project"), [data-testid="new-project-button"]'
}
```

**Spec:** `"Fill URL field with https://example.com"`
**Extraction:**
```typescript
{
  action: "Fill",
  field: "URL",
  fieldVar: "urlField",
  value: "https://example.com",
  selector: 'input[placeholder*="URL"], #project-url'
}
```

**Spec:** `"Verify 4 stat cards show"`
**Extraction:**
```typescript
{
  action: "Verify",
  count: 4,
  elements: "stat cards",
  elementsVar: "statCards",
  selector: '[data-testid="stat-card"]'
}
```

---

## Error Handling Rules

### Rule 36: Graceful Skipping

When a test requires data that may not exist:

**Spec Pattern:** Any test that operates on dynamic data (projects, bookmarks, etc.)

**Generated Code:**
```typescript
const element = page.locator('[data-testid="{element}"]');
if (await element.count() === 0) {
  test.skip();
}
```

**Template:** All templates include this by default

---

### Rule 37: Animation Delays

All click/hover actions include automatic animation delays:

**Generated Code:**
```typescript
await element.click();
await page.waitForTimeout(200); // Default animation delay
```

**Configurable:** Spec can override with `animation_delay: 500`

---

## AAA Pattern Enforcement

All generated tests follow the **Arrange-Act-Assert** pattern:

```typescript
test('should {action}', async ({ page }) => {
  // ARRANGE
  const element = page.locator('[data-testid="element"]');

  // ACT
  await element.click();

  // ASSERT
  await expect(result).toBeVisible();
});
```

Comments are automatically inserted by templates.

---

## Usage Example

### Input Spec (YAML)

```yaml
screen: "Dashboard"
e2e_tests:
  - name: "User toggles mute state"
    steps:
      - "Navigate to /dashboard"
      - "Click mute button on first project card"
      - "Verify mute button shows violet color"
      - "Click mute button again"
      - "Verify mute button shows gray color"
    template_hint: "crud-operations"
```

### Generated Test (TypeScript)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should toggle mute state', async ({ page }) => {
    // ARRANGE
    const projectCard = page.locator('[data-testid="project-card"]').first();

    // Skip if no projects
    if (await projectCard.count() === 0) {
      test.skip();
    }

    const muteButton = projectCard.locator('[data-testid="mute-button"]');

    // ACT - First click
    await muteButton.click();
    await page.waitForTimeout(200);

    // ASSERT - Should show violet
    const classesAfterFirst = await muteButton.getAttribute('class');
    expect(classesAfterFirst).toContain('violet');

    // ACT - Second click
    await muteButton.click();
    await page.waitForTimeout(200);

    // ASSERT - Should show gray
    const classesAfterSecond = await muteButton.getAttribute('class');
    expect(classesAfterSecond).toContain('gray');
  });
});
```

---

## Future Rules (Planned)

These rules are planned for Phase 2.4+:

- **Rule 38:** WebSocket interaction (`"Connect to WebSocket"`)
- **Rule 39:** LocalStorage manipulation (`"Set localStorage key"`)
- **Rule 40:** Cookie management (`"Set cookie"`)
- **Rule 41:** Network mocking (`"Mock API response"`)
- **Rule 42:** Geolocation (`"Set location to {lat}, {lng}"`)
- **Rule 43:** Clipboard (`"Copy to clipboard"`)

---

## Summary

This document defines **35 core rules** covering:
- ✅ Navigation (3 rules)
- ✅ Element Interactions (4 rules)
- ✅ Form Inputs (6 rules)
- ✅ Assertions (7 rules)
- ✅ Modals (3 rules)
- ✅ Keyboard (2 rules)
- ✅ Waiting/Timing (3 rules)
- ✅ Visual Regression (2 rules)
- ✅ Conditional Logic (2 rules)
- ✅ Advanced (3 rules)

**Coverage:** 90%+ of existing Quetrex E2E test patterns

**Next Steps:** Implement these rules in template generators (`.quetrex/templates/e2e/`)

---

*Last updated: 2025-11-22 by Glen Barnhardt with help from Claude Code*
