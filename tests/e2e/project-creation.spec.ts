import { test, expect } from '@playwright/test';

test.describe('Project Creation Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Modal Opening and Closing', () => {
    test('should open modal when clicking new project button', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();

      // ACT
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const modal = page.locator('text=Create New Project').first();
      await expect(modal).toBeVisible();
    });

    test('should close modal when clicking X button', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const closeButton = page.locator('button:has([class*="w-6 h-6"])').first(); // X icon
      await closeButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const modal = page.locator('text=Create New Project');
      await expect(modal).not.toBeVisible();
    });

    test('should close modal when clicking Cancel button', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const modal = page.locator('text=Create New Project');
      await expect(modal).not.toBeVisible();
    });

    test('should close modal when pressing Escape key', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      // ASSERT
      const modal = page.locator('text=Create New Project');
      await expect(modal).not.toBeVisible();
    });

    test('should have backdrop blur effect when modal is open', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();

      // ACT
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const backdrop = page.locator('.backdrop-blur-sm, [class*="backdrop-blur"]').first();
      await expect(backdrop).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should disable Create button when name is empty', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT - Leave name empty
      const createButton = page.locator('button:has-text("Create Project")');

      // ASSERT
      await expect(createButton).toBeDisabled();
    });

    test('should disable Create button when path is empty', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT - Fill name but not path
      const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
      await nameInput.fill('test-project');

      const createButton = page.locator('button:has-text("Create Project")');

      // ASSERT
      await expect(createButton).toBeDisabled();
    });

    test('should enable Create button when all fields are valid', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT - Fill all fields
      const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
      await nameInput.fill('test-project');

      const pathInput = page.locator('#project-path, input[placeholder*="/Users"]');
      await pathInput.fill('/Users/test/projects/test-project');

      const createButton = page.locator('button:has-text("Create Project")');

      // ASSERT
      await expect(createButton).toBeEnabled();
    });

    test('should show error for invalid project name characters', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT - Enter invalid characters
      const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
      await nameInput.fill('test project with spaces!');
      await nameInput.blur(); // Trigger validation

      // ASSERT
      const errorMessage = page.locator('text=can only contain letters, numbers, hyphens, and underscores').first();
      await expect(errorMessage).toBeVisible();
    });

    test('should accept valid project name with hyphens', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
      await nameInput.fill('my-awesome-project');
      await nameInput.blur();

      // ASSERT - No error message
      const errorMessage = page.locator('text=can only contain');
      await expect(errorMessage).not.toBeVisible();
    });

    test('should accept valid project name with underscores', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
      await nameInput.fill('my_awesome_project');
      await nameInput.blur();

      // ASSERT - No error message
      const errorMessage = page.locator('text=can only contain');
      await expect(errorMessage).not.toBeVisible();
    });

    test('should accept valid project name with numbers', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
      await nameInput.fill('project123');
      await nameInput.blur();

      // ASSERT - No error message
      const errorMessage = page.locator('text=can only contain');
      await expect(errorMessage).not.toBeVisible();
    });
  });

  test.describe('Template Selection - Next.js', () => {
    test('should have Next.js template selected by default', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();

      // ACT
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const nextjsOption = page.locator('input[type="radio"][value="nextjs"]');
      await expect(nextjsOption).toBeChecked();
    });

    test('should display Next.js template description', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const nextjsLabel = page.locator('label:has-text("Next.js")');

      // ASSERT
      await expect(nextjsLabel).toBeVisible();
      const labelText = await nextjsLabel.textContent();
      expect(labelText).toContain('React framework');
    });

    test('should highlight Next.js template when selected', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const nextjsLabel = page.locator('label:has(input[value="nextjs"])');

      // ASSERT
      const classes = await nextjsLabel.getAttribute('class');
      expect(classes).toContain('violet'); // Violet highlight for selected
    });
  });

  test.describe('Template Selection - Python', () => {
    test('should allow selecting Python template', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const pythonOption = page.locator('input[type="radio"][value="python"]');
      await pythonOption.click();

      // ASSERT
      await expect(pythonOption).toBeChecked();
    });

    test('should display Python template description', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const pythonLabel = page.locator('label:has-text("Python")');

      // ASSERT
      await expect(pythonLabel).toBeVisible();
      const labelText = await pythonLabel.textContent();
      expect(labelText).toContain('FastAPI');
    });

    test('should highlight Python template when selected', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const pythonOption = page.locator('input[type="radio"][value="python"]');
      await pythonOption.click();
      await page.waitForTimeout(100);

      const pythonLabel = page.locator('label:has(input[value="python"])');

      // ASSERT
      const classes = await pythonLabel.getAttribute('class');
      expect(classes).toContain('violet'); // Violet highlight for selected
    });

    test('should deselect Next.js when Python is selected', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const pythonOption = page.locator('input[type="radio"][value="python"]');
      await pythonOption.click();

      // ASSERT
      const nextjsOption = page.locator('input[type="radio"][value="nextjs"]');
      await expect(nextjsOption).not.toBeChecked();
    });
  });

  test.describe('Template Selection - React', () => {
    test('should allow selecting React template', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const reactOption = page.locator('input[type="radio"][value="react"]');
      await reactOption.click();

      // ASSERT
      await expect(reactOption).toBeChecked();
    });

    test('should display React template description', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const reactLabel = page.locator('label:has-text("React")');

      // ASSERT
      await expect(reactLabel).toBeVisible();
      const labelText = await reactLabel.textContent();
      expect(labelText).toContain('Vite');
    });

    test('should display all three templates', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();

      // ACT
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const nextjsLabel = page.locator('label:has-text("Next.js")');
      const pythonLabel = page.locator('label:has-text("Python")');
      const reactLabel = page.locator('label:has-text("React")');

      await expect(nextjsLabel).toBeVisible();
      await expect(pythonLabel).toBeVisible();
      await expect(reactLabel).toBeVisible();
    });
  });

  test.describe('Path Selection', () => {
    test('should show Browse button for path selection', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();

      // ACT
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const browseButton = page.locator('button:has-text("Browse")');
      await expect(browseButton).toBeVisible();
    });

    test('should allow manual path entry', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const pathInput = page.locator('#project-path, input[placeholder*="/Users"]');
      await pathInput.fill('/Users/test/my-custom-path');

      // ASSERT
      await expect(pathInput).toHaveValue('/Users/test/my-custom-path');
    });

    test('should show path input with monospace font', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const pathInput = page.locator('#project-path, input[placeholder*="/Users"]');

      // ASSERT
      const classes = await pathInput.getAttribute('class');
      expect(classes).toContain('font-mono');
    });

    test('should show helper text for path input', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();

      // ACT
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const helperText = page.locator('text=The full path where your project will be created').first();
      await expect(helperText).toBeVisible();
    });
  });

  test.describe('Project Creation Flow', () => {
    test('should show loading state when creating project', async ({ page }) => {
      // Note: This test will only work in Tauri environment
      // In browser mock mode, it will skip
      const isTauri = await page.evaluate(() => '__TAURI_INTERNALS__' in window);
      if (!isTauri) {
        test.skip();
      }

      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // Fill form
      const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
      await nameInput.fill('test-project');

      const pathInput = page.locator('#project-path, input[placeholder*="/Users"]');
      await pathInput.fill('/tmp/test-project');

      // ACT
      const createButton = page.locator('button:has-text("Create Project")');
      await createButton.click();

      // ASSERT - Should show loading state
      const loadingButton = page.locator('button:has-text("Creating...")');
      await expect(loadingButton).toBeVisible();
    });

    test('should reset form when modal is reopened', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();

      // First open - fill form
      await newProjectButton.click();
      await page.waitForTimeout(200);

      const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
      await nameInput.fill('test-project');

      // Close modal
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();
      await page.waitForTimeout(200);

      // ACT - Reopen modal
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ASSERT - Form should be reset
      const nameInputAgain = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
      await expect(nameInputAgain).toHaveValue('');
    });

    test('should have proper focus management when modal opens', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();

      // ACT
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ASSERT - Name input should be focused
      const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
      await expect(nameInput).toBeFocused();
    });
  });

  test.describe('Visual Styling', () => {
    test('should use dark theme colors', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();

      // ACT
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const modal = page.locator('.bg-slate-900').first();
      await expect(modal).toBeVisible();
    });

    test('should use violet accents', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();

      // ACT
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const createButton = page.locator('button:has-text("Create Project")');
      const classes = await createButton.getAttribute('class');
      expect(classes).toContain('violet');
    });

    test('should have rounded corners on modal', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();

      // ACT
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const modal = page.locator('.rounded-lg').first();
      await expect(modal).toBeVisible();
    });

    test('should have subtle borders on inputs', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');

      // ASSERT
      const classes = await nameInput.getAttribute('class');
      expect(classes).toContain('border');
      expect(classes).toContain('violet');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper labels for all inputs', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();

      // ACT
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const nameLabel = page.locator('label:has-text("Project Name")');
      const pathLabel = page.locator('label:has-text("Project Path")');
      const templateLabel = page.locator('text=Template').first();

      await expect(nameLabel).toBeVisible();
      await expect(pathLabel).toBeVisible();
      await expect(templateLabel).toBeVisible();
    });

    test('should have aria-labels for template options', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT
      const nextjsRadio = page.locator('input[type="radio"][value="nextjs"]');

      // ASSERT
      const ariaLabel = await nextjsRadio.getAttribute('aria-label');
      expect(ariaLabel).toContain('Next.js');
    });

    test('should be keyboard navigable', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(200);

      // ACT - Tab through form
      await page.keyboard.press('Tab'); // Name input
      await page.keyboard.press('Tab'); // Path input
      await page.keyboard.press('Tab'); // Browse button

      // ASSERT - Focus should move through elements
      const focusedElement = await page.locator(':focus').getAttribute('type');
      expect(focusedElement).toBeTruthy();
    });
  });
});
