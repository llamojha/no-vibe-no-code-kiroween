import { SupabaseClient } from "@supabase/supabase-js";
import { AnalysisController } from "../web/controllers/AnalysisController";
import { HackathonController } from "../web/controllers/HackathonController";
import { DashboardController } from "../web/controllers/DashboardController";
import { IdeaPanelController } from "../web/controllers/IdeaPanelController";
import { DocumentGeneratorController } from "../web/controllers/DocumentGeneratorController";

// Import handlers
import {
  CreateAnalysisHandler,
  UpdateAnalysisHandler,
  DeleteAnalysisHandler,
} from "../../application/handlers/commands";
import {
  GetAnalysisHandler,
  ListAnalysesHandler,
  SearchAnalysesHandler,
} from "../../application/handlers/queries";
import {
  CreateHackathonAnalysisHandler,
  UpdateHackathonAnalysisHandler,
} from "../../application/handlers/commands";
import {
  GetHackathonLeaderboardHandler,
  SearchHackathonAnalysesHandler,
} from "../../application/handlers/queries";

// Import factories
import { RepositoryFactory } from "./RepositoryFactory";
import { UseCaseFactory } from "./UseCaseFactory";

// Import services
import { AnalysisValidationService } from "../../domain/services/AnalysisValidationService";
import { ScoreCalculationService } from "../../domain/services/ScoreCalculationService";
import { NotificationService } from "../../application/services/NotificationService";
import { AuthenticationService } from "../../application/services/AuthenticationService";
import { SessionService } from "../../application/services/SessionService";

// Import integration adapters
import { SupabaseAdapter } from "../integration/SupabaseAdapter";
import { FeatureFlagAdapter } from "../integration/FeatureFlagAdapter";
import { LocaleAdapter } from "../integration/LocaleAdapter";

// Import external service adapters
import { TextToSpeechAdapter } from "../external/ai/TextToSpeechAdapter";
import { TranscriptionAdapter } from "../external/ai/TranscriptionAdapter";
import { GoogleAIAdapter } from "../external/ai/GoogleAIAdapter";
import { GoogleAIDocumentGeneratorAdapter } from "../external/ai/GoogleAIDocumentGeneratorAdapter";
import { IAIDocumentGeneratorService } from "../../application/services/IAIDocumentGeneratorService";

// Import cache
import { InMemoryCache } from "../cache/InMemoryCache";
import { ICache } from "../cache/ICache";

// Import mock services and testing utilities
import { MockAIAnalysisService } from "@/lib/testing/mocks/MockAIAnalysisService";
import { MockFrankensteinService } from "@/lib/testing/mocks/MockFrankensteinService";
import { TestDataManager } from "@/lib/testing/TestDataManager";
import { FeatureFlagManager } from "@/lib/testing/FeatureFlagManager";
import { MockServiceConfig } from "@/lib/testing/types";
import { IAIAnalysisService } from "../../application/services/IAIAnalysisService";

// Import use cases
import {
  GetUserAnalysesUseCase,
  GetDashboardStatsUseCase,
} from "../../application/use-cases";
import {
  GetUserByIdUseCase,
  CreateUserUseCase,
  UpdateUserLastLoginUseCase,
} from "../../application/use-cases/user";

/**
 * Service factory for creating configured service instances
 *
 * ⚠️ SECURITY: No singleton pattern - creates fresh instance per request
 *
 * This factory MUST be instantiated per request to prevent session leaks.
 * Each HTTP request needs its own factory with its own Supabase client
 * containing that request's user session.
 *
 * @see docs/SECURITY.md for detailed explanation
 */
export class ServiceFactory {
  private services: Map<string, unknown> = new Map();
  private repositoryFactory: RepositoryFactory;
  private useCaseFactory: UseCaseFactory | null = null;
  private featureFlagAdapter: FeatureFlagAdapter;
  private localeAdapter: LocaleAdapter;
  private mockFeatureFlagManager: FeatureFlagManager;
  private cache: ICache;

  private constructor(private readonly supabaseClient: SupabaseClient) {
    this.repositoryFactory = RepositoryFactory.create(supabaseClient);
    this.cache = new InMemoryCache();
    this.featureFlagAdapter = FeatureFlagAdapter.getInstance();
    this.localeAdapter = LocaleAdapter.getInstance();
    this.mockFeatureFlagManager = new FeatureFlagManager();
    this.initializeUseCaseFactory();
  }

  /**
   * Create a new ServiceFactory instance
   *
   * ✅ SAFE: Always creates fresh instance per request
   *
   * @param supabaseClient - Fresh Supabase client from current request
   * @returns New ServiceFactory instance
   *
   * @example
   * // In API Route
   * export async function GET(request: NextRequest) {
   *   const supabase = SupabaseAdapter.getServerClient(); // Fresh client
   *   const factory = ServiceFactory.create(supabase);    // Fresh factory
   *   const controller = factory.createAnalysisController();
   *   return controller.listAnalyses(request);
   * }
   */
  static create(supabaseClient: SupabaseClient): ServiceFactory {
    return new ServiceFactory(supabaseClient);
  }

  /**
   * @deprecated Use ServiceFactory.create() instead
   * This method is kept for backward compatibility but will be removed.
   * It now creates a fresh instance instead of returning a cached singleton.
   */
  static getInstance(supabaseClient: SupabaseClient): ServiceFactory {
    return ServiceFactory.create(supabaseClient);
  }

  /**
   * Initialize the use case factory with all required dependencies
   */
  private initializeUseCaseFactory(): void {
    const analysisRepository =
      this.repositoryFactory.createAnalysisRepository();
    const userRepository = this.repositoryFactory.createUserRepository();
    const creditTransactionRepository =
      this.repositoryFactory.createCreditTransactionRepository();

    // Create domain services
    const analysisValidationService = new AnalysisValidationService();
    const scoreCalculationService = new ScoreCalculationService();

    // Create application services
    const notificationService = new NotificationService({
      emailProvider: "sendgrid",
      pushProvider: "firebase",
      smsProvider: "twilio",
      apiKeys: {},
      defaultFromEmail: "noreply@novibenocode.com",
      defaultFromName: "No Vibe No Code",
      timeout: 30000,
      maxRetries: 3,
      rateLimits: {
        email: 100,
        push: 200,
        sms: 50,
      },
    });

    const ideaRepository = this.repositoryFactory.createIdeaRepository();
    const documentRepository =
      this.repositoryFactory.createDocumentRepository();

    // Create AI Document Generator Service (optional - may fail if API key not configured)
    let aiDocumentGeneratorService;
    try {
      aiDocumentGeneratorService = this.createAIDocumentGeneratorService();
    } catch (error) {
      // AI Document Generator Service is optional - log warning but continue
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[ServiceFactory] AI Document Generator Service not available:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    this.useCaseFactory = UseCaseFactory.create(
      analysisRepository,
      userRepository,
      creditTransactionRepository,
      ideaRepository,
      documentRepository,
      // aiAnalysisService, // Temporarily disabled
      notificationService,
      analysisValidationService,
      scoreCalculationService,
      this.cache,
      aiDocumentGeneratorService
    );
  }

  /**
   * Create AnalysisController with all dependencies
   */
  createAnalysisController(): AnalysisController {
    const cacheKey = "analysisController";

    if (!this.services.has(cacheKey)) {
      // Create handlers
      const createAnalysisHandler = this.createCreateAnalysisHandler();
      const updateAnalysisHandler = this.createUpdateAnalysisHandler();
      const deleteAnalysisHandler = this.createDeleteAnalysisHandler();
      const getAnalysisHandler = this.createGetAnalysisHandler();
      const listAnalysesHandler = this.createListAnalysesHandler();
      const searchAnalysesHandler = this.createSearchAnalysesHandler();

      // Create credit use cases
      const checkCreditsUseCase =
        this.useCaseFactory!.createCheckCreditsUseCase();
      const getCreditBalanceUseCase =
        this.useCaseFactory!.createGetCreditBalanceUseCase();
      const deductCreditUseCase =
        this.useCaseFactory!.createDeductCreditUseCase();

      // Get user repository
      const userRepository = this.repositoryFactory!.createUserRepository();

      // Create SaveAnalysisToIdeaPanelUseCase
      const saveAnalysisToIdeaPanelUseCase =
        this.useCaseFactory!.createSaveAnalysisToIdeaPanelUseCase();

      const controller = new AnalysisController(
        createAnalysisHandler,
        updateAnalysisHandler,
        deleteAnalysisHandler,
        getAnalysisHandler,
        listAnalysesHandler,
        searchAnalysesHandler,
        checkCreditsUseCase,
        getCreditBalanceUseCase,
        deductCreditUseCase,
        userRepository,
        saveAnalysisToIdeaPanelUseCase
      );

      this.services.set(cacheKey, controller);
    }

    return this.services.get(cacheKey) as AnalysisController;
  }

  /**
   * Create HackathonController with all dependencies
   */
  createHackathonController(): HackathonController {
    const cacheKey = "hackathonController";

    if (!this.services.has(cacheKey)) {
      // Create handlers
      const createHackathonAnalysisHandler =
        this.createCreateHackathonAnalysisHandler();
      const updateHackathonAnalysisHandler =
        this.createUpdateHackathonAnalysisHandler();
      const getHackathonLeaderboardHandler =
        this.createGetHackathonLeaderboardHandler();
      const searchHackathonAnalysesHandler =
        this.createSearchHackathonAnalysesHandler();

      // Create CheckCreditsUseCase
      const checkCreditsUseCase =
        this.useCaseFactory!.createCheckCreditsUseCase();
      const deductCreditUseCase =
        this.useCaseFactory!.createDeductCreditUseCase();

      // Get user repository
      const userRepository = this.repositoryFactory!.createUserRepository();

      // Create SaveAnalysisToIdeaPanelUseCase
      const saveAnalysisToIdeaPanelUseCase =
        this.useCaseFactory!.createSaveAnalysisToIdeaPanelUseCase();

      const controller = new HackathonController(
        createHackathonAnalysisHandler,
        updateHackathonAnalysisHandler,
        getHackathonLeaderboardHandler,
        searchHackathonAnalysesHandler,
        checkCreditsUseCase,
        deductCreditUseCase,
        userRepository,
        saveAnalysisToIdeaPanelUseCase
      );

      this.services.set(cacheKey, controller);
    }

    return this.services.get(cacheKey) as HackathonController;
  }

  /**
   * Create DashboardController with all dependencies
   */
  createDashboardController(): DashboardController {
    const cacheKey = "dashboardController";

    if (!this.services.has(cacheKey)) {
      // Create handlers
      const listAnalysesHandler = this.createListAnalysesHandler();
      const searchAnalysesHandler = this.createSearchAnalysesHandler();
      const getAnalysisHandler = this.createGetAnalysisHandler();
      const deleteAnalysisHandler = this.createDeleteAnalysisHandler();

      // Create dashboard use cases
      const getUserAnalysesUseCase = this.createGetUserAnalysesUseCase();
      const getDashboardStatsUseCase = this.createGetDashboardStatsUseCase();

      const controller = new DashboardController(
        listAnalysesHandler,
        searchAnalysesHandler,
        getAnalysisHandler,
        deleteAnalysisHandler,
        getUserAnalysesUseCase,
        getDashboardStatsUseCase
      );

      this.services.set(cacheKey, controller);
    }

    return this.services.get(cacheKey) as DashboardController;
  }

  /**
   * Create IdeaPanelController with all dependencies
   */
  createIdeaPanelController(): IdeaPanelController {
    const cacheKey = "ideaPanelController";

    if (!this.services.has(cacheKey)) {
      if (!this.useCaseFactory) {
        throw new Error("Use case factory not initialized");
      }

      // Create use cases
      const getIdeaWithDocumentsUseCase =
        this.useCaseFactory.createGetIdeaWithDocumentsUseCase();
      const updateStatusUseCase =
        this.useCaseFactory.createUpdateIdeaStatusUseCase();
      const saveMetadataUseCase =
        this.useCaseFactory.createSaveIdeaMetadataUseCase();
      const getUserIdeasUseCase =
        this.useCaseFactory.createGetUserIdeasUseCase();
      const deleteIdeaUseCase = this.useCaseFactory.createDeleteIdeaUseCase();

      const controller = new IdeaPanelController(
        getIdeaWithDocumentsUseCase,
        updateStatusUseCase,
        saveMetadataUseCase,
        getUserIdeasUseCase,
        deleteIdeaUseCase
      );

      this.services.set(cacheKey, controller);
    }

    return this.services.get(cacheKey) as IdeaPanelController;
  }

  /**
   * Create DocumentGeneratorController with all dependencies
   */
  createDocumentGeneratorController(): DocumentGeneratorController {
    const cacheKey = "documentGeneratorController";

    if (!this.services.has(cacheKey)) {
      if (!this.useCaseFactory) {
        throw new Error("Use case factory not initialized");
      }

      // Create use cases
      const generateDocumentUseCase =
        this.useCaseFactory.createGenerateDocumentUseCase();
      const updateDocumentUseCase =
        this.useCaseFactory.createUpdateDocumentUseCase();
      const regenerateDocumentUseCase =
        this.useCaseFactory.createRegenerateDocumentUseCase();
      const getVersionsUseCase =
        this.useCaseFactory.createGetDocumentVersionsUseCase();
      const restoreVersionUseCase =
        this.useCaseFactory.createRestoreDocumentVersionUseCase();
      const getDocumentByIdUseCase =
        this.useCaseFactory.createGetDocumentByIdUseCase();
      const exportDocumentUseCase =
        this.useCaseFactory.createExportDocumentUseCase();

      const controller = new DocumentGeneratorController(
        generateDocumentUseCase,
        updateDocumentUseCase,
        regenerateDocumentUseCase,
        getVersionsUseCase,
        restoreVersionUseCase,
        getDocumentByIdUseCase,
        exportDocumentUseCase
      );

      this.services.set(cacheKey, controller);
    }

    return this.services.get(cacheKey) as DocumentGeneratorController;
  }

  // Private methods to create handlers

  private createCreateAnalysisHandler(): CreateAnalysisHandler {
    if (!this.useCaseFactory) {
      throw new Error("Use case factory not initialized");
    }
    const analyzeIdeaUseCase = this.useCaseFactory.createAnalyzeIdeaUseCase();
    return new CreateAnalysisHandler(analyzeIdeaUseCase);
  }

  private createUpdateAnalysisHandler(): UpdateAnalysisHandler {
    if (!this.useCaseFactory) {
      throw new Error("Use case factory not initialized");
    }
    const saveAnalysisUseCase = this.useCaseFactory.createSaveAnalysisUseCase();
    return new UpdateAnalysisHandler(saveAnalysisUseCase);
  }

  private createDeleteAnalysisHandler(): DeleteAnalysisHandler {
    if (!this.useCaseFactory) {
      throw new Error("Use case factory not initialized");
    }
    const deleteAnalysisUseCase =
      this.useCaseFactory.createDeleteAnalysisUseCase();
    return new DeleteAnalysisHandler(deleteAnalysisUseCase);
  }

  private createGetAnalysisHandler(): GetAnalysisHandler {
    if (!this.useCaseFactory) {
      throw new Error("Use case factory not initialized");
    }
    const getAnalysisUseCase = this.useCaseFactory.createGetAnalysisUseCase();
    return new GetAnalysisHandler(getAnalysisUseCase);
  }

  private createListAnalysesHandler(): ListAnalysesHandler {
    const analysisRepository =
      this.repositoryFactory.createAnalysisRepository();
    return new ListAnalysesHandler(analysisRepository);
  }

  private createSearchAnalysesHandler(): SearchAnalysesHandler {
    const analysisRepository =
      this.repositoryFactory.createAnalysisRepository();
    return new SearchAnalysesHandler(analysisRepository);
  }

  private createCreateHackathonAnalysisHandler(): CreateHackathonAnalysisHandler {
    if (!this.useCaseFactory) {
      throw new Error("Use case factory not initialized");
    }
    const analyzeHackathonProjectUseCase =
      this.useCaseFactory.createAnalyzeHackathonProjectUseCase();
    return new CreateHackathonAnalysisHandler(analyzeHackathonProjectUseCase);
  }

  private createUpdateHackathonAnalysisHandler(): UpdateHackathonAnalysisHandler {
    if (!this.useCaseFactory) {
      throw new Error("Use case factory not initialized");
    }
    const saveHackathonAnalysisUseCase =
      this.useCaseFactory.createSaveHackathonAnalysisUseCase();
    return new UpdateHackathonAnalysisHandler(saveHackathonAnalysisUseCase);
  }

  private createGetHackathonLeaderboardHandler(): GetHackathonLeaderboardHandler {
    if (!this.useCaseFactory) {
      throw new Error("Use case factory not initialized");
    }
    const getHackathonLeaderboardUseCase =
      this.useCaseFactory.createGetHackathonLeaderboardUseCase();
    return new GetHackathonLeaderboardHandler(getHackathonLeaderboardUseCase);
  }

  private createSearchHackathonAnalysesHandler(): SearchHackathonAnalysesHandler {
    const hackathonRepository =
      this.repositoryFactory.createAnalysisRepository();
    // Cast to IHackathonAnalysisRepository - hackathon-specific repository not yet implemented
    // Using type assertion since SupabaseAnalysisRepository doesn't fully implement IHackathonAnalysisRepository yet
    return new SearchHackathonAnalysesHandler(hackathonRepository as any);
  }

  private createGetUserAnalysesUseCase(): GetUserAnalysesUseCase {
    if (!this.useCaseFactory) {
      throw new Error("Use case factory not initialized");
    }
    return this.useCaseFactory.createGetUserAnalysesUseCase();
  }

  private createGetDashboardStatsUseCase(): GetDashboardStatsUseCase {
    if (!this.useCaseFactory) {
      throw new Error("Use case factory not initialized");
    }
    return this.useCaseFactory.createGetDashboardStatsUseCase();
  }

  /**
   * Get repository factory instance
   */
  getRepositoryFactory(): RepositoryFactory {
    return this.repositoryFactory;
  }

  /**
   * Get use case factory instance
   */
  getUseCaseFactory(): UseCaseFactory {
    if (!this.useCaseFactory) {
      throw new Error("Use case factory not initialized");
    }
    return this.useCaseFactory;
  }

  /**
   * Create AuthenticationService with all dependencies
   */
  createAuthenticationService(): AuthenticationService {
    const cacheKey = "authenticationService";

    if (!this.services.has(cacheKey)) {
      const userRepository = this.repositoryFactory.createUserRepository();

      // Create user use cases
      const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
      const createUserUseCase = new CreateUserUseCase(userRepository);
      const updateUserLastLoginUseCase = new UpdateUserLastLoginUseCase(
        userRepository
      );

      const authService = new AuthenticationService(
        this.supabaseClient,
        getUserByIdUseCase,
        createUserUseCase,
        updateUserLastLoginUseCase
      );

      this.services.set(cacheKey, authService);
    }

    return this.services.get(cacheKey) as AuthenticationService;
  }

  /**
   * Create SessionService with all dependencies
   */
  createSessionService(): SessionService {
    const cacheKey = "sessionService";

    if (!this.services.has(cacheKey)) {
      const authService = this.createAuthenticationService();
      const sessionService = new SessionService(authService);

      this.services.set(cacheKey, sessionService);
    }

    return this.services.get(cacheKey) as SessionService;
  }

  /**
   * Get feature flag adapter instance
   */
  getFeatureFlagAdapter(): FeatureFlagAdapter {
    return this.featureFlagAdapter;
  }

  /**
   * Get locale adapter instance
   */
  getLocaleAdapter(): LocaleAdapter {
    return this.localeAdapter;
  }

  /**
   * Get Supabase adapter utilities
   */
  getSupabaseAdapter() {
    return {
      getServerClient: () => SupabaseAdapter.getServerClient(),
      getClientClient: () => SupabaseAdapter.getClientClient(),
      executeWithErrorHandling: SupabaseAdapter.executeWithErrorHandling,
      executeOptional: SupabaseAdapter.executeOptional,
      handleError: SupabaseAdapter.handleError,
    };
  }

  /**
   * Create TextToSpeechAdapter with all dependencies
   */
  createTextToSpeechAdapter(): TextToSpeechAdapter {
    const cacheKey = "textToSpeechAdapter";

    if (!this.services.has(cacheKey)) {
      const googleAI = this.createGoogleAIAdapter();
      const ttsAdapter = new TextToSpeechAdapter(googleAI, {
        maxTextLength: 15000,
        timeout: 30000,
      });

      this.services.set(cacheKey, ttsAdapter);
    }

    return this.services.get(cacheKey) as TextToSpeechAdapter;
  }

  /**
   * Create TranscriptionAdapter with all dependencies
   */
  createTranscriptionAdapter(): TranscriptionAdapter {
    const cacheKey = "transcriptionAdapter";

    if (!this.services.has(cacheKey)) {
      const googleAI = this.createGoogleAIAdapter();
      const transcriptionAdapter = new TranscriptionAdapter(googleAI, {
        maxAudioSize: 10 * 1024 * 1024, // 10MB
        timeout: 60000,
        confidenceThreshold: 0.7,
      });

      this.services.set(cacheKey, transcriptionAdapter);
    }

    return this.services.get(cacheKey) as TranscriptionAdapter;
  }

  /**
   * Create GoogleAIAdapter with configuration
   */
  private createGoogleAIAdapter(): GoogleAIAdapter {
    const cacheKey = "googleAIAdapter";

    if (!this.services.has(cacheKey)) {
      const googleAI = GoogleAIAdapter.create();
      this.services.set(cacheKey, googleAI);
    }

    return this.services.get(cacheKey) as GoogleAIAdapter;
  }

  /**
   * Create AI Document Generator Service
   *
   * Creates a GoogleAIDocumentGeneratorAdapter for generating
   * PRD, Technical Design, Architecture, and Roadmap documents.
   *
   * @returns IAIDocumentGeneratorService implementation
   */
  createAIDocumentGeneratorService(): IAIDocumentGeneratorService {
    const cacheKey = "aiDocumentGeneratorService";

    if (!this.services.has(cacheKey)) {
      const service = GoogleAIDocumentGeneratorAdapter.create();
      this.services.set(cacheKey, service);

      if (process.env.NODE_ENV !== "production") {
        console.log(
          "[ServiceFactory] ✅ AI Document Generator Service created"
        );
      }
    }

    return this.services.get(cacheKey) as IAIDocumentGeneratorService;
  }

  /**
   * Verify mock mode is properly configured
   *
   * This method validates that:
   * - TestDataManager can load mock responses
   * - Feature flags are properly set
   * - Configuration is valid for the current environment
   *
   * @throws Error if mock configuration is invalid
   * @private
   */
  private verifyMockConfiguration(): void {
    if (!this.mockFeatureFlagManager.isMockModeEnabled()) {
      return; // No verification needed if mock mode is disabled
    }

    try {
      // Verify TestDataManager can load mock responses for each type
      const testDataManager = new TestDataManager();

      // Test loading analyzer mock responses
      try {
        testDataManager.getMockResponse("analyzer", "success");
      } catch (error) {
        throw new Error(
          `Mock mode is enabled but analyzer mock data cannot be loaded: ${
            (error as Error).message
          }`
        );
      }

      // Test loading hackathon mock responses
      try {
        testDataManager.getMockResponse("hackathon", "success");
      } catch (error) {
        throw new Error(
          `Mock mode is enabled but hackathon mock data cannot be loaded: ${
            (error as Error).message
          }`
        );
      }

      // Test loading frankenstein mock responses
      try {
        testDataManager.getMockResponse("frankenstein", "success");
      } catch (error) {
        throw new Error(
          `Mock mode is enabled but frankenstein mock data cannot be loaded: ${
            (error as Error).message
          }`
        );
      }

      // Verify feature flags are properly set
      const mockConfig = this.mockFeatureFlagManager.getMockServiceConfig();
      const defaultScenario = mockConfig.defaultScenario ?? "success";
      const validScenarios = [
        "success",
        "api_error",
        "timeout",
        "rate_limit",
        "invalid_input",
        "partial_response",
      ];

      if (!validScenarios.includes(defaultScenario)) {
        console.warn(
          `[ServiceFactory] Invalid mock scenario "${defaultScenario}". ` +
            `Valid scenarios: ${validScenarios.join(
              ", "
            )}. Using "success" as fallback.`
        );
      }

      // Log mock mode activation (only in non-production)
      if (process.env.NODE_ENV !== "production") {
        console.log("[ServiceFactory] ✅ Mock mode verified and active", {
          scenario: defaultScenario,
          simulateLatency: mockConfig.simulateLatency,
          minLatency: mockConfig.minLatency,
          maxLatency: mockConfig.maxLatency,
        });
      }
    } catch (error) {
      // Throw descriptive error if configuration is invalid
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Mock configuration verification failed: ${errorMessage}. ` +
          `Please ensure mock data files exist and feature flags are properly configured.`
      );
    }
  }

  /**
   * Create AI Analysis Service (mock or production based on feature flag)
   *
   * This method checks the mock mode feature flag and returns either:
   * - MockAIAnalysisService when mock mode is enabled
   * - GoogleAIAnalysisService when mock mode is disabled (production)
   *
   * @returns IAIAnalysisService implementation
   */
  createAIAnalysisService(): IAIAnalysisService {
    const cacheKey = "aiAnalysisService";

    if (!this.services.has(cacheKey)) {
      // Verify mock configuration before creating service
      this.verifyMockConfiguration();

      // Check if mock mode is enabled
      if (this.mockFeatureFlagManager.isMockModeEnabled()) {
        // Create mock service with configuration
        const testDataManager = new TestDataManager();
        const mockConfig = this.getMockServiceConfig();
        const mockService = new MockAIAnalysisService(
          testDataManager,
          mockConfig
        );

        this.services.set(cacheKey, mockService);

        // Log when mock service is created (only in non-production)
        if (process.env.NODE_ENV !== "production") {
          console.log("[ServiceFactory] ✅ Mock AI Analysis Service created", {
            scenario: mockConfig.defaultScenario,
            simulateLatency: mockConfig.simulateLatency,
          });
        }
      } else {
        // Create production Google AI service
        // TODO: Implement GoogleAIAnalysisService adapter
        // Improved error message for production service
        throw new Error(
          "Production AI Analysis Service is not yet implemented. " +
            "To use the application in test mode, enable mock mode by setting " +
            "the environment variable FF_USE_MOCK_API=true. " +
            "For production deployment, implement GoogleAIAnalysisService adapter."
        );
      }
    }

    return this.services.get(cacheKey) as IAIAnalysisService;
  }

  /**
   * Create Doctor Frankenstein service (currently mock-only)
   *
   * Returns a configured MockFrankensteinService when mock mode is enabled.
   * Throws a descriptive error if mock mode is disabled since the production
   * implementation has not been integrated yet.
   */
  createFrankensteinService(): MockFrankensteinService {
    const cacheKey = "frankensteinService";

    if (!this.services.has(cacheKey)) {
      this.verifyMockConfiguration();

      if (!this.mockFeatureFlagManager.isMockModeEnabled()) {
        throw new Error(
          "Frankenstein service is only available in mock mode. " +
            "Enable FF_USE_MOCK_API or configure a mock scenario before calling this method."
        );
      }

      const testDataManager = new TestDataManager();
      const mockConfig = this.getMockServiceConfig();
      const mockService = new MockFrankensteinService(
        testDataManager,
        mockConfig
      );

      this.services.set(cacheKey, mockService);

      if (process.env.NODE_ENV !== "production") {
        console.log("[ServiceFactory] ✅ Mock Frankenstein Service created", {
          scenario: mockConfig.defaultScenario,
          simulateLatency: mockConfig.simulateLatency,
        });
      }
    }

    return this.services.get(cacheKey) as MockFrankensteinService;
  }

  /**
   * Get mock service configuration from feature flags
   *
   * Reads mock configuration from environment variables via FeatureFlagManager
   * and provides sensible defaults for all settings.
   *
   * @returns MockServiceConfig with validated configuration
   * @private
   */
  private getMockServiceConfig(): MockServiceConfig {
    return this.mockFeatureFlagManager.getMockServiceConfig();
  }

  /**
   * Check if mock mode is currently enabled
   *
   * @returns true if mock mode is active, false otherwise
   */
  isMockModeEnabled(): boolean {
    return this.mockFeatureFlagManager.isMockModeEnabled();
  }

  /**
   * Get the mock feature flag manager instance
   *
   * @returns FeatureFlagManager instance
   */
  getMockFeatureFlagManager(): FeatureFlagManager {
    return this.mockFeatureFlagManager;
  }

  /**
   * Create ExportKiroSetupUseCase through the use case factory
   *
   * Convenience method for creating the Kiro Setup Export use case.
   * This use case orchestrates the export of a complete Kiro workspace setup
   * from generated project documentation.
   *
   * Requirements: 1.2
   */
  createExportKiroSetupUseCase() {
    if (!this.useCaseFactory) {
      throw new Error("Use case factory not initialized");
    }
    return this.useCaseFactory.createExportKiroSetupUseCase();
  }

  /**
   * Get diagnostic information about current service configuration
   *
   * This method provides detailed information about:
   * - Current mock mode status
   * - List of services that have been created
   * - Feature flag configuration
   *
   * Useful for debugging and verifying the service factory state.
   *
   * @returns Diagnostic information object
   */
  getDiagnostics(): {
    mockMode: boolean;
    servicesCreated: string[];
    configuration: Record<string, unknown>;
  } {
    return {
      mockMode: this.isMockModeEnabled(),
      servicesCreated: Array.from(this.services.keys()),
      configuration: this.mockFeatureFlagManager.getAllFlags(),
    };
  }

  /**
   * Clear all service caches (useful for testing)
   */
  clearCache(): void {
    this.services.clear();
    this.repositoryFactory.clearCache();
    if (this.useCaseFactory) {
      this.useCaseFactory.clearCache();
    }
  }
}
