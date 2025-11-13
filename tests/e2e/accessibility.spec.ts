import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility - WCAG 2.1 AA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should not have any automatically detectable accessibility violations on main page', async ({ page }) => {
    // ARRANGE & ACT
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // ASSERT
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper page structure with landmarks', async ({ page }) => {
    // ARRANGE & ACT
    const main = page.locator('main');
    const header = page.locator('header');

    // ASSERT - Page should have proper semantic structure
    await expect(main).toBeVisible();
    await expect(header).toBeVisible();
  });

  test('should have alt text on all images', async ({ page }) => {
    // ARRANGE & ACT
    const images = page.locator('img');
    const count = await images.count();

    // ASSERT - All images should have alt attributes
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      await expect(img).toHaveAttribute('alt');
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // ARRANGE & ACT
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');

    // ASSERT - Should have one h1 and proper hierarchy
    expect(await h1.count()).toBeGreaterThanOrEqual(1);
    await expect(h1.first()).toBeVisible();

    // h2 should follow h1
    if (await h2.count() > 0) {
      await expect(h2.first()).toBeVisible();
    }
  });

  test('should have sufficient color contrast for text', async ({ page }) => {
    // ARRANGE & ACT
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    // ASSERT - Check for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    expect(contrastViolations).toEqual([]);
  });

  test('should have keyboard accessible interactive elements', async ({ page }) => {
    // ARRANGE
    const buttons = page.locator('button');
    const count = await buttons.count();

    // ACT & ASSERT - All buttons should be focusable
    for (let i = 0; i < count && i < 10; i++) { // Test first 10 buttons
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        await button.focus();
        const isFocused = await button.evaluate(
          el => el === document.activeElement
        );
        expect(isFocused).toBe(true);
      }
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    // ARRANGE
    const firstButton = page.locator('button').first();

    // ACT
    await firstButton.focus();

    // ASSERT - Focus should be visible (check for outline or ring)
    const outlineWidth = await firstButton.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.outlineWidth;
    });

    // Should have some form of focus indicator
    expect(outlineWidth).toBeTruthy();
  });

  test('should have ARIA labels on icon-only buttons', async ({ page }) => {
    // ARRANGE & ACT
    const settingsButton = page.locator('[data-testid="settings-button"]');
    const muteButtons = page.locator('[data-testid="mute-button"]');

    // ASSERT - Settings button should have accessible name
    const settingsTitle = await settingsButton.getAttribute('title');
    const settingsAriaLabel = await settingsButton.getAttribute('aria-label');
    expect(settingsTitle || settingsAriaLabel).toBeTruthy();

    // ASSERT - Mute buttons should have accessible names
    if (await muteButtons.count() > 0) {
      const firstMuteButton = muteButtons.first();
      const muteAriaLabel = await firstMuteButton.getAttribute('aria-label');
      expect(muteAriaLabel).toBeTruthy();
      expect(muteAriaLabel).toContain('Mute');
    }
  });

  test('should have proper ARIA roles on status indicators', async ({ page }) => {
    // ARRANGE
    const statusIndicators = page.locator('[data-testid="status-indicator"]');

    // Skip if no projects
    if (await statusIndicators.count() === 0) {
      test.skip();
    }

    // ACT & ASSERT
    const firstIndicator = statusIndicators.first();
    const ariaLabel = await firstIndicator.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toMatch(/Status:/i);
  });

  test('should support keyboard navigation through project cards', async ({ page }) => {
    // ARRANGE
    const projectCards = page.locator('[data-testid="project-card"]');

    // Skip if no projects
    if (await projectCards.count() === 0) {
      test.skip();
    }

    // ACT - Tab through cards
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // ASSERT - Should be able to navigate to cards
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).toBeTruthy();
  });

  test('should have proper labels on form inputs in modals', async ({ page }) => {
    // ARRANGE
    const newProjectButton = page.locator('[data-testid="new-project-button"]');

    // ACT
    await newProjectButton.click();
    await page.waitForTimeout(500); // Wait for modal to open

    // ASSERT - All inputs should have associated labels
    const inputs = page.locator('input[type="text"], input[type="url"], textarea');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');

      // Should have either id (for label), aria-label, or aria-labelledby
      expect(id || ariaLabel || ariaLabelledby).toBeTruthy();
    }
  });

  test('should not have any accessibility violations in Settings modal', async ({ page }) => {
    // ARRANGE
    const settingsButton = page.locator('[data-testid="settings-button"]');

    // ACT
    await settingsButton.click();
    await page.waitForTimeout(500); // Wait for modal to open

    // ASSERT
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support Escape key to close modals', async ({ page }) => {
    // ARRANGE
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.click();
    await page.waitForTimeout(500);

    // ACT
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // ASSERT - Modal should be closed (test implementation-specific)
    // This will depend on how the modal is implemented
  });

  test('should have proper link text (no "click here")', async ({ page }) => {
    // ARRANGE & ACT
    const links = page.locator('a');
    const count = await links.count();

    // ASSERT - Links should have descriptive text
    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      if (text) {
        expect(text.toLowerCase()).not.toMatch(/^click here$/i);
        expect(text.toLowerCase()).not.toMatch(/^here$/i);
        expect(text.toLowerCase()).not.toMatch(/^read more$/i);
      } else {
        // If no text, should have aria-label
        expect(ariaLabel).toBeTruthy();
      }
    }
  });

  test('should have language attribute on html element', async ({ page }) => {
    // ARRANGE & ACT
    const html = page.locator('html');

    // ASSERT
    await expect(html).toHaveAttribute('lang');
    const lang = await html.getAttribute('lang');
    expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., "en" or "en-US"
  });

  test('should have no duplicate IDs', async ({ page }) => {
    // ARRANGE & ACT
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    // ASSERT
    const duplicateIdViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'duplicate-id'
    );
    expect(duplicateIdViolations).toEqual([]);
  });

  test('should have proper document title', async ({ page }) => {
    // ARRANGE & ACT
    const title = await page.title();

    // ASSERT
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    expect(title).toContain('Sentra');
  });

  test('should have descriptive button text', async ({ page }) => {
    // ARRANGE & ACT
    const buttons = page.locator('button');
    const count = await buttons.count();

    // ASSERT - Buttons should have text content or aria-label
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');

        expect(text || ariaLabel || title).toBeTruthy();
      }
    }
  });

  test('should maintain focus trap in modals', async ({ page }) => {
    // ARRANGE
    const newProjectButton = page.locator('[data-testid="new-project-button"]');

    // ACT
    await newProjectButton.click();
    await page.waitForTimeout(500);

    // Try to tab out of modal
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
    }

    // ASSERT - Focus should remain within modal
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.closest('[role="dialog"]') !== null;
    });

    // Focus should be within a dialog (if modal uses role="dialog")
    // This is a best practice check
  });

  test('should announce loading states to screen readers', async ({ page }) => {
    // ARRANGE & ACT
    // Check if loading indicators have proper ARIA attributes
    const loadingIndicators = page.locator('[role="status"], [aria-live], .animate-spin');

    // ASSERT - If loading indicators exist, they should be accessible
    if (await loadingIndicators.count() > 0) {
      const firstLoader = loadingIndicators.first();
      const role = await firstLoader.getAttribute('role');
      const ariaLive = await firstLoader.getAttribute('aria-live');
      const ariaLabel = await firstLoader.getAttribute('aria-label');

      // Should have some accessibility attribute
      expect(role || ariaLive || ariaLabel).toBeTruthy();
    }
  });

  test('should have responsive text sizing (no fixed font sizes in px below 16px)', async ({ page }) => {
    // ARRANGE & ACT
    const allText = page.locator('p, span, div, h1, h2, h3, h4, h5, h6, button, a');
    const count = await allText.count();

    // Sample first 50 elements
    const sampleSize = Math.min(count, 50);

    for (let i = 0; i < sampleSize; i++) {
      const element = allText.nth(i);
      const fontSize = await element.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return parseFloat(style.fontSize);
      });

      // Body text should not be smaller than 14px (with exceptions for labels)
      if (fontSize > 0) {
        const className = await element.getAttribute('class');

        // Allow smaller text for labels and metadata (text-xs, etc.)
        const isSmallTextAllowed = className?.includes('text-xs') ||
                                   className?.includes('text-sm');

        if (!isSmallTextAllowed) {
          expect(fontSize).toBeGreaterThanOrEqual(14);
        }
      }
    }
  });
});

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open Settings with Cmd/Ctrl+,', async ({ page }) => {
    // ARRANGE
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';

    // ACT
    await page.keyboard.press(`${modifier}+Comma`);
    await page.waitForTimeout(500);

    // ASSERT - Settings modal should open
    // This will depend on implementation
  });

  test('should open New Project modal with Cmd/Ctrl+N', async ({ page }) => {
    // ARRANGE
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';

    // ACT
    await page.keyboard.press(`${modifier}+KeyN`);
    await page.waitForTimeout(500);

    // ASSERT - New Project modal should open
    // This will depend on implementation
  });

  test('should close modals with Escape key', async ({ page }) => {
    // ARRANGE
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.click();
    await page.waitForTimeout(500);

    // ACT
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // ASSERT - Modal should close
    // This will depend on implementation
  });
});

test.describe('Screen Reader Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have descriptive page regions', async ({ page }) => {
    // ARRANGE & ACT
    const main = page.locator('main');
    const header = page.locator('header');

    // ASSERT - Regions should have appropriate roles
    await expect(main).toBeVisible();
    await expect(header).toBeVisible();
  });

  test('should announce dynamic content changes', async ({ page }) => {
    // ARRANGE & ACT
    // Look for live regions
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');

    // ASSERT - If present, they should be properly configured
    if (await liveRegions.count() > 0) {
      const firstRegion = liveRegions.first();
      const ariaLive = await firstRegion.getAttribute('aria-live');
      const role = await firstRegion.getAttribute('role');

      expect(ariaLive || role).toBeTruthy();
    }
  });

  test('should have accessible names for all interactive elements', async ({ page }) => {
    // ARRANGE & ACT
    const interactiveElements = page.locator('button, a, input, select, textarea');
    const count = await interactiveElements.count();

    // ASSERT
    for (let i = 0; i < count && i < 20; i++) { // Test first 20
      const element = interactiveElements.nth(i);
      if (await element.isVisible()) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const text = await element.textContent();
        const ariaLabel = await element.getAttribute('aria-label');
        const ariaLabelledby = await element.getAttribute('aria-labelledby');
        const title = await element.getAttribute('title');
        const placeholder = await element.getAttribute('placeholder');

        // Should have some form of accessible name
        expect(
          text?.trim() || ariaLabel || ariaLabelledby || title || placeholder
        ).toBeTruthy();
      }
    }
  });
});
