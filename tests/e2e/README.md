# E2E Testing Infrastructure

This directory contains the end-to-end testing infrastructure for the application using Playwright.

## Directory Structure

```
tests/e2e/
├── artifacts/              # Test artifacts (screenshots, logs, videos, traces)
│   ├── screenshots/        # Screenshots captured during tests
│   ├── logs/              # Console and network logs
│   ├── videos/            # Video recordings of test runs
│   └── traces/            # Playwright traces
├── helpers/               # Test helpers and utilities
│   ├── page-objects/      # Page Object Models
│   │   ├── AnalyzerPage.ts
│   │   ├── HackathonPage.ts
│   │   ├── FrankensteinPage.ts
│   │   └── DashboardPage.ts
│   ├── test-helpers.ts    # Common test helper functions
│   ├── assertion-helpers.ts # Custom assertion helpers
│   ├── fixtures.ts        # Test data fixtures
│   ├── artifact-manager.ts # Artifact management utilities
│   └── index.ts           # Export all helpers
├── reports/               # Test reports (HTML, JSON, JUnit)
├── *.spec.ts             # Test specification files
└── README.md             # This file
```

## Configuration

The E2E tests are configured in `playwright.config.ts` at the project root.

### Key Configuration Options

- **Test timeout**: 30 seconds (configurable via `E2E_TIMEOUT` env var)
- **Retries**: 2 retries on CI, 0 locally
- **Workers**: 2 workers on CI, 4 locally (parallel execution)
- **Base URL**: `http://localhost:3000` (configurable via `E2E_BASE_URL` env var)
- **Screenshot**: Captured on failure by default
- **Video**: Off by default (enable with `E2E_VIDEO_ON_FAILURE=true`)
- **Trace**: Captured on first retry

## Environment Variables

Configure test behavior using environment variables:

```bash
# Base URL for tests
E2E_BASE_URL=http://localhost:3000

# Test timeout in milliseconds
E2E_TIMEOUT=30000

# Screenshot capture
E2E_SCREENSHOT_ON_FAILURE=true

# Video capture
E2E_VIDEO_ON_FAILURE=false

# Mock mode configuration
FF_USE_MOCK_API=true
FF_MOCK_SCENARIO=success
FF_SIMULATE_LATENCY=true
FF_MIN_LATENCY=500
FF_MAX_LATENCY=2000
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run specific test file
```bash
npx playwright test tests/e2e/analyzer.spec.ts
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run tests with UI mode
```bash
npx playwright test --ui
```

### Run tests on specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { AnalyzerPage } from './helpers/page-objects';
import { setupArtifactCapture } from './helpers/artifact-manager';

test.describe('Analyzer Feature', () => {
  test('should analyze idea successfully', async ({ page }, testInfo) => {
    // Setup artifact capture
    const artifacts = setupArtifactCapture(page, testInfo);
    
    // Navigate to page
    const analyzerPage = new AnalyzerPage(page);
    await analyzerPage.navigate();
    
    // Perform actions
    await analyzerPage.analyzeIdea('AI-powered task manager', 'en');
    
    // Wait for results
    await analyzerPage.waitForResults();
    
    // Assertions
    await expect(analyzerPage.scoreElement).toBeVisible();
    
    // Save artifacts
    await artifacts.saveAllArtifacts(page, testInfo);
  });
});
```

### Using Page Objects

Page objects encapsulate page-specific selectors and actions:

```typescript
import { AnalyzerPage, HackathonPage, FrankensteinPage, DashboardPage } from './helpers/page-objects';

// Analyzer page
const analyzerPage = new AnalyzerPage(page);
await analyzerPage.navigate();
await analyzerPage.analyzeIdea('My idea', 'en');

// Hackathon page
const hackathonPage = new HackathonPage(page);
await hackathonPage.navigate();
await hackathonPage.analyzeProject('Project Name', 'Description', 'Kiro Usage', 'en');

// Frankenstein page
const frankensteinPage = new FrankensteinPage(page);
await frankensteinPage.navigate();
await frankensteinPage.generateIdea('companies', ['Netflix', 'Uber'], 'en');

// Dashboard page
const dashboardPage = new DashboardPage(page);
await dashboardPage.navigate();
const count = await dashboardPage.getAnalysesCount();
```

### Using Test Helpers

```typescript
import {
  waitForLoadingToComplete,
  enableMockMode,
  setMockScenario,
  setupConsoleLogCapture,
  setupNetworkErrorCapture,
} from './helpers/test-helpers';

// Wait for loading
await waitForLoadingToComplete(page);

// Enable mock mode
await enableMockMode(page);
await setMockScenario(page, 'success');

// Capture logs
const consoleLogs = setupConsoleLogCapture(page);
const networkErrors = setupNetworkErrorCapture(page);
```

### Using Assertion Helpers

```typescript
import {
  assertAnalysisResultsDisplayed,
  assertErrorDisplayed,
  assertLoadingVisible,
} from './helpers/assertion-helpers';

// Assert analysis results
await assertAnalysisResultsDisplayed(page, {
  expectScore: true,
  expectSummary: true,
});

// Assert error
await assertErrorDisplayed(page, 'API error');

// Assert loading
await assertLoadingVisible(page);
```

### Using Fixtures

```typescript
import {
  TEST_IDEAS,
  TEST_HACKATHON_PROJECTS,
  TEST_FRANKENSTEIN_ELEMENTS,
  getRandomTestIdea,
} from './helpers/fixtures';

// Use predefined test data
await analyzerPage.enterIdea(TEST_IDEAS.simple);

// Use random test data
const randomIdea = getRandomTestIdea();
await analyzerPage.enterIdea(randomIdea);

// Use Frankenstein elements
const elements = TEST_FRANKENSTEIN_ELEMENTS.companies.threeElements;
await frankensteinPage.addMultipleElements(elements);
```

## Artifact Management

The artifact manager automatically captures and organizes test artifacts:

### Automatic Capture

```typescript
import { setupArtifactCapture } from './helpers/artifact-manager';

test('my test', async ({ page }, testInfo) => {
  // Setup automatic artifact capture
  const artifacts = setupArtifactCapture(page, testInfo, {
    captureConsoleLogs: true,
    captureNetworkLogs: true,
  });
  
  // ... test code ...
  
  // Save all artifacts (automatically captures screenshot on failure)
  await artifacts.saveAllArtifacts(page, testInfo);
});
```

### Manual Capture

```typescript
// Capture screenshot manually
await artifacts.captureScreenshot(page, 'custom-name');

// Get console logs
const consoleLogs = artifacts.getConsoleLogs();
const consoleErrors = artifacts.getConsoleErrors();

// Get network logs
const networkLogs = artifacts.getNetworkLogs();
const networkErrors = artifacts.getNetworkErrors();
```

### Artifact Organization

Artifacts are organized by test name and timestamp:

```
artifacts/
└── my-test-name/
    └── 2024-11-08T12-30-45/
        ├── screenshots/
        │   └── failure-1699445445123.png
        ├── logs/
        │   ├── console-logs.json
        │   └── network-logs.json
        └── summary.json
```

## Mock Mode Testing

Tests can run in mock mode to avoid consuming API credits:

### Enable Mock Mode

```typescript
import { enableMockMode, setMockScenario } from './helpers/test-helpers';

test.beforeEach(async ({ page }) => {
  await enableMockMode(page);
  await setMockScenario(page, 'success');
});
```

### Available Mock Scenarios

- `success` - Successful API response
- `api_error` - API error response
- `timeout` - Request timeout
- `rate_limit` - Rate limit exceeded

### Mock Configuration

Set mock configuration via environment variables:

```bash
FF_USE_MOCK_API=true
FF_MOCK_SCENARIO=success
FF_SIMULATE_LATENCY=true
FF_MIN_LATENCY=500
FF_MAX_LATENCY=2000
```

## Viewing Test Reports

### HTML Report

After running tests, view the HTML report:

```bash
npx playwright show-report tests/e2e/reports/html
```

### JSON Report

The JSON report is available at:
```
tests/e2e/reports/results.json
```

### JUnit Report

The JUnit XML report is available at:
```
tests/e2e/reports/junit.xml
```

## Debugging Tests

### Debug Mode

Run tests in debug mode to step through test execution:

```bash
npx playwright test --debug
```

### UI Mode

Use Playwright's UI mode for interactive debugging:

```bash
npx playwright test --ui
```

### Trace Viewer

View traces for failed tests:

```bash
npx playwright show-trace tests/e2e/artifacts/traces/trace.zip
```

### Console Logs

Console logs are automatically captured and saved to:
```
tests/e2e/artifacts/[test-name]/[timestamp]/logs/console-logs.json
```

## Best Practices

1. **Use Page Objects**: Encapsulate page-specific logic in page objects
2. **Use Test Helpers**: Leverage helper functions for common actions
3. **Use Fixtures**: Use predefined test data for consistency
4. **Capture Artifacts**: Always capture artifacts for debugging
5. **Enable Mock Mode**: Use mock mode to avoid API costs
6. **Write Descriptive Tests**: Use clear test names and descriptions
7. **Keep Tests Independent**: Each test should be able to run independently
8. **Clean Up**: Clean up test data after tests
9. **Use Assertions**: Use assertion helpers for consistent assertions
10. **Handle Errors**: Always handle potential errors gracefully

## Troubleshooting

### Tests Timing Out

- Increase timeout: `E2E_TIMEOUT=60000`
- Check if application is running
- Check network connectivity
- Enable debug mode to see what's happening

### Screenshots Not Captured

- Ensure `E2E_SCREENSHOT_ON_FAILURE` is not set to `false`
- Check artifact directory permissions
- Verify test is actually failing

### Mock Mode Not Working

- Verify `FF_USE_MOCK_API=true` is set
- Check browser console for errors
- Verify mock data files exist
- Check feature flag configuration

### Flaky Tests

- Enable retries in configuration
- Add explicit waits for elements
- Use `waitForLoadState('networkidle')`
- Check for race conditions

## CI/CD Integration

Tests are automatically run in CI/CD pipelines. See `.github/workflows/e2e-tests.yml` for configuration.

### GitHub Actions

The E2E tests run on:
- Pull requests to main/develop branches
- Pushes to main branch

Artifacts are uploaded on failure:
- Screenshots
- Videos (if enabled)
- Console logs
- Network logs
- Test reports

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
