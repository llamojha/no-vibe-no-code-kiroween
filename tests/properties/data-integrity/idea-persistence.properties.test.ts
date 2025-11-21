/**
 * Property tests for Idea persistence
 * Tests status and metadata persistence properties
 *
 * Feature: idea-panel
 * Requirements: 3.3, 4.3, 5.4
 */

import { describe, it, expect, beforeEach } from "vitest";
import { faker } from "@faker-js/faker";
import {
  generateIdea,
  generateUserId,
  generateProjectStatus,
} from "../utils/generators";
import { forAll } from "../utils/property-helpers";
import { Idea } from "@/src/domain/entities/Idea";
import { IdeaMapper } from "@/src/infrastructure/database/supabase/mappers/IdeaMapper";
import { ProjectStatus } from "@/src/domain/value-objects/ProjectStatus";
import { IdeaSource } from "@/src/domain/value-objects/IdeaSource";

describe("Property: Idea Persistence", () => {
  const mapper = new IdeaMapper();

  describe("Feature: idea-panel, Property: Status updates are persisted", () => {
    /**
     * Property: For any idea and any valid status transition, updating the status
     * and persisting through the repository should preserve the new status
     * Validates: Requirements 3.3
     *
     * This property ensures that status updates are correctly persisted to the database
     * and can be retrieved without data loss. This is critical for project workflow tracking.
     */
    it("should persist status updates through DAO conversion", () => {
      forAll(
        () => {
          const idea = generateIdea({ projectStatus: ProjectStatus.IDEA });
          const newStatus = faker.helpers.arrayElement([
            ProjectStatus.IN_PROGRESS,
            ProjectStatus.COMPLETED,
            ProjectStatus.ARCHIVED,
          ]);
          return { idea, newStatus };
        },
        ({ idea, newStatus }) => {
          // Update status
          idea.updateStatus(newStatus);

          // Simulate persistence: entity -> DAO -> entity
          const dao = mapper.toDAO(idea);
          const reconstructed = mapper.toDomain(dao);

          // Status should be preserved
          return reconstructed.projectStatus.equals(newStatus);
        },
        100
      );
    });

    it("should persist status from IDEA to IN_PROGRESS", () => {
      forAll(
        () => generateIdea({ projectStatus: ProjectStatus.IDEA }),
        (idea) => {
          // Update to IN_PROGRESS
          idea.updateStatus(ProjectStatus.IN_PROGRESS);

          // Persist and reconstruct
          const dao = mapper.toDAO(idea);
          const reconstructed = mapper.toDomain(dao);

          return (
            reconstructed.projectStatus.equals(ProjectStatus.IN_PROGRESS) &&
            reconstructed.projectStatus.isInProgress()
          );
        },
        100
      );
    });

    it("should persist status from IN_PROGRESS to COMPLETED", () => {
      forAll(
        () => generateIdea({ projectStatus: ProjectStatus.IN_PROGRESS }),
        (idea) => {
          // Update to COMPLETED
          idea.updateStatus(ProjectStatus.COMPLETED);

          // Persist and reconstruct
          const dao = mapper.toDAO(idea);
          const reconstructed = mapper.toDomain(dao);

          return (
            reconstructed.projectStatus.equals(ProjectStatus.COMPLETED) &&
            reconstructed.projectStatus.isCompleted()
          );
        },
        100
      );
    });

    it("should persist status to ARCHIVED from any state", () => {
      forAll(
        () => {
          const initialStatus = faker.helpers.arrayElement([
            ProjectStatus.IDEA,
            ProjectStatus.IN_PROGRESS,
            ProjectStatus.COMPLETED,
          ]);
          return generateIdea({ projectStatus: initialStatus });
        },
        (idea) => {
          // Archive the idea
          idea.updateStatus(ProjectStatus.ARCHIVED);

          // Persist and reconstruct
          const dao = mapper.toDAO(idea);
          const reconstructed = mapper.toDomain(dao);

          return (
            reconstructed.projectStatus.equals(ProjectStatus.ARCHIVED) &&
            reconstructed.projectStatus.isArchived()
          );
        },
        100
      );
    });

    it("should preserve status through multiple updates", () => {
      forAll(
        () => generateIdea({ projectStatus: ProjectStatus.IDEA }),
        (idea) => {
          // Perform multiple status updates
          idea.updateStatus(ProjectStatus.IN_PROGRESS);

          // Persist after first update
          let dao = mapper.toDAO(idea);
          let reconstructed = mapper.toDomain(dao);
          const firstCheck = reconstructed.projectStatus.equals(
            ProjectStatus.IN_PROGRESS
          );

          // Update again
          reconstructed.updateStatus(ProjectStatus.COMPLETED);

          // Persist after second update
          dao = mapper.toDAO(reconstructed);
          reconstructed = mapper.toDomain(dao);
          const secondCheck = reconstructed.projectStatus.equals(
            ProjectStatus.COMPLETED
          );

          return firstCheck && secondCheck;
        },
        50
      );
    });

    it("should preserve status value in DAO structure", () => {
      forAll(
        () => {
          const status = generateProjectStatus();
          return generateIdea({ projectStatus: status });
        },
        (idea) => {
          const dao = mapper.toDAO(idea);

          // DAO should have correct status value
          const validStatuses = [
            "idea",
            "in_progress",
            "completed",
            "archived",
          ];
          const statusValid = validStatuses.includes(dao.project_status);

          // DAO status should match entity status
          const statusMatch = dao.project_status === idea.projectStatus.value;

          return statusValid && statusMatch;
        },
        100
      );
    });

    it("should handle status persistence with other field updates", () => {
      forAll(
        () => ({
          idea: generateIdea({ projectStatus: ProjectStatus.IDEA }),
          newNotes: faker.lorem.paragraph(),
          newTag: faker.lorem.word(),
        }),
        ({ idea, newNotes, newTag }) => {
          // Update status along with other fields
          idea.updateStatus(ProjectStatus.IN_PROGRESS);
          idea.updateNotes(newNotes);
          idea.addTag(newTag);

          // Persist and reconstruct
          const dao = mapper.toDAO(idea);
          const reconstructed = mapper.toDomain(dao);

          // All updates should be preserved
          const statusMatch = reconstructed.projectStatus.equals(
            ProjectStatus.IN_PROGRESS
          );
          const notesMatch = reconstructed.notes === newNotes;
          const tagMatch = reconstructed.getTags().includes(newTag);

          return statusMatch && notesMatch && tagMatch;
        },
        50
      );
    });

    it("should maintain status consistency across DAO round-trip", () => {
      forAll(
        generateIdea,
        (idea) => {
          // Convert entity -> DAO -> entity -> DAO
          const dao1 = mapper.toDAO(idea);
          const entity = mapper.toDomain(dao1);
          const dao2 = mapper.toDAO(entity);

          // Both DAOs should have identical status
          return dao1.project_status === dao2.project_status;
        },
        100
      );
    });

    it("should preserve status through DTO conversion", () => {
      forAll(
        generateIdea,
        (idea) => {
          const dto = mapper.toDTO(idea);

          // DTO should have correct status
          const validStatuses = [
            "idea",
            "in_progress",
            "completed",
            "archived",
          ];
          const statusValid = validStatuses.includes(dto.projectStatus);

          // DTO status should match entity status
          const statusMatch = dto.projectStatus === idea.projectStatus.value;

          return statusValid && statusMatch;
        },
        100
      );
    });

    it("should handle all valid status values", () => {
      const allStatuses = [
        ProjectStatus.IDEA,
        ProjectStatus.IN_PROGRESS,
        ProjectStatus.COMPLETED,
        ProjectStatus.ARCHIVED,
      ];

      return allStatuses.every((status) => {
        const idea = generateIdea({ projectStatus: status });

        // Persist and reconstruct
        const dao = mapper.toDAO(idea);
        const reconstructed = mapper.toDomain(dao);

        return reconstructed.projectStatus.equals(status);
      });
    });

    it("should preserve status when idea has no notes or tags", () => {
      forAll(
        () =>
          generateIdea({
            projectStatus: generateProjectStatus(),
            notes: "",
            tags: [],
          }),
        (idea) => {
          const originalStatus = idea.projectStatus;

          // Persist and reconstruct
          const dao = mapper.toDAO(idea);
          const reconstructed = mapper.toDomain(dao);

          return reconstructed.projectStatus.equals(originalStatus);
        },
        100
      );
    });

    it("should preserve status when idea has maximum metadata", () => {
      forAll(
        () => {
          const tags = Array.from({ length: 50 }, (_, i) => `tag-${i}`);
          const notes = "a".repeat(9999); // Near maximum length
          return generateIdea({
            projectStatus: generateProjectStatus(),
            notes,
            tags,
          });
        },
        (idea) => {
          const originalStatus = idea.projectStatus;

          // Persist and reconstruct
          const dao = mapper.toDAO(idea);
          const reconstructed = mapper.toDomain(dao);

          return reconstructed.projectStatus.equals(originalStatus);
        },
        50
      );
    });

    it("should preserve status for both manual and frankenstein sources", () => {
      forAll(
        () => {
          const source = faker.helpers.arrayElement([
            IdeaSource.MANUAL,
            IdeaSource.FRANKENSTEIN,
          ]);
          const status = generateProjectStatus();
          return generateIdea({ source, projectStatus: status });
        },
        (idea) => {
          const originalStatus = idea.projectStatus;

          // Persist and reconstruct
          const dao = mapper.toDAO(idea);
          const reconstructed = mapper.toDomain(dao);

          return reconstructed.projectStatus.equals(originalStatus);
        },
        100
      );
    });

    it("should maintain status type safety through conversion", () => {
      forAll(
        generateIdea,
        (idea) => {
          const dao = mapper.toDAO(idea);

          // DAO status should be one of the valid string literals
          const validStatuses: Array<
            "idea" | "in_progress" | "completed" | "archived"
          > = ["idea", "in_progress", "completed", "archived"];

          return validStatuses.includes(dao.project_status);
        },
        100
      );
    });
  });
});
