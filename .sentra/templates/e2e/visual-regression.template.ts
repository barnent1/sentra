/**
 * Visual Regression Template
 *
 * Handles: Screenshot comparison, hover states, animations, color accuracy
 * Coverage: ~28 tests (13% of total)
 *
 * Use Cases:
 * - Full page screenshots
 * - Component screenshots
 * - Hover state captures
 * - Animation frames
 * - Color accuracy checks
 * - Cross-browser consistency
 */

// ============================================================================
// TEMPLATE CODE
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('{{SCREEN}} - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('{{ROUTE}}');
    {{#WAIT_FOR_LOAD}}
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout({{INITIAL_DELAY}});
    {{/WAIT_FOR_LOAD}}
  });

  test('should {{ACTION}}', async ({ page }) => {
    // ARRANGE
    {{#VIEWPORT_SETUP}}
    await page.setViewportSize({ width: {{VIEWPORT_WIDTH}}, height: {{VIEWPORT_HEIGHT}} });
    await page.waitForTimeout({{VIEWPORT_DELAY}});
    {{/VIEWPORT_SETUP}}

    {{#ELEMENT_SETUP}}
    const {{ELEMENT_VAR}} = page.locator('{{ELEMENT_SELECTOR}}');
    {{#WAIT_FOR_ELEMENT}}
    await {{ELEMENT_VAR}}.waitFor({ state: 'visible' });
    {{/WAIT_FOR_ELEMENT}}
    {{/ELEMENT_SETUP}}

    {{#HOVER_SETUP}}
    await {{ELEMENT_VAR}}.hover();
    await page.waitForTimeout({{HOVER_DELAY}});
    {{/HOVER_SETUP}}

    {{#ANIMATION_WAIT}}
    await page.waitForTimeout({{ANIMATION_DELAY}});
    {{/ANIMATION_WAIT}}

    // ACT & ASSERT - Take screenshot
    {{#FULL_PAGE_SCREENSHOT}}
    await expect(page).toHaveScreenshot('{{SCREENSHOT_NAME}}.png', {
      fullPage: {{FULL_PAGE}},
      timeout: 10000,
      {{#ALLOW_ANIMATIONS}}
      animations: 'allow',
      {{/ALLOW_ANIMATIONS}}
      {{#MAX_DIFF_RATIO}}
      maxDiffPixelRatio: {{MAX_DIFF_RATIO}},
      {{/MAX_DIFF_RATIO}}
    });
    {{/FULL_PAGE_SCREENSHOT}}

    {{#ELEMENT_SCREENSHOT}}
    await expect({{ELEMENT_VAR}}).toHaveScreenshot('{{SCREENSHOT_NAME}}.png', {
      timeout: 10000,
      {{#ALLOW_ANIMATIONS}}
      animations: 'allow',
      {{/ALLOW_ANIMATIONS}}
    });
    {{/ELEMENT_SCREENSHOT}}
  });
});

// ============================================================================
// VARIABLE DEFINITIONS
// ============================================================================

/**
 * SCREEN: string (required)
 *   - Screen being tested
 *   - Example: "Dashboard", "Project Card"
 *
 * ROUTE: string (required)
 *   - Route to navigate to
 *   - Example: "/", "/dashboard"
 *
 * ACTION: string (required)
 *   - What's being captured
 *   - Example: "match dashboard layout baseline", "match hover state"
 *
 * WAIT_FOR_LOAD: boolean (optional, default: true)
 *   - Whether to wait for page load
 *
 * INITIAL_DELAY: number (optional, default: 500)
 *   - Delay after page load
 *
 * VIEWPORT_SETUP: boolean (optional)
 *   - Whether to set custom viewport
 *
 * VIEWPORT_WIDTH: number (conditional)
 *   - Viewport width
 *   - Example: 1920, 768, 375
 *
 * VIEWPORT_HEIGHT: number (conditional)
 *   - Viewport height
 *   - Example: 1080, 1024, 667
 *
 * VIEWPORT_DELAY: number (optional, default: 300)
 *   - Delay after viewport change
 *
 * ELEMENT_SETUP: boolean (optional)
 *   - Whether to select specific element
 *
 * ELEMENT_VAR: identifier (conditional)
 *   - Variable name for element
 *
 * ELEMENT_SELECTOR: string (conditional)
 *   - Selector for element
 *
 * WAIT_FOR_ELEMENT: boolean (optional)
 *   - Whether to wait for element
 *
 * HOVER_SETUP: boolean (optional)
 *   - Whether to hover element
 *
 * HOVER_DELAY: number (optional, default: 200)
 *   - Delay after hover
 *
 * ANIMATION_WAIT: boolean (optional)
 *   - Whether to wait for animation
 *
 * ANIMATION_DELAY: number (optional, default: 500)
 *   - Animation duration
 *
 * FULL_PAGE_SCREENSHOT: boolean (required)
 *   - Whether to capture full page
 *
 * ELEMENT_SCREENSHOT: boolean (required)
 *   - Whether to capture element only
 *
 * SCREENSHOT_NAME: string (required)
 *   - Filename for screenshot
 *   - Example: "dashboard-full-view", "project-card-hover"
 *
 * FULL_PAGE: boolean (conditional)
 *   - Whether to capture full scrollable page
 *
 * ALLOW_ANIMATIONS: boolean (optional)
 *   - Whether to allow animations in capture
 *
 * MAX_DIFF_RATIO: number (optional)
 *   - Max pixel difference ratio
 *   - Example: 0.01 (1% difference allowed)
 */

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Full Page Screenshot
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Match dashboard layout baseline"
 *     steps:
 *       - "Navigate to /"
 *       - "Wait for page load"
 *       - "Capture full page screenshot"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should match dashboard layout baseline', async ({ page }) => {
 *   await page.waitForLoadState('networkidle');
 *   await page.waitForTimeout(500);
 *
 *   await expect(page).toHaveScreenshot('dashboard-full-view.png', {
 *     fullPage: true,
 *     timeout: 10000,
 *   });
 * });
 * ```
 */

/**
 * Example 2: Hover State Screenshot
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Match project card hover state"
 *     steps:
 *       - "Navigate to /"
 *       - "Hover project card"
 *       - "Capture hover state"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should match project card hover state', async ({ page }) => {
 *   const projectCard = page.locator('[data-testid="project-card"]').first();
 *   await projectCard.hover();
 *   await page.waitForTimeout(200);
 *
 *   await expect(projectCard).toHaveScreenshot('project-card-hover.png', {
 *     timeout: 10000,
 *   });
 * });
 * ```
 */

/**
 * Example 3: Responsive Screenshots
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Match mobile viewport"
 *     steps:
 *       - "Set viewport to 375x667"
 *       - "Capture screenshot"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should match mobile viewport (375x667)', async ({ page }) => {
 *   await page.setViewportSize({ width: 375, height: 667 });
 *   await page.waitForTimeout(300);
 *
 *   await expect(page).toHaveScreenshot('dashboard-mobile.png', {
 *     fullPage: false,
 *     timeout: 10000,
 *   });
 * });
 * ```
 */

/**
 * Example 4: Component Screenshot
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Match stat cards appearance"
 *     steps:
 *       - "Navigate to /"
 *       - "Wait for stat cards"
 *       - "Capture stat cards"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should match stat cards appearance', async ({ page }) => {
 *   const statsGrid = page.locator('[data-testid="stats-grid"]');
 *   await statsGrid.waitFor({ state: 'visible' });
 *   await page.waitForTimeout(300);
 *
 *   await expect(statsGrid).toHaveScreenshot('stat-cards.png', {
 *     timeout: 10000,
 *   });
 * });
 * ```
 */

/**
 * Example 5: Animation Frame
 *
 * Input YAML:
 * ```yaml
 * e2e_tests:
 *   - name: "Match pulse animation"
 *     steps:
 *       - "Wait for animation"
 *       - "Capture mid-animation frame"
 * ```
 *
 * Generated Test:
 * ```typescript
 * test('should match active status indicator pulse animation', async ({ page }) => {
 *   const activeCard = page.locator('[data-testid="project-card"][data-status="active"]').first();
 *   const statusDot = activeCard.locator('[data-testid="status-indicator"]');
 *
 *   await page.waitForTimeout(500);
 *
 *   await expect(statusDot).toHaveScreenshot('status-pulse-animation.png', {
 *     timeout: 10000,
 *     animations: 'allow',
 *   });
 * });
 * ```
 */

// ============================================================================
// EXPECTED OUTPUT (Full Example)
// ============================================================================

/**
 * Complete generated test file for "Dashboard Visual Regression":
 */

// import { test, expect } from '@playwright/test';
//
// test.describe('Visual Regression - Dashboard', () => {
//   test.beforeEach(async ({ page }) => {
//     await page.goto('/');
//     await page.waitForLoadState('networkidle');
//   });
//
//   test('should match dashboard layout baseline', async ({ page }) => {
//     await page.waitForSelector('[data-testid="stat-card"]');
//     await page.waitForTimeout(500);
//
//     await expect(page).toHaveScreenshot('dashboard-full-view.png', {
//       fullPage: true,
//       timeout: 10000,
//     });
//   });
//
//   test('should match project card hover state', async ({ page }) => {
//     const projectCard = page.locator('[data-testid="project-card"]').first();
//     if (await projectCard.count() === 0) {
//       test.skip();
//     }
//
//     await projectCard.hover();
//     await page.waitForTimeout(200);
//
//     await expect(projectCard).toHaveScreenshot('project-card-hover.png', {
//       timeout: 10000,
//     });
//   });
//
//   test('should match desktop viewport (1920x1080)', async ({ page }) => {
//     await page.setViewportSize({ width: 1920, height: 1080 });
//     await page.waitForTimeout(300);
//
//     await expect(page).toHaveScreenshot('dashboard-desktop.png', {
//       fullPage: false,
//       timeout: 10000,
//     });
//   });
//
//   test('should match tablet viewport (768x1024)', async ({ page }) => {
//     await page.setViewportSize({ width: 768, height: 1024 });
//     await page.waitForTimeout(300);
//
//     await expect(page).toHaveScreenshot('dashboard-tablet.png', {
//       fullPage: false,
//       timeout: 10000,
//     });
//   });
//
//   test('should match mobile viewport (375x667)', async ({ page }) => {
//     await page.setViewportSize({ width: 375, height: 667 });
//     await page.waitForTimeout(300);
//
//     await expect(page).toHaveScreenshot('dashboard-mobile.png', {
//       fullPage: false,
//       timeout: 10000,
//     });
//   });
// });

// ============================================================================
// TEMPLATE METADATA
// ============================================================================

/**
 * Template: visual-regression.template.ts
 * Version: 1.0.0
 * Last Updated: 2025-11-22
 * Author: Glen Barnhardt with Claude Code
 *
 * Test Coverage:
 * - Full page screenshots (8 tests)
 * - Component screenshots (6 tests)
 * - Hover states (6 tests)
 * - Responsive viewports (5 tests)
 * - Animations (3 tests)
 * - Total: ~28 tests (13% of 208)
 *
 * Pattern Matching Score:
 * - Keywords: "screenshot", "hover", "viewport", "animation", "visual", "match"
 * - Weight: 0.5 for "screenshot", 0.3 for "hover", 0.2 for "animation"
 * - Threshold: 0.7 for template selection
 */
