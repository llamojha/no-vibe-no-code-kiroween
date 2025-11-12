import { IUserRepository } from "../../domain/repositories/IUserRepository";
import {
  CreditBalance,
  ICreditTransactionRepository,
} from "../../domain/repositories/ICreditTransactionRepository";
import { CreditPolicy } from "../../domain/services/CreditPolicy";
import { ICache } from "../../infrastructure/cache/ICache";
import { CreditTransaction } from "../../domain/entities/CreditTransaction";
import { TransactionType } from "../../domain/value-objects/TransactionType";
import { Result, success, failure } from "../../shared/types/common";
import {
  CreditCheckResult,
  DeductCreditCommand,
} from "../types/commands/CreditCommands";
import {
  EntityNotFoundError,
  InsufficientCreditsError,
} from "../../shared/types/errors";
import { UserId } from "../../domain/value-objects/UserId";
import {
  getOrInitializeLocalDevCredits,
  isLocalDevModeEnabled,
  setLocalDevCredits,
} from "../utils/localDevCredits";
import { isCreditSystemEnabled } from "../../infrastructure/config/credits";

/**
 * Use case for deducting credits from a user after successful analysis
 * Ensures atomic credit deduction with transaction recording and cache invalidation
 */
export class DeductCreditUseCase {
  private readonly CACHE_KEY_PREFIX = "credits:";
  private readonly BALANCE_CACHE_KEY_PREFIX = "credit_balance:";
  private readonly CACHE_TTL_SECONDS = 60;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly transactionRepository: ICreditTransactionRepository,
    private readonly creditPolicy: CreditPolicy,
    private readonly cache: ICache
  ) {}

  /**
   * Execute the credit deduction
   * @param command - The deduct credit command
   * @returns Result indicating success or failure
   */
  async execute(command: DeductCreditCommand): Promise<Result<void, Error>> {
    try {
      if (!isCreditSystemEnabled()) {
        return success(undefined);
      }

      if (this.isLocalDevMode()) {
        await this.handleLocalDevDeduction(command);
        return success(undefined);
      }

      // Step 1: Get user from repository
      const userResult = await this.userRepository.findById(command.userId);

      if (!userResult.success) {
        return failure(userResult.error);
      }

      if (!userResult.data) {
        return failure(new EntityNotFoundError("User", command.userId.value));
      }

      const user = userResult.data;

      const deductionAmount =
        this.creditPolicy.calculateCreditDeduction(
          command.analysisType
        ) ?? 1;

      if (user.credits < deductionAmount) {
        return failure(new InsufficientCreditsError(command.userId.value));
      }

      // Step 2: Deduct credits (domain logic)
      for (let i = 0; i < deductionAmount; i += 1) {
        user.deductCredit();
      }

      // Step 3: Persist new credit balance
      const updateResult = await this.userRepository.updateCredits(
        user.id,
        user.credits
      );

      if (!updateResult.success) {
        return failure(updateResult.error);
      }

      // Step 4: Record transaction for audit trail
      const transaction = CreditTransaction.create({
        userId: command.userId,
        amount: -deductionAmount,
        type: TransactionType.DEDUCT,
        description: `Analysis: ${command.analysisType}`,
        metadata: {
          analysisType: command.analysisType,
          analysisId: command.analysisId,
        },
      });

      const transactionResult =
        await this.transactionRepository.recordTransaction(transaction);

      if (!transactionResult.success) {
        // Log error but don't fail the operation since credit was already deducted
        console.error(
          "Failed to record credit transaction:",
          transactionResult.error
        );
      }

      // Step 5: Invalidate caches
      await this.invalidateCache(command.userId);

      return success(undefined);
    } catch (error) {
      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error deducting credit")
      );
    }
  }

  /**
   * Get cache key for a user
   */
  private getCacheKey(userId: UserId): string {
    return `${this.CACHE_KEY_PREFIX}${userId.value}`;
  }

  private getBalanceCacheKey(userId: UserId): string {
    return `${this.BALANCE_CACHE_KEY_PREFIX}${userId.value}`;
  }

  private async invalidateCache(userId: UserId): Promise<void> {
    await Promise.all([
      this.cache.delete(this.getCacheKey(userId)),
      this.cache.delete(this.getBalanceCacheKey(userId)),
    ]);
  }

  private async handleLocalDevDeduction(
    command: DeductCreditCommand
  ): Promise<void> {
    const currentCredits = await getOrInitializeLocalDevCredits(
      this.cache,
      command.userId
    );
    const deductionAmount =
      this.creditPolicy.calculateCreditDeduction(
        command.analysisType
      ) ?? 1;
    const updatedCredits = Math.max(0, currentCredits - deductionAmount);

    await setLocalDevCredits(this.cache, command.userId, updatedCredits);

    const creditCheckSnapshot: CreditCheckResult = {
      allowed: updatedCredits > 0,
      credits: updatedCredits,
      tier: "free",
    };

    const balanceSnapshot: CreditBalance = {
      credits: updatedCredits,
      tier: "free",
    };

    await Promise.all([
      this.cache.set(
        this.getCacheKey(command.userId),
        creditCheckSnapshot,
        this.CACHE_TTL_SECONDS
      ),
      this.cache.set(
        this.getBalanceCacheKey(command.userId),
        balanceSnapshot,
        this.CACHE_TTL_SECONDS
      ),
    ]);
  }

  private isLocalDevMode(): boolean {
    return isLocalDevModeEnabled();
  }
}
