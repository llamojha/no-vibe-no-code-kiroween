/**
 * Type definitions for testing automation and mock services
 */

/**
 * Test scenario types for mock responses
 */
export type TestScenario = 
  | 'success'
  | 'api_error'
  | 'timeout'
  | 'rate_limit'
  | 'invalid_input'
  | 'partial_response';

/**
 * Mock service configuration interface
 */
export interface MockServiceConfig {
  /** Default test scenario to use */
  defaultScenario: TestScenario;
  /** Enable random response variants */
  enableVariability: boolean;
  /** Simulate network latency */
  simulateLatency: boolean;
  /** Minimum latency in milliseconds */
  minLatency: number;
  /** Maximum latency in milliseconds */
  maxLatency: number;
  /** Log all mock requests for debugging */
  logRequests: boolean;
}

/**
 * Feature flag configuration for testing
 */
export interface FeatureFlagConfig {
  /** Enable mock API mode */
  useMockApi: boolean;
  /** Current mock scenario */
  mockScenario: TestScenario;
  /** Enable mock response variability */
  mockVariability: boolean;
  /** Enable latency simulation */
  simulateLatency: boolean;
  /** Minimum simulated latency (ms) */
  minLatency: number;
  /** Maximum simulated latency (ms) */
  maxLatency: number;
  /** Enable mock request logging */
  logMockRequests: boolean;
}

/**
 * Mock response structure
 */
export interface MockResponse<T = unknown> {
  /** Response data */
  data: T;
  /** Simulated network delay in milliseconds */
  delay?: number;
  /** HTTP status code */
  statusCode: number;
  /** Response headers */
  headers?: Record<string, string>;
}

/**
 * Mock request log entry
 */
export interface MockRequest {
  /** Request type (analyzer, hackathon, frankenstein) */
  type: string;
  /** Test scenario used */
  scenario: TestScenario;
  /** Simulated latency in milliseconds */
  simulatedLatency?: number;
  /** Whether the request was successful */
  success: boolean;
  /** Timestamp of the request */
  timestamp: Date;
}

/**
 * Feature flag names as constants
 */
export const MOCK_FEATURE_FLAGS = {
  USE_MOCK_API: 'USE_MOCK_API',
  MOCK_SCENARIO: 'MOCK_SCENARIO',
  MOCK_VARIABILITY: 'MOCK_VARIABILITY',
  SIMULATE_LATENCY: 'SIMULATE_LATENCY',
  MIN_LATENCY: 'MIN_LATENCY',
  MAX_LATENCY: 'MAX_LATENCY',
  LOG_MOCK_REQUESTS: 'LOG_MOCK_REQUESTS',
} as const;

/**
 * Type for mock feature flag keys
 */
export type MockFeatureFlagKey = keyof typeof MOCK_FEATURE_FLAGS;

/**
 * Environment variable names for mock feature flags
 */
export const MOCK_ENV_VARS = {
  USE_MOCK_API: 'FF_USE_MOCK_API',
  MOCK_SCENARIO: 'FF_MOCK_SCENARIO',
  MOCK_VARIABILITY: 'FF_MOCK_VARIABILITY',
  SIMULATE_LATENCY: 'FF_SIMULATE_LATENCY',
  MIN_LATENCY: 'FF_MIN_LATENCY',
  MAX_LATENCY: 'FF_MAX_LATENCY',
  LOG_MOCK_REQUESTS: 'FF_LOG_MOCK_REQUESTS',
} as const;

/**
 * Default values for mock feature flags
 */
export const MOCK_FLAG_DEFAULTS = {
  USE_MOCK_API: false,
  MOCK_SCENARIO: 'success' as TestScenario,
  MOCK_VARIABILITY: false,
  SIMULATE_LATENCY: false,
  MIN_LATENCY: 500,
  MAX_LATENCY: 2000,
  LOG_MOCK_REQUESTS: false,
} as const;

/**
 * Validation result for feature flags
 */
export interface FlagValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors if any */
  errors: string[];
  /** Validation warnings if any */
  warnings: string[];
}

/**
 * Feature flag value types
 */
export type FlagValue = boolean | string | number;

/**
 * Feature flag definition
 */
export interface FlagDefinition {
  /** Flag name */
  name: string;
  /** Flag description */
  description: string;
  /** Default value */
  defaultValue: FlagValue;
  /** Value type */
  type: 'boolean' | 'string' | 'number';
  /** Whether flag can be modified at runtime */
  mutable: boolean;
  /** Validation function */
  validate?: (value: FlagValue) => FlagValidationResult;
}

/**
 * Cache statistics for performance monitoring
 */
export interface CacheStats {
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Cache hit rate as percentage (0-100) */
  hitRate: number;
  /** Number of responses currently cached */
  responsesCached?: number;
  /** Number of data files currently cached */
  dataFilesCached?: number;
}
