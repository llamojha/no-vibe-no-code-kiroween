/**
 * Property tests for Idea Metadata Persistence
 * Tests that notes and tags are correctly persisted through repository operations
 *
 * Feature: idea-panel
 * Properties:
 * - Notes are persisted (Validates: Requirements 4.3)
 * - Tags are persisted (Validates: Requirements 5.4)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateIdea, generateUserId } from "../utils/generators";
import { forAll } from "../utils/property-helpers";
import { Idea } from "@/src/domain/entities/Idea";
import { faker } from "@faker-js/faker";
import { success, failure } from "@/src/shared/types/common";
import { UniqueConstraintError, RecordNotFoundError } from "@/src/infrastructure/database/errors";
import { IdeaId } from "@/src/domain/value-objects";
import type { Result } from "@/src/shared/types/common";
import type { IIdeaRepository } from "@/src/domain/repositories/IIdeaRepository";

describe("Property: Idea Metadata Persistence", () => {
  class InMemoryIdeaRepository implements Pick<IIdeaRepository, "save" | "update" | "findById" | "delete"> {
    private store = new Map<string, Idea>();

    async save(idea: Idea): Promise<Result<Idea, Error>> {
      if (this.store.has(idea.id.value)) {
        return failure(new UniqueConstraintError("id", idea.id.value));
      }
      this.store.set(idea.id.value, idea);
      return success(idea);
    }

    async update(idea: Idea): Promise<Result<Idea, Error>> {
      if (!this.store.has(idea.id.value)) {
        return failure(new RecordNotFoundError("Idea", idea.id.value));
      }
      this.store.set(idea.id.value, idea);
      return success(idea);
    }

    async findById(
      id: IdeaId,
      _requestingUserId?: unknown
    ): Promise<Result<Idea | null, Error>> {
      return success(this.store.get(id.value) ?? null);
    }

    async delete(id: IdeaId): Promise<Result<void, Error>> {
      this.store.delete(id.value);
      return success(undefined);
    }

    clear(): void {
      this.store.clear();
    }
  }

  let repository: InMemoryIdeaRepository;
  let createdIdeaIds: string[] = [];

  beforeEach(() => {
    repository = new InMemoryIdeaRepository();
    createdIdeaIds = [];
  });

  afterEach(async () => {
    repository.clear();
    createdIdeaIds = [];
  });

  describe("Property: Notes are persisted", () => {
    /**
     * Property: For any idea with notes, saving and retrieving should preserve the notes
     * Validates: Requirements 4.3
     *
     * Feature: idea-panel, Property: Notes are persisted
     */
    it("should persist notes through save and retrieve operations", async () => {
      await forAll(
        () => {
          // Generate notes of varying lengths
          const notesLength = faker.number.int({ min: 0, max: 5000 });
          const notes =
            notesLength > 0
              ? faker.lorem.paragraphs(Math.ceil(notesLength / 200))
              : "";

          return generateIdea({ notes });
        },
        async (idea: Idea) => {
          // Act: Save the idea
          const saveResult = await repository.save(idea);

          if (!saveResult.success) {
            throw new Error(`Failed to save idea: ${saveResult.error.message}`);
          }

          createdIdeaIds.push(idea.id.value);

          // Retrieve the idea
          const retrieveResult = await repository.findById(idea.id);

          if (!retrieveResult.success || !retrieveResult.data) {
            throw new Error(
              `Failed to retrieve idea: ${
                retrieveResult.success
                  ? "Not found"
                  : retrieveResult.error.message
              }`
            );
          }

          const retrievedIdea = retrieveResult.data;

          // Assert: Notes should be preserved
          return retrievedIdea.notes === idea.notes;
        },
        50 // Run 50 iterations
      );
    });

    /**
     * Property: For any idea, updating notes should persist the new notes
     * Validates: Requirements 4.3, 4.4
     *
     * Feature: idea-panel, Property: Notes updates are persisted
     */
    it("should persist notes updates through update operations", async () => {
      await forAll(
        () => {
          const idea = generateIdea({ notes: faker.lorem.paragraph() });
          const newNotes = faker.lorem.paragraphs(2);
          return { idea, newNotes };
        },
        async ({ idea, newNotes }) => {
          // Arrange: Save the initial idea
          const saveResult = await repository.save(idea);

          if (!saveResult.success) {
            throw new Error(`Failed to save idea: ${saveResult.error.message}`);
          }

          createdIdeaIds.push(idea.id.value);

          // Act: Update notes
          idea.updateNotes(newNotes);

          const updateResult = await repository.update(idea);

          if (!updateResult.success) {
            throw new Error(
              `Failed to update idea: ${updateResult.error.message}`
            );
          }

          // Retrieve the updated idea
          const retrieveResult = await repository.findById(idea.id);

          if (!retrieveResult.success || !retrieveResult.data) {
            throw new Error(
              `Failed to retrieve idea: ${
                retrieveResult.success
                  ? "Not found"
                  : retrieveResult.error.message
              }`
            );
          }

          const retrievedIdea = retrieveResult.data;

          // Assert: Updated notes should be persisted
          return retrievedIdea.notes === newNotes;
        },
        50 // Run 50 iterations
      );
    });

    /**
     * Property: Empty notes should be persisted as empty string
     * Validates: Requirements 4.3
     *
     * Feature: idea-panel, Property: Empty notes are persisted
     */
    it("should persist empty notes correctly", async () => {
      await forAll(
        () => generateIdea({ notes: "" }),
        async (idea: Idea) => {
          // Act: Save the idea with empty notes
          const saveResult = await repository.save(idea);

          if (!saveResult.success) {
            throw new Error(`Failed to save idea: ${saveResult.error.message}`);
          }

          createdIdeaIds.push(idea.id.value);

          // Retrieve the idea
          const retrieveResult = await repository.findById(idea.id);

          if (!retrieveResult.success || !retrieveResult.data) {
            throw new Error(
              `Failed to retrieve idea: ${
                retrieveResult.success
                  ? "Not found"
                  : retrieveResult.error.message
              }`
            );
          }

          const retrievedIdea = retrieveResult.data;

          // Assert: Empty notes should be preserved as empty string
          return retrievedIdea.notes === "" && !retrievedIdea.hasNotes();
        },
        50 // Run 50 iterations
      );
    });
  });

  describe("Property: Tags are persisted", () => {
    /**
     * Property: For any idea with tags, saving and retrieving should preserve all tags
     * Validates: Requirements 5.4
     *
     * Feature: idea-panel, Property: Tags are persisted
     */
    it("should persist tags through save and retrieve operations", async () => {
      await forAll(
        () => {
          // Generate tags of varying counts
          const tagCount = faker.number.int({ min: 0, max: 10 });
          const tags = faker.helpers.arrayElements(
            [
              "startup",
              "tech",
              "mvp",
              "saas",
              "mobile",
              "web",
              "ai",
              "blockchain",
              "fintech",
              "healthtech",
              "edtech",
              "ecommerce",
              "b2b",
              "b2c",
              "enterprise",
            ],
            tagCount
          );

          return generateIdea({ tags });
        },
        async (idea: Idea) => {
          // Act: Save the idea
          const saveResult = await repository.save(idea);

          if (!saveResult.success) {
            throw new Error(`Failed to save idea: ${saveResult.error.message}`);
          }

          createdIdeaIds.push(idea.id.value);

          // Retrieve the idea
          const retrieveResult = await repository.findById(idea.id);

          if (!retrieveResult.success || !retrieveResult.data) {
            throw new Error(
              `Failed to retrieve idea: ${
                retrieveResult.success
                  ? "Not found"
                  : retrieveResult.error.message
              }`
            );
          }

          const retrievedIdea = retrieveResult.data;

          // Assert: Tags should be preserved (order and content)
          const originalTags = [...idea.getTags()].sort();
          const retrievedTags = [...retrievedIdea.getTags()].sort();

          return JSON.stringify(originalTags) === JSON.stringify(retrievedTags);
        },
        50 // Run 50 iterations
      );
    });

    /**
     * Property: For any idea, adding tags should persist the new tags
     * Validates: Requirements 5.2, 5.4
     *
     * Feature: idea-panel, Property: Tag additions are persisted
     */
    it("should persist tag additions through update operations", async () => {
      await forAll(
        () => {
          const idea = generateIdea({ tags: ["startup", "tech"] });
          const newTag = faker.helpers.arrayElement([
            "mvp",
            "saas",
            "mobile",
            "web",
            "ai",
          ]);
          return { idea, newTag };
        },
        async ({ idea, newTag }) => {
          // Arrange: Save the initial idea
          const saveResult = await repository.save(idea);

          if (!saveResult.success) {
            throw new Error(`Failed to save idea: ${saveResult.error.message}`);
          }

          createdIdeaIds.push(idea.id.value);

          // Act: Add a new tag
          idea.addTag(newTag);

          const updateResult = await repository.update(idea);

          if (!updateResult.success) {
            throw new Error(
              `Failed to update idea: ${updateResult.error.message}`
            );
          }

          // Retrieve the updated idea
          const retrieveResult = await repository.findById(idea.id);

          if (!retrieveResult.success || !retrieveResult.data) {
            throw new Error(
              `Failed to retrieve idea: ${
                retrieveResult.success
                  ? "Not found"
                  : retrieveResult.error.message
              }`
            );
          }

          const retrievedIdea = retrieveResult.data;

          // Assert: New tag should be persisted
          const retrievedTags = retrievedIdea.getTags();
          return retrievedTags.includes(newTag);
        },
        50 // Run 50 iterations
      );
    });

    /**
     * Property: For any idea, removing tags should persist the removal
     * Validates: Requirements 5.3, 5.4
     *
     * Feature: idea-panel, Property: Tag removals are persisted
     */
    it("should persist tag removals through update operations", async () => {
      await forAll(
        () => {
          const tags = ["startup", "tech", "mvp", "saas"];
          const idea = generateIdea({ tags });
          const tagToRemove = faker.helpers.arrayElement(tags);
          return { idea, tagToRemove };
        },
        async ({ idea, tagToRemove }) => {
          // Arrange: Save the initial idea
          const saveResult = await repository.save(idea);

          if (!saveResult.success) {
            throw new Error(`Failed to save idea: ${saveResult.error.message}`);
          }

          createdIdeaIds.push(idea.id.value);

          // Act: Remove a tag
          idea.removeTag(tagToRemove);

          const updateResult = await repository.update(idea);

          if (!updateResult.success) {
            throw new Error(
              `Failed to update idea: ${updateResult.error.message}`
            );
          }

          // Retrieve the updated idea
          const retrieveResult = await repository.findById(idea.id);

          if (!retrieveResult.success || !retrieveResult.data) {
            throw new Error(
              `Failed to retrieve idea: ${
                retrieveResult.success
                  ? "Not found"
                  : retrieveResult.error.message
              }`
            );
          }

          const retrievedIdea = retrieveResult.data;

          // Assert: Removed tag should not be present
          const retrievedTags = retrievedIdea.getTags();
          return !retrievedTags.includes(tagToRemove);
        },
        50 // Run 50 iterations
      );
    });

    /**
     * Property: Empty tags array should be persisted correctly
     * Validates: Requirements 5.4
     *
     * Feature: idea-panel, Property: Empty tags are persisted
     */
    it("should persist empty tags array correctly", async () => {
      await forAll(
        () => generateIdea({ tags: [] }),
        async (idea: Idea) => {
          // Act: Save the idea with no tags
          const saveResult = await repository.save(idea);

          if (!saveResult.success) {
            throw new Error(`Failed to save idea: ${saveResult.error.message}`);
          }

          createdIdeaIds.push(idea.id.value);

          // Retrieve the idea
          const retrieveResult = await repository.findById(idea.id);

          if (!retrieveResult.success || !retrieveResult.data) {
            throw new Error(
              `Failed to retrieve idea: ${
                retrieveResult.success
                  ? "Not found"
                  : retrieveResult.error.message
              }`
            );
          }

          const retrievedIdea = retrieveResult.data;

          // Assert: Empty tags should be preserved
          return (
            retrievedIdea.getTags().length === 0 && !retrievedIdea.hasTags()
          );
        },
        50 // Run 50 iterations
      );
    });

    /**
     * Property: Tag order should be preserved through persistence
     * Validates: Requirements 5.4
     *
     * Feature: idea-panel, Property: Tag order is preserved
     */
    it("should preserve tag order through save and retrieve operations", async () => {
      await forAll(
        () => {
          // Generate tags in a specific order
          const tags = faker.helpers.shuffle([
            "startup",
            "tech",
            "mvp",
            "saas",
            "mobile",
          ]);
          return generateIdea({ tags });
        },
        async (idea: Idea) => {
          // Act: Save the idea
          const saveResult = await repository.save(idea);

          if (!saveResult.success) {
            throw new Error(`Failed to save idea: ${saveResult.error.message}`);
          }

          createdIdeaIds.push(idea.id.value);

          // Retrieve the idea
          const retrieveResult = await repository.findById(idea.id);

          if (!retrieveResult.success || !retrieveResult.data) {
            throw new Error(
              `Failed to retrieve idea: ${
                retrieveResult.success
                  ? "Not found"
                  : retrieveResult.error.message
              }`
            );
          }

          const retrievedIdea = retrieveResult.data;

          // Assert: Tag order should be preserved
          const originalTags = [...idea.getTags()];
          const retrievedTags = [...retrievedIdea.getTags()];

          return JSON.stringify(originalTags) === JSON.stringify(retrievedTags);
        },
        50 // Run 50 iterations
      );
    });
  });

  describe("Property: Combined metadata persistence", () => {
    /**
     * Property: For any idea, both notes and tags should be persisted together
     * Validates: Requirements 4.3, 5.4
     *
     * Feature: idea-panel, Property: Notes and tags are persisted together
     */
    it("should persist both notes and tags through save and retrieve operations", async () => {
      await forAll(
        () => {
          const notes = faker.lorem.paragraphs(2);
          const tags = faker.helpers.arrayElements(
            ["startup", "tech", "mvp", "saas", "mobile", "web"],
            { min: 1, max: 5 }
          );
          return generateIdea({ notes, tags });
        },
        async (idea: Idea) => {
          // Act: Save the idea
          const saveResult = await repository.save(idea);

          if (!saveResult.success) {
            throw new Error(`Failed to save idea: ${saveResult.error.message}`);
          }

          createdIdeaIds.push(idea.id.value);

          // Retrieve the idea
          const retrieveResult = await repository.findById(idea.id);

          if (!retrieveResult.success || !retrieveResult.data) {
            throw new Error(
              `Failed to retrieve idea: ${
                retrieveResult.success
                  ? "Not found"
                  : retrieveResult.error.message
              }`
            );
          }

          const retrievedIdea = retrieveResult.data;

          // Assert: Both notes and tags should be preserved
          const notesMatch = retrievedIdea.notes === idea.notes;
          const originalTags = [...idea.getTags()].sort();
          const retrievedTags = [...retrievedIdea.getTags()].sort();
          const tagsMatch =
            JSON.stringify(originalTags) === JSON.stringify(retrievedTags);

          return notesMatch && tagsMatch;
        },
        50 // Run 50 iterations
      );
    });

    /**
     * Property: For any idea, updating both notes and tags should persist both changes
     * Validates: Requirements 4.3, 4.4, 5.2, 5.4
     *
     * Feature: idea-panel, Property: Combined metadata updates are persisted
     */
    it("should persist combined notes and tags updates through update operations", async () => {
      await forAll(
        () => {
          const idea = generateIdea({
            notes: faker.lorem.paragraph(),
            tags: ["startup", "tech"],
          });
          const newNotes = faker.lorem.paragraphs(2);
          const newTag = "mvp";
          return { idea, newNotes, newTag };
        },
        async ({ idea, newNotes, newTag }) => {
          // Arrange: Save the initial idea
          const saveResult = await repository.save(idea);

          if (!saveResult.success) {
            throw new Error(`Failed to save idea: ${saveResult.error.message}`);
          }

          createdIdeaIds.push(idea.id.value);

          // Act: Update both notes and tags
          idea.updateNotes(newNotes);
          idea.addTag(newTag);

          const updateResult = await repository.update(idea);

          if (!updateResult.success) {
            throw new Error(
              `Failed to update idea: ${updateResult.error.message}`
            );
          }

          // Retrieve the updated idea
          const retrieveResult = await repository.findById(idea.id);

          if (!retrieveResult.success || !retrieveResult.data) {
            throw new Error(
              `Failed to retrieve idea: ${
                retrieveResult.success
                  ? "Not found"
                  : retrieveResult.error.message
              }`
            );
          }

          const retrievedIdea = retrieveResult.data;

          // Assert: Both updates should be persisted
          const notesMatch = retrievedIdea.notes === newNotes;
          const tagsIncludeNew = retrievedIdea.getTags().includes(newTag);

          return notesMatch && tagsIncludeNew;
        },
        50 // Run 50 iterations
      );
    });
  });
});
