// TypeScript definitions for enhanced feature flags

import { FeatureFlagDefinition } from "./featureFlags";

/**
 * Enhanced feature flag definitions with proper TypeScript types
 */
export interface EnhancedFeatureFlags {
  /** Show the classic startup idea analyzer button on home page */
  ENABLE_CLASSIC_ANALYZER: FeatureFlagDefinition<boolean>;
  /** Show the Kiroween hackathon analyzer button on home page */
  ENABLE_KIROWEEN_ANALYZER: FeatureFlagDefinition<boolean>;
  /** Enable local development mode with mock auth and local storage */
  LOCAL_DEV_MODE: FeatureFlagDefinition<boolean>;
}

/**
 * Feature flag keys for type-safe access
 */
export const ENHANCED_FEATURE_FLAG_KEYS = {
  ENABLE_CLASSIC_ANALYZER: "ENABLE_CLASSIC_ANALYZER",
  ENABLE_KIROWEEN_ANALYZER: "ENABLE_KIROWEEN_ANALYZER",
  LOCAL_DEV_MODE: "LOCAL_DEV_MODE",
} as const;

/**
 * Type for enhanced feature flag keys
 */
export type EnhancedFeatureFlagKey = keyof typeof ENHANCED_FEATURE_FLAG_KEYS;
