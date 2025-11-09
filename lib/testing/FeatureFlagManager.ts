/**
 * Feature Flag Manager for Testing and Mock Mode
 * 
 * Manages feature flags specifically for testing automation and mock services.
 * Provides runtime flag updates for testing scenarios while maintaining
 * production mode safety.
 */

export type TestScenario = 
  | 'success'
  | 'api_error'
  | 'timeout'
  | 'rate_limit'
  | 'invalid_input'
  | 'partial_response';

export interface MockServiceConfig {
  defaultScenario: TestScenario;
  enableVariability: boolean;
  simulateLatency: boolean;
  minLatency: number;
  maxLatency: number;
  logRequests: boolean;
}

export interface FeatureFlagConfig {
  useMockApi: boolean;
  mockScenario: TestScenario;
  mockVariability: boolean;
  simulateLatency: boolean;
  minLatency: number;
  maxLatency: number;
  logMockRequests: boolean;
}

/**
 * FeatureFlagManager handles feature flag configuration for testing and mock services.
 * It reads from environment variables and provides runtime updates for testing scenarios.
 */
export class FeatureFlagManager {
  private flags: Map<string, boolean | string | number>;
  private readonly isProduction: boolean;

  constructor() {
    this.flags = new Map();
    this.isProduction = process.env.NODE_ENV === 'production';
    this.loadFromEnvironment();
  }

  /**
   * Load feature flags from environment variables
   * @private
   */
  private loadFromEnvironment(): void {
    // Mock mode flag - never enabled in production
    this.flags.set(
      'USE_MOCK_API',
      this.isProduction ? false : this.parseBoolean(process.env.FF_USE_MOCK_API)
    );

    // Mock scenario configuration
    this.flags.set(
      'MOCK_SCENARIO',
      this.validateScenario(process.env.FF_MOCK_SCENARIO || 'success')
    );

    // Mock variability - enable random response variants
    this.flags.set(
      'MOCK_VARIABILITY',
      this.parseBoolean(process.env.FF_MOCK_VARIABILITY)
    );

    // Latency simulation
    this.flags.set(
      'SIMULATE_LATENCY',
      this.parseBoolean(process.env.FF_SIMULATE_LATENCY)
    );

    // Latency range configuration
    this.flags.set(
      'MIN_LATENCY',
      this.parseNumber(process.env.FF_MIN_LATENCY, 500)
    );

    this.flags.set(
      'MAX_LATENCY',
      this.parseNumber(process.env.FF_MAX_LATENCY, 2000)
    );

    // Request logging
    this.flags.set(
      'LOG_MOCK_REQUESTS',
      this.parseBoolean(process.env.FF_LOG_MOCK_REQUESTS)
    );
  }

  /**
   * Parse boolean value from string
   * @private
   */
  private parseBoolean(value: string | undefined): boolean {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'on', 'y', 't'].includes(normalized);
  }

  /**
   * Parse number value from string with fallback
   * @private
   */
  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  /**
   * Validate and normalize test scenario value
   * @private
   */
  private validateScenario(value: string): TestScenario {
    const validScenarios: TestScenario[] = [
      'success',
      'api_error',
      'timeout',
      'rate_limit',
      'invalid_input',
      'partial_response'
    ];

    const normalized = value.toLowerCase() as TestScenario;
    
    if (validScenarios.includes(normalized)) {
      return normalized;
    }

    console.warn(
      `Invalid mock scenario "${value}". Falling back to "success". ` +
      `Valid scenarios: ${validScenarios.join(', ')}`
    );
    return 'success';
  }

  /**
   * Check if mock mode is enabled
   * Always returns false in production for safety
   */
  isMockModeEnabled(): boolean {
    if (this.isProduction) {
      return false;
    }
    return this.flags.get('USE_MOCK_API') as boolean;
  }

  /**
   * Get a specific feature flag value
   * @param flagName - The name of the flag to retrieve
   */
  getFlag(flagName: string): boolean | string | number {
    const value = this.flags.get(flagName);
    if (value === undefined) {
      throw new Error(`Unknown feature flag: ${flagName}`);
    }
    return value;
  }

  /**
   * Set a feature flag value (for testing purposes only)
   * Throws error in production mode
   * @param flagName - The name of the flag to set
   * @param value - The value to set
   */
  setFlag(flagName: string, value: boolean | string | number): void {
    if (this.isProduction) {
      throw new Error('Cannot modify feature flags in production mode');
    }

    // Validate scenario values
    if (flagName === 'MOCK_SCENARIO' && typeof value === 'string') {
      value = this.validateScenario(value);
    }

    // Validate latency values
    if ((flagName === 'MIN_LATENCY' || flagName === 'MAX_LATENCY') && typeof value === 'number') {
      if (value < 0) {
        throw new Error(`${flagName} must be a non-negative number`);
      }
    }

    this.flags.set(flagName, value);
  }

  /**
   * Get all feature flags as a record
   */
  getAllFlags(): Record<string, boolean | string | number> {
    const result: Record<string, boolean | string | number> = {};
    this.flags.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Get mock service configuration
   */
  getMockServiceConfig(): MockServiceConfig {
    return {
      defaultScenario: this.getFlag('MOCK_SCENARIO') as TestScenario,
      enableVariability: this.getFlag('MOCK_VARIABILITY') as boolean,
      simulateLatency: this.getFlag('SIMULATE_LATENCY') as boolean,
      minLatency: this.getFlag('MIN_LATENCY') as number,
      maxLatency: this.getFlag('MAX_LATENCY') as number,
      logRequests: this.getFlag('LOG_MOCK_REQUESTS') as boolean,
    };
  }

  /**
   * Get feature flag configuration for external use
   */
  getFeatureFlagConfig(): FeatureFlagConfig {
    return {
      useMockApi: this.isMockModeEnabled(),
      mockScenario: this.getFlag('MOCK_SCENARIO') as TestScenario,
      mockVariability: this.getFlag('MOCK_VARIABILITY') as boolean,
      simulateLatency: this.getFlag('SIMULATE_LATENCY') as boolean,
      minLatency: this.getFlag('MIN_LATENCY') as number,
      maxLatency: this.getFlag('MAX_LATENCY') as number,
      logMockRequests: this.getFlag('LOG_MOCK_REQUESTS') as boolean,
    };
  }

  /**
   * Reset all flags to environment defaults
   * Only available in non-production environments
   */
  reset(): void {
    if (this.isProduction) {
      throw new Error('Cannot reset feature flags in production mode');
    }
    this.flags.clear();
    this.loadFromEnvironment();
  }

  /**
   * Check if running in production mode
   */
  isProductionMode(): boolean {
    return this.isProduction;
  }
}

// Singleton instance for application-wide use
let instance: FeatureFlagManager | null = null;

/**
 * Get the singleton FeatureFlagManager instance
 */
export function getFeatureFlagManager(): FeatureFlagManager {
  if (!instance) {
    instance = new FeatureFlagManager();
  }
  return instance;
}

/**
 * Reset the singleton instance (for testing purposes only)
 */
export function resetFeatureFlagManager(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset feature flag manager in production mode');
  }
  instance = null;
}
