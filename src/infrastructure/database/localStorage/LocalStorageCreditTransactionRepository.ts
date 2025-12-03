/**
 * LocalStorageCreditTransactionRepository - localStorage implementation of ICreditTransactionRepository
 * Stores credit transactions for audit trail in Open Source Mode
 */

import { CreditTransaction } from "../../../domain/entities";
import {
  CreditTransactionId,
  UserId,
  TransactionType,
} from "../../../domain/value-objects";
import { ICreditTransactionRepository } from "../../../domain/repositories/ICreditTransactionRepository";
import {
  Result,
  PaginatedResult,
  PaginationParams,
  success,
  failure,
  createPaginatedResult,
} from "../../../shared/types/common";
import {
  LocalStorageAdapter,
  STORAGE_KEYS,
  LocalStorageError,
  StorageQuotaError,
} from "./LocalStorageAdapter";

export interface StoredCreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "deduct" | "add" | "refund" | "admin_adjustment";
  description: string;
  timestamp: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

function toStored(t: CreditTransaction): StoredCreditTransaction {
  return {
    id: t.id.value,
    userId: t.userId.value,
    amount: t.amount,
    type: t.type as "deduct" | "add" | "refund" | "admin_adjustment",
    description: t.description,
    timestamp: t.timestamp.toISOString(),
    createdAt: t.createdAt.toISOString(),
    metadata: t.metadata,
  };
}

function toDomain(s: StoredCreditTransaction): CreditTransaction {
  return CreditTransaction.reconstruct({
    id: CreditTransactionId.reconstruct(s.id),
    userId: UserId.reconstruct(s.userId),
    amount: s.amount,
    type: s.type as TransactionType,
    description: s.description,
    timestamp: new Date(s.timestamp),
    createdAt: new Date(s.createdAt),
    metadata: s.metadata,
  });
}

export class LocalStorageCreditTransactionRepository
  implements ICreditTransactionRepository
{
  private readonly adapter = new LocalStorageAdapter<StoredCreditTransaction>(
    STORAGE_KEYS.CREDITS
  );

  async recordTransaction(
    transaction: CreditTransaction
  ): Promise<Result<void, Error>> {
    try {
      this.adapter.save(toStored(transaction));
      return success(undefined);
    } catch (e) {
      return failure(
        e instanceof StorageQuotaError
          ? e
          : new LocalStorageError("Failed to record transaction", e)
      );
    }
  }

  async save(t: CreditTransaction): Promise<Result<CreditTransaction, Error>> {
    try {
      this.adapter.save(toStored(t));
      return success(t);
    } catch (e) {
      return failure(
        e instanceof StorageQuotaError
          ? e
          : new LocalStorageError("Failed to save transaction", e)
      );
    }
  }

  async update(
    t: CreditTransaction
  ): Promise<Result<CreditTransaction, Error>> {
    try {
      this.adapter.update(t.id.value, toStored(t));
      return success(t);
    } catch (e) {
      return failure(new LocalStorageError("Failed to update transaction", e));
    }
  }

  async delete(id: CreditTransactionId): Promise<Result<void, Error>> {
    try {
      this.adapter.delete(id.value);
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to delete transaction", e));
    }
  }

  async saveMany(
    entities: CreditTransaction[]
  ): Promise<Result<CreditTransaction[], Error>> {
    try {
      entities.forEach((t) => this.adapter.save(toStored(t)));
      return success(entities);
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to save many transactions", e)
      );
    }
  }

  async deleteMany(ids: CreditTransactionId[]): Promise<Result<void, Error>> {
    try {
      ids.forEach((id) => this.adapter.delete(id.value));
      return success(undefined);
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to delete many transactions", e)
      );
    }
  }

  async findById(
    id: CreditTransactionId
  ): Promise<Result<CreditTransaction | null, Error>> {
    try {
      const s = this.adapter.getById(id.value);
      return success(s ? toDomain(s) : null);
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find transaction by ID", e)
      );
    }
  }

  async exists(id: CreditTransactionId): Promise<Result<boolean, Error>> {
    try {
      return success(this.adapter.exists(id.value));
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to check transaction existence", e)
      );
    }
  }

  async count(): Promise<Result<number, Error>> {
    try {
      return success(this.adapter.count());
    } catch (e) {
      return failure(new LocalStorageError("Failed to count transactions", e));
    }
  }

  async getTransactionHistory(
    userId: UserId,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<CreditTransaction>, Error>> {
    try {
      const items = this.adapter
        .findWhere((i) => i.userId === userId.value)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to get transaction history", e)
      );
    }
  }

  async getTransactionsByType(
    userId: UserId,
    type: TransactionType
  ): Promise<Result<CreditTransaction[], Error>> {
    try {
      return success(
        this.adapter
          .findWhere((i) => i.userId === userId.value && i.type === type)
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .map(toDomain)
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to get transactions by type", e)
      );
    }
  }

  async getRecentTransactions(
    userId: UserId,
    limit: number
  ): Promise<Result<CreditTransaction[], Error>> {
    try {
      return success(
        this.adapter
          .findWhere((i) => i.userId === userId.value)
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, limit)
          .map(toDomain)
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to get recent transactions", e)
      );
    }
  }

  async findAll(
    p: PaginationParams
  ): Promise<Result<PaginatedResult<CreditTransaction>, Error>> {
    try {
      const items = this.adapter
        .getAll()
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find all transactions", e)
      );
    }
  }

  async findByIds(
    ids: CreditTransactionId[]
  ): Promise<Result<CreditTransaction[], Error>> {
    try {
      const set = new Set(ids.map((id) => id.value));
      return success(
        this.adapter
          .getAll()
          .filter((i) => set.has(i.id))
          .map(toDomain)
      );
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find transactions by IDs", e)
      );
    }
  }

  async findWhere(
    criteria: Record<string, unknown>
  ): Promise<Result<CreditTransaction[], Error>> {
    try {
      const items = this.adapter.findWhere((i) =>
        Object.entries(criteria).every(
          ([k, v]) => (i as unknown as Record<string, unknown>)[k] === v
        )
      );
      return success(items.map(toDomain));
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to find transactions where", e)
      );
    }
  }

  async findWhereWithPagination(
    criteria: Record<string, unknown>,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<CreditTransaction>, Error>> {
    try {
      const items = this.adapter.findWhere((i) =>
        Object.entries(criteria).every(
          ([k, v]) => (i as unknown as Record<string, unknown>)[k] === v
        )
      );
      const off = (p.page - 1) * p.limit;
      return success(
        createPaginatedResult(
          items.slice(off, off + p.limit).map(toDomain),
          items.length,
          p.page,
          p.limit
        )
      );
    } catch (e) {
      return failure(
        new LocalStorageError(
          "Failed to find transactions where with pagination",
          e
        )
      );
    }
  }
}
