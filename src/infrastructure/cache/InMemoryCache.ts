import { ICache } from "./ICache";

/**
 * Cache entry with value and expiration timestamp
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory cache implementation with TTL support
 * Provides automatic cleanup of expired entries
 */
export class InMemoryCache implements ICache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 60000; // Run cleanup every 60 seconds

  constructor() {
    this.startCleanup();
  }

  /**
   * Get a value from the cache
   * Returns null if key doesn't exist or has expired
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a value in the cache with TTL
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttlSeconds - Time to live in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;

    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Delete a value from the cache
   * @param key - The cache key
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clear all values from the cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get the current number of entries in the cache
   * Useful for monitoring and testing
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Start automatic cleanup of expired entries
   * Runs periodically to prevent memory leaks
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.CLEANUP_INTERVAL_MS);

    // Ensure cleanup stops when process exits
    if (typeof process !== "undefined") {
      process.on("beforeExit", () => this.stopCleanup());
    }
  }

  /**
   * Stop automatic cleanup
   * Should be called when cache is no longer needed
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Remove all expired entries from the cache
   * Called automatically by cleanup interval
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Collect expired keys
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    // Delete expired entries
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }
}
