import { IAnalysisRepository } from "../../domain/repositories/IAnalysisRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ICreditTransactionRepository } from "../../domain/repositories/ICreditTransactionRepository";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IDocumentRepository } from "../../domain/repositories/IDocumentRepository";
import { AnalysisValidationService } from "../../domain/services/AnalysisValidationService";
import { ScoreCalculationService } from "../../domain/services/ScoreCalculationService";
import { HackathonAnalysisService } from "../../domain/services/HackathonAnalysisService";
import { CreditPolicy } from "../../domain/services/CreditPolicy";
// import { IAIAnalysisService } from '../../application/services/IAIAnalysisService'; // Temporarily disabled
import { INotificationService } from "../../application/services/INotificationService";
import { ICache } from "../cache/ICache";

// Import use cases
import { AnalyzeIdeaUseCase } from "../../application/use-cases/AnalyzeIdeaUseCase";
import { GetAnalysisUseCase } from "../../application/use-cases/GetAnalysisUseCase";
import { SaveAnalysisUseCase } from "../../application/use-cases/SaveAnalysisUseCase";
import { DeleteAnalysisUseCase } from "../../application/use-cases/DeleteAnalysisUseCase";
import { GetUserAnalysesUseCase } from "../../application/use-cases/GetUserAnalysesUseCase";
import { GetDashboardStatsUseCase } from "../../application/use-cases/GetDashboardStatsUseCase";
import { AnalyzeHackathonProjectUseCase } from "../../application/use-cases/AnalyzeHackathonProjectUseCase";
import { SaveHackathonAnalysisUseCase } from "../../application/use-cases/SaveHackathonAnalysisUseCase";
import { GetHackathonLeaderboardUseCase } from "../../application/use-cases/GetHackathonLeaderboardUseCase";
import { CheckCreditsUseCase } from "../../application/use-cases/CheckCreditsUseCase";
import { DeductCreditUseCase } from "../../application/use-cases/DeductCreditUseCase";
import { GetCreditBalanceUseCase } from "../../application/use-cases/GetCreditBalanceUseCase";
import { AddCreditsUseCase } from "../../application/use-cases/AddCreditsUseCase";
import { GetIdeaWithDocumentsUseCase } from "../../application/use-cases/GetIdeaWithDocumentsUseCase";
import { UpdateIdeaStatusUseCase } from "../../application/use-cases/UpdateIdeaStatusUseCase";
import { SaveIdeaMetadataUseCase } from "../../application/use-cases/SaveIdeaMetadataUseCase";
import { GetUserIdeasUseCase } from "../../application/use-cases/GetUserIdeasUseCase";
import { DeleteIdeaUseCase } from "../../application/use-cases/DeleteIdeaUseCase";
import { GetDocumentsByIdeaUseCase } from "../../application/use-cases/GetDocumentsByIdeaUseCase";
import { SaveAnalysisToIdeaPanelUseCase } from "../../application/use-cases/SaveAnalysisToIdeaPanelUseCase";

/**
 * Factory for creating use case instances with proper dependency composition
 * Handles use case instantiation with all required dependencies
 *
 * ⚠️ SECURITY: No singleton pattern - creates fresh instance per request
 *
 * This factory MUST be instantiated per request because it depends on
 * repositories that contain request-specific Supabase clients.
 *
 * @see docs/SECURITY.md for detailed explanation
 */
export class UseCaseFactory {
  private useCases: Map<string, unknown> = new Map();
  private hackathonAnalysisService: HackathonAnalysisService;
  private creditPolicy: CreditPolicy;

  private constructor(
    private readonly analysisRepository: IAnalysisRepository,
    private readonly userRepository: IUserRepository,
    private readonly creditTransactionRepository: ICreditTransactionRepository,
    private readonly ideaRepository: IIdeaRepository,
    private readonly documentRepository: IDocumentRepository,
    // private readonly aiAnalysisService: IAIAnalysisService, // Temporarily disabled
    private readonly notificationService: INotificationService,
    private readonly analysisValidationService: AnalysisValidationService,
    private readonly scoreCalculationService: ScoreCalculationService,
    private readonly cache: ICache
  ) {
    // Initialize domain services (they have no external dependencies)
    this.hackathonAnalysisService = new HackathonAnalysisService();
    this.creditPolicy = new CreditPolicy();
  }

  /**
   * Create a new UseCaseFactory instance
   *
   * ✅ SAFE: Always creates fresh instance per request
   *
   * @param analysisRepository - Repository with fresh Supabase client
   * @param userRepository - Repository with fresh Supabase client
   * @param creditTransactionRepository - Repository for credit transactions
   * @param notificationService - Notification service
   * @param analysisValidationService - Domain validation service
   * @param scoreCalculationService - Domain score calculation service
   * @param cache - Cache implementation for performance optimization
   * @returns New UseCaseFactory instance
   */
  static create(
    analysisRepository: IAnalysisRepository,
    userRepository: IUserRepository,
    creditTransactionRepository: ICreditTransactionRepository,
    ideaRepository: IIdeaRepository,
    documentRepository: IDocumentRepository,
    // aiAnalysisService: IAIAnalysisService, // Temporarily disabled
    notificationService: INotificationService,
    analysisValidationService: AnalysisValidationService,
    scoreCalculationService: ScoreCalculationService,
    cache: ICache
  ): UseCaseFactory {
    return new UseCaseFactory(
      analysisRepository,
      userRepository,
      creditTransactionRepository,
      ideaRepository,
      documentRepository,
      // aiAnalysisService, // Temporarily disabled
      notificationService,
      analysisValidationService,
      scoreCalculationService,
      cache
    );
  }

  /**
   * @deprecated Use UseCaseFactory.create() instead
   * This method is kept for backward compatibility but will be removed.
   * It now creates a fresh instance instead of returning a cached singleton.
   */
  static getInstance(
    analysisRepository: IAnalysisRepository,
    userRepository: IUserRepository,
    creditTransactionRepository: ICreditTransactionRepository,
    ideaRepository: IIdeaRepository,
    documentRepository: IDocumentRepository,
    // aiAnalysisService: IAIAnalysisService, // Temporarily disabled
    notificationService: INotificationService,
    analysisValidationService: AnalysisValidationService,
    scoreCalculationService: ScoreCalculationService,
    cache: ICache
  ): UseCaseFactory {
    return UseCaseFactory.create(
      analysisRepository,
      userRepository,
      creditTransactionRepository,
      ideaRepository,
      documentRepository,
      notificationService,
      analysisValidationService,
      scoreCalculationService,
      cache
    );
  }

  /**
   * Create AnalyzeIdeaUseCase with all dependencies
   */
  createAnalyzeIdeaUseCase(): AnalyzeIdeaUseCase {
    const cacheKey = "analyzeIdeaUseCase";

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
    const cacheKey = "getAnalysisUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new GetAnalysisUseCase(this.analysisRepository);
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetAnalysisUseCase;
  }

  /**
   * Create SaveAnalysisUseCase with dependencies
   */
  createSaveAnalysisUseCase(): SaveAnalysisUseCase {
    const cacheKey = "saveAnalysisUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new SaveAnalysisUseCase(
        this.analysisRepository,
        this.analysisValidationService,
        this.documentRepository
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as SaveAnalysisUseCase;
  }

  /**
   * Create DeleteAnalysisUseCase with dependencies
   */
  createDeleteAnalysisUseCase(): DeleteAnalysisUseCase {
    const cacheKey = "deleteAnalysisUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new DeleteAnalysisUseCase(
        this.analysisRepository,
        this.analysisValidationService,
        this.documentRepository
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as DeleteAnalysisUseCase;
  }

  /**
   * Create AnalyzeHackathonProjectUseCase with dependencies
   */
  createAnalyzeHackathonProjectUseCase(): AnalyzeHackathonProjectUseCase {
    const cacheKey = "analyzeHackathonProjectUseCase";

    if (!this.useCases.has(cacheKey)) {
      // Note: Using regular repository until hackathon-specific one is implemented
      const useCase = new AnalyzeHackathonProjectUseCase(
        this.analysisRepository as any, // Cast to IHackathonAnalysisRepository
        this.hackathonAnalysisService,
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
    const cacheKey = "saveHackathonAnalysisUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new SaveHackathonAnalysisUseCase(
        this.analysisRepository as any, // Cast to IHackathonAnalysisRepository
        this.hackathonAnalysisService
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as SaveHackathonAnalysisUseCase;
  }

  /**
   * Create GetUserAnalysesUseCase with dependencies
   */
  createGetUserAnalysesUseCase(): GetUserAnalysesUseCase {
    const cacheKey = "getUserAnalysesUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new GetUserAnalysesUseCase(this.analysisRepository);
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetUserAnalysesUseCase;
  }

  /**
   * Create GetDashboardStatsUseCase with dependencies
   */
  createGetDashboardStatsUseCase(): GetDashboardStatsUseCase {
    const cacheKey = "getDashboardStatsUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new GetDashboardStatsUseCase(this.analysisRepository);
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetDashboardStatsUseCase;
  }

  /**
   * Create GetHackathonLeaderboardUseCase with dependencies
   */
  createGetHackathonLeaderboardUseCase(): GetHackathonLeaderboardUseCase {
    const cacheKey = "getHackathonLeaderboardUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new GetHackathonLeaderboardUseCase(
        this.analysisRepository as any // Cast to IHackathonAnalysisRepository
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetHackathonLeaderboardUseCase;
  }

  /**
   * Create CheckCreditsUseCase with dependencies
   */
  createCheckCreditsUseCase(): CheckCreditsUseCase {
    const cacheKey = "checkCreditsUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new CheckCreditsUseCase(
        this.userRepository,
        this.creditPolicy,
        this.cache
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as CheckCreditsUseCase;
  }

  /**
   * Create DeductCreditUseCase with dependencies
   */
  createDeductCreditUseCase(): DeductCreditUseCase {
    const cacheKey = "deductCreditUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new DeductCreditUseCase(
        this.userRepository,
        this.creditTransactionRepository,
        this.creditPolicy,
        this.cache
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as DeductCreditUseCase;
  }

  /**
   * Create GetCreditBalanceUseCase with dependencies
   */
  createGetCreditBalanceUseCase(): GetCreditBalanceUseCase {
    const cacheKey = "getCreditBalanceUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new GetCreditBalanceUseCase(
        this.userRepository,
        this.cache
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetCreditBalanceUseCase;
  }

  /**
   * Create AddCreditsUseCase with dependencies
   */
  createAddCreditsUseCase(): AddCreditsUseCase {
    const cacheKey = "addCreditsUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new AddCreditsUseCase(
        this.userRepository,
        this.creditTransactionRepository,
        this.cache
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as AddCreditsUseCase;
  }

  /**
   * Create GetIdeaWithDocumentsUseCase with dependencies
   */
  createGetIdeaWithDocumentsUseCase(): GetIdeaWithDocumentsUseCase {
    const cacheKey = "getIdeaWithDocumentsUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new GetIdeaWithDocumentsUseCase(
        this.ideaRepository,
        this.documentRepository
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetIdeaWithDocumentsUseCase;
  }

  /**
   * Create UpdateIdeaStatusUseCase with dependencies
   */
  createUpdateIdeaStatusUseCase(): UpdateIdeaStatusUseCase {
    const cacheKey = "updateIdeaStatusUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new UpdateIdeaStatusUseCase(this.ideaRepository);
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as UpdateIdeaStatusUseCase;
  }

  /**
   * Create SaveIdeaMetadataUseCase with dependencies
   */
  createSaveIdeaMetadataUseCase(): SaveIdeaMetadataUseCase {
    const cacheKey = "saveIdeaMetadataUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new SaveIdeaMetadataUseCase(this.ideaRepository);
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as SaveIdeaMetadataUseCase;
  }

  /**
   * Create GetUserIdeasUseCase with dependencies
   */
  createGetUserIdeasUseCase(): GetUserIdeasUseCase {
    const cacheKey = "getUserIdeasUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new GetUserIdeasUseCase(
        this.ideaRepository,
        this.documentRepository
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetUserIdeasUseCase;
  }

  /**
   * Create DeleteIdeaUseCase with dependencies
   */
  createDeleteIdeaUseCase(): DeleteIdeaUseCase {
    const cacheKey = "deleteIdeaUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new DeleteIdeaUseCase(this.ideaRepository);
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as DeleteIdeaUseCase;
  }

  /**
   * Create GetDocumentsByIdeaUseCase with dependencies
   */
  createGetDocumentsByIdeaUseCase(): GetDocumentsByIdeaUseCase {
    const cacheKey = "getDocumentsByIdeaUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new GetDocumentsByIdeaUseCase(
        this.documentRepository,
        this.ideaRepository
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetDocumentsByIdeaUseCase;
  }

  /**
   * Create SaveAnalysisToIdeaPanelUseCase with dependencies
   */
  createSaveAnalysisToIdeaPanelUseCase(): SaveAnalysisToIdeaPanelUseCase {
    const cacheKey = "saveAnalysisToIdeaPanelUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new SaveAnalysisToIdeaPanelUseCase(
        this.ideaRepository,
        this.documentRepository
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as SaveAnalysisToIdeaPanelUseCase;
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
