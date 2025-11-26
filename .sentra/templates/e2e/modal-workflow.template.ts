/**
 * Modal Workflow Template
 *
 * Handles: Modal open/close, backdrop, escape key, form submission
 * Coverage: ~24 tests (12% of total)
 *
 * Use Cases:
 * - Opening modals via button/trigger
 * - Closing modals (X button, Cancel, Escape)
 * - Backdrop blur effects
 * - Form submission within modals
 * - Modal animations
 */

// ============================================================================
// TEMPLATE CODE
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('{{MODAL_NAME}} - Modal Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('{{ROUTE}}');
  });

  test('should {{ACTION}} when {{TRIGGER}}', async ({ page }) => {
    // ARRANGE
    const {{TRIGGER_VAR}} = page.locator('{{TRIGGER_SELECTOR}}');

    // ACT
    await {{TRIGGER_VAR}}.{{TRIGGER_METHOD}}();
    await page.waitForTimeout({{MODAL_ANIMATION_DELAY}});

    // ASSERT
    const {{MODAL_VAR}} = page.{{MODAL_LOCATOR_METHOD}}('{{MODAL_LOCATOR_VALUE}}');
    await expect({{MODAL_VAR}}).{{MODAL_ASSERTION}}();
  });
});

// ============================================================================
// VARIABLE DEFINITIONS
// ============================================================================

/**
 * MODAL_NAME: string (required)
 *   - Name of the modal being tested
 *   - Example: "Project Creation Modal", "Settings Modal"
 *
 * ROUTE: string (required)
 *   - Initial route
 *   - Example: "/", "/dashboard"
 *
 * ACTION: string (required)
 *   - What happens (human-readable)
 *   - Example: "open modal", "close modal", "show backdrop"
 *
 * TRIGGER: string (required)
 *   - How action is triggered
 *   - Example: "clicking New Project button", "pressing Escape"
 *
 * TRIGGER_VAR: identifier (required)
 *   - Variable for trigger element
 *   - Example: "newProjectButton", "closeButton"
 *
 * TRIGGER_SELECTOR: string (required)
 *   - Selector for trigger
 *   - Example: 'button:has-text("New Project")'
 *
 * TRIGGER_METHOD: string (required)
 *   - Method to trigger action
 *   - Options: "click", "press('Escape')", "hover"
 *   - Example: "click"
 *
 * MODAL_ANIMATION_DELAY: number (optional, default: 200)
 *   - Delay for modal animation
 *   - Example: 200, 300
 *
 * MODAL_VAR: identifier (required)
 *   - Variable for modal element
 *   - Example: "modal", "dialog"
 *
 * MODAL_LOCATOR_METHOD: string (required)
 *   - Playwright method to find modal
 *   - Options: "getByRole", "locator", "getByText"
 *   - Example: "getByRole"
 *
 * MODAL_LOCATOR_VALUE: string (required)
 *   - Value for locator method
 *   - Example: "dialog", "text=Create New Project"
 *
 * MODAL_ASSERTION: string (required)
 *   - Assertion method
 *   - Options: "toBeVisible", "not.toBeVisible"
 *   - Example: "toBeVisible"
 */

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Open Modal
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Open new project modal"
 *     steps:
 *       - "Click New Project button"
 *       - "Modal appears"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should open modal when clicking New Project button', async ({ page }) => {
 *   const newProjectButton = page.locator('button:has-text("New Project")').first();
 *   await newProjectButton.click();
 *   await page.waitForTimeout(200);
 *
 *   const modal = page.getByRole('dialog');
 *   await expect(modal).toBeVisible();
 * });
 * ```
 */

/**
 * Example 2: Close Modal with X Button
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Close modal with X button"
 *     steps:
 *       - "Open modal"
 *       - "Click X button"
 *       - "Modal disappears"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should close modal when clicking X button', async ({ page }) => {
 *   const newProjectButton = page.locator('button:has-text("New Project")').first();
 *   await newProjectButton.click();
 *   await page.waitForTimeout(200);
 *
 *   const closeButton = page.locator('button:has([class*="w-6 h-6"])').first();
 *   await closeButton.click();
 *   await page.waitForTimeout(200);
 *
 *   const modal = page.getByRole('dialog');
 *   await expect(modal).not.toBeVisible();
 * });
 * ```
 */

/**
 * Example 3: Close Modal with Escape Key
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Close modal with Escape"
 *     steps:
 *       - "Open modal"
 *       - "Press Escape"
 *       - "Modal disappears"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should close modal when pressing Escape key', async ({ page }) => {
 *   const newProjectButton = page.locator('button:has-text("New Project")').first();
 *   await newProjectButton.click();
 *   await page.waitForTimeout(200);
 *
 *   await page.keyboard.press('Escape');
 *   await page.waitForTimeout(200);
 *
 *   const modal = page.getByRole('dialog');
 *   await expect(modal).not.toBeVisible();
 * });
 * ```
 */

/**
 * Example 4: Backdrop Blur
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Show backdrop blur"
 *     steps:
 *       - "Open modal"
 *       - "Verify backdrop blur appears"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should have backdrop blur effect when modal is open', async ({ page }) => {
 *   const newProjectButton = page.locator('button:has-text("New Project")').first();
 *   await newProjectButton.click();
 *   await page.waitForTimeout(200);
 *
 *   const backdrop = page.locator('.backdrop-blur-sm, [class*="backdrop-blur"]').first();
 *   await expect(backdrop).toBeVisible();
 * });
 * ```
 */

// ============================================================================
// TEMPLATE METADATA
// ============================================================================

/**
 * Template: modal-workflow.template.ts
 * Version: 1.0.0
 * Last Updated: 2025-11-22
 * Author: Glen Barnhardt with Claude Code
 *
 * Test Coverage:
 * - Modal opening (8 tests)
 * - Modal closing (12 tests)
 * - Backdrop effects (4 tests)
 * - Total: ~24 tests (12% of 208)
 *
 * Pattern Matching Score:
 * - Keywords: "modal", "appears", "closes", "dialog", "backdrop"
 * - Weight: 0.5 for "modal", 0.3 for "appears/closes"
 * - Threshold: 0.7 for template selection
 */
