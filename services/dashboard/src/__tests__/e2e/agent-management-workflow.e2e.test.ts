/**
 * End-to-End tests for Agent Management Workflow
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Agent Management Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Navigate to the dashboard
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('[data-testid="dashboard-header"]');
    
    // Ensure we're authenticated (mock authentication for E2E tests)
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-test-token');
      localStorage.setItem('user-id', 'test-user-123');
    });
  });

  test('should display agent overview and navigate to management page', async () => {
    // Verify dashboard loads with agent information
    await expect(page.locator('[data-testid="active-agents-stat"]')).toContainText('Active Agents');
    await expect(page.locator('[data-testid="evolution-events-stat"]')).toContainText('Evolution Events');
    
    // Click on "Agent Management" navigation
    await page.click('[data-testid="nav-agent-management"]');
    
    // Verify we're on the agent management page
    await expect(page).toHaveURL(/.*\/agents/);
    await expect(page.locator('h1')).toContainText('Agent Management');
  });

  test('should display list of active agents with status cards', async () => {
    await page.goto('/agents');
    
    // Wait for agents to load
    await page.waitForSelector('[data-testid="agent-status-card"]');
    
    // Verify agent cards are displayed
    const agentCards = page.locator('[data-testid="agent-status-card"]');
    await expect(agentCards).toHaveCountGreaterThan(0);
    
    // Check first agent card contents
    const firstCard = agentCards.first();
    await expect(firstCard.locator('.agent-name')).toBeVisible();
    await expect(firstCard.locator('.agent-status')).toBeVisible();
    await expect(firstCard.locator('.success-rate')).toBeVisible();
    await expect(firstCard.locator('.tasks-completed')).toBeVisible();
  });

  test('should open agent details modal when clicking View Details', async () => {
    await page.goto('/agents');
    await page.waitForSelector('[data-testid="agent-status-card"]');
    
    // Click "View Details" on first agent
    const firstCard = page.locator('[data-testid="agent-status-card"]').first();
    await firstCard.locator('button:has-text("View Details")').click();
    
    // Verify modal opens
    await expect(page.locator('[data-testid="agent-details-modal"]')).toBeVisible();
    
    // Verify modal contents
    await expect(page.locator('[data-testid="agent-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-generation"]')).toBeVisible();
    await expect(page.locator('[data-testid="genetic-markers"]')).toBeVisible();
    await expect(page.locator('[data-testid="performance-history"]')).toBeVisible();
    
    // Close modal
    await page.click('[data-testid="close-modal"]');
    await expect(page.locator('[data-testid="agent-details-modal"]')).not.toBeVisible();
  });

  test('should spawn new agent through workflow', async () => {
    await page.goto('/agents');
    
    // Click "Spawn New Agent" button
    await page.click('[data-testid="spawn-agent-button"]');
    
    // Verify spawn agent modal opens
    await expect(page.locator('[data-testid="spawn-agent-modal"]')).toBeVisible();
    
    // Fill out spawn form
    await page.fill('[data-testid="agent-name-input"]', 'TestAgent-E2E');
    await page.selectOption('[data-testid="agent-specialization-select"]', 'Development');
    await page.selectOption('[data-testid="base-dna-select"]', 'analytical');
    
    // Select capabilities
    await page.check('[data-testid="capability-typescript"]');
    await page.check('[data-testid="capability-testing"]');
    
    // Submit form
    await page.click('[data-testid="spawn-agent-submit"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Agent spawned successfully');
    
    // Verify modal closes
    await expect(page.locator('[data-testid="spawn-agent-modal"]')).not.toBeVisible();
    
    // Verify new agent appears in list
    await expect(page.locator('[data-testid="agent-status-card"]')).toContainText('TestAgent-E2E');
  });

  test('should filter agents by status', async () => {
    await page.goto('/agents');
    await page.waitForSelector('[data-testid="agent-status-card"]');
    
    // Get initial agent count
    const allAgents = await page.locator('[data-testid="agent-status-card"]').count();
    expect(allAgents).toBeGreaterThan(0);
    
    // Filter by active status
    await page.click('[data-testid="status-filter-active"]');
    
    // Verify only active agents are shown
    const activeAgents = page.locator('[data-testid="agent-status-card"]');
    await expect(activeAgents.first().locator('.status-badge')).toContainText('Active');
    
    // Filter by inactive status
    await page.click('[data-testid="status-filter-inactive"]');
    
    // Verify filtering works
    const inactiveAgents = await page.locator('[data-testid="agent-status-card"]').count();
    expect(inactiveAgents).toBeLessThanOrEqual(allAgents);
    
    // Reset filter
    await page.click('[data-testid="status-filter-all"]');
    
    // Verify all agents are shown again
    const resetAgents = await page.locator('[data-testid="agent-status-card"]').count();
    expect(resetAgents).toBe(allAgents);
  });

  test('should search agents by name', async () => {
    await page.goto('/agents');
    await page.waitForSelector('[data-testid="agent-status-card"]');
    
    // Get first agent name for search
    const firstAgentName = await page.locator('[data-testid="agent-status-card"]').first().locator('.agent-name').textContent();
    expect(firstAgentName).toBeTruthy();
    
    // Search for agent
    await page.fill('[data-testid="agent-search-input"]', firstAgentName!);
    
    // Verify search results
    const searchResults = page.locator('[data-testid="agent-status-card"]');
    await expect(searchResults).toHaveCount(1);
    await expect(searchResults.first().locator('.agent-name')).toContainText(firstAgentName!);
    
    // Clear search
    await page.fill('[data-testid="agent-search-input"]', '');
    
    // Verify all agents are shown again
    await expect(page.locator('[data-testid="agent-status-card"]')).toHaveCountGreaterThan(1);
  });

  test('should archive agent through management actions', async () => {
    await page.goto('/agents');
    await page.waitForSelector('[data-testid="agent-status-card"]');
    
    // Click manage on first agent
    const firstCard = page.locator('[data-testid="agent-status-card"]').first();
    const agentName = await firstCard.locator('.agent-name').textContent();
    await firstCard.locator('button:has-text("Manage")').click();
    
    // Verify management modal opens
    await expect(page.locator('[data-testid="agent-management-modal"]')).toBeVisible();
    
    // Click archive button
    await page.click('[data-testid="archive-agent-button"]');
    
    // Confirm in confirmation dialog
    await expect(page.locator('[data-testid="confirmation-dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-archive"]');
    
    // Verify success notification
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Agent archived');
    
    // Verify agent status changed to archived
    const archivedCard = page.locator('[data-testid="agent-status-card"]').filter({ hasText: agentName! });
    await expect(archivedCard.locator('.status-badge')).toContainText('Archived');
  });

  test('should display real-time updates for agent performance', async () => {
    await page.goto('/agents');
    await page.waitForSelector('[data-testid="agent-status-card"]');
    
    // Open agent details
    await page.locator('[data-testid="agent-status-card"]').first().locator('button:has-text("View Details")').click();
    await expect(page.locator('[data-testid="agent-details-modal"]')).toBeVisible();
    
    // Verify real-time metrics are displayed
    await expect(page.locator('[data-testid="current-task-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="real-time-metrics"]')).toBeVisible();
    
    // Mock WebSocket update (simulate performance change)
    await page.evaluate(() => {
      // Simulate WebSocket message for performance update
      window.dispatchEvent(new CustomEvent('agent-performance-update', {
        detail: {
          agentId: 'agent-123',
          metrics: {
            successRate: 0.95,
            currentTask: {
              title: 'Updated Task',
              progress: 75
            }
          }
        }
      }));
    });
    
    // Verify UI updates with new data
    await expect(page.locator('[data-testid="success-rate-display"]')).toContainText('95%');
    await expect(page.locator('[data-testid="task-progress-bar"]')).toHaveAttribute('style', /width:\s*75%/);
  });

  test('should handle evolution trigger workflow', async () => {
    await page.goto('/agents');
    await page.waitForSelector('[data-testid="agent-status-card"]');
    
    // Select an agent with high performance for evolution
    const highPerformanceAgent = page.locator('[data-testid="agent-status-card"]').filter({ hasText: 'Success Rate: 9' }).first();
    await highPerformanceAgent.locator('button:has-text("Manage")').click();
    
    // Verify management modal
    await expect(page.locator('[data-testid="agent-management-modal"]')).toBeVisible();
    
    // Click "Trigger Evolution" button (should be enabled for high-performance agents)
    await expect(page.locator('[data-testid="trigger-evolution-button"]')).toBeEnabled();
    await page.click('[data-testid="trigger-evolution-button"]');
    
    // Verify evolution configuration modal
    await expect(page.locator('[data-testid="evolution-config-modal"]')).toBeVisible();
    
    // Configure evolution parameters
    await page.selectOption('[data-testid="evolution-strategy-select"]', 'optimization');
    await page.selectOption('[data-testid="mutation-rate-select"]', 'moderate');
    
    // Confirm evolution
    await page.click('[data-testid="confirm-evolution"]');
    
    // Verify evolution started notification
    await expect(page.locator('[data-testid="evolution-notification"]')).toContainText('Evolution process started');
    
    // Wait for evolution to complete (simulated)
    await page.waitForTimeout(2000);
    
    // Verify evolution completed notification
    await expect(page.locator('[data-testid="evolution-complete-notification"]')).toContainText('Evolution completed');
    
    // Verify new generation agent appears
    await expect(page.locator('[data-testid="agent-status-card"]')).toContainText('Gen 2');
  });

  test('should navigate through agent lineage tree', async () => {
    await page.goto('/agents');
    await page.waitForSelector('[data-testid="agent-status-card"]');
    
    // Navigate to Evolution Monitor
    await page.click('[data-testid="nav-evolution-monitor"]');
    await expect(page).toHaveURL(/.*\/evolution/);
    
    // Verify evolution tree is displayed
    await expect(page.locator('[data-testid="evolution-lineage-tree"]')).toBeVisible();
    
    // Click on a parent node
    await page.click('[data-testid="dna-node-gen-1"]');
    
    // Verify lineage details panel opens
    await expect(page.locator('[data-testid="lineage-details-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="lineage-generation"]')).toContainText('Generation 1');
    
    // Expand offspring
    await page.click('[data-testid="expand-offspring"]');
    
    // Verify child nodes are visible
    await expect(page.locator('[data-testid="dna-node-gen-2"]')).toBeVisible();
    
    // Click on child node
    await page.click('[data-testid="dna-node-gen-2"]');
    
    // Verify parent-child relationship is highlighted
    await expect(page.locator('[data-testid="relationship-line"]')).toHaveClass(/highlighted/);
  });

  test('should handle error states gracefully', async () => {
    await page.goto('/agents');
    
    // Mock network error for agent loading
    await page.route('**/api/agents', route => {
      route.abort('internetdisconnected');
    });
    
    // Refresh page to trigger error
    await page.reload();
    
    // Verify error state is displayed
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load agents');
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Restore network and retry
    await page.unroute('**/api/agents');
    await page.click('[data-testid="retry-button"]');
    
    // Verify agents load successfully after retry
    await expect(page.locator('[data-testid="agent-status-card"]')).toBeVisible();
  });

  test('should maintain responsive design on mobile viewport', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/agents');
    await page.waitForSelector('[data-testid="agent-status-card"]');
    
    // Verify mobile navigation menu
    await expect(page.locator('[data-testid="mobile-nav-toggle"]')).toBeVisible();
    await page.click('[data-testid="mobile-nav-toggle"]');
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
    
    // Verify agent cards stack properly on mobile
    const agentCards = page.locator('[data-testid="agent-status-card"]');
    const firstCard = agentCards.first();
    const secondCard = agentCards.nth(1);
    
    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    
    // Verify cards are stacked vertically (second card is below first)
    expect(secondCardBox!.y).toBeGreaterThan(firstCardBox!.y + firstCardBox!.height);
    
    // Verify touch interactions work
    await firstCard.tap();
    await expect(page.locator('[data-testid="agent-details-modal"]')).toBeVisible();
  });

  test('should support keyboard navigation', async () => {
    await page.goto('/agents');
    await page.waitForSelector('[data-testid="agent-status-card"]');
    
    // Focus first agent card
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Skip to first interactive element
    
    // Navigate using arrow keys
    await page.keyboard.press('ArrowDown');
    
    // Verify focus moves to next agent card
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('data-testid', 'agent-status-card');
    
    // Open agent details with Enter
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="agent-details-modal"]')).toBeVisible();
    
    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="agent-details-modal"]')).not.toBeVisible();
  });
});