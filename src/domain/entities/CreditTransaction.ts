import { Entity } from "./shared/Entity";
import { CreditTransactionId } from "../value-objects/CreditTransactionId";
import { UserId } from "../value-objects/UserId";
import { TransactionType } from "../value-objects/TransactionType";
import { InvariantViolationError } from "../../shared/types/errors";

/**
 * Properties required to create a new CreditTransaction
 */
export interface CreateCreditTransactionProps {
  userId: UserId;
  amount: number;
  type: TransactionType;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Properties for reconstructing a CreditTransaction from persistence
 */
export interface ReconstructCreditTransactionProps
  extends CreateCreditTransactionProps {
  id: CreditTransactionId;
  timestamp: Date;
  createdAt: Date;
}

/**
 * CreditTransaction entity representing a credit transaction in the system
 * Provides an immutable audit trail of all credit operations
 */
export class CreditTransaction extends Entity<CreditTransactionId> {
  private readonly _userId: UserId;
  private readonly _amount: number;
  private readonly _type: TransactionType;
  private readonly _description: string;
  private readonly _timestamp: Date;
  private readonly _createdAt: Date;
  private readonly _metadata?: Record<string, any>;

  private constructor(
    id: CreditTransactionId,
    userId: UserId,
    amount: number,
    type: TransactionType,
    description: string,
    timestamp: Date,
    createdAt: Date,
    metadata?: Record<string, any>
  ) {
    super(id);
    this._userId = userId;
    this._amount = amount;
    this._type = type;
    this._description = description;
    this._timestamp = timestamp;
    this._createdAt = createdAt;
    this._metadata = metadata;

    this.validateInvariants();
  }

  /**
   * Create a new CreditTransaction entity
   */
  static create(props: CreateCreditTransactionProps): CreditTransaction {
    const now = new Date();
    const id = CreditTransactionId.generate();

    return new CreditTransaction(
      id,
      props.userId,
      props.amount,
      props.type,
      props.description,
      now,
      now,
      props.metadata
    );
  }

  /**
   * Reconstruct a CreditTransaction from persistence data
   */
  static reconstruct(
    props: ReconstructCreditTransactionProps
  ): CreditTransaction {
    return new CreditTransaction(
      props.id,
      props.userId,
      props.amount,
      props.type,
      props.description,
      props.timestamp,
      props.createdAt,
      props.metadata
    );
  }

  /**
   * Validate business invariants
   */
  private validateInvariants(): void {
    if (this._amount === 0) {
      throw new InvariantViolationError("Transaction amount cannot be zero");
    }

    if (!this._description || this._description.trim().length === 0) {
      throw new InvariantViolationError(
        "Transaction description cannot be empty"
      );
    }

    if (this._description.length > 500) {
      throw new InvariantViolationError(
        "Transaction description cannot exceed 500 characters"
      );
    }

    // Validate amount sign matches transaction type
    if (this._type === TransactionType.DEDUCT && this._amount > 0) {
      throw new InvariantViolationError(
        "DEDUCT transaction must have negative amount"
      );
    }

    if (
      (this._type === TransactionType.ADD ||
        this._type === TransactionType.REFUND) &&
      this._amount < 0
    ) {
      throw new InvariantViolationError(
        `${this._type} transaction must have positive amount`
      );
    }
  }

  /**
   * Check if this is a deduction transaction
   */
  isDeduction(): boolean {
    return this._type === TransactionType.DEDUCT;
  }

  /**
   * Check if this is an addition transaction
   */
  isAddition(): boolean {
    return (
      this._type === TransactionType.ADD ||
      this._type === TransactionType.REFUND
    );
  }

  /**
   * Check if this is an admin adjustment
   */
  isAdminAdjustment(): boolean {
    return this._type === TransactionType.ADMIN_ADJUSTMENT;
  }

  /**
   * Get the absolute value of the transaction amount
   */
  getAbsoluteAmount(): number {
    return Math.abs(this._amount);
  }

  // Getters
  get userId(): UserId {
    return this._userId;
  }

  get amount(): number {
    return this._amount;
  }

  get type(): TransactionType {
    return this._type;
  }

  get description(): string {
    return this._description;
  }

  get timestamp(): Date {
    return new Date(this._timestamp);
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata ? { ...this._metadata } : undefined;
  }

  /**
   * Get a summary of the transaction
   */
  getSummary(): string {
    const sign = this._amount > 0 ? "+" : "";
    return `${this._type}: ${sign}${this._amount} credits - ${this._description}`;
  }
}
