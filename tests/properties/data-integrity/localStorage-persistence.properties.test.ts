/**
 * Property tests for localStorage data persistence round-trip
 * **Feature: open-source-mode, Property 7: Data persistence round-trip**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 *
 * For any entity saved to localStorage, retrieving it by ID SHALL return
 * an equivalent entity with all properties preserved.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { forAll } from "../utils/property-helpers";
import {
  generateAnalysis,
  generateIdea,
  generateDocument,
  generateCreditTransaction,
} from "../utils/generators";

import { LocalStorageAnalysisRepository } from "@/src/infrastructure/database/localStorage/LocalStorageAnalysisRepository";
import { LocalStorageIdeaRepository } from "@/src/infrastructure/database/localStorage/LocalStorageIdeaRepository";
import { LocalStorageDocumentRepository } from "@/src/infrastructure/database/localStorage/LocalStorageDocumentRepository";
import { LocalStorageCreditTransactionRepository } from "@/src/infrastructure/database/localStorage/LocalStorageCreditTransactionRepository";

// Mock localStorage for Node.js environment
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
};

describe("Property 7: Data persistence round-trip", () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    // Mock window.localStorage
    vi.stubGlobal("window", { localStorage: mockStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Analysis persistence", () => {
    it("should preserve all Analysis properties through save/retrieve round-trip", async () => {
      const repo = new LocalStorageAnalysisRepository();

      // Run 50 iterations (reduced for performance in persistence tests)
      for (let i = 0; i < 50; i++) {
        const original = generateAnalysis();

        // Save the analysis
        const saveResult = await repo.save(original);
        expect(saveResult.success).toBe(true);

        // Retrieve the analysis
        const findResult = await repo.findById(original.id);
        expect(findResult.success).toBe(true);

        if (findResult.success && findResult.data) {
          const retrieved = findResult.data;

          // Verify all properties are preserved
          expect(retrieved.id.value).toBe(original.id.value);
          expect(retrieved.userId.value).toBe(original.userId.value);
          expect(retrieved.idea).toBe(original.idea);
          expect(retrieved.locale.value).toBe(original.locale.value);
          expect(retrieved.score.value).toBe(original.score.value);
          expect(retrieved.feedback).toBe(original.feedback);
          expect([...retrieved.suggestions]).toEqual([...original.suggestions]);
          expect(retrieved.category?.value).toBe(original.category?.value);
          expect(retrieved.category?.type).toBe(original.category?.type);
        }

        // Clean up for next iteration
        await repo.delete(original.id);
      }
    });

    it("should return null for non-existent Analysis", async () => {
      const repo = new LocalStorageAnalysisRepository();
      const analysis = generateAnalysis();

      const result = await repo.findById(analysis.id);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe("Idea persistence", () => {
    it("should preserve all Idea properties through save/retrieve round-trip", async () => {
      const repo = new LocalStorageIdeaRepository();

      for (let i = 0; i < 50; i++) {
        const original = generateIdea();

        const saveResult = await repo.save(original);
        expect(saveResult.success).toBe(true);

        const findResult = await repo.findById(original.id);
        expect(findResult.success).toBe(true);

        if (findResult.success && findResult.data) {
          const retrieved = findResult.data;

          expect(retrieved.id.value).toBe(original.id.value);
          expect(retrieved.userId.value).toBe(original.userId.value);
          expect(retrieved.ideaText).toBe(original.ideaText);
          expect(retrieved.source.value).toBe(original.source.value);
          expect(retrieved.projectStatus.value).toBe(
            original.projectStatus.value
          );
          expect(retrieved.notes).toBe(original.notes);
          expect([...retrieved.tags]).toEqual([...original.tags]);
        }

        await repo.delete(original.id);
      }
    });
  });

  describe("Document persistence", () => {
    it("should preserve all Document properties through save/retrieve round-trip", async () => {
      const repo = new LocalStorageDocumentRepository();

      for (let i = 0; i < 50; i++) {
        const original = generateDocument();

        const saveResult = await repo.save(original);
        expect(saveResult.success).toBe(true);

        const findResult = await repo.findById(original.id);
        expect(findResult.success).toBe(true);

        if (findResult.success && findResult.data) {
          const retrieved = findResult.data;

          expect(retrieved.id.value).toBe(original.id.value);
          expect(retrieved.ideaId.value).toBe(original.ideaId.value);
          expect(retrieved.userId.value).toBe(original.userId.value);
          expect(retrieved.documentType.value).toBe(
            original.documentType.value
          );
          expect(retrieved.title).toBe(original.title);
          expect(retrieved.version.value).toBe(original.version.value);
          expect(JSON.stringify(retrieved.content)).toBe(
            JSON.stringify(original.content)
          );
        }

        await repo.delete(original.id);
      }
    });
  });

  describe("CreditTransaction persistence", () => {
    it("should preserve all CreditTransaction properties through save/retrieve round-trip", async () => {
      const repo = new LocalStorageCreditTransactionRepository();

      for (let i = 0; i < 50; i++) {
        const original = generateCreditTransaction();

        const saveResult = await repo.recordTransaction(original);
        expect(saveResult.success).toBe(true);

        const findResult = await repo.findById(original.id);
        expect(findResult.success).toBe(true);

        if (findResult.success && findResult.data) {
          const retrieved = findResult.data;

          expect(retrieved.id.value).toBe(original.id.value);
          expect(retrieved.userId.value).toBe(original.userId.value);
          expect(retrieved.amount).toBe(original.amount);
          expect(retrieved.type).toBe(original.type);
          expect(retrieved.description).toBe(original.description);
          expect(JSON.stringify(retrieved.metadata)).toBe(
            JSON.stringify(original.metadata)
          );
        }

        await repo.delete(original.id);
      }
    });
  });

  describe("Data retrieval after page refresh simulation", () => {
    it("should retrieve Analysis data after simulated page refresh", async () => {
      const repo1 = new LocalStorageAnalysisRepository();
      const original = generateAnalysis();

      // Save with first repository instance
      await repo1.save(original);

      // Create new repository instance (simulating page refresh)
      const repo2 = new LocalStorageAnalysisRepository();

      // Retrieve with new instance
      const findResult = await repo2.findById(original.id);
      expect(findResult.success).toBe(true);

      if (findResult.success && findResult.data) {
        expect(findResult.data.id.value).toBe(original.id.value);
        expect(findResult.data.idea).toBe(original.idea);
      }
    });

    it("should retrieve Idea data after simulated page refresh", async () => {
      const repo1 = new LocalStorageIdeaRepository();
      const original = generateIdea();

      await repo1.save(original);

      const repo2 = new LocalStorageIdeaRepository();

      const findResult = await repo2.findById(original.id);
      expect(findResult.success).toBe(true);

      if (findResult.success && findResult.data) {
        expect(findResult.data.id.value).toBe(original.id.value);
        expect(findResult.data.ideaText).toBe(original.ideaText);
      }
    });
  });

  describe("Multiple entities persistence", () => {
    it("should correctly store and retrieve multiple Analysis entities", async () => {
      const repo = new LocalStorageAnalysisRepository();
      const analyses = Array.from({ length: 10 }, () => generateAnalysis());

      // Save all analyses
      for (const analysis of analyses) {
        await repo.save(analysis);
      }

      // Verify count
      const countResult = await repo.count();
      expect(countResult.success).toBe(true);
      if (countResult.success) {
        expect(countResult.data).toBe(10);
      }

      // Verify each can be retrieved
      for (const original of analyses) {
        const findResult = await repo.findById(original.id);
        expect(findResult.success).toBe(true);
        if (findResult.success && findResult.data) {
          expect(findResult.data.id.value).toBe(original.id.value);
        }
      }
    });

    it("should correctly store and retrieve multiple Idea entities", async () => {
      const repo = new LocalStorageIdeaRepository();
      const ideas = Array.from({ length: 10 }, () => generateIdea());

      for (const idea of ideas) {
        await repo.save(idea);
      }

      const countResult = await repo.count();
      expect(countResult.success).toBe(true);
      if (countResult.success) {
        expect(countResult.data).toBe(10);
      }

      for (const original of ideas) {
        const findResult = await repo.findById(original.id);
        expect(findResult.success).toBe(true);
        if (findResult.success && findResult.data) {
          expect(findResult.data.id.value).toBe(original.id.value);
        }
      }
    });
  });
});
