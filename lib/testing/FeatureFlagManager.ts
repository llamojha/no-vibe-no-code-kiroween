import { MockServiceConfig } from "./types";

/**
 * Lightweight feature flag manager used in tests and mock mode.
 * Only supports mock-mode related flags in this stub.
 */
export class FeatureFlagManager {
  isMockModeEnabled(): boolean {
    return process.env.FF_USE_MOCK_API === "true";
  }

  getMockServiceConfig(): MockServiceConfig {
    return {
      scenario: process.env.FF_MOCK_SCENARIO ?? "success",
      defaultScenario: process.env.FF_MOCK_SCENARIO ?? "success",
      simulateLatency: process.env.FF_SIMULATE_LATENCY === "true",
    };
  }

  getAllFlags(): Record<string, unknown> {
    return {
      FF_USE_MOCK_API: process.env.FF_USE_MOCK_API,
      FF_MOCK_SCENARIO: process.env.FF_MOCK_SCENARIO,
      FF_SIMULATE_LATENCY: process.env.FF_SIMULATE_LATENCY,
    };
  }
}
