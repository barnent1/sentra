import { test, expect } from '@playwright/test';

test.describe('Visual State Changes', () => {
  test('icon color change is visible', async ({ page }) => {
    await page.goto('/dashboard');

    const icon = page.locator('[data-testid="dashboard-icon"]');

    // Verify initial blue state
    await expect(icon).toHaveClass(/text-blue-500/);
    await expect(icon).toHaveScreenshot('icon-blue.png');

    // Click icon to open modal
    await icon.click();

    // Click Yes in modal
    await page.click('button:has-text("Yes")');

    // Wait for process to complete
    await page.waitForSelector('[data-testid="dashboard-icon"].text-red-500');

    // Verify red state
    await expect(icon).toHaveClass(/text-red-500/);
    await expect(icon).not.toHaveClass(/text-blue-500/);
    await expect(icon).toHaveScreenshot('icon-red.png');
  });
});
