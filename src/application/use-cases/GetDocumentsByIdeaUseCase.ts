import { Document } from "../../domain/entities";
import { IdeaId, UserId } from "../../domain/value-objects";
import {
  IDocumentRepository,
  IIdeaRepository,
} from "../../domain/repositories";
import { Result, success, failure } from "../../shared/types/common";
import {
  IdeaNotFoundError,
  UnauthorizedAccessError,
} from "../../shared/types/errors";

/**
 * Input for getting documents by idea
 */
export interface GetDocumentsByIdeaInput {
  ideaId: IdeaId;
  userId: UserId;
}

/**
 * Output from getting documents by idea
 */
export interface GetDocumentsByIdeaOutput {
  documents: Document[];
}

/**
 * Use case for retrieving all documents for a specific idea
 * Handles authorization checks to ensure user owns the idea
 */
export class GetDocumentsByIdeaUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly ideaRepository: IIdeaRepository
  ) {}

  /**
   * Execute the get documents by idea process
   */
  async execute(
    input: GetDocumentsByIdeaInput
  ): Promise<Result<GetDocumentsByIdeaOutput, Error>> {
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

      // Step 3: Load all documents for idea
      const documentsResult = await this.documentRepository.findByIdeaId(
        input.ideaId
      );

      if (!documentsResult.success) {
        return failure(documentsResult.error);
      }

      const documents = documentsResult.data;

      // Step 4: Return result
      const output: GetDocumentsByIdeaOutput = {
        documents,
      };

      return success(output);
    } catch (error) {
      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error during retrieval")
      );
    }
  }
}
