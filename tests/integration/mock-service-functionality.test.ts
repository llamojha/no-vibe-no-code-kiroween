/**
 * Mock Service Functionality Integration Tests
 * 
 * Tests the functionality of mock services including response handling,
 * scenario configuration, latency simulation, and error scenarios.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockAIAnalysisService } from '@/lib/testing/mocks/MockAIAnalysisService';
import { TestDataManager } from '@/lib/testing/TestDataManager';
import { Locale, Score } from '@/src/domain/value-objects';
import { MockServiceConfig } from '@/lib/testing/types';

describe('Mock Service Functionality Integration', () => {
  let testDataManager: TestDataManager;
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // Save original environment
    originalEnv = {
      FF_USE_MOCK_API: process.env.FF_USE_MOCK_API,
      FF_MOCK_SCENARIO: process.env.FF_MOCK_SCENARIO,
      FF_SIMULATE_LATENCY: process.env.FF_SIMULATE_LATENCY,
      FF_LOG_MOCK_REQUESTS: process.env.FF_LOG_MOCK_REQUESTS,
    };

    // Initialize test data manager
    testDataManager = new TestDataManager();
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

  describe('Mock service returns responses', () => {
    it('should return successful response for analyzeIdea', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'success',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      const result = await service.analyzeIdea('Test startup idea', locale);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.score).toBeInstanceOf(Score);
      expect(result.data?.summary).toBeDefined();
      expect(result.data?.detailedAnalysis).toBeDefined();
    });

    it('should return successful response for analyzeHackathonProject', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'success',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      const result = await service.analyzeHackathonProject(
        'Test Project',
        'Project description',
        locale
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.score).toBeInstanceOf(Score);
      expect(result.data?.summary).toBeDefined();
    });

    it('should return improvement suggestions', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'success',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');
      const score = Score.create(75);

      // Act
      const result = await service.getImprovementSuggestions('Test idea', score, locale);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it('should return comparison results', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'success',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      const result = await service.compareIdeas('Idea 1', 'Idea 2', locale);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.winner).toBeDefined();
      expect(result.data?.scoreDifference).toBeDefined();
      expect(result.data?.comparisonFactors).toBeDefined();
    });

    it('should return health check status', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'success',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);

      // Act
      const result = await service.healthCheck();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.status).toBe('healthy');
      expect(result.data?.latency).toBeDefined();
    });
  });

  describe('Mock service respects scenario configuration', () => {
    it('should return error for api_error scenario', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'api_error',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      const result = await service.analyzeIdea('Test idea', locale);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('API error');
    });

    it('should return error for timeout scenario', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'timeout',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      const result = await service.analyzeIdea('Test idea', locale);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('timeout');
    });

    it('should return error for rate_limit scenario', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'rate_limit',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      const result = await service.analyzeIdea('Test idea', locale);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('rate limit');
    });

    it('should return error for invalid_input scenario', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'invalid_input',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      const result = await service.analyzeIdea('Test idea', locale);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('invalid input');
    });

    it('should handle all scenarios consistently across methods', async () => {
      // Arrange
      const scenarios = ['success', 'api_error', 'timeout', 'rate_limit'];
      const locale = Locale.create('en');

      for (const scenario of scenarios) {
        const config: MockServiceConfig = {
          defaultScenario: scenario as any,
          enableVariability: false,
          simulateLatency: false,
          minLatency: 0,
          maxLatency: 0,
          logRequests: false,
        };
        const service = new MockAIAnalysisService(testDataManager, config);

        // Act
        const analyzeResult = await service.analyzeIdea('Test', locale);
        const hackathonResult = await service.analyzeHackathonProject('Test', 'Desc', 'Usage', locale);

        // Assert
        if (scenario === 'success') {
          expect(analyzeResult.success).toBe(true);
          expect(hackathonResult.success).toBe(true);
        } else {
          expect(analyzeResult.success).toBe(false);
          expect(hackathonResult.success).toBe(false);
        }
      }
    });
  });

  describe('Mock service simulates latency when configured', () => {
    it('should add latency when simulateLatency is true', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'success',
        enableVariability: false,
        simulateLatency: true,
        minLatency: 100,
        maxLatency: 200,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      const startTime = Date.now();
      await service.analyzeIdea('Test idea', locale);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it('should not add latency when simulateLatency is false', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'success',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 100,
        maxLatency: 200,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      const startTime = Date.now();
      await service.analyzeIdea('Test idea', locale);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(100);
    });

    it('should respect latency range configuration', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'success',
        enableVariability: false,
        simulateLatency: true,
        minLatency: 50,
        maxLatency: 100,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      const startTime = Date.now();
      await service.analyzeIdea('Test idea', locale);
      const duration = Date.now() - startTime;
      const simulatedLatency = service.getLastSimulatedLatency();

      // Assert
      expect(duration).toBeGreaterThanOrEqual(50);
      expect(simulatedLatency).toBeGreaterThanOrEqual(50);
      expect(simulatedLatency).toBeLessThanOrEqual(100);
      expect(duration).toBeLessThan(simulatedLatency + 100); // Allow processing overhead
    });
  });

  describe('Mock service handles error scenarios', () => {
    it('should log errors in request logs', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'api_error',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: true,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      await service.analyzeIdea('Test idea', locale);
      const logs = service.getRequestLogs();

      // Assert
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].success).toBe(false);
      expect(logs[0].error).toBeDefined();
    });

    it('should track performance metrics for all requests', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'success',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      await service.analyzeIdea('Test 1', locale);
      await service.analyzeIdea('Test 2', locale);
      await service.analyzeIdea('Test 3', locale);
      
      const metrics = service.getPerformanceMetrics('analyzeIdea');

      // Assert
      expect(metrics).toBeDefined();
      if (typeof metrics !== 'object' || metrics instanceof Map) {
        throw new Error('Expected single metrics object');
      }
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.averageDuration).toBeGreaterThanOrEqual(0); // Allow 0 for very fast operations
    });

    it('should clear request logs when requested', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'success',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: true,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      await service.analyzeIdea('Test', locale);
      const logsBefore = service.getRequestLogs();
      service.clearRequestLogs();
      const logsAfter = service.getRequestLogs();

      // Assert
      expect(logsBefore.length).toBeGreaterThan(0);
      expect(logsAfter.length).toBe(0);
    });

    it('should clear performance metrics when requested', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'success',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      await service.analyzeIdea('Test', locale);
      const metricsBefore = service.getPerformanceMetrics('analyzeIdea');
      service.clearPerformanceMetrics();
      const metricsAfter = service.getPerformanceMetrics('analyzeIdea');

      // Assert
      if (typeof metricsBefore === 'object' && !(metricsBefore instanceof Map)) {
        expect(metricsBefore.totalRequests).toBeGreaterThan(0);
      }
      if (typeof metricsAfter === 'object' && !(metricsAfter instanceof Map)) {
        expect(metricsAfter.totalRequests).toBe(0);
      }
    });

    it('should handle health check with different scenarios', async () => {
      // Arrange
      const scenarios = [
        { scenario: 'success', expectedStatus: 'healthy' },
        { scenario: 'timeout', expectedStatus: 'degraded' },
        { scenario: 'api_error', expectedStatus: 'unhealthy' },
      ];

      for (const { scenario, expectedStatus } of scenarios) {
        const config: MockServiceConfig = {
          defaultScenario: scenario as any,
          enableVariability: false,
          simulateLatency: false,
          minLatency: 0,
          maxLatency: 0,
          logRequests: false,
        };
        const service = new MockAIAnalysisService(testDataManager, config);

        // Act
        const result = await service.healthCheck();

        // Assert
        expect(result.success).toBe(true);
        expect(result.data?.status).toBe(expectedStatus);
      }
    });
  });

  describe('Mock service data integrity', () => {
    it('should return valid Score objects', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'success',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      const result = await service.analyzeIdea('Test', locale);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.score).toBeInstanceOf(Score);
      expect(result.data?.score.value).toBeGreaterThanOrEqual(0);
      expect(result.data?.score.value).toBeLessThanOrEqual(100);
    });

    it('should return complete analysis structure', async () => {
      // Arrange
      const config: MockServiceConfig = {
        defaultScenario: 'success',
        enableVariability: false,
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        logRequests: false,
      };
      const service = new MockAIAnalysisService(testDataManager, config);
      const locale = Locale.create('en');

      // Act
      const result = await service.analyzeIdea('Test', locale);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.detailedAnalysis).toHaveProperty('strengths');
      expect(result.data?.detailedAnalysis).toHaveProperty('weaknesses');
      expect(result.data?.detailedAnalysis).toHaveProperty('opportunities');
      expect(result.data?.detailedAnalysis).toHaveProperty('threats');
      expect(result.data?.marketPotential).toBeDefined();
      expect(result.data?.technicalFeasibility).toBeDefined();
      expect(result.data?.businessViability).toBeDefined();
    });
  });
});
