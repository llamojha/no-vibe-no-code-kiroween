/**
 * Cache interface for storing and retrieving data with TTL support
 * Provides a simple key-value cache abstraction
 */
export interface ICache {
  /**
   * Get a value from the cache
   * @param key - The cache key
   * @returns The cached value or null if not found or expired
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in the cache with TTL
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttlSeconds - Time to live in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;

  /**
   * Delete a value from the cache
   * @param key - The cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all values from the cache
   */
  clear(): Promise<void>;
}
