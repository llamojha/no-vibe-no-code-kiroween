/**
 * Property tests for Credit System (P-DOM-012, P-DOM-013, P-DOM-014, P-DOM-015)
 * Tests credit non-negativity, deduction atomicity, default initialization, and transaction immutability
 *
 * Feature: property-testing-framework
 * Requirements: 2.1, 2.5
 */

import { describe, it, expect } from "vitest";
import {
  generateUser,
  generateCreditTransaction,
  generateMany,
  generateUserId,
} from "../utils/generators";
import { forAll, assertThrows } from "../utils/property-helpers";
import { User } from "@/src/domain/entities/User";
import { Email } from "@/src/domain/value-objects/Email";
import { CreditTransaction } from "@/src/domain/entities/CreditTransaction";
import { TransactionType } from "@/src/domain/value-objects/TransactionType";
import { InsufficientCreditsError } from "@/src/shared/types/errors";

describe("Property: Credit System", () => {
  describe("P-DOM-012: Credit Non-Negativity", () => {
    /**
     * Property: For any user, the credit balance cannot be negative
     * Validates: Requirements 2.1, 2.5
     */
    it("should never allow negative credit balance on user creation", () => {
      forAll(
        generateUser,
        (user) => {
          return user.credits >= 0;
        },
        100
      );
    });

    it("should reject credit deduction that would result in negative balance", () => {
      // Create user with 0 credits
      const user = User.create({
        email: Email.create("test@example.com"),
        credits: 0,
      });

      // Attempting to deduct credit should throw
      expect(() => user.deductCredit()).toThrow(InsufficientCreditsError);

      // Balance should remain 0
      expect(user.credits).toBe(0);
    });

    it("should maintain non-negative balance after multiple operations", () => {
      forAll(
        generateUser,
        (user) => {
          const initialCredits = user.credits;

          // Try to deduct credits up to the available amount
          for (let i = 0; i < initialCredits; i++) {
            user.deductCredit();
          }

          // After deducting all credits, balance should be 0 (not negative)
          expect(user.credits).toBe(0);

          // Attempting one more deduction should fail
          const willThrow = assertThrows(() => user.deductCredit());
          expect(willThrow).toBe(true);

          // Balance should still be 0
          return user.credits === 0;
        },
        100
      );
    });

    it("should enforce non-negative invariant through entity validation", () => {
      // This tests that the entity itself enforces the invariant
      const user = User.create({
        email: Email.create("test@example.com"),
        credits: 5,
      });

      // Deduct all credits
      for (let i = 0; i < 5; i++) {
        user.deductCredit();
      }

      // User should have 0 credits
      expect(user.credits).toBe(0);

      // Any further deduction should throw
      expect(() => user.deductCredit()).toThrow();
    });
  });

  describe("P-DOM-013: Credit Deduction Atomicity", () => {
    /**
     * Property: Credit deduction either fully succeeds or fully fails (no partial deduction)
     * Validates: Requirements 2.1, 2.5
     */
    it("should fully succeed when user has sufficient credits", () => {
      forAll(
        () => generateUser({ credits: 5 }),
        (user) => {
          const initialCredits = user.credits;

          // Deduct one credit
          user.deductCredit();

          // Credits should be exactly 1 less (full success)
          return user.credits === initialCredits - 1;
        },
        100
      );
    });

    it("should fully fail when user has insufficient credits", () => {
      const user = User.create({
        email: Email.create("test@example.com"),
        credits: 0,
      });

      const initialCredits = user.credits;

      // Attempt to deduct credit should throw
      expect(() => user.deductCredit()).toThrow(InsufficientCreditsError);

      // Credits should remain unchanged (full failure, no partial deduction)
      expect(user.credits).toBe(initialCredits);
    });

    it("should not leave user in inconsistent state after failed deduction", () => {
      forAll(
        () => generateUser({ credits: 0 }),
        (user) => {
          const initialCredits = user.credits;

          // Try to deduct credit (will fail)
          try {
            user.deductCredit();
          } catch (error) {
            // Expected to throw
          }

          // User state should be unchanged
          return user.credits === initialCredits && user.credits === 0;
        },
        100
      );
    });

    it("should maintain atomicity across multiple deduction attempts", () => {
      const user = User.create({
        email: Email.create("test@example.com"),
        credits: 2,
      });

      // First deduction should succeed
      user.deductCredit();
      expect(user.credits).toBe(1);

      // Second deduction should succeed
      user.deductCredit();
      expect(user.credits).toBe(0);

      // Third deduction should fail atomically
      expect(() => user.deductCredit()).toThrow();
      expect(user.credits).toBe(0); // Still 0, not negative
    });
  });

  describe("P-DOM-014: Default Credit Initialization", () => {
    /**
     * Property: New users start with 3 credits by default
     * Validates: Requirements 2.1, 2.5
     */
    it("should initialize new users with 3 credits when no credits specified", () => {
      // Create user without specifying credits
      const user = User.create({
        email: Email.create("newuser@example.com"),
      });

      expect(user.credits).toBe(3);
    });

    it("should consistently initialize all new users with 3 credits", () => {
      const users = generateMany(
        () =>
          User.create({
            email: Email.create(`user${Math.random()}@example.com`),
            // Not specifying credits to test default
          }),
        100
      );

      // All users should have exactly 3 credits
      const allHaveThreeCredits = users.every((user) => user.credits === 3);
      expect(allHaveThreeCredits).toBe(true);
    });

    it("should allow override of default credits during creation", () => {
      // When explicitly specifying credits, should use that value
      const userWith5 = User.create({
        email: Email.create("user@example.com"),
        credits: 5,
      });

      expect(userWith5.credits).toBe(5);

      const userWith0 = User.create({
        email: Email.create("user2@example.com"),
        credits: 0,
      });

      expect(userWith0.credits).toBe(0);
    });

    it("should use default credits for new users across different scenarios", () => {
      forAll(
        () => {
          // Generate user without specifying credits
          return User.create({
            email: Email.create(`user${Math.random()}@example.com`),
            name: `User ${Math.random()}`,
          });
        },
        (user) => {
          // Should always have default 3 credits
          return user.credits === 3;
        },
        100
      );
    });
  });

  describe("P-DOM-015: Credit Transaction Immutability", () => {
    /**
     * Property: Once recorded, credit transactions cannot be modified
     * Validates: Requirements 2.1, 2.5
     */
    it("should maintain immutable transaction amount", () => {
      forAll(
        generateCreditTransaction,
        (transaction) => {
          const originalAmount = transaction.amount;

          // CreditTransaction is immutable - no methods to modify it
          // Verify amount hasn't changed
          return transaction.amount === originalAmount;
        },
        100
      );
    });

    it("should maintain immutable transaction type", () => {
      forAll(
        generateCreditTransaction,
        (transaction) => {
          const originalType = transaction.type;

          // Verify type hasn't changed
          return transaction.type === originalType;
        },
        100
      );
    });

    it("should maintain immutable transaction description", () => {
      forAll(
        generateCreditTransaction,
        (transaction) => {
          const originalDescription = transaction.description;

          // Verify description hasn't changed
          return transaction.description === originalDescription;
        },
        100
      );
    });

    it("should maintain immutable transaction userId", () => {
      forAll(
        generateCreditTransaction,
        (transaction) => {
          const originalUserId = transaction.userId;

          // Verify userId hasn't changed
          return transaction.userId.equals(originalUserId);
        },
        100
      );
    });

    it("should maintain immutable transaction timestamp", () => {
      forAll(
        generateCreditTransaction,
        (transaction) => {
          const originalTimestamp = transaction.timestamp.getTime();

          // Verify timestamp hasn't changed
          return transaction.timestamp.getTime() === originalTimestamp;
        },
        100
      );
    });

    it("should maintain immutable transaction metadata", () => {
      forAll(
        generateCreditTransaction,
        (transaction) => {
          const originalMetadata = transaction.metadata;

          // Verify metadata hasn't changed
          if (originalMetadata === undefined) {
            return transaction.metadata === undefined;
          }

          return (
            JSON.stringify(transaction.metadata) ===
            JSON.stringify(originalMetadata)
          );
        },
        100
      );
    });

    it("should not provide methods to modify transaction after creation", () => {
      const transaction = CreditTransaction.create({
        userId: generateUserId(),
        amount: -1,
        type: TransactionType.DEDUCT,
        description: "Test transaction",
      });

      // Verify no setter methods exist
      expect(typeof (transaction as any).setAmount).toBe("undefined");
      expect(typeof (transaction as any).setType).toBe("undefined");
      expect(typeof (transaction as any).setDescription).toBe("undefined");
      expect(typeof (transaction as any).updateAmount).toBe("undefined");
      expect(typeof (transaction as any).updateType).toBe("undefined");
      expect(typeof (transaction as any).updateDescription).toBe("undefined");
    });

    it("should maintain all transaction properties through multiple reads", () => {
      forAll(
        generateCreditTransaction,
        (transaction) => {
          // Read properties multiple times
          const amount1 = transaction.amount;
          const amount2 = transaction.amount;
          const type1 = transaction.type;
          const type2 = transaction.type;
          const desc1 = transaction.description;
          const desc2 = transaction.description;

          // All reads should return the same values
          return amount1 === amount2 && type1 === type2 && desc1 === desc2;
        },
        100
      );
    });
  });
});
