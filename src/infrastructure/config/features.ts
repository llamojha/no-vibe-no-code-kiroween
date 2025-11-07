import { getFeatureConfig } from './environment';

/**
 * Feature flag configuration integration
 * Bridges the existing feature flag system with the new hexagonal architecture
 */

export interface FeatureFlags {
  enableHackathonAnalyzer: boolean;
  enableAudioFeatures: boolean;
  enableClassicAnalyzer: boolean;
  localDevMode: boolean;
}

/**
 * Get current feature flags configuration
 */
export function getFeatureFlags(): FeatureFlags {
  return getFeatureConfig();
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

/**
 * Feature flag utilities for different components
 */
export const featureUtils = {
  /**
   * Check if hackathon analyzer should be shown
   */
  shouldShowHackathonAnalyzer(): boolean {
    return isFeatureEnabled('enableHackathonAnalyzer');
  },

  /**
   * Check if classic analyzer should be shown
   */
  shouldShowClassicAnalyzer(): boolean {
    return isFeatureEnabled('enableClassicAnalyzer');
  },

  /**
   * Check if audio features should be available
   */
  shouldEnableAudioFeatures(): boolean {
    return isFeatureEnabled('enableAudioFeatures');
  },

  /**
   * Check if running in local development mode
   */
  isLocalDevMode(): boolean {
    return isFeatureEnabled('localDevMode');
  },

  /**
   * Get enabled analyzers list
   */
  getEnabledAnalyzers(): string[] {
    const analyzers: string[] = [];
    
    if (this.shouldShowClassicAnalyzer()) {
      analyzers.push('classic');
    }
    
    if (this.shouldShowHackathonAnalyzer()) {
      analyzers.push('hackathon');
    }
    
    return analyzers;
  },

  /**
   * Get feature configuration for client-side use
   */
  getClientFeatureConfig(): Partial<FeatureFlags> {
    const flags = getFeatureFlags();
    
    // Only return client-safe feature flags
    return {
      enableHackathonAnalyzer: flags.enableHackathonAnalyzer,
      enableAudioFeatures: flags.enableAudioFeatures,
      enableClassicAnalyzer: flags.enableClassicAnalyzer,
      // localDevMode is server-only, don't expose to client
    };
  },
};

/**
 * Feature flag middleware for conditional logic
 */
export function withFeatureFlag<T>(
  feature: keyof FeatureFlags,
  enabledValue: T,
  disabledValue: T
): T {
  return isFeatureEnabled(feature) ? enabledValue : disabledValue;
}

/**
 * Feature flag decorator for conditional execution
 */
export function requireFeature(feature: keyof FeatureFlags) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      if (!isFeatureEnabled(feature)) {
        throw new Error(`Feature '${feature}' is not enabled`);
      }
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * Environment-specific feature overrides
 */
export const environmentFeatureOverrides = {
  development: {
    // Enable all features in development by default
    enableHackathonAnalyzer: true,
    enableAudioFeatures: true,
    enableClassicAnalyzer: true,
  },
  production: {
    // Production features controlled by environment variables
  },
  test: {
    // Disable features that might interfere with testing
    enableAudioFeatures: false,
    localDevMode: true,
  },
};