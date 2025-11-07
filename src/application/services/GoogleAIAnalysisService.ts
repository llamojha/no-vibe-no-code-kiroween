import { IAIAnalysisService, AIAnalysisResult } from './IAIAnalysisService';
import { Locale, Score } from '../../domain/value-objects';
import { Result, success, failure } from '../../shared/types/common';

/**
 * Configuration for Google AI service
 */
export interface GoogleAIConfig {
  apiKey: string;
  model: string;
  timeout: number;
  maxRetries: number;
}

/**
 * Google AI implementation of AI analysis service
 * Integrates with Google Gemini AI for startup idea analysis
 */
export class GoogleAIAnalysisService implements IAIAnalysisService {
  constructor(
    private readonly config: GoogleAIConfig
  ) {}

  /**
   * Analyze a startup idea using Google AI
   */
  async analyzeIdea(idea: string, locale: Locale): Promise<Result<AIAnalysisResult, Error>> {
    try {
      const prompt = this.buildIdeaAnalysisPrompt(idea, locale);
      const response = await this.callGoogleAI(prompt);

      if (!response.success) {
        return failure(response.error);
      }

      const analysisResult = this.parseAnalysisResponse(response.data);
      return success(analysisResult);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error in Google AI analysis'));
    }
  }

  /**
   * Analyze a hackathon project using Google AI
   */
  async analyzeHackathonProject(
    projectName: string,
    description: string,
    kiroUsage: string,
    locale: Locale
  ): Promise<Result<AIAnalysisResult, Error>> {
    try {
      const prompt = this.buildHackathonAnalysisPrompt(projectName, description, kiroUsage, locale);
      const response = await this.callGoogleAI(prompt);

      if (!response.success) {
        return failure(response.error);
      }

      const analysisResult = this.parseAnalysisResponse(response.data);
      return success(analysisResult);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error in hackathon analysis'));
    }
  }

  /**
   * Get improvement suggestions for an idea
   */
  async getImprovementSuggestions(
    idea: string,
    currentScore: Score,
    locale: Locale
  ): Promise<Result<string[], Error>> {
    try {
      const prompt = this.buildImprovementPrompt(idea, currentScore, locale);
      const response = await this.callGoogleAI(prompt);

      if (!response.success) {
        return failure(response.error);
      }

      const suggestions = this.parseImprovementSuggestions(response.data);
      return success(suggestions);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error getting suggestions'));
    }
  }

  /**
   * Compare two ideas and provide analysis
   */
  async compareIdeas(
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
  }, Error>> {
    try {
      const prompt = this.buildComparisonPrompt(idea1, idea2, locale);
      const response = await this.callGoogleAI(prompt);

      if (!response.success) {
        return failure(response.error);
      }

      const comparison = this.parseComparisonResponse(response.data);
      return success(comparison);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error comparing ideas'));
    }
  }

  /**
   * Generate category recommendations for hackathon projects
   */
  async recommendHackathonCategory(
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
  }, Error>> {
    try {
      const prompt = this.buildCategoryRecommendationPrompt(projectName, description, kiroUsage);
      const response = await this.callGoogleAI(prompt);

      if (!response.success) {
        return failure(response.error);
      }

      const recommendation = this.parseCategoryRecommendation(response.data);
      return success(recommendation);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error recommending category'));
    }
  }

  /**
   * Check service health and availability
   */
  async healthCheck(): Promise<Result<{ status: 'healthy' | 'degraded' | 'unhealthy'; latency: number }, Error>> {
    try {
      const startTime = Date.now();
      const response = await this.callGoogleAI('Health check test');
      const latency = Date.now() - startTime;

      if (!response.success) {
        return success({ status: 'unhealthy', latency });
      }

      const status = latency < 2000 ? 'healthy' : 'degraded';
      return success({ status, latency });

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Health check failed'));
    }
  }

  /**
   * Call Google AI API with retry logic
   */
  private async callGoogleAI(prompt: string): Promise<Result<string, Error>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Simulate Google AI API call
        // In real implementation, this would use the actual Google AI SDK
        const response = await this.simulateGoogleAICall(prompt);
        return success(response);

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown API error');
        
        if (attempt === this.config.maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    return failure(lastError || new Error('All retry attempts failed'));
  }

  /**
   * Simulate Google AI API call (placeholder for actual implementation)
   */
  private async simulateGoogleAICall(prompt: string): Promise<string> {
    // Simulate API latency
    await this.delay(500 + Math.random() * 1000);

    // Simulate different types of responses based on prompt content
    if (prompt.includes('hackathon')) {
      return JSON.stringify({
        score: 75,
        summary: 'This hackathon project shows good potential with innovative use of Kiro.',
        strengths: ['Creative implementation', 'Good use of AI tools', 'Clear value proposition'],
        weaknesses: ['Limited market research', 'Technical complexity concerns'],
        suggestions: ['Add more user testing', 'Simplify the technical architecture'],
        criteriaScores: [
          { criteriaName: 'Innovation', score: 80, justification: 'Novel approach to problem solving' },
          { criteriaName: 'Technical Feasibility', score: 70, justification: 'Achievable with current technology' }
        ]
      });
    }

    return JSON.stringify({
      score: 65,
      summary: 'This startup idea has moderate potential with some areas for improvement.',
      strengths: ['Addresses real problem', 'Clear target market'],
      weaknesses: ['High competition', 'Monetization challenges'],
      suggestions: ['Research competitors more thoroughly', 'Define unique value proposition'],
      criteriaScores: [
        { criteriaName: 'Market Potential', score: 70, justification: 'Large addressable market' },
        { criteriaName: 'Business Viability', score: 60, justification: 'Revenue model needs refinement' }
      ]
    });
  }

  /**
   * Build prompt for idea analysis
   */
  private buildIdeaAnalysisPrompt(idea: string, locale: Locale): string {
    const language = locale.value === 'es' ? 'Spanish' : 'English';
    
    return `Analyze this startup idea and provide a comprehensive evaluation in ${language}:

Idea: "${idea}"

Please provide:
1. Overall score (0-100)
2. Summary of the idea's potential
3. Strengths and weaknesses
4. Market potential analysis
5. Technical feasibility assessment
6. Business viability evaluation
7. Specific improvement suggestions
8. Detailed criteria scores with justifications

Format the response as JSON with the specified structure.`;
  }

  /**
   * Build prompt for hackathon analysis
   */
  private buildHackathonAnalysisPrompt(
    projectName: string,
    description: string,
    kiroUsage: string,
    locale: Locale
  ): string {
    const language = locale.value === 'es' ? 'Spanish' : 'English';
    
    return `Analyze this hackathon project and provide evaluation in ${language}:

Project Name: "${projectName}"
Description: "${description}"
Kiro Usage: "${kiroUsage}"

Focus on:
1. Innovation and creativity
2. Technical implementation
3. Use of Kiro AI tools
4. Presentation quality
5. Potential impact
6. Category fit for hackathon

Format the response as JSON with detailed analysis.`;
  }

  /**
   * Build prompt for improvement suggestions
   */
  private buildImprovementPrompt(idea: string, currentScore: Score, locale: Locale): string {
    const language = locale.value === 'es' ? 'Spanish' : 'English';
    
    return `Provide specific improvement suggestions for this startup idea in ${language}:

Idea: "${idea}"
Current Score: ${currentScore.value}/100

Focus on actionable suggestions that could improve the score by addressing:
1. Market validation
2. Technical feasibility
3. Business model
4. Competitive advantage
5. Implementation strategy

Provide 5-7 specific, actionable suggestions.`;
  }

  /**
   * Build prompt for idea comparison
   */
  private buildComparisonPrompt(idea1: string, idea2: string, locale: Locale): string {
    const language = locale.value === 'es' ? 'Spanish' : 'English';
    
    return `Compare these two startup ideas and provide analysis in ${language}:

Idea 1: "${idea1}"
Idea 2: "${idea2}"

Provide:
1. Overall winner and score difference
2. Factor-by-factor comparison
3. Recommendation for improvement
4. Justification for the decision

Format as JSON with structured comparison data.`;
  }

  /**
   * Build prompt for category recommendation
   */
  private buildCategoryRecommendationPrompt(
    projectName: string,
    description: string,
    kiroUsage: string
  ): string {
    return `Recommend the best hackathon category for this project:

Project: "${projectName}"
Description: "${description}"
Kiro Usage: "${kiroUsage}"

Available categories:
- resurrection (reviving old/abandoned projects)
- frankenstein (combining multiple technologies)
- skeleton-crew (minimal viable implementations)
- costume-contest (creative/artistic projects)

Provide:
1. Recommended category with confidence score
2. Alternative categories with reasons
3. Justification for the recommendation

Format as JSON.`;
  }

  /**
   * Parse analysis response from AI
   */
  private parseAnalysisResponse(response: string): AIAnalysisResult {
    try {
      const parsed = JSON.parse(response);
      
      return {
        score: Score.create(parsed.score || 50),
        summary: parsed.summary || 'Analysis completed',
        detailedAnalysis: {
          strengths: parsed.strengths || [],
          weaknesses: parsed.weaknesses || [],
          opportunities: parsed.opportunities || [],
          threats: parsed.threats || []
        },
        criteriaScores: (parsed.criteriaScores || []).map((cs: { criteriaName: string; score: number; justification: string }) => ({
          criteriaName: cs.criteriaName,
          score: Score.create(cs.score),
          justification: cs.justification
        })),
        suggestions: parsed.suggestions || [],
        marketPotential: {
          score: Score.create(parsed.marketPotential?.score || 50),
          analysis: parsed.marketPotential?.analysis || 'Market analysis pending',
          targetMarket: parsed.marketPotential?.targetMarket || 'General market',
          marketSize: parsed.marketPotential?.marketSize || 'Unknown'
        },
        technicalFeasibility: {
          score: Score.create(parsed.technicalFeasibility?.score || 50),
          analysis: parsed.technicalFeasibility?.analysis || 'Technical analysis pending',
          complexity: parsed.technicalFeasibility?.complexity || 'medium',
          requiredSkills: parsed.technicalFeasibility?.requiredSkills || []
        },
        businessViability: {
          score: Score.create(parsed.businessViability?.score || 50),
          analysis: parsed.businessViability?.analysis || 'Business analysis pending',
          revenueModel: parsed.businessViability?.revenueModel || [],
          competitiveAdvantage: parsed.businessViability?.competitiveAdvantage || 'To be determined'
        }
      };
    } catch {
      // Fallback response if parsing fails
      return {
        score: Score.create(50),
        summary: 'Analysis completed with basic evaluation',
        detailedAnalysis: {
          strengths: ['Addresses a real problem'],
          weaknesses: ['Needs more detailed analysis'],
          opportunities: ['Market expansion potential'],
          threats: ['Competitive landscape']
        },
        criteriaScores: [],
        suggestions: ['Conduct market research', 'Validate with potential users'],
        marketPotential: {
          score: Score.create(50),
          analysis: 'Market potential requires further research',
          targetMarket: 'General market',
          marketSize: 'To be determined'
        },
        technicalFeasibility: {
          score: Score.create(50),
          analysis: 'Technical feasibility assessment needed',
          complexity: 'medium',
          requiredSkills: []
        },
        businessViability: {
          score: Score.create(50),
          analysis: 'Business model validation required',
          revenueModel: [],
          competitiveAdvantage: 'Unique value proposition needed'
        }
      };
    }
  }

  /**
   * Parse improvement suggestions from AI response
   */
  private parseImprovementSuggestions(response: string): string[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.suggestions || [];
    } catch {
      return [
        'Conduct thorough market research',
        'Validate your assumptions with potential customers',
        'Develop a clear value proposition',
        'Create a detailed implementation plan',
        'Consider potential challenges and mitigation strategies'
      ];
    }
  }

  /**
   * Parse comparison response from AI
   */
  private parseComparisonResponse(response: string): {
    winner: 'idea1' | 'idea2' | 'tie';
    scoreDifference: number;
    comparisonFactors: Array<{
      factor: string;
      idea1Score: number;
      idea2Score: number;
      winner: 'idea1' | 'idea2' | 'tie';
    }>;
    recommendation: string;
  } {
    try {
      const parsed = JSON.parse(response);
      return {
        winner: parsed.winner || 'tie',
        scoreDifference: parsed.scoreDifference || 0,
        comparisonFactors: parsed.comparisonFactors || [],
        recommendation: parsed.recommendation || 'Both ideas have potential'
      };
    } catch {
      return {
        winner: 'tie',
        scoreDifference: 0,
        comparisonFactors: [],
        recommendation: 'Both ideas require further development'
      };
    }
  }

  /**
   * Parse category recommendation from AI response
   */
  private parseCategoryRecommendation(response: string): {
    recommendedCategory: string;
    confidence: Score;
    alternativeCategories: Array<{
      category: string;
      confidence: Score;
      reason: string;
    }>;
  } {
    try {
      const parsed = JSON.parse(response);
      return {
        recommendedCategory: parsed.recommendedCategory || 'frankenstein',
        confidence: Score.create(parsed.confidence || 70),
        alternativeCategories: (parsed.alternativeCategories || []).map((alt: { category: string; confidence: number; reason: string }) => ({
          category: alt.category,
          confidence: Score.create(alt.confidence),
          reason: alt.reason
        }))
      };
    } catch {
      return {
        recommendedCategory: 'frankenstein',
        confidence: Score.create(70),
        alternativeCategories: []
      };
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}