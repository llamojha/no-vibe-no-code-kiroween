import { Page, expect, Locator } from '@playwright/test';

/**
 * Assertion helper functions for E2E tests
 * Provides custom assertions for common test scenarios
 */

/**
 * Assert that an analysis result is displayed with valid data
 */
export async function assertAnalysisResultsDisplayed(
  page: Page,
  options: {
    expectScore?: boolean;
    expectSummary?: boolean;
    expectStrengths?: boolean;
    expectWeaknesses?: boolean;
  } = {}
): Promise<void> {
  const {
    expectScore = true,
    expectSummary = true,
    expectStrengths = true,
    expectWeaknesses = true,
  } = options;

  if (expectScore) {
    const scoreElement = page.locator('[data-testid="analysis-score"]');
    await expect(scoreElement).toBeVisible();
    const scoreText = await scoreElement.textContent();
    expect(scoreText).toBeTruthy();
  }

  if (expectSummary) {
    const summaryElement = page.locator('[data-testid="analysis-summary"]');
    await expect(summaryElement).toBeVisible();
    const summaryText = await summaryElement.textContent();
    expect(summaryText).toBeTruthy();
  }

  if (expectStrengths) {
    const strengthsList = page.locator('[data-testid="strengths-list"]');
    await expect(strengthsList).toBeVisible();
  }

  if (expectWeaknesses) {
    const weaknessesList = page.locator('[data-testid="weaknesses-list"]');
    await expect(weaknessesList).toBeVisible();
  }
}

/**
 * Assert that a hackathon analysis result is displayed with category recommendation
 */
export async function assertHackathonResultsDisplayed(
  page: Page,
  expectCategoryRecommendation: boolean = true
): Promise<void> {
  await assertAnalysisResultsDisplayed(page);

  if (expectCategoryRecommendation) {
    const categoryElement = page.locator('[data-testid="category-recommendation"]');
    await expect(categoryElement).toBeVisible();
    const categoryText = await categoryElement.textContent();
    expect(categoryText).toBeTruthy();
  }
}

/**
 * Assert that a Frankenstein idea is displayed with all required fields
 */
export async function assertFrankensteinIdeaDisplayed(
  page: Page,
  options: {
    expectTitle?: boolean;
    expectDescription?: boolean;
    expectMetrics?: boolean;
  } = {}
): Promise<void> {
  const {
    expectTitle = true,
    expectDescription = true,
    expectMetrics = true,
  } = options;

  if (expectTitle) {
    const titleElement = page.locator('[data-testid="idea-title"]');
    await expect(titleElement).toBeVisible();
    const titleText = await titleElement.textContent();
    expect(titleText).toBeTruthy();
  }

  if (expectDescription) {
    const descriptionElement = page.locator('[data-testid="idea-description"]');
    await expect(descriptionElement).toBeVisible();
    const descriptionText = await descriptionElement.textContent();
    expect(descriptionText).toBeTruthy();
  }

  if (expectMetrics) {
    const metricsElement = page.locator('[data-testid="metrics-section"]');
    await expect(metricsElement).toBeVisible();
  }
}

/**
 * Assert that an error message is displayed
 */
export async function assertErrorDisplayed(
  page: Page,
  expectedErrorText?: string
): Promise<void> {
  const errorElement = page.locator('[data-testid="error-message"]');
  await expect(errorElement).toBeVisible();

  if (expectedErrorText) {
    await expect(errorElement).toContainText(expectedErrorText);
  }
}

/**
 * Assert that loading spinner is visible
 */
export async function assertLoadingVisible(page: Page): Promise<void> {
  const loadingElement = page.locator('[data-testid="loading-spinner"]');
  await expect(loadingElement).toBeVisible();
}

/**
 * Assert that loading spinner is not visible
 */
export async function assertLoadingNotVisible(page: Page): Promise<void> {
  const loadingElement = page.locator('[data-testid="loading-spinner"]');
  await expect(loadingElement).not.toBeVisible();
}

/**
 * Assert that a locator contains specific text
 */
export async function assertContainsText(
  locator: Locator,
  text: string
): Promise<void> {
  await expect(locator).toContainText(text);
}

/**
 * Assert that a locator has specific value
 */
export async function assertHasValue(
  locator: Locator,
  value: string
): Promise<void> {
  await expect(locator).toHaveValue(value);
}

/**
 * Assert that element is visible
 */
export async function assertVisible(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
}

/**
 * Assert that element is not visible
 */
export async function assertNotVisible(locator: Locator): Promise<void> {
  await expect(locator).not.toBeVisible();
}

/**
 * Assert that element is enabled
 */
export async function assertEnabled(locator: Locator): Promise<void> {
  await expect(locator).toBeEnabled();
}

/**
 * Assert that element is disabled
 */
export async function assertDisabled(locator: Locator): Promise<void> {
  await expect(locator).toBeDisabled();
}

/**
 * Assert that page URL matches pattern
 */
export async function assertURLMatches(
  page: Page,
  pattern: string | RegExp
): Promise<void> {
  await expect(page).toHaveURL(pattern);
}

/**
 * Assert that page title matches
 */
export async function assertTitleMatches(
  page: Page,
  title: string | RegExp
): Promise<void> {
  await expect(page).toHaveTitle(title);
}

/**
 * Assert that element count matches expected
 */
export async function assertElementCount(
  locator: Locator,
  expectedCount: number
): Promise<void> {
  await expect(locator).toHaveCount(expectedCount);
}

/**
 * Assert that element has specific class
 */
export async function assertHasClass(
  locator: Locator,
  className: string
): Promise<void> {
  await expect(locator).toHaveClass(new RegExp(className));
}

/**
 * Assert that element has specific attribute
 */
export async function assertHasAttribute(
  locator: Locator,
  attribute: string,
  value?: string | RegExp
): Promise<void> {
  if (value !== undefined) {
    await expect(locator).toHaveAttribute(attribute, value);
  } else {
    await expect(locator).toHaveAttribute(attribute);
  }
}

/**
 * Assert that API response was successful
 */
export async function assertAPIResponseSuccess(
  page: Page,
  urlPattern: string | RegExp
): Promise<void> {
  const response = await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    }
  );

  expect(response.status()).toBeLessThan(400);
}

/**
 * Assert that API response failed
 */
export async function assertAPIResponseError(
  page: Page,
  urlPattern: string | RegExp,
  expectedStatus?: number
): Promise<void> {
  const response = await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    }
  );

  if (expectedStatus) {
    expect(response.status()).toBe(expectedStatus);
  } else {
    expect(response.status()).toBeGreaterThanOrEqual(400);
  }
}

/**
 * Assert that console contains specific log
 */
export function assertConsoleContains(
  logs: string[],
  expectedLog: string | RegExp
): void {
  const found = logs.some(log => {
    if (typeof expectedLog === 'string') {
      return log.includes(expectedLog);
    }
    return expectedLog.test(log);
  });

  expect(found).toBe(true);
}

/**
 * Assert that no console errors occurred
 */
export function assertNoConsoleErrors(logs: string[]): void {
  const errors = logs.filter(log => log.startsWith('[error]'));
  expect(errors).toHaveLength(0);
}

/**
 * Assert that dashboard has data
 */
export async function assertDashboardHasData(page: Page): Promise<void> {
  const analysesList = page.locator('[data-testid="analyses-list"]');
  const hackathonList = page.locator('[data-testid="hackathon-projects-list"]');
  const emptyState = page.locator('[data-testid="empty-state"]');

  // Either analyses list or hackathon list should be visible, but not empty state
  const hasAnalyses = await analysesList.isVisible();
  const hasHackathon = await hackathonList.isVisible();
  const hasEmptyState = await emptyState.isVisible();

  expect(hasAnalyses || hasHackathon).toBe(true);
  expect(hasEmptyState).toBe(false);
}

/**
 * Assert that dashboard is empty
 */
export async function assertDashboardEmpty(page: Page): Promise<void> {
  const emptyState = page.locator('[data-testid="empty-state"]');
  await expect(emptyState).toBeVisible();
}
