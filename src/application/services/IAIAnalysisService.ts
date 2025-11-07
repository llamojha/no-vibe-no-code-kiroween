import { Locale, Score } from '../../domain/value-objects';
import { Result } from '../../shared/types/common';

/**
 * AI analysis result from external service
 */
export interface AIAnalysisResult {
  score: Score;
  summary: string;
  detailedAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  criteriaScores: Array<{
    criteriaName: string;
    score: Score;
    justification: string;
  }>;
  suggestions: string[];
  marketPotential: {
    score: Score;
    analysis: string;
    targetMarket: string;
    marketSize: string;
  };
  technicalFeasibility: {
    score: Score;
    analysis: string;
    complexity: 'low' | 'medium' | 'high';
    requiredSkills: string[];
  };
  businessViability: {
    score: Score;
    analysis: string;
    revenueModel: string[];
    competitiveAdvantage: string;
  };
}

/**
 * Interface for AI analysis service
 * Defines contract for external AI service integration
 */
export interface IAIAnalysisService {
  /**
   * Analyze a startup idea using AI
   */
  analyzeIdea(idea: string, locale: Locale): Promise<Result<AIAnalysisResult, Error>>;

  /**
   * Analyze a hackathon project using AI
   */
  analyzeHackathonProject(
    projectName: string,
    description: string,
    kiroUsage: string,
    locale: Locale
  ): Promise<Result<AIAnalysisResult, Error>>;

  /**
   * Get improvement suggestions for an idea
   */
  getImprovementSuggestions(
    idea: string,
    currentScore: Score,
    locale: Locale
  ): Promise<Result<string[], Error>>;

  /**
   * Compare two ideas and provide analysis
   */
  compareIdeas(
    idea1: string,
    idea2: string,
    locale: Locale
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
  }, Error>>;

  /**
   * Generate category recommendations for hackathon projects
   */
  recommendHackathonCategory(
    projectName: string,
    description: string,
    kiroUsage: string
  ): Promise<Result<{
    recommendedCategory: string;
    confidence: Score;
    alternativeCategories: Array<{
      category: string;
      confidence: Score;
      reason: string;
    }>;
  }, Error>>;

  /**
   * Check service health and availability
   */
  healthCheck(): Promise<Result<{ status: 'healthy' | 'degraded' | 'unhealthy'; latency: number }, Error>>;
}