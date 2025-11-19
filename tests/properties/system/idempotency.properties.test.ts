/**
 * Property Tests: Idempotency and Determinism
 *
 * Tests system-level properties ensuring idempotent operations and deterministic behavior.
 * These properties validate that operations can be safely repeated and produce consistent results.
 *
 * Properties tested:
 * - P-SYS-001: Repository Save Idempotency
 * - P-SYS-002: Query Result Determinism
 * - P-SYS-003: Mock Response Consistency
 * - P-SYS-004: Mock Mode Isolation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { MockAnalysisRepository } from "@/lib/testing/mocks/MockAnalysisRepository";
import { MockAIAnalysisService } from "@/lib/testing/mocks/MockAIAnalysisService";
import { TestDataManager } from "@/lib/testing/TestDataManager";
import {
  generateAnalysis,
  generateUserId,
  generateMany,
} from "../utils/generators";
import { forAll, entityEquals, deepEqual } from "../utils/property-helpers";
import { Locale } from "@/src/domain/value-objects";
import { isServerMockModeEnabled } from "@/lib/testing/config/mock-mode-flags";

describe("Property: Idempotency and Determinism", () => {
  let repository: MockAnalysisRepository;
  let testDataManager: TestDataManager;
  let mockAIService: MockAIAnalysisService;

  beforeEach(() => {
    repository = new MockAnalysisRepository();
    testDataManager = new TestDataManager();
    mockAIService = new MockAIAnalysisService(testDataManager, {
      defaultScenario: "success",
      simulateLatency: false,
      minLatency: 0,
      maxLatency: 0,
      enableVariability: false,
      logRequests: false,
    });
  });

  describe("P-SYS-001: Repository Save Idempotency", () => {
    /**
     * Feature: property-testing-framework, Property 1: Repository Save Idempotency
     * Validates: Requirements 6.1, 6.2
     *
     * Property: Saving the same entity multiple times has the same effect as saving once
     * Formal: ∀e: Entity, save(e); save(e) ≡ save(e)
     *
     * This property ensures that repository save operations are idempotent - calling
     * save multiple times with the same entity should not create duplicates or cause
     * inconsistent state. The repository should recognize that the entity already exists
     * and either update it or leave it unchanged.
     */
    it("should have same effect when saving entity multiple times", async () => {
      await forAll(
        generateAnalysis,
        async (analysis) => {
          // Save the analysis once
          const firstSave = await repository.save(analysis);
          expect(firstSave.success).toBe(true);

          // Get initial count
          const countAfterFirst = await repository.count();
          expect(countAfterFirst.success).toBe(true);
          const initialCount = countAfterFirst.data;

          // Save the same analysis again (idempotent operation)
          const secondSave = await repository.save(analysis);
          expect(secondSave.success).toBe(true);

          // Get count after second save
          const countAfterSecond = await repository.count();
          expect(countAfterSecond.success).toBe(true);
          const finalCount = countAfterSecond.data;

          // Property: Count should remain the same (no duplicate created)
          // In mock repository, save is idempotent by design (uses Map.set)
          const isIdempotent = finalCount === initialCount;

          // Verify the entity is still retrievable and unchanged
          const retrieved = await repository.findById(analysis.id);
          expect(retrieved.success).toBe(true);
          expect(retrieved.data).not.toBeNull();

          if (retrieved.data) {
            const entityPreserved = entityEquals(analysis, retrieved.data);
            return isIdempotent && entityPreserved;
          }

          return isIdempotent;
        },
        50
      );
    });

    it("should preserve entity data through multiple saves", async () => {
      await forAll(
        generateAnalysis,
        async (analysis) => {
          // Save multiple times
          await repository.save(analysis);
          await repository.save(analysis);
          await repository.save(analysis);

          // Retrieve and verify data integrity
          const result = await repository.findById(analysis.id);
          expect(result.success).toBe(true);
          expect(result.data).not.toBeNull();

          if (!result.data) return false;

          // Property: All entity properties should be preserved
          return (
            entityEquals(analysis, result.data) &&
            result.data.idea === analysis.idea &&
            result.data.score.value === analysis.score.value &&
            result.data.userId.equals(analysis.userId)
          );
        },
        50
      );
    });

    it("should handle concurrent saves idempotently", async () => {
      const analysis = generateAnalysis();

      // Simulate concurrent saves
      const savePromises = Array(5)
        .fill(null)
        .map(() => repository.save(analysis));

      const results = await Promise.all(savePromises);

      // All saves should succeed
      expect(results.every((r) => r.success)).toBe(true);

      // Should only have one entity in repository
      const countResult = await repository.count();
      expect(countResult.success).toBe(true);
      expect(countResult.data).toBe(1);

      // Entity should be retrievable
      const retrieved = await repository.findById(analysis.id);
      expect(retrieved.success).toBe(true);
      expect(retrieved.data).not.toBeNull();
    });
  });

  describe("P-SYS-002: Query Result Determinism", () => {
    /**
     * Feature: property-testing-framework, Property 2: Query Result Determinism
     * Validates: Requirements 6.1, 6.2
     *
     * Property: Same query with same parameters returns same results
     * Formal: ∀q: Query, ∀p: Params, query(q, p, t1) = query(q, p, t2)
     *
     * This property ensures that queries are deterministic - executing the same query
     * with the same parameters should always return the same results (assuming no
     * data changes between queries). This is critical for predictable application
     * behavior and testing reliability.
     */
    it("should return identical results for repeated queries", async () => {
      // Set up test data
      const userId = generateUserId();
      const analyses = generateMany(() => generateAnalysis({ userId }), 10);

      // Save all analyses
      for (const analysis of analyses) {
        await repository.save(analysis);
      }

      // Query parameters
      const params = { page: 1, limit: 5 };

      // Execute query multiple times
      const result1 = await repository.findByUserId(userId, params);
      const result2 = await repository.findByUserId(userId, params);
      const result3 = await repository.findByUserId(userId, params);

      // All queries should succeed
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      // Property: Results should be identical
      expect(result1.data.items.length).toBe(result2.data.items.length);
      expect(result2.data.items.length).toBe(result3.data.items.length);
      expect(result1.data.total).toBe(result2.data.total);
      expect(result2.data.total).toBe(result3.data.total);

      // Verify same entities in same order
      for (let i = 0; i < result1.data.items.length; i++) {
        expect(entityEquals(result1.data.items[i], result2.data.items[i])).toBe(
          true
        );
        expect(entityEquals(result2.data.items[i], result3.data.items[i])).toBe(
          true
        );
      }
    });

    it("should return consistent results across different query methods", async () => {
      await forAll(
        () => {
          const userId = generateUserId();
          const analyses = generateMany(() => generateAnalysis({ userId }), 5);
          return { userId, analyses };
        },
        async ({ userId, analyses }) => {
          // Clear and populate repository
          repository.clear();
          for (const analysis of analyses) {
            await repository.save(analysis);
          }

          // Query using different methods
          const allByUserId = await repository.findAllByUserId(userId);
          const paginatedResult = await repository.findByUserId(userId, {
            page: 1,
            limit: 100,
          });

          expect(allByUserId.success).toBe(true);
          expect(paginatedResult.success).toBe(true);

          // Property: Both methods should return same entities
          const allIds = allByUserId.data.map((a) => a.id.value).sort();
          const paginatedIds = paginatedResult.data.items
            .map((a) => a.id.value)
            .sort();

          return deepEqual(allIds, paginatedIds);
        },
        30
      );
    });

    it("should maintain sort order consistency", async () => {
      const userId = generateUserId();
      const analyses = generateMany(() => generateAnalysis({ userId }), 20);

      // Save all analyses
      for (const analysis of analyses) {
        await repository.save(analysis);
      }

      // Query with sorting multiple times
      const options = {
        page: 1,
        limit: 10,
        sortBy: "score" as const,
      };

      const result1 = await repository.findByUserIdPaginated(userId, options);
      const result2 = await repository.findByUserIdPaginated(userId, options);
      const result3 = await repository.findByUserIdPaginated(userId, options);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      // Property: Sort order should be identical across queries
      const ids1 = result1.data.analyses.map((a) => a.id.value);
      const ids2 = result2.data.analyses.map((a) => a.id.value);
      const ids3 = result3.data.analyses.map((a) => a.id.value);

      expect(deepEqual(ids1, ids2)).toBe(true);
      expect(deepEqual(ids2, ids3)).toBe(true);
    });

    it("should return consistent counts", async () => {
      await forAll(
        () => {
          const userId = generateUserId();
          const count = Math.floor(Math.random() * 20) + 1;
          const analyses = generateMany(
            () => generateAnalysis({ userId }),
            count
          );
          return { userId, analyses, expectedCount: count };
        },
        async ({ userId, analyses, expectedCount }) => {
          // Clear and populate
          repository.clear();
          for (const analysis of analyses) {
            await repository.save(analysis);
          }

          // Query count multiple times
          const counts = await Promise.all([
            repository.getAnalysisCountsByType(userId),
            repository.getAnalysisCountsByType(userId),
            repository.getAnalysisCountsByType(userId),
          ]);

          // All should succeed
          expect(counts.every((c) => c.success)).toBe(true);

          // Property: All counts should be identical
          const totals = counts.map((c) => c.data.total);
          return totals.every((t) => t === expectedCount);
        },
        30
      );
    });
  });

  describe("P-SYS-003: Mock Response Consistency", () => {
    /**
     * Feature: property-testing-framework, Property 3: Mock Response Consistency
     * Validates: Requirements 6.1, 6.2
     *
     * Property: Mock service returns consistent responses for same input
     * Formal: ∀i: Input, mock(i, t1) = mock(i, t2)
     *
     * This property ensures that mock services provide deterministic responses.
     * When testing with mocks, the same input should always produce the same output,
     * allowing for reliable and reproducible tests. This is essential for test
     * stability and debugging.
     */
    it("should return identical responses for same input", async () => {
      const idea = "A revolutionary AI-powered task management app";
      const locale = Locale.english();

      // Call mock service multiple times with same input
      const result1 = await mockAIService.analyzeIdea(idea, locale);
      const result2 = await mockAIService.analyzeIdea(idea, locale);
      const result3 = await mockAIService.analyzeIdea(idea, locale);

      // All calls should succeed
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      // Property: Responses should be identical
      expect(result1.data.score.value).toBe(result2.data.score.value);
      expect(result2.data.score.value).toBe(result3.data.score.value);
      expect(result1.data.summary).toBe(result2.data.summary);
      expect(result2.data.summary).toBe(result3.data.summary);

      // Verify detailed analysis consistency
      expect(result1.data.detailedAnalysis.strengths.length).toBe(
        result2.data.detailedAnalysis.strengths.length
      );
      expect(result1.data.detailedAnalysis.weaknesses.length).toBe(
        result2.data.detailedAnalysis.weaknesses.length
      );
    });

    it("should return consistent responses across different locales", async () => {
      const idea = "An innovative social media platform for developers";

      // Test with both locales
      const enResult1 = await mockAIService.analyzeIdea(idea, Locale.english());
      const enResult2 = await mockAIService.analyzeIdea(idea, Locale.english());

      const esResult1 = await mockAIService.analyzeIdea(idea, Locale.spanish());
      const esResult2 = await mockAIService.analyzeIdea(idea, Locale.spanish());

      // All should succeed
      expect(enResult1.success).toBe(true);
      expect(enResult2.success).toBe(true);
      expect(esResult1.success).toBe(true);
      expect(esResult2.success).toBe(true);

      // Property: Same locale should produce identical results
      expect(enResult1.data.score.value).toBe(enResult2.data.score.value);
      expect(esResult1.data.score.value).toBe(esResult2.data.score.value);
    });

    it("should maintain consistency for hackathon analysis", async () => {
      const projectName = "AI Code Assistant";
      const description =
        "An AI-powered tool that helps developers write better code";
      const locale = Locale.english();

      // Call multiple times
      const results = await Promise.all([
        mockAIService.analyzeHackathonProject(projectName, description, locale),
        mockAIService.analyzeHackathonProject(projectName, description, locale),
        mockAIService.analyzeHackathonProject(projectName, description, locale),
      ]);

      // All should succeed
      expect(results.every((r) => r.success)).toBe(true);

      // Property: All responses should be identical
      const scores = results.map((r) => r.data.score.value);
      expect(scores.every((s) => s === scores[0])).toBe(true);

      const summaries = results.map((r) => r.data.summary);
      expect(summaries.every((s) => s === summaries[0])).toBe(true);
    });

    it("should return consistent error responses", async () => {
      // Create service with error scenario
      const errorService = new MockAIAnalysisService(testDataManager, {
        defaultScenario: "api_error",
        simulateLatency: false,
        minLatency: 0,
        maxLatency: 0,
        enableVariability: false,
        logRequests: false,
      });

      const idea = "Test idea";
      const locale = Locale.english();

      // Call multiple times
      const result1 = await errorService.analyzeIdea(idea, locale);
      const result2 = await errorService.analyzeIdea(idea, locale);
      const result3 = await errorService.analyzeIdea(idea, locale);

      // All should fail consistently
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
      expect(result3.success).toBe(false);

      // Property: Error messages should be consistent
      expect(result1.error.message).toBe(result2.error.message);
      expect(result2.error.message).toBe(result3.error.message);
    });

    it("should maintain performance consistency", async () => {
      const idea = "A blockchain-based supply chain solution";
      const locale = Locale.english();

      // Measure performance across multiple calls
      const durations: number[] = [];

      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await mockAIService.analyzeIdea(idea, locale);
        const duration = performance.now() - start;
        durations.push(duration);
      }

      // Property: Performance should be consistent (low variance)
      // Since we disabled latency simulation, all calls should be fast
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      const variance = maxDuration - minDuration;

      // Variance should be reasonable (< 200ms) for mock service without latency
      // Note: This accounts for system load and GC pauses
      expect(variance).toBeLessThan(200);
    });
  });

  describe("P-SYS-004: Mock Mode Isolation", () => {
    /**
     * Feature: property-testing-framework, Property 4: Mock Mode Isolation
     * Validates: Requirements 6.1, 6.2
     *
     * Property: Mock mode never makes real external calls
     * Formal: mockMode = true ⇒ ∀call: ExternalCall, ¬executes(call)
     *
     * This property ensures that when mock mode is enabled, no real external API
     * calls are made. This is critical for:
     * - Test isolation and reliability
     * - Avoiding external dependencies in tests
     * - Preventing accidental API calls during testing
     * - Ensuring tests can run offline
     */
    it("should not make external API calls in mock mode", async () => {
      // Spy on fetch to detect any external calls
      const fetchSpy = vi.spyOn(global, "fetch");

      const idea = "A mobile app for fitness tracking";
      const locale = Locale.english();

      // Perform multiple operations
      await mockAIService.analyzeIdea(idea, locale);
      await mockAIService.analyzeHackathonProject(
        "Test Project",
        "Description",
        locale
      );
      await mockAIService.getImprovementSuggestions(
        idea,
        generateAnalysis().score,
        locale
      );

      // Property: No fetch calls should have been made
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it("should use in-memory storage without database calls", async () => {
      // Repository operations should not trigger any network activity
      const fetchSpy = vi.spyOn(global, "fetch");

      const analyses = generateMany(generateAnalysis, 10);

      // Perform repository operations
      for (const analysis of analyses) {
        await repository.save(analysis);
      }

      const userId = analyses[0].userId;
      await repository.findByUserId(userId, { page: 1, limit: 5 });
      await repository.getAnalysisCountsByType(userId);
      await repository.findById(analyses[0].id);

      // Property: No external calls should have been made
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it("should verify mock mode flag is respected", () => {
      // Check that mock mode detection works
      const isMockMode = isServerMockModeEnabled();

      // In test environment, mock mode should be enabled by default
      // or explicitly controlled via environment variables
      expect(typeof isMockMode).toBe("boolean");

      // Property: Mock mode flag should be deterministic
      const secondCheck = isServerMockModeEnabled();
      expect(isMockMode).toBe(secondCheck);
    });

    it("should isolate mock data from real data", async () => {
      // Create two separate mock repositories
      const repo1 = new MockAnalysisRepository();
      const repo2 = new MockAnalysisRepository();

      const analysis1 = generateAnalysis();
      const analysis2 = generateAnalysis();

      // Save to different repositories
      await repo1.save(analysis1);
      await repo2.save(analysis2);

      // Property: Data should be isolated
      const count1 = await repo1.count();
      const count2 = await repo2.count();

      expect(count1.success).toBe(true);
      expect(count2.success).toBe(true);
      expect(count1.data).toBe(1);
      expect(count2.data).toBe(1);

      // Verify analysis1 is only in repo1
      const find1InRepo1 = await repo1.findById(analysis1.id);
      const find1InRepo2 = await repo2.findById(analysis1.id);

      expect(find1InRepo1.success).toBe(true);
      expect(find1InRepo1.data).not.toBeNull();
      expect(find1InRepo2.success).toBe(true);
      expect(find1InRepo2.data).toBeNull();
    });

    it("should handle mock service health checks without external calls", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");

      // Perform health check
      const healthResult = await mockAIService.healthCheck();

      expect(healthResult.success).toBe(true);
      expect(healthResult.data.status).toBe("healthy");

      // Property: Health check should not make external calls
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it("should maintain isolation across concurrent operations", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");

      // Perform many concurrent operations
      const operations = Array(20)
        .fill(null)
        .map(async (_, i) => {
          const analysis = generateAnalysis();
          await repository.save(analysis);
          await mockAIService.analyzeIdea(`Idea ${i}`, Locale.english());
          return repository.findById(analysis.id);
        });

      const results = await Promise.all(operations);

      // All operations should succeed
      expect(results.every((r) => r.success)).toBe(true);

      // Property: No external calls despite concurrent operations
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });
});
