import { isEnabled, getValue } from '@/lib/featureFlags';
import { initFeatureFlags } from '@/lib/featureFlags.config';

/**
 * Adapter to integrate the existing feature flag system with hexagonal architecture
 * Provides a clean interface for the application layer to check feature flags
 */
export class FeatureFlagAdapter {
  private static instance: FeatureFlagAdapter;
  private initialized = false;

  private constructor() {}

  static getInstance(): FeatureFlagAdapter {
    if (!FeatureFlagAdapter.instance) {
      FeatureFlagAdapter.instance = new FeatureFlagAdapter();
    }
    return FeatureFlagAdapter.instance;
  }

  /**
   * Initialize feature flags if not already done
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      initFeatureFlags();
      this.initialized = true;
    }
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagKey: string): boolean {
    this.ensureInitialized();
    try {
      return isEnabled(flagKey);
    } catch (_error) {
      console.warn(`Feature flag '${flagKey}' not found, defaulting to false`);
      return false;
    }
  }

  /**
   * Get feature flag value
   */
  getValue<T = unknown>(flagKey: string): T {
    this.ensureInitialized();
    try {
      return getValue<T>(flagKey);
    } catch (_error) {
      console.warn(`Feature flag '${flagKey}' not found, returning undefined`);
      return undefined as T;
    }
  }

  /**
   * Check if classic analyzer is enabled
   */
  isClassicAnalyzerEnabled(): boolean {
    return this.isEnabled('ENABLE_CLASSIC_ANALYZER');
  }

  /**
   * Check if Kiroween analyzer is enabled
   */
  isKiroweenAnalyzerEnabled(): boolean {
    return this.isEnabled('ENABLE_KIROWEEN_ANALYZER');
  }

  /**
   * Check if local dev mode is enabled
   */
  isLocalDevModeEnabled(): boolean {
    return this.isEnabled('LOCAL_DEV_MODE');
  }

  /**
   * Check if v2 dashboard API should be used
   */
  shouldUseV2DashboardAPI(): boolean {
    return this.isEnabled('USE_V2_DASHBOARD_API');
  }

  /**
   * Check if audio features are enabled
   */
  areAudioFeaturesEnabled(): boolean {
    return this.isEnabled('ENABLE_AUDIO_FEATURES');
  }

  /**
   * Get all enabled analyzer types
   */
  getEnabledAnalyzers(): string[] {
    const analyzers: string[] = [];
    
    if (this.isClassicAnalyzerEnabled()) {
      analyzers.push('classic');
    }
    
    if (this.isKiroweenAnalyzerEnabled()) {
      analyzers.push('kiroween');
    }
    
    return analyzers;
  }

  /**
   * Get feature configuration for client-side use
   */
  getClientFeatureConfig(): Record<string, boolean> {
    return {
      enableClassicAnalyzer: this.isClassicAnalyzerEnabled(),
      enableKiroweenAnalyzer: this.isKiroweenAnalyzerEnabled(),
      enableAudioFeatures: this.areAudioFeaturesEnabled(),
    };
  }
}

/**
 * Convenience function to get feature flag adapter instance
 */
export function getFeatureFlagAdapter(): FeatureFlagAdapter {
  return FeatureFlagAdapter.getInstance();
}

/**
 * Feature flag utilities for use in application layer
 */
export const featureFlagUtils = {
  /**
   * Execute function only if feature is enabled
   */
  withFeature<T>(flagKey: string, fn: () => T, fallback?: T): T | undefined {
    const adapter = getFeatureFlagAdapter();
    if (adapter.isEnabled(flagKey)) {
      return fn();
    }
    return fallback;
  },

  /**
   * Conditional execution based on feature flag
   */
  ifEnabled(flagKey: string, fn: () => void): void {
    const adapter = getFeatureFlagAdapter();
    if (adapter.isEnabled(flagKey)) {
      fn();
    }
  },

  /**
   * Get feature-dependent configuration
   */
  getFeatureConfig<T>(flagKey: string, enabledConfig: T, disabledConfig: T): T {
    const adapter = getFeatureFlagAdapter();
    return adapter.isEnabled(flagKey) ? enabledConfig : disabledConfig;
  },
};