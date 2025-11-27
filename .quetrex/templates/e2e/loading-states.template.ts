/**
 * Loading States Template
 *
 * Handles: Loading indicators, skeleton screens, async data loading
 * Coverage: ~12 tests (6% of total)
 *
 * Use Cases:
 * - Loading spinners
 * - Skeleton screens
 * - "Creating..." / "Saving..." button states
 * - Wait for data to load
 */

// ============================================================================
// TEMPLATE CODE
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('{{SCREEN}} - Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('{{ROUTE}}');
  });

  test('should {{ACTION}} when {{TRIGGER}}', async ({ page }) => {
    // ARRANGE
    {{#SETUP_ACTIONS}}
    const {{SETUP_VAR}} = page.locator('{{SETUP_SELECTOR}}');
    await {{SETUP_VAR}}.{{SETUP_METHOD}}();
    {{/SETUP_ACTIONS}}

    // ACT
    const {{TRIGGER_VAR}} = page.locator('{{TRIGGER_SELECTOR}}');
    await {{TRIGGER_VAR}}.click();

    // ASSERT - Loading state appears
    {{#LOADING_ASSERTION}}
    const {{LOADING_VAR}} = page.locator('{{LOADING_SELECTOR}}');
    await expect({{LOADING_VAR}}).toBeVisible();
    {{/LOADING_ASSERTION}}

    // Wait for loading to complete
    {{#WAIT_FOR_COMPLETION}}
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout({{COMPLETION_DELAY}});
    {{/WAIT_FOR_COMPLETION}}

    // ASSERT - Loading state disappears
    {{#COMPLETED_ASSERTION}}
    await expect({{LOADING_VAR}}).not.toBeVisible();
    {{/COMPLETED_ASSERTION}}
  });
});

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Button Loading State
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Show loading state when creating project"
 *     steps:
 *       - "Click Create Project button"
 *       - "Verify button shows 'Creating...'"
 *       - "Wait for completion"
 *       - "Button returns to normal"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should show loading state when creating project', async ({ page }) => {
 *   const createButton = page.locator('button:has-text("Create Project")');
 *   await createButton.click();
 *
 *   const loadingButton = page.locator('button:has-text("Creating...")');
 *   await expect(loadingButton).toBeVisible();
 *
 *   await page.waitForLoadState('networkidle');
 *   await expect(loadingButton).not.toBeVisible();
 * });
 * ```
 */

/**
 * Example 2: Wait for Element
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Wait for stat cards to load"
 *     steps:
 *       - "Navigate to dashboard"
 *       - "Wait for stat cards"
 *       - "Verify 4 cards visible"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should wait for stat cards to load', async ({ page }) => {
 *   const statCards = page.locator('[data-testid="stat-card"]');
 *   await statCards.first().waitFor({ state: 'visible' });
 *
 *   expect(await statCards.count()).toBe(4);
 * });
 * ```
 */

// ============================================================================
// TEMPLATE METADATA
// ============================================================================

/**
 * Template: loading-states.template.ts
 * Version: 1.0.0
 * Last Updated: 2025-11-22
 * Author: Glen Barnhardt with Claude Code
 *
 * Test Coverage:
 * - Loading buttons (4 tests)
 * - Wait for elements (6 tests)
 * - Network idle (2 tests)
 * - Total: ~12 tests (6% of 208)
 *
 * Pattern Matching Score:
 * - Keywords: "loading", "wait", "creating", "saving", "skeleton"
 * - Weight: 0.5 for "loading", 0.3 for "wait"
 * - Threshold: 0.7 for template selection
 */
