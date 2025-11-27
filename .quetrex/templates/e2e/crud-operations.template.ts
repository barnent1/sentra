/**
 * CRUD Operations Template
 *
 * Handles: Click, Verify, Toggle, Count patterns
 * Coverage: ~52 tests (25% of total)
 *
 * Use Cases:
 * - Button clicks with state changes
 * - Element visibility checks
 * - Toggle operations (mute/unmute, show/hide)
 * - Count validations
 */

// ============================================================================
// TEMPLATE CODE
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('{{SCREEN}}', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('{{ROUTE}}');
  });

  test('should {{ACTION}} when {{TRIGGER}}', async ({ page }) => {
    // ARRANGE
    const {{ELEMENT_VAR}} = page.locator('{{ELEMENT_SELECTOR}}');

    // Skip if no data (optional conditional)
    {{#SKIP_IF_EMPTY}}
    if (await {{ELEMENT_VAR}}.count() === 0) {
      test.skip();
    }
    {{/SKIP_IF_EMPTY}}

    // ACT
    await {{ELEMENT_VAR}}.{{ACTION_METHOD}}();
    await page.waitForTimeout({{ANIMATION_DELAY}});

    // ASSERT
    {{#ASSERTIONS}}
    const {{ASSERTION_VAR}} = page.locator('{{ASSERTION_SELECTOR}}');
    await expect({{ASSERTION_VAR}}).{{ASSERTION_METHOD}}();
    {{/ASSERTIONS}}
  });
});

// ============================================================================
// VARIABLE DEFINITIONS
// ============================================================================

/**
 * Variables used in this template:
 *
 * SCREEN: string (required)
 *   - The screen/page being tested
 *   - Example: "Dashboard", "Settings Modal", "Project Creation"
 *
 * ROUTE: string (required)
 *   - The route to navigate to before test
 *   - Example: "/", "/dashboard", "/settings"
 *
 * ACTION: string (required)
 *   - The action being performed (human-readable)
 *   - Example: "toggle mute state", "open detail panel", "show stats"
 *
 * TRIGGER: string (required)
 *   - What triggers the action (human-readable)
 *   - Example: "clicking mute button", "hovering card", "loading page"
 *
 * ELEMENT_VAR: identifier (required)
 *   - Variable name for the element (camelCase)
 *   - Example: "muteButton", "projectCard", "statCard"
 *
 * ELEMENT_SELECTOR: string (required)
 *   - Playwright locator selector
 *   - Example: '[data-testid="mute-button"]', 'button:has-text("Save")'
 *
 * ACTION_METHOD: string (required)
 *   - Playwright action method
 *   - Options: "click", "hover", "focus", "dblclick"
 *   - Example: "click"
 *
 * ANIMATION_DELAY: number (optional, default: 200)
 *   - Milliseconds to wait for animations
 *   - Example: 200, 300, 500
 *
 * SKIP_IF_EMPTY: boolean (optional, default: false)
 *   - Whether to skip test if element doesn't exist
 *   - Example: true (for tests that need data)
 *
 * ASSERTIONS: array (required)
 *   - Array of assertion objects
 *   - Each assertion has:
 *     - ASSERTION_VAR: identifier (variable name)
 *     - ASSERTION_SELECTOR: string (locator selector)
 *     - ASSERTION_METHOD: string (expect method)
 *
 * ASSERTION_METHOD options:
 *   - "toBeVisible()"
 *   - "not.toBeVisible()"
 *   - "toHaveText('{text}')"
 *   - "toHaveClass(/{className}/)"
 *   - "toBeEnabled()"
 *   - "toBeDisabled()"
 */

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Toggle Mute Button
 *
 * Input YAML:
 * ```yaml
 * screen: "Dashboard"
 * e2e_tests:
 *   - name: "User toggles mute state"
 *     steps:
 *       - "Navigate to /dashboard"
 *       - "Click mute button"
 *       - "Verify mute button shows violet color"
 * ```
 *
 * Generated Variables:
 * {
 *   SCREEN: "Dashboard",
 *   ROUTE: "/",
 *   ACTION: "toggle mute state",
 *   TRIGGER: "clicking mute button",
 *   ELEMENT_VAR: "muteButton",
 *   ELEMENT_SELECTOR: '[data-testid="mute-button"]',
 *   ACTION_METHOD: "click",
 *   ANIMATION_DELAY: 200,
 *   SKIP_IF_EMPTY: true,
 *   ASSERTIONS: [
 *     {
 *       ASSERTION_VAR: "muteButton",
 *       ASSERTION_SELECTOR: '[data-testid="mute-button"]',
 *       ASSERTION_METHOD: "toHaveClass(/violet/)"
 *     }
 *   ]
 * }
 *
 * Generated Test:
 * ```typescript
 * test('should toggle mute state when clicking mute button', async ({ page }) => {
 *   const muteButton = page.locator('[data-testid="mute-button"]');
 *
 *   if (await muteButton.count() === 0) {
 *     test.skip();
 *   }
 *
 *   await muteButton.click();
 *   await page.waitForTimeout(200);
 *
 *   const muteButton = page.locator('[data-testid="mute-button"]');
 *   await expect(muteButton).toHaveClass(/violet/);
 * });
 * ```
 */

/**
 * Example 2: Count Stat Cards
 *
 * Input YAML:
 * ```yaml
 * screen: "Dashboard"
 * e2e_tests:
 *   - name: "Display all stat cards"
 *     steps:
 *       - "Navigate to /dashboard"
 *       - "Verify 4 stat cards show"
 * ```
 *
 * Generated Variables:
 * {
 *   SCREEN: "Dashboard",
 *   ROUTE: "/",
 *   ACTION: "display all stat cards",
 *   TRIGGER: "loading page",
 *   ELEMENT_VAR: "statCards",
 *   ELEMENT_SELECTOR: '[data-testid="stat-card"]',
 *   ACTION_METHOD: "count",
 *   ANIMATION_DELAY: 0,
 *   SKIP_IF_EMPTY: false,
 *   ASSERTIONS: [
 *     {
 *       ASSERTION_VAR: "statCards",
 *       ASSERTION_SELECTOR: '[data-testid="stat-card"]',
 *       ASSERTION_METHOD: "count().toBe(4)"
 *     }
 *   ]
 * }
 *
 * Generated Test:
 * ```typescript
 * test('should display all stat cards when loading page', async ({ page }) => {
 *   const statCards = page.locator('[data-testid="stat-card"]');
 *   expect(await statCards.count()).toBe(4);
 * });
 * ```
 */

/**
 * Example 3: Open Detail Panel
 *
 * Input YAML:
 * ```yaml
 * screen: "Dashboard"
 * e2e_tests:
 *   - name: "Open project detail panel"
 *     steps:
 *       - "Navigate to /dashboard"
 *       - "Click project card"
 *       - "Verify detail panel appears"
 * ```
 *
 * Generated Variables:
 * {
 *   SCREEN: "Dashboard",
 *   ROUTE: "/",
 *   ACTION: "open detail panel",
 *   TRIGGER: "clicking project card",
 *   ELEMENT_VAR: "projectCard",
 *   ELEMENT_SELECTOR: '[data-testid="project-card"]',
 *   ACTION_METHOD: "click",
 *   ANIMATION_DELAY: 300,
 *   SKIP_IF_EMPTY: true,
 *   ASSERTIONS: [
 *     {
 *       ASSERTION_VAR: "detailPanel",
 *       ASSERTION_SELECTOR: '[data-testid="project-detail-panel"]',
 *       ASSERTION_METHOD: "toBeVisible()"
 *     }
 *   ]
 * }
 *
 * Generated Test:
 * ```typescript
 * test('should open detail panel when clicking project card', async ({ page }) => {
 *   const projectCard = page.locator('[data-testid="project-card"]').first();
 *
 *   if (await projectCard.count() === 0) {
 *     test.skip();
 *   }
 *
 *   await projectCard.click();
 *   await page.waitForTimeout(300);
 *
 *   const detailPanel = page.locator('[data-testid="project-detail-panel"]');
 *   await expect(detailPanel).toBeVisible();
 * });
 * ```
 */

// ============================================================================
// EXPECTED OUTPUT (Full Example)
// ============================================================================

/**
 * Complete generated test file for "Dashboard Interactions":
 */

// import { test, expect } from '@playwright/test';
//
// test.describe('Dashboard Interactions - Project Cards', () => {
//   test.beforeEach(async ({ page }) => {
//     await page.goto('/');
//   });
//
//   test('should open detail panel when clicking project card', async ({ page }) => {
//     // ARRANGE
//     const projectCard = page.locator('[data-testid="project-card"]').first();
//
//     // Skip if no projects
//     if (await projectCard.count() === 0) {
//       test.skip();
//     }
//
//     // ACT
//     await projectCard.click();
//     await page.waitForTimeout(300);
//
//     // ASSERT
//     const detailPanel = page.locator('[data-testid="project-detail-panel"]');
//     await expect(detailPanel).toBeVisible();
//   });
//
//   test('should toggle mute state visually', async ({ page }) => {
//     // ARRANGE
//     const projectCard = page.locator('[data-testid="project-card"]').first();
//
//     // Skip if no projects
//     if (await projectCard.count() === 0) {
//       test.skip();
//     }
//
//     const muteButton = projectCard.locator('[data-testid="mute-button"]');
//     const initialIcon = await muteButton.locator('svg').getAttribute('class');
//
//     // ACT
//     await muteButton.click();
//     await page.waitForTimeout(200);
//
//     // ASSERT
//     const updatedIcon = await muteButton.locator('svg').getAttribute('class');
//     expect(updatedIcon).not.toBe(initialIcon);
//   });
//
//   test('should display all four stat cards', async ({ page }) => {
//     // ARRANGE & ACT
//     const statCards = page.locator('[data-testid="stat-card"]');
//
//     // ASSERT
//     expect(await statCards.count()).toBe(4);
//   });
// });

// ============================================================================
// TEMPLATE METADATA
// ============================================================================

/**
 * Template: crud-operations.template.ts
 * Version: 1.0.0
 * Last Updated: 2025-11-22
 * Author: Glen Barnhardt with Claude Code
 *
 * Test Coverage:
 * - Click interactions (24 tests)
 * - Visibility checks (18 tests)
 * - Toggle operations (6 tests)
 * - Count validations (4 tests)
 * - Total: ~52 tests (25% of 208)
 *
 * Pattern Matching Score:
 * - Keywords: "click", "verify", "toggle", "button", "count", "shows"
 * - Weight: 0.3 for "click", 0.2 for "verify", 0.2 for "button"
 * - Threshold: 0.7 for template selection
 */
