/**
 * Mock Mode Helper for API Routes
 * 
 * Provides utilities for API routes to ensure proper mock mode handling.
 * This helper ensures:
 * 1. Environment is properly configured
 * 2. ServiceFactory is created with correct Supabase client
 * 3. Mock mode is active if configured
 * 4. Diagnostics are logged for debugging
 */

import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';
import { SupabaseAdapter } from '@/src/infrastructure/integration/SupabaseAdapter';
import { 
  TestEnvironmentConfig, 
  MockConfigurationError,
  MockConfigurationErrorCodes,
  type TestEnvironmentConfiguration 
} from '../config/test-environment';

// Re-export for convenience
export { MockConfigurationError, MockConfigurationErrorCodes };

/**
 * Mock mode status interface for API responses
 */
export interface MockModeStatus {
  mockMode: boolean;
  scenario: string;
  timestamp: string;
}

/**
 * Helper class for API routes to ensure proper mock mode handling
 */
export class MockModeHelper {
  /**
   * Create ServiceFactory with mock mode verification
   * 
   * This ensures:
   * 1. Environment is properly configured
   * 2. ServiceFactory is created with correct Supabase client
   * 3. Mock mode is active if configured
   * 4. Diagnostics are logged for debugging
   * 
   * @returns ServiceFactory instance configured for current environment
   * @throws MockConfigurationError if environment validation fails
   * 
   * @example
   * // In API Route
   * export async function POST(request: NextRequest) {
   *   try {
   *     const factory = MockModeHelper.createServiceFactory();
   *     const aiService = factory.createAIAnalysisService();
   *     // Use service...
   *   } catch (error) {
   *     if (error instanceof MockConfigurationError) {
   *       return NextResponse.json(
   *         { error: error.message, code: error.code },
   *         { status: 500 }
   *       );
   *     }
   *     throw error;
   *   }
   * }
   */
  static createServiceFactory(): ServiceFactory {
    // Validate environment
    const validation = TestEnvironmentConfig.validateTestEnvironment();
    
    if (!validation.isValid) {
      const errorMessage = `Test environment validation failed: ${validation.errors.join(', ')}`;
      console.error('[MockModeHelper] Invalid test environment:', validation.errors);
      
      throw new MockConfigurationError(
        errorMessage,
        MockConfigurationErrorCodes.INVALID_TEST_ENV,
        { 
          errors: validation.errors,
          warnings: validation.warnings 
        }
      );
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('[MockModeHelper] Test environment warnings:', validation.warnings);
    }

    // Create Supabase client (fresh instance per request for security)
    const supabase = SupabaseAdapter.getServerClient();

    // Create ServiceFactory
    const factory = ServiceFactory.create(supabase);

    // Log diagnostics in non-production
    if (process.env.NODE_ENV !== 'production') {
      const config = TestEnvironmentConfig.getCurrentConfig();
      console.log('[MockModeHelper] ServiceFactory created', {
        mockMode: factory.isMockModeEnabled(),
        scenario: config.scenario,
        simulateLatency: config.simulateLatency,
        nodeEnv: config.nodeEnv,
      });
    }

    return factory;
  }

  /**
   * Check if mock mode is active
   * 
   * @returns true if mock mode is enabled, false otherwise
   * 
   * @example
   * if (MockModeHelper.isMockModeActive()) {
   *   console.log('Running in mock mode');
   * }
   */
  static isMockModeActive(): boolean {
    const config = TestEnvironmentConfig.getCurrentConfig();
    return config.mockMode;
  }

  /**
   * Get mock mode status for API responses
   * 
   * This can be included in API responses to help with debugging
   * and to verify that mock mode is active during testing.
   * 
   * @returns Mock mode status object with current configuration
   * 
   * @example
   * // Include in API response
   * return NextResponse.json({
   *   ...responseData,
   *   _meta: MockModeHelper.getMockModeStatus(),
   * });
   */
  static getMockModeStatus(): MockModeStatus {
    const config = TestEnvironmentConfig.getCurrentConfig();
    return {
      mockMode: config.mockMode,
      scenario: config.scenario,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get current test environment configuration
   * 
   * @returns Current configuration values
   * 
   * @example
   * const config = MockModeHelper.getConfiguration();
   * console.log('Mock mode:', config.mockMode);
   * console.log('Scenario:', config.scenario);
   */
  static getConfiguration(): TestEnvironmentConfiguration {
    return TestEnvironmentConfig.getCurrentConfig();
  }

  /**
   * Validate test environment and return validation result
   * 
   * This can be used to check environment configuration without
   * throwing errors, useful for diagnostic endpoints.
   * 
   * @returns Validation result with errors and warnings
   * 
   * @example
   * const validation = MockModeHelper.validateEnvironment();
   * if (!validation.isValid) {
   *   console.error('Environment errors:', validation.errors);
   * }
   */
  static validateEnvironment() {
    return TestEnvironmentConfig.validateTestEnvironment();
  }

  /**
   * Log current configuration for debugging
   * 
   * This is useful for troubleshooting mock mode issues.
   * Only logs in non-production environments.
   * 
   * @example
   * // At the start of an API route
   * MockModeHelper.logConfiguration();
   */
  static logConfiguration(): void {
    if (process.env.NODE_ENV !== 'production') {
      TestEnvironmentConfig.logConfiguration();
    }
  }
}
