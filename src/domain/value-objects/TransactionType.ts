/**
 * Types of credit transactions that can occur in the system
 */
export enum TransactionType {
  /**
   * Credit deduction for analysis consumption
   */
  DEDUCT = "deduct",

  /**
   * Credit addition from purchase or grant
   */
  ADD = "add",

  /**
   * Credit refund for failed or cancelled analysis
   */
  REFUND = "refund",

  /**
   * Manual credit adjustment by administrator
   */
  ADMIN_ADJUSTMENT = "admin_adjustment",
}
