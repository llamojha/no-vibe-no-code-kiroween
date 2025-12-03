import { UserId } from "@/src/domain/value-objects/UserId";
import { CheckCreditsUseCase } from "@/src/application/use-cases/CheckCreditsUseCase";
import { InsufficientCreditsError } from "@/src/shared/types/errors";
import { isCreditSystemEnabled } from "@/src/infrastructure/config/credits";
import { IUserRepository } from "@/src/domain/repositories/IUserRepository";

/**
 * Middleware function to check if a user has sufficient credits to perform an analysis
 * Throws InsufficientCreditsError if the user has no credits available
 *
 * @param userId - The user ID to check credits for
 * @param checkCreditsUseCase - The use case to execute the credit check
 * @param userRepository - The user repository to fetch user email
 * @throws InsufficientCreditsError if user has no credits
 */
export async function withCreditCheck(
  userId: UserId,
  checkCreditsUseCase: CheckCreditsUseCase,
  userRepository: IUserRepository
): Promise<void> {
  if (!isCreditSystemEnabled()) {
    return;
  }

  // Execute credit check
  const result = await checkCreditsUseCase.execute(userId);

  // Handle failure
  if (!result.success) {
    throw result.error;
  }

  // Check if user is allowed to perform analysis
  if (!result.data.allowed) {
    // Get user email for better error message
    let userEmail: string | undefined;
    const userResult = await userRepository.findById(userId);
    if (userResult.success && userResult.data) {
      userEmail = userResult.data.email.value;
    }

    throw new InsufficientCreditsError(userId.value, userEmail);
  }
}
