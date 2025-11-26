/**
 * Mock AI Analysis Service
 * 
 * Implements IAIAnalysisService interface with mock responses for testing.
 * Provides configurable scenarios, latency simulation, and request logging.
 */

import { IAIAnalysisService, AIAnalysisResult } from '@/src/application/services/IAIAnalysisService';
import { Locale, Score } from '@/src/domain/value-objects';
import { Result, success, failure } from '@/src/shared/types/common';
import { TestDataManager } from '../TestDataManager';
import { MockServiceConfig, TestScenario } from '../types';

/**
 * Mock service error class
 */
export class MockServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'MockServiceError';
  }
}

/**
 * Mock request log entry
 */
interface MockRequestLog {
  timestamp: Date;
  type: string;
  scenario: TestScenario;
  latency?: number;
  success: boolean;
  error?: string;
}

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
 * MockAIAnalysisService implements IAIAnalysisService with predefined mock responses
 */
export class MockAIAnalysisService implements IAIAnalysisService {
  private readonly testDataManager: TestDataManager;
  private readonly config: MockServiceConfig;
  private readonly requestLogs: MockRequestLog[] = [];
  private readonly performanceMetrics: Map<string, number[]> = new Map();
  private lastSimulatedLatency = 0;

  constructor(
    testDataManager: TestDataManager,
    config: MockServiceConfig
  ) {
    this.testDataManager = testDataManager;
    this.config = config;
  }

  /**
   * Analyze a startup idea using mock responses
   */
  async analyzeIdea(
    idea: string,
    locale: Locale
  ): Promise<Result<AIAnalysisResult, Error>> {
    const startTime = Date.now();

    try {
      // Simulate latency if configured
      await this.simulateLatency();

      // Get scenario to use
      const scenario = this.getScenario();

      // Handle error scenarios
      if (scenario !== 'success') {
        return this.handleErrorScenario(scenario, 'analyzeIdea');
      }

      // Get mock response
      const mockResponse = this.config.enableVariability
        ? this.testDataManager.getRandomVariant('analyzer', scenario)
        : this.testDataManager.getMockResponse('analyzer', scenario);

      // Customize response based on input
      const customized = this.testDataManager.customizeMockResponse(
        mockResponse,
        'analyzer',
        {
          locale: locale.value,
          input: { idea },
        }
      );

      // Convert mock data to AIAnalysisResult
      const result = this.convertToAIAnalysisResult(customized as Record<string, unknown>);

      const duration = Date.now() - startTime;

      // Log request
      this.logRequest({
        timestamp: new Date(),
        type: 'analyzeIdea',
        scenario,
        latency: duration,
        success: true,
      });

      // Record performance
      this.recordPerformance('analyzeIdea', duration);

      return success(result);
    } catch (error) {
      this.logRequest({
        timestamp: new Date(),
        type: 'analyzeIdea',
        scenario: this.getScenario(),
        latency: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
      });

      return failure(error as Error);
    }
  }

  /**
   * Analyze a hackathon project using mock responses
   */
  async analyzeHackathonProject(
    projectName: string,
    description: string,
    locale: Locale
  ): Promise<Result<AIAnalysisResult, Error>> {
    const startTime = Date.now();

    try {
      // Simulate latency if configured
      await this.simulateLatency();

      // Get scenario to use
      const scenario = this.getScenario();

      // Handle error scenarios
      if (scenario !== 'success') {
        return this.handleErrorScenario(scenario, 'analyzeHackathonProject');
      }

      // Get mock response
      const mockResponse = this.config.enableVariability
        ? this.testDataManager.getRandomVariant('hackathon', scenario)
        : this.testDataManager.getMockResponse('hackathon', scenario);

      // Customize response based on input
      const customized = this.testDataManager.customizeMockResponse(
        mockResponse,
        'hackathon',
        {
          locale: locale.value,
        input: { projectName, projectDescription: description },
        }
      );

      // Convert mock data to AIAnalysisResult
      const result = this.convertToAIAnalysisResult(customized as Record<string, unknown>);

      const duration = Date.now() - startTime;

      // Log request
      this.logRequest({
        timestamp: new Date(),
        type: 'analyzeHackathonProject',
        scenario,
        latency: duration,
        success: true,
      });

      // Record performance
      this.recordPerformance('analyzeHackathonProject', duration);

      return success(result);
    } catch (error) {
      this.logRequest({
        timestamp: new Date(),
        type: 'analyzeHackathonProject',
        scenario: this.getScenario(),
        latency: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
      });

      return failure(error as Error);
    }
  }

  /**
   * Get improvement suggestions using mock responses
   */
  async getImprovementSuggestions(
    _idea: string,
    _currentScore: Score,
    _locale: Locale
  ): Promise<Result<string[], Error>> {
    const startTime = Date.now();

    try {
      // Simulate latency if configured
      await this.simulateLatency();

      // Get scenario to use
      const scenario = this.getScenario();

      // Handle error scenarios
      if (scenario !== 'success') {
        return this.handleErrorScenario(scenario, 'getImprovementSuggestions');
      }

      // Get mock response
      const mockResponse = this.config.enableVariability
        ? this.testDataManager.getRandomVariant('analyzer', scenario)
        : this.testDataManager.getMockResponse('analyzer', scenario);

      // Extract suggestions from mock data
      const data = mockResponse as Record<string, unknown>;
      const suggestions = (data.suggestions as string[]) || [
        'Consider expanding your target market',
        'Strengthen your unique value proposition',
        'Develop a more detailed go-to-market strategy',
      ];

      const duration = Date.now() - startTime;

      // Log request
      this.logRequest({
        timestamp: new Date(),
        type: 'getImprovementSuggestions',
        scenario,
        latency: duration,
        success: true,
      });

      // Record performance
      this.recordPerformance('getImprovementSuggestions', duration);

      return success(suggestions);
    } catch (error) {
      this.logRequest({
        timestamp: new Date(),
        type: 'getImprovementSuggestions',
        scenario: this.getScenario(),
        latency: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
      });

      return failure(error as Error);
    }
  }

  /**
   * Compare two ideas using mock responses
   */
  async compareIdeas(
    _idea1: string,
    _idea2: string,
    _locale: Locale
  ): Promise<Result<{
    winner: 'idea1' | 'idea2' | 'tie';
    scoreDifference: number;
    comparisonFactors: Array<{
      factor: string;
      idea1Score: number;
      idea2Score: number;
      winner: 'idea1' | 'idea2' | 'tie';
    }>;
    recommendation: string;
  }, Error>> {
    const startTime = Date.now();

    try {
      // Simulate latency if configured
      await this.simulateLatency();

      // Get scenario to use
      const scenario = this.getScenario();

      // Handle error scenarios
      if (scenario !== 'success') {
        return this.handleErrorScenario(scenario, 'compareIdeas');
      }

      // Generate mock comparison result
      const comparisonResult = {
        winner: 'idea1' as const,
        scoreDifference: 12,
        comparisonFactors: [
          {
            factor: 'Market Potential',
            idea1Score: 85,
            idea2Score: 72,
            winner: 'idea1' as const,
          },
          {
            factor: 'Technical Feasibility',
            idea1Score: 78,
            idea2Score: 80,
            winner: 'idea2' as const,
          },
          {
            factor: 'Business Viability',
            idea1Score: 82,
            idea2Score: 75,
            winner: 'idea1' as const,
          },
        ],
        recommendation: 'Idea 1 shows stronger overall potential with better market positioning.',
      };

      const duration = Date.now() - startTime;

      // Log request
      this.logRequest({
        timestamp: new Date(),
        type: 'compareIdeas',
        scenario,
        latency: duration,
        success: true,
      });

      // Record performance
      this.recordPerformance('compareIdeas', duration);

      return success(comparisonResult);
    } catch (error) {
      this.logRequest({
        timestamp: new Date(),
        type: 'compareIdeas',
        scenario: this.getScenario(),
        latency: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
      });

      return failure(error as Error);
    }
  }

  /**
   * Recommend hackathon category using mock responses
   */
  async recommendHackathonCategory(
    _projectName: string,
    _description: string
  ): Promise<Result<{
    recommendedCategory: string;
    confidence: Score;
    alternativeCategories: Array<{
      category: string;
      confidence: Score;
      reason: string;
    }>;
  }, Error>> {
    const startTime = Date.now();

    try {
      // Simulate latency if configured
      await this.simulateLatency();

      // Get scenario to use
      const scenario = this.getScenario();

      // Handle error scenarios
      if (scenario !== 'success') {
        return this.handleErrorScenario(scenario, 'recommendHackathonCategory');
      }

      // Generate mock category recommendation
      const recommendation = {
        recommendedCategory: 'Best Use of AI',
        confidence: Score.create(88),
        alternativeCategories: [
          {
            category: 'Most Innovative',
            confidence: Score.create(75),
            reason: 'Strong innovation in approach',
          },
          {
            category: 'Best Developer Tool',
            confidence: Score.create(68),
            reason: 'Useful for developers',
          },
        ],
      };

      const duration = Date.now() - startTime;

      // Log request
      this.logRequest({
        timestamp: new Date(),
        type: 'recommendHackathonCategory',
        scenario,
        latency: duration,
        success: true,
      });

      // Record performance
      this.recordPerformance('recommendHackathonCategory', duration);

      return success(recommendation);
    } catch (error) {
      this.logRequest({
        timestamp: new Date(),
        type: 'recommendHackathonCategory',
        scenario: this.getScenario(),
        latency: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
      });

      return failure(error as Error);
    }
  }

  /**
   * Check service health using mock responses
   */
  async healthCheck(): Promise<Result<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
  }, Error>> {
    const startTime = Date.now();

    try {
      // Simulate latency if configured
      await this.simulateLatency();

      // Get scenario to use
      const scenario = this.getScenario();

      // Determine health status based on scenario
      let status: 'healthy' | 'degraded' | 'unhealthy';
      
      switch (scenario) {
        case 'success':
          status = 'healthy';
          break;
        case 'timeout':
        case 'rate_limit':
          status = 'degraded';
          break;
        case 'api_error':
        case 'invalid_input':
        case 'partial_response':
          status = 'unhealthy';
          break;
        default:
          status = 'healthy';
      }

      const duration = Date.now() - startTime;

      // Log request
      this.logRequest({
        timestamp: new Date(),
        type: 'healthCheck',
        scenario,
        latency: duration,
        success: true,
      });

      // Record performance
      this.recordPerformance('healthCheck', duration);

      return success({ status, latency: duration });
    } catch (error) {
      this.logRequest({
        timestamp: new Date(),
        type: 'healthCheck',
        scenario: this.getScenario(),
        latency: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
      });

      return failure(error as Error);
    }
  }

  /**
   * Get request logs (for debugging)
   */
  getRequestLogs(): MockRequestLog[] {
    return [...this.requestLogs];
  }

  /**
   * Clear request logs
   */
  clearRequestLogs(): void {
    this.requestLogs.length = 0;
  }

  /**
   * Get performance metrics for a specific method
   */
  getPerformanceMetrics(methodName?: string): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (methodName) {
      const durations = this.performanceMetrics.get(methodName) || [];
      return this.calculateMetrics(durations);
    }

    // Return metrics for all methods
    const allMetrics = new Map<string, PerformanceMetrics>();
    for (const [method, durations] of this.performanceMetrics.entries()) {
      allMetrics.set(method, this.calculateMetrics(durations));
    }
    return allMetrics;
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics.clear();
  }

  /**
   * Calculate performance metrics from duration array
   * @private
   */
  private calculateMetrics(durations: number[]): PerformanceMetrics {
    if (durations.length === 0) {
      return {
        totalRequests: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
      };
    }

    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalDuration / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    return {
      totalRequests: durations.length,
      totalDuration,
      averageDuration: Math.round(averageDuration * 100) / 100,
      minDuration,
      maxDuration,
    };
  }

  /**
   * Record performance metric
   * @private
   */
  private recordPerformance(methodName: string, duration: number): void {
    if (!this.performanceMetrics.has(methodName)) {
      this.performanceMetrics.set(methodName, []);
    }
    
    const durations = this.performanceMetrics.get(methodName)!;
    durations.push(duration);
    
    // Keep only last 1000 measurements to prevent memory issues
    if (durations.length > 1000) {
      durations.shift();
    }

    // Log performance if enabled
    if (process.env.FF_LOG_PERFORMANCE === 'true') {
      console.log(`[MOCK PERFORMANCE] ${methodName}: ${duration}ms`);
    }
  }

  /**
   * Simulate network latency based on configuration
   * 
   * Adds a random delay between minLatency and maxLatency to simulate
   * real network conditions. This helps test loading states and timeouts.
   * 
   * @private
   * @returns Promise that resolves after the simulated delay
   */
  private async simulateLatency(): Promise<void> {
    if (!this.config.simulateLatency) {
      this.lastSimulatedLatency = 0;
      return;
    }

    const minLatency = this.config.minLatency ?? 50;
    const maxLatency = this.config.maxLatency ?? 150;
    const latency = Math.floor(Math.random() * (maxLatency - minLatency + 1)) + minLatency;
    this.lastSimulatedLatency = latency;

    await new Promise(resolve => setTimeout(resolve, latency));
  }

  /**
   * Expose last simulated latency to tests/diagnostics.
   */
  getLastSimulatedLatency(): number {
    return this.lastSimulatedLatency;
  }

  /**
   * Get the scenario to use for the current request
   * 
   * Returns the configured test scenario which determines the type of
   * response (success, error, timeout, etc.) that will be returned.
   * 
   * @private
   * @returns The test scenario to use
   */
  private getScenario(): TestScenario {
    return this.config.defaultScenario ?? "success";
  }

  /**
   * Handle error scenarios
   * 
   * Creates appropriate error responses based on the test scenario.
   * This allows testing of error handling logic in the application.
   * 
   * @private
   * @param scenario - The error scenario to simulate
   * @param methodName - Name of the method being called (for logging)
   * @returns Result containing the error
   */
  private handleErrorScenario<T>(
    scenario: TestScenario,
    methodName: string
  ): Result<T, Error> {
    let error: MockServiceError;

    switch (scenario) {
      case 'api_error':
        error = new MockServiceError(
          `Mock API error in ${methodName}: Simulated server error for testing error handling`,
          'API_ERROR',
          500
        );
        break;

      case 'timeout':
        error = new MockServiceError(
          `Mock timeout in ${methodName}: Simulated request timeout for testing timeout handling`,
          'TIMEOUT',
          408
        );
        break;

      case 'rate_limit':
        error = new MockServiceError(
          `Mock rate limit in ${methodName}: Simulated rate limit exceeded for testing rate limiting`,
          'RATE_LIMIT',
          429
        );
        break;

      case 'invalid_input':
        error = new MockServiceError(
          `Mock invalid input in ${methodName}: Simulated invalid input for testing validation`,
          'INVALID_INPUT',
          400
        );
        break;

      case 'partial_response':
        error = new MockServiceError(
          `Mock partial response in ${methodName}: Simulated incomplete response for testing resilience`,
          'PARTIAL_RESPONSE',
          206
        );
        break;

      default:
        error = new MockServiceError(
          `Mock unknown error in ${methodName}: Unexpected scenario "${scenario}"`,
          'UNKNOWN_ERROR',
          500
        );
    }

    this.logRequest({
      timestamp: new Date(),
      type: methodName,
      scenario,
      success: false,
      error: error.message,
    });

    return failure(error);
  }

  /**
   * Log a mock request
   * 
   * Records request details for debugging and analysis. Logs are kept
   * in memory (limited to last 100) and optionally printed to console.
   * 
   * @private
   * @param log - The request log entry to record
   */
  private logRequest(log: MockRequestLog): void {
    if (this.config.logRequests) {
      console.log('[MOCK AI SERVICE]', {
        timestamp: log.timestamp.toISOString(),
        type: log.type,
        scenario: log.scenario,
        latency: log.latency ? `${log.latency}ms` : 'N/A',
        success: log.success,
        error: log.error,
      });
    }

    this.requestLogs.push(log);

    // Keep only last 100 logs to prevent memory issues
    if (this.requestLogs.length > 100) {
      this.requestLogs.shift();
    }
  }

  /**
   * Convert mock data to AIAnalysisResult format
   * 
   * Transforms the mock response data structure into the format expected
   * by the application. Provides default values for missing fields.
   * 
   * @private
   * @param data - Raw mock response data
   * @returns Formatted AIAnalysisResult
   */
  private convertToAIAnalysisResult(data: Record<string, unknown>): AIAnalysisResult {
    // Extract data from mock response format
    const mockData = data;

    return {
      score: Score.create((mockData.finalScore as number) || 75),
      summary: (mockData.detailedSummary as string) || 'Mock analysis summary',
      detailedAnalysis: {
        strengths: (mockData.strengths as string[]) || ['Strong market potential'],
        weaknesses: (mockData.weaknesses as string[]) || ['Needs more validation'],
        opportunities: (mockData.opportunities as string[]) || ['Growing market'],
        threats: (mockData.threats as string[]) || ['Competition'],
      },
      criteriaScores: this.extractCriteriaScores(mockData),
      suggestions: (mockData.suggestions as string[]) || ['Consider market research'],
      marketPotential: {
        score: Score.create((mockData.marketPotentialScore as number) || 80),
        analysis: (mockData.marketPotentialAnalysis as string) || 'Strong market potential',
        targetMarket: (mockData.targetMarket as string) || 'General consumers',
        marketSize: (mockData.marketSize as string) || 'Large',
      },
      technicalFeasibility: {
        score: Score.create((mockData.technicalFeasibilityScore as number) || 75),
        analysis: (mockData.technicalFeasibilityAnalysis as string) || 'Technically feasible',
        complexity: (mockData.complexity as 'low' | 'medium' | 'high') || 'medium',
        requiredSkills: (mockData.requiredSkills as string[]) || ['Development', 'Design'],
      },
      businessViability: {
        score: Score.create((mockData.businessViabilityScore as number) || 70),
        analysis: (mockData.businessViabilityAnalysis as string) || 'Viable business model',
        revenueModel: (mockData.revenueModel as string[]) || ['Subscription'],
        competitiveAdvantage: (mockData.competitiveAdvantage as string) || 'Unique approach',
      },
    };
  }

  /**
   * Extract criteria scores from mock data
   * 
   * Parses the scoring rubric from mock data and converts it to the
   * format expected by the application. Provides default scores if
   * the rubric is missing or malformed.
   * 
   * @private
   * @param mockData - Raw mock response data
   * @returns Array of criteria scores with justifications
   */
  private extractCriteriaScores(mockData: Record<string, unknown>): Array<{
    criteriaName: string;
    score: Score;
    justification: string;
  }> {
    if (mockData.scoringRubric && Array.isArray(mockData.scoringRubric)) {
      return mockData.scoringRubric.map((item: Record<string, unknown>) => ({
        criteriaName: (item.criteria as string) || 'Unknown',
        score: Score.create((item.score as number) || 75),
        justification: (item.justification as string) || 'Mock justification',
      }));
    }

    // Default criteria scores
    return [
      {
        criteriaName: 'Innovation',
        score: Score.create(80),
        justification: 'Innovative approach to problem solving',
      },
      {
        criteriaName: 'Market Fit',
        score: Score.create(75),
        justification: 'Good market fit with target audience',
      },
      {
        criteriaName: 'Execution',
        score: Score.create(70),
        justification: 'Feasible execution plan',
      },
    ];
  }
}
