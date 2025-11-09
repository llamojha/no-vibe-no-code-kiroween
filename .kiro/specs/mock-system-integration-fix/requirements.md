# Requirements Document

## Introduction

This document defines the requirements for fixing the integration between the existing mock system infrastructure and the application layer. The mock system (Feature Flag Manager, Test Data Manager, Mock Services) is fully implemented but not properly connected to the application during test execution. This spec focuses exclusively on the integration layer to enable E2E tests to run successfully with mock data.

## Glossary

- **Mock System**: The existing infrastructure including FeatureFlagManager, TestDataManager, MockAIAnalysisService, and MockFrankensteinService
- **Application Layer**: The Next.js application including API routes, ServiceFactory, and server-side code
- **Test Mode**: A specific application configuration where mock services are activated instead of production services
- **ServiceFactory**: The factory class responsible for creating service instances (mock or production)
- **Feature Flag**: Environment variable that controls whether mock mode is active (`FF_USE_MOCK_API`)
- **E2E Tests**: End-to-end tests using Playwright that validate complete user workflows
- **API Routes**: Next.js API endpoints in the `/app/api` directory

## Requirements

### Requirement 1

**User Story:** As a developer, I want the application to properly read feature flags during test execution, so that mock mode can be activated when E2E tests run

#### Acceptance Criteria

1. WHEN `FF_USE_MOCK_API` environment variable is set to "true", THE Application SHALL read this value correctly in all execution contexts
2. THE Application SHALL make feature flag values available to both server-side and client-side code when needed
3. THE Application SHALL validate feature flag values at startup and log the current mode
4. WHERE Next.js environment variables are used, THE Application SHALL follow Next.js conventions for test environment configuration
5. THE Application SHALL provide a mechanism to verify that mock mode is active during test execution

### Requirement 2

**User Story:** As a developer, I want the ServiceFactory to correctly detect mock mode and instantiate mock services, so that API calls use mock data instead of real services

#### Acceptance Criteria

1. WHEN mock mode is enabled, THE ServiceFactory SHALL create MockAIAnalysisService instances instead of GoogleAIAnalysisService
2. WHEN mock mode is enabled, THE ServiceFactory SHALL create MockFrankensteinService instances for Frankenstein API calls
3. THE ServiceFactory SHALL use the FeatureFlagManager to determine which mode is active
4. THE ServiceFactory SHALL log which service type is being created for debugging purposes
5. WHEN mock mode is disabled or in production, THE ServiceFactory SHALL create production service instances

### Requirement 3

**User Story:** As a developer, I want API routes to properly check feature flags and route to mock services, so that E2E tests receive mock responses

#### Acceptance Criteria

1. THE Analyzer API route SHALL check mock mode and use mock services when enabled
2. THE Hackathon Analyzer API route SHALL check mock mode and use mock services when enabled
3. THE Doctor Frankenstein API route SHALL check mock mode and use mock services when enabled
4. WHEN mock mode is active, THE API routes SHALL return mock responses without making external API calls
5. THE API routes SHALL maintain existing production behavior when mock mode is disabled

### Requirement 4

**User Story:** As a developer, I want E2E tests to properly configure the test environment before running, so that mock mode is guaranteed to be active

#### Acceptance Criteria

1. THE E2E test setup SHALL set required environment variables before the application starts
2. THE E2E test setup SHALL verify that mock mode is active before running tests
3. WHEN E2E tests run, THE Application SHALL not attempt to connect to real databases or external APIs
4. THE E2E test configuration SHALL provide clear error messages if mock mode fails to activate
5. THE E2E tests SHALL be able to run completely offline without external dependencies

### Requirement 5

**User Story:** As a developer, I want integration tests that verify mock mode activation, so that I can confirm the system is properly configured

#### Acceptance Criteria

1. THE Integration test suite SHALL verify that ServiceFactory creates mock services when flag is enabled
2. THE Integration test suite SHALL verify that API routes return mock responses when flag is enabled
3. THE Integration test suite SHALL verify that feature flags are read correctly from environment variables
4. THE Integration test suite SHALL verify that production services are used when mock mode is disabled
5. WHEN integration tests fail, THE Test suite SHALL provide clear diagnostic information about the failure

### Requirement 6

**User Story:** As a developer, I want the CI/CD pipeline to properly configure test mode, so that E2E tests run successfully in GitHub Actions

#### Acceptance Criteria

1. THE GitHub Actions workflow SHALL set all required environment variables for test mode
2. THE GitHub Actions workflow SHALL verify mock mode is active before running E2E tests
3. WHEN E2E tests run in CI, THE Application SHALL use mock services exclusively
4. THE GitHub Actions workflow SHALL fail fast if mock mode cannot be activated
5. THE GitHub Actions workflow SHALL log the current configuration for debugging purposes
