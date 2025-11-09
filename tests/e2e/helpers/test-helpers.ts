import { Page, expect, Locator } from '@playwright/test';

/**
 * Common helper functions for E2E tests
 * Provides utilities for common actions, waiting, and data management
 */

/**
 * Wait for an element to be visible with custom timeout
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingToComplete(page: Page): Promise<void> {
  const loadingSelector = '[data-testid="loading-spinner"]';
  
  // Wait for loading spinner to appear (if it does)
  try {
    await page.waitForSelector(loadingSelector, { state: 'visible', timeout: 1000 });
    // Then wait for it to disappear
    await page.waitForSelector(loadingSelector, { state: 'hidden', timeout: 30000 });
  } catch {
    // Loading spinner might not appear for fast operations
  }
}

/**
 * Fill input field and verify value
 */
export async function fillAndVerify(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  await page.fill(selector, value);
  await expect(page.locator(selector)).toHaveValue(value);
}

/**
 * Click button and wait for URL change
 */
export async function clickAndWaitForURL(
  page: Page,
  selector: string,
  urlPattern: string | RegExp
): Promise<void> {
  await Promise.all([
    page.waitForURL(urlPattern, { waitUntil: 'networkidle' }),
    page.click(selector),
  ]);
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const timestamp = Date.now();
  await page.screenshot({
    path: `tests/e2e/artifacts/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Check if element contains text
 */
export async function expectTextContent(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  await expect(page.locator(selector)).toContainText(text);
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 30000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Set mock mode environment
 */
export async function enableMockMode(page: Page): Promise<void> {
  // This would typically be set via environment variables before test execution
  // For runtime control, we can use localStorage or cookies
  await page.addInitScript(() => {
    window.localStorage.setItem('FF_USE_MOCK_API', 'true');
  });
}

/**
 * Disable mock mode
 */
export async function disableMockMode(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('FF_USE_MOCK_API', 'false');
  });
}

/**
 * Set mock scenario
 */
export async function setMockScenario(
  page: Page,
  scenario: 'success' | 'api_error' | 'timeout' | 'rate_limit'
): Promise<void> {
  await page.addInitScript((scenario) => {
    window.localStorage.setItem('FF_MOCK_SCENARIO', scenario);
  }, scenario);
}

/**
 * Enable latency simulation
 */
export async function enableLatencySimulation(
  page: Page,
  minLatency: number = 500,
  maxLatency: number = 2000
): Promise<void> {
  await page.addInitScript(({ min, max }) => {
    window.localStorage.setItem('FF_SIMULATE_LATENCY', 'true');
    window.localStorage.setItem('FF_MIN_LATENCY', min.toString());
    window.localStorage.setItem('FF_MAX_LATENCY', max.toString());
  }, { min: minLatency, max: maxLatency });
}

/**
 * Clear all test data
 */
export async function clearTestData(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

/**
 * Setup console log capture
 */
export function setupConsoleLogCapture(page: Page): string[] {
  const logs: string[] = [];
  
  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  return logs;
}

/**
 * Setup network error capture
 */
export function setupNetworkErrorCapture(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('requestfailed', (request) => {
    errors.push(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  return errors;
}

/**
 * Setup network request capture
 */
export function setupNetworkRequestCapture(page: Page): Array<{ url: string; method: string; status: number }> {
  const requests: Array<{ url: string; method: string; status: number }> = [];
  
  page.on('response', (response) => {
    requests.push({
      url: response.url(),
      method: response.request().method(),
      status: response.status(),
    });
  });
  
  return requests;
}

/**
 * Wait for multiple elements to be visible
 */
export async function waitForElements(
  page: Page,
  selectors: string[],
  timeout: number = 10000
): Promise<void> {
  await Promise.all(
    selectors.map(selector => 
      page.waitForSelector(selector, { state: 'visible', timeout })
    )
  );
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(
  page: Page,
  selector: string
): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Wait for element to be hidden
 */
export async function waitForElementToBeHidden(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Get element text content safely
 */
export async function getTextContent(
  locator: Locator
): Promise<string> {
  try {
    return await locator.textContent() || '';
  } catch {
    return '';
  }
}

/**
 * Check if element exists (without waiting)
 */
export async function elementExists(
  page: Page,
  selector: string
): Promise<boolean> {
  try {
    const count = await page.locator(selector).count();
    return count > 0;
  } catch {
    return false;
  }
}

/**
 * Retry action with exponential backoff
 */
export async function retryWithBackoff<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Wait for network idle
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}
