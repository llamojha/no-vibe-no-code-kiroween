import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Dashboard feature
 * Provides selectors and actions for the User Dashboard page
 */
export class DashboardPage {
  readonly page: Page;
  readonly analysesList: Locator;
  readonly hackathonProjectsList: Locator;
  readonly frankensteinIdeasList: Locator;
  readonly emptyStateMessage: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly userGreeting: Locator;
  readonly statsSection: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Define locators for dashboard page elements
    this.analysesList = page.locator('[data-testid="analyses-list"]');
    this.hackathonProjectsList = page.locator('[data-testid="hackathon-projects-list"]');
    this.frankensteinIdeasList = page.locator('[data-testid="frankenstein-ideas-list"]');
    this.emptyStateMessage = page.locator('[data-testid="empty-state"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.userGreeting = page.locator('[data-testid="user-greeting"]');
    this.statsSection = page.locator('[data-testid="stats-section"]');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForDataLoad(): Promise<void> {
    // Wait for either analyses list or empty state to appear
    try {
      await Promise.race([
        this.analysesList.waitFor({ state: 'visible', timeout: 10000 }),
        this.emptyStateMessage.waitFor({ state: 'visible', timeout: 10000 }),
      ]);
    } catch {
      // If neither appears, the page might still be loading
      await this.page.waitForLoadState('networkidle');
    }
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

  async getAnalysesCount(): Promise<number> {
    try {
      const items = await this.analysesList.locator('[data-testid="analysis-item"]').count();
      return items;
    } catch {
      return 0;
    }
  }

  async getHackathonProjectsCount(): Promise<number> {
    try {
      const items = await this.hackathonProjectsList.locator('[data-testid="project-item"]').count();
      return items;
    } catch {
      return 0;
    }
  }

  async getFrankensteinIdeasCount(): Promise<number> {
    try {
      const items = await this.frankensteinIdeasList.locator('[data-testid="frankenstein-item"]').count();
      return items;
    } catch {
      return 0;
    }
  }

  async clickAnalysis(index: number): Promise<void> {
    await this.analysesList.locator('[data-testid="analysis-item"]').nth(index).click();
  }

  async clickHackathonProject(index: number): Promise<void> {
    await this.hackathonProjectsList.locator('[data-testid="project-item"]').nth(index).click();
  }

  async clickFrankensteinIdea(index: number): Promise<void> {
    await this.frankensteinIdeasList.locator('[data-testid="frankenstein-item"]').nth(index).click();
  }

  async isEmptyStateVisible(): Promise<boolean> {
    try {
      return await this.emptyStateMessage.isVisible();
    } catch {
      return false;
    }
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

  async getUserGreeting(): Promise<string> {
    return await this.userGreeting.textContent() || '';
  }

  async getAnalysisTitle(index: number): Promise<string> {
    const item = this.analysesList.locator('[data-testid="analysis-item"]').nth(index);
    return await item.locator('[data-testid="analysis-title"]').textContent() || '';
  }

  async getAnalysisScore(index: number): Promise<string> {
    const item = this.analysesList.locator('[data-testid="analysis-item"]').nth(index);
    return await item.locator('[data-testid="analysis-score"]').textContent() || '';
  }
}
