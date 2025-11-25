import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Document Generator feature
 * Provides selectors and actions for the document generator pages
 * (PRD, Technical Design, Architecture, Roadmap)
 */
export class DocumentGeneratorPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly ideaContextSection: Locator;
  readonly ideaText: Locator;
  readonly analysisSummary: Locator;
  readonly existingDocsSection: Locator;
  readonly creditCostSection: Locator;
  readonly creditCost: Locator;
  readonly userBalance: Locator;
  readonly generateButton: Locator;
  readonly backButton: Locator;
  readonly loadingOverlay: Locator;
  readonly loadingMessage: Locator;
  readonly errorMessage: Locator;
  readonly retryButton: Locator;
  readonly insufficientCreditsWarning: Locator;
  readonly getMoreCreditsButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Define locators for document generator page elements
    this.pageTitle = page.locator("h1");
    this.ideaContextSection = page.locator(
      'section[aria-labelledby="idea-context-heading"]'
    );
    this.ideaText = page.locator(
      'section[aria-labelledby="idea-context-heading"] p.text-slate-300'
    );
    this.analysisSummary = page.locator(
      'section[aria-labelledby="idea-context-heading"] h3:has-text("Analysis Summary")'
    );
    this.existingDocsSection = page.locator(
      'section[aria-labelledby="existing-docs-heading"]'
    );
    this.creditCostSection = page.locator(
      'section[aria-labelledby="credit-cost-heading"]'
    );
    this.creditCost = page.locator(
      'section[aria-labelledby="credit-cost-heading"] p.text-purple-400'
    );
    this.userBalance = page.locator(
      'section[aria-labelledby="credit-cost-heading"] p.text-2xl'
    );
    this.generateButton = page.locator(
      'button:has-text("Generate"), button:has-text("Generating")'
    );
    this.backButton = page.locator('button[aria-label="Back to Idea Panel"]');
    this.loadingOverlay = page.locator('[data-testid="loading-overlay"]');
    this.loadingMessage = page.locator('[data-testid="loading-message"]');
    this.errorMessage = page.locator('div[role="alert"]');
    this.retryButton = page.locator('button:has-text("Try Again")');
    this.insufficientCreditsWarning = page.locator(
      ".bg-red-900\\/30.border-red-600"
    );
    this.getMoreCreditsButton = page.locator(
      'button:has-text("Get More Credits")'
    );
  }

  /**
   * Navigate to a specific document generator page
   */
  async navigate(
    documentType: "prd" | "technical-design" | "architecture" | "roadmap",
    ideaId: string
  ): Promise<void> {
    await this.page.goto(`/generate/${documentType}/${ideaId}`, {
      waitUntil: "commit",
      timeout: 90000,
    });
    // Wait for the page to load
    await this.pageTitle.waitFor({ state: "visible", timeout: 60000 });
  }

  /**
   * Navigate to PRD generator page
   */
  async navigateToPRD(ideaId: string): Promise<void> {
    await this.navigate("prd", ideaId);
  }

  /**
   * Navigate to Technical Design generator page
   */
  async navigateToTechnicalDesign(ideaId: string): Promise<void> {
    await this.navigate("technical-design", ideaId);
  }

  /**
   * Navigate to Architecture generator page
   */
  async navigateToArchitecture(ideaId: string): Promise<void> {
    await this.navigate("architecture", ideaId);
  }

  /**
   * Navigate to Roadmap generator page
   */
  async navigateToRoadmap(ideaId: string): Promise<void> {
    await this.navigate("roadmap", ideaId);
  }

  /**
   * Wait for page data to load
   */
  async waitForDataLoad(): Promise<void> {
    await this.ideaContextSection.waitFor({ state: "visible", timeout: 30000 });
  }

  /**
   * Get the page title text
   */
  async getPageTitle(): Promise<string> {
    return (await this.pageTitle.textContent()) || "";
  }

  /**
   * Get the idea text displayed on the page
   */
  async getIdeaText(): Promise<string> {
    return (await this.ideaText.textContent()) || "";
  }

  /**
   * Check if analysis summary is visible
   */
  async hasAnalysisSummary(): Promise<boolean> {
    return await this.analysisSummary.isVisible();
  }

  /**
   * Check if existing documents section is visible
   */
  async hasExistingDocuments(): Promise<boolean> {
    return await this.existingDocsSection.isVisible();
  }

  /**
   * Get the credit cost displayed
   */
  async getCreditCost(): Promise<string> {
    return (await this.creditCost.textContent()) || "";
  }

  /**
   * Get the user's credit balance displayed
   */
  async getUserBalance(): Promise<string> {
    return (await this.userBalance.textContent()) || "";
  }

  /**
   * Check if generate button is enabled
   */
  async isGenerateButtonEnabled(): Promise<boolean> {
    const isDisabled = await this.generateButton.isDisabled();
    return !isDisabled;
  }

  /**
   * Click the generate button
   */
  async clickGenerate(): Promise<void> {
    await this.generateButton.click();
  }

  /**
   * Click the back button
   */
  async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  /**
   * Wait for generation to complete (loading overlay to disappear)
   */
  async waitForGenerationComplete(timeout: number = 60000): Promise<void> {
    try {
      // Wait for loading overlay to appear
      await this.loadingOverlay.waitFor({ state: "visible", timeout: 5000 });
      // Then wait for it to disappear
      await this.loadingOverlay.waitFor({ state: "hidden", timeout });
    } catch {
      // Loading overlay might not appear for fast operations or errors
    }
  }

  /**
   * Check if loading overlay is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingOverlay.isVisible();
  }

  /**
   * Get the loading message
   */
  async getLoadingMessage(): Promise<string> {
    return (await this.loadingMessage.textContent()) || "";
  }

  /**
   * Check if error message is visible
   */
  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get the error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  /**
   * Click the retry button
   */
  async clickRetry(): Promise<void> {
    await this.retryButton.click();
  }

  /**
   * Check if insufficient credits warning is visible
   */
  async hasInsufficientCreditsWarning(): Promise<boolean> {
    return await this.insufficientCreditsWarning.isVisible();
  }

  /**
   * Click the "Get More Credits" button
   */
  async clickGetMoreCredits(): Promise<void> {
    await this.getMoreCreditsButton.click();
  }

  /**
   * Wait for navigation to Idea Panel after successful generation
   */
  async waitForNavigationToIdeaPanel(
    ideaId: string,
    timeout: number = 30000
  ): Promise<void> {
    await this.page.waitForURL(`**/idea/${ideaId}`, { timeout });
  }
}
