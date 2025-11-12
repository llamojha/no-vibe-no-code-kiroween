import { UserId } from "@/src/domain/value-objects/UserId";
import { CheckCreditsUseCase } from "@/src/application/use-cases/CheckCreditsUseCase";
import { InsufficientCreditsError } from "@/src/shared/types/errors";
import { isCreditSystemEnabled } from "@/src/infrastructure/config/credits";

/**
 * Middleware function to check if a user has sufficient credits to perform an analysis
 * Throws InsufficientCreditsError if the user has no credits available
 *
 * @param userId - The user ID to check credits for
 * @param checkCreditsUseCase - The use case to execute the credit check
 * @throws InsufficientCreditsError if user has no credits
 */
export async function withCreditCheck(
  userId: UserId,
  checkCreditsUseCase: CheckCreditsUseCase
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
    throw new InsufficientCreditsError(userId.value);
  }
}
