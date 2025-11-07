import { z } from 'zod';

/**
 * User tier types
 */
export type UserTier = 'free' | 'paid' | 'admin';

/**
 * DTO for user information
 */
export interface UserDTO {
  id: string;
  email: string;
  tier?: UserTier;
  createdAt: string;
  updatedAt?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    timezone?: string;
    locale?: 'en' | 'es';
  };
  preferences?: {
    emailNotifications?: boolean;
    defaultLocale?: 'en' | 'es';
    theme?: 'light' | 'dark' | 'system';
  };
}

/**
 * DTO for user profile update
 */
export interface UpdateUserProfileDTO {
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    timezone?: string;
    locale?: 'en' | 'es';
  };
  preferences?: {
    emailNotifications?: boolean;
    defaultLocale?: 'en' | 'es';
    theme?: 'light' | 'dark' | 'system';
  };
}

/**
 * Zod validation schema for UpdateUserProfileDTO
 */
export const UpdateUserProfileSchema = z.object({
  profile: z.object({
    firstName: z.string().min(1, 'First name cannot be empty').max(50, 'First name cannot exceed 50 characters').optional(),
    lastName: z.string().min(1, 'Last name cannot be empty').max(50, 'Last name cannot exceed 50 characters').optional(),
    avatar: z.string().url('Invalid avatar URL').optional(),
    timezone: z.string().optional(),
    locale: z.enum(['en', 'es']).optional()
  }).optional(),
  preferences: z.object({
    emailNotifications: z.boolean().optional(),
    defaultLocale: z.enum(['en', 'es']).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional()
  }).optional()
});

/**
 * DTO for user registration
 */
export interface CreateUserDTO {
  email: string;
  password: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    locale?: 'en' | 'es';
  };
}

/**
 * Zod validation schema for CreateUserDTO
 */
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  profile: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    locale: z.enum(['en', 'es']).optional()
  }).optional()
});

/**
 * DTO for user login
 */
export interface LoginUserDTO {
  email: string;
  password: string;
}

/**
 * Zod validation schema for LoginUserDTO
 */
export const LoginUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

/**
 * DTO for password reset request
 */
export interface PasswordResetRequestDTO {
  email: string;
}

/**
 * Zod validation schema for PasswordResetRequestDTO
 */
export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format')
});

/**
 * DTO for password reset
 */
export interface PasswordResetDTO {
  token: string;
  newPassword: string;
}

/**
 * Zod validation schema for PasswordResetDTO
 */
export const PasswordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
});

/**
 * DTO for user authentication response
 */
export interface AuthResponseDTO {
  user: UserDTO;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}

/**
 * DTO for user session information
 */
export interface UserSessionDTO {
  userId: string;
  email: string;
  tier: UserTier;
  isAuthenticated: boolean;
  expiresAt?: string;
}

/**
 * DTO for user statistics
 */
export interface UserStatsDTO {
  totalAnalyses: number;
  totalHackathonSubmissions: number;
  averageScore: number;
  highestScore: number;
  joinedAt: string;
  lastActiveAt?: string;
  analysisStreak?: number;
}

/**
 * DTO for user activity
 */
export interface UserActivityDTO {
  id: string;
  type: 'analysis_created' | 'hackathon_submitted' | 'profile_updated' | 'login';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * DTO for paginated user activity
 */
export interface PaginatedUserActivityDTO {
  activities: UserActivityDTO[];
  total: number;
  page: number;
  limit: number;
}