/**
 * Tests for test data generators
 * Validates that all generators produce valid domain entities and value objects
 */

import { describe, it, expect } from "vitest";
import {
  generateAnalysisId,
  generateUserId,
  generateScore,
  generateEmail,
  generateLocale,
  generateCategory,
  generateUser,
  generateAnalysis,
  generateCreditTransaction,
  generateMany,
} from "../generators";
import { TransactionType } from "@/src/domain/value-objects/TransactionType";

describe("Value Object Generators", () => {
  describe("generateAnalysisId", () => {
    it("should generate valid AnalysisId", () => {
      const id = generateAnalysisId();
      expect(id).toBeDefined();
      expect(id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("should generate unique IDs", () => {
      const ids = generateMany(generateAnalysisId, 100);
      const uniqueValues = new Set(ids.map((id) => id.value));
      expect(uniqueValues.size).toBe(100);
    });
  });

  describe("generateUserId", () => {
    it("should generate valid UserId", () => {
      const id = generateUserId();
      expect(id).toBeDefined();
      expect(id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("should generate unique IDs", () => {
      const ids = generateMany(generateUserId, 100);
      const uniqueValues = new Set(ids.map((id) => id.value));
      expect(uniqueValues.size).toBe(100);
    });
  });

  describe("generateScore", () => {
    it("should generate valid Score", () => {
      const score = generateScore();
      expect(score).toBeDefined();
      expect(score.value).toBeGreaterThanOrEqual(0);
      expect(score.value).toBeLessThanOrEqual(100);
    });

    it("should generate scores across the full range", () => {
      const scores = generateMany(generateScore, 100);
      const values = scores.map((s) => s.value);

      // Check we have some variety (not all the same)
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBeGreaterThan(10);

      // Check all are in valid range
      values.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("generateEmail", () => {
    it("should generate valid Email", () => {
      const email = generateEmail();
      expect(email).toBeDefined();
      expect(email.value).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it("should generate unique emails", () => {
      const emails = generateMany(generateEmail, 50);
      const uniqueValues = new Set(emails.map((e) => e.value));
      expect(uniqueValues.size).toBeGreaterThan(40); // Allow some collisions
    });
  });

  describe("generateLocale", () => {
    it("should generate valid Locale", () => {
      const locale = generateLocale();
      expect(locale).toBeDefined();
      expect(["en", "es"]).toContain(locale.value);
    });

    it("should generate both locales over multiple calls", () => {
      const locales = generateMany(generateLocale, 50);
      const values = locales.map((l) => l.value);
      const uniqueValues = new Set(values);

      // Should have both en and es in 50 calls
      expect(uniqueValues.size).toBeGreaterThan(1);
    });
  });

  describe("generateCategory", () => {
    it("should generate valid Category", () => {
      const category = generateCategory();
      expect(category).toBeDefined();
      expect(["general", "hackathon"]).toContain(category.type);
    });

    it("should generate both general and hackathon categories", () => {
      const categories = generateMany(generateCategory, 50);
      const types = categories.map((c) => c.type);
      const uniqueTypes = new Set(types);

      // Should have both types in 50 calls
      expect(uniqueTypes.size).toBeGreaterThan(1);
    });
  });
});

describe("Entity Generators", () => {
  describe("generateUser", () => {
    it("should generate valid User", () => {
      const user = generateUser();
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.credits).toBeGreaterThanOrEqual(0);
      expect(user.isActive).toBe(true);
    });

    it("should respect overrides", () => {
      const email = generateEmail();
      const user = generateUser({ email, credits: 5 });

      expect(user.email.equals(email)).toBe(true);
      expect(user.credits).toBe(5);
    });

    it("should generate users with valid preferences", () => {
      const user = generateUser();
      const prefs = user.preferences;

      expect(prefs).toBeDefined();
      expect(["en", "es"]).toContain(prefs.defaultLocale.value);
      expect(typeof prefs.emailNotifications).toBe("boolean");
      expect(typeof prefs.analysisReminders).toBe("boolean");
      expect(["light", "dark", "auto"]).toContain(prefs.theme);
    });

    it("should generate multiple unique users", () => {
      const users = generateMany(generateUser, 10);
      const ids = users.map((u) => u.id.value);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(10);
    });
  });

  describe("generateAnalysis", () => {
    it("should generate valid Analysis", () => {
      const analysis = generateAnalysis();
      expect(analysis).toBeDefined();
      expect(analysis.id).toBeDefined();
      expect(analysis.idea).toBeDefined();
      expect(analysis.idea.length).toBeGreaterThanOrEqual(10);
      expect(analysis.userId).toBeDefined();
      expect(analysis.score).toBeDefined();
      expect(analysis.locale).toBeDefined();
    });

    it("should respect overrides", () => {
      const userId = generateUserId();
      const score = generateScore();
      const analysis = generateAnalysis({ userId, score });

      expect(analysis.userId.equals(userId)).toBe(true);
      expect(analysis.score.equals(score)).toBe(true);
    });

    it("should generate analyses with optional fields", () => {
      const analyses = generateMany(generateAnalysis, 20);

      // Some should have categories
      const withCategory = analyses.filter((a) => a.category !== undefined);
      expect(withCategory.length).toBeGreaterThan(0);

      // Some should have feedback
      const withFeedback = analyses.filter((a) => a.feedback !== undefined);
      expect(withFeedback.length).toBeGreaterThan(0);

      // Some should have suggestions
      const withSuggestions = analyses.filter((a) => a.suggestions.length > 0);
      expect(withSuggestions.length).toBeGreaterThan(0);
    });

    it("should generate multiple unique analyses", () => {
      const analyses = generateMany(generateAnalysis, 10);
      const ids = analyses.map((a) => a.id.value);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(10);
    });
  });

  describe("generateCreditTransaction", () => {
    it("should generate valid CreditTransaction", () => {
      const transaction = generateCreditTransaction();
      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      expect(transaction.userId).toBeDefined();
      expect(transaction.amount).not.toBe(0);
      expect(transaction.type).toBeDefined();
      expect(transaction.description).toBeDefined();
    });

    it("should generate DEDUCT transactions with negative amounts", () => {
      const transactions = generateMany(generateCreditTransaction, 50);
      const deductions = transactions.filter((t) => t.isDeduction());

      expect(deductions.length).toBeGreaterThan(0);
      deductions.forEach((t) => {
        expect(t.amount).toBeLessThan(0);
      });
    });

    it("should generate ADD/REFUND transactions with positive amounts", () => {
      const transactions = generateMany(generateCreditTransaction, 50);
      const additions = transactions.filter((t) => t.isAddition());

      expect(additions.length).toBeGreaterThan(0);
      additions.forEach((t) => {
        expect(t.amount).toBeGreaterThan(0);
      });
    });

    it("should respect overrides", () => {
      const userId = generateUserId();
      const transaction = generateCreditTransaction({
        userId,
        amount: -3,
        type: TransactionType.DEDUCT,
      });

      expect(transaction.userId.equals(userId)).toBe(true);
      expect(transaction.amount).toBe(-3);
      expect(transaction.type).toBe(TransactionType.DEDUCT);
    });

    it("should generate multiple unique transactions", () => {
      const transactions = generateMany(generateCreditTransaction, 10);
      const ids = transactions.map((t) => t.id.value);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(10);
    });
  });
});

describe("Utility Functions", () => {
  describe("generateMany", () => {
    it("should generate specified number of items", () => {
      const items = generateMany(generateScore, 25);
      expect(items).toHaveLength(25);
    });

    it("should generate default 10 items when count not specified", () => {
      const items = generateMany(generateScore);
      expect(items).toHaveLength(10);
    });

    it("should work with any generator function", () => {
      const users = generateMany(generateUser, 5);
      expect(users).toHaveLength(5);
      users.forEach((user) => {
        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
      });
    });

    it("should generate empty array for count 0", () => {
      const items = generateMany(generateScore, 0);
      expect(items).toHaveLength(0);
    });
  });
});
