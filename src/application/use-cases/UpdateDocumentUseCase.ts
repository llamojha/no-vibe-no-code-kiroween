import { Document, DocumentContent } from "../../domain/entities/Document";
import {
  UserId,
  IdeaId,
  DocumentType,
  DocumentId,
} from "../../domain/value-objects";
import { IDocumentRepository } from "../../domain/repositories";
import { Result, success, failure } from "../../shared/types/common";
import {
  DocumentNotFoundError,
  UnauthorizedAccessError,
} from "../../shared/types/errors";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Input for updating a document
 */
export interface UpdateDocumentInput {
  documentId?: DocumentId;
  ideaId: IdeaId;
  documentType: DocumentType;
  userId: UserId;
  content: DocumentContent;
}

/**
 * Output from updating a document
 */
export interface UpdateDocumentOutput {
  document: Document;
}

/**
 * Use case for updating a document's content
 *
 * Flow:
 * 1. Load current document (latest version by idea_id + document_type)
 * 2. Call document.updateContent() to create NEW document entity with NEW UUID and incremented version
 * 3. Save new document as a NEW ROW in database (old version preserved as separate row)
 * 4. Return new document with new ID and incremented version number
 *
 * Requirements: 11.2, 11.3, 11.4, 11.5
 */
export class UpdateDocumentUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  /**
   * Execute the document update process
   */
  async execute(
    input: UpdateDocumentInput
  ): Promise<Result<UpdateDocumentOutput, Error>> {
    logger.info(LogCategory.BUSINESS, "Starting document update", {
      ideaId: input.ideaId.value,
      documentType: input.documentType.value,
      userId: input.userId.value,
    });

    try {
      // Step 1: Load current document (latest version)
      const documentResult = await this.documentRepository.findLatestVersion(
        input.ideaId,
        input.documentType
      );

      if (!documentResult.success) {
        return failure(documentResult.error);
      }

      if (!documentResult.data) {
        return failure(
          new DocumentNotFoundError(
            `${input.documentType.value} for idea ${input.ideaId.value}`
          )
        );
      }

      const currentDocument = documentResult.data;

      if (
        input.documentId &&
        !currentDocument.id.equals(input.documentId)
      ) {
        return failure(
          new DocumentNotFoundError(input.documentId.value)
        );
      }

      // Step 2: Verify user owns the document
      if (!currentDocument.belongsToUser(input.userId)) {
        return failure(
          new UnauthorizedAccessError(
            input.userId.value,
            currentDocument.id.value
          )
        );
      }

      logger.info(LogCategory.BUSINESS, "Loaded current document version", {
        documentId: currentDocument.id.value,
        currentVersion: currentDocument.version.value,
      });

      // Step 3: Create new version with updated content
      // This creates a NEW document entity with a NEW UUID and incremented version
      const updatedDocument = currentDocument.updateContent(input.content);

      logger.info(LogCategory.BUSINESS, "Created new document version", {
        oldDocumentId: currentDocument.id.value,
        oldVersion: currentDocument.version.value,
        newDocumentId: updatedDocument.id.value,
        newVersion: updatedDocument.version.value,
      });

      // Step 4: Save new version as a NEW ROW in database
      const saveResult = await this.documentRepository.save(updatedDocument);

      if (!saveResult.success) {
        logger.error(LogCategory.DATABASE, "Failed to save updated document", {
          error: saveResult.error.message,
        });
        return failure(saveResult.error);
      }

      logger.info(LogCategory.BUSINESS, "Document updated successfully", {
        documentId: updatedDocument.id.value,
        version: updatedDocument.version.value,
        ideaId: input.ideaId.value,
        documentType: input.documentType.value,
      });

      return success({
        document: saveResult.data,
      });
    } catch (error) {
      logger.error(LogCategory.BUSINESS, "Error updating document", {
        error: error instanceof Error ? error.message : "Unknown error",
        ideaId: input.ideaId.value,
        documentType: input.documentType.value,
      });

      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error during document update")
      );
    }
  }
}
