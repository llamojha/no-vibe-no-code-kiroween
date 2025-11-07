import { SupabaseClient } from '@supabase/supabase-js';
import { AnalysisController } from '../web/controllers/AnalysisController';
import { HackathonController } from '../web/controllers/HackathonController';
import { DashboardController } from '../web/controllers/DashboardController';

// Import handlers
import { 
  CreateAnalysisHandler,
  UpdateAnalysisHandler,
  DeleteAnalysisHandler 
} from '../../application/handlers/commands';
import { 
  GetAnalysisHandler,
  ListAnalysesHandler,
  SearchAnalysesHandler 
} from '../../application/handlers/queries';
import {
  CreateHackathonAnalysisHandler,
  UpdateHackathonAnalysisHandler
} from '../../application/handlers/commands';
import {
  GetHackathonLeaderboardHandler,
  SearchHackathonAnalysesHandler
} from '../../application/handlers/queries';

// Import factories
import { RepositoryFactory } from './RepositoryFactory';
import { UseCaseFactory } from './UseCaseFactory';

// Import services
import { AnalysisValidationService } from '../../domain/services/AnalysisValidationService';
import { ScoreCalculationService } from '../../domain/services/ScoreCalculationService';
import { NotificationService } from '../../application/services/NotificationService';
import { AuthenticationService } from '../../application/services/AuthenticationService';
import { SessionService } from '../../application/services/SessionService';

// Import integration adapters
import { SupabaseAdapter } from '../integration/SupabaseAdapter';
import { FeatureFlagAdapter } from '../integration/FeatureFlagAdapter';
import { LocaleAdapter } from '../integration/LocaleAdapter';

// Import external service adapters
import { TextToSpeechAdapter } from '../external/ai/TextToSpeechAdapter';
import { TranscriptionAdapter } from '../external/ai/TranscriptionAdapter';
import { GoogleAIAdapter } from '../external/ai/GoogleAIAdapter';

// Import use cases
import { GetUserAnalysesUseCase, GetDashboardStatsUseCase } from '../../application/use-cases';
import { GetUserByIdUseCase, CreateUserUseCase, UpdateUserLastLoginUseCase } from '../../application/use-cases/user';

/**
 * Service factory for creating configured service instances
 * Implements singleton pattern for expensive resources
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: Map<string, unknown> = new Map();
  private repositoryFactory: RepositoryFactory;
  private useCaseFactory: UseCaseFactory | null = null;
  private featureFlagAdapter: FeatureFlagAdapter;
  private localeAdapter: LocaleAdapter;

  private constructor(
    private readonly supabaseClient: SupabaseClient
  ) {
    this.repositoryFactory = RepositoryFactory.getInstance(supabaseClient);
    this.featureFlagAdapter = FeatureFlagAdapter.getInstance();
    this.localeAdapter = LocaleAdapter.getInstance();
    this.initializeUseCaseFactory();
  }

  static getInstance(supabaseClient: SupabaseClient): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory(supabaseClient);
    }
    return ServiceFactory.instance;
  }

  /**
   * Initialize the use case factory with all required dependencies
   */
  private initializeUseCaseFactory(): void {
    const analysisRepository = this.repositoryFactory.createAnalysisRepository();
    const userRepository = this.repositoryFactory.createUserRepository();
    
    // Create domain services
    const analysisValidationService = new AnalysisValidationService();
    const scoreCalculationService = new ScoreCalculationService();
    
    // Create application services
    const notificationService = new NotificationService({
      emailProvider: 'sendgrid',
      pushProvider: 'firebase',
      smsProvider: 'twilio',
      apiKeys: {},
      defaultFromEmail: 'noreply@novibenocode.com',
      defaultFromName: 'No Vibe No Code',
      timeout: 30000,
      maxRetries: 3,
      rateLimits: {
        email: 100,
        push: 200,
        sms: 50
      }
    });
    
    this.useCaseFactory = UseCaseFactory.getInstance(
      analysisRepository,
      userRepository,
      // aiAnalysisService, // Temporarily disabled
      notificationService,
      analysisValidationService,
      scoreCalculationService
    );
  }

  /**
   * Create AnalysisController with all dependencies
   */
  createAnalysisController(): AnalysisController {
    const cacheKey = 'analysisController';
    
    if (!this.services.has(cacheKey)) {
      // Create handlers
      const createAnalysisHandler = this.createCreateAnalysisHandler();
      const updateAnalysisHandler = this.createUpdateAnalysisHandler();
      const deleteAnalysisHandler = this.createDeleteAnalysisHandler();
      const getAnalysisHandler = this.createGetAnalysisHandler();
      const listAnalysesHandler = this.createListAnalysesHandler();
      const searchAnalysesHandler = this.createSearchAnalysesHandler();

      const controller = new AnalysisController(
        createAnalysisHandler,
        updateAnalysisHandler,
        deleteAnalysisHandler,
        getAnalysisHandler,
        listAnalysesHandler,
        searchAnalysesHandler
      );

      this.services.set(cacheKey, controller);
    }

    return this.services.get(cacheKey) as AnalysisController;
  }

  /**
   * Create HackathonController with all dependencies
   */
  createHackathonController(): HackathonController {
    const cacheKey = 'hackathonController';
    
    if (!this.services.has(cacheKey)) {
      // Create handlers
      const createHackathonAnalysisHandler = this.createCreateHackathonAnalysisHandler();
      const updateHackathonAnalysisHandler = this.createUpdateHackathonAnalysisHandler();
      const getHackathonLeaderboardHandler = this.createGetHackathonLeaderboardHandler();
      const searchHackathonAnalysesHandler = this.createSearchHackathonAnalysesHandler();

      const controller = new HackathonController(
        createHackathonAnalysisHandler,
        updateHackathonAnalysisHandler,
        getHackathonLeaderboardHandler,
        searchHackathonAnalysesHandler
      );

      this.services.set(cacheKey, controller);
    }

    return this.services.get(cacheKey) as HackathonController;
  }

  /**
   * Create DashboardController with all dependencies
   */
  createDashboardController(): DashboardController {
    const cacheKey = 'dashboardController';
    
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

  // Private methods to create handlers

  private createCreateAnalysisHandler(): CreateAnalysisHandler {
    if (!this.useCaseFactory) {
      throw new Error('Use case factory not initialized');
    }
    const analyzeIdeaUseCase = this.useCaseFactory.createAnalyzeIdeaUseCase();
    return new CreateAnalysisHandler(analyzeIdeaUseCase);
  }

  private createUpdateAnalysisHandler(): UpdateAnalysisHandler {
    if (!this.useCaseFactory) {
      throw new Error('Use case factory not initialized');
    }
    const saveAnalysisUseCase = this.useCaseFactory.createSaveAnalysisUseCase();
    return new UpdateAnalysisHandler(saveAnalysisUseCase);
  }

  private createDeleteAnalysisHandler(): DeleteAnalysisHandler {
    if (!this.useCaseFactory) {
      throw new Error('Use case factory not initialized');
    }
    const deleteAnalysisUseCase = this.useCaseFactory.createDeleteAnalysisUseCase();
    return new DeleteAnalysisHandler(deleteAnalysisUseCase);
  }

  private createGetAnalysisHandler(): GetAnalysisHandler {
    if (!this.useCaseFactory) {
      throw new Error('Use case factory not initialized');
    }
    const getAnalysisUseCase = this.useCaseFactory.createGetAnalysisUseCase();
    return new GetAnalysisHandler(getAnalysisUseCase);
  }

  private createListAnalysesHandler(): ListAnalysesHandler {
    const analysisRepository = this.repositoryFactory.createAnalysisRepository();
    return new ListAnalysesHandler(analysisRepository);
  }

  private createSearchAnalysesHandler(): SearchAnalysesHandler {
    const analysisRepository = this.repositoryFactory.createAnalysisRepository();
    return new SearchAnalysesHandler(analysisRepository);
  }

  private createCreateHackathonAnalysisHandler(): CreateHackathonAnalysisHandler {
    if (!this.useCaseFactory) {
      throw new Error('Use case factory not initialized');
    }
    const analyzeHackathonProjectUseCase = this.useCaseFactory.createAnalyzeHackathonProjectUseCase();
    return new CreateHackathonAnalysisHandler(analyzeHackathonProjectUseCase);
  }

  private createUpdateHackathonAnalysisHandler(): UpdateHackathonAnalysisHandler {
    if (!this.useCaseFactory) {
      throw new Error('Use case factory not initialized');
    }
    const saveHackathonAnalysisUseCase = this.useCaseFactory.createSaveHackathonAnalysisUseCase();
    return new UpdateHackathonAnalysisHandler(saveHackathonAnalysisUseCase);
  }

  private createGetHackathonLeaderboardHandler(): GetHackathonLeaderboardHandler {
    if (!this.useCaseFactory) {
      throw new Error('Use case factory not initialized');
    }
    const getHackathonLeaderboardUseCase = this.useCaseFactory.createGetHackathonLeaderboardUseCase();
    return new GetHackathonLeaderboardHandler(getHackathonLeaderboardUseCase);
  }

  private createSearchHackathonAnalysesHandler(): SearchHackathonAnalysesHandler {
    const hackathonRepository = this.repositoryFactory.createAnalysisRepository();
    // Cast to IHackathonAnalysisRepository - hackathon-specific repository not yet implemented
    // Using type assertion since SupabaseAnalysisRepository doesn't fully implement IHackathonAnalysisRepository yet
    return new SearchHackathonAnalysesHandler(hackathonRepository as any);
  }

  private createGetUserAnalysesUseCase(): GetUserAnalysesUseCase {
    if (!this.useCaseFactory) {
      throw new Error('Use case factory not initialized');
    }
    return this.useCaseFactory.createGetUserAnalysesUseCase();
  }

  private createGetDashboardStatsUseCase(): GetDashboardStatsUseCase {
    if (!this.useCaseFactory) {
      throw new Error('Use case factory not initialized');
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
      throw new Error('Use case factory not initialized');
    }
    return this.useCaseFactory;
  }

  /**
   * Create AuthenticationService with all dependencies
   */
  createAuthenticationService(): AuthenticationService {
    const cacheKey = 'authenticationService';
    
    if (!this.services.has(cacheKey)) {
      const userRepository = this.repositoryFactory.createUserRepository();
      
      // Create user use cases
      const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
      const createUserUseCase = new CreateUserUseCase(userRepository);
      const updateUserLastLoginUseCase = new UpdateUserLastLoginUseCase(userRepository);

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
    const cacheKey = 'sessionService';
    
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
    const cacheKey = 'textToSpeechAdapter';
    
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
    const cacheKey = 'transcriptionAdapter';
    
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
    const cacheKey = 'googleAIAdapter';
    
    if (!this.services.has(cacheKey)) {
      const googleAI = GoogleAIAdapter.create();
      this.services.set(cacheKey, googleAI);
    }

    return this.services.get(cacheKey) as GoogleAIAdapter;
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