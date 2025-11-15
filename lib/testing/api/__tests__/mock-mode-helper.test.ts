/**
 * Tests for MockModeHelper
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockModeHelper } from '../mock-mode-helper';
import { MockConfigurationError, MockConfigurationErrorCodes } from '../../config/test-environment';

// Mock the dependencies
vi.mock('@/src/infrastructure/factories/ServiceFactory');
vi.mock('@/src/infrastructure/integration/SupabaseAdapter');

describe('MockModeHelper', () => {
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
    
    // Set default test environment
    process.env.FF_USE_MOCK_API = 'true';
    process.env.FF_MOCK_SCENARIO = 'success';
    (process.env as Record<string, string>).NODE_ENV = 'test';
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
    vi.clearAllMocks();
  });

  describe('isMockModeActive', () => {
    it('should return true when mock mode is enabled', () => {
      process.env.FF_USE_MOCK_API = 'true';
      
      const result = MockModeHelper.isMockModeActive();
      
      expect(result).toBe(true);
    });

    it('should default to true when mock mode is not set in non-production', () => {
      delete process.env.FF_USE_MOCK_API;
      
      const result = MockModeHelper.isMockModeActive();
      
      expect(result).toBe(true);
    });

    it('should return false when FF_USE_MOCK_API is set to false', () => {
      process.env.FF_USE_MOCK_API = 'false';
      
      const result = MockModeHelper.isMockModeActive();
      
      expect(result).toBe(false);
    });
  });

  describe('getMockModeStatus', () => {
    it('should return correct status when mock mode is enabled', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'api_error';
      
      const status = MockModeHelper.getMockModeStatus();
      
      expect(status.mockMode).toBe(true);
      expect(status.scenario).toBe('api_error');
      expect(status.timestamp).toBeDefined();
      expect(new Date(status.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should return correct status when mock mode uses default value', () => {
      delete process.env.FF_USE_MOCK_API;
      
      const status = MockModeHelper.getMockModeStatus();
      
      expect(status.mockMode).toBe(true);
      expect(status.scenario).toBe('success'); // default scenario
      expect(status.timestamp).toBeDefined();
    });

    it('should include current timestamp', () => {
      const beforeTime = new Date().getTime();
      const status = MockModeHelper.getMockModeStatus();
      const afterTime = new Date().getTime();
      
      const statusTime = new Date(status.timestamp).getTime();
      
      expect(statusTime).toBeGreaterThanOrEqual(beforeTime);
      expect(statusTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('getConfiguration', () => {
    it('should return current configuration', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'timeout';
      process.env.FF_SIMULATE_LATENCY = 'true';
      (process.env as Record<string, string>).NODE_ENV = 'test';
      
      const config = MockModeHelper.getConfiguration();
      
      expect(config.mockMode).toBe(true);
      expect(config.scenario).toBe('timeout');
      expect(config.simulateLatency).toBe(true);
      expect(config.nodeEnv).toBe('test');
    });

    it('should return default values when environment variables are not set', () => {
      delete process.env.FF_USE_MOCK_API;
      delete process.env.FF_MOCK_SCENARIO;
      delete process.env.FF_SIMULATE_LATENCY;
      (process.env as Record<string, string>).NODE_ENV = 'development';
      
      const config = MockModeHelper.getConfiguration();
      
      expect(config.mockMode).toBe(true);
      expect(config.scenario).toBe('success');
      expect(config.simulateLatency).toBe(false);
      expect(config.nodeEnv).toBe('development');
    });
  });

  describe('validateEnvironment', () => {
    it('should return valid result for correct configuration', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      (process.env as Record<string, string>).NODE_ENV = 'test';
      
      const validation = MockModeHelper.validateEnvironment();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return error for mock mode in production', () => {
      process.env.FF_USE_MOCK_API = 'true';
      (process.env as Record<string, string>).NODE_ENV = 'production';
      delete process.env.ALLOW_TEST_MODE_IN_PRODUCTION;
      
      const validation = MockModeHelper.validateEnvironment();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Mock mode cannot be enabled in production');
    });

    it('should allow production mock mode when override is enabled', () => {
      process.env.FF_USE_MOCK_API = 'true';
      (process.env as Record<string, string>).NODE_ENV = 'production';
      process.env.ALLOW_TEST_MODE_IN_PRODUCTION = 'true';

      const validation = MockModeHelper.validateEnvironment();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return warning for invalid scenario', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'invalid_scenario';
      (process.env as Record<string, string>).NODE_ENV = 'test';
      
      const validation = MockModeHelper.validateEnvironment();
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('Invalid mock scenario');
    });
  });

  describe('logConfiguration', () => {
    it('should not throw errors when called', () => {
      expect(() => {
        MockModeHelper.logConfiguration();
      }).not.toThrow();
    });

    it('should not log in production environment', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      (process.env as Record<string, string>).NODE_ENV = 'production';
      
      MockModeHelper.logConfiguration();
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('createServiceFactory', () => {
    it('should throw MockConfigurationError when validation fails', () => {
      // Set up invalid configuration (mock mode in production)
      process.env.FF_USE_MOCK_API = 'true';
      (process.env as Record<string, string>).NODE_ENV = 'production';
      delete process.env.ALLOW_TEST_MODE_IN_PRODUCTION;
      
      expect(() => {
        MockModeHelper.createServiceFactory();
      }).toThrow(MockConfigurationError);
    });

    it('should throw error with correct error code', () => {
      process.env.FF_USE_MOCK_API = 'true';
      (process.env as Record<string, string>).NODE_ENV = 'production';
      delete process.env.ALLOW_TEST_MODE_IN_PRODUCTION;
      
      try {
        MockModeHelper.createServiceFactory();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(MockConfigurationError);
        expect((error as MockConfigurationError).code).toBe(MockConfigurationErrorCodes.INVALID_TEST_ENV);
      }
    });

    it('should include error details in thrown error', () => {
      process.env.FF_USE_MOCK_API = 'true';
      (process.env as Record<string, string>).NODE_ENV = 'production';
      delete process.env.ALLOW_TEST_MODE_IN_PRODUCTION;
      
      try {
        MockModeHelper.createServiceFactory();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(MockConfigurationError);
        const configError = error as MockConfigurationError;
        expect(configError.details).toBeDefined();
        expect(configError.details?.errors).toBeDefined();
      }
    });

    it('should allow service factory creation when override flag is set', () => {
      process.env.FF_USE_MOCK_API = 'true';
      (process.env as Record<string, string>).NODE_ENV = 'production';
      process.env.ALLOW_TEST_MODE_IN_PRODUCTION = 'true';

      expect(() => {
        MockModeHelper.createServiceFactory();
      }).not.toThrow();
    });
  });
});
