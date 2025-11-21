import { SupabaseClient } from "@supabase/supabase-js";
import { Idea } from "../../../../domain/entities";
import { IdeaId, UserId } from "../../../../domain/value-objects";
import { IIdeaRepository } from "../../../../domain/repositories/IIdeaRepository";
import {
  Result,
  PaginatedResult,
  PaginationParams,
  success,
  failure,
} from "../../../../shared/types/common";
import { AuthorizationError } from "../../../../shared/types/errors";
import { Database } from "../../types";
import {
  DatabaseQueryError,
  RecordNotFoundError,
  UniqueConstraintError,
} from "../../errors";
import { IdeaMapper } from "../mappers/IdeaMapper";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Supabase implementation of the Idea repository
 * Handles all database operations for Idea entities
 */
export class SupabaseIdeaRepository implements IIdeaRepository {
  private readonly tableName = "ideas";

  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly mapper: IdeaMapper
  ) {}

  // Command operations (write)

  /**
   * Save a new idea with validation
   */
  async save(idea: Idea): Promise<Result<Idea, Error>> {
    try {
      const dao = this.mapper.toDAO(idea);

      const { data, error } = await this.client
        .from(this.tableName)
        .insert(dao)
        .select()
        .single();

      if (error) {
        logger.error(LogCategory.DATABASE, "Failed to save idea", {
          ideaId: idea.id.value,
          error: error.message,
        });

        // Check for unique constraint violations
        if (error.code === "23505") {
          return failure(new UniqueConstraintError("id", idea.id.value, error));
        }

        return failure(
          new DatabaseQueryError(`Failed to save idea: ${error.message}`, error)
        );
      }

      if (!data) {
        return failure(
          new DatabaseQueryError("No data returned after saving idea")
        );
      }

      const savedIdea = this.mapper.toDomain(
        data as Database["public"]["Tables"]["ideas"]["Row"]
      );

      logger.info(LogCategory.DATABASE, "Idea saved successfully", {
        ideaId: savedIdea.id.value,
      });

      return success(savedIdea);
    } catch (error) {
      logger.error(LogCategory.DATABASE, "Unexpected error saving idea", {
        ideaId: idea.id.value,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error saving idea")
      );
    }
  }

  /**
   * Update an existing idea
   */
  async update(
    idea: Idea,
    requestingUserId?: UserId
  ): Promise<Result<Idea, Error>> {
    try {
      // Authorization check if requesting user is provided
      if (requestingUserId && !idea.belongsToUser(requestingUserId)) {
        return failure(
          new AuthorizationError(
            `User ${requestingUserId.value} is not authorized to update idea ${idea.id.value}`
          )
        );
      }

      const dao = this.mapper.toDAO(idea);

      const { data, error } = await this.client
        .from(this.tableName)
        .update({
          idea_text: dao.idea_text,
          source: dao.source,
          project_status: dao.project_status,
          notes: dao.notes,
          tags: dao.tags,
          // updated_at is handled by database trigger
        })
        .eq("id", idea.id.value)
        .select()
        .single();

      if (error) {
        logger.error(LogCategory.DATABASE, "Failed to update idea", {
          ideaId: idea.id.value,
          error: error.message,
        });

        return failure(
          new DatabaseQueryError(
            `Failed to update idea: ${error.message}`,
            error
          )
        );
      }

      if (!data) {
        return failure(new RecordNotFoundError("Idea", idea.id.value));
      }

      const updatedIdea = this.mapper.toDomain(
        data as Database["public"]["Tables"]["ideas"]["Row"]
      );

      logger.info(LogCategory.DATABASE, "Idea updated successfully", {
        ideaId: updatedIdea.id.value,
      });

      return success(updatedIdea);
    } catch (error) {
      logger.error(LogCategory.DATABASE, "Unexpected error updating idea", {
        ideaId: idea.id.value,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error updating idea")
      );
    }
  }

  /**
   * Delete an idea by ID
   */
  async delete(
    id: IdeaId,
    requestingUserId?: UserId
  ): Promise<Result<void, Error>> {
    try {
      // If authorization is required, first fetch the idea to check ownership
      if (requestingUserId) {
        const ideaResult = await this.findById(id, requestingUserId);
        if (!ideaResult.success) {
          return failure(ideaResult.error);
        }
        if (!ideaResult.data) {
          return failure(new RecordNotFoundError("Idea", id.value));
        }
      }

      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq("id", id.value);

      if (error) {
        logger.error(LogCategory.DATABASE, "Failed to delete idea", {
          ideaId: id.value,
          error: error.message,
        });

        return failure(
          new DatabaseQueryError(
            `Failed to delete idea: ${error.message}`,
            error
          )
        );
      }

      logger.info(LogCategory.DATABASE, "Idea deleted successfully", {
        ideaId: id.value,
      });

      return success(undefined);
    } catch (error) {
      logger.error(LogCategory.DATABASE, "Unexpected error deleting idea", {
        ideaId: id.value,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error deleting idea")
      );
    }
  }

  /**
   * Delete all ideas for a specific user
   */
  async deleteAllByUserId(userId: UserId): Promise<Result<void, Error>> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq("user_id", userId.value);

      if (error) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to delete all ideas for user",
          {
            userId: userId.value,
            error: error.message,
          }
        );

        return failure(
          new DatabaseQueryError(
            `Failed to delete all ideas for user: ${error.message}`,
            error
          )
        );
      }

      logger.info(
        LogCategory.DATABASE,
        "All ideas deleted successfully for user",
        {
          userId: userId.value,
        }
      );

      return success(undefined);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error deleting all ideas for user",
        {
          userId: userId.value,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error deleting all ideas")
      );
    }
  }

  /**
   * Bulk update project status for multiple ideas
   */
  async updateStatuses(
    updates: Array<{ id: IdeaId; status: any }>
  ): Promise<Result<void, Error>> {
    try {
      // Supabase doesn't support bulk updates directly, so we'll do them sequentially
      // For better performance, this could be optimized with a stored procedure
      for (const update of updates) {
        const { error } = await this.client
          .from(this.tableName)
          .update({ project_status: update.status.value })
          .eq("id", update.id.value);

        if (error) {
          logger.error(
            LogCategory.DATABASE,
            "Failed to update idea status in bulk operation",
            {
              ideaId: update.id.value,
              error: error.message,
            }
          );

          return failure(
            new DatabaseQueryError(
              `Failed to update idea status: ${error.message}`,
              error
            )
          );
        }
      }

      logger.info(
        LogCategory.DATABASE,
        "Bulk status update completed successfully",
        {
          count: updates.length,
        }
      );

      return success(undefined);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error in bulk status update",
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error in bulk status update")
      );
    }
  }

  // Query operations (read)

  /**
   * Find idea by ID with optional authorization context
   */
  async findById(
    id: IdeaId,
    requestingUserId?: UserId
  ): Promise<Result<Idea | null, Error>> {
    try {
      let query = this.client
        .from(this.tableName)
        .select("*")
        .eq("id", id.value);

      // Add user filter if authorization is required
      if (requestingUserId) {
        query = query.eq("user_id", requestingUserId.value);
      }

      const { data, error } = await query.single();

      if (error) {
        // PGRST116 is "not found" error from PostgREST
        if (error.code === "PGRST116") {
          return success(null);
        }

        logger.error(LogCategory.DATABASE, "Failed to find idea by ID", {
          ideaId: id.value,
          error: error.message,
        });

        return failure(
          new DatabaseQueryError(`Failed to find idea: ${error.message}`, error)
        );
      }

      if (!data) {
        return success(null);
      }

      const idea = this.mapper.toDomain(
        data as Database["public"]["Tables"]["ideas"]["Row"]
      );
      return success(idea);
    } catch (error) {
      logger.error(LogCategory.DATABASE, "Unexpected error finding idea", {
        ideaId: id.value,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error finding idea")
      );
    }
  }

  /**
   * Find all ideas by user ID (without pagination)
   * Ordered by updated_at DESC
   */
  async findAllByUserId(userId: UserId): Promise<Result<Idea[], Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId.value)
        .order("updated_at", { ascending: false });

      if (error) {
        logger.error(LogCategory.DATABASE, "Failed to find ideas by user ID", {
          userId: userId.value,
          error: error.message,
        });

        return failure(
          new DatabaseQueryError(
            `Failed to find ideas: ${error.message}`,
            error
          )
        );
      }

      const ideas = data
        ? this.mapper.toDomainBatch(
            data as Database["public"]["Tables"]["ideas"]["Row"][]
          )
        : [];

      return success(ideas);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error finding ideas by user",
        {
          userId: userId.value,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error finding ideas")
      );
    }
  }

  // Placeholder implementations for other query methods
  // These would be implemented based on specific requirements

  async findByUserId(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    // TODO: Implement pagination
    throw new Error("Method not implemented");
  }

  async findByUserIdPaginated(
    userId: UserId,
    options: any
  ): Promise<Result<{ ideas: Idea[]; total: number }, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async searchByUser(
    userId: UserId,
    searchTerm: string,
    options: any
  ): Promise<Result<{ ideas: Idea[]; total: number }, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async getIdeaCountsByStatus(userId: UserId): Promise<Result<any, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async getIdeaCountsBySource(userId: UserId): Promise<Result<any, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findByStatus(
    userId: UserId,
    status: any,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findBySource(
    userId: UserId,
    source: any,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findRecent(
    userId: UserId,
    days: number,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findRecentlyUpdated(
    userId: UserId,
    days: number,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async search(
    criteria: any,
    sort: any,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findByUserAndStatus(
    userId: UserId,
    status: any,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async getUserIdeaStats(userId: UserId): Promise<Result<any, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findWithTags(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findWithNotes(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findByTag(
    userId: UserId,
    tag: string,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findByUserIdForDashboard(
    userId: UserId,
    options: any
  ): Promise<Result<any, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  // Base repository methods

  /**
   * Save multiple ideas in a transaction
   */
  async saveMany(ideas: Idea[]): Promise<Result<Idea[], Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  /**
   * Delete multiple ideas by their IDs
   */
  async deleteMany(ids: IdeaId[]): Promise<Result<void, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  /**
   * Check if an idea exists by its ID
   */
  async exists(id: IdeaId): Promise<Result<boolean, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  /**
   * Get the total count of ideas
   */
  async count(): Promise<Result<number, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  /**
   * Find all ideas with pagination
   */
  async findAll(
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  /**
   * Find ideas by multiple IDs
   */
  async findByIds(ids: IdeaId[]): Promise<Result<Idea[], Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  /**
   * Find ideas matching specific criteria
   */
  async findWhere(
    criteria: Record<string, unknown>
  ): Promise<Result<Idea[], Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  /**
   * Find ideas with pagination and criteria
   */
  async findWhereWithPagination(
    criteria: Record<string, unknown>,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }
}
