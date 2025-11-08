// Analysis entity is used in type definitions
import { AnalysisId, UserId } from '../../domain/value-objects';
import { IAnalysisRepository } from '../../domain/repositories';
import { AnalysisValidationService } from '../../domain/services';
import { Result, success, failure } from '../../shared/types/common';
import { EntityNotFoundError, BusinessRuleViolationError } from '../../shared/types/errors';

/**
 * Input for deleting an analysis
 */
export interface DeleteAnalysisInput {
  analysisId: AnalysisId;
  userId: UserId;
  confirmDeletion?: boolean;
  reason?: string;
}

/**
 * Output from deleting an analysis
 */
export interface DeleteAnalysisOutput {
  success: boolean;
  deletedAnalysis: {
    id: string;
    idea: string;
    score: number;
    createdAt: Date;
  };
  warnings: string[];
}

/**
 * Use case for deleting analyses
 * Handles validation, access control, and safe deletion
 */
export class DeleteAnalysisUseCase {
  constructor(
    private readonly analysisRepository: IAnalysisRepository,
    private readonly validationService: AnalysisValidationService
  ) {}

  /**
   * Execute the delete analysis process
   */
  async execute(input: DeleteAnalysisInput): Promise<Result<DeleteAnalysisOutput, Error>> {
    try {
      // Step 1: Retrieve the analysis
      const analysisResult = await this.analysisRepository.findById(input.analysisId);
      
      if (!analysisResult.success) {
        return failure(analysisResult.error);
      }

      if (!analysisResult.data) {
        return failure(new EntityNotFoundError('Analysis', input.analysisId.value));
      }

      const analysis = analysisResult.data;

      // Step 2: Verify ownership
      if (!analysis.belongsToUser(input.userId)) {
        return failure(new BusinessRuleViolationError(
          'User does not have permission to delete this analysis'
        ));
      }

      // Step 3: Check if analysis can be safely deleted
      const canDelete = this.validationService.canDeleteAnalysis(analysis);
      const warnings: string[] = [];

      if (!canDelete) {
        // Check if user confirmed deletion despite warnings
        if (!input.confirmDeletion) {
          warnings.push('This is a high-quality or recent analysis that may be valuable to keep');
          warnings.push('If you still want to delete it, please confirm the deletion');
          
          return failure(new BusinessRuleViolationError(
            'Analysis deletion requires confirmation due to its value. ' +
            'Set confirmDeletion to true to proceed.'
          ));
        } else {
          warnings.push('Deleted a high-value analysis as requested');
        }
      }

      // Step 4: Additional validation for high-value analyses
      if (analysis.isHighQuality() && analysis.isCompleted()) {
        if (!input.reason) {
          return failure(new BusinessRuleViolationError(
            'A reason is required when deleting high-quality completed analyses'
          ));
        }
        warnings.push(`High-quality analysis deleted. Reason: ${input.reason}`);
      }

      // Step 5: Create deletion record for audit
      const deletionRecord = {
        id: analysis.id.value,
        idea: analysis.idea.substring(0, 100) + (analysis.idea.length > 100 ? '...' : ''),
        score: analysis.score.value,
        createdAt: analysis.createdAt
      };

      // Step 6: Perform the deletion
      const deleteResult = await this.analysisRepository.delete(input.analysisId);
      
      if (!deleteResult.success) {
        return failure(deleteResult.error);
      }

      // Step 7: Return success result
      const output: DeleteAnalysisOutput = {
        success: true,
        deletedAnalysis: deletionRecord,
        warnings
      };

      return success(output);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error during deletion'));
    }
  }

  /**
   * Get deletion warnings for an analysis
   */
  async getDeletionWarnings(analysisId: AnalysisId, userId: UserId): Promise<Result<string[], Error>> {
    try {
      const analysisResult = await this.analysisRepository.findById(analysisId);
      
      if (!analysisResult.success) {
        return failure(analysisResult.error);
      }

      if (!analysisResult.data) {
        return failure(new EntityNotFoundError('Analysis', analysisId.value));
      }

      const analysis = analysisResult.data;

      if (!analysis.belongsToUser(userId)) {
        return failure(new BusinessRuleViolationError(
          'User does not have permission to view this analysis'
        ));
      }

      const warnings: string[] = [];

      if (analysis.isHighQuality()) {
        warnings.push('This is a high-quality analysis (score ≥ 80)');
      }

      if (analysis.isCompleted()) {
        warnings.push('This analysis has detailed feedback and suggestions');
      }

      if (analysis.isRecent()) {
        warnings.push('This analysis was created recently (within 24 hours)');
      }

      if (analysis.suggestions.length > 3) {
        warnings.push('This analysis contains valuable improvement suggestions');
      }

      if (warnings.length === 0) {
        warnings.push('This analysis can be safely deleted');
      }

      return success(warnings);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error getting warnings'));
    }
  }
}