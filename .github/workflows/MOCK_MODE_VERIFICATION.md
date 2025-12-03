# Mock Mode Verification in GitHub Actions

## Overview

The E2E test workflow now includes comprehensive mock mode verification to ensure tests run with properly configured mock services. This prevents tests from attempting to connect to real APIs or databases.

## Verification Steps

### 1. Environment Variable Verification

**Purpose**: Validate that all required environment variables are set correctly before running tests.

**What it checks**:
- `FF_USE_MOCK_API` is set to `true`
- `NODE_ENV` is set appropriately (test or production)
- All mock configuration variables are present

**Output Example**:
```
=== Mock Mode Environment Variables ===
FF_USE_MOCK_API: true
NEXT_PUBLIC_FF_USE_MOCK_API: true
FF_MOCK_SCENARIO: success
FF_SIMULATE_LATENCY: false
NODE_ENV: test
=======================================
✅ FF_USE_MOCK_API is correctly set to 'true'
✅ NODE_ENV is set to: test
✅ Environment variable verification complete
```

**Failure Behavior**: Exits with code 1 and displays clear error message.

### 2. Mock Mode Status Verification

**Purpose**: Confirm that the application is actually running in mock mode by querying the mock status endpoint.

**What it checks**:
- `/api/test/mock-status` endpoint is accessible (HTTP 200)
- Response contains `mockMode: true`
- Configuration is valid

**Output Example**:
```
=== Verifying Mock Mode Status ===
HTTP Status Code: 200
Response Body:
{
  "mockMode": true,
  "scenario": "success",
  "simulateLatency": false,
  "nodeEnv": "test",
  "isValid": true,
  "errors": [],
  "warnings": [],
  "timestamp": "2024-11-09T12:34:56.789Z"
}
✅ Mock status endpoint is accessible
✅ Mock mode is active on the server

Mock Mode Configuration:
  - Scenario: success
  - Valid: true

✅ Mock mode verification complete - ready to run E2E tests
```

**Failure Behavior**: Exits with code 1 if:
- Endpoint returns non-200 status
- `mockMode` field is not `true`
- Response cannot be parsed

### 3. Enhanced Application Start

**Purpose**: Start the application with all required environment variables and wait for it to be fully ready.

**What it does**:
- Sets all mock mode environment variables
- Starts application in background
- Waits for main application endpoint
- Waits for mock status endpoint
- Allows time for full initialization

**Output Example**:
```
=== Starting Application with Mock Mode ===
Setting environment variables...
✅ Application started with PID: 12345
Waiting for application to initialize...

=== Waiting for Application ===
Waiting for application to respond...
✅ Application is ready
```

## Environment Variables

The following environment variables are set for mock mode:

| Variable | Value | Purpose |
|----------|-------|---------|
| `FF_USE_MOCK_API` | `true` | Enable mock mode |
| `NEXT_PUBLIC_FF_USE_MOCK_API` | `true` | Client-side mock mode flag |
| `FF_MOCK_SCENARIO` | `success` | Mock scenario to use |
| `FF_SIMULATE_LATENCY` | `false` | Disable latency simulation for faster tests |
| `NODE_ENV` | `test` | Set Node environment to test mode |
| `PORT` | `3000` | Application port |

## Workflow Sequence

```
┌─────────────────────────────────────┐
│ 1. Build Application                │
│    (with mock mode env vars)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 2. Start Application                │
│    (background, with all env vars)  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 3. Wait for Application             │
│    - Main endpoint                  │
│    - Mock status endpoint           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 4. Verify Environment Variables     │
│    ✅ Pass → Continue                │
│    ❌ Fail → Exit with error         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 5. Verify Mock Mode Active          │
│    ✅ Pass → Continue                │
│    ❌ Fail → Exit with error         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 6. Run E2E Tests                    │
│    (guaranteed mock mode)           │
└─────────────────────────────────────┘
```

## Troubleshooting

### Mock Mode Not Active

**Symptom**: "Mock mode is not active on the server" error

**Possible Causes**:
1. Environment variables not set correctly
2. Application not reading environment variables
3. ServiceFactory not detecting mock mode
4. Feature flag manager not initialized

**Solution**:
1. Check "Verify environment variables" step output
2. Review application logs for feature flag initialization
3. Verify `TestEnvironmentConfig` is working correctly
4. Check that `MockModeHelper` is being used in API routes

### Mock Status Endpoint Not Available

**Symptom**: "Mock status endpoint returned HTTP 404" or timeout

**Possible Causes**:
1. Application not fully started
2. Endpoint not implemented
3. Route configuration issue

**Solution**:
1. Increase wait timeout in "Wait for application" step
2. Verify `/app/api/test/mock-status/route.ts` exists
3. Check application build logs for errors

### Environment Variables Not Set

**Symptom**: "FF_USE_MOCK_API is not set to 'true'" error

**Possible Causes**:
1. Environment variables not passed to step
2. Typo in variable name
3. Variable overridden by another step

**Solution**:
1. Check `env:` section in workflow step
2. Verify variable names match exactly
3. Review workflow for conflicting environment settings

## Testing the Workflow

### Local Testing

You cannot fully test GitHub Actions locally, but you can test the verification logic:

```bash
# Set environment variables
$env:FF_USE_MOCK_API = "true"
$env:FF_MOCK_SCENARIO = "success"
$env:NODE_ENV = "test"

# Start application
npm run start

# In another terminal, test the mock status endpoint
curl http://localhost:3000/api/test/mock-status

# Expected response:
# {"mockMode":true,"scenario":"success",...}
```

### CI Testing

1. Push changes to a feature branch
2. Open a pull request to trigger the workflow
3. Monitor the workflow execution in GitHub Actions
4. Review the logs for each verification step
5. Confirm E2E tests run successfully

## Benefits

1. **Fail Fast**: Catches configuration issues before running tests
2. **Clear Diagnostics**: Detailed logging for troubleshooting
3. **Reliability**: Guarantees mock mode is active
4. **Confidence**: No accidental real API calls in CI
5. **Maintainability**: Well-documented verification process

## Related Files

- `.github/workflows/e2e-tests.yml` - Main workflow file
- `app/api/test/mock-status/route.ts` - Mock status endpoint
- `lib/testing/config/test-environment.ts` - Environment validation
- `lib/testing/api/mock-mode-helper.ts` - API route helper
- `tests/e2e/setup/mock-mode-setup.ts` - E2E test setup

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Playwright CI Configuration](https://playwright.dev/docs/ci)
