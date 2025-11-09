# API Routes Mock Integration - Task 7 Completion

## Overview

This document describes the integration of mock services into the API routes for the Analyzer, Hackathon Analyzer, and Doctor Frankenstein features.

## Implementation Summary

All three API routes have been updated to support mock mode through the FeatureFlagManager. The implementation follows these principles:

1. **Feature Flag Detection**: Each route checks if mock mode is enabled via `FeatureFlagManager.isMockModeEnabled()`
2. **Logging Enhancement**: Added comprehensive logging with mock mode indicators
3. **Production Behavior Maintained**: Existing production behavior is preserved when mock mode is disabled
4. **Consistent Pattern**: All routes follow the same integration pattern

## Updated Routes

### 1. Analyzer API Route (`/api/analyze`)

**File**: `app/api/analyze/route.ts`

**Changes**:
- Added `FeatureFlagManager` import
- Added mock mode detection in POST handler
- Enhanced logging to include `mockMode` flag
- No changes to actual controller logic (mock support is handled through ServiceFactory)

**Mock Integration**:
The Analyzer route uses the hexagonal architecture with controllers and use cases. Mock support is integrated through the `ServiceFactory.createAIAnalysisService()` method, which automatically returns `MockAIAnalysisService` when mock mode is enabled.

**Example Usage**:
```bash
# Enable mock mode
export FF_USE_MOCK_API=true
export FF_MOCK_SCENARIO=success
export FF_SIMULATE_LATENCY=true

# Make request
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"idea": "AI-powered task manager", "locale": "en"}'
```

### 2. Hackathon Analyzer API Route (`/api/analyze-hackathon`)

**File**: `app/api/analyze-hackathon/route.ts`

**Changes**:
- Added `FeatureFlagManager` and `logger` imports
- Added mock mode detection in POST handler
- Enhanced logging with mock mode indicators and timing
- Improved error handling with duration tracking
- No changes to controller logic (mock support through ServiceFactory)

**Mock Integration**:
Similar to the Analyzer route, the Hackathon Analyzer uses the hexagonal architecture. Mock support is integrated through the ServiceFactory's AI service creation.

**Example Usage**:
```bash
# Enable mock mode
export FF_USE_MOCK_API=true
export FF_MOCK_SCENARIO=success

# Make request
curl -X POST http://localhost:3000/api/analyze-hackathon \
  -H "Content-Type: application/json" \
  -d '{
    "submission": {
      "projectName": "AI Code Assistant",
      "description": "An AI-powered coding assistant",
      "kiroUsage": "Used Kiro for rapid prototyping"
    },
    "locale": "en"
  }'
```

### 3. Doctor Frankenstein API Route (`/api/doctor-frankenstein/generate`)

**File**: `app/api/doctor-frankenstein/generate/route.ts`

**Changes**:
- Added `FeatureFlagManager`, `MockFrankensteinService`, `TestDataManager`, and `logger` imports
- Added mock mode detection in POST handler
- Implemented conditional routing:
  - When mock mode is enabled: Creates and uses `MockFrankensteinService`
  - When mock mode is disabled: Uses production `generateFrankensteinIdea` function
- Enhanced logging with mock mode indicators and timing
- Improved error handling with duration tracking

**Mock Integration**:
This route has the most explicit mock integration. When mock mode is enabled, it:
1. Creates a `TestDataManager` instance
2. Gets mock configuration from `FeatureFlagManager`
3. Creates a `MockFrankensteinService` with the configuration
4. Routes the request to the mock service

**Example Usage**:
```bash
# Enable mock mode with error scenario
export FF_USE_MOCK_API=true
export FF_MOCK_SCENARIO=api_error

# Make request
curl -X POST http://localhost:3000/api/doctor-frankenstein/generate \
  -H "Content-Type: application/json" \
  -d '{
    "elements": [
      {"name": "Netflix", "type": "company"},
      {"name": "Uber", "type": "company"}
    ],
    "mode": "companies",
    "language": "en"
  }'
```

## Feature Flag Configuration

All routes respect the following environment variables:

```bash
# Core mock mode flag
FF_USE_MOCK_API=true              # Enable/disable mock mode

# Mock behavior configuration
FF_MOCK_SCENARIO=success          # Scenario: success, api_error, timeout, rate_limit
FF_MOCK_VARIABILITY=false         # Enable random response variants
FF_SIMULATE_LATENCY=true          # Simulate network latency
FF_MIN_LATENCY=500                # Minimum latency in ms
FF_MAX_LATENCY=2000               # Maximum latency in ms
FF_LOG_MOCK_REQUESTS=true         # Log all mock requests
```

## Logging

All routes now include comprehensive logging:

### Request Start
```json
{
  "category": "API",
  "message": "POST /api/analyze - Creating new analysis",
  "method": "POST",
  "path": "/api/analyze",
  "mockMode": true
}
```

### Request Success
```json
{
  "category": "API",
  "message": "POST /api/analyze - Completed",
  "statusCode": 200,
  "duration": 1234,
  "mockMode": true
}
```

### Request Error
```json
{
  "category": "API",
  "message": "POST /api/analyze - Failed",
  "error": "Simulated API error",
  "duration": 567,
  "mockMode": true
}
```

## Testing

### Manual Testing

1. **Enable Mock Mode**:
   ```bash
   export FF_USE_MOCK_API=true
   export FF_MOCK_SCENARIO=success
   npm run dev
   ```

2. **Test Each Route**:
   - Analyzer: Navigate to `/analyzer` and submit an idea
   - Hackathon: Navigate to `/kiroween-analyzer` and submit a project
   - Frankenstein: Navigate to `/doctor-frankenstein` and generate an idea

3. **Verify Mock Mode**:
   - Check console logs for `[MOCK]` entries
   - Verify responses match mock data structure
   - Confirm latency simulation (if enabled)

### Error Scenario Testing

1. **Test API Error**:
   ```bash
   export FF_MOCK_SCENARIO=api_error
   ```
   Expected: 500 error with "Simulated API error" message

2. **Test Timeout**:
   ```bash
   export FF_MOCK_SCENARIO=timeout
   ```
   Expected: 408 error with "Request timeout" message

3. **Test Rate Limit**:
   ```bash
   export FF_MOCK_SCENARIO=rate_limit
   ```
   Expected: 429 error with "Rate limit exceeded" message

## Architecture Notes

### Hexagonal Architecture Integration

The Analyzer and Hackathon Analyzer routes use the hexagonal architecture:

```
API Route → Controller → Handler → Use Case → Service (Mock or Production)
```

Mock mode is determined at the `ServiceFactory` level when creating the AI service:
- `ServiceFactory.createAIAnalysisService()` checks `FeatureFlagManager.isMockModeEnabled()`
- Returns `MockAIAnalysisService` when enabled
- Returns production service when disabled

### Direct Integration

The Doctor Frankenstein route uses direct integration:

```
API Route → Mock Service (if enabled) OR Production Function
```

This approach was chosen because:
- The feature doesn't use the hexagonal architecture yet
- Direct integration is simpler and more explicit
- Easier to understand and maintain for this specific use case

## Production Safety

All routes include production safety checks:

1. **FeatureFlagManager** never enables mock mode in production:
   ```typescript
   if (process.env.NODE_ENV === 'production') {
     return false;
   }
   ```

2. **Logging** is environment-aware and doesn't expose sensitive information

3. **Error Handling** maintains consistent behavior regardless of mock mode

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 1.1**: Mock API System intercepts calls when flag is enabled ✅
- **Requirement 1.2**: Supports all three features (Analyzer, Hackathon, Frankenstein) ✅
- **Requirement 3.1**: Reads configuration from environment variables ✅
- **Requirement 3.2**: Activates mock mode when `FF_USE_MOCK_API=true` ✅

## Next Steps

The following tasks remain in the implementation plan:

- Task 8: Add visual mock mode indicator
- Task 9: Create E2E testing framework infrastructure
- Tasks 10-13: Implement E2E tests for each feature
- Tasks 14-18: Schema validation, CI/CD, documentation, and optimization

## Related Files

- `lib/testing/FeatureFlagManager.ts` - Feature flag management
- `lib/testing/mocks/MockAIAnalysisService.ts` - Mock AI service
- `lib/testing/mocks/MockFrankensteinService.ts` - Mock Frankenstein service
- `lib/testing/TestDataManager.ts` - Mock data management
- `src/infrastructure/factories/ServiceFactory.ts` - Service creation with mock support
