import { User } from "../../domain/entities/User";
import { UserId } from "../../domain/value-objects/UserId";
import { AuthenticationService } from "./AuthenticationService";
import type { UserTier } from "@/lib/supabase/types";

/**
 * Session context information
 */
export interface SessionContext {
  user: User | null;
  userId: UserId | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPaid: boolean;
  isFree: boolean;
  tier?: UserTier;
}

/**
 * Service for managing user session context
 * Provides easy access to current user information and permissions
 */
export class SessionService {
  constructor(private readonly authenticationService: AuthenticationService) {}

  /**
   * Get current session context
   */
  async getSessionContext(): Promise<SessionContext> {
    const user = await this.authenticationService.getCurrentUser();
    const userId = await this.authenticationService.getCurrentUserId();
    const isAuthenticated = await this.authenticationService.isAuthenticated();

    let isAdmin = false;
    let isPaid = false;
    let isFree = true;
    let tier: UserTier | undefined;

    // Get user tier information if authenticated
    if (isAuthenticated && userId) {
      const tierResult = await this.getUserTier(userId);
      if (tierResult) {
        tier = tierResult;
        isAdmin = tier === "admin";
        isPaid = tier === "paid" || tier === "admin";
        isFree = tier === "free";
      }
    }

    return {
      user,
      userId,
      isAuthenticated,
      isAdmin,
      isPaid,
      isFree,
      tier,
    };
  }

  /**
   * Get user tier from the authentication service (userId parameter unused in current implementation)
   */
  private async getUserTier(_userId: UserId): Promise<UserTier | null> {
    try {
      // Use the authentication service to get tier information
      const authResult = await this.authenticationService.authenticateRequest({
        allowFree: true,
      });
      console.log("[SessionService] getUserTier result:", {
        success: authResult.success,
        userTier: authResult.userTier,
        userId: authResult.userId,
      });
      return authResult.userTier || "free";
    } catch (error) {
      console.error("Error getting user tier:", error);
      return "free";
    }
  }

  /**
   * Check if current user has admin permissions
   */
  async isCurrentUserAdmin(): Promise<boolean> {
    const context = await this.getSessionContext();
    return context.isAdmin;
  }

  /**
   * Check if current user has paid subscription
   */
  async isCurrentUserPaid(): Promise<boolean> {
    const context = await this.getSessionContext();
    return context.isPaid || context.isAdmin;
  }

  /**
   * Get current user or throw error if not authenticated
   */
  async requireCurrentUser(): Promise<User> {
    const user = await this.authenticationService.getCurrentUser();
    if (!user) {
      throw new Error("User must be authenticated");
    }
    return user;
  }

  /**
   * Get current user ID or throw error if not authenticated
   */
  async requireCurrentUserId(): Promise<UserId> {
    const userId = await this.authenticationService.getCurrentUserId();
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    return userId;
  }

  /**
   * Check if current user can access paid features
   */
  async canAccessPaidFeatures(): Promise<boolean> {
    return await this.isCurrentUserPaid();
  }

  /**
   * Check if current user can access admin features
   */
  async canAccessAdminFeatures(): Promise<boolean> {
    return await this.isCurrentUserAdmin();
  }
}
