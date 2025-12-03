import { UserId } from "../../domain/value-objects/UserId";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { CreditPolicy } from "../../domain/services/CreditPolicy";
import { ICache } from "../../infrastructure/cache/ICache";
import { Result, success, failure } from "../../shared/types/common";
import { CreditCheckResult } from "../types/commands/CreditCommands";
import { EntityNotFoundError } from "../../shared/types/errors";
import {
  getOrInitializeLocalDevCredits,
  isLocalDevModeEnabled,
} from "../utils/localDevCredits";
import { isCreditSystemEnabled } from "../../infrastructure/config/credits";
import { getUserTierFromDatabase } from "../utils/getUserTier";
import { isEnabled } from "../../../lib/featureFlags";

const UNLIMITED_CREDITS = Number.MAX_SAFE_INTEGER;
const LOCAL_STORAGE_MODE_CREDITS = 9999;

/**
 * Use case for checking if a user has sufficient credits to perform an analysis
 * Implements caching to reduce database load
 */
export class CheckCreditsUseCase {
  private readonly CACHE_TTL_SECONDS = 60;
  private readonly CACHE_KEY_PREFIX = "credits:";

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly creditPolicy: CreditPolicy,
    private readonly cache: ICache
  ) {}

  /**
   * Execute the credit check
   * @param userId - The user ID to check credits for
   * @returns Result containing credit check information
   */
  async execute(userId: UserId): Promise<Result<CreditCheckResult, Error>> {
    try {
      // Bypass credit check in LOCAL_STORAGE_MODE (Open Source Mode)
      if (this.isLocalStorageMode()) {
        return success(this.getLocalStorageModeResult());
      }

      if (!isCreditSystemEnabled()) {
        return success(this.getUnlimitedCreditResult());
      }

      // Check cache first
      const cacheKey = this.getCacheKey(userId);
      const cached = await this.cache.get<CreditCheckResult>(cacheKey);

      if (cached) {
        return success(cached);
      }

      // Short-circuit in local development mode to avoid hitting persistence
      if (this.isLocalDevMode()) {
        const credits = await getOrInitializeLocalDevCredits(
          this.cache,
          userId
        );
        const localDevResult: CreditCheckResult = {
          allowed: credits > 0,
          credits,
          tier: "free",
        };

        await this.cache.set(cacheKey, localDevResult, this.CACHE_TTL_SECONDS);
        return success(localDevResult);
      }

      // Get user from repository
      const userResult = await this.userRepository.findById(userId);

      if (!userResult.success) {
        return failure(userResult.error);
      }

      if (!userResult.data) {
        return failure(new EntityNotFoundError("User", userId.value));
      }

      const user = userResult.data;

      // Check if user has credits
      const hasCredits = this.creditPolicy.canPerformAnalysis(user);

      // Build result
      const tier = await getUserTierFromDatabase(userId);
      const result: CreditCheckResult = {
        allowed: hasCredits,
        credits: user.credits,
        tier,
      };

      // Cache the result
      await this.cache.set(cacheKey, result, this.CACHE_TTL_SECONDS);

      return success(result);
    } catch (error) {
      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error checking credits")
      );
    }
  }

  /**
   * Get cache key for a user
   */
  private getCacheKey(userId: UserId): string {
    return `${this.CACHE_KEY_PREFIX}${userId.value}`;
  }

  private getUnlimitedCreditResult(): CreditCheckResult {
    return {
      allowed: true,
      credits: UNLIMITED_CREDITS,
      tier: "free",
    };
  }

  /**
   * Get credit result for LOCAL_STORAGE_MODE (Open Source Mode)
   * Always returns sufficient credits with admin tier
   */
  private getLocalStorageModeResult(): CreditCheckResult {
    return {
      allowed: true,
      credits: LOCAL_STORAGE_MODE_CREDITS,
      tier: "admin",
    };
  }

  /**
   * Determine whether the application is running in local dev bypass mode
   */
  private isLocalDevMode(): boolean {
    return isLocalDevModeEnabled();
  }

  /**
   * Determine whether the application is running in LOCAL_STORAGE_MODE (Open Source Mode)
   */
  private isLocalStorageMode(): boolean {
    return isEnabled("LOCAL_STORAGE_MODE");
  }
}
