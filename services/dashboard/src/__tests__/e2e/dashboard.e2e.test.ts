/**
 * Dashboard E2E Tests
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { test, expect } from '@playwright/test';

test.describe('Sentra Evolution Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the main dashboard to load
    await expect(page.locator('[data-testid="dashboard-main"]')).toBeVisible();
  });

  test.describe('Dashboard Navigation', () => {
    test('should display main navigation elements', async ({ page }) => {
      // Check for main navigation components
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-patterns"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-evolution"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-analytics"]')).toBeVisible();
      
      // Check for user profile/settings
      await expect(page.locator('[data-testid="nav-profile"]')).toBeVisible();
    });

    test('should navigate between main sections', async ({ page }) => {
      // Navigate to Patterns section
      await page.click('[data-testid="nav-patterns"]');
      await expect(page.locator('[data-testid="patterns-view"]')).toBeVisible();
      await expect(page).toHaveURL(/\/patterns/);

      // Navigate to Evolution section  
      await page.click('[data-testid="nav-evolution"]');
      await expect(page.locator('[data-testid="evolution-view"]')).toBeVisible();
      await expect(page).toHaveURL(/\/evolution/);

      // Navigate to Analytics section
      await page.click('[data-testid="nav-analytics"]');
      await expect(page.locator('[data-testid="analytics-view"]')).toBeVisible();
      await expect(page).toHaveURL(/\/analytics/);

      // Navigate back to Dashboard
      await page.click('[data-testid="nav-dashboard"]');
      await expect(page.locator('[data-testid="dashboard-main"]')).toBeVisible();
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Dashboard Overview', () => {
    test('should display key metrics cards', async ({ page }) => {
      // Check for metric cards
      await expect(page.locator('[data-testid="metric-total-patterns"]')).toBeVisible();
      await expect(page.locator('[data-testid="metric-total-evolutions"]')).toBeVisible();
      await expect(page.locator('[data-testid="metric-success-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="metric-avg-generation"]')).toBeVisible();
      
      // Verify metric cards contain numerical data
      const totalPatternsText = await page.locator('[data-testid="metric-total-patterns"] .metric-value').textContent();
      expect(totalPatternsText).toMatch(/^\d+$/);
      
      const successRateText = await page.locator('[data-testid="metric-success-rate"] .metric-value').textContent();
      expect(successRateText).toMatch(/^\d+(\.\d+)?%$/);
    });

    test('should display evolution timeline chart', async ({ page }) => {
      // Check for chart container
      await expect(page.locator('[data-testid="evolution-timeline-chart"]')).toBeVisible();
      
      // Wait for chart to load
      await page.waitForFunction(() => {
        const chartElement = document.querySelector('[data-testid="evolution-timeline-chart"] canvas');
        return chartElement !== null;
      });
      
      // Verify chart canvas is present
      await expect(page.locator('[data-testid="evolution-timeline-chart"] canvas')).toBeVisible();
    });

    test('should display recent patterns list', async ({ page }) => {
      await expect(page.locator('[data-testid="recent-patterns-list"]')).toBeVisible();
      
      // Check for pattern items
      const patternItems = page.locator('[data-testid^="pattern-item-"]');
      await expect(patternItems.first()).toBeVisible();
      
      // Verify pattern items have required information
      await expect(patternItems.first().locator('.pattern-id')).toBeVisible();
      await expect(patternItems.first().locator('.pattern-generation')).toBeVisible();
      await expect(patternItems.first().locator('.pattern-success-rate')).toBeVisible();
    });
  });

  test.describe('Pattern Management', () => {
    test('should create a new pattern', async ({ page }) => {
      // Navigate to patterns section
      await page.click('[data-testid="nav-patterns"]');
      
      // Click create pattern button
      await page.click('[data-testid="create-pattern-btn"]');
      
      // Fill out pattern creation form
      await expect(page.locator('[data-testid="pattern-form"]')).toBeVisible();
      
      await page.fill('[data-testid="project-name-input"]', 'E2E Test Project');
      await page.selectOption('[data-testid="language-select"]', 'typescript');
      await page.selectOption('[data-testid="framework-select"]', 'vue');
      
      // Add requirements
      await page.click('[data-testid="add-requirement-btn"]');
      await page.fill('[data-testid="requirement-input-0"]', 'performance');
      await page.click('[data-testid="add-requirement-btn"]');
      await page.fill('[data-testid="requirement-input-1"]', 'scalability');
      
      // Set target metrics
      await page.fill('[data-testid="response-time-input"]', '200');
      await page.fill('[data-testid="throughput-input"]', '1000');
      await page.fill('[data-testid="error-rate-input"]', '0.01');
      
      // Submit form
      await page.click('[data-testid="create-pattern-submit"]');
      
      // Wait for pattern creation
      await expect(page.locator('[data-testid="pattern-creation-success"]')).toBeVisible();
      
      // Verify redirect to pattern details
      await expect(page).toHaveURL(/\/patterns\/[^\/]+$/);
      await expect(page.locator('[data-testid="pattern-details"]')).toBeVisible();
    });

    test('should view pattern details', async ({ page }) => {
      await page.click('[data-testid="nav-patterns"]');
      
      // Click on first pattern in list
      await page.click('[data-testid^="pattern-item-"]:first-child');
      
      // Verify pattern details page
      await expect(page.locator('[data-testid="pattern-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="pattern-id"]')).toBeVisible();
      await expect(page.locator('[data-testid="pattern-generation"]')).toBeVisible();
      await expect(page.locator('[data-testid="pattern-genetics"]')).toBeVisible();
      await expect(page.locator('[data-testid="pattern-performance"]')).toBeVisible();
      
      // Check for code section
      await expect(page.locator('[data-testid="pattern-code"]')).toBeVisible();
      
      // Check for action buttons
      await expect(page.locator('[data-testid="evolve-pattern-btn"]')).toBeVisible();
      await expect(page.locator('[data-testid="clone-pattern-btn"]')).toBeVisible();
    });

    test('should search and filter patterns', async ({ page }) => {
      await page.click('[data-testid="nav-patterns"]');
      
      // Test search functionality
      await page.fill('[data-testid="pattern-search-input"]', 'optimization');
      await page.press('[data-testid="pattern-search-input"]', 'Enter');
      
      // Verify search results
      await page.waitForSelector('[data-testid="search-results"]');
      const searchResults = page.locator('[data-testid^="pattern-item-"]');
      const resultCount = await searchResults.count();
      expect(resultCount).toBeGreaterThan(0);
      
      // Clear search
      await page.fill('[data-testid="pattern-search-input"]', '');
      await page.press('[data-testid="pattern-search-input"]', 'Enter');
      
      // Test filters
      await page.click('[data-testid="filters-toggle"]');
      await expect(page.locator('[data-testid="filters-panel"]')).toBeVisible();
      
      // Filter by pattern type
      await page.selectOption('[data-testid="pattern-type-filter"]', 'optimization');
      await page.click('[data-testid="apply-filters-btn"]');
      
      // Verify filtered results
      await page.waitForSelector('[data-testid="filtered-results"]');
      const filteredResults = page.locator('[data-testid^="pattern-item-"]');
      const filteredCount = await filteredResults.count();
      expect(filteredCount).toBeGreaterThan(0);
      
      // Verify all results are optimization patterns
      const patternTypes = await filteredResults.locator('.pattern-type').allTextContents();
      patternTypes.forEach(type => {
        expect(type.toLowerCase()).toContain('optimization');
      });
    });
  });

  test.describe('Evolution Workflow', () => {
    test('should evolve a pattern', async ({ page }) => {
      // Navigate to patterns and select one
      await page.click('[data-testid="nav-patterns"]');
      await page.click('[data-testid^="pattern-item-"]:first-child');
      
      // Click evolve button
      await page.click('[data-testid="evolve-pattern-btn"]');
      
      // Fill evolution parameters
      await expect(page.locator('[data-testid="evolution-form"]')).toBeVisible();
      
      await page.fill('[data-testid="mutation-rate-input"]', '0.1');
      await page.fill('[data-testid="crossover-rate-input"]', '0.3');
      await page.fill('[data-testid="target-improvement-input"]', '0.15');
      
      // Add feedback
      await page.fill('[data-testid="feedback-input"]', 'Focus on improving response time and reducing error rate');
      await page.selectOption('[data-testid="user-rating-select"]', '4');
      
      // Start evolution
      await page.click('[data-testid="start-evolution-btn"]');
      
      // Wait for evolution progress
      await expect(page.locator('[data-testid="evolution-progress"]')).toBeVisible();
      
      // Wait for evolution completion
      await expect(page.locator('[data-testid="evolution-complete"]')).toBeVisible({ timeout: 30000 });
      
      // Verify evolution results
      await expect(page.locator('[data-testid="evolved-pattern"]')).toBeVisible();
      await expect(page.locator('[data-testid="improvement-metrics"]')).toBeVisible();
      
      // Check that new pattern has higher generation
      const originalGeneration = await page.locator('[data-testid="original-generation"]').textContent();
      const evolvedGeneration = await page.locator('[data-testid="evolved-generation"]').textContent();
      
      expect(parseInt(evolvedGeneration!)).toBeGreaterThan(parseInt(originalGeneration!));
    });

    test('should display evolution history', async ({ page }) => {
      await page.click('[data-testid="nav-evolution"]');
      
      // Check evolution timeline
      await expect(page.locator('[data-testid="evolution-timeline"]')).toBeVisible();
      
      // Check evolution entries
      const evolutionEntries = page.locator('[data-testid^="evolution-entry-"]');
      await expect(evolutionEntries.first()).toBeVisible();
      
      // Verify evolution entry details
      await expect(evolutionEntries.first().locator('.evolution-timestamp')).toBeVisible();
      await expect(evolutionEntries.first().locator('.evolution-pattern-id')).toBeVisible();
      await expect(evolutionEntries.first().locator('.evolution-generation')).toBeVisible();
      await expect(evolutionEntries.first().locator('.evolution-improvement')).toBeVisible();
      
      // Test filtering evolution history
      await page.selectOption('[data-testid="evolution-filter-select"]', 'last-24h');
      await page.waitForSelector('[data-testid="filtered-evolution-results"]');
    });
  });

  test.describe('Analytics Dashboard', () => {
    test('should display performance analytics', async ({ page }) => {
      await page.click('[data-testid="nav-analytics"]');
      
      // Check performance metrics chart
      await expect(page.locator('[data-testid="performance-metrics-chart"]')).toBeVisible();
      
      // Wait for chart to load
      await page.waitForFunction(() => {
        const chartElement = document.querySelector('[data-testid="performance-metrics-chart"] canvas');
        return chartElement !== null;
      });
      
      // Check genetic diversity chart
      await expect(page.locator('[data-testid="genetic-diversity-chart"]')).toBeVisible();
      
      // Check success rate trends
      await expect(page.locator('[data-testid="success-rate-trends"]')).toBeVisible();
    });

    test('should filter analytics by date range', async ({ page }) => {
      await page.click('[data-testid="nav-analytics"]');
      
      // Open date range picker
      await page.click('[data-testid="date-range-picker"]');
      
      // Select last 7 days
      await page.click('[data-testid="date-range-7days"]');
      
      // Wait for charts to update
      await page.waitForTimeout(2000);
      
      // Verify date range is applied
      const dateRangeText = await page.locator('[data-testid="current-date-range"]').textContent();
      expect(dateRangeText).toContain('Last 7 days');
      
      // Check that data is filtered
      await expect(page.locator('[data-testid="filtered-analytics-data"]')).toBeVisible();
    });

    test('should export analytics data', async ({ page }) => {
      await page.click('[data-testid="nav-analytics"]');
      
      // Click export button
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-analytics-btn"]');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/analytics-export-\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });

  test.describe('Real-time Updates', () => {
    test('should receive WebSocket updates', async ({ page, context }) => {
      // Open two pages to simulate real-time updates
      const page1 = page;
      const page2 = await context.newPage();
      
      await page1.goto('/');
      await page2.goto('/');
      
      // Wait for WebSocket connections
      await page1.waitForFunction(() => {
        return (window as any).websocketConnected === true;
      });
      
      await page2.waitForFunction(() => {
        return (window as any).websocketConnected === true;
      });
      
      // Trigger an evolution on page1
      await page1.click('[data-testid="nav-patterns"]');
      await page1.click('[data-testid^="pattern-item-"]:first-child');
      await page1.click('[data-testid="evolve-pattern-btn"]');
      
      // Fill minimal evolution form
      await page1.fill('[data-testid="mutation-rate-input"]', '0.1');
      await page1.click('[data-testid="start-evolution-btn"]');
      
      // Check that page2 receives the update
      await expect(page2.locator('[data-testid="realtime-notification"]')).toBeVisible({ timeout: 10000 });
      
      // Verify notification content
      const notificationText = await page2.locator('[data-testid="realtime-notification"]').textContent();
      expect(notificationText).toContain('New evolution started');
      
      await page2.close();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/evolution/patterns', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });
      
      await page.click('[data-testid="nav-patterns"]');
      
      // Verify error state is displayed
      await expect(page.locator('[data-testid="api-error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
      
      // Test retry functionality
      await page.unroute('**/api/evolution/patterns');
      await page.click('[data-testid="retry-btn"]');
      
      // Verify data loads after retry
      await expect(page.locator('[data-testid="patterns-list"]')).toBeVisible();
    });

    test('should handle network connectivity issues', async ({ page, context }) => {
      // Start with normal page load
      await page.goto('/');
      
      // Simulate network offline
      await context.setOffline(true);
      
      // Try to navigate to patterns
      await page.click('[data-testid="nav-patterns"]');
      
      // Verify offline message
      await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
      
      // Restore network
      await context.setOffline(false);
      
      // Verify reconnection
      await expect(page.locator('[data-testid="online-message"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="patterns-list"]')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load dashboard within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await expect(page.locator('[data-testid="dashboard-main"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Navigate to analytics with large dataset
      await page.goto('/analytics?dataset=large');
      
      // Measure chart rendering time
      const startTime = Date.now();
      
      await page.waitForFunction(() => {
        const chartElements = document.querySelectorAll('[data-testid*="chart"] canvas');
        return chartElements.length >= 3; // Wait for all charts to render
      });
      
      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(5000); // Charts should render within 5 seconds
    });
  });

  test.describe('Accessibility', () => {
    test('should meet basic accessibility requirements', async ({ page }) => {
      await page.goto('/');
      
      // Check for proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
      
      // Check for alt text on images
      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
      
      // Check for proper form labels
      const inputs = await page.locator('input, select, textarea').all();
      for (const input of inputs) {
        const label = await input.getAttribute('aria-label') || await input.getAttribute('placeholder');
        expect(label).toBeTruthy();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      // Test tab navigation through main elements
      await page.press('body', 'Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Navigate to patterns using keyboard
      await page.press('body', 'Tab');
      await page.press('body', 'Tab');
      await page.press('body', 'Enter');
      
      // Verify navigation worked
      await expect(page).toHaveURL(/\/patterns/);
    });
  });
});