import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 *
 * These tests capture screenshots and compare them against baseline images
 * to detect unintended visual changes in the UI.
 *
 * Usage:
 *   - First run: Creates baseline screenshots
 *   - Subsequent runs: Compares against baselines
 *   - Update baselines: npm run test:e2e -- --update-snapshots
 *
 * Percy.io Integration (Optional):
 *   - Install: npm install --save-dev @percy/playwright
 *   - Import: import percySnapshot from '@percy/playwright';
 *   - Usage: await percySnapshot(page, 'Snapshot Name');
 */

test.describe('Visual Regression - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for dashboard to fully load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Full Dashboard Screenshots', () => {
    test('should match dashboard layout baseline', async ({ page }) => {
      // ARRANGE - Wait for all content to load
      await page.waitForSelector('[data-testid="stat-card"]');
      await page.waitForTimeout(500); // Wait for animations

      // ACT & ASSERT
      await expect(page).toHaveScreenshot('dashboard-full-view.png', {
        fullPage: true,
        timeout: 10000,
      });
    });

    test('should match dark theme colors', async ({ page }) => {
      // ARRANGE
      await page.waitForSelector('[data-testid="stat-card"]');
      await page.waitForTimeout(500);

      // ACT & ASSERT - Focus on color-critical area
      const main = page.locator('main');
      await expect(main).toHaveScreenshot('dashboard-dark-theme.png', {
        timeout: 10000,
      });
    });

    test('should match desktop viewport (1920x1080)', async ({ page }) => {
      // ARRANGE
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(300);

      // ACT & ASSERT
      await expect(page).toHaveScreenshot('dashboard-desktop.png', {
        fullPage: false,
        timeout: 10000,
      });
    });

    test('should match tablet viewport (768x1024)', async ({ page }) => {
      // ARRANGE
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);

      // ACT & ASSERT
      await expect(page).toHaveScreenshot('dashboard-tablet.png', {
        fullPage: false,
        timeout: 10000,
      });
    });

    test('should match mobile viewport (375x667)', async ({ page }) => {
      // ARRANGE
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);

      // ACT & ASSERT
      await expect(page).toHaveScreenshot('dashboard-mobile.png', {
        fullPage: false,
        timeout: 10000,
      });
    });
  });

  test.describe('Component Screenshots', () => {
    test('should match stat cards appearance', async ({ page }) => {
      // ARRANGE
      const statsGrid = page.locator('[data-testid="stats-grid"]');
      await statsGrid.waitFor({ state: 'visible' });
      await page.waitForTimeout(300);

      // ACT & ASSERT
      await expect(statsGrid).toHaveScreenshot('stat-cards.png', {
        timeout: 10000,
      });
    });

    test('should match project cards grid', async ({ page }) => {
      // ARRANGE
      const projectsGrid = page.locator('[data-testid="projects-grid"]');

      // Skip if no projects
      if (await projectsGrid.count() === 0) {
        test.skip();
      }

      await projectsGrid.waitFor({ state: 'visible' });
      await page.waitForTimeout(300);

      // ACT & ASSERT
      await expect(projectsGrid).toHaveScreenshot('project-cards-grid.png', {
        timeout: 10000,
      });
    });

    test('should match single project card with active status', async ({ page }) => {
      // ARRANGE
      const activeCard = page.locator('[data-testid="project-card"][data-status="active"]').first();

      // Skip if no active projects
      if (await activeCard.count() === 0) {
        test.skip();
      }

      await activeCard.waitFor({ state: 'visible' });
      await page.waitForTimeout(500); // Wait for pulse animation

      // ACT & ASSERT
      await expect(activeCard).toHaveScreenshot('project-card-active.png', {
        timeout: 10000,
        animations: 'allow', // Capture animation state
      });
    });

    test('should match single project card with idle status', async ({ page }) => {
      // ARRANGE
      const idleCard = page.locator('[data-testid="project-card"][data-status="idle"]').first();

      // Skip if no idle projects
      if (await idleCard.count() === 0) {
        test.skip();
      }

      await idleCard.waitFor({ state: 'visible' });

      // ACT & ASSERT
      await expect(idleCard).toHaveScreenshot('project-card-idle.png', {
        timeout: 10000,
      });
    });

    test('should match header navigation', async ({ page }) => {
      // ARRANGE
      const header = page.locator('header, [data-testid="header"]').first();
      await header.waitFor({ state: 'visible' });

      // ACT & ASSERT
      await expect(header).toHaveScreenshot('header-nav.png', {
        timeout: 10000,
      });
    });
  });

  test.describe('Modal Screenshots', () => {
    test('should match new project modal', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(300);

      // ACT & ASSERT
      const modal = page.locator('text=Create New Project').locator('..');
      await expect(modal).toHaveScreenshot('new-project-modal.png', {
        timeout: 10000,
      });
    });

    test('should match settings modal', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(300);

      // ACT & ASSERT
      const modal = page.locator('text=Settings').locator('..').locator('..');
      await expect(modal).toHaveScreenshot('settings-modal.png', {
        timeout: 10000,
      });
    });

    test('should match project detail panel', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      await page.waitForTimeout(500);

      // ACT & ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toHaveScreenshot('project-detail-panel.png', {
        timeout: 10000,
      });
    });
  });

  test.describe('Hover States', () => {
    test('should match project card hover state', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.hover();
      await page.waitForTimeout(200); // Wait for transition

      // ASSERT
      await expect(projectCard).toHaveScreenshot('project-card-hover.png', {
        timeout: 10000,
      });
    });

    test('should match mute button hover state', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"]');

      // ACT
      await muteButton.hover();
      await page.waitForTimeout(200);

      // ASSERT
      await expect(muteButton).toHaveScreenshot('mute-button-hover.png', {
        timeout: 10000,
      });
    });

    test('should match button hover states in modals', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(300);

      const createButton = page.locator('button:has-text("Create Project")');

      // ACT
      await createButton.hover();
      await page.waitForTimeout(200);

      // ASSERT
      await expect(createButton).toHaveScreenshot('create-button-hover.png', {
        timeout: 10000,
      });
    });
  });

  test.describe('Animation States', () => {
    test('should match active status indicator pulse animation', async ({ page }) => {
      // ARRANGE
      const activeCard = page.locator('[data-testid="project-card"][data-status="active"]').first();

      // Skip if no active projects
      if (await activeCard.count() === 0) {
        test.skip();
      }

      const statusDot = activeCard.locator('[data-testid="status-indicator"]');

      // ACT - Capture mid-animation
      await page.waitForTimeout(500);

      // ASSERT
      await expect(statusDot).toHaveScreenshot('status-pulse-animation.png', {
        timeout: 10000,
        animations: 'allow',
      });
    });

    test('should match progress bar fill animation', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const progressBar = projectCard.locator('[data-testid="progress-bar"]');

      // ACT
      await page.waitForTimeout(400); // Wait for animation

      // ASSERT
      await expect(progressBar).toHaveScreenshot('progress-bar.png', {
        timeout: 10000,
      });
    });
  });

  test.describe('Color Accuracy', () => {
    test('should match violet accent colors', async ({ page }) => {
      // ARRANGE
      const violetElements = page.locator('[class*="violet"], [class*="primary"]').first();
      await violetElements.waitFor({ state: 'visible' });

      // ACT & ASSERT
      await expect(violetElements).toHaveScreenshot('violet-accent.png', {
        timeout: 10000,
      });
    });

    test('should match dark background colors', async ({ page }) => {
      // ARRANGE
      const background = page.locator('main');

      // ACT & ASSERT
      await expect(background).toHaveScreenshot('dark-background.png', {
        timeout: 10000,
        maxDiffPixelRatio: 0.01, // Allow 1% difference for anti-aliasing
      });
    });

    test('should match status indicator colors', async ({ page }) => {
      // ARRANGE - Get cards with different statuses
      const activeStatus = page.locator('[data-testid="status-indicator"]').filter({ has: page.locator('.bg-green-500') }).first();
      const idleStatus = page.locator('[data-testid="status-indicator"]').filter({ has: page.locator('.bg-gray-500') }).first();

      // ACT & ASSERT
      if (await activeStatus.count() > 0) {
        await expect(activeStatus).toHaveScreenshot('status-green.png', {
          timeout: 10000,
        });
      }
      if (await idleStatus.count() > 0) {
        await expect(idleStatus).toHaveScreenshot('status-gray.png', {
          timeout: 10000,
        });
      }
    });
  });

  test.describe('Typography', () => {
    test('should match font rendering', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const projectName = projectCard.locator('[data-testid="project-name"]');

      // ACT & ASSERT
      await expect(projectName).toHaveScreenshot('typography-project-name.png', {
        timeout: 10000,
      });
    });

    test('should match monospace font for code elements', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has([class*="Settings"])').first();
      await settingsButton.click();
      await page.waitForTimeout(300);

      const apiKeyInput = page.locator('input[type="password"][placeholder*="sk-proj"]');

      // ACT & ASSERT
      if (await apiKeyInput.count() > 0) {
        await expect(apiKeyInput).toHaveScreenshot('typography-monospace.png', {
          timeout: 10000,
        });
      }
    });
  });

  test.describe('Cross-Browser Consistency', () => {
    test('should render consistently in Chromium', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chromium-specific test');

      // ACT & ASSERT
      await expect(page).toHaveScreenshot('chromium-dashboard.png', {
        fullPage: false,
        timeout: 10000,
      });
    });

    test('should render consistently in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');

      // ACT & ASSERT
      await expect(page).toHaveScreenshot('firefox-dashboard.png', {
        fullPage: false,
        timeout: 10000,
      });
    });

    test('should render consistently in WebKit', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'WebKit-specific test');

      // ACT & ASSERT
      await expect(page).toHaveScreenshot('webkit-dashboard.png', {
        fullPage: false,
        timeout: 10000,
      });
    });
  });

  test.describe('Error States', () => {
    test('should match form validation error appearance', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(300);

      // ACT - Trigger validation error
      const nameInput = page.locator('#project-name, input[placeholder*="my-awesome-project"]');
      await nameInput.fill('invalid project name!');
      await nameInput.blur();
      await page.waitForTimeout(200);

      // ASSERT
      const errorMessage = page.locator('text=can only contain').first();
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.locator('..').locator('..')).toHaveScreenshot('validation-error.png', {
          timeout: 10000,
        });
      }
    });

    test('should match disabled button state', async ({ page }) => {
      // ARRANGE
      const newProjectButton = page.locator('button:has-text("New Project"), [data-testid="new-project-button"]').first();
      await newProjectButton.click();
      await page.waitForTimeout(300);

      // ACT - Leave form empty to keep button disabled
      const createButton = page.locator('button:has-text("Create Project")');

      // ASSERT
      await expect(createButton).toHaveScreenshot('button-disabled.png', {
        timeout: 10000,
      });
    });
  });
});

/**
 * Percy.io Integration Example
 *
 * If using Percy for cloud-based visual regression testing:
 *
 * import percySnapshot from '@percy/playwright';
 *
 * test('percy snapshot example', async ({ page }) => {
 *   await page.goto('/');
 *   await percySnapshot(page, 'Dashboard - Full View');
 * });
 */
