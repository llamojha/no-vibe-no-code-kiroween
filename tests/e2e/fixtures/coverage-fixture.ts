/**
 * Coverage Fixture for E2E Tests
 * 
 * Automatically collects code coverage for each test when enabled.
 */

import { test as base } from '@playwright/test';
import { startCoverage, stopCoverage, saveCoverageData } from '../helpers/coverage-helper';

type CoverageFixtures = {
  autoCollectCoverage: void;
};

/**
 * Extended test fixture that automatically collects coverage
 */
export const test = base.extend<CoverageFixtures>({
  autoCollectCoverage: [async ({ page }, use, testInfo) => {
    // Check if coverage collection is enabled
    const collectCoverage = process.env.E2E_COLLECT_COVERAGE === 'true';
    
    if (collectCoverage) {
      // Start coverage collection before the test
      await startCoverage(page);
    }
    
    // Run the test
    await use();
    
    if (collectCoverage) {
      // Stop coverage collection after the test
      const coverage = await stopCoverage(page);
      
      // Generate a unique test name for the coverage file
      const testName = testInfo.titlePath.join('-').replace(/[^a-z0-9-]/gi, '_');
      const timestamp = Date.now();
      const uniqueName = `${testName}-${timestamp}`;
      
      // Save coverage data
      saveCoverageData(coverage, uniqueName);
    }
  }, { auto: true }],
});

export { expect } from '@playwright/test';
