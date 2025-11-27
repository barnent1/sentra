/**
 * Navigation Template
 *
 * Handles: Route navigation, keyboard navigation, focus management
 * Coverage: ~31 tests (15% of total)
 *
 * Use Cases:
 * - Page navigation (goto, goBack, reload)
 * - Keyboard navigation (Tab, Enter, Arrow keys)
 * - Focus management
 * - URL verification
 */

// ============================================================================
// TEMPLATE CODE
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('{{SCREEN}} - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('{{ROUTE}}');
  });

  test('should {{ACTION}} when {{TRIGGER}}', async ({ page }) => {
    // ARRANGE
    {{#ELEMENT_SETUP}}
    const {{ELEMENT_VAR}} = page.locator('{{ELEMENT_SELECTOR}}');
    {{/ELEMENT_SETUP}}

    // ACT
    {{#NAVIGATION_ACTION}}
    await page.goto('{{TARGET_ROUTE}}');
    {{/NAVIGATION_ACTION}}
    {{#KEYBOARD_ACTION}}
    await {{ELEMENT_VAR}}.focus();
    await page.keyboard.press('{{KEY}}');
    {{/KEYBOARD_ACTION}}
    {{#CLICK_ACTION}}
    await {{ELEMENT_VAR}}.click();
    {{/CLICK_ACTION}}
    await page.waitForTimeout({{ANIMATION_DELAY}});

    // ASSERT
    {{#URL_ASSERTION}}
    await expect(page).toHaveURL('{{EXPECTED_URL}}');
    {{/URL_ASSERTION}}
    {{#ELEMENT_VISIBLE_ASSERTION}}
    const {{TARGET_VAR}} = page.locator('{{TARGET_SELECTOR}}');
    await expect({{TARGET_VAR}}).toBeVisible();
    {{/ELEMENT_VISIBLE_ASSERTION}}
    {{#FOCUS_ASSERTION}}
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    {{/FOCUS_ASSERTION}}
  });
});

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Navigate to Route
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Navigate to dashboard"
 *     steps:
 *       - "Navigate to /dashboard"
 *       - "Verify URL is /dashboard"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should navigate to dashboard', async ({ page }) => {
 *   await page.goto('/dashboard');
 *   await expect(page).toHaveURL('/dashboard');
 * });
 * ```
 */

/**
 * Example 2: Keyboard Navigation
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Tab through form fields"
 *     steps:
 *       - "Focus first field"
 *       - "Press Tab"
 *       - "Next field receives focus"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should allow keyboard navigation between fields', async ({ page }) => {
 *   const firstField = page.locator('input').first();
 *   await firstField.focus();
 *   await page.keyboard.press('Tab');
 *
 *   const focusedElement = await page.locator(':focus');
 *   await expect(focusedElement).toBeVisible();
 * });
 * ```
 */

/**
 * Example 3: Open with Enter Key
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Open panel with Enter"
 *     steps:
 *       - "Focus project card"
 *       - "Press Enter"
 *       - "Detail panel appears"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should open detail panel with Enter key', async ({ page }) => {
 *   const projectCard = page.locator('[data-testid="project-card"]').first();
 *   await projectCard.focus();
 *   await page.keyboard.press('Enter');
 *   await page.waitForTimeout(300);
 *
 *   const detailPanel = page.locator('[data-testid="project-detail-panel"]');
 *   await expect(detailPanel).toBeVisible();
 * });
 * ```
 */

// ============================================================================
// TEMPLATE METADATA
// ============================================================================

/**
 * Template: navigation.template.ts
 * Version: 1.0.0
 * Last Updated: 2025-11-22
 * Author: Glen Barnhardt with Claude Code
 *
 * Test Coverage:
 * - Route navigation (8 tests)
 * - Keyboard navigation (11 tests)
 * - Focus management (12 tests)
 * - Total: ~31 tests (15% of 208)
 *
 * Pattern Matching Score:
 * - Keywords: "navigate", "goto", "keyboard", "tab", "enter", "focus"
 * - Weight: 0.5 for "navigate", 0.3 for keyboard actions
 * - Threshold: 0.7 for template selection
 */
