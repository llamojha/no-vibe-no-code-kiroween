import { resolveMockModeFlag } from "./mock-mode-flags";
import type { TestScenario } from "../types";

export interface TestEnvironmentConfiguration {
  mockMode: boolean;
  scenario: TestScenario;
  simulateLatency: boolean;
  nodeEnv: string;
  warnings: string[];
  errors: string[];
}

export class TestEnvironmentConfig {
  static getCurrentConfig(): TestEnvironmentConfiguration {
    return {
      mockMode: resolveMockModeFlag(process.env.FF_USE_MOCK_API),
      scenario: (process.env.FF_MOCK_SCENARIO as TestScenario) || "success",
      simulateLatency: resolveMockModeFlag(process.env.FF_SIMULATE_LATENCY),
      nodeEnv: process.env.NODE_ENV || "test",
      warnings: [],
      errors: [],
    };
  }

  static validateTestEnvironment() {
    return {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
    };
  }

  static isValidScenario(scenario?: string | null): boolean {
    return Boolean(scenario);
  }
}

export function isTestModeOverrideEnabled(): boolean {
  return process.env.ALLOW_TEST_MODE_IN_PRODUCTION === "true";
}
