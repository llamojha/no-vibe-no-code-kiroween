import { Analysis, User } from '../entities';
import { AnalysisId, UserId, Category, Score } from '../value-objects';
import { Result } from '../../shared/types/common';

/**
 * Dashboard analytics data
 */
export interface DashboardAnalytics {
  totalAnalyses: number;
  completedAnalyses: number;
  averageScore: number;
  highQualityCount: number;
  recentAnalysesCount: number;
  categoryCounts: Record<string, number>;
  scoreDistribution: Record<string, number>;
  analysisFrequency: Record<string, number>; // Date -> count
}

/**
 * User activity summary
 */
export interface UserActivitySummary {
  user: User;
  totalAnalyses: number;
  lastAnalysisDate?: Date;
  averageScore: number;
  favoriteCategory?: Category;
  activityStreak: number; // Days with consecutive activity
  lastLoginDate?: Date;
}

/**
 * Dashboard insights
 */
export interface DashboardInsights {
  topPerformingCategories: Array<{
    category: Category;
    averageScore: number;
    count: number;
  }>;
  improvementSuggestions: string[];
  trendingTopics: string[];
  personalBests: {
    highestScore: Score;
    mostProductiveDay: string;
    favoriteCategory: Category;
  };
  goals: {
    analysisTarget: number;
    currentProgress: number;
    daysRemaining: number;
  };
}

/**
 * Time-based analytics filters
 */
export interface TimeFilter {
  startDate: Date;
  endDate: Date;
  granularity: 'day' | 'week' | 'month' | 'year';
}

/**
 * Dashboard repository interface for read operations
 * Optimized for dashboard data retrieval and analytics
 */
export interface IDashboardRepository {
  /**
   * Get comprehensive dashboard analytics for a user
   */
  getUserDashboardAnalytics(
    userId: UserId,
    timeFilter?: TimeFilter
  ): Promise<Result<DashboardAnalytics, Error>>;

  /**
   * Get user activity summary
   */
  getUserActivitySummary(userId: UserId): Promise<Result<UserActivitySummary, Error>>;

  /**
   * Get personalized insights for a user
   */
  getUserInsights(userId: UserId): Promise<Result<DashboardInsights, Error>>;

  /**
   * Get recent analyses for dashboard display
   */
  getRecentAnalyses(
    userId: UserId,
    limit: number
  ): Promise<Result<Analysis[], Error>>;

  /**
   * Get top analyses by score for a user
   */
  getTopAnalyses(
    userId: UserId,
    limit: number
  ): Promise<Result<Analysis[], Error>>;

  /**
   * Get analyses that need attention (incomplete, low scores)
   */
  getAnalysesNeedingAttention(
    userId: UserId,
    limit: number
  ): Promise<Result<Analysis[], Error>>;

  /**
   * Get score trends over time
   */
  getScoreTrends(
    userId: UserId,
    timeFilter: TimeFilter
  ): Promise<Result<Array<{
    date: string;
    averageScore: number;
    analysisCount: number;
  }>, Error>>;

  /**
   * Get category performance comparison
   */
  getCategoryPerformance(
    userId: UserId,
    timeFilter?: TimeFilter
  ): Promise<Result<Array<{
    category: Category;
    averageScore: number;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>, Error>>;

  /**
   * Get global leaderboard for motivation
   */
  getGlobalLeaderboard(
    timeFilter?: TimeFilter,
    limit?: number
  ): Promise<Result<Array<{
    user: User;
    averageScore: number;
    totalAnalyses: number;
    rank: number;
  }>, Error>>;

  /**
   * Get user's rank in global leaderboard
   */
  getUserRank(
    userId: UserId,
    timeFilter?: TimeFilter
  ): Promise<Result<{
    rank: number;
    totalUsers: number;
    percentile: number;
  }, Error>>;

  /**
   * Get analysis completion rate over time
   */
  getCompletionRates(
    userId: UserId,
    timeFilter: TimeFilter
  ): Promise<Result<Array<{
    date: string;
    completionRate: number;
    totalAnalyses: number;
  }>, Error>>;

  /**
   * Get suggested actions for the user
   */
  getSuggestedActions(userId: UserId): Promise<Result<Array<{
    type: 'complete_analysis' | 'try_category' | 'improve_score' | 'review_feedback';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    analysisId?: AnalysisId;
    category?: Category;
  }>, Error>>;

  /**
   * Get comparative analytics (user vs global averages)
   */
  getComparativeAnalytics(
    userId: UserId,
    timeFilter?: TimeFilter
  ): Promise<Result<{
    userStats: DashboardAnalytics;
    globalStats: DashboardAnalytics;
    comparisons: {
      scoreComparison: 'above' | 'below' | 'average';
      activityComparison: 'above' | 'below' | 'average';
      categoryDiversity: 'high' | 'medium' | 'low';
    };
  }, Error>>;

  /**
   * Get export data for user analytics
   */
  exportUserData(
    userId: UserId,
    format: 'json' | 'csv',
    timeFilter?: TimeFilter
  ): Promise<Result<string, Error>>;

  /**
   * Get dashboard configuration and preferences
   */
  getDashboardConfig(userId: UserId): Promise<Result<{
    widgets: string[];
    layout: Record<string, unknown>;
    preferences: {
      defaultTimeRange: string;
      showGlobalComparisons: boolean;
      showInsights: boolean;
      notificationSettings: Record<string, boolean>;
    };
  }, Error>>;

  /**
   * Update dashboard configuration
   */
  updateDashboardConfig(
    userId: UserId,
    config: Record<string, unknown>
  ): Promise<Result<void, Error>>;
}