/**
 * Property Tests: Caching
 *
 * Tests system-level caching properties ensuring correct cache behavior.
 * These properties validate cache expiration, invalidation, and consistency.
 *
 * Properties tested:
 * - P-SYS-005: Cache Expiration
 * - P-SYS-006: Cache Invalidation on Update
 * - P-SYS-007: Cache Hit Consistency
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InMemoryCache } from "@/src/infrastructure/cache/InMemoryCache";
import { forAll, deepEqual } from "../utils/property-helpers";
import {
  generateAnalysis,
  generateUserId,
  generateMany,
} from "../utils/generators";

describe("Property: Caching", () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache();
  });

  afterEach(() => {
    cache.stopCleanup();
  });

  describe("P-SYS-005: Cache Expiration", () => {
    /**
     * Feature: property-testing-framework, Property 5: Cache Expiration
     * Validates: Requirements 6.1, 6.3
     *
     * Property: Cached values expire after TTL
     * Formal: ∀k: Key, ∀v: Value, cache(k, v, ttl) ⇒ get(k, now + ttl + ε) = null
     *
     * This property ensures that cached values are automatically expired after their
     * Time-To-Live (TTL) period. This is critical for:
     * - Preventing stale data from being served
     * - Managing memory usage
     * - Ensuring data freshness
     * - Complying with data retention policies
     */
    it("should return null for expired cache entries", async () => {
      await forAll(
        () => {
          const key = `test-key-${Math.random()}`;
          const value = { data: `test-value-${Math.random()}` };
          const ttl = 1; // 1 second TTL
          return { key, value, ttl };
        },
        async ({ key, value, ttl }) => {
          // Set cache with short TTL
          await cache.set(key, value, ttl);

          // Verify value is cached immediately
          const cachedValue = await cache.get(key);
          expect(cachedValue).toEqual(value);

          // Wait for expiration (TTL + buffer)
          await new Promise((resolve) =>
            setTimeout(resolve, (ttl + 0.2) * 1000)
          );

          // Property: Value should be null after expiration
          const expiredValue = await cache.get(key);
          return expiredValue === null;
        },
        20
      );
    });

    it("should expire entries with different TTLs independently", async () => {
      const entries = [
        { key: "short-ttl", value: "value1", ttl: 0.5 },
        { key: "medium-ttl", value: "value2", ttl: 1.5 },
        { key: "long-ttl", value: "value3", ttl: 3 },
      ];

      // Set all entries
      for (const entry of entries) {
        await cache.set(entry.key, entry.value, entry.ttl);
      }

      // Wait for short TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 700));

      // Property: Short TTL should be expired, others should remain
      const shortValue = await cache.get("short-ttl");
      const mediumValue = await cache.get("medium-ttl");
      const longValue = await cache.get("long-ttl");

      expect(shortValue).toBeNull();
      expect(mediumValue).toBe("value2");
      expect(longValue).toBe("value3");

      // Wait for medium TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mediumValueAfter = await cache.get("medium-ttl");
      const longValueAfter = await cache.get("long-ttl");

      expect(mediumValueAfter).toBeNull();
      expect(longValueAfter).toBe("value3");
    });

    it("should handle very short TTLs correctly", async () => {
      await forAll(
        () => {
          const key = `short-ttl-${Math.random()}`;
          const value = Math.random();
          const ttl = 0.001; // 1 millisecond
          return { key, value, ttl };
        },
        async ({ key, value, ttl }) => {
          await cache.set(key, value, ttl);

          // Wait for expiration
          await new Promise((resolve) => setTimeout(resolve, 50));

          // Property: Should be expired
          const result = await cache.get(key);
          return result === null;
        },
        20
      );
    });

    it("should not return expired entries even if accessed immediately after expiration", async () => {
      const key = "precise-expiration-test";
      const value = "test-value";
      const ttl = 1;

      await cache.set(key, value, ttl);

      // Wait for TTL plus small buffer to ensure expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Property: Should be expired immediately after TTL
      const result = await cache.get(key);
      expect(result).toBeNull();
    });

    it("should handle cache expiration for complex objects", async () => {
      await forAll(
        generateAnalysis,
        async (analysis) => {
          const key = `analysis-${analysis.id.value}`;
          const ttl = 1;

          // Cache the analysis
          await cache.set(key, analysis, ttl);

          // Verify cached
          const cached = await cache.get(key);
          expect(cached).toBeDefined();

          // Wait for expiration
          await new Promise((resolve) => setTimeout(resolve, 1200));

          // Property: Complex object should also expire
          const expired = await cache.get(key);
          return expired === null;
        },
        10
      );
    });

    it("should expire entries with zero or negative TTL immediately", async () => {
      const key1 = "zero-ttl";
      const key2 = "negative-ttl";

      await cache.set(key1, "value1", 0);
      await cache.set(key2, "value2", -1);

      // Small delay to ensure expiration check
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Property: Both should be expired
      const result1 = await cache.get(key1);
      const result2 = await cache.get(key2);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe("P-SYS-006: Cache Invalidation on Update", () => {
    /**
     * Feature: property-testing-framework, Property 6: Cache Invalidation on Update
     * Validates: Requirements 6.1, 6.3
     *
     * Property: Cache is invalidated when underlying data changes
     * Formal: ∀k: Key, update(k) ⇒ cache.get(k) = null
     *
     * This property ensures that when data is updated, the corresponding cache
     * entry is invalidated. This prevents serving stale data and maintains
     * consistency between cache and source of truth.
     */
    it("should invalidate cache when data is updated", async () => {
      await forAll(
        () => {
          const userId = generateUserId();
          const key = `credits:${userId.value}`;
          const initialValue = { credits: 3, tier: "free" };
          const updatedValue = { credits: 2, tier: "free" };
          return { key, initialValue, updatedValue };
        },
        async ({ key, initialValue, updatedValue }) => {
          // Set initial cache
          await cache.set(key, initialValue, 60);

          // Verify cached
          const cached = await cache.get(key);
          expect(deepEqual(cached, initialValue)).toBe(true);

          // Simulate update by deleting cache (invalidation)
          await cache.delete(key);

          // Property: Cache should be invalidated
          const afterInvalidation = await cache.get(key);
          const isInvalidated = afterInvalidation === null;

          // Set new value (simulating update)
          await cache.set(key, updatedValue, 60);

          // Verify new value is cached
          const newCached = await cache.get(key);
          const hasNewValue = deepEqual(newCached, updatedValue);

          return isInvalidated && hasNewValue;
        },
        30
      );
    });

    it("should support pattern-based invalidation for related keys", async () => {
      const userId = generateUserId();
      const baseKey = `user:${userId.value}`;

      // Set multiple related cache entries
      await cache.set(`${baseKey}:credits`, 3, 60);
      await cache.set(`${baseKey}:profile`, { name: "Test User" }, 60);
      await cache.set(`${baseKey}:analyses`, [], 60);

      // Verify all cached
      expect(await cache.get(`${baseKey}:credits`)).toBe(3);
      expect(await cache.get(`${baseKey}:profile`)).toEqual({
        name: "Test User",
      });
      expect(await cache.get(`${baseKey}:analyses`)).toEqual([]);

      // Invalidate all related keys
      await cache.delete(`${baseKey}:credits`);
      await cache.delete(`${baseKey}:profile`);
      await cache.delete(`${baseKey}:analyses`);

      // Property: All related keys should be invalidated
      expect(await cache.get(`${baseKey}:credits`)).toBeNull();
      expect(await cache.get(`${baseKey}:profile`)).toBeNull();
      expect(await cache.get(`${baseKey}:analyses`)).toBeNull();
    });

    it("should invalidate cache for credit deduction scenario", async () => {
      await forAll(
        generateUserId,
        async (userId) => {
          const cacheKey = `credits:${userId.value}`;
          const initialCredits = 3;

          // Cache initial credit balance
          await cache.set(cacheKey, initialCredits, 60);

          // Verify cached
          const cached = await cache.get<number>(cacheKey);
          expect(cached).toBe(initialCredits);

          // Simulate credit deduction (invalidate cache)
          await cache.delete(cacheKey);

          // Property: Cache should be invalidated after update
          const afterDeduction = await cache.get(cacheKey);
          const isInvalidated = afterDeduction === null;

          // Update with new value
          await cache.set(cacheKey, initialCredits - 1, 60);

          // Verify new value
          const newCached = await cache.get<number>(cacheKey);
          const hasCorrectValue = newCached === initialCredits - 1;

          return isInvalidated && hasCorrectValue;
        },
        30
      );
    });

    it("should handle concurrent invalidation requests", async () => {
      const key = "concurrent-invalidation";
      const value = "test-value";

      await cache.set(key, value, 60);

      // Verify cached
      expect(await cache.get(key)).toBe(value);

      // Concurrent invalidation
      const invalidations = Array(10)
        .fill(null)
        .map(() => cache.delete(key));

      await Promise.all(invalidations);

      // Property: Key should be invalidated
      const result = await cache.get(key);
      expect(result).toBeNull();
    });

    it("should not affect other cache entries when invalidating one", async () => {
      const entries = generateMany(
        () => ({
          key: `key-${Math.random()}`,
          value: `value-${Math.random()}`,
        }),
        10
      );

      // Cache all entries
      for (const entry of entries) {
        await cache.set(entry.key, entry.value, 60);
      }

      // Invalidate first entry
      await cache.delete(entries[0].key);

      // Property: First should be invalidated, others should remain
      const firstResult = await cache.get(entries[0].key);
      expect(firstResult).toBeNull();

      // Check others are still cached
      for (let i = 1; i < entries.length; i++) {
        const result = await cache.get(entries[i].key);
        expect(result).toBe(entries[i].value);
      }
    });

    it("should allow re-caching after invalidation", async () => {
      await forAll(
        () => ({
          key: `reusable-key-${Math.random()}`,
          value1: `value1-${Math.random()}`,
          value2: `value2-${Math.random()}`,
        }),
        async ({ key, value1, value2 }) => {
          // Initial cache
          await cache.set(key, value1, 60);
          expect(await cache.get(key)).toBe(value1);

          // Invalidate
          await cache.delete(key);
          expect(await cache.get(key)).toBeNull();

          // Re-cache with new value
          await cache.set(key, value2, 60);

          // Property: Should have new value
          const result = await cache.get(key);
          return result === value2;
        },
        20
      );
    });
  });

  describe("P-SYS-007: Cache Hit Consistency", () => {
    /**
     * Feature: property-testing-framework, Property 7: Cache Hit Consistency
     * Validates: Requirements 6.1, 6.3
     *
     * Property: Cache hit returns same value as database
     * Formal: ∀k: Key, cache.get(k) ≠ null ⇒ cache.get(k) = db.get(k)
     *
     * This property ensures that when a cache hit occurs, the cached value
     * matches the source of truth (database). This is critical for data
     * consistency and correctness.
     */
    it("should return consistent values for cache hits", async () => {
      await forAll(
        () => {
          const key = `consistency-${Math.random()}`;
          const value = {
            id: Math.random().toString(),
            data: `test-${Math.random()}`,
            timestamp: Date.now(),
          };
          return { key, value };
        },
        async ({ key, value }) => {
          // Simulate database value (source of truth)
          const dbValue = { ...value };

          // Cache the value
          await cache.set(key, value, 60);

          // Multiple cache hits
          const hit1 = await cache.get(key);
          const hit2 = await cache.get(key);
          const hit3 = await cache.get(key);

          // Property: All cache hits should return the same value
          const allHitsConsistent =
            deepEqual(hit1, hit2) &&
            deepEqual(hit2, hit3) &&
            deepEqual(hit1, hit3);

          // Property: Cache hits should match database value
          const matchesDatabase =
            deepEqual(hit1, dbValue) &&
            deepEqual(hit2, dbValue) &&
            deepEqual(hit3, dbValue);

          return allHitsConsistent && matchesDatabase;
        },
        30
      );
    });

    it("should maintain consistency for complex nested objects", async () => {
      await forAll(
        generateAnalysis,
        async (analysis) => {
          const key = `analysis:${analysis.id.value}`;

          // Simulate database value
          const dbValue = {
            id: analysis.id.value,
            idea: analysis.idea,
            score: analysis.score.value,
            userId: analysis.userId.value,
          };

          // Cache the value
          await cache.set(key, dbValue, 60);

          // Multiple reads
          const reads = await Promise.all([
            cache.get(key),
            cache.get(key),
            cache.get(key),
            cache.get(key),
            cache.get(key),
          ]);

          // Property: All reads should return identical values
          const allIdentical = reads.every((read) => deepEqual(read, dbValue));

          return allIdentical;
        },
        20
      );
    });

    it("should handle concurrent cache reads consistently", async () => {
      const key = "concurrent-reads";
      const value = {
        data: "test-data",
        count: 42,
        items: [1, 2, 3, 4, 5],
      };

      await cache.set(key, value, 60);

      // Concurrent reads
      const reads = await Promise.all(
        Array(50)
          .fill(null)
          .map(() => cache.get(key))
      );

      // Property: All reads should return the same value
      const allConsistent = reads.every((read) => deepEqual(read, value));

      expect(allConsistent).toBe(true);
    });

    it("should maintain consistency across different data types", async () => {
      const testCases = [
        { key: "string", value: "test-string", dbValue: "test-string" },
        { key: "number", value: 42, dbValue: 42 },
        { key: "boolean", value: true, dbValue: true },
        { key: "array", value: [1, 2, 3], dbValue: [1, 2, 3] },
        {
          key: "object",
          value: { a: 1, b: "test" },
          dbValue: { a: 1, b: "test" },
        },
        { key: "null", value: null, dbValue: null },
      ];

      for (const testCase of testCases) {
        await cache.set(testCase.key, testCase.value, 60);

        // Multiple reads
        const read1 = await cache.get(testCase.key);
        const read2 = await cache.get(testCase.key);
        const read3 = await cache.get(testCase.key);

        // Property: All reads should match database value
        expect(deepEqual(read1, testCase.dbValue)).toBe(true);
        expect(deepEqual(read2, testCase.dbValue)).toBe(true);
        expect(deepEqual(read3, testCase.dbValue)).toBe(true);
        expect(deepEqual(read1, read2)).toBe(true);
        expect(deepEqual(read2, read3)).toBe(true);
      }
    });

    it("should maintain consistency for credit balance caching scenario", async () => {
      await forAll(
        () => {
          const userId = generateUserId();
          const credits = Math.floor(Math.random() * 10);
          const tier = Math.random() > 0.5 ? "free" : "paid";
          return { userId, credits, tier };
        },
        async ({ userId, credits, tier }) => {
          const cacheKey = `credits:${userId.value}`;
          const dbValue = { credits, tier };

          // Cache the value
          await cache.set(cacheKey, dbValue, 60);

          // Multiple reads simulating different parts of the application
          const reads = await Promise.all([
            cache.get(cacheKey), // Read from API endpoint
            cache.get(cacheKey), // Read from middleware
            cache.get(cacheKey), // Read from use case
            cache.get(cacheKey), // Read from another API endpoint
          ]);

          // Property: All reads should return consistent value matching database
          const allMatch = reads.every((read) => deepEqual(read, dbValue));

          return allMatch;
        },
        30
      );
    });

    it("should not return stale data after cache miss", async () => {
      const key = "miss-then-hit";
      const value1 = "first-value";
      const value2 = "second-value";

      // Initial cache
      await cache.set(key, value1, 1);

      // Verify cached
      expect(await cache.get(key)).toBe(value1);

      // Wait for expiration (cache miss)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Cache miss
      const missResult = await cache.get(key);
      expect(missResult).toBeNull();

      // Update cache with new value (simulating database fetch)
      await cache.set(key, value2, 60);

      // Property: Should return new value, not old value
      const hitResult = await cache.get(key);
      expect(hitResult).toBe(value2);
      expect(hitResult).not.toBe(value1);
    });

    it("should maintain consistency when cache is updated", async () => {
      await forAll(
        () => ({
          key: `update-consistency-${Math.random()}`,
          value1: `value1-${Math.random()}`,
          value2: `value2-${Math.random()}`,
        }),
        async ({ key, value1, value2 }) => {
          // Initial cache
          await cache.set(key, value1, 60);

          // Verify initial value
          const initial = await cache.get(key);
          expect(initial).toBe(value1);

          // Update cache (simulating database update)
          await cache.set(key, value2, 60);

          // Multiple reads after update
          const reads = await Promise.all([
            cache.get(key),
            cache.get(key),
            cache.get(key),
          ]);

          // Property: All reads should return updated value consistently
          const allMatchUpdated = reads.every((read) => read === value2);
          const noneMatchOld = reads.every((read) => read !== value1);

          return allMatchUpdated && noneMatchOld;
        },
        20
      );
    });
  });
});
