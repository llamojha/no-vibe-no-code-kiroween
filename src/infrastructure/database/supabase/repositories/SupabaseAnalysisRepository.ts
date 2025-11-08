import { SupabaseClient } from '@supabase/supabase-js';
import { Analysis } from '../../../../domain/entities';
import { AnalysisId, UserId, Category, Score } from '../../../../domain/value-objects';
import { 
  IAnalysisRepository, 
  AnalysisSearchCriteria, 
  AnalysisSortOptions 
} from '../../../../domain/repositories/IAnalysisRepository';
import { Result, PaginatedResult, PaginationParams, success, failure, createPaginatedResult } from '../../../../shared/types/common';
import { Database } from '../../types';
import { DatabaseError, DatabaseQueryError, RecordNotFoundError } from '../../errors';
import { AnalysisMapper } from '../mappers/AnalysisMapper';
import { AnalysisDAO } from '../../types/dao';
import { logger, LogCategory } from '@/lib/logger';

/**
 * Supabase implementation of the Analysis repository
 * Handles all database operations for Analysis entities
 */
export class SupabaseAnalysisRepository implements IAnalysisRepository {
  private readonly tableName = 'saved_analyses';

  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly mapper: AnalysisMapper
  ) {}

  // Command operations (write)

  async save(analysis: Analysis): Promise<Result<Analysis, Error>> {
    logger.debug(LogCategory.DATABASE, 'Saving analysis to database', {
      analysisId: analysis.id.value,
      userId: analysis.userId.value
    });

    const startTime = Date.now();

    try {
      const dao = this.mapper.toDAO(analysis);
      
      const { data, error } = await this.client
        .from(this.tableName)
        .insert(dao)
        .select()
        .single();

      const duration = Date.now() - startTime;

      if (duration > 1000) {
        logger.warn(LogCategory.DATABASE, 'Slow database insert', {
          duration,
          table: this.tableName
        });
      }

      if (error) {
        logger.error(LogCategory.DATABASE, 'Failed to save analysis', {
          error: error.message,
          code: error.code,
          duration
        });
        return failure(new DatabaseQueryError('Failed to save analysis', error, 'INSERT'));
      }

      if (!data) {
        logger.error(LogCategory.DATABASE, 'No data returned from insert', { duration });
        return failure(new DatabaseQueryError('No data returned from insert', null, 'INSERT'));
      }

      logger.info(LogCategory.DATABASE, 'Analysis saved successfully', {
        analysisId: (data as AnalysisDAO).id,
        duration
      });

      const savedAnalysis = this.mapper.toDomain(data as AnalysisDAO);
      return success(savedAnalysis);
    } catch (error) {
      logger.error(LogCategory.DATABASE, 'Unexpected error saving analysis', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      return failure(new DatabaseQueryError('Unexpected error saving analysis', error, 'INSERT'));
    }
  }

  async update(analysis: Analysis): Promise<Result<Analysis, Error>> {
    try {
      const dao = this.mapper.toDAO(analysis);
      
      const { data, error } = await this.client
        .from(this.tableName)
        .update(dao)
        .eq('id', analysis.id.value)
        .select()
        .single();

      if (error) {
        return failure(new DatabaseQueryError('Failed to update analysis', error, 'UPDATE'));
      }

      if (!data) {
        return failure(new RecordNotFoundError('Analysis', analysis.id.value));
      }

      const updatedAnalysis = this.mapper.toDomain(data as AnalysisDAO);
      return success(updatedAnalysis);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error updating analysis', error));
    }
  }

  async delete(id: AnalysisId): Promise<Result<void, Error>> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id.value);

      if (error) {
        return failure(new DatabaseQueryError('Failed to delete analysis', error, 'DELETE'));
      }

      return success(undefined);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error deleting analysis', error));
    }
  }

  async deleteAllByUserId(userId: UserId): Promise<Result<void, Error>> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('user_id', userId.value);

      if (error) {
        return failure(new DatabaseQueryError('Failed to delete user analyses', error, 'DELETE'));
      }

      return success(undefined);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error deleting user analyses', error));
    }
  }

  async updateScores(updates: Array<{ id: AnalysisId; score: Score }>): Promise<Result<void, Error>> {
    try {
      // Supabase doesn't support bulk updates directly, so we'll use a transaction-like approach
      const promises = updates.map(async ({ id, score }) => {
        const { error } = await this.client
          .from(this.tableName)
          .update({ 
            analysis: { score: score.value } // Update the score in the JSON field
          })
          .eq('id', id.value);
        
        if (error) {
          throw new DatabaseQueryError(`Failed to update score for analysis ${id.value}`, error, 'UPDATE');
        }
      });

      await Promise.all(promises);
      return success(undefined);
    } catch (error) {
      return failure(error instanceof Error ? error : new DatabaseQueryError('Unexpected error updating scores', error));
    }
  }

  async saveMany(entities: Analysis[]): Promise<Result<Analysis[], Error>> {
    try {
      const daos = entities.map(entity => this.mapper.toDAO(entity));
      
      const { data, error } = await this.client
        .from(this.tableName)
        .insert(daos)
        .select();

      if (error) {
        return failure(new DatabaseQueryError('Failed to save multiple analyses', error, 'INSERT'));
      }

      const savedAnalyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      return success(savedAnalyses);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error saving multiple analyses', error));
    }
  }

  async deleteMany(ids: AnalysisId[]): Promise<Result<void, Error>> {
    try {
      const idValues = ids.map(id => id.value);
      
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .in('id', idValues);

      if (error) {
        return failure(new DatabaseQueryError('Failed to delete multiple analyses', error, 'DELETE'));
      }

      return success(undefined);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error deleting multiple analyses', error));
    }
  }

  // Query operations (read)

  async findById(id: AnalysisId): Promise<Result<Analysis | null, Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id.value)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return success(null);
        }
        return failure(new DatabaseQueryError('Failed to find analysis by ID', error, 'SELECT'));
      }

      const analysis = this.mapper.toDomain(data as AnalysisDAO);
      return success(analysis);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error finding analysis by ID', error));
    }
  }

  async exists(id: AnalysisId): Promise<Result<boolean, Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('id')
        .eq('id', id.value)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return success(false);
        }
        return failure(new DatabaseQueryError('Failed to check analysis existence', error, 'SELECT'));
      }

      return success(!!data);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error checking analysis existence', error));
    }
  }

  async count(): Promise<Result<number, Error>> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        return failure(new DatabaseQueryError('Failed to count analyses', error, 'COUNT'));
      }

      return success(count || 0);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error counting analyses', error));
    }
  }

  async findAll(params: PaginationParams): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;
      
      const { data, error, count } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(new DatabaseQueryError('Failed to find all analyses', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      const paginatedResult = createPaginatedResult(analyses, count || 0, params.page, params.limit);
      
      return success(paginatedResult);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error finding all analyses', error));
    }
  }

  async findByIds(ids: AnalysisId[]): Promise<Result<Analysis[], Error>> {
    try {
      const idValues = ids.map(id => id.value);
      
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .in('id', idValues);

      if (error) {
        return failure(new DatabaseQueryError('Failed to find analyses by IDs', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      return success(analyses);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error finding analyses by IDs', error));
    }
  }

  async findWhere(criteria: Record<string, unknown>): Promise<Result<Analysis[], Error>> {
    try {
      let query = this.client.from(this.tableName).select('*');
      
      // Apply criteria filters
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;

      if (error) {
        return failure(new DatabaseQueryError('Failed to find analyses with criteria', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      return success(analyses);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error finding analyses with criteria', error));
    }
  }

  async findWhereWithPagination(
    criteria: Record<string, unknown>, 
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact' });
      
      // Apply criteria filters
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(new DatabaseQueryError('Failed to find analyses with criteria and pagination', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      const paginatedResult = createPaginatedResult(analyses, count || 0, params.page, params.limit);
      
      return success(paginatedResult);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error finding analyses with criteria and pagination', error));
    }
  }

  // Analysis-specific query methods

  async findByUserId(
    userId: UserId, 
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    return this.findWhereWithPagination({ user_id: userId.value }, params);
  }

  // Method for finding all analyses by user ID without pagination
  async findAllByUserId(userId: UserId): Promise<Result<Analysis[], Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId.value)
        .order('created_at', { ascending: false });

      if (error) {
        return failure(new DatabaseQueryError('Failed to find analyses by user ID', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      return success(analyses);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error finding analyses by user ID', error));
    }
  }

  async findByUserIdPaginated(
    userId: UserId,
    options: {
      page: number;
      limit: number;
      sortBy?: 'newest' | 'oldest' | 'score' | 'title';
      category?: 'idea' | 'kiroween' | 'all';
    }
  ): Promise<Result<{ analyses: Analysis[]; total: number }, Error>> {
    try {
      const offset = (options.page - 1) * options.limit;
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('user_id', userId.value);

      // Apply category filter
      if (options.category && options.category !== 'all') {
        query = query.contains('analysis', { category: options.category });
      }

      // Apply sorting
      switch (options.sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'score':
          query = query.order('analysis->score', { ascending: false });
          break;
        case 'title':
          query = query.order('idea', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error, count } = await query
        .range(offset, offset + options.limit - 1);

      if (error) {
        return failure(new DatabaseQueryError('Failed to find analyses by user ID with pagination', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      return success({ analyses, total: count || 0 });
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error finding analyses by user ID with pagination', error));
    }
  }

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
      const offset = (options.page - 1) * options.limit;
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('user_id', userId.value);

      // Apply search filter
      query = query.or(`idea.ilike.%${searchTerm}%,analysis->detailedSummary.ilike.%${searchTerm}%`);

      // Apply category filter
      if (options.category && options.category !== 'all') {
        query = query.contains('analysis', { category: options.category });
      }

      // Apply sorting
      switch (options.sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'score':
          query = query.order('analysis->score', { ascending: false });
          break;
        case 'title':
          query = query.order('idea', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error, count } = await query
        .range(offset, offset + options.limit - 1);

      if (error) {
        return failure(new DatabaseQueryError('Failed to search analyses by user', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      return success({ analyses, total: count || 0 });
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error searching analyses by user', error));
    }
  }

  async getAnalysisCountsByUser(userId: UserId): Promise<Result<{
    total: number;
    idea: number;
    kiroween: number;
  }, Error>> {
    try {
      // Get total count
      const { count: totalCount, error: totalError } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId.value);

      if (totalError) {
        return failure(new DatabaseQueryError('Failed to get total analysis count', totalError, 'COUNT'));
      }

      // Get idea count
      const { count: ideaCount, error: ideaError } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId.value)
        .contains('analysis', { category: 'idea' });

      if (ideaError) {
        return failure(new DatabaseQueryError('Failed to get idea analysis count', ideaError, 'COUNT'));
      }

      // Get kiroween count
      const { count: kiroweenCount, error: kiroweenError } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId.value)
        .contains('analysis', { category: 'kiroween' });

      if (kiroweenError) {
        return failure(new DatabaseQueryError('Failed to get kiroween analysis count', kiroweenError, 'COUNT'));
      }

      return success({
        total: totalCount || 0,
        idea: ideaCount || 0,
        kiroween: kiroweenCount || 0
      });
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error getting analysis counts by user', error));
    }
  }

  async getScoreStatsByUser(userId: UserId): Promise<Result<{
    average: number;
    highest: number;
    lowest: number;
  }, Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('analysis->score')
        .eq('user_id', userId.value);

      if (error) {
        return failure(new DatabaseQueryError('Failed to get score stats by user', error, 'SELECT'));
      }

      if (data.length === 0) {
        return success({ average: 0, highest: 0, lowest: 0 });
      }

      const scores = data
        .map(row => row.score)
        .filter(score => typeof score === 'number' && score > 0) as number[];

      if (scores.length === 0) {
        return success({ average: 0, highest: 0, lowest: 0 });
      }

      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const highest = Math.max(...scores);
      const lowest = Math.min(...scores);

      return success({ average, highest, lowest });
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error getting score stats by user', error));
    }
  }

  async findByCategory(
    category: Category, 
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;
      
      // Query analyses where the JSON analysis field contains the category
      const { data, error, count } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .contains('analysis', { category: category.value })
        .order('created_at', { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(new DatabaseQueryError('Failed to find analyses by category', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      const paginatedResult = createPaginatedResult(analyses, count || 0, params.page, params.limit);
      
      return success(paginatedResult);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error finding analyses by category', error));
    }
  }

  async findHighQuality(params: PaginationParams): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;
      
      // Query analyses where the JSON analysis field has score >= 80
      const { data, error, count } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .gte('analysis->score', 80)
        .order('analysis->score', { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(new DatabaseQueryError('Failed to find high quality analyses', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      const paginatedResult = createPaginatedResult(analyses, count || 0, params.page, params.limit);
      
      return success(paginatedResult);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error finding high quality analyses', error));
    }
  }

  async findRecent(
    days: number, 
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const { data, error, count } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(new DatabaseQueryError('Failed to find recent analyses', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      const paginatedResult = createPaginatedResult(analyses, count || 0, params.page, params.limit);
      
      return success(paginatedResult);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error finding recent analyses', error));
    }
  }

  async search(
    criteria: AnalysisSearchCriteria,
    sort: AnalysisSortOptions,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Apply search criteria
      if (criteria.userId) {
        query = query.eq('user_id', criteria.userId.value);
      }
      
      if (criteria.minScore) {
        query = query.gte('analysis->score', criteria.minScore.value);
      }
      
      if (criteria.maxScore) {
        query = query.lte('analysis->score', criteria.maxScore.value);
      }
      
      if (criteria.createdAfter) {
        query = query.gte('created_at', criteria.createdAfter.toISOString());
      }
      
      if (criteria.createdBefore) {
        query = query.lte('created_at', criteria.createdBefore.toISOString());
      }
      
      if (criteria.ideaContains) {
        query = query.ilike('idea', `%${criteria.ideaContains}%`);
      }

      // Apply sorting
      const sortField = sort.field === 'score' ? 'analysis->score' : sort.field;
      query = query.order(sortField, { ascending: sort.direction === 'asc' });

      const { data, error, count } = await query
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(new DatabaseQueryError('Failed to search analyses', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      const paginatedResult = createPaginatedResult(analyses, count || 0, params.page, params.limit);
      
      return success(paginatedResult);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error searching analyses', error));
    }
  }

  async findByUserAndCategory(
    userId: UserId,
    category: Category,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;
      
      const { data, error, count } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('user_id', userId.value)
        .contains('analysis', { category: category.value })
        .order('created_at', { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(new DatabaseQueryError('Failed to find analyses by user and category', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      const paginatedResult = createPaginatedResult(analyses, count || 0, params.page, params.limit);
      
      return success(paginatedResult);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error finding analyses by user and category', error));
    }
  }

  async getUserAnalysisStats(userId: UserId): Promise<Result<{
    totalCount: number;
    completedCount: number;
    averageScore: number;
    highQualityCount: number;
    categoryCounts: Record<string, number>;
  }, Error>> {
    try {
      // Get basic counts and stats
      const { data: analyses, error } = await this.client
        .from(this.tableName)
        .select('analysis')
        .eq('user_id', userId.value);

      if (error) {
        return failure(new DatabaseQueryError('Failed to get user analysis stats', error, 'SELECT'));
      }

      const totalCount = analyses.length;
      const completedCount = analyses.filter(a => a.analysis && typeof a.analysis === 'object' && 'score' in a.analysis).length;
      
      const scores = analyses
        .map(a => a.analysis && typeof a.analysis === 'object' && 'score' in a.analysis ? Number(a.analysis.score) : 0)
        .filter(score => score > 0);
      
      const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      const highQualityCount = scores.filter(score => score >= 80).length;
      
      // Count categories (simplified - would need more complex logic for real implementation)
      const categoryCounts: Record<string, number> = {};
      
      return success({
        totalCount,
        completedCount,
        averageScore,
        highQualityCount,
        categoryCounts,
      });
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error getting user analysis stats', error));
    }
  }

  async getGlobalStats(): Promise<Result<{
    totalCount: number;
    averageScore: number;
    topCategories: Array<{ category: string; count: number }>;
    recentCount: number;
  }, Error>> {
    try {
      const { data: analyses, error } = await this.client
        .from(this.tableName)
        .select('analysis, created_at');

      if (error) {
        return failure(new DatabaseQueryError('Failed to get global stats', error, 'SELECT'));
      }

      const totalCount = analyses.length;
      
      const scores = analyses
        .map(a => a.analysis && typeof a.analysis === 'object' && 'score' in a.analysis ? Number(a.analysis.score) : 0)
        .filter(score => score > 0);
      
      const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      
      // Count recent analyses (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentCount = analyses.filter(a => 
        a.created_at && new Date(a.created_at) >= sevenDaysAgo
      ).length;

      return success({
        totalCount,
        averageScore,
        topCategories: [], // Simplified for now
        recentCount,
      });
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error getting global stats', error));
    }
  }

  async findSimilar(
    analysis: Analysis,
    limit: number
  ): Promise<Result<Analysis[], Error>> {
    try {
      // Simple similarity search based on idea text (would use vector search in production)
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .neq('id', analysis.id.value)
        .limit(limit);

      if (error) {
        return failure(new DatabaseQueryError('Failed to find similar analyses', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      return success(analyses);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error finding similar analyses', error));
    }
  }

  async findNeedingAttention(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;
      
      // Find analyses with low scores (< 60) or incomplete
      const { data, error, count } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('user_id', userId.value)
        .lt('analysis->score', 60)
        .order('analysis->score', { ascending: true })
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(new DatabaseQueryError('Failed to find analyses needing attention', error, 'SELECT'));
      }

      const analyses = data.map(dao => this.mapper.toDomain(dao as AnalysisDAO));
      const paginatedResult = createPaginatedResult(analyses, count || 0, params.page, params.limit);
      
      return success(paginatedResult);
    } catch (error) {
      return failure(new DatabaseQueryError('Unexpected error finding analyses needing attention', error));
    }
  }
}
