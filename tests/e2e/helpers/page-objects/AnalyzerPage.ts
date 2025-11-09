import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Analyzer feature
 * Provides selectors and actions for the Startup Idea Analyzer page
 */
export class AnalyzerPage {
  readonly page: Page;
  readonly ideaInput: Locator;
  readonly languageToggle: Locator;
  readonly languageEnButton: Locator;
  readonly languageEsButton: Locator;
  readonly analyzeButton: Locator;
  readonly scoreElement: Locator;
  readonly summaryElement: Locator;
  readonly strengthsList: Locator;
  readonly weaknessesList: Locator;
  readonly opportunitiesList: Locator;
  readonly threatsList: Locator;
  readonly suggestionsList: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly resultsContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Define locators for analyzer page elements
    this.ideaInput = page.locator('[data-testid="idea-input"]');
    this.languageToggle = page.locator('[data-testid="language-toggle"]');
    this.languageEnButton = page.locator('[data-testid="language-en"]');
    this.languageEsButton = page.locator('[data-testid="language-es"]');
    this.analyzeButton = page.locator('[data-testid="analyze-button"]');
    this.scoreElement = page.locator('[data-testid="analysis-score"]');
    this.summaryElement = page.locator('[data-testid="analysis-summary"]');
    this.strengthsList = page.locator('[data-testid="strengths-list"]');
    this.weaknessesList = page.locator('[data-testid="weaknesses-list"]');
    this.opportunitiesList = page.locator('[data-testid="opportunities-list"]');
    this.threatsList = page.locator('[data-testid="threats-list"]');
    this.suggestionsList = page.locator('[data-testid="suggestions-list"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.resultsContainer = page.locator('[data-testid="results-container"]');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/analyzer');
    await this.page.waitForLoadState('networkidle');
  }

  async enterIdea(idea: string): Promise<void> {
    await this.ideaInput.fill(idea);
  }

  async selectLanguage(language: 'en' | 'es'): Promise<void> {
    if (language === 'en') {
      await this.languageEnButton.click();
    } else {
      await this.languageEsButton.click();
    }
  }

  async clickAnalyze(): Promise<void> {
    await this.analyzeButton.click();
  }

  async waitForResults(): Promise<void> {
    await this.scoreElement.waitFor({ state: 'visible', timeout: 30000 });
  }

  async waitForLoadingToComplete(): Promise<void> {
    // Wait for loading spinner to appear (if it does)
    try {
      await this.loadingSpinner.waitFor({ state: 'visible', timeout: 1000 });
      // Then wait for it to disappear
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
    } catch {
      // Loading spinner might not appear for fast operations
    }
  }

  async getScore(): Promise<string> {
    return await this.scoreElement.textContent() || '';
  }

  async getSummary(): Promise<string> {
    return await this.summaryElement.textContent() || '';
  }

  async getStrengths(): Promise<string[]> {
    const items = await this.strengthsList.locator('li').allTextContents();
    return items;
  }

  async getWeaknesses(): Promise<string[]> {
    const items = await this.weaknessesList.locator('li').allTextContents();
    return items;
  }

  async isLoadingVisible(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async isResultsVisible(): Promise<boolean> {
    return await this.resultsContainer.isVisible();
  }

  /**
   * Complete workflow: enter idea, select language, and analyze
   */
  async analyzeIdea(idea: string, language: 'en' | 'es' = 'en'): Promise<void> {
    await this.enterIdea(idea);
    await this.selectLanguage(language);
    await this.clickAnalyze();
  }
}
