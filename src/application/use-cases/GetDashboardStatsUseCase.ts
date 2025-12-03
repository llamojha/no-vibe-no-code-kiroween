import { UserId } from '../../domain/value-objects';
import { IAnalysisRepository } from '../../domain/repositories';
import { Result, success, failure } from '../../shared/types/common';
import { Analysis } from '../../domain/entities';

/**
 * Input for getting dashboard statistics
 */
export interface GetDashboardStatsInput {
  userId: UserId;
  recentLimit?: number;
}

/**
 * Dashboard statistics output
 */
export interface DashboardStats {
  totalAnalyses: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  recentAnalyses: Analysis[];
  analysisCountsByCategory: {
    idea: number;
    kiroween: number;
  };
  scoreDistribution: {
    excellent: number; // 90-100
    good: number;      // 70-89
    average: number;   // 50-69
    poor: number;      // 0-49
  };
  activitySummary: {
    thisWeek: number;
    thisMonth: number;
    lastAnalysisDate?: Date;
  };
}

/**
 * Output from getting dashboard statistics
 */
export interface GetDashboardStatsOutput {
  stats: DashboardStats;
  generatedAt: Date;
}

/**
 * Use case for retrieving comprehensive dashboard statistics
 * Provides analytics and insights about user's analysis activity
 */
export class GetDashboardStatsUseCase {
  constructor(
    private readonly analysisRepository: IAnalysisRepository
  ) {}

  /**
   * Execute the get dashboard stats process
   */
  async execute(input: GetDashboardStatsInput): Promise<Result<GetDashboardStatsOutput, Error>> {
    try {
      const recentLimit = input.recentLimit || 5;

      // Get all analyses for the user to calculate comprehensive stats
      const allAnalysesResult = await this.analysisRepository.findAllByUserId(input.userId);
      
      if (!allAnalysesResult.success) {
        return failure(allAnalysesResult.error);
      }

      const allAnalyses = allAnalysesResult.data;

      // Get recent analyses
      const recentAnalysesResult = await this.analysisRepository.findByUserIdPaginated(
        input.userId,
        { page: 1, limit: recentLimit, sortBy: 'newest' }
      );

      if (!recentAnalysesResult.success) {
        return failure(recentAnalysesResult.error);
      }

      const recentAnalyses = recentAnalysesResult.data.analyses;

      // Calculate statistics
      const stats = this.calculateStats(allAnalyses, recentAnalyses);

      const output: GetDashboardStatsOutput = {
        stats,
        generatedAt: new Date()
      };

      return success(output);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error getting dashboard stats'));
    }
  }

  /**
   * Calculate comprehensive statistics from analyses
   */
  private calculateStats(allAnalyses: Analysis[], recentAnalyses: Analysis[]): DashboardStats {
    const totalAnalyses = allAnalyses.length;

    if (totalAnalyses === 0) {
      return {
        totalAnalyses: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        recentAnalyses: [],
        analysisCountsByCategory: { idea: 0, kiroween: 0 },
        scoreDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
        activitySummary: { thisWeek: 0, thisMonth: 0 }
      };
    }

    // Basic score statistics
    const scores = allAnalyses.map(analysis => analysis.score.value);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalAnalyses;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Category counts
    const analysisCountsByCategory = {
      idea: allAnalyses.filter(analysis => analysis.category?.value === 'idea').length,
      kiroween: allAnalyses.filter(analysis => analysis.category?.value === 'kiroween').length
    };

    // Score distribution
    const scoreDistribution = {
      excellent: scores.filter(score => score >= 90).length,
      good: scores.filter(score => score >= 70 && score < 90).length,
      average: scores.filter(score => score >= 50 && score < 70).length,
      poor: scores.filter(score => score < 50).length
    };

    // Activity summary
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = allAnalyses.filter(analysis => 
      analysis.createdAt >= oneWeekAgo
    ).length;

    const thisMonth = allAnalyses.filter(analysis => 
      analysis.createdAt >= oneMonthAgo
    ).length;

    const lastAnalysisDate = allAnalyses.length > 0 
      ? new Date(Math.max(...allAnalyses.map(analysis => analysis.createdAt.getTime())))
      : undefined;

    return {
      totalAnalyses,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore,
      lowestScore,
      recentAnalyses,
      analysisCountsByCategory,
      scoreDistribution,
      activitySummary: {
        thisWeek,
        thisMonth,
        lastAnalysisDate
      }
    };
  }

  /**
   * Get quick stats for dashboard header
   */
  async getQuickStats(userId: UserId): Promise<Result<{
    totalAnalyses: number;
    averageScore: number;
    highestScore: number;
  }, Error>> {
    try {
      const countsResult = await this.analysisRepository.getAnalysisCountsByUser(userId);
      
      if (!countsResult.success) {
        return failure(countsResult.error);
      }

      const statsResult = await this.analysisRepository.getScoreStatsByUser(userId);
      
      if (!statsResult.success) {
        return failure(statsResult.error);
      }

      const quickStats = {
        totalAnalyses: countsResult.data.total,
        averageScore: Math.round(statsResult.data.average * 100) / 100,
        highestScore: statsResult.data.highest
      };

      return success(quickStats);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error getting quick stats'));
    }
  }
}