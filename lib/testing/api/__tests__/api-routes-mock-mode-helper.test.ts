/**
 * API Routes MockModeHelper Integration Tests
 * 
 * Tests that API routes correctly use MockModeHelper for:
 * - Environment validation
 * - ServiceFactory creation
 * - Mock mode status in responses
 * - Error handling for configuration failures
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockModeHelper } from '../mock-mode-helper';
import { TestEnvironmentConfig } from '../../config/test-environment';
import { resetFeatureFlagManager } from '../../FeatureFlagManager';

describe('API Routes MockModeHelper Integration', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // Save original environment
    originalEnv = {
      FF_USE_MOCK_API: process.env.FF_USE_MOCK_API,
      FF_MOCK_SCENARIO: process.env.FF_MOCK_SCENARIO,
      FF_SIMULATE_LATENCY: process.env.FF_SIMULATE_LATENCY,
      NODE_ENV: process.env.NODE_ENV,
    };
    
    // Reset feature flag manager
    resetFeatureFlagManager();
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
    
    // Reset feature flag manager
    resetFeatureFlagManager();
  });

  describe('MockModeHelper.isMockModeActive()', () => {
    it('should return true when mock mode is enabled', () => {
      process.env.FF_USE_MOCK_API = 'true';
      
      const isActive = MockModeHelper.isMockModeActive();
      
      expect(isActive).toBe(true);
    });

    it('should return false when mock mode is disabled', () => {
      process.env.FF_USE_MOCK_API = 'false';
      
      const isActive = MockModeHelper.isMockModeActive();
      
      expect(isActive).toBe(false);
    });

    it('should default to true when FF_USE_MOCK_API is not set', () => {
      delete process.env.FF_USE_MOCK_API;
      
      const isActive = MockModeHelper.isMockModeActive();
      
      expect(isActive).toBe(true);
    });
  });

  describe('MockModeHelper.getMockModeStatus()', () => {
    it('should return correct status when mock mode is enabled', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'api_error';
      
      const status = MockModeHelper.getMockModeStatus();
      
      expect(status.mockMode).toBe(true);
      expect(status.scenario).toBe('api_error');
      expect(status.timestamp).toBeDefined();
      expect(new Date(status.timestamp)).toBeInstanceOf(Date);
    });

    it('should return correct status when mock mode is disabled', () => {
      process.env.FF_USE_MOCK_API = 'false';
      
      const status = MockModeHelper.getMockModeStatus();
      
      expect(status.mockMode).toBe(false);
      expect(status.scenario).toBe('success'); // default
      expect(status.timestamp).toBeDefined();
    });

    it('should use default scenario when not specified', () => {
      process.env.FF_USE_MOCK_API = 'true';
      delete process.env.FF_MOCK_SCENARIO;
      
      const status = MockModeHelper.getMockModeStatus();
      
      expect(status.scenario).toBe('success');
    });
  });

  describe('MockModeHelper.getConfiguration()', () => {
    it('should return complete configuration', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'timeout';
      process.env.FF_SIMULATE_LATENCY = 'true';
      
      const config = MockModeHelper.getConfiguration();
      
      expect(config).toEqual({
        mockMode: true,
        scenario: 'timeout',
        simulateLatency: true,
        nodeEnv: expect.any(String),
      });
    });

    it('should return configuration with defaults', () => {
      delete process.env.FF_USE_MOCK_API;
      delete process.env.FF_MOCK_SCENARIO;
      delete process.env.FF_SIMULATE_LATENCY;
      
      const config = MockModeHelper.getConfiguration();
      
      expect(config).toEqual({
        mockMode: true,
        scenario: 'success',
        simulateLatency: false,
        nodeEnv: expect.any(String),
      });
    });
  });

  describe('MockModeHelper.validateEnvironment()', () => {
    it('should validate successfully with correct configuration', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      
      const validation = MockModeHelper.validateEnvironment();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should accept missing mock mode flag in non-production environments', () => {
      delete process.env.FF_USE_MOCK_API;
      
      const validation = MockModeHelper.validateEnvironment();
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should warn for invalid scenario', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'invalid_scenario';
      
      const validation = MockModeHelper.validateEnvironment();
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('Invalid mock scenario');
    });
  });

  describe('MockModeHelper.createServiceFactory()', () => {
    it.skip('should create ServiceFactory when environment is valid (requires Supabase)', () => {
      // This test requires Supabase credentials to be set
      // It's tested in E2E tests where the full environment is available
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      
      const factory = MockModeHelper.createServiceFactory();
      
      expect(factory).toBeDefined();
      expect(factory.isMockModeEnabled()).toBe(true);
    });

    it.skip('should create ServiceFactory when mock mode is disabled (requires Supabase)', () => {
      // This test requires Supabase credentials to be set
      // It's tested in E2E tests where the full environment is available
      process.env.FF_USE_MOCK_API = 'false';
      
      const factory = MockModeHelper.createServiceFactory();
      
      expect(factory).toBeDefined();
      expect(factory.isMockModeEnabled()).toBe(false);
    });

    it.skip('should create ServiceFactory with diagnostics (requires Supabase)', () => {
      // This test requires Supabase credentials to be set
      // It's tested in E2E tests where the full environment is available
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      
      const factory = MockModeHelper.createServiceFactory();
      const diagnostics = factory.getDiagnostics();
      
      expect(diagnostics.mockMode).toBe(true);
      expect(diagnostics.servicesCreated).toBeDefined();
      expect(diagnostics.configuration).toBeDefined();
    });
  });

  describe('Integration with TestEnvironmentConfig', () => {
    it('should use TestEnvironmentConfig for validation', () => {
      process.env.FF_USE_MOCK_API = 'true';
      
      const helperValidation = MockModeHelper.validateEnvironment();
      const configValidation = TestEnvironmentConfig.validateTestEnvironment();
      
      expect(helperValidation).toEqual(configValidation);
    });

    it('should use TestEnvironmentConfig for configuration', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'api_error';
      
      const helperConfig = MockModeHelper.getConfiguration();
      const testConfig = TestEnvironmentConfig.getCurrentConfig();
      
      expect(helperConfig).toEqual(testConfig);
    });
  });
});
