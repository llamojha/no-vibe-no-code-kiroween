import { QueryHandler } from '../../types/base/Query';
import { GetAnalysisByIdQuery, GetAnalysisByIdResult } from '../../types/queries/AnalysisQueries';
import { GetAnalysisUseCase } from '../../use-cases/GetAnalysisUseCase';
import { AnalysisId, UserId } from '../../../domain/value-objects';
import { Result, success, failure } from '../../../shared/types/common';
import { ValidationError } from '../../../shared/types/errors';

/**
 * Handler for GetAnalysisByIdQuery
 * Delegates to GetAnalysisUseCase for business logic execution
 */
export class GetAnalysisHandler implements QueryHandler<GetAnalysisByIdQuery, GetAnalysisByIdResult> {
  constructor(
    private readonly getAnalysisUseCase: GetAnalysisUseCase
  ) {}

  /**
   * Handle the get analysis query
   */
  async handle(query: GetAnalysisByIdQuery): Promise<Result<GetAnalysisByIdResult, Error>> {
    try {
      // Convert query to use case input
      const input = {
        analysisId: query.analysisId,
        userId: query.userId,
        includePrivateData: !!query.userId // Include private data if user is specified
      };

      // Execute the use case
      const result = await this.getAnalysisUseCase.execute(input);

      if (!result.success) {
        return failure(result.error);
      }

      // Convert use case output to query result
      const queryResult: GetAnalysisByIdResult = {
        analysis: result.data.analysis
      };

      return success(queryResult);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error in GetAnalysisHandler'));
    }
  }

  /**
   * Validate query data before processing
   */
  validateQuery(data: unknown): Result<GetAnalysisByIdQuery, Error> {
    try {
      if (!data || typeof data !== 'object') {
        return failure(new ValidationError('Invalid query data'));
      }

      const queryData = data as Record<string, unknown>;

      // Validate required fields
      if (!queryData.analysisId || typeof queryData.analysisId !== 'string') {
        return failure(new ValidationError('Analysis ID is required and must be a string'));
      }

      // Create value objects
      const analysisId = AnalysisId.fromString(queryData.analysisId);
      const userId = queryData.userId && typeof queryData.userId === 'string' 
        ? UserId.fromString(queryData.userId) 
        : undefined;

      // Create query
      const query = new GetAnalysisByIdQuery(
        analysisId,
        userId,
        typeof queryData.correlationId === 'string' ? queryData.correlationId : undefined
      );

      return success(query);

    } catch (error) {
      return failure(error instanceof Error ? error : new ValidationError('Query validation failed'));
    }
  }
}