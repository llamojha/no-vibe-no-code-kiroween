/**
 * Mock Frankenstein Service
 * 
 * Provides mock responses for Doctor Frankenstein idea generation.
 * Supports both 'companies' and 'aws' modes with English and Spanish languages.
 */

import type { TestDataManager } from '../TestDataManager';
import type { MockServiceConfig, TestScenario } from '../types';
import type {
  FrankensteinElement,
  FrankensteinIdeaResult,
} from '@/features/doctor-frankenstein/api/generateFrankensteinIdea';

/**
 * Performance metrics for mock service
 */
interface PerformanceMetrics {
  totalRequests: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
}

/**
 * Mock implementation of Frankenstein idea generation service
 */
export class MockFrankensteinService {
  private readonly performanceMetrics: number[] = [];

  constructor(
    private readonly testDataManager: TestDataManager,
    private readonly config: MockServiceConfig
  ) {}

  /**
   * Generate a mock Frankenstein idea based on input elements
   * @param elements - Array of technology elements to combine
   * @param mode - Generation mode ('companies' or 'aws')
   * @param language - Response language ('en' or 'es')
   * @returns Promise resolving to Frankenstein idea result
   */
  async generateFrankensteinIdea(
    elements: FrankensteinElement[],
    mode: 'companies' | 'aws',
    language: 'en' | 'es'
  ): Promise<FrankensteinIdeaResult> {
    const startTime = Date.now();

    // Log request if enabled
    if (this.config.logRequests) {
      this.logRequest('frankenstein', elements, mode, language);
    }

    // Validate input
    if (!elements || elements.length < 2) {
      throw new Error('At least two elements are required to generate a Frankenstein idea');
    }

    // Simulate latency if enabled
    if (this.config.simulateLatency) {
      await this.simulateDelay();
    }

    // Get base mock response based on scenario
    const scenario = this.config.defaultScenario ?? "success";
    
    // Handle error scenarios
    if (scenario !== 'success') {
      return this.handleErrorScenario(scenario);
    }

    const mockResponse = this.buildMockResponse(elements, mode, language);

    // Record performance
    const duration = Date.now() - startTime;
    this.recordPerformance(duration);

    return mockResponse;
  }

  /**
   * Simulate network latency
   * 
   * Adds a random delay between minLatency and maxLatency to simulate
   * real network conditions for Frankenstein idea generation.
   * 
   * @private
   * @returns Promise that resolves after the simulated delay
   */
  private async simulateDelay(): Promise<void> {
    const minLatency = this.config.minLatency ?? 50;
    const maxLatency = this.config.maxLatency ?? 150;
    const delay = Math.floor(Math.random() * (maxLatency - minLatency + 1)) + minLatency;
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Handle error scenarios
   * 
   * Creates and throws appropriate errors based on the test scenario.
   * This allows testing of error handling in Frankenstein idea generation.
   * 
   * @private
   * @param scenario - The error scenario to simulate
   * @throws Error with appropriate message and code
   */
  private handleErrorScenario(scenario: TestScenario): never {
    const messages: Record<string, string> = {
      api_error: "Simulated API error",
      timeout: "Simulated timeout",
      rate_limit: "Simulated rate limit",
    };

    const error = new Error(
      `Mock Frankenstein error (${scenario}): ${messages[scenario] || "Mock error"}`
    );
    (error as Error & { code: string }).code =
      scenario === "rate_limit" ? "RATE_LIMIT" : "MOCK_ERROR";
    
    throw error;
  }

  /**
   * Build a deterministic mock Frankenstein response so tests can assert fields.
   */
  private buildMockResponse(
    elements: FrankensteinElement[],
    mode: "companies" | "aws",
    language: "en" | "es"
  ): FrankensteinIdeaResult {
    const elementNames = elements.map(e => e.name);
    const title = `${elementNames.join(" + ")} (${mode} mashup)`;
    const description = `Generated Frankenstein idea combining ${elementNames.join(
      ", "
    )} using ${mode} patterns.`;

    const baseOriginality = Math.min(60 + elements.length * 10, 100);
    const baseFeasibility = Math.max(50 - elements.length * 2, 40);
    const baseImpact = Math.min(65 + elements.length * 5, 95);

    return {
      idea_title: title,
      idea_description: description,
      core_concept: "",
      problem_statement: "",
      proposed_solution: "",
      unique_value_proposition: "",
      target_audience: "",
      business_model: "",
      growth_strategy: "",
      tech_stack_suggestion: "",
      risks_and_challenges: "",
      metrics: {
        originality_score: baseOriginality,
        feasibility_score: baseFeasibility,
        impact_score: baseImpact,
        scalability_score: Math.min(baseFeasibility + 5, 100),
        wow_factor: Math.min(baseOriginality + 5, 100),
      },
      summary: this.testDataManager.getMockResponse<{ summary: string }>(
        "frankenstein",
        "success"
      ).summary ?? "Mock Frankenstein summary",
      language,
    };
  }

  /**
   * Log mock request for debugging
   * 
   * Records Frankenstein idea generation request details for debugging
   * and analysis. Includes element information and configuration settings.
   * 
   * @private
   * @param type - Request type identifier
   * @param elements - Array of elements being combined
   * @param mode - Generation mode (companies or aws)
   * @param language - Response language (en or es)
   */
  private logRequest(
    type: string,
    elements: FrankensteinElement[],
    mode: string,
    language: string
  ): void {
    console.log('[MOCK FRANKENSTEIN SERVICE]', {
      timestamp: new Date().toISOString(),
      type,
      mode,
      language,
      elementCount: elements.length,
      elements: elements.map(e => e.name).join(', '),
      scenario: this.config.defaultScenario,
      variability: this.config.enableVariability ? 'enabled' : 'disabled',
      simulateLatency: this.config.simulateLatency ? 'enabled' : 'disabled',
    });
  }

  /**
   * Get performance metrics
   * 
   * Returns aggregated performance statistics for all Frankenstein
   * idea generation requests processed by this service instance.
   * 
   * @returns Performance metrics including request count and timing statistics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    if (this.performanceMetrics.length === 0) {
      return {
        totalRequests: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
      };
    }

    const totalDuration = this.performanceMetrics.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalDuration / this.performanceMetrics.length;
    const minDuration = Math.min(...this.performanceMetrics);
    const maxDuration = Math.max(...this.performanceMetrics);

    return {
      totalRequests: this.performanceMetrics.length,
      totalDuration,
      averageDuration: Math.round(averageDuration * 100) / 100,
      minDuration,
      maxDuration,
    };
  }

  /**
   * Clear performance metrics
   * 
   * Resets all collected performance data. Useful for starting fresh
   * measurements or cleaning up between test runs.
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics.length = 0;
  }

  /**
   * Record performance metric
   * 
   * Stores the duration of a request for later analysis. Maintains
   * a rolling window of the last 1000 measurements to prevent memory issues.
   * 
   * @private
   * @param duration - Request duration in milliseconds
   */
  private recordPerformance(duration: number): void {
    this.performanceMetrics.push(duration);
    
    // Keep only last 1000 measurements to prevent memory issues
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics.shift();
    }

    // Log performance if enabled
    if (process.env.FF_LOG_PERFORMANCE === 'true') {
      console.log(`[MOCK PERFORMANCE] generateFrankensteinIdea: ${duration}ms`);
    }
  }
}
