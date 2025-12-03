/**
 * Property tests for RepositoryFactory (Open Source Mode)
 *
 * Feature: open-source-mode
 * Tests Property 1 from the design document
 *
 * @module tests/properties/system/repository-factory.properties.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { forAll } from "../utils/property-helpers";

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Track the current LOCAL_STORAGE_MODE value for mocking
let mockLocalStorageMode = false;

// Mock the feature flags module
vi.mock("@/lib/featureFlags", () => ({
  isEnabled: (flag: string) => {
    if (flag === "LOCAL_STORAGE_MODE") {
      return mockLocalStorageMode;
    }
    return false;
  },
}));

// Mock the FeatureFlagManager
vi.mock("@/lib/testing/FeatureFlagManager", () => ({
  FeatureFlagManager: class {
    isMockModeEnabled() {
      return false;
    }
  },
}));

// Mock Supabase client creation
vi.mock("@/src/infrastructure/config", () => ({
  createSupabaseServiceClient: () => {
    throw new Error("Supabase not available in test");
  },
}));

// Import after mocks are set up
import { RepositoryFactory } from "@/src/infrastructure/factories/RepositoryFactory";
import { LocalStorageAnalysisRepository } from "@/src/infrastructure/database/localStorage/LocalStorageAnalysisRepository";
import { LocalStorageUserRepository } from "@/src/infrastructure/database/localStorage/LocalStorageUserRepository";
import { LocalStorageIdeaRepository } from "@/src/infrastructure/database/localStorage/LocalStorageIdeaRepository";
import { LocalStorageDocumentRepository } from "@/src/infrastructure/database/localStorage/LocalStorageDocumentRepository";
import { LocalStorageCreditTransactionRepository } from "@/src/infrastructure/database/localStorage/LocalStorageCreditTransactionRepository";

describe("Property 1: Repository type matches LOCAL_STORAGE_MODE configuration", () => {
  /**
   * **Feature: open-source-mode, Property 1: Repository type matches LOCAL_STORAGE_MODE configuration**
   *
   * For any configuration state, when LOCAL_STORAGE_MODE is true, the RepositoryFactory
   * SHALL return localStorage repository implementations, and when LOCAL_STORAGE_MODE
   * is false, it SHALL return Supabase repository implementations.
   *
   * **Validates: Requirements 1.3, 1.4, 5.1, 5.2**
   */

  beforeEach(() => {
    // Setup localStorage mock for Node.js environment
    Object.defineProperty(global, "window", {
      value: { localStorage: localStorageMock },
      writable: true,
    });
    Object.defineProperty(global, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("When LOCAL_STORAGE_MODE is enabled", () => {
    beforeEach(() => {
      mockLocalStorageMode = true;
    });

    it("should return LocalStorageAnalysisRepository", () => {
      // Create a mock Supabase client (won't be used in local mode)
      const mockSupabaseClient = {} as any;
      const factory = RepositoryFactory.create(mockSupabaseClient);

      const repository = factory.createAnalysisRepository();

      expect(repository).toBeInstanceOf(LocalStorageAnalysisRepository);
    });

    it("should return LocalStorageUserRepository", () => {
      const mockSupabaseClient = {} as any;
      const factory = RepositoryFactory.create(mockSupabaseClient);

      const repository = factory.createUserRepository();

      expect(repository).toBeInstanceOf(LocalStorageUserRepository);
    });

    it("should return LocalStorageIdeaRepository", () => {
      const mockSupabaseClient = {} as any;
      const factory = RepositoryFactory.create(mockSupabaseClient);

      const repository = factory.createIdeaRepository();

      expect(repository).toBeInstanceOf(LocalStorageIdeaRepository);
    });

    it("should return LocalStorageDocumentRepository", () => {
      const mockSupabaseClient = {} as any;
      const factory = RepositoryFactory.create(mockSupabaseClient);

      const repository = factory.createDocumentRepository();

      expect(repository).toBeInstanceOf(LocalStorageDocumentRepository);
    });

    it("should return LocalStorageCreditTransactionRepository", () => {
      const mockSupabaseClient = {} as any;
      const factory = RepositoryFactory.create(mockSupabaseClient);

      const repository = factory.createCreditTransactionRepository();

      expect(repository).toBeInstanceOf(
        LocalStorageCreditTransactionRepository
      );
    });

    it("should consistently return localStorage repositories across multiple calls", () => {
      forAll(
        () => {
          const mockSupabaseClient = {} as any;
          return RepositoryFactory.create(mockSupabaseClient);
        },
        (factory) => {
          // Clear cache to ensure fresh creation
          factory.clearCache();

          const analysisRepo = factory.createAnalysisRepository();
          const userRepo = factory.createUserRepository();
          const ideaRepo = factory.createIdeaRepository();
          const documentRepo = factory.createDocumentRepository();
          const creditRepo = factory.createCreditTransactionRepository();

          return (
            analysisRepo instanceof LocalStorageAnalysisRepository &&
            userRepo instanceof LocalStorageUserRepository &&
            ideaRepo instanceof LocalStorageIdeaRepository &&
            documentRepo instanceof LocalStorageDocumentRepository &&
            creditRepo instanceof LocalStorageCreditTransactionRepository
          );
        },
        100
      );
    });

    it("should cache localStorage repositories within the same factory instance", () => {
      const mockSupabaseClient = {} as any;
      const factory = RepositoryFactory.create(mockSupabaseClient);

      // First call creates the repository
      const repo1 = factory.createAnalysisRepository();
      // Second call should return the same cached instance
      const repo2 = factory.createAnalysisRepository();

      expect(repo1).toBe(repo2);
      expect(repo1).toBeInstanceOf(LocalStorageAnalysisRepository);
    });
  });

  describe("When LOCAL_STORAGE_MODE is disabled", () => {
    beforeEach(() => {
      mockLocalStorageMode = false;
    });

    it("should NOT return LocalStorageAnalysisRepository", () => {
      // Create a mock Supabase client with minimal required structure
      const mockSupabaseClient = {
        from: () => ({
          select: () => ({ data: [], error: null }),
          insert: () => ({ data: null, error: null }),
          update: () => ({ data: null, error: null }),
          delete: () => ({ data: null, error: null }),
        }),
      } as any;

      const factory = RepositoryFactory.create(mockSupabaseClient);
      const repository = factory.createAnalysisRepository();

      // Should NOT be a localStorage repository
      expect(repository).not.toBeInstanceOf(LocalStorageAnalysisRepository);
    });

    it("should NOT return LocalStorageUserRepository", () => {
      const mockSupabaseClient = {
        from: () => ({
          select: () => ({ data: [], error: null }),
          insert: () => ({ data: null, error: null }),
          update: () => ({ data: null, error: null }),
          delete: () => ({ data: null, error: null }),
        }),
      } as any;

      const factory = RepositoryFactory.create(mockSupabaseClient);
      const repository = factory.createUserRepository();

      expect(repository).not.toBeInstanceOf(LocalStorageUserRepository);
    });

    it("should NOT return LocalStorageIdeaRepository", () => {
      const mockSupabaseClient = {
        from: () => ({
          select: () => ({ data: [], error: null }),
          insert: () => ({ data: null, error: null }),
          update: () => ({ data: null, error: null }),
          delete: () => ({ data: null, error: null }),
        }),
      } as any;

      const factory = RepositoryFactory.create(mockSupabaseClient);
      const repository = factory.createIdeaRepository();

      expect(repository).not.toBeInstanceOf(LocalStorageIdeaRepository);
    });

    it("should NOT return LocalStorageDocumentRepository", () => {
      const mockSupabaseClient = {
        from: () => ({
          select: () => ({ data: [], error: null }),
          insert: () => ({ data: null, error: null }),
          update: () => ({ data: null, error: null }),
          delete: () => ({ data: null, error: null }),
        }),
      } as any;

      const factory = RepositoryFactory.create(mockSupabaseClient);
      const repository = factory.createDocumentRepository();

      expect(repository).not.toBeInstanceOf(LocalStorageDocumentRepository);
    });

    it("should NOT return LocalStorageCreditTransactionRepository", () => {
      const mockSupabaseClient = {
        from: () => ({
          select: () => ({ data: [], error: null }),
          insert: () => ({ data: null, error: null }),
          update: () => ({ data: null, error: null }),
          delete: () => ({ data: null, error: null }),
        }),
      } as any;

      const factory = RepositoryFactory.create(mockSupabaseClient);
      const repository = factory.createCreditTransactionRepository();

      expect(repository).not.toBeInstanceOf(
        LocalStorageCreditTransactionRepository
      );
    });
  });

  describe("Repository type consistency property", () => {
    it("should return consistent repository types based on LOCAL_STORAGE_MODE flag", () => {
      // Test with LOCAL_STORAGE_MODE = true
      mockLocalStorageMode = true;
      const mockSupabaseClient = {} as any;
      const factoryLocalMode = RepositoryFactory.create(mockSupabaseClient);

      const localAnalysisRepo = factoryLocalMode.createAnalysisRepository();
      const localUserRepo = factoryLocalMode.createUserRepository();
      const localIdeaRepo = factoryLocalMode.createIdeaRepository();
      const localDocumentRepo = factoryLocalMode.createDocumentRepository();
      const localCreditRepo =
        factoryLocalMode.createCreditTransactionRepository();

      // All should be localStorage implementations
      expect(localAnalysisRepo).toBeInstanceOf(LocalStorageAnalysisRepository);
      expect(localUserRepo).toBeInstanceOf(LocalStorageUserRepository);
      expect(localIdeaRepo).toBeInstanceOf(LocalStorageIdeaRepository);
      expect(localDocumentRepo).toBeInstanceOf(LocalStorageDocumentRepository);
      expect(localCreditRepo).toBeInstanceOf(
        LocalStorageCreditTransactionRepository
      );

      // Test with LOCAL_STORAGE_MODE = false
      mockLocalStorageMode = false;
      const mockSupabaseClientNormal = {
        from: () => ({
          select: () => ({ data: [], error: null }),
          insert: () => ({ data: null, error: null }),
          update: () => ({ data: null, error: null }),
          delete: () => ({ data: null, error: null }),
        }),
      } as any;
      const factoryNormalMode = RepositoryFactory.create(
        mockSupabaseClientNormal
      );

      const supabaseAnalysisRepo = factoryNormalMode.createAnalysisRepository();
      const supabaseUserRepo = factoryNormalMode.createUserRepository();
      const supabaseIdeaRepo = factoryNormalMode.createIdeaRepository();
      const supabaseDocumentRepo = factoryNormalMode.createDocumentRepository();
      const supabaseCreditRepo =
        factoryNormalMode.createCreditTransactionRepository();

      // None should be localStorage implementations
      expect(supabaseAnalysisRepo).not.toBeInstanceOf(
        LocalStorageAnalysisRepository
      );
      expect(supabaseUserRepo).not.toBeInstanceOf(LocalStorageUserRepository);
      expect(supabaseIdeaRepo).not.toBeInstanceOf(LocalStorageIdeaRepository);
      expect(supabaseDocumentRepo).not.toBeInstanceOf(
        LocalStorageDocumentRepository
      );
      expect(supabaseCreditRepo).not.toBeInstanceOf(
        LocalStorageCreditTransactionRepository
      );
    });
  });
});
