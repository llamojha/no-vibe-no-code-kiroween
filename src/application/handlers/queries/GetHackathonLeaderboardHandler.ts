import { QueryHandler } from '../../types/base/Query';
import { GetHackathonLeaderboardQuery, GetHackathonLeaderboardResult } from '../../types/queries/HackathonQueries';
import { GetHackathonLeaderboardUseCase } from '../../use-cases/GetHackathonLeaderboardUseCase';
import { Category, UserId } from '../../../domain/value-objects';
import { Result, success, failure } from '../../../shared/types/common';
import { ValidationError } from '../../../shared/types/errors';

/**
 * Handler for GetHackathonLeaderboardQuery
 * Delegates to GetHackathonLeaderboardUseCase for business logic execution
 */
export class GetHackathonLeaderboardHandler implements QueryHandler<GetHackathonLeaderboardQuery, GetHackathonLeaderboardResult> {
  constructor(
    private readonly getHackathonLeaderboardUseCase: GetHackathonLeaderboardUseCase
  ) {}

  /**
   * Handle the get hackathon leaderboard query
   */
  async handle(query: GetHackathonLeaderboardQuery): Promise<Result<GetHackathonLeaderboardResult, Error>> {
    try {
      // Convert query to use case input
      const input = {
        category: query.category,
        limit: query.limit,
        includeUserRank: false // Not supported in this query
      };

      // Execute the use case
      const result = await this.getHackathonLeaderboardUseCase.execute(input);

      if (!result.success) {
        return failure(result.error);
      }

      // Convert use case output to query result
      const queryResult: GetHackathonLeaderboardResult = {
        leaderboard: result.data.leaderboard
      };

      return success(queryResult);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error in GetHackathonLeaderboardHandler'));
    }
  }

  /**
   * Validate query data before processing
   */
  validateQuery(data: unknown): Result<GetHackathonLeaderboardQuery, Error> {
    try {
      if (!data || typeof data !== 'object') {
        return failure(new ValidationError('Invalid query data'));
      }

      const queryData = data as any;

      // Validate optional fields
      let category: Category | undefined;
      if (queryData.category) {
        if (typeof queryData.category !== 'string') {
          return failure(new ValidationError('Category must be a string'));
        }
        category = Category.createHackathon(queryData.category);
      }

      let limit = 10; // Default limit
      if (queryData.limit !== undefined) {
        if (typeof queryData.limit !== 'number' || queryData.limit < 1 || queryData.limit > 50) {
          return failure(new ValidationError('Limit must be between 1 and 50'));
        }
        limit = queryData.limit;
      }

      // Create query
      const query = new GetHackathonLeaderboardQuery(
        category,
        limit,
        queryData.correlationId
      );

      return success(query);

    } catch (error) {
      return failure(error instanceof Error ? error : new ValidationError('Query validation failed'));
    }
  }
}