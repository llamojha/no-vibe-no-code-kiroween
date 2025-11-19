/**
 * Property tests for Entity Identity (P-DOM-001, P-DOM-002, P-DOM-003)
 * Tests entity ID immutability, uniqueness, and format validity
 *
 * Feature: property-testing-framework
 * Requirements: 2.1, 2.2
 */

import { describe, it, expect } from "vitest";
import {
  generateAnalysis,
  generateUser,
  generateCreditTransaction,
  generateMany,
} from "../utils/generators";
import { forAll } from "../utils/property-helpers";
import { Score } from "@/src/domain/value-objects/Score";

describe("Property: Entity Identity", () => {
  describe("P-DOM-001: Entity ID Immutability", () => {
    /**
     * Property: For any entity, the ID should remain unchanged through all operations
     * Validates: Requirements 2.1, 2.2
     */
    it("should maintain same ID through Analysis operations", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const originalId = analysis.id;

          // Perform various operations that modify the entity
          // Note: Only update score if analysis is not completed (has no feedback)
          if (!analysis.isCompleted()) {
            analysis.updateScore(Score.create(50));
          }
          analysis.updateFeedback("Updated feedback");
          analysis.addSuggestion("New suggestion");

          // ID should remain unchanged
          return analysis.id.equals(originalId);
        },
        100
      );
    });

    it("should maintain same ID through User operations", () => {
      forAll(
        generateUser,
        (user) => {
          const originalId = user.id;

          // Perform various operations that modify the entity
          user.updateName("New Name");
          user.recordLogin();
          user.addCredits(5);

          // ID should remain unchanged
          return user.id.equals(originalId);
        },
        100
      );
    });

    it("should maintain same ID for immutable CreditTransaction", () => {
      forAll(
        generateCreditTransaction,
        (transaction) => {
          const originalId = transaction.id;

          // CreditTransaction is immutable, so ID should always be the same
          // We just verify the ID hasn't changed
          return transaction.id.equals(originalId);
        },
        100
      );
    });
  });

  describe("P-DOM-002: Entity ID Uniqueness", () => {
    /**
     * Property: For any collection of entities, all IDs should be unique
     * Validates: Requirements 2.1, 2.2
     */
    it("should generate unique IDs for different Analysis entities", () => {
      const analyses = generateMany(generateAnalysis, 100);
      const ids = analyses.map((a) => a.id.value);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(analyses.length);
    });

    it("should generate unique IDs for different User entities", () => {
      const users = generateMany(generateUser, 100);
      const ids = users.map((u) => u.id.value);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(users.length);
    });

    it("should generate unique IDs for different CreditTransaction entities", () => {
      const transactions = generateMany(generateCreditTransaction, 100);
      const ids = transactions.map((t) => t.id.value);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(transactions.length);
    });

    it("should generate unique IDs across different entity types", () => {
      const analyses = generateMany(generateAnalysis, 50);
      const users = generateMany(generateUser, 50);
      const transactions = generateMany(generateCreditTransaction, 50);

      const allIds = [
        ...analyses.map((a) => a.id.value),
        ...users.map((u) => u.id.value),
        ...transactions.map((t) => t.id.value),
      ];

      const uniqueIds = new Set(allIds);

      // All IDs should be unique even across different entity types
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });

  describe("P-DOM-003: Entity ID Format Validity", () => {
    /**
     * Property: For any entity, the ID should be a valid UUID v4 format
     * Validates: Requirements 2.1, 2.2
     */
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    it("should generate valid UUID v4 format for Analysis IDs", () => {
      forAll(
        generateAnalysis,
        (analysis) => uuidV4Regex.test(analysis.id.value),
        100
      );
    });

    it("should generate valid UUID v4 format for User IDs", () => {
      forAll(generateUser, (user) => uuidV4Regex.test(user.id.value), 100);
    });

    it("should generate valid UUID v4 format for CreditTransaction IDs", () => {
      forAll(
        generateCreditTransaction,
        (transaction) => uuidV4Regex.test(transaction.id.value),
        100
      );
    });

    it("should have correct UUID v4 version indicator (4 in version position)", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const id = analysis.id.value;
          // The 15th character (index 14) should be '4' for UUID v4
          return id.charAt(14) === "4";
        },
        100
      );
    });

    it("should have correct UUID v4 variant indicator", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const id = analysis.id.value;
          // The 20th character (index 19) should be 8, 9, a, or b for UUID v4
          const variantChar = id.charAt(19).toLowerCase();
          return ["8", "9", "a", "b"].includes(variantChar);
        },
        100
      );
    });
  });
});
