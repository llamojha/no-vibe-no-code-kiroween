/**
 * Tests for MockFrankensteinService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockFrankensteinService } from '../MockFrankensteinService';
import { TestDataManager } from '../../TestDataManager';
import type { MockServiceConfig } from '../../types';

describe('MockFrankensteinService', () => {
  let service: MockFrankensteinService;
  let dataManager: TestDataManager;
  let config: MockServiceConfig;

  beforeEach(() => {
    dataManager = new TestDataManager();
    config = {
      defaultScenario: 'success',
      enableVariability: false,
      simulateLatency: false,
      minLatency: 100,
      maxLatency: 200,
      logRequests: false,
    };
    service = new MockFrankensteinService(dataManager, config);
  });

  describe('generateFrankensteinIdea', () => {
    it('should generate idea for companies mode', async () => {
      const result = await service.generateFrankensteinIdea(
        [{ name: 'Slack' }, { name: 'Trello' }],
        'companies',
        'en'
      );

      expect(result).toBeDefined();
      expect(result.idea_title).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metrics.originality_score).toBeGreaterThanOrEqual(0);
      expect(result.metrics.originality_score).toBeLessThanOrEqual(100);
      expect(result.language).toBe('en');
    });

    it('should generate idea for aws mode', async () => {
      const result = await service.generateFrankensteinIdea(
        [{ name: 'Lambda' }, { name: 'DynamoDB' }],
        'aws',
        'en'
      );

      expect(result).toBeDefined();
      expect(result.idea_title).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.language).toBe('en');
    });

    it('should support Spanish language', async () => {
      const result = await service.generateFrankensteinIdea(
        [{ name: 'AWS Lambda' }, { name: 'React' }],
        'aws',
        'es'
      );

      expect(result).toBeDefined();
      expect(result.language).toBe('es');
    });

    it('should customize title based on elements', async () => {
      const result = await service.generateFrankensteinIdea(
        [{ name: 'Slack' }, { name: 'Notion' }],
        'companies',
        'en'
      );

      expect(result.idea_title).toContain('Slack');
      expect(result.idea_title).toContain('Notion');
    });

    it('should throw error for insufficient elements', async () => {
      await expect(
        service.generateFrankensteinIdea([{ name: 'Single' }], 'companies', 'en')
      ).rejects.toThrow('At least two elements are required');
    });

    it('should adjust metrics based on element count', async () => {
      const twoElements = await service.generateFrankensteinIdea(
        [{ name: 'A' }, { name: 'B' }],
        'companies',
        'en'
      );

      const fourElements = await service.generateFrankensteinIdea(
        [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }],
        'companies',
        'en'
      );

      // More elements should have higher originality
      expect(fourElements.metrics.originality_score).toBeGreaterThanOrEqual(
        twoElements.metrics.originality_score
      );
    });
  });

  describe('error scenarios', () => {
    it('should handle api_error scenario', async () => {
      const errorConfig = { ...config, defaultScenario: 'api_error' as const };
      const errorService = new MockFrankensteinService(dataManager, errorConfig);

      await expect(
        errorService.generateFrankensteinIdea(
          [{ name: 'A' }, { name: 'B' }],
          'companies',
          'en'
        )
      ).rejects.toThrow();
    });

    it('should handle timeout scenario', async () => {
      const timeoutConfig = { ...config, defaultScenario: 'timeout' as const };
      const timeoutService = new MockFrankensteinService(dataManager, timeoutConfig);

      await expect(
        timeoutService.generateFrankensteinIdea(
          [{ name: 'A' }, { name: 'B' }],
          'companies',
          'en'
        )
      ).rejects.toThrow();
    });

    it('should handle rate_limit scenario', async () => {
      const rateLimitConfig = { ...config, defaultScenario: 'rate_limit' as const };
      const rateLimitService = new MockFrankensteinService(dataManager, rateLimitConfig);

      await expect(
        rateLimitService.generateFrankensteinIdea(
          [{ name: 'A' }, { name: 'B' }],
          'companies',
          'en'
        )
      ).rejects.toThrow();
    });
  });

  describe('latency simulation', () => {
    it('should simulate latency when enabled', async () => {
      const latencyConfig = {
        ...config,
        simulateLatency: true,
        minLatency: 100,
        maxLatency: 150,
      };
      const latencyService = new MockFrankensteinService(dataManager, latencyConfig);

      const startTime = Date.now();
      await latencyService.generateFrankensteinIdea(
        [{ name: 'A' }, { name: 'B' }],
        'companies',
        'en'
      );
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it('should not simulate latency when disabled', async () => {
      const noLatencyConfig = { ...config, simulateLatency: false };
      const noLatencyService = new MockFrankensteinService(dataManager, noLatencyConfig);

      const startTime = Date.now();
      await noLatencyService.generateFrankensteinIdea(
        [{ name: 'A' }, { name: 'B' }],
        'companies',
        'en'
      );
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });
  });
});
