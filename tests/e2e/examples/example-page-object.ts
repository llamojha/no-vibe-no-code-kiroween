/**
 * Example Page Object Model
 * 
 * This file demonstrates best practices for creating page objects
 * that encapsulate page interactions and selectors.
 */

import { Page, Locator } from '@playwright/test';

/**
 * ExamplePage
 * 
 * Page object for the Example feature page.
 * 
 * Best Practices:
 * - Encapsulate all selectors as private properties
 * - Provide public methods for user actions
 * - Return Locators for assertions in tests
 * - Keep methods focused and single-purpose
 * - Use descriptive method names
 */
export class ExamplePage {
  // Page reference
  readonly page: Page;

  // Selectors as private properties
  private readonly inputField: Locator;
  private readonly submitButton: Locator;
  private readonly cancelButton: Locator;
  private readonly languageSelect: Locator;
  private readonly resultContainer: Locator;
  private readonly loadingIndicator: Locator;
  private readonly errorContainer: Locator;

  /**
   * Constructor
   * 
   * Initialize the page object with a Playwright Page instance.
   * Define all selectors here for easy maintenance.
   */
  constructor(page: Page) {
    this.page = page;

    // Initialize selectors
    // Use data-testid attributes for stable selectors
    this.inputField = page.locator('[data-testid="example-input"]');
    this.submitButton = page.locator('[data-testid="submit-button"]');
    this.cancelButton = page.locator('[data-testid="cancel-button"]');
    this.languageSelect = page.locator('[data-testid="language-select"]');
    this.resultContainer = page.locator('[data-testid="result-container"]');
    this.loadingIndicator = page.locator('[data-testid="loading-spinner"]');
    this.errorContainer = page.locator('[data-testid="error-message"]');
  }

  /**
   * Navigation Methods
   * 
   * Methods for navigating to the page and related pages.
   */

  async navigate(): Promise<void> {
    await this.page.goto('/example');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateWithParams(params: Record<string, string>): Promise<void> {
    const queryString = new URLSearchParams(params).toString();
    await this.page.goto(`/example?${queryString}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Input Methods
   * 
   * Methods for entering data into form fields.
   */

  async enterText(text: string): Promise<void> {
    await this.inputField.clear();
    await this.inputField.fill(text);
  }

  async appendText(text: string): Promise<void> {
    await this.inputField.type(text);
  }

  async clearInput(): Promise<void> {
    await this.inputField.clear();
  }

  async selectLanguage(language: 'en' | 'es'): Promise<void> {
    await this.languageSelect.selectOption(language);
  }

  /**
   * Action Methods
   * 
   * Methods for performing user actions like clicking buttons.
   */

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async submitAndWaitForResult(): Promise<void> {
    await this.submitButton.click();
    await this.resultContainer.waitFor({ state: 'visible' });
  }

  /**
   * Getter Methods
   * 
   * Methods that return Locators for assertions in tests.
   * These allow tests to perform their own assertions.
   */

  get input(): Locator {
    return this.inputField;
  }

  get submitBtn(): Locator {
    return this.submitButton;
  }

  get result(): Locator {
    return this.resultContainer;
  }

  get loading(): Locator {
    return this.loadingIndicator;
  }

  get error(): Locator {
    return this.errorContainer;
  }

  /**
   * State Check Methods
   * 
   * Methods for checking the current state of the page.
   */

  async isLoading(): Promise<boolean> {
    return await this.loadingIndicator.isVisible();
  }

  async hasError(): Promise<boolean> {
    return await this.errorContainer.isVisible();
  }

  async hasResult(): Promise<boolean> {
    return await this.resultContainer.isVisible();
  }

  async isSubmitEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }

  /**
   * Data Extraction Methods
   * 
   * Methods for extracting data from the page.
   */

  async getInputValue(): Promise<string> {
    return await this.inputField.inputValue();
  }

  async getResultText(): Promise<string> {
    return await this.resultContainer.textContent() || '';
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorContainer.textContent() || '';
  }

  async getSelectedLanguage(): Promise<string> {
    return await this.languageSelect.inputValue();
  }

  /**
   * Complex Interaction Methods
   * 
   * Methods that combine multiple actions into a single workflow.
   */

  async fillFormAndSubmit(data: {
    text: string;
    language: 'en' | 'es';
  }): Promise<void> {
    await this.enterText(data.text);
    await this.selectLanguage(data.language);
    await this.submit();
  }

  async waitForLoadingToComplete(): Promise<void> {
    // Wait for loading to appear
    await this.loadingIndicator.waitFor({ state: 'visible', timeout: 1000 })
      .catch(() => {
        // Loading might be too fast to catch
      });
    
    // Wait for loading to disappear
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async retrySubmitOnError(maxRetries: number = 3): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      await this.submit();
      
      // Wait a bit for response
      await this.page.waitForTimeout(1000);
      
      // Check if successful
      if (await this.hasResult()) {
        return;
      }
      
      // Check if error
      if (await this.hasError()) {
        console.log(`Attempt ${i + 1} failed, retrying...`);
        continue;
      }
    }
    
    throw new Error(`Failed after ${maxRetries} retries`);
  }

  /**
   * Validation Methods
   * 
   * Methods for validating page state and content.
   */

  async validateFormFields(): Promise<{
    hasInput: boolean;
    hasSubmit: boolean;
    hasLanguageSelect: boolean;
  }> {
    return {
      hasInput: await this.inputField.isVisible(),
      hasSubmit: await this.submitButton.isVisible(),
      hasLanguageSelect: await this.languageSelect.isVisible(),
    };
  }

  async validateResultStructure(): Promise<boolean> {
    // Check if result has expected child elements
    const title = this.resultContainer.locator('[data-testid="result-title"]');
    const content = this.resultContainer.locator('[data-testid="result-content"]');
    
    return (await title.isVisible()) && (await content.isVisible());
  }

  /**
   * Screenshot Methods
   * 
   * Methods for capturing screenshots of specific elements.
   */

  async screenshotResult(path: string): Promise<void> {
    await this.resultContainer.screenshot({ path });
  }

  async screenshotFullPage(path: string): Promise<void> {
    await this.page.screenshot({ path, fullPage: true });
  }

  /**
   * Utility Methods
   * 
   * Helper methods for common operations.
   */

  async scrollToResult(): Promise<void> {
    await this.resultContainer.scrollIntoViewIfNeeded();
  }

  async focusInput(): Promise<void> {
    await this.inputField.focus();
  }

  async pressEnterOnInput(): Promise<void> {
    await this.inputField.press('Enter');
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Mock Configuration Methods
   * 
   * Methods for configuring mock behavior during tests.
   */

  async setMockScenario(scenario: 'success' | 'api_error' | 'timeout'): Promise<void> {
    await this.page.addInitScript((scenario) => {
      localStorage.setItem('FF_MOCK_SCENARIO', scenario);
    }, scenario);
    
    // Reload to apply
    await this.navigate();
  }

  async enableLatencySimulation(min: number = 500, max: number = 2000): Promise<void> {
    await this.page.addInitScript(({ min, max }) => {
      localStorage.setItem('FF_SIMULATE_LATENCY', 'true');
      localStorage.setItem('FF_MIN_LATENCY', min.toString());
      localStorage.setItem('FF_MAX_LATENCY', max.toString());
    }, { min, max });
    
    // Reload to apply
    await this.navigate();
  }

  async disableLatencySimulation(): Promise<void> {
    await this.page.addInitScript(() => {
      localStorage.setItem('FF_SIMULATE_LATENCY', 'false');
    });
    
    // Reload to apply
    await this.navigate();
  }
}

/**
 * Usage Example:
 * 
 * ```typescript
 * import { test, expect } from '@playwright/test';
 * import { ExamplePage } from './example-page-object';
 * 
 * test('should submit form successfully', async ({ page }) => {
 *   const examplePage = new ExamplePage(page);
 *   
 *   await examplePage.navigate();
 *   await examplePage.fillFormAndSubmit({
 *     text: 'Test input',
 *     language: 'en'
 *   });
 *   
 *   await expect(examplePage.result).toBeVisible();
 *   await expect(examplePage.result).toContainText('success');
 * });
 * ```
 */
