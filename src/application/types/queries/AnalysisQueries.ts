import { z } from 'zod';
import { BaseQuery, PaginatedQuery, SearchQuery, createQuerySchema } from '../base/Query';
import { AnalysisId, UserId, Category, Locale, Score } from '../../../domain/value-objects';
import { Analysis } from '../../../domain/entities';
import { PaginationParams, PaginatedResult } from '../../../shared/types/common';

/**
 * Query to get an analysis by ID
 */
export class GetAnalysisByIdQuery extends BaseQuery {
  constructor(
    public readonly analysisId: AnalysisId,
    public readonly userId?: UserId,
    correlationId?: string
  ) {
    super('GET_ANALYSIS_BY_ID', correlationId);
  }
}

/**
 * Validation schema for GetAnalysisByIdQuery
 */
export const GetAnalysisByIdQuerySchema = createQuerySchema(
  z.object({
    analysisId: z.string().uuid('Invalid analysis ID format'),
    userId: z.string().uuid('Invalid user ID format').optional()
  })
);

/**
 * Query to get analyses by user ID
 */
export class GetAnalysesByUserQuery extends PaginatedQuery {
  constructor(
    public readonly userId: UserId,
    pagination: PaginationParams,
    correlationId?: string
  ) {
    super('GET_ANALYSES_BY_USER', pagination, correlationId);
  }
}

/**
 * Validation schema for GetAnalysesByUserQuery
 */
export const GetAnalysesByUserQuerySchema = createQuerySchema(
  z.object({
    userId: z.string().uuid('Invalid user ID format'),
    pagination: z.object({
      page: z.number().min(1, 'Page must be at least 1'),
      limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100')
    })
  })
);

/**
 * Query to get analyses by category
 */
export class GetAnalysesByCategoryQuery extends PaginatedQuery {
  constructor(
    public readonly category: Category,
    pagination: PaginationParams,
    correlationId?: string
  ) {
    super('GET_ANALYSES_BY_CATEGORY', pagination, correlationId);
  }
}

/**
 * Validation schema for GetAnalysesByCategoryQuery
 */
export const GetAnalysesByCategoryQuerySchema = createQuerySchema(
  z.object({
    category: z.string(),
    pagination: z.object({
      page: z.number().min(1),
      limit: z.number().min(1).max(100)
    })
  })
);

/**
 * Query to search analyses with complex criteria
 */
export class SearchAnalysesQuery extends SearchQuery {
  constructor(
    pagination: PaginationParams,
    public readonly criteria: {
      userId?: UserId;
      category?: Category;
      locale?: Locale;
      minScore?: Score;
      maxScore?: Score;
      isCompleted?: boolean;
      createdAfter?: Date;
      createdBefore?: Date;
      ideaContains?: string;
    },
    searchTerm?: string,
    sortBy?: 'createdAt' | 'updatedAt' | 'score',
    sortOrder?: 'asc' | 'desc',
    correlationId?: string
  ) {
    super('SEARCH_ANALYSES', pagination, searchTerm, criteria, sortBy, sortOrder, correlationId);
  }
}

/**
 * Validation schema for SearchAnalysesQuery
 */
export const SearchAnalysesQuerySchema = createQuerySchema(
  z.object({
    pagination: z.object({
      page: z.number().min(1),
      limit: z.number().min(1).max(100)
    }),
    criteria: z.object({
      userId: z.string().uuid().optional(),
      category: z.string().optional(),
      locale: z.enum(['en', 'es']).optional(),
      minScore: z.number().min(0).max(100).optional(),
      maxScore: z.number().min(0).max(100).optional(),
      isCompleted: z.boolean().optional(),
      createdAfter: z.string().datetime().optional(),
      createdBefore: z.string().datetime().optional(),
      ideaContains: z.string().optional()
    }),
    searchTerm: z.string().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'score']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
);

/**
 * Query to get high-quality analyses
 */
export class GetHighQualityAnalysesQuery extends PaginatedQuery {
  constructor(
    pagination: PaginationParams,
    public readonly minScore: Score = Score.create(80),
    correlationId?: string
  ) {
    super('GET_HIGH_QUALITY_ANALYSES', pagination, correlationId);
  }
}

/**
 * Query to get recent analyses
 */
export class GetRecentAnalysesQuery extends PaginatedQuery {
  constructor(
    pagination: PaginationParams,
    public readonly days: number = 7,
    public readonly userId?: UserId,
    correlationId?: string
  ) {
    super('GET_RECENT_ANALYSES', pagination, correlationId);
  }
}

/**
 * Query to get analysis statistics for a user
 */
export class GetUserAnalysisStatsQuery extends BaseQuery {
  constructor(
    public readonly userId: UserId,
    correlationId?: string
  ) {
    super('GET_USER_ANALYSIS_STATS', correlationId);
  }
}

/**
 * Query to get global analysis statistics
 */
export class GetGlobalAnalysisStatsQuery extends BaseQuery {
  constructor(correlationId?: string) {
    super('GET_GLOBAL_ANALYSIS_STATS', correlationId);
  }
}

/**
 * Query to find similar analyses
 */
export class FindSimilarAnalysesQuery extends BaseQuery {
  constructor(
    public readonly analysisId: AnalysisId,
    public readonly limit: number = 5,
    correlationId?: string
  ) {
    super('FIND_SIMILAR_ANALYSES', correlationId);
  }
}

/**
 * Query result types for analysis operations
 */
export interface GetAnalysisByIdResult {
  analysis: Analysis | null;
}

export interface GetAnalysesByUserResult {
  analyses: PaginatedResult<Analysis>;
}

export interface GetAnalysesByCategoryResult {
  analyses: PaginatedResult<Analysis>;
}

export interface SearchAnalysesResult {
  analyses: PaginatedResult<Analysis>;
}

export interface GetHighQualityAnalysesResult {
  analyses: PaginatedResult<Analysis>;
}

export interface GetRecentAnalysesResult {
  analyses: PaginatedResult<Analysis>;
}

export interface GetUserAnalysisStatsResult {
  stats: {
    totalCount: number;
    completedCount: number;
    averageScore: number;
    highQualityCount: number;
    categoryCounts: Record<string, number>;
  };
}

export interface GetGlobalAnalysisStatsResult {
  stats: {
    totalCount: number;
    averageScore: number;
    topCategories: Array<{ category: string; count: number }>;
    recentCount: number;
  };
}

export interface FindSimilarAnalysesResult {
  analyses: Analysis[];
}