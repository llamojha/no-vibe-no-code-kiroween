# Test Environment Configuration

This module provides utilities for validating and managing test environment configuration, specifically for mock mode activation.

## Overview

The test environment configuration module ensures that mock mode is properly configured before tests run. It validates environment variables, checks for invalid configurations, and provides diagnostic information.

## Components

### TestEnvironmentConfig

Main class for test environment configuration management.

**Methods:**

- `validateTestEnvironment()`: Validates that required environment variables are set correctly
- `getCurrentConfig()`: Returns current test environment configuration
- `logConfiguration()`: Logs current configuration for debugging
- `isValidScenario(scenario)`: Checks if a scenario name is valid
- `getValidScenarios()`: Returns list of valid scenario names

**Example Usage:**

```typescript
import { TestEnvironmentConfig } from '@/lib/testing/config';

// Validate environment
const validation = TestEnvironmentConfig.validateTestEnvironment();
if (!validation.isValid) {
  console.error('Invalid test environment:', validation.errors);
}

// Get current configuration
const config = TestEnvironmentConfig.getCurrentConfig();
console.log('Mock mode:', config.mockMode);
console.log('Scenario:', config.scenario);

// Log configuration for debugging
TestEnvironmentConfig.logConfiguration();
```

### MockConfigurationError

Custom error class for mock configuration issues.

**Properties:**

- `message`: Error message
- `code`: Error code (from MockConfigurationErrorCodes)
- `details`: Optional additional details

**Example Usage:**

```typescript
import { MockConfigurationError, MockConfigurationErrorCodes } from '@/lib/testing/config';

throw new MockConfigurationError(
  'Mock mode cannot be enabled in production',
  MockConfigurationErrorCodes.MOCK_MODE_IN_PRODUCTION,
  { nodeEnv: process.env.NODE_ENV }
);
```

## Environment Variables

The module validates the following environment variables:

- `FF_USE_MOCK_API`: Enable/disable mock mode (`'true'` or `'false'`)
- `FF_MOCK_SCENARIO`: Mock scenario to use (default: `'success'`)
- `FF_SIMULATE_LATENCY`: Enable/disable latency simulation (`'true'` or `'false'`)
- `NODE_ENV`: Node environment (`'development'`, `'test'`, `'production'`)

## Valid Scenarios

- `success`: Successful API responses
- `api_error`: API error responses
- `timeout`: Timeout errors
- `rate_limit`: Rate limit errors
- `invalid_input`: Invalid input errors
- `partial_response`: Partial response data

## Validation Rules

1. Mock mode cannot be enabled in production (`NODE_ENV === 'production'`)
2. Scenario must be one of the valid scenarios
3. All environment variables must be properly formatted

## Error Codes

- `INVALID_TEST_ENV`: Test environment validation failed
- `MOCK_MODE_IN_PRODUCTION`: Mock mode enabled in production
- `INVALID_SCENARIO`: Invalid mock scenario specified
- `MISSING_REQUIRED_VAR`: Required environment variable missing
- `MOCK_SERVICE_CREATION_FAILED`: Failed to create mock service

## Testing

The module includes comprehensive unit tests covering:

- Environment validation with various configurations
- Configuration retrieval with different environment variables
- Scenario validation
- Error creation and handling

Run tests:

```bash
npm test -- lib/testing/config/__tests__/test-environment.test.ts --run
```

## Integration

This module is used by:

- MockModeHelper (API route helper)
- ServiceFactory (service creation with verification)
- E2E test setup (environment verification)
- CI/CD pipeline (configuration validation)
