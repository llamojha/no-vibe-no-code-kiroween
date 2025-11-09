# Mock Service Configuration Guide

This document explains how to configure mock services for testing and development.

## Overview

The mock service system allows you to test AI-powered features without consuming API credits or requiring internet connectivity. It provides configurable scenarios, latency simulation, and request logging.

## Environment Variables

All mock configuration is controlled through environment variables with the `FF_` prefix (Feature Flag).

### Core Configuration

#### `FF_USE_MOCK_API`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable or disable mock mode
- **Values**: `true`, `false`, `1`, `0`, `yes`, `no`
- **Example**: `FF_USE_MOCK_API=true`
- **Note**: Always disabled in production for safety

#### `FF_MOCK_SCENARIO`
- **Type**: String (enum)
- **Default**: `success`
- **Description**: Default test scenario to use for mock responses
- **Valid Values**:
  - `success` - Successful API response with realistic data
  - `api_error` - Simulated API error (500)
  - `timeout` - Simulated request timeout (408)
  - `rate_limit` - Simulated rate limit exceeded (429)
  - `invalid_input` - Simulated invalid input error (400)
  - `partial_response` - Simulated partial response (206)
- **Example**: `FF_MOCK_SCENARIO=success`

### Response Variability

#### `FF_MOCK_VARIABILITY`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable random selection from multiple response variants
- **Values**: `true`, `false`
- **Example**: `FF_MOCK_VARIABILITY=true`
- **Use Case**: Test handling of different response patterns

### Latency Simulation

#### `FF_SIMULATE_LATENCY`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Simulate network latency for realistic testing
- **Values**: `true`, `false`
- **Example**: `FF_SIMULATE_LATENCY=true`

#### `FF_MIN_LATENCY`
- **Type**: Number (milliseconds)
- **Default**: `500`
- **Description**: Minimum simulated latency
- **Example**: `FF_MIN_LATENCY=500`
- **Note**: Must be non-negative

#### `FF_MAX_LATENCY`
- **Type**: Number (milliseconds)
- **Default**: `2000`
- **Description**: Maximum simulated latency
- **Example**: `FF_MAX_LATENCY=2000`
- **Note**: Must be greater than or equal to MIN_LATENCY

### Debugging

#### `FF_LOG_MOCK_REQUESTS`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Log all mock requests to console for debugging
- **Values**: `true`, `false`
- **Example**: `FF_LOG_MOCK_REQUESTS=true`
- **Output Format**:
  ```json
  {
    "timestamp": "2024-11-08T10:30:00.000Z",
    "type": "analyzeIdea",
    "scenario": "success",
    "latency": 1234,
    "success": true
  }
  ```

## Configuration Examples

### Development Mode (No API Calls)
```bash
FF_USE_MOCK_API=true
FF_MOCK_SCENARIO=success
FF_SIMULATE_LATENCY=true
FF_MIN_LATENCY=500
FF_MAX_LATENCY=1500
FF_LOG_MOCK_REQUESTS=true
```

### Testing Error Scenarios
```bash
FF_USE_MOCK_API=true
FF_MOCK_SCENARIO=api_error
FF_SIMULATE_LATENCY=false
FF_LOG_MOCK_REQUESTS=true
```

### Testing with Variability
```bash
FF_USE_MOCK_API=true
FF_MOCK_SCENARIO=success
FF_MOCK_VARIABILITY=true
FF_SIMULATE_LATENCY=true
FF_MIN_LATENCY=300
FF_MAX_LATENCY=2000
```

### Production Mode (Always)
```bash
FF_USE_MOCK_API=false
# All other mock flags are ignored in production
```

## Usage in Code

### ServiceFactory Integration

The `ServiceFactory` automatically detects mock mode and creates the appropriate service:

```typescript
import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';

// Create factory with Supabase client
const factory = ServiceFactory.create(supabaseClient);

// Get AI Analysis Service (mock or production based on FF_USE_MOCK_API)
const aiService = factory.createAIAnalysisService();

// Check if mock mode is active
if (factory.isMockModeEnabled()) {
  console.log('Running in mock mode');
}
```

### Direct FeatureFlagManager Usage

```typescript
import { FeatureFlagManager } from '@/lib/testing/FeatureFlagManager';

const flagManager = new FeatureFlagManager();

// Check mock mode
if (flagManager.isMockModeEnabled()) {
  console.log('Mock mode is active');
}

// Get specific flag
const scenario = flagManager.getFlag('MOCK_SCENARIO');

// Get all flags
const allFlags = flagManager.getAllFlags();

// Get mock service config
const mockConfig = flagManager.getMockServiceConfig();
```

### Runtime Flag Updates (Testing Only)

```typescript
import { FeatureFlagManager } from '@/lib/testing/FeatureFlagManager';

const flagManager = new FeatureFlagManager();

// Only works in non-production environments
flagManager.setFlag('MOCK_SCENARIO', 'api_error');
flagManager.setFlag('SIMULATE_LATENCY', true);

// Reset to environment defaults
flagManager.reset();
```

## Validation

The `FeatureFlagManager` validates all configuration values:

### Scenario Validation
- Invalid scenarios fall back to `success` with a warning
- Case-insensitive matching

### Latency Validation
- Negative values are rejected
- Non-numeric values fall back to defaults

### Boolean Validation
- Accepts: `true`, `false`, `1`, `0`, `yes`, `no`, `y`, `n`, `t`, `f`, `on`, `off`
- Case-insensitive
- Empty or invalid values default to `false`

## Security

### Production Safety
- Mock mode is **always disabled** in production (`NODE_ENV=production`)
- Runtime flag updates throw errors in production
- Feature flag reset is blocked in production

### Best Practices
- Never commit `.env.local` with sensitive data
- Use `.env.example` as a template
- Document any custom scenarios in your team's wiki
- Review mock configurations in CI/CD pipelines

## Troubleshooting

### Mock Mode Not Activating
1. Check `NODE_ENV` - must not be `production`
2. Verify `FF_USE_MOCK_API=true` is set
3. Check for typos in environment variable names
4. Restart your development server after changing `.env.local`

### Unexpected Scenario
1. Check `FF_MOCK_SCENARIO` value
2. Verify scenario name is valid (see valid values above)
3. Check console for validation warnings
4. Review mock data files in `lib/testing/data/`

### Latency Not Working
1. Verify `FF_SIMULATE_LATENCY=true`
2. Check `FF_MIN_LATENCY` and `FF_MAX_LATENCY` values
3. Ensure values are positive numbers
4. Check that MAX >= MIN

### Logs Not Appearing
1. Verify `FF_LOG_MOCK_REQUESTS=true`
2. Check browser console (not terminal)
3. Ensure mock mode is actually active
4. Check that requests are being made

## Related Documentation

- [Testing README](./README.md) - Overview of testing infrastructure
- [Mock Services](./mocks/README.md) - Mock service implementations
- [Test Data](./data/README.md) - Mock response data files
- [E2E Testing](../../tests/e2e/SETUP.md) - End-to-end testing setup

## Support

For issues or questions:
1. Check this documentation first
2. Review the [Testing README](./README.md)
3. Check existing test files for examples
4. Consult the team's testing guidelines
