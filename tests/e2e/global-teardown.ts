import type { FullConfig } from "@playwright/test";

/**
 * Placeholder global teardown for Playwright.
 * Ensures the referenced module exists in CI.
 */
export default async function globalTeardown(_config: FullConfig): Promise<void> {
  // No-op teardown; reserved for future cleanup.
}
