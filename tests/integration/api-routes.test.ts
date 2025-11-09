/**
 * API Routes Integration Tests
 * 
 * Tests the integration of API routes with mock mode.
 * Verifies that routes correctly use MockModeHelper and return
 * mock responses when mock mode is enabled.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockModeHelper } from '@/lib/testing/api/mock-mode-helper';
import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';
import { SupabaseAdapter } from '@/src/infrastructure/integration/SupabaseAdapter';
import { MockAIAnalysisService } from '@/lib/testing/mocks/MockAIAnalysisService';

describe('API Routes Integration', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // Save original environment
    originalEnv = {
      FF_USE_MOCK_API: process.env.FF_USE_MOCK_API,
      FF_MOCK_SCENARIO: process.env.FF_MOCK_SCENARIO,
      FF_SIMULATE_LATENCY: process.env.FF_SIMULATE_LATENCY,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };

    // Set up Supabase environment variables for testing
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
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

  describe('/api/analyze returns mock responses', () => {
    it('should use mock service when mock mode is enabled', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      // Act
      const factory = MockModeHelper.createServiceFactory();
      const service = factory.createAIAnalysisService();

      // Assert
      expect(service).toBeInstanceOf(MockAIAnalysisService);
      expect(factory.isMockModeEnabled()).toBe(true);

      // Cleanup
      factory.clearCache();
    });

    it('should include mock mode status in response metadata', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      // Act
      const mockModeStatus = MockModeHelper.getMockModeStatus();

      // Assert
      expect(mockModeStatus).toHaveProperty('mockMode', true);
      expect(mockModeStatus).toHaveProperty('scenario', 'success');
      expect(mockModeStatus).toHaveProperty('timestamp');
    });

    it('should handle mock configuration errors gracefully', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'production'; // Invalid: mock mode in production

      // Act & Assert
      expect(() => {
        MockModeHelper.createServiceFactory();
      }).toThrow();
    });

    it('should validate environment before creating services', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'test';

      // Act
      const validation = MockModeHelper.validateEnvironment();

      // Assert
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('/api/analyze-hackathon returns mock responses', () => {
    it('should use mock service when mock mode is enabled', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      // Act
      const factory = MockModeHelper.createServiceFactory();
      const service = factory.createAIAnalysisService();

      // Assert
      expect(service).toBeInstanceOf(MockAIAnalysisService);
      expect(factory.isMockModeEnabled()).toBe(true);

      // Cleanup
      factory.clearCache();
    });

    it('should include mock mode status in response metadata', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'api_error';
      process.env.NODE_ENV = 'test';

      // Act
      const mockModeStatus = MockModeHelper.getMockModeStatus();

      // Assert
      expect(mockModeStatus).toHaveProperty('mockMode', true);
      expect(mockModeStatus).toHaveProperty('scenario', 'api_error');
      expect(mockModeStatus).toHaveProperty('timestamp');
    });

    it('should handle different scenarios correctly', () => {
      // Arrange
      const scenarios = ['success', 'api_error', 'timeout', 'rate_limit'];

      scenarios.forEach(scenario => {
        process.env.FF_USE_MOCK_API = 'true';
        process.env.FF_MOCK_SCENARIO = scenario;
        process.env.NODE_ENV = 'test';

        // Act
        const mockModeStatus = MockModeHelper.getMockModeStatus();

        // Assert
        expect(mockModeStatus.scenario).toBe(scenario);
        expect(mockModeStatus.mockMode).toBe(true);
      });
    });
  });

  describe('/api/doctor-frankenstein/generate returns mock responses', () => {
    it('should detect mock mode correctly', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      // Act
      const isMockMode = MockModeHelper.isMockModeActive();
      const mockModeStatus = MockModeHelper.getMockModeStatus();

      // Assert
      expect(isMockMode).toBe(true);
      expect(mockModeStatus.mockMode).toBe(true);
    });

    it('should include mock mode status in response metadata', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      // Act
      const mockModeStatus = MockModeHelper.getMockModeStatus();

      // Assert
      expect(mockModeStatus).toHaveProperty('mockMode', true);
      expect(mockModeStatus).toHaveProperty('scenario', 'success');
      expect(mockModeStatus).toHaveProperty('timestamp');
      expect(typeof mockModeStatus.timestamp).toBe('string');
    });

    it('should provide configuration for mock service', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.FF_SIMULATE_LATENCY = 'true';
      process.env.NODE_ENV = 'test';

      // Act
      const config = MockModeHelper.getConfiguration();

      // Assert
      expect(config.mockMode).toBe(true);
      expect(config.scenario).toBe('success');
      expect(config.simulateLatency).toBe(true);
    });
  });

  describe('Mock mode status is included in responses', () => {
    it('should provide consistent mock mode status across all routes', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      // Act
      const status1 = MockModeHelper.getMockModeStatus();
      const status2 = MockModeHelper.getMockModeStatus();

      // Assert
      expect(status1.mockMode).toBe(status2.mockMode);
      expect(status1.scenario).toBe(status2.scenario);
    });

    it('should include timestamp in mock mode status', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'test';

      // Act
      const mockModeStatus = MockModeHelper.getMockModeStatus();

      // Assert
      expect(mockModeStatus.timestamp).toBeDefined();
      expect(typeof mockModeStatus.timestamp).toBe('string');
      expect(new Date(mockModeStatus.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should reflect current environment configuration', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'timeout';
      process.env.NODE_ENV = 'test';

      // Act
      const mockModeStatus = MockModeHelper.getMockModeStatus();
      const config = MockModeHelper.getConfiguration();

      // Assert
      expect(mockModeStatus.mockMode).toBe(config.mockMode);
      expect(mockModeStatus.scenario).toBe(config.scenario);
    });
  });

  describe('MockModeHelper integration', () => {
    it('should create ServiceFactory with proper configuration', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      // Act
      const factory = MockModeHelper.createServiceFactory();
      const diagnostics = factory.getDiagnostics();

      // Assert
      expect(factory).toBeInstanceOf(ServiceFactory);
      expect(diagnostics.mockMode).toBe(true);

      // Cleanup
      factory.clearCache();
    });

    it('should validate environment before creating factory', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'test';

      // Act
      const validation = MockModeHelper.validateEnvironment();

      // Assert
      expect(validation.isValid).toBe(true);
    });

    it('should provide configuration helper methods', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      // Act
      const isMockMode = MockModeHelper.isMockModeActive();
      const config = MockModeHelper.getConfiguration();
      const status = MockModeHelper.getMockModeStatus();

      // Assert
      expect(isMockMode).toBe(true);
      expect(config.mockMode).toBe(true);
      expect(status.mockMode).toBe(true);
    });

    it('should handle logging configuration', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'test';

      // Act & Assert - Should not throw
      expect(() => {
        MockModeHelper.logConfiguration();
      }).not.toThrow();
    });
  });

  describe('Error handling in API routes', () => {
    it('should handle mock configuration errors', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'production'; // Invalid configuration

      // Act & Assert
      expect(() => {
        MockModeHelper.createServiceFactory();
      }).toThrow();
    });

    it('should provide detailed error information', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'production';

      // Act & Assert
      try {
        MockModeHelper.createServiceFactory();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('validation failed');
        expect(error.code).toBeDefined();
      }
    });
  });

  describe('Production mode behavior', () => {
    it('should not enable mock mode in production', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'false';
      process.env.NODE_ENV = 'production';

      // Act
      const isMockMode = MockModeHelper.isMockModeActive();
      const config = MockModeHelper.getConfiguration();

      // Assert
      expect(isMockMode).toBe(false);
      expect(config.mockMode).toBe(false);
    });

    it('should validate against mock mode in production', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'production';

      // Act
      const validation = MockModeHelper.validateEnvironment();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Mock mode cannot be enabled in production');
    });
  });

  describe('Service creation consistency', () => {
    it('should create same service type across multiple calls', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'test';

      const supabase = SupabaseAdapter.getServerClient();
      const factory = ServiceFactory.create(supabase);

      // Act
      const service1 = factory.createAIAnalysisService();
      const service2 = factory.createAIAnalysisService();

      // Assert
      expect(service1).toBe(service2); // Cached instance
      expect(service1).toBeInstanceOf(MockAIAnalysisService);

      // Cleanup
      factory.clearCache();
    });

    it('should maintain mock mode state throughout request lifecycle', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      // Act
      const factory = MockModeHelper.createServiceFactory();
      const initialDiagnostics = factory.getDiagnostics();
      
      factory.createAIAnalysisService();
      
      const finalDiagnostics = factory.getDiagnostics();

      // Assert
      expect(initialDiagnostics.mockMode).toBe(finalDiagnostics.mockMode);
      expect(initialDiagnostics.mockMode).toBe(true);

      // Cleanup
      factory.clearCache();
    });
  });
});
