import { UserId } from "../../domain/value-objects/UserId";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ICache } from "../../infrastructure/cache/ICache";
import { CreditBalance } from "../../domain/repositories/ICreditTransactionRepository";
import { Result, success, failure } from "../../shared/types/common";
import { EntityNotFoundError } from "../../shared/types/errors";
import type { UserTier } from "../../infrastructure/database/types/database";
import {
  getOrInitializeLocalDevCredits,
  isLocalDevModeEnabled,
} from "../utils/localDevCredits";

/**
 * Use case for retrieving a user's credit balance
 * Implements caching to reduce database load
 */
export class GetCreditBalanceUseCase {
  private readonly CACHE_TTL_SECONDS = 60;
  private readonly CACHE_KEY_PREFIX = "credit_balance:";

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cache: ICache
  ) {}

  /**
   * Execute the get credit balance operation
   * @param userId - The user ID to get balance for
   * @returns Result containing credit balance information
   */
  async execute(userId: UserId): Promise<Result<CreditBalance, Error>> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(userId);
      const cached = await this.cache.get<CreditBalance>(cacheKey);

      if (cached) {
        return success(cached);
      }

      if (this.isLocalDevMode()) {
        const credits = await getOrInitializeLocalDevCredits(
          this.cache,
          userId
        );
        const balance: CreditBalance = {
          credits,
          tier: "free",
        };
        await this.cache.set(cacheKey, balance, this.CACHE_TTL_SECONDS);
        return success(balance);
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

      // Build balance result
      const balance: CreditBalance = {
        credits: user.credits,
        tier: this.getUserTier(user.credits),
      };

      // Cache the result
      await this.cache.set(cacheKey, balance, this.CACHE_TTL_SECONDS);

      return success(balance);
    } catch (error) {
      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error getting credit balance")
      );
    }
  }

  /**
   * Get cache key for a user
   */
  private getCacheKey(userId: UserId): string {
    return `${this.CACHE_KEY_PREFIX}${userId.value}`;
  }

  /**
   * Determine user tier based on credits
   * This is a simplified implementation - in production, tier would come from user entity
   */
  private getUserTier(_credits: number): UserTier {
    // For now, all users are "free" tier
    // This will be enhanced when tier information is added to User entity
    return "free";
  }

  private isLocalDevMode(): boolean {
    return isLocalDevModeEnabled();
  }
}
