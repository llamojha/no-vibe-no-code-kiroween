import { Document } from "../../domain/entities";
import { DocumentId, UserId } from "../../domain/value-objects";
import { IDocumentRepository } from "../../domain/repositories";
import { Result, success, failure } from "../../shared/types/common";
import {
  DocumentNotFoundError,
  UnauthorizedAccessError,
} from "../../shared/types/errors";

export interface GetDocumentByIdInput {
  documentId: DocumentId;
  userId: UserId;
}

export interface GetDocumentByIdOutput {
  document: Document;
}

/**
 * Use case for retrieving a single document by ID with ownership validation
 */
export class GetDocumentByIdUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(
    input: GetDocumentByIdInput
  ): Promise<Result<GetDocumentByIdOutput, Error>> {
    try {
      const result = await this.documentRepository.findById(
        input.documentId,
        input.userId
      );

      if (!result.success) {
        return failure(result.error);
      }

      const document = result.data;

      if (!document) {
        return failure(new DocumentNotFoundError(input.documentId.value));
      }

      if (!document.belongsToUser(input.userId)) {
        return failure(
          new UnauthorizedAccessError(
            input.userId.value,
            input.documentId.value
          )
        );
      }

      return success({ document });
    } catch (error) {
      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error retrieving document")
      );
    }
  }
}
