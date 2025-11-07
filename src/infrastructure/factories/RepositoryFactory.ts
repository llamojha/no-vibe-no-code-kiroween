import { SupabaseClient } from '@supabase/supabase-js';
import { IAnalysisRepository } from '../../domain/repositories/IAnalysisRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { SupabaseAnalysisRepository } from '../database/supabase/repositories/SupabaseAnalysisRepository';
import { SupabaseUserRepository } from '../database/supabase/repositories/SupabaseUserRepository';
import { AnalysisMapper } from '../database/supabase/mappers/AnalysisMapper';
import { UserMapper } from '../database/supabase/mappers/UserMapper';

/**
 * Factory for creating database repository instances
 * Handles repository instantiation with proper dependencies
 */
export class RepositoryFactory {
  private static instance: RepositoryFactory;
  private repositories: Map<string, any> = new Map();

  private constructor(
    private readonly supabaseClient: SupabaseClient
  ) {}

  static getInstance(supabaseClient: SupabaseClient): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory(supabaseClient);
    }
    return RepositoryFactory.instance;
  }

  /**
   * Create configured AnalysisRepository instance
   */
  createAnalysisRepository(): IAnalysisRepository {
    const cacheKey = 'analysisRepository';
    
    if (!this.repositories.has(cacheKey)) {
      const mapper = new AnalysisMapper();
      const repository = new SupabaseAnalysisRepository(this.supabaseClient, mapper);
      this.repositories.set(cacheKey, repository);
    }

    return this.repositories.get(cacheKey);
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

    return this.repositories.get(cacheKey);
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