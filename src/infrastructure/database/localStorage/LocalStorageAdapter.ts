/**
 * LocalStorageAdapter - Generic adapter for localStorage operations
 * Provides type-safe CRUD operations with namespace prefixing and error handling
 *
 * @template T - The type of items stored in localStorage
 */

/**
 * Storage key constants for localStorage namespacing
 */
export const STORAGE_KEYS = {
  AUTH: "nvnc-local-auth",
  USER: "nvnc-local-user",
  ANALYSES: "nvnc-local-analyses",
  HACKATHON: "nvnc-local-hackathon",
  IDEAS: "nvnc-local-ideas",
  DOCUMENTS: "nvnc-local-documents",
  CREDITS: "nvnc-local-credits",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Custom error for localStorage quota exceeded
 */
export class StorageQuotaError extends Error {
  constructor(message: string = "localStorage quota exceeded") {
    super(message);
    this.name = "StorageQuotaError";
  }
}

/**
 * Custom error for localStorage data corruption
 */
export class StorageCorruptionError extends Error {
  constructor(
    public readonly key: string,
    message: string = "localStorage data is corrupted"
  ) {
    super(`${message}: ${key}`);
    this.name = "StorageCorruptionError";
  }
}

/**
 * Custom error for general localStorage failures
 */
export class LocalStorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "LocalStorageError";
  }
}

/**
 * Interface for items that can be stored (must have an id)
 */
export interface Identifiable {
  id: string;
}

/**
 * Generic LocalStorage adapter for CRUD operations
 * Handles JSON serialization/deserialization with error handling
 */
export class LocalStorageAdapter<T extends Identifiable> {
  constructor(public readonly storageKey: StorageKey) {}

  /**
   * Check if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = "__localStorage_test__";
      if (typeof window === "undefined" || !window.localStorage) {
        return false;
      }
      window.localStorage.setItem(testKey, "test");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all items from localStorage
   */
  getAll(): T[] {
    if (!this.isLocalStorageAvailable()) {
      return [];
    }

    try {
      const data = window.localStorage.getItem(this.storageKey);
      if (!data) {
        return [];
      }

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        throw new StorageCorruptionError(
          this.storageKey,
          "Expected array but got " + typeof parsed
        );
      }

      return parsed as T[];
    } catch (error) {
      if (error instanceof StorageCorruptionError) {
        // Clear corrupted data and return empty array
        this.deleteAll();
        throw error;
      }
      if (error instanceof SyntaxError) {
        // JSON parse error - data is corrupted
        this.deleteAll();
        throw new StorageCorruptionError(this.storageKey, "Invalid JSON data");
      }
      throw new LocalStorageError("Failed to read from localStorage", error);
    }
  }

  /**
   * Get a single item by ID
   */
  getById(id: string): T | null {
    const items = this.getAll();
    return items.find((item) => item.id === id) || null;
  }

  /**
   * Save a new item (adds to the collection)
   */
  save(item: T): void {
    if (!this.isLocalStorageAvailable()) {
      throw new LocalStorageError("localStorage is not available");
    }

    try {
      const items = this.getAll();
      // Check if item already exists
      const existingIndex = items.findIndex((i) => i.id === item.id);
      if (existingIndex >= 0) {
        // Update existing item
        items[existingIndex] = item;
      } else {
        // Add new item
        items.push(item);
      }
      this.saveAll(items);
    } catch (error) {
      if (error instanceof StorageQuotaError) {
        throw error;
      }
      throw new LocalStorageError("Failed to save item to localStorage", error);
    }
  }

  /**
   * Update an existing item by ID
   */
  update(id: string, item: T): void {
    if (!this.isLocalStorageAvailable()) {
      throw new LocalStorageError("localStorage is not available");
    }

    try {
      const items = this.getAll();
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) {
        throw new LocalStorageError(`Item with id ${id} not found`);
      }
      items[index] = { ...item, id }; // Ensure ID is preserved
      this.saveAll(items);
    } catch (error) {
      if (
        error instanceof StorageQuotaError ||
        error instanceof LocalStorageError
      ) {
        throw error;
      }
      throw new LocalStorageError(
        "Failed to update item in localStorage",
        error
      );
    }
  }

  /**
   * Delete an item by ID
   * @returns true if item was found and deleted, false if not found
   */
  delete(id: string): boolean {
    if (!this.isLocalStorageAvailable()) {
      throw new LocalStorageError("localStorage is not available");
    }

    try {
      const items = this.getAll();
      const initialLength = items.length;
      const filteredItems = items.filter((item) => item.id !== id);

      if (filteredItems.length === initialLength) {
        return false; // Item not found
      }

      this.saveAll(filteredItems);
      return true;
    } catch (error) {
      throw new LocalStorageError(
        "Failed to delete item from localStorage",
        error
      );
    }
  }

  /**
   * Delete all items
   */
  deleteAll(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      window.localStorage.removeItem(this.storageKey);
    } catch (error) {
      throw new LocalStorageError(
        "Failed to clear localStorage collection",
        error
      );
    }
  }

  /**
   * Get the count of items
   */
  count(): number {
    return this.getAll().length;
  }

  /**
   * Check if an item exists by ID
   */
  exists(id: string): boolean {
    return this.getById(id) !== null;
  }

  /**
   * Find items matching a predicate
   */
  findWhere(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  /**
   * Save all items (replaces entire collection)
   */
  private saveAll(items: T[]): void {
    if (!this.isLocalStorageAvailable()) {
      throw new LocalStorageError("localStorage is not available");
    }

    try {
      const serialized = JSON.stringify(items);
      window.localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      if (error instanceof DOMException) {
        // Check for quota exceeded error
        if (
          error.name === "QuotaExceededError" ||
          error.code === 22 || // Legacy Chrome
          error.code === 1014 // Firefox
        ) {
          throw new StorageQuotaError(
            "localStorage quota exceeded. Please clear some old data."
          );
        }
      }
      throw new LocalStorageError("Failed to write to localStorage", error);
    }
  }
}
