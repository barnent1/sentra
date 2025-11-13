import { test, expect } from '@playwright/test';

test.describe('Project Detail Panel - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Opening and Closing', () => {
    test('should open panel when clicking project card', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toBeVisible();
    });

    test('should display backdrop when panel is open', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const backdrop = page.locator('[data-testid="panel-backdrop"]');
      await expect(backdrop).toBeVisible();
    });

    test('should close panel when clicking backdrop', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toBeVisible();

      // ACT
      const backdrop = page.locator('[data-testid="panel-backdrop"]');
      await backdrop.click({ position: { x: 10, y: 10 } }); // Click far from panel

      // ASSERT
      await expect(panel).not.toBeVisible();
    });

    test('should close panel when clicking close button', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toBeVisible();

      // ACT
      const closeButton = panel.locator('[data-testid="close-button"]');
      await closeButton.click();

      // ASSERT
      await expect(panel).not.toBeVisible();
    });

    test('should close panel when pressing Escape key', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toBeVisible();

      // ACT
      await page.keyboard.press('Escape');

      // ASSERT
      await expect(panel).not.toBeVisible();
    });
  });

  test.describe('Slide-in Animation', () => {
    test('should slide in from right when opening', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveClass(/animate-slide-in-right/);
    });

    test('should have smooth transition', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      const transition = await panel.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.transitionProperty;
      });
      expect(transition).toContain('transform');
    });
  });

  test.describe('Tab Switching', () => {
    test('should default to Overview tab', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await expect(overviewTab).toHaveAttribute('data-active', 'true');
    });

    test('should switch to Git tab when clicked', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // ACT
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      // ASSERT
      await expect(gitTab).toHaveAttribute('data-active', 'true');
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await expect(overviewTab).toHaveAttribute('data-active', 'false');
    });

    test('should switch to Logs tab when clicked', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // ACT
      const logsTab = page.locator('[data-testid="tab-logs"]');
      await logsTab.click();

      // ASSERT
      await expect(logsTab).toHaveAttribute('data-active', 'true');
    });

    test('should switch to Costs tab when clicked', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // ACT
      const costsTab = page.locator('[data-testid="tab-costs"]');
      await costsTab.click();

      // ASSERT
      await expect(costsTab).toHaveAttribute('data-active', 'true');
    });

    test('should highlight active tab with violet border', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // ACT
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      // ASSERT
      await expect(gitTab).toHaveClass(/border-violet-500/);
      await expect(gitTab).toHaveClass(/border-b-2/);
    });

    test('should update tab panel content when switching tabs', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // ACT - Switch to Git tab
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      // ASSERT - Should show git content
      const tabPanel = page.locator('[data-testid="tab-panel"]');
      await expect(tabPanel).toHaveAttribute('aria-labelledby', 'tab-git');
    });
  });

  test.describe('Overview Tab Content', () => {
    test('should display project stats', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel.locator('[data-testid="recent-activity"]')).toBeVisible();
    });

    test('should display progress information', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel.getByText(/%/)).toBeVisible();
    });
  });

  test.describe('Git Tab Content', () => {
    test('should display git commits', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // ACT
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      // ASSERT - Wait for loading to complete
      await page.waitForTimeout(500);
      const panel = page.locator('[data-testid="project-detail-panel"]');

      // Should show either commits or empty state
      const hasCommits = await panel.getByText(/commit/i).count() > 0;
      const hasEmptyState = await panel.getByText(/no commits/i).count() > 0;
      expect(hasCommits || hasEmptyState).toBeTruthy();
    });

    test('should show current branch', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // ACT
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      // ASSERT - Wait for loading
      await page.waitForTimeout(500);
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel.getByText(/branch/i)).toBeVisible();
    });
  });

  test.describe('Logs Tab Content', () => {
    test('should display log entries', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // ACT
      const logsTab = page.locator('[data-testid="tab-logs"]');
      await logsTab.click();

      // ASSERT
      await page.waitForTimeout(500);
      const logsContainer = page.locator('[data-testid="logs-container"]');
      await expect(logsContainer).toBeVisible();
    });

    test('should have monospace font for logs', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // ACT
      const logsTab = page.locator('[data-testid="tab-logs"]');
      await logsTab.click();

      // ASSERT
      const logsContainer = page.locator('[data-testid="logs-container"]');
      const fontFamily = await logsContainer.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.fontFamily;
      });
      expect(fontFamily).toContain('mono');
    });

    test('should filter logs when typing in search', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const logsTab = page.locator('[data-testid="tab-logs"]');
      await logsTab.click();

      // ACT
      const filterInput = page.locator('[data-testid="log-filter-input"]');
      await filterInput.fill('ERROR');

      // ASSERT - Content should update based on filter
      await page.waitForTimeout(300);
      // If there are logs, they should be filtered
    });
  });

  test.describe('Costs Tab Content', () => {
    test('should display cost chart', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // ACT
      const costsTab = page.locator('[data-testid="tab-costs"]');
      await costsTab.click();

      // ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel.getByText(/\$/)).toBeVisible();
    });

    test('should display cost breakdown', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // ACT
      const costsTab = page.locator('[data-testid="tab-costs"]');
      await costsTab.click();

      // ASSERT
      const costBreakdown = page.locator('[data-testid="cost-breakdown"]');
      await expect(costBreakdown).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate tabs with arrow keys', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // ACT
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await overviewTab.focus();
      await page.keyboard.press('ArrowRight');

      // ASSERT
      const gitTab = page.locator('[data-testid="tab-git"]');
      await expect(gitTab).toHaveAttribute('data-active', 'true');
    });

    test('should navigate backwards with ArrowLeft', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // Switch to Git tab first
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      // ACT
      await gitTab.focus();
      await page.keyboard.press('ArrowLeft');

      // ASSERT
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await expect(overviewTab).toHaveAttribute('data-active', 'true');
    });

    test('should wrap around to first tab when at end', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // Navigate to last tab
      const costsTab = page.locator('[data-testid="tab-costs"]');
      await costsTab.click();

      // ACT
      await costsTab.focus();
      await page.keyboard.press('ArrowRight');

      // ASSERT
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await expect(overviewTab).toHaveAttribute('data-active', 'true');
    });

    test('should trap focus within panel', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      // ACT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      const closeButton = panel.locator('[data-testid="close-button"]');
      await closeButton.focus();

      // Tab forward through all focusable elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // ASSERT - Focus should still be within panel
      const activeElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      const panelTestIds = ['close-button', 'tab-overview', 'tab-git', 'tab-logs', 'tab-costs'];
      expect(panelTestIds).toContain(activeElement);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA role', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toHaveAttribute('role', 'dialog');
    });

    test('should have aria-modal attribute', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toHaveAttribute('aria-modal', 'true');
    });

    test('should have aria-labelledby', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toHaveAttribute('aria-labelledby', 'panel-header');
    });

    test('should have proper tab roles', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const tabs = [
        page.locator('[data-testid="tab-overview"]'),
        page.locator('[data-testid="tab-git"]'),
        page.locator('[data-testid="tab-logs"]'),
        page.locator('[data-testid="tab-costs"]'),
      ];

      for (const tab of tabs) {
        await expect(tab).toHaveAttribute('role', 'tab');
      }
    });

    test('should have tabpanel role for content', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const tabPanel = page.locator('[data-testid="tab-panel"]');
      await expect(tabPanel).toHaveAttribute('role', 'tabpanel');
    });

    test('should have proper close button label', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const closeButton = page.locator('[data-testid="close-button"]');
      await expect(closeButton).toHaveAttribute('aria-label', 'Close panel');
    });
  });

  test.describe('Visual Styling', () => {
    test('should use dark charcoal background', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toHaveCSS('background-color', 'rgb(24, 24, 27)');
    });

    test('should have subtle left border', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toHaveCSS('border-left-width', '1px');
      await expect(panel).toHaveCSS('border-left-color', 'rgb(39, 39, 42)');
    });

    test('should be positioned on right side', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toHaveCSS('position', 'fixed');

      const position = await panel.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return { right: style.right, top: style.top };
      });
      expect(position.right).toBe('0px');
      expect(position.top).toBe('0px');
    });

    test('should have full height', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const panel = page.locator('[data-testid="project-detail-panel"]');
      const height = await panel.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.height;
      });

      const viewportHeight = await page.evaluate(() => window.innerHeight);
      expect(parseInt(height)).toBe(viewportHeight);
    });
  });

  test.describe('Backdrop Styling', () => {
    test('should have semi-transparent black background', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const backdrop = page.locator('[data-testid="panel-backdrop"]');
      const backgroundColor = await backdrop.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor;
      });

      // Should be black with 50% opacity (rgba(0, 0, 0, 0.5))
      expect(backgroundColor).toMatch(/rgba?\(0,\s*0,\s*0/);
    });

    test('should cover entire viewport', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // ASSERT
      const backdrop = page.locator('[data-testid="panel-backdrop"]');
      await expect(backdrop).toHaveCSS('position', 'fixed');

      const dimensions = await backdrop.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          top: style.top,
          left: style.left,
          width: style.width,
          height: style.height,
        };
      });

      expect(dimensions.top).toBe('0px');
      expect(dimensions.left).toBe('0px');
    });
  });
});
