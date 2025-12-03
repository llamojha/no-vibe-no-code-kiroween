/**
 * LocalStorageIdeaRepository - localStorage implementation of IIdeaRepository
 */

import { Idea } from "../../../domain/entities";
import {
  IdeaId,
  UserId,
  IdeaSource,
  ProjectStatus,
} from "../../../domain/value-objects";
import {
  IIdeaRepository,
  IdeaSearchCriteria,
  IdeaSortOptions,
} from "../../../domain/repositories/IIdeaRepository";
import {
  Result,
  PaginatedResult,
  PaginationParams,
  success,
  failure,
  createPaginatedResult,
} from "../../../shared/types/common";
import {
  LocalStorageAdapter,
  STORAGE_KEYS,
  LocalStorageError,
  StorageQuotaError,
} from "./LocalStorageAdapter";

export interface StoredIdea {
  id: string;
  userId: string;
  ideaText: string;
  source: "manual" | "frankenstein";
  projectStatus: "idea" | "in_progress" | "completed" | "archived";
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

function toStored(i: Idea): StoredIdea {
  return {
    id: i.id.value,
    userId: i.userId.value,
    ideaText: i.ideaText,
    source: i.source.value as "manual" | "frankenstein",
    projectStatus: i.projectStatus.value as
      | "idea"
      | "in_progress"
      | "completed"
      | "archived",
    notes: i.notes,
    tags: [...i.tags],
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

function toDomain(s: StoredIdea): Idea {
  return Idea.reconstruct({
    id: IdeaId.reconstruct(s.id),
    userId: UserId.reconstruct(s.userId),
    ideaText: s.ideaText,
    source: IdeaSource.fromString(s.source),
    projectStatus: ProjectStatus.fromString(s.projectStatus),
    notes: s.notes,
    tags: s.tags,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  });
}

export class LocalStorageIdeaRepository implements IIdeaRepository {
  private readonly adapter = new LocalStorageAdapter<StoredIdea>(
    STORAGE_KEYS.IDEAS
  );

  async save(i: Idea): Promise<Result<Idea, Error>> {
    try {
      this.adapter.save(toStored(i));
      return success(i);
    } catch (e) {
      return failure(
        e instanceof StorageQuotaError
          ? e
          : new LocalStorageError("Failed to save idea", e)
      );
    }
  }

  async update(i: Idea): Promise<Result<Idea, Error>> {
    try {
      this.adapter.update(i.id.value, toStored(i));
      return success(i);
    } catch (e) {
      return failure(new LocalStorageError("Failed to update idea", e));
    }
  }

  async delete(id: IdeaId): Promise<Result<void, Error>> {
    try {
      this.adapter.delete(id.value);
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to delete idea", e));
    }
  }

  async deleteAllByUserId(userId: UserId): Promise<Result<void, Error>> {
    try {
      const items = this.adapter
        .getAll()
        .filter((i) => i.userId !== userId.value);
      this.adapter.deleteAll();
      items.forEach((i) => this.adapter.save(i));
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to delete user ideas", e));
    }
  }

  async updateStatuses(
    updates: Array<{ id: IdeaId; status: ProjectStatus }>
  ): Promise<Result<void, Error>> {
    try {
      for (const { id, status } of updates) {
        const s = this.adapter.getById(id.value);
        if (s) {
          s.projectStatus = status.value as
            | "idea"
            | "in_progress"
            | "completed"
            | "archived";
          s.updatedAt = new Date().toISOString();
          this.adapter.update(id.value, s);
        }
      }
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to update statuses", e));
    }
  }

  async saveMany(entities: Idea[]): Promise<Result<Idea[], Error>> {
    try {
      entities.forEach((i) => this.adapter.save(toStored(i)));
      return success(entities);
    } catch (e) {
      return failure(new LocalStorageError("Failed to save many ideas", e));
    }
  }

  async deleteMany(ids: IdeaId[]): Promise<Result<void, Error>> {
    try {
      ids.forEach((id) => this.adapter.delete(id.value));
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to delete many ideas", e));
    }
  }

  async findById(id: IdeaId): Promise<Result<Idea | null, Error>> {
    try {
      const s = this.adapter.getById(id.value);
      return success(s ? toDomain(s) : null);
    } catch (e) {
      return failure(new LocalStorageError("Failed to find idea by ID", e));
    }
  }

  async exists(id: IdeaId): Promise<Result<boolean, Error>> {
    try {
      return success(this.adapter.exists(id.value));
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to check idea existence", e)
      );
    }
  }

  async count(): Promise<Result<number, Error>> {
    try {
      return success(this.adapter.count());
    } catch (e) {
      return failure(new LocalStorageError("Failed to count ideas", e));
    }
  }

  async findByUserId(
    userId: UserId,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    try {
      const items = this.adapter
        .findWhere((i) => i.userId === userId.value)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find ideas by user ID", e)
      );
    }
  }

  async findAllByUserId(userId: UserId): Promise<Result<Idea[], Error>> {
    try {
      return success(
        this.adapter
          .findWhere((i) => i.userId === userId.value)
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          .map(toDomain)
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find all ideas by user ID", e)
      );
    }
  }

  async findByUserIdPaginated(
    userId: UserId,
    opts: {
      page: number;
      limit: number;
      sortBy?: "newest" | "oldest" | "updated";
      source?: "manual" | "frankenstein" | "all";
      status?: "idea" | "in_progress" | "completed" | "archived" | "all";
    }
  ): Promise<Result<{ ideas: Idea[]; total: number }, Error>> {
    try {
      let items = this.adapter.findWhere((i) => i.userId === userId.value);
      if (opts.source && opts.source !== "all")
        items = items.filter((i) => i.source === opts.source);
      if (opts.status && opts.status !== "all")
        items = items.filter((i) => i.projectStatus === opts.status);
      const sorted = this.sortItems(items, opts.sortBy || "newest");
      const off = (opts.page - 1) * opts.limit;
      return success({
        ideas: sorted.slice(off, off + opts.limit).map(toDomain),
        total: items.length,
      });
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find ideas by user ID paginated", e)
      );
    }
  }

  async searchByUser(
    userId: UserId,
    term: string,
    opts: {
      page: number;
      limit: number;
      sortBy?: "newest" | "oldest" | "updated";
      source?: "manual" | "frankenstein" | "all";
      status?: "idea" | "in_progress" | "completed" | "archived" | "all";
    }
  ): Promise<Result<{ ideas: Idea[]; total: number }, Error>> {
    try {
      const lower = term.toLowerCase();
      let items = this.adapter.findWhere(
        (i) =>
          i.userId === userId.value &&
          (i.ideaText.toLowerCase().includes(lower) ||
            i.notes.toLowerCase().includes(lower) ||
            i.tags.some((t) => t.toLowerCase().includes(lower)))
      );
      if (opts.source && opts.source !== "all")
        items = items.filter((i) => i.source === opts.source);
      if (opts.status && opts.status !== "all")
        items = items.filter((i) => i.projectStatus === opts.status);
      const sorted = this.sortItems(items, opts.sortBy || "newest");
      const off = (opts.page - 1) * opts.limit;
      return success({
        ideas: sorted.slice(off, off + opts.limit).map(toDomain),
        total: items.length,
      });
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to search ideas by user", e)
      );
    }
  }

  async getIdeaCountsByStatus(userId: UserId): Promise<
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
  > {
    try {
      const items = this.adapter.findWhere((i) => i.userId === userId.value);
      return success({
        total: items.length,
        idea: items.filter((i) => i.projectStatus === "idea").length,
        in_progress: items.filter((i) => i.projectStatus === "in_progress")
          .length,
        completed: items.filter((i) => i.projectStatus === "completed").length,
        archived: items.filter((i) => i.projectStatus === "archived").length,
      });
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to get idea counts by status", e)
      );
    }
  }

  async getIdeaCountsBySource(
    userId: UserId
  ): Promise<
    Result<{ total: number; manual: number; frankenstein: number }, Error>
  > {
    try {
      const items = this.adapter.findWhere((i) => i.userId === userId.value);
      return success({
        total: items.length,
        manual: items.filter((i) => i.source === "manual").length,
        frankenstein: items.filter((i) => i.source === "frankenstein").length,
      });
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to get idea counts by source", e)
      );
    }
  }

  async findByStatus(
    userId: UserId,
    status: ProjectStatus,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    try {
      const items = this.adapter
        .findWhere(
          (i) => i.userId === userId.value && i.projectStatus === status.value
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find ideas by status", e)
      );
    }
  }

  async findBySource(
    userId: UserId,
    source: IdeaSource,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    try {
      const items = this.adapter
        .findWhere(
          (i) => i.userId === userId.value && i.source === source.value
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find ideas by source", e)
      );
    }
  }

  async findRecent(
    userId: UserId,
    days: number,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const items = this.adapter
        .findWhere(
          (i) => i.userId === userId.value && new Date(i.createdAt) > cutoff
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(new LocalStorageError("Failed to find recent ideas", e));
    }
  }

  async findRecentlyUpdated(
    userId: UserId,
    days: number,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const items = this.adapter
        .findWhere(
          (i) => i.userId === userId.value && new Date(i.updatedAt) > cutoff
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find recently updated ideas", e)
      );
    }
  }

  async search(
    _criteria: IdeaSearchCriteria,
    _sort: IdeaSortOptions,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    try {
      const items = this.adapter
        .getAll()
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(new LocalStorageError("Failed to search ideas", e));
    }
  }

  async findByUserAndStatus(
    userId: UserId,
    status: ProjectStatus,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    return this.findByStatus(userId, status, p);
  }

  async getUserIdeaStats(userId: UserId): Promise<
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
  > {
    try {
      const items = this.adapter.findWhere((i) => i.userId === userId.value);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const statusCounts: Record<string, number> = {};
      const sourceCounts: Record<string, number> = {};
      items.forEach((i) => {
        statusCounts[i.projectStatus] =
          (statusCounts[i.projectStatus] || 0) + 1;
        sourceCounts[i.source] = (sourceCounts[i.source] || 0) + 1;
      });
      return success({
        totalCount: items.length,
        statusCounts,
        sourceCounts,
        withNotes: items.filter((i) => i.notes.trim()).length,
        withTags: items.filter((i) => i.tags.length > 0).length,
        recentCount: items.filter((i) => new Date(i.createdAt) > weekAgo)
          .length,
      });
    } catch (e) {
      return failure(new LocalStorageError("Failed to get user idea stats", e));
    }
  }

  async findWithTags(
    userId: UserId,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    try {
      const items = this.adapter
        .findWhere((i) => i.userId === userId.value && i.tags.length > 0)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find ideas with tags", e)
      );
    }
  }

  async findWithNotes(
    userId: UserId,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    try {
      const items = this.adapter
        .findWhere(
          (i) => i.userId === userId.value && i.notes.trim().length > 0
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find ideas with notes", e)
      );
    }
  }

  async findByTag(
    userId: UserId,
    tag: string,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    try {
      const lower = tag.toLowerCase();
      const items = this.adapter
        .findWhere(
          (i) =>
            i.userId === userId.value &&
            i.tags.some((t) => t.toLowerCase() === lower)
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(new LocalStorageError("Failed to find ideas by tag", e));
    }
  }

  async findByUserIdForDashboard(
    userId: UserId,
    opts: {
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
  > {
    try {
      let items = this.adapter.findWhere((i) => i.userId === userId.value);
      if (opts.source && opts.source !== "all")
        items = items.filter((i) => i.source === opts.source);
      if (opts.status && opts.status !== "all")
        items = items.filter((i) => i.projectStatus === opts.status);
      const sorted = this.sortItems(items, opts.sortBy || "newest");
      const off = (opts.page - 1) * opts.limit;
      const paged = sorted.slice(off, off + opts.limit);
      return success({
        ideas: paged.map((i) => ({
          id: i.id,
          ideaText: i.ideaText,
          source: i.source,
          projectStatus: i.projectStatus,
          documentCount: 0,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
          tags: i.tags,
        })),
        total: items.length,
      });
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find ideas for dashboard", e)
      );
    }
  }

  async findAll(
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    try {
      const items = this.adapter
        .getAll()
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(new LocalStorageError("Failed to find all ideas", e));
    }
  }

  async findByIds(ids: IdeaId[]): Promise<Result<Idea[], Error>> {
    try {
      const set = new Set(ids.map((id) => id.value));
      return success(
        this.adapter
          .getAll()
          .filter((i) => set.has(i.id))
          .map(toDomain)
      );
    } catch (e) {
      return failure(new LocalStorageError("Failed to find ideas by IDs", e));
    }
  }

  async findWhere(
    criteria: Record<string, unknown>
  ): Promise<Result<Idea[], Error>> {
    try {
      const items = this.adapter.findWhere((i) =>
        Object.entries(criteria).every(
          ([k, v]) => (i as unknown as Record<string, unknown>)[k] === v
        )
      );
      return success(items.map(toDomain));
    } catch (e) {
      return failure(new LocalStorageError("Failed to find ideas where", e));
    }
  }

  async findWhereWithPagination(
    criteria: Record<string, unknown>,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Idea>, Error>> {
    try {
      const items = this.adapter.findWhere((i) =>
        Object.entries(criteria).every(
          ([k, v]) => (i as unknown as Record<string, unknown>)[k] === v
        )
      );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find ideas where with pagination", e)
      );
    }
  }

  private sortItems(
    items: StoredIdea[],
    sortBy: "newest" | "oldest" | "updated"
  ): StoredIdea[] {
    switch (sortBy) {
      case "oldest":
        return items.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "updated":
        return items.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      default:
        return items.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }
}
