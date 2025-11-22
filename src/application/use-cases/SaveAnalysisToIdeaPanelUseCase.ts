import { Idea, Document, type DocumentContent } from "../../domain/entities";
import {
  IdeaId,
  UserId,
  IdeaSource,
  DocumentType,
  ProjectStatus,
} from "../../domain/value-objects";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IDocumentRepository } from "../../domain/repositories/IDocumentRepository";
import { Result, success, failure } from "../../shared/types/common";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Input for saving analysis to idea panel tables
 */
export interface SaveAnalysisToIdeaPanelInput {
  ideaText: string;
  userId: UserId;
  analysisContent?: DocumentContent; // The analysis result from AI (optional for frankenstein ideas)
  documentType?: "startup_analysis" | "hackathon_analysis"; // Optional - only needed if creating document
  source?: "manual" | "frankenstein"; // Default to 'manual'
  existingIdeaId?: string; // If provided, link to existing idea
  createDocument?: boolean; // Whether to create a document entry (default: true)
}

/**
 * Output from saving analysis to idea panel
 */
export interface SaveAnalysisToIdeaPanelOutput {
  idea: Idea;
  document?: Document; // Optional - only present if document was created
  isNewIdea: boolean;
}

/**
 * Use case for saving analysis results to the new ideas and documents tables
 * This enables the Idea Panel feature by creating the necessary data structure
 */
export class SaveAnalysisToIdeaPanelUseCase {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly documentRepository: IDocumentRepository
  ) {}

  /**
   * Execute the save operation
   * 1. Check if idea exists (by existingIdeaId or by matching idea text)
   * 2. If not, create new idea entry
   * 3. Create document entry linked to the idea
   */
  async execute(
    input: SaveAnalysisToIdeaPanelInput
  ): Promise<Result<SaveAnalysisToIdeaPanelOutput, Error>> {
    try {
      let idea: Idea | undefined;
      let isNewIdea = false;

      // Step 1: Check if we should link to an existing idea
      if (input.existingIdeaId) {
        const existingIdeaResult = await this.ideaRepository.findById(
          IdeaId.fromString(input.existingIdeaId),
          input.userId
        );

        if (!existingIdeaResult.success) {
          return failure(existingIdeaResult.error);
        }

        if (!existingIdeaResult.data) {
          logger.warn(
            LogCategory.BUSINESS,
            "Existing idea not found, creating new one",
            {
              existingIdeaId: input.existingIdeaId,
              userId: input.userId.value,
            }
          );
          // Fall through to create new idea
        } else {
          idea = existingIdeaResult.data;
          logger.info(
            LogCategory.BUSINESS,
            "Linking document to existing idea",
            {
              ideaId: idea.id.value,
              userId: input.userId.value,
            }
          );
        }
      }

      // Step 2: Create new idea if needed
      if (!idea) {
        const source =
          input.source === "frankenstein"
            ? IdeaSource.FRANKENSTEIN
            : IdeaSource.MANUAL;

        idea = Idea.create({
          userId: input.userId,
          ideaText: input.ideaText,
          source,
          projectStatus: ProjectStatus.IDEA,
          notes: "",
          tags: [],
        });

        const saveIdeaResult = await this.ideaRepository.save(idea);

        if (!saveIdeaResult.success) {
          logger.error(
            LogCategory.DATABASE,
            "Failed to save idea to ideas table",
            {
              userId: input.userId.value,
              error: saveIdeaResult.error.message,
            }
          );
          return failure(saveIdeaResult.error);
        }

        idea = saveIdeaResult.data;
        isNewIdea = true;

        logger.info(LogCategory.DATABASE, "Created new idea", {
          ideaId: idea.id.value,
          userId: input.userId.value,
          source: source.value,
        });
      }

      // Step 3: Create document entry (if requested)
      let document: Document | undefined;

      if (
        input.createDocument !== false &&
        input.documentType &&
        input.analysisContent
      ) {
        const documentType =
          input.documentType === "hackathon_analysis"
            ? DocumentType.HACKATHON_ANALYSIS
            : DocumentType.STARTUP_ANALYSIS;

        const normalizedContent = this.normalizeAnalysisContent(
          input.analysisContent,
          documentType
        );

        document = Document.create({
          ideaId: idea.id,
          userId: input.userId,
          documentType,
          title: "", // Can be set later if needed
          content: normalizedContent,
        });

        const saveDocumentResult = await this.documentRepository.save(document);

        if (!saveDocumentResult.success) {
          logger.error(
            LogCategory.DATABASE,
            "Failed to save document to documents table",
            {
              ideaId: idea.id.value,
              userId: input.userId.value,
              documentType: input.documentType,
              error: saveDocumentResult.error.message,
            }
          );
          return failure(saveDocumentResult.error);
        }

        document = saveDocumentResult.data;

        logger.info(LogCategory.DATABASE, "Created new document", {
          documentId: document.id.value,
          ideaId: idea.id.value,
          documentType: input.documentType,
        });
      } else {
        logger.info(
          LogCategory.DATABASE,
          "Skipped document creation (idea only)",
          {
            ideaId: idea.id.value,
            source: input.source,
          }
        );
      }

      const output: SaveAnalysisToIdeaPanelOutput = {
        idea,
        document,
        isNewIdea,
      };

      return success(output);
    } catch (error) {
      logger.error(
        LogCategory.BUSINESS,
        "Unexpected error saving analysis to idea panel",
        {
          userId: input.userId.value,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error saving analysis to idea panel")
      );
    }
  }

  /**
   * Normalize analysis content into the shape expected by Document invariants.
   * Handles cases where callers pass a Result-like object instead of the raw analysis payload.
   */
  private normalizeAnalysisContent(
    content: DocumentContent,
    documentType: DocumentType
  ): DocumentContent {
    // Unwrap Result objects of shape { success, data }
    if (
      content &&
      typeof content === "object" &&
      "success" in content &&
      "data" in content &&
      (content as { data?: unknown }).data
    ) {
      const unwrapped = (content as { data: unknown }).data;
      if (typeof unwrapped === "object" && unwrapped !== null) {
        return unwrapped as DocumentContent;
      }
    }

    // For hackathon analyses, accept nested analysis under "analysis" key
    if (
      documentType.isHackathonAnalysis() &&
      content &&
      typeof content === "object" &&
      "analysis" in content
    ) {
      const nested = (content as { analysis?: unknown }).analysis;
      if (nested && typeof nested === "object") {
        return nested as DocumentContent;
      }
    }

    return content;
  }
}
