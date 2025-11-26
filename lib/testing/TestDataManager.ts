import { Score } from "@/src/domain/value-objects/Score";
import { hashStringToNumber } from "./utils/hashStringToNumber";

type Scenario = string;
type Service = "analyzer" | "hackathon" | "frankenstein";

/**
 * Basic holder for seeded mock data used by mock services.
 */
export class TestDataManager {
  constructor(private readonly data: Record<string, unknown> = {}) {}

  getAnalysisData() {
    return this.data.analysis ?? {};
  }

  getHackathonData() {
    return this.data.hackathon ?? {};
  }

  getMockResponse<T = unknown>(service: Service, scenario: Scenario): T {
    const seed = `${service}-${scenario}`;
    const score = Score.create(hashStringToNumber(seed, 0, 100));
    return {
      summary: `${service} response (${scenario})`,
      score,
      detailedAnalysis: {
        strengths: ["deterministic-strength-1", "deterministic-strength-2"],
        weaknesses: ["deterministic-weakness-1", "deterministic-weakness-2"],
      },
    } as unknown as T;
  }

  getRandomVariant<T = unknown>(service: Service, scenario: Scenario): T {
    // For now, return the deterministic response; variability can be added later.
    return this.getMockResponse<T>(service, scenario);
  }

  customizeMockResponse<T>(
    response: T,
    _service: Service,
    _context?: Record<string, unknown>
  ): T {
    // No-op customization placeholder
    return response;
  }
}
