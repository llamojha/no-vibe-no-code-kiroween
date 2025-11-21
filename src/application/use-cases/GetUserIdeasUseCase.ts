import { Idea, Document } from "../../domain/entities";
import { UserId, IdeaId } from "../../domain/value-objects";
import {
  IIdeaRepository,
  IDocumentRepository,
} from "../../domain/repositories";
import { Result, success, failure } from "../../shared/types/common";

/**
 * Input for getting user ideas
 */
export interface GetUserIdeasInput {
  userId: UserId;
}

/**
 * Output item containing idea with document count
 */
export interface IdeaWithDocumentCount {
  idea: Idea;
  documentCount: number;
  documents: Document[];
}

/**
 * Output from getting user ideas
 */
export interface GetUserIdeasOutput {
  ideas: IdeaWithDocumentCount[];
}

/**
 * Use case for retrieving all ideas for a user with document counts
 * Returns ideas ordered by updated_at DESC
 */
export class GetUserIdeasUseCase {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly documentRepository: IDocumentRepository
  ) {}

  /**
   * Execute the get user ideas process
   */
  async execute(
    input: GetUserIdeasInput
  ): Promise<Result<GetUserIdeasOutput, Error>> {
    try {
      // Step 1: Load all ideas for user
      const ideasResult = await this.ideaRepository.findAllByUserId(
        input.userId
      );

      if (!ideasResult.success) {
        return failure(ideasResult.error);
      }

      const ideas = ideasResult.data;

      // Step 2: Load document counts for each idea
      // We'll load all documents for the user and group by idea
      const documentsResult = await this.documentRepository.findByUserId(
        input.userId
      );

      if (!documentsResult.success) {
        return failure(documentsResult.error);
      }

      const allDocuments = documentsResult.data;

      // Step 3: Group documents by idea ID
      const documentsByIdeaId = new Map<string, Document[]>();
      for (const document of allDocuments) {
        const ideaIdValue = document.ideaId.value;
        if (!documentsByIdeaId.has(ideaIdValue)) {
          documentsByIdeaId.set(ideaIdValue, []);
        }
        documentsByIdeaId.get(ideaIdValue)!.push(document);
      }

      // Step 4: Combine ideas with their document counts
      const ideasWithDocumentCounts: IdeaWithDocumentCount[] = ideas.map(
        (idea) => {
          const documents = documentsByIdeaId.get(idea.id.value) || [];
          return {
            idea,
            documentCount: documents.length,
            documents,
          };
        }
      );

      // Step 5: Return result
      const output: GetUserIdeasOutput = {
        ideas: ideasWithDocumentCounts,
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
