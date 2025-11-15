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
    // Ensure mock mode params are set before navigation
    await page.addInitScript(() => {
      window.localStorage.setItem('FF_USE_MOCK_API', 'true');
      window.localStorage.setItem('FF_MOCK_SCENARIO', 'success');
      window.localStorage.setItem('FF_SIMULATE_LATENCY', 'false');
    });

    analyzerPage = new AnalyzerPage(page);
  });

  test('should analyze idea successfully', async ({ page }) => {
    const logs = setupConsoleLogCapture(page);

    await analyzerPage.navigate();

    await expect(analyzerPage.ideaInput).toBeVisible({ timeout: 10000 });
    await expect(analyzerPage.analyzeButton).toBeVisible();

    await analyzerPage.enterIdea(TEST_IDEAS.simple);
    await analyzerPage.selectLanguage(TEST_LOCALES.english);
    await expect(analyzerPage.analyzeButton).toBeEnabled();

    await analyzerPage.clickAnalyze();

    await Promise.race([
      analyzerPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 }),
      analyzerPage.errorMessage.waitFor({ state: 'visible', timeout: 60000 }),
    ]);

    if (await analyzerPage.isErrorVisible()) {
      const errorText = await analyzerPage.getErrorMessage();
      console.log('Error occurred:', errorText);
      console.log('Console logs:', logs);
      throw new Error(`Analysis failed with error: ${errorText}`);
    }

    await expect(analyzerPage.scoreElement).toBeVisible();
    await expect(analyzerPage.summaryElement).toBeVisible();
    await expect(analyzerPage.resultsContainer).toBeVisible();

    const scoreText = await analyzerPage.getScore();
    expect(scoreText).toBeTruthy();
    const summaryText = await analyzerPage.getSummary();
    expect(summaryText).toBeTruthy();

    await expect(analyzerPage.errorMessage).not.toBeVisible();
  });

  test('should display analysis results with all sections', async () => {
    await analyzerPage.navigate();

    await expect(analyzerPage.ideaInput).toBeVisible({ timeout: 10000 });

    await analyzerPage.enterIdea(TEST_IDEAS.innovative);
    await analyzerPage.selectLanguage(TEST_LOCALES.english);
    await analyzerPage.clickAnalyze();

    await analyzerPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });

    await expect(analyzerPage.strengthsList).toBeVisible();
    await expect(analyzerPage.weaknessesList).toBeVisible();
    await expect(analyzerPage.resultsContainer).toBeVisible();

    const strengths = await analyzerPage.getStrengths();
    const weaknesses = await analyzerPage.getWeaknesses();

    expect(strengths.length).toBeGreaterThan(0);
    expect(weaknesses.length).toBeGreaterThan(0);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('FF_MOCK_SCENARIO', 'api_error');
    });

    await analyzerPage.navigate();

    await analyzerPage.enterIdea(TEST_IDEAS.simple);
    await analyzerPage.selectLanguage(TEST_LOCALES.english);
    await analyzerPage.clickAnalyze();

    await analyzerPage.errorMessage.waitFor({ state: 'visible', timeout: 10000 });
    await expect(analyzerPage.errorMessage).toBeVisible();
    await expect(analyzerPage.resultsContainer).not.toBeVisible();
  });

  test('should display loading spinner during analysis', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('FF_SIMULATE_LATENCY', 'true');
      window.localStorage.setItem('FF_MIN_LATENCY', '2000');
      window.localStorage.setItem('FF_MAX_LATENCY', '3000');
    });

    await analyzerPage.navigate();

    await analyzerPage.enterIdea(TEST_IDEAS.technical);
    await analyzerPage.selectLanguage(TEST_LOCALES.english);
    await analyzerPage.clickAnalyze();

    await expect(analyzerPage.loadingSpinner).toBeVisible({ timeout: 5000 });
    await analyzerPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });
    await expect(analyzerPage.loadingSpinner).not.toBeVisible();
  });

  test('should support multiple languages', async () => {
    await analyzerPage.navigate();

    await analyzerPage.enterIdea(TEST_IDEAS.simple);
    await analyzerPage.selectLanguage(TEST_LOCALES.english);
    await analyzerPage.clickAnalyze();
    await analyzerPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });
    const englishSummary = await analyzerPage.getSummary();

    await analyzerPage.navigate();
    await analyzerPage.enterIdea(TEST_IDEAS.multilingual);
    await analyzerPage.selectLanguage(TEST_LOCALES.spanish);
    await analyzerPage.clickAnalyze();
    await analyzerPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });
    const spanishSummary = await analyzerPage.getSummary();

    expect(englishSummary).toBeTruthy();
    expect(spanishSummary).toBeTruthy();
    expect(englishSummary).not.toBe(spanishSummary);
  });
});
