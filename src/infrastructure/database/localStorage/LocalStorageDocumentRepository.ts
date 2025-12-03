/**
 * LocalStorageDocumentRepository - localStorage implementation of IDocumentRepository
 */

import { Document, DocumentContent } from "../../../domain/entities";
import {
  DocumentId,
  IdeaId,
  UserId,
  DocumentType,
  DocumentVersion,
} from "../../../domain/value-objects";
import {
  IDocumentRepository,
  DocumentSearchCriteria,
  DocumentSortOptions,
} from "../../../domain/repositories/IDocumentRepository";
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

export interface StoredDocument {
  id: string;
  ideaId: string;
  userId: string;
  documentType: string;
  title: string | null;
  content: DocumentContent;
  version: number;
  createdAt: string;
  updatedAt: string;
}

function toStored(d: Document): StoredDocument {
  return {
    id: d.id.value,
    ideaId: d.ideaId.value,
    userId: d.userId.value,
    documentType: d.documentType.value,
    title: d.title,
    content: d.content,
    version: d.version.value,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

function toDomain(s: StoredDocument): Document {
  return Document.reconstruct({
    id: DocumentId.reconstruct(s.id),
    ideaId: IdeaId.reconstruct(s.ideaId),
    userId: UserId.reconstruct(s.userId),
    documentType: DocumentType.fromString(s.documentType),
    title: s.title,
    content: s.content,
    version: DocumentVersion.create(s.version),
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  });
}

export class LocalStorageDocumentRepository implements IDocumentRepository {
  private readonly adapter = new LocalStorageAdapter<StoredDocument>(
    STORAGE_KEYS.DOCUMENTS
  );

  async save(d: Document): Promise<Result<Document, Error>> {
    try {
      this.adapter.save(toStored(d));
      return success(d);
    } catch (e) {
      return failure(
        e instanceof StorageQuotaError
          ? e
          : new LocalStorageError("Failed to save document", e)
      );
    }
  }

  async delete(id: DocumentId): Promise<Result<void, Error>> {
    try {
      this.adapter.delete(id.value);
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to delete document", e));
    }
  }

  async deleteAllByIdeaId(ideaId: IdeaId): Promise<Result<void, Error>> {
    try {
      const items = this.adapter
        .getAll()
        .filter((i) => i.ideaId !== ideaId.value);
      this.adapter.deleteAll();
      items.forEach((i) => this.adapter.save(i));
      return success(undefined);
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to delete documents by idea ID", e)
      );
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
        new LocalStorageError("Failed to delete documents by user ID", e)
      );
    }
  }

  async update(d: Document): Promise<Result<Document, Error>> {
    try {
      this.adapter.update(d.id.value, toStored(d));
      return success(d);
    } catch (e) {
      return failure(new LocalStorageError("Failed to update document", e));
    }
  }

  async saveMany(entities: Document[]): Promise<Result<Document[], Error>> {
    try {
      entities.forEach((d) => this.adapter.save(toStored(d)));
      return success(entities);
    } catch (e) {
      return failure(new LocalStorageError("Failed to save many documents", e));
    }
  }

  async deleteMany(ids: DocumentId[]): Promise<Result<void, Error>> {
    try {
      ids.forEach((id) => this.adapter.delete(id.value));
      return success(undefined);
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to delete many documents", e)
      );
    }
  }

  async findById(id: DocumentId): Promise<Result<Document | null, Error>> {
    try {
      const s = this.adapter.getById(id.value);
      return success(s ? toDomain(s) : null);
    } catch (e) {
      return failure(new LocalStorageError("Failed to find document by ID", e));
    }
  }

  async exists(id: DocumentId): Promise<Result<boolean, Error>> {
    try {
      return success(this.adapter.exists(id.value));
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to check document existence", e)
      );
    }
  }

  async count(): Promise<Result<number, Error>> {
    try {
      return success(this.adapter.count());
    } catch (e) {
      return failure(new LocalStorageError("Failed to count documents", e));
    }
  }

  async findByIdeaId(ideaId: IdeaId): Promise<Result<Document[], Error>> {
    try {
      return success(
        this.adapter
          .findWhere((i) => i.ideaId === ideaId.value)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .map(toDomain)
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find documents by idea ID", e)
      );
    }
  }

  async findByIdeaIdPaginated(
    ideaId: IdeaId,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    try {
      const items = this.adapter
        .findWhere((i) => i.ideaId === ideaId.value)
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
        new LocalStorageError(
          "Failed to find documents by idea ID paginated",
          e
        )
      );
    }
  }

  async findByUserId(userId: UserId): Promise<Result<Document[], Error>> {
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
      return failure(
        new LocalStorageError("Failed to find documents by user ID", e)
      );
    }
  }

  async findByUserIdPaginated(
    userId: UserId,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    try {
      const items = this.adapter
        .findWhere((i) => i.userId === userId.value)
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
        new LocalStorageError(
          "Failed to find documents by user ID paginated",
          e
        )
      );
    }
  }

  async findByUserIdWithOptions(
    userId: UserId,
    opts: {
      page: number;
      limit: number;
      sortBy?: "newest" | "oldest";
      documentType?: "startup_analysis" | "hackathon_analysis" | "all";
    }
  ): Promise<Result<{ documents: Document[]; total: number }, Error>> {
    try {
      let items = this.adapter.findWhere((i) => i.userId === userId.value);
      if (opts.documentType && opts.documentType !== "all")
        items = items.filter((i) => i.documentType === opts.documentType);
      const sorted =
        opts.sortBy === "oldest"
          ? items.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            )
          : items.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
      const off = (opts.page - 1) * opts.limit;
      return success({
        documents: sorted.slice(off, off + opts.limit).map(toDomain),
        total: items.length,
      });
    } catch (e) {
      return failure(
        new LocalStorageError(
          "Failed to find documents by user ID with options",
          e
        )
      );
    }
  }

  async findByType(
    documentType: DocumentType,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    try {
      const items = this.adapter
        .findWhere((i) => i.documentType === documentType.value)
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
        new LocalStorageError("Failed to find documents by type", e)
      );
    }
  }

  async findByUserAndType(
    userId: UserId,
    documentType: DocumentType,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    try {
      const items = this.adapter
        .findWhere(
          (i) =>
            i.userId === userId.value && i.documentType === documentType.value
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
        new LocalStorageError("Failed to find documents by user and type", e)
      );
    }
  }

  async findByIdeaAndType(
    ideaId: IdeaId,
    documentType: DocumentType
  ): Promise<Result<Document[], Error>> {
    try {
      return success(
        this.adapter
          .findWhere(
            (i) =>
              i.ideaId === ideaId.value && i.documentType === documentType.value
          )
          .sort((a, b) => b.version - a.version)
          .map(toDomain)
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find documents by idea and type", e)
      );
    }
  }

  async findLatestVersion(
    ideaId: IdeaId,
    documentType: DocumentType
  ): Promise<Result<Document | null, Error>> {
    try {
      const items = this.adapter
        .findWhere(
          (i) =>
            i.ideaId === ideaId.value && i.documentType === documentType.value
        )
        .sort((a, b) => b.version - a.version);
      return success(items.length > 0 ? toDomain(items[0]) : null);
    } catch (e) {
      return failure(new LocalStorageError("Failed to find latest version", e));
    }
  }

  async findAllVersions(
    ideaId: IdeaId,
    documentType: DocumentType
  ): Promise<Result<Document[], Error>> {
    return this.findByIdeaAndType(ideaId, documentType);
  }

  async getDocumentCountsByType(
    userId: UserId
  ): Promise<
    Result<
      { total: number; startup_analysis: number; hackathon_analysis: number },
      Error
    >
  > {
    try {
      const items = this.adapter.findWhere((i) => i.userId === userId.value);
      return success({
        total: items.length,
        startup_analysis: items.filter(
          (i) => i.documentType === "startup_analysis"
        ).length,
        hackathon_analysis: items.filter(
          (i) => i.documentType === "hackathon_analysis"
        ).length,
      });
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to get document counts by type", e)
      );
    }
  }

  async getDocumentCountsByTypeForIdea(
    ideaId: IdeaId
  ): Promise<
    Result<
      { total: number; startup_analysis: number; hackathon_analysis: number },
      Error
    >
  > {
    try {
      const items = this.adapter.findWhere((i) => i.ideaId === ideaId.value);
      return success({
        total: items.length,
        startup_analysis: items.filter(
          (i) => i.documentType === "startup_analysis"
        ).length,
        hackathon_analysis: items.filter(
          (i) => i.documentType === "hackathon_analysis"
        ).length,
      });
    } catch (e) {
      return failure(
        new LocalStorageError(
          "Failed to get document counts by type for idea",
          e
        )
      );
    }
  }

  async getDocumentCountForIdea(
    ideaId: IdeaId
  ): Promise<Result<number, Error>> {
    try {
      return success(
        this.adapter.findWhere((i) => i.ideaId === ideaId.value).length
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to get document count for idea", e)
      );
    }
  }

  async findRecent(
    userId: UserId,
    days: number,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
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
      return failure(
        new LocalStorageError("Failed to find recent documents", e)
      );
    }
  }

  async search(
    _criteria: DocumentSearchCriteria,
    _sort: DocumentSortOptions,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
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
      return failure(new LocalStorageError("Failed to search documents", e));
    }
  }

  async getUserDocumentStats(userId: UserId): Promise<
    Result<
      {
        totalCount: number;
        typeCounts: Record<string, number>;
        withTitle: number;
        recentCount: number;
      },
      Error
    >
  > {
    try {
      const items = this.adapter.findWhere((i) => i.userId === userId.value);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const typeCounts: Record<string, number> = {};
      items.forEach((i) => {
        typeCounts[i.documentType] = (typeCounts[i.documentType] || 0) + 1;
      });
      return success({
        totalCount: items.length,
        typeCounts,
        withTitle: items.filter((i) => i.title).length,
        recentCount: items.filter((i) => new Date(i.createdAt) > weekAgo)
          .length,
      });
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to get user document stats", e)
      );
    }
  }

  async findWithTitles(
    userId: UserId,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    try {
      const items = this.adapter
        .findWhere((i) => i.userId === userId.value && i.title !== null)
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
        new LocalStorageError("Failed to find documents with titles", e)
      );
    }
  }

  async hasDocuments(ideaId: IdeaId): Promise<Result<boolean, Error>> {
    try {
      return success(
        this.adapter.findWhere((i) => i.ideaId === ideaId.value).length > 0
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to check if idea has documents", e)
      );
    }
  }

  async hasDocumentType(
    ideaId: IdeaId,
    documentType: DocumentType
  ): Promise<Result<boolean, Error>> {
    try {
      return success(
        this.adapter.findWhere(
          (i) =>
            i.ideaId === ideaId.value && i.documentType === documentType.value
        ).length > 0
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to check if idea has document type", e)
      );
    }
  }

  async findByIdeaIds(ideaIds: IdeaId[]): Promise<Result<Document[], Error>> {
    try {
      const set = new Set(ideaIds.map((id) => id.value));
      return success(
        this.adapter
          .getAll()
          .filter((i) => set.has(i.ideaId))
          .map(toDomain)
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find documents by idea IDs", e)
      );
    }
  }

  async getDocumentCountsForIdeas(
    ideaIds: IdeaId[]
  ): Promise<Result<Map<string, number>, Error>> {
    try {
      const set = new Set(ideaIds.map((id) => id.value));
      const items = this.adapter.getAll().filter((i) => set.has(i.ideaId));
      const counts = new Map<string, number>();
      items.forEach((i) => {
        counts.set(i.ideaId, (counts.get(i.ideaId) || 0) + 1);
      });
      return success(counts);
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to get document counts for ideas", e)
      );
    }
  }

  async findAll(
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
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
      return failure(new LocalStorageError("Failed to find all documents", e));
    }
  }

  async findByIds(ids: DocumentId[]): Promise<Result<Document[], Error>> {
    try {
      const set = new Set(ids.map((id) => id.value));
      return success(
        this.adapter
          .getAll()
          .filter((i) => set.has(i.id))
          .map(toDomain)
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find documents by IDs", e)
      );
    }
  }

  async findWhere(
    criteria: Record<string, unknown>
  ): Promise<Result<Document[], Error>> {
    try {
      const items = this.adapter.findWhere((i) =>
        Object.entries(criteria).every(
          ([k, v]) => (i as unknown as Record<string, unknown>)[k] === v
        )
      );
      return success(items.map(toDomain));
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find documents where", e)
      );
    }
  }

  async findWhereWithPagination(
    criteria: Record<string, unknown>,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
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
        new LocalStorageError(
          "Failed to find documents where with pagination",
          e
        )
      );
    }
  }
}
