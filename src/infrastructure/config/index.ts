/**
 * Configuration management exports
 * Centralized configuration for the entire application
 */

// Environment configuration
export {
  getAppConfig,
  getDatabaseConfig,
  getAIConfig,
  getFeatureConfig,
  isDevelopment,
  isProduction,
  isTest,
  validateConfiguration,
  type AppConfig,
  type DatabaseConfig,
  type AIConfig,
  type FeatureConfig,
} from './environment';

// Database configuration
export {
  createSupabaseClient,
  createSupabaseServiceClient,
  getSupabaseClient,
  resetSupabaseClient,
  checkDatabaseConnection,
  databaseConfig,
} from './database';

// AI service configuration
export {
  createGoogleAIClient,
  getGoogleAIClient,
  resetGoogleAIClient,
  getAIServiceConfig,
  checkAIServiceConnection,
  aiServiceConfig,
  modelConfigs,
} from './ai';

// Feature flag configuration
export {
  getFeatureFlags,
  isFeatureEnabled,
  featureUtils,
  withFeatureFlag,
  requireFeature,
  environmentFeatureOverrides,
  type FeatureFlags,
} from './features';