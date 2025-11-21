import { Idea } from "../../../../domain/entities";
import {
  IdeaId,
  UserId,
  IdeaSource,
  ProjectStatus,
} from "../../../../domain/value-objects";
import { IdeaDAO } from "../../types/dao";

/**
 * Data Transfer Object for Idea API operations
 */
export interface IdeaDTO {
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

/**
 * Mapper class for converting between Idea domain entities, DAOs, and DTOs
 * Handles structured fields (notes, tags) directly
 */
export class IdeaMapper {
  /**
   * Convert Idea domain entity to DAO for database persistence
   */
  toDAO(idea: Idea): IdeaDAO {
    return {
      id: idea.id.value,
      user_id: idea.userId.value,
      idea_text: idea.ideaText,
      source: idea.source.value as "manual" | "frankenstein",
      project_status: idea.projectStatus.value as
        | "idea"
        | "in_progress"
        | "completed"
        | "archived",
      notes: idea.notes,
      tags: [...idea.getTags()],
      created_at: idea.createdAt.toISOString(),
      updated_at: idea.updatedAt.toISOString(),
    };
  }

  /**
   * Convert DAO from database to Idea domain entity
   */
  toDomain(dao: IdeaDAO): Idea {
    return Idea.reconstruct({
      id: IdeaId.reconstruct(dao.id),
      userId: UserId.reconstruct(dao.user_id),
      ideaText: dao.idea_text,
      source: IdeaSource.fromString(dao.source),
      projectStatus: ProjectStatus.fromString(dao.project_status),
      notes: dao.notes,
      tags: [...dao.tags],
      createdAt: new Date(dao.created_at || Date.now()),
      updatedAt: new Date(dao.updated_at || Date.now()),
    });
  }

  /**
   * Convert Idea domain entity to DTO for API responses
   */
  toDTO(idea: Idea): IdeaDTO {
    return {
      id: idea.id.value,
      userId: idea.userId.value,
      ideaText: idea.ideaText,
      source: idea.source.value as "manual" | "frankenstein",
      projectStatus: idea.projectStatus.value as
        | "idea"
        | "in_progress"
        | "completed"
        | "archived",
      notes: idea.notes,
      tags: [...idea.getTags()],
      createdAt: idea.createdAt.toISOString(),
      updatedAt: idea.updatedAt.toISOString(),
    };
  }

  /**
   * Batch convert multiple DAOs to domain entities
   */
  toDomainBatch(daos: IdeaDAO[]): Idea[] {
    return daos.map((dao) => this.toDomain(dao));
  }

  /**
   * Batch convert multiple domain entities to DTOs
   */
  toDTOBatch(ideas: Idea[]): IdeaDTO[] {
    return ideas.map((idea) => this.toDTO(idea));
  }

  /**
   * Batch convert multiple domain entities to DAOs
   */
  toDAOBatch(ideas: Idea[]): IdeaDAO[] {
    return ideas.map((idea) => this.toDAO(idea));
  }
}
