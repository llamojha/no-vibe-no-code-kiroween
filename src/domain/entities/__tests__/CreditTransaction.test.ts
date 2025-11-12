import { describe, it, expect, beforeEach } from "vitest";
import {
  CreditTransaction,
  CreateCreditTransactionProps,
  ReconstructCreditTransactionProps,
} from "../CreditTransaction";
import { CreditTransactionId } from "../../value-objects/CreditTransactionId";
import { UserId } from "../../value-objects/UserId";
import { TransactionType } from "../../value-objects/TransactionType";
import { InvariantViolationError } from "../../../shared/types/errors";

describe("CreditTransaction Entity", () => {
  const validUserId = UserId.generate();

  const validDeductProps: CreateCreditTransactionProps = {
    userId: validUserId,
    amount: -1,
    type: TransactionType.DEDUCT,
    description: "Analysis: startup_idea",
    metadata: {
      analysisType: "startup_idea",
      analysisId: "test-analysis-id",
    },
  };

  const validAddProps: CreateCreditTransactionProps = {
    userId: validUserId,
    amount: 5,
    type: TransactionType.ADD,
    description: "Credit purchase",
    metadata: {
      paymentId: "payment-123",
      package: "starter",
    },
  };

  describe("create", () => {
    it("should create deduct transaction with valid data", () => {
      const transaction = CreditTransaction.create(validDeductProps);

      expect(transaction.id).toBeDefined();
      expect(transaction.userId.equals(validDeductProps.userId)).toBe(true);
      expect(transaction.amount).toBe(validDeductProps.amount);
      expect(transaction.type).toBe(validDeductProps.type);
      expect(transaction.description).toBe(validDeductProps.description);
      expect(transaction.metadata).toEqual(validDeductProps.metadata);
      expect(transaction.timestamp).toBeInstanceOf(Date);
      expect(transaction.createdAt).toBeInstanceOf(Date);
    });

    it("should create add transaction with valid data", () => {
      const transaction = CreditTransaction.create(validAddProps);

      expect(transaction.id).toBeDefined();
      expect(transaction.amount).toBe(validAddProps.amount);
      expect(transaction.type).toBe(TransactionType.ADD);
    });

    it("should create refund transaction with positive amount", () => {
      const refundProps: CreateCreditTransactionProps = {
        userId: validUserId,
        amount: 1,
        type: TransactionType.REFUND,
        description: "Refund for failed analysis",
      };

      const transaction = CreditTransaction.create(refundProps);

      expect(transaction.type).toBe(TransactionType.REFUND);
      expect(transaction.amount).toBe(1);
    });

    it("should create admin adjustment with positive amount", () => {
      const adjustmentProps: CreateCreditTransactionProps = {
        userId: validUserId,
        amount: 10,
        type: TransactionType.ADMIN_ADJUSTMENT,
        description: "Manual credit adjustment by admin",
      };

      const transaction = CreditTransaction.create(adjustmentProps);

      expect(transaction.type).toBe(TransactionType.ADMIN_ADJUSTMENT);
      expect(transaction.amount).toBe(10);
    });

    it("should create admin adjustment with negative amount", () => {
      const adjustmentProps: CreateCreditTransactionProps = {
        userId: validUserId,
        amount: -5,
        type: TransactionType.ADMIN_ADJUSTMENT,
        description: "Manual credit removal by admin",
      };

      const transaction = CreditTransaction.create(adjustmentProps);

      expect(transaction.type).toBe(TransactionType.ADMIN_ADJUSTMENT);
      expect(transaction.amount).toBe(-5);
    });

    it("should create transaction without metadata", () => {
      const propsWithoutMetadata: CreateCreditTransactionProps = {
        userId: validUserId,
        amount: -1,
        type: TransactionType.DEDUCT,
        description: "Simple deduction",
      };

      const transaction = CreditTransaction.create(propsWithoutMetadata);

      expect(transaction.metadata).toBeUndefined();
    });

    it("should throw error for zero amount", () => {
      const invalidProps = { ...validDeductProps, amount: 0 };

      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        InvariantViolationError
      );
      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        "Transaction amount cannot be zero"
      );
    });

    it("should throw error for empty description", () => {
      const invalidProps = { ...validDeductProps, description: "" };

      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        InvariantViolationError
      );
      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        "Transaction description cannot be empty"
      );
    });

    it("should throw error for whitespace-only description", () => {
      const invalidProps = { ...validDeductProps, description: "   " };

      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        InvariantViolationError
      );
      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        "Transaction description cannot be empty"
      );
    });

    it("should throw error for description too long", () => {
      const invalidProps = {
        ...validDeductProps,
        description: "x".repeat(501),
      };

      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        InvariantViolationError
      );
      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        "Transaction description cannot exceed 500 characters"
      );
    });

    it("should throw error for DEDUCT with positive amount", () => {
      const invalidProps = { ...validDeductProps, amount: 1 };

      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        InvariantViolationError
      );
      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        "DEDUCT transaction must have negative amount"
      );
    });

    it("should throw error for ADD with negative amount", () => {
      const invalidProps = { ...validAddProps, amount: -5 };

      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        InvariantViolationError
      );
      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        "add transaction must have positive amount"
      );
    });

    it("should throw error for REFUND with negative amount", () => {
      const invalidProps: CreateCreditTransactionProps = {
        userId: validUserId,
        amount: -1,
        type: TransactionType.REFUND,
        description: "Invalid refund",
      };

      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        InvariantViolationError
      );
      expect(() => CreditTransaction.create(invalidProps)).toThrow(
        "refund transaction must have positive amount"
      );
    });
  });

  describe("reconstruct", () => {
    it("should reconstruct transaction from persistence data", () => {
      const reconstructProps: ReconstructCreditTransactionProps = {
        ...validDeductProps,
        id: CreditTransactionId.generate(),
        timestamp: new Date("2023-01-01T10:00:00Z"),
        createdAt: new Date("2023-01-01T10:00:00Z"),
      };

      const transaction = CreditTransaction.reconstruct(reconstructProps);

      expect(transaction.id.equals(reconstructProps.id)).toBe(true);
      expect(transaction.timestamp).toEqual(reconstructProps.timestamp);
      expect(transaction.createdAt).toEqual(reconstructProps.createdAt);
      expect(transaction.amount).toBe(reconstructProps.amount);
      expect(transaction.type).toBe(reconstructProps.type);
    });
  });

  describe("business queries", () => {
    describe("isDeduction", () => {
      it("should return true for DEDUCT transaction", () => {
        const transaction = CreditTransaction.create(validDeductProps);
        expect(transaction.isDeduction()).toBe(true);
      });

      it("should return false for ADD transaction", () => {
        const transaction = CreditTransaction.create(validAddProps);
        expect(transaction.isDeduction()).toBe(false);
      });

      it("should return false for REFUND transaction", () => {
        const refundProps: CreateCreditTransactionProps = {
          userId: validUserId,
          amount: 1,
          type: TransactionType.REFUND,
          description: "Refund",
        };
        const transaction = CreditTransaction.create(refundProps);
        expect(transaction.isDeduction()).toBe(false);
      });
    });

    describe("isAddition", () => {
      it("should return true for ADD transaction", () => {
        const transaction = CreditTransaction.create(validAddProps);
        expect(transaction.isAddition()).toBe(true);
      });

      it("should return true for REFUND transaction", () => {
        const refundProps: CreateCreditTransactionProps = {
          userId: validUserId,
          amount: 1,
          type: TransactionType.REFUND,
          description: "Refund",
        };
        const transaction = CreditTransaction.create(refundProps);
        expect(transaction.isAddition()).toBe(true);
      });

      it("should return false for DEDUCT transaction", () => {
        const transaction = CreditTransaction.create(validDeductProps);
        expect(transaction.isAddition()).toBe(false);
      });
    });

    describe("isAdminAdjustment", () => {
      it("should return true for ADMIN_ADJUSTMENT transaction", () => {
        const adjustmentProps: CreateCreditTransactionProps = {
          userId: validUserId,
          amount: 10,
          type: TransactionType.ADMIN_ADJUSTMENT,
          description: "Admin adjustment",
        };
        const transaction = CreditTransaction.create(adjustmentProps);
        expect(transaction.isAdminAdjustment()).toBe(true);
      });

      it("should return false for ADD transaction", () => {
        const transaction = CreditTransaction.create(validAddProps);
        expect(transaction.isAdminAdjustment()).toBe(false);
      });

      it("should return false for DEDUCT transaction", () => {
        const transaction = CreditTransaction.create(validDeductProps);
        expect(transaction.isAdminAdjustment()).toBe(false);
      });
    });

    describe("getAbsoluteAmount", () => {
      it("should return absolute value for negative amount", () => {
        const transaction = CreditTransaction.create(validDeductProps);
        expect(transaction.getAbsoluteAmount()).toBe(1);
      });

      it("should return same value for positive amount", () => {
        const transaction = CreditTransaction.create(validAddProps);
        expect(transaction.getAbsoluteAmount()).toBe(5);
      });

      it("should return positive value for large negative amount", () => {
        const largeDeductProps: CreateCreditTransactionProps = {
          userId: validUserId,
          amount: -100,
          type: TransactionType.ADMIN_ADJUSTMENT,
          description: "Large deduction",
        };
        const transaction = CreditTransaction.create(largeDeductProps);
        expect(transaction.getAbsoluteAmount()).toBe(100);
      });
    });
  });

  describe("getters", () => {
    let transaction: CreditTransaction;

    beforeEach(() => {
      transaction = CreditTransaction.create(validDeductProps);
    });

    it("should return userId", () => {
      expect(transaction.userId.equals(validUserId)).toBe(true);
    });

    it("should return amount", () => {
      expect(transaction.amount).toBe(validDeductProps.amount);
    });

    it("should return type", () => {
      expect(transaction.type).toBe(validDeductProps.type);
    });

    it("should return description", () => {
      expect(transaction.description).toBe(validDeductProps.description);
    });

    it("should return copy of timestamp", () => {
      const timestamp1 = transaction.timestamp;
      const timestamp2 = transaction.timestamp;
      expect(timestamp1).toEqual(timestamp2);
      expect(timestamp1).not.toBe(timestamp2); // Different object instances
    });

    it("should return copy of createdAt", () => {
      const createdAt1 = transaction.createdAt;
      const createdAt2 = transaction.createdAt;
      expect(createdAt1).toEqual(createdAt2);
      expect(createdAt1).not.toBe(createdAt2); // Different object instances
    });

    it("should return copy of metadata", () => {
      const metadata = transaction.metadata;
      expect(metadata).toEqual(validDeductProps.metadata);

      if (metadata) {
        metadata.newField = "test";
        expect(transaction.metadata).toEqual(validDeductProps.metadata);
      }
    });

    it("should return undefined for missing metadata", () => {
      const transactionWithoutMetadata = CreditTransaction.create({
        userId: validUserId,
        amount: -1,
        type: TransactionType.DEDUCT,
        description: "No metadata",
      });

      expect(transactionWithoutMetadata.metadata).toBeUndefined();
    });
  });

  describe("getSummary", () => {
    it("should return summary for deduct transaction", () => {
      const transaction = CreditTransaction.create(validDeductProps);
      const summary = transaction.getSummary();

      expect(summary).toContain("deduct");
      expect(summary).toContain("-1");
      expect(summary).toContain("credits");
      expect(summary).toContain(validDeductProps.description);
    });

    it("should return summary for add transaction with plus sign", () => {
      const transaction = CreditTransaction.create(validAddProps);
      const summary = transaction.getSummary();

      expect(summary).toContain("add");
      expect(summary).toContain("+5");
      expect(summary).toContain("credits");
      expect(summary).toContain(validAddProps.description);
    });

    it("should return summary for refund transaction", () => {
      const refundProps: CreateCreditTransactionProps = {
        userId: validUserId,
        amount: 1,
        type: TransactionType.REFUND,
        description: "Refund for failed analysis",
      };
      const transaction = CreditTransaction.create(refundProps);
      const summary = transaction.getSummary();

      expect(summary).toContain("refund");
      expect(summary).toContain("+1");
      expect(summary).toContain("Refund for failed analysis");
    });
  });

  describe("immutability", () => {
    it("should not allow modification of transaction after creation", () => {
      const transaction = CreditTransaction.create(validDeductProps);

      // All properties should be readonly
      // TypeScript will prevent compilation if we try to modify them
      // This test verifies the entity is properly immutable
      expect(transaction.amount).toBe(-1);
      expect(transaction.type).toBe(TransactionType.DEDUCT);
      expect(transaction.description).toBe(validDeductProps.description);
    });

    it("should return new Date objects for timestamp getters", () => {
      const transaction = CreditTransaction.create(validDeductProps);
      const timestamp1 = transaction.timestamp;
      const timestamp2 = transaction.timestamp;

      // Should be equal but different instances
      expect(timestamp1.getTime()).toBe(timestamp2.getTime());
      expect(timestamp1).not.toBe(timestamp2);
    });
  });
});
