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
import { GetDocumentsByIdeaUseCase } from "../../application/use-cases/GetDocumentsByIdeaUseCase";
import { GetDocumentByIdUseCase } from "../../application/use-cases/GetDocumentByIdUseCase";
import { SaveAnalysisToIdeaPanelUseCase } from "../../application/use-cases/SaveAnalysisToIdeaPanelUseCase";
import { DeleteIdeaUseCase } from "../../application/use-cases/DeleteIdeaUseCase";
import { CreateIdeaUseCase } from "../../application/use-cases/CreateIdeaUseCase";
import { GenerateDocumentUseCase } from "../../application/use-cases/GenerateDocumentUseCase";
import { UpdateDocumentUseCase } from "../../application/use-cases/UpdateDocumentUseCase";
import { RegenerateDocumentUseCase } from "../../application/use-cases/RegenerateDocumentUseCase";
import { GetDocumentVersionsUseCase } from "../../application/use-cases/GetDocumentVersionsUseCase";
import { RestoreDocumentVersionUseCase } from "../../application/use-cases/RestoreDocumentVersionUseCase";
import { ExportDocumentUseCase } from "../../application/use-cases/ExportDocumentUseCase";
import { ExportKiroSetupUseCase } from "../../application/use-cases/ExportKiroSetupUseCase";
import { IAIDocumentGeneratorService } from "../../application/services/IAIDocumentGeneratorService";

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
    private readonly cache: ICache,
    private readonly aiDocumentGeneratorService?: IAIDocumentGeneratorService
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
    cache: ICache,
    aiDocumentGeneratorService?: IAIDocumentGeneratorService
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
      cache,
      aiDocumentGeneratorService
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
    cache: ICache,
    aiDocumentGeneratorService?: IAIDocumentGeneratorService
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
      cache,
      aiDocumentGeneratorService
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
   * Create CreateIdeaUseCase with dependencies
   */
  createCreateIdeaUseCase(): CreateIdeaUseCase {
    const cacheKey = "createIdeaUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new CreateIdeaUseCase(this.ideaRepository);
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as CreateIdeaUseCase;
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
   * Create GetDocumentByIdUseCase with dependencies
   */
  createGetDocumentByIdUseCase(): GetDocumentByIdUseCase {
    const cacheKey = "getDocumentByIdUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new GetDocumentByIdUseCase(this.documentRepository);
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetDocumentByIdUseCase;
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
   * Create GenerateDocumentUseCase with dependencies
   */
  createGenerateDocumentUseCase(): GenerateDocumentUseCase {
    const cacheKey = "generateDocumentUseCase";

    if (!this.useCases.has(cacheKey)) {
      if (!this.aiDocumentGeneratorService) {
        throw new Error(
          "AI Document Generator Service not initialized. Configure GEMINI_API_KEY or disable document generation."
        );
      }
      const useCase = new GenerateDocumentUseCase(
        this.documentRepository,
        this.ideaRepository,
        this.userRepository,
        this.creditTransactionRepository,
        this.aiDocumentGeneratorService,
        this.creditPolicy
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GenerateDocumentUseCase;
  }

  /**
   * Create UpdateDocumentUseCase with dependencies
   */
  createUpdateDocumentUseCase(): UpdateDocumentUseCase {
    const cacheKey = "updateDocumentUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new UpdateDocumentUseCase(this.documentRepository);
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as UpdateDocumentUseCase;
  }

  /**
   * Create RegenerateDocumentUseCase with dependencies
   */
  createRegenerateDocumentUseCase(): RegenerateDocumentUseCase {
    const cacheKey = "regenerateDocumentUseCase";

    if (!this.useCases.has(cacheKey)) {
      if (!this.aiDocumentGeneratorService) {
        throw new Error(
          "AI Document Generator Service not initialized. Configure GEMINI_API_KEY or disable document generation."
        );
      }
      const useCase = new RegenerateDocumentUseCase(
        this.documentRepository,
        this.ideaRepository,
        this.userRepository,
        this.creditTransactionRepository,
        this.aiDocumentGeneratorService,
        this.creditPolicy
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as RegenerateDocumentUseCase;
  }

  /**
   * Create GetDocumentVersionsUseCase with dependencies
   */
  createGetDocumentVersionsUseCase(): GetDocumentVersionsUseCase {
    const cacheKey = "getDocumentVersionsUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new GetDocumentVersionsUseCase(
        this.documentRepository,
        this.ideaRepository
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as GetDocumentVersionsUseCase;
  }

  /**
   * Create RestoreDocumentVersionUseCase with dependencies
   */
  createRestoreDocumentVersionUseCase(): RestoreDocumentVersionUseCase {
    const cacheKey = "restoreDocumentVersionUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new RestoreDocumentVersionUseCase(
        this.documentRepository,
        this.ideaRepository
      );
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as RestoreDocumentVersionUseCase;
  }

  /**
   * Create ExportDocumentUseCase with dependencies
   */
  createExportDocumentUseCase(): ExportDocumentUseCase {
    const cacheKey = "exportDocumentUseCase";

    if (!this.useCases.has(cacheKey)) {
      const useCase = new ExportDocumentUseCase(this.documentRepository);
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as ExportDocumentUseCase;
  }

  /**
   * Create ExportKiroSetupUseCase with dependencies
   *
   * Creates the use case for exporting a complete Kiro workspace setup
   * from generated project documentation (PRD, Design, Tech Architecture, Roadmap).
   *
   * Requirements: 1.2
   */
  createExportKiroSetupUseCase(): ExportKiroSetupUseCase {
    const cacheKey = "exportKiroSetupUseCase";

    if (!this.useCases.has(cacheKey)) {
      // ExportKiroSetupUseCase uses default instances for its dependencies
      // (DocumentValidator, FileGenerator, ExportPackager) when not provided
      const useCase = new ExportKiroSetupUseCase();
      this.useCases.set(cacheKey, useCase);
    }

    return this.useCases.get(cacheKey) as ExportKiroSetupUseCase;
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
