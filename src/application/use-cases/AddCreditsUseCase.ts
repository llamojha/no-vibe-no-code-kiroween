import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ICreditTransactionRepository } from "../../domain/repositories/ICreditTransactionRepository";
import { ICache } from "../../infrastructure/cache/ICache";
import { CreditTransaction } from "../../domain/entities/CreditTransaction";
import { Result, success, failure } from "../../shared/types/common";
import { AddCreditsCommand } from "../types/commands/CreditCommands";
import { EntityNotFoundError } from "../../shared/types/errors";

/**
 * Use case for adding credits to a user account
 * Supports different transaction types (ADD, REFUND, ADMIN_ADJUSTMENT)
 * Ensures atomic credit addition with transaction recording and cache invalidation
 */
export class AddCreditsUseCase {
  private readonly CACHE_KEY_PREFIX = "credits:";
  private readonly BALANCE_CACHE_KEY_PREFIX = "credit_balance:";

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly transactionRepository: ICreditTransactionRepository,
    private readonly cache: ICache
  ) {}

  /**
   * Execute the add credits operation
   * @param command - The add credits command
   * @returns Result indicating success or failure
   */
  async execute(command: AddCreditsCommand): Promise<Result<void, Error>> {
    try {
      // Step 1: Get user from repository
      const userResult = await this.userRepository.findById(command.userId);

      if (!userResult.success) {
        return failure(userResult.error);
      }

      if (!userResult.data) {
        return failure(new EntityNotFoundError("User", command.userId.value));
      }

      const user = userResult.data;

      // Step 2: Add credits (domain logic validates amount)
      user.addCredits(command.amount);

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
        amount: command.amount,
        type: command.type,
        description: command.description,
        metadata: command.metadata,
      });

      const transactionResult =
        await this.transactionRepository.recordTransaction(transaction);

      if (!transactionResult.success) {
        // Log error but don't fail the operation since credits were already added
        console.error(
          "Failed to record credit transaction:",
          transactionResult.error
        );
      }

      // Step 5: Invalidate both cache keys
      await this.invalidateCache(command.userId);

      return success(undefined);
    } catch (error) {
      return failure(
        error instanceof Error
          ? error
          : new Error("Unknown error adding credits")
      );
    }
  }

  /**
   * Invalidate all cache entries for a user
   */
  private async invalidateCache(
    userId: import("../../domain/value-objects/UserId").UserId
  ): Promise<void> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${userId.value}`;
    const balanceCacheKey = `${this.BALANCE_CACHE_KEY_PREFIX}${userId.value}`;

    await Promise.all([
      this.cache.delete(cacheKey),
      this.cache.delete(balanceCacheKey),
    ]);
  }
}
