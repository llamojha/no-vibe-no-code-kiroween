/**
 * Environment Configuration Integration Tests
 * 
 * Tests the integration of environment configuration with the application.
 * Verifies that TestEnvironmentConfig properly validates and provides
 * configuration for different scenarios.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  TestEnvironmentConfig,
  MockConfigurationError,
  MockConfigurationErrorCodes,
  type ValidationResult,
  type TestEnvironmentConfiguration,
} from '@/lib/testing/config/test-environment';

describe('Environment Configuration Integration', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // Save original environment
    originalEnv = {
      FF_USE_MOCK_API: process.env.FF_USE_MOCK_API,
      FF_MOCK_SCENARIO: process.env.FF_MOCK_SCENARIO,
      FF_SIMULATE_LATENCY: process.env.FF_SIMULATE_LATENCY,
      NODE_ENV: process.env.NODE_ENV,
      ALLOW_TEST_MODE_IN_PRODUCTION: process.env.ALLOW_TEST_MODE_IN_PRODUCTION,
    };
  });

  afterEach(() => {
    // Restore original environment
    Object.keys(originalEnv).forEach(key => {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
  });

  describe('validateTestEnvironment with valid configuration', () => {
    it('should validate successfully when mock mode is enabled with valid scenario', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      // Act
      const result: ValidationResult = TestEnvironmentConfig.validateTestEnvironment();

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate successfully when mock mode is disabled', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'false';
      process.env.NODE_ENV = 'development';

      // Act
      const result: ValidationResult = TestEnvironmentConfig.validateTestEnvironment();

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate successfully with all valid scenarios', () => {
      // Arrange
      const validScenarios = TestEnvironmentConfig.getValidScenarios();
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'test';

      // Act & Assert
      validScenarios.forEach(scenario => {
        process.env.FF_MOCK_SCENARIO = scenario;
        const result = TestEnvironmentConfig.validateTestEnvironment();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('validateTestEnvironment with invalid configuration', () => {
    it('should return error when mock mode is enabled in production', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_TEST_MODE_IN_PRODUCTION;

      // Act
      const result: ValidationResult = TestEnvironmentConfig.validateTestEnvironment();

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mock mode cannot be enabled in production');
    });

    it('should allow production mock mode when override is enabled', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_TEST_MODE_IN_PRODUCTION = 'true';

      // Act
      const result: ValidationResult = TestEnvironmentConfig.validateTestEnvironment();

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return warning for invalid scenario', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'invalid_scenario_name';
      process.env.NODE_ENV = 'test';

      // Act
      const result: ValidationResult = TestEnvironmentConfig.validateTestEnvironment();

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Invalid mock scenario');
      expect(result.warnings[0]).toContain('invalid_scenario_name');
    });

    it('should treat missing mock flag as enabled in non-production', () => {
      // Arrange
      delete process.env.FF_USE_MOCK_API;
      process.env.NODE_ENV = 'test';

      // Act
      const result: ValidationResult = TestEnvironmentConfig.validateTestEnvironment();

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('getCurrentConfig returns correct values', () => {
    it('should return correct config when mock mode is enabled', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'api_error';
      process.env.FF_SIMULATE_LATENCY = 'true';
      process.env.NODE_ENV = 'test';

      // Act
      const config: TestEnvironmentConfiguration = TestEnvironmentConfig.getCurrentConfig();

      // Assert
      expect(config.mockMode).toBe(true);
      expect(config.scenario).toBe('api_error');
      expect(config.simulateLatency).toBe(true);
      expect(config.nodeEnv).toBe('test');
    });

    it('should return correct config when mock mode is disabled', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'false';
      process.env.NODE_ENV = 'development';

      // Act
      const config: TestEnvironmentConfiguration = TestEnvironmentConfig.getCurrentConfig();

      // Assert
      expect(config.mockMode).toBe(false);
      expect(config.scenario).toBe('success'); // default
      expect(config.simulateLatency).toBe(false);
      expect(config.nodeEnv).toBe('development');
    });

    it('should use default values when environment variables are missing', () => {
      // Arrange
      delete process.env.FF_USE_MOCK_API;
      delete process.env.FF_MOCK_SCENARIO;
      delete process.env.FF_SIMULATE_LATENCY;
      delete process.env.NODE_ENV;

      // Act
      const config: TestEnvironmentConfiguration = TestEnvironmentConfig.getCurrentConfig();

      // Assert
      expect(config.mockMode).toBe(true);
      expect(config.scenario).toBe('success');
      expect(config.simulateLatency).toBe(false);
      expect(config.nodeEnv).toBe('development');
    });

    it('should handle all scenario types correctly', () => {
      // Arrange
      const scenarios = ['success', 'api_error', 'timeout', 'rate_limit', 'invalid_input', 'partial_response'];
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'test';

      // Act & Assert
      scenarios.forEach(scenario => {
        process.env.FF_MOCK_SCENARIO = scenario;
        const config = TestEnvironmentConfig.getCurrentConfig();
        
        expect(config.scenario).toBe(scenario);
        expect(config.mockMode).toBe(true);
      });
    });
  });

  describe('production environment validation', () => {
    it('should prevent mock mode in production environment', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'production';

      // Act
      const result: ValidationResult = TestEnvironmentConfig.validateTestEnvironment();

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mock mode cannot be enabled in production');
    });

    it('should allow production environment when mock mode is disabled', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'false';
      process.env.NODE_ENV = 'production';

      // Act
      const result: ValidationResult = TestEnvironmentConfig.validateTestEnvironment();

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow production environment when mock mode is not set', () => {
      // Arrange
      delete process.env.FF_USE_MOCK_API;
      process.env.NODE_ENV = 'production';

      // Act
      const result: ValidationResult = TestEnvironmentConfig.validateTestEnvironment();

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('MockConfigurationError', () => {
    it('should create error with all properties', () => {
      // Arrange & Act
      const error = new MockConfigurationError(
        'Configuration failed',
        MockConfigurationErrorCodes.INVALID_TEST_ENV,
        { errors: ['error1', 'error2'], warnings: ['warning1'] }
      );

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(MockConfigurationError);
      expect(error.message).toBe('Configuration failed');
      expect(error.code).toBe(MockConfigurationErrorCodes.INVALID_TEST_ENV);
      expect(error.details).toEqual({
        errors: ['error1', 'error2'],
        warnings: ['warning1']
      });
      expect(error.name).toBe('MockConfigurationError');
    });

    it('should work with all error codes', () => {
      // Arrange
      const errorCodes = [
        MockConfigurationErrorCodes.INVALID_TEST_ENV,
        MockConfigurationErrorCodes.MOCK_MODE_IN_PRODUCTION,
        MockConfigurationErrorCodes.INVALID_SCENARIO,
        MockConfigurationErrorCodes.MISSING_REQUIRED_VAR,
        MockConfigurationErrorCodes.MOCK_SERVICE_CREATION_FAILED,
      ];

      // Act & Assert
      errorCodes.forEach(code => {
        const error = new MockConfigurationError('Test error', code);
        expect(error.code).toBe(code);
        expect(error).toBeInstanceOf(MockConfigurationError);
      });
    });
  });

  describe('logConfiguration', () => {
    it('should not throw when logging configuration', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      // Act & Assert
      expect(() => {
        TestEnvironmentConfig.logConfiguration();
      }).not.toThrow();
    });
  });

  describe('scenario validation', () => {
    it('should validate all supported scenarios', () => {
      // Arrange
      const validScenarios = TestEnvironmentConfig.getValidScenarios();

      // Act & Assert
      validScenarios.forEach(scenario => {
        expect(TestEnvironmentConfig.isValidScenario(scenario)).toBe(true);
      });
    });

    it('should reject invalid scenarios', () => {
      // Arrange
      const invalidScenarios = ['invalid', 'unknown', 'test', '', 'null'];

      // Act & Assert
      invalidScenarios.forEach(scenario => {
        expect(TestEnvironmentConfig.isValidScenario(scenario)).toBe(false);
      });
    });
  });
});
    it('should respect production override when fetching current config', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_TEST_MODE_IN_PRODUCTION = 'true';

      // Act
      const config = TestEnvironmentConfig.getCurrentConfig();

      // Assert
      expect(config.mockMode).toBe(true);
      expect(config.nodeEnv).toBe('production');
    });
