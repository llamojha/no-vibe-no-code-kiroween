import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Idea Panel feature
 * Provides selectors and actions for the Idea Panel page
 */
export class IdeaPanelPage {
  readonly page: Page;
  readonly ideaText: Locator;
  readonly ideaSource: Locator;
  readonly createdAt: Locator;
  readonly projectStatusDropdown: Locator;
  readonly notesTextarea: Locator;
  readonly saveNotesButton: Locator;
  readonly tagsInput: Locator;
  readonly addTagButton: Locator;
  readonly tagsList: Locator;
  readonly documentsList: Locator;
  readonly analyzeButton: Locator;
  readonly analyzeDropdown: Locator;
  readonly analyzeStartupOption: Locator;
  readonly analyzeHackathonOption: Locator;
  readonly manageButton: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Define locators for idea panel page elements
    this.ideaText = page.locator('[data-testid="idea-text"]');
    this.ideaSource = page.locator('[data-testid="idea-source"]');
    this.createdAt = page.locator('[data-testid="created-at"]');
    this.projectStatusDropdown = page.locator(
      '[data-testid="project-status-dropdown"]'
    );
    this.notesTextarea = page.locator('[data-testid="notes-textarea"]');
    this.saveNotesButton = page.locator('[data-testid="save-notes-button"]');
    this.tagsInput = page.locator('[data-testid="tags-input"]');
    this.addTagButton = page.locator('[data-testid="add-tag-button"]');
    this.tagsList = page.locator('[data-testid="tags-list"]');
    this.documentsList = page.locator('[data-testid="documents-list"]');
    this.analyzeButton = page.locator('[data-testid="analyze-button"]');
    this.analyzeDropdown = page.locator('[data-testid="analyze-dropdown"]');
    this.analyzeStartupOption = page.locator(
      '[data-testid="analyze-startup-option"]'
    );
    this.analyzeHackathonOption = page.locator(
      '[data-testid="analyze-hackathon-option"]'
    );
    this.manageButton = page.locator(
      'button:has-text("Manage"), a:has-text("Manage")'
    );
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async navigate(ideaId: string): Promise<void> {
    await this.page.goto(`/idea/${ideaId}`, {
      waitUntil: "commit",
      timeout: 90000,
    });
    // Wait for the idea text to be visible
    await this.ideaText.waitFor({ state: "visible", timeout: 60000 });
  }

  async waitForDataLoad(): Promise<void> {
    await this.ideaText.waitFor({ state: "visible", timeout: 10000 });
  }

  async getIdeaText(): Promise<string> {
    return (await this.ideaText.textContent()) || "";
  }

  async getIdeaSource(): Promise<string> {
    return (await this.ideaSource.textContent()) || "";
  }

  async getCreatedAt(): Promise<string> {
    return (await this.createdAt.textContent()) || "";
  }

  async getDocumentsCount(): Promise<number> {
    try {
      const items = await this.documentsList
        .locator('[data-testid="document-item"]')
        .count();
      return items;
    } catch {
      return 0;
    }
  }

  async getDocumentTitle(index: number): Promise<string> {
    const item = this.documentsList
      .locator('[data-testid="document-item"]')
      .nth(index);
    return (
      (await item.locator('[data-testid="document-title"]').textContent()) || ""
    );
  }

  async updateProjectStatus(status: string): Promise<void> {
    await this.projectStatusDropdown.click();
    await this.page.locator(`option:has-text("${status}")`).click();
    await this.page.waitForTimeout(500); // Wait for save
  }

  async updateNotes(notes: string): Promise<void> {
    await this.notesTextarea.fill(notes);
    await this.saveNotesButton.click();
    await this.page.waitForTimeout(500); // Wait for save
  }

  async addTag(tag: string): Promise<void> {
    await this.tagsInput.fill(tag);
    await this.addTagButton.click();
    await this.page.waitForTimeout(300); // Wait for tag to be added
  }

  async getTags(): Promise<string[]> {
    const items = await this.tagsList
      .locator('[data-testid="tag-item"]')
      .allTextContents();
    return items;
  }

  async clickAnalyzeButton(): Promise<void> {
    await this.analyzeButton.click();
  }

  async clickAnalyzeStartup(): Promise<void> {
    // Click the analyze button to open dropdown
    await this.analyzeButton.click();
    await this.page.waitForTimeout(300);
    // Click the startup option
    await this.analyzeStartupOption.click();
  }

  async clickAnalyzeHackathon(): Promise<void> {
    // Click the analyze button to open dropdown
    await this.analyzeButton.click();
    await this.page.waitForTimeout(300);
    // Click the hackathon option
    await this.analyzeHackathonOption.click();
  }

  async clickManageButton(): Promise<void> {
    await this.manageButton.click();
  }

  async waitForLoadingToComplete(): Promise<void> {
    try {
      await this.loadingSpinner.waitFor({ state: "visible", timeout: 1000 });
      await this.loadingSpinner.waitFor({ state: "hidden", timeout: 30000 });
    } catch {
      // Loading spinner might not appear for fast operations
    }
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
}
