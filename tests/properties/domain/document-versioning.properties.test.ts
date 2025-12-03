/**
 * Property tests for Document Versioning
 * Tests version management and document update behavior
 *
 * Feature: idea-panel-document-generation
 * Property 10: Version creation on save
 * Property 11: Version history ordering
 * Validates: Requirements 11.4, 12.3
 */

import { describe, it, expect } from "vitest";
import { Document } from "@/src/domain/entities/Document";
import { DocumentVersion } from "@/src/domain/value-objects/DocumentVersion";
import { DocumentId } from "@/src/domain/value-objects/DocumentId";
import {
  generateDocument,
  generateDocumentVersion,
  generateUserId,
  generateIdeaId,
  generateDocumentType,
} from "../utils/generators";
import { forAll } from "../utils/property-helpers";
import { faker } from "@faker-js/faker";

describe("Property: Document Versioning", () => {
  describe("Feature: idea-panel-document-generation, Property 10: Version creation on save", () => {
    /**
     * Property: For any document, updating content creates a new version with incremented version number
     * Validates: Requirements 11.4
     *
     * This property ensures that:
     * 1. updateContent() returns a NEW document entity (different ID)
     * 2. The new document has an incremented version number
     * 3. The original document remains unchanged
     */
    it("should create new document with incremented version when content is updated", () => {
      forAll(
        generateDocument,
        (originalDocument) => {
          const originalVersion = originalDocument.getVersion();
          const originalId = originalDocument.id;
          const originalContent = originalDocument.getContent();

          // Generate new content
          const newContent = {
            ...originalContent,
            updatedField: faker.lorem.sentence(),
            timestamp: new Date().toISOString(),
          };

          // Update content - should return NEW document
          const updatedDocument = originalDocument.updateContent(newContent);

          // Verify new document has different ID
          const hasNewId = !updatedDocument.id.equals(originalId);

          // Verify version is incremented
          const hasIncrementedVersion = updatedDocument
            .getVersion()
            .equals(originalVersion.increment());

          // Verify original document is unchanged
          const originalUnchanged =
            originalDocument.getVersion().equals(originalVersion) &&
            originalDocument.id.equals(originalId);

          // Verify new document has the new content
          const hasNewContent =
            JSON.stringify(updatedDocument.getContent()) ===
            JSON.stringify(newContent);

          return (
            hasNewId &&
            hasIncrementedVersion &&
            originalUnchanged &&
            hasNewContent
          );
        },
        100
      );
    });

    it("should preserve document metadata when updating content", () => {
      forAll(
        generateDocument,
        (originalDocument) => {
          // Generate valid content based on document type
          const originalContent = originalDocument.getContent();
          const newContent = {
            ...originalContent,
            additionalField: faker.lorem.sentence(),
          };

          const updatedDocument = originalDocument.updateContent(newContent);

          // Verify metadata is preserved
          const sameIdeaId = updatedDocument.ideaId.equals(
            originalDocument.ideaId
          );
          const sameUserId = updatedDocument.userId.equals(
            originalDocument.userId
          );
          const sameDocumentType = updatedDocument.documentType.equals(
            originalDocument.documentType
          );

          return sameIdeaId && sameUserId && sameDocumentType;
        },
        100
      );
    });

    it("should allow multiple sequential updates with incrementing versions", () => {
      const initialDocument = generateDocument();
      const initialVersion = initialDocument.getVersion().value;

      // Perform 5 sequential updates
      let currentDocument = initialDocument;
      const versions: number[] = [initialVersion];

      for (let i = 0; i < 5; i++) {
        const originalContent = currentDocument.getContent();
        const newContent = {
          ...originalContent,
          iteration: i,
          data: faker.lorem.sentence(),
        };
        currentDocument = currentDocument.updateContent(newContent);
        versions.push(currentDocument.getVersion().value);
      }

      // Verify versions increment correctly
      const versionsIncrement = versions.every(
        (version, index) => index === 0 || version === versions[index - 1] + 1
      );

      // Verify final version is initial + 5
      const finalVersionCorrect =
        currentDocument.getVersion().value === initialVersion + 5;

      expect(versionsIncrement).toBe(true);
      expect(finalVersionCorrect).toBe(true);
    });

    it("should create independent document instances on each update", () => {
      const originalDocument = generateDocument();
      const baseContent = originalDocument.getContent();

      const update1 = originalDocument.updateContent({
        ...baseContent,
        version: 1,
      });
      const update2 = originalDocument.updateContent({
        ...baseContent,
        version: 2,
      });
      const update3 = update1.updateContent({ ...baseContent, version: 3 });

      // All documents should have different IDs
      const allDifferentIds =
        !originalDocument.id.equals(update1.id) &&
        !originalDocument.id.equals(update2.id) &&
        !originalDocument.id.equals(update3.id) &&
        !update1.id.equals(update2.id) &&
        !update1.id.equals(update3.id) &&
        !update2.id.equals(update3.id);

      // Verify version numbers
      const originalVersion = originalDocument.getVersion().value;
      const update1Version = update1.getVersion().value;
      const update2Version = update2.getVersion().value;
      const update3Version = update3.getVersion().value;

      // update1 and update2 should both be originalVersion + 1 (branching from original)
      // update3 should be update1Version + 1
      const versionsCorrect =
        update1Version === originalVersion + 1 &&
        update2Version === originalVersion + 1 &&
        update3Version === update1Version + 1;

      expect(allDifferentIds).toBe(true);
      expect(versionsCorrect).toBe(true);
    });

    it("should maintain version immutability", () => {
      forAll(
        generateDocument,
        (document) => {
          const version = document.getVersion();
          const originalValue = version.value;

          // Perform various operations
          document.getContent();
          document.getSummary();
          document.belongsToUser(generateUserId());
          document.belongsToIdea(generateIdeaId());

          // Version should remain unchanged
          return document.getVersion().value === originalValue;
        },
        100
      );
    });
  });

  describe("Feature: idea-panel-document-generation, Property 11: Version history ordering", () => {
    /**
     * Property: For any document with multiple versions, the version history should display versions in descending order (newest first)
     * Validates: Requirements 12.3
     *
     * This property ensures that:
     * 1. Multiple versions of the same document are correctly ordered by version number
     * 2. The ordering is descending (highest version first)
     * 3. The ordering is stable and consistent
     */
    it("should order multiple document versions in descending order", () => {
      forAll(
        () => {
          // Generate a base document
          const baseDocument = generateDocument();
          const ideaId = baseDocument.ideaId;
          const userId = baseDocument.userId;
          const documentType = baseDocument.documentType;

          // Create multiple versions (3-10 versions)
          const versionCount = faker.number.int({ min: 3, max: 10 });
          const documents: Document[] = [];

          let currentDocument = baseDocument;
          documents.push(currentDocument);

          for (let i = 1; i < versionCount; i++) {
            const newContent = {
              ...currentDocument.getContent(),
              version: i + 1,
              data: faker.lorem.sentence(),
            };
            currentDocument = currentDocument.updateContent(newContent);
            documents.push(currentDocument);
          }

          return { documents, versionCount };
        },
        ({ documents, versionCount }) => {
          // Sort documents by version descending (simulating repository behavior)
          const sortedDocuments = [...documents].sort(
            (a, b) => b.getVersion().value - a.getVersion().value
          );

          // Verify ordering is descending
          const isDescending = sortedDocuments.every((doc, index) => {
            if (index === 0) return true;
            return (
              doc.getVersion().value <
              sortedDocuments[index - 1].getVersion().value
            );
          });

          // Verify first document has highest version
          const firstHasHighestVersion =
            sortedDocuments[0].getVersion().value === versionCount;

          // Verify last document has lowest version (version 1)
          const lastHasLowestVersion =
            sortedDocuments[sortedDocuments.length - 1].getVersion().value ===
            1;

          // Verify all versions are present
          const allVersionsPresent =
            sortedDocuments.length === versionCount &&
            sortedDocuments.every((doc, index) => {
              const expectedVersion = versionCount - index;
              return doc.getVersion().value === expectedVersion;
            });

          return (
            isDescending &&
            firstHasHighestVersion &&
            lastHasLowestVersion &&
            allVersionsPresent
          );
        },
        100
      );
    });

    it("should maintain version ordering with non-sequential version numbers", () => {
      // Test that ordering works even if versions are not perfectly sequential
      // (e.g., if some versions were deleted or skipped)
      const baseDocument = generateDocument();
      const ideaId = baseDocument.ideaId;
      const userId = baseDocument.userId;
      const documentType = baseDocument.documentType;
      const baseContent = baseDocument.getContent();

      // Create documents with non-sequential versions: 1, 3, 5, 7, 10
      const versions = [1, 3, 5, 7, 10];
      const documents = versions.map((versionNum) => {
        return Document.reconstruct({
          id: DocumentId.generate(),
          ideaId,
          userId,
          documentType,
          title: `Document v${versionNum}`,
          content: {
            ...baseContent,
            version: versionNum,
            data: faker.lorem.sentence(),
          },
          version: DocumentVersion.create(versionNum),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // Shuffle documents to simulate unordered retrieval
      const shuffled = faker.helpers.shuffle([...documents]);

      // Sort by version descending
      const sorted = shuffled.sort(
        (a, b) => b.getVersion().value - a.getVersion().value
      );

      // Verify ordering: [10, 7, 5, 3, 1]
      const expectedOrder = [10, 7, 5, 3, 1];
      const actualOrder = sorted.map((doc) => doc.getVersion().value);

      expect(actualOrder).toEqual(expectedOrder);
    });

    it("should handle single version correctly", () => {
      forAll(
        generateDocument,
        (document) => {
          // Single document should be "ordered" correctly
          const documents = [document];

          // Sort by version descending
          const sorted = documents.sort(
            (a, b) => b.getVersion().value - a.getVersion().value
          );

          // Should have exactly one document
          // Should be the same document
          return (
            sorted.length === 1 &&
            sorted[0].id.equals(document.id) &&
            sorted[0].getVersion().equals(document.getVersion())
          );
        },
        100
      );
    });

    it("should maintain stable ordering for documents with same version", () => {
      // Edge case: if somehow two documents have the same version
      // (shouldn't happen in practice due to unique constraint, but test stability)
      const baseDocument = generateDocument();
      const ideaId = baseDocument.ideaId;
      const userId = baseDocument.userId;
      const documentType = baseDocument.documentType;
      const baseContent = baseDocument.getContent();
      const version = DocumentVersion.create(5);

      const doc1 = Document.reconstruct({
        id: DocumentId.generate(),
        ideaId,
        userId,
        documentType,
        title: "Doc 1",
        content: { ...baseContent, id: 1 },
        version,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      });

      const doc2 = Document.reconstruct({
        id: DocumentId.generate(),
        ideaId,
        userId,
        documentType,
        title: "Doc 2",
        content: { ...baseContent, id: 2 },
        version,
        createdAt: new Date("2024-01-02"),
        updatedAt: new Date("2024-01-02"),
      });

      const documents = [doc1, doc2];

      // Sort by version descending (both have same version)
      const sorted = documents.sort(
        (a, b) => b.getVersion().value - a.getVersion().value
      );

      // Both documents should still be present
      // Order should be stable (same as input since versions are equal)
      expect(sorted.length).toBe(2);
      expect(sorted[0].getVersion().value).toBe(5);
      expect(sorted[1].getVersion().value).toBe(5);
    });

    it("should correctly order large number of versions", () => {
      // Test with many versions (50+)
      const baseDocument = generateDocument();
      const ideaId = baseDocument.ideaId;
      const userId = baseDocument.userId;
      const documentType = baseDocument.documentType;
      const baseContent = baseDocument.getContent();

      const versionCount = 50;
      const documents = Array.from({ length: versionCount }, (_, i) => {
        const versionNum = i + 1;
        return Document.reconstruct({
          id: DocumentId.generate(),
          ideaId,
          userId,
          documentType,
          title: `Document v${versionNum}`,
          content: { ...baseContent, version: versionNum },
          version: DocumentVersion.create(versionNum),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // Shuffle to simulate unordered retrieval
      const shuffled = faker.helpers.shuffle([...documents]);

      // Sort by version descending
      const sorted = shuffled.sort(
        (a, b) => b.getVersion().value - a.getVersion().value
      );

      // Verify all versions are in descending order
      const isDescending = sorted.every((doc, index) => {
        if (index === 0) return true;
        return doc.getVersion().value < sorted[index - 1].getVersion().value;
      });

      // Verify first is highest (50) and last is lowest (1)
      const firstIsHighest = sorted[0].getVersion().value === versionCount;
      const lastIsLowest = sorted[sorted.length - 1].getVersion().value === 1;

      expect(isDescending).toBe(true);
      expect(firstIsHighest).toBe(true);
      expect(lastIsLowest).toBe(true);
    });
  });

  describe("DocumentVersion Value Object Properties", () => {
    it("should only accept versions >= 1", () => {
      const invalidVersions = [0, -1, -10, -100];

      invalidVersions.forEach((value) => {
        expect(() => DocumentVersion.create(value)).toThrow(
          "Document version must be >= 1"
        );
      });
    });

    it("should only accept integer versions", () => {
      const invalidVersions = [1.5, 2.7, 3.14, 10.001];

      invalidVersions.forEach((value) => {
        expect(() => DocumentVersion.create(value)).toThrow(
          "Document version must be an integer"
        );
      });
    });

    it("should create initial version as 1", () => {
      const initialVersion = DocumentVersion.initial();
      expect(initialVersion.value).toBe(1);
    });

    it("should increment version correctly", () => {
      forAll(
        generateDocumentVersion,
        (version) => {
          const incremented = version.increment();
          return incremented.value === version.value + 1;
        },
        100
      );
    });

    it("should compare versions correctly", () => {
      const v1 = DocumentVersion.create(1);
      const v2 = DocumentVersion.create(2);
      const v3 = DocumentVersion.create(3);

      expect(v2.isGreaterThan(v1)).toBe(true);
      expect(v3.isGreaterThan(v2)).toBe(true);
      expect(v1.isGreaterThan(v2)).toBe(false);

      expect(v1.isLessThan(v2)).toBe(true);
      expect(v2.isLessThan(v3)).toBe(true);
      expect(v2.isLessThan(v1)).toBe(false);
    });

    it("should handle version equality correctly", () => {
      forAll(
        generateDocumentVersion,
        (version) => {
          const sameVersion = DocumentVersion.create(version.value);
          const differentVersion = version.increment();

          return (
            version.equals(sameVersion) && !version.equals(differentVersion)
          );
        },
        100
      );
    });

    it("should format version string correctly", () => {
      const v1 = DocumentVersion.create(1);
      const v5 = DocumentVersion.create(5);
      const v42 = DocumentVersion.create(42);

      expect(v1.toString()).toBe("v1");
      expect(v5.toString()).toBe("v5");
      expect(v42.toString()).toBe("v42");
    });
  });
});
