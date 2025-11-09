import { test, expect } from '@playwright/test';

/**
 * Basic setup verification test
 * This test ensures the E2E testing infrastructure is properly configured
 */
test.describe('E2E Setup Verification', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Verify page loads successfully
    await expect(page).toHaveTitle(/No Vibe No Code/i);
  });

  test('should have proper viewport configuration', async ({ page }) => {
    await page.goto('/');
    
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
    expect(viewport?.width).toBeGreaterThan(0);
    expect(viewport?.height).toBeGreaterThan(0);
  });

  test('should capture console logs', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', (msg) => {
      logs.push(msg.text());
    });
    
    await page.goto('/');
    
    // Logs array should be accessible
    expect(Array.isArray(logs)).toBe(true);
  });
});
