/**
 * Tests for property test helpers
 * Validates that all helper functions work correctly
 */

import { describe, it, expect } from "vitest";
import {
  forAll,
  forCases,
  deepEqual,
  entityEquals,
  measureTime,
  measureTimeSync,
  assertInRange,
  assertDefined,
  assertContains,
  assertAll,
  assertAny,
  assertSameElements,
  assertMatches,
  assertThrows,
  assertThrowsAsync,
} from "../property-helpers";
import { generateScore, generateAnalysis } from "../generators";

describe("Property Helpers", () => {
  describe("forAll", () => {
    it("should pass when property holds for all generated values", () => {
      expect(() => {
        forAll(
          generateScore,
          (score) => score.value >= 0 && score.value <= 100,
          10
        );
      }).not.toThrow();
    });

    it("should throw when property is violated", () => {
      expect(() => {
        forAll(
          generateScore,
          (score) => score.value > 100, // This will fail
          10
        );
      }).toThrow(/Property violated/);
    });

    it("should include iteration number and value in error message", () => {
      try {
        forAll(
          () => 5,
          (n) => n > 10,
          1
        );
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toContain("iteration 1");
        expect(error.message).toContain("5");
      }
    });
  });

  describe("forCases", () => {
    it("should pass when property holds for all cases", () => {
      expect(() => {
        forCases([1, 2, 3, 4, 5], (n) => n > 0);
      }).not.toThrow();
    });

    it("should throw when property is violated for a case", () => {
      expect(() => {
        forCases([1, 2, -3, 4], (n) => n > 0);
      }).toThrow(/Property violated for case 3/);
    });
  });

  describe("deepEqual", () => {
    it("should return true for deeply equal objects", () => {
      const obj1 = { name: "test", score: 100, nested: { value: 42 } };
      const obj2 = { name: "test", score: 100, nested: { value: 42 } };
      expect(deepEqual(obj1, obj2)).toBe(true);
    });

    it("should return false for different objects", () => {
      const obj1 = { name: "test", score: 100 };
      const obj2 = { name: "test", score: 99 };
      expect(deepEqual(obj1, obj2)).toBe(false);
    });

    it("should work with primitives", () => {
      expect(deepEqual(42, 42)).toBe(true);
      expect(deepEqual("test", "test")).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(42, 43)).toBe(false);
    });
  });

  describe("entityEquals", () => {
    it("should return true for entities with same ID", () => {
      const analysis1 = generateAnalysis();
      const analysis2 = generateAnalysis();

      // Create a copy with same ID
      const analysis1Copy = generateAnalysis();
      // Mock the ID to be the same
      Object.defineProperty(analysis1Copy, "id", {
        value: analysis1.id,
        writable: false,
      });

      expect(entityEquals(analysis1, analysis1Copy)).toBe(true);
    });

    it("should return false for entities with different IDs", () => {
      const analysis1 = generateAnalysis();
      const analysis2 = generateAnalysis();
      expect(entityEquals(analysis1, analysis2)).toBe(false);
    });
  });

  describe("measureTime", () => {
    it("should measure execution time of async function", async () => {
      const { result, duration } = await measureTime(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "done";
      });

      expect(result).toBe("done");
      expect(duration).toBeGreaterThanOrEqual(10);
      expect(duration).toBeLessThan(500); // Should complete reasonably quickly (allow for system load)
    });

    it("should return correct result from measured function", async () => {
      const { result } = await measureTime(async () => {
        return 42;
      });

      expect(result).toBe(42);
    });
  });

  describe("measureTimeSync", () => {
    it("should measure execution time of sync function", () => {
      const { result, duration } = measureTimeSync(() => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBe(499500);
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe("assertInRange", () => {
    it("should return true for values within range", () => {
      expect(assertInRange(50, 0, 100)).toBe(true);
      expect(assertInRange(0, 0, 100)).toBe(true);
      expect(assertInRange(100, 0, 100)).toBe(true);
    });

    it("should return false for values outside range", () => {
      expect(assertInRange(-1, 0, 100)).toBe(false);
      expect(assertInRange(101, 0, 100)).toBe(false);
    });
  });

  describe("assertDefined", () => {
    it("should return true for defined values", () => {
      expect(assertDefined("test")).toBe(true);
      expect(assertDefined(0)).toBe(true);
      expect(assertDefined(false)).toBe(true);
      expect(assertDefined([])).toBe(true);
    });

    it("should return false for null or undefined", () => {
      expect(assertDefined(null)).toBe(false);
      expect(assertDefined(undefined)).toBe(false);
    });
  });

  describe("assertContains", () => {
    it("should return true when array contains element", () => {
      expect(assertContains([1, 2, 3], 2)).toBe(true);
      expect(assertContains(["a", "b", "c"], "b")).toBe(true);
    });

    it("should return false when array does not contain element", () => {
      expect(assertContains([1, 2, 3], 4)).toBe(false);
      expect(assertContains(["a", "b", "c"], "d")).toBe(false);
    });
  });

  describe("assertAll", () => {
    it("should return true when all elements satisfy predicate", () => {
      expect(assertAll([1, 2, 3], (n) => n > 0)).toBe(true);
      expect(assertAll([2, 4, 6], (n) => n % 2 === 0)).toBe(true);
    });

    it("should return false when any element fails predicate", () => {
      expect(assertAll([1, 2, -3], (n) => n > 0)).toBe(false);
      expect(assertAll([2, 3, 6], (n) => n % 2 === 0)).toBe(false);
    });

    it("should return true for empty array", () => {
      expect(assertAll([], (n) => n > 0)).toBe(true);
    });
  });

  describe("assertAny", () => {
    it("should return true when at least one element satisfies predicate", () => {
      expect(assertAny([1, 2, 3], (n) => n > 2)).toBe(true);
      expect(assertAny([1, 3, 5], (n) => n % 2 === 0)).toBe(false);
    });

    it("should return false when no elements satisfy predicate", () => {
      expect(assertAny([1, 2, 3], (n) => n > 5)).toBe(false);
    });

    it("should return false for empty array", () => {
      expect(assertAny([], (n) => n > 0)).toBe(false);
    });
  });

  describe("assertSameElements", () => {
    it("should return true for arrays with same elements in different order", () => {
      expect(assertSameElements([1, 2, 3], [3, 2, 1])).toBe(true);
      expect(assertSameElements(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
    });

    it("should return false for arrays with different elements", () => {
      expect(assertSameElements([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(assertSameElements([1, 2], [1, 2, 3])).toBe(false);
    });
  });

  describe("assertMatches", () => {
    it("should return true when value matches pattern", () => {
      expect(
        assertMatches("test@example.com", /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
      ).toBe(true);
      expect(assertMatches("123-456", /^\d{3}-\d{3}$/)).toBe(true);
    });

    it("should return false when value does not match pattern", () => {
      expect(
        assertMatches("invalid-email", /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
      ).toBe(false);
      expect(assertMatches("abc-def", /^\d{3}-\d{3}$/)).toBe(false);
    });
  });

  describe("assertThrows", () => {
    it("should return true when function throws", () => {
      expect(
        assertThrows(() => {
          throw new Error("test");
        })
      ).toBe(true);
    });

    it("should return false when function does not throw", () => {
      expect(
        assertThrows(() => {
          return "ok";
        })
      ).toBe(false);
    });
  });

  describe("assertThrowsAsync", () => {
    it("should return true when async function throws", async () => {
      const result = await assertThrowsAsync(async () => {
        throw new Error("test");
      });
      expect(result).toBe(true);
    });

    it("should return false when async function does not throw", async () => {
      const result = await assertThrowsAsync(async () => {
        return "ok";
      });
      expect(result).toBe(false);
    });
  });
});
