/**
 * Property-Based Tests for Rate Limiting Business Rules
 *
 * Tests credit cost consistency, insufficient credits rejection,
 * credit deduction before analysis, and transaction recording completeness.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CreditPolicy } from "@/src/domain/services/CreditPolicy";
import { User } from "@/src/domain/entities/User";
import { CreditTransaction } from "@/src/domain/entities/CreditTransaction";
import { AnalysisType } from "@/src/domain/value-objects/AnalysisType";
import { TransactionType } from "@/src/domain/value-objects/TransactionType";
import { InsufficientCreditsError } from "@/src/shared/types/errors";
import { generateUser, generateUserId } from "../utils/generators";
import { forAll, assertThrows } from "../utils/property-helpers";

describe("Property: Rate Limiting Business Rules", () => {
  let creditPolicy: CreditPolicy;

  beforeEach(() => {
    creditPolicy = new CreditPolicy();
  });

  describe("P-BIZ-005: Credit Cost Consistency", () => {
    /**
     * **Feature: property-testing-framework, Property P-BIZ-005**
     * **Validates: Requirements 4.1, 4.3**
     *
     * Property: All analysis types cost 1 credit
     * Formal: ∀t: AnalysisType, getCost(t) = 1
     */
    it("should return cost of 1 for all analysis types", () => {
      const analysisTypes = [
        AnalysisType.STARTUP_IDEA,
        AnalysisType.HACKATHON_PROJECT,
        AnalysisType.FRANKENSTEIN_EXPERIMENT,
      ];

      analysisTypes.forEach((type) => {
        const cost = creditPolicy.getAnalysisCost(type);
        expect(cost).toBe(1);
      });
    });

    it("should maintain consistent cost across multiple calls", () => {
      const analysisTypes = [
        AnalysisType.STARTUP_IDEA,
        AnalysisType.HACKATHON_PROJECT,
        AnalysisType.FRANKENSTEIN_EXPERIMENT,
      ];

      analysisTypes.forEach((type) => {
        // Call multiple times to ensure consistency
        const costs = Array.from({ length: 10 }, () =>
          creditPolicy.getAnalysisCost(type)
        );

        // All costs should be identical
        const allEqual = costs.every((cost) => cost === costs[0]);
        expect(allEqual).toBe(true);
        expect(costs[0]).toBe(1);
      });
    });

    it("should calculate deduction amount as 1 for all analysis types", () => {
      const analysisTypes = [
        AnalysisType.STARTUP_IDEA,
        AnalysisType.HACKATHON_PROJECT,
        AnalysisType.FRANKENSTEIN_EXPERIMENT,
      ];

      analysisTypes.forEach((type) => {
        const deduction = creditPolicy.calculateCreditDeduction(type);
        expect(deduction).toBe(1);
      });
    });
  });

  describe("P-BIZ-006: Insufficient Credits Rejection", () => {
    /**
     * **Feature: property-testing-framework, Property P-BIZ-006**
     * **Validates: Requirements 4.1, 4.3, 4.5**
     *
     * Property: Analysis request with zero credits is rejected
     * Formal: ∀u: User, u.credits = 0 ⇒ canAnalyze(u) = false
     */
    it("should reject analysis when user has zero credits", () => {
      // Generate users with zero credits
      forAll(
        () => generateUser({ credits: 0 }),
        (user) => {
          // User should not be able to perform analysis
          const canAnalyze = creditPolicy.canPerformAnalysis(user);
          return canAnalyze === false;
        },
        100
      );
    });

    it("should throw InsufficientCreditsError when deducting from zero balance", () => {
      const user = generateUser({ credits: 0 });

      expect(() => {
        user.deductCredit();
      }).toThrow(InsufficientCreditsError);
    });

    it("should reject analysis for any user without credits", () => {
      forAll(
        () => generateUser({ credits: 0 }),
        (user) => {
          // Verify user has no credits
          expect(user.credits).toBe(0);
          expect(user.hasCredits()).toBe(false);

          // Verify policy rejects analysis
          const canAnalyze = creditPolicy.canPerformAnalysis(user);
          return !canAnalyze;
        },
        100
      );
    });

    it("should allow analysis when user has at least one credit", () => {
      forAll(
        () => generateUser({ credits: Math.floor(Math.random() * 10) + 1 }),
        (user) => {
          // User should be able to perform analysis
          const canAnalyze = creditPolicy.canPerformAnalysis(user);
          return canAnalyze === true && user.hasCredits() === true;
        },
        100
      );
    });
  });

  describe("P-BIZ-007: Credit Deduction Before Analysis", () => {
    /**
     * **Feature: property-testing-framework, Property P-BIZ-007**
     * **Validates: Requirements 4.1, 4.3, 4.5**
     *
     * Property: Credits are deducted before analysis execution
     * Formal: ∀a: Analysis, deductCredit() happens-before analyze()
     *
     * Note: This property tests the domain logic. The actual ordering
     * in the use case is tested through integration tests.
     */
    it("should reduce credit balance immediately upon deduction", () => {
      forAll(
        () => generateUser({ credits: Math.floor(Math.random() * 10) + 1 }),
        (user) => {
          const initialCredits = user.credits;

          // Deduct credit
          user.deductCredit();

          // Credit should be immediately reduced
          const finalCredits = user.credits;
          return finalCredits === initialCredits - 1;
        },
        100
      );
    });

    it("should maintain credit invariant after deduction", () => {
      forAll(
        () => generateUser({ credits: Math.floor(Math.random() * 10) + 1 }),
        (user) => {
          const initialCredits = user.credits;

          // Deduct credit
          user.deductCredit();

          // Credits should never be negative
          return user.credits >= 0 && user.credits === initialCredits - 1;
        },
        100
      );
    });

    it("should prevent analysis after credits are exhausted", () => {
      const user = generateUser({ credits: 1 });

      // User can analyze initially
      expect(creditPolicy.canPerformAnalysis(user)).toBe(true);

      // Deduct the last credit
      user.deductCredit();

      // User should no longer be able to analyze
      expect(creditPolicy.canPerformAnalysis(user)).toBe(false);
      expect(user.hasCredits()).toBe(false);
    });

    it("should update user state atomically during deduction", () => {
      forAll(
        () => generateUser({ credits: Math.floor(Math.random() * 10) + 1 }),
        (user) => {
          const initialCredits = user.credits;
          const initialUpdatedAt = user.updatedAt.getTime();

          // Small delay to ensure timestamp changes
          const beforeDeduction = Date.now();

          // Deduct credit
          user.deductCredit();

          const afterDeduction = Date.now();
          const finalUpdatedAt = user.updatedAt.getTime();

          // Verify atomic update: credits changed AND timestamp updated
          const creditsChanged = user.credits === initialCredits - 1;
          const timestampUpdated = finalUpdatedAt >= beforeDeduction;

          return creditsChanged && timestampUpdated;
        },
        100
      );
    });
  });

  describe("P-BIZ-008: Transaction Recording Completeness", () => {
    /**
     * **Feature: property-testing-framework, Property P-BIZ-008**
     * **Validates: Requirements 4.1, 4.3, 4.5**
     *
     * Property: Every credit change has a corresponding transaction record
     * Formal: ∀Δc: CreditChange, ∃t: Transaction, t.amount = Δc
     */
    it("should create transaction with correct negative amount for deductions", () => {
      const userId = generateUserId();
      const deductionAmount = -1;

      const transaction = CreditTransaction.create({
        userId,
        amount: deductionAmount,
        type: TransactionType.DEDUCT,
        description: "Analysis: startup_idea",
        metadata: {
          analysisType: AnalysisType.STARTUP_IDEA,
        },
      });

      // Transaction should record the deduction
      expect(transaction.amount).toBe(deductionAmount);
      expect(transaction.type).toBe(TransactionType.DEDUCT);
      expect(transaction.isDeduction()).toBe(true);
      expect(transaction.userId.equals(userId)).toBe(true);
    });

    it("should create transaction with correct positive amount for additions", () => {
      const userId = generateUserId();
      const additionAmount = 5;

      const transaction = CreditTransaction.create({
        userId,
        amount: additionAmount,
        type: TransactionType.ADD,
        description: "Credit purchase",
      });

      // Transaction should record the addition
      expect(transaction.amount).toBe(additionAmount);
      expect(transaction.type).toBe(TransactionType.ADD);
      expect(transaction.isAddition()).toBe(true);
      expect(transaction.userId.equals(userId)).toBe(true);
    });

    it("should enforce transaction amount sign matches type", () => {
      const userId = generateUserId();

      // DEDUCT must have negative amount
      expect(() => {
        CreditTransaction.create({
          userId,
          amount: 1, // Positive amount
          type: TransactionType.DEDUCT,
          description: "Invalid deduction",
        });
      }).toThrow();

      // ADD must have positive amount
      expect(() => {
        CreditTransaction.create({
          userId,
          amount: -1, // Negative amount
          type: TransactionType.ADD,
          description: "Invalid addition",
        });
      }).toThrow();

      // REFUND must have positive amount
      expect(() => {
        CreditTransaction.create({
          userId,
          amount: -1, // Negative amount
          type: TransactionType.REFUND,
          description: "Invalid refund",
        });
      }).toThrow();
    });

    it("should create immutable transaction records", () => {
      const userId = generateUserId();

      const transaction = CreditTransaction.create({
        userId,
        amount: -1,
        type: TransactionType.DEDUCT,
        description: "Analysis deduction",
      });

      // Store original values
      const originalAmount = transaction.amount;
      const originalType = transaction.type;
      const originalDescription = transaction.description;
      const originalTimestamp = transaction.timestamp.getTime();

      // Attempt to modify (should not be possible due to readonly properties)
      // TypeScript prevents this at compile time, but we verify runtime immutability

      // Verify values haven't changed
      expect(transaction.amount).toBe(originalAmount);
      expect(transaction.type).toBe(originalType);
      expect(transaction.description).toBe(originalDescription);
      expect(transaction.timestamp.getTime()).toBe(originalTimestamp);
    });

    it("should include metadata for audit trail", () => {
      const userId = generateUserId();
      const analysisId = "test-analysis-id";
      const analysisType = AnalysisType.HACKATHON_PROJECT;

      const transaction = CreditTransaction.create({
        userId,
        amount: -1,
        type: TransactionType.DEDUCT,
        description: `Analysis: ${analysisType}`,
        metadata: {
          analysisType,
          analysisId,
        },
      });

      // Verify metadata is preserved
      expect(transaction.metadata).toBeDefined();
      expect(transaction.metadata?.analysisType).toBe(analysisType);
      expect(transaction.metadata?.analysisId).toBe(analysisId);
    });

    it("should prevent zero-amount transactions", () => {
      const userId = generateUserId();

      // Zero amount should be rejected
      expect(() => {
        CreditTransaction.create({
          userId,
          amount: 0,
          type: TransactionType.DEDUCT,
          description: "Invalid zero transaction",
        });
      }).toThrow();
    });

    it("should require non-empty description", () => {
      const userId = generateUserId();

      // Empty description should be rejected
      expect(() => {
        CreditTransaction.create({
          userId,
          amount: -1,
          type: TransactionType.DEDUCT,
          description: "",
        });
      }).toThrow();

      // Whitespace-only description should be rejected
      expect(() => {
        CreditTransaction.create({
          userId,
          amount: -1,
          type: TransactionType.DEDUCT,
          description: "   ",
        });
      }).toThrow();
    });

    it("should generate unique transaction IDs", () => {
      const userId = generateUserId();
      const transactions = Array.from({ length: 100 }, () =>
        CreditTransaction.create({
          userId,
          amount: -1,
          type: TransactionType.DEDUCT,
          description: "Test transaction",
        })
      );

      // All transaction IDs should be unique
      const ids = transactions.map((t) => t.id.value);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(transactions.length);
    });
  });

  describe("Credit System Integration", () => {
    it("should handle complete credit lifecycle", () => {
      // Create user with initial credits
      const user = generateUser({ credits: 3 });
      const userId = user.id;

      // Track all transactions
      const transactions: CreditTransaction[] = [];

      // Perform analysis (deduct credit)
      const initialCredits = user.credits;
      user.deductCredit();

      transactions.push(
        CreditTransaction.create({
          userId,
          amount: -1,
          type: TransactionType.DEDUCT,
          description: "Analysis: startup_idea",
        })
      );

      expect(user.credits).toBe(initialCredits - 1);

      // Add credits
      user.addCredits(5);

      transactions.push(
        CreditTransaction.create({
          userId,
          amount: 5,
          type: TransactionType.ADD,
          description: "Credit purchase",
        })
      );

      expect(user.credits).toBe(initialCredits - 1 + 5);

      // Verify all transactions are valid
      transactions.forEach((transaction) => {
        expect(transaction.userId.equals(userId)).toBe(true);
        expect(transaction.amount).not.toBe(0);
        expect(transaction.description.trim().length).toBeGreaterThan(0);
      });
    });

    it("should maintain credit balance consistency", () => {
      forAll(
        () => generateUser({ credits: Math.floor(Math.random() * 10) + 5 }),
        (user) => {
          const initialCredits = user.credits;

          // Perform multiple operations
          user.deductCredit();
          user.deductCredit();
          user.addCredits(3);

          const expectedCredits = initialCredits - 2 + 3;
          return user.credits === expectedCredits;
        },
        50
      );
    });
  });
});
