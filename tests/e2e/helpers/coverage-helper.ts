/**
 * Coverage Helper for E2E Tests
 * 
 * Provides utilities for collecting code coverage during E2E test execution.
 * Uses Playwright's built-in coverage collection capabilities.
 */

import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Playwright's actual coverage data structure
export interface CoverageEntry {
  url: string;
  scriptId: string;
  source?: string;
  functions: Array<{
    functionName: string;
    isBlockCoverage: boolean;
    ranges: Array<{
      count: number;
      startOffset: number;
      endOffset: number;
    }>;
  }>;
}

// Simplified coverage data for our purposes
export interface CoverageData {
  url: string;
  ranges: Array<{
    start: number;
    end: number;
  }>;
  text: string;
}

export interface CoverageSummary {
  total: {
    lines: { total: number; covered: number; percentage: number };
    statements: { total: number; covered: number; percentage: number };
    functions: { total: number; covered: number; percentage: number };
    branches: { total: number; covered: number; percentage: number };
  };
  files: Record<string, {
    lines: { total: number; covered: number; percentage: number };
    statements: { total: number; covered: number; percentage: number };
    functions: { total: number; covered: number; percentage: number };
    branches: { total: number; covered: number; percentage: number };
  }>;
}

/**
 * Start collecting coverage for a page
 */
export async function startCoverage(page: Page): Promise<void> {
  // Enable JavaScript coverage collection
  await page.coverage.startJSCoverage({
    resetOnNavigation: false,
    reportAnonymousScripts: true,
  });
  
  // Enable CSS coverage collection (optional)
  await page.coverage.startCSSCoverage({
    resetOnNavigation: false,
  });
}

/**
 * Stop collecting coverage and return the data
 */
export async function stopCoverage(page: Page): Promise<{
  js: CoverageData[];
  css: CoverageData[];
}> {
  const [jsCoverage, cssCoverage] = await Promise.all([
    page.coverage.stopJSCoverage(),
    page.coverage.stopCSSCoverage(),
  ]);
  
  // Convert Playwright's coverage format to our simplified format
  const convertedJsCoverage: CoverageData[] = jsCoverage.map((entry: CoverageEntry) => {
    const ranges: Array<{ start: number; end: number }> = [];
    
    // Extract ranges from functions
    for (const func of entry.functions) {
      for (const range of func.ranges) {
        if (range.count > 0) {
          ranges.push({
            start: range.startOffset,
            end: range.endOffset,
          });
        }
      }
    }
    
    return {
      url: entry.url,
      ranges,
      text: entry.source || '',
    };
  });
  
  // CSS coverage has a different structure, convert it similarly
  const convertedCssCoverage: CoverageData[] = (cssCoverage as unknown as CoverageData[]).map((entry: CoverageData) => ({
    url: entry.url,
    ranges: entry.ranges || [],
    text: entry.text || '',
  }));
  
  return {
    js: convertedJsCoverage,
    css: convertedCssCoverage,
  };
}

/**
 * Save coverage data to a file
 */
export function saveCoverageData(
  coverage: { js: CoverageData[]; css: CoverageData[] },
  testName: string
): void {
  const coverageDir = path.join(process.cwd(), 'tests/e2e/coverage');
  
  // Create coverage directory if it doesn't exist
  if (!fs.existsSync(coverageDir)) {
    fs.mkdirSync(coverageDir, { recursive: true });
  }
  
  // Save JS coverage
  const jsCoveragePath = path.join(coverageDir, `${testName}-js.json`);
  fs.writeFileSync(jsCoveragePath, JSON.stringify(coverage.js, null, 2));
  
  // Save CSS coverage
  const cssCoveragePath = path.join(coverageDir, `${testName}-css.json`);
  fs.writeFileSync(cssCoveragePath, JSON.stringify(coverage.css, null, 2));
}

/**
 * Calculate coverage percentage from coverage data
 */
export function calculateCoverage(coverageData: CoverageData[]): {
  totalBytes: number;
  usedBytes: number;
  percentage: number;
} {
  let totalBytes = 0;
  let usedBytes = 0;
  
  for (const entry of coverageData) {
    totalBytes += entry.text.length;
    for (const range of entry.ranges) {
      usedBytes += range.end - range.start;
    }
  }
  
  const percentage = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
  
  return {
    totalBytes,
    usedBytes,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Filter coverage data to only include application code
 * Excludes node_modules, test files, and other non-application code
 */
export function filterApplicationCoverage(coverageData: CoverageData[]): CoverageData[] {
  return coverageData.filter(entry => {
    const url = entry.url;
    
    // Exclude node_modules
    if (url.includes('node_modules')) return false;
    
    // Exclude test files
    if (url.includes('/tests/') || url.includes('.test.') || url.includes('.spec.')) return false;
    
    // Exclude webpack/next.js internal files
    if (url.includes('webpack') || url.includes('/_next/static/chunks/webpack')) return false;
    
    // Include only application code
    return url.includes('/app/') || 
           url.includes('/features/') || 
           url.includes('/lib/') ||
           url.includes('/src/');
  });
}

/**
 * Merge multiple coverage data arrays
 */
export function mergeCoverageData(coverageArrays: CoverageData[][]): CoverageData[] {
  const mergedMap = new Map<string, CoverageData>();
  
  for (const coverageArray of coverageArrays) {
    for (const entry of coverageArray) {
      const existing = mergedMap.get(entry.url);
      
      if (!existing) {
        mergedMap.set(entry.url, entry);
      } else {
        // Merge ranges (simple approach - could be more sophisticated)
        const allRanges = [...existing.ranges, ...entry.ranges];
        existing.ranges = allRanges;
      }
    }
  }
  
  return Array.from(mergedMap.values());
}

/**
 * Generate a simple coverage summary
 */
export function generateCoverageSummary(coverageData: CoverageData[]): {
  files: number;
  totalBytes: number;
  usedBytes: number;
  percentage: number;
} {
  const appCoverage = filterApplicationCoverage(coverageData);
  const stats = calculateCoverage(appCoverage);
  
  return {
    files: appCoverage.length,
    ...stats,
  };
}

/**
 * Save merged coverage summary
 */
export function saveCoverageSummary(
  coverageData: CoverageData[],
  outputPath: string
): void {
  const summary = generateCoverageSummary(coverageData);
  
  const summaryData = {
    timestamp: new Date().toISOString(),
    summary,
    thresholds: {
      lines: 70,
      statements: 70,
      functions: 70,
      branches: 70,
    },
    meetsThresholds: summary.percentage >= 70,
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(summaryData, null, 2));
}
