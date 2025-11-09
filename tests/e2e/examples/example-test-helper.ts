/**
 * Example Test Helper Functions
 * 
 * This file demonstrates best practices for creating reusable test helper
 * functions that can be shared across multiple test files.
 */

import { Page, expect } from '@playwright/test';

/**
 * Authentication Helpers
 * 
 * Functions for handling authentication in tests.
 */

export async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'testpassword123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

export async function logout(page: Page): Promise<void> {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/');
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  const userMenu = page.locator('[data-testid="user-menu"]');
  return await userMenu.isVisible();
}

/**
 * Mock Configuration Helpers
 * 
 * Functions for configuring mock behavior in tests.
 */

export async function setMockScenario(
  page: Page,
  scenario: 'success' | 'api_error' | 'timeout' | 'rate_limit' | 'invalid_input'
): Promise<void> {
  await page.addInitScript((scenario) => {
    localStorage.setItem('FF_MOCK_SCENARIO', scenario);
  }, scenario);
}

export async function enableMockMode(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('FF_USE_MOCK_API', 'true');
  });
}

export async function disableMockMode(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('FF_USE_MOCK_API', 'false');
  });
}

export async function configureMockLatency(
  page: Page,
  options: {
    enabled: boolean;
    min?: number;
    max?: number;
  }
): Promise<void> {
  await page.addInitScript((options) => {
    localStorage.setItem('FF_SIMULATE_LATENCY', options.enabled.toString());
    if (options.min !== undefined) {
      localStorage.setItem('FF_MIN_LATENCY', options.min.toString());
    }
    if (options.max !== undefined) {
      localStorage.setItem('FF_MAX_LATENCY', options.max.toString());
    }
  }, options);
}

export async function enableMockLogging(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('FF_LOG_MOCK_REQUESTS', 'true');
  });
}

/**
 * Wait Helpers
 * 
 * Functions for waiting for specific conditions.
 */

export async function waitForLoadingToComplete(page: Page): Promise<void> {
  const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
  
  // Wait for loading to appear (might be too fast)
  await loadingSpinner.waitFor({ state: 'visible', timeout: 1000 })
    .catch(() => {
      // Loading might complete before we can detect it
    });
  
  // Wait for loading to disappear
  await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
}

export async function waitForApiCall(
  page: Page,
  urlPattern: string | RegExp
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout: 10000 }
  );
}

export async function waitForElement(
  page: Page,
  selector: string,
  options?: { timeout?: number; state?: 'visible' | 'hidden' | 'attached' }
): Promise<void> {
  await page.locator(selector).waitFor({
    timeout: options?.timeout || 5000,
    state: options?.state || 'visible',
  });
}

/**
 * Assertion Helpers
 * 
 * Functions for common assertions.
 */

export async function assertElementVisible(
  page: Page,
  selector: string,
  message?: string
): Promise<void> {
  const element = page.locator(selector);
  await expect(element, message).toBeVisible();
}

export async function assertElementHidden(
  page: Page,
  selector: string,
  message?: string
): Promise<void> {
  const element = page.locator(selector);
  await expect(element, message).not.toBeVisible();
}

export async function assertTextContent(
  page: Page,
  selector: string,
  expectedText: string | RegExp,
  message?: string
): Promise<void> {
  const element = page.locator(selector);
  if (typeof expectedText === 'string') {
    await expect(element, message).toContainText(expectedText);
  } else {
    await expect(element, message).toContainText(expectedText);
  }
}

export async function assertElementCount(
  page: Page,
  selector: string,
  expectedCount: number,
  message?: string
): Promise<void> {
  const elements = page.locator(selector);
  await expect(elements, message).toHaveCount(expectedCount);
}

export async function assertUrlContains(
  page: Page,
  urlPart: string,
  message?: string
): Promise<void> {
  await expect(page, message).toHaveURL(new RegExp(urlPart));
}

/**
 * Form Helpers
 * 
 * Functions for interacting with forms.
 */

export async function fillForm(
  page: Page,
  formData: Record<string, string>
): Promise<void> {
  for (const [fieldName, value] of Object.entries(formData)) {
    const field = page.locator(`[name="${fieldName}"]`);
    await field.fill(value);
  }
}

export async function submitForm(
  page: Page,
  formSelector: string = 'form'
): Promise<void> {
  const form = page.locator(formSelector);
  await form.locator('[type="submit"]').click();
}

export async function fillAndSubmitForm(
  page: Page,
  formData: Record<string, string>,
  formSelector: string = 'form'
): Promise<void> {
  await fillForm(page, formData);
  await submitForm(page, formSelector);
}

export async function getFormValues(
  page: Page,
  formSelector: string = 'form'
): Promise<Record<string, string>> {
  const form = page.locator(formSelector);
  const inputs = await form.locator('input, textarea, select').all();
  
  const values: Record<string, string> = {};
  for (const input of inputs) {
    const name = await input.getAttribute('name');
    if (name) {
      values[name] = await input.inputValue();
    }
  }
  
  return values;
}

/**
 * Navigation Helpers
 * 
 * Functions for navigation and URL manipulation.
 */

export async function navigateWithQuery(
  page: Page,
  path: string,
  params: Record<string, string>
): Promise<void> {
  const queryString = new URLSearchParams(params).toString();
  await page.goto(`${path}?${queryString}`);
}

export async function reloadPage(page: Page): Promise<void> {
  await page.reload({ waitUntil: 'networkidle' });
}

export async function goBack(page: Page): Promise<void> {
  await page.goBack({ waitUntil: 'networkidle' });
}

export async function getCurrentUrl(page: Page): Promise<string> {
  return page.url();
}

export async function getQueryParams(page: Page): Promise<URLSearchParams> {
  const url = new URL(page.url());
  return url.searchParams;
}

/**
 * Storage Helpers
 * 
 * Functions for interacting with browser storage.
 */

export async function setLocalStorage(
  page: Page,
  key: string,
  value: string
): Promise<void> {
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, value);
  }, { key, value });
}

export async function getLocalStorage(
  page: Page,
  key: string
): Promise<string | null> {
  return await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, key);
}

export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
  });
}

export async function setSessionStorage(
  page: Page,
  key: string,
  value: string
): Promise<void> {
  await page.evaluate(({ key, value }) => {
    sessionStorage.setItem(key, value);
  }, { key, value });
}

export async function clearAllStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Screenshot Helpers
 * 
 * Functions for capturing screenshots.
 */

export async function takeScreenshot(
  page: Page,
  name: string,
  options?: {
    fullPage?: boolean;
    path?: string;
  }
): Promise<Buffer> {
  return await page.screenshot({
    fullPage: options?.fullPage || false,
    path: options?.path || `screenshots/${name}.png`,
  });
}

export async function takeElementScreenshot(
  page: Page,
  selector: string,
  name: string
): Promise<Buffer> {
  const element = page.locator(selector);
  return await element.screenshot({
    path: `screenshots/${name}.png`,
  });
}

/**
 * Console Helpers
 * 
 * Functions for capturing and analyzing console messages.
 */

export function setupConsoleListener(page: Page): {
  logs: string[];
  errors: string[];
  warnings: string[];
} {
  const logs: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      errors.push(text);
    } else if (type === 'warning') {
      warnings.push(text);
    } else {
      logs.push(text);
    }
  });
  
  return { logs, errors, warnings };
}

export async function getConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Wait a bit for any async errors
  await page.waitForTimeout(500);
  
  return errors;
}

/**
 * Network Helpers
 * 
 * Functions for intercepting and mocking network requests.
 */

export async function mockApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: {
    status?: number;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<void> {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status: response.status || 200,
      contentType: 'application/json',
      headers: response.headers,
      body: JSON.stringify(response.body),
    });
  });
}

export async function interceptApiCall(
  page: Page,
  urlPattern: string | RegExp,
  callback: (request: any) => void
): Promise<void> {
  await page.route(urlPattern, async (route) => {
    const request = route.request();
    callback(request);
    await route.continue();
  });
}

export async function blockApiCall(
  page: Page,
  urlPattern: string | RegExp
): Promise<void> {
  await page.route(urlPattern, async (route) => {
    await route.abort();
  });
}

/**
 * Timing Helpers
 * 
 * Functions for measuring performance and timing.
 */

export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;
  
  return { result, duration };
}

export async function waitForCondition(
  condition: () => Promise<boolean>,
  options?: {
    timeout?: number;
    interval?: number;
    message?: string;
  }
): Promise<void> {
  const timeout = options?.timeout || 5000;
  const interval = options?.interval || 100;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  
  throw new Error(options?.message || 'Condition not met within timeout');
}

/**
 * Retry Helpers
 * 
 * Functions for retrying operations.
 */

export async function retryOperation<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries || 3;
  const delay = options?.delay || 1000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      if (options?.onRetry) {
        options.onRetry(attempt, error as Error);
      }
      
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Should not reach here');
}

/**
 * Data Generation Helpers
 * 
 * Functions for generating test data.
 */

export function generateRandomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRandomEmail(): string {
  return `test-${generateRandomString(8)}@example.com`;
}

export function generateTestIdea(): string {
  const templates = [
    'An AI-powered platform for {domain} that helps {users} to {action}',
    'A mobile app that connects {users} with {service} in real-time',
    'A SaaS solution for {domain} teams to streamline {process}',
    'An innovative marketplace for {product} that focuses on {value}',
  ];
  
  const domains = ['healthcare', 'education', 'finance', 'retail', 'logistics'];
  const users = ['professionals', 'students', 'businesses', 'consumers', 'developers'];
  const actions = ['collaborate', 'learn', 'optimize', 'automate', 'analyze'];
  const services = ['experts', 'resources', 'opportunities', 'solutions', 'tools'];
  const processes = ['workflows', 'communication', 'planning', 'reporting', 'tracking'];
  const products = ['services', 'products', 'experiences', 'content', 'data'];
  const values = ['sustainability', 'efficiency', 'quality', 'innovation', 'accessibility'];
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return template
    .replace('{domain}', domains[Math.floor(Math.random() * domains.length)])
    .replace('{users}', users[Math.floor(Math.random() * users.length)])
    .replace('{action}', actions[Math.floor(Math.random() * actions.length)])
    .replace('{service}', services[Math.floor(Math.random() * services.length)])
    .replace('{process}', processes[Math.floor(Math.random() * processes.length)])
    .replace('{product}', products[Math.floor(Math.random() * products.length)])
    .replace('{value}', values[Math.floor(Math.random() * values.length)]);
}

/**
 * Usage Examples:
 * 
 * ```typescript
 * import { test } from '@playwright/test';
 * import {
 *   setMockScenario,
 *   waitForLoadingToComplete,
 *   assertElementVisible,
 *   generateTestIdea
 * } from './example-test-helper';
 * 
 * test('example test', async ({ page }) => {
 *   // Configure mock
 *   await setMockScenario(page, 'success');
 *   
 *   // Navigate and interact
 *   await page.goto('/analyzer');
 *   await page.fill('[data-testid="idea-input"]', generateTestIdea());
 *   await page.click('[data-testid="analyze-button"]');
 *   
 *   // Wait and assert
 *   await waitForLoadingToComplete(page);
 *   await assertElementVisible(page, '[data-testid="results"]');
 * });
 * ```
 */
