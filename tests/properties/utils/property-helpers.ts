/**
 * Property test helpers for common assertions and testing patterns
 * Provides utilities for property-based testing with Vitest
 */

/**
 * Assert property holds for all generated values
 *
 * @param generator - Function that generates test values
 * @param property - Property function that should return true for all values
 * @param iterations - Number of test iterations (default: 100)
 * @throws Error if property is violated with details about the failing value
 *
 * @example
 * forAll(
 *   generateScore,
 *   (score) => score.value >= 0 && score.value <= 100,
 *   100
 * );
 */
export function forAll<T>(
  generator: () => T,
  property: (value: T) => boolean,
  iterations: number = 100
): void {
  for (let i = 0; i < iterations; i++) {
    const value = generator();
    if (!property(value)) {
      throw new Error(
        `Property violated at iteration ${i + 1} with value: ${JSON.stringify(
          value,
          null,
          2
        )}`
      );
    }
  }
}

/**
 * Assert property holds for specific test cases
 *
 * @param cases - Array of specific test cases to validate
 * @param property - Property function that should return true for all cases
 * @throws Error if property is violated with details about the failing case
 *
 * @example
 * forCases(
 *   [Score.create(0), Score.create(50), Score.create(100)],
 *   (score) => score.value >= 0 && score.value <= 100
 * );
 */
export function forCases<T>(cases: T[], property: (value: T) => boolean): void {
  cases.forEach((testCase, index) => {
    if (!property(testCase)) {
      throw new Error(
        `Property violated for case ${index + 1}: ${JSON.stringify(
          testCase,
          null,
          2
        )}`
      );
    }
  });
}

/**
 * Assert two values are deeply equal using JSON serialization
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if values are deeply equal, false otherwise
 *
 * @example
 * const obj1 = { name: "test", score: 100 };
 * const obj2 = { name: "test", score: 100 };
 * deepEqual(obj1, obj2); // true
 */
export function deepEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Assert entity equality by comparing their IDs
 * Entities are considered equal if they have the same identity
 *
 * @param a - First entity to compare
 * @param b - Second entity to compare
 * @returns true if entities have equal IDs, false otherwise
 *
 * @example
 * const analysis1 = generateAnalysis();
 * const analysis2 = Analysis.reconstruct({ ...analysis1.toObject() });
 * entityEquals(analysis1, analysis2); // true
 */
export function entityEquals<T extends { id: { equals(other: any): boolean } }>(
  a: T,
  b: T
): boolean {
  return a.id.equals(b.id);
}

/**
 * Measure execution time of an async function
 *
 * @param fn - Async function to measure
 * @returns Object containing the result and duration in milliseconds
 *
 * @example
 * const { result, duration } = await measureTime(async () => {
 *   return await someExpensiveOperation();
 * });
 * console.log(`Operation took ${duration}ms`);
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Measure execution time of a synchronous function
 *
 * @param fn - Synchronous function to measure
 * @returns Object containing the result and duration in milliseconds
 *
 * @example
 * const { result, duration } = measureTimeSync(() => {
 *   return someExpensiveCalculation();
 * });
 * console.log(`Calculation took ${duration}ms`);
 */
export function measureTimeSync<T>(fn: () => T): {
  result: T;
  duration: number;
} {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Assert that a value is within a specified range
 *
 * @param value - Value to check
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns tvalue is within range, false otherwise
 *
 * @example
 * assertInRange(50, 0, 100); // true
 * assertInRange(150, 0, 100); // false
 */
export function assertInRange(
  value: number,
  min: number,
  max: number
): boolean {
  return value >= min && value <= max;
}

/**
 * Assert that a value is not null or undefined
 *
 * @param value - Value to check
 * @returns true if value is defined, false otherwise
 *
 * @example
 * assertDefined("test"); // true
 * assertDefined(null); // false
 * assertDefined(undefined); // false
 */
export function assertDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Assert that an array contains a specific element
 *
 * @param array - Array to search
 * @param element - Element to find
 * @returns true if array contains element, false otherwise
 *
 * @example
 * assertContains([1, 2, 3], 2); // true
 * assertContains([1, 2, 3], 4); // false
 */
export function assertContains<T>(array: T[], element: T): boolean {
  return array.includes(element);
}

/**
 * Assert that all elements in an array satisfy a predicate
 *
 * @param array - Array to check
 * @param predicate - Function that should return true for all elements
 * @returns true if all elements satisfy predicate, false otherwise
 *
 * @example
 * assertAll([1, 2, 3], (n) => n > 0); // true
 * assertAll([1, 2, -3], (n) => n > 0); // false
 */
export function assertAll<T>(
  array: T[],
  predicate: (element: T) => boolean
): boolean {
  return array.every(predicate);
}

/**
 * Assert that at least one element in an array satisfies a predicate
 *
 * @param array - Array to check
 * @param predicate - Function that should return true for at least one element
 * @returns true if any element satisfies predicate, false otherwise
 *
 * @example
 * assertAny([1, 2, 3], (n) => n > 2); // true
 * assertAny([1, 2, 3], (n) => n > 5); // false
 */
export function assertAny<T>(
  array: T[],
  predicate: (element: T) => boolean
): boolean {
  return array.some(predicate);
}

/**
 * Assert that two arrays have the same elements (order-independent)
 *
 * @param a - First array
 * @param b - Second array
 * @returns true if arrays contain same elements, false otherwise
 *
 * @example
 * assertSameElements([1, 2, 3], [3, 2, 1]); // true
 * assertSameElements([1, 2, 3], [1, 2, 4]); // false
 */
export function assertSameElements<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return JSON.stringify(sortedA) === JSON.stringify(sortedB);
}

/**
 * Assert that a value matches a regular expression pattern
 *
 * @param value - String value to test
 * @param pattern - Regular expression pattern
 * @returns true if value matches pattern, false otherwise
 *
 * @example
 * assertMatches("test@example.com", /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/); // true
 * assertMatches("invalid-email", /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/); // false
 */
export function assertMatches(value: string, pattern: RegExp): boolean {
  return pattern.test(value);
}

/**
 * Assert that a function throws an error
 *
 * @param fn - Function that should throw
 * @returns true if function throws, false otherwise
 *
 * @example
 * assertThrows(() => { throw new Error("test"); }); // true
 * assertThrows(() => { return "ok"; }); // false
 */
export function assertThrows(fn: () => void): boolean {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
}

/**
 * Assert that an async function throws an error
 *
 * @param fn - Async function that should throw
 * @returns Promise that resolves to true if function throws, false otherwise
 *
 * @example
 * await assertThrowsAsync(async () => { throw new Error("test"); }); // true
 * await assertThrowsAsync(async () => { return "ok"; }); // false
 */
export async function assertThrowsAsync(
  fn: () => Promise<void>
): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
}
