import { Analysis } from '../entities';
import { AnalysisId, UserId, Category, Score } from '../value-objects';
import { ICommandRepository, IQueryRepository } from './base/IRepository';
import { Result, PaginatedResult, PaginationParams } from '../../shared/types/common';

/**
 * Hackathon-specific analysis data
 */
export interface HackathonAnalysisData {
  projectName: string;
  projectDescription: string;
  kiroUsage: string;
  category: Category;
  githubUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  screenshots?: string[];
  teamMembers?: string[];
}

/**
 * Hackathon analysis search criteria
 */
export interface HackathonAnalysisSearchCriteria {
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
}

/**
 * Hackathon leaderboard entry
 */
export interface HackathonLeaderboardEntry {
  analysis: Analysis;
  projectName: string;
  category: Category;
  score: Score;
  rank: number;
  userId: UserId;
}

/**
 * Command repository interface for Hackathon Analysis write operations
 */
export interface IHackathonAnalysisCommandRepository extends ICommandRepository<Analysis, AnalysisId> {
  /**
   * Save a hackathon analysis with additional metadata
   */
  saveHackathonAnalysis(
    analysis: Analysis, 
    hackathonData: HackathonAnalysisData
  ): Promise<Result<Analysis, Error>>;

  /**
   * Update hackathon-specific data
   */
  updateHackathonData(
    id: AnalysisId, 
    hackathonData: Partial<HackathonAnalysisData>
  ): Promise<Result<void, Error>>;

  /**
   * Delete hackathon analysis and associated data
   */
  deleteHackathonAnalysis(id: AnalysisId): Promise<Result<void, Error>>;

  /**
   * Bulk update category assignments for hackathon analyses
   */
  bulkUpdateCategories(
    updates: Array<{ id: AnalysisId; category: Category }>
  ): Promise<Result<void, Error>>;
}

/**
 * Query repository interface for Hackathon Analysis read operations
 */
export interface IHackathonAnalysisQueryRepository extends IQueryRepository<Analysis, AnalysisId> {
  /**
   * Find hackathon analyses by category with pagination
   */
  findByCategory(
    category: Category, 
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;

  /**
   * Get hackathon leaderboard
   */
  getLeaderboard(
    category?: Category,
    limit?: number
  ): Promise<Result<HackathonLeaderboardEntry[], Error>>;

  /**
   * Search hackathon analyses with complex criteria
   */
  searchHackathonAnalyses(
    criteria: HackathonAnalysisSearchCriteria,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;

  /**
   * Get hackathon statistics
   */
  getHackathonStats(): Promise<Result<{
    totalSubmissions: number;
    categoryDistribution: Record<string, number>;
    averageScoreByCategory: Record<string, number>;
    topProjects: HackathonLeaderboardEntry[];
    submissionsByDay: Record<string, number>;
    teamSizeDistribution: Record<number, number>;
  }, Error>>;

  /**
   * Find user's hackathon submissions
   */
  findUserSubmissions(
    userId: UserId, 
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;

  /**
   * Get hackathon analysis with metadata
   */
  findHackathonAnalysisById(
    id: AnalysisId
  ): Promise<Result<{
    analysis: Analysis;
    hackathonData: HackathonAnalysisData;
  } | null, Error>>;

  /**
   * Find similar hackathon projects
   */
  findSimilarProjects(
    analysis: Analysis,
    limit: number
  ): Promise<Result<Analysis[], Error>>;

  /**
   * Get category-specific recommendations
   */
  getCategoryRecommendations(
    category: Category,
    limit: number
  ): Promise<Result<{
    topProjects: Analysis[];
    averageScore: number;
    commonFeatures: string[];
    improvementTips: string[];
  }, Error>>;

  /**
   * Find projects that need category review
   */
  findProjectsNeedingCategoryReview(
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>>;
}

/**
 * Combined Hackathon Analysis repository interface
 */
export interface IHackathonAnalysisRepository 
  extends IHackathonAnalysisCommandRepository, IHackathonAnalysisQueryRepository {
  // Inherits all methods from both command and query repositories
}