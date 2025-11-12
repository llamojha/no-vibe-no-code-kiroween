import { User } from "../entities";
import { UserId, Email, Locale } from "../value-objects";
import { ICommandRepository, IQueryRepository } from "./base/IRepository";
import {
  Result,
  PaginatedResult,
  PaginationParams,
} from "../../shared/types/common";

/**
 * Search criteria for user queries
 */
export interface UserSearchCriteria {
  email?: Email;
  emailDomain?: string;
  isActive?: boolean;
  hasName?: boolean;
  defaultLocale?: Locale;
  createdAfter?: Date;
  createdBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
  nameContains?: string;
}

/**
 * Sorting options for user queries
 */
export interface UserSortOptions {
  field: "createdAt" | "updatedAt" | "lastLoginAt" | "email" | "name";
  direction: "asc" | "desc";
}

/**
 * Command repository interface for User write operations
 */
export interface IUserCommandRepository
  extends ICommandRepository<User, UserId> {
  /**
   * Save a new user with validation
   */
  save(user: User): Promise<Result<User, Error>>;

  /**
   * Update an existing user
   * @param user - The user to update
   * @param requestingUserId - Optional ID of the user making the request (for authorization)
   */
  update(user: User, requestingUserId?: UserId): Promise<Result<User, Error>>;

  /**
   * Delete a user by ID
   * @param id - The ID of the user to delete
   * @param requestingUserId - Optional ID of the user making the request (for authorization)
   */
  delete(id: UserId, requestingUserId?: UserId): Promise<Result<void, Error>>;

  /**
   * Activate a user account
   */
  activate(id: UserId): Promise<Result<void, Error>>;

  /**
   * Deactivate a user account
   */
  deactivate(id: UserId): Promise<Result<void, Error>>;

  /**
   * Update user's last login timestamp
   */
  updateLastLogin(id: UserId, loginTime: Date): Promise<Result<void, Error>>;

  /**
   * Update user's credit balance
   * @param userId - The user ID to update credits for
   * @param credits - The new credit balance
   */
  updateCredits(userId: UserId, credits: number): Promise<Result<void, Error>>;

  /**
   * Bulk deactivate users that haven't logged in for specified days
   */
  deactivateInactiveUsers(days: number): Promise<Result<number, Error>>;
}

/**
 * Query repository interface for User read operations
 */
export interface IUserQueryRepository extends IQueryRepository<User, UserId> {
  /**
   * Find user by ID with optional authorization context
   * @param id - User ID to look up
   * @param requestingUserId - Optional user ID for ownership/authorization checks
   */
  findById(
    id: UserId,
    requestingUserId?: UserId
  ): Promise<Result<User | null, Error>>;
  /**
   * Find a user by email address
   */
  findByEmail(email: Email): Promise<Result<User | null, Error>>;

  /**
   * Find users by email domain
   */
  findByEmailDomain(
    domain: string,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>>;

  /**
   * Find active users with pagination
   */
  findActive(
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>>;

  /**
   * Find inactive users with pagination
   */
  findInactive(
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>>;

  /**
   * Find new users (created within specified days)
   */
  findNewUsers(
    days: number,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>>;

  /**
   * Find users with recent activity (logged in within specified days)
   */
  findWithRecentActivity(
    days: number,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>>;

  /**
   * Search users with complex criteria
   */
  search(
    criteria: UserSearchCriteria,
    sort: UserSortOptions,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>>;

  /**
   * Find users by locale preference
   */
  findByLocale(
    locale: Locale,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>>;

  /**
   * Get user statistics
   */
  getUserStats(): Promise<
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
  >;

  /**
   * Find users who haven't logged in for specified days
   */
  findInactiveForDays(
    days: number,
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>>;

  /**
   * Find users with incomplete profiles
   */
  findWithIncompleteProfiles(
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>>;

  /**
   * Check if email is already taken
   */
  isEmailTaken(email: Email): Promise<Result<boolean, Error>>;

  /**
   * Find users who should receive notifications
   */
  findForNotifications(
    notificationType: "email" | "analysis_reminder",
    params: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>>;
}

/**
 * Combined User repository interface
 * Provides both command and query operations
 */
export interface IUserRepository
  extends IUserCommandRepository,
    IUserQueryRepository {
  // Ensure unified overload is available on the combined interface
  findById(
    id: UserId,
    requestingUserId?: UserId
  ): Promise<Result<User | null, Error>>;
}
