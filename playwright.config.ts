import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E tests
 * See https://playwright.dev/docs/test-configuration
 *
 * Configuration includes:
 * - Test timeout and retries for reliability
 * - Base URL and browser options
 * - Screenshot and video capture on failure
 * - Parallel test execution
 * - Artifact management (screenshots, videos, traces, logs)
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",

  // Global setup and teardown
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",

  // Run tests in files in parallel
  fullyParallel: true,

  // Maximum number of test failures before stopping
  maxFailures: process.env.CI ? 10 : undefined,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI and locally for flaky tests due to performance issues
  retries: process.env.CI ? 2 : 1,

  // Parallel test execution
  // Use fewer workers on CI to avoid resource contention
  workers: process.env.CI ? 2 : 4,

  // Reporter to use
  reporter: [
    ["html", { outputFolder: "tests/e2e/reports/html", open: "never" }],
    ["json", { outputFile: "tests/e2e/reports/results.json" }],
    ["junit", { outputFile: "tests/e2e/reports/junit.xml" }],
    ["list"],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",

    // Collect trace when retrying the failed test
    // Traces include screenshots, network logs, and console logs
    trace: "on-first-retry",

    // Screenshot on failure - captures visual state when tests fail
    screenshot:
      process.env.E2E_SCREENSHOT_ON_FAILURE === "false"
        ? "off"
        : "only-on-failure",

    // Video on failure - records video of test execution
    video:
      process.env.E2E_VIDEO_ON_FAILURE === "true" ? "retain-on-failure" : "off",

    // Viewport size for consistent testing
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors in development
    ignoreHTTPSErrors: true,

    // Action timeout - individual action timeout
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 60000,

    // Reuse browser context for faster test execution
    // This shares cookies, localStorage, and other state between tests in the same worker
    storageState: undefined, // Can be set to a file path to persist state

    // Optimize network requests and add test mode headers
    // Skip loading unnecessary resources for faster tests
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      "X-Test-Mode": "true", // Indicates this is a test request
      "X-E2E-Test": "true", // Specific marker for E2E tests
    },
  },

  // Global test timeout - maximum time for a single test
  timeout: parseInt(process.env.E2E_TIMEOUT || "60000"),

  // Expect timeout - maximum time for expect() assertions
  expect: {
    timeout: 10000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Enable console log capture
        launchOptions: {
          args: ["--disable-web-security"],
        },
      },
    },

    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Output folder for test artifacts
  outputDir: "tests/e2e/artifacts",

  // Run your local dev server before starting the tests
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 180000, // Increased timeout for slow startup
        stdout: "ignore",
        stderr: "pipe",
        env: {
          // Mock mode configuration - Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
          NODE_ENV: "test",
          FF_USE_MOCK_API: "true",
          NEXT_PUBLIC_FF_USE_MOCK_API: "true",
          FF_ENABLE_CLASSIC_ANALYZER: "true",
          NEXT_PUBLIC_FF_ENABLE_CLASSIC_ANALYZER: "true",
          FF_ENABLE_KIROWEEN_ANALYZER: "true",
          NEXT_PUBLIC_FF_ENABLE_KIROWEEN_ANALYZER: "true",
          ALLOW_TEST_MODE_IN_PRODUCTION: "true",
          FF_MOCK_SCENARIO: process.env.FF_MOCK_SCENARIO || "success",
          FF_SIMULATE_LATENCY: process.env.FF_SIMULATE_LATENCY || "false",
          FF_LOG_MOCK_REQUESTS: process.env.FF_LOG_MOCK_REQUESTS || "true",
          // Ensure local dev mode is enabled
          NEXT_PUBLIC_FF_LOCAL_DEV_MODE: "true",
          FF_LOCAL_DEV_MODE: "true",
          // Supabase dummy credentials for test mode
          NEXT_PUBLIC_SUPABASE_URL: "https://dummy.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bW15IiwiYXVkIjoiYXV0aGVudGljYXRlZCIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwLCJyb2xlIjoiYW5vbiJ9.dummy",
          // Gemini API key (not used in mock mode but required for app startup)
          GEMINI_API_KEY: process.env.GEMINI_API_KEY || "dummy-key-for-testing",
        },
      },

  // Environment variables for test execution
  // These are available to the test runner and global setup
  // Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
  metadata: {
    mockMode: {
      enabled: true,
      scenario: process.env.FF_MOCK_SCENARIO || "success",
      simulateLatency: process.env.FF_SIMULATE_LATENCY === "true",
    },
  },
});
