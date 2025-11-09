# Integration Tests

This directory contains integration tests for the mock system integration fix. These tests verify that the mock system properly integrates with the application layer.

## Test Files

### 1. environment-configuration.test.ts
Tests the TestEnvironmentConfig module and MockConfigurationError handling.

**Coverage:**
- Environment validation with valid and invalid configurations
- Configuration retrieval and defaults
- Production environment validation
- Scenario validation
- Error handling

**Requirements:** 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4

### 2. service-factory.test.ts
Tests the ServiceFactory integration with mock mode.

**Coverage:**
- Mock service creation when flag is enabled
- Production service error handling
- Service caching
- Diagnostics and configuration reporting
- Mock configuration verification

**Requirements:** 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4

### 3. mock-service-functionality.test.ts
Tests the functionality of mock services.

**Coverage:**
- Mock response generation
- Scenario configuration (success, error, timeout, rate_limit)
- Latency simulation
- Error scenario handling
- Performance metrics tracking
- Request logging
- Data integrity

**Requirements:** 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4

### 4. api-routes.test.ts
Tests the integration of API routes with mock mode.

**Coverage:**
- MockModeHelper usage in API routes
- Mock mode status in responses
- Configuration validation
- Error handling
- Production mode behavior
- Service creation consistency

**Requirements:** 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4

## Running Tests

Run all integration tests:
```bash
npm test -- tests/integration --run
```

Run specific test file:
```bash
npm test -- tests/integration/environment-configuration.test.ts --run
```

Run with coverage:
```bash
npm test -- tests/integration --run --coverage
```

## Test Environment

The tests require the following environment variables to be set:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL (can be test value)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (can be test value)
- `FF_USE_MOCK_API` - Enable/disable mock mode
- `FF_MOCK_SCENARIO` - Mock scenario to use
- `FF_SIMULATE_LATENCY` - Enable/disable latency simulation
- `NODE_ENV` - Node environment (test, development, production)

## Test Results

All 78 tests pass successfully:
- ✅ 18 environment configuration tests
- ✅ 17 service factory tests
- ✅ 20 mock service functionality tests
- ✅ 23 API route integration tests

## Notes

- Tests use mock Supabase credentials for testing purposes
- Supabase cookie warnings in test output are expected and don't affect test results
- Tests verify both success and error scenarios
- Performance metrics tests allow for 0ms duration for very fast operations
