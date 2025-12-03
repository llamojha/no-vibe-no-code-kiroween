// Feature flag validation utilities

import { getRegisteredFlags } from "./featureFlags";
import { ENHANCED_FEATURE_FLAG_KEYS } from "./featureFlags.types";

/**
 * Validates that all enhanced feature flags are properly registered
 * @throws Error if validation fails
 */
export function validateEnhancedFeatureFlags(): void {
  const registeredFlags = getRegisteredFlags();
  const requiredFlags = Object.values(ENHANCED_FEATURE_FLAG_KEYS);

  const missingFlags = requiredFlags.filter(
    (flag) => !(flag in registeredFlags)
  );

  if (missingFlags.length > 0) {
    throw new Error(
      `Missing required feature flags: ${missingFlags.join(", ")}. ` +
        "Ensure initFeatureFlags() is called during application startup."
    );
  }

  // Validate flag configurations
  for (const flagKey of requiredFlags) {
    const flag = registeredFlags[flagKey];
    if (!flag) continue;

    // Validate client exposure settings
    if (flagKey === "LOCAL_DEV_MODE" && flag.exposeToClient) {
      console.warn(
        `Warning: LOCAL_DEV_MODE flag should not be exposed to client for security reasons`
      );
    }

    if (
      (flagKey === "ENABLE_CLASSIC_ANALYZER" ||
        flagKey === "ENABLE_KIROWEEN_ANALYZER" ||
        flagKey === "ENABLE_DOCUMENT_GENERATION") &&
      !flag.exposeToClient
    ) {
      console.warn(
        `Warning: ${flagKey} flag should be exposed to client for UI rendering`
      );
    }
  }
}

/**
 * Logs the current state of all enhanced feature flags
 * Useful for debugging and development
 */
export function logEnhancedFeatureFlagStatus(): void {
  const registeredFlags = getRegisteredFlags();
  const enhancedFlags = Object.values(ENHANCED_FEATURE_FLAG_KEYS);

  console.group("Enhanced Feature Flags Status");
  for (const flagKey of enhancedFlags) {
    const flag = registeredFlags[flagKey];
    if (flag) {
      console.log(
        `${flagKey}: registered (default: ${flag.default}, client: ${flag.exposeToClient})`
      );
    } else {
      console.warn(`${flagKey}: NOT REGISTERED`);
    }
  }
  console.groupEnd();
}
