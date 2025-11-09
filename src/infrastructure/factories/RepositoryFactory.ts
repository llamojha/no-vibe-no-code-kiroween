import { SupabaseClient } from '@supabase/supabase-js';
import { IAnalysisRepository } from '../../domain/repositories/IAnalysisRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { SupabaseAnalysisRepository } from '../database/supabase/repositories/SupabaseAnalysisRepository';
import { SupabaseUserRepository } from '../database/supabase/repositories/SupabaseUserRepository';
import { AnalysisMapper } from '../database/supabase/mappers/AnalysisMapper';
import { UserMapper } from '../database/supabase/mappers/UserMapper';
import { MockAnalysisRepository } from '@/lib/testing/mocks/MockAnalysisRepository';
import { FeatureFlagManager } from '@/lib/testing/FeatureFlagManager';

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
  private repositories: Map<string, IAnalysisRepository | IUserRepository> = new Map();
  private featureFlagManager: FeatureFlagManager;

  private constructor(
    private readonly supabaseClient: SupabaseClient
  ) {
    this.featureFlagManager = new FeatureFlagManager();
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
   * Returns MockAnalysisRepository when in mock mode, otherwise SupabaseAnalysisRepository
   */
  createAnalysisRepository(): IAnalysisRepository {
    const cacheKey = 'analysisRepository';
    
    if (!this.repositories.has(cacheKey)) {
      // Check if mock mode is enabled
      if (this.featureFlagManager.isMockModeEnabled()) {
        // Create mock repository for testing
        const mockRepository = new MockAnalysisRepository();
        this.repositories.set(cacheKey, mockRepository);
        
        // Log when mock repository is created (only in non-production)
        if (process.env.NODE_ENV !== 'production') {
          console.log('[RepositoryFactory] ✅ Mock Analysis Repository created');
        }
      } else {
        // Create production Supabase repository
        const mapper = new AnalysisMapper();
        const repository = new SupabaseAnalysisRepository(this.supabaseClient, mapper);
        this.repositories.set(cacheKey, repository);
      }
    }

    const repository = this.repositories.get(cacheKey);
    if (!repository) {
      throw new Error('Failed to create AnalysisRepository');
    }
    return repository as IAnalysisRepository;
  }

  /**
   * Create configured UserRepository instance
   */
  createUserRepository(): IUserRepository {
    const cacheKey = 'userRepository';
    
    if (!this.repositories.has(cacheKey)) {
      const mapper = new UserMapper();
      const repository = new SupabaseUserRepository(this.supabaseClient, mapper);
      this.repositories.set(cacheKey, repository);
    }

    const repository = this.repositories.get(cacheKey);
    if (!repository) {
      throw new Error('Failed to create UserRepository');
    }
    return repository as IUserRepository;
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