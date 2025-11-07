/**
 * Application bootstrap and initialization
 * Main entry point for service initialization and dependency composition
 */

import { ServiceFactory } from './infrastructure/factories/ServiceFactory';
import { 
  createSupabaseClient,
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

/**
 * Application bootstrap class
 * Handles service initialization and startup checks
 */
export class Application {
  private static instance: Application;
  private serviceFactory: ServiceFactory | null = null;
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
      console.log('🚀 Initializing No Vibe No Code application...');

      // Step 1: Perform comprehensive startup validation
      console.log('🔍 Performing startup validation...');
      const validationChecks = await performStartupValidation();
      const validationReport = generateValidationReport(validationChecks);
      
      console.log(validationReport);
      
      if (!isValidationPassed(validationChecks)) {
        throw new Error('Startup validation failed. Check the validation report above.');
      }

      // Step 2: Initialize database connection
      console.log('🗄️ Initializing database connection...');
      const supabaseClient = createSupabaseClient();

      // Step 3: Initialize service factory
      console.log('🏭 Initializing service factory...');
      this.serviceFactory = ServiceFactory.getInstance(supabaseClient);

      // Step 4: Perform environment-specific initialization
      await this.performEnvironmentSpecificInitialization();

      this.isInitialized = true;
      console.log('✅ Application initialization complete');

    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get the service factory instance
   * Throws error if application is not initialized
   */
  getServiceFactory(): ServiceFactory {
    if (!this.serviceFactory) {
      throw new Error('Application not initialized. Call initialize() first.');
    }
    return this.serviceFactory;
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
    
    if (this.serviceFactory) {
      this.serviceFactory.clearCache();
    }
    
    this.isInitialized = false;
    this.serviceFactory = null;
    
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
 * Get service factory from initialized application
 * Convenience function for accessing services
 */
export function getServiceFactory(): ServiceFactory {
  return getApplication().getServiceFactory();
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