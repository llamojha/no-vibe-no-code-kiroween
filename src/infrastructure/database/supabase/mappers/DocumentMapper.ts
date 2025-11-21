import { Document } from "../../../../domain/entities";
import {
  DocumentId,
  IdeaId,
  UserId,
  DocumentType,
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
  content: any;
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
      content: document.getContent(), // Already returns a deep copy
      created_at: document.createdAt.toISOString(),
      updated_at: document.updatedAt.toISOString(),
    };
  }

  /**
   * Convert DAO from database to Document domain entity
   */
  toDomain(dao: DocumentDAO): Document {
    return Document.reconstruct({
      id: DocumentId.reconstruct(dao.id),
      ideaId: IdeaId.reconstruct(dao.idea_id),
      userId: UserId.reconstruct(dao.user_id),
      documentType: DocumentType.fromString(dao.document_type),
      title: dao.title,
      content: this.parseContent(dao.content),
      createdAt: new Date(dao.created_at || Date.now()),
      updatedAt: new Date(dao.updated_at || Date.now()),
    });
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
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }

  /**
   * Parse JSONB content from database
   * Handles various content formats and ensures proper structure
   */
  private parseContent(content: any): any {
    // If content is already an object, return it
    if (typeof content === "object" && content !== null) {
      return content;
    }

    // If content is a string, try to parse it as JSON
    if (typeof content === "string") {
      try {
        return JSON.parse(content);
      } catch (error) {
        // If parsing fails, return as-is wrapped in an object
        return { raw: content };
      }
    }

    // Fallback for unexpected types
    return content;
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
