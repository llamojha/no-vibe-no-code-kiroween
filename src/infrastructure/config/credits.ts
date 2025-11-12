/**
 * Credit system configuration
 * Centralizes credit-related settings with validation
 */

export interface CreditConfig {
  defaultUserCredits: number;
  analysisCreditCost: number;
  enabled: boolean;
}

/**
 * Get credit system configuration
 * Reads from environment variables with sensible defaults
 */
export function getCreditConfig(): CreditConfig {
  const defaultUserCredits = parseInt(
    process.env.DEFAULT_USER_CREDITS || "3",
    10
  );
  const analysisCreditCost = parseInt(
    process.env.ANALYSIS_CREDIT_COST || "1",
    10
  );
  const enabledFlag = process.env.FF_CREDIT_SYSTEM?.toLowerCase();
  const enabled = enabledFlag !== "false";

  // Validate configuration
  if (defaultUserCredits < 0) {
    throw new Error("DEFAULT_USER_CREDITS must be a non-negative number");
  }

  if (analysisCreditCost < 1) {
    throw new Error("ANALYSIS_CREDIT_COST must be at least 1");
  }

  return {
    defaultUserCredits,
    analysisCreditCost,
    enabled,
  };
}

/**
 * Get default credits for new users
 */
export function getDefaultUserCredits(): number {
  return getCreditConfig().defaultUserCredits;
}

/**
 * Get credit cost for analysis
 */
export function getAnalysisCreditCost(): number {
  return getCreditConfig().analysisCreditCost;
}

/**
 * Check if credit system is enabled
 */
export function isCreditSystemEnabled(): boolean {
  return getCreditConfig().enabled;
}

/**
 * Validate credit configuration at startup
 * Throws detailed errors for configuration issues
 */
export function validateCreditConfiguration(): void {
  try {
    const config = getCreditConfig();

    if (config.enabled) {
      console.log("✅ Credit system enabled");
      console.log(`   Default credits: ${config.defaultUserCredits}`);
      console.log(`   Analysis cost: ${config.analysisCreditCost}`);
    } else {
      console.log("ℹ️  Credit system disabled");
    }
  } catch (error) {
    console.error("❌ Credit configuration validation failed:", error);
    throw error;
  }
}
