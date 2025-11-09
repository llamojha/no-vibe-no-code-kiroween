/**
 * Performance monitoring utilities for E2E tests
 * 
 * Tracks test execution time, page load time, and other performance metrics.
 */

import { Page } from '@playwright/test';

/**
 * Performance metrics for a test
 */
export interface TestPerformanceMetrics {
  /** Test name */
  testName: string;
  /** Total test duration in milliseconds */
  duration: number;
  /** Page load time in milliseconds */
  pageLoadTime?: number;
  /** Navigation time in milliseconds */
  navigationTime?: number;
  /** API response times */
  apiResponseTimes: Map<string, number[]>;
  /** Average API response time */
  averageApiResponseTime: number;
  /** Timestamp when test started */
  startTime: Date;
  /** Timestamp when test ended */
  endTime: Date;
}

/**
 * Performance monitor for E2E tests
 */
export class PerformanceMonitor {
  private static metrics: Map<string, TestPerformanceMetrics> = new Map();
  private static currentTest: string | null = null;
  private static testStartTime: number | null = null;
  private static apiTimes: Map<string, number[]> = new Map();

  /**
   * Start monitoring a test
   */
  static startTest(testName: string): void {
    this.currentTest = testName;
    this.testStartTime = Date.now();
    this.apiTimes.clear();

    if (process.env.E2E_LOG_PERFORMANCE === 'true') {
      console.log(`[PERFORMANCE] Starting test: ${testName}`);
    }
  }

  /**
   * End monitoring a test
   */
  static endTest(): TestPerformanceMetrics | null {
    if (!this.currentTest || !this.testStartTime) {
      return null;
    }

    const duration = Date.now() - this.testStartTime;
    const endTime = new Date();
    const startTime = new Date(this.testStartTime);

    // Calculate average API response time
    let totalApiTime = 0;
    let totalApiCalls = 0;
    for (const times of this.apiTimes.values()) {
      totalApiTime += times.reduce((sum, t) => sum + t, 0);
      totalApiCalls += times.length;
    }
    const averageApiResponseTime = totalApiCalls > 0 ? totalApiTime / totalApiCalls : 0;

    const metrics: TestPerformanceMetrics = {
      testName: this.currentTest,
      duration,
      apiResponseTimes: new Map(this.apiTimes),
      averageApiResponseTime: Math.round(averageApiResponseTime * 100) / 100,
      startTime,
      endTime,
    };

    this.metrics.set(this.currentTest, metrics);

    if (process.env.E2E_LOG_PERFORMANCE === 'true') {
      console.log(`[PERFORMANCE] Test completed: ${this.currentTest}`);
      console.log(`[PERFORMANCE] Duration: ${duration}ms`);
      console.log(`[PERFORMANCE] Average API time: ${metrics.averageApiResponseTime}ms`);
    }

    this.currentTest = null;
    this.testStartTime = null;

    return metrics;
  }

  /**
   * Record API response time
   */
  static recordApiCall(endpoint: string, duration: number): void {
    if (!this.apiTimes.has(endpoint)) {
      this.apiTimes.set(endpoint, []);
    }
    this.apiTimes.get(endpoint)!.push(duration);

    if (process.env.E2E_LOG_PERFORMANCE === 'true') {
      console.log(`[PERFORMANCE] API call to ${endpoint}: ${duration}ms`);
    }
  }

  /**
   * Measure page load time
   */
  static async measurePageLoad(page: Page): Promise<number> {
    const navigationTiming = await page.evaluate(() => {
      const perfData = window.performance.timing;
      return {
        loadTime: perfData.loadEventEnd - perfData.navigationStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        responseTime: perfData.responseEnd - perfData.requestStart,
      };
    });

    const loadTime = navigationTiming.loadTime;

    if (this.currentTest && this.metrics.has(this.currentTest)) {
      const metrics = this.metrics.get(this.currentTest)!;
      metrics.pageLoadTime = loadTime;
      metrics.navigationTime = navigationTiming.domContentLoaded;
    }

    if (process.env.E2E_LOG_PERFORMANCE === 'true') {
      console.log(`[PERFORMANCE] Page load time: ${loadTime}ms`);
      console.log(`[PERFORMANCE] DOM content loaded: ${navigationTiming.domContentLoaded}ms`);
    }

    return loadTime;
  }

  /**
   * Monitor API requests on a page
   */
  static async monitorApiRequests(page: Page): Promise<void> {
    const requestStartTimes = new Map<string, number>();

    // Track request start times
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        requestStartTimes.set(url, Date.now());
      }
    });

    // Calculate duration when response is received
    page.on('response', async (response) => {
      const url = response.url();
      
      // Only track API calls (not static assets)
      if (url.includes('/api/')) {
        const startTime = requestStartTimes.get(url);
        if (startTime) {
          const duration = Date.now() - startTime;
          const endpoint = url.split('/api/')[1]?.split('?')[0] || 'unknown';
          this.recordApiCall(endpoint, duration);
          requestStartTimes.delete(url);
        }
      }
    });
  }

  /**
   * Get metrics for a specific test
   */
  static getTestMetrics(testName: string): TestPerformanceMetrics | undefined {
    return this.metrics.get(testName);
  }

  /**
   * Get all metrics
   */
  static getAllMetrics(): Map<string, TestPerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get summary statistics
   */
  static getSummary(): {
    totalTests: number;
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    averageApiResponseTime: number;
  } {
    const allMetrics = Array.from(this.metrics.values());
    
    if (allMetrics.length === 0) {
      return {
        totalTests: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        averageApiResponseTime: 0,
      };
    }

    const totalDuration = allMetrics.reduce((sum, m) => sum + m.duration, 0);
    const durations = allMetrics.map(m => m.duration);
    const apiTimes = allMetrics.map(m => m.averageApiResponseTime).filter(t => t > 0);

    return {
      totalTests: allMetrics.length,
      totalDuration,
      averageDuration: Math.round((totalDuration / allMetrics.length) * 100) / 100,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      averageApiResponseTime: apiTimes.length > 0 
        ? Math.round((apiTimes.reduce((sum, t) => sum + t, 0) / apiTimes.length) * 100) / 100
        : 0,
    };
  }

  /**
   * Export metrics to JSON
   */
  static exportMetrics(): string {
    const summary = this.getSummary();
    const allMetrics = Array.from(this.metrics.entries()).map(([name, metrics]) => ({
      testName: name,
      duration: metrics.duration,
      pageLoadTime: metrics.pageLoadTime,
      navigationTime: metrics.navigationTime,
      averageApiResponseTime: metrics.averageApiResponseTime,
      apiCalls: Array.from(metrics.apiResponseTimes.entries()).map(([endpoint, times]) => ({
        endpoint,
        calls: times.length,
        averageTime: Math.round((times.reduce((sum, t) => sum + t, 0) / times.length) * 100) / 100,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
      })),
      startTime: metrics.startTime.toISOString(),
      endTime: metrics.endTime.toISOString(),
    }));

    return JSON.stringify({
      summary,
      tests: allMetrics,
      generatedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Clear all metrics
   */
  static clear(): void {
    this.metrics.clear();
    this.currentTest = null;
    this.testStartTime = null;
    this.apiTimes.clear();
  }

  /**
   * Log summary to console
   */
  static logSummary(): void {
    const summary = this.getSummary();
    
    console.log('\n=== E2E Test Performance Summary ===');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Total Duration: ${summary.totalDuration}ms`);
    console.log(`Average Duration: ${summary.averageDuration}ms`);
    console.log(`Min Duration: ${summary.minDuration}ms`);
    console.log(`Max Duration: ${summary.maxDuration}ms`);
    console.log(`Average API Response Time: ${summary.averageApiResponseTime}ms`);
    console.log('====================================\n');
  }
}

/**
 * Measure execution time of an async operation
 */
export async function measureTime<T>(
  label: string,
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await operation();
  const duration = Date.now() - startTime;

  if (process.env.E2E_LOG_PERFORMANCE === 'true') {
    console.log(`[PERFORMANCE] ${label}: ${duration}ms`);
  }

  return { result, duration };
}
