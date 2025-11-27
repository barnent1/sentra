/**
 * Form Validation Template
 *
 * Handles: Form inputs, validation, enabled/disabled states
 * Coverage: ~18 tests (9% of total)
 *
 * Use Cases:
 * - Required field validation
 * - Format validation (email, URL, etc.)
 * - Button enable/disable based on form state
 * - Multi-field forms
 */

// ============================================================================
// TEMPLATE CODE
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('{{SCREEN}} - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('{{ROUTE}}');
    {{#OPEN_MODAL}}
    // Open modal/form
    const {{TRIGGER_BUTTON_VAR}} = page.locator('{{TRIGGER_BUTTON_SELECTOR}}');
    await {{TRIGGER_BUTTON_VAR}}.click();
    await page.waitForTimeout({{MODAL_ANIMATION_DELAY}});
    {{/OPEN_MODAL}}
  });

  test('should {{VALIDATION_BEHAVIOR}} when {{VALIDATION_CONDITION}}', async ({ page }) => {
    // ARRANGE
    {{#FORM_FIELDS}}
    const {{FIELD_VAR}} = page.locator('{{FIELD_SELECTOR}}');
    {{/FORM_FIELDS}}
    const {{SUBMIT_BUTTON_VAR}} = page.locator('{{SUBMIT_BUTTON_SELECTOR}}');

    // ACT
    {{#FILL_FIELDS}}
    await {{FIELD_VAR}}.fill('{{FIELD_VALUE}}');
    {{/FILL_FIELDS}}
    {{#CLEAR_FIELDS}}
    await {{FIELD_VAR}}.clear();
    {{/CLEAR_FIELDS}}
    {{#BLUR_FIELDS}}
    await {{FIELD_VAR}}.blur(); // Trigger validation
    {{/BLUR_FIELDS}}

    // ASSERT
    {{#BUTTON_STATE_ASSERTION}}
    await expect({{SUBMIT_BUTTON_VAR}}).{{BUTTON_STATE}}();
    {{/BUTTON_STATE_ASSERTION}}
    {{#ERROR_MESSAGE_ASSERTION}}
    const {{ERROR_VAR}} = page.locator('{{ERROR_SELECTOR}}');
    await expect({{ERROR_VAR}}).{{ERROR_VISIBILITY}}();
    {{/ERROR_MESSAGE_ASSERTION}}
    {{#FIELD_VALUE_ASSERTION}}
    await expect({{FIELD_VAR}}).toHaveValue('{{EXPECTED_VALUE}}');
    {{/FIELD_VALUE_ASSERTION}}
  });
});

// ============================================================================
// VARIABLE DEFINITIONS
// ============================================================================

/**
 * Variables used in this template:
 *
 * SCREEN: string (required)
 *   - The screen/component being tested
 *   - Example: "Project Creation Modal", "Settings", "Login Form"
 *
 * ROUTE: string (required)
 *   - The route to navigate to
 *   - Example: "/", "/dashboard", "/login"
 *
 * OPEN_MODAL: boolean (optional, default: false)
 *   - Whether to open a modal before testing form
 *   - Example: true (for modal forms)
 *
 * TRIGGER_BUTTON_VAR: identifier (conditional: if OPEN_MODAL)
 *   - Variable name for button that opens modal
 *   - Example: "newProjectButton", "settingsButton"
 *
 * TRIGGER_BUTTON_SELECTOR: string (conditional: if OPEN_MODAL)
 *   - Selector for button that opens modal
 *   - Example: 'button:has-text("New Project")'
 *
 * MODAL_ANIMATION_DELAY: number (optional, default: 200)
 *   - Delay after opening modal
 *   - Example: 200, 300
 *
 * VALIDATION_BEHAVIOR: string (required)
 *   - What the validation does (human-readable)
 *   - Example: "disable Create button", "show error message", "enable button"
 *
 * VALIDATION_CONDITION: string (required)
 *   - When the validation triggers (human-readable)
 *   - Example: "name is empty", "invalid email format", "all fields filled"
 *
 * FORM_FIELDS: array (required)
 *   - Array of form field objects
 *   - Each field has:
 *     - FIELD_VAR: identifier (variable name)
 *     - FIELD_SELECTOR: string (locator selector)
 *
 * SUBMIT_BUTTON_VAR: identifier (required)
 *   - Variable name for submit button
 *   - Example: "createButton", "saveButton", "submitButton"
 *
 * SUBMIT_BUTTON_SELECTOR: string (required)
 *   - Selector for submit button
 *   - Example: 'button:has-text("Create Project")'
 *
 * FILL_FIELDS: array (optional)
 *   - Fields to fill with values
 *   - Each has: FIELD_VAR, FIELD_VALUE
 *
 * CLEAR_FIELDS: array (optional)
 *   - Fields to clear
 *   - Each has: FIELD_VAR
 *
 * BLUR_FIELDS: array (optional)
 *   - Fields to blur (trigger validation)
 *   - Each has: FIELD_VAR
 *
 * BUTTON_STATE_ASSERTION: boolean (optional)
 *   - Whether to assert button state
 *   - Example: true
 *
 * BUTTON_STATE: string (conditional)
 *   - Expected button state
 *   - Options: "toBeEnabled", "toBeDisabled"
 *
 * ERROR_MESSAGE_ASSERTION: boolean (optional)
 *   - Whether to assert error message
 *   - Example: true
 *
 * ERROR_VAR: identifier (conditional)
 *   - Variable name for error message
 *   - Example: "errorMessage"
 *
 * ERROR_SELECTOR: string (conditional)
 *   - Selector for error message
 *   - Example: 'text=can only contain'
 *
 * ERROR_VISIBILITY: string (conditional)
 *   - Error visibility assertion
 *   - Options: "toBeVisible", "not.toBeVisible"
 *
 * FIELD_VALUE_ASSERTION: boolean (optional)
 *   - Whether to assert field value
 *   - Example: true
 *
 * EXPECTED_VALUE: string (conditional)
 *   - Expected field value
 *   - Example: "my-awesome-project"
 */

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Required Field Validation
 *
 * Input YAML:
 * ```yaml
 * screen: "Project Creation Modal"
 * e2e_tests:
 *   - name: "Disable Create button when name is empty"
 *     steps:
 *       - "Navigate to /"
 *       - "Click New Project button"
 *       - "Leave name field empty"
 *       - "Verify Create button is disabled"
 * ```
 *
 * Generated Variables:
 * {
 *   SCREEN: "Project Creation Modal",
 *   ROUTE: "/",
 *   OPEN_MODAL: true,
 *   TRIGGER_BUTTON_VAR: "newProjectButton",
 *   TRIGGER_BUTTON_SELECTOR: 'button:has-text("New Project"), [data-testid="new-project-button"]',
 *   MODAL_ANIMATION_DELAY: 200,
 *   VALIDATION_BEHAVIOR: "disable Create button",
 *   VALIDATION_CONDITION: "name is empty",
 *   FORM_FIELDS: [
 *     { FIELD_VAR: "nameInput", FIELD_SELECTOR: '#project-name, input[placeholder*="my-awesome-project"]' }
 *   ],
 *   SUBMIT_BUTTON_VAR: "createButton",
 *   SUBMIT_BUTTON_SELECTOR: 'button:has-text("Create Project")',
 *   CLEAR_FIELDS: [{ FIELD_VAR: "nameInput" }],
 *   BUTTON_STATE_ASSERTION: true,
 *   BUTTON_STATE: "toBeDisabled"
 * }
 *
 * Generated Test:
 * ```typescript
 * test('should disable Create button when name is empty', async ({ page }) => {
 *   // ARRANGE
 *   const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
 *   const createButton = page.locator('button:has-text("Create Project")');
 *
 *   // ACT
 *   await nameInput.clear();
 *
 *   // ASSERT
 *   await expect(createButton).toBeDisabled();
 * });
 * ```
 */

/**
 * Example 2: Format Validation Error
 *
 * Input YAML:
 * ```yaml
 * screen: "Project Creation Modal"
 * e2e_tests:
 *   - name: "Show error for invalid project name"
 *     steps:
 *       - "Navigate to /"
 *       - "Click New Project button"
 *       - "Fill name with 'invalid name!'"
 *       - "Blur name field"
 *       - "Verify error message appears"
 * ```
 *
 * Generated Variables:
 * {
 *   SCREEN: "Project Creation Modal",
 *   ROUTE: "/",
 *   OPEN_MODAL: true,
 *   TRIGGER_BUTTON_VAR: "newProjectButton",
 *   TRIGGER_BUTTON_SELECTOR: 'button:has-text("New Project")',
 *   MODAL_ANIMATION_DELAY: 200,
 *   VALIDATION_BEHAVIOR: "show error message",
 *   VALIDATION_CONDITION: "invalid name format",
 *   FORM_FIELDS: [
 *     { FIELD_VAR: "nameInput", FIELD_SELECTOR: '#project-name, input[placeholder*="my-awesome-project"]' }
 *   ],
 *   SUBMIT_BUTTON_VAR: "createButton",
 *   SUBMIT_BUTTON_SELECTOR: 'button:has-text("Create Project")',
 *   FILL_FIELDS: [{ FIELD_VAR: "nameInput", FIELD_VALUE: "invalid name!" }],
 *   BLUR_FIELDS: [{ FIELD_VAR: "nameInput" }],
 *   ERROR_MESSAGE_ASSERTION: true,
 *   ERROR_VAR: "errorMessage",
 *   ERROR_SELECTOR: 'text=can only contain letters, numbers, hyphens, and underscores',
 *   ERROR_VISIBILITY: "toBeVisible"
 * }
 *
 * Generated Test:
 * ```typescript
 * test('should show error message when invalid name format', async ({ page }) => {
 *   // ARRANGE
 *   const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
 *
 *   // ACT
 *   await nameInput.fill('invalid name!');
 *   await nameInput.blur();
 *
 *   // ASSERT
 *   const errorMessage = page.locator('text=can only contain letters, numbers, hyphens, and underscores');
 *   await expect(errorMessage).toBeVisible();
 * });
 * ```
 */

/**
 * Example 3: Enable Button When Valid
 *
 * Input YAML:
 * ```yaml
 * screen: "Project Creation Modal"
 * e2e_tests:
 *   - name: "Enable Create button when all fields valid"
 *     steps:
 *       - "Navigate to /"
 *       - "Click New Project button"
 *       - "Fill name with 'test-project'"
 *       - "Fill path with '/Users/test/projects'"
 *       - "Verify Create button is enabled"
 * ```
 *
 * Generated Variables:
 * {
 *   SCREEN: "Project Creation Modal",
 *   ROUTE: "/",
 *   OPEN_MODAL: true,
 *   TRIGGER_BUTTON_VAR: "newProjectButton",
 *   TRIGGER_BUTTON_SELECTOR: 'button:has-text("New Project")',
 *   MODAL_ANIMATION_DELAY: 200,
 *   VALIDATION_BEHAVIOR: "enable Create button",
 *   VALIDATION_CONDITION: "all fields valid",
 *   FORM_FIELDS: [
 *     { FIELD_VAR: "nameInput", FIELD_SELECTOR: '#project-name, input[placeholder*="my-awesome-project"]' },
 *     { FIELD_VAR: "pathInput", FIELD_SELECTOR: '#project-path, input[placeholder*="/Users"]' }
 *   ],
 *   SUBMIT_BUTTON_VAR: "createButton",
 *   SUBMIT_BUTTON_SELECTOR: 'button:has-text("Create Project")',
 *   FILL_FIELDS: [
 *     { FIELD_VAR: "nameInput", FIELD_VALUE: "test-project" },
 *     { FIELD_VAR: "pathInput", FIELD_VALUE: "/Users/test/projects" }
 *   ],
 *   BUTTON_STATE_ASSERTION: true,
 *   BUTTON_STATE: "toBeEnabled"
 * }
 *
 * Generated Test:
 * ```typescript
 * test('should enable Create button when all fields valid', async ({ page }) => {
 *   // ARRANGE
 *   const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
 *   const pathInput = page.locator('#project-path, input[placeholder*="/Users"]');
 *   const createButton = page.locator('button:has-text("Create Project")');
 *
 *   // ACT
 *   await nameInput.fill('test-project');
 *   await pathInput.fill('/Users/test/projects');
 *
 *   // ASSERT
 *   await expect(createButton).toBeEnabled();
 * });
 * ```
 */

/**
 * Example 4: Accept Valid Input
 *
 * Input YAML:
 * ```yaml
 * screen: "Project Creation Modal"
 * e2e_tests:
 *   - name: "Accept valid project name with hyphens"
 *     steps:
 *       - "Navigate to /"
 *       - "Click New Project button"
 *       - "Fill name with 'my-awesome-project'"
 *       - "Blur name field"
 *       - "Verify no error message"
 * ```
 *
 * Generated Variables:
 * {
 *   SCREEN: "Project Creation Modal",
 *   ROUTE: "/",
 *   OPEN_MODAL: true,
 *   TRIGGER_BUTTON_VAR: "newProjectButton",
 *   TRIGGER_BUTTON_SELECTOR: 'button:has-text("New Project")',
 *   MODAL_ANIMATION_DELAY: 200,
 *   VALIDATION_BEHAVIOR: "accept input",
 *   VALIDATION_CONDITION: "valid name format",
 *   FORM_FIELDS: [
 *     { FIELD_VAR: "nameInput", FIELD_SELECTOR: '#project-name, input[placeholder*="my-awesome-project"]' }
 *   ],
 *   SUBMIT_BUTTON_VAR: "createButton",
 *   SUBMIT_BUTTON_SELECTOR: 'button:has-text("Create Project")',
 *   FILL_FIELDS: [{ FIELD_VAR: "nameInput", FIELD_VALUE: "my-awesome-project" }],
 *   BLUR_FIELDS: [{ FIELD_VAR: "nameInput" }],
 *   ERROR_MESSAGE_ASSERTION: true,
 *   ERROR_VAR: "errorMessage",
 *   ERROR_SELECTOR: 'text=can only contain',
 *   ERROR_VISIBILITY: "not.toBeVisible"
 * }
 *
 * Generated Test:
 * ```typescript
 * test('should accept input when valid name format', async ({ page }) => {
 *   // ARRANGE
 *   const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
 *
 *   // ACT
 *   await nameInput.fill('my-awesome-project');
 *   await nameInput.blur();
 *
 *   // ASSERT
 *   const errorMessage = page.locator('text=can only contain');
 *   await expect(errorMessage).not.toBeVisible();
 * });
 * ```
 */

// ============================================================================
// EXPECTED OUTPUT (Full Example)
// ============================================================================

/**
 * Complete generated test file for "Project Creation - Form Validation":
 */

// import { test, expect } from '@playwright/test';
//
// test.describe('Project Creation Modal - Form Validation', () => {
//   test.beforeEach(async ({ page }) => {
//     await page.goto('/');
//     const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
//     await newProjectButton.click();
//     await page.waitForTimeout(200);
//   });
//
//   test('should disable Create button when name is empty', async ({ page }) => {
//     // ARRANGE
//     const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
//     const createButton = page.locator('button:has-text("Create Project")');
//
//     // ACT - Leave name empty
//     await nameInput.clear();
//
//     // ASSERT
//     await expect(createButton).toBeDisabled();
//   });
//
//   test('should disable Create button when path is empty', async ({ page }) => {
//     // ARRANGE
//     const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
//     const pathInput = page.locator('#project-path, input[placeholder*="/Users"]');
//     const createButton = page.locator('button:has-text("Create Project")');
//
//     // ACT - Fill name but not path
//     await nameInput.fill('test-project');
//
//     // ASSERT
//     await expect(createButton).toBeDisabled();
//   });
//
//   test('should enable Create button when all fields are valid', async ({ page }) => {
//     // ARRANGE
//     const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
//     const pathInput = page.locator('#project-path, input[placeholder*="/Users"]');
//     const createButton = page.locator('button:has-text("Create Project")');
//
//     // ACT - Fill all fields
//     await nameInput.fill('test-project');
//     await pathInput.fill('/Users/test/projects/test-project');
//
//     // ASSERT
//     await expect(createButton).toBeEnabled();
//   });
//
//   test('should show error for invalid project name characters', async ({ page }) => {
//     // ARRANGE
//     const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
//
//     // ACT - Enter invalid characters
//     await nameInput.fill('test project with spaces!');
//     await nameInput.blur();
//
//     // ASSERT
//     const errorMessage = page.locator('text=can only contain letters, numbers, hyphens, and underscores').first();
//     await expect(errorMessage).toBeVisible();
//   });
// });

// ============================================================================
// TEMPLATE METADATA
// ============================================================================

/**
 * Template: form-validation.template.ts
 * Version: 1.0.0
 * Last Updated: 2025-11-22
 * Author: Glen Barnhardt with Claude Code
 *
 * Test Coverage:
 * - Required fields (6 tests)
 * - Format validation (8 tests)
 * - Button state changes (4 tests)
 * - Total: ~18 tests (9% of 208)
 *
 * Pattern Matching Score:
 * - Keywords: "fill", "field", "disabled", "enabled", "validation", "error"
 * - Weight: 0.4 for "fill", 0.3 for "field", 0.2 for enabled/disabled
 * - Threshold: 0.7 for template selection
 */
