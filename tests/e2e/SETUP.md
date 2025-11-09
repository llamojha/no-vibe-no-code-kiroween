# E2E Testing Infrastructure Setup

This document describes the E2E testing infrastructure that has been set up for the project.

## What Was Installed

### Dependencies

- **@playwright/test** (v1.40.0+): Core Playwright testing framework
- **playwright** (v1.40.0+): Browser automation library

### Browsers

- **Chromium**: Installed and configured as the default test browser
- Additional browsers (Firefox, WebKit) can be enabled in `playwright.config.ts`

## Directory Structure

```
tests/
├── e2e/
│   ├── helpers/
│   │   ├── page-objects/
│   │   │   ├── AnalyzerPage.ts          # Page Object for Analyzer feature
│   │   │   ├── HackathonPage.ts         # Page Object for Hackathon Analyzer
│   │   │   ├── FrankensteinPage.ts      # Page Object for Doctor Frankenstein
│   │   │   └── DashboardPage.ts         # Page Object for Dashboard
│   │   ├── fixtures.ts                   # Test data and fixtures
│   │   └── test-helpers.ts               # Common helper functions
│   ├── setup.spec.ts                     # Setup verification tests
│   └── [feature].spec.ts                 # Feature-specific E2E tests
├── README.md                              # Testing documentation
└── SETUP.md                               # This file

playwright.config.ts                       # Playwright configuration (root)
```

## Configuration Files

### playwright.config.ts

Located at the project root, this file configures:

- Test directory: `./tests/e2e`
- Test pattern: `**/*.spec.ts`
- Parallel execution: 4 workers locally, 2 in CI
- Retries: 2 retries in CI, 0 locally
- Reporters: HTML, JSON, and list
- Timeout: 30 seconds (configurable via `E2E_TIMEOUT`)
- Screenshots: Captured on failure
- Videos: Optional (disabled by default)
- Web server: Automatically starts dev server for local testing

### package.json Scripts

New scripts added:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:report": "playwright show-report tests/e2e/reports/html",
  "playwright:install": "playwright install --with-deps"
}
```

### .env.example

Added E2E testing configuration variables:

```bash
# E2E Testing Configuration
E2E_BASE_URL=http://localhost:3000
E2E_HEADLESS=true
E2E_TIMEOUT=30000
E2E_SCREENSHOT_ON_FAILURE=true
E2E_VIDEO_ON_FAILURE=false

# Mock Mode Configuration (for testing)
FF_USE_MOCK_API=false
FF_MOCK_SCENARIO=success
FF_MOCK_VARIABILITY=false
FF_SIMULATE_LATENCY=false
FF_MIN_LATENCY=500
FF_MAX_LATENCY=2000
FF_LOG_MOCK_REQUESTS=false
```

### .gitignore

Added entries to exclude test artifacts:

```
# Playwright
tests/e2e/reports/
tests/e2e/screenshots/
tests/e2e/videos/
test-results/
playwright-report/
playwright/.cache/
```

## Page Object Models

Page Object Models (POMs) encapsulate page interactions and provide a clean API for tests:

### AnalyzerPage

- Navigate to analyzer page
- Enter idea text
- Select language
- Click analyze button
- Access results (score, summary, strengths, weaknesses)

### HackathonPage

- Navigate to hackathon analyzer
- Enter project details (name, description, Kiro usage)
- Select language
- Click analyze button
- Access results (score, category recommendation)

### FrankensteinPage

- Navigate to Doctor Frankenstein
- Select mode (companies/AWS)
- Select language
- Add elements
- Generate idea
- Access results (title, description, metrics)
- Wait for slot machine animation

### DashboardPage

- Navigate to dashboard
- Access analyses list
- Access hackathon projects list
- Check for empty state
- Click on specific analysis

## Test Helpers

Common helper functions in `test-helpers.ts`:

- `waitForElement()`: Wait for element visibility
- `waitForLoadingToComplete()`: Wait for loading spinner
- `fillAndVerify()`: Fill input and verify value
- `clickAndWaitForNavigation()`: Click and wait for page navigation
- `takeScreenshot()`: Capture screenshot with custom name
- `expectTextContent()`: Check element text content
- `waitForAPIResponse()`: Wait for specific API response
- `enableMockMode()`: Enable mock API mode
- `setMockScenario()`: Set mock scenario
- `clearTestData()`: Clear localStorage and sessionStorage
- `captureConsoleLogs()`: Capture console logs
- `captureNetworkErrors()`: Capture network errors

## Test Fixtures

Predefined test data in `fixtures.ts`:

- `TEST_IDEAS`: Sample ideas for analyzer tests
- `TEST_HACKATHON_PROJECTS`: Sample hackathon projects
- `TEST_FRANKENSTEIN_ELEMENTS`: Sample elements for Frankenstein
- `TEST_LOCALES`: Language options
- `TEST_TIMEOUTS`: Common timeout values
- `TEST_SELECTORS`: Common selectors

## Running Tests

### First Time Setup

```bash
# Install Playwright browsers
npm run playwright:install
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Running Specific Tests

```bash
# Run specific test file
npx playwright test setup.spec.ts

# Run tests matching pattern
npx playwright test --grep "should load"

# Run in specific browser
npx playwright test --project=chromium
```

## Verification

The setup includes a verification test (`setup.spec.ts`) that checks:

1. Home page loads successfully
2. Viewport is configured correctly
3. Console logs can be captured

Run this test to verify the setup:

```bash
npm run test:e2e
```

Expected output:

```
Running 3 tests using 1 worker

  ✓  [chromium] › setup.spec.ts:8:3 › E2E Setup Verification › should load the home page
  ✓  [chromium] › setup.spec.ts:15:3 › E2E Setup Verification › should have proper viewport configuration
  ✓  [chromium] › setup.spec.ts:24:3 › E2E Setup Verification › should capture console logs

  3 passed (Xs)
```

## Next Steps

The infrastructure is now ready for implementing feature-specific E2E tests:

1. **Task 2**: Implement Feature Flag Manager
2. **Task 3**: Create Test Data Manager and mock data files
3. **Task 4**: Implement Mock AI Analysis Service
4. **Task 5**: Implement Mock Frankenstein Service
5. **Task 6**: Integrate mock services with ServiceFactory
6. **Task 7**: Integrate mock services with API routes
7. **Task 8**: Add visual mock mode indicator
8. **Task 9**: Create E2E testing framework infrastructure (COMPLETED)
9. **Task 10-13**: Implement feature-specific E2E tests

## Troubleshooting

### Playwright Not Found

If you get "playwright: command not found":

```bash
npm install
npm run playwright:install
```

### Browser Installation Failed

If browser installation fails:

```bash
# Install with dependencies
npx playwright install --with-deps chromium
```

### Tests Timing Out

If tests timeout:

1. Check if dev server is running: `npm run dev`
2. Increase timeout in `.env.local`: `E2E_TIMEOUT=60000`
3. Run in headed mode to see what's happening: `npm run test:e2e:headed`

### Port Already in Use

If port 3000 is already in use:

1. Stop the existing process
2. Or change the port in `.env.local`: `E2E_BASE_URL=http://localhost:3001`
3. Update `next.config.js` to use the new port

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
