import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { IDocumentRepository } from "../../domain/repositories/IDocumentRepository";
import { IdeaId, UserId } from "../../domain/value-objects";
import { Result } from "../../shared/types/common";
import {
  IdeaNotFoundError,
  UnauthorizedAccessError,
} from "../../shared/types/errors";

export interface DeleteIdeaCommand {
  ideaId: IdeaId;
  userId: UserId;
}

export interface DeleteIdeaResult {
  success: boolean;
}

/**
 * Use case for deleting an idea and all its associated documents
 * Ensures user owns the idea before deletion
 */
export class DeleteIdeaUseCase {
  constructor(
    private readonly ideaRepository: IIdeaRepository,
    private readonly documentRepository: IDocumentRepository
  ) {}

  async execute(
    command: DeleteIdeaCommand
  ): Promise<Result<DeleteIdeaResult, Error>> {
    try {
      // Verify idea exists and user owns it
      const ideaResult = await this.ideaRepository.findById(
        command.ideaId,
        command.userId
      );

      if (!ideaResult.success || !ideaResult.data) {
        return {
          success: false,
          error: new IdeaNotFoundError(command.ideaId.value),
        };
      }

      const idea = ideaResult.data;

      // Verify ownership
      if (!idea.belongsToUser(command.userId)) {
        return {
          success: false,
          error: new UnauthorizedAccessError(
            command.userId.value,
            command.ideaId.value
          ),
        };
      }

      // Delete all associated documents first
      const deleteDocsResult = await this.documentRepository.deleteAllByIdeaId(
        command.ideaId
      );

      if (!deleteDocsResult.success) {
        return {
          success: false,
          error: new Error(
            `Failed to delete associated documents: ${deleteDocsResult.error?.message}`
          ),
        };
      }

      // Delete the idea
      const deleteIdeaResult = await this.ideaRepository.delete(
        command.ideaId,
        command.userId
      );

      if (!deleteIdeaResult.success) {
        return {
          success: false,
          error: new Error(
            `Failed to delete idea: ${deleteIdeaResult.error?.message}`
          ),
        };
      }

      return {
        success: true,
        data: { success: true },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error : new Error("Failed to delete idea"),
      };
    }
  }
}
