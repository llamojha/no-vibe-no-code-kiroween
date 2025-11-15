import { resolveMockModeFlag } from './mock-mode-flags';

const TRUTHY_FLAG_VALUES = new Set(['1', 'true', 'yes', 'on', 'y', 't']);

/**
 * Determine if test mode overrides should be permitted when NODE_ENV=production.
 * This enables CI to run against production builds without exposing the endpoint
 * by default in real production environments.
 */
export function isTestModeOverrideEnabled(): boolean {
  const rawValue = process.env.ALLOW_TEST_MODE_IN_PRODUCTION;
  if (typeof rawValue !== 'string') {
    return false;
  }

  return TRUTHY_FLAG_VALUES.has(rawValue.trim().toLowerCase());
}

/**
 * Test Environment Configuration
 * 
 * Ensures mock mode environment variables are properly set and validated.
 * This module provides utilities for validating test environment configuration
 * and retrieving current configuration values.
 */

/**
 * Custom error class for mock configuration issues
 */
export class MockConfigurationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MockConfigurationError';
    
    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MockConfigurationError);
    }
  }
}

/**
 * Error codes for different configuration failures
 */
export const MockConfigurationErrorCodes = {
  INVALID_TEST_ENV: 'INVALID_TEST_ENV',
  MOCK_MODE_IN_PRODUCTION: 'MOCK_MODE_IN_PRODUCTION',
  INVALID_SCENARIO: 'INVALID_SCENARIO',
  MISSING_REQUIRED_VAR: 'MISSING_REQUIRED_VAR',
  MOCK_SERVICE_CREATION_FAILED: 'MOCK_SERVICE_CREATION_FAILED',
} as const;

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Current configuration interface
 */
export interface TestEnvironmentConfiguration {
  mockMode: boolean;
  scenario: string;
  simulateLatency: boolean;
  nodeEnv: string;
}

/**
 * Test environment configuration class
 * Ensures mock mode environment variables are properly set
 */
export class TestEnvironmentConfig {
  /**
   * Valid mock scenarios
   */
  private static readonly VALID_SCENARIOS = [
    'success',
    'api_error',
    'timeout',
    'rate_limit',
    'invalid_input',
    'partial_response',
  ] as const;

  /**
   * Validate that required environment variables are set for test mode
   * 
   * @returns Validation result with errors and warnings
   */
  static validateTestEnvironment(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if mock mode is enabled
    const nodeEnv = process.env.NODE_ENV || 'development';
    const requestedMockValue = process.env.FF_USE_MOCK_API?.trim().toLowerCase();
    const allowTestModeOverride = isTestModeOverrideEnabled();
    const mockModeEnabled = resolveMockModeFlag(process.env.FF_USE_MOCK_API, {
      allowInProduction: allowTestModeOverride,
    });

    // Check for production environment
    if (nodeEnv === 'production' && requestedMockValue === 'true' && !allowTestModeOverride) {
      errors.push('Mock mode cannot be enabled in production');
    }

    // Validate scenario if mock mode is enabled
    if (mockModeEnabled) {
      const scenario = process.env.FF_MOCK_SCENARIO;
      
      if (scenario && !this.isValidScenario(scenario)) {
        warnings.push(
          `Invalid mock scenario "${scenario}". Valid scenarios: ${this.VALID_SCENARIOS.join(', ')}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get current test environment configuration
   * 
   * @returns Current configuration values
   */
  static getCurrentConfig(): TestEnvironmentConfiguration {
    const allowTestModeOverride = isTestModeOverrideEnabled();

    return {
      mockMode: resolveMockModeFlag(process.env.FF_USE_MOCK_API, {
        allowInProduction: allowTestModeOverride,
      }),
      scenario: process.env.FF_MOCK_SCENARIO || 'success',
      simulateLatency: process.env.FF_SIMULATE_LATENCY === 'true',
      nodeEnv: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Log current configuration (for debugging)
   * 
   * Logs the current test environment configuration including
   * validation status, errors, and warnings.
   */
  static logConfiguration(): void {
    const config = this.getCurrentConfig();
    const validation = this.validateTestEnvironment();

    console.log('[TEST ENVIRONMENT]', {
      ...config,
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
    });
  }

  /**
   * Check if a scenario is valid
   * 
   * @param scenario - Scenario name to validate
   * @returns True if scenario is valid
   */
  static isValidScenario(scenario: string): scenario is typeof TestEnvironmentConfig.VALID_SCENARIOS[number] {
    return (this.VALID_SCENARIOS as readonly string[]).includes(scenario);
  }

  /**
   * Get list of valid scenarios
   * 
   * @returns Array of valid scenario names
   */
  static getValidScenarios(): readonly string[] {
    return this.VALID_SCENARIOS;
  }
}
