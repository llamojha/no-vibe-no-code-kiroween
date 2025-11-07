import { QueryHandler } from '../../types/base/Query';
import { GetAnalysesByUserQuery, GetAnalysesByUserResult } from '../../types/queries/AnalysisQueries';
import { IAnalysisRepository } from '../../../domain/repositories';
import { UserId } from '../../../domain/value-objects';
import { Result, success, failure, createPaginatedResult } from '../../../shared/types/common';
import { ValidationError } from '../../../shared/types/errors';

/**
 * Handler for GetAnalysesByUserQuery
 * Retrieves paginated list of analyses for a specific user
 */
export class ListAnalysesHandler implements QueryHandler<GetAnalysesByUserQuery, GetAnalysesByUserResult> {
  constructor(
    private readonly analysisRepository: IAnalysisRepository
  ) {}

  /**
   * Handle the list analyses query
   */
  async handle(query: GetAnalysesByUserQuery): Promise<Result<GetAnalysesByUserResult, Error>> {
    try {
      // Execute repository query
      const result = await this.analysisRepository.findByUserIdPaginated(
        query.userId,
        {
          page: query.pagination.page,
          limit: query.pagination.limit
        }
      );

      if (!result.success) {
        return failure(result.error);
      }

      // Convert repository result to query result
      const paginatedResult = createPaginatedResult(
        result.data.analyses,
        result.data.total,
        query.pagination.page,
        query.pagination.limit
      );
      
      const queryResult: GetAnalysesByUserResult = {
        analyses: paginatedResult
      };

      return success(queryResult);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error in ListAnalysesHandler'));
    }
  }

  /**
   * Validate query data before processing
   */
  validateQuery(data: unknown): Result<GetAnalysesByUserQuery, Error> {
    try {
      if (!data || typeof data !== 'object') {
        return failure(new ValidationError('Invalid query data'));
      }

      const queryData = data as Record<string, unknown>;

      // Validate required fields
      if (!queryData.userId || typeof queryData.userId !== 'string') {
        return failure(new ValidationError('User ID is required and must be a string'));
      }

      if (!queryData.pagination || typeof queryData.pagination !== 'object') {
        return failure(new ValidationError('Pagination is required'));
      }

      // Validate pagination
      const paginationData = queryData.pagination as Record<string, unknown>;
      const page = paginationData.page;
      const limit = paginationData.limit;

      if (!page || typeof page !== 'number' || page < 1) {
        return failure(new ValidationError('Page must be a positive number'));
      }

      if (!limit || typeof limit !== 'number' || limit < 1 || limit > 100) {
        return failure(new ValidationError('Limit must be between 1 and 100'));
      }

      // Create value objects
      const userId = UserId.fromString(queryData.userId);

      // Create query
      const query = new GetAnalysesByUserQuery(
        userId,
        { page: page as number, limit: limit as number },
        typeof queryData.correlationId === 'string' ? queryData.correlationId : undefined
      );

      return success(query);

    } catch (error) {
      return failure(error instanceof Error ? error : new ValidationError('Query validation failed'));
    }
  }
}