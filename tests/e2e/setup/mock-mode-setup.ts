/**
 * Mock Mode Setup for E2E Tests
 * 
 * Ensures the test environment is properly configured with mock mode active
 * before E2E tests run. This prevents tests from making real API calls or
 * database connections.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

export interface MockModeVerificationResult {
  isActive: boolean;
  error?: string;
  details?: {
    mockMode?: boolean;
    scenario?: string;
    nodeEnv?: string;
    isValid?: boolean;
    errors?: string[];
    warnings?: string[];
  };
}

export interface MockModeSetupConfig {
  maxAttempts?: number;
  delayMs?: number;
  timeoutMs?: number;
}

/**
 * Mock mode setup for E2E tests
 * Ensures environment is properly configured before tests run
 */
export class MockModeSetup {
  private static readonly DEFAULT_MAX_ATTEMPTS = 10;
  private static readonly DEFAULT_DELAY_MS = 1000;
  private static readonly DEFAULT_TIMEOUT_MS = 30000;

  /**
   * Verify mock mode is active by calling the health check endpoint
   * 
   * @param baseURL - Base URL of the application
   * @returns Verification result with status and details
   */
  static async verifyMockModeActive(baseURL: string): Promise<MockModeVerificationResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${baseURL}/api/test/mock-status`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          isActive: false,
          error: `Mock status endpoint returned ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      // Validate response structure
      if (typeof data.mockMode !== 'boolean') {
        return {
          isActive: false,
          error: 'Invalid response from mock status endpoint: missing mockMode field',
          details: data,
        };
      }

      if (!data.mockMode) {
        return {
          isActive: false,
          error: 'Mock mode is not active on the server',
          details: data,
        };
      }

      // Check for validation errors
      if (data.isValid === false && data.errors && data.errors.length > 0) {
        return {
          isActive: false,
          error: `Mock mode validation failed: ${data.errors.join(', ')}`,
          details: data,
        };
      }

      return {
        isActive: true,
        details: data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Provide more specific error messages
      if (errorMessage.includes('ECONNREFUSED')) {
        return {
          isActive: false,
          error: 'Cannot connect to application - server may not be running',
        };
      }

      if (errorMessage.includes('aborted')) {
        return {
          isActive: false,
          error: 'Request timeout - server is not responding',
        };
      }

      return {
        isActive: false,
        error: `Failed to verify mock mode: ${errorMessage}`,
      };
    }
  }

  /**
   * Wait for application to be ready with mock mode active
   * 
   * Retries verification with exponential backoff until mock mode is active
   * or maximum attempts are reached.
   * 
   * @param baseURL - Base URL of the application
   * @param config - Configuration for retry behavior
   * @throws Error if mock mode fails to activate after maximum attempts
   */
  static async waitForMockMode(
    baseURL: string,
    config: MockModeSetupConfig = {}
  ): Promise<void> {
    const maxAttempts = config.maxAttempts ?? this.DEFAULT_MAX_ATTEMPTS;
    const delayMs = config.delayMs ?? this.DEFAULT_DELAY_MS;
    const timeoutMs = config.timeoutMs ?? this.DEFAULT_TIMEOUT_MS;

    const startTime = Date.now();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Check if we've exceeded the total timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(
          `Mock mode verification timeout after ${timeoutMs}ms. ` +
          `The application may not be starting correctly or mock mode is not configured.`
        );
      }

      const result = await this.verifyMockModeActive(baseURL);

      if (result.isActive) {
        console.log(
          `[MockModeSetup] ✅ Mock mode verified and active (attempt ${attempt}/${maxAttempts})`
        );
        
        // Log configuration details for debugging
        if (result.details) {
          console.log('[MockModeSetup] Configuration:', {
            scenario: result.details.scenario,
            nodeEnv: result.details.nodeEnv,
            warnings: result.details.warnings,
          });
        }
        
        return;
      }

      // Log the failure reason
      console.log(
        `[MockModeSetup] ⏳ Mock mode not ready (attempt ${attempt}/${maxAttempts}): ${result.error}`
      );

      // Log additional details if available
      if (result.details) {
        console.log('[MockModeSetup] Details:', result.details);
      }

      // Wait before retrying (unless this was the last attempt)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // All attempts failed
    throw new Error(
      `Mock mode failed to activate after ${maxAttempts} attempts. ` +
      `Please ensure:\n` +
      `  1. The application is running at ${baseURL}\n` +
      `  2. FF_USE_MOCK_API environment variable is set to "true"\n` +
      `  3. NODE_ENV is set to "test" or "development"\n` +
      `  4. The /api/test/mock-status endpoint is accessible\n\n` +
      `Run 'npm run dev' with mock mode enabled and verify the endpoint manually.`
    );
  }

  /**
   * Log current environment configuration for debugging
   */
  static logEnvironmentConfig(): void {
    console.log('[MockModeSetup] Environment Configuration:', {
      FF_USE_MOCK_API: process.env.FF_USE_MOCK_API,
      NEXT_PUBLIC_FF_USE_MOCK_API: process.env.NEXT_PUBLIC_FF_USE_MOCK_API,
      FF_MOCK_SCENARIO: process.env.FF_MOCK_SCENARIO,
      FF_SIMULATE_LATENCY: process.env.FF_SIMULATE_LATENCY,
      FF_LOG_MOCK_REQUESTS: process.env.FF_LOG_MOCK_REQUESTS,
      NODE_ENV: process.env.NODE_ENV,
      E2E_BASE_URL: process.env.E2E_BASE_URL,
    });
  }
}
