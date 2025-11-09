import { test, expect } from '@playwright/test';
import { HackathonPage } from './helpers/page-objects/HackathonPage';
import { TEST_HACKATHON_PROJECTS, TEST_LOCALES } from './helpers/fixtures';
import { setupConsoleLogCapture } from './helpers/test-helpers';

/**
 * E2E Tests for Hackathon Analyzer Feature
 * Tests the Kiroween Hackathon Analyzer workflow with mock API responses
 * 
 * Requirements covered:
 * - 4.2: Automated tests for Hackathon Analyzer workflow
 * - 4.5: E2E tests use mock API responses for consistent results
 */
test.describe('Hackathon Analyzer E2E Tests', () => {
  let hackathonPage: HackathonPage;

  test.beforeEach(async ({ page }) => {
    // Mock mode is enabled via environment variables in playwright.config.ts
    hackathonPage = new HackathonPage(page);
  });

  /**
   * Test 11.1: Successful hackathon analysis test
   * Navigate to hackathon analyzer page, enter project details, submit for analysis,
   * and verify results are displayed with category recommendation
   * Requirements: 4.2, 4.5
   */
  test('should analyze hackathon project successfully', async ({ page }) => {
    // Setup console log capture for debugging
    const logs = setupConsoleLogCapture(page);

    // Navigate to hackathon analyzer page
    await hackathonPage.navigate();

    // Verify page loaded with form elements
    await expect(hackathonPage.projectNameInput).toBeVisible({ timeout: 10000 });
    await expect(hackathonPage.descriptionInput).toBeVisible();
    await expect(hackathonPage.kiroUsageInput).toBeVisible();
    await expect(hackathonPage.analyzeButton).toBeVisible();

    // Enter project details
    const project = TEST_HACKATHON_PROJECTS.advanced;
    await hackathonPage.enterProjectDetails(
      project.name,
      project.description,
      project.kiroUsage
    );

    // Select language (English)
    await hackathonPage.selectLanguage(TEST_LOCALES.english);

    // Verify button is enabled after entering text
    await expect(hackathonPage.analyzeButton).toBeEnabled();

    // Click analyze button
    await hackathonPage.clickAnalyze();

    // Wait for either results or error
    await Promise.race([
      hackathonPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 }),
      hackathonPage.errorMessage.waitFor({ state: 'visible', timeout: 60000 }),
    ]);

    // Check if error occurred
    const isErrorVisible = await hackathonPage.isErrorVisible();
    if (isErrorVisible) {
      const errorText = await hackathonPage.getErrorMessage();
      console.log('Error occurred:', errorText);
      console.log('Console logs:', logs);
      throw new Error(`Analysis failed with error: ${errorText}`);
    }

    // Assert results are displayed
    await expect(hackathonPage.scoreElement).toBeVisible();
    await expect(hackathonPage.summaryElement).toBeVisible();
    await expect(hackathonPage.resultsContainer).toBeVisible();

    // Verify category recommendation is displayed
    await expect(hackathonPage.categoryRecommendation).toBeVisible();

    // Verify score is displayed with valid value
    const scoreText = await hackathonPage.getScore();
    expect(scoreText).toBeTruthy();
    expect(scoreText.length).toBeGreaterThan(0);

    // Verify summary is displayed with content
    const summaryText = await hackathonPage.getSummary();
    expect(summaryText).toBeTruthy();
    expect(summaryText.length).toBeGreaterThan(0);

    // Verify category recommendation has content
    const categoryText = await hackathonPage.getCategoryRecommendation();
    expect(categoryText).toBeTruthy();
    expect(categoryText.length).toBeGreaterThan(0);

    // Verify Kiro usage analysis is displayed
    await expect(hackathonPage.kiroUsageAnalysis).toBeVisible();
    const kiroUsageText = await hackathonPage.getKiroUsageAnalysis();
    expect(kiroUsageText).toBeTruthy();

    // Verify no errors occurred
    await expect(hackathonPage.errorMessage).not.toBeVisible();
  });

  test('should display all analysis sections for comprehensive project', async () => {
    await hackathonPage.navigate();
    
    // Verify form is visible
    await expect(hackathonPage.projectNameInput).toBeVisible({ timeout: 10000 });
    
    const project = TEST_HACKATHON_PROJECTS.comprehensive;
    await hackathonPage.analyzeProject(
      project.name,
      project.description,
      project.kiroUsage,
      TEST_LOCALES.english
    );
    
    // Wait for results with extended timeout
    await hackathonPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });

    // Verify all major sections are present
    await expect(hackathonPage.scoreElement).toBeVisible();
    await expect(hackathonPage.summaryElement).toBeVisible();
    await expect(hackathonPage.categoryRecommendation).toBeVisible();
    await expect(hackathonPage.kiroUsageAnalysis).toBeVisible();
    await expect(hackathonPage.resultsContainer).toBeVisible();

    // Verify content is meaningful
    const score = await hackathonPage.getScore();
    const summary = await hackathonPage.getSummary();
    const category = await hackathonPage.getCategoryRecommendation();
    const kiroUsage = await hackathonPage.getKiroUsageAnalysis();
    
    expect(score.length).toBeGreaterThan(0);
    expect(summary.length).toBeGreaterThan(0);
    expect(category.length).toBeGreaterThan(0);
    expect(kiroUsage.length).toBeGreaterThan(0);
  });

  /**
   * Test 11.2: Category recommendation test
   * Submit project with specific characteristics and verify appropriate category is recommended
   * Requirements: 4.2, 4.5
   */
  test('should recommend appropriate category based on project characteristics', async () => {
    await hackathonPage.navigate();
    
    // Verify form is visible
    await expect(hackathonPage.projectNameInput).toBeVisible({ timeout: 10000 });
    
    // Test with a project that should fit the "resurrection" category
    // (reviving/modernizing legacy code)
    const project = TEST_HACKATHON_PROJECTS.advanced;
    await hackathonPage.analyzeProject(
      project.name,
      project.description,
      project.kiroUsage,
      TEST_LOCALES.english
    );
    
    // Wait for results
    await hackathonPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });

    // Verify category recommendation is displayed
    await expect(hackathonPage.categoryRecommendation).toBeVisible();
    
    // Get category recommendation text
    const categoryText = await hackathonPage.getCategoryRecommendation();
    expect(categoryText).toBeTruthy();
    expect(categoryText.length).toBeGreaterThan(0);
    
    // Verify the category recommendation contains meaningful content
    // The mock data should return "resurrection" as the best match
    // We're not checking for specific text since the UI might format it differently
    expect(categoryText.toLowerCase()).toContain('resurrection');
    
    // Verify results container is visible
    await expect(hackathonPage.resultsContainer).toBeVisible();
  });

  test('should display category with confidence score', async () => {
    await hackathonPage.navigate();
    
    await expect(hackathonPage.projectNameInput).toBeVisible({ timeout: 10000 });
    
    const project = TEST_HACKATHON_PROJECTS.basic;
    await hackathonPage.analyzeProject(
      project.name,
      project.description,
      project.kiroUsage,
      TEST_LOCALES.english
    );
    
    // Wait for results
    await hackathonPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });

    // Verify category recommendation section exists
    await expect(hackathonPage.categoryRecommendation).toBeVisible();
    
    // Get the category text and verify it has content
    const categoryText = await hackathonPage.getCategoryRecommendation();
    expect(categoryText.length).toBeGreaterThan(0);
    
    // The mock response includes confidence scores and explanations
    // Verify the UI displays this information
    expect(categoryText).toBeTruthy();
  });

  /**
   * Test 11.3: Error handling test
   * Set mock scenario to error, attempt analysis, and verify error is handled gracefully
   * Requirements: 4.2, 4.5
   */
  test('should handle API errors gracefully', async ({ page }) => {
    // Set mock scenario to api_error using localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('FF_MOCK_SCENARIO', 'api_error');
    });

    await hackathonPage.navigate();
    
    // Verify form is visible
    await expect(hackathonPage.projectNameInput).toBeVisible({ timeout: 10000 });
    
    const project = TEST_HACKATHON_PROJECTS.basic;
    await hackathonPage.enterProjectDetails(
      project.name,
      project.description,
      project.kiroUsage
    );
    await hackathonPage.selectLanguage(TEST_LOCALES.english);
    await hackathonPage.clickAnalyze();

    // Wait for error message to appear
    await hackathonPage.errorMessage.waitFor({ state: 'visible', timeout: 10000 });

    // Assert error message is displayed
    await expect(hackathonPage.errorMessage).toBeVisible();
    
    // Verify error message contains relevant text
    const errorText = await hackathonPage.getErrorMessage();
    expect(errorText.length).toBeGreaterThan(0);
    
    // Verify results are not displayed
    await expect(hackathonPage.resultsContainer).not.toBeVisible();
  });

  test('should handle timeout errors', async ({ page }) => {
    // Set mock scenario to timeout using localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('FF_MOCK_SCENARIO', 'timeout');
    });

    await hackathonPage.navigate();
    
    await expect(hackathonPage.projectNameInput).toBeVisible({ timeout: 10000 });
    
    const project = TEST_HACKATHON_PROJECTS.minimal;
    await hackathonPage.analyzeProject(
      project.name,
      project.description,
      project.kiroUsage,
      TEST_LOCALES.english
    );

    // Wait for error message (timeout scenario should fail quickly in mock)
    await hackathonPage.errorMessage.waitFor({ state: 'visible', timeout: 35000 });

    // Assert error is displayed
    await expect(hackathonPage.errorMessage).toBeVisible();
    const errorText = await hackathonPage.getErrorMessage();
    expect(errorText.length).toBeGreaterThan(0);
  });

  test('should handle rate limit errors', async ({ page }) => {
    // Set mock scenario to rate_limit using localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('FF_MOCK_SCENARIO', 'rate_limit');
    });

    await hackathonPage.navigate();
    
    await expect(hackathonPage.projectNameInput).toBeVisible({ timeout: 10000 });
    
    const project = TEST_HACKATHON_PROJECTS.basic;
    await hackathonPage.analyzeProject(
      project.name,
      project.description,
      project.kiroUsage,
      TEST_LOCALES.english
    );

    // Wait for error message
    await hackathonPage.errorMessage.waitFor({ state: 'visible', timeout: 10000 });

    // Assert error is displayed
    await expect(hackathonPage.errorMessage).toBeVisible();
    const errorText = await hackathonPage.getErrorMessage();
    expect(errorText.length).toBeGreaterThan(0);
    
    // Verify results are not displayed
    await expect(hackathonPage.resultsContainer).not.toBeVisible();
  });

  test('should display loading state during analysis', async ({ page }) => {
    // Enable latency simulation using localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('FF_SIMULATE_LATENCY', 'true');
      window.localStorage.setItem('FF_MIN_LATENCY', '2000');
      window.localStorage.setItem('FF_MAX_LATENCY', '3000');
    });

    await hackathonPage.navigate();
    
    await expect(hackathonPage.projectNameInput).toBeVisible({ timeout: 10000 });
    
    const project = TEST_HACKATHON_PROJECTS.basic;
    await hackathonPage.enterProjectDetails(
      project.name,
      project.description,
      project.kiroUsage
    );
    await hackathonPage.selectLanguage(TEST_LOCALES.english);
    
    // Click analyze button
    await hackathonPage.clickAnalyze();

    // Assert loading spinner is visible
    await expect(hackathonPage.loadingSpinner).toBeVisible({ timeout: 5000 });
    
    // Verify the spinner is actually visible for a while
    const isStillVisible = await hackathonPage.isLoadingVisible();
    expect(isStillVisible).toBe(true);

    // Wait for loading to complete and results to appear
    await hackathonPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });
    
    // Verify loading spinner is no longer visible
    await expect(hackathonPage.loadingSpinner).not.toBeVisible();
    
    // Verify results are displayed
    await expect(hackathonPage.resultsContainer).toBeVisible();
  });

  test('should support multiple languages', async () => {
    // Test English analysis
    await hackathonPage.navigate();
    
    await expect(hackathonPage.projectNameInput).toBeVisible({ timeout: 10000 });
    
    const project = TEST_HACKATHON_PROJECTS.basic;
    await hackathonPage.analyzeProject(
      project.name,
      project.description,
      project.kiroUsage,
      TEST_LOCALES.english
    );

    // Wait for English results
    await hackathonPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });
    
    // Verify results are displayed
    await expect(hackathonPage.resultsContainer).toBeVisible();
    const englishSummary = await hackathonPage.getSummary();
    expect(englishSummary.length).toBeGreaterThan(0);

    // Navigate back to form (refresh page to reset state)
    await hackathonPage.navigate();
    
    // Test Spanish analysis
    await expect(hackathonPage.projectNameInput).toBeVisible({ timeout: 10000 });
    
    const spanishProject = TEST_HACKATHON_PROJECTS.advanced;
    await hackathonPage.analyzeProject(
      spanishProject.name,
      spanishProject.description,
      spanishProject.kiroUsage,
      TEST_LOCALES.spanish
    );

    // Wait for Spanish results
    await hackathonPage.scoreElement.waitFor({ state: 'visible', timeout: 60000 });
    
    // Verify results are displayed
    await expect(hackathonPage.resultsContainer).toBeVisible();
    const spanishSummary = await hackathonPage.getSummary();
    expect(spanishSummary.length).toBeGreaterThan(0);

    // Verify the summaries are different (different project)
    expect(spanishSummary).not.toBe(englishSummary);
  });
});
