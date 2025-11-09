import { Page, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Artifact Manager for E2E tests
 * Handles screenshot, video, console log, and network log capture
 * Organizes artifacts by test name and timestamp
 */

export interface ArtifactOptions {
  captureScreenshot?: boolean;
  captureVideo?: boolean;
  captureConsoleLogs?: boolean;
  captureNetworkLogs?: boolean;
  captureTrace?: boolean;
}

export interface NetworkLog {
  timestamp: number;
  url: string;
  method: string;
  status: number;
  statusText: string;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  duration?: number;
}

export interface ConsoleLog {
  timestamp: number;
  type: string;
  text: string;
  location?: string;
}

export class ArtifactManager {
  private consoleLogs: ConsoleLog[] = [];
  private networkLogs: NetworkLog[] = [];
  private artifactDir: string;
  private testName: string;
  private startTime: number;

  constructor(testInfo: TestInfo) {
    this.testName = this.sanitizeTestName(testInfo.title);
    this.startTime = Date.now();
    
    // Create artifact directory structure
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.artifactDir = path.join(
      'tests',
      'e2e',
      'artifacts',
      this.testName,
      timestamp
    );
    
    this.ensureDirectoryExists(this.artifactDir);
  }

  /**
   * Setup artifact capture for a page
   */
  setupCapture(page: Page, options: ArtifactOptions = {}): void {
    const {
      captureConsoleLogs = true,
      captureNetworkLogs = true,
    } = options;

    if (captureConsoleLogs) {
      this.setupConsoleLogCapture(page);
    }

    if (captureNetworkLogs) {
      this.setupNetworkLogCapture(page);
    }
  }

  /**
   * Setup console log capture
   */
  private setupConsoleLogCapture(page: Page): void {
    page.on('console', (msg) => {
      this.consoleLogs.push({
        timestamp: Date.now(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location().url,
      });
    });

    page.on('pageerror', (error) => {
      this.consoleLogs.push({
        timestamp: Date.now(),
        type: 'error',
        text: `Page Error: ${error.message}\n${error.stack}`,
      });
    });
  }

  /**
   * Setup network log capture
   */
  private setupNetworkLogCapture(page: Page): void {
    const requestStartTimes = new Map<string, number>();

    page.on('request', (request) => {
      requestStartTimes.set(request.url(), Date.now());
    });

    page.on('response', async (response) => {
      const startTime = requestStartTimes.get(response.url());
      const duration = startTime ? Date.now() - startTime : undefined;

      this.networkLogs.push({
        timestamp: Date.now(),
        url: response.url(),
        method: response.request().method(),
        status: response.status(),
        statusText: response.statusText(),
        requestHeaders: response.request().headers(),
        responseHeaders: response.headers(),
        duration,
      });

      requestStartTimes.delete(response.url());
    });

    page.on('requestfailed', (request) => {
      this.networkLogs.push({
        timestamp: Date.now(),
        url: request.url(),
        method: request.method(),
        status: 0,
        statusText: request.failure()?.errorText || 'Request Failed',
        requestHeaders: request.headers(),
        responseHeaders: {},
      });

      requestStartTimes.delete(request.url());
    });
  }

  /**
   * Capture screenshot
   */
  async captureScreenshot(
    page: Page,
    name: string = 'screenshot'
  ): Promise<string> {
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(this.artifactDir, 'screenshots', filename);
    
    this.ensureDirectoryExists(path.dirname(filepath));
    
    await page.screenshot({
      path: filepath,
      fullPage: true,
    });

    return filepath;
  }

  /**
   * Capture screenshot on failure
   */
  async captureScreenshotOnFailure(
    page: Page,
    testInfo: TestInfo
  ): Promise<void> {
    if (testInfo.status !== 'passed') {
      await this.captureScreenshot(page, 'failure');
    }
  }

  /**
   * Save console logs to file
   */
  async saveConsoleLogs(): Promise<string> {
    const filename = 'console-logs.json';
    const filepath = path.join(this.artifactDir, 'logs', filename);
    
    this.ensureDirectoryExists(path.dirname(filepath));
    
    const logsData = {
      testName: this.testName,
      startTime: this.startTime,
      endTime: Date.now(),
      duration: Date.now() - this.startTime,
      logs: this.consoleLogs,
    };

    fs.writeFileSync(filepath, JSON.stringify(logsData, null, 2));
    
    return filepath;
  }

  /**
   * Save network logs to file
   */
  async saveNetworkLogs(): Promise<string> {
    const filename = 'network-logs.json';
    const filepath = path.join(this.artifactDir, 'logs', filename);
    
    this.ensureDirectoryExists(path.dirname(filepath));
    
    const logsData = {
      testName: this.testName,
      startTime: this.startTime,
      endTime: Date.now(),
      duration: Date.now() - this.startTime,
      logs: this.networkLogs,
    };

    fs.writeFileSync(filepath, JSON.stringify(logsData, null, 2));
    
    return filepath;
  }

  /**
   * Save all artifacts
   */
  async saveAllArtifacts(page: Page, testInfo: TestInfo): Promise<void> {
    // Capture screenshot if test failed
    if (testInfo.status !== 'passed') {
      await this.captureScreenshot(page, 'failure');
    }

    // Save console logs
    if (this.consoleLogs.length > 0) {
      await this.saveConsoleLogs();
    }

    // Save network logs
    if (this.networkLogs.length > 0) {
      await this.saveNetworkLogs();
    }

    // Create summary file
    await this.createSummary(testInfo);
  }

  /**
   * Create test summary file
   */
  private async createSummary(testInfo: TestInfo): Promise<void> {
    const filename = 'summary.json';
    const filepath = path.join(this.artifactDir, filename);
    
    const summary = {
      testName: this.testName,
      status: testInfo.status,
      duration: Date.now() - this.startTime,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      errors: testInfo.errors,
      consoleLogCount: this.consoleLogs.length,
      networkLogCount: this.networkLogs.length,
      consoleErrors: this.consoleLogs.filter(log => log.type === 'error').length,
      networkErrors: this.networkLogs.filter(log => log.status === 0 || log.status >= 400).length,
    };

    fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));
  }

  /**
   * Get console logs
   */
  getConsoleLogs(): ConsoleLog[] {
    return this.consoleLogs;
  }

  /**
   * Get network logs
   */
  getNetworkLogs(): NetworkLog[] {
    return this.networkLogs;
  }

  /**
   * Get console errors
   */
  getConsoleErrors(): ConsoleLog[] {
    return this.consoleLogs.filter(log => log.type === 'error');
  }

  /**
   * Get network errors
   */
  getNetworkErrors(): NetworkLog[] {
    return this.networkLogs.filter(log => log.status === 0 || log.status >= 400);
  }

  /**
   * Clear all captured logs
   */
  clearLogs(): void {
    this.consoleLogs = [];
    this.networkLogs = [];
  }

  /**
   * Get artifact directory path
   */
  getArtifactDir(): string {
    return this.artifactDir;
  }

  /**
   * Sanitize test name for use in file paths
   */
  private sanitizeTestName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Create artifact manager for a test
 */
export function createArtifactManager(testInfo: TestInfo): ArtifactManager {
  return new ArtifactManager(testInfo);
}

/**
 * Setup automatic artifact capture for test
 */
export function setupArtifactCapture(
  page: Page,
  testInfo: TestInfo,
  options: ArtifactOptions = {}
): ArtifactManager {
  const manager = createArtifactManager(testInfo);
  manager.setupCapture(page, options);
  return manager;
}
