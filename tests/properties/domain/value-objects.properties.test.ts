/**
 * Property tests for Value Objects (P-DOM-004, P-DOM-005, P-DOM-006, P-DOM-007)
 * Tests value object immutability, validation, and equality
 *
 * Feature: property-testing-framework
 * Requirements: 2.1, 2.3
 */

import { describe, it, expect } from "vitest";
import {
  generateScore,
  generateEmail,
  generateAnalysisId,
  generateUserId,
  generateMany,
} from "../utils/generators";
import { forAll, assertThrows } from "../utils/property-helpers";
import { Score } from "@/src/domain/value-objects/Score";
import { Email } from "@/src/domain/value-objects/Email";
import { AnalysisId } from "@/src/domain/value-objects/AnalysisId";
import { UserId } from "@/src/domain/value-objects/UserId";

describe("Property: Value Objects", () => {
  describe("P-DOM-004: Value Object Immutability", () => {
    /**
     * Property: For any value object, all properties should be immutable
     * Validates: Requirements 2.1, 2.3
     *
     * Note: Value objects in TypeScript use readonly properties which provide
     * compile-time immutability. We test that the public API doesn't allow
     * modification and that creating new instances doesn't affect existing ones.
     */
    it("should not provide methods to modify Score values", () => {
      forAll(
        generateScore,
        (score) => {
          const originalValue = score.value;

          // Value objects should not have setter methods
          // The only way to get a different score is to create a new one
          const newScore = Score.create(
            originalValue + 10 <= 100 ? originalValue + 10 : originalValue - 10
          );

          // Original score should remain unchanged
          return (
            score.value === originalValue && newScore.value !== originalValue
          );
        },
        100
      );
    });

    it("should not provide methods to modify Email values", () => {
      forAll(
        generateEmail,
        (email) => {
          const originalValue = email.value;

          // Value objects should not have setter methods
          // The only way to get a different email is to create a new one
          const newEmail = Email.create("different@example.com");

          // Original email should remain unchanged
          return (
            email.value === originalValue && newEmail.value !== originalValue
          );
        },
        100
      );
    });

    it("should not provide methods to modify AnalysisId values", () => {
      forAll(
        generateAnalysisId,
        (id) => {
          const originalValue = id.value;

          // Value objects should not have setter methods
          // The only way to get a different ID is to create a new one
          const newId = AnalysisId.generate();

          // Original ID should remain unchanged
          return id.value === originalValue && newId.value !== originalValue;
        },
        100
      );
    });

    it("should not provide methods to modify UserId values", () => {
      forAll(
        generateUserId,
        (id) => {
          const originalValue = id.value;

          // Value objects should not have setter methods
          // The only way to get a different ID is to create a new one
          const newId = UserId.generate();

          // Original ID should remain unchanged
          return id.value === originalValue && newId.value !== originalValue;
        },
        100
      );
    });

    it("should create new instances rather than modifying existing ones", () => {
      const score1 = Score.create(50);
      const score2 = Score.create(75);

      // Both scores should maintain their original values
      expect(score1.value).toBe(50);
      expect(score2.value).toBe(75);

      // They should be different instances
      expect(score1).not.toBe(score2);
    });

    it("should maintain immutability through all operations", () => {
      forAll(
        generateScore,
        (score) => {
          const originalValue = score.value;

          // Perform various read operations
          score.toString();
          score.toPercentage();
          score.toJSON();
          score.compareTo(Score.create(50));
          score.isHigherThan(Score.create(25));
          score.isLowerThan(Score.create(75));

          // Value should remain unchanged after all operations
          return score.value === originalValue;
        },
        100
      );
    });
  });

  describe("P-DOM-005: Score Bounds Validation", () => {
    /**
     * Property: For any Score, the value should be between 0 and 100 inclusive
     * Validates: Requirements 2.1, 2.3
     */
    it("should only accept scores between 0 and 100", () => {
      forAll(
        generateScore,
        (score) => {
          return score.value >= 0 && score.value <= 100;
        },
        100
      );
    });

    it("should reject scores below 0", () => {
      const invalidScores = [-1, -10, -100, -0.1, -999];

      invalidScores.forEach((value) => {
        expect(() => Score.create(value)).toThrow(
          "Score must be between 0 and 100 inclusive"
        );
      });
    });

    it("should reject scores above 100", () => {
      const invalidScores = [101, 150, 200, 100.1, 999];

      invalidScores.forEach((value) => {
        expect(() => Score.create(value)).toThrow(
          "Score must be between 0 and 100 inclusive"
        );
      });
    });

    it("should accept boundary values 0 and 100", () => {
      const minScore = Score.create(0);
      const maxScore = Score.create(100);

      expect(minScore.value).toBe(0);
      expect(maxScore.value).toBe(100);
    });

    it("should reject non-numeric values", () => {
      const invalidValues = [NaN, Infinity, -Infinity];

      invalidValues.forEach((value) => {
        expect(() => Score.create(value)).toThrow();
      });
    });

    it("should round scores to 2 decimal places", () => {
      const score1 = Score.create(50.123456);
      const score2 = Score.create(75.999);
      const score3 = Score.create(33.335);

      expect(score1.value).toBe(50.12);
      expect(score2.value).toBe(76);
      expect(score3.value).toBe(33.34);
    });
  });

  describe("P-DOM-006: Email Format Validation", () => {
    /**
     * Property: For any Email, the value should be a valid email format
     * Validates: Requirements 2.1, 2.3
     */
    it("should only accept valid email formats", () => {
      forAll(
        generateEmail,
        (email) => {
          // Valid email should have @ symbol and domain
          const hasAtSymbol = email.value.includes("@");
          const parts = email.value.split("@");
          const hasLocalPart = parts[0] && parts[0].length > 0;
          const hasDomain = parts[1] && parts[1].includes(".");

          return hasAtSymbol && hasLocalPart && hasDomain;
        },
        100
      );
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "notanemail",
        "@example.com",
        "user@",
        "user @example.com",
        "user@.com",
        "user@domain",
        "",
        " ",
        "user@@example.com",
        "user@domain..com",
      ];

      invalidEmails.forEach((value) => {
        expect(() => Email.create(value)).toThrow();
      });
    });

    it("should accept valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "test.user@example.com",
        "user+tag@example.co.uk",
        "user_name@example.com",
        "user123@test-domain.com",
        "a@b.co",
      ];

      validEmails.forEach((value) => {
        const email = Email.create(value);
        expect(email.value).toBeDefined();
      });
    });

    it("should normalize email to lowercase", () => {
      const email1 = Email.create("User@Example.COM");
      const email2 = Email.create("TEST@DOMAIN.COM");

      expect(email1.value).toBe("user@example.com");
      expect(email2.value).toBe("test@domain.com");
    });

    it("should trim whitespace from email", () => {
      const email1 = Email.create("  user@example.com  ");
      const email2 = Email.create("\ttest@domain.com\n");

      expect(email1.value).toBe("user@example.com");
      expect(email2.value).toBe("test@domain.com");
    });

    it("should correctly extract local part and domain", () => {
      forAll(
        generateEmail,
        (email) => {
          const fullEmail = email.value;
          const localPart = email.localPart;
          const domain = email.domain;

          // Reconstructed email should match original
          return `${localPart}@${domain}` === fullEmail;
        },
        100
      );
    });

    it("should reject empty or whitespace-only emails", () => {
      const invalidEmails = ["", "   ", "\t", "\n"];

      invalidEmails.forEach((value) => {
        expect(() => Email.create(value)).toThrow();
      });
    });
  });

  describe("P-DOM-007: Value Object Equality", () => {
    /**
     * Property: For any two value objects with the same value, equals() should return true
     * Validates: Requirements 2.1, 2.3
     */
    it("should consider Scores with same value as equal", () => {
      forAll(
        generateScore,
        (score) => {
          const sameScore = Score.create(score.value);
          return score.equals(sameScore);
        },
        100
      );
    });

    it("should consider Scores with different values as not equal", () => {
      const scores = generateMany(generateScore, 50);

      for (let i = 0; i < scores.length - 1; i++) {
        for (let j = i + 1; j < scores.length; j++) {
          if (scores[i].value !== scores[j].value) {
            expect(scores[i].equals(scores[j])).toBe(false);
          }
        }
      }
    });

    it("should consider Emails with same value as equal", () => {
      forAll(
        generateEmail,
        (email) => {
          const sameEmail = Email.create(email.value);
          return email.equals(sameEmail);
        },
        100
      );
    });

    it("should consider Emails with different values as not equal", () => {
      const email1 = Email.create("user1@example.com");
      const email2 = Email.create("user2@example.com");

      expect(email1.equals(email2)).toBe(false);
    });

    it("should consider AnalysisIds with same value as equal", () => {
      forAll(
        generateAnalysisId,
        (id) => {
          const sameId = AnalysisId.fromString(id.value);
          return id.equals(sameId);
        },
        100
      );
    });

    it("should consider AnalysisIds with different values as not equal", () => {
      const id1 = AnalysisId.generate();
      const id2 = AnalysisId.generate();

      expect(id1.equals(id2)).toBe(false);
    });

    it("should consider UserIds with same value as equal", () => {
      forAll(
        generateUserId,
        (id) => {
          const sameId = UserId.fromString(id.value);
          return id.equals(sameId);
        },
        100
      );
    });

    it("should consider UserIds with different values as not equal", () => {
      const id1 = UserId.generate();
      const id2 = UserId.generate();

      expect(id1.equals(id2)).toBe(false);
    });

    it("should handle equality reflexively (a.equals(a) is true)", () => {
      const score = generateScore();
      const email = generateEmail();
      const analysisId = generateAnalysisId();
      const userId = generateUserId();

      expect(score.equals(score)).toBe(true);
      expect(email.equals(email)).toBe(true);
      expect(analysisId.equals(analysisId)).toBe(true);
      expect(userId.equals(userId)).toBe(true);
    });

    it("should handle equality symmetrically (a.equals(b) === b.equals(a))", () => {
      forAll(
        generateScore,
        (score) => {
          const sameScore = Score.create(score.value);
          return score.equals(sameScore) === sameScore.equals(score);
        },
        100
      );
    });

    it("should handle equality transitively (if a=b and b=c, then a=c)", () => {
      const value = 50;
      const score1 = Score.create(value);
      const score2 = Score.create(value);
      const score3 = Score.create(value);

      expect(score1.equals(score2)).toBe(true);
      expect(score2.equals(score3)).toBe(true);
      expect(score1.equals(score3)).toBe(true);
    });

    it("should handle Email equality case-insensitively", () => {
      const email1 = Email.create("User@Example.COM");
      const email2 = Email.create("user@example.com");
      const email3 = Email.create("USER@EXAMPLE.COM");

      expect(email1.equals(email2)).toBe(true);
      expect(email2.equals(email3)).toBe(true);
      expect(email1.equals(email3)).toBe(true);
    });
  });
});
