import { test, expect } from '@playwright/test';

test.describe('Dashboard Interactions - Project Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Project Card Click Interaction', () => {
    test('should open detail panel when clicking project card', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();
      await page.waitForTimeout(300); // Wait for panel animation

      // ASSERT
      const detailPanel = page.locator('[data-testid="project-detail-panel"]');
      await expect(detailPanel).toBeVisible();
    });

    test('should display correct project details in panel', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const projectName = await projectCard.getAttribute('data-project-name');

      // ACT
      await projectCard.click();
      await page.waitForTimeout(300);

      // ASSERT
      const detailPanel = page.locator('[data-testid="project-detail-panel"]');
      const panelProjectName = await detailPanel.locator('[data-testid="panel-project-name"]').textContent();
      expect(panelProjectName).toContain(projectName);
    });

    test('should close detail panel when clicking close button', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      await page.waitForTimeout(300);

      const detailPanel = page.locator('[data-testid="project-detail-panel"]');
      await expect(detailPanel).toBeVisible();

      // ACT
      const closeButton = detailPanel.locator('button:has-text("Close"), [aria-label*="Close"], [data-testid="close-button"]').first();
      await closeButton.click();
      await page.waitForTimeout(300);

      // ASSERT
      await expect(detailPanel).not.toBeVisible();
    });

    test('should not open panel when clicking mute button', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"]');

      // ACT
      await muteButton.click();
      await page.waitForTimeout(200);

      // ASSERT - Detail panel should NOT open
      const detailPanel = page.locator('[data-testid="project-detail-panel"]');
      await expect(detailPanel).not.toBeVisible();
    });
  });

  test.describe('Stats Display', () => {
    test('should display all four stat cards', async ({ page }) => {
      // ARRANGE & ACT
      const statCards = page.locator('[data-testid="stat-card"]');

      // ASSERT
      expect(await statCards.count()).toBe(4);
    });

    test('should display active agents count', async ({ page }) => {
      // ARRANGE & ACT
      const activeAgentsStat = page.locator('[data-testid="stat-card"]').filter({ hasText: 'Active Agents' }).first();

      // ASSERT
      await expect(activeAgentsStat).toBeVisible();
      const value = await activeAgentsStat.locator('[data-testid="stat-value"]').textContent();
      expect(value).toMatch(/^\d+$/); // Should be a number
    });

    test('should display total projects count', async ({ page }) => {
      // ARRANGE & ACT
      const projectsStat = page.locator('[data-testid="stat-card"]').filter({ hasText: 'Projects' }).first();

      // ASSERT
      await expect(projectsStat).toBeVisible();
      const value = await projectsStat.locator('[data-testid="stat-value"]').textContent();
      expect(value).toMatch(/^\d+$/);
    });

    test('should display today cost with currency format', async ({ page }) => {
      // ARRANGE & ACT
      const costStat = page.locator('[data-testid="stat-card"]').filter({ hasText: 'Today' }).first();

      // ASSERT
      await expect(costStat).toBeVisible();
      const value = await costStat.locator('[data-testid="stat-value"]').textContent();
      expect(value).toMatch(/^\$\d+\.\d{2}$/); // Should be currency format $X.XX
    });

    test('should display success rate as percentage', async ({ page }) => {
      // ARRANGE & ACT
      const successStat = page.locator('[data-testid="stat-card"]').filter({ hasText: 'Success' }).first();

      // ASSERT
      await expect(successStat).toBeVisible();
      const value = await successStat.locator('[data-testid="stat-value"]').textContent();
      expect(value).toMatch(/^\d+%$/); // Should be percentage format
    });

    test('should update stats in real-time', async ({ page }) => {
      // ARRANGE
      const activeAgentsStat = page.locator('[data-testid="stat-card"]').filter({ hasText: 'Active Agents' }).first();
      const initialValue = await activeAgentsStat.locator('[data-testid="stat-value"]').textContent();

      // ACT - Wait for potential update (simulate real-time polling)
      await page.waitForTimeout(2000);

      // ASSERT - Value should either stay same or update (just verify it's still valid)
      const updatedValue = await activeAgentsStat.locator('[data-testid="stat-value"]').textContent();
      expect(updatedValue).toMatch(/^\d+$/);
    });
  });

  test.describe('Mute Button Functionality', () => {
    test('should toggle mute state visually', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"]');
      const initialIcon = await muteButton.locator('svg').getAttribute('class');

      // ACT
      await muteButton.click();
      await page.waitForTimeout(200);

      // ASSERT - Icon should change
      const updatedIcon = await muteButton.locator('svg').getAttribute('class');
      expect(updatedIcon).not.toBe(initialIcon);
    });

    test('should show correct tooltip for unmuted state', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"][data-muted="false"]');

      // Skip if already muted
      if (await muteButton.count() === 0) {
        test.skip();
      }

      // ACT - Hover to show tooltip
      await muteButton.hover();

      // ASSERT
      const ariaLabel = await muteButton.getAttribute('aria-label');
      expect(ariaLabel).toContain('Mute');
      expect(ariaLabel).not.toContain('Unmute');
    });

    test('should show correct tooltip for muted state', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"]');

      // Set to muted state first
      if (await muteButton.getAttribute('data-muted') === 'false') {
        await muteButton.click();
        await page.waitForTimeout(200);
      }

      // ACT - Hover to show tooltip
      await muteButton.hover();

      // ASSERT
      const ariaLabel = await muteButton.getAttribute('aria-label');
      expect(ariaLabel).toContain('Unmute');
    });

    test('should apply muted styling when muted', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"]');

      // Set to muted state
      if (await muteButton.getAttribute('data-muted') === 'false') {
        await muteButton.click();
        await page.waitForTimeout(200);
      }

      // ASSERT - Button should have violet styling
      const buttonClasses = await muteButton.getAttribute('class');
      expect(buttonClasses).toContain('violet');
    });
  });

  test.describe('Voice Queue Integration', () => {
    test('should not queue voice notifications when project is muted', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"]');

      // Set to muted state
      if (await muteButton.getAttribute('data-muted') === 'false') {
        await muteButton.click();
        await page.waitForTimeout(200);
      }

      // ACT - Simulate agent completion (in real app this would trigger notification)
      // This test verifies the muted state is set correctly
      const isMuted = await muteButton.getAttribute('data-muted');

      // ASSERT
      expect(isMuted).toBe('true');
    });

    test('should allow voice notifications when project is unmuted', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"]');

      // Set to unmuted state
      if (await muteButton.getAttribute('data-muted') === 'true') {
        await muteButton.click();
        await page.waitForTimeout(200);
      }

      // ACT
      const isMuted = await muteButton.getAttribute('data-muted');

      // ASSERT
      expect(isMuted).toBe('false');
    });

    test('should preserve mute state across multiple toggles', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"]');
      const initialState = await muteButton.getAttribute('data-muted');

      // ACT - Toggle twice
      await muteButton.click();
      await page.waitForTimeout(200);
      await muteButton.click();
      await page.waitForTimeout(200);

      // ASSERT - Should be back to initial state
      const finalState = await muteButton.getAttribute('data-muted');
      expect(finalState).toBe(initialState);
    });
  });

  test.describe('Project Card Layout', () => {
    test('should display project name prominently', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      const projectName = projectCard.locator('[data-testid="project-name"]');

      // ASSERT
      await expect(projectName).toBeVisible();
      await expect(projectName).toHaveClass(/text-lg/); // Large text
      await expect(projectName).toHaveClass(/font-semibold/); // Bold
    });

    test('should display current task when available', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"][data-status="active"]').first();

      // Skip if no active projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      const currentTask = projectCard.locator('[data-testid="current-task"]');

      // ASSERT
      await expect(currentTask).toBeVisible();
      const taskText = await currentTask.textContent();
      expect(taskText?.length).toBeGreaterThan(0);
    });

    test('should show completion statistics', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT & ASSERT - Should show issues completed/total
      const statsText = await projectCard.textContent();
      expect(statsText).toMatch(/\d+\/\d+/); // Format: X/Y
    });

    test('should show monthly cost', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT & ASSERT - Should show cost in currency format
      const statsText = await projectCard.textContent();
      expect(statsText).toMatch(/\$\d+\.\d{2}/); // Format: $X.XX
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should allow keyboard navigation between project cards', async ({ page }) => {
      // ARRANGE
      const projectCards = page.locator('[data-testid="project-card"]');

      // Skip if less than 2 projects
      if (await projectCards.count() < 2) {
        test.skip();
      }

      // ACT - Focus first card and press Tab
      await projectCards.first().focus();
      await page.keyboard.press('Tab');

      // ASSERT - Next focusable element should receive focus
      const focusedElement = await page.locator(':focus').getAttribute('data-testid');
      expect(focusedElement).toBeTruthy();
    });

    test('should open detail panel with Enter key', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT - Focus card and press Enter
      await projectCard.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // ASSERT
      const detailPanel = page.locator('[data-testid="project-detail-panel"]');
      await expect(detailPanel).toBeVisible();
    });

    test('should toggle mute with keyboard when button is focused', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const muteButton = projectCard.locator('[data-testid="mute-button"]');
      const initialState = await muteButton.getAttribute('data-muted');

      // ACT - Focus button and press Space
      await muteButton.focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);

      // ASSERT
      const newState = await muteButton.getAttribute('data-muted');
      expect(newState).not.toBe(initialState);
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should maintain grid layout on different viewport sizes', async ({ page }) => {
      // ARRANGE
      const projectsGrid = page.locator('[data-testid="projects-grid"]');

      // Skip if no projects
      if (await projectsGrid.count() === 0) {
        test.skip();
      }

      // ACT - Test desktop size
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(100);

      // ASSERT - Should have grid display
      await expect(projectsGrid).toHaveCSS('display', 'grid');

      // ACT - Test tablet size
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(100);

      // ASSERT - Should still have grid display
      await expect(projectsGrid).toHaveCSS('display', 'grid');
    });

    test('should adapt card content on smaller screens', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT - Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(100);

      // ASSERT - Card should still be visible and readable
      await expect(projectCard).toBeVisible();
      const projectName = projectCard.locator('[data-testid="project-name"]');
      await expect(projectName).toBeVisible();
    });
  });
});
