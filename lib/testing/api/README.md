# API Testing Utilities

This module provides utilities for API routes to handle mock mode properly during testing.

## Overview

The `MockModeHelper` class ensures that API routes:
1. Validate the test environment configuration
2. Create ServiceFactory instances with proper Supabase clients
3. Activate mock mode when configured
4. Provide diagnostics for debugging

## Usage

### Basic Usage in API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MockModeHelper } from '@/lib/testing/api';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Create ServiceFactory with mock mode verification
    const factory = MockModeHelper.createServiceFactory();
    
    // Get AI service (will be mock or production based on configuration)
    const aiService = factory.createAIAnalysisService();
    
    // Parse request body
    const body = await request.json();
    const { idea, locale } = body;
    
    // Call service (mock or production)
    const result = await aiService.analyzeIdea(idea, locale);
    
    if (result.success) {
      // Include mock mode status in response (for debugging)
      const response = {
        ...result.data,
        _meta: MockModeHelper.getMockModeStatus(),
      };
      
      return NextResponse.json(response);
    } else {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof MockConfigurationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }
    throw error;
  }
}
```

### Error Handling

```typescript
import { MockConfigurationError } from '@/lib/testing/config';

try {
  const factory = MockModeHelper.createServiceFactory();
  // Use factory...
} catch (error) {
  if (error instanceof MockConfigurationError) {
    console.error('Configuration error:', error.code, error.details);
    // Handle configuration error
  }
  throw error;
}
```

### Checking Mock Mode Status

```typescript
// Check if mock mode is active
if (MockModeHelper.isMockModeActive()) {
  console.log('Running in mock mode');
}

// Get detailed status
const status = MockModeHelper.getMockModeStatus();
console.log('Mock mode:', status.mockMode);
console.log('Scenario:', status.scenario);
console.log('Timestamp:', status.timestamp);
```

### Getting Configuration

```typescript
// Get current configuration
const config = MockModeHelper.getConfiguration();
console.log('Mock mode:', config.mockMode);
console.log('Scenario:', config.scenario);
console.log('Simulate latency:', config.simulateLatency);
console.log('Node environment:', config.nodeEnv);
```

### Validating Environment

```typescript
// Validate environment without throwing errors
const validation = MockModeHelper.validateEnvironment();

if (!validation.isValid) {
  console.error('Environment errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Environment warnings:', validation.warnings);
}
```

### Logging Configuration

```typescript
// Log current configuration for debugging
// Only logs in non-production environments
MockModeHelper.logConfiguration();
```

## API Reference

### MockModeHelper

#### Static Methods

##### `createServiceFactory(): ServiceFactory`

Creates a ServiceFactory instance with mock mode verification.

**Returns:** ServiceFactory instance configured for current environment

**Throws:** `MockConfigurationError` if environment validation fails

**Example:**
```typescript
const factory = MockModeHelper.createServiceFactory();
const aiService = factory.createAIAnalysisService();
```

##### `isMockModeActive(): boolean`

Checks if mock mode is currently active.

**Returns:** `true` if mock mode is enabled, `false` otherwise

**Example:**
```typescript
if (MockModeHelper.isMockModeActive()) {
  console.log('Running in mock mode');
}
```

##### `getMockModeStatus(): MockModeStatus`

Gets mock mode status for API responses.

**Returns:** Object with `mockMode`, `scenario`, and `timestamp`

**Example:**
```typescript
const status = MockModeHelper.getMockModeStatus();
return NextResponse.json({
  ...data,
  _meta: status,
});
```

##### `getConfiguration(): TestEnvironmentConfiguration`

Gets current test environment configuration.

**Returns:** Configuration object with all environment settings

**Example:**
```typescript
const config = MockModeHelper.getConfiguration();
console.log('Scenario:', config.scenario);
```

##### `validateEnvironment(): ValidationResult`

Validates test environment without throwing errors.

**Returns:** Validation result with `isValid`, `errors`, and `warnings`

**Example:**
```typescript
const validation = MockModeHelper.validateEnvironment();
if (!validation.isValid) {
  console.error('Errors:', validation.errors);
}
```

##### `logConfiguration(): void`

Logs current configuration for debugging (non-production only).

**Example:**
```typescript
MockModeHelper.logConfiguration();
```

## Types

### MockModeStatus

```typescript
interface MockModeStatus {
  mockMode: boolean;      // Whether mock mode is active
  scenario: string;       // Current mock scenario
  timestamp: string;      // ISO timestamp of status check
}
```

## Environment Variables

The MockModeHelper reads the following environment variables:

- `FF_USE_MOCK_API`: Set to `"true"` to enable mock mode
- `FF_MOCK_SCENARIO`: Mock scenario to use (default: `"success"`)
- `FF_SIMULATE_LATENCY`: Set to `"true"` to simulate API latency
- `NODE_ENV`: Node environment (`"test"`, `"development"`, `"production"`)

## Error Handling

### MockConfigurationError

Thrown when environment validation fails.

**Properties:**
- `message`: Error message
- `code`: Error code (from `MockConfigurationErrorCodes`)
- `details`: Additional error details (optional)

**Error Codes:**
- `INVALID_TEST_ENV`: Test environment validation failed
- `MOCK_MODE_IN_PRODUCTION`: Mock mode cannot be enabled in production
- `INVALID_SCENARIO`: Invalid mock scenario specified
- `MISSING_REQUIRED_VAR`: Required environment variable missing
- `MOCK_SERVICE_CREATION_FAILED`: Failed to create mock service

## Testing

Tests are located in `__tests__/mock-mode-helper.test.ts`.

Run tests:
```bash
npm test -- lib/testing/api/__tests__/mock-mode-helper.test.ts --run
```

## Related Modules

- `lib/testing/config` - Test environment configuration
- `src/infrastructure/factories/ServiceFactory` - Service factory
- `src/infrastructure/integration/SupabaseAdapter` - Supabase client adapter

## Security Considerations

- Mock mode is automatically disabled in production
- ServiceFactory creates fresh Supabase clients per request (no session leaks)
- Environment validation prevents misconfiguration
- Clear error messages for debugging without exposing sensitive information
