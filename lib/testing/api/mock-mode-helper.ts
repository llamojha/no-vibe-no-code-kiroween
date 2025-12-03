import { SupabaseAdapter } from "@/src/infrastructure/integration/SupabaseAdapter";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";
import { resolveMockModeFlag } from "../config/mock-mode-flags";
import { TestEnvironmentConfig } from "../config/test-environment";
import type { MockModeStatus } from "../types";

export class MockConfigurationError extends Error {
  code?: string;
  details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "MockConfigurationError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Minimal mock-mode helper to satisfy integration points after test trim.
 */
export class MockModeHelper {
  static createServiceFactory(): ServiceFactory {
    const supabase = SupabaseAdapter.getServerClient();
    return ServiceFactory.create(supabase);
  }

  static isMockModeActive(): boolean {
    return resolveMockModeFlag(process.env.FF_USE_MOCK_API);
  }

  static getMockModeStatus(): MockModeStatus {
    const config = TestEnvironmentConfig.getCurrentConfig();
    return {
      mockMode: config.mockMode,
      scenario: config.scenario,
      simulateLatency: config.simulateLatency,
      timestamp: new Date().toISOString(),
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  static getConfiguration() {
    const config = TestEnvironmentConfig.getCurrentConfig();
    return { ...config, errors: [], warnings: [] };
  }

  static validateEnvironment() {
    return { isValid: true, errors: [] as string[], warnings: [] as string[] };
  }

  static logConfiguration() {
    return this.getConfiguration();
  }
}
