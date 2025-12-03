/**
 * Mock Analysis Repository for Testing
 * 
 * Provides an in-memory implementation of IAnalysisRepository for testing purposes.
 * This allows E2E tests to run without requiring a real database connection.
 * 
 * Features:
 * - In-memory storage using Map
 * - Full IAnalysisRepository interface implementation
 * - No external dependencies or network calls
 * - Deterministic behavior for testing
 */

import { Analysis } from '@/src/domain/entities';
import { AnalysisId, UserId, Category, Score } from '@/src/domain/value-objects';
import {
  IAnalysisRepository,
  AnalysisSearchCriteria,
  AnalysisSortOptions,
} from '@/src/domain/repositories/IAnalysisRepository';
import {
  Result,
  success,
  failure,
  PaginatedResult,
  PaginationParams,
  createPaginatedResult,
} from '@/src/shared/types/common';

/**
 * Mock implementation of IAnalysisRepository
 * Stores analyses in memory for testing
 */
export class MockAnalysisRepository implements IAnalysisRepository {
  private analyses: Map<string, Analysis> = new Map();

  constructor() {
    // Initialize with empty storage
  }

  /**
   * Save a new analysis
   */
  async save(analysis: Analysis): Promise<Result<Analysis, Error>> {
    try {
      this.analyses.set(analysis.id.value, analysis);
      return success(analysis);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to save analysis'));
    }
  }

  /**
   * Save multiple analyses atomically
   */
  async saveMany(analyses: Analysis[]): Promise<Result<Analysis[], Error>> {
    try {
      analyses.forEach(analysis => this.analyses.set(analysis.id.value, analysis));
      return success(analyses);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to save analyses'));
    }
  }

  /**
   * Update an existing analysis
   */
  async update(
    analysis: Analysis,
    requestingUserId?: UserId
  ): Promise<Result<Analysis, Error>> {
    try {
      const existing = this.analyses.get(analysis.id.value);
      
      if (!existing) {
        return failure(new Error('Analysis not found'));
      }

      // Check authorization if requesting user is provided
      if (requestingUserId && !existing.userId.equals(requestingUserId)) {
        return failure(new Error('Unauthorized: User does not own this analysis'));
      }

      this.analyses.set(analysis.id.value, analysis);
      return success(analysis);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to update analysis'));
    }
  }

  /**
   * Delete an analysis by ID
   */
  async delete(
    id: AnalysisId,
    requestingUserId?: UserId
  ): Promise<Result<void, Error>> {
    try {
      const analysis = this.analyses.get(id.value);
      
      if (!analysis) {
        return failure(new Error('Analysis not found'));
      }

      // Check authorization if requesting user is provided
      if (requestingUserId && !analysis.userId.equals(requestingUserId)) {
        return failure(new Error('Unauthorized: User does not own this analysis'));
      }

      this.analyses.delete(id.value);
      return success(undefined);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to delete analysis'));
    }
  }

  /**
   * Delete multiple analyses by their IDs
   */
  async deleteMany(ids: AnalysisId[]): Promise<Result<void, Error>> {
    try {
      ids.forEach(id => this.analyses.delete(id.value));
      return success(undefined);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to delete analyses'));
    }
  }

  /**
   * Check if an analysis exists by ID
   */
  async exists(id: AnalysisId): Promise<Result<boolean, Error>> {
    try {
      return success(this.analyses.has(id.value));
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to check analysis existence'));
    }
  }

  /**
   * Delete all analyses for a specific user
   */
  async deleteAllByUserId(userId: UserId): Promise<Result<void, Error>> {
    try {
      const toDelete: string[] = [];
      
      for (const [id, analysis] of this.analyses.entries()) {
        if (analysis.userId.equals(userId)) {
          toDelete.push(id);
        }
      }

      toDelete.forEach(id => this.analyses.delete(id));
      return success(undefined);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to delete analyses'));
    }
  }

  /**
   * Bulk update scores for multiple analyses
   */
  async updateScores(
    updates: Array<{ id: AnalysisId; score: Score }>
  ): Promise<Result<void, Error>> {
    try {
      for (const update of updates) {
        const analysis = this.analyses.get(update.id.value);
        if (analysis) {
          analysis.updateScore(update.score);
          this.analyses.set(update.id.value, analysis);
        }
      }
      return success(undefined);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to update scores'));
    }
  }

  /**
   * Find analysis by ID
   */
  async findById(
    id: AnalysisId,
    requestingUserId?: UserId
  ): Promise<Result<Analysis | null, Error>> {
    try {
      const analysis = this.analyses.get(id.value) || null;
      
      // Check authorization if requesting user is provided
      if (analysis && requestingUserId && !analysis.userId.equals(requestingUserId)) {
        return failure(new Error('Unauthorized: User does not own this analysis'));
      }

      return success(analysis);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find analysis'));
    }
  }

  /**
   * Find all analyses with pagination
   */
  async findAll(params: PaginationParams): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const analyses = Array.from(this.analyses.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      const items = analyses.slice(start, end);
      const paginatedResult = createPaginatedResult(items, analyses.length, params.page, params.limit);
      return success(paginatedResult);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find analyses'));
    }
  }

  /**
   * Find analyses by multiple IDs
   */
  async findByIds(ids: AnalysisId[]): Promise<Result<Analysis[], Error>> {
    try {
      const found = ids
        .map(id => this.analyses.get(id.value) || null)
        .filter((analysis): analysis is Analysis => analysis !== null);
      return success(found);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find analyses by IDs'));
    }
  }

  /**
   * Find analyses matching arbitrary criteria
   */
  async findWhere(criteria: Record<string, unknown>): Promise<Result<Analysis[], Error>> {
    try {
      const filtered = this.filterByCriteria(criteria);
      return success(filtered);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find analyses by criteria'));
    }
  }

  /**
   * Find analyses matching criteria with pagination support
   */
  async findWhereWithPagination(
    criteria: Record<string, unknown>,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const filtered = this.filterByCriteria(criteria).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      const items = filtered.slice(start, end);
      const paginatedResult = createPaginatedResult(items, filtered.length, params.page, params.limit);
      return success(paginatedResult);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find analyses by criteria'));
    }
  }

  /**
   * Find analyses by user ID with pagination
   */
  async findByUserId(
    userId: UserId,
    params: PaginationParams,
    type?: 'idea' | 'hackathon'
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      let userAnalyses = Array.from(this.analyses.values()).filter(a => a.userId.equals(userId));
      userAnalyses = userAnalyses
        .filter(analysis => this.matchesAnalysisType(analysis, type))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = userAnalyses.length;
      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      const items = userAnalyses.slice(start, end);

      const paginatedResult = createPaginatedResult(items, total, params.page, params.limit);
      return success(paginatedResult);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find analyses'));
    }
  }

  /**
   * Find analyses by user ID and specific type
   */
  async findByUserIdAndType(
    userId: UserId,
    type: 'idea' | 'hackathon',
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    return this.findByUserId(userId, params, type);
  }

  /**
   * Find all analyses by user ID (without pagination)
   */
  async findAllByUserId(userId: UserId): Promise<Result<Analysis[], Error>> {
    try {
      const userAnalyses = Array.from(this.analyses.values())
        .filter(a => a.userId.equals(userId))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return success(userAnalyses);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find analyses'));
    }
  }

  /**
   * Find analyses by user ID with pagination and additional options
   */
  async findByUserIdPaginated(
    userId: UserId,
    options: {
      page: number;
      limit: number;
      sortBy?: 'newest' | 'oldest' | 'score' | 'title';
      category?: 'idea' | 'kiroween' | 'all';
      type?: 'idea' | 'hackathon';
    }
  ): Promise<Result<{ analyses: Analysis[]; total: number }, Error>> {
    try {
      let userAnalyses = Array.from(this.analyses.values())
        .filter(a => a.userId.equals(userId));

      // Filter by category if specified
      if (options.category && options.category !== 'all') {
        userAnalyses = userAnalyses.filter(a => {
          if (!a.category) return false;
          return options.category === 'kiroween' ? a.category.isHackathon : !a.category.isHackathon;
        });
      }

      if (options.type) {
        userAnalyses = userAnalyses.filter(a => this.matchesAnalysisType(a, options.type));
      }

      // Sort
      const sortBy = options.sortBy || 'newest';
      userAnalyses.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return b.createdAt.getTime() - a.createdAt.getTime();
          case 'oldest':
            return a.createdAt.getTime() - b.createdAt.getTime();
          case 'score':
            return b.score.value - a.score.value;
          case 'title':
            return a.idea.localeCompare(b.idea);
          default:
            return 0;
        }
      });

      const total = userAnalyses.length;
      const start = (options.page - 1) * options.limit;
      const end = start + options.limit;
      const analyses = userAnalyses.slice(start, end);

      return success({ analyses, total });
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find analyses'));
    }
  }

  /**
   * Search analyses by user with text search
   */
  async searchByUser(
    userId: UserId,
    searchTerm: string,
    options: {
      page: number;
      limit: number;
      sortBy?: 'newest' | 'oldest' | 'score' | 'title';
      category?: 'idea' | 'kiroween' | 'all';
    }
  ): Promise<Result<{ analyses: Analysis[]; total: number }, Error>> {
    try {
      let userAnalyses = Array.from(this.analyses.values())
        .filter(a => a.userId.equals(userId));

      // Filter by search term
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        userAnalyses = userAnalyses.filter(a =>
          a.idea.toLowerCase().includes(lowerSearch) ||
          (a.feedback && a.feedback.toLowerCase().includes(lowerSearch))
        );
      }

      // Filter by category if specified
      if (options.category && options.category !== 'all') {
        userAnalyses = userAnalyses.filter(a => {
          if (!a.category) return false;
          return options.category === 'kiroween' ? a.category.isHackathon : !a.category.isHackathon;
        });
      }

      // Sort
      const sortBy = options.sortBy || 'newest';
      userAnalyses.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return b.createdAt.getTime() - a.createdAt.getTime();
          case 'oldest':
            return a.createdAt.getTime() - b.createdAt.getTime();
          case 'score':
            return b.score.value - a.score.value;
          case 'title':
            return a.idea.localeCompare(b.idea);
          default:
            return 0;
        }
      });

      const total = userAnalyses.length;
      const start = (options.page - 1) * options.limit;
      const end = start + options.limit;
      const analyses = userAnalyses.slice(start, end);

      return success({ analyses, total });
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to search analyses'));
    }
  }

  /**
   * Get analysis counts by type for a user
   */
  async getAnalysisCountsByType(userId: UserId): Promise<
    Result<
      {
        total: number;
        idea: number;
        hackathon: number;
      },
      Error
    >
  > {
    try {
      const userAnalyses = Array.from(this.analyses.values()).filter(a => a.userId.equals(userId));
      const total = userAnalyses.length;
      const hackathon = userAnalyses.filter(a => this.matchesAnalysisType(a, 'hackathon')).length;
      const idea = total - hackathon;
      return success({ total, idea, hackathon });
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to get counts by type'));
    }
  }

  /**
   * Get analysis counts by category for a user
   */
  async getAnalysisCountsByUser(userId: UserId): Promise<
    Result<
      {
        total: number;
        idea: number;
        kiroween: number;
      },
      Error
    >
  > {
    try {
      const countsResult = await this.getAnalysisCountsByType(userId);
      if (!countsResult.success) {
        return failure(countsResult.error);
      }

      const { total, idea, hackathon } = countsResult.data;
      return success({ total, idea, kiroween: hackathon });
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to get counts'));
    }
  }

  /**
   * Get score statistics for a user
   */
  async getScoreStatsByUser(userId: UserId): Promise<
    Result<
      {
        average: number;
        highest: number;
        lowest: number;
      },
      Error
    >
  > {
    try {
      const userAnalyses = Array.from(this.analyses.values())
        .filter(a => a.userId.equals(userId));

      if (userAnalyses.length === 0) {
        return success({ average: 0, highest: 0, lowest: 0 });
      }

      const scores = userAnalyses.map(a => a.score.value);
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const highest = Math.max(...scores);
      const lowest = Math.min(...scores);

      return success({ average, highest, lowest });
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to get score stats'));
    }
  }

  /**
   * Find analyses by category with pagination
   */
  async findByCategory(
    category: Category,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const categoryAnalyses = Array.from(this.analyses.values())
        .filter(a => a.category?.equals(category))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = categoryAnalyses.length;
      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      const items = categoryAnalyses.slice(start, end);

      const paginatedResult = createPaginatedResult(items, total, params.page, params.limit);
      return success(paginatedResult);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find analyses by category'));
    }
  }

  /**
   * Find high-quality analyses (score >= 80)
   */
  async findHighQuality(
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const highQualityAnalyses = Array.from(this.analyses.values())
        .filter(a => a.score.value >= 80)
        .sort((a, b) => b.score.value - a.score.value);

      const total = highQualityAnalyses.length;
      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      const items = highQualityAnalyses.slice(start, end);

      const paginatedResult = createPaginatedResult(items, total, params.page, params.limit);
      return success(paginatedResult);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find high-quality analyses'));
    }
  }

  /**
   * Find recent analyses (created within specified days)
   */
  async findRecent(
    days: number,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentAnalyses = Array.from(this.analyses.values())
        .filter(a => a.createdAt >= cutoffDate)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = recentAnalyses.length;
      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      const items = recentAnalyses.slice(start, end);

      const paginatedResult = createPaginatedResult(items, total, params.page, params.limit);
      return success(paginatedResult);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find recent analyses'));
    }
  }

  /**
   * Search analyses with complex criteria
   */
  async search(
    criteria: AnalysisSearchCriteria,
    sort: AnalysisSortOptions,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      let filtered = Array.from(this.analyses.values());

      // Apply filters
      if (criteria.userId) {
        filtered = filtered.filter(a => a.userId.equals(criteria.userId!));
      }
      if (criteria.category) {
        filtered = filtered.filter(a => a.category?.equals(criteria.category!));
      }
      if (criteria.locale) {
        filtered = filtered.filter(a => a.locale.equals(criteria.locale!));
      }
      if (criteria.minScore) {
        filtered = filtered.filter(a => a.score.value >= criteria.minScore!.value);
      }
      if (criteria.maxScore) {
        filtered = filtered.filter(a => a.score.value <= criteria.maxScore!.value);
      }
      if (criteria.createdAfter) {
        filtered = filtered.filter(a => a.createdAt >= criteria.createdAfter!);
      }
      if (criteria.createdBefore) {
        filtered = filtered.filter(a => a.createdAt <= criteria.createdBefore!);
      }
      if (criteria.ideaContains) {
        const searchTerm = criteria.ideaContains.toLowerCase();
        filtered = filtered.filter(a => a.idea.toLowerCase().includes(searchTerm));
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sort.field) {
          case 'createdAt':
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          case 'updatedAt':
            comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
            break;
          case 'score':
            comparison = a.score.value - b.score.value;
            break;
        }
        return sort.direction === 'asc' ? comparison : -comparison;
      });

      const total = filtered.length;
      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      const items = filtered.slice(start, end);

      const paginatedResult = createPaginatedResult(items, total, params.page, params.limit);
      return success(paginatedResult);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to search analyses'));
    }
  }

  /**
   * Find analyses by user and category
   */
  async findByUserAndCategory(
    userId: UserId,
    category: Category,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const filtered = Array.from(this.analyses.values())
        .filter(a => a.userId.equals(userId) && a.category?.equals(category))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = filtered.length;
      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      const items = filtered.slice(start, end);

      const paginatedResult = createPaginatedResult(items, total, params.page, params.limit);
      return success(paginatedResult);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find analyses'));
    }
  }

  /**
   * Get analysis statistics for a user
   */
  async getUserAnalysisStats(userId: UserId): Promise<
    Result<
      {
        totalCount: number;
        completedCount: number;
        averageScore: number;
        highQualityCount: number;
        categoryCounts: Record<string, number>;
      },
      Error
    >
  > {
    try {
      const userAnalyses = Array.from(this.analyses.values())
        .filter(a => a.userId.equals(userId));

      const totalCount = userAnalyses.length;
      const completedCount = totalCount; // All analyses are considered completed in mock
      const scores = userAnalyses.map(a => a.score.value);
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;
      const highQualityCount = userAnalyses.filter(a => a.score.value >= 80).length;

      const categoryCounts: Record<string, number> = {};
      userAnalyses.forEach(a => {
        if (a.category) {
          const categoryName = a.category.value;
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        }
      });

      return success({
        totalCount,
        completedCount,
        averageScore,
        highQualityCount,
        categoryCounts,
      });
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to get user stats'));
    }
  }

  /**
   * Get global analysis statistics
   */
  async getGlobalStats(): Promise<
    Result<
      {
        totalCount: number;
        averageScore: number;
        topCategories: Array<{ category: string; count: number }>;
        recentCount: number;
      },
      Error
    >
  > {
    try {
      const allAnalyses = Array.from(this.analyses.values());
      const totalCount = allAnalyses.length;
      
      const scores = allAnalyses.map(a => a.score.value);
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;

      const categoryCounts: Record<string, number> = {};
      allAnalyses.forEach(a => {
        if (a.category) {
          const categoryName = a.category.value;
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        }
      });

      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentCount = allAnalyses.filter(a => a.createdAt >= sevenDaysAgo).length;

      return success({
        totalCount,
        averageScore,
        topCategories,
        recentCount,
      });
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to get global stats'));
    }
  }

  /**
   * Find similar analyses based on idea content
   */
  async findSimilar(
    analysis: Analysis,
    limit: number
  ): Promise<Result<Analysis[], Error>> {
    try {
      // Simple similarity based on word overlap
      const words = analysis.idea.toLowerCase().split(/\s+/);
      
      const similar = Array.from(this.analyses.values())
        .filter(a => !a.id.equals(analysis.id))
        .map(a => {
          const otherWords = a.idea.toLowerCase().split(/\s+/);
          const overlap = words.filter(w => otherWords.includes(w)).length;
          return { analysis: a, similarity: overlap };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(item => item.analysis);

      return success(similar);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find similar analyses'));
    }
  }

  /**
   * Get analyses that need attention (low scores, incomplete, etc.)
   */
  async findNeedingAttention(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const needingAttention = Array.from(this.analyses.values())
        .filter(a => a.userId.equals(userId) && a.score.value < 60)
        .sort((a, b) => a.score.value - b.score.value);

      const total = needingAttention.length;
      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      const items = needingAttention.slice(start, end);

      const paginatedResult = createPaginatedResult(items, total, params.page, params.limit);
      return success(paginatedResult);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find analyses needing attention'));
    }
  }

  /**
   * Optimized query for dashboard display
   */
  async findByUserIdForDashboard(
    userId: UserId,
    options: {
      page: number;
      limit: number;
      sortBy?: 'newest' | 'oldest' | 'score' | 'title';
      category?: 'idea' | 'kiroween' | 'all';
    }
  ): Promise<
    Result<
      {
        analyses: Array<{
          id: string;
          title: string;
          createdAt: string;
          score: number;
          category: string;
          summary: string;
        }>;
        total: number;
      },
      Error
    >
  > {
    try {
      let userAnalyses = Array.from(this.analyses.values())
        .filter(a => a.userId.equals(userId));

      // Filter by category if specified
      if (options.category && options.category !== 'all') {
        userAnalyses = userAnalyses.filter(a => {
          if (!a.category) return false;
          return options.category === 'kiroween' ? a.category.isHackathon : !a.category.isHackathon;
        });
      }

      // Sort
      const sortBy = options.sortBy || 'newest';
      userAnalyses.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return b.createdAt.getTime() - a.createdAt.getTime();
          case 'oldest':
            return a.createdAt.getTime() - b.createdAt.getTime();
          case 'score':
            return b.score.value - a.score.value;
          case 'title':
            return a.idea.localeCompare(b.idea);
          default:
            return 0;
        }
      });

      const total = userAnalyses.length;
      const start = (options.page - 1) * options.limit;
      const end = start + options.limit;
      
      const analyses = userAnalyses.slice(start, end).map(a => ({
        id: a.id.value,
        title: a.idea.substring(0, 100),
        createdAt: a.createdAt.toISOString(),
        score: a.score.value,
        category: a.category?.value || 'general',
        summary: a.feedback || a.idea.substring(0, 200),
      }));

      return success({ analyses, total });
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to find analyses for dashboard'));
    }
  }

  /**
   * Clear all analyses (useful for testing)
   */
  clear(): void {
    this.analyses.clear();
  }

  /**
   * Get all analyses (useful for testing)
   */
  getAll(): Analysis[] {
    return Array.from(this.analyses.values());
  }

  /**
   * Get count of analyses (useful for testing)
   */
  async count(): Promise<Result<number, Error>> {
    try {
      return success(this.analyses.size);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to get analysis count'));
    }
  }

  /**
   * Determine if an analysis belongs to the requested type
   */
  private matchesAnalysisType(analysis: Analysis, type?: 'idea' | 'hackathon'): boolean {
    if (!type) {
      return true;
    }

    const isHackathon = analysis.category?.isHackathon === true;
    return type === 'hackathon' ? isHackathon : !isHackathon;
  }

  /**
   * Filter analyses using simple key/value criteria matching
   */
  private filterByCriteria(criteria: Record<string, unknown> = {}): Analysis[] {
    const entries = Object.entries(criteria);
    if (entries.length === 0) {
      return Array.from(this.analyses.values());
    }

    return Array.from(this.analyses.values()).filter(analysis => {
      const record = analysis as unknown as Record<string, unknown>;
      return entries.every(([key, value]) => {
        if (value === undefined) {
          return true;
        }
        return this.valuesMatch(record[key], value);
      });
    });
  }

  private valuesMatch(target: unknown, value: unknown): boolean {
    if (this.hasEquals(target)) {
      return target.equals(value);
    }
    if (this.hasEquals(value)) {
      return value.equals(target);
    }
    return target === value;
  }

  private hasEquals(obj: unknown): obj is { equals(other: unknown): boolean } {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'equals' in obj &&
      typeof (obj as { equals?: (other: unknown) => boolean }).equals === 'function'
    );
  }
}
