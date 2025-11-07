import { z } from 'zod';
import { BaseCommand, createCommandSchema } from '../base/Command';
import { UserId, Email } from '../../../domain/value-objects';
import { User, UserPreferences } from '../../../domain/entities';

/**
 * Command to create a new user
 */
export class CreateUserCommand extends BaseCommand {
  constructor(
    public readonly email: Email,
    public readonly name?: string,
    public readonly preferences?: Partial<UserPreferences>,
    correlationId?: string
  ) {
    super('CREATE_USER', correlationId);
  }
}

/**
 * Validation schema for CreateUserCommand
 */
export const CreateUserCommandSchema = createCommandSchema(
  z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters').optional(),
    preferences: z.object({
      defaultLocale: z.enum(['en', 'es']).optional(),
      emailNotifications: z.boolean().optional(),
      analysisReminders: z.boolean().optional(),
      theme: z.enum(['light', 'dark', 'auto']).optional()
    }).optional()
  })
);

/**
 * Command to update user information
 */
export class UpdateUserCommand extends BaseCommand {
  constructor(
    public readonly userId: UserId,
    public readonly updates: {
      name?: string;
      preferences?: Partial<UserPreferences>;
    },
    correlationId?: string
  ) {
    super('UPDATE_USER', correlationId);
  }
}

/**
 * Validation schema for UpdateUserCommand
 */
export const UpdateUserCommandSchema = createCommandSchema(
  z.object({
    userId: z.string().uuid('Invalid user ID format'),
    updates: z.object({
      name: z.string().min(2).max(100).optional(),
      preferences: z.object({
        defaultLocale: z.enum(['en', 'es']).optional(),
        emailNotifications: z.boolean().optional(),
        analysisReminders: z.boolean().optional(),
        theme: z.enum(['light', 'dark', 'auto']).optional()
      }).optional()
    })
  })
);

/**
 * Command to activate a user account
 */
export class ActivateUserCommand extends BaseCommand {
  constructor(
    public readonly userId: UserId,
    correlationId?: string
  ) {
    super('ACTIVATE_USER', correlationId);
  }
}

/**
 * Command to deactivate a user account
 */
export class DeactivateUserCommand extends BaseCommand {
  constructor(
    public readonly userId: UserId,
    public readonly reason?: string,
    correlationId?: string
  ) {
    super('DEACTIVATE_USER', correlationId);
  }
}

/**
 * Command to record user login
 */
export class RecordUserLoginCommand extends BaseCommand {
  constructor(
    public readonly userId: UserId,
    public readonly loginTime: Date = new Date(),
    correlationId?: string
  ) {
    super('RECORD_USER_LOGIN', correlationId);
  }
}

/**
 * Command to update user preferences
 */
export class UpdateUserPreferencesCommand extends BaseCommand {
  constructor(
    public readonly userId: UserId,
    public readonly preferences: Partial<UserPreferences>,
    correlationId?: string
  ) {
    super('UPDATE_USER_PREFERENCES', correlationId);
  }
}

/**
 * Validation schema for UpdateUserPreferencesCommand
 */
export const UpdateUserPreferencesCommandSchema = createCommandSchema(
  z.object({
    userId: z.string().uuid('Invalid user ID format'),
    preferences: z.object({
      defaultLocale: z.enum(['en', 'es']).optional(),
      emailNotifications: z.boolean().optional(),
      analysisReminders: z.boolean().optional(),
      theme: z.enum(['light', 'dark', 'auto']).optional()
    })
  })
);

/**
 * Command to delete a user account
 */
export class DeleteUserCommand extends BaseCommand {
  constructor(
    public readonly userId: UserId,
    public readonly confirmationEmail: Email,
    correlationId?: string
  ) {
    super('DELETE_USER', correlationId);
  }
}

/**
 * Validation schema for DeleteUserCommand
 */
export const DeleteUserCommandSchema = createCommandSchema(
  z.object({
    userId: z.string().uuid('Invalid user ID format'),
    confirmationEmail: z.string().email('Invalid email format')
  })
);

/**
 * Command result types for user operations
 */
export interface CreateUserResult {
  user: User;
}

export interface UpdateUserResult {
  user: User;
}

export interface ActivateUserResult {
  user: User;
}

export interface DeactivateUserResult {
  user: User;
}

export interface RecordUserLoginResult {
  user: User;
}

export interface UpdateUserPreferencesResult {
  user: User;
}

export interface DeleteUserResult {
  success: boolean;
}