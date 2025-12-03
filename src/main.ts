/**
 * Application bootstrap and initialization
 * Main entry point for service initialization and dependency composition
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ServiceFactory } from './infrastructure/factories/ServiceFactory';
import { 
  checkDatabaseConnection,
  checkAIServiceConnection,
  isDevelopment,
  isProduction,
  isTest
} from './infrastructure/config';
import { 
  performStartupValidation,
  generateValidationReport,
  isValidationPassed
} from './infrastructure/bootstrap/validation';
import { logger } from '@/lib/logger';
import { resolveMockModeFlag } from '@/lib/testing/config/mock-mode-flags';

/**
 * Application bootstrap class
 * Handles service initialization and startup checks
 * 
 * ⚠️ SECURITY NOTE: This class no longer caches ServiceFactory
 * Each request must create its own ServiceFactory with a fresh Supabase client
 */
export class Application {
  private static instance: Application;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): Application {
    if (!Application.instance) {
      Application.instance = new Application();
    }
    return Application.instance;
  }

  /**
   * Initialize the application with all dependencies
   * Performs configuration validation and startup checks
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize logger (only in dev mode)
      logger.initialize();
      
      console.log('🚀 Initializing No Vibe No Code application...');

      // Step 1: Perform comprehensive startup validation
      console.log('🔍 Performing startup validation...');
      const validationChecks = await performStartupValidation();
      const validationReport = generateValidationReport(validationChecks);
      
      console.log(validationReport);
      
      if (!isValidationPassed(validationChecks)) {
        throw new Error('Startup validation failed. Check the validation report above.');
      }

      // Step 2: Verify database connection (but don't cache client)
      console.log('🗄️ Verifying database connection...');
      if (!this.isMockModeEnabled()) {
        // Verify connection works, don't cache the client
        await checkDatabaseConnection();
      } else {
        console.log('⏭️ Mock mode detected - skipping database connection check');
      }

      // Step 3: Perform environment-specific initialization
      await this.performEnvironmentSpecificInitialization();

      this.isInitialized = true;
      console.log('✅ Application initialization complete');
      console.log('ℹ️  ServiceFactory will be created per request for security');

    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a new ServiceFactory for the current request
   * 
   * ⚠️ SECURITY: Always creates fresh factory with fresh Supabase client
   * 
   * @param supabaseClient - Fresh Supabase client from current request
   * @returns New ServiceFactory instance
   * 
   * @deprecated This method is deprecated. Create ServiceFactory directly in your routes:
   * const factory = ServiceFactory.create(SupabaseAdapter.getServerClient());
   */
  createServiceFactory(supabaseClient: SupabaseClient): ServiceFactory {
    if (!this.isInitialized) {
      throw new Error('Application not initialized. Call initialize() first.');
    }
    return ServiceFactory.create(supabaseClient);
  }

  /**
   * @deprecated ServiceFactory is no longer cached. Use createServiceFactory() or
   * create ServiceFactory directly: ServiceFactory.create(supabaseClient)
   */
  getServiceFactory(): ServiceFactory {
    throw new Error(
      'ServiceFactory is no longer cached for security reasons. ' +
      'Create a fresh factory per request: ServiceFactory.create(SupabaseAdapter.getServerClient())'
    );
  }

  /**
   * Check if application is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Shutdown the application gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down application...');
    
    this.isInitialized = false;
    
    console.log('✅ Application shutdown complete');
  }

  /**
   * Perform environment-specific initialization
   */
  private async performEnvironmentSpecificInitialization(): Promise<void> {
    if (isDevelopment()) {
      console.log('🔧 Development mode initialization...');
      // Development-specific setup
      await this.initializeDevelopmentMode();
    } else if (isProduction()) {
      console.log('🚀 Production mode initialization...');
      // Production-specific setup
      await this.initializeProductionMode();
    } else if (isTest()) {
      console.log('🧪 Test mode initialization...');
      // Test-specific setup
      await this.initializeTestMode();
    }
  }

  /**
   * Development mode initialization
   */
  private async initializeDevelopmentMode(): Promise<void> {
    // Enable debug logging
    console.log('📝 Debug logging enabled');
    
    // Additional development setup can go here
  }

  /**
   * Production mode initialization
   */
  private async initializeProductionMode(): Promise<void> {
    // Production optimizations
    console.log('⚡ Production optimizations enabled');
    
    // Additional production setup can go here
  }

  /**
   * Test mode initialization
   */
  private async initializeTestMode(): Promise<void> {
    // Test environment setup
    console.log('🧪 Test environment configured');
    
    // Additional test setup can go here
  }

  /**
   * Determine if mock mode is enabled based on feature flag
   */
  private isMockModeEnabled(): boolean {
    return resolveMockModeFlag(process.env.FF_USE_MOCK_API, {
      allowInProduction: false,
    });
  }
}

/**
 * Initialize the application
 * Convenience function for application startup
 */
export async function initializeApplication(): Promise<Application> {
  const app = Application.getInstance();
  await app.initialize();
  return app;
}

/**
 * Get the initialized application instance
 * Throws error if not initialized
 */
export function getApplication(): Application {
  const app = Application.getInstance();
  if (!app.isReady()) {
    throw new Error('Application not initialized. Call initializeApplication() first.');
  }
  return app;
}

/**
 * Create a new service factory for the current request
 * 
 * ⚠️ SECURITY: Always creates fresh factory with fresh Supabase client
 * 
 * @param supabaseClient - Fresh Supabase client from current request
 * @returns New ServiceFactory instance
 * 
 * @deprecated Create ServiceFactory directly in your routes:
 * const factory = ServiceFactory.create(SupabaseAdapter.getServerClient());
 */
export function createServiceFactory(supabaseClient: SupabaseClient): ServiceFactory {
  return getApplication().createServiceFactory(supabaseClient);
}

/**
 * @deprecated ServiceFactory is no longer cached for security reasons.
 * Use: ServiceFactory.create(SupabaseAdapter.getServerClient())
 */
export function getServiceFactory(): ServiceFactory {
  throw new Error(
    'ServiceFactory is no longer cached for security reasons. ' +
    'Create a fresh factory per request: ServiceFactory.create(SupabaseAdapter.getServerClient())'
  );
}

/**
 * Health check for the entire application
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  checks: {
    application: boolean;
    database: boolean;
    aiService: boolean;
  };
}> {
  const checks = {
    application: false,
    database: false,
    aiService: false,
  };

  try {
    // Check application initialization
    const app = Application.getInstance();
    checks.application = app.isReady();

    // Check database connection
    checks.database = await checkDatabaseConnection();

    // Check AI service connection
    checks.aiService = await checkAIServiceConnection();

    const allHealthy = Object.values(checks).every(check => check);

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      checks,
    };
  }
}
