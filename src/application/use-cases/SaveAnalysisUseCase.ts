import { Analysis, Document } from "../../domain/entities";
import {
  AnalysisId,
  UserId,
  Score,
  Category,
  DocumentId,
  Locale,
} from "../../domain/value-objects";
import {
  IAnalysisRepository,
  IDocumentRepository,
} from "../../domain/repositories";
import { AnalysisValidationService } from "../../domain/services";
import { Result, success, failure } from "../../shared/types/common";
import {
  BusinessRuleViolationError,
  EntityNotFoundError,
} from "../../shared/types/errors";
import { logger, LogCategory } from "@/lib/logger";

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
 * Supports both new documents table and legacy saved_analyses table
 */
export class SaveAnalysisUseCase {
  constructor(
    private readonly analysisRepository: IAnalysisRepository,
    private readonly validationService: AnalysisValidationService,
    private readonly documentRepository?: IDocumentRepository
  ) {}

  /**
   * Execute the save analysis process
   * Tries documents table first, then falls back to saved_analyses for legacy data
   */
  async execute(
    input: SaveAnalysisInput
  ): Promise<Result<SaveAnalysisOutput, Error>> {
    try {
      // Step 1: Try to find in documents table first (new data)
      let analysis: Analysis | null = null;
      let isLegacyData = false;

      if (this.documentRepository) {
        try {
          const documentId = DocumentId.fromString(input.analysisId.value);
          const documentResult = await this.documentRepository.findById(
            documentId,
            input.userId
          );

          if (documentResult.success && documentResult.data) {
            const document = documentResult.data;

            logger.info(
              LogCategory.BUSINESS,
              "Found analysis in documents table",
              {
                analysisId: input.analysisId.value,
                userId: input.userId.value,
              }
            );

            // Extract analysis from document content
            const content = document.getContent();
            const analysisData = (content.analysis || content) as Record<
              string,
              unknown
            >;

            // Reconstruct Analysis entity from document content
            analysis = Analysis.reconstruct({
              id: AnalysisId.fromString(document.id.value),
              idea:
                typeof analysisData.idea === "string" ? analysisData.idea : "",
              userId: document.userId,
              score: Score.create(
                typeof analysisData.score === "number" ? analysisData.score : 0
              ),
              locale:
                typeof analysisData.locale === "string"
                  ? Locale.fromString(analysisData.locale)
                  : Locale.english(),
              feedback:
                typeof analysisData.feedback === "string"
                  ? analysisData.feedback
                  : "",
              suggestions: Array.isArray(analysisData.suggestions)
                ? analysisData.suggestions
                : [],
              category:
                typeof analysisData.category === "string"
                  ? Category.createGeneral(analysisData.category)
                  : Category.createGeneral("general"),
              createdAt: document.createdAt,
              updatedAt: document.updatedAt,
            });

            isLegacyData = false; // This is new data in documents table
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
      if (!analysis) {
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

        analysis = existingResult.data;
        isLegacyData = true;

        logger.info(
          LogCategory.BUSINESS,
          "Found analysis in saved_analyses table (legacy)",
          {
            analysisId: input.analysisId.value,
            userId: input.userId.value,
          }
        );
      }

      // Step 3: Verify ownership
      if (!analysis.belongsToUser(input.userId)) {
        return failure(
          new BusinessRuleViolationError(
            "User does not have permission to update this analysis"
          )
        );
      }

      // Step 4: Check if analysis can be updated
      const canUpdateResult =
        this.validationService.canUpdateAnalysis(analysis);
      if (!canUpdateResult.canUpdate) {
        return failure(
          new BusinessRuleViolationError(
            canUpdateResult.reason || "Analysis cannot be updated"
          )
        );
      }

      // Step 5: Apply updates
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

      // Step 6: Validate updated analysis
      const validationResult =
        this.validationService.validateAnalysis(analysis);

      // Step 7: Save the updated analysis (to the appropriate table)
      let saveResult;

      if (isLegacyData) {
        // Update in saved_analyses table for legacy data
        logger.info(
          LogCategory.BUSINESS,
          "Updating analysis in saved_analyses table (legacy)",
          {
            analysisId: input.analysisId.value,
          }
        );
        saveResult = await this.analysisRepository.update(
          analysis,
          input.userId
        );
      } else {
        // Update in documents table for new data
        logger.info(
          LogCategory.BUSINESS,
          "Updating analysis in documents table",
          {
            analysisId: input.analysisId.value,
          }
        );

        if (!this.documentRepository) {
          return failure(
            new Error("Document repository not available for document updates")
          );
        }

        // Get the existing document
        const documentId = DocumentId.fromString(input.analysisId.value);
        const existingDocResult = await this.documentRepository.findById(
          documentId,
          input.userId
        );

        if (!existingDocResult.success || !existingDocResult.data) {
          return failure(
            new EntityNotFoundError("Document", input.analysisId.value)
          );
        }

        const existingDoc = existingDocResult.data;
        const existingContent = existingDoc.getContent();

        // Update the analysis data within the document content
        const updatedContent = {
          ...existingContent,
          analysis: {
            ...(existingContent.analysis || existingContent),
            score: analysis.score.value,
            feedback: analysis.feedback,
            suggestions: analysis.suggestions,
            ...(analysis.category ? { category: analysis.category.value } : {}),
          },
        };

        // Create updated document with new content
        const updatedDocument = Document.reconstruct({
          id: existingDoc.id,
          ideaId: existingDoc.ideaId,
          userId: existingDoc.userId,
          documentType: existingDoc.documentType,
          title: existingDoc.title,
          content: updatedContent,
          version: existingDoc.version, // Preserve existing version
          createdAt: existingDoc.createdAt,
          updatedAt: new Date(), // Update timestamp
        });

        // Update the document in place to avoid a window where the analysis is deleted
        // before the updated version is persisted. The repository exposes an `update`
        // method, which keeps the row intact and will return failure without data loss.
        saveResult = await this.documentRepository.update(updatedDocument);
      }

      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      // Step 8: Return result
      const output: SaveAnalysisOutput = {
        analysis,
        updatedFields,
        validationWarnings: validationResult.warnings,
      };

      return success(output);
    } catch (error) {
      logger.error(LogCategory.BUSINESS, "Error in SaveAnalysisUseCase", {
        error: error instanceof Error ? error.message : String(error),
      });
      return failure(
        error instanceof Error ? error : new Error("Unknown error during save")
      );
    }
  }
}
