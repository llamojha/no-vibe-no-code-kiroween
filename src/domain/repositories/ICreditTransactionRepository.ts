import { CreditTransaction } from "../entities/CreditTransaction";
import { CreditTransactionId } from "../value-objects/CreditTransactionId";
import { UserId } from "../value-objects/UserId";
import { TransactionType } from "../value-objects/TransactionType";
import { ICommandRepository, IQueryRepository } from "./base/IRepository";
import {
  Result,
  PaginatedResult,
  PaginationParams,
} from "../../shared/types/common";
import type { UserTier } from "../../infrastructure/database/types/database";

/**
 * Credit balance information for a user
 */
export interface CreditBalance {
  credits: number;
  tier: UserTier;
}

/**
 * Command repository interface for CreditTransaction write operations
 */
export interface ICreditTransactionCommandRepository
  extends ICommandRepository<CreditTransaction, CreditTransactionId> {
  /**
   * Record a new credit transaction
   * @param transaction - The transaction to record
   */
  recordTransaction(
    transaction: CreditTransaction
  ): Promise<Result<void, Error>>;
}

/**
 * Query repository interface for CreditTransaction read operations
 */
export interface ICreditTransactionQueryRepository
  extends IQueryRepository<CreditTransaction, CreditTransactionId> {
  /**
   * Get transaction history for a user with pagination
   * @param userId - The user ID to get transactions for
   * @param params - Pagination parameters
   */
  getTransactionHistory(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<CreditTransaction>, Error>>;

  /**
   * Get transactions by type for a user
   * @param userId - The user ID to get transactions for
   * @param type - The transaction type to filter by
   */
  getTransactionsByType(
    userId: UserId,
    type: TransactionType
  ): Promise<Result<CreditTransaction[], Error>>;

  /**
   * Get recent transactions for a user (limited to specified count)
   * @param userId - The user ID to get transactions for
   * @param limit - Maximum number of transactions to return
   */
  getRecentTransactions(
    userId: UserId,
    limit: number
  ): Promise<Result<CreditTransaction[], Error>>;
}

/**
 * Combined CreditTransaction repository interface
 * Provides both command and query operations for credit transaction management
 */
export interface ICreditTransactionRepository
  extends ICreditTransactionCommandRepository,
    ICreditTransactionQueryRepository {}
