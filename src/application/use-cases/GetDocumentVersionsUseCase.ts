import { Document } from "../../domain/entities";
import {
  IdeaId,
  UserId,
  DocumentType,
  DocumentId,
} from "../../domain/value-objects";
import {
  IDocumentRepository,
  IIdeaRepository,
} from "../../domain/repositories";
import { Result, success, failure } from "../../shared/types/common";
import {
  IdeaNotFoundError,
  UnauthorizedAccessError,
  DocumentNotFoundError,
} from "../../shared/types/errors";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Input for getting document versions
 */
export interface GetDocumentVersionsInput {
  documentId?: DocumentId;
  ideaId: IdeaId;
  userId: UserId;
  documentType: DocumentType;
}

/**
 * Output from getting document versions
 */
export interface GetDocumentVersionsOutput {
  versions: Document[];
}

/**
 * Use case for retrieving all versions of a document
 *
 * Flow:
 * 1. Load all versions for document
 * 2. Sort by version descending (newest first)
 * 3. Return versions
 *
 * Requirements: 12.1, 12.2, 12.3
 */
export class GetDocumentVersionsUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly ideaRepository: IIdeaRepository
  ) {}

  /**
   * Execute the get document versions process
   */
  async execute(
    input: GetDocumentVersionsInput
  ): Promise<Result<GetDocumentVersionsOutput, Error>> {
    logger.info(LogCategory.BUSINESS, "Getting document versions", {
      ideaId: input.ideaId.value,
      documentType: input.documentType.value,
      userId: input.userId.value,
    });

    try {
      // Step 1: Verify the idea exists and user owns it
      const ideaResult = await this.ideaRepository.findById(
        input.ideaId,
        input.userId
      );

      if (!ideaResult.success) {
        return failure(ideaResult.error);
      }

      if (!ideaResult.data) {
        return failure(new IdeaNotFoundError(input.ideaId.value));
      }

      const idea = ideaResult.data;

      // Step 2: Verify user owns the idea (authorization check)
      if (!idea.belongsToUser(input.userId)) {
        return failure(
          new UnauthorizedAccessError(input.userId.value, input.ideaId.value)
        );
      }

      // Step 3: Load all versions for the document
      const versionsResult = await this.documentRepository.findAllVersions(
        input.ideaId,
        input.documentType
      );

      if (!versionsResult.success) {
        return failure(versionsResult.error);
      }

      // Versions are already sorted by version DESC in the repository
      const versions = versionsResult.data;

      if (
        input.documentId &&
        !versions.some((doc) => doc.id.equals(input.documentId!))
      ) {
        return failure(
          new DocumentNotFoundError(input.documentId.value)
        );
      }

      logger.info(LogCategory.BUSINESS, "Retrieved document versions", {
        ideaId: input.ideaId.value,
        documentType: input.documentType.value,
        versionCount: versions.length,
      });

      return success({
        versions,
      });
    } catch (error) {
      logger.error(LogCategory.BUSINESS, "Error getting document versions", {
        error: error instanceof Error ? error.message : "Unknown error",
        ideaId: input.ideaId.value,
        documentType: input.documentType.value,
      });

      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error during version retrieval")
      );
    }
  }
}
