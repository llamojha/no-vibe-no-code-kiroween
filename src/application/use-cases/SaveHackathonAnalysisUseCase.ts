import { Analysis } from '../../domain/entities';
import { AnalysisId, UserId, Category } from '../../domain/value-objects';
import { IHackathonAnalysisRepository } from '../../domain/repositories';
import { HackathonAnalysisService, HackathonProjectMetadata } from '../../domain/services';
import { Result, success, failure } from '../../shared/types/common';
import { EntityNotFoundError, BusinessRuleViolationError } from '../../shared/types/errors';

/**
 * Input for saving hackathon analysis updates
 */
export interface SaveHackathonAnalysisInput {
  analysisId: AnalysisId;
  userId: UserId;
  updates: {
    projectData?: Partial<HackathonProjectMetadata>;
    category?: Category;
    finalSubmission?: boolean;
  };
}

/**
 * Output from saving hackathon analysis
 */
export interface SaveHackathonAnalysisOutput {
  analysis: Analysis;
  updatedFields: string[];
  categoryValidation?: {
    isGoodFit: boolean;
    fitScore: number;
    suggestions: string[];
  };
}

/**
 * Use case for saving hackathon analysis updates
 * Handles updating hackathon-specific metadata and category assignments
 */
export class SaveHackathonAnalysisUseCase {
  constructor(
    private readonly hackathonRepository: IHackathonAnalysisRepository,
    private readonly hackathonService: HackathonAnalysisService
  ) {}

  /**
   * Execute the save hackathon analysis process
   */
  async execute(input: SaveHackathonAnalysisInput): Promise<Result<SaveHackathonAnalysisOutput, Error>> {
    try {
      // Step 1: Retrieve existing hackathon analysis
      const existingResult = await this.hackathonRepository.findHackathonAnalysisById(input.analysisId);
      
      if (!existingResult.success) {
        return failure(existingResult.error);
      }

      if (!existingResult.data) {
        return failure(new EntityNotFoundError('Hackathon Analysis', input.analysisId.value));
      }

      const { analysis, hackathonData } = existingResult.data;

      // Step 2: Verify ownership
      if (!analysis.belongsToUser(input.userId)) {
        return failure(new BusinessRuleViolationError(
          'User does not have permission to update this hackathon analysis'
        ));
      }

      // Step 3: Apply updates
      const updatedFields: string[] = [];
      let categoryValidation: SaveHackathonAnalysisOutput['categoryValidation'];

      // Update project metadata
      if (input.updates.projectData) {
        const updatedHackathonData = {
          ...hackathonData,
          ...input.updates.projectData
        };

        // Convert to HackathonProjectMetadata for validation
        const projectDataForValidation: HackathonProjectMetadata = {
          projectName: updatedHackathonData.projectName || hackathonData.projectName,
          description: updatedHackathonData.projectDescription || hackathonData.projectDescription,
          teamSize: 1, // Default team size, will be updated from metadata if available
          githubUrl: updatedHackathonData.githubUrl || hackathonData.githubUrl,
          demoUrl: updatedHackathonData.demoUrl || hackathonData.demoUrl,
          videoUrl: updatedHackathonData.videoUrl || hackathonData.videoUrl,
          screenshots: updatedHackathonData.screenshots || hackathonData.screenshots
        };

        // Validate updated project data
        const validationResult = this.hackathonService.validateHackathonSubmission(
          analysis,
          projectDataForValidation
        );

        if (!validationResult.isValid) {
          return failure(new BusinessRuleViolationError(
            `Project data validation failed: ${validationResult.errors.join(', ')}`
          ));
        }

        // Update hackathon metadata
        const updateResult = await this.hackathonRepository.updateHackathonData(
          input.analysisId,
          input.updates.projectData
        );

        if (!updateResult.success) {
          return failure(updateResult.error);
        }

        updatedFields.push('projectData');
      }

      // Update category assignment
      if (input.updates.category) {
        // Validate category fit
        const currentHackathonData: HackathonProjectMetadata = {
          projectName: hackathonData.projectName,
          description: hackathonData.projectDescription,
          teamSize: 1, // Default, should be stored separately
          githubUrl: hackathonData.githubUrl,
          demoUrl: hackathonData.demoUrl,
          videoUrl: hackathonData.videoUrl,
          screenshots: hackathonData.screenshots
        };

        const evaluation = this.hackathonService.evaluateProjectForCategory(
          analysis,
          currentHackathonData
        );

        const categoryFit = evaluation.alternativeCategories
          .find(alt => alt.category.equals(input.updates.category!))
          || (evaluation.recommendedCategory.equals(input.updates.category!) 
              ? { category: evaluation.recommendedCategory, fitScore: evaluation.categoryFitScore, reason: 'Recommended category' }
              : null);

        if (categoryFit) {
          categoryValidation = {
            isGoodFit: categoryFit.fitScore.value >= 60,
            fitScore: categoryFit.fitScore.value,
            suggestions: categoryFit.fitScore.value < 60 
              ? this.hackathonService.generateCategoryImprovements(analysis, input.updates.category)
              : []
          };
        }

        // Assign the category
        analysis.setCategory(input.updates.category);
        updatedFields.push('category');
      }

      // Handle final submission
      if (input.updates.finalSubmission !== undefined) {
        if (input.updates.finalSubmission) {
          // Validate that the project is ready for final submission
          const currentHackathonData: HackathonProjectMetadata = {
            projectName: hackathonData.projectName,
            description: hackathonData.projectDescription,
            teamSize: 1,
            githubUrl: hackathonData.githubUrl,
            demoUrl: hackathonData.demoUrl,
            videoUrl: hackathonData.videoUrl,
            screenshots: hackathonData.screenshots
          };

          const validationResult = this.hackathonService.validateHackathonSubmission(
            analysis,
            currentHackathonData
          );

          if (!validationResult.isValid) {
            return failure(new BusinessRuleViolationError(
              `Cannot submit project with validation errors: ${validationResult.errors.join(', ')}`
            ));
          }

          if (!analysis.category) {
            return failure(new BusinessRuleViolationError(
              'Cannot submit project without a category assignment'
            ));
          }
        }

        updatedFields.push('submissionStatus');
      }

      // Step 4: Save the updated analysis
      const saveResult = await this.hackathonRepository.update(analysis);
      
      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      // Step 5: Return result
      const output: SaveHackathonAnalysisOutput = {
        analysis: saveResult.data,
        updatedFields,
        categoryValidation
      };

      return success(output);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error during hackathon save'));
    }
  }

  /**
   * Bulk assign categories to multiple hackathon projects
   */
  async bulkAssignCategories(
    assignments: Array<{ analysisId: AnalysisId; category: Category }>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _adminUserId: UserId
  ): Promise<Result<{ successCount: number; errors: Array<{ analysisId: string; error: string }> }, Error>> {
    try {
      const updates = assignments.map(assignment => ({
        id: assignment.analysisId,
        category: assignment.category
      }));

      const bulkResult = await this.hackathonRepository.bulkUpdateCategories(updates);

      if (!bulkResult.success) {
        return failure(bulkResult.error);
      }

      return success({
        successCount: assignments.length,
        errors: []
      });

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Error during bulk category assignment'));
    }
  }

  /**
   * Get category fit analysis for a hackathon project
   */
  async analyzeCategoryFit(
    analysisId: AnalysisId,
    category: Category,
    userId: UserId
  ): Promise<Result<{
    fitScore: number;
    isGoodFit: boolean;
    improvements: string[];
    alternatives: Array<{ category: Category; fitScore: number; reason: string }>;
  }, Error>> {
    try {
      // Retrieve hackathon analysis
      const analysisResult = await this.hackathonRepository.findHackathonAnalysisById(analysisId);
      
      if (!analysisResult.success) {
        return failure(analysisResult.error);
      }

      if (!analysisResult.data) {
        return failure(new EntityNotFoundError('Hackathon Analysis', analysisId.value));
      }

      const { analysis, hackathonData } = analysisResult.data;

      // Verify access (owner or admin)
      if (!analysis.belongsToUser(userId)) {
        return failure(new BusinessRuleViolationError(
          'User does not have permission to analyze this project'
        ));
      }

      // Convert hackathon data for evaluation
      const projectMetadata: HackathonProjectMetadata = {
        projectName: hackathonData.projectName,
        description: hackathonData.projectDescription,
        teamSize: 1, // Default
        githubUrl: hackathonData.githubUrl,
        demoUrl: hackathonData.demoUrl,
        videoUrl: hackathonData.videoUrl,
        screenshots: hackathonData.screenshots
      };

      // Evaluate category fit
      const evaluation = this.hackathonService.evaluateProjectForCategory(
        analysis,
        projectMetadata
      );

      const targetCategoryFit = evaluation.alternativeCategories
        .find(alt => alt.category.equals(category))
        || (evaluation.recommendedCategory.equals(category) 
            ? { category: evaluation.recommendedCategory, fitScore: evaluation.categoryFitScore, reason: 'Recommended' }
            : null);

      if (!targetCategoryFit) {
        return failure(new BusinessRuleViolationError('Invalid category for analysis'));
      }

      const improvements = targetCategoryFit.fitScore.value < 70
        ? this.hackathonService.generateCategoryImprovements(analysis, category)
        : [];

      return success({
        fitScore: targetCategoryFit.fitScore.value,
        isGoodFit: targetCategoryFit.fitScore.value >= 60,
        improvements,
        alternatives: evaluation.alternativeCategories.map(alt => ({
          category: alt.category,
          fitScore: alt.fitScore.value,
          reason: alt.reason
        }))
      });

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Error analyzing category fit'));
    }
  }
}
