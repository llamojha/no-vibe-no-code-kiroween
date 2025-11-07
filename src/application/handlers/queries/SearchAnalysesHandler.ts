import { QueryHandler } from '../../types/base/Query';
import { SearchAnalysesQuery, SearchAnalysesResult } from '../../types/queries/AnalysisQueries';
import { IAnalysisRepository } from '../../../domain/repositories';
import { UserId, Category, Locale, Score } from '../../../domain/value-objects';
import { Result, success, failure } from '../../../shared/types/common';
import { ValidationError } from '../../../shared/types/errors';

/**
 * Handler for SearchAnalysesQuery
 * Performs complex search operations on analyses with filtering and sorting
 */
export class SearchAnalysesHandler implements QueryHandler<SearchAnalysesQuery, SearchAnalysesResult> {
  constructor(
    private readonly analysisRepository: IAnalysisRepository
  ) {}

  /**
   * Handle the search analyses query
   */
  async handle(query: SearchAnalysesQuery): Promise<Result<SearchAnalysesResult, Error>> {
    try {
      // Convert query criteria to repository search criteria
      const searchCriteria = {
        userId: query.criteria.userId,
        category: query.criteria.category,
        locale: query.criteria.locale,
        minScore: query.criteria.minScore,
        maxScore: query.criteria.maxScore,
        isCompleted: query.criteria.isCompleted,
        createdAfter: query.criteria.createdAfter,
        createdBefore: query.criteria.createdBefore,
        ideaContains: query.criteria.ideaContains
      };

      // Convert sort options
      const sortOptions = {
        field: query.sortBy === 'score' ? 'score' as const : 'createdAt' as const,
        direction: query.sortOrder === 'desc' ? 'desc' as const : 'asc' as const
      };

      // Convert pagination
      const paginationParams = {
        page: query.pagination.page,
        limit: query.pagination.limit
      };

      // Execute repository search
      const result = await this.analysisRepository.search(searchCriteria, sortOptions, paginationParams);

      if (!result.success) {
        return failure(result.error);
      }

      // Repository already returns paginated result
      const queryResult: SearchAnalysesResult = {
        analyses: result.data
      };

      return success(queryResult);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error in SearchAnalysesHandler'));
    }
  }

  /**
   * Validate query data before processing
   */
  validateQuery(data: unknown): Result<SearchAnalysesQuery, Error> {
    try {
      if (!data || typeof data !== 'object') {
        return failure(new ValidationError('Invalid query data'));
      }

      const queryData = data as Record<string, unknown>;

      // Validate pagination
      if (!queryData.pagination || typeof queryData.pagination !== 'object') {
        return failure(new ValidationError('Pagination is required'));
      }

      const paginationData = queryData.pagination as Record<string, unknown>;
      const page = paginationData.page;
      const limit = paginationData.limit;

      if (!page || typeof page !== 'number' || page < 1) {
        return failure(new ValidationError('Page must be a positive number'));
      }

      if (!limit || typeof limit !== 'number' || limit < 1 || limit > 100) {
        return failure(new ValidationError('Limit must be between 1 and 100'));
      }

      // Validate and convert criteria
      const criteria: Record<string, unknown> = {};

      if (queryData.criteria) {
        const criteriaData = queryData.criteria as Record<string, unknown>;
        
        if (criteriaData.userId && typeof criteriaData.userId === 'string') {
          criteria.userId = UserId.fromString(criteriaData.userId);
        }

        if (criteriaData.category && typeof criteriaData.category === 'string') {
          criteria.category = Category.createGeneral(criteriaData.category);
        }

        if (criteriaData.locale && typeof criteriaData.locale === 'string') {
          criteria.locale = Locale.create(criteriaData.locale);
        }

        if (criteriaData.minScore !== undefined && typeof criteriaData.minScore === 'number') {
          criteria.minScore = Score.create(criteriaData.minScore);
        }

        if (criteriaData.maxScore !== undefined && typeof criteriaData.maxScore === 'number') {
          criteria.maxScore = Score.create(criteriaData.maxScore);
        }

        if (criteriaData.isCompleted !== undefined) {
          criteria.isCompleted = Boolean(criteriaData.isCompleted);
        }

        if (criteriaData.createdAfter) {
          criteria.createdAfter = new Date(criteriaData.createdAfter as string);
        }

        if (criteriaData.createdBefore) {
          criteria.createdBefore = new Date(criteriaData.createdBefore as string);
        }

        if (criteriaData.ideaContains) {
          criteria.ideaContains = String(criteriaData.ideaContains);
        }
      }

      // Create query
      const query = new SearchAnalysesQuery(
        { page: page as number, limit: limit as number },
        criteria,
        typeof queryData.searchTerm === 'string' ? queryData.searchTerm : undefined,
        typeof queryData.sortBy === 'string' ? queryData.sortBy as 'score' | 'createdAt' | 'updatedAt' : undefined,
        typeof queryData.sortOrder === 'string' ? queryData.sortOrder as 'asc' | 'desc' : undefined,
        typeof queryData.correlationId === 'string' ? queryData.correlationId : undefined
      );

      return success(query);

    } catch (error) {
      return failure(error instanceof Error ? error : new ValidationError('Query validation failed'));
    }
  }
}