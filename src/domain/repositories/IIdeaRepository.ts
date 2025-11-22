import { Idea } from "../entities";
import { IdeaId, UserId, ProjectStatus, IdeaSource } from "../value-objects";
import { ICommandRepository, IQueryRepository } from "./base/IRepository";
import {
  Result,
  PaginatedResult,
  PaginationParams,
} from "../../shared/types/common";

/**
 * Search criteria for idea queries
 */
export interface IdeaSearchCriteria {
  userId?: UserId;
  source?: IdeaSource;
  projectStatus?: ProjectStatus;
  hasNotes?: boolean;
  hasTags?: boolean;
  tagContains?: string;
  ideaTextContains?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
}

/**
 * Sorting options for idea queries
 */
export interface IdeaSortOptions {
  field: "createdAt" | "updatedAt" | "ideaText";
  direction: "asc" | "desc";
}

/**
 * Command repository interface for Idea write operations
 */
export interface IIdeaCommandRepository
  extends ICommandRepository<Idea, IdeaId> {
  /**
   * Save a new idea with validation
   */
  save(idea: Idea): Promise<Result<Idea, Error>>;

  /**
   * Update an existing idea
   * @param idea - The idea to update
   * @param requestingUserId - Optional ID of the user making the request (for authorization)
   */
  update(idea: Idea, requestingUserId?: UserId): Promise<Result<Idea, Error>>;

  /**
   * Delete an idea by ID
   * @param id - The ID of the idea to delete
   * @param requestingUserId - Optional ID of the user making the request (for authorization)
   */
  delete(id: IdeaId, requestingUserId?: UserId): Promise<Result<void, Error>>;

  /**
   * Delete all ideas for a specific user
   */
  deleteAllByUserId(userId: UserId): Promise<Result<void, Error>>;

  /**
   * Bulk update project status for multiple ideas
   */
  updateStatuses(
    updates: Array<{ id: IdeaId; status: ProjectStatus }>
  ): Promise<Result<void, Error>>;
}

/**
 * Query repository interface for Idea read operations
 */
export interface IIdeaQueryRepository extends IQueryRepository<Idea, IdeaId> {
  /**
   * Find idea by ID with optional authorization context
   * @param id - Idea ID to look up
   * @param requestingUserId - Optional user ID for ownership/authorization checks
   */
  findById(
    id: IdeaId,
    requestingUserId?: UserId
  ): Promise<Result<Idea | null, Error>>;

  /**
   * Find ideas by user ID with pagination
   */
  findByUserId(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>>;

  /**
   * Find all ideas by user ID (without pagination)
   * Ordered by updated_at DESC
   */
  findAllByUserId(userId: UserId): Promise<Result<Idea[], Error>>;

  /**
   * Find ideas by user ID with pagination and additional options
   */
  findByUserIdPaginated(
    userId: UserId,
    options: {
      page: number;
      limit: number;
      sortBy?: "newest" | "oldest" | "updated";
      source?: "manual" | "frankenstein" | "all";
      status?: "idea" | "in_progress" | "completed" | "archived" | "all";
    }
  ): Promise<Result<{ ideas: Idea[]; total: number }, Error>>;

  /**
   * Search ideas by user with text search
   */
  searchByUser(
    userId: UserId,
    searchTerm: string,
    options: {
      page: number;
      limit: number;
      sortBy?: "newest" | "oldest" | "updated";
      source?: "manual" | "frankenstein" | "all";
      status?: "idea" | "in_progress" | "completed" | "archived" | "all";
    }
  ): Promise<Result<{ ideas: Idea[]; total: number }, Error>>;

  /**
   * Get idea counts by status for a user
   */
  getIdeaCountsByStatus(userId: UserId): Promise<
    Result<
      {
        total: number;
        idea: number;
        in_progress: number;
        completed: number;
        archived: number;
      },
      Error
    >
  >;

  /**
   * Get idea counts by source for a user
   */
  getIdeaCountsBySource(userId: UserId): Promise<
    Result<
      {
        total: number;
        manual: number;
        frankenstein: number;
      },
      Error
    >
  >;

  /**
   * Find ideas by project status with pagination
   */
  findByStatus(
    userId: UserId,
    status: ProjectStatus,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>>;

  /**
   * Find ideas by source with pagination
   */
  findBySource(
    userId: UserId,
    source: IdeaSource,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>>;

  /**
   * Find recent ideas (created within specified days)
   */
  findRecent(
    userId: UserId,
    days: number,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>>;

  /**
   * Find recently updated ideas (updated within specified days)
   */
  findRecentlyUpdated(
    userId: UserId,
    days: number,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>>;

  /**
   * Search ideas with complex criteria
   */
  search(
    criteria: IdeaSearchCriteria,
    sort: IdeaSortOptions,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>>;

  /**
   * Find ideas by user and status
   */
  findByUserAndStatus(
    userId: UserId,
    status: ProjectStatus,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>>;

  /**
   * Get idea statistics for a user
   */
  getUserIdeaStats(userId: UserId): Promise<
    Result<
      {
        totalCount: number;
        statusCounts: Record<string, number>;
        sourceCounts: Record<string, number>;
        withNotes: number;
        withTags: number;
        recentCount: number;
      },
      Error
    >
  >;

  /**
   * Find ideas with tags
   */
  findWithTags(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>>;

  /**
   * Find ideas with notes
   */
  findWithNotes(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>>;

  /**
   * Find ideas by tag
   */
  findByTag(
    userId: UserId,
    tag: string,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>>;

  /**
   * Optimized query for dashboard display
   * Returns only minimal data needed for dashboard cards to reduce data transfer
   */
  findByUserIdForDashboard(
    userId: UserId,
    options: {
      page: number;
      limit: number;
      sortBy?: "newest" | "oldest" | "updated";
      source?: "manual" | "frankenstein" | "all";
      status?: "idea" | "in_progress" | "completed" | "archived" | "all";
    }
  ): Promise<
    Result<
      {
        ideas: Array<{
          id: string;
          ideaText: string;
          source: string;
          projectStatus: string;
          documentCount: number;
          createdAt: string;
          updatedAt: string;
          tags: string[];
        }>;
        total: number;
      },
      Error
    >
  >;
}

/**
 * Combined Idea repository interface
 * Provides both command and query operations
 */
export interface IIdeaRepository
  extends IIdeaCommandRepository,
    IIdeaQueryRepository {
  // Ensure unified overload is available on the combined interface
  findById(
    id: IdeaId,
    requestingUserId?: UserId
  ): Promise<Result<Idea | null, Error>>;
}
