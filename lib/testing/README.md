# Testing Utilities

This module provides feature flag management and mock service infrastructure for testing automation without consuming API credits.

## FeatureFlagManager

The `FeatureFlagManager` class manages feature flags specifically for testing automation and mock services. It provides runtime flag updates for testing scenarios while maintaining production mode safety.

### Usage

```typescript
import { getFeatureFlagManager } from '@/lib/testing';

// Get the singleton instance
const flagManager = getFeatureFlagManager();

// Check if mock mode is enabled
if (flagManager.isMockModeEnabled()) {
  // Use mock services
}

// Get mock service configuration
const config = flagManager.getMockServiceConfig();
console.log(config.defaultScenario); // 'success'
console.log(config.simulateLatency); // true/false

// Get a specific flag value
const scenario = flagManager.getFlag('MOCK_SCENARIO');

// Get all flags
const allFlags = flagManager.getAllFlags();
```

### Environment Variables

Configure mock mode using these environment variables:

- `FF_USE_MOCK_API` - Enable/disable mock mode (boolean, default: false)
- `FF_MOCK_SCENARIO` - Default test scenario (string, default: 'success')
  - Valid values: `success`, `api_error`, `timeout`, `rate_limit`, `invalid_input`, `partial_response`
- `FF_MOCK_VARIABILITY` - Enable random response variants (boolean, default: false)
- `FF_SIMULATE_LATENCY` - Simulate network latency (boolean, default: false)
- `FF_MIN_LATENCY` - Minimum latency in ms (number, default: 500)
- `FF_MAX_LATENCY` - Maximum latency in ms (number, default: 2000)
- `FF_LOG_MOCK_REQUESTS` - Log all mock requests (boolean, default: false)

### Example .env Configuration

```bash
# Enable mock mode for testing
FF_USE_MOCK_API=true
FF_MOCK_SCENARIO=success
FF_SIMULATE_LATENCY=true
FF_MIN_LATENCY=500
FF_MAX_LATENCY=2000
FF_LOG_MOCK_REQUESTS=true
```

### Testing with Different Scenarios

```typescript
import { getFeatureFlagManager } from '@/lib/testing';

const flagManager = getFeatureFlagManager();

// Test with API error scenario
flagManager.setFlag('MOCK_SCENARIO', 'api_error');

// Test with timeout scenario
flagManager.setFlag('MOCK_SCENARIO', 'timeout');

// Reset to environment defaults
flagManager.reset();
```

### Production Safety

The `FeatureFlagManager` includes built-in production safety:

- Mock mode is **always disabled** in production (`NODE_ENV === 'production'`)
- Runtime flag modifications throw errors in production
- Flag reset operations are blocked in production

```typescript
// This will always return false in production
const isMockMode = flagManager.isMockModeEnabled();

// This will throw an error in production
flagManager.setFlag('MOCK_SCENARIO', 'api_error'); // Error!
```

## Types

### TestScenario

Available test scenarios for mock responses:

```typescript
type TestScenario = 
  | 'success'           // Successful API response
  | 'api_error'         // API returns error
  | 'timeout'           // Request times out
  | 'rate_limit'        // Rate limit exceeded
  | 'invalid_input'     // Invalid input provided
  | 'partial_response'; // Partial/incomplete response
```

### MockServiceConfig

Configuration for mock services:

```typescript
interface MockServiceConfig {
  defaultScenario: TestScenario;
  enableVariability: boolean;
  simulateLatency: boolean;
  minLatency: number;
  maxLatency: number;
  logRequests: boolean;
}
```

### FeatureFlagConfig

Complete feature flag configuration:

```typescript
interface FeatureFlagConfig {
  useMockApi: boolean;
  mockScenario: TestScenario;
  mockVariability: boolean;
  simulateLatency: boolean;
  minLatency: number;
  maxLatency: number;
  logMockRequests: boolean;
}
```

## Integration with Existing Feature Flags

The mock mode flag is also registered with the existing feature flag system:

```typescript
import { isEnabled } from '@/lib/featureFlags';

// Check if mock mode is enabled (alternative approach)
if (isEnabled('USE_MOCK_API')) {
  // Use mock services
}
```

Both approaches work, but `FeatureFlagManager` provides additional mock-specific functionality like scenario management and latency simulation.

## TestDataManager

The `TestDataManager` class manages predefined mock responses and test scenarios. It provides response caching, scenario-based selection, and variant support for testing automation.

### Usage

```typescript
import { getTestDataManager } from '@/lib/testing';

// Get the singleton instance
const dataManager = getTestDataManager();

// Get mock response for a specific scenario
const analyzerResponse = dataManager.getMockResponse('analyzer', 'success');
console.log(analyzerResponse.data); // Analysis object
console.log(analyzerResponse.statusCode); // 200

// Get random variant for variability testing
const randomResponse = dataManager.getRandomVariant('analyzer', 'success');

// Customize response based on input
const customized = dataManager.customizeMockResponse(
  analyzerResponse,
  'analyzer',
  {
    locale: 'es',
    input: { idea: 'My startup idea' },
  }
);

// Validate mock response structure
const validation = dataManager.validateMockResponse(analyzerResponse, 'analyzer');
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### Mock Response Types

The TestDataManager supports three response types:

- `analyzer` - Startup idea analysis responses
- `hackathon` - Hackathon project analysis responses
- `frankenstein` - Doctor Frankenstein idea generation responses

### Mock Data Files

Mock data is stored in JSON files in `lib/testing/data/`:

- `analyzer-mocks.json` - Analyzer mock responses
- `hackathon-mocks.json` - Hackathon analyzer mock responses
- `frankenstein-mocks.json` - Frankenstein idea mock responses

Each file contains scenarios with multiple response variants:

```json
{
  "scenarios": {
    "success": [
      {
        "data": { /* response data */ },
        "statusCode": 200,
        "delay": 800
      }
    ],
    "api_error": [
      {
        "data": { "error": "API_ERROR", "message": "..." },
        "statusCode": 500,
        "delay": 300
      }
    ]
  }
}
```

### Response Customization

The TestDataManager supports customizing responses based on:

1. **Locale** - Translate responses to different languages
2. **Input Data** - Incorporate user input into responses
3. **Variant Merging** - Merge custom data with base responses

```typescript
// Customize for Spanish locale
const spanishResponse = dataManager.customizeMockResponse(
  baseResponse,
  'analyzer',
  { locale: 'es' }
);

// Incorporate user input
const customResponse = dataManager.customizeMockResponse(
  baseResponse,
  'frankenstein',
  {
    input: {
      elements: [{ name: 'AWS Lambda' }, { name: 'React' }],
      mode: 'aws',
    },
  }
);

// Merge with variant data
const mergedResponse = dataManager.customizeMockResponse(
  baseResponse,
  'analyzer',
  {
    variantData: {
      finalScore: 90,
      detailedSummary: 'Custom summary',
    },
  }
);
```

### Caching

The TestDataManager automatically caches loaded responses and data files for performance:

```typescript
// Get cache statistics
const stats = dataManager.getCacheStats();
console.log(stats.responsesCached); // Number of cached responses
console.log(stats.dataFilesCached); // Number of cached data files

// Clear all caches
dataManager.clearCache();
```

### Custom Test Data

Load custom test data from external files:

```typescript
// Load custom mock data
await dataManager.loadCustomTestData('./custom-mocks.json');

// Use the custom data
const response = dataManager.getMockResponse('analyzer', 'success');
```

### Validation

Validate mock responses against expected structures:

```typescript
const validation = dataManager.validateMockResponse(response, 'analyzer');

if (!validation.valid) {
  console.error('Validation failed:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
}
```

The validator checks:
- Required fields presence
- Field types and formats
- Score ranges (0-100)
- Nested object structures
- Type-specific requirements

## MockFrankensteinService

The `MockFrankensteinService` class provides mock responses for Doctor Frankenstein idea generation. It supports both 'companies' and 'aws' modes with English and Spanish languages.

### Usage

```typescript
import { MockFrankensteinService } from '@/lib/testing/mocks';
import { getTestDataManager, getFeatureFlagManager } from '@/lib/testing';

// Create service instance
const dataManager = getTestDataManager();
const flagManager = getFeatureFlagManager();
const config = flagManager.getMockServiceConfig();

const frankensteinService = new MockFrankensteinService(dataManager, config);

// Generate mock Frankenstein idea
const result = await frankensteinService.generateFrankensteinIdea(
  [
    { name: 'AWS Lambda', description: 'Serverless compute' },
    { name: 'React', description: 'UI library' },
  ],
  'aws',
  'en'
);

console.log(result.idea_title);
console.log(result.metrics.originality_score);
```

### Features

#### Element-Based Customization

The service customizes responses based on input elements:

```typescript
// Two elements: balanced scores
const twoElements = await frankensteinService.generateFrankensteinIdea(
  [{ name: 'Slack' }, { name: 'Trello' }],
  'companies',
  'en'
);

// Three+ elements: higher originality, lower feasibility
const manyElements = await frankensteinService.generateFrankensteinIdea(
  [
    { name: 'AWS Lambda' },
    { name: 'DynamoDB' },
    { name: 'API Gateway' },
    { name: 'S3' },
  ],
  'aws',
  'en'
);
```

#### Mode-Specific Customization

**AWS Mode:**
- Emphasizes infrastructure and scalability
- Replaces generic tech stack with AWS-specific services
- Boosts scalability and feasibility scores
- Updates growth strategy to mention AWS global infrastructure

**Companies Mode:**
- Emphasizes product synergy and user experience
- Highlights combination of company strengths
- Boosts impact and wow factor scores

```typescript
// AWS mode example
const awsIdea = await frankensteinService.generateFrankensteinIdea(
  [{ name: 'Lambda' }, { name: 'DynamoDB' }],
  'aws',
  'en'
);
// Tech stack will include AWS-specific services
// Scalability score will be boosted

// Companies mode example
const companyIdea = await frankensteinService.generateFrankensteinIdea(
  [{ name: 'Slack' }, { name: 'Notion' }],
  'companies',
  'en'
);
// Value proposition will highlight company synergy
// Impact score will be boosted
```

#### Multi-Language Support

```typescript
// English response
const englishIdea = await frankensteinService.generateFrankensteinIdea(
  elements,
  'companies',
  'en'
);

// Spanish response
const spanishIdea = await frankensteinService.generateFrankensteinIdea(
  elements,
  'companies',
  'es'
);
```

#### Latency Simulation

When `FF_SIMULATE_LATENCY=true`, the service simulates network delays:

```typescript
// Configure latency simulation
process.env.FF_SIMULATE_LATENCY = 'true';
process.env.FF_MIN_LATENCY = '1000';
process.env.FF_MAX_LATENCY = '2000';

// This will take 1-2 seconds to complete
const result = await frankensteinService.generateFrankensteinIdea(
  elements,
  'aws',
  'en'
);
```

#### Request Logging

When `FF_LOG_MOCK_REQUESTS=true`, all requests are logged:

```typescript
process.env.FF_LOG_MOCK_REQUESTS = 'true';

// This will log request details to console
const result = await frankensteinService.generateFrankensteinIdea(
  elements,
  'companies',
  'en'
);
// Output: [MOCK FRANKENSTEIN] { timestamp, mode, language, elementCount, ... }
```

#### Error Scenarios

Test error handling with different scenarios:

```typescript
// Configure error scenario
process.env.FF_MOCK_SCENARIO = 'api_error';

try {
  await frankensteinService.generateFrankensteinIdea(elements, 'aws', 'en');
} catch (error) {
  console.error(error.message); // "Failed to generate Frankenstein idea..."
}

// Test timeout scenario
process.env.FF_MOCK_SCENARIO = 'timeout';

// Test rate limit scenario
process.env.FF_MOCK_SCENARIO = 'rate_limit';

// Test invalid input scenario
process.env.FF_MOCK_SCENARIO = 'invalid_input';
```

### Response Customization Details

The service applies sophisticated customization logic:

1. **Title Generation**: Creates dynamic titles based on element count
   - 2 elements: "X + Y Fusion Platform"
   - 3 elements: "X + Y + Z Integration Hub"
   - 4+ elements: "X + Y + Z + W Ecosystem"

2. **Metric Adjustments**:
   - 2 elements: +5 originality, +5 feasibility
   - 3 elements: +10 originality, -3 feasibility
   - 4+ elements: +15 originality, -8 feasibility, +10 wow factor

3. **Tech Stack Customization** (AWS mode):
   - Replaces "React" with "AWS Amplify with React"
   - Replaces "Node.js" with "AWS Lambda with Node.js"
   - Replaces "PostgreSQL" with "Amazon RDS or DynamoDB"
   - Replaces "Redis" with "Amazon ElastiCache"
   - Adds AWS context if not present

4. **Value Proposition Enhancement** (Companies mode):
   - Prepends company names to value proposition
   - Example: "Combines the best of Slack and Notion: ..."

### Integration Example

```typescript
import { MockFrankensteinService } from '@/lib/testing/mocks';
import { getTestDataManager, getFeatureFlagManager } from '@/lib/testing';

// Setup
const dataManager = getTestDataManager();
const flagManager = getFeatureFlagManager();

// Check if mock mode is enabled
if (flagManager.isMockModeEnabled()) {
  const config = flagManager.getMockServiceConfig();
  const mockService = new MockFrankensteinService(dataManager, config);
  
  // Use mock service
  const result = await mockService.generateFrankensteinIdea(
    elements,
    mode,
    language
  );
  
  return result;
} else {
  // Use production service
  const result = await generateFrankensteinIdea(elements, mode, language);
  return result;
}
```
