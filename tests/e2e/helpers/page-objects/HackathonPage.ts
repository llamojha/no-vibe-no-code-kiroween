import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Hackathon Analyzer feature
 * Provides selectors and actions for the Kiroween Hackathon Analyzer page
 */
export class HackathonPage {
  readonly page: Page;
  readonly projectNameInput: Locator;
  readonly descriptionInput: Locator;
  readonly kiroUsageInput: Locator;
  readonly languageSelect: Locator;
  readonly analyzeButton: Locator;
  readonly scoreElement: Locator;
  readonly categoryRecommendation: Locator;
  readonly summaryElement: Locator;
  readonly kiroUsageAnalysis: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly resultsContainer: Locator;

  constructor(page: Page) {
    this.page = page;

    // Define locators for hackathon analyzer page elements
    // Note: The form only has a description field, not separate name/kiro usage fields
    this.projectNameInput = page.locator("#project-description"); // Using description field
    this.descriptionInput = page.locator("#project-description");
    this.kiroUsageInput = page.locator("#project-description"); // Same field
    this.languageSelect = page.locator(
      'button[aria-label*="language"], button[aria-label*="idioma"]'
    );
    this.analyzeButton = page.locator('button[type="submit"]');
    this.scoreElement = page.locator("text=/score|puntuación/i").first();
    this.categoryRecommendation = page
      .locator(
        "text=/category|categoría|resurrection|frankenstein|skeleton|costume/i"
      )
      .first();
    this.summaryElement = page
      .locator("text=/summary|resumen|analysis|análisis/i")
      .first();
    this.kiroUsageAnalysis = page
      .locator("text=/kiro.*usage|uso.*kiro/i")
      .first();
    this.loadingSpinner = page.locator('svg.animate-spin, [role="status"]');
    this.errorMessage = page.locator("text=/error|failed|falló/i").first();
    this.resultsContainer = page.locator(
      'section[aria-labelledby="analysis-results-heading"]'
    );
  }

  async navigate(): Promise<void> {
    // Use commit navigation strategy for better performance with slow pages
    await this.page.goto("/kiroween-analyzer", {
      waitUntil: "commit",
      timeout: 90000,
    });
    // Wait for the form to be ready with extended timeout for performance issues
    await this.descriptionInput.waitFor({ state: "visible", timeout: 60000 });
  }

  async enterProjectDetails(
    name: string,
    description: string,
    kiroUsage: string
  ): Promise<void> {
    // Combine all fields into description since the form only has one field
    const fullDescription = `Project: ${name}\n\n${description}\n\nKiro Usage: ${kiroUsage}`;
    await this.descriptionInput.waitFor({ state: "visible", timeout: 10000 });
    await this.descriptionInput.click(); // Focus the input
    await this.descriptionInput.fill(fullDescription);
    // Trigger input event for form validation
    await this.descriptionInput.press("Space");
    await this.descriptionInput.press("Backspace");
    await this.page.waitForTimeout(300); // Give validation time to run
  }

  async enterProjectName(name: string): Promise<void> {
    await this.descriptionInput.fill(name);
  }

  async enterDescription(description: string): Promise<void> {
    await this.descriptionInput.fill(description);
  }

  async enterKiroUsage(kiroUsage: string): Promise<void> {
    // Append to existing description
    const currentValue = await this.descriptionInput.inputValue();
    await this.descriptionInput.fill(
      `${currentValue}\n\nKiro Usage: ${kiroUsage}`
    );
  }

  async selectLanguage(language: "en" | "es"): Promise<void> {
    // Language toggle is in the header, click it if we need to change language
    // For now, we'll just skip this since the language is set globally
    // The mock will respond based on the locale context
  }

  async clickAnalyze(): Promise<void> {
    // Wait for button to be enabled (form validation)
    await this.analyzeButton.waitFor({ state: "visible", timeout: 5000 });
    await this.page.waitForTimeout(500); // Give form validation time to process

    // Check if button is enabled, if not wait a bit more
    const isEnabled = await this.analyzeButton.isEnabled();
    if (!isEnabled) {
      await this.page.waitForTimeout(1000);
    }

    await this.analyzeButton.click({ force: false, timeout: 20000 });
  }

  async waitForResults(): Promise<void> {
    await this.scoreElement.waitFor({ state: "visible", timeout: 30000 });
  }

  async waitForLoadingToComplete(): Promise<void> {
    // Wait for loading spinner to appear (if it does)
    try {
      await this.loadingSpinner.waitFor({ state: "visible", timeout: 1000 });
      // Then wait for it to disappear
      await this.loadingSpinner.waitFor({ state: "hidden", timeout: 30000 });
    } catch {
      // Loading spinner might not appear for fast operations
    }
  }

  async getScore(): Promise<string> {
    return (await this.scoreElement.textContent()) || "";
  }

  async getCategoryRecommendation(): Promise<string> {
    return (await this.categoryRecommendation.textContent()) || "";
  }

  async getSummary(): Promise<string> {
    return (await this.summaryElement.textContent()) || "";
  }

  async getKiroUsageAnalysis(): Promise<string> {
    return (await this.kiroUsageAnalysis.textContent()) || "";
  }

  async isLoadingVisible(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  async isResultsVisible(): Promise<boolean> {
    return await this.resultsContainer.isVisible();
  }

  /**
   * Complete workflow: enter project details and analyze
   */
  async analyzeProject(
    name: string,
    description: string,
    kiroUsage: string,
    language: "en" | "es" = "en"
  ): Promise<void> {
    await this.enterProjectDetails(name, description, kiroUsage);
    await this.selectLanguage(language);
    await this.clickAnalyze();
  }
}
