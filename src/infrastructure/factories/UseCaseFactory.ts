import { IAnalysisRepository } from '../../domain/repositories/IAnalysisRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { AnalysisValidationService } from '../../domain/services/AnalysisValidationService';
import { ScoreCalculationService } from '../../domain/services/ScoreCalculationService';
// import { IAIAnalysisService } from '../../application/services/IAIAnalysisService'; // Temporarily disabled
import { INotificationService } from '../../application/services/INotificationService';

// Import use cases
import { AnalyzeIdeaUseCase } from '../../application/use-cases/AnalyzeIdeaUseCase';
import { GetAnalysisUseCase } from '../../application/use-cases/GetAnalysisUseCase';
import { SaveAnalysisUseCase } from '../../application/use-cases/SaveAnalysisUseCase';
import { DeleteAnalysisUseCase } from '../../application/use-cases/DeleteAnalysisUseCase';
import { GetUserAnalysesUseCase } from '../../application/use-cases/GetUserAnalysesUseCase';
import { GetDashboardStatsUseCase } from '../../application/use-cases/GetDashboardStatsUseCase';
import { AnalyzeHackathonProjectUseCase } from '../../application/use-cases/AnalyzeHackathonProjectUseCase';
import { SaveHackathonAnalysisUseCase } from '../../application/use-cases/SaveHackathonAnalysisUseCase';
import { GetHackathonLeaderboardUseCase } from '../../application/use-cases/GetHackathonLeaderboardUseCase';

/**
 * Factory for creating use case instances with proper dependency composition
 * Handles use case instantiation with all required dependencies
 */
export class UseCaseFactory {
  private static instance: UseCaseFactory;
  private useCases: Map<string, unknown> = new Map();

  private constructor(
    private readonly analysisRepository: IAnalysisRepository,
    private readonly userRepository: IUserRepository,
    // private readonly aiAnalysisService: IAIAnalysisService, // Temporarily disabled
    private readonly notificationService: INotificationService,
    private readonly analysisValidationService: AnalysisValidationService,
    private readonly scoreCalculationService: ScoreCalculationService
  ) {}

  static getInstance(
    analysisRepository: IAnalysisRepository,
    userRepository: IUserRepository,
    // aiAnalysisService: IAIAnalysisService, // Temporarily disabled
    notificationService: INotificationService,
    analysisValidationService: AnalysisValidationService,
    scoreCalculationService: ScoreCalculationService
  ): UseCaseFactory {
    if (!UseCaseFactory.instance) {
      UseCaseFactory.instance = new UseCaseFactory(
        analysisRepository,
        userRepository,
        // aiAnalysisService, // Temporarily disabled
        notificationService,
        analysisValidationService,
        scoreCalculationService
      );
    }
    return UseCaseFactory.instance;
  }

  /**
   * Create AnalyzeIdeaUseCase with all dependencies
   */
  createAnalyzeIdeaUseCase(): AnalyzeIdeaUseCase {
    const cacheKey = 'analyzeIdeaUseCase';
    
    if (!this.useCases.has(cacheKey)) {
      const useCase = new AnalyzeIdeaUseCase(
        this.analysisRepository,
        this.analysisValidationService,
        this.scoreCalculationService
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as AnalyzeIdeaUseCase;
  }

  /**
   * Create GetAnalysisUseCase with dependencies
   */
  createGetAnalysisUseCase(): GetAnalysisUseCase {
    const cacheKey = 'getAnalysisUseCase';
    
    if (!this.useCases.has(cacheKey)) {
      const useCase = new GetAnalysisUseCase(
        this.analysisRepository
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetAnalysisUseCase;
  }

  /**
   * Create SaveAnalysisUseCase with dependencies
   */
  createSaveAnalysisUseCase(): SaveAnalysisUseCase {
    const cacheKey = 'saveAnalysisUseCase';
    
    if (!this.useCases.has(cacheKey)) {
      const useCase = new SaveAnalysisUseCase(
        this.analysisRepository,
        this.analysisValidationService
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as SaveAnalysisUseCase;
  }

  /**
   * Create DeleteAnalysisUseCase with dependencies
   */
  createDeleteAnalysisUseCase(): DeleteAnalysisUseCase {
    const cacheKey = 'deleteAnalysisUseCase';
    
    if (!this.useCases.has(cacheKey)) {
      const useCase = new DeleteAnalysisUseCase(
        this.analysisRepository,
        this.analysisValidationService
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as DeleteAnalysisUseCase;
  }

  /**
   * Create AnalyzeHackathonProjectUseCase with dependencies
   */
  createAnalyzeHackathonProjectUseCase(): AnalyzeHackathonProjectUseCase {
    const cacheKey = 'analyzeHackathonProjectUseCase';
    
    if (!this.useCases.has(cacheKey)) {
      // Note: This needs IHackathonAnalysisRepository and HackathonAnalysisService
      // For now, using regular repository until hackathon-specific ones are implemented
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const useCase = new AnalyzeHackathonProjectUseCase(
        this.analysisRepository as any, // Cast to IHackathonAnalysisRepository
        {} as any, // HackathonAnalysisService placeholder
        this.scoreCalculationService
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as AnalyzeHackathonProjectUseCase;
  }

  /**
   * Create SaveHackathonAnalysisUseCase with dependencies
   */
  createSaveHackathonAnalysisUseCase(): SaveHackathonAnalysisUseCase {
    const cacheKey = 'saveHackathonAnalysisUseCase';
    
    if (!this.useCases.has(cacheKey)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const useCase = new SaveHackathonAnalysisUseCase(
        this.analysisRepository as any, // Cast to IHackathonAnalysisRepository
        {} as unknown // HackathonAnalysisService placeholder
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as SaveHackathonAnalysisUseCase;
  }

  /**
   * Create GetUserAnalysesUseCase with dependencies
   */
  createGetUserAnalysesUseCase(): GetUserAnalysesUseCase {
    const cacheKey = 'getUserAnalysesUseCase';
    
    if (!this.useCases.has(cacheKey)) {
      const useCase = new GetUserAnalysesUseCase(
        this.analysisRepository
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetUserAnalysesUseCase;
  }

  /**
   * Create GetDashboardStatsUseCase with dependencies
   */
  createGetDashboardStatsUseCase(): GetDashboardStatsUseCase {
    const cacheKey = 'getDashboardStatsUseCase';
    
    if (!this.useCases.has(cacheKey)) {
      const useCase = new GetDashboardStatsUseCase(
        this.analysisRepository
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetDashboardStatsUseCase;
  }

  /**
   * Create GetHackathonLeaderboardUseCase with dependencies
   */
  createGetHackathonLeaderboardUseCase(): GetHackathonLeaderboardUseCase {
    const cacheKey = 'getHackathonLeaderboardUseCase';
    
    if (!this.useCases.has(cacheKey)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const useCase = new GetHackathonLeaderboardUseCase(
        this.analysisRepository as unknown // Cast to IHackathonAnalysisRepository
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetHackathonLeaderboardUseCase;
  }

  /**
   * Clear use case cache (useful for testing)
   */
  clearCache(): void {
    this.useCases.clear();
  }

  /**
   * Get all cached use cases (useful for debugging)
   */
  getCachedUseCases(): string[] {
    return Array.from(this.useCases.keys());
  }
}