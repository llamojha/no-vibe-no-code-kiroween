export type MockScenario = "success" | "api_error" | "timeout" | "rate_limit" | string;

export interface MockServiceConfig {
  scenario?: MockScenario;
  defaultScenario?: MockScenario;
  simulateLatency?: boolean;
  latencyMs?: number;
  minLatency?: number;
  maxLatency?: number;
  errorMessage?: string;
  enableVariability?: boolean;
  logRequests?: boolean;
}

export type TestScenario = MockScenario;

export interface MockModeStatus {
  mockMode: boolean;
  scenario: MockScenario;
  simulateLatency: boolean;
  timestamp?: string;
  isValid?: boolean;
  errors?: string[];
  warnings?: string[];
}
