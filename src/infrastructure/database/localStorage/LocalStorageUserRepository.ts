/**
 * LocalStorageUserRepository - localStorage implementation of IUserRepository
 * Provides single-user storage for local authentication in Open Source Mode
 */

import { User, UserPreferences } from "../../../domain/entities";
import { UserId, Email, Locale } from "../../../domain/value-objects";
import {
  IUserRepository,
  UserSearchCriteria,
  UserSortOptions,
} from "../../../domain/repositories/IUserRepository";
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

export interface StoredUser {
  id: string;
  email: string;
  name?: string;
  preferences: {
    defaultLocale: "en" | "es";
    emailNotifications: boolean;
    analysisReminders: boolean;
    theme: "light" | "dark" | "auto";
  };
  credits: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

function toStored(u: User): StoredUser {
  return {
    id: u.id.value,
    email: u.email.value,
    name: u.name,
    preferences: {
      defaultLocale: u.preferences.defaultLocale.value as "en" | "es",
      emailNotifications: u.preferences.emailNotifications,
      analysisReminders: u.preferences.analysisReminders,
      theme: u.preferences.theme,
    },
    credits: u.credits,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString(),
  };
}

function toDomain(s: StoredUser): User {
  const prefs: UserPreferences = {
    defaultLocale: Locale.reconstruct(s.preferences.defaultLocale),
    emailNotifications: s.preferences.emailNotifications,
    analysisReminders: s.preferences.analysisReminders,
    theme: s.preferences.theme,
  };
  return User.reconstruct({
    id: UserId.reconstruct(s.id),
    email: Email.reconstruct(s.email),
    name: s.name,
    preferences: prefs,
    credits: s.credits,
    isActive: s.isActive,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    lastLoginAt: s.lastLoginAt ? new Date(s.lastLoginAt) : undefined,
  });
}

export class LocalStorageUserRepository implements IUserRepository {
  private readonly adapter = new LocalStorageAdapter<StoredUser>(
    STORAGE_KEYS.USER
  );

  async save(u: User): Promise<Result<User, Error>> {
    try {
      this.adapter.save(toStored(u));
      return success(u);
    } catch (e) {
      return failure(
        e instanceof StorageQuotaError
          ? e
          : new LocalStorageError("Failed to save user", e)
      );
    }
  }

  async update(u: User): Promise<Result<User, Error>> {
    try {
      this.adapter.update(u.id.value, toStored(u));
      return success(u);
    } catch (e) {
      return failure(new LocalStorageError("Failed to update user", e));
    }
  }

  async delete(id: UserId): Promise<Result<void, Error>> {
    try {
      this.adapter.delete(id.value);
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to delete user", e));
    }
  }

  async activate(id: UserId): Promise<Result<void, Error>> {
    try {
      const s = this.adapter.getById(id.value);
      if (s) {
        s.isActive = true;
        s.updatedAt = new Date().toISOString();
        this.adapter.update(id.value, s);
      }
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to activate user", e));
    }
  }

  async deactivate(id: UserId): Promise<Result<void, Error>> {
    try {
      const s = this.adapter.getById(id.value);
      if (s) {
        s.isActive = false;
        s.updatedAt = new Date().toISOString();
        this.adapter.update(id.value, s);
      }
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to deactivate user", e));
    }
  }

  async updateLastLogin(
    id: UserId,
    loginTime: Date
  ): Promise<Result<void, Error>> {
    try {
      const s = this.adapter.getById(id.value);
      if (s) {
        s.lastLoginAt = loginTime.toISOString();
        s.updatedAt = new Date().toISOString();
        this.adapter.update(id.value, s);
      }
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to update last login", e));
    }
  }

  async updateCredits(
    userId: UserId,
    credits: number
  ): Promise<Result<void, Error>> {
    try {
      const s = this.adapter.getById(userId.value);
      if (s) {
        s.credits = credits;
        s.updatedAt = new Date().toISOString();
        this.adapter.update(userId.value, s);
      }
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to update credits", e));
    }
  }

  async deactivateInactiveUsers(_days: number): Promise<Result<number, Error>> {
    // In local mode, there's only one user, so this is a no-op
    return success(0);
  }

  async findById(id: UserId): Promise<Result<User | null, Error>> {
    try {
      const s = this.adapter.getById(id.value);
      return success(s ? toDomain(s) : null);
    } catch (e) {
      return failure(new LocalStorageError("Failed to find user by ID", e));
    }
  }

  async exists(id: UserId): Promise<Result<boolean, Error>> {
    try {
      return success(this.adapter.exists(id.value));
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to check user existence", e)
      );
    }
  }

  async count(): Promise<Result<number, Error>> {
    try {
      return success(this.adapter.count());
    } catch (e) {
      return failure(new LocalStorageError("Failed to count users", e));
    }
  }

  async findByEmail(email: Email): Promise<Result<User | null, Error>> {
    try {
      const items = this.adapter.findWhere(
        (i) => i.email.toLowerCase() === email.value.toLowerCase()
      );
      return success(items.length > 0 ? toDomain(items[0]) : null);
    } catch (e) {
      return failure(new LocalStorageError("Failed to find user by email", e));
    }
  }

  async findByEmailDomain(
    domain: string,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      const items = this.adapter.findWhere((i) =>
        i.email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)
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
        new LocalStorageError("Failed to find users by email domain", e)
      );
    }
  }

  async findActive(
    p: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      const items = this.adapter.findWhere((i) => i.isActive);
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
      return failure(new LocalStorageError("Failed to find active users", e));
    }
  }

  async findInactive(
    p: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      const items = this.adapter.findWhere((i) => !i.isActive);
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
      return failure(new LocalStorageError("Failed to find inactive users", e));
    }
  }

  async findNewUsers(
    days: number,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const items = this.adapter.findWhere(
        (i) => new Date(i.createdAt) > cutoff
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
      return failure(new LocalStorageError("Failed to find new users", e));
    }
  }

  async findWithRecentActivity(
    days: number,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const items = this.adapter.findWhere(
        (i) =>
          i.lastLoginAt ? new Date(i.lastLoginAt) > cutoff : false
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
        new LocalStorageError("Failed to find users with recent activity", e)
      );
    }
  }

  async search(
    _criteria: UserSearchCriteria,
    _sort: UserSortOptions,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    // Simplified search for local mode - just return all users
    try {
      const items = this.adapter.getAll();
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
      return failure(new LocalStorageError("Failed to search users", e));
    }
  }

  async findByLocale(
    locale: Locale,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      const items = this.adapter.findWhere(
        (i) => i.preferences.defaultLocale === locale.value
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
        new LocalStorageError("Failed to find users by locale", e)
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
      const items = this.adapter.getAll();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const localeDistribution: Record<string, number> = {};
      const emailDomainDistribution: Record<string, number> = {};
      items.forEach((i) => {
        localeDistribution[i.preferences.defaultLocale] =
          (localeDistribution[i.preferences.defaultLocale] || 0) + 1;
        const domain = i.email.split("@")[1];
        emailDomainDistribution[domain] =
          (emailDomainDistribution[domain] || 0) + 1;
      });
      return success({
        totalCount: items.length,
        activeCount: items.filter((i) => i.isActive).length,
        inactiveCount: items.filter((i) => !i.isActive).length,
        newUsersThisWeek: items.filter((i) => new Date(i.createdAt) > weekAgo)
          .length,
        newUsersThisMonth: items.filter((i) => new Date(i.createdAt) > monthAgo)
          .length,
        usersWithRecentActivity: items.filter(
          (i) => i.lastLoginAt && new Date(i.lastLoginAt) > weekAgo
        ).length,
        localeDistribution,
        emailDomainDistribution,
      });
    } catch (e) {
      return failure(new LocalStorageError("Failed to get user stats", e));
    }
  }

  async findInactiveForDays(
    days: number,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const items = this.adapter.findWhere(
        (i) => !i.lastLoginAt || new Date(i.lastLoginAt) < cutoff
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
        new LocalStorageError("Failed to find inactive users for days", e)
      );
    }
  }

  async findWithIncompleteProfiles(
    p: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      const items = this.adapter.findWhere((i) => !i.name);
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
          "Failed to find users with incomplete profiles",
          e
        )
      );
    }
  }

  async isEmailTaken(email: Email): Promise<Result<boolean, Error>> {
    try {
      const items = this.adapter.findWhere(
        (i) => i.email.toLowerCase() === email.value.toLowerCase()
      );
      return success(items.length > 0);
    } catch (e) {
      return failure(
        new LocalStorageError("Failed to check if email is taken", e)
      );
    }
  }

  async findForNotifications(
    _notificationType: "email" | "analysis_reminder",
    p: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    // In local mode, return all active users
    return this.findActive(p);
  }

  async findAll(
    p: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
    try {
      const items = this.adapter.getAll();
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
      return failure(new LocalStorageError("Failed to find all users", e));
    }
  }

  async findByIds(ids: UserId[]): Promise<Result<User[], Error>> {
    try {
      const set = new Set(ids.map((id) => id.value));
      return success(
        this.adapter
          .getAll()
          .filter((i) => set.has(i.id))
          .map(toDomain)
      );
    } catch (e) {
      return failure(new LocalStorageError("Failed to find users by IDs", e));
    }
  }

  async findWhere(
    criteria: Record<string, unknown>
  ): Promise<Result<User[], Error>> {
    try {
      const items = this.adapter.findWhere((i) =>
        Object.entries(criteria).every(
          ([k, v]) => (i as unknown as Record<string, unknown>)[k] === v
        )
      );
      return success(items.map(toDomain));
    } catch (e) {
      return failure(new LocalStorageError("Failed to find users where", e));
    }
  }

  async findWhereWithPagination(
    criteria: Record<string, unknown>,
    p: PaginationParams
  ): Promise<Result<PaginatedResult<User>, Error>> {
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
        new LocalStorageError("Failed to find users where with pagination", e)
      );
    }
  }

  async saveMany(entities: User[]): Promise<Result<User[], Error>> {
    try {
      entities.forEach((u) => this.adapter.save(toStored(u)));
      return success(entities);
    } catch (e) {
      return failure(new LocalStorageError("Failed to save many users", e));
    }
  }

  async deleteMany(ids: UserId[]): Promise<Result<void, Error>> {
    try {
      ids.forEach((id) => this.adapter.delete(id.value));
      return success(undefined);
    } catch (e) {
      return failure(new LocalStorageError("Failed to delete many users", e));
    }
  }
}
