// Analysis entity is used in type definitions
import { AnalysisId, UserId, DocumentId } from "../../domain/value-objects";
import {
  IAnalysisRepository,
  IDocumentRepository,
} from "../../domain/repositories";
import { AnalysisValidationService } from "../../domain/services";
import { Result, success, failure } from "../../shared/types/common";
import {
  EntityNotFoundError,
  BusinessRuleViolationError,
} from "../../shared/types/errors";
import { logger, LogCategory } from "@/lib/logger";

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
 * Supports both new documents table and legacy saved_analyses table
 */
export class DeleteAnalysisUseCase {
  constructor(
    private readonly analysisRepository: IAnalysisRepository,
    private readonly validationService: AnalysisValidationService,
    private readonly documentRepository?: IDocumentRepository
  ) {}

  /**
   * Execute the delete analysis process
   * Tries documents table first, then falls back to saved_analyses for legacy data
   */
  async execute(
    input: DeleteAnalysisInput
  ): Promise<Result<DeleteAnalysisOutput, Error>> {
    try {
      // Step 1: Try to find and delete from documents table first (new data)
      let analysis: any | null = null;
      let isLegacyData = false;
      let deletedFromDocuments = false;

      if (this.documentRepository) {
        try {
          const documentId = DocumentId.fromString(input.analysisId.value);
          const documentResult = await this.documentRepository.findById(
            documentId,
            input.userId
          );

          if (documentResult.success && documentResult.data) {
            logger.info(
              LogCategory.BUSINESS,
              "Found analysis in documents table, attempting delete",
              {
                analysisId: input.analysisId.value,
                userId: input.userId.value,
              }
            );

            // Delete from documents table
            const deleteResult = await this.documentRepository.delete(
              documentId,
              input.userId
            );

            if (deleteResult.success) {
              deletedFromDocuments = true;
              logger.info(
                LogCategory.BUSINESS,
                "Successfully deleted analysis from documents table",
                {
                  analysisId: input.analysisId.value,
                }
              );

              // Return success without further validation since document was deleted
              const output: DeleteAnalysisOutput = {
                success: true,
                deletedAnalysis: {
                  id: input.analysisId.value,
                  idea: "Document deleted",
                  score: 0,
                  createdAt: new Date(),
                },
                warnings: [],
              };
              return success(output);
            }

            // Explicitly propagate errors coming from the document delete operation so the
            // legacy path is not taken and callers receive the real failure.
            return failure(deleteResult.error);
          }
        } catch (error) {
          logger.debug(
            LogCategory.BUSINESS,
            "Analysis not found in documents table, trying legacy",
            {
              analysisId: input.analysisId.value,
              error: error instanceof Error ? error.message : String(error),
            }
          );
        }
      }

      // Step 2: Fallback to saved_analyses table (legacy data)
      if (!deletedFromDocuments) {
        const analysisResult = await this.analysisRepository.findById(
          input.analysisId,
          input.userId
        );

        if (!analysisResult.success) {
          return failure(analysisResult.error);
        }

        if (!analysisResult.data) {
          return failure(
            new EntityNotFoundError("Analysis", input.analysisId.value)
          );
        }

        analysis = analysisResult.data;
        isLegacyData = true;

        logger.info(
          LogCategory.BUSINESS,
          "Found analysis in saved_analyses table (legacy), proceeding with delete",
          {
            analysisId: input.analysisId.value,
            userId: input.userId.value,
          }
        );
      }

      // Only proceed with validation if we have legacy data
      if (isLegacyData && analysis) {
        // Step 3: Verify ownership
        if (!analysis.belongsToUser(input.userId)) {
          return failure(
            new BusinessRuleViolationError(
              "User does not have permission to delete this analysis"
            )
          );
        }

        // Step 4: Check if analysis can be safely deleted
        const canDelete = this.validationService.canDeleteAnalysis(analysis);
        const warnings: string[] = [];

        if (!canDelete) {
          // Check if user confirmed deletion despite warnings
          if (!input.confirmDeletion) {
            warnings.push(
              "This is a high-quality or recent analysis that may be valuable to keep"
            );
            warnings.push(
              "If you still want to delete it, please confirm the deletion"
            );

            return failure(
              new BusinessRuleViolationError(
                "Analysis deletion requires confirmation due to its value. " +
                  "Set confirmDeletion to true to proceed."
              )
            );
          } else {
            warnings.push("Deleted a high-value analysis as requested");
          }
        }

        // Step 5: Additional validation for high-value analyses
        if (analysis.isHighQuality() && analysis.isCompleted()) {
          if (!input.reason) {
            return failure(
              new BusinessRuleViolationError(
                "A reason is required when deleting high-quality completed analyses"
              )
            );
          }
          warnings.push(
            `High-quality analysis deleted. Reason: ${input.reason}`
          );
        }

        // Step 6: Create deletion record for audit
        const deletionRecord = {
          id: analysis.id.value,
          idea:
            analysis.idea.substring(0, 100) +
            (analysis.idea.length > 100 ? "..." : ""),
          score: analysis.score.value,
          createdAt: analysis.createdAt,
        };

        // Step 7: Perform the deletion from saved_analyses
        logger.info(
          LogCategory.BUSINESS,
          "Deleting analysis from saved_analyses table (legacy)",
          {
            analysisId: input.analysisId.value,
          }
        );

        const deleteResult = await this.analysisRepository.delete(
          input.analysisId,
          input.userId
        );

        if (!deleteResult.success) {
          return failure(deleteResult.error);
        }

        // Step 8: Return success result
        const output: DeleteAnalysisOutput = {
          success: true,
          deletedAnalysis: deletionRecord,
          warnings,
        };

        return success(output);
      }

      // Should not reach here, but return error if we do
      return failure(
        new EntityNotFoundError("Analysis", input.analysisId.value)
      );
    } catch (error) {
      logger.error(LogCategory.BUSINESS, "Error in DeleteAnalysisUseCase", {
        error: error instanceof Error ? error.message : String(error),
      });
      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error during deletion")
      );
    }
  }

  /**
   * Get deletion warnings for an analysis
   */
  async getDeletionWarnings(
    analysisId: AnalysisId,
    userId: UserId
  ): Promise<Result<string[], Error>> {
    try {
      const analysisResult = await this.analysisRepository.findById(
        analysisId,
        userId
      );

      if (!analysisResult.success) {
        return failure(analysisResult.error);
      }

      if (!analysisResult.data) {
        return failure(new EntityNotFoundError("Analysis", analysisId.value));
      }

      const analysis = analysisResult.data;

      if (!analysis.belongsToUser(userId)) {
        return failure(
          new BusinessRuleViolationError(
            "User does not have permission to view this analysis"
          )
        );
      }

      const warnings: string[] = [];

      if (analysis.isHighQuality()) {
        warnings.push("This is a high-quality analysis (score ≥ 80)");
      }

      if (analysis.isCompleted()) {
        warnings.push("This analysis has detailed feedback and suggestions");
      }

      if (analysis.isRecent()) {
        warnings.push("This analysis was created recently (within 24 hours)");
      }

      if (analysis.suggestions.length > 3) {
        warnings.push(
          "This analysis contains valuable improvement suggestions"
        );
      }

      if (warnings.length === 0) {
        warnings.push("This analysis can be safely deleted");
      }

      return success(warnings);
    } catch (error) {
      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error getting warnings")
      );
    }
  }
}
