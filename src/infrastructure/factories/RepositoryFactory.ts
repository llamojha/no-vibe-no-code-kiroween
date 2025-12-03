import { SupabaseClient } from "@supabase/supabase-js";
import { IAnalysisRepository } from "../../domain/repositories/IAnalysisRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ICreditTransactionRepository } from "../../domain/repositories/ICreditTransactionRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IDocumentRepository } from "../../domain/repositories/IDocumentRepository";
import { SupabaseAnalysisRepository } from "../database/supabase/repositories/SupabaseAnalysisRepository";
import { SupabaseUserRepository } from "../database/supabase/repositories/SupabaseUserRepository";
import { SupabaseCreditTransactionRepository } from "../database/supabase/repositories/SupabaseCreditTransactionRepository";
import { SupabaseIdeaRepository } from "../database/supabase/repositories/SupabaseIdeaRepository";
import { SupabaseDocumentRepository } from "../database/supabase/repositories/SupabaseDocumentRepository";
import { AnalysisMapper } from "../database/supabase/mappers/AnalysisMapper";
import { UserMapper } from "../database/supabase/mappers/UserMapper";
import { CreditTransactionMapper } from "../database/supabase/mappers/CreditTransactionMapper";
import { IdeaMapper } from "../database/supabase/mappers/IdeaMapper";
import { DocumentMapper } from "../database/supabase/mappers/DocumentMapper";
import { MockAnalysisRepository } from "@/lib/testing/mocks/MockAnalysisRepository";
import { FeatureFlagManager } from "@/lib/testing/FeatureFlagManager";
import { createSupabaseServiceClient } from "../config";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import {
  LocalStorageAnalysisRepository,
  LocalStorageUserRepository,
  LocalStorageIdeaRepository,
  LocalStorageDocumentRepository,
  LocalStorageCreditTransactionRepository,
} from "../database/localStorage";

/**
 * Factory for creating database repository instances
 * Handles repository instantiation with proper dependencies
 *
 * ⚠️ SECURITY: No singleton pattern - creates fresh instance per request
 *
 * This factory MUST be instantiated per request to prevent session leaks.
 * Repositories depend on Supabase client which must be fresh per request.
 *
 * @see docs/SECURITY.md for detailed explanation
 */
export class RepositoryFactory {
  private repositories: Map<
    string,
    | IAnalysisRepository
    | IUserRepository
    | ICreditTransactionRepository
    | IIdeaRepository
    | IDocumentRepository
  > = new Map();
  private featureFlagManager: FeatureFlagManager;
  private readonly serviceSupabaseClient: SupabaseClient | null;
  private static serviceClient: SupabaseClient | null = null;
  private static serviceClientInitFailed = false;

  private constructor(private readonly supabaseClient: SupabaseClient) {
    // Ensure feature flags are initialized before checking LOCAL_STORAGE_MODE
    initFeatureFlags();
    this.featureFlagManager = new FeatureFlagManager();
    this.serviceSupabaseClient = RepositoryFactory.getServiceSupabaseClient();
  }

  private static getServiceSupabaseClient(): SupabaseClient | null {
    if (RepositoryFactory.serviceClient) {
      return RepositoryFactory.serviceClient;
    }

    if (RepositoryFactory.serviceClientInitFailed) {
      return null;
    }

    try {
      RepositoryFactory.serviceClient = createSupabaseServiceClient();
      return RepositoryFactory.serviceClient;
    } catch (error) {
      RepositoryFactory.serviceClientInitFailed = true;
      console.warn(
        "[RepositoryFactory] Supabase service client unavailable; credit transaction writes will use the request client.",
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  /**
   * Create a new RepositoryFactory instance
   *
   * ✅ SAFE: Always creates fresh instance per request
   *
   * @param supabaseClient - Fresh Supabase client from current request
   * @returns New RepositoryFactory instance
   */
  static create(supabaseClient: SupabaseClient): RepositoryFactory {
    return new RepositoryFactory(supabaseClient);
  }

  /**
   * @deprecated Use RepositoryFactory.create() instead
   * This method is kept for backward compatibility but will be removed.
   * It now creates a fresh instance instead of returning a cached singleton.
   */
  static getInstance(supabaseClient: SupabaseClient): RepositoryFactory {
    return RepositoryFactory.create(supabaseClient);
  }

  /**
   * Create configured AnalysisRepository instance
   * Returns LocalStorageAnalysisRepository when LOCAL_STORAGE_MODE is enabled,
   * MockAnalysisRepository when in mock mode, otherwise SupabaseAnalysisRepository
   */
  createAnalysisRepository(): IAnalysisRepository {
    const cacheKey = "analysisRepository";

    if (!this.repositories.has(cacheKey)) {
      // Check if LOCAL_STORAGE_MODE is enabled (Open Source Mode)
      if (isEnabled("LOCAL_STORAGE_MODE")) {
        const repository = new LocalStorageAnalysisRepository();
        this.repositories.set(cacheKey, repository);

        if (process.env.NODE_ENV !== "production") {
          console.log(
            "[RepositoryFactory] ✅ LocalStorage Analysis Repository created (Open Source Mode)"
          );
        }
      } else if (this.featureFlagManager.isMockModeEnabled()) {
        // Create mock repository for testing
        const mockRepository = new MockAnalysisRepository();
        this.repositories.set(cacheKey, mockRepository);

        // Log when mock repository is created (only in non-production)
        if (process.env.NODE_ENV !== "production") {
          console.log(
            "[RepositoryFactory] ✅ Mock Analysis Repository created"
          );
        }
      } else {
        // Create production Supabase repository
        const mapper = new AnalysisMapper();
        const repository = new SupabaseAnalysisRepository(
          this.supabaseClient,
          mapper
        );
        this.repositories.set(cacheKey, repository);
      }
    }

    const repository = this.repositories.get(cacheKey);
    if (!repository) {
      throw new Error("Failed to create AnalysisRepository");
    }
    return repository as IAnalysisRepository;
  }

  /**
   * Create configured UserRepository instance
   * Returns LocalStorageUserRepository when LOCAL_STORAGE_MODE is enabled,
   * otherwise SupabaseUserRepository
   */
  createUserRepository(): IUserRepository {
    const cacheKey = "userRepository";

    if (!this.repositories.has(cacheKey)) {
      // Check if LOCAL_STORAGE_MODE is enabled (Open Source Mode)
      if (isEnabled("LOCAL_STORAGE_MODE")) {
        const repository = new LocalStorageUserRepository();
        this.repositories.set(cacheKey, repository);

        if (process.env.NODE_ENV !== "production") {
          console.log(
            "[RepositoryFactory] ✅ LocalStorage User Repository created (Open Source Mode)"
          );
        }
      } else {
        const mapper = new UserMapper();
        const repository = new SupabaseUserRepository(
          this.supabaseClient,
          mapper
        );
        this.repositories.set(cacheKey, repository);
      }
    }

    const repository = this.repositories.get(cacheKey);
    if (!repository) {
      throw new Error("Failed to create UserRepository");
    }
    return repository as IUserRepository;
  }

  /**
   * Create configured CreditTransactionRepository instance
   * Returns LocalStorageCreditTransactionRepository when LOCAL_STORAGE_MODE is enabled,
   * otherwise SupabaseCreditTransactionRepository
   */
  createCreditTransactionRepository(): ICreditTransactionRepository {
    const cacheKey = "creditTransactionRepository";

    if (!this.repositories.has(cacheKey)) {
      // Check if LOCAL_STORAGE_MODE is enabled (Open Source Mode)
      if (isEnabled("LOCAL_STORAGE_MODE")) {
        const repository = new LocalStorageCreditTransactionRepository();
        this.repositories.set(cacheKey, repository);

        if (process.env.NODE_ENV !== "production") {
          console.log(
            "[RepositoryFactory] ✅ LocalStorage CreditTransaction Repository created (Open Source Mode)"
          );
        }
      } else {
        const mapper = new CreditTransactionMapper();
        const repository = new SupabaseCreditTransactionRepository(
          this.supabaseClient,
          mapper,
          this.serviceSupabaseClient ?? undefined
        );
        this.repositories.set(cacheKey, repository);
      }
    }

    const repository = this.repositories.get(cacheKey);
    if (!repository) {
      throw new Error("Failed to create CreditTransactionRepository");
    }
    return repository as ICreditTransactionRepository;
  }

  /**
   * Create configured IdeaRepository instance
   * Returns LocalStorageIdeaRepository when LOCAL_STORAGE_MODE is enabled,
   * otherwise SupabaseIdeaRepository
   */
  createIdeaRepository(): IIdeaRepository {
    const cacheKey = "ideaRepository";

    if (!this.repositories.has(cacheKey)) {
      // Check if LOCAL_STORAGE_MODE is enabled (Open Source Mode)
      if (isEnabled("LOCAL_STORAGE_MODE")) {
        const repository = new LocalStorageIdeaRepository();
        this.repositories.set(cacheKey, repository);

        if (process.env.NODE_ENV !== "production") {
          console.log(
            "[RepositoryFactory] ✅ LocalStorage Idea Repository created (Open Source Mode)"
          );
        }
      } else {
        const mapper = new IdeaMapper();
        const repository = new SupabaseIdeaRepository(
          this.supabaseClient,
          mapper
        );
        this.repositories.set(cacheKey, repository);
      }
    }

    const repository = this.repositories.get(cacheKey);
    if (!repository) {
      throw new Error("Failed to create IdeaRepository");
    }
    return repository as IIdeaRepository;
  }

  /**
   * Create configured DocumentRepository instance
   * Returns LocalStorageDocumentRepository when LOCAL_STORAGE_MODE is enabled,
   * otherwise SupabaseDocumentRepository
   */
  createDocumentRepository(): IDocumentRepository {
    const cacheKey = "documentRepository";

    if (!this.repositories.has(cacheKey)) {
      // Check if LOCAL_STORAGE_MODE is enabled (Open Source Mode)
      if (isEnabled("LOCAL_STORAGE_MODE")) {
        const repository = new LocalStorageDocumentRepository();
        this.repositories.set(cacheKey, repository);

        if (process.env.NODE_ENV !== "production") {
          console.log(
            "[RepositoryFactory] ✅ LocalStorage Document Repository created (Open Source Mode)"
          );
        }
      } else {
        const mapper = new DocumentMapper();
        const repository = new SupabaseDocumentRepository(
          this.supabaseClient,
          mapper
        );
        this.repositories.set(cacheKey, repository);
      }
    }

    const repository = this.repositories.get(cacheKey);
    if (!repository) {
      throw new Error("Failed to create DocumentRepository");
    }
    return repository as IDocumentRepository;
  }

  /**
   * Clear repository cache (useful for testing)
   */
  clearCache(): void {
    this.repositories.clear();
  }

  /**
   * Get all cached repositories (useful for debugging)
   */
  getCachedRepositories(): string[] {
    return Array.from(this.repositories.keys());
  }
}
