import { CreditTransaction } from "../../../../domain/entities/CreditTransaction";
import {
  CreditTransactionId,
  UserId,
  TransactionType,
} from "../../../../domain/value-objects";
import { CreditTransactionDAO } from "../../types/dao";
import {
  CreditTransactionRow,
  CreditTransactionInsert,
  CreditTransactionUpdate,
} from "../../types/database";

/**
 * Mapper class for converting between CreditTransaction domain entities and DAOs
 * Handles credit transaction transformations and metadata serialization
 */
export class CreditTransactionMapper {
  /**
   * Convert CreditTransaction domain entity to DAO for database persistence
   */
  toDAO(transaction: CreditTransaction): CreditTransactionDAO {
    return {
      id: transaction.id.value,
      user_id: transaction.userId.value,
      amount: transaction.amount,
      type: transaction.type as CreditTransactionDAO["type"],
      description: transaction.description,
      metadata: transaction.metadata || null,
      timestamp: transaction.timestamp.toISOString(),
      created_at: transaction.createdAt.toISOString(),
    };
  }

  /**
   * Convert DAO from database to CreditTransaction domain entity
   */
  toDomain(dao: CreditTransactionDAO): CreditTransaction {
    const createdAtIso = dao.created_at ?? dao.timestamp;

    return CreditTransaction.reconstruct({
      id: CreditTransactionId.reconstruct(dao.id),
      userId: UserId.reconstruct(dao.user_id),
      amount: dao.amount,
      type: this.mapTransactionType(dao.type),
      description: dao.description,
      metadata: dao.metadata
        ? (dao.metadata as Record<string, any>)
        : undefined,
      timestamp: new Date(dao.timestamp),
      createdAt: new Date(createdAtIso),
    });
  }

  /**
   * Convert Supabase row to DAO
   */
  fromSupabaseRow(row: CreditTransactionRow): CreditTransactionDAO {
    return {
      id: row.id,
      user_id: row.user_id,
      amount: row.amount,
      type: row.type,
      description: row.description,
      metadata: row.metadata,
      timestamp: row.timestamp,
      created_at: row.created_at,
    };
  }

  /**
   * Convert DAO to Supabase insert format
   */
  toSupabaseInsert(dao: CreditTransactionDAO): CreditTransactionInsert {
    return {
      id: dao.id,
      user_id: dao.user_id,
      amount: dao.amount,
      type: dao.type,
      description: dao.description,
      metadata: dao.metadata,
      timestamp: dao.timestamp,
      created_at: dao.created_at ?? undefined,
    };
  }

  /**
   * Convert DAO to Supabase update format
   */
  toSupabaseUpdate(dao: CreditTransactionDAO): CreditTransactionUpdate {
    return {
      amount: dao.amount,
      type: dao.type,
      description: dao.description,
      metadata: dao.metadata,
      // Note: id, user_id, timestamp, and created_at are typically not updated
    };
  }

  /**
   * Convert CreditTransaction domain entity directly to Supabase insert format
   */
  toSupabaseInsertFromDomain(
    transaction: CreditTransaction
  ): CreditTransactionInsert {
    const dao = this.toDAO(transaction);
    return this.toSupabaseInsert(dao);
  }

  /**
   * Convert Supabase row directly to domain entity
   */
  fromSupabaseRowToDomain(row: CreditTransactionRow): CreditTransaction {
    const dao = this.fromSupabaseRow(row);
    return this.toDomain(dao);
  }

  /**
   * Batch convert multiple Supabase rows to domain entities
   */
  fromSupabaseRowsToDomain(rows: CreditTransactionRow[]): CreditTransaction[] {
    return rows.map((row) => this.fromSupabaseRowToDomain(row));
  }

  /**
   * Map database transaction type to domain TransactionType enum
   */
  private mapTransactionType(
    type: CreditTransactionDAO["type"]
  ): TransactionType {
    switch (type) {
      case "deduct":
        return TransactionType.DEDUCT;
      case "add":
        return TransactionType.ADD;
      case "refund":
        return TransactionType.REFUND;
      case "admin_adjustment":
        return TransactionType.ADMIN_ADJUSTMENT;
      default:
        throw new Error(`Unknown transaction type: ${type}`);
    }
  }

  /**
   * Validate DAO structure before conversion
   */
  private validateDAO(dao: CreditTransactionDAO): void {
    if (!dao.id || typeof dao.id !== "string") {
      throw new Error("Invalid DAO: id is required and must be a string");
    }

    if (!dao.user_id || typeof dao.user_id !== "string") {
      throw new Error("Invalid DAO: user_id is required and must be a string");
    }

    if (typeof dao.amount !== "number") {
      throw new Error("Invalid DAO: amount is required and must be a number");
    }

    if (
      !dao.type ||
      !["deduct", "add", "refund", "admin_adjustment"].includes(dao.type)
    ) {
      throw new Error(
        "Invalid DAO: type must be one of: deduct, add, refund, admin_adjustment"
      );
    }

    if (!dao.description || typeof dao.description !== "string") {
      throw new Error(
        "Invalid DAO: description is required and must be a string"
      );
    }
  }
}
