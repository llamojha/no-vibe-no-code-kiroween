import { Document } from "../../domain/entities";
import {
  IdeaId,
  UserId,
  DocumentType,
  DocumentVersion,
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
 * Input for restoring a document version
 */
export interface RestoreDocumentVersionInput {
  documentId?: DocumentId;
  ideaId: IdeaId;
  userId: UserId;
  documentType: DocumentType;
  version: DocumentVersion;
}

/**
 * Output from restoring a document version
 */
export interface RestoreDocumentVersionOutput {
  document: Document;
}

/**
 * Use case for restoring a previous version of a document
 *
 * Flow:
 * 1. Load specified version
 * 2. Create new version with that content
 * 3. Save as latest version
 * 4. Return document
 *
 * Requirements: 12.4, 12.5
 */
export class RestoreDocumentVersionUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly ideaRepository: IIdeaRepository
  ) {}

  /**
   * Execute the restore document version process
   */
  async execute(
    input: RestoreDocumentVersionInput
  ): Promise<Result<RestoreDocumentVersionOutput, Error>> {
    logger.info(LogCategory.BUSINESS, "Starting document version restore", {
      ideaId: input.ideaId.value,
      documentType: input.documentType.value,
      version: input.version.value,
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

      // Step 3: Load all versions to find the specified version
      const versionsResult = await this.documentRepository.findAllVersions(
        input.ideaId,
        input.documentType
      );

      if (!versionsResult.success) {
        return failure(versionsResult.error);
      }

      const versions = versionsResult.data;

      if (
        input.documentId &&
        !versions.some((doc) => doc.id.equals(input.documentId!))
      ) {
        return failure(
          new DocumentNotFoundError(input.documentId.value)
        );
      }

      // Find the specific version to restore
      const versionToRestore = versions.find((doc) =>
        doc.version.equals(input.version)
      );

      if (!versionToRestore) {
        return failure(
          new DocumentNotFoundError(
            `${input.documentType.value} version ${input.version.value} for idea ${input.ideaId.value}`
          )
        );
      }

      logger.info(LogCategory.BUSINESS, "Found version to restore", {
        documentId: versionToRestore.id.value,
        version: versionToRestore.version.value,
      });

      // Step 4: Get the latest version to determine the next version number
      const latestVersionResult =
        await this.documentRepository.findLatestVersion(
          input.ideaId,
          input.documentType
        );

      if (!latestVersionResult.success) {
        return failure(latestVersionResult.error);
      }

      if (!latestVersionResult.data) {
        return failure(
          new DocumentNotFoundError(
            `Latest version of ${input.documentType.value} for idea ${input.ideaId.value}`
          )
        );
      }

      const latestVersion = latestVersionResult.data;

      // Step 5: Create new version with the content from the version to restore
      const restoredDocument = latestVersion.updateContent(
        versionToRestore.content
      );

      logger.info(LogCategory.BUSINESS, "Created restored document version", {
        restoredFromVersion: versionToRestore.version.value,
        newVersion: restoredDocument.version.value,
        newDocumentId: restoredDocument.id.value,
      });

      // Step 6: Save as latest version
      const saveResult = await this.documentRepository.save(restoredDocument);

      if (!saveResult.success) {
        logger.error(LogCategory.DATABASE, "Failed to save restored document", {
          error: saveResult.error.message,
        });
        return failure(saveResult.error);
      }

      logger.info(
        LogCategory.BUSINESS,
        "Document version restored successfully",
        {
          documentId: restoredDocument.id.value,
          version: restoredDocument.version.value,
          restoredFromVersion: versionToRestore.version.value,
        }
      );

      return success({
        document: saveResult.data,
      });
    } catch (error) {
      logger.error(LogCategory.BUSINESS, "Error restoring document version", {
        error: error instanceof Error ? error.message : "Unknown error",
        ideaId: input.ideaId.value,
        documentType: input.documentType.value,
        version: input.version.value,
      });

      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error during version restore")
      );
    }
  }
}
