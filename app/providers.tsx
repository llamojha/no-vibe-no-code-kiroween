"use client";

import React from "react";
import { LocaleProvider } from "@/features/locale/context/LocaleContext";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import {
  validateEnhancedFeatureFlags,
  logEnhancedFeatureFlagStatus,
} from "@/lib/featureFlags.validation";

// Initialize feature flags on module load
initFeatureFlags();

// Validate flag configuration in development
if (process.env.NODE_ENV === "development") {
  try {
    validateEnhancedFeatureFlags();
    logEnhancedFeatureFlagStatus();
  } catch (error) {
    console.error("Feature flag validation failed:", error);
  }
}

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <LocaleProvider>
      <AuthProvider>{children}</AuthProvider>
    </LocaleProvider>
  );
};
