/**
 * Testing utilities and mock services
 * 
 * This module provides feature flag management and mock service infrastructure
 * for testing automation without consuming API credits.
 */

export {
  FeatureFlagManager,
  getFeatureFlagManager,
  resetFeatureFlagManager,
} from './FeatureFlagManager';

export {
  TestDataManager,
  getTestDataManager,
  resetTestDataManager,
} from './TestDataManager';

export type {
  MockResponseType,
  MockDataFile,
  ValidationResult,
  MockResponseCustomization,
} from './TestDataManager';

export type {
  TestScenario,
  MockServiceConfig,
  FeatureFlagConfig,
  MockResponse,
  MockRequest,
  MockFeatureFlagKey,
  FlagValidationResult,
  FlagValue,
  FlagDefinition,
} from './types';

export {
  MOCK_FEATURE_FLAGS,
  MOCK_ENV_VARS,
  MOCK_FLAG_DEFAULTS,
} from './types';

export {
  MockAIAnalysisService,
  MockServiceError,
} from './mocks';

export {
  TestEnvironmentConfig,
  MockConfigurationError,
  MockConfigurationErrorCodes,
} from './config';

export type {
  ValidationResult as ConfigValidationResult,
  TestEnvironmentConfiguration,
} from './config';
