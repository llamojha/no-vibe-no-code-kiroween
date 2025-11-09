import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Doctor Frankenstein feature
 * Provides selectors and actions for the Doctor Frankenstein idea generator page
 */
export class FrankensteinPage {
  readonly page: Page;
  readonly modeSelector: Locator;
  readonly languageSelect: Locator;
  readonly elementInput: Locator;
  readonly addElementButton: Locator;
  readonly generateButton: Locator;
  readonly ideaTitle: Locator;
  readonly ideaDescription: Locator;
  readonly coreConcept: Locator;
  readonly problemStatement: Locator;
  readonly proposedSolution: Locator;
  readonly metricsSection: Locator;
  readonly slotMachineAnimation: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly resultsContainer: Locator;
  readonly elementsList: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Define locators for Doctor Frankenstein page elements
    // Using text-based selectors since data-testid attributes are not present
    this.modeSelector = page.locator('button:has-text("Tech Companies"), button:has-text("AWS Services")').first();
    this.languageSelect = page.locator('[data-testid="language-toggle"]');
    this.elementInput = page.locator('input[type="text"]'); // Fallback
    this.addElementButton = page.locator('button:has-text("Add")'); // Fallback
    this.generateButton = page.locator('button:has-text("Create Frankenstein"), button:has-text("Accept & Generate Idea")').first();
    this.ideaTitle = page.locator('h1').filter({ hasText: /^(?!.*Doctor Frankenstein)/ }).first();
    this.ideaDescription = page.locator('text=Idea Description').locator('..').locator('div').last();
    this.coreConcept = page.locator('text=Core Concept').locator('..').locator('div').last();
    this.problemStatement = page.locator('text=Problem Statement').locator('..').locator('div').last();
    this.proposedSolution = page.locator('text=Proposed Solution').locator('..').locator('div').last();
    this.metricsSection = page.locator('text=Originality, text=Feasibility, text=Impact').first();
    this.slotMachineAnimation = page.locator('.slot-machine, [class*="slot"]').first();
    this.loadingSpinner = page.locator('text=Bringing your Frankenstein to life, text=Loading').first();
    this.errorMessage = page.locator('.bg-red-900, [class*="error"]').first();
    this.resultsContainer = page.locator('text=Idea Description').locator('..').locator('..').first();
    this.elementsList = page.locator('.slot-machine, [class*="slot"]').first();
  }

  async navigate(): Promise<void> {
    await this.page.goto('/doctor-frankenstein');
    await this.page.waitForLoadState('networkidle');
  }

  async selectMode(mode: 'companies' | 'aws'): Promise<void> {
    const buttonText = mode === 'companies' ? 'Tech Companies' : 'AWS Services';
    await this.page.locator(`button:has-text("${buttonText}")`).click();
    await this.page.waitForTimeout(500); // Wait for mode switch
  }

  async selectLanguage(language: 'en' | 'es'): Promise<void> {
    // Click the language toggle button
    const currentLang = await this.page.locator('[data-testid="language-toggle"]').textContent();
    const needsChange = (language === 'en' && currentLang?.includes('ES')) || 
                        (language === 'es' && currentLang?.includes('EN'));
    
    if (needsChange) {
      await this.page.locator('[data-testid="language-toggle"]').click();
      await this.page.waitForTimeout(300);
    }
  }

  async addElement(element: string): Promise<void> {
    // Not used in actual workflow - elements are randomly selected
    console.warn('addElement is not used in Doctor Frankenstein workflow');
  }

  async addMultipleElements(elements: string[]): Promise<void> {
    // Not used in actual workflow - elements are randomly selected
    console.warn('addMultipleElements is not used in Doctor Frankenstein workflow');
  }

  async clickGenerate(): Promise<void> {
    // Click "Create Frankenstein" button
    const createButton = this.page.locator('button:has-text("Create Frankenstein")');
    if (await createButton.isVisible()) {
      await createButton.click();
      // Wait for slot machine animation
      await this.page.waitForTimeout(3500); // Animation takes ~3 seconds
      
      // Click "Accept & Generate Idea" button
      const acceptButton = this.page.locator('button:has-text("Accept & Generate Idea")');
      await acceptButton.waitFor({ state: 'visible', timeout: 5000 });
      await acceptButton.click();
    }
  }

  async waitForResults(): Promise<void> {
    await this.ideaTitle.waitFor({ state: 'visible', timeout: 30000 });
  }

  async waitForSlotMachineAnimation(): Promise<void> {
    try {
      await this.slotMachineAnimation.waitFor({ state: 'visible', timeout: 5000 });
      await this.slotMachineAnimation.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Animation might not appear or complete quickly
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

  async getIdeaTitle(): Promise<string> {
    return await this.ideaTitle.textContent() || '';
  }

  async getIdeaDescription(): Promise<string> {
    return await this.ideaDescription.textContent() || '';
  }

  async getCoreConcept(): Promise<string> {
    return await this.coreConcept.textContent() || '';
  }

  async getProblemStatement(): Promise<string> {
    return await this.problemStatement.textContent() || '';
  }

  async getProposedSolution(): Promise<string> {
    return await this.proposedSolution.textContent() || '';
  }

  async getAddedElements(): Promise<string[]> {
    const items = await this.elementsList.locator('[data-testid="element-item"]').allTextContents();
    return items;
  }

  async isSlotMachineVisible(): Promise<boolean> {
    return await this.slotMachineAnimation.isVisible();
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
   * Complete workflow: select mode, add elements, and generate idea
   */
  async generateIdea(
    mode: 'companies' | 'aws',
    elements: string[],
    language: 'en' | 'es' = 'en'
  ): Promise<void> {
    await this.selectMode(mode);
    await this.selectLanguage(language);
    await this.addMultipleElements(elements);
    await this.clickGenerate();
  }
}
