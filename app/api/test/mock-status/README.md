# Mock Status API Endpoint

## Overview

This endpoint provides real-time information about the mock mode configuration and validation status. It's designed for use by E2E tests and development tools to verify that the application is properly configured for testing.

## Endpoint

```
GET /api/test/mock-status
```

## Security

- **Production Protection**: Returns 403 Forbidden in production environments
- **Test/Development Only**: Only accessible when `NODE_ENV` is not `production`

## Response Format

```typescript
{
  mockMode: boolean;           // Whether mock mode is active
  scenario: string;            // Current mock scenario (e.g., 'success', 'api_error')
  simulateLatency: boolean;    // Whether latency simulation is enabled
  nodeEnv: string;            // Current NODE_ENV value
  isValid: boolean;           // Whether environment configuration is valid
  errors: string[];           // Configuration errors (if any)
  warnings: string[];         // Configuration warnings (if any)
  timestamp: string;          // ISO 8601 timestamp of the response
}
```

## Example Responses

### Success (Mock Mode Active)

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

### Production Environment

```json
{
  "error": "Not available in production"
}
```

Status: 403 Forbidden

### Mock Mode Disabled

```json
{
  "mockMode": false,
  "scenario": "success",
  "simulateLatency": false,
  "nodeEnv": "development",
  "isValid": true,
  "errors": [],
  "warnings": [],
  "timestamp": "2025-11-09T12:34:56.789Z"
}
```

## Usage

### E2E Test Setup

```typescript
import { MockModeSetup } from '@/tests/e2e/setup/mock-mode-setup';

// Verify mock mode before running tests
await MockModeSetup.verifyMockModeActive('http://localhost:3000');
```

### Manual Verification

```bash
# Check mock mode status
curl http://localhost:3000/api/test/mock-status

# With jq for formatted output
curl -s http://localhost:3000/api/test/mock-status | jq
```

### CI/CD Pipeline

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

## Implementation Details

The endpoint uses:
- `TestEnvironmentConfig.getCurrentConfig()` - Get current environment configuration
- `TestEnvironmentConfig.validateTestEnvironment()` - Validate configuration and get errors/warnings

## Testing

This endpoint is tested through:
1. **E2E Tests**: Playwright tests verify the endpoint during test setup
2. **Integration Tests**: CI/CD pipeline validates mock mode activation
3. **Manual Testing**: Developers can verify configuration during development

## Related Files

- `/lib/testing/config/test-environment.ts` - Environment configuration logic
- `/tests/e2e/setup/mock-mode-setup.ts` - E2E test setup that uses this endpoint
- `/.github/workflows/e2e-tests.yml` - CI/CD workflow that verifies mock mode

## Requirements Satisfied

- **1.5**: Mechanism to verify mock mode is active during test execution
- **4.2**: Verify mock mode is active before running tests
- **4.4**: Clear error messages if mock mode fails to activate
