import { Idea, Document } from "../../domain/entities";
import { IdeaId, UserId } from "../../domain/value-objects";
import {
  IIdeaRepository,
  IDocumentRepository,
} from "../../domain/repositories";
import { Result, success, failure } from "../../shared/types/common";
import {
  IdeaNotFoundError,
  UnauthorizedAccessError,
} from "../../shared/types/errors";

/**
 * Input for getting an idea with its documents
 */
export interface GetIdeaWithDocumentsInput {
  ideaId: IdeaId;
  userId: UserId;
}

/**
 * Output from getting an idea with its documents
 */
export interface GetIdeaWithDocumentsOutput {
  idea: Idea;
  documents: Document[];
}

/**
 * Use case for retrieving an idea with all its associated documents
 * Handles authorization checks to ensure user owns the idea
 */
export class GetIdeaWithDocumentsUseCase {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly documentRepository: IDocumentRepository
  ) {}

  /**
   * Execute the get idea with documents process
   */
  async execute(
    input: GetIdeaWithDocumentsInput
  ): Promise<Result<GetIdeaWithDocumentsOutput, Error>> {
    try {
      // Step 1: Load idea by id
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

      // Step 4: Return combined result
      const output: GetIdeaWithDocumentsOutput = {
        idea,
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
