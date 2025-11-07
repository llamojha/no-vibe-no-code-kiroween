import { User, UserPreferences } from '../../../../domain/entities';
import { UserId, Email, Locale } from '../../../../domain/value-objects';
import { UserDAO } from '../../types/dao';
import { ProfileRow, ProfileInsert, ProfileUpdate } from '../../types/database';

/**
 * Data Transfer Object for User API operations
 */
export interface UserDTO {
  id: string;
  email?: string; // Optional since not in current schema
  name?: string;
  isActive: boolean;
  preferences: {
    defaultLocale: string;
    emailNotifications: boolean;
    analysisReminders: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

/**
 * Mapper class for converting between User domain entities, DAOs, and DTOs
 * Handles user entity transformations and preference mapping
 */
export class UserMapper {
  /**
   * Convert User domain entity to DAO for database persistence
   */
  toDAO(user: User): UserDAO {
    return {
      id: user.id.value,
      tier: 'free', // Simplified mapping - would determine tier based on user properties
      created_at: user.createdAt.toISOString(),
    };
  }

  /**
   * Convert DAO from database to User domain entity
   */
  toDomain(dao: UserDAO): User {
    // Create default preferences since they're not stored in the current schema
    const defaultPreferences: UserPreferences = {
      defaultLocale: Locale.english(),
      emailNotifications: true,
      analysisReminders: true,
      theme: 'auto'
    };

    // Create a default email since it's not in the current schema
    // In a real implementation, this would come from auth.users or a separate table
    const defaultEmail = Email.create(`user-${dao.id}@example.com`);

    return User.reconstruct({
      id: UserId.reconstruct(dao.id),
      email: defaultEmail,
      name: undefined, // Not stored in current schema
      createdAt: new Date(dao.created_at || Date.now()),
      updatedAt: new Date(dao.created_at || Date.now()),
      lastLoginAt: undefined, // Not stored in current schema
      isActive: true, // Simplified - all users considered active
      preferences: defaultPreferences,
    });
  }

  /**
   * Convert User domain entity to DTO for API responses
   */
  toDTO(user: User): UserDTO {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      isActive: user.isActive,
      preferences: {
        defaultLocale: user.preferences.defaultLocale.value,
        emailNotifications: user.preferences.emailNotifications,
        analysisReminders: user.preferences.analysisReminders,
        theme: user.preferences.theme,
      },
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
    };
  }

  /**
   * Convert Supabase profile row to DAO
   */
  fromSupabaseRow(row: ProfileRow): UserDAO {
    return {
      id: row.id,
      tier: row.tier,
      created_at: row.created_at,
    };
  }

  /**
   * Convert DAO to Supabase insert format
   */
  toSupabaseInsert(dao: UserDAO): ProfileInsert {
    return {
      id: dao.id,
      tier: dao.tier,
      created_at: dao.created_at,
    };
  }

  /**
   * Convert DAO to Supabase update format
   */
  toSupabaseUpdate(dao: UserDAO): ProfileUpdate {
    return {
      tier: dao.tier,
      // Note: id and created_at are typically not updated
    };
  }

  /**
   * Convert User domain entity directly to Supabase insert format
   */
  toSupabaseInsertFromDomain(user: User): ProfileInsert {
    const dao = this.toDAO(user);
    return this.toSupabaseInsert(dao);
  }

  /**
   * Convert User domain entity directly to Supabase update format
   */
  toSupabaseUpdateFromDomain(user: User): ProfileUpdate {
    const dao = this.toDAO(user);
    return this.toSupabaseUpdate(dao);
  }

  /**
   * Convert Supabase row directly to domain entity
   */
  fromSupabaseRowToDomain(row: ProfileRow): User {
    const dao = this.fromSupabaseRow(row);
    return this.toDomain(dao);
  }

  /**
   * Batch convert multiple Supabase rows to domain entities
   */
  fromSupabaseRowsToDomain(rows: ProfileRow[]): User[] {
    return rows.map(row => this.fromSupabaseRowToDomain(row));
  }

  /**
   * Batch convert multiple domain entities to DTOs
   */
  toDTOs(users: User[]): UserDTO[] {
    return users.map(user => this.toDTO(user));
  }

  /**
   * Map user tier from domain to database representation
   */
  private mapTierToDatabase(_user: User): 'free' | 'paid' | 'admin' {
    // Simplified logic - in a real implementation, this would be based on user properties
    // For now, we'll default to 'free'
    return 'free';
  }

  /**
   * Map user tier from database to domain representation
   */
  private mapTierFromDatabase(_tier: 'free' | 'paid' | 'admin'): UserPreferences {
    // Simplified logic - tier doesn't directly map to preferences in current domain model
    // In a real implementation, tier might affect default preferences
    return {
      defaultLocale: Locale.english(),
      emailNotifications: true,
      analysisReminders: true,
      theme: 'auto'
    };
  }

  /**
   * Create a User entity with minimal required data (for testing or defaults)
   */
  createMinimalUser(id: string): User {
    return User.reconstruct({
      id: UserId.reconstruct(id),
      email: Email.create(`user-${id}@example.com`),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      preferences: {
        defaultLocale: Locale.english(),
        emailNotifications: true,
        analysisReminders: true,
        theme: 'auto'
      }
    });
  }

  /**
   * Validate DAO structure before conversion
   */
  private validateDAO(dao: UserDAO): void {
    if (!dao.id || typeof dao.id !== 'string') {
      throw new Error('Invalid DAO: id is required and must be a string');
    }

    if (!dao.tier || !['free', 'paid', 'admin'].includes(dao.tier)) {
      throw new Error('Invalid DAO: tier must be one of: free, paid, admin');
    }
  }

  /**
   * Handle user preferences mapping with defaults
   */
  private mapPreferencesWithDefaults(preferences?: Partial<UserPreferences>): UserPreferences {
    const defaults: UserPreferences = {
      defaultLocale: Locale.english(),
      emailNotifications: true,
      analysisReminders: true,
      theme: 'auto'
    };

    return {
      ...defaults,
      ...preferences
    };
  }

  /**
   * Extract user metadata for analytics or reporting
   */
  extractUserMetadata(user: User): {
    id: string;
    isActive: boolean;
    daysSinceCreation: number;
    hasRecentActivity: boolean;
    isNewUser: boolean;
    hasCompleteProfile: boolean;
    emailDomain: string;
  } {
    return {
      id: user.id.value,
      isActive: user.isActive,
      daysSinceCreation: user.getDaysSinceCreation(),
      hasRecentActivity: user.hasRecentActivity(),
      isNewUser: user.isNewUser(),
      hasCompleteProfile: user.hasCompleteProfile(),
      emailDomain: user.email.domain,
    };
  }
}