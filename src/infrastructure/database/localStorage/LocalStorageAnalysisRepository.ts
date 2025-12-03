/**
 * LocalStorageAnalysisRepository - localStorage implementation of IAnalysisRepository
 */

import { Analysis } from "../../../domain/entities";
import {
  AnalysisId,
  UserId,
  Category,
  Score,
  Locale,
} from "../../../domain/value-objects";
import {
  IAnalysisRepository,
  AnalysisSearchCriteria,
  AnalysisSortOptions,
} from "../../../domain/repositories/IAnalysisRepository";
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

export interface StoredAnalysis {
  id: string;
  userId: string;
  idea: string;
  locale: string;
  category?: { value: string; type: "general" | "hackathon" };
  score: number;
  feedback?: string;
  suggestions: string[];
  createdAt: string;
  updatedAt: string;
}

function toStored(a: Analysis): StoredAnalysis {
  return {
    id: a.id.value,
    userId: a.userId.value,
    idea: a.idea,
    locale: a.locale.value,
    category: a.category
      ? { value: a.category.value, type: a.category.type }
      : undefined,
    score: a.score.value,
    feedback: a.feedback,
    suggestions: [...a.suggestions],
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function toDomain(s: StoredAnalysis): Analysis {
  return Analysis.reconstruct({
    id: AnalysisId.reconstruct(s.id),
    userId: UserId.reconstruct(s.userId),
    idea: s.idea,
    locale: Locale.reconstruct(s.locale as "en" | "es"),
    category: s.category
      ? Category.reconstruct(s.category.value, s.category.type)
      : undefined,
    score: Score.reconstruct(s.score),
    feedback: s.feedback,
    suggestions: s.suggestions,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  });
}

export class LocalStorageAnalysisRepository implements IAnalysisRepository {
  private readonly adapter = new LocalStorageAdapter<StoredAnalysis>(
    STORAGE_KEYS.ANALYSES
  );

  async save(a: Analysis): Promise<Result<Analysis, Error>> {
    try {
      this.adapter.save(toStored(a));
      return success(a);
    } catch (e) {
      return failure(
        e instanceof StorageQuotaError
          ? e
          : new LocalStorageError("Failed to save", e)
      );
    }
  }

  async update(a: Analysis): Promise<Result<Analysis, Error>> {
    try {
      this.adapter.update(a.id.value, toStored(a));
      return success(a);
    } catch (e) {
      return failure(new LocalStorageError("Failed to update", e));
    }
  }

  async delete(id: AnalysisId): Promise<Result<void, Error>> {
    try {
      this.adapter.delete(id.value);
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to delete", e));
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
      return failure(
        new LocalStorageError("Failed to delete user analyses", e)
      );
    }
  }

  async updateScores(
    updates: Array<{ id: AnalysisId; score: Score }>
  ): Promise<Result<void, Error>> {
    try {
      for (const { id, score } of updates) {
        const s = this.adapter.getById(id.value);
        if (s) {
          s.score = score.value;
          s.updatedAt = new Date().toISOString();
          this.adapter.update(id.value, s);
        }
      }
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to update scores", e));
    }
  }

  async saveMany(entities: Analysis[]): Promise<Result<Analysis[], Error>> {
    try {
      entities.forEach((a) => this.adapter.save(toStored(a)));
      return success(entities);
    } catch (e) {
      return failure(new LocalStorageError("Failed to save many", e));
    }
  }

  async deleteMany(ids: AnalysisId[]): Promise<Result<void, Error>> {
    try {
      ids.forEach((id) => this.adapter.delete(id.value));
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to delete many", e));
    }
  }

  async findById(id: AnalysisId): Promise<Result<Analysis | null, Error>> {
    try {
      const s = this.adapter.getById(id.value);
      return success(s ? toDomain(s) : null);
    } catch (e) {
      return failure(new LocalStorageError("Failed to find by ID", e));
    }
  }

  async exists(id: AnalysisId): Promise<Result<boolean, Error>> {
    try {
      return success(this.adapter.exists(id.value));
    } catch (e) {
      return failure(new LocalStorageError("Failed to check existence", e));
    }
  }

  async count(): Promise<Result<number, Error>> {
    try {
      return success(this.adapter.count());
    } catch (e) {
      return failure(new LocalStorageError("Failed to count", e));
    }
  }

  async findAll(
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const items = this.adapter
        .getAll()
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
      return failure(new LocalStorageError("Failed to find all", e));
    }
  }

  async findByIds(ids: AnalysisId[]): Promise<Result<Analysis[], Error>> {
    try {
      const set = new Set(ids.map((id) => id.value));
      return success(
        this.adapter
          .getAll()
          .filter((i) => set.has(i.id))
          .map(toDomain)
      );
    } catch (e) {
      return failure(new LocalStorageError("Failed to find by IDs", e));
    }
  }

  async findWhere(
    criteria: Record<string, unknown>
  ): Promise<Result<Analysis[], Error>> {
    try {
      const items = this.adapter.findWhere((i) =>
        Object.entries(criteria).every(
          ([k, v]) => (i as unknown as Record<string, unknown>)[k] === v
        )
      );
      return success(items.map(toDomain));
    } catch (e) {
      return failure(new LocalStorageError("Failed to find where", e));
    }
  }

  async findWhereWithPagination(
    criteria: Record<string, unknown>,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const items = this.adapter
        .findWhere((i) =>
          Object.entries(criteria).every(
            ([k, v]) => (i as unknown as Record<string, unknown>)[k] === v
          )
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
      return failure(
        new LocalStorageError("Failed to find where with pagination", e)
      );
    }
  }

  async findByUserId(
    userId: UserId,
    p: PaginationParams,
    type?: "idea" | "hackathon"
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      let items = this.adapter.findWhere((i) => i.userId === userId.value);
      if (type)
        items = items.filter((i) =>
          type === "hackathon"
            ? i.category?.type === "hackathon"
            : i.category?.type !== "hackathon"
        );
      items.sort(
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
      return failure(new LocalStorageError("Failed to find by user ID", e));
    }
  }

  async findByUserIdAndType(
    userId: UserId,
    type: "idea" | "hackathon",
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    return this.findByUserId(userId, p, type);
  }

  async findAllByUserId(userId: UserId): Promise<Result<Analysis[], Error>> {
    try {
      return success(
        this.adapter
          .findWhere((i) => i.userId === userId.value)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .map(toDomain)
      );
    } catch (e) {
      return failure(new LocalStorageError("Failed to find all by user ID", e));
    }
  }

  async findByUserIdPaginated(
    userId: UserId,
    opts: {
      page: number;
      limit: number;
      sortBy?: "newest" | "oldest" | "score" | "title";
      category?: "idea" | "kiroween" | "all";
      type?: "idea" | "hackathon";
    }
  ): Promise<Result<{ analyses: Analysis[]; total: number }, Error>> {
    try {
      let items = this.adapter.findWhere((i) => i.userId === userId.value);
      if (opts.type)
        items = items.filter((i) =>
          opts.type === "hackathon"
            ? i.category?.type === "hackathon"
            : i.category?.type !== "hackathon"
        );
      if (opts.category && opts.category !== "all") {
        const tf = opts.category === "kiroween" ? "hackathon" : "idea";
        items = items.filter((i) =>
          tf === "hackathon"
            ? i.category?.type === "hackathon"
            : i.category?.type !== "hackathon"
        );
      }
      const sorted = this.sortItems(items, opts.sortBy || "newest");
      const off = (opts.page - 1) * opts.limit;
      return success({
        analyses: sorted.slice(off, off + opts.limit).map(toDomain),
        total: items.length,
      });
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find by user ID paginated", e)
      );
    }
  }

  async searchByUser(
    userId: UserId,
    term: string,
    opts: {
      page: number;
      limit: number;
      sortBy?: "newest" | "oldest" | "score" | "title";
      category?: "idea" | "kiroween" | "all";
      type?: "idea" | "hackathon";
    }
  ): Promise<Result<{ analyses: Analysis[]; total: number }, Error>> {
    try {
      const lower = term.toLowerCase();
      let items = this.adapter.findWhere(
        (i) =>
          i.userId === userId.value &&
          (i.idea.toLowerCase().includes(lower) ||
            (i.feedback?.toLowerCase().includes(lower) ?? false))
      );
      if (opts.type)
        items = items.filter((i) =>
          opts.type === "hackathon"
            ? i.category?.type === "hackathon"
            : i.category?.type !== "hackathon"
        );
      if (opts.category && opts.category !== "all") {
        const tf = opts.category === "kiroween" ? "hackathon" : "idea";
        items = items.filter((i) =>
          tf === "hackathon"
            ? i.category?.type === "hackathon"
            : i.category?.type !== "hackathon"
        );
      }
      const sorted = this.sortItems(items, opts.sortBy || "newest");
      const off = (opts.page - 1) * opts.limit;
      return success({
        analyses: sorted.slice(off, off + opts.limit).map(toDomain),
        total: items.length,
      });
    } catch (e) {
      return failure(new LocalStorageError("Failed to search by user", e));
    }
  }

  async getAnalysisCountsByType(
    userId: UserId
  ): Promise<
    Result<{ total: number; idea: number; hackathon: number }, Error>
  > {
    try {
      const items = this.adapter.findWhere((i) => i.userId === userId.value);
      const hackathon = items.filter(
        (i) => i.category?.type === "hackathon"
      ).length;
      return success({
        total: items.length,
        idea: items.length - hackathon,
        hackathon,
      });
    } catch (e) {
      return failure(new LocalStorageError("Failed to get counts by type", e));
    }
  }

  async getAnalysisCountsByUser(
    userId: UserId
  ): Promise<Result<{ total: number; idea: number; kiroween: number }, Error>> {
    const r = await this.getAnalysisCountsByType(userId);
    if (!r.success)
      return r as Result<
        { total: number; idea: number; kiroween: number },
        Error
      >;
    return success({
      total: r.data.total,
      idea: r.data.idea,
      kiroween: r.data.hackathon,
    });
  }

  async getScoreStatsByUser(
    userId: UserId
  ): Promise<
    Result<{ average: number; highest: number; lowest: number }, Error>
  > {
    try {
      const items = this.adapter.findWhere((i) => i.userId === userId.value);
      if (items.length === 0)
        return success({ average: 0, highest: 0, lowest: 0 });
      const scores = items.map((i) => i.score);
      return success({
        average: scores.reduce((a, b) => a + b, 0) / scores.length,
        highest: Math.max(...scores),
        lowest: Math.min(...scores),
      });
    } catch (e) {
      return failure(new LocalStorageError("Failed to get score stats", e));
    }
  }

  async findByCategory(
    cat: Category,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const items = this.adapter
        .findWhere(
          (i) =>
            i.category?.value === cat.value && i.category?.type === cat.type
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
      return failure(new LocalStorageError("Failed to find by category", e));
    }
  }

  async findHighQuality(
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const items = this.adapter
        .findWhere((i) => i.score >= 80)
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
      return failure(new LocalStorageError("Failed to find high quality", e));
    }
  }

  async findRecent(
    days: number,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const items = this.adapter
        .findWhere((i) => new Date(i.createdAt) > cutoff)
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
      return failure(new LocalStorageError("Failed to find recent", e));
    }
  }

  async search(
    criteria: AnalysisSearchCriteria,
    sort: AnalysisSortOptions,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      let items = this.adapter.getAll();
      if (criteria.userId)
        items = items.filter((i) => i.userId === criteria.userId!.value);
      if (criteria.category)
        items = items.filter(
          (i) =>
            i.category?.value === criteria.category!.value &&
            i.category?.type === criteria.category!.type
        );
      if (criteria.locale)
        items = items.filter((i) => i.locale === criteria.locale!.value);
      if (criteria.minScore)
        items = items.filter((i) => i.score >= criteria.minScore!.value);
      if (criteria.maxScore)
        items = items.filter((i) => i.score <= criteria.maxScore!.value);
      if (criteria.createdAfter)
        items = items.filter(
          (i) => new Date(i.createdAt) > criteria.createdAfter!
        );
      if (criteria.createdBefore)
        items = items.filter(
          (i) => new Date(i.createdAt) < criteria.createdBefore!
        );
      if (criteria.ideaContains) {
        const s = criteria.ideaContains.toLowerCase();
        items = items.filter((i) => i.idea.toLowerCase().includes(s));
      }
      const sorted = this.sortItemsAdvanced(items, sort);
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          sorted.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(new LocalStorageError("Failed to search", e));
    }
  }

  async findByUserAndCategory(
    userId: UserId,
    cat: Category,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const items = this.adapter
        .findWhere(
          (i) =>
            i.userId === userId.value &&
            i.category?.value === cat.value &&
            i.category?.type === cat.type
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
      return failure(
        new LocalStorageError("Failed to find by user and category", e)
      );
    }
  }

  async getUserAnalysisStats(userId: UserId): Promise<
    Result<
      {
        totalCount: number;
        completedCount: number;
        averageScore: number;
        highQualityCount: number;
        categoryCounts: Record<string, number>;
      },
      Error
    >
  > {
    try {
      const items = this.adapter.findWhere((i) => i.userId === userId.value);
      const scores = items.map((i) => i.score);
      const categoryCounts: Record<string, number> = {};
      items.forEach((i) => {
        const c = i.category?.value || "uncategorized";
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      });
      return success({
        totalCount: items.length,
        completedCount: items.filter((i) => i.feedback).length,
        averageScore:
          items.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0,
        highQualityCount: items.filter((i) => i.score >= 80).length,
        categoryCounts,
      });
    } catch (e) {
      return failure(new LocalStorageError("Failed to get user stats", e));
    }
  }

  async getGlobalStats(): Promise<
    Result<
      {
        totalCount: number;
        averageScore: number;
        topCategories: Array<{ category: string; count: number }>;
        recentCount: number;
      },
      Error
    >
  > {
    try {
      const items = this.adapter.getAll();
      const scores = items.map((i) => i.score);
      const categoryCounts: Record<string, number> = {};
      items.forEach((i) => {
        const c = i.category?.value || "uncategorized";
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      });
      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return success({
        totalCount: items.length,
        averageScore:
          items.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0,
        topCategories,
        recentCount: items.filter((i) => new Date(i.createdAt) > weekAgo)
          .length,
      });
    } catch (e) {
      return failure(new LocalStorageError("Failed to get global stats", e));
    }
  }

  async findSimilar(
    analysis: Analysis,
    limit: number
  ): Promise<Result<Analysis[], Error>> {
    try {
      const items = this.adapter.findWhere(
        (i) =>
          i.id !== analysis.id.value &&
          i.category?.value === analysis.category?.value
      );
      return success(
        items
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(toDomain)
      );
    } catch (e) {
      return failure(new LocalStorageError("Failed to find similar", e));
    }
  }

  async findNeedingAttention(
    userId: UserId,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Analysis>, Error>> {
    try {
      const items = this.adapter
        .findWhere(
          (i) => i.userId === userId.value && (i.score < 40 || !i.feedback)
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
      return failure(
        new LocalStorageError("Failed to find needing attention", e)
      );
    }
  }

  async findByUserIdForDashboard(
    userId: UserId,
    opts: {
      page: number;
      limit: number;
      sortBy?: "newest" | "oldest" | "score" | "title";
      category?: "idea" | "kiroween" | "all";
    }
  ): Promise<
    Result<
      {
        analyses: Array<{
          id: string;
          title: string;
          createdAt: string;
          score: number;
          category: string;
          summary: string;
        }>;
        total: number;
      },
      Error
    >
  > {
    try {
      let items = this.adapter.findWhere((i) => i.userId === userId.value);
      if (opts.category && opts.category !== "all") {
        const tf = opts.category === "kiroween" ? "hackathon" : "idea";
        items = items.filter((i) =>
          tf === "hackathon"
            ? i.category?.type === "hackathon"
            : i.category?.type !== "hackathon"
        );
      }
      const sorted = this.sortItems(items, opts.sortBy || "newest");
      const off = (opts.page - 1) * opts.limit;
      const paged = sorted.slice(off, off + opts.limit);
      return success({
        analyses: paged.map((i) => ({
          id: i.id,
          title: i.idea.split("\n")[0]?.trim() || i.idea.trim() || "Untitled",
          createdAt: i.createdAt,
          score: i.score,
          category: i.category?.type === "hackathon" ? "kiroween" : "idea",
          summary: i.feedback || "No summary available",
        })),
        total: items.length,
      });
    } catch (e) {
      return failure(new LocalStorageError("Failed to find for dashboard", e));
    }
  }

  private sortItems(
    items: StoredAnalysis[],
    sortBy: "newest" | "oldest" | "score" | "title"
  ): StoredAnalysis[] {
    switch (sortBy) {
      case "oldest":
        return items.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "score":
        return items.sort((a, b) => b.score - a.score);
      case "title":
        return items.sort((a, b) => a.idea.localeCompare(b.idea));
      default:
        return items.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }

  private sortItemsAdvanced(
    items: StoredAnalysis[],
    sort: AnalysisSortOptions
  ): StoredAnalysis[] {
    const m = sort.direction === "asc" ? 1 : -1;
    switch (sort.field) {
      case "score":
        return items.sort((a, b) => (a.score - b.score) * m);
      case "updatedAt":
        return items.sort(
          (a, b) =>
            (new Date(a.updatedAt).getTime() -
              new Date(b.updatedAt).getTime()) *
            m
        );
      default:
        return items.sort(
          (a, b) =>
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()) *
            m
        );
    }
  }
}
