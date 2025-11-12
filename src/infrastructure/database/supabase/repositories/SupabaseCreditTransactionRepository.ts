import { SupabaseClient } from "@supabase/supabase-js";
import { CreditTransaction } from "../../../../domain/entities/CreditTransaction";
import {
  CreditTransactionId,
  UserId,
  TransactionType,
} from "../../../../domain/value-objects";
import { ICreditTransactionRepository } from "../../../../domain/repositories/ICreditTransactionRepository";
import {
  Result,
  PaginatedResult,
  PaginationParams,
  success,
  failure,
  createPaginatedResult,
} from "../../../../shared/types/common";
import { Database } from "../../types";
import { DatabaseQueryError } from "../../errors";
import { CreditTransactionMapper } from "../mappers/CreditTransactionMapper";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Supabase implementation of the CreditTransaction repository
 * Handles all database operations for CreditTransaction entities
 */
export class SupabaseCreditTransactionRepository
  implements ICreditTransactionRepository
{
  private readonly tableName = "credit_transactions";
  private readonly writeClient: SupabaseClient<Database>;
  private static serviceClientWarningLogged = false;

  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly mapper: CreditTransactionMapper,
    serviceRoleClient?: SupabaseClient<Database>
  ) {
    this.writeClient = serviceRoleClient ?? client;

    if (
      !serviceRoleClient &&
      !SupabaseCreditTransactionRepository.serviceClientWarningLogged
    ) {
      SupabaseCreditTransactionRepository.serviceClientWarningLogged = true;
      logger.warn(
        LogCategory.DATABASE,
        "Supabase service client unavailable; falling back to request-scoped client for credit transaction writes. RLS may block inserts."
      );
    }
  }

  // Command operations (write)

  async recordTransaction(
    transaction: CreditTransaction
  ): Promise<Result<void, Error>> {
    try {
      const insertPayload =
        this.mapper.toSupabaseInsertFromDomain(transaction);

      const { error } = await this.writeClient
        .from(this.tableName)
        .insert(insertPayload);

      if (error) {
        logger.error(
          LogCategory.DATABASE,
          "Failed to record credit transaction",
          {
            transactionId: transaction.id.value,
            userId: transaction.userId.value,
            error: error.message,
          }
        );
        return failure(
          new DatabaseQueryError(
            "Failed to record credit transaction",
            error,
            "INSERT"
          )
        );
      }

      logger.info(
        LogCategory.DATABASE,
        "Credit transaction recorded successfully",
        {
          transactionId: transaction.id.value,
          userId: transaction.userId.value,
          type: transaction.type,
          amount: transaction.amount,
        }
      );

      return success(undefined);
    } catch (error) {
      logger.error(
        LogCategory.DATABASE,
        "Unexpected error recording credit transaction",
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return failure(
        new DatabaseQueryError(
          "Unexpected error recording credit transaction",
          error
        )
      );
    }
  }

  async save(
    entity: CreditTransaction
  ): Promise<Result<CreditTransaction, Error>> {
    try {
      const insertPayload = this.mapper.toSupabaseInsertFromDomain(entity);

      const { data, error } = await this.writeClient
        .from(this.tableName)
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to save credit transaction",
            error,
            "INSERT"
          )
        );
      }

      const savedTransaction = this.mapper.toDomain(data as any);
      return success(savedTransaction);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error saving credit transaction",
          error
        )
      );
    }
  }

  async update(
    entity: CreditTransaction
  ): Promise<Result<CreditTransaction, Error>> {
    try {
      // Credit transactions are immutable - updates should not be allowed
      logger.warn(
        LogCategory.DATABASE,
        "Attempted to update immutable credit transaction",
        {
          transactionId: entity.id.value,
        }
      );
      return failure(
        new Error("Credit transactions are immutable and cannot be updated")
      );
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error updating credit transaction",
          error
        )
      );
    }
  }

  async delete(id: CreditTransactionId): Promise<Result<void, Error>> {
    try {
      // Credit transactions should not be deleted for audit trail integrity
      logger.warn(
        LogCategory.DATABASE,
        "Attempted to delete credit transaction",
        {
          transactionId: id.value,
        }
      );
      return failure(
        new Error(
          "Credit transactions cannot be deleted to maintain audit trail integrity"
        )
      );
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error deleting credit transaction",
          error
        )
      );
    }
  }

  async saveMany(
    entities: CreditTransaction[]
  ): Promise<Result<CreditTransaction[], Error>> {
    try {
      const insertPayloads = entities.map((entity) =>
        this.mapper.toSupabaseInsertFromDomain(entity)
      );

      const { data, error } = await this.writeClient
        .from(this.tableName)
        .insert(insertPayloads)
        .select();

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to save multiple credit transactions",
            error,
            "INSERT"
          )
        );
      }

      const savedTransactions = data.map((dao) =>
        this.mapper.toDomain(dao as any)
      );
      return success(savedTransactions);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error saving multiple credit transactions",
          error
        )
      );
    }
  }

  async deleteMany(ids: CreditTransactionId[]): Promise<Result<void, Error>> {
    try {
      // Credit transactions should not be deleted for audit trail integrity
      logger.warn(
        LogCategory.DATABASE,
        "Attempted to delete multiple credit transactions",
        {
          count: ids.length,
        }
      );
      return failure(
        new Error(
          "Credit transactions cannot be deleted to maintain audit trail integrity"
        )
      );
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error deleting multiple credit transactions",
          error
        )
      );
    }
  }

  // Query operations (read)

  async findById(
    id: CreditTransactionId
  ): Promise<Result<CreditTransaction | null, Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq("id", id.value)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return success(null);
        }
        return failure(
          new DatabaseQueryError(
            "Failed to find credit transaction by ID",
            error,
            "SELECT"
          )
        );
      }

      const transaction = this.mapper.toDomain(data as any);
      return success(transaction);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error finding credit transaction by ID",
          error
        )
      );
    }
  }

  async exists(id: CreditTransactionId): Promise<Result<boolean, Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select("id")
        .eq("id", id.value)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return success(false);
        }
        return failure(
          new DatabaseQueryError(
            "Failed to check credit transaction existence",
            error,
            "SELECT"
          )
        );
      }

      return success(!!data);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error checking credit transaction existence",
          error
        )
      );
    }
  }

  async count(): Promise<Result<number, Error>> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select("*", { count: "exact", head: true });

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to count credit transactions",
            error,
            "COUNT"
          )
        );
      }

      return success(count || 0);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error counting credit transactions",
          error
        )
      );
    }
  }

  async findAll(
    params: PaginationParams
  ): Promise<Result<PaginatedResult<CreditTransaction>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;

      const { data, error, count } = await this.client
        .from(this.tableName)
        .select("*", { count: "exact" })
        .order("timestamp", { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to find all credit transactions",
            error,
            "SELECT"
          )
        );
      }

      const transactions = data.map((dao) => this.mapper.toDomain(dao as any));
      const paginatedResult = createPaginatedResult(
        transactions,
        count || 0,
        params.page,
        params.limit
      );

      return success(paginatedResult);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error finding all credit transactions",
          error
        )
      );
    }
  }

  async findByIds(
    ids: CreditTransactionId[]
  ): Promise<Result<CreditTransaction[], Error>> {
    try {
      const idValues = ids.map((id) => id.value);

      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .in("id", idValues);

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to find credit transactions by IDs",
            error,
            "SELECT"
          )
        );
      }

      const transactions = data.map((dao) => this.mapper.toDomain(dao as any));
      return success(transactions);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error finding credit transactions by IDs",
          error
        )
      );
    }
  }

  async findWhere(
    criteria: Record<string, unknown>
  ): Promise<Result<CreditTransaction[], Error>> {
    try {
      let query = this.client.from(this.tableName).select("*");

      // Apply criteria filters
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to find credit transactions with criteria",
            error,
            "SELECT"
          )
        );
      }

      const transactions = data.map((dao) => this.mapper.toDomain(dao as any));
      return success(transactions);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error finding credit transactions with criteria",
          error
        )
      );
    }
  }

  async findWhereWithPagination(
    criteria: Record<string, unknown>,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<CreditTransaction>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;
      let query = this.client
        .from(this.tableName)
        .select("*", { count: "exact" });

      // Apply criteria filters
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error, count } = await query
        .order("timestamp", { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to find credit transactions with criteria and pagination",
            error,
            "SELECT"
          )
        );
      }

      const transactions = data.map((dao) => this.mapper.toDomain(dao as any));
      const paginatedResult = createPaginatedResult(
        transactions,
        count || 0,
        params.page,
        params.limit
      );

      return success(paginatedResult);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error finding credit transactions with criteria and pagination",
          error
        )
      );
    }
  }

  // CreditTransaction-specific query methods

  async getTransactionHistory(
    userId: UserId,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<CreditTransaction>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;

      const { data, error, count } = await this.client
        .from(this.tableName)
        .select("*", { count: "exact" })
        .eq("user_id", userId.value)
        .order("timestamp", { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to get transaction history",
            error,
            "SELECT"
          )
        );
      }

      const transactions = data.map((dao) => this.mapper.toDomain(dao as any));
      const paginatedResult = createPaginatedResult(
        transactions,
        count || 0,
        params.page,
        params.limit
      );

      return success(paginatedResult);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error getting transaction history",
          error
        )
      );
    }
  }

  async getTransactionsByType(
    userId: UserId,
    type: TransactionType
  ): Promise<Result<CreditTransaction[], Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId.value)
        .eq("type", type)
        .order("timestamp", { ascending: false });

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to get transactions by type",
            error,
            "SELECT"
          )
        );
      }

      const transactions = data.map((dao) => this.mapper.toDomain(dao as any));
      return success(transactions);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error getting transactions by type",
          error
        )
      );
    }
  }

  async getRecentTransactions(
    userId: UserId,
    limit: number = 50
  ): Promise<Result<CreditTransaction[], Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId.value)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to get recent transactions",
            error,
            "SELECT"
          )
        );
      }

      const transactions = data.map((dao) => this.mapper.toDomain(dao as any));
      return success(transactions);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error getting recent transactions",
          error
        )
      );
    }
  }
}
