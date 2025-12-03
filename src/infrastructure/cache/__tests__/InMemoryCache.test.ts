import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { InMemoryCache } from "../InMemoryCache";

describe("InMemoryCache", () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache();
  });

  afterEach(() => {
    cache.stopCleanup();
  });

  describe("get and set operations", () => {
    it("should store and retrieve a value", async () => {
      await cache.set("test-key", "test-value", 60);
      const result = await cache.get<string>("test-key");

      expect(result).toBe("test-value");
    });

    it("should return null for non-existent key", async () => {
      const result = await cache.get<string>("non-existent");

      expect(result).toBeNull();
    });

    it("should handle different data types", async () => {
      // String
      await cache.set("string-key", "hello", 60);
      expect(await cache.get<string>("string-key")).toBe("hello");

      // Number
      await cache.set("number-key", 42, 60);
      expect(await cache.get<number>("number-key")).toBe(42);

      // Object
      const obj = { name: "test", value: 123 };
      await cache.set("object-key", obj, 60);
      expect(await cache.get<typeof obj>("object-key")).toEqual(obj);

      // Array
      const arr = [1, 2, 3];
      await cache.set("array-key", arr, 60);
      expect(await cache.get<number[]>("array-key")).toEqual(arr);
    });

    it("should overwrite existing value", async () => {
      await cache.set("key", "value1", 60);
      await cache.set("key", "value2", 60);

      const result = await cache.get<string>("key");
      expect(result).toBe("value2");
    });
  });

  describe("TTL expiration", () => {
    it("should return null for expired entry", async () => {
      // Set with 1 second TTL
      await cache.set("expiring-key", "value", 1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const result = await cache.get<string>("expiring-key");
      expect(result).toBeNull();
    });

    it("should return value before expiration", async () => {
      await cache.set("key", "value", 2);

      // Check immediately
      const result1 = await cache.get<string>("key");
      expect(result1).toBe("value");

      // Wait 1 second (still within TTL)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result2 = await cache.get<string>("key");
      expect(result2).toBe("value");
    });

    it("should handle very short TTL", async () => {
      await cache.set("key", "value", 0.001); // 1 millisecond

      // Wait a tiny bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should be expired
      const result = await cache.get<string>("key");
      expect(result).toBeNull();
    });
  });

  describe("delete operation", () => {
    it("should delete existing entry", async () => {
      await cache.set("key", "value", 60);
      await cache.delete("key");

      const result = await cache.get<string>("key");
      expect(result).toBeNull();
    });

    it("should not throw error when deleting non-existent key", async () => {
      await expect(cache.delete("non-existent")).resolves.toBeUndefined();
    });
  });

  describe("clear operation", () => {
    it("should clear all entries", async () => {
      await cache.set("key1", "value1", 60);
      await cache.set("key2", "value2", 60);
      await cache.set("key3", "value3", 60);

      await cache.clear();

      expect(await cache.get<string>("key1")).toBeNull();
      expect(await cache.get<string>("key2")).toBeNull();
      expect(await cache.get<string>("key3")).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe("size tracking", () => {
    it("should track cache size correctly", async () => {
      expect(cache.size()).toBe(0);

      await cache.set("key1", "value1", 60);
      expect(cache.size()).toBe(1);

      await cache.set("key2", "value2", 60);
      expect(cache.size()).toBe(2);

      await cache.delete("key1");
      expect(cache.size()).toBe(1);

      await cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe("automatic cleanup", () => {
    it("should automatically remove expired entries during cleanup", async () => {
      // Set entries with short TTL
      await cache.set("key1", "value1", 1);
      await cache.set("key2", "value2", 1);
      await cache.set("key3", "value3", 60); // This one won't expire

      expect(cache.size()).toBe(3);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Trigger cleanup by accessing an expired entry
      await cache.get("key1");

      // Wait a bit for cleanup to potentially run
      await new Promise((resolve) => setTimeout(resolve, 100));

      // key3 should still be there
      expect(await cache.get<string>("key3")).toBe("value3");
    });
  });

  describe("cache invalidation patterns", () => {
    it("should support cache invalidation by deleting key", async () => {
      // Simulate credit balance caching
      const userId = "user-123";
      const cacheKey = `credits:${userId}`;

      await cache.set(cacheKey, { credits: 3, tier: "free" }, 60);

      // Verify cached
      expect(await cache.get(cacheKey)).toEqual({ credits: 3, tier: "free" });

      // Invalidate cache (e.g., after credit deduction)
      await cache.delete(cacheKey);

      // Should be gone
      expect(await cache.get(cacheKey)).toBeNull();
    });

    it("should support multiple cache keys for same user", async () => {
      const userId = "user-123";

      await cache.set(`credits:${userId}`, 3, 60);
      await cache.set(
        `credit_balance:${userId}`,
        { credits: 3, tier: "free" },
        60
      );

      expect(await cache.get<number>(`credits:${userId}`)).toBe(3);
      expect(await cache.get(`credit_balance:${userId}`)).toEqual({
        credits: 3,
        tier: "free",
      });
    });
  });

  describe("concurrent operations", () => {
    it("should handle concurrent set operations", async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(cache.set(`key-${i}`, `value-${i}`, 60));
      }

      await Promise.all(promises);

      expect(cache.size()).toBe(10);

      for (let i = 0; i < 10; i++) {
        expect(await cache.get<string>(`key-${i}`)).toBe(`value-${i}`);
      }
    });

    it("should handle concurrent get operations", async () => {
      await cache.set("shared-key", "shared-value", 60);

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(cache.get<string>("shared-key"));
      }

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toBe("shared-value");
      });
    });
  });
});
