import { SupabaseClient } from "@supabase/supabase-js";
import { Document } from "../../../../domain/entities";
import {
  DocumentId,
  IdeaId,
  UserId,
  DocumentType,
} from "../../../../domain/value-objects";
import {
  IDocumentRepository,
  type DocumentSearchCriteria,
  type DocumentSortOptions,
} from "../../../../domain/repositories/IDocumentRepository";
import {
  Result,
  PaginatedResult,
  PaginationParams,
  success,
  failure,
} from "../../../../shared/types/common";
import { Database } from "../../types";
import {
  DatabaseQueryError,
  RecordNotFoundError,
  UniqueConstraintError,
} from "../../errors";
import { DocumentMapper } from "../mappers/DocumentMapper";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Supabase implementation of the Document repository
 * Handles all database operations for Document entities
 */
export class SupabaseDocumentRepository implements IDocumentRepository {
  private readonly tableName = "documents";

  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly mapper: DocumentMapper
  ) {}

  // Command operations (write)

  /**
   * Save a new document with validation
   */
  async save(document: Document): Promise<Result<Document, Error>> {
    try {
      const dao = this.mapper.toDAO(document);

      const { data, error } = await this.client
        .from(this.tableName)
        .insert(dao)
        .select()
        .single();

      if (error) {
        logger.error(LogCategory.DATABASE, "Failed to save document", {
          documentId: document.id.value,
          error: error.message,
        });

        // Check for unique constraint violations
        if (error.code === "23505") {
          return failure(
            new UniqueConstraintError("id", document.id.value, error)
          );
        }

        return failure(
          new DatabaseQueryError(
            `Failed to save document: ${error.message}`,
            error
          )
        );
      }

      if (!data) {
        return failure(
          new DatabaseQueryError("No data returned after saving document")
        );
      }

      const savedDocument = this.mapper.toDomain(
        data as Database["public"]["Tables"]["documents"]["Row"]
      );

      logger.info(LogCategory.DATABASE, "Document saved successfully", {
        documentId: savedDocument.id.value,
      });

      return success(savedDocument);
    } catch (error) {
      logger.error(LogCategory.DATABASE, "Unexpected error saving document", {
        documentId: document.id.value,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error saving document")
      );
    }
  }

  /**
   * Delete a document by ID
   */
  async delete(
    id: DocumentId,
    requestingUserId?: UserId
  ): Promise<Result<void, Error>> {
    try {
      // If authorization is required, first fetch the document to check ownership
      if (requestingUserId) {
        const documentResult = await this.findById(id, requestingUserId);
        if (!documentResult.success) {
          return failure(documentResult.error);
        }
        if (!documentResult.data) {
          return failure(new RecordNotFoundError("Document", id.value));
        }
      }

      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq("id", id.value);

      if (error) {
        logger.error(LogCategory.DATABASE, "Failed to delete document", {
          documentId: id.value,
          error: error.message,
        });

        return failure(
          new DatabaseQueryError(
            `Failed to delete document: ${error.message}`,
            error
          )
        );
      }

      logger.info(LogCategory.DATABASE, "Document deleted successfully", {
        documentId: id.value,
      });

      return success(undefined);
    } catch (error) {
      logger.error(LogCategory.DATABASE, "Unexpected error deleting document", {
        documentId: id.value,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error deleting document")
      );
    }
  }

  /**
   * Delete all documents for a specific idea
   */
  async deleteAllByIdeaId(ideaId: IdeaId): Promise<Result<void, Error>> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq("idea_id", ideaId.value);

      if (error) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to delete all documents for idea",
          {
            ideaId: ideaId.value,
            error: error.message,
          }
        );

        return failure(
          new DatabaseQueryError(
            `Failed to delete all documents for idea: ${error.message}`,
            error
          )
        );
      }

      logger.info(
        LogCategory.DATABASE,
        "All documents deleted successfully for idea",
        {
          ideaId: ideaId.value,
        }
      );

      return success(undefined);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error deleting all documents for idea",
        {
          ideaId: ideaId.value,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error deleting all documents")
      );
    }
  }

  /**
   * Delete all documents for a specific user
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
          "Failed to delete all documents for user",
          {
            userId: userId.value,
            error: error.message,
          }
        );

        return failure(
          new DatabaseQueryError(
            `Failed to delete all documents for user: ${error.message}`,
            error
          )
        );
      }

      logger.info(
        LogCategory.DATABASE,
        "All documents deleted successfully for user",
        {
          userId: userId.value,
        }
      );

      return success(undefined);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error deleting all documents for user",
        {
          userId: userId.value,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error deleting all documents")
      );
    }
  }

  // Query operations (read)

  /**
   * Find document by ID with optional authorization context
   */
  async findById(
    id: DocumentId,
    requestingUserId?: UserId
  ): Promise<Result<Document | null, Error>> {
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

        logger.error(LogCategory.DATABASE, "Failed to find document by ID", {
          documentId: id.value,
          error: error.message,
        });

        return failure(
          new DatabaseQueryError(
            `Failed to find document: ${error.message}`,
            error
          )
        );
      }

      if (!data) {
        return success(null);
      }

      const document = this.mapper.toDomain(
        data as Database["public"]["Tables"]["documents"]["Row"]
      );
      return success(document);
    } catch (error) {
      logger.error(LogCategory.DATABASE, "Unexpected error finding document", {
        documentId: id.value,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error finding document")
      );
    }
  }

  /**
   * Find documents by idea ID
   * Ordered by created_at DESC
   */
  async findByIdeaId(ideaId: IdeaId): Promise<Result<Document[], Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq("idea_id", ideaId.value)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to find documents by idea ID",
          {
            ideaId: ideaId.value,
            error: error.message,
          }
        );

        return failure(
          new DatabaseQueryError(
            `Failed to find documents: ${error.message}`,
            error
          )
        );
      }

      const documents = data
        ? this.mapper.toDomainBatch(
            data as Database["public"]["Tables"]["documents"]["Row"][]
          )
        : [];

      return success(documents);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error finding documents by idea",
        {
          ideaId: ideaId.value,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error finding documents")
      );
    }
  }

  /**
   * Find documents by user ID
   * Ordered by created_at DESC
   */
  async findByUserId(userId: UserId): Promise<Result<Document[], Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId.value)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to find documents by user ID",
          {
            userId: userId.value,
            error: error.message,
          }
        );

        return failure(
          new DatabaseQueryError(
            `Failed to find documents: ${error.message}`,
            error
          )
        );
      }

      const documents = data
        ? this.mapper.toDomainBatch(
            data as Database["public"]["Tables"]["documents"]["Row"][]
          )
        : [];

      return success(documents);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error finding documents by user",
        {
          userId: userId.value,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error finding documents")
      );
    }
  }

  /**
   * Get document count for a specific idea
   */
  async getDocumentCountForIdea(
    ideaId: IdeaId
  ): Promise<Result<number, Error>> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select("*", { count: "exact", head: true })
        .eq("idea_id", ideaId.value);

      if (error) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to get document count for idea",
          {
            ideaId: ideaId.value,
            error: error.message,
          }
        );

        return failure(
          new DatabaseQueryError(
            `Failed to get document count: ${error.message}`,
            error
          )
        );
      }

      return success(count || 0);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error getting document count",
        {
          ideaId: ideaId.value,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error getting document count")
      );
    }
  }

  /**
   * Check if an idea has any documents
   */
  async hasDocuments(ideaId: IdeaId): Promise<Result<boolean, Error>> {
    const countResult = await this.getDocumentCountForIdea(ideaId);
    if (!countResult.success) {
      return failure(countResult.error);
    }
    return success(countResult.data > 0);
  }

  /**
   * Find all documents for multiple ideas (bulk query)
   */
  async findByIdeaIds(ideaIds: IdeaId[]): Promise<Result<Document[], Error>> {
    try {
      if (ideaIds.length === 0) {
        return success([]);
      }

      const ideaIdValues = ideaIds.map((id) => id.value);

      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .in("idea_id", ideaIdValues)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to find documents by idea IDs",
          {
            ideaCount: ideaIds.length,
            error: error.message,
          }
        );

        return failure(
          new DatabaseQueryError(
            `Failed to find documents: ${error.message}`,
            error
          )
        );
      }

      const documents = data
        ? this.mapper.toDomainBatch(
            data as Database["public"]["Tables"]["documents"]["Row"][]
          )
        : [];

      return success(documents);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error finding documents by idea IDs",
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error finding documents")
      );
    }
  }

  /**
   * Get document counts for multiple ideas (bulk query)
   * Returns a map of ideaId -> document count
   */
  async getDocumentCountsForIdeas(
    ideaIds: IdeaId[]
  ): Promise<Result<Map<string, number>, Error>> {
    try {
      if (ideaIds.length === 0) {
        return success(new Map());
      }

      const ideaIdValues = ideaIds.map((id) => id.value);

      const { data, error } = await this.client
        .from(this.tableName)
        .select("idea_id")
        .in("idea_id", ideaIdValues);

      if (error) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to get document counts for ideas",
          {
            ideaCount: ideaIds.length,
            error: error.message,
          }
        );

        return failure(
          new DatabaseQueryError(
            `Failed to get document counts: ${error.message}`,
            error
          )
        );
      }

      // Count documents per idea
      const counts = new Map<string, number>();
      for (const ideaId of ideaIdValues) {
        counts.set(ideaId, 0);
      }

      if (data) {
        for (const row of data) {
          const currentCount = counts.get(row.idea_id) || 0;
          counts.set(row.idea_id, currentCount + 1);
        }
      }

      return success(counts);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error getting document counts",
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error getting document counts")
      );
    }
  }

  // Placeholder implementations for other query methods
  // These would be implemented based on specific requirements

  async findByIdeaIdPaginated(
    _ideaId: IdeaId,
    _params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    // TODO: Implement pagination
    throw new Error("Method not implemented");
  }

  async findByUserIdPaginated(
    _userId: UserId,
    _params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findByUserIdWithOptions(
    _userId: UserId,
    _options: {
      page: number;
      limit: number;
      sortBy?: "newest" | "oldest";
      documentType?: "startup_analysis" | "hackathon_analysis" | "all";
    }
  ): Promise<Result<{ documents: Document[]; total: number }, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findByType(
    _documentType: DocumentType,
    _params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findByUserAndType(
    _userId: UserId,
    _documentType: DocumentType,
    _params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findByIdeaAndType(
    _ideaId: IdeaId,
    _documentType: DocumentType
  ): Promise<Result<Document[], Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async getDocumentCountsByType(
    _userId: UserId
  ): Promise<
    Result<
      {
        total: number;
        startup_analysis: number;
        hackathon_analysis: number;
      },
      Error
    >
  > {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async getDocumentCountsByTypeForIdea(
    _ideaId: IdeaId
  ): Promise<
    Result<
      {
        total: number;
        startup_analysis: number;
        hackathon_analysis: number;
      },
      Error
    >
  > {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findRecent(
    _userId: UserId,
    _days: number,
    _params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async search(
    _criteria: DocumentSearchCriteria,
    _sort: DocumentSortOptions,
    _params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async getUserDocumentStats(
    _userId: UserId
  ): Promise<
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
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async findWithTitles(
    _userId: UserId,
    _params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  async hasDocumentType(
    _ideaId: IdeaId,
    _documentType: DocumentType
  ): Promise<Result<boolean, Error>> {
    // TODO: Implement
    throw new Error("Method not implemented");
  }

  // Base repository interface methods

  /**
   * Update an existing document
   */
  async update(document: Document): Promise<Result<Document, Error>> {
    try {
      const dao = this.mapper.toDAO(document);

      const { data, error } = await this.client
        .from(this.tableName)
        .update(dao)
        .eq("id", document.id.value)
        .select()
        .single();

      if (error) {
        logger.error(LogCategory.DATABASE, "Failed to update document", {
          documentId: document.id.value,
          error: error.message,
        });

        return failure(
          new DatabaseQueryError(
            `Failed to update document: ${error.message}`,
            error
          )
        );
      }

      if (!data) {
        return failure(
          new DatabaseQueryError("No data returned after updating document")
        );
      }

      const updatedDocument = this.mapper.toDomain(
        data as Database["public"]["Tables"]["documents"]["Row"]
      );

      logger.info(LogCategory.DATABASE, "Document updated successfully", {
        documentId: updatedDocument.id.value,
      });

      return success(updatedDocument);
    } catch (error) {
      logger.error(LogCategory.DATABASE, "Unexpected error updating document", {
        documentId: document.id.value,
        error: error instanceof Error ? error.message : String(error),
      });

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error updating document")
      );
    }
  }

  /**
   * Save multiple documents in a transaction
   */
  async saveMany(documents: Document[]): Promise<Result<Document[], Error>> {
    try {
      if (documents.length === 0) {
        return success([]);
      }

      const daos = documents.map((doc) => this.mapper.toDAO(doc));

      const { data, error } = await this.client
        .from(this.tableName)
        .insert(daos)
        .select();

      if (error) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to save multiple documents",
          {
            count: documents.length,
            error: error.message,
          }
        );

        return failure(
          new DatabaseQueryError(
            `Failed to save documents: ${error.message}`,
            error
          )
        );
      }

      if (!data) {
        return failure(
          new DatabaseQueryError("No data returned after saving documents")
        );
      }

      const savedDocuments = this.mapper.toDomainBatch(
        data as Database["public"]["Tables"]["documents"]["Row"][]
      );

      logger.info(LogCategory.DATABASE, "Documents saved successfully", {
        count: savedDocuments.length,
      });

      return success(savedDocuments);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error saving multiple documents",
        {
          count: documents.length,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error saving documents")
      );
    }
  }

  /**
   * Delete multiple documents by their IDs
   */
  async deleteMany(ids: DocumentId[]): Promise<Result<void, Error>> {
    try {
      if (ids.length === 0) {
        return success(undefined);
      }

      const idValues = ids.map((id) => id.value);

      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .in("id", idValues);

      if (error) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to delete multiple documents",
          {
            count: ids.length,
            error: error.message,
          }
        );

        return failure(
          new DatabaseQueryError(
            `Failed to delete documents: ${error.message}`,
            error
          )
        );
      }

      logger.info(LogCategory.DATABASE, "Documents deleted successfully", {
        count: ids.length,
      });

      return success(undefined);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error deleting multiple documents",
        {
          count: ids.length,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error deleting documents")
      );
    }
  }

  /**
   * Check if a document exists by its ID
   */
  async exists(id: DocumentId): Promise<Result<boolean, Error>> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select("*", { count: "exact", head: true })
        .eq("id", id.value);

      if (error) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to check document existence",
          {
            documentId: id.value,
            error: error.message,
          }
        );

        return failure(
          new DatabaseQueryError(
            `Failed to check document existence: ${error.message}`,
            error
          )
        );
      }

      return success((count || 0) > 0);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error checking document existence",
        {
          documentId: id.value,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError(
              "Unexpected error checking document existence"
            )
      );
    }
  }

  /**
   * Get the total count of documents
   */
  async count(): Promise<Result<number, Error>> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select("*", { count: "exact", head: true });

      if (error) {
        logger.error(LogCategory.DATABASE, "Failed to count documents", {
          error: error.message,
        });

        return failure(
          new DatabaseQueryError(
            `Failed to count documents: ${error.message}`,
            error
          )
        );
      }

      return success(count || 0);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error counting documents",
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error counting documents")
      );
    }
  }

  /**
   * Find all documents with pagination
   */
  async findAll(
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;

      const { data, error, count } = await this.client
        .from(this.tableName)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        logger.error(LogCategory.DATABASE, "Failed to find all documents", {
          error: error.message,
        });

        return failure(
          new DatabaseQueryError(
            `Failed to find documents: ${error.message}`,
            error
          )
        );
      }

      const documents = data
        ? this.mapper.toDomainBatch(
            data as Database["public"]["Tables"]["documents"]["Row"][]
          )
        : [];
      const totalPages = Math.ceil((count || 0) / params.limit);

      const result: PaginatedResult<Document> = {
        items: documents,
        total: count || 0,
        page: params.page,
        limit: params.limit,
        totalPages,
        hasNext: params.page < totalPages,
        hasPrevious: params.page > 1,
      };

      return success(result);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error finding all documents",
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error finding documents")
      );
    }
  }

  /**
   * Find documents by multiple IDs
   */
  async findByIds(ids: DocumentId[]): Promise<Result<Document[], Error>> {
    try {
      if (ids.length === 0) {
        return success([]);
      }

      const idValues = ids.map((id) => id.value);

      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .in("id", idValues);

      if (error) {
        logger.error(LogCategory.DATABASE, "Failed to find documents by IDs", {
          count: ids.length,
          error: error.message,
        });

        return failure(
          new DatabaseQueryError(
            `Failed to find documents: ${error.message}`,
            error
          )
        );
      }

      const documents = data
        ? this.mapper.toDomainBatch(
            data as Database["public"]["Tables"]["documents"]["Row"][]
          )
        : [];

      return success(documents);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error finding documents by IDs",
        {
          count: ids.length,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error finding documents")
      );
    }
  }

  /**
   * Find documents matching specific criteria
   */
  async findWhere(
    criteria: Record<string, unknown>
  ): Promise<Result<Document[], Error>> {
    try {
      let query = this.client.from(this.tableName).select("*");

      // Apply criteria filters
      for (const [key, value] of Object.entries(criteria)) {
        query = query.eq(key, value as string | number | boolean);
      }

      const { data, error } = await query;

      if (error) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to find documents by criteria",
          {
            criteria,
            error: error.message,
          }
        );

        return failure(
          new DatabaseQueryError(
            `Failed to find documents: ${error.message}`,
            error
          )
        );
      }

      const documents = data
        ? this.mapper.toDomainBatch(
            data as Database["public"]["Tables"]["documents"]["Row"][]
          )
        : [];

      return success(documents);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error finding documents by criteria",
        {
          criteria,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error finding documents")
      );
    }
  }

  /**
   * Find documents with pagination and criteria
   */
  async findWhereWithPagination(
    criteria: Record<string, unknown>,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<Document>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;

      let query = this.client
        .from(this.tableName)
        .select("*", { count: "exact" });

      // Apply criteria filters
      for (const [key, value] of Object.entries(criteria)) {
        query = query.eq(key, value as string | number | boolean);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to find documents by criteria with pagination",
          {
            criteria,
            error: error.message,
          }
        );

        return failure(
          new DatabaseQueryError(
            `Failed to find documents: ${error.message}`,
            error
          )
        );
      }

      const documents = data
        ? this.mapper.toDomainBatch(
            data as Database["public"]["Tables"]["documents"]["Row"][]
          )
        : [];
      const totalPages = Math.ceil((count || 0) / params.limit);

      const result: PaginatedResult<Document> = {
        items: documents,
        total: count || 0,
        page: params.page,
        limit: params.limit,
        totalPages,
        hasNext: params.page < totalPages,
        hasPrevious: params.page > 1,
      };

      return success(result);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error finding documents by criteria with pagination",
        {
          criteria,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      return failure(
        error instanceof Error
          ? error
          : new DatabaseQueryError("Unexpected error finding documents")
      );
    }
  }
}
