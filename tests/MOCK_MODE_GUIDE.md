# Mock Mode Configuration Guide

## Overview

This guide provides detailed instructions for configuring and using mock mode in the application. Mock mode allows you to run E2E tests and develop features without external API calls or database connections.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Configuration](#configuration)
3. [Verification](#verification)
4. [Troubleshooting](#troubleshooting)
5. [Advanced Usage](#advanced-usage)
6. [Architecture](#architecture)

---

## Quick Start

### For E2E Tests

E2E tests automatically use mock mode. Just run:

```bash
npm run test:e2e
```

The Playwright global setup ensures mock mode is active before tests run.

### For Local Development

1. Create or update `.env.local`:
   ```bash
   FF_USE_MOCK_API=true
   NODE_ENV=test
   FF_MOCK_SCENARIO=success
   ```

2. Start the application:
   ```bash
   npm run dev
   ```

3. Verify mock mode is active:
   ```bash
   curl http://localhost:3000/api/test/mock-status
   ```

---

## Configuration

### Required Environment Variables

These variables MUST be set for mock mode to work:

```bash
# Enable mock mode
FF_USE_MOCK_API=true

# Set environment to test (prevents production service creation)
NODE_ENV=test
```

### Optional Environment Variables

These variables customize mock behavior:

```bash
# Mock scenario (default: success)
# Options: success, api_error, timeout, rate_limit, invalid_input, partial_response
FF_MOCK_SCENARIO=success

# Simulate network latency (default: false)
FF_SIMULATE_LATENCY=false

# Latency range in milliseconds (only if FF_SIMULATE_LATENCY=true)
FF_MIN_LATENCY=500
FF_MAX_LATENCY=2000

# Enable debug logging (default: false)
FF_LOG_MOCK_REQUESTS=true
```

### Configuration Files

#### `.env.local` (Local Development)

```bash
# Mock mode for local development
FF_USE_MOCK_API=true
NODE_ENV=development
FF_MOCK_SCENARIO=success
FF_LOG_MOCK_REQUESTS=true
```

#### `.env.test` (Test Environment)

```bash
# Mock mode for tests
FF_USE_MOCK_API=true
NODE_ENV=test
FF_MOCK_SCENARIO=success
FF_SIMULATE_LATENCY=false
```

#### `playwright.config.ts` (E2E Tests)

```typescript
export default defineConfig({
  globalSetup: require.resolve('./tests/e2e/global-setup'),
  
  use: {
    baseURL: 'http://localhost:3000',
  },
  
  // These are set automatically by the test runner
  // but can be overridden via environment variables
});
```

---

## Verification

### Check Mock Status Endpoint

The `/api/test/mock-status` endpoint provides real-time mock mode status:

```bash
curl http://localhost:3000/api/test/mock-status
```

**Success Response:**
```json
{
  "mockMode": true,
  "scenario": "success",
  "simulateLatency": false,
  "nodeEnv": "test",
  "isValid": true,
  "errors": [],
  "warnings": [],
  "timestamp": "2025-11-09T12:34:56.789Z"
}
```

**Error Response:**
```json
{
  "mockMode": false,
  "scenario": "success",
  "simulateLatency": false,
  "nodeEnv": "production",
  "isValid": false,
  "errors": ["Mock mode cannot be enabled in production"],
  "warnings": [],
  "timestamp": "2025-11-09T12:34:56.789Z"
}
```

### Check Application Logs

When mock mode is active, you should see log messages like:

```
[TestEnvironmentConfig] Validation complete { mockMode: true, scenario: 'success', ... }
[ServiceFactory] Mock mode verified and active { scenario: 'success', simulateLatency: false }
[MockModeHelper] ServiceFactory created { mockMode: true, servicesCreated: [], ... }
[ServiceFactory] ✅ Mock AI Analysis Service created
```

### Verify in E2E Tests

The Playwright global setup automatically verifies mock mode:

```typescript
// tests/e2e/global-setup.ts
await MockModeSetup.waitForMockMode(baseURL, 10, 2000);
```

If mock mode fails to activate, the setup will throw an error and tests won't run.

---

## Troubleshooting

### Problem: Mock mode not activating

**Symptoms:**
- Tests fail with database connection errors
- API calls return real responses
- Mock status endpoint shows `mockMode: false`

**Solutions:**

1. **Check environment variables:**
   ```bash
   # Verify variables are set
   echo $FF_USE_MOCK_API  # Should be "true"
   echo $NODE_ENV         # Should be "test" or "development"
   ```

2. **Restart the application:**
   Environment variables are read at startup. If you change them, restart:
   ```bash
   # Stop the application (Ctrl+C)
   # Start again
   npm run dev
   ```

3. **Check for typos:**
   Variable names are case-sensitive:
   - ✅ `FF_USE_MOCK_API=true`
   - ❌ `FF_USE_MOCK_api=true`
   - ❌ `ff_use_mock_api=true`

4. **Verify file location:**
   - `.env.local` should be in the project root
   - Not in a subdirectory
   - Not named `.env.local.txt`

### Problem: Mock mode works locally but not in CI

**Symptoms:**
- Tests pass locally but fail in GitHub Actions
- CI logs show database connection attempts

**Solutions:**

1. **Check GitHub Actions workflow:**
   Verify environment variables are set in `.github/workflows/e2e-tests.yml`:
   ```yaml
   env:
     FF_USE_MOCK_API: true
     NODE_ENV: test
     FF_MOCK_SCENARIO: success
   ```

2. **Check workflow steps:**
   Ensure the mock mode verification step runs before tests:
   ```yaml
   - name: Verify mock mode is active
     run: |
       response=$(curl -s http://localhost:3000/api/test/mock-status)
       mockMode=$(echo $response | jq -r '.mockMode')
       if [ "$mockMode" != "true" ]; then
         echo "ERROR: Mock mode is not active!"
         exit 1
       fi
   ```

3. **Check application start:**
   Ensure environment variables are passed when starting the app:
   ```yaml
   - name: Start application
     run: npm run start &
     env:
       FF_USE_MOCK_API: true
       NODE_ENV: test
   ```

### Problem: Mock responses don't match expected data

**Symptoms:**
- Tests fail with assertion errors
- Response data is different than expected
- Missing fields in responses

**Solutions:**

1. **Check scenario setting:**
   ```bash
   echo $FF_MOCK_SCENARIO  # Should match your test expectations
   ```

2. **Verify mock data files:**
   Check the JSON files in `lib/testing/data/`:
   - `analyzer-mocks.json`
   - `hackathon-mocks.json`
   - `frankenstein-mocks.json`

3. **Check scenario exists:**
   Each mock file should have your scenario:
   ```json
   {
     "success": { ... },
     "api_error": { ... },
     "your_scenario": { ... }
   }
   ```

4. **Validate mock data:**
   Run the validation script:
   ```bash
   node scripts/validate-mocks.js
   ```

### Problem: Production environment shows mock mode

**Symptoms:**
- Mock status endpoint accessible in production
- Production logs show mock service creation

**Solutions:**

This should NEVER happen. The system has safeguards:

1. **TestEnvironmentConfig validation:**
   Prevents mock mode in production:
   ```typescript
   if (process.env.NODE_ENV === 'production' && useMockApi === 'true') {
     errors.push('Mock mode cannot be enabled in production');
   }
   ```

2. **Mock status endpoint blocked:**
   Returns 403 in production:
   ```typescript
   if (process.env.NODE_ENV === 'production') {
     return NextResponse.json(
       { error: 'Not available in production' },
       { status: 403 }
     );
   }
   ```

If you see this:
1. Check `NODE_ENV` is set to `production`
2. Verify environment variables in deployment
3. Review deployment configuration

### Problem: Playwright global setup fails

**Symptoms:**
- Error: "Mock mode failed to activate after X attempts"
- Tests don't run at all
- Setup timeout

**Solutions:**

1. **Check application is running:**
   ```bash
   curl http://localhost:3000/api/test/mock-status
   ```

2. **Increase timeout:**
   Edit `tests/e2e/global-setup.ts`:
   ```typescript
   await MockModeSetup.waitForMockMode(baseURL, 20, 3000); // 20 attempts, 3s delay
   ```

3. **Check port availability:**
   Ensure port 3000 is not in use:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

4. **Run setup manually:**
   ```bash
   # Start app
   FF_USE_MOCK_API=true NODE_ENV=test npm run dev
   
   # In another terminal, check status
   curl http://localhost:3000/api/test/mock-status
   ```

---

## Advanced Usage

### Custom Mock Scenarios

You can create custom scenarios for specific test cases:

1. **Add scenario to mock data files:**
   ```json
   {
     "success": { ... },
     "custom_scenario": {
       "score": 42,
       "analysis": "Custom test data"
     }
   }
   ```

2. **Use in tests:**
   ```bash
   FF_MOCK_SCENARIO=custom_scenario npm run test:e2e
   ```

### Simulating Network Conditions

Test how your application handles slow networks:

```bash
FF_USE_MOCK_API=true \
FF_SIMULATE_LATENCY=true \
FF_MIN_LATENCY=2000 \
FF_MAX_LATENCY=5000 \
npm run dev
```

### Debugging Mock Requests

Enable detailed logging:

```bash
FF_USE_MOCK_API=true \
FF_LOG_MOCK_REQUESTS=true \
npm run dev
```

This logs:
- When mock services are created
- Which scenario is being used
- Request/response details
- Timing information

### Testing Error Scenarios

Test how your application handles errors:

```bash
# API errors
FF_MOCK_SCENARIO=api_error npm run test:e2e

# Timeouts
FF_MOCK_SCENARIO=timeout npm run test:e2e

# Rate limiting
FF_MOCK_SCENARIO=rate_limit npm run test:e2e

# Invalid input
FF_MOCK_SCENARIO=invalid_input npm run test:e2e
```

### Integration Testing

Run integration tests to verify mock system:

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm test tests/integration/service-factory.test.ts
```

---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │ API Routes │  │ Components │  │ Server Actions         │ │
│  └─────┬──────┘  └────────────┘  └───────────┬────────────┘ │
│        │                                      │              │
│        └──────────────┬───────────────────────┘              │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Integration Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MockModeHelper                          │   │
│  │  - createServiceFactory()                            │   │
│  │  - isMockModeActive()                                │   │
│  │  - getMockModeStatus()                               │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │         TestEnvironmentConfig                        │   │
│  │  - validateTestEnvironment()                         │   │
│  │  - getCurrentConfig()                                │   │
│  └────────────────────┬─────────────────────────────────┘   │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              ServiceFactory                          │   │
│  │  - createAIAnalysisService()                         │   │
│  │  - verifyMockConfiguration()                         │   │
│  │  - getDiagnostics()                                  │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│         ┌─────────────┴─────────────┐                        │
│         ▼                           ▼                        │
│  ┌─────────────┐            ┌──────────────┐                │
│  │ Mock Mode   │            │ Production   │                │
│  │ (Test)      │            │ Mode         │                │
│  └──────┬──────┘            └──────────────┘                │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Mock System                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           FeatureFlagManager                         │   │
│  │  - isMockModeEnabled()                               │   │
│  │  - getFlag()                                         │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │           TestDataManager                            │   │
│  │  - getMockResponse()                                 │   │
│  │  - loadMockData()                                    │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│         ┌─────────────┴─────────────┐                        │
│         ▼                           ▼                        │
│  ┌─────────────────┐      ┌──────────────────────┐          │
│  │ MockAIAnalysis  │      │ MockFrankenstein     │          │
│  │ Service         │      │ Service              │          │
│  └─────────────────┘      └──────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **API Request** → API Route receives request
2. **Service Creation** → MockModeHelper.createServiceFactory()
3. **Environment Validation** → TestEnvironmentConfig.validateTestEnvironment()
4. **Factory Creation** → ServiceFactory.create()
5. **Mode Detection** → FeatureFlagManager.isMockModeEnabled()
6. **Service Selection** → Mock or Production service
7. **Mock Response** → TestDataManager.getMockResponse()
8. **Response** → API Route returns response

### Key Files

**Integration Layer:**
- `lib/testing/api/mock-mode-helper.ts` - API route helper
- `lib/testing/config/test-environment.ts` - Environment validation

**Service Layer:**
- `src/infrastructure/factories/ServiceFactory.ts` - Service factory

**Mock System:**
- `lib/testing/FeatureFlagManager.ts` - Feature flag management
- `lib/testing/TestDataManager.ts` - Mock data management
- `lib/testing/mocks/MockAIAnalysisService.ts` - Mock AI service
- `lib/testing/mocks/MockFrankensteinService.ts` - Mock Frankenstein service

**Mock Data:**
- `lib/testing/data/analyzer-mocks.json` - Analyzer responses
- `lib/testing/data/hackathon-mocks.json` - Hackathon responses
- `lib/testing/data/frankenstein-mocks.json` - Frankenstein responses

**Test Setup:**
- `tests/e2e/global-setup.ts` - Playwright global setup
- `tests/e2e/setup/mock-mode-setup.ts` - Mock mode verification
- `playwright.config.ts` - Playwright configuration

**API Endpoints:**
- `app/api/test/mock-status/route.ts` - Mock status endpoint
- `app/api/analyze/route.ts` - Analyzer API (uses MockModeHelper)
- `app/api/analyze-hackathon/route.ts` - Hackathon API (uses MockModeHelper)
- `app/api/doctor-frankenstein/generate/route.ts` - Frankenstein API (uses MockModeHelper)

---

## Additional Resources

- [Testing Documentation](./README.md) - Main testing guide
- [E2E Test Setup](./e2e/setup/README.md) - E2E test configuration
- [Mock Mode Helper](../lib/testing/api/README.md) - API integration guide
- [Test Environment Config](../lib/testing/config/README.md) - Environment setup
- [Mock Status Endpoint](../app/api/test/mock-status/README.md) - Status API docs

---

## Support

If you encounter issues not covered in this guide:

1. Check application logs for error messages
2. Verify environment variables are set correctly
3. Run integration tests to identify the problem
4. Check the mock status endpoint for diagnostics
5. Review the troubleshooting section above

For additional help, refer to the comprehensive documentation in each component's README file.
