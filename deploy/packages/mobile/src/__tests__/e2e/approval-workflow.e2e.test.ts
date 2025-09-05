/**
 * End-to-End tests for Mobile Approval Workflow
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Mobile Approval Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage, isMobile }) => {
    page = testPage;
    
    // Set mobile viewport if not already mobile
    if (!isMobile) {
      await page.setViewportSize({ width: 375, height: 667 });
    }
    
    // Navigate to the mobile app
    await page.goto('/mobile');
    
    // Wait for the PWA to load
    await page.waitForSelector('[data-testid="mobile-app"]');
    
    // Mock authentication for PWA
    await page.evaluate(() => {
      localStorage.setItem('mobile-auth-token', 'mock-mobile-token');
      localStorage.setItem('mobile-user-id', 'mobile-user-123');
      localStorage.setItem('push-notifications-enabled', 'true');
    });
    
    // Wait for app initialization
    await page.waitForSelector('[data-testid="approvals-tab"]');
  });

  test('should load approvals view and display pending approvals', async () => {
    // Navigate to approvals tab
    await page.tap('[data-testid="approvals-tab"]');
    
    // Verify approvals view loads
    await expect(page.locator('[data-testid="approvals-view"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Pending Approvals');
    
    // Verify approval cards are displayed
    const approvalCards = page.locator('[data-testid="approval-card"]');
    const cardCount = await approvalCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);
    
    // Check first approval card contents
    const firstCard = approvalCards.first();
    await expect(firstCard.locator('.approval-title')).toBeVisible();
    await expect(firstCard.locator('.approval-description')).toBeVisible();
    await expect(firstCard.locator('.priority-indicator')).toBeVisible();
    await expect(firstCard.locator('.time-remaining')).toBeVisible();
  });

  test('should approve request using touch buttons', async () => {
    await page.tap('[data-testid="approvals-tab"]');
    await page.waitForSelector('[data-testid="approval-card"]');
    
    // Get the first approval card
    const firstCard = page.locator('[data-testid="approval-card"]').first();
    const approvalTitle = await firstCard.locator('.approval-title').textContent();
    
    // Tap approve button
    await firstCard.locator('[data-testid="approve-button"]').tap();
    
    // Verify loading state
    await expect(firstCard.locator('[data-testid="approve-button"]')).toHaveAttribute('aria-busy', 'true');
    
    // Wait for approval to complete
    await page.waitForSelector('[data-testid="success-notification"]');
    
    // Verify success notification
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Approved successfully');
    
    // Verify card is removed from pending list
    await expect(page.locator('[data-testid="approval-card"]').filter({ hasText: approvalTitle! })).not.toBeVisible();
    
    // Verify approved count increases
    await expect(page.locator('[data-testid="approved-count"]')).toHaveText('1');
  });

  test('should reject request with confirmation', async () => {
    await page.tap('[data-testid="approvals-tab"]');
    await page.waitForSelector('[data-testid="approval-card"]');
    
    const firstCard = page.locator('[data-testid="approval-card"]').first();
    const approvalTitle = await firstCard.locator('.approval-title').textContent();
    
    // Tap reject button
    await firstCard.locator('[data-testid="reject-button"]').tap();
    
    // Verify confirmation modal appears
    await expect(page.locator('[data-testid="reject-confirmation-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="rejection-reason-input"]')).toBeVisible();
    
    // Provide rejection reason
    await page.fill('[data-testid="rejection-reason-input"]', 'Security concerns - requires additional review');
    
    // Confirm rejection
    await page.tap('[data-testid="confirm-reject-button"]');
    
    // Wait for rejection to complete
    await page.waitForSelector('[data-testid="success-notification"]');
    
    // Verify success notification
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Rejected successfully');
    
    // Verify card is removed from pending list
    await expect(page.locator('[data-testid="approval-card"]').filter({ hasText: approvalTitle! })).not.toBeVisible();
    
    // Verify rejected count increases
    await expect(page.locator('[data-testid="rejected-count"]')).toHaveText('1');
  });

  test('should approve request using swipe gesture', async () => {
    await page.tap('[data-testid="approvals-tab"]');
    await page.waitForSelector('[data-testid="approval-card"]');
    
    const firstCard = page.locator('[data-testid="approval-card"]').first();
    const approvalTitle = await firstCard.locator('.approval-title').textContent();
    
    // Get card bounding box for swipe
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).toBeTruthy();
    
    // Perform swipe right gesture (approve)
    await page.touchscreen.tap(cardBox!.x + 50, cardBox!.y + cardBox!.height / 2);
    await page.touchscreen.tap(cardBox!.x + cardBox!.width - 50, cardBox!.y + cardBox!.height / 2);
    
    // Verify swipe action overlay appears
    await expect(firstCard.locator('[data-testid="swipe-action-overlay"]')).toContainText('Release to Approve');
    
    // Complete the swipe by lifting touch
    await page.touchscreen.tap(cardBox!.x + cardBox!.width - 30, cardBox!.y + cardBox!.height / 2);
    
    // Wait for approval to complete
    await page.waitForSelector('[data-testid="success-notification"]');
    
    // Verify approval success
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Approved successfully');
    await expect(page.locator('[data-testid="approval-card"]').filter({ hasText: approvalTitle! })).not.toBeVisible();
  });

  test('should reject request using swipe gesture', async () => {
    await page.tap('[data-testid="approvals-tab"]');
    await page.waitForSelector('[data-testid="approval-card"]');
    
    const firstCard = page.locator('[data-testid="approval-card"]').first();
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).toBeTruthy();
    
    // Perform swipe left gesture (reject)
    await page.touchscreen.tap(cardBox!.x + cardBox!.width - 50, cardBox!.y + cardBox!.height / 2);
    await page.touchscreen.tap(cardBox!.x + 50, cardBox!.y + cardBox!.height / 2);
    
    // Verify swipe action overlay appears
    await expect(firstCard.locator('[data-testid="swipe-action-overlay"]')).toContainText('Release to Reject');
    
    // Complete the swipe
    await page.touchscreen.tap(cardBox!.x + 30, cardBox!.y + cardBox!.height / 2);
    
    // Should open rejection confirmation with reason
    await expect(page.locator('[data-testid="reject-confirmation-modal"]')).toBeVisible();
    
    // Cancel rejection to test swipe cancellation
    await page.tap('[data-testid="cancel-reject-button"]');
    
    // Verify modal closes and card remains
    await expect(page.locator('[data-testid="reject-confirmation-modal"]')).not.toBeVisible();
    await expect(firstCard).toBeVisible();
  });

  test('should view approval details modal', async () => {
    await page.tap('[data-testid="approvals-tab"]');
    await page.waitForSelector('[data-testid="approval-card"]');
    
    const firstCard = page.locator('[data-testid="approval-card"]').first();
    
    // Tap details button (eye icon)
    await firstCard.locator('[data-testid="view-details-button"]').tap();
    
    // Verify details modal opens
    await expect(page.locator('[data-testid="approval-details-modal"]')).toBeVisible();
    
    // Verify modal content
    await expect(page.locator('[data-testid="approval-details-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="approval-description-full"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-information"]')).toBeVisible();
    await expect(page.locator('[data-testid="risk-assessment"]')).toBeVisible();
    await expect(page.locator('[data-testid="test-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="affected-systems"]')).toBeVisible();
    
    // Verify action buttons in modal
    await expect(page.locator('[data-testid="modal-approve-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-reject-button"]')).toBeVisible();
    
    // Close modal
    await page.tap('[data-testid="close-details-modal"]');
    await expect(page.locator('[data-testid="approval-details-modal"]')).not.toBeVisible();
  });

  test('should filter approvals by priority', async () => {
    await page.tap('[data-testid="approvals-tab"]');
    await page.waitForSelector('[data-testid="approval-card"]');
    
    // Get initial count
    const allApprovals = await page.locator('[data-testid="approval-card"]').count();
    expect(allApprovals).toBeGreaterThan(0);
    
    // Open filter menu
    await page.tap('[data-testid="filter-menu-button"]');
    await expect(page.locator('[data-testid="filter-menu"]')).toBeVisible();
    
    // Filter by emergency priority
    await page.tap('[data-testid="filter-emergency"]');
    
    // Verify only emergency approvals are shown
    const emergencyApprovals = page.locator('[data-testid="approval-card"]');
    await expect(emergencyApprovals.first().locator('.priority-indicator')).toHaveClass(/bg-red-500/);
    
    // Filter by critical priority
    await page.tap('[data-testid="filter-critical"]');
    
    // Verify only critical approvals are shown
    const criticalApprovals = page.locator('[data-testid="approval-card"]');
    await expect(criticalApprovals.first().locator('.priority-indicator')).toHaveClass(/bg-orange-500/);
    
    // Clear filters
    await page.tap('[data-testid="clear-filters"]');
    
    // Verify all approvals are shown again
    const resetApprovals = await page.locator('[data-testid="approval-card"]').count();
    expect(resetApprovals).toBe(allApprovals);
    
    // Close filter menu
    await page.tap('[data-testid="close-filter-menu"]');
  });

  test('should handle time-sensitive approvals with countdown', async () => {
    await page.tap('[data-testid="approvals-tab"]');
    await page.waitForSelector('[data-testid="approval-card"]');
    
    // Find approval with time remaining
    const urgentCard = page.locator('[data-testid="approval-card"]').filter({ hasText: 'expires in' }).first();
    
    // Verify countdown is displayed
    await expect(urgentCard.locator('[data-testid="time-remaining"]')).toBeVisible();
    
    // Wait for countdown to update (simulate passage of time)
    await page.waitForTimeout(1000);
    
    // Verify countdown updates
    const timeRemainingElement = urgentCard.locator('[data-testid="time-remaining"]');
    const initialTime = await timeRemainingElement.textContent();
    
    // Wait another second
    await page.waitForTimeout(1000);
    const updatedTime = await timeRemainingElement.textContent();
    
    // Time should have decreased
    expect(updatedTime).not.toBe(initialTime);
    
    // Test expiration handling (mock expired approval)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('approval-expired', {
        detail: { approvalId: 'approval-123' }
      }));
    });
    
    // Verify expired notification
    await expect(page.locator('[data-testid="expired-notification"]')).toContainText('Approval has expired');
  });

  test('should handle emergency controls workflow', async () => {
    // Navigate to emergency controls (alerts tab)
    await page.tap('[data-testid="alerts-tab"]');
    
    // Verify emergency controls page loads
    await expect(page.locator('[data-testid="alerts-view"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Emergency Controls');
    
    // Verify emergency action buttons are visible
    await expect(page.locator('[data-testid="emergency-stop-all"]')).toBeVisible();
    await expect(page.locator('[data-testid="emergency-pause-evolution"]')).toBeVisible();
    await expect(page.locator('[data-testid="emergency-revert-changes"]')).toBeVisible();
    
    // Test emergency stop (with confirmation)
    await page.tap('[data-testid="emergency-stop-all"]');
    
    // Verify confirmation modal
    await expect(page.locator('[data-testid="emergency-confirmation-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirmation-message"]')).toContainText('This will stop all agent activities');
    
    // Verify authentication challenge
    await expect(page.locator('[data-testid="auth-challenge"]')).toBeVisible();
    await page.fill('[data-testid="auth-pin-input"]', '1234');
    
    // Confirm emergency action
    await page.tap('[data-testid="confirm-emergency-action"]');
    
    // Verify emergency action executed
    await expect(page.locator('[data-testid="emergency-executed-notification"]')).toContainText('Emergency stop executed');
    
    // Verify system status update
    await expect(page.locator('[data-testid="system-status"]')).toContainText('Emergency Mode');
  });

  test('should support offline functionality', async () => {
    await page.tap('[data-testid="approvals-tab"]');
    await page.waitForSelector('[data-testid="approval-card"]');
    
    // Store current approval count
    const onlineApprovalCount = await page.locator('[data-testid="approval-card"]').count();
    
    // Simulate going offline
    await page.context().setOffline(true);
    
    // Try to approve an item
    const firstCard = page.locator('[data-testid="approval-card"]').first();
    await firstCard.locator('[data-testid="approve-button"]').tap();
    
    // Verify offline notification
    await expect(page.locator('[data-testid="offline-notification"]')).toContainText('Action queued for when online');
    
    // Verify action is queued
    await expect(page.locator('[data-testid="queued-actions-count"]')).toContainText('1 action queued');
    
    // Go back online
    await page.context().setOffline(false);
    
    // Wait for sync to complete
    await page.waitForSelector('[data-testid="sync-complete-notification"]');
    
    // Verify queued actions were processed
    await expect(page.locator('[data-testid="sync-complete-notification"]')).toContainText('Synced 1 action');
    await expect(page.locator('[data-testid="queued-actions-count"]')).not.toBeVisible();
  });

  test('should receive and display push notifications', async () => {
    await page.tap('[data-testid="approvals-tab"]');
    
    // Mock push notification
    await page.evaluate(() => {
      // Simulate receiving push notification
      window.dispatchEvent(new CustomEvent('push-notification-received', {
        detail: {
          type: 'new-approval',
          title: 'New Emergency Approval Required',
          body: 'Critical database migration needs approval',
          data: {
            approvalId: 'approval-new-123',
            priority: 'emergency'
          }
        }
      }));
    });
    
    // Verify notification banner appears
    await expect(page.locator('[data-testid="notification-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-banner"]')).toContainText('New Emergency Approval Required');
    
    // Tap notification to view approval
    await page.tap('[data-testid="notification-banner"]');
    
    // Verify navigation to specific approval
    await expect(page.locator('[data-testid="approval-details-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="approval-details-title"]')).toContainText('database migration');
  });

  test('should handle biometric authentication for high-priority approvals', async () => {
    await page.tap('[data-testid="approvals-tab"]');
    await page.waitForSelector('[data-testid="approval-card"]');
    
    // Find emergency priority approval
    const emergencyCard = page.locator('[data-testid="approval-card"]').filter({ hasText: 'EMERGENCY' }).first();
    
    // Try to approve emergency request
    await emergencyCard.locator('[data-testid="approve-button"]').tap();
    
    // Verify biometric challenge appears
    await expect(page.locator('[data-testid="biometric-challenge"]')).toBeVisible();
    await expect(page.locator('[data-testid="biometric-prompt"]')).toContainText('Touch fingerprint sensor');
    
    // Mock successful biometric authentication
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('biometric-auth-success', {
        detail: { method: 'fingerprint' }
      }));
    });
    
    // Verify authentication success and approval processing
    await expect(page.locator('[data-testid="biometric-success"]')).toContainText('Authentication successful');
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Approved successfully');
  });

  test('should maintain state during PWA installation', async () => {
    await page.tap('[data-testid="approvals-tab"]');
    await page.waitForSelector('[data-testid="approval-card"]');
    
    // Get current state
    const approvalCount = await page.locator('[data-testid="approval-card"]').count();
    
    // Simulate PWA install prompt
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('beforeinstallprompt', {
        detail: { preventDefault: () => {}, prompt: () => Promise.resolve({ outcome: 'accepted' }) }
      }));
    });
    
    // Verify install banner appears
    await expect(page.locator('[data-testid="install-banner"]')).toBeVisible();
    
    // Install PWA
    await page.tap('[data-testid="install-pwa-button"]');
    
    // Verify install success
    await expect(page.locator('[data-testid="install-success"]')).toContainText('App installed successfully');
    
    // Verify state is preserved
    const postInstallCount = await page.locator('[data-testid="approval-card"]').count();
    expect(postInstallCount).toBe(approvalCount);
    
    // Verify PWA functionality
    await expect(page.locator('[data-testid="pwa-status"]')).toContainText('Running as installed app');
  });
});

// Test configuration for different devices
test.describe('Mobile Device Compatibility', () => {
  ['iPhone 12', 'Pixel 5', 'iPad'].forEach(device => {
    test(`should work correctly on ${device}`, async ({ browser }) => {
      const context = await browser.newContext({
        ...require('@playwright/test').devices[device],
      });
      
      const page = await context.newPage();
      await page.goto('/mobile');
      
      // Basic functionality test for each device
      await page.waitForSelector('[data-testid="mobile-app"]');
      await page.tap('[data-testid="approvals-tab"]');
      await expect(page.locator('[data-testid="approvals-view"]')).toBeVisible();
      
      await context.close();
    });
  });
});