import { UserId } from '../../domain/value-objects';
import { IAnalysisRepository } from '../../domain/repositories';
import { Result, success, failure } from '../../shared/types/common';
import { Analysis } from '../../domain/entities';

/**
 * Input for getting user analyses
 */
export interface GetUserAnalysesInput {
  userId: UserId;
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: 'newest' | 'oldest' | 'score' | 'title';
  category?: 'idea' | 'kiroween' | 'all';
}

/**
 * Output from getting user analyses
 */
export interface GetUserAnalysesOutput {
  analyses: Analysis[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  searchTerm?: string;
  sortBy: string;
  category: string;
}

/**
 * Use case for retrieving user's analyses with filtering and pagination
 * Supports search, sorting, and category filtering
 */
export class GetUserAnalysesUseCase {
  constructor(
    private readonly analysisRepository: IAnalysisRepository
  ) {}

  /**
   * Execute the get user analyses process
   */
  async execute(input: GetUserAnalysesInput): Promise<Result<GetUserAnalysesOutput, Error>> {
    try {
      const page = input.page || 1;
      const limit = input.limit || 10;
      const sortBy = input.sortBy || 'newest';
      const category = input.category || 'all';

      // Validate pagination parameters
      if (page < 1) {
        return failure(new Error('Page number must be greater than 0'));
      }

      if (limit < 1 || limit > 100) {
        return failure(new Error('Limit must be between 1 and 100'));
      }

      // Get analyses from repository
      let analysesResult;

      if (input.searchTerm) {
        // Search analyses
        analysesResult = await this.analysisRepository.searchByUser(
          input.userId,
          input.searchTerm,
          { page, limit, sortBy, category }
        );
      } else {
        // Get all analyses for user
        analysesResult = await this.analysisRepository.findByUserIdPaginated(
          input.userId,
          { page, limit, sortBy, category }
        );
      }

      if (!analysesResult.success) {
        return failure(analysesResult.error);
      }

      const { analyses, total } = analysesResult.data;
      const hasMore = (page * limit) < total;

      const output: GetUserAnalysesOutput = {
        analyses,
        total,
        page,
        limit,
        hasMore,
        searchTerm: input.searchTerm,
        sortBy,
        category
      };

      return success(output);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error getting user analyses'));
    }
  }

  /**
   * Get analysis counts by category for a user
   */
  async getAnalysisCounts(userId: UserId): Promise<Result<{
    total: number;
    idea: number;
    kiroween: number;
  }, Error>> {
    try {
      const countsResult = await this.analysisRepository.getAnalysisCountsByUser(userId);
      
      if (!countsResult.success) {
        return failure(countsResult.error);
      }

      return success(countsResult.data);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error getting analysis counts'));
    }
  }
}