import { test, expect } from '@playwright/test';

/**
 * E2E tests for PR Review functionality
 *
 * These tests verify the critical user journey for reviewing and merging PRs
 * without opening GitHub in browser.
 *
 * IMPORTANT: These tests assume a project has prNumber, repoOwner, and repoName
 * configured. If no such project exists, tests will be skipped.
 */
test.describe('PR Review - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Opening PR Review Panel', () => {
    test('should show Review PR button when project has PR', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      // ACT
      await projectCard.click();

      // Wait for panel to open
      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toBeVisible();

      // Switch to Git tab
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      // ASSERT: Check if Review PR button exists (only if project has PR)
      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() > 0) {
        await expect(reviewPRButton).toBeVisible();
      } else {
        // No PR configured for this project, skip test
        test.skip();
      }
    });

    test('should open PR review panel when clicking Review PR button', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();

      const panel = page.locator('[data-testid="project-detail-panel"]');
      await expect(panel).toBeVisible();

      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      // ACT
      await reviewPRButton.click();

      // ASSERT
      const prPanel = page.locator('[data-testid="pr-review-panel"]');
      await expect(prPanel).toBeVisible();
    });

    test('should display PR number in header', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      // ACT
      await reviewPRButton.click();

      // ASSERT
      const prPanel = page.locator('[data-testid="pr-review-panel"]');
      await expect(prPanel).toBeVisible();

      // Should show PR number in header (format: "Pull Request #123")
      await expect(prPanel.locator('h2')).toContainText('Pull Request #');
    });
  });

  test.describe('PR Metadata Display', () => {
    test('should display PR title and author', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      // ASSERT
      const prPanel = page.locator('[data-testid="pr-review-panel"]');
      await expect(prPanel).toBeVisible();

      // Wait for data to load
      await page.waitForTimeout(1000);

      // Should display PR title
      await expect(prPanel.locator('h3').first()).not.toBeEmpty();
    });

    test('should display checks status indicator', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      // ASSERT
      const prPanel = page.locator('[data-testid="pr-review-panel"]');
      await expect(prPanel).toBeVisible();

      // Wait for data to load
      await page.waitForTimeout(1000);

      // Should display checks status indicator
      const checksStatus = page.locator('[data-testid="checks-status"]');
      await expect(checksStatus).toBeVisible();

      // Should have either green, red, or yellow background
      const statusClasses = await checksStatus.getAttribute('class');
      expect(statusClasses).toMatch(/bg-(green|red|yellow)-500/);
    });
  });

  test.describe('Diff Viewer', () => {
    test('should display diff viewer', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      // ASSERT
      const prPanel = page.locator('[data-testid="pr-review-panel"]');
      await expect(prPanel).toBeVisible();

      // Wait for diff to load
      await page.waitForTimeout(1500);

      // Should display diff viewer
      const diffViewer = page.locator('[data-testid="diff-viewer"]');
      await expect(diffViewer).toBeVisible();
    });

    test('diff viewer should use monospace font', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      // Wait for diff to load
      await page.waitForTimeout(1500);

      // ASSERT
      const diffViewer = page.locator('[data-testid="diff-viewer"]');
      await expect(diffViewer).toBeVisible();

      const classes = await diffViewer.getAttribute('class');
      expect(classes).toContain('font-mono');
    });
  });

  test.describe('Review Actions', () => {
    test('should display approve button', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      // Wait for panel to load
      await page.waitForTimeout(1000);

      // ASSERT
      const approveButton = page.locator('[data-testid="approve-button"]');
      await expect(approveButton).toBeVisible();
      await expect(approveButton).toHaveText('Approve');
    });

    test('should display request changes button', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      // Wait for panel to load
      await page.waitForTimeout(1000);

      // ASSERT
      const requestChangesButton = page.locator('[data-testid="request-changes-button"]');
      await expect(requestChangesButton).toBeVisible();
      await expect(requestChangesButton).toHaveText('Request Changes');
    });

    test('should display merge button', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      // Wait for panel to load
      await page.waitForTimeout(1000);

      // ASSERT
      const mergeButton = page.locator('[data-testid="merge-button"]');
      await expect(mergeButton).toBeVisible();
      await expect(mergeButton).toHaveText('Merge');
    });

    test('should show merge method options when clicking merge button', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      // Wait for panel to load
      await page.waitForTimeout(1000);

      const mergeButton = page.locator('[data-testid="merge-button"]');

      // Skip if button is disabled (checks failing or PR not mergeable)
      if (await mergeButton.isDisabled()) {
        test.skip();
      }

      // ACT
      await mergeButton.click();

      // ASSERT: Should show merge method options
      const squashOption = page.locator('[data-testid="merge-method-squash"]');
      const mergeOption = page.locator('[data-testid="merge-method-merge"]');
      const rebaseOption = page.locator('[data-testid="merge-method-rebase"]');

      await expect(squashOption).toBeVisible();
      await expect(mergeOption).toBeVisible();
      await expect(rebaseOption).toBeVisible();
    });

    test('should show comment textarea when clicking request changes', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      // Wait for panel to load
      await page.waitForTimeout(1000);

      const requestChangesButton = page.locator('[data-testid="request-changes-button"]');

      // ACT
      await requestChangesButton.click();

      // ASSERT
      const commentTextarea = page.locator('[data-testid="changes-comment-textarea"]');
      await expect(commentTextarea).toBeVisible();

      const submitButton = page.locator('[data-testid="submit-changes-button"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeDisabled(); // Should be disabled when empty
    });
  });

  test.describe('Styling and Theme', () => {
    test('should use true dark theme background', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      // ASSERT
      const prPanel = page.locator('[data-testid="pr-review-panel"]');
      await expect(prPanel).toBeVisible();

      const classes = await prPanel.getAttribute('class');
      expect(classes).toContain('bg-[#18181B]');
    });

    test('approve button should have violet background', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      // Wait for panel to load
      await page.waitForTimeout(1000);

      // ASSERT
      const approveButton = page.locator('[data-testid="approve-button"]');
      const classes = await approveButton.getAttribute('class');
      expect(classes).toContain('bg-violet-500');
    });
  });

  test.describe('Closing PR Panel', () => {
    test('should close PR panel when clicking close button', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      const prPanel = page.locator('[data-testid="pr-review-panel"]');
      await expect(prPanel).toBeVisible();

      // ACT
      const closeButton = page.locator('[data-testid="pr-close-button"]');
      await closeButton.click();

      // ASSERT
      await expect(prPanel).not.toBeVisible();
    });

    test('should close PR panel when clicking backdrop', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      const prPanel = page.locator('[data-testid="pr-review-panel"]');
      await expect(prPanel).toBeVisible();

      // ACT
      const backdrop = page.locator('[data-testid="pr-backdrop"]');
      await backdrop.click({ position: { x: 10, y: 10 } }); // Click top-left corner of backdrop

      // ASSERT
      await expect(prPanel).not.toBeVisible();
    });

    test('should close PR panel when pressing Escape key', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      await projectCard.click();
      const gitTab = page.locator('[data-testid="tab-git"]');
      await gitTab.click();

      const reviewPRButton = page.locator('[data-testid="review-pr-button"]');
      if (await reviewPRButton.count() === 0) {
        test.skip();
      }

      await reviewPRButton.click();

      const prPanel = page.locator('[data-testid="pr-review-panel"]');
      await expect(prPanel).toBeVisible();

      // ACT
      await page.keyboard.press('Escape');

      // ASSERT
      await expect(prPanel).not.toBeVisible();
    });
  });
});
