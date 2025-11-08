import { Analysis } from "../../domain/entities";
import {
  AnalysisId,
  UserId,
  Score,
  Category,
} from "../../domain/value-objects";
import { IAnalysisRepository } from "../../domain/repositories";
import { AnalysisValidationService } from "../../domain/services";
import { Result, success, failure } from "../../shared/types/common";
import {
  BusinessRuleViolationError,
  EntityNotFoundError,
} from "../../shared/types/errors";

/**
 * Input for saving analysis updates
 */
export interface SaveAnalysisInput {
  analysisId: AnalysisId;
  userId: UserId;
  updates: {
    score?: Score;
    feedback?: string;
    category?: Category;
    suggestions?: string[];
  };
}

/**
 * Output from saving analysis
 */
export interface SaveAnalysisOutput {
  analysis: Analysis;
  updatedFields: string[];
  validationWarnings: string[];
}

/**
 * Use case for saving analysis updates
 * Handles updating existing analyses with new information
 */
export class SaveAnalysisUseCase {
  constructor(
    private readonly analysisRepository: IAnalysisRepository,
    private readonly validationService: AnalysisValidationService
  ) {}

  /**
   * Execute the save analysis process
   */
  async execute(
    input: SaveAnalysisInput
  ): Promise<Result<SaveAnalysisOutput, Error>> {
    try {
      // Step 1: Retrieve existing analysis
      const existingResult = await this.analysisRepository.findById(
        input.analysisId,
        input.userId
      );

      if (!existingResult.success) {
        return failure(existingResult.error);
      }

      if (!existingResult.data) {
        return failure(
          new EntityNotFoundError("Analysis", input.analysisId.value)
        );
      }

      const analysis = existingResult.data;

      // Step 2: Verify ownership
      if (!analysis.belongsToUser(input.userId)) {
        return failure(
          new BusinessRuleViolationError(
            "User does not have permission to update this analysis"
          )
        );
      }

      // Step 3: Check if analysis can be updated
      const canUpdateResult =
        this.validationService.canUpdateAnalysis(analysis);
      if (!canUpdateResult.canUpdate) {
        return failure(
          new BusinessRuleViolationError(
            canUpdateResult.reason || "Analysis cannot be updated"
          )
        );
      }

      // Step 4: Apply updates
      const updatedFields: string[] = [];

      if (input.updates.score !== undefined) {
        analysis.updateScore(input.updates.score);
        updatedFields.push("score");
      }

      if (input.updates.feedback !== undefined) {
        analysis.updateFeedback(input.updates.feedback);
        updatedFields.push("feedback");
      }

      if (input.updates.category !== undefined) {
        analysis.setCategory(input.updates.category);
        updatedFields.push("category");
      }

      if (input.updates.suggestions !== undefined) {
        // Clear existing suggestions and add new ones
        const currentSuggestions = [...analysis.suggestions];
        for (const suggestion of currentSuggestions) {
          try {
            analysis.removeSuggestion(suggestion);
          } catch {
            // Continue if suggestion can't be removed
          }
        }

        // Add new suggestions
        for (const suggestion of input.updates.suggestions) {
          try {
            analysis.addSuggestion(suggestion);
          } catch {
            // Continue if suggestion can't be added
          }
        }
        updatedFields.push("suggestions");
      }

      // Step 5: Validate updated analysis
      const validationResult =
        this.validationService.validateAnalysis(analysis);

      // Step 6: Save the updated analysis
      const saveResult = await this.analysisRepository.update(
        analysis,
        input.userId
      );

      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      // Step 7: Return result
      const output: SaveAnalysisOutput = {
        analysis: saveResult.data,
        updatedFields,
        validationWarnings: validationResult.warnings,
      };

      return success(output);
    } catch (error) {
      return failure(
        error instanceof Error ? error : new Error("Unknown error during save")
      );
    }
  }
}
