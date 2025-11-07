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

      const queryData = data as any;

      // Validate pagination
      if (!queryData.pagination || typeof queryData.pagination !== 'object') {
        return failure(new ValidationError('Pagination is required'));
      }

      const page = queryData.pagination.page;
      const limit = queryData.pagination.limit;

      if (!page || typeof page !== 'number' || page < 1) {
        return failure(new ValidationError('Page must be a positive number'));
      }

      if (!limit || typeof limit !== 'number' || limit < 1 || limit > 100) {
        return failure(new ValidationError('Limit must be between 1 and 100'));
      }

      // Validate and convert criteria
      const criteria: any = {};

      if (queryData.criteria) {
        if (queryData.criteria.userId) {
          criteria.userId = UserId.fromString(queryData.criteria.userId);
        }

        if (queryData.criteria.category) {
          criteria.category = Category.createGeneral(queryData.criteria.category);
        }

        if (queryData.criteria.locale) {
          criteria.locale = Locale.create(queryData.criteria.locale);
        }

        if (queryData.criteria.minScore !== undefined) {
          criteria.minScore = Score.create(queryData.criteria.minScore);
        }

        if (queryData.criteria.maxScore !== undefined) {
          criteria.maxScore = Score.create(queryData.criteria.maxScore);
        }

        if (queryData.criteria.isCompleted !== undefined) {
          criteria.isCompleted = Boolean(queryData.criteria.isCompleted);
        }

        if (queryData.criteria.createdAfter) {
          criteria.createdAfter = new Date(queryData.criteria.createdAfter);
        }

        if (queryData.criteria.createdBefore) {
          criteria.createdBefore = new Date(queryData.criteria.createdBefore);
        }

        if (queryData.criteria.ideaContains) {
          criteria.ideaContains = String(queryData.criteria.ideaContains);
        }
      }

      // Create query
      const query = new SearchAnalysesQuery(
        { page, limit },
        criteria,
        queryData.searchTerm,
        queryData.sortBy,
        queryData.sortOrder,
        queryData.correlationId
      );

      return success(query);

    } catch (error) {
      return failure(error instanceof Error ? error : new ValidationError('Query validation failed'));
    }
  }
}