/**
 * Shared test fixtures for optimized E2E test execution
 *
 * Provides reusable browser contexts, page objects, and test utilities
 * to minimize setup/teardown time and improve test performance.
 */

import { test as base, Page, BrowserContext } from "@playwright/test";
import { AnalyzerPage } from "./helpers/page-objects/AnalyzerPage";
import { HackathonPage } from "./helpers/page-objects/HackathonPage";
import { FrankensteinPage } from "./helpers/page-objects/FrankensteinPage";
import { DashboardPage } from "./helpers/page-objects/DashboardPage";
import { DocumentGeneratorPage } from "./helpers/page-objects/DocumentGeneratorPage";

/**
 * Extended test fixtures with page objects and shared context
 */
type TestFixtures = {
  /** Analyzer page object */
  analyzerPage: AnalyzerPage;
  /** Hackathon page object */
  hackathonPage: HackathonPage;
  /** Frankenstein page object */
  frankensteinPage: FrankensteinPage;
  /** Dashboard page object */
  dashboardPage: DashboardPage;
  /** Document generator page object */
  documentGeneratorPage: DocumentGeneratorPage;
  /** Shared context for faster test execution */
  sharedContext: BrowserContext;
  /** Shared page for faster test execution */
  sharedPage: Page;
};

/**
 * Worker-scoped fixtures that are shared across tests in the same worker
 */
type WorkerFixtures = {
  /** Worker-scoped browser context */
  workerContext: BrowserContext;
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Worker-scoped context (shared across all tests in the same worker)
  workerContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext({
        // Optimize context creation
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
      });

      await use(context);
      await context.close();
    },
    { scope: "worker" },
  ],

  // Shared context (reuses worker context)
  sharedContext: async ({ workerContext }, use) => {
    await use(workerContext);
  },

  // Shared page (creates new page from shared context)
  sharedPage: async ({ sharedContext }, use) => {
    const page = await sharedContext.newPage();
    await use(page);
    await page.close();
  },

  // Analyzer page object
  analyzerPage: async ({ page }, use) => {
    const analyzerPage = new AnalyzerPage(page);
    await use(analyzerPage);
  },

  // Hackathon page object
  hackathonPage: async ({ page }, use) => {
    const hackathonPage = new HackathonPage(page);
    await use(hackathonPage);
  },

  // Frankenstein page object
  frankensteinPage: async ({ page }, use) => {
    const frankensteinPage = new FrankensteinPage(page);
    await use(frankensteinPage);
  },

  // Dashboard page object
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  // Document generator page object
  documentGeneratorPage: async ({ page }, use) => {
    const documentGeneratorPage = new DocumentGeneratorPage(page);
    await use(documentGeneratorPage);
  },
});

/**
 * Export expect from Playwright
 */
export { expect } from "@playwright/test";

/**
 * Performance optimization utilities
 */
export class TestPerformance {
  private static startTimes = new Map<string, number>();

  /**
   * Start timing a test operation
   */
  static startTimer(label: string): void {
    this.startTimes.set(label, Date.now());
  }

  /**
   * End timing and log duration
   */
  static endTimer(label: string): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) {
      console.warn(`No start time found for timer: ${label}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(label);

    if (process.env.E2E_LOG_PERFORMANCE === "true") {
      console.log(`[PERFORMANCE] ${label}: ${duration}ms`);
    }

    return duration;
  }

  /**
   * Measure async operation duration
   */
  static async measure<T>(
    label: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    this.startTimer(label);
    const result = await operation();
    const duration = this.endTimer(label);

    return { result, duration };
  }
}

/**
 * Test data cleanup utilities
 */
export class TestCleanup {
  /**
   * Clear browser storage (localStorage, sessionStorage, cookies)
   */
  static async clearStorage(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const context = page.context();
    await context.clearCookies();
  }

  /**
   * Reset application state for clean test execution
   */
  static async resetAppState(page: Page): Promise<void> {
    await this.clearStorage(page);

    // Navigate to home page to reset any in-memory state
    await page.goto("/");
  }
}
