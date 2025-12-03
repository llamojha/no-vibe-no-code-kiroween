import { Idea } from "../../domain/entities";
import { UserId, IdeaSource, ProjectStatus } from "../../domain/value-objects";
import { IIdeaRepository } from "../../domain/repositories/IIdeaRepository";
import { Result, success, failure } from "../../shared/types/common";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Input for creating a new idea
 */
export interface CreateIdeaInput {
  userId: UserId;
  ideaText: string;
  source?: "manual" | "frankenstein";
}

/**
 * Output from creating an idea
 */
export interface CreateIdeaOutput {
  idea: Idea;
}

/**
 * Use case for creating a new idea without an analysis
 * This enables quick idea capture from the dashboard
 */
export class CreateIdeaUseCase {
  constructor(private readonly ideaRepository: IIdeaRepository) {}

  async execute(
    input: CreateIdeaInput
  ): Promise<Result<CreateIdeaOutput, Error>> {
    try {
      // Validate idea text
      const trimmedText = input.ideaText.trim();
      if (!trimmedText) {
        return failure(new Error("Idea text cannot be empty"));
      }

      if (trimmedText.length < 10) {
        return failure(new Error("Idea text must be at least 10 characters"));
      }

      if (trimmedText.length > 5000) {
        return failure(new Error("Idea text cannot exceed 5000 characters"));
      }

      // Determine source
      const source =
        input.source === "frankenstein"
          ? IdeaSource.FRANKENSTEIN
          : IdeaSource.MANUAL;

      // Create idea entity
      const idea = Idea.create({
        userId: input.userId,
        ideaText: trimmedText,
        source,
        projectStatus: ProjectStatus.IDEA,
        notes: "",
        tags: [],
      });

      // Save to repository
      const saveResult = await this.ideaRepository.save(idea);

      if (!saveResult.success) {
        logger.error(LogCategory.DATABASE, "Failed to save idea", {
          userId: input.userId.value,
          error: saveResult.error.message,
        });
        return failure(saveResult.error);
      }

      logger.info(LogCategory.BUSINESS, "Created new idea", {
        ideaId: saveResult.data.id.value,
        userId: input.userId.value,
        source: source.value,
      });

      return success({ idea: saveResult.data });
    } catch (error) {
      logger.error(LogCategory.BUSINESS, "Unexpected error creating idea", {
        userId: input.userId.value,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error creating idea")
      );
    }
  }
}
