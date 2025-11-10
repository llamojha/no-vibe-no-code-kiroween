import { SupabaseClient } from "@supabase/supabase-js";
import { User } from "../../../../domain/entities";
import { UserId, Email, Locale } from "../../../../domain/value-objects";
import {
  IUserRepository,
  UserSearchCriteria,
  UserSortOptions,
} from "../../../../domain/repositories/IUserRepository";
import {
  Result,
  PaginatedResult,
  PaginationParams,
  success,
  failure,
  createPaginatedResult,
} from "../../../../shared/types/common";
import { AuthorizationError } from "../../../../shared/types/errors";
import { Database } from "../../types";
import {
  DatabaseQueryError,
  RecordNotFoundError,
  UniqueConstraintError,
} from "../../errors";
import { UserMapper } from "../mappers/UserMapper";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Supabase implementation of the User repository
 * Handles all database operations for User entities
 */
export class SupabaseUserRepository implements IUserRepository {
  private readonly tableName = "profiles";

  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly mapper: UserMapper
  ) {}

  /**
   * Helper method to fetch user email from auth.users
   * Returns null if email cannot be retrieved
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      // Fetch user from auth.users via admin API
      const { data, error } = await this.client.auth.admin.getUserById(userId);

      if (error || !data.user) {
        logger.warn(
          LogCategory.DATABASE,
          "Could not fetch user email from auth.users",
          {
            userId,
            error: error?.message,
          }
        );
        return null;
      }

      return data.user.email || null;
    } catch (error) {
      logger.error(LogCategory.DATABASE, "Error fetching user email", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  // Command operations (write)

  async save(user: User): Promise<Result<User, Error>> {
    try {
      const dao = this.mapper.toDAO(user);

      const { data, error } = await this.client
        .from(this.tableName)
        .insert(dao)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          return failure(new UniqueConstraintError("id", user.id.value, error));
        }
        return failure(
          new DatabaseQueryError("Failed to save user", error, "INSERT")
        );
      }

      // Fetch email from auth.users for the saved user
      const email = await this.getUserEmail(user.id.value);

      const savedUser = this.mapper.toDomain(data as any, email || undefined);
      return success(savedUser);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error saving user", error)
      );
    }
  }

  async update(
    user: User,
    requestingUserId?: UserId
  ): Promise<Result<User, Error>> {
    try {
      // Verify requesting user is updating their own profile
      if (requestingUserId && user.id.value !== requestingUserId.value) {
        logger.warn(LogCategory.DATABASE, "Unauthorized user update attempt", {
          userId: user.id.value,
          requestingUserId: requestingUserId.value,
        });
        return failure(
          new AuthorizationError("Cannot update another user's profile")
        );
      }

      const dao = this.mapper.toDAO(user);

      const { data, error } = await this.client
        .from(this.tableName)
        .update(dao)
        .eq("id", user.id.value)
        .select()
        .single();

      if (error) {
        return failure(
          new DatabaseQueryError("Failed to update user", error, "UPDATE")
        );
      }

      if (!data) {
        return failure(new RecordNotFoundError("User", user.id.value));
      }

      // Fetch email from auth.users for the updated user
      const email = await this.getUserEmail(user.id.value);

      const updatedUser = this.mapper.toDomain(data as any, email || undefined);
      return success(updatedUser);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error updating user", error)
      );
    }
  }

  async delete(
    id: UserId,
    requestingUserId?: UserId
  ): Promise<Result<void, Error>> {
    try {
      // Verify requesting user is deleting their own account
      if (requestingUserId && id.value !== requestingUserId.value) {
        logger.warn(LogCategory.DATABASE, "Unauthorized user delete attempt", {
          userId: id.value,
          requestingUserId: requestingUserId.value,
        });
        return failure(
          new AuthorizationError("Cannot delete another user's account")
        );
      }

      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq("id", id.value);

      if (error) {
        return failure(
          new DatabaseQueryError("Failed to delete user", error, "DELETE")
        );
      }

      return success(undefined);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error deleting user", error)
      );
    }
  }

  async activate(id: UserId): Promise<Result<void, Error>> {
    try {
      // In this simplified implementation, we don't have an active field
      // This would typically update an 'is_active' or 'status' field
      const { error } = await this.client
        .from(this.tableName)
        .update({ tier: "free" }) // Simplified - just ensure they have a tier
        .eq("id", id.value);

      if (error) {
        return failure(
          new DatabaseQueryError("Failed to activate user", error, "UPDATE")
        );
      }

      return success(undefined);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error activating user", error)
      );
    }
  }

  async deactivate(id: UserId): Promise<Result<void, Error>> {
    try {
      // In this simplified implementation, we could set tier to a special value
      // or add a separate is_active field in the future
      const { error } = await this.client
        .from(this.tableName)
        .update({ tier: "free" }) // Simplified implementation
        .eq("id", id.value);

      if (error) {
        return failure(
          new DatabaseQueryError("Failed to deactivate user", error, "UPDATE")
        );
      }

      return success(undefined);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error deactivating user", error)
      );
    }
  }

  async updateLastLogin(
    id: UserId,
    loginTime: Date
  ): Promise<Result<void, Error>> {
    try {
      // In this simplified implementation, we don't have a last_login field
      // This would typically update a 'last_login_at' timestamp field
      // For now, we'll just update the updated_at equivalent (created_at in our case)
      const { error } = await this.client
        .from(this.tableName)
        .update({ created_at: loginTime.toISOString() })
        .eq("id", id.value);

      if (error) {
        return failure(
          new DatabaseQueryError("Failed to update last login", error, "UPDATE")
        );
      }

      return success(undefined);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error updating last login", error)
      );
    }
  }

  async deactivateInactiveUsers(days: number): Promise<Result<number, Error>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // In this simplified implementation, we'll just count users
      // In a real implementation, this would update users who haven't logged in
      const { data, error } = await this.client
        .from(this.tableName)
        .select("id")
        .lt("created_at", cutoffDate.toISOString());

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to deactivate inactive users",
            error,
            "SELECT"
          )
        );
      }

      return success(data.length);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error deactivating inactive users",
          error
        )
      );
    }
  }

  async saveMany(entities: User[]): Promise<Result<User[], Error>> {
    try {
      const daos = entities.map((entity) => this.mapper.toDAO(entity));

      const { data, error } = await this.client
        .from(this.tableName)
        .insert(daos)
        .select();

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to save multiple users",
            error,
            "INSERT"
          )
        );
      }

      const savedUsers = data.map((dao) => this.mapper.toDomain(dao as any));
      return success(savedUsers);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error saving multiple users", error)
      );
    }
  }

  async deleteMany(ids: UserId[]): Promise<Result<void, Error>> {
    try {
      const idValues = ids.map((id) => id.value);

      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .in("id", idValues);

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to delete multiple users",
            error,
            "DELETE"
          )
        );
      }

      return success(undefined);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error deleting multiple users",
          error
        )
      );
    }
  }

  // Query operations (read)

  async findById(
    id: UserId,
    requestingUserId?: UserId
  ): Promise<Result<User | null, Error>> {
    try {
      // Verify requesting user is accessing their own profile
      if (requestingUserId && id.value !== requestingUserId.value) {
        logger.warn(LogCategory.DATABASE, "Unauthorized user access attempt", {
          userId: id.value,
          requestingUserId: requestingUserId.value,
        });
        return failure(
          new AuthorizationError("Cannot access another user's profile")
        );
      }

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
          new DatabaseQueryError("Failed to find user by ID", error, "SELECT")
        );
      }

      // Fetch email from auth.users
      const email = await this.getUserEmail(id.value);

      const user = this.mapper.toDomain(data as any, email || undefined);
      return success(user);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error finding user by ID", error)
      );
    }
  }

  async exists(id: UserId): Promise<Result<boolean, Error>> {
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
            "Failed to check user existence",
            error,
            "SELECT"
          )
        );
      }

      return success(!!data);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error checking user existence",
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
          new DatabaseQueryError("Failed to count users", error, "COUNT")
        );
      }

      return success(count || 0);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error counting users", error)
      );
    }
  }

  async findAll(
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;

      const { data, error, count } = await this.client
        .from(this.tableName)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(
          new DatabaseQueryError("Failed to find all users", error, "SELECT")
        );
      }

      const users = data.map((dao) => this.mapper.toDomain(dao as any));
      const paginatedResult = createPaginatedResult(
        users,
        count || 0,
        params.page,
        params.limit
      );

      return success(paginatedResult);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error finding all users", error)
      );
    }
  }

  async findByIds(ids: UserId[]): Promise<Result<User[], Error>> {
    try {
      const idValues = ids.map((id) => id.value);

      const { data, error } = await this.client
        .from(this.tableName)
        .select("*")
        .in("id", idValues);

      if (error) {
        return failure(
          new DatabaseQueryError("Failed to find users by IDs", error, "SELECT")
        );
      }

      const users = data.map((dao) => this.mapper.toDomain(dao as any));
      return success(users);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error finding users by IDs", error)
      );
    }
  }

  async findWhere(
    criteria: Record<string, unknown>
  ): Promise<Result<User[], Error>> {
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
            "Failed to find users with criteria",
            error,
            "SELECT"
          )
        );
      }

      const users = data.map((dao) => this.mapper.toDomain(dao as any));
      return success(users);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error finding users with criteria",
          error
        )
      );
    }
  }

  async findWhereWithPagination(
    criteria: Record<string, unknown>,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
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
        .order("created_at", { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(
          new DatabaseQueryError(
            "Failed to find users with criteria and pagination",
            error,
            "SELECT"
          )
        );
      }

      const users = data.map((dao) => this.mapper.toDomain(dao as any));
      const paginatedResult = createPaginatedResult(
        users,
        count || 0,
        params.page,
        params.limit
      );

      return success(paginatedResult);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error finding users with criteria and pagination",
          error
        )
      );
    }
  }

  // User-specific query methods

  async findByEmail(__email: Email): Promise<Result<User | null, Error>> {
    try {
      // Note: In the current schema, we don't have an email field in profiles
      // This would typically query a separate user_emails table or auth.users
      // For now, we'll return null as this feature isn't implemented in the current schema
      return success(null);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error finding user by email", error)
      );
    }
  }

  async findByEmailDomain(
    domain: string,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      // Not implemented in current schema - would need email field
      const emptyResult = createPaginatedResult(
        [],
        0,
        params.page,
        params.limit
      );
      return success(emptyResult);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error finding users by email domain",
          error
        )
      );
    }
  }

  async findActive(
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      // In our simplified schema, we'll consider all users as active
      // In a real implementation, this would filter by an is_active field
      return this.findAll(params);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error finding active users", error)
      );
    }
  }

  async findInactive(
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      // In our simplified schema, we'll return empty results
      // In a real implementation, this would filter by is_active = false
      const emptyResult = createPaginatedResult(
        [],
        0,
        params.page,
        params.limit
      );
      return success(emptyResult);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error finding inactive users", error)
      );
    }
  }

  async findNewUsers(
    days: number,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error, count } = await this.client
        .from(this.tableName)
        .select("*", { count: "exact" })
        .gte("created_at", cutoffDate.toISOString())
        .order("created_at", { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) {
        return failure(
          new DatabaseQueryError("Failed to find new users", error, "SELECT")
        );
      }

      const users = data.map((dao) => this.mapper.toDomain(dao as any));
      const paginatedResult = createPaginatedResult(
        users,
        count || 0,
        params.page,
        params.limit
      );

      return success(paginatedResult);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error finding new users", error)
      );
    }
  }

  async findWithRecentActivity(
    days: number,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      // In our simplified schema, we'll use created_at as a proxy for activity
      // In a real implementation, this would use last_login_at or similar
      return this.findNewUsers(days, params);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error finding users with recent activity",
          error
        )
      );
    }
  }

  async search(
    criteria: UserSearchCriteria,
    sort: UserSortOptions,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      const offset = (params.page - 1) * params.limit;
      let query = this.client
        .from(this.tableName)
        .select("*", { count: "exact" });

      // Apply search criteria (simplified - many fields not in current schema)
      if (criteria.createdAfter) {
        query = query.gte("created_at", criteria.createdAfter.toISOString());
      }

      if (criteria.createdBefore) {
        query = query.lte("created_at", criteria.createdBefore.toISOString());
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === "asc" });

      const { data, error, count } = await query.range(
        offset,
        offset + params.limit - 1
      );

      if (error) {
        return failure(
          new DatabaseQueryError("Failed to search users", error, "SELECT")
        );
      }

      const users = data.map((dao) => this.mapper.toDomain(dao as any));
      const paginatedResult = createPaginatedResult(
        users,
        count || 0,
        params.page,
        params.limit
      );

      return success(paginatedResult);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error searching users", error)
      );
    }
  }

  async findByLocale(
    locale: Locale,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      // Not implemented in current schema - would need locale field
      const emptyResult = createPaginatedResult(
        [],
        0,
        params.page,
        params.limit
      );
      return success(emptyResult);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error finding users by locale",
          error
        )
      );
    }
  }

  async getUserStats(): Promise<
    Result<
      {
        totalCount: number;
        activeCount: number;
        inactiveCount: number;
        newUsersThisWeek: number;
        newUsersThisMonth: number;
        usersWithRecentActivity: number;
        localeDistribution: Record<string, number>;
        emailDomainDistribution: Record<string, number>;
      },
      Error
    >
  > {
    try {
      const { data: users, error } = (await this.client
        .from(this.tableName)
        .select("*")) as { data: any[]; error: any };

      if (error) {
        return failure(
          new DatabaseQueryError("Failed to get user stats", error, "SELECT")
        );
      }

      const totalCount = users.length;
      const activeCount = totalCount; // Simplified - all users considered active
      const inactiveCount = 0;

      // Count new users this week and month
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

      const newUsersThisWeek = users.filter(
        (u) => u.created_at && new Date(u.created_at) >= oneWeekAgo
      ).length;

      const newUsersThisMonth = users.filter(
        (u) => u.created_at && new Date(u.created_at) >= oneMonthAgo
      ).length;

      return success({
        totalCount,
        activeCount,
        inactiveCount,
        newUsersThisWeek,
        newUsersThisMonth,
        usersWithRecentActivity: newUsersThisWeek, // Simplified
        localeDistribution: {}, // Not implemented in current schema
        emailDomainDistribution: {}, // Not implemented in current schema
      });
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error getting user stats", error)
      );
    }
  }

  async findInactiveForDays(
    days: number,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      // In our simplified schema, we'll return empty results
      const emptyResult = createPaginatedResult(
        [],
        0,
        params.page,
        params.limit
      );
      return success(emptyResult);
    } catch (error) {
      return failure(
        new DatabaseQueryError("Unexpected error finding inactive users", error)
      );
    }
  }

  async findWithIncompleteProfiles(
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      // In our simplified schema, we'll return empty results
      const emptyResult = createPaginatedResult(
        [],
        0,
        params.page,
        params.limit
      );
      return success(emptyResult);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error finding users with incomplete profiles",
          error
        )
      );
    }
  }

  async isEmailTaken(__email: Email): Promise<Result<boolean, Error>> {
    try {
      // Not implemented in current schema
      return success(false);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error checking if email is taken",
          error
        )
      );
    }
  }

  async findForNotifications(
    notificationType: "email" | "analysis_reminder",
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      // In our simplified schema, we'll return all users
      return this.findAll(params);
    } catch (error) {
      return failure(
        new DatabaseQueryError(
          "Unexpected error finding users for notifications",
          error
        )
      );
    }
  }
}
