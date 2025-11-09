/**
 * ServiceFactory Integration Tests
 * 
 * Tests the integration of ServiceFactory with mock mode configuration.
 * Verifies that ServiceFactory correctly detects mock mode, creates
 * appropriate services, and provides diagnostic information.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';
import { SupabaseAdapter } from '@/src/infrastructure/integration/SupabaseAdapter';
import { MockAIAnalysisService } from '@/lib/testing/mocks/MockAIAnalysisService';
import { IAIAnalysisService } from '@/src/application/services/IAIAnalysisService';

describe('ServiceFactory Integration', () => {
  let originalEnv: Record<string, string | undefined>;
  let factory: ServiceFactory;

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

    // Create fresh ServiceFactory instance
    const supabase = SupabaseAdapter.getServerClient();
    factory = ServiceFactory.create(supabase);
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

    // Clear factory cache
    if (factory) {
      factory.clearCache();
    }
  });

  describe('ServiceFactory creates mock service when flag is enabled', () => {
    it('should create MockAIAnalysisService when mock mode is enabled', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      // Create fresh factory with mock mode enabled
      const supabase = SupabaseAdapter.getServerClient();
      const mockFactory = ServiceFactory.create(supabase);

      // Act
      const service: IAIAnalysisService = mockFactory.createAIAnalysisService();

      // Assert
      expect(service).toBeInstanceOf(MockAIAnalysisService);
      expect(mockFactory.isMockModeEnabled()).toBe(true);

      // Cleanup
      mockFactory.clearCache();
    });

    it('should create mock service with correct configuration', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'api_error';
      process.env.FF_SIMULATE_LATENCY = 'true';
      process.env.NODE_ENV = 'test';

      // Create fresh factory
      const supabase = SupabaseAdapter.getServerClient();
      const mockFactory = ServiceFactory.create(supabase);

      // Act
      const service = mockFactory.createAIAnalysisService();
      const diagnostics = mockFactory.getDiagnostics();

      // Assert
      expect(service).toBeInstanceOf(MockAIAnalysisService);
      expect(diagnostics.mockMode).toBe(true);
      expect(diagnostics.configuration).toHaveProperty('MOCK_SCENARIO', 'api_error');
      expect(diagnostics.configuration).toHaveProperty('SIMULATE_LATENCY', true);

      // Cleanup
      mockFactory.clearCache();
    });

    it('should cache mock service instance', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'test';

      const supabase = SupabaseAdapter.getServerClient();
      const mockFactory = ServiceFactory.create(supabase);

      // Act
      const service1 = mockFactory.createAIAnalysisService();
      const service2 = mockFactory.createAIAnalysisService();

      // Assert
      expect(service1).toBe(service2); // Same instance

      // Cleanup
      mockFactory.clearCache();
    });
  });

  describe('ServiceFactory throws error when production service is requested', () => {
    it('should throw error when mock mode is disabled and production service is not implemented', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'false';
      process.env.NODE_ENV = 'development';

      const supabase = SupabaseAdapter.getServerClient();
      const prodFactory = ServiceFactory.create(supabase);

      // Act & Assert
      expect(() => {
        prodFactory.createAIAnalysisService();
      }).toThrow('Production AI Analysis Service');

      // Cleanup
      prodFactory.clearCache();
    });

    it('should provide helpful error message for production service', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'false';
      process.env.NODE_ENV = 'development';

      const supabase = SupabaseAdapter.getServerClient();
      const prodFactory = ServiceFactory.create(supabase);

      // Act & Assert
      expect(() => {
        prodFactory.createAIAnalysisService();
      }).toThrow(/FF_USE_MOCK_API=true/);

      // Cleanup
      prodFactory.clearCache();
    });
  });

  describe('getDiagnostics returns correct information', () => {
    it('should return diagnostic information when mock mode is enabled', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      const supabase = SupabaseAdapter.getServerClient();
      const mockFactory = ServiceFactory.create(supabase);

      // Act
      const diagnostics = mockFactory.getDiagnostics();

      // Assert
      expect(diagnostics).toHaveProperty('mockMode');
      expect(diagnostics).toHaveProperty('servicesCreated');
      expect(diagnostics).toHaveProperty('configuration');
      expect(diagnostics.mockMode).toBe(true);
      expect(Array.isArray(diagnostics.servicesCreated)).toBe(true);
      expect(typeof diagnostics.configuration).toBe('object');

      // Cleanup
      mockFactory.clearCache();
    });

    it('should track created services in diagnostics', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'test';

      const supabase = SupabaseAdapter.getServerClient();
      const mockFactory = ServiceFactory.create(supabase);

      // Act
      const diagnosticsBefore = mockFactory.getDiagnostics();
      mockFactory.createAIAnalysisService();
      const diagnosticsAfter = mockFactory.getDiagnostics();

      // Assert
      expect(diagnosticsBefore.servicesCreated).toHaveLength(0);
      expect(diagnosticsAfter.servicesCreated).toContain('aiAnalysisService');

      // Cleanup
      mockFactory.clearCache();
    });

    it('should include feature flag configuration in diagnostics', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'timeout';
      process.env.FF_SIMULATE_LATENCY = 'true';
      process.env.NODE_ENV = 'test';

      const supabase = SupabaseAdapter.getServerClient();
      const mockFactory = ServiceFactory.create(supabase);

      // Act
      const diagnostics = mockFactory.getDiagnostics();

      // Assert
      expect(diagnostics.configuration).toHaveProperty('USE_MOCK_API', true);
      expect(diagnostics.configuration).toHaveProperty('MOCK_SCENARIO', 'timeout');
      expect(diagnostics.configuration).toHaveProperty('SIMULATE_LATENCY', true);

      // Cleanup
      mockFactory.clearCache();
    });

    it('should return correct diagnostics when mock mode is disabled', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'false';
      process.env.NODE_ENV = 'development';

      const supabase = SupabaseAdapter.getServerClient();
      const prodFactory = ServiceFactory.create(supabase);

      // Act
      const diagnostics = prodFactory.getDiagnostics();

      // Assert
      expect(diagnostics.mockMode).toBe(false);
      expect(diagnostics.servicesCreated).toHaveLength(0);

      // Cleanup
      prodFactory.clearCache();
    });
  });

  describe('verifyMockConfiguration validates correctly', () => {
    it('should verify mock configuration successfully when properly configured', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      const supabase = SupabaseAdapter.getServerClient();
      const mockFactory = ServiceFactory.create(supabase);

      // Act & Assert - Should not throw
      expect(() => {
        mockFactory.createAIAnalysisService();
      }).not.toThrow();

      // Cleanup
      mockFactory.clearCache();
    });

    it('should verify all mock data types can be loaded', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.FF_MOCK_SCENARIO = 'success';
      process.env.NODE_ENV = 'test';

      const supabase = SupabaseAdapter.getServerClient();
      const mockFactory = ServiceFactory.create(supabase);

      // Act - Creating service triggers verification
      const service = mockFactory.createAIAnalysisService();

      // Assert - Service was created successfully, meaning verification passed
      expect(service).toBeInstanceOf(MockAIAnalysisService);

      // Cleanup
      mockFactory.clearCache();
    });

    it('should handle different scenarios during verification', () => {
      // Arrange
      const scenarios = ['success', 'api_error', 'timeout', 'rate_limit'];
      
      scenarios.forEach(scenario => {
        process.env.FF_USE_MOCK_API = 'true';
        process.env.FF_MOCK_SCENARIO = scenario;
        process.env.NODE_ENV = 'test';

        const supabase = SupabaseAdapter.getServerClient();
        const mockFactory = ServiceFactory.create(supabase);

        // Act & Assert
        expect(() => {
          mockFactory.createAIAnalysisService();
        }).not.toThrow();

        // Cleanup
        mockFactory.clearCache();
      });
    });
  });

  describe('isMockModeEnabled', () => {
    it('should return true when mock mode is enabled', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'test';

      const supabase = SupabaseAdapter.getServerClient();
      const mockFactory = ServiceFactory.create(supabase);

      // Act
      const isEnabled = mockFactory.isMockModeEnabled();

      // Assert
      expect(isEnabled).toBe(true);

      // Cleanup
      mockFactory.clearCache();
    });

    it('should return false when mock mode is disabled', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'false';
      process.env.NODE_ENV = 'development';

      const supabase = SupabaseAdapter.getServerClient();
      const prodFactory = ServiceFactory.create(supabase);

      // Act
      const isEnabled = prodFactory.isMockModeEnabled();

      // Assert
      expect(isEnabled).toBe(false);

      // Cleanup
      prodFactory.clearCache();
    });
  });

  describe('clearCache', () => {
    it('should clear service cache', () => {
      // Arrange
      process.env.FF_USE_MOCK_API = 'true';
      process.env.NODE_ENV = 'test';

      const supabase = SupabaseAdapter.getServerClient();
      const mockFactory = ServiceFactory.create(supabase);

      // Act
      mockFactory.createAIAnalysisService();
      const diagnosticsBefore = mockFactory.getDiagnostics();
      
      mockFactory.clearCache();
      const diagnosticsAfter = mockFactory.getDiagnostics();

      // Assert
      expect(diagnosticsBefore.servicesCreated.length).toBeGreaterThan(0);
      expect(diagnosticsAfter.servicesCreated).toHaveLength(0);

      // Cleanup
      mockFactory.clearCache();
    });
  });

  describe('ServiceFactory.create', () => {
    it('should create new instance each time', () => {
      // Arrange
      const supabase = SupabaseAdapter.getServerClient();

      // Act
      const factory1 = ServiceFactory.create(supabase);
      const factory2 = ServiceFactory.create(supabase);

      // Assert
      expect(factory1).not.toBe(factory2);

      // Cleanup
      factory1.clearCache();
      factory2.clearCache();
    });

    it('should create factory with fresh Supabase client', () => {
      // Arrange & Act
      const supabase = SupabaseAdapter.getServerClient();
      const newFactory = ServiceFactory.create(supabase);

      // Assert
      expect(newFactory).toBeDefined();
      expect(newFactory).toBeInstanceOf(ServiceFactory);

      // Cleanup
      newFactory.clearCache();
    });
  });
});
