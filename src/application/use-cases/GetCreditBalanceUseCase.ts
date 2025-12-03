import { UserId } from "../../domain/value-objects/UserId";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ICache } from "../../infrastructure/cache/ICache";
import { CreditBalance } from "../../domain/repositories/ICreditTransactionRepository";
import { Result, success, failure } from "../../shared/types/common";
import { EntityNotFoundError } from "../../shared/types/errors";
import {
  getOrInitializeLocalDevCredits,
  isLocalDevModeEnabled,
} from "../utils/localDevCredits";
import { getUserTierFromDatabase } from "../utils/getUserTier";
import { isEnabled } from "../../../lib/featureFlags";

const LOCAL_STORAGE_MODE_CREDITS = 9999;

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
      // Return high balance in LOCAL_STORAGE_MODE (Open Source Mode)
      if (this.isLocalStorageMode()) {
        return success(this.getLocalStorageModeBalance());
      }

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
      const tier = await getUserTierFromDatabase(userId);
      const balance: CreditBalance = {
        credits: user.credits,
        tier,
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

  private isLocalDevMode(): boolean {
    return isLocalDevModeEnabled();
  }

  /**
   * Determine whether the application is running in LOCAL_STORAGE_MODE (Open Source Mode)
   */
  private isLocalStorageMode(): boolean {
    return isEnabled("LOCAL_STORAGE_MODE");
  }

  /**
   * Get credit balance for LOCAL_STORAGE_MODE (Open Source Mode)
   * Always returns high balance with admin tier
   */
  private getLocalStorageModeBalance(): CreditBalance {
    return {
      credits: LOCAL_STORAGE_MODE_CREDITS,
      tier: "admin",
    };
  }
}
