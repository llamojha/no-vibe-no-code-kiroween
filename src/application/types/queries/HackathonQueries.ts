import { z } from 'zod';
import { BaseQuery, PaginatedQuery, SearchQuery, createQuerySchema } from '../base/Query';
import { AnalysisId, UserId, Category, Score } from '../../../domain/value-objects';
import { Analysis } from '../../../domain/entities';
import { PaginationParams, PaginatedResult } from '../../../shared/types/common';
import { HackathonProjectMetadata } from '../../../domain/services';
import { HackathonLeaderboardEntry } from '../../../domain/repositories';

/**
 * Query to get hackathon analysis by ID with metadata
 */
export class GetHackathonAnalysisByIdQuery extends BaseQuery {
  constructor(
    public readonly analysisId: AnalysisId,
    correlationId?: string
  ) {
    super('GET_HACKATHON_ANALYSIS_BY_ID', correlationId);
  }
}

/**
 * Query to get hackathon analyses by category
 */
export class GetHackathonAnalysesByCategoryQuery extends PaginatedQuery {
  constructor(
    public readonly category: Category,
    pagination: PaginationParams,
    correlationId?: string
  ) {
    super('GET_HACKATHON_ANALYSES_BY_CATEGORY', pagination, correlationId);
  }
}

/**
 * Query to get hackathon leaderboard
 */
export class GetHackathonLeaderboardQuery extends BaseQuery {
  constructor(
    public readonly category?: Category,
    public readonly limit: number = 10,
    correlationId?: string
  ) {
    super('GET_HACKATHON_LEADERBOARD', correlationId);
  }
}

/**
 * Validation schema for GetHackathonLeaderboardQuery
 */
export const GetHackathonLeaderboardQuerySchema = createQuerySchema(
  z.object({
    category: z.enum(['resurrection', 'frankenstein', 'skeleton-crew', 'costume-contest']).optional(),
    limit: z.number().min(1).max(50).optional()
  })
);

/**
 * Query to search hackathon analyses
 */
export class SearchHackathonAnalysesQuery extends SearchQuery {
  constructor(
    pagination: PaginationParams,
    public readonly criteria: {
      userId?: UserId;
      category?: Category;
      minScore?: Score;
      maxScore?: Score;
      hasGithubUrl?: boolean;
      hasDemoUrl?: boolean;
      hasVideo?: boolean;
      teamSize?: number;
      projectNameContains?: string;
      submittedAfter?: Date;
      submittedBefore?: Date;
    },
    searchTerm?: string,
    sortBy?: 'createdAt' | 'updatedAt' | 'score' | 'projectName',
    sortOrder?: 'asc' | 'desc',
    correlationId?: string
  ) {
    super('SEARCH_HACKATHON_ANALYSES', pagination, searchTerm, criteria, sortBy, sortOrder, correlationId);
  }
}

/**
 * Query to get hackathon statistics
 */
export class GetHackathonStatsQuery extends BaseQuery {
  constructor(correlationId?: string) {
    super('GET_HACKATHON_STATS', correlationId);
  }
}

/**
 * Query to get user's hackathon submissions
 */
export class GetUserHackathonSubmissionsQuery extends PaginatedQuery {
  constructor(
    public readonly userId: UserId,
    pagination: PaginationParams,
    correlationId?: string
  ) {
    super('GET_USER_HACKATHON_SUBMISSIONS', pagination, correlationId);
  }
}

/**
 * Query to find similar hackathon projects
 */
export class FindSimilarHackathonProjectsQuery extends BaseQuery {
  constructor(
    public readonly analysisId: AnalysisId,
    public readonly limit: number = 5,
    correlationId?: string
  ) {
    super('FIND_SIMILAR_HACKATHON_PROJECTS', correlationId);
  }
}

/**
 * Query to get category recommendations
 */
export class GetHackathonCategoryRecommendationsQuery extends BaseQuery {
  constructor(
    public readonly category: Category,
    public readonly limit: number = 10,
    correlationId?: string
  ) {
    super('GET_HACKATHON_CATEGORY_RECOMMENDATIONS', correlationId);
  }
}

/**
 * Query to find projects needing category review
 */
export class GetProjectsNeedingCategoryReviewQuery extends PaginatedQuery {
  constructor(
    pagination: PaginationParams,
    correlationId?: string
  ) {
    super('GET_PROJECTS_NEEDING_CATEGORY_REVIEW', pagination, correlationId);
  }
}

/**
 * Query to get hackathon project evaluation
 */
export class GetHackathonProjectEvaluationQuery extends BaseQuery {
  constructor(
    public readonly analysisId: AnalysisId,
    correlationId?: string
  ) {
    super('GET_HACKATHON_PROJECT_EVALUATION', correlationId);
  }
}

/**
 * Query to compare hackathon projects
 */
export class CompareHackathonProjectsQuery extends BaseQuery {
  constructor(
    public readonly analysisId1: AnalysisId,
    public readonly analysisId2: AnalysisId,
    public readonly category: Category,
    correlationId?: string
  ) {
    super('COMPARE_HACKATHON_PROJECTS', correlationId);
  }
}

/**
 * Query result types for hackathon operations
 */
export interface GetHackathonAnalysisByIdResult {
  analysis: Analysis | null;
  hackathonData: HackathonProjectMetadata | null;
}

export interface GetHackathonAnalysesByCategoryResult {
  analyses: PaginatedResult<Analysis>;
}

export interface GetHackathonLeaderboardResult {
  leaderboard: HackathonLeaderboardEntry[];
}

export interface SearchHackathonAnalysesResult {
  analyses: PaginatedResult<Analysis>;
}

export interface GetHackathonStatsResult {
  stats: {
    totalSubmissions: number;
    categoryDistribution: Record<string, number>;
    averageScoreByCategory: Record<string, number>;
    topProjects: HackathonLeaderboardEntry[];
    submissionsByDay: Record<string, number>;
    teamSizeDistribution: Record<number, number>;
  };
}

export interface GetUserHackathonSubmissionsResult {
  submissions: PaginatedResult<Analysis>;
}

export interface FindSimilarHackathonProjectsResult {
  projects: Analysis[];
}

export interface GetHackathonCategoryRecommendationsResult {
  recommendations: {
    topProjects: Analysis[];
    averageScore: number;
    commonFeatures: string[];
    improvementTips: string[];
  };
}

export interface GetProjectsNeedingCategoryReviewResult {
  projects: PaginatedResult<Analysis>;
}

export interface GetHackathonProjectEvaluationResult {
  evaluation: {
    recommendedCategory: Category;
    categoryFitScore: Score;
    alternativeCategories: Array<{
      category: Category;
      fitScore: Score;
      reason: string;
    }>;
    improvementSuggestions: string[];
    competitiveAdvantages: string[];
  };
}

export interface CompareHackathonProjectsResult {
  comparison: {
    winner: 'project1' | 'project2' | 'tie';
    scoreDifference: number;
    comparisonFactors: Array<{
      factor: string;
      project1Score: number;
      project2Score: number;
      winner: 'project1' | 'project2' | 'tie';
    }>;
  };
}