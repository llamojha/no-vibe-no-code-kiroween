# E2E Test Setup

This directory contains setup utilities for E2E tests, ensuring the test environment is properly configured before tests run.

## MockModeSetup

The `MockModeSetup` class verifies that mock mode is active before E2E tests execute. This prevents tests from making real API calls or database connections.

### Features

- **Mock Mode Verification**: Checks the `/api/test/mock-status` endpoint to verify mock mode is active
- **Retry Logic**: Automatically retries verification with configurable attempts and delays
- **Timeout Protection**: Prevents indefinite waiting with configurable timeouts
- **Clear Error Messages**: Provides actionable error messages when verification fails
- **Environment Logging**: Logs configuration for debugging

### Usage

The `MockModeSetup` is automatically used by the global setup in `tests/e2e/global-setup.ts`. You don't need to call it directly in your tests.

### Configuration

You can configure the retry behavior:

```typescript
await MockModeSetup.waitForMockMode(baseURL, {
  maxAttempts: 10,      // Maximum number of verification attempts
  delayMs: 2000,        // Delay between attempts in milliseconds
  timeoutMs: 60000,     // Total timeout in milliseconds
});
```

### Manual Verification

To manually verify mock mode is active:

```typescript
import { MockModeSetup } from './setup/mock-mode-setup';

const result = await MockModeSetup.verifyMockModeActive('http://localhost:3000');

if (result.isActive) {
  console.log('Mock mode is active');
  console.log('Details:', result.details);
} else {
  console.error('Mock mode is not active:', result.error);
}
```

### Environment Variables

The following environment variables control mock mode:

- `FF_USE_MOCK_API`: Set to `"true"` to enable mock mode
- `FF_MOCK_SCENARIO`: Mock scenario to use (default: `"success"`)
- `FF_SIMULATE_LATENCY`: Set to `"true"` to simulate API latency
- `FF_LOG_MOCK_REQUESTS`: Set to `"true"` to log mock requests
- `NODE_ENV`: Should be `"test"` or `"development"` for mock mode

### Troubleshooting

If mock mode verification fails:

1. **Check the application is running**: Ensure `npm run dev` is running
2. **Verify environment variables**: Check that `FF_USE_MOCK_API=true` is set
3. **Test the endpoint manually**: Visit `http://localhost:3000/api/test/mock-status`
4. **Check the logs**: Look for error messages in the console output
5. **Review the configuration**: Use `MockModeSetup.logEnvironmentConfig()` to see current settings

### Requirements

This implementation satisfies the following requirements:

- **4.1**: E2E test setup sets required environment variables before the application starts
- **4.2**: E2E test setup verifies that mock mode is active before running tests
- **4.3**: When E2E tests run, the application does not attempt to connect to real databases or external APIs
- **4.4**: E2E test configuration provides clear error messages if mock mode fails to activate
- **4.5**: E2E tests can run completely offline without external dependencies

## Integration with Playwright

The `MockModeSetup` is integrated into Playwright's global setup:

1. **Global Setup** (`tests/e2e/global-setup.ts`):
   - Logs environment configuration
   - Creates necessary directories
   - Calls `MockModeSetup.waitForMockMode()` to verify mock mode
   - Fails fast if mock mode cannot be activated

2. **Playwright Configuration** (`playwright.config.ts`):
   - Sets environment variables for the dev server
   - Adds test mode headers to all requests
   - Configures base URL and timeouts
   - Includes metadata about mock mode configuration

## Example Output

When mock mode verification succeeds:

```
🔧 Setting up E2E test environment...

📋 Environment Configuration:
[MockModeSetup] Environment Configuration: {
  FF_USE_MOCK_API: 'true',
  FF_MOCK_SCENARIO: 'success',
  NODE_ENV: 'test',
  ...
}

✅ Created coverage directory
✅ Created reports directory

🔍 Verifying mock mode is active...
[Global Setup] Base URL: http://localhost:3000
[MockModeSetup] ✅ Mock mode verified and active (attempt 1/10)
[MockModeSetup] Configuration: {
  scenario: 'success',
  nodeEnv: 'test',
  warnings: []
}

✅ Mock mode verified and active
✅ E2E test environment ready
```

When mock mode verification fails:

```
🔧 Setting up E2E test environment...

🔍 Verifying mock mode is active...
[MockModeSetup] ⏳ Mock mode not ready (attempt 1/10): Mock mode is not active on the server
[MockModeSetup] ⏳ Mock mode not ready (attempt 2/10): Mock mode is not active on the server
...

❌ Mock mode verification failed:
Mock mode failed to activate after 10 attempts.
Please ensure:
  1. The application is running at http://localhost:3000
  2. FF_USE_MOCK_API environment variable is set to "true"
  3. NODE_ENV is set to "test" or "development"
  4. The /api/test/mock-status endpoint is accessible

Tests cannot run without mock mode active.
This prevents tests from making real API calls or database connections.
```
