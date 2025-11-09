# Mock Services

This directory contains mock implementations of service interfaces for testing automation.

## MockAIAnalysisService

Mock implementation of `IAIAnalysisService` that provides predefined responses for testing without consuming API credits.

### Features

- **Scenario-based responses**: Supports multiple test scenarios (success, api_error, timeout, rate_limit, invalid_input, partial_response)
- **Latency simulation**: Configurable network delay simulation with min/max range
- **Request logging**: Optional logging of all mock requests for debugging
- **Response variability**: Support for random response variants
- **Error handling**: Comprehensive error scenario simulation

### Usage

```typescript
import { MockAIAnalysisService } from '@/lib/testing/mocks';
import { TestDataManager } from '@/lib/testing';
import { MockServiceConfig } from '@/lib/testing/types';

// Create test data manager
const testDataManager = new TestDataManager();

// Configure mock service
const config: MockServiceConfig = {
  defaultScenario: 'success',
  enableVariability: false,
  simulateLatency: true,
  minLatency: 500,
  maxLatency: 2000,
  logRequests: true,
};

// Create mock service
const mockService = new MockAIAnalysisService(testDataManager, config);

// Use like a regular AI service
const result = await mockService.analyzeIdea('My startup idea', Locale.english());
```

### Implemented Methods

All methods from `IAIAnalysisService` interface:

- `analyzeIdea(idea, locale)` - Analyze a startup idea
- `analyzeHackathonProject(projectName, description, kiroUsage, locale)` - Analyze hackathon project
- `getImprovementSuggestions(idea, currentScore, locale)` - Get improvement suggestions
- `compareIdeas(idea1, idea2, locale)` - Compare two ideas
- `recommendHackathonCategory(projectName, description, kiroUsage)` - Recommend category
- `healthCheck()` - Check service health

### Error Scenarios

The mock service supports the following error scenarios:

- **api_error**: Simulates API error (500)
- **timeout**: Simulates request timeout (408)
- **rate_limit**: Simulates rate limit exceeded (429)
- **invalid_input**: Simulates invalid input error (400)
- **partial_response**: Simulates partial response (206)

### Request Logging

When `logRequests` is enabled, the service logs all requests to console and maintains an internal log:

```typescript
// Get request logs
const logs = mockService.getRequestLogs();

// Clear logs
mockService.clearRequestLogs();
```

### Configuration via Environment Variables

The mock service can be configured via environment variables:

- `FF_USE_MOCK_API` - Enable/disable mock mode
- `FF_MOCK_SCENARIO` - Default scenario (success, api_error, etc.)
- `FF_MOCK_VARIABILITY` - Enable random response variants
- `FF_SIMULATE_LATENCY` - Enable latency simulation
- `FF_MIN_LATENCY` - Minimum latency in ms
- `FF_MAX_LATENCY` - Maximum latency in ms
- `FF_LOG_MOCK_REQUESTS` - Enable request logging

## MockServiceError

Custom error class for mock service errors with status codes:

```typescript
throw new MockServiceError(
  'Simulated API error',
  'API_ERROR',
  500
);
```

## Testing

The mock service is designed to work seamlessly with the existing test infrastructure:

```typescript
import { describe, it, expect } from 'vitest';

describe('MockAIAnalysisService', () => {
  it('should return success response', async () => {
    const service = new MockAIAnalysisService(testDataManager, config);
    const result = await service.analyzeIdea('Test idea', Locale.english());
    
    expect(result.success).toBe(true);
    expect(result.data?.score).toBeDefined();
  });
  
  it('should simulate API error', async () => {
    const config = { ...defaultConfig, defaultScenario: 'api_error' };
    const service = new MockAIAnalysisService(testDataManager, config);
    const result = await service.analyzeIdea('Test idea', Locale.english());
    
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('API error');
  });
});
```

## Integration with ServiceFactory

The mock service integrates with the existing `ServiceFactory` pattern:

```typescript
class ServiceFactory {
  createAIAnalysisService(): IAIAnalysisService {
    const featureFlagManager = getFeatureFlagManager();
    
    if (featureFlagManager.isMockModeEnabled()) {
      const testDataManager = getTestDataManager();
      const config = featureFlagManager.getMockServiceConfig();
      return new MockAIAnalysisService(testDataManager, config);
    }
    
    // Return production service
    return new GoogleAIAnalysisService(this.getGoogleAIConfig());
  }
}
```
