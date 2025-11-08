import { Analysis } from '../entities';
import { AnalysisId, UserId, Category, Locale, Score } from '../value-objects';
import { ICommandRepository, IQueryRepository } from './base/IRepository';
import { Result, PaginatedResult, PaginationParams } from '../../shared/types/common';

/**
 * Search criteria for analysis queries
 */
export interface AnalysisSearchCriteria {
  userId?: UserId;
  category?: Category;
  locale?: Locale;
  minScore?: Score;
  maxScore?: Score;
  isCompleted?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  ideaContains?: string;
}

/**
 * Sorting options for analysis queries
 */
export interface AnalysisSortOptions {
  field: 'createdAt' | 'updatedAt' | 'score';
  direction: 'asc' | 'desc';
}

/**
 * Command repository interface for Analysis write operations
 */
export interface IAnalysisCommandRepository extends ICommandRepository<Analysis, AnalysisId> {
  /**
   * Save a new analysis with validation
   */
  save(analysis: Analysis): Promise<Result<Analysis, Error>>;

  /**
   * Update an existing analysis
   */
  update(analysis: Analysis): Promise<Result<Analysis, Error>>;

  /**
   * Delete an analysis by ID
   */
  delete(id: AnalysisId): Promise<Result<void, Error>>;

  /**
   * Delete all analyses for a specific user
   */
  deleteAllByUserId(userId: UserId): Promise<Result<void, Error>>;

  /**
   * Bulk update scores for multiple analyses
   */
  updateScores(updates: Array<{ id: AnalysisId; score: Score }>): Promise<Result<void, Error>>;
}

/**
 * Query repository interface for Analysis read operations
 */
export interface IAnalysisQueryRepository extends IQueryRepository<Analysis, AnalysisId> {
  /**
   * Find analyses by user ID with pagination
   */
  findByUserId(
    userId: UserId, 
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;

  /**
   * Find all analyses by user ID (without pagination)
   */
  findAllByUserId(userId: UserId): Promise<Result<Analysis[], Error>>;

  /**
   * Find analyses by user ID with pagination and additional options
   */
  findByUserIdPaginated(
    userId: UserId,
    options: {
      page: number;
      limit: number;
      sortBy?: 'newest' | 'oldest' | 'score' | 'title';
      category?: 'idea' | 'kiroween' | 'all';
    }
  ): Promise<Result<{ analyses: Analysis[]; total: number }, Error>>;

  /**
   * Search analyses by user with text search
   */
  searchByUser(
    userId: UserId,
    searchTerm: string,
    options: {
      page: number;
      limit: number;
      sortBy?: 'newest' | 'oldest' | 'score' | 'title';
      category?: 'idea' | 'kiroween' | 'all';
    }
  ): Promise<Result<{ analyses: Analysis[]; total: number }, Error>>;

  /**
   * Get analysis counts by category for a user
   */
  getAnalysisCountsByUser(userId: UserId): Promise<Result<{
    total: number;
    idea: number;
    kiroween: number;
  }, Error>>;

  /**
   * Get score statistics for a user
   */
  getScoreStatsByUser(userId: UserId): Promise<Result<{
    average: number;
    highest: number;
    lowest: number;
  }, Error>>;

  /**
   * Find analyses by category with pagination
   */
  findByCategory(
    category: Category, 
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;

  /**
   * Find high-quality analyses (score >= 80)
   */
  findHighQuality(params: PaginationParams): Promise<Result<PaginatedResult<Analysis>, Error>>;

  /**
   * Find recent analyses (created within specified days)
   */
  findRecent(
    days: number, 
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;

  /**
   * Search analyses with complex criteria
   */
  search(
    criteria: AnalysisSearchCriteria,
    sort: AnalysisSortOptions,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;

  /**
   * Find analyses by user and category
   */
  findByUserAndCategory(
    userId: UserId,
    category: Category,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;

  /**
   * Get analysis statistics for a user
   */
  getUserAnalysisStats(userId: UserId): Promise<Result<{
    totalCount: number;
    completedCount: number;
    averageScore: number;
    highQualityCount: number;
    categoryCounts: Record<string, number>;
  }, Error>>;

  /**
   * Get global analysis statistics
   */
  getGlobalStats(): Promise<Result<{
    totalCount: number;
    averageScore: number;
    topCategories: Array<{ category: string; count: number }>;
    recentCount: number;
  }, Error>>;

  /**
   * Find similar analyses based on idea content
   */
  findSimilar(
    analysis: Analysis,
    limit: number
  ): Promise<Result<Analysis[], Error>>;

  /**
   * Get analyses that need attention (low scores, incomplete, etc.)
   */
  findNeedingAttention(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;
}

/**
 * Combined Analysis repository interface
 * Provides both command and query operations
 */
export interface IAnalysisRepository extends IAnalysisCommandRepository, IAnalysisQueryRepository {
  // Inherits all methods from both command and query repositories
}