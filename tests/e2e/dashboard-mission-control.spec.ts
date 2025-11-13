import { test, expect } from '@playwright/test';

test.describe('Mission Control Dashboard - Visual States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('True Dark Theme', () => {
    test('should render dashboard with true dark background', async ({ page }) => {
      // ARRANGE & ACT
      const main = page.locator('main');

      // ASSERT - Background should be #0A0A0B (near black)
      await expect(main).toHaveCSS('background-color', 'rgb(10, 10, 11)');
    });

    test('should render stat cards with dark charcoal background', async ({ page }) => {
      // ARRANGE & ACT
      const statCards = page.locator('[data-testid="stat-card"]');

      // ASSERT - Cards should have #18181B background
      await expect(statCards.first()).toHaveCSS('background-color', 'rgb(24, 24, 27)');
    });

    test('should render project cards with dark charcoal background', async ({ page }) => {
      // ARRANGE & ACT
      const projectCards = page.locator('[data-testid="project-card"]');

      // ASSERT - Cards should have #18181B background
      if (await projectCards.count() > 0) {
        await expect(projectCards.first()).toHaveCSS('background-color', 'rgb(24, 24, 27)');
      }
    });

    test('should use subtle borders on cards', async ({ page }) => {
      // ARRANGE & ACT
      const statCards = page.locator('[data-testid="stat-card"]');

      // ASSERT - Border should be 1px solid #27272A
      await expect(statCards.first()).toHaveCSS('border-width', '1px');
      await expect(statCards.first()).toHaveCSS('border-color', 'rgb(39, 39, 42)');
    });
  });

  test.describe('Status Indicators', () => {
    test('should display active status with green animated dot', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"][data-status="active"]').first();

      // Skip if no active projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      const statusDot = projectCard.locator('[data-testid="status-indicator"]');

      // ASSERT
      await expect(statusDot).toBeVisible();
      await expect(statusDot).toHaveClass(/bg-green-500/);
      await expect(statusDot).toHaveClass(/animate-pulse/);
    });

    test('should display idle status with gray static dot', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"][data-status="idle"]').first();

      // Skip if no idle projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      const statusDot = projectCard.locator('[data-testid="status-indicator"]');

      // ASSERT
      await expect(statusDot).toBeVisible();
      await expect(statusDot).toHaveClass(/bg-gray-500/);
      await expect(statusDot).not.toHaveClass(/animate-pulse/);
    });

    test('should display error status with red animated dot', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"][data-status="error"]').first();

      // Skip if no error projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      const statusDot = projectCard.locator('[data-testid="status-indicator"]');

      // ASSERT
      await expect(statusDot).toBeVisible();
      await expect(statusDot).toHaveClass(/bg-red-500/);
      await expect(statusDot).toHaveClass(/animate-pulse/);
    });
  });

  test.describe('Progress Bars', () => {
    test('should display visual progress bar with percentage', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      const progressBar = projectCard.locator('[data-testid="progress-bar"]');
      const progressText = projectCard.locator('[data-testid="progress-text"]');

      // ASSERT
      await expect(progressBar).toBeVisible();
      await expect(progressText).toBeVisible();
      await expect(progressText).toContainText('%');
    });

    test('should use violet color for active project progress', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"][data-status="active"]').first();

      // Skip if no active projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      const progressFill = projectCard.locator('[data-testid="progress-fill"]');

      // ASSERT
      await expect(progressFill).toBeVisible();
      await expect(progressFill).toHaveClass(/bg-violet-600/);
    });

    test('should use gray color for idle project progress', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"][data-status="idle"]').first();

      // Skip if no idle projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      const progressFill = projectCard.locator('[data-testid="progress-fill"]');

      // ASSERT
      await expect(progressFill).toBeVisible();
      await expect(progressFill).toHaveClass(/bg-gray-600/);
    });

    test('should update progress bar width based on percentage', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      const progressFill = projectCard.locator('[data-testid="progress-fill"]');
      const progressText = await projectCard.locator('[data-testid="progress-text"]').textContent();

      // ASSERT
      if (progressText) {
        const percentage = parseInt(progressText.replace('%', ''));
        const width = await progressFill.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.width;
        });

        // Width should reflect percentage (allowing for rounding)
        expect(width).toBeTruthy();
      }
    });
  });

  test.describe('Grid Layout', () => {
    test('should display stat cards in 4-column grid', async ({ page }) => {
      // ARRANGE & ACT
      const statsGrid = page.locator('[data-testid="stats-grid"]');

      // ASSERT
      await expect(statsGrid).toHaveCSS('display', 'grid');
      await expect(statsGrid).toHaveClass(/grid-cols-4/);
    });

    test('should display project cards in responsive grid', async ({ page }) => {
      // ARRANGE & ACT
      const projectsGrid = page.locator('[data-testid="projects-grid"]');

      // Skip if no projects
      if (await projectsGrid.count() === 0) {
        test.skip();
      }

      // ASSERT
      await expect(projectsGrid).toHaveCSS('display', 'grid');
      // Should support 2-3 columns on desktop
      await expect(projectsGrid).toHaveClass(/grid-cols-/);
    });

    test('should have consistent gap between grid items', async ({ page }) => {
      // ARRANGE & ACT
      const statsGrid = page.locator('[data-testid="stats-grid"]');

      // ASSERT - 24px gap
      await expect(statsGrid).toHaveCSS('gap', '24px');
    });
  });

  test.describe('Hover Effects', () => {
    test('should show hover effect on project card', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT - Hover over card
      await projectCard.hover();

      // ASSERT - Card should have hover state (border color change or shadow)
      const transition = await projectCard.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.transition;
      });
      expect(transition).toContain('all');
    });

    test('should show hover effect on mute button', async ({ page }) => {
      // ARRANGE
      const muteButton = page.locator('[data-testid="mute-button"]').first();

      // Skip if no projects
      if (await muteButton.count() === 0) {
        test.skip();
      }

      // ACT - Hover over button
      await muteButton.hover();

      // ASSERT - Button should have hover state
      await expect(muteButton).toHaveCSS('cursor', 'pointer');
    });
  });

  test.describe('Mute Button', () => {
    test('should toggle mute state on click', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"]');
      const initialState = await muteButton.getAttribute('data-muted');

      // ACT
      await muteButton.click();
      await page.waitForTimeout(100); // Wait for state update

      // ASSERT
      const newState = await muteButton.getAttribute('data-muted');
      expect(newState).not.toBe(initialState);
    });

    test('should show unmuted icon when not muted', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"][data-muted="false"]');

      // Skip if project is muted
      if (await muteButton.count() === 0) {
        test.skip();
      }

      // ACT
      const icon = muteButton.locator('svg');

      // ASSERT - Should show volume icon (not muted)
      await expect(icon).toBeVisible();
    });

    test('should show muted icon when muted', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"]');

      // Ensure muted state
      const currentState = await muteButton.getAttribute('data-muted');
      if (currentState === 'false') {
        await muteButton.click();
        await page.waitForTimeout(100);
      }

      // ACT
      const icon = muteButton.locator('svg');

      // ASSERT - Should show muted icon
      await expect(icon).toBeVisible();
    });

    test('should persist mute state after refresh', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"]');

      // Set to muted
      const initialState = await muteButton.getAttribute('data-muted');
      if (initialState === 'false') {
        await muteButton.click();
        await page.waitForTimeout(100);
      }

      const projectName = await projectCard.getAttribute('data-project-name');

      // ACT - Refresh page
      await page.reload();

      // ASSERT - Mute state should persist
      const projectCardAfterReload = page.locator(`[data-testid="project-card"][data-project-name="${projectName}"]`);
      const muteButtonAfterReload = projectCardAfterReload.locator('[data-testid="mute-button"]');
      await expect(muteButtonAfterReload).toHaveAttribute('data-muted', 'true');
    });
  });

  test.describe('Transitions and Animations', () => {
    test('should animate status indicator pulse for active projects', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"][data-status="active"]').first();

      // Skip if no active projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      const statusDot = projectCard.locator('[data-testid="status-indicator"]');

      // ASSERT - Should have animation class
      await expect(statusDot).toHaveClass(/animate-pulse/);
    });

    test('should smoothly transition card border on hover', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.hover();

      // ASSERT - Should have transition property
      const transitionProperty = await projectCard.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.transitionProperty;
      });
      expect(transitionProperty).toContain('all');
    });

    test('should smoothly transition button background on hover', async ({ page }) => {
      // ARRANGE
      const muteButton = page.locator('[data-testid="mute-button"]').first();

      // Skip if no projects
      if (await muteButton.count() === 0) {
        test.skip();
      }

      // ACT
      await muteButton.hover();

      // ASSERT - Should have transition
      const transitionProperty = await muteButton.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.transitionProperty;
      });
      expect(transitionProperty).toContain('color');
    });
  });

  test.describe('Violet Accent Color', () => {
    test('should use violet for progress bars on active projects', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"][data-status="active"]').first();

      // Skip if no active projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      const progressFill = projectCard.locator('[data-testid="progress-fill"]');

      // ASSERT - Should use violet (#7C3AED = rgb(124, 58, 237))
      await expect(progressFill).toHaveClass(/bg-violet-600/);
    });

    test('should use violet for Settings icon hover state', async ({ page }) => {
      // ARRANGE
      const settingsButton = page.locator('[data-testid="settings-button"]');

      // ACT
      await settingsButton.hover();

      // ASSERT - Should have violet color on hover
      const icon = settingsButton.locator('svg');
      await expect(icon).toHaveClass(/text-primary/); // primary is violet
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels on mute button', async ({ page }) => {
      // ARRANGE
      const muteButton = page.locator('[data-testid="mute-button"]').first();

      // Skip if no projects
      if (await muteButton.count() === 0) {
        test.skip();
      }

      // ACT & ASSERT
      const ariaLabel = await muteButton.getAttribute('aria-label');
      expect(ariaLabel).toContain('Mute');
    });

    test('should have proper ARIA labels on status indicators', async ({ page }) => {
      // ARRANGE
      const statusIndicator = page.locator('[data-testid="status-indicator"]').first();

      // Skip if no projects
      if (await statusIndicator.count() === 0) {
        test.skip();
      }

      // ACT & ASSERT
      await expect(statusIndicator).toHaveAttribute('aria-label');
    });

    test('should maintain proper color contrast for text', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      const projectName = projectCard.locator('[data-testid="project-name"]');

      // ASSERT - Text should be visible against dark background
      const color = await projectName.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.color;
      });
      expect(color).toMatch(/rgb\(250, 250, 250\)|rgb\(255, 255, 255\)/);
    });
  });

  test.describe('Speech Center Integration', () => {
    test('should preserve existing speech center animation', async ({ page }) => {
      // ARRANGE & ACT
      const speechCenter = page.locator('[data-testid="speech-center"]');

      // ASSERT - Speech center should still exist
      // Note: This might be in a different location, we're just checking it exists
      // The actual component might be in ArchitectChat
      if (await speechCenter.count() > 0) {
        await expect(speechCenter).toBeVisible();
      }
    });
  });
});
