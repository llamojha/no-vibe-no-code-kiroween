/**
 * Tests for TestEnvironmentConfig
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  TestEnvironmentConfig,
  MockConfigurationError,
  MockConfigurationErrorCodes,
} from '../test-environment';

describe('TestEnvironmentConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment before each test
    Object.keys(process.env).forEach(key => {
      if (
        key.startsWith('FF_') ||
        key === 'NODE_ENV' ||
        key === 'ALLOW_TEST_MODE_IN_PRODUCTION'
      ) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  afterEach(() => {
    // Restore original environment
    Object.keys(process.env).forEach(key => {
      if (
        key.startsWith('FF_') ||
        key === 'NODE_ENV' ||
        key === 'ALLOW_TEST_MODE_IN_PRODUCTION'
      ) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  describe('validateTestEnvironment', () => {
    it('should return valid when mock mode is not set', () => {
      delete process.env.FF_USE_MOCK_API;
      
      const result = TestEnvironmentConfig.validateTestEnvironment();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return valid when mock mode is enabled in test environment', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      (process.env as Record<string, string>).NODE_ENV = 'test';
      
      const result = TestEnvironmentConfig.validateTestEnvironment();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error when mock mode is enabled in production', () => {
      process.env.FF_USE_MOCK_API = 'true';
      (process.env as Record<string, string>).NODE_ENV = 'production';
      delete process.env.ALLOW_TEST_MODE_IN_PRODUCTION;
      
      const result = TestEnvironmentConfig.validateTestEnvironment();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mock mode cannot be enabled in production');
    });

    it('should allow mock mode in production when override is enabled', () => {
      process.env.FF_USE_MOCK_API = 'true';
      (process.env as Record<string, string>).NODE_ENV = 'production';
      process.env.ALLOW_TEST_MODE_IN_PRODUCTION = 'true';

      const result = TestEnvironmentConfig.validateTestEnvironment();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return warning for invalid scenario', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'invalid_scenario';
      (process.env as Record<string, string>).NODE_ENV = 'test';
      
      const result = TestEnvironmentConfig.validateTestEnvironment();
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Invalid mock scenario');
    });

    it('should accept all valid scenarios', () => {
      const validScenarios = ['success', 'api_error', 'timeout', 'rate_limit', 'invalid_input', 'partial_response'];
      
      validScenarios.forEach(scenario => {
        process.env.FF_USE_MOCK_API = 'true';
        process.env.FF_MOCK_SCENARIO = scenario;
        (process.env as Record<string, string>).NODE_ENV = 'test';
        
        const result = TestEnvironmentConfig.validateTestEnvironment();
        
        expect(result.isValid).toBe(true);
        expect(result.warnings).toHaveLength(0);
      });
    });
  });

  describe('getCurrentConfig', () => {
    it('should return correct configuration when mock mode is enabled', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'api_error';
      process.env.FF_SIMULATE_LATENCY = 'true';
      (process.env as Record<string, string>).NODE_ENV = 'test';
      
      const config = TestEnvironmentConfig.getCurrentConfig();
      
      expect(config.mockMode).toBe(true);
      expect(config.scenario).toBe('api_error');
      expect(config.simulateLatency).toBe(true);
      expect(config.nodeEnv).toBe('test');
    });

    it('should return correct configuration when mock mode falls back to defaults', () => {
      delete process.env.FF_USE_MOCK_API;
      (process.env as Record<string, string>).NODE_ENV = 'development';
      
      const config = TestEnvironmentConfig.getCurrentConfig();
      
      expect(config.mockMode).toBe(true);
      expect(config.scenario).toBe('success');
      expect(config.simulateLatency).toBe(false);
      expect(config.nodeEnv).toBe('development');
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env.FF_USE_MOCK_API;
      delete process.env.FF_MOCK_SCENARIO;
      delete process.env.FF_SIMULATE_LATENCY;
      const env = process.env as Record<string, string | undefined>;
      delete env.NODE_ENV;
      
      const config = TestEnvironmentConfig.getCurrentConfig();
      
      expect(config.mockMode).toBe(true);
      expect(config.scenario).toBe('success');
      expect(config.simulateLatency).toBe(false);
      expect(config.nodeEnv).toBe('development');
    });
  });

  describe('isValidScenario', () => {
    it('should return true for valid scenarios', () => {
      expect(TestEnvironmentConfig.isValidScenario('success')).toBe(true);
      expect(TestEnvironmentConfig.isValidScenario('api_error')).toBe(true);
      expect(TestEnvironmentConfig.isValidScenario('timeout')).toBe(true);
    });

    it('should return false for invalid scenarios', () => {
      expect(TestEnvironmentConfig.isValidScenario('invalid')).toBe(false);
      expect(TestEnvironmentConfig.isValidScenario('')).toBe(false);
      expect(TestEnvironmentConfig.isValidScenario('random')).toBe(false);
    });
  });

  describe('getValidScenarios', () => {
    it('should return array of valid scenarios', () => {
      const scenarios = TestEnvironmentConfig.getValidScenarios();
      
      expect(scenarios).toContain('success');
      expect(scenarios).toContain('api_error');
      expect(scenarios).toContain('timeout');
      expect(scenarios).toContain('rate_limit');
      expect(scenarios).toContain('invalid_input');
      expect(scenarios).toContain('partial_response');
    });
  });
});

describe('MockConfigurationError', () => {
  it('should create error with code and details', () => {
    const error = new MockConfigurationError(
      'Test error',
      MockConfigurationErrorCodes.INVALID_TEST_ENV,
      { key: 'value' }
    );
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(MockConfigurationErrorCodes.INVALID_TEST_ENV);
    expect(error.details).toEqual({ key: 'value' });
    expect(error.name).toBe('MockConfigurationError');
  });

  it('should work without details', () => {
    const error = new MockConfigurationError(
      'Test error',
      MockConfigurationErrorCodes.MOCK_MODE_IN_PRODUCTION
    );
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(MockConfigurationErrorCodes.MOCK_MODE_IN_PRODUCTION);
    expect(error.details).toBeUndefined();
  });

  it('should be instanceof Error', () => {
    const error = new MockConfigurationError(
      'Test error',
      MockConfigurationErrorCodes.INVALID_SCENARIO
    );
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MockConfigurationError);
  });
});
    it('should respect production override when returning config', () => {
      process.env.FF_USE_MOCK_API = 'true';
      (process.env as Record<string, string>).NODE_ENV = 'production';
      process.env.ALLOW_TEST_MODE_IN_PRODUCTION = 'true';

      const config = TestEnvironmentConfig.getCurrentConfig();

      expect(config.mockMode).toBe(true);
      expect(config.nodeEnv).toBe('production');
    });
