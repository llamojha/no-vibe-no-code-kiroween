import { Analysis, CreateAnalysisProps } from '../../domain/entities';
import { UserId, Locale, Score } from '../../domain/value-objects';
import { IHackathonAnalysisRepository } from '../../domain/repositories';
import { HackathonAnalysisService, ScoreCalculationService, HackathonProjectMetadata, HackathonEvaluationResult } from '../../domain/services';
import { Result, success, failure } from '../../shared/types/common';
import { ValidationError } from '../../shared/types/errors';

/**
 * Input for analyzing a hackathon project
 */
export interface AnalyzeHackathonProjectInput {
  projectData: HackathonProjectMetadata;
  userId: UserId;
  locale: Locale;
  autoAssignCategory?: boolean;
}

/**
 * Output from analyzing a hackathon project
 */
export interface AnalyzeHackathonProjectOutput {
  analysis: Analysis;
  evaluation: HackathonEvaluationResult;
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
  competitiveAdvantage: {
    overallAdvantage: Score;
    advantages: Array<{
      factor: string;
      impact: 'high' | 'medium' | 'low';
      description: string;
    }>;
  };
}

/**
 * Use case for analyzing hackathon projects
 * Specialized analysis for hackathon submissions with category evaluation
 */
export class AnalyzeHackathonProjectUseCase {
  constructor(
    private readonly hackathonRepository: IHackathonAnalysisRepository,
    private readonly hackathonService: HackathonAnalysisService,
    private readonly scoreCalculationService: ScoreCalculationService
  ) {}

  /**
   * Execute the hackathon project analysis process
   */
  async execute(input: AnalyzeHackathonProjectInput): Promise<Result<AnalyzeHackathonProjectOutput, Error>> {
    try {
      // Step 1: Validate hackathon submission
      const validationResult = this.hackathonService.validateHackathonSubmission(
        {} as Analysis, // Temporary, will be created below
        input.projectData
      );

      if (!validationResult.isValid) {
        return failure(new ValidationError(
          'Hackathon submission validation failed',
          validationResult.errors
        ));
      }

      // Step 2: Create initial analysis entity
      const analysisProps: CreateAnalysisProps = {
        idea: `${input.projectData.projectName}: ${input.projectData.description}`,
        userId: input.userId,
        score: Score.create(0), // Will be calculated
        locale: input.locale
      };

      const analysis = Analysis.create(analysisProps);

      // Step 3: Evaluate project for category recommendation
      const evaluation = this.hackathonService.evaluateProjectForCategory(
        analysis,
        input.projectData
      );

      // Step 4: Auto-assign recommended category if requested
      if (input.autoAssignCategory) {
        analysis.setCategory(evaluation.recommendedCategory);
      }

      // Step 5: Calculate hackathon-specific score
      const scoreContext = {
        analysis,
        category: evaluation.recommendedCategory,
        additionalFactors: {
          hasVisualMaterials: (input.projectData.screenshots?.length || 0) > 0,
          hasImplementation: !!input.projectData.githubUrl || !!input.projectData.demoUrl,
          teamSize: input.projectData.teamSize,
          timeSpent: input.projectData.timeSpent
        }
      };

      const scoreBreakdown = this.scoreCalculationService.calculateHackathonScore(scoreContext);

      // Step 6: Update analysis with calculated score
      analysis.updateScore(scoreBreakdown.totalScore);

      // Step 7: Calculate competitive advantage
      const competitiveAdvantage = this.hackathonService.calculateCompetitiveAdvantage(
        analysis,
        input.projectData,
        evaluation.recommendedCategory
      );

      // Step 8: Add improvement suggestions to analysis
      for (const suggestion of evaluation.improvementSuggestions.slice(0, 5)) {
        try {
          analysis.addSuggestion(suggestion);
        } catch {
          // Continue if suggestion can't be added
        }
      }

      // Step 9: Save hackathon analysis with metadata
      const hackathonAnalysisData = {
        projectName: input.projectData.projectName,
        projectDescription: input.projectData.description,
        category: evaluation.recommendedCategory,
        githubUrl: input.projectData.githubUrl,
        demoUrl: input.projectData.demoUrl,
        videoUrl: input.projectData.videoUrl,
        screenshots: input.projectData.screenshots,
        teamMembers: [], // Not provided in metadata, using empty array
      };

      const saveResult = await this.hackathonRepository.saveHackathonAnalysis(
        analysis,
        hackathonAnalysisData
      );

      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      // Step 10: Return comprehensive result
      const output: AnalyzeHackathonProjectOutput = {
        analysis: saveResult.data,
        evaluation,
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
        competitiveAdvantage
      };

      return success(output);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error during hackathon analysis'));
    }
  }

  /**
   * Get category recommendations for a project without full analysis
   */
  async getCategoryRecommendations(
    projectData: HackathonProjectMetadata,
    userId: UserId
  ): Promise<Result<HackathonEvaluationResult, Error>> {
    try {
      // Create temporary analysis for evaluation
      const tempAnalysis = Analysis.create({
        idea: `${projectData.projectName}: ${projectData.description}`,
        userId,
        score: Score.create(50),
        locale: Locale.english()
      });

      const evaluation = this.hackathonService.evaluateProjectForCategory(
        tempAnalysis,
        projectData
      );

      return success(evaluation);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Error getting category recommendations'));
    }
  }

  /**
   * Validate hackathon project data before submission
   */
  async validateProject(
    projectData: HackathonProjectMetadata
  ): Promise<Result<{ isValid: boolean; errors: string[]; warnings: string[] }, Error>> {
    try {
      // Create temporary analysis for validation
      const tempAnalysis = Analysis.create({
        idea: `${projectData.projectName}: ${projectData.description}`,
        userId: UserId.generate(),
        score: Score.create(50),
        locale: Locale.english()
      });

      const validationResult = this.hackathonService.validateHackathonSubmission(
        tempAnalysis,
        projectData
      );

      return success(validationResult);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Error validating project'));
    }
  }
}
