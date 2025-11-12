import { User } from "../entities/User";
import { AnalysisType } from "../value-objects/AnalysisType";

/**
 * Domain service for credit policy and business rules
 * Contains pure business logic for credit management
 */
export class CreditPolicy {
  /**
   * Default number of credits for new users
   */
  private readonly DEFAULT_CREDITS = 3;

  /**
   * Cost in credits for performing an analysis
   */
  private readonly ANALYSIS_COST = 1;

  /**
   * Get the default number of credits for new users
   * @returns Default credit amount (3)
   */
  getDefaultCredits(): number {
    return this.DEFAULT_CREDITS;
  }

  /**
   * Get the credit cost for a specific analysis type
   * Currently all analysis types cost 1 credit
   * @param analysisType - The type of analysis
   * @returns Credit cost (1)
   */
  getAnalysisCost(analysisType: AnalysisType): number {
    // All analysis types cost 1 credit
    // This method allows for future differentiation if needed
    return this.ANALYSIS_COST;
  }

  /**
   * Check if a user can perform an analysis
   * @param user - The user to check
   * @returns True if user has credits available
   */
  canPerformAnalysis(user: User): boolean {
    return user.hasCredits();
  }

  /**
   * Determine if a warning should be shown to the user
   * Warning is shown when credits are low (1 or fewer)
   * @param credits - Current credit balance
   * @returns True if warning should be displayed
   */
  shouldShowWarning(credits: number): boolean {
    return credits <= 1;
  }

  /**
   * Calculate the credit deduction amount for an analysis
   * @param analysisType - The type of analysis being performed
   * @returns Number of credits to deduct
   */
  calculateCreditDeduction(analysisType: AnalysisType): number {
    return this.getAnalysisCost(analysisType);
  }
}
