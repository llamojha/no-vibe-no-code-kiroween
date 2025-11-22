import { Idea } from "../../domain/entities";
import { IdeaId, UserId } from "../../domain/value-objects";
import { IIdeaRepository } from "../../domain/repositories";
import { Result, success, failure } from "../../shared/types/common";
import {
  IdeaNotFoundError,
  UnauthorizedAccessError,
  BusinessRuleViolationError,
} from "../../shared/types/errors";

/**
 * Input for saving idea metadata
 */
export interface SaveIdeaMetadataInput {
  ideaId: IdeaId;
  userId: UserId;
  notes?: string;
  tags?: string[];
}

/**
 * Output from saving idea metadata
 */
export interface SaveIdeaMetadataOutput {
  idea: Idea;
}

/**
 * Use case for saving idea metadata (notes and tags)
 * Handles updating notes and managing tags (add/remove)
 */
export class SaveIdeaMetadataUseCase {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  /**
   * Execute the save idea metadata process
   */
  async execute(
    input: SaveIdeaMetadataInput
  ): Promise<Result<SaveIdeaMetadataOutput, Error>> {
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

      // Step 3: Update notes using domain method (if provided)
      if (input.notes !== undefined) {
        try {
          idea.updateNotes(input.notes);
        } catch (error) {
          if (error instanceof Error) {
            return failure(new BusinessRuleViolationError(error.message));
          }
          return failure(
            new BusinessRuleViolationError("Failed to update notes")
          );
        }
      }

      // Step 4: Update tags using domain methods (addTag/removeTag if provided)
      if (input.tags !== undefined) {
        try {
          // Get current tags
          const currentTags = idea.getTags();

          // Determine which tags to add and which to remove
          const tagsToAdd = input.tags.filter(
            (tag) => !currentTags.includes(tag)
          );
          const tagsToRemove = currentTags.filter(
            (tag) => !input.tags!.includes(tag)
          );

          // Remove tags that are no longer in the list
          for (const tag of tagsToRemove) {
            idea.removeTag(tag);
          }

          // Add new tags
          for (const tag of tagsToAdd) {
            idea.addTag(tag);
          }
        } catch (error) {
          if (error instanceof Error) {
            return failure(new BusinessRuleViolationError(error.message));
          }
          return failure(
            new BusinessRuleViolationError("Failed to update tags")
          );
        }
      }

      // Step 5: Persist changes (updated_at handled by database trigger)
      const updateResult = await this.ideaRepository.update(idea, input.userId);

      if (!updateResult.success) {
        return failure(updateResult.error);
      }

      // Step 6: Return updated idea
      const output: SaveIdeaMetadataOutput = {
        idea: updateResult.data,
      };

      return success(output);
    } catch (error) {
      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error during metadata save")
      );
    }
  }
}
