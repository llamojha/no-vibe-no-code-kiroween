import { z } from 'zod';
import { BaseQuery, PaginatedQuery, SearchQuery, createQuerySchema } from '../base/Query';
import { UserId, Email, Locale } from '../../../domain/value-objects';
import { User } from '../../../domain/entities';
import { PaginationParams, PaginatedResult } from '../../../shared/types/common';

/**
 * Query to get a user by ID
 */
export class GetUserByIdQuery extends BaseQuery {
  constructor(
    public readonly userId: UserId,
    correlationId?: string
  ) {
    super('GET_USER_BY_ID', correlationId);
  }
}

/**
 * Validation schema for GetUserByIdQuery
 */
export const GetUserByIdQuerySchema = createQuerySchema(
  z.object({
    userId: z.string().uuid('Invalid user ID format')
  })
);

/**
 * Query to get a user by email
 */
export class GetUserByEmailQuery extends BaseQuery {
  constructor(
    public readonly email: Email,
    correlationId?: string
  ) {
    super('GET_USER_BY_EMAIL', correlationId);
  }
}

/**
 * Validation schema for GetUserByEmailQuery
 */
export const GetUserByEmailQuerySchema = createQuerySchema(
  z.object({
    email: z.string().email('Invalid email format')
  })
);

/**
 * Query to get users by email domain
 */
export class GetUsersByEmailDomainQuery extends PaginatedQuery {
  constructor(
    public readonly domain: string,
    pagination: PaginationParams,
    correlationId?: string
  ) {
    super('GET_USERS_BY_EMAIL_DOMAIN', pagination, correlationId);
  }
}

/**
 * Query to get active users
 */
export class GetActiveUsersQuery extends PaginatedQuery {
  constructor(
    pagination: PaginationParams,
    correlationId?: string
  ) {
    super('GET_ACTIVE_USERS', pagination, correlationId);
  }
}

/**
 * Query to get inactive users
 */
export class GetInactiveUsersQuery extends PaginatedQuery {
  constructor(
    pagination: PaginationParams,
    correlationId?: string
  ) {
    super('GET_INACTIVE_USERS', pagination, correlationId);
  }
}

/**
 * Query to get new users (created within specified days)
 */
export class GetNewUsersQuery extends PaginatedQuery {
  constructor(
    pagination: PaginationParams,
    public readonly days: number = 7,
    correlationId?: string
  ) {
    super('GET_NEW_USERS', pagination, correlationId);
  }
}

/**
 * Query to get users with recent activity
 */
export class GetUsersWithRecentActivityQuery extends PaginatedQuery {
  constructor(
    pagination: PaginationParams,
    public readonly days: number = 30,
    correlationId?: string
  ) {
    super('GET_USERS_WITH_RECENT_ACTIVITY', pagination, correlationId);
  }
}

/**
 * Query to search users with complex criteria
 */
export class SearchUsersQuery extends SearchQuery {
  constructor(
    pagination: PaginationParams,
    public readonly criteria: {
      emailDomain?: string;
      isActive?: boolean;
      hasName?: boolean;
      defaultLocale?: Locale;
      createdAfter?: Date;
      createdBefore?: Date;
      lastLoginAfter?: Date;
      lastLoginBefore?: Date;
      nameContains?: string;
    },
    searchTerm?: string,
    sortBy?: 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'email' | 'name',
    sortOrder?: 'asc' | 'desc',
    correlationId?: string
  ) {
    super('SEARCH_USERS', pagination, searchTerm, criteria, sortBy, sortOrder, correlationId);
  }
}

/**
 * Query to get users by locale preference
 */
export class GetUsersByLocaleQuery extends PaginatedQuery {
  constructor(
    public readonly locale: Locale,
    pagination: PaginationParams,
    correlationId?: string
  ) {
    super('GET_USERS_BY_LOCALE', pagination, correlationId);
  }
}

/**
 * Query to get user statistics
 */
export class GetUserStatsQuery extends BaseQuery {
  constructor(correlationId?: string) {
    super('GET_USER_STATS', correlationId);
  }
}

/**
 * Query to find users inactive for specified days
 */
export class GetUsersInactiveForDaysQuery extends PaginatedQuery {
  constructor(
    public readonly days: number,
    pagination: PaginationParams,
    correlationId?: string
  ) {
    super('GET_USERS_INACTIVE_FOR_DAYS', pagination, correlationId);
  }
}

/**
 * Query to find users with incomplete profiles
 */
export class GetUsersWithIncompleteProfilesQuery extends PaginatedQuery {
  constructor(
    pagination: PaginationParams,
    correlationId?: string
  ) {
    super('GET_USERS_WITH_INCOMPLETE_PROFILES', pagination, correlationId);
  }
}

/**
 * Query to check if email is already taken
 */
export class IsEmailTakenQuery extends BaseQuery {
  constructor(
    public readonly email: Email,
    correlationId?: string
  ) {
    super('IS_EMAIL_TAKEN', correlationId);
  }
}

/**
 * Query to find users for notifications
 */
export class GetUsersForNotificationsQuery extends PaginatedQuery {
  constructor(
    public readonly notificationType: 'email' | 'analysis_reminder',
    pagination: PaginationParams,
    correlationId?: string
  ) {
    super('GET_USERS_FOR_NOTIFICATIONS', pagination, correlationId);
  }
}

/**
 * Query result types for user operations
 */
export interface GetUserByIdResult {
  user: User | null;
}

export interface GetUserByEmailResult {
  user: User | null;
}

export interface GetUsersByEmailDomainResult {
  users: PaginatedResult<User>;
}

export interface GetActiveUsersResult {
  users: PaginatedResult<User>;
}

export interface GetInactiveUsersResult {
  users: PaginatedResult<User>;
}

export interface GetNewUsersResult {
  users: PaginatedResult<User>;
}

export interface GetUsersWithRecentActivityResult {
  users: PaginatedResult<User>;
}

export interface SearchUsersResult {
  users: PaginatedResult<User>;
}

export interface GetUsersByLocaleResult {
  users: PaginatedResult<User>;
}

export interface GetUserStatsResult {
  stats: {
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    usersWithRecentActivity: number;
    localeDistribution: Record<string, number>;
    emailDomainDistribution: Record<string, number>;
  };
}

export interface GetUsersInactiveForDaysResult {
  users: PaginatedResult<User>;
}

export interface GetUsersWithIncompleteProfilesResult {
  users: PaginatedResult<User>;
}

export interface IsEmailTakenResult {
  isTaken: boolean;
}

export interface GetUsersForNotificationsResult {
  users: PaginatedResult<User>;
}