import { test, expect } from '@playwright/test';

test.describe('Settings Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Modal Opening and Closing', () => {
    test('should open settings modal when clicking settings button', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const modal = page.locator('text=Settings').first();
      await expect(modal).toBeVisible();
    });

    test('should close modal when clicking X button', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      const closeButton = page.locator('button:has([class*="w-6 h-6"])').first();
      await closeButton.click();
      await page.waitForTimeout(200);

      // ASSERT - Settings modal should not be visible
      const modal = page.locator('text=Your Name').first();
      await expect(modal).not.toBeVisible();
    });

    test('should close modal when clicking Cancel button', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const modal = page.locator('text=Your Name').first();
      await expect(modal).not.toBeVisible();
    });

    test('should have backdrop blur when modal is open', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const backdrop = page.locator('.backdrop-blur-sm, [class*="backdrop-blur"]').first();
      await expect(backdrop).toBeVisible();
    });
  });

  test.describe('User Name Setting', () => {
    test('should display user name input field', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const nameInput = page.locator('input[placeholder*="Glen"], input[type="text"]').first();
      await expect(nameInput).toBeVisible();
    });

    test('should allow entering user name', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      const nameInput = page.locator('input[placeholder*="Glen"], input[type="text"]').first();
      await nameInput.fill('John Doe');

      // ASSERT
      await expect(nameInput).toHaveValue('John Doe');
    });

    test('should show helper text explaining name usage', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const helperText = page.locator('text=Used in voice notifications').first();
      await expect(helperText).toBeVisible();
    });
  });

  test.describe('Language Selection', () => {
    test('should display language selection section', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const languageLabel = page.locator('text=Language').first();
      await expect(languageLabel).toBeVisible();
    });

    test('should show English language option', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const englishOption = page.locator('label:has-text("English")');
      await expect(englishOption).toBeVisible();
    });

    test('should show Spanish language option', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const spanishOption = page.locator('label:has-text("Español")');
      await expect(spanishOption).toBeVisible();
    });

    test('should allow switching to Spanish', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      const spanishRadio = page.locator('input[type="radio"][value="es"]');
      await spanishRadio.click();

      // ASSERT
      await expect(spanishRadio).toBeChecked();
    });

    test('should highlight selected language', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      const englishRadio = page.locator('input[type="radio"][value="en"]');
      const englishLabel = page.locator('label:has(input[value="en"])');

      // ASSERT
      if (await englishRadio.isChecked()) {
        const classes = await englishLabel.getAttribute('class');
        expect(classes).toContain('violet');
      }
    });
  });

  test.describe('API Key Settings', () => {
    test('should display OpenAI API key input', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const openaiInput = page.locator('input[type="password"][placeholder*="sk-proj"]');
      await expect(openaiInput).toBeVisible();
    });

    test('should display Anthropic API key input', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const anthropicInput = page.locator('input[type="password"][placeholder*="sk-ant"]');
      await expect(anthropicInput).toBeVisible();
    });

    test('should display GitHub token input', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const githubInput = page.locator('input[type="password"][placeholder*="ghp_"]');
      await expect(githubInput).toBeVisible();
    });

    test('should mask API key input', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      const openaiInput = page.locator('input[type="password"][placeholder*="sk-proj"]');

      // ASSERT
      const inputType = await openaiInput.getAttribute('type');
      expect(inputType).toBe('password');
    });

    test('should show helper text with API key links', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const openaiLink = page.locator('a[href*="platform.openai.com"]');
      await expect(openaiLink).toBeVisible();
    });

    test('should have monospace font for API keys', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      const openaiInput = page.locator('input[type="password"][placeholder*="sk-proj"]');

      // ASSERT
      const classes = await openaiInput.getAttribute('class');
      expect(classes).toContain('font-mono');
    });
  });

  test.describe('GitHub Repository Settings', () => {
    test('should display repo owner input', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const ownerInput = page.locator('input[placeholder*="barnent1"]');
      await expect(ownerInput).toBeVisible();
    });

    test('should display repo name input', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const nameInput = page.locator('input[placeholder*="sentra"]');
      await expect(nameInput).toBeVisible();
    });

    test('should allow entering repo owner', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      const ownerInput = page.locator('input[placeholder*="barnent1"]');
      await ownerInput.fill('testuser');

      // ASSERT
      await expect(ownerInput).toHaveValue('testuser');
    });

    test('should allow entering repo name', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      const nameInput = page.locator('input[placeholder*="sentra"]');
      await nameInput.fill('my-repo');

      // ASSERT
      await expect(nameInput).toHaveValue('my-repo');
    });
  });

  test.describe('Voice Selection', () => {
    test('should display all thirteen voice options', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const voiceOptions = page.locator('input[type="radio"][name="voice"]');
      expect(await voiceOptions.count()).toBeGreaterThanOrEqual(13);
    });

    test('should show voice descriptions', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const novaDescription = page.locator('text=Female, Warm & Friendly').first();
      await expect(novaDescription).toBeVisible();
    });

    test('should have Nova voice as recommended', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const novaLabel = page.locator('label:has-text("Nova")');
      const labelText = await novaLabel.textContent();
      expect(labelText).toContain('⭐'); // Recommended star
    });

    test('should allow selecting different voice', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      const echoRadio = page.locator('input[type="radio"][value="echo"]');
      await echoRadio.click();

      // ASSERT
      await expect(echoRadio).toBeChecked();
    });

    test('should display Test Voice button', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const testButton = page.locator('button:has-text("Test Voice")');
      await expect(testButton).toBeVisible();
    });

    test('should disable Test Voice button without API key', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // Clear OpenAI API key
      const openaiInput = page.locator('input[type="password"][placeholder*="sk-proj"]');
      await openaiInput.clear();

      // ACT
      const testButton = page.locator('button:has-text("Test Voice")');

      // ASSERT
      await expect(testButton).toBeDisabled();
    });
  });

  test.describe('Notification Preferences', () => {
    test('should display enable notifications checkbox', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const notifCheckbox = page.locator('input[type="checkbox"]').first();
      await expect(notifCheckbox).toBeVisible();
    });

    test('should display all notification sub-options', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const completionCheckbox = page.locator('text=Notify when agents complete').first();
      const failureCheckbox = page.locator('text=Notify when agents fail').first();
      const startCheckbox = page.locator('text=Notify when agents start').first();

      await expect(completionCheckbox).toBeVisible();
      await expect(failureCheckbox).toBeVisible();
      await expect(startCheckbox).toBeVisible();
    });

    test('should disable sub-options when notifications are disabled', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT - Disable main notifications
      const mainCheckbox = page.locator('text=Enable voice notifications').locator('..').locator('input[type="checkbox"]');
      if (await mainCheckbox.isChecked()) {
        await mainCheckbox.click();
      }

      // ASSERT - Sub-options should be disabled
      const completionCheckbox = page.locator('text=Notify when agents complete').locator('..').locator('input[type="checkbox"]');
      await expect(completionCheckbox).toBeDisabled();
    });

    test('should enable sub-options when notifications are enabled', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT - Enable main notifications
      const mainCheckbox = page.locator('text=Enable voice notifications').locator('..').locator('input[type="checkbox"]');
      if (!await mainCheckbox.isChecked()) {
        await mainCheckbox.click();
      }

      // ASSERT - Sub-options should be enabled
      const completionCheckbox = page.locator('text=Notify when agents complete').locator('..').locator('input[type="checkbox"]');
      await expect(completionCheckbox).toBeEnabled();
    });

    test('should allow toggling completion notifications', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // Ensure main notifications are enabled
      const mainCheckbox = page.locator('text=Enable voice notifications').locator('..').locator('input[type="checkbox"]');
      if (!await mainCheckbox.isChecked()) {
        await mainCheckbox.click();
      }

      // ACT
      const completionCheckbox = page.locator('text=Notify when agents complete').locator('..').locator('input[type="checkbox"]');
      const initialState = await completionCheckbox.isChecked();
      await completionCheckbox.click();

      // ASSERT
      const newState = await completionCheckbox.isChecked();
      expect(newState).toBe(!initialState);
    });
  });

  test.describe('Settings Persistence', () => {
    test('should show Save Settings button', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const saveButton = page.locator('button:has-text("Save Settings")');
      await expect(saveButton).toBeVisible();
    });

    test('should display error message in browser mode', async ({ page }) => {
      // Note: This only applies when running in browser (not Tauri)
      const isTauri = await page.evaluate(() => '__TAURI_INTERNALS__' in window);
      if (isTauri) {
        test.skip();
      }

      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // Fill some settings
      const nameInput = page.locator('input[placeholder*="Glen"], input[type="text"]').first();
      await nameInput.fill('Test User');

      // Setup dialog handler
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('browser mode');
        await dialog.accept();
      });

      // ACT
      const saveButton = page.locator('button:has-text("Save Settings")');
      await saveButton.click();

      // Wait for dialog
      await page.waitForTimeout(500);
    });

    test('should maintain form state when reopening modal', async ({ page }) => {
      // Note: This test assumes settings are loaded from storage
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // First open
      await settingsButton.click();
      await page.waitForTimeout(200);

      const nameInput = page.locator('input[placeholder*="Glen"], input[type="text"]').first();
      const initialName = await nameInput.inputValue();

      // Close modal
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();
      await page.waitForTimeout(200);

      // ACT - Reopen modal
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT - Should show same value
      const nameInputAgain = page.locator('input[placeholder*="Glen"], input[type="text"]').first();
      const nameAfterReopen = await nameInputAgain.inputValue();
      expect(nameAfterReopen).toBe(initialName);
    });
  });

  test.describe('Visual Styling', () => {
    test('should use dark theme', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const modal = page.locator('.bg-slate-900').first();
      await expect(modal).toBeVisible();
    });

    test('should use violet accent for Save button', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const saveButton = page.locator('button:has-text("Save Settings")');
      const classes = await saveButton.getAttribute('class');
      expect(classes).toContain('violet');
    });

    test('should have Settings icon in header', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const icon = page.locator('.text-violet-400').first();
      await expect(icon).toBeVisible();
    });

    test('should have scrollable content area', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();

      // ACT
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ASSERT
      const modal = page.locator('.overflow-y-auto').first();
      await expect(modal).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should close modal with Escape key', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      // ASSERT
      const modal = page.locator('text=Your Name').first();
      await expect(modal).not.toBeVisible();
    });

    test('should allow tabbing through form fields', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT - Tab through fields
      await page.keyboard.press('Tab'); // Name
      await page.keyboard.press('Tab'); // Language options
      await page.keyboard.press('Tab'); // Next field

      // ASSERT
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should accept valid user name', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      const nameInput = page.locator('input[placeholder*="Glen"], input[type="text"]').first();
      await nameInput.fill('John Doe');

      // ASSERT
      await expect(nameInput).toHaveValue('John Doe');
    });

    test('should accept valid API key format', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      const openaiInput = page.locator('input[type="password"][placeholder*="sk-proj"]');
      await openaiInput.fill('sk-proj-test123456789');

      // ASSERT
      await expect(openaiInput).toHaveValue('sk-proj-test123456789');
    });

    test('should allow empty API keys', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(200);

      // ACT
      const openaiInput = page.locator('input[type="password"][placeholder*="sk-proj"]');
      await openaiInput.clear();

      // ASSERT - No error should be shown
      await expect(openaiInput).toHaveValue('');
    });
  });
});
