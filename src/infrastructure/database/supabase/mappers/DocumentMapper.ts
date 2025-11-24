import { Document, type DocumentContent } from "../../../../domain/entities";
import {
  DocumentId,
  IdeaId,
  UserId,
  DocumentType,
  DocumentVersion,
} from "../../../../domain/value-objects";
import { DocumentDAO } from "../../types/dao";

/**
 * Data Transfer Object for Document API operations
 */
export interface DocumentDTO {
  id: string;
  ideaId: string;
  userId: string;
  documentType: "startup_analysis" | "hackathon_analysis";
  title: string | null;
  content: DocumentContent;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mapper class for converting between Document domain entities, DAOs, and DTOs
 * Handles JSONB content field
 */
export class DocumentMapper {
  /**
   * Convert Document domain entity to DAO for database persistence
   */
  toDAO(document: Document): DocumentDAO {
    return {
      id: document.id.value,
      idea_id: document.ideaId.value,
      user_id: document.userId.value,
      document_type: document.documentType.value as
        | "startup_analysis"
        | "hackathon_analysis",
      title: document.title,
      content: document.getContent() as DocumentDAO["content"], // Already returns a deep copy
      version: document.version.value,
      created_at: document.createdAt.toISOString(),
      updated_at: document.updatedAt.toISOString(),
    };
  }

  /**
   * Convert DAO from database to Document domain entity
   */
  toDomain(dao: DocumentDAO): Document {
    try {
      return Document.reconstruct({
        id: DocumentId.reconstruct(dao.id),
        ideaId: IdeaId.reconstruct(dao.idea_id),
        userId: UserId.reconstruct(dao.user_id),
        documentType: DocumentType.fromString(dao.document_type),
        title: dao.title,
        content: this.parseContent(dao.content),
        version: DocumentVersion.create(dao.version || 1), // Default to version 1 for existing documents
        createdAt: new Date(dao.created_at || Date.now()),
        updatedAt: new Date(dao.updated_at || Date.now()),
      });
    } catch (error) {
      // Add context about which idea/document failed
      const enhancedError = new Error(
        `Failed to reconstruct document (ID: ${dao.id}, Idea ID: ${
          dao.idea_id
        }): ${error instanceof Error ? error.message : String(error)}`
      );
      enhancedError.cause = error;
      throw enhancedError;
    }
  }

  /**
   * Convert Document domain entity to DTO for API responses
   */
  toDTO(document: Document): DocumentDTO {
    return {
      id: document.id.value,
      ideaId: document.ideaId.value,
      userId: document.userId.value,
      documentType: document.documentType.value as
        | "startup_analysis"
        | "hackathon_analysis",
      title: document.title,
      content: document.getContent(),
      version: document.version.value,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }

  /**
   * Parse JSONB content from database
   * Handles various content formats and ensures proper structure
   */
  private parseContent(content: unknown): DocumentContent {
    // If content is already an object, return it
    if (typeof content === "object" && content !== null) {
      return content as DocumentContent;
    }

    // If content is a string, try to parse it as JSON
    if (typeof content === "string") {
      try {
        return JSON.parse(content) as DocumentContent;
      } catch (_error) {
        // If parsing fails, return as-is wrapped in an object
        return { raw: content } as DocumentContent;
      }
    }

    // Fallback for unexpected types
    return { raw: content } as DocumentContent;
  }

  /**
   * Batch convert multiple DAOs to domain entities
   */
  toDomainBatch(daos: DocumentDAO[]): Document[] {
    return daos.map((dao) => this.toDomain(dao));
  }

  /**
   * Batch convert multiple domain entities to DTOs
   */
  toDTOBatch(documents: Document[]): DocumentDTO[] {
    return documents.map((document) => this.toDTO(document));
  }

  /**
   * Batch convert multiple domain entities to DAOs
   */
  toDAOBatch(documents: Document[]): DocumentDAO[] {
    return documents.map((document) => this.toDAO(document));
  }
}
