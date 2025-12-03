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
    const validScenario = this.normalizeScenario(process.env.FF_MOCK_SCENARIO);
    const minLatency = process.env.FF_MIN_LATENCY
      ? parseInt(process.env.FF_MIN_LATENCY, 10)
      : 500;
    const maxLatency = process.env.FF_MAX_LATENCY
      ? parseInt(process.env.FF_MAX_LATENCY, 10)
      : 2000;

    return {
      defaultScenario: validScenario,
      enableVariability: process.env.FF_MOCK_VARIABILITY === "true",
      simulateLatency: process.env.FF_SIMULATE_LATENCY === "true",
      minLatency,
      maxLatency,
      logRequests: process.env.FF_LOG_MOCK_REQUESTS === "true",
    };
  }

  getAllFlags(): Record<string, unknown> {
    return {
      FF_USE_MOCK_API: process.env.FF_USE_MOCK_API,
      FF_MOCK_SCENARIO: process.env.FF_MOCK_SCENARIO,
      FF_SIMULATE_LATENCY: process.env.FF_SIMULATE_LATENCY,
      FF_MOCK_VARIABILITY: process.env.FF_MOCK_VARIABILITY,
      FF_MIN_LATENCY: process.env.FF_MIN_LATENCY,
      FF_MAX_LATENCY: process.env.FF_MAX_LATENCY,
      FF_LOG_MOCK_REQUESTS: process.env.FF_LOG_MOCK_REQUESTS,
    };
  }

  private normalizeScenario(rawScenario?: string): string {
    const allowed = new Set(["success", "api_error", "timeout", "rate_limit"]);
    if (rawScenario && allowed.has(rawScenario)) {
      return rawScenario;
    }
    return "success";
  }
}

let sharedFeatureFlagManager: FeatureFlagManager | null = null;

/**
 * Retrieve a shared FeatureFlagManager instance (used by factories/tests).
 */
export function getFeatureFlagManager(): FeatureFlagManager {
  if (!sharedFeatureFlagManager) {
    sharedFeatureFlagManager = new FeatureFlagManager();
  }
  return sharedFeatureFlagManager;
}

/**
 * Reset the shared FeatureFlagManager instance to a clean state.
 * Useful for tests that mutate process.env across cases.
 */
export function resetFeatureFlagManager(): void {
  sharedFeatureFlagManager = null;
}
