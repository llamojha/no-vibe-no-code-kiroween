import { Idea } from "../../domain/entities";
import { IdeaId, UserId, ProjectStatus } from "../../domain/value-objects";
import { IIdeaRepository } from "../../domain/repositories";
import { Result, success, failure } from "../../shared/types/common";
import {
  IdeaNotFoundError,
  UnauthorizedAccessError,
  InvalidProjectStatusError,
} from "../../shared/types/errors";

/**
 * Input for updating idea status
 */
export interface UpdateIdeaStatusInput {
  ideaId: IdeaId;
  userId: UserId;
  newStatus: ProjectStatus;
}

/**
 * Output from updating idea status
 */
export interface UpdateIdeaStatusOutput {
  idea: Idea;
}

/**
 * Use case for updating the project status of an idea
 * Validates status transitions according to business rules
 */
export class UpdateIdeaStatusUseCase {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  /**
   * Execute the update idea status process
   */
  async execute(
    input: UpdateIdeaStatusInput
  ): Promise<Result<UpdateIdeaStatusOutput, Error>> {
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

      // Step 3: Validate new status (ProjectStatus value object handles validation)
      if (!input.newStatus) {
        return failure(
          new InvalidProjectStatusError("Status cannot be null or undefined")
        );
      }

      // Step 4: Update idea status using domain method
      // This will validate the status transition according to business rules
      try {
        idea.updateStatus(input.newStatus);
      } catch (error) {
        if (error instanceof Error) {
          return failure(new InvalidProjectStatusError(error.message));
        }
        return failure(
          new InvalidProjectStatusError("Failed to update status")
        );
      }

      // Step 5: Persist changes (updated_at handled by database trigger)
      const updateResult = await this.ideaRepository.update(idea, input.userId);

      if (!updateResult.success) {
        return failure(updateResult.error);
      }

      // Step 6: Return updated idea
      const output: UpdateIdeaStatusOutput = {
        idea: updateResult.data,
      };

      return success(output);
    } catch (error) {
      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error during status update")
      );
    }
  }
}
