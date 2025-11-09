/**
 * Example E2E Test
 * 
 * This file demonstrates best practices for writing E2E tests using Playwright
 * with the mock system. Use this as a template for creating new tests.
 */

import { test, expect } from '@playwright/test';
import { AnalyzerPage } from '../helpers/page-objects/AnalyzerPage';
import { TEST_IDEAS } from '../helpers/fixtures';

/**
 * Test Suite: Example Feature Tests
 * 
 * This suite demonstrates:
 * - Basic test structure
 * - Page object usage
 * - Assertions
 * - Error handling
 * - Mock scenario configuration
 */
test.describe('Example Feature Tests', () => {
  let analyzerPage: AnalyzerPage;

  /**
   * Setup: Run before each test
   * 
   * - Initialize page objects
   * - Navigate to the feature page
   * - Set up any required state
   */
  test.beforeEach(async ({ page }) => {
    // Initialize page object
    analyzerPage = new AnalyzerPage(page);
    
    // Navigate to the page
    await analyzerPage.navigate();
    
    // Verify page loaded correctly
    await expect(page).toHaveTitle(/Kiroween/);
  });

  /**
   * Test: Happy Path
   * 
   * Tests the main success scenario where everything works as expected.
   * This should be the most common user flow.
   */
  test('should complete the main user flow successfully', async () => {
    // Arrange: Set up test data
    const testIdea = TEST_IDEAS.VALID_STARTUP_IDEA;
    
    // Act: Perform user actions
    await analyzerPage.enterIdea(testIdea);
    await analyzerPage.selectLanguage('en');
    await analyzerPage.clickAnalyze();
    
    // Assert: Verify expected outcomes
    await expect(analyzerPage.scoreElement).toBeVisible();
    await expect(analyzerPage.summaryElement).toContainText('potential');
    
    // Additional assertions
    const score = await analyzerPage.getScore();
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  /**
   * Test: Loading State
   * 
   * Tests that loading indicators are shown during async operations.
   * Important for user experience validation.
   */
  test('should show loading state during analysis', async ({ page }) => {
    // Enable latency simulation for this test
    await page.addInitScript(() => {
      localStorage.setItem('FF_SIMULATE_LATENCY', 'true');
      localStorage.setItem('FF_MIN_LATENCY', '2000');
    });
    
    // Start the analysis
    await analyzerPage.enterIdea(TEST_IDEAS.VALID_STARTUP_IDEA);
    await analyzerPage.clickAnalyze();
    
    // Verify loading state appears
    await expect(analyzerPage.loadingSpinner).toBeVisible();
    
    // Verify loading state disappears when complete
    await expect(analyzerPage.loadingSpinner).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * Test: Error Handling
   * 
   * Tests that errors are handled gracefully and users receive
   * appropriate feedback.
   */
  test('should handle API errors gracefully', async ({ page }) => {
    // Configure mock to return error
    await page.addInitScript(() => {
      localStorage.setItem('FF_MOCK_SCENARIO', 'api_error');
    });
    
    // Reload page to apply mock scenario
    await analyzerPage.navigate();
    
    // Attempt the action
    await analyzerPage.enterIdea(TEST_IDEAS.VALID_STARTUP_IDEA);
    await analyzerPage.clickAnalyze();
    
    // Verify error message is displayed
    await expect(analyzerPage.errorMessage).toBeVisible();
    await expect(analyzerPage.errorMessage).toContainText(/error|failed/i);
    
    // Verify results are not shown
    await expect(analyzerPage.scoreElement).not.toBeVisible();
  });

  /**
   * Test: Input Validation
   * 
   * Tests that invalid inputs are caught and users receive
   * helpful validation messages.
   */
  test('should validate user input', async () => {
    // Try to submit with empty input
    await analyzerPage.clickAnalyze();
    
    // Verify validation message
    const validationMessage = analyzerPage.page.locator('[role="alert"]');
    await expect(validationMessage).toBeVisible();
    
    // Verify analysis doesn't proceed
    await expect(analyzerPage.loadingSpinner).not.toBeVisible();
  });

  /**
   * Test: Multi-language Support
   * 
   * Tests that the feature works correctly in different languages.
   */
  test('should support multiple languages', async () => {
    // Test English
    await analyzerPage.enterIdea(TEST_IDEAS.VALID_STARTUP_IDEA);
    await analyzerPage.selectLanguage('en');
    await analyzerPage.clickAnalyze();
    
    await expect(analyzerPage.summaryElement).toBeVisible();
    const englishText = await analyzerPage.summaryElement.textContent();
    
    // Test Spanish
    await analyzerPage.navigate(); // Reset
    await analyzerPage.enterIdea(TEST_IDEAS.VALID_STARTUP_IDEA);
    await analyzerPage.selectLanguage('es');
    await analyzerPage.clickAnalyze();
    
    await expect(analyzerPage.summaryElement).toBeVisible();
    const spanishText = await analyzerPage.summaryElement.textContent();
    
    // Verify different content for different languages
    expect(englishText).not.toBe(spanishText);
  });

  /**
   * Test: Responsive Design
   * 
   * Tests that the feature works on different screen sizes.
   */
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Perform the same actions
    await analyzerPage.enterIdea(TEST_IDEAS.VALID_STARTUP_IDEA);
    await analyzerPage.clickAnalyze();
    
    // Verify results are displayed correctly
    await expect(analyzerPage.scoreElement).toBeVisible();
    
    // Verify mobile-specific elements if any
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible();
    }
  });

  /**
   * Test: Accessibility
   * 
   * Tests that the feature is accessible to users with disabilities.
   */
  test('should be keyboard accessible', async ({ page }) => {
    // Navigate using keyboard
    await page.keyboard.press('Tab'); // Focus on first element
    await page.keyboard.press('Tab'); // Move to input
    
    // Type using keyboard
    await page.keyboard.type(TEST_IDEAS.VALID_STARTUP_IDEA);
    
    // Submit using keyboard
    await page.keyboard.press('Tab'); // Move to button
    await page.keyboard.press('Enter'); // Submit
    
    // Verify results
    await expect(analyzerPage.scoreElement).toBeVisible();
  });

  /**
   * Cleanup: Run after each test
   * 
   * - Clear any test data
   * - Reset state
   * - Close connections
   */
  test.afterEach(async ({ page }) => {
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    
    // Take screenshot on failure (automatic with Playwright config)
    // Additional cleanup if needed
  });
});

/**
 * Test Suite: Advanced Examples
 * 
 * Demonstrates more advanced testing patterns.
 */
test.describe('Advanced Testing Patterns', () => {
  /**
   * Test: Network Interception
   * 
   * Shows how to intercept and modify network requests.
   */
  test('should intercept network requests', async ({ page }) => {
    // Intercept API calls
    await page.route('**/api/analyze', async (route) => {
      // Modify request
      const request = route.request();
      console.log('Intercepted request:', request.url());
      
      // Continue with modified response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { score: 95, summary: 'Custom response' }
        })
      });
    });
    
    // Perform action that triggers the request
    const analyzerPage = new AnalyzerPage(page);
    await analyzerPage.navigate();
    await analyzerPage.enterIdea(TEST_IDEAS.VALID_STARTUP_IDEA);
    await analyzerPage.clickAnalyze();
    
    // Verify custom response
    await expect(analyzerPage.summaryElement).toContainText('Custom response');
  });

  /**
   * Test: Multiple Scenarios
   * 
   * Tests multiple scenarios in a single test using test.step.
   */
  test('should handle multiple scenarios', async ({ page }) => {
    const analyzerPage = new AnalyzerPage(page);
    await analyzerPage.navigate();
    
    await test.step('Scenario 1: Valid input', async () => {
      await analyzerPage.enterIdea(TEST_IDEAS.VALID_STARTUP_IDEA);
      await analyzerPage.clickAnalyze();
      await expect(analyzerPage.scoreElement).toBeVisible();
    });
    
    await test.step('Scenario 2: Different input', async () => {
      await analyzerPage.navigate(); // Reset
      await analyzerPage.enterIdea(TEST_IDEAS.ANOTHER_IDEA);
      await analyzerPage.clickAnalyze();
      await expect(analyzerPage.scoreElement).toBeVisible();
    });
  });

  /**
   * Test: Performance
   * 
   * Tests that operations complete within acceptable time limits.
   */
  test('should complete analysis within time limit', async ({ page }) => {
    const analyzerPage = new AnalyzerPage(page);
    await analyzerPage.navigate();
    
    // Disable latency simulation for performance test
    await page.addInitScript(() => {
      localStorage.setItem('FF_SIMULATE_LATENCY', 'false');
    });
    
    await analyzerPage.navigate(); // Reload with new settings
    
    const startTime = Date.now();
    
    await analyzerPage.enterIdea(TEST_IDEAS.VALID_STARTUP_IDEA);
    await analyzerPage.clickAnalyze();
    await expect(analyzerPage.scoreElement).toBeVisible();
    
    const duration = Date.now() - startTime;
    
    // Verify operation completed quickly
    expect(duration).toBeLessThan(3000); // 3 seconds max
  });
});
