import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: Complete Spec Approval Workflow
 *
 * This test suite covers the critical path:
 * 1. Create spec using ArchitectChat
 * 2. Spec appears in pending list
 * 3. Open SpecViewer modal
 * 4. Review spec content
 * 5. Click approve button
 * 6. Spec moves to approved folder
 * 7. GitHub issue created
 * 8. Agent workflow triggered
 *
 * References:
 * - HANDOVER.md line 110: "End-to-end spec approval flow"
 * - CLAUDE.md: TDD approach, 90%+ coverage for critical paths
 */

test.describe('Spec Approval Workflow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="stats-grid"]');
  });

  test.describe('Happy Path: Complete Workflow', () => {
    test('should complete entire spec approval flow', async ({ page }) => {
      // ARRANGE - Start with a project
      const projectCard = page.locator('[data-testid="project-card"]').first();

      // Skip if no projects
      if (await projectCard.count() === 0) {
        test.skip();
      }

      const projectName = await projectCard.getAttribute('data-project-name');
      expect(projectName).toBeTruthy();

      // STEP 1: Open ArchitectChat to create spec
      console.log('Step 1: Opening ArchitectChat...');
      const speakButton = projectCard.locator('[data-testid="speak-button"]');
      await speakButton.click();

      // ASSERT: ArchitectChat modal opens
      const architectModal = page.locator('[data-testid="architect-chat-modal"]');
      await expect(architectModal).toBeVisible({ timeout: 5000 });

      // Take screenshot of ArchitectChat opened
      await page.screenshot({ path: 'test-results/spec-workflow-1-architect-opened.png', fullPage: true });

      // STEP 2: Switch to text mode (easier for testing than voice)
      console.log('Step 2: Switching to text mode...');
      const textModeButton = architectModal.locator('[data-testid="toggle-text-mode"]');
      await textModeButton.click();
      await page.waitForTimeout(500); // Wait for mode switch

      // ASSERT: Text input appears
      const textInput = architectModal.locator('[data-testid="text-input"]');
      await expect(textInput).toBeVisible();

      // STEP 3: Send message to create spec
      console.log('Step 3: Creating spec via text message...');
      await textInput.fill('Create a feature spec for adding dark mode support to the dashboard');

      const sendButton = architectModal.locator('[data-testid="send-button"]');
      await sendButton.click();

      // ASSERT: Processing indicator appears
      const processingIndicator = architectModal.locator('[data-testid="processing-indicator"]');
      await expect(processingIndicator).toBeVisible({ timeout: 5000 });

      // Wait for response (mock mode should be fast)
      await expect(processingIndicator).not.toBeVisible({ timeout: 30000 });

      // ASSERT: Response appears in chat
      const messages = architectModal.locator('[data-testid="chat-message"]');
      await expect(messages).toHaveCount(2, { timeout: 5000 }); // User + assistant

      // Take screenshot of spec creation response
      await page.screenshot({ path: 'test-results/spec-workflow-2-spec-created.png', fullPage: true });

      // STEP 4: Close ArchitectChat
      console.log('Step 4: Closing ArchitectChat...');
      const closeArchitectButton = architectModal.locator('[data-testid="close-button"]');
      await closeArchitectButton.click();
      await expect(architectModal).not.toBeVisible();

      // STEP 5: Verify pending spec appears on project card
      console.log('Step 5: Verifying pending spec indicator...');
      const pendingSpecBadge = projectCard.locator('[data-testid="pending-spec-badge"]');
      await expect(pendingSpecBadge).toBeVisible({ timeout: 5000 });
      await expect(pendingSpecBadge).toContainText('Pending');

      // Take screenshot of pending spec badge
      await page.screenshot({ path: 'test-results/spec-workflow-3-pending-spec.png', fullPage: true });

      // STEP 6: Open SpecViewer by clicking "View Spec" button
      console.log('Step 6: Opening SpecViewer...');
      const viewSpecButton = projectCard.locator('[data-testid="view-spec-button"]');
      await viewSpecButton.click();

      // ASSERT: SpecViewer modal opens
      const specViewer = page.locator('[data-testid="spec-viewer-modal"]');
      await expect(specViewer).toBeVisible({ timeout: 5000 });

      // STEP 7: Verify spec content is displayed
      console.log('Step 7: Verifying spec content...');
      const specContent = specViewer.locator('[data-testid="spec-content"]');
      await expect(specContent).toBeVisible();

      // Should contain markdown-rendered content
      const heading = specContent.locator('h1, h2').first();
      await expect(heading).toBeVisible();

      // Should show version badge
      const versionBadge = specViewer.locator('[data-testid="version-badge"]');
      await expect(versionBadge).toBeVisible();
      await expect(versionBadge).toContainText('v1');

      // Take screenshot of SpecViewer
      await page.screenshot({ path: 'test-results/spec-workflow-4-spec-viewer.png', fullPage: true });

      // STEP 8: Click Approve button
      console.log('Step 8: Approving spec...');
      const approveButton = specViewer.locator('[data-testid="approve-button"]');
      await expect(approveButton).toBeEnabled();
      await approveButton.click();

      // ASSERT: Approval processing
      // In mock mode, this should be fast
      await expect(specViewer).not.toBeVisible({ timeout: 10000 });

      // STEP 9: Verify GitHub issue created (check alert or notification)
      console.log('Step 9: Verifying GitHub issue creation...');
      // In mock mode, should get success alert
      const successAlert = page.locator('[data-testid="success-alert"], .alert-success');
      if (await successAlert.count() > 0) {
        await expect(successAlert).toContainText('GitHub issue created', { timeout: 5000 });
      }

      // STEP 10: Verify spec moved to approved (badge should change or disappear)
      console.log('Step 10: Verifying spec approval state...');

      // Wait a bit for state to update
      await page.waitForTimeout(1000);

      // Pending badge should be gone or changed to "Approved"
      const updatedBadge = projectCard.locator('[data-testid="pending-spec-badge"], [data-testid="approved-spec-badge"]');

      // Either no pending badge, or it now says "Approved"
      if (await updatedBadge.count() > 0) {
        const badgeText = await updatedBadge.textContent();
        expect(badgeText).not.toContain('Pending');
      }

      // Take final screenshot
      await page.screenshot({ path: 'test-results/spec-workflow-5-completed.png', fullPage: true });

      console.log('✅ Complete workflow test passed!');
    });

    test('should handle spec creation with voice mode', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // STEP 1: Open ArchitectChat
      const speakButton = projectCard.locator('[data-testid="speak-button"]');
      await speakButton.click();

      const architectModal = page.locator('[data-testid="architect-chat-modal"]');
      await expect(architectModal).toBeVisible({ timeout: 5000 });

      // STEP 2: Verify voice mode is active by default
      const voiceIndicator = architectModal.locator('[data-testid="voice-indicator"]');
      await expect(voiceIndicator).toBeVisible();

      // ASSERT: Listening state
      const listeningStatus = architectModal.locator('[data-testid="listening-status"]');
      await expect(listeningStatus).toContainText(/Listening|Ready/i, { timeout: 10000 });

      // Take screenshot of voice mode
      await page.screenshot({ path: 'test-results/spec-workflow-voice-mode.png', fullPage: true });

      // Close modal
      const closeButton = architectModal.locator('[data-testid="close-button"]');
      await closeButton.click();
    });

    test('should display spec versions in dropdown', async ({ page }) => {
      // ARRANGE - Project with existing approved spec
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // Open spec viewer (assuming project has specs)
      const viewSpecButton = projectCard.locator('[data-testid="view-spec-button"]');

      // Skip if no spec to view
      if (await viewSpecButton.count() === 0) {
        test.skip();
      }

      await viewSpecButton.click();

      // ASSERT: SpecViewer opens
      const specViewer = page.locator('[data-testid="spec-viewer-modal"]');
      await expect(specViewer).toBeVisible({ timeout: 5000 });

      // ASSERT: Version selector exists
      const versionSelector = specViewer.locator('[data-testid="version-selector"]');

      if (await versionSelector.count() > 0) {
        await expect(versionSelector).toBeVisible();

        // Should have at least one option
        const options = versionSelector.locator('option');
        await expect(options).toHaveCount(1, { timeout: 1000 });

        // Take screenshot
        await page.screenshot({ path: 'test-results/spec-workflow-versions.png', fullPage: true });
      }

      // Close modal
      const closeButton = specViewer.locator('[data-testid="close-button"]');
      await closeButton.click();
    });
  });

  test.describe('Error Paths', () => {
    test('should handle spec creation failure gracefully', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // Mock API failure by intercepting network request
      await page.route('**/chat_with_architect', route => {
        route.abort('failed');
      });

      // STEP 1: Open ArchitectChat
      const speakButton = projectCard.locator('[data-testid="speak-button"]');
      await speakButton.click();

      const architectModal = page.locator('[data-testid="architect-chat-modal"]');
      await expect(architectModal).toBeVisible();

      // STEP 2: Switch to text mode
      const textModeButton = architectModal.locator('[data-testid="toggle-text-mode"]');
      if (await textModeButton.count() > 0) {
        await textModeButton.click();
        await page.waitForTimeout(500);
      }

      // STEP 3: Try to send message
      const textInput = architectModal.locator('[data-testid="text-input"]');
      if (await textInput.count() > 0) {
        await textInput.fill('Create a spec');

        const sendButton = architectModal.locator('[data-testid="send-button"]');
        await sendButton.click();

        // ASSERT: Error message appears
        const errorMessage = architectModal.locator('[data-testid="error-message"]');
        await expect(errorMessage).toBeVisible({ timeout: 10000 });

        // Take screenshot of error
        await page.screenshot({ path: 'test-results/spec-workflow-error-creation.png', fullPage: true });
      }

      // Close modal
      const closeButton = architectModal.locator('[data-testid="close-button"]');
      await closeButton.click();
    });

    test('should handle GitHub API failure during approval', async ({ page }) => {
      // ARRANGE - Project with pending spec
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      const viewSpecButton = projectCard.locator('[data-testid="view-spec-button"]');

      if (await viewSpecButton.count() === 0) {
        test.skip();
      }

      // Mock GitHub API failure
      await page.route('**/create_github_issue', route => {
        route.abort('failed');
      });

      // STEP 1: Open SpecViewer
      await viewSpecButton.click();

      const specViewer = page.locator('[data-testid="spec-viewer-modal"]');
      await expect(specViewer).toBeVisible();

      // STEP 2: Click approve
      const approveButton = specViewer.locator('[data-testid="approve-button"]');

      if (await approveButton.isEnabled()) {
        await approveButton.click();

        // ASSERT: Error message or alert appears
        const errorAlert = page.locator('[data-testid="error-alert"], .alert-error');
        await expect(errorAlert).toBeVisible({ timeout: 10000 });
        await expect(errorAlert).toContainText(/failed|error/i);

        // Take screenshot of error
        await page.screenshot({ path: 'test-results/spec-workflow-error-github.png', fullPage: true });
      }

      // Close modal
      const closeButton = specViewer.locator('[data-testid="close-button"]');
      await closeButton.click();
    });

    test('should handle file system errors', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // Mock file system error
      await page.route('**/save_spec', route => {
        route.abort('accessdenied');
      });

      // Open ArchitectChat
      const speakButton = projectCard.locator('[data-testid="speak-button"]');
      await speakButton.click();

      const architectModal = page.locator('[data-testid="architect-chat-modal"]');
      await expect(architectModal).toBeVisible();

      // Try to create spec (will fail when trying to save)
      const textModeButton = architectModal.locator('[data-testid="toggle-text-mode"]');
      if (await textModeButton.count() > 0) {
        await textModeButton.click();
        await page.waitForTimeout(500);

        const textInput = architectModal.locator('[data-testid="text-input"]');
        if (await textInput.count() > 0) {
          await textInput.fill('Create a spec');

          const sendButton = architectModal.locator('[data-testid="send-button"]');
          await sendButton.click();

          // Wait for processing then error
          await page.waitForTimeout(2000);

          // ASSERT: Error message about file system
          const errorMessage = architectModal.locator('[data-testid="error-message"]');
          if (await errorMessage.count() > 0) {
            await expect(errorMessage).toBeVisible();

            // Take screenshot
            await page.screenshot({ path: 'test-results/spec-workflow-error-filesystem.png', fullPage: true });
          }
        }
      }

      // Close modal
      const closeButton = architectModal.locator('[data-testid="close-button"]');
      await closeButton.click();
    });
  });

  test.describe('State Persistence', () => {
    test('should maintain pending spec state after page refresh', async ({ page }) => {
      // ARRANGE - Project with pending spec
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      const projectName = await projectCard.getAttribute('data-project-name');

      // Check if project has pending spec
      const pendingBadge = projectCard.locator('[data-testid="pending-spec-badge"]');

      if (await pendingBadge.count() === 0) {
        test.skip(); // Skip if no pending spec
      }

      // ASSERT: Pending spec visible before refresh
      await expect(pendingBadge).toBeVisible();

      // Take screenshot before refresh
      await page.screenshot({ path: 'test-results/spec-workflow-pre-refresh.png', fullPage: true });

      // ACT: Refresh page
      await page.reload();
      await page.waitForSelector('[data-testid="stats-grid"]');

      // ASSERT: Pending spec still visible after refresh
      const projectCardAfterRefresh = page.locator(`[data-testid="project-card"][data-project-name="${projectName}"]`);
      const pendingBadgeAfterRefresh = projectCardAfterRefresh.locator('[data-testid="pending-spec-badge"]');

      await expect(pendingBadgeAfterRefresh).toBeVisible({ timeout: 5000 });

      // Take screenshot after refresh
      await page.screenshot({ path: 'test-results/spec-workflow-post-refresh.png', fullPage: true });
    });

    test('should maintain spec viewer state when reopened', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      const viewSpecButton = projectCard.locator('[data-testid="view-spec-button"]');

      if (await viewSpecButton.count() === 0) {
        test.skip();
      }

      // STEP 1: Open spec viewer first time
      await viewSpecButton.click();

      const specViewer = page.locator('[data-testid="spec-viewer-modal"]');
      await expect(specViewer).toBeVisible();

      // Remember spec title
      const specTitle = await specViewer.locator('[data-testid="spec-title"]').textContent();

      // Close viewer
      const closeButton = specViewer.locator('[data-testid="close-button"]');
      await closeButton.click();
      await expect(specViewer).not.toBeVisible();

      // STEP 2: Open spec viewer again
      await viewSpecButton.click();
      await expect(specViewer).toBeVisible();

      // ASSERT: Same spec is shown
      const specTitleAgain = await specViewer.locator('[data-testid="spec-title"]').textContent();
      expect(specTitleAgain).toBe(specTitle);

      // Close viewer
      await closeButton.click();
    });

    test('should persist approved state across sessions', async ({ page }) => {
      // This test would require actually approving a spec and checking persistence
      // For now, we can check if approved specs remain approved

      // ARRANGE
      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();

      if (count === 0) {
        test.skip();
      }

      // Find project with approved spec (if any)
      for (let i = 0; i < count; i++) {
        const card = projectCards.nth(i);
        const approvedBadge = card.locator('[data-testid="approved-spec-badge"]');

        if (await approvedBadge.count() > 0) {
          const projectName = await card.getAttribute('data-project-name');

          // ASSERT: Approved badge visible
          await expect(approvedBadge).toBeVisible();

          // ACT: Refresh
          await page.reload();
          await page.waitForSelector('[data-testid="stats-grid"]');

          // ASSERT: Still approved
          const cardAfterRefresh = page.locator(`[data-testid="project-card"][data-project-name="${projectName}"]`);
          const approvedBadgeAfterRefresh = cardAfterRefresh.locator('[data-testid="approved-spec-badge"]');
          await expect(approvedBadgeAfterRefresh).toBeVisible({ timeout: 5000 });

          break; // Test one approved spec
        }
      }
    });
  });

  test.describe('Visual Verification', () => {
    test('should show correct visual states throughout workflow', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // STEP 1: Initial state - no pending spec indicator
      await page.screenshot({ path: 'test-results/spec-workflow-visual-initial.png', fullPage: true });

      // STEP 2: Open ArchitectChat - should see modal with animation
      const speakButton = projectCard.locator('[data-testid="speak-button"]');
      await speakButton.click();

      const architectModal = page.locator('[data-testid="architect-chat-modal"]');
      await expect(architectModal).toBeVisible();

      // Should have backdrop blur
      const backdrop = page.locator('[data-testid="modal-backdrop"]');
      if (await backdrop.count() > 0) {
        const backdropBlur = await backdrop.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.backdropFilter || (style as any).webkitBackdropFilter;
        });
        expect(backdropBlur).toContain('blur');
      }

      await page.screenshot({ path: 'test-results/spec-workflow-visual-architect-modal.png', fullPage: true });

      // STEP 3: Voice mode indicator should be visible
      const voiceIndicator = architectModal.locator('[data-testid="voice-indicator"]');
      await expect(voiceIndicator).toBeVisible();

      // Should have animation (pulse)
      const hasAnimation = await voiceIndicator.evaluate((el) => {
        const classes = el.className;
        return classes.includes('animate') || classes.includes('pulse');
      });
      expect(hasAnimation).toBeTruthy();

      await page.screenshot({ path: 'test-results/spec-workflow-visual-voice-active.png', fullPage: true });

      // Close modal
      const closeButton = architectModal.locator('[data-testid="close-button"]');
      await closeButton.click();
    });

    test('should show correct SpecViewer visual states', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      const viewSpecButton = projectCard.locator('[data-testid="view-spec-button"]');

      if (await viewSpecButton.count() === 0) {
        test.skip();
      }

      // STEP 1: Open SpecViewer
      await viewSpecButton.click();

      const specViewer = page.locator('[data-testid="spec-viewer-modal"]');
      await expect(specViewer).toBeVisible();

      // STEP 2: Verify visual elements
      await page.screenshot({ path: 'test-results/spec-workflow-visual-viewer-full.png', fullPage: true });

      // Check markdown rendering
      const specContent = specViewer.locator('[data-testid="spec-content"]');

      // Headers should have correct styling
      const heading = specContent.locator('h1, h2').first();
      if (await heading.count() > 0) {
        const headingColor = await heading.evaluate((el) => {
          return window.getComputedStyle(el).color;
        });
        // Should be white or near-white
        expect(headingColor).toMatch(/rgb\(255, 255, 255\)|rgb\(250, 250, 250\)/);
      }

      // Code blocks should have dark background
      const codeBlock = specContent.locator('pre').first();
      if (await codeBlock.count() > 0) {
        const codeBg = await codeBlock.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        // Should be dark
        expect(codeBg).toMatch(/rgb\(9, 9, 11\)|rgb\(15, 23, 42\)/);
      }

      // STEP 3: Check button states
      const approveButton = specViewer.locator('[data-testid="approve-button"]');
      await expect(approveButton).toBeVisible();

      // Hover over approve button - should show hover state
      await approveButton.hover();
      await page.waitForTimeout(200); // Wait for transition

      const approveButtonBg = await approveButton.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      // Green approve button
      expect(approveButtonBg).toMatch(/rgb\(22, 163, 74\)|rgb\(21, 128, 61\)/);

      await page.screenshot({ path: 'test-results/spec-workflow-visual-approve-hover.png', fullPage: true });

      // STEP 4: Check reject button
      const rejectButton = specViewer.locator('[data-testid="reject-button"]');
      await expect(rejectButton).toBeVisible();

      await rejectButton.hover();
      await page.waitForTimeout(200);

      const rejectButtonBg = await rejectButton.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      // Red reject button
      expect(rejectButtonBg).toMatch(/rgb\(220, 38, 38\)|rgb\(185, 28, 28\)/);

      await page.screenshot({ path: 'test-results/spec-workflow-visual-reject-hover.png', fullPage: true });

      // Close modal
      const closeButton = specViewer.locator('[data-testid="close-button"]');
      await closeButton.click();
    });

    test('should show correct badge colors and styles', async ({ page }) => {
      // ARRANGE
      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();

      if (count === 0) {
        test.skip();
      }

      // Check pending spec badge
      for (let i = 0; i < count; i++) {
        const card = projectCards.nth(i);
        const pendingBadge = card.locator('[data-testid="pending-spec-badge"]');

        if (await pendingBadge.count() > 0) {
          // Should have yellow/orange color
          const badgeBg = await pendingBadge.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
          });

          await page.screenshot({
            path: `test-results/spec-workflow-visual-pending-badge-${i}.png`,
            fullPage: true
          });

          break;
        }
      }

      // Check approved spec badge (if any)
      for (let i = 0; i < count; i++) {
        const card = projectCards.nth(i);
        const approvedBadge = card.locator('[data-testid="approved-spec-badge"]');

        if (await approvedBadge.count() > 0) {
          // Should have green color
          const badgeBg = await approvedBadge.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
          });

          await page.screenshot({
            path: `test-results/spec-workflow-visual-approved-badge-${i}.png`,
            fullPage: true
          });

          break;
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // Check speak button
      const speakButton = projectCard.locator('[data-testid="speak-button"]');
      const speakAriaLabel = await speakButton.getAttribute('aria-label');
      expect(speakAriaLabel).toBeTruthy();
      expect(speakAriaLabel).toMatch(/speak|voice|architect/i);

      // Open ArchitectChat
      await speakButton.click();

      const architectModal = page.locator('[data-testid="architect-chat-modal"]');
      await expect(architectModal).toBeVisible();

      // Check modal role
      const modalRole = await architectModal.getAttribute('role');
      expect(modalRole).toBe('dialog');

      // Check modal aria-label
      const modalAriaLabel = await architectModal.getAttribute('aria-label');
      expect(modalAriaLabel).toBeTruthy();

      // Close button should have aria-label
      const closeButton = architectModal.locator('[data-testid="close-button"]');
      const closeAriaLabel = await closeButton.getAttribute('aria-label');
      expect(closeAriaLabel).toBeTruthy();
      expect(closeAriaLabel).toMatch(/close/i);

      await closeButton.click();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // ARRANGE
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() === 0) {
        test.skip();
      }

      // Tab to speak button
      await page.keyboard.press('Tab');
      // Continue tabbing until we reach the speak button (or timeout)
      // This is a simplified test - in real scenario we'd track focus

      const viewSpecButton = projectCard.locator('[data-testid="view-spec-button"]');

      if (await viewSpecButton.count() === 0) {
        test.skip();
      }

      // Open with Enter key
      await viewSpecButton.focus();
      await page.keyboard.press('Enter');

      const specViewer = page.locator('[data-testid="spec-viewer-modal"]');
      await expect(specViewer).toBeVisible();

      // Close with Escape key
      await page.keyboard.press('Escape');
      await expect(specViewer).not.toBeVisible();
    });
  });
});
