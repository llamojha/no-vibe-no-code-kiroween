import { Analysis } from '../../domain/entities';
import { Category, UserId } from '../../domain/value-objects';
import { IHackathonAnalysisRepository } from '../../domain/repositories';
import { HackathonLeaderboardEntry } from '../../domain/repositories';
import { Result, success, failure } from '../../shared/types/common';

/**
 * Input for getting hackathon leaderboard
 */
export interface GetHackathonLeaderboardInput {
  category?: Category;
  limit?: number;
  includeUserRank?: boolean;
  userId?: UserId;
}

/**
 * Output from getting hackathon leaderboard
 */
export interface GetHackathonLeaderboardOutput {
  leaderboard: HackathonLeaderboardEntry[];
  userRank?: {
    position: number;
    entry: HackathonLeaderboardEntry;
    isInTopTen: boolean;
  };
  categoryStats: {
    totalSubmissions: number;
    averageScore: number;
    topScore: number;
    categoryName: string;
  };
}

/**
 * Use case for retrieving hackathon leaderboard
 * Provides rankings and competitive information for hackathon participants
 */
export class GetHackathonLeaderboardUseCase {
  constructor(
    private readonly hackathonRepository: IHackathonAnalysisRepository
  ) {}

  /**
   * Execute the get leaderboard process
   */
  async execute(input: GetHackathonLeaderboardInput): Promise<Result<GetHackathonLeaderboardOutput, Error>> {
    try {
      const limit = input.limit || 10;

      // Step 1: Get leaderboard data
      const leaderboardResult = await this.hackathonRepository.getLeaderboard(
        input.category,
        limit
      );

      if (!leaderboardResult.success) {
        return failure(leaderboardResult.error);
      }

      const leaderboard = leaderboardResult.data;

      // Step 2: Get user rank if requested
      let userRank: GetHackathonLeaderboardOutput['userRank'];
      if (input.includeUserRank && input.userId) {
        userRank = await this.getUserRank(input.userId, input.category, leaderboard);
      }

      // Step 3: Calculate category statistics
      const categoryStats = this.calculateCategoryStats(leaderboard, input.category);

      // Step 4: Return comprehensive result
      const output: GetHackathonLeaderboardOutput = {
        leaderboard,
        userRank,
        categoryStats
      };

      return success(output);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error getting leaderboard'));
    }
  }

  /**
   * Get leaderboard for all categories
   */
  async getAllCategoriesLeaderboard(
    limit: number = 5
  ): Promise<Result<Record<string, HackathonLeaderboardEntry[]>, Error>> {
    try {
      const categories = Category.getHackathonCategories();
      const leaderboards: Record<string, HackathonLeaderboardEntry[]> = {};

      for (const categoryValue of categories) {
        const category = Category.createHackathon(categoryValue);
        const leaderboardResult = await this.hackathonRepository.getLeaderboard(category, limit);
        
        if (leaderboardResult.success) {
          leaderboards[categoryValue] = leaderboardResult.data;
        } else {
          leaderboards[categoryValue] = [];
        }
      }

      return success(leaderboards);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Error getting all category leaderboards'));
    }
  }

  /**
   * Get user's position across all categories
   */
  async getUserPositionsAllCategories(
    userId: UserId
  ): Promise<Result<Array<{
    category: Category;
    position: number;
    totalParticipants: number;
    score: number;
    isInTopTen: boolean;
  }>, Error>> {
    try {
      const categories = Category.getHackathonCategories();
      const positions: Array<{
        category: Category;
        position: number;
        totalParticipants: number;
        score: number;
        isInTopTen: boolean;
      }> = [];

      for (const categoryValue of categories) {
        const category = Category.createHackathon(categoryValue);
        
        // Get full leaderboard for this category to find user position
        const leaderboardResult = await this.hackathonRepository.getLeaderboard(category, 100);
        
        if (leaderboardResult.success) {
          const userEntry = leaderboardResult.data.find(entry => 
            entry.userId.equals(userId)
          );

          if (userEntry) {
            positions.push({
              category,
              position: userEntry.rank,
              totalParticipants: leaderboardResult.data.length,
              score: userEntry.score.value,
              isInTopTen: userEntry.rank <= 10
            });
          }
        }
      }

      return success(positions);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Error getting user positions'));
    }
  }

  /**
   * Get trending projects (recent high-scoring submissions)
   */
  async getTrendingProjects(
    category?: Category,
    limit: number = 5
  ): Promise<Result<Analysis[], Error>> {
    try {
      // Get recent analyses with high scores
      const searchResult = await this.hackathonRepository.searchHackathonAnalyses(
        {
          category,
          submittedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        },
        { page: 1, limit }
      );

      if (!searchResult.success) {
        return failure(searchResult.error);
      }

      return success(searchResult.data.items);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Error getting trending projects'));
    }
  }

  /**
   * Private helper to get user rank
   */
  private async getUserRank(
    userId: UserId,
    category?: Category,
    leaderboard?: HackathonLeaderboardEntry[]
  ): Promise<GetHackathonLeaderboardOutput['userRank']> {
    try {
      // If leaderboard is provided, search in it first
      if (leaderboard) {
        const userEntry = leaderboard.find(entry => entry.userId.equals(userId));
        if (userEntry) {
          return {
            position: userEntry.rank,
            entry: userEntry,
            isInTopTen: userEntry.rank <= 10
          };
        }
      }

      // If not found in top entries, get full leaderboard
      const fullLeaderboardResult = await this.hackathonRepository.getLeaderboard(category, 1000);
      
      if (fullLeaderboardResult.success) {
        const userEntry = fullLeaderboardResult.data.find(entry => 
          entry.userId.equals(userId)
        );

        if (userEntry) {
          return {
            position: userEntry.rank,
            entry: userEntry,
            isInTopTen: userEntry.rank <= 10
          };
        }
      }

      return undefined;

    } catch {
      return undefined;
    }
  }

  /**
   * Private helper to calculate category statistics
   */
  private calculateCategoryStats(
    leaderboard: HackathonLeaderboardEntry[],
    category?: Category
  ): GetHackathonLeaderboardOutput['categoryStats'] {
    if (leaderboard.length === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        topScore: 0,
        categoryName: category?.displayName || 'All Categories'
      };
    }

    const totalSubmissions = leaderboard.length;
    const averageScore = leaderboard.reduce((sum, entry) => sum + entry.score.value, 0) / totalSubmissions;
    const topScore = Math.max(...leaderboard.map(entry => entry.score.value));

    return {
      totalSubmissions,
      averageScore: Math.round(averageScore * 100) / 100,
      topScore,
      categoryName: category?.displayName || 'All Categories'
    };
  }
}