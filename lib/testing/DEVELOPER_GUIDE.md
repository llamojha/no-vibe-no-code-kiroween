# Testing Automation & Mock System - Developer Guide

## Table of Contents

1. [Overview](#overview)
2. [Enabling Mock Mode](#enabling-mock-mode)
3. [Available Mock Scenarios](#available-mock-scenarios)
4. [Adding New Mock Responses](#adding-new-mock-responses)
5. [Running E2E Tests Locally](#running-e2e-tests-locally)
6. [Troubleshooting Guide](#troubleshooting-guide)

## Overview

The testing automation and mock system provides a comprehensive solution for development and testing without consuming API credits. It includes:

- **Mock AI Services**: Simulated responses for Gemini AI API calls
- **Feature Flag System**: Toggle between mock and production modes
- **E2E Testing Framework**: Playwright-based automated testing
- **Test Data Management**: Predefined scenarios and response variants

## Enabling Mock Mode

### Local Development

1. **Create or update `.env.local`**:

```bash
# Enable mock mode
FF_USE_MOCK_API=true

# Configure mock behavior
FF_MOCK_SCENARIO=success
FF_MOCK_VARIABILITY=false
FF_SIMULATE_LATENCY=true
FF_MIN_LATENCY=500
FF_MAX_LATENCY=2000
FF_LOG_MOCK_REQUESTS=true
```

2. **Restart your development server**:

```bash
npm run dev
```

3. **Verify mock mode is active**:
   - Look for the "🧪 Mock Mode Active" indicator in the bottom-right corner
   - Check console logs for `[MOCK]` prefixed messages

### E2E Testing

Mock mode is automatically enabled for E2E tests via the Playwright configuration:

```typescript
// playwright.config.ts
use: {
  baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
},
env: {
  FF_USE_MOCK_API: 'true',
  FF_MOCK_SCENARIO: 'success',
}
```

### CI/CD Pipeline

Mock mode is configured in the GitHub Actions workflow:

```yaml
# .github/workflows/e2e-tests.yml
- name: Run E2E tests
  run: npm run test:e2e
  env:
    FF_USE_MOCK_API: true
    FF_MOCK_SCENARIO: success
```

## Available Mock Scenarios

### Success Scenario (Default)

Returns realistic successful responses for all API calls.

```bash
FF_MOCK_SCENARIO=success
```

**Use cases**:
- Happy path testing
- UI development
- Demo presentations

### API Error Scenario

Simulates API failures with 500 status codes.

```bash
FF_MOCK_SCENARIO=api_error
```

**Use cases**:
- Error handling testing
- Error message validation
- Retry logic testing

### Timeout Scenario

Simulates request timeouts after 30 seconds.

```bash
FF_MOCK_SCENARIO=timeout
```

**Use cases**:
- Timeout handling testing
- Loading state validation
- User experience testing

### Rate Limit Scenario

Simulates rate limit errors with 429 status codes.

```bash
FF_MOCK_SCENARIO=rate_limit
```

**Use cases**:
- Rate limiting logic testing
- Backoff strategy validation
- User notification testing

### Invalid Input Scenario

Simulates validation errors with 400 status codes.

```bash
FF_MOCK_SCENARIO=invalid_input
```

**Use cases**:
- Input validation testing
- Form error handling
- User feedback testing

## Adding New Mock Responses

### Step 1: Define the Mock Response

Add your mock response to the appropriate JSON file in `lib/testing/data/`:

**For Analyzer responses** (`analyzer-mocks.json`):

```json
{
  "success": [
    {
      "score": 85,
      "summary": "Your new mock response summary",
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1"],
      "opportunities": ["Opportunity 1"],
      "threats": ["Threat 1"],
      "suggestions": ["Suggestion 1"],
      "criteriaScores": [
        {
          "criteriaName": "Innovation",
          "score": 90,
          "justification": "Highly innovative approach"
        }
      ],
      "marketPotential": {
        "score": 85,
        "analysis": "Strong market potential",
        "targetMarket": "Tech-savvy professionals",
        "marketSize": "$500M TAM"
      },
      "technicalFeasibility": {
        "score": 80,
        "analysis": "Technically feasible",
        "complexity": "medium",
        "requiredSkills": ["React", "Node.js"]
      },
      "businessViability": {
        "score": 85,
        "analysis": "Strong business model",
        "revenueModel": ["Subscription", "Freemium"],
        "competitiveAdvantage": "First-mover advantage"
      }
    }
  ]
}
```

**For Hackathon responses** (`hackathon-mocks.json`):

```json
{
  "success": [
    {
      "score": 88,
      "summary": "Excellent hackathon project",
      "categoryRecommendation": {
        "primary": "Best Use of AI",
        "confidence": 0.92,
        "alternatives": [
          {
            "category": "Most Innovative",
            "confidence": 0.85,
            "reason": "Unique approach to problem solving"
          }
        ]
      },
      "kiroUsageAnalysis": {
        "effectiveness": 90,
        "suggestions": [
          "Great use of Kiro for rapid prototyping"
        ]
      }
    }
  ]
}
```

**For Frankenstein responses** (`frankenstein-mocks.json`):

```json
{
  "companies": {
    "en": [
      {
        "idea_title": "Your Mashup Title",
        "idea_description": "Description of the mashup",
        "core_concept": "Core concept explanation",
        "problem_statement": "Problem being solved",
        "proposed_solution": "Proposed solution",
        "unique_value_proposition": "What makes it unique",
        "target_audience": "Who will use it",
        "business_model": "How it makes money",
        "growth_strategy": "How it will grow",
        "tech_stack_suggestion": "Recommended technologies",
        "risks_and_challenges": "Potential risks",
        "metrics": {
          "originality_score": 92,
          "feasibility_score": 85,
          "impact_score": 88,
          "scalability_score": 90,
          "wow_factor": 95
        },
        "summary": "Brief summary",
        "language": "en"
      }
    ]
  }
}
```

### Step 2: Validate the Mock Response

Run the validation script to ensure your mock response matches the schema:

```bash
npm run validate:mocks
```

This will check all mock responses against their Zod schemas and report any validation errors.

### Step 3: Test the Mock Response

1. **Set the scenario** (if adding to a new scenario):

```bash
FF_MOCK_SCENARIO=your_new_scenario
```

2. **Restart the development server**:

```bash
npm run dev
```

3. **Test the feature** that uses the mock response

4. **Verify the response** in the browser console or UI

### Step 4: Add Response Variants

To add variability, add multiple responses to the same scenario array:

```json
{
  "success": [
    {
      "score": 85,
      "summary": "Variant 1"
    },
    {
      "score": 90,
      "summary": "Variant 2"
    },
    {
      "score": 78,
      "summary": "Variant 3"
    }
  ]
}
```

Enable variability in your environment:

```bash
FF_MOCK_VARIABILITY=true
```

The system will randomly select one of the variants for each request.

## Running E2E Tests Locally

### Prerequisites

1. **Install dependencies**:

```bash
npm install
```

2. **Install Playwright browsers**:

```bash
npx playwright install --with-deps
```

### Running All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e -- --ui

# Run in headed mode (see browser)
npm run test:e2e -- --headed
```

### Running Specific Tests

```bash
# Run only analyzer tests
npm run test:e2e -- analyzer.spec.ts

# Run only hackathon tests
npm run test:e2e -- hackathon.spec.ts

# Run only frankenstein tests
npm run test:e2e -- frankenstein.spec.ts

# Run only dashboard tests
npm run test:e2e -- dashboard.spec.ts

# Run specific test by name
npm run test:e2e -- --grep "should analyze idea successfully"
```

### Running Tests in Different Browsers

```bash
# Run in Chromium (default)
npm run test:e2e

# Run in Firefox
npm run test:e2e -- --project=firefox

# Run in WebKit (Safari)
npm run test:e2e -- --project=webkit

# Run in all browsers
npm run test:e2e -- --project=chromium --project=firefox --project=webkit
```

### Debugging Tests

```bash
# Run with debug mode
npm run test:e2e -- --debug

# Run with trace viewer
npm run test:e2e -- --trace on

# Generate and open HTML report
npm run test:e2e -- --reporter=html
npx playwright show-report
```

### Test Configuration

Customize test behavior via environment variables:

```bash
# Set base URL
E2E_BASE_URL=http://localhost:3000 npm run test:e2e

# Run in headless mode
E2E_HEADLESS=true npm run test:e2e

# Set timeout
E2E_TIMEOUT=60000 npm run test:e2e

# Enable screenshots on failure
E2E_SCREENSHOT_ON_FAILURE=true npm run test:e2e

# Enable video recording
E2E_VIDEO_ON_FAILURE=true npm run test:e2e
```

## Troubleshooting Guide

### Mock Mode Not Activating

**Symptom**: Real API calls are being made instead of using mocks

**Solutions**:

1. **Check environment variable**:
   ```bash
   # Verify FF_USE_MOCK_API is set to 'true'
   echo $FF_USE_MOCK_API
   ```

2. **Restart development server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Start again
   npm run dev
   ```

3. **Check for production environment**:
   ```typescript
   // Mock mode is disabled in production by default
   if (process.env.NODE_ENV === 'production') {
     // Mocks won't activate
   }
   ```

4. **Verify .env.local file**:
   ```bash
   # Ensure .env.local exists and contains:
   FF_USE_MOCK_API=true
   ```

### Mock Responses Not Loading

**Symptom**: Errors about missing mock responses or undefined data

**Solutions**:

1. **Validate mock data files**:
   ```bash
   npm run validate:mocks
   ```

2. **Check file paths**:
   ```bash
   # Ensure these files exist:
   ls -la lib/testing/data/analyzer-mocks.json
   ls -la lib/testing/data/hackathon-mocks.json
   ls -la lib/testing/data/frankenstein-mocks.json
   ```

3. **Check JSON syntax**:
   ```bash
   # Validate JSON syntax
   node -e "require('./lib/testing/data/analyzer-mocks.json')"
   ```

4. **Clear cache and rebuild**:
   ```bash
   rm -rf .next
   npm run build
   npm run dev
   ```

### E2E Tests Failing

**Symptom**: Tests fail with timeout or element not found errors

**Solutions**:

1. **Increase timeout**:
   ```typescript
   // In playwright.config.ts
   timeout: 60000, // Increase from 30000
   ```

2. **Check if app is running**:
   ```bash
   # Ensure dev server is running on correct port
   curl http://localhost:3000
   ```

3. **Run tests in headed mode**:
   ```bash
   # See what's happening in the browser
   npm run test:e2e -- --headed
   ```

4. **Check test artifacts**:
   ```bash
   # View screenshots and videos
   ls -la tests/e2e/test-results/
   ```

5. **Update Playwright**:
   ```bash
   npm install -D @playwright/test@latest
   npx playwright install
   ```

### Slow Test Execution

**Symptom**: Tests take too long to complete

**Solutions**:

1. **Disable latency simulation**:
   ```bash
   FF_SIMULATE_LATENCY=false
   ```

2. **Reduce latency values**:
   ```bash
   FF_MIN_LATENCY=100
   FF_MAX_LATENCY=500
   ```

3. **Run tests in parallel**:
   ```typescript
   // In playwright.config.ts
   workers: 4, // Increase parallel workers
   fullyParallel: true,
   ```

4. **Disable video recording**:
   ```typescript
   // In playwright.config.ts
   use: {
     video: 'off', // or 'retain-on-failure'
   }
   ```

### Mock Scenario Not Changing

**Symptom**: Different scenario set but same responses returned

**Solutions**:

1. **Clear TestDataManager cache**:
   ```bash
   # Restart the application
   npm run dev
   ```

2. **Verify scenario name**:
   ```bash
   # Check available scenarios
   cat lib/testing/data/test-scenarios.json
   ```

3. **Check environment variable**:
   ```bash
   echo $FF_MOCK_SCENARIO
   ```

4. **Force scenario in code** (for testing):
   ```typescript
   // Temporarily override in ServiceFactory
   const mockConfig = {
     defaultScenario: 'api_error' as TestScenario,
     // ...
   };
   ```

### Schema Validation Errors

**Symptom**: Mock validation script reports schema mismatches

**Solutions**:

1. **Check error message**:
   ```bash
   npm run validate:mocks
   # Read the detailed error output
   ```

2. **Compare with schema**:
   ```typescript
   // Check lib/testing/schemas.ts for required fields
   ```

3. **Fix missing fields**:
   ```json
   // Add any missing required fields to your mock
   {
     "score": 85,
     "summary": "Required field",
     // ... add other required fields
   }
   ```

4. **Check data types**:
   ```json
   // Ensure correct types
   {
     "score": 85,        // number, not string
     "strengths": [],    // array, not string
     "metrics": {}       // object, not array
   }
   ```

### CI/CD Tests Failing

**Symptom**: Tests pass locally but fail in GitHub Actions

**Solutions**:

1. **Check workflow logs**:
   ```bash
   # View detailed logs in GitHub Actions UI
   ```

2. **Verify environment variables**:
   ```yaml
   # In .github/workflows/e2e-tests.yml
   env:
     FF_USE_MOCK_API: true
     FF_MOCK_SCENARIO: success
   ```

3. **Check browser installation**:
   ```yaml
   # Ensure browsers are installed
   - name: Install Playwright browsers
     run: npx playwright install --with-deps
   ```

4. **Run tests in CI mode locally**:
   ```bash
   CI=true npm run test:e2e
   ```

5. **Check artifact uploads**:
   ```yaml
   # Ensure artifacts are uploaded on failure
   - name: Upload test artifacts
     if: failure()
     uses: actions/upload-artifact@v3
   ```

### Performance Issues

**Symptom**: Application is slow when using mocks

**Solutions**:

1. **Disable request logging**:
   ```bash
   FF_LOG_MOCK_REQUESTS=false
   ```

2. **Reduce latency simulation**:
   ```bash
   FF_SIMULATE_LATENCY=false
   ```

3. **Check cache usage**:
   ```typescript
   // TestDataManager caches responses by default
   // Ensure cache is working properly
   ```

4. **Profile the application**:
   ```bash
   # Use browser DevTools Performance tab
   # Look for slow mock response generation
   ```

### Type Errors

**Symptom**: TypeScript errors when working with mocks

**Solutions**:

1. **Check type definitions**:
   ```typescript
   // Ensure types are imported from lib/testing/types.ts
   import type { MockResponse, TestScenario } from '@/lib/testing/types';
   ```

2. **Update TypeScript**:
   ```bash
   npm install -D typescript@latest
   ```

3. **Check tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```

4. **Regenerate type definitions**:
   ```bash
   npm run build
   ```

## Getting Help

If you encounter issues not covered in this guide:

1. **Check existing documentation**:
   - `lib/testing/README.md` - Mock system overview
   - `tests/e2e/README.md` - E2E testing guide
   - `.github/workflows/README.md` - CI/CD documentation

2. **Review implementation files**:
   - `lib/testing/FeatureFlagManager.ts` - Feature flag logic
   - `lib/testing/TestDataManager.ts` - Mock data management
   - `lib/testing/mocks/MockAIAnalysisService.ts` - Mock service implementation

3. **Check test examples**:
   - `tests/e2e/analyzer.spec.ts` - Analyzer test examples
   - `tests/e2e/helpers/page-objects/` - Page object patterns

4. **Contact the team**:
   - Create an issue in the repository
   - Ask in the team chat
   - Review pull requests for similar implementations
