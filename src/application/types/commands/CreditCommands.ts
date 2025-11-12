import { UserId } from "../../../domain/value-objects/UserId";
import { AnalysisType } from "../../../domain/value-objects/AnalysisType";
import { TransactionType } from "../../../domain/value-objects/TransactionType";
import type { UserTier } from "../../../infrastructure/database/types/database";

/**
 * Command to deduct credit from a user
 */
export interface DeductCreditCommand {
  userId: UserId;
  analysisType: AnalysisType;
  analysisId: string;
}

/**
 * Command to add credits to a user
 */
export interface AddCreditsCommand {
  userId: UserId;
  amount: number;
  type: TransactionType;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Result of a credit check operation
 */
export interface CreditCheckResult {
  allowed: boolean;
  credits: number;
  tier: UserTier;
}
