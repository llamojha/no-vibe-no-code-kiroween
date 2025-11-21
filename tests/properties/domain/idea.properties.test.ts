/**
 * Property tests for Idea entity
 * Tests notes and tags round-trip properties
 *
 * Feature: idea-panel
 * Requirements: 4.5, 5.5
 */

import { describe, it, expect } from "vitest";
import { faker } from "@faker-js/faker";
import { generateIdea, generateUserId } from "../utils/generators";
import { forAll } from "../utils/property-helpers";
import { Idea } from "@/src/domain/entities/Idea";
import { IdeaSource } from "@/src/domain/value-objects/IdeaSource";

describe("Property: Idea Entity", () => {
  describe("Feature: idea-panel, Property: Notes round-trip", () => {
    /**
     * Property: For any notes string, saving and retrieving notes should preserve the exact value
     * Validates: Requirements 4.5
     *
     * This property ensures that notes are persisted correctly without data loss or corruption.
     * The round-trip property is critical for user data integrity.
     */
    it("should preserve notes exactly through save and retrieve", () => {
      forAll(
        () => faker.lorem.paragraphs(faker.number.int({ min: 1, max: 5 })),
        (notes) => {
          // Create an idea
          const idea = Idea.create({
            userId: generateUserId(),
            ideaText: faker.lorem.paragraph(),
            source: IdeaSource.MANUAL,
          });

          // Update notes
          idea.updateNotes(notes);

          // Retrieve notes
          const retrievedNotes = idea.notes;

          // Notes should match exactly
          return retrievedNotes === notes;
        },
        100
      );
    });

    it("should handle empty notes", () => {
      const idea = generateIdea();
      idea.updateNotes("");

      expect(idea.notes).toBe("");
      expect(idea.hasNotes()).toBe(false);
    });

    it("should handle notes with special characters", () => {
      const specialNotes = [
        "Notes with\nnewlines\nand\ttabs",
        "Notes with émojis 🚀 💡 ✨",
        "Notes with special chars: @#$%^&*()",
        "Notes with quotes: 'single' and \"double\"",
        "Notes with unicode: 你好世界",
      ];

      specialNotes.forEach((notes) => {
        const idea = generateIdea();
        idea.updateNotes(notes);

        expect(idea.notes).toBe(notes);
      });
    });

    it("should handle maximum length notes", () => {
      // Generate notes close to the 10000 character limit
      const longNotes = faker.lorem.paragraphs(50).substring(0, 9999);
      const idea = generateIdea();

      idea.updateNotes(longNotes);

      expect(idea.notes).toBe(longNotes);
      expect(idea.notes.length).toBeLessThanOrEqual(10000);
    });

    it("should reject notes exceeding maximum length", () => {
      const tooLongNotes = "a".repeat(10001);
      const idea = generateIdea();

      expect(() => idea.updateNotes(tooLongNotes)).toThrow(
        "Notes cannot exceed 10000 characters"
      );
    });

    it("should preserve notes through multiple updates", () => {
      forAll(
        () => [
          faker.lorem.paragraph(),
          faker.lorem.paragraph(),
          faker.lorem.paragraph(),
        ],
        ([notes1, notes2, notes3]) => {
          const idea = generateIdea();

          // Update notes multiple times
          idea.updateNotes(notes1);
          expect(idea.notes).toBe(notes1);

          idea.updateNotes(notes2);
          expect(idea.notes).toBe(notes2);

          idea.updateNotes(notes3);
          expect(idea.notes).toBe(notes3);

          return true;
        },
        50
      );
    });

    it("should preserve whitespace in notes", () => {
      const notesWithWhitespace = [
        "  Leading spaces",
        "Trailing spaces  ",
        "  Both sides  ",
        "Multiple\n\nNewlines",
        "Tabs\t\there",
      ];

      notesWithWhitespace.forEach((notes) => {
        const idea = generateIdea();
        idea.updateNotes(notes);

        expect(idea.notes).toBe(notes);
      });
    });
  });

  describe("Feature: idea-panel, Property: Tags round-trip", () => {
    /**
     * Property: For any array of tags, saving and retrieving tags should preserve the exact values
     * Validates: Requirements 5.5
     *
     * This property ensures that tags are persisted correctly as an array without data loss,
     * order changes, or corruption. The round-trip property is critical for user data integrity.
     */
    it("should preserve tags exactly through save and retrieve", () => {
      forAll(
        () =>
          faker.helpers.arrayElements(
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
              "proptech",
              "cleantech",
              "biotech",
              "agtech",
            ],
            { min: 1, max: 10 }
          ),
        (tags) => {
          // Create an idea
          const idea = Idea.create({
            userId: generateUserId(),
            ideaText: faker.lorem.paragraph(),
            source: IdeaSource.MANUAL,
          });

          // Add all tags
          tags.forEach((tag) => {
            if (!idea.getTags().includes(tag)) {
              idea.addTag(tag);
            }
          });

          // Retrieve tags
          const retrievedTags = idea.getTags();

          // All tags should be present
          return tags.every((tag) => retrievedTags.includes(tag));
        },
        100
      );
    });

    it("should handle empty tags array", () => {
      const idea = Idea.create({
        userId: generateUserId(),
        ideaText: faker.lorem.paragraph(),
        source: IdeaSource.MANUAL,
        tags: [],
      });

      expect(idea.getTags()).toEqual([]);
      expect(idea.hasTags()).toBe(false);
    });

    it("should handle single tag", () => {
      const idea = generateIdea({ tags: [] });
      const tag = "test-tag";

      idea.addTag(tag);

      expect(idea.getTags()).toEqual([tag]);
      expect(idea.hasTags()).toBe(true);
    });

    it("should handle tags with special characters", () => {
      const specialTags = [
        "tag-with-dash",
        "tag_with_underscore",
        "tag.with.dot",
        "tag123",
        "TAG",
      ];

      const idea = generateIdea({ tags: [] });

      specialTags.forEach((tag) => {
        idea.addTag(tag);
      });

      const retrievedTags = idea.getTags();
      specialTags.forEach((tag) => {
        expect(retrievedTags).toContain(tag);
      });
    });

    it("should preserve tag order", () => {
      const tags = ["first", "second", "third", "fourth", "fifth"];
      const idea = generateIdea({ tags: [] });

      tags.forEach((tag) => idea.addTag(tag));

      const retrievedTags = idea.getTags();
      expect(retrievedTags).toEqual(tags);
    });

    it("should handle adding and removing tags", () => {
      forAll(
        () => ({
          initialTags: faker.helpers.arrayElements(
            ["tag1", "tag2", "tag3", "tag4", "tag5"],
            { min: 3, max: 5 }
          ),
          tagToRemove: faker.helpers.arrayElement([
            "tag1",
            "tag2",
            "tag3",
            "tag4",
            "tag5",
          ]),
        }),
        ({ initialTags, tagToRemove }) => {
          const idea = Idea.create({
            userId: generateUserId(),
            ideaText: faker.lorem.paragraph(),
            source: IdeaSource.MANUAL,
            tags: initialTags,
          });

          // Remove a tag if it exists
          if (initialTags.includes(tagToRemove)) {
            idea.removeTag(tagToRemove);

            const retrievedTags = idea.getTags();
            return !retrievedTags.includes(tagToRemove);
          }

          return true;
        },
        50
      );
    });

    it("should prevent duplicate tags", () => {
      const idea = generateIdea({ tags: [] });
      const tag = "duplicate-tag";

      idea.addTag(tag);

      expect(() => idea.addTag(tag)).toThrow("Tag already exists");
      expect(idea.getTags()).toEqual([tag]);
    });

    it("should reject empty tags", () => {
      const idea = generateIdea();

      expect(() => idea.addTag("")).toThrow("Tag cannot be empty");
      expect(() => idea.addTag("   ")).toThrow("Tag cannot be empty");
    });

    it("should reject tags exceeding maximum length", () => {
      const idea = generateIdea();
      const longTag = "a".repeat(51);

      expect(() => idea.addTag(longTag)).toThrow(
        "Tag cannot exceed 50 characters"
      );
    });

    it("should enforce maximum tag count", () => {
      const idea = generateIdea({ tags: [] });

      // Add 50 tags (the maximum)
      for (let i = 0; i < 50; i++) {
        idea.addTag(`tag-${i}`);
      }

      expect(idea.getTags().length).toBe(50);

      // Attempting to add one more should fail
      expect(() => idea.addTag("tag-51")).toThrow(
        "Cannot add more than 50 tags to an idea"
      );
    });

    it("should trim whitespace from tags", () => {
      const idea = generateIdea({ tags: [] });
      const tagWithSpaces = "  tag-with-spaces  ";

      idea.addTag(tagWithSpaces);

      const retrievedTags = idea.getTags();
      expect(retrievedTags).toContain("tag-with-spaces");
      expect(retrievedTags).not.toContain(tagWithSpaces);
    });

    it("should handle removing non-existent tag", () => {
      const idea = generateIdea({ tags: ["tag1", "tag2"] });

      expect(() => idea.removeTag("non-existent")).toThrow("Tag not found");
    });

    it("should maintain tag integrity through multiple operations", () => {
      forAll(
        () => ({
          initialTags: faker.helpers.arrayElements(
            ["a", "b", "c", "d", "e", "f", "g", "h"],
            { min: 3, max: 6 }
          ),
          tagsToAdd: faker.helpers.arrayElements(["x", "y", "z"], {
            min: 1,
            max: 3,
          }),
          tagsToRemove: faker.helpers.arrayElements(["a", "b", "c"], {
            min: 0,
            max: 2,
          }),
        }),
        ({ initialTags, tagsToAdd, tagsToRemove }) => {
          const idea = Idea.create({
            userId: generateUserId(),
            ideaText: faker.lorem.paragraph(),
            source: IdeaSource.MANUAL,
            tags: initialTags,
          });

          // Add new tags
          tagsToAdd.forEach((tag) => {
            if (!idea.getTags().includes(tag)) {
              idea.addTag(tag);
            }
          });

          // Remove some tags
          tagsToRemove.forEach((tag) => {
            if (idea.getTags().includes(tag)) {
              idea.removeTag(tag);
            }
          });

          const finalTags = idea.getTags();

          // Verify added tags are present (unless removed)
          const addedAndNotRemoved = tagsToAdd.filter(
            (tag) => !tagsToRemove.includes(tag)
          );
          const allAddedPresent = addedAndNotRemoved.every((tag) =>
            finalTags.includes(tag)
          );

          // Verify removed tags are absent
          const allRemovedAbsent = tagsToRemove.every(
            (tag) => !finalTags.includes(tag)
          );

          return allAddedPresent && allRemovedAbsent;
        },
        50
      );
    });
  });
});
