# Testing Documentation

This directory contains all automated tests for the application.

## Directory Structure

```
tests/
├── e2e/                          # End-to-end tests using Playwright
│   ├── helpers/                  # Test helpers and utilities
│   │   ├── page-objects/         # Page Object Models
│   │   ├── fixtures.ts           # Test data and fixtures
│   │   └── test-helpers.ts       # Common helper functions
│   ├── playwright.config.ts      # Playwright configuration
│   └── *.spec.ts                 # E2E test files
└── README.md                     # This file
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npm run playwright:install

# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode (interactive)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## E2E Test Configuration

E2E tests can be configured using environment variables in `.env.local`:

```bash
# Base URL for tests
E2E_BASE_URL=http://localhost:3000

# Run tests in headless mode
E2E_HEADLESS=true

# Test timeout in milliseconds
E2E_TIMEOUT=30000

# Capture screenshots on failure
E2E_SCREENSHOT_ON_FAILURE=true

# Record video on failure
E2E_VIDEO_ON_FAILURE=false
```

## Mock Mode for Testing

The application includes a comprehensive mock system that allows testing without external API calls or database connections. This is essential for E2E tests and offline development.

### Enabling Mock Mode

Set the following environment variables in `.env.local` or `.env.test`:

```bash
# Enable mock API responses (REQUIRED)
FF_USE_MOCK_API=true

# Set Node environment to test (REQUIRED for E2E tests)
NODE_ENV=test

# Set mock scenario (optional, defaults to 'success')
FF_MOCK_SCENARIO=success

# Simulate network latency (optional, defaults to false)
FF_SIMULATE_LATENCY=false
FF_MIN_LATENCY=500
FF_MAX_LATENCY=2000

# Log mock requests for debugging (optional)
FF_LOG_MOCK_REQUESTS=true
```

### Available Mock Scenarios

The mock system supports different scenarios for testing various conditions:

- **`success`** (default): Returns successful responses with realistic data
- **`api_error`**: Simulates API errors (500 status)
- **`timeout`**: Simulates request timeouts
- **`rate_limit`**: Simulates rate limiting (429 status)
- **`invalid_input`**: Simulates validation errors (400 status)
- **`partial_response`**: Returns incomplete data for edge case testing

### Verifying Mock Mode is Active

Before running E2E tests, verify that mock mode is properly configured:

```bash
# Start the application with mock mode
FF_USE_MOCK_API=true NODE_ENV=test npm run dev

# In another terminal, check mock status
curl http://localhost:3000/api/test/mock-status
```

Expected response:
```json
{
  "mockMode": true,
  "scenario": "success",
  "simulateLatency": false,
  "nodeEnv": "test",
  "isValid": true,
  "errors": [],
  "warnings": [],
  "timestamp": "2025-11-09T..."
}
```

### Running E2E Tests with Mock Mode

E2E tests automatically configure mock mode through Playwright's global setup:

```bash
# Run E2E tests (mock mode is automatic)
npm run test:e2e

# Run with specific scenario
FF_MOCK_SCENARIO=api_error npm run test:e2e

# Run with latency simulation
FF_SIMULATE_LATENCY=true npm run test:e2e
```

The Playwright configuration includes a global setup that:
1. Verifies mock mode is active before tests run
2. Waits for the application to be ready
3. Fails fast if mock mode cannot be activated

### Mock Mode Architecture

The mock system consists of several components:

1. **FeatureFlagManager** (`lib/testing/FeatureFlagManager.ts`)
   - Reads environment variables
   - Provides feature flag values to the application

2. **TestDataManager** (`lib/testing/TestDataManager.ts`)
   - Loads mock responses from JSON files
   - Caches responses for performance
   - Supports different scenarios

3. **Mock Services** (`lib/testing/mocks/`)
   - `MockAIAnalysisService`: Mocks AI analysis API
   - `MockFrankensteinService`: Mocks idea generation API
   - Implement the same interfaces as production services

4. **ServiceFactory** (`src/infrastructure/factories/ServiceFactory.ts`)
   - Detects mock mode via FeatureFlagManager
   - Creates mock or production services accordingly
   - Validates configuration before creating services

5. **MockModeHelper** (`lib/testing/api/mock-mode-helper.ts`)
   - Ensures consistent service creation in API routes
   - Validates environment configuration
   - Provides diagnostic information

6. **TestEnvironmentConfig** (`lib/testing/config/test-environment.ts`)
   - Validates test environment setup
   - Prevents mock mode in production
   - Provides configuration diagnostics

### Troubleshooting Mock Mode

#### Mock Mode Not Activating

If mock mode isn't working:

1. **Check environment variables:**
   ```bash
   # Verify variables are set
   echo $FF_USE_MOCK_API
   echo $NODE_ENV
   ```

2. **Check mock status endpoint:**
   ```bash
   curl http://localhost:3000/api/test/mock-status
   ```

3. **Check application logs:**
   Look for messages like:
   - `[ServiceFactory] Mock mode verified and active`
   - `[MockModeHelper] ServiceFactory created`
   - `[TestEnvironmentConfig] Validation complete`

4. **Verify Playwright configuration:**
   Check that `playwright.config.ts` includes:
   ```typescript
   globalSetup: require.resolve('./tests/e2e/global-setup'),
   ```

#### Tests Failing with Database Errors

If tests are trying to connect to the database:

1. Mock mode is not active - check environment variables
2. ServiceFactory is not using MockModeHelper - check API route implementation
3. Environment variables not set before application starts

#### Mock Responses Not Matching Expected Data

1. Check the scenario setting: `FF_MOCK_SCENARIO`
2. Verify mock data files in `lib/testing/data/`
3. Check TestDataManager is loading the correct scenario

### Mock Mode in CI/CD

GitHub Actions automatically configures mock mode for E2E tests:

```yaml
- name: Run E2E tests
  run: npm run test:e2e
  env:
    FF_USE_MOCK_API: true
    FF_MOCK_SCENARIO: success
    NODE_ENV: test
```

The workflow includes verification steps:
1. Environment variable verification
2. Mock mode activation check
3. Application readiness check

### Mock Data Files

Mock responses are stored in JSON files:

- `lib/testing/data/analyzer-mocks.json` - Analyzer API responses
- `lib/testing/data/hackathon-mocks.json` - Hackathon analyzer responses
- `lib/testing/data/frankenstein-mocks.json` - Frankenstein API responses

Each file contains responses for different scenarios (success, error, timeout, etc.).

## Writing Tests

### Page Object Pattern

Use Page Object Models for better test maintainability:

```typescript
import { test, expect } from '@playwright/test';
import { AnalyzerPage } from './helpers/page-objects/AnalyzerPage';

test('should analyze idea successfully', async ({ page }) => {
  const analyzerPage = new AnalyzerPage(page);
  
  await analyzerPage.navigate();
  await analyzerPage.enterIdea('AI-powered task manager');
  await analyzerPage.selectLanguage('en');
  await analyzerPage.clickAnalyze();
  
  await expect(analyzerPage.scoreElement).toBeVisible();
});
```

### Using Test Helpers

```typescript
import { waitForLoadingToComplete, enableMockMode } from './helpers/test-helpers';

test('should handle loading state', async ({ page }) => {
  await enableMockMode(page);
  await page.goto('/analyzer');
  
  // Perform action that triggers loading
  await page.click('[data-testid="analyze-button"]');
  
  // Wait for loading to complete
  await waitForLoadingToComplete(page);
});
```

### Using Fixtures

```typescript
import { TEST_IDEAS, TEST_LOCALES } from './helpers/fixtures';

test('should analyze multiple ideas', async ({ page }) => {
  for (const idea of Object.values(TEST_IDEAS)) {
    // Test with each idea
  }
});
```

## Test Artifacts

Test artifacts are automatically captured on failure:

- **Screenshots**: `tests/e2e/screenshots/`
- **Videos**: `tests/e2e/videos/`
- **Reports**: `tests/e2e/reports/`

These directories are excluded from version control via `.gitignore`.

## CI/CD Integration

E2E tests run automatically in GitHub Actions on:
- Pull requests to `main` or `develop`
- Pushes to `main`

Test results and artifacts are uploaded as GitHub Actions artifacts.

## Troubleshooting

### Playwright Installation Issues

If you encounter issues installing Playwright browsers:

```bash
# Install with dependencies
npx playwright install --with-deps

# Or install specific browser
npx playwright install chromium
```

### Test Timeouts

If tests are timing out:

1. Increase timeout in `playwright.config.ts`
2. Check if the application is running (`npm run dev`)
3. Verify network connectivity
4. Enable headed mode to see what's happening: `npm run test:e2e:headed`

### Application Not Starting

If the application won't start:

1. Check for port conflicts (default: 3000)
2. Verify all dependencies are installed: `npm install`
3. Check for syntax errors: `npm run build`
4. Review application logs for errors

## Best Practices

1. **Use Page Objects**: Encapsulate page interactions in Page Object Models
2. **Use Test Helpers**: Reuse common test logic via helper functions
3. **Use Fixtures**: Define test data in fixtures for consistency
4. **Descriptive Names**: Use clear, descriptive test names
5. **Independent Tests**: Each test should be independent and not rely on others
6. **Clean Up**: Clean up test data after tests complete
7. **Mock External Services**: Use mock mode to avoid external API calls
8. **Parallel Execution**: Tests should be safe to run in parallel

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
