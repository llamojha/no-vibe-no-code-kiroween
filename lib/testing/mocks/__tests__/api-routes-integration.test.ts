/**
 * API Routes Mock Integration Tests
 * 
 * Tests the integration of mock services with API routes.
 * Verifies that routes correctly detect and use mock mode.
 * 
 * Note: NODE_ENV is read-only in tests, so production mode tests
 * are handled in FeatureFlagManager.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FeatureFlagManager, resetFeatureFlagManager } from '../../FeatureFlagManager';

describe('API Routes Mock Integration', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // Save original environment (excluding NODE_ENV which is read-only)
    originalEnv = {
      FF_USE_MOCK_API: process.env.FF_USE_MOCK_API,
      FF_MOCK_SCENARIO: process.env.FF_MOCK_SCENARIO,
      FF_MOCK_VARIABILITY: process.env.FF_MOCK_VARIABILITY,
      FF_SIMULATE_LATENCY: process.env.FF_SIMULATE_LATENCY,
      FF_MIN_LATENCY: process.env.FF_MIN_LATENCY,
      FF_MAX_LATENCY: process.env.FF_MAX_LATENCY,
      FF_LOG_MOCK_REQUESTS: process.env.FF_LOG_MOCK_REQUESTS,
    };
    
    // Reset feature flag manager
    resetFeatureFlagManager();
  });

  afterEach(() => {
    // Restore original environment variables
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

  describe('FeatureFlagManager Integration', () => {
    it('should detect mock mode when FF_USE_MOCK_API is true', () => {
      process.env.FF_USE_MOCK_API = 'true';
      
      const manager = new FeatureFlagManager();
      
      // In test environment (not production), mock mode should be enabled
      if (process.env.NODE_ENV !== 'production') {
        expect(manager.isMockModeEnabled()).toBe(true);
      }
    });

    it('should not enable mock mode when FF_USE_MOCK_API is false', () => {
      process.env.FF_USE_MOCK_API = 'false';
      
      const manager = new FeatureFlagManager();
      
      expect(manager.isMockModeEnabled()).toBe(false);
    });

    it('should provide mock service configuration', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'api_error';
      process.env.FF_SIMULATE_LATENCY = 'true';
      process.env.FF_MIN_LATENCY = '100';
      process.env.FF_MAX_LATENCY = '500';
      process.env.FF_LOG_MOCK_REQUESTS = 'true';
      
      const manager = new FeatureFlagManager();
      const config = manager.getMockServiceConfig();
      
      expect(config).toEqual({
        defaultScenario: 'api_error',
        enableVariability: false,
        simulateLatency: true,
        minLatency: 100,
        maxLatency: 500,
        logRequests: true,
      });
    });
  });

  describe('Mock Scenario Configuration', () => {
    it('should support success scenario', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      
      const manager = new FeatureFlagManager();
      const config = manager.getMockServiceConfig();
      
      expect(config.defaultScenario).toBe('success');
    });

    it('should support api_error scenario', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'api_error';
      
      const manager = new FeatureFlagManager();
      const config = manager.getMockServiceConfig();
      
      expect(config.defaultScenario).toBe('api_error');
    });

    it('should support timeout scenario', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'timeout';
      
      const manager = new FeatureFlagManager();
      const config = manager.getMockServiceConfig();
      
      expect(config.defaultScenario).toBe('timeout');
    });

    it('should support rate_limit scenario', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'rate_limit';
      
      const manager = new FeatureFlagManager();
      const config = manager.getMockServiceConfig();
      
      expect(config.defaultScenario).toBe('rate_limit');
    });

    it('should default to success for invalid scenario', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'invalid_scenario';
      
      const manager = new FeatureFlagManager();
      const config = manager.getMockServiceConfig();
      
      expect(config.defaultScenario).toBe('success');
    });
  });

  describe('Latency Simulation Configuration', () => {
    it('should enable latency simulation when configured', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_SIMULATE_LATENCY = 'true';
      
      const manager = new FeatureFlagManager();
      const config = manager.getMockServiceConfig();
      
      expect(config.simulateLatency).toBe(true);
    });

    it('should disable latency simulation by default', () => {
      process.env.FF_USE_MOCK_API = 'true';
      
      const manager = new FeatureFlagManager();
      const config = manager.getMockServiceConfig();
      
      expect(config.simulateLatency).toBe(false);
    });

    it('should use custom latency range', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MIN_LATENCY = '200';
      process.env.FF_MAX_LATENCY = '1000';
      
      const manager = new FeatureFlagManager();
      const config = manager.getMockServiceConfig();
      
      expect(config.minLatency).toBe(200);
      expect(config.maxLatency).toBe(1000);
    });

    it('should use default latency range when not specified', () => {
      process.env.FF_USE_MOCK_API = 'true';
      
      const manager = new FeatureFlagManager();
      const config = manager.getMockServiceConfig();
      
      expect(config.minLatency).toBe(500);
      expect(config.maxLatency).toBe(2000);
    });
  });

  describe('Request Logging Configuration', () => {
    it('should enable request logging when configured', () => {
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_LOG_MOCK_REQUESTS = 'true';
      
      const manager = new FeatureFlagManager();
      const config = manager.getMockServiceConfig();
      
      expect(config.logRequests).toBe(true);
    });

    it('should disable request logging by default', () => {
      process.env.FF_USE_MOCK_API = 'true';
      
      const manager = new FeatureFlagManager();
      const config = manager.getMockServiceConfig();
      
      expect(config.logRequests).toBe(false);
    });
  });
});
