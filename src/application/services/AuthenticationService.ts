import { SupabaseClient } from "@supabase/supabase-js";
import { Database, UserTier } from "@/lib/supabase/types";
import { UserId } from "../../domain/value-objects/UserId";
import { Email } from "../../domain/value-objects/Email";
import { Locale } from "../../domain/value-objects/Locale";
import { User } from "../../domain/entities/User";
import {
  GetUserByIdUseCase,
  CreateUserUseCase,
  UpdateUserLastLoginUseCase,
} from "../use-cases/user";
import { Result } from "../../shared/types/common";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Authentication result interface
 */
export interface AuthenticationResult {
  success: boolean;
  user?: User;
  userId?: string;
  userEmail?: string;
  userTier?: UserTier;
  error?: string;
}

/**
 * Authentication options
 */
export interface AuthenticationOptions {
  requirePaid?: boolean;
  requireAdmin?: boolean;
  allowFree?: boolean;
  updateLastLogin?: boolean;
}

/**
 * Session information from Supabase
 *
 * @property userId - The user's unique identifier
 * @property userEmail - The user's email address (optional)
 * @property isAuthenticated - Whether the user has an active session
 * @property isVerified - Whether the user's token has been verified with the auth server
 *                        This is true when getUser() successfully validates the token
 */
export interface SessionInfo {
  userId: string;
  userEmail?: string;
  isAuthenticated: boolean;
  isVerified: boolean;
}

/**
 * Authentication service that integrates Supabase auth with the hexagonal architecture
 * Handles user authentication, session management, and user creation
 */
export class AuthenticationService {
  constructor(
    private readonly supabaseClient: SupabaseClient<Database>,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserLastLoginUseCase: UpdateUserLastLoginUseCase
  ) {}

  /**
   * Authenticate a request and get user information
   */
  async authenticateRequest(
    options: AuthenticationOptions = { allowFree: true }
  ): Promise<AuthenticationResult> {
    logger.debug(LogCategory.AUTH, "Authenticating request", {
      requirePaid: options.requirePaid,
      requireAdmin: options.requireAdmin,
      allowFree: options.allowFree,
    });

    try {
      // Check if local dev mode is enabled (check env var directly for server-side)
      const isLocalDevMode = process.env.FF_LOCAL_DEV_MODE === "true";

      if (isLocalDevMode) {
        logger.info(LogCategory.AUTH, "Using local dev mode authentication", {
          mode: "local-dev",
        });

        // Create a mock user for local development with a valid UUID
        const mockUserId = UserId.fromString(
          "a0000000-0000-4000-8000-000000000001"
        );
        const mockUser = User.reconstruct({
          id: mockUserId,
          email: Email.create("developer@localhost.dev"),
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          preferences: {
            defaultLocale: Locale.english(),
            emailNotifications: true,
            analysisReminders: true,
            theme: "auto",
          },
        });

        return {
          success: true,
          user: mockUser,
          userId: mockUserId.value,
          userEmail: "developer@localhost.dev",
          userTier: "free" as UserTier,
        };
      }

      // Get session from Supabase
      const sessionResult = await this.getSession();
      if (!sessionResult.isAuthenticated) {
        logger.warn(LogCategory.AUTH, "No active session found");
        return {
          success: false,
          error: "No active session found",
        };
      }

      logger.debug(LogCategory.AUTH, "Session found", {
        userId: sessionResult.userId,
        hasEmail: !!sessionResult.userEmail,
      });

      const userId = UserId.fromString(sessionResult.userId);

      // Try to get user from our domain
      const userResult = await this.getUserByIdUseCase.execute(userId);
      if (!userResult.success) {
        return {
          success: false,
          error: "Failed to retrieve user information",
        };
      }

      let user = userResult.data;

      // If user doesn't exist in our domain, create them
      if (!user && sessionResult.userEmail) {
        const createUserResult = await this.createUserFromSession(
          sessionResult
        );
        if (!createUserResult.success) {
          return {
            success: false,
            error: "Failed to create user profile",
          };
        }
        user = createUserResult.data;
      }

      if (!user) {
        return {
          success: false,
          error: "User not found and could not be created",
        };
      }

      // Update last login if requested
      if (options.updateLastLogin) {
        await this.updateUserLastLoginUseCase.execute(userId);
      }

      // Check tier requirements if needed
      if (options.requirePaid || options.requireAdmin || !options.allowFree) {
        const tierCheckResult = await this.checkUserTier(userId, options);
        if (!tierCheckResult.success) {
          return tierCheckResult;
        }

        return {
          success: true,
          user,
          userId: sessionResult.userId,
          userEmail: sessionResult.userEmail,
          userTier: tierCheckResult.userTier,
        };
      }

      // Basic authentication without tier checking
      return {
        success: true,
        user,
        userId: sessionResult.userId,
        userEmail: sessionResult.userEmail,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      };
    }
  }

  /**
   * Authenticate with paid or admin requirement (for backward compatibility)
   */
  async authenticateRequestPaidOrAdmin(): Promise<AuthenticationResult> {
    return this.authenticateRequest({
      requirePaid: true,
      allowFree: false,
      updateLastLogin: true,
    });
  }

  /**
   * Get session information from Supabase
   * Uses getUser() for secure authentication validation
   */
  async getSession(): Promise<SessionInfo> {
    try {
      // First, validate user authenticity with getUser() - this verifies the token with the auth server
      const {
        data: { user },
        error: userError,
      } = await this.supabaseClient.auth.getUser();

      if (userError) {
        logger.warn(LogCategory.AUTH, "User authentication failed", {
          error: userError.message,
          code: userError.status,
        });
        return {
          userId: "",
          isAuthenticated: false,
          isVerified: false,
        };
      }

      if (!user) {
        logger.debug(LogCategory.AUTH, "No authenticated user found");
        return {
          userId: "",
          isAuthenticated: false,
          isVerified: false,
        };
      }

      // User is verified, now get session for additional data
      const {
        data: { session },
        error: sessionError,
      } = await this.supabaseClient.auth.getSession();

      if (sessionError) {
        logger.warn(
          LogCategory.AUTH,
          "Session retrieval failed after user verification",
          {
            error: sessionError.message,
          }
        );
        // User is verified but session retrieval failed - still return authenticated
        return {
          userId: user.id,
          userEmail: user.email,
          isAuthenticated: true,
          isVerified: true,
        };
      }

      if (!session) {
        logger.warn(
          LogCategory.AUTH,
          "No session found after user verification"
        );
        // User is verified but no session - still return authenticated
        return {
          userId: user.id,
          userEmail: user.email,
          isAuthenticated: true,
          isVerified: true,
        };
      }

      logger.debug(
        LogCategory.AUTH,
        "User authenticated and session retrieved",
        {
          userId: user.id,
          hasEmail: !!user.email,
        }
      );

      return {
        userId: user.id,
        userEmail: user.email,
        isAuthenticated: true,
        isVerified: true,
      };
    } catch (error) {
      logger.error(LogCategory.AUTH, "Unexpected error during authentication", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        userId: "",
        isAuthenticated: false,
        isVerified: false,
      };
    }
  }

  /**
   * Check user tier requirements
   */
  private async checkUserTier(
    userId: UserId,
    options: AuthenticationOptions
  ): Promise<AuthenticationResult & { userTier?: UserTier }> {
    try {
      const { data: profile, error: profileError } = await this.supabaseClient
        .from("profiles")
        .select("tier")
        .eq("id", userId.value)
        .maybeSingle();

      if (profileError) {
        return {
          success: false,
          error: "Unable to verify user profile",
        };
      }

      const userTier: UserTier = (profile?.tier ?? "free") as UserTier;

      // Check tier requirements
      if (options.requireAdmin && userTier !== "admin") {
        return {
          success: false,
          error: "Admin access required",
        };
      }

      if (options.requirePaid && userTier !== "paid" && userTier !== "admin") {
        return {
          success: false,
          error: "Paid subscription required",
        };
      }

      if (!options.allowFree && userTier === "free") {
        return {
          success: false,
          error: "Free tier access not allowed for this operation",
        };
      }

      return {
        success: true,
        userTier,
      };
    } catch {
      return {
        success: false,
        error: "Failed to check user tier",
      };
    }
  }

  /**
   * Create a user in our domain from Supabase session information
   */
  private async createUserFromSession(
    sessionInfo: SessionInfo
  ): Promise<Result<User, Error>> {
    if (!sessionInfo.userEmail) {
      return {
        success: false,
        error: new Error("Cannot create user without email"),
      };
    }

    try {
      const email = Email.create(sessionInfo.userEmail);
      return await this.createUserUseCase.execute({ email });
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error("Failed to create user"),
      };
    }
  }

  /**
   * Check if a user is authenticated (simple check)
   */
  async isAuthenticated(): Promise<boolean> {
    const sessionInfo = await this.getSession();
    return sessionInfo.isAuthenticated;
  }

  /**
   * Get current user ID if authenticated
   */
  async getCurrentUserId(): Promise<UserId | null> {
    const sessionInfo = await this.getSession();
    if (!sessionInfo.isAuthenticated) {
      return null;
    }

    try {
      return UserId.fromString(sessionInfo.userId);
    } catch {
      return null;
    }
  }

  /**
   * Get current user if authenticated
   */
  async getCurrentUser(): Promise<User | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      return null;
    }

    const userResult = await this.getUserByIdUseCase.execute(userId);
    return userResult.success ? userResult.data : null;
  }
}
