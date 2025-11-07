import { Analysis, CreateAnalysisProps } from '../../domain/entities';
import { UserId, Locale, Category, Score } from '../../domain/value-objects';
import { IAnalysisRepository } from '../../domain/repositories';
import { AnalysisValidationService, ScoreCalculationService } from '../../domain/services';
import { Result, success, failure } from '../../shared/types/common';
import { ValidationError } from '../../shared/types/errors';

/**
 * Input for analyzing an idea
 */
export interface AnalyzeIdeaInput {
  idea: string;
  userId: UserId;
  locale: Locale;
  category?: Category;
  additionalContext?: {
    hasVisualMaterials?: boolean;
    hasImplementation?: boolean;
    timeSpent?: number;
  };
}

/**
 * Output from analyzing an idea
 */
export interface AnalyzeIdeaOutput {
  analysis: Analysis;
  validationResult: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  scoreBreakdown: {
    totalScore: Score;
    criteriaScores: Array<{
      criteriaName: string;
      score: Score;
      weight: number;
      justification: string;
    }>;
    bonusPoints: number;
    penaltyPoints: number;
  };
  suggestions: string[];
}

/**
 * Use case for analyzing startup ideas
 * Orchestrates the complete analysis process including validation, scoring, and persistence
 */
export class AnalyzeIdeaUseCase {
  constructor(
    private readonly analysisRepository: IAnalysisRepository,
    private readonly validationService: AnalysisValidationService,
    private readonly scoreCalculationService: ScoreCalculationService
  ) {}

  /**
   * Execute the idea analysis process
   */
  async execute(input: AnalyzeIdeaInput): Promise<Result<AnalyzeIdeaOutput, Error>> {
    try {
      // Step 1: Create initial analysis entity
      const analysisProps: CreateAnalysisProps = {
        idea: input.idea,
        userId: input.userId,
        score: Score.create(0), // Initial score, will be calculated
        locale: input.locale,
        category: input.category
      };

      const analysis = Analysis.create(analysisProps);

      // Step 2: Validate the analysis
      const validationResult = this.validationService.validateAnalysis(analysis);
      
      if (!validationResult.isValid) {
        return failure(new ValidationError(
          'Analysis validation failed',
          validationResult.errors
        ));
      }

      // Step 3: Calculate score
      const scoreContext = {
        analysis,
        category: input.category,
        additionalFactors: input.additionalContext
      };

      const scoreBreakdown = this.scoreCalculationService.calculateAnalysisScore(scoreContext);

      // Step 4: Update analysis with calculated score
      analysis.updateScore(scoreBreakdown.totalScore);

      // Step 5: Generate improvement suggestions
      const suggestions = this.generateImprovementSuggestions(analysis, scoreBreakdown);

      // Step 6: Add suggestions to analysis
      for (const suggestion of suggestions.slice(0, 5)) { // Limit to 5 suggestions
        try {
          analysis.addSuggestion(suggestion);
        } catch {
          // Continue if suggestion can't be added (e.g., duplicate)
        }
      }

      // Step 7: Persist the analysis
      const saveResult = await this.analysisRepository.save(analysis);
      
      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      // Step 8: Return comprehensive result
      const output: AnalyzeIdeaOutput = {
        analysis: saveResult.data,
        validationResult,
        scoreBreakdown: {
          totalScore: scoreBreakdown.totalScore,
          criteriaScores: scoreBreakdown.criteriaScores.map(cs => ({
            criteriaName: cs.criteria.name,
            score: cs.score,
            weight: cs.weight,
            justification: cs.justification
          })),
          bonusPoints: scoreBreakdown.bonusPoints,
          penaltyPoints: scoreBreakdown.penaltyPoints
        },
        suggestions
      };

      return success(output);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error during analysis'));
    }
  }

  /**
   * Generate improvement suggestions based on analysis and score breakdown
   */
  private generateImprovementSuggestions(
    analysis: Analysis, 
    scoreBreakdown: {
      totalScore: Score;
      criteriaScores: Array<{
        criteria: { name: string };
        score: Score;
      }>;
    }
  ): string[] {
    const suggestions: string[] = [];

    // Score-based suggestions
    if (scoreBreakdown.totalScore.value < 40) {
      suggestions.push('Consider refining your core value proposition to make it more compelling');
      suggestions.push('Research your target market more thoroughly to identify specific pain points');
    } else if (scoreBreakdown.totalScore.value < 70) {
      suggestions.push('Add more specific implementation details to strengthen your proposal');
      suggestions.push('Consider potential challenges and how you would address them');
    }

    // Criteria-specific suggestions
    for (const criteriaScore of scoreBreakdown.criteriaScores) {
      if (criteriaScore.score.value < 60) {
        switch (criteriaScore.criteria.name) {
          case 'Market Potential':
            suggestions.push('Expand on the market size and target audience for your idea');
            break;
          case 'Technical Feasibility':
            suggestions.push('Provide more details about the technical implementation approach');
            break;
          case 'Innovation Level':
            suggestions.push('Highlight what makes your solution unique compared to existing alternatives');
            break;
          case 'Business Viability':
            suggestions.push('Consider and describe potential revenue streams and business model');
            break;
        }
      }
    }

    // Length-based suggestions
    if (analysis.idea.length < 100) {
      suggestions.push('Expand your idea description with more specific details and examples');
    }

    // Category-specific suggestions
    if (analysis.category) {
      if (analysis.category.isHackathon) {
        suggestions.push('Consider how your project fits within the hackathon category requirements');
        suggestions.push('Think about what makes your project stand out in the competition');
      }
    }

    // General improvement suggestions
    suggestions.push('Consider potential user feedback and how you would iterate on your idea');
    suggestions.push('Think about the resources and timeline needed to implement your solution');

    return Array.from(new Set(suggestions)); // Remove duplicates
  }
}