import { Document } from "../entities";
import { DocumentId, IdeaId, UserId, DocumentType } from "../value-objects";
import { ICommandRepository, IQueryRepository } from "./base/IRepository";
import {
  Result,
  PaginatedResult,
  PaginationParams,
} from "../../shared/types/common";

/**
 * Search criteria for document queries
 */
export interface DocumentSearchCriteria {
  userId?: UserId;
  ideaId?: IdeaId;
  documentType?: DocumentType;
  hasTitle?: boolean;
  titleContains?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Sorting options for document queries
 */
export interface DocumentSortOptions {
  field: "createdAt" | "updatedAt" | "title";
  direction: "asc" | "desc";
}

/**
 * Command repository interface for Document write operations
 */
export interface IDocumentCommandRepository
  extends ICommandRepository<Document, DocumentId> {
  /**
   * Save a new document with validation
   */
  save(document: Document): Promise<Result<Document, Error>>;

  /**
   * Delete a document by ID
   * @param id - The ID of the document to delete
   * @param requestingUserId - Optional ID of the user making the request (for authorization)
   */
  delete(
    id: DocumentId,
    requestingUserId?: UserId
  ): Promise<Result<void, Error>>;

  /**
   * Delete all documents for a specific idea
   */
  deleteAllByIdeaId(ideaId: IdeaId): Promise<Result<void, Error>>;

  /**
   * Delete all documents for a specific user
   */
  deleteAllByUserId(userId: UserId): Promise<Result<void, Error>>;
}

/**
 * Query repository interface for Document read operations
 */
export interface IDocumentQueryRepository
  extends IQueryRepository<Document, DocumentId> {
  /**
   * Find document by ID with optional authorization context
   * @param id - Document ID to look up
   * @param requestingUserId - Optional user ID for ownership/authorization checks
   */
  findById(
    id: DocumentId,
    requestingUserId?: UserId
  ): Promise<Result<Document | null, Error>>;

  /**
   * Find documents by idea ID
   * Ordered by created_at DESC
   */
  findByIdeaId(ideaId: IdeaId): Promise<Result<Document[], Error>>;

  /**
   * Find documents by idea ID with pagination
   */
  findByIdeaIdPaginated(
    ideaId: IdeaId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>>;

  /**
   * Find documents by user ID
   * Ordered by created_at DESC
   */
  findByUserId(userId: UserId): Promise<Result<Document[], Error>>;

  /**
   * Find documents by user ID with pagination
   */
  findByUserIdPaginated(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>>;

  /**
   * Find documents by user ID with pagination and additional options
   */
  findByUserIdWithOptions(
    userId: UserId,
    options: {
      page: number;
      limit: number;
      sortBy?: "newest" | "oldest";
      documentType?: "startup_analysis" | "hackathon_analysis" | "all";
    }
  ): Promise<Result<{ documents: Document[]; total: number }, Error>>;

  /**
   * Find documents by document type
   */
  findByType(
    documentType: DocumentType,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>>;

  /**
   * Find documents by user and type
   */
  findByUserAndType(
    userId: UserId,
    documentType: DocumentType,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>>;

  /**
   * Find documents by idea and type
   * Returns all versions ordered by version DESC
   */
  findByIdeaAndType(
    ideaId: IdeaId,
    documentType: DocumentType
  ): Promise<Result<Document[], Error>>;

  /**
   * Find the latest version of a document by idea and type
   * Returns the document with the highest version number
   */
  findLatestVersion(
    ideaId: IdeaId,
    documentType: DocumentType
  ): Promise<Result<Document | null, Error>>;

  /**
   * Find all versions of a document by idea and type
   * Returns all versions ordered by version DESC (newest first)
   */
  findAllVersions(
    ideaId: IdeaId,
    documentType: DocumentType
  ): Promise<Result<Document[], Error>>;

  /**
   * Get document counts by type for a user
   */
  getDocumentCountsByType(userId: UserId): Promise<
    Result<
      {
        total: number;
        startup_analysis: number;
        hackathon_analysis: number;
      },
      Error
    >
  >;

  /**
   * Get document counts by type for an idea
   */
  getDocumentCountsByTypeForIdea(ideaId: IdeaId): Promise<
    Result<
      {
        total: number;
        startup_analysis: number;
        hackathon_analysis: number;
      },
      Error
    >
  >;

  /**
   * Get document count for a specific idea
   */
  getDocumentCountForIdea(ideaId: IdeaId): Promise<Result<number, Error>>;

  /**
   * Find recent documents (created within specified days)
   */
  findRecent(
    userId: UserId,
    days: number,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>>;

  /**
   * Search documents with complex criteria
   */
  search(
    criteria: DocumentSearchCriteria,
    sort: DocumentSortOptions,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>>;

  /**
   * Get document statistics for a user
   */
  getUserDocumentStats(userId: UserId): Promise<
    Result<
      {
        totalCount: number;
        typeCounts: Record<string, number>;
        withTitle: number;
        recentCount: number;
      },
      Error
    >
  >;

  /**
   * Find documents with titles
   */
  findWithTitles(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>>;

  /**
   * Check if an idea has any documents
   */
  hasDocuments(ideaId: IdeaId): Promise<Result<boolean, Error>>;

  /**
   * Check if an idea has a specific document type
   */
  hasDocumentType(
    ideaId: IdeaId,
    documentType: DocumentType
  ): Promise<Result<boolean, Error>>;

  /**
   * Find all documents for multiple ideas (bulk query)
   * Useful for dashboard views showing multiple ideas with their document counts
   */
  findByIdeaIds(ideaIds: IdeaId[]): Promise<Result<Document[], Error>>;

  /**
   * Get document counts for multiple ideas (bulk query)
   * Returns a map of ideaId -> document count
   */
  getDocumentCountsForIdeas(
    ideaIds: IdeaId[]
  ): Promise<Result<Map<string, number>, Error>>;
}

/**
 * Combined Document repository interface
 * Provides both command and query operations
 */
export interface IDocumentRepository
  extends IDocumentCommandRepository,
    IDocumentQueryRepository {
  // Ensure unified overload is available on the combined interface
  findById(
    id: DocumentId,
    requestingUserId?: UserId
  ): Promise<Result<Document | null, Error>>;
}
