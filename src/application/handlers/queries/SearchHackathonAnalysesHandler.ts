import { QueryHandler } from '../../types/base/Query';
import { SearchHackathonAnalysesQuery, SearchHackathonAnalysesResult } from '../../types/queries/HackathonQueries';
import { IHackathonAnalysisRepository } from '../../../domain/repositories';
import { UserId, Category, Score } from '../../../domain/value-objects';
import { Result, success, failure } from '../../../shared/types/common';
import { ValidationError } from '../../../shared/types/errors';

/**
 * Handler for SearchHackathonAnalysesQuery
 * Performs complex search operations on hackathon analyses with filtering and sorting
 */
export class SearchHackathonAnalysesHandler implements QueryHandler<SearchHackathonAnalysesQuery, SearchHackathonAnalysesResult> {
  constructor(
    private readonly hackathonRepository: IHackathonAnalysisRepository
  ) {}

  /**
   * Handle the search hackathon analyses query
   */
  async handle(query: SearchHackathonAnalysesQuery): Promise<Result<SearchHackathonAnalysesResult, Error>> {
    try {
      // Convert query criteria to repository search criteria
      const searchCriteria = {
        userId: query.criteria.userId,
        category: query.criteria.category,
        minScore: query.criteria.minScore,
        maxScore: query.criteria.maxScore,
        hasGithubUrl: query.criteria.hasGithubUrl,
        hasDemoUrl: query.criteria.hasDemoUrl,
        hasVideo: query.criteria.hasVideo,
        teamSize: query.criteria.teamSize,
        projectNameContains: query.criteria.projectNameContains,
        submittedAfter: query.criteria.submittedAfter,
        submittedBefore: query.criteria.submittedBefore,
        searchTerm: query.searchTerm,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      };

      // Execute repository search
      const result = await this.hackathonRepository.searchHackathonAnalyses(
        searchCriteria,
        query.pagination
      );

      if (!result.success) {
        return failure(result.error);
      }

      // Convert repository result to query result
      const queryResult: SearchHackathonAnalysesResult = {
        analyses: result.data
      };

      return success(queryResult);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error in SearchHackathonAnalysesHandler'));
    }
  }

  /**
   * Validate query data before processing
   */
  validateQuery(data: unknown): Result<SearchHackathonAnalysesQuery, Error> {
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
          criteria.category = Category.createHackathon(queryData.criteria.category);
        }

        if (queryData.criteria.minScore !== undefined) {
          criteria.minScore = Score.create(queryData.criteria.minScore);
        }

        if (queryData.criteria.maxScore !== undefined) {
          criteria.maxScore = Score.create(queryData.criteria.maxScore);
        }

        if (queryData.criteria.hasGithubUrl !== undefined) {
          criteria.hasGithubUrl = Boolean(queryData.criteria.hasGithubUrl);
        }

        if (queryData.criteria.hasDemoUrl !== undefined) {
          criteria.hasDemoUrl = Boolean(queryData.criteria.hasDemoUrl);
        }

        if (queryData.criteria.hasVideo !== undefined) {
          criteria.hasVideo = Boolean(queryData.criteria.hasVideo);
        }

        if (queryData.criteria.teamSize !== undefined) {
          criteria.teamSize = Number(queryData.criteria.teamSize);
        }

        if (queryData.criteria.projectNameContains) {
          criteria.projectNameContains = String(queryData.criteria.projectNameContains);
        }

        if (queryData.criteria.submittedAfter) {
          criteria.submittedAfter = new Date(queryData.criteria.submittedAfter);
        }

        if (queryData.criteria.submittedBefore) {
          criteria.submittedBefore = new Date(queryData.criteria.submittedBefore);
        }
      }

      // Create query
      const query = new SearchHackathonAnalysesQuery(
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