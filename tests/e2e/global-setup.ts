import type { FullConfig } from "@playwright/test";

/**
 * Placeholder global setup for Playwright.
 * This keeps CI happy even if no additional setup is required.
 */
export default async function globalSetup(_config: FullConfig): Promise<void> {
  // No-op setup; reserved for future initialization.
}
