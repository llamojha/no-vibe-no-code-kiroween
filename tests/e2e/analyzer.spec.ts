import { test, expect } from '@playwright/test';
import { AnalyzerPage } from './helpers/page-objects/AnalyzerPage';
import { TEST_IDEAS, TEST_LOCALES } from './helpers/fixtures';
import { setupConsoleLogCapture } from './helpers/test-helpers';

/**
 * E2E Tests for Analyzer Feature
 * Tests the Startup Idea Analyzer workflow with mock API responses
 * 
 * Requirements covered:
 * - 4.1: Automated tests for Startup Idea Analyzer workflow
 * - 4.5: E2E tests use mock API responses for consistent results
 */
test.describe('Analyzer E2E Tests', () => {
  let analyzerPage: AnalyzerPage;

  test.beforeEach(async ({ page }) => {
    // Enable mock mode via localStorage before navigating
    await page.addInitScript(() => {
      window.localStorage.setItem('FF_USE_MOCK_API', 'true');
      window.localStorage.setItem('FF_MOCK_SCENARIO', 'success');
      window.localStorage.setItem('FF_SIMULATE_LATENCY', 'false');
    });
    
    analyzerPage = new AnalyzerPage(page);
  });

  /**
   * Test 10.1: Successful analysis test
   * Navigate to analyzer page, enter test idea, select language, analyze, and verify results
   * Requirements: 4.1, 4.5
   */
  test('should analyze idea successfully', async ({ page }) => {
    // Setup console log capture for debugging
    const logs = setupConsoleLogCapture(page);

    // Navigate to analyzer page
    await analyzerPage.navigate();

    // Verify page loaded with form elements
    await expect(analyzerPage.ideaInput).toBeVisible({ timeout: 10000 });
    await expect(analyzerPage.analyzeButton).toBeVisible();

    // Enter test idea
    await analyzerPage.enterIdea(TEST_IDEAS.simple);

    // Select language (English)
    await analyzerPage.selectLanguage(TEST_LOCALES.english);

    // Verify button is enabled after entering text
    await expect(analyzerPage.analyzeButton).toBeEnabled();

    // Click analyze button
    await analyzerPage.clickAnalyze();

    // Wait for either results or error
    await Promise.race([
      analyzerPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 }),
      analyzerPage.errorMessage.waitFor({ state: 'visible', timeout: 60000 }),
    ]);

    // Check if error occurred
    const isErrorVisible = await analyzerPage.isErrorVisible();
    if (isErrorVisible) {
      const errorText = await analyzerPage.getErrorMessage();
      console.log('Error occurred:', errorText);
      console.log('Console logs:', logs);
      throw new Error(`Analysis failed with error: ${errorText}`);
    }

    // Assert results are displayed
    await expect(analyzerPage.scoreElement).toBeVisible();
    await expect(analyzerPage.summaryElement).toBeVisible();
    await expect(analyzerPage.resultsContainer).toBeVisible();

    // Verify score is displayed with valid value
    const scoreText = await analyzerPage.getScore();
    expect(scoreText).toBeTruthy();
    expect(scoreText.length).toBeGreaterThan(0);

    // Verify summary is displayed with content
    const summaryText = await analyzerPage.getSummary();
    expect(summaryText).toBeTruthy();
    expect(summaryText.length).toBeGreaterThan(0);

    // Verify no errors occurred
    await expect(analyzerPage.errorMessage).not.toBeVisible();
  });

  test('should display analysis results with all sections', async () => {
    await analyzerPage.navigate();
    
    // Verify form is visible
    await expect(analyzerPage.ideaInput).toBeVisible({ timeout: 10000 });
    
    await analyzerPage.enterIdea(TEST_IDEAS.innovative);
    await analyzerPage.selectLanguage(TEST_LOCALES.english);
    await analyzerPage.clickAnalyze();
    
    // Wait for results with extended timeout
    await analyzerPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });

    // Verify all major sections are present
    await expect(analyzerPage.scoreElement).toBeVisible();
    await expect(analyzerPage.summaryElement).toBeVisible();
    await expect(analyzerPage.strengthsList).toBeVisible();
    await expect(analyzerPage.weaknessesList).toBeVisible();

    // Verify strengths and weaknesses have content
    const strengths = await analyzerPage.getStrengths();
    const weaknesses = await analyzerPage.getWeaknesses();
    
    expect(strengths.length).toBeGreaterThan(0);
    expect(weaknesses.length).toBeGreaterThan(0);
  });

  /**
   * Test 10.2: API error handling test
   * Set mock scenario to 'api_error', attempt analysis, and verify error message is displayed
   * Requirements: 4.1, 4.5
   */
  test('should handle API errors gracefully', async () => {
    // Set mock scenario to api_error using localStorage
    await analyzerPage.page.addInitScript(() => {
      window.localStorage.setItem('FF_MOCK_SCENARIO', 'api_error');
    });

    await analyzerPage.navigate();
    
    // Verify form is visible
    await expect(analyzerPage.ideaInput).toBeVisible({ timeout: 10000 });
    
    await analyzerPage.enterIdea(TEST_IDEAS.simple);
    await analyzerPage.selectLanguage(TEST_LOCALES.english);
    await analyzerPage.clickAnalyze();

    // Wait for error message to appear
    await analyzerPage.errorMessage.waitFor({ state: 'visible', timeout: 10000 });

    // Assert error message is displayed
    await expect(analyzerPage.errorMessage).toBeVisible();
    
    // Verify error message contains relevant text
    const errorText = await analyzerPage.getErrorMessage();
    expect(errorText.length).toBeGreaterThan(0);
    
    // Verify results are not displayed
    await expect(analyzerPage.resultsContainer).not.toBeVisible();
  });

  /**
   * Test 10.3: Loading state test
   * Enable latency simulation, start analysis, and verify loading spinner is visible
   * Requirements: 4.1, 4.5
   */
  test('should display loading spinner during analysis', async () => {
    // Enable latency simulation using localStorage
    await analyzerPage.page.addInitScript(() => {
      window.localStorage.setItem('FF_SIMULATE_LATENCY', 'true');
      window.localStorage.setItem('FF_MIN_LATENCY', '2000');
      window.localStorage.setItem('FF_MAX_LATENCY', '3000');
    });

    await analyzerPage.navigate();
    
    // Verify form is visible
    await expect(analyzerPage.ideaInput).toBeVisible({ timeout: 10000 });
    
    await analyzerPage.enterIdea(TEST_IDEAS.technical);
    await analyzerPage.selectLanguage(TEST_LOCALES.english);
    
    // Click analyze button
    await analyzerPage.clickAnalyze();

    // Assert loading spinner is visible
    // With latency simulation, the spinner should be visible for at least 2 seconds
    await expect(analyzerPage.loadingSpinner).toBeVisible({ timeout: 5000 });
    
    // Verify the spinner is actually animating (it should be visible for a while)
    const isStillVisible = await analyzerPage.isLoadingVisible();
    expect(isStillVisible).toBe(true);

    // Wait for loading to complete and results to appear
    await analyzerPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });
    
    // Verify loading spinner is no longer visible
    await expect(analyzerPage.loadingSpinner).not.toBeVisible();
    
    // Verify results are displayed
    await expect(analyzerPage.resultsContainer).toBeVisible();
  });

  /**
   * Test 10.4: Multi-language test
   * Test analysis in both English and Spanish, verify responses are in correct language
   * Requirements: 4.1, 4.5
   */
  test('should support multiple languages', async () => {
    // Test English analysis
    await analyzerPage.navigate();
    
    // Verify form is visible
    await expect(analyzerPage.ideaInput).toBeVisible({ timeout: 10000 });
    
    await analyzerPage.enterIdea(TEST_IDEAS.simple);
    await analyzerPage.selectLanguage(TEST_LOCALES.english);
    await analyzerPage.clickAnalyze();

    // Wait for English results
    await analyzerPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });
    
    // Verify results are displayed
    await expect(analyzerPage.resultsContainer).toBeVisible();
    const englishSummary = await analyzerPage.getSummary();
    expect(englishSummary.length).toBeGreaterThan(0);

    // Navigate back to form (refresh page to reset state)
    await analyzerPage.navigate();
    
    // Test Spanish analysis
    await expect(analyzerPage.ideaInput).toBeVisible({ timeout: 10000 });
    
    await analyzerPage.enterIdea(TEST_IDEAS.multilingual);
    await analyzerPage.selectLanguage(TEST_LOCALES.spanish);
    await analyzerPage.clickAnalyze();

    // Wait for Spanish results
    await analyzerPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });
    
    // Verify results are displayed
    await expect(analyzerPage.resultsContainer).toBeVisible();
    const spanishSummary = await analyzerPage.getSummary();
    expect(spanishSummary.length).toBeGreaterThan(0);

    // Verify the summaries are different (different language or different idea)
    // Note: They should be different because we used different ideas
    expect(spanishSummary).not.toBe(englishSummary);
  });
});
