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
          criteria.category = Category.createHackathon(criteriaData.category);
        }

        if (criteriaData.minScore !== undefined && typeof criteriaData.minScore === 'number') {
          criteria.minScore = Score.create(criteriaData.minScore);
        }

        if (criteriaData.maxScore !== undefined && typeof criteriaData.maxScore === 'number') {
          criteria.maxScore = Score.create(criteriaData.maxScore);
        }

        if (criteriaData.hasGithubUrl !== undefined) {
          criteria.hasGithubUrl = Boolean(criteriaData.hasGithubUrl);
        }

        if (criteriaData.hasDemoUrl !== undefined) {
          criteria.hasDemoUrl = Boolean(criteriaData.hasDemoUrl);
        }

        if (criteriaData.hasVideo !== undefined) {
          criteria.hasVideo = Boolean(criteriaData.hasVideo);
        }

        if (criteriaData.teamSize !== undefined) {
          criteria.teamSize = Number(criteriaData.teamSize);
        }

        if (criteriaData.projectNameContains) {
          criteria.projectNameContains = String(criteriaData.projectNameContains);
        }

        if (criteriaData.submittedAfter) {
          criteria.submittedAfter = new Date(criteriaData.submittedAfter as string);
        }

        if (criteriaData.submittedBefore) {
          criteria.submittedBefore = new Date(criteriaData.submittedBefore as string);
        }
      }

      // Create query
      const query = new SearchHackathonAnalysesQuery(
        { page: page as number, limit: limit as number },
        criteria,
        typeof queryData.searchTerm === 'string' ? queryData.searchTerm : undefined,
        typeof queryData.sortBy === 'string' ? queryData.sortBy as 'score' | 'createdAt' | 'updatedAt' | 'projectName' : undefined,
        typeof queryData.sortOrder === 'string' ? queryData.sortOrder as 'asc' | 'desc' : undefined,
        typeof queryData.correlationId === 'string' ? queryData.correlationId : undefined
      );

      return success(query);

    } catch (error) {
      return failure(error instanceof Error ? error : new ValidationError('Query validation failed'));
    }
  }
}