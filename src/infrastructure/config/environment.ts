/**
 * Environment configuration using Next.js environment variables
 * Centralizes all configuration management with validation
 *
 * Supports two modes:
 * 1. Normal mode: Requires Supabase for authentication and data persistence
 * 2. Local Storage Mode (Open Source Mode): Uses localStorage + simple auth, no Supabase required
 */

/**
 * Check if LOCAL_STORAGE_MODE is enabled
 * This allows the app to run without Supabase using localStorage for persistence
 */
export function isLocalStorageMode(): boolean {
  const TRUTHY = new Set(["1", "true", "yes", "on", "y", "t"]);
  const value =
    process.env.FF_LOCAL_STORAGE_MODE ||
    process.env.NEXT_PUBLIC_FF_LOCAL_STORAGE_MODE;
  if (!value) return false;
  return TRUTHY.has(value.trim().toLowerCase());
}

export interface DatabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
  supabaseServiceKey?: string;
}

export interface AIConfig {
  geminiApiKey: string;
  timeout: number;
  maxRetries: number;
  model: string;
}

export interface FeatureConfig {
  enableHackathonAnalyzer: boolean;
  enableAudioFeatures: boolean;
  enableClassicAnalyzer: boolean;
  localDevMode: boolean;
}

export interface AppConfig {
  database: DatabaseConfig;
  ai: AIConfig;
  features: FeatureConfig;
  environment: "development" | "production" | "test";
  logLevel: "debug" | "info" | "warn" | "error";
}

/**
 * Get application configuration with validation
 * Throws error if required environment variables are missing
 *
 * In LOCAL_STORAGE_MODE:
 * - Supabase environment variables are NOT required
 * - GEMINI_API_KEY is still required for AI functionality
 *
 * In normal mode:
 * - All Supabase and AI environment variables are required
 */
export function getAppConfig(): AppConfig {
  const localStorageMode = isLocalStorageMode();

  // Build required env vars based on mode
  const requiredEnvVars: Record<string, string | undefined> = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };

  // Only require Supabase vars when NOT in local storage mode
  if (!localStorageMode) {
    requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL =
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([__key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    const modeInfo = localStorageMode
      ? " (Open Source Mode enabled - Supabase not required)"
      : "";
    throw new Error(
      `Missing required environment variables${modeInfo}: ${missingVars.join(
        ", "
      )}`
    );
  }

  // In local storage mode, provide placeholder values for Supabase config
  // These won't be used but prevent null reference errors
  const supabaseUrl = localStorageMode
    ? "http://localhost:54321"
    : process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = localStorageMode
    ? "local-storage-mode-placeholder-key"
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return {
    database: {
      supabaseUrl,
      supabaseKey,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    ai: {
      geminiApiKey: process.env.GEMINI_API_KEY!,
      timeout: parseInt(process.env.AI_TIMEOUT || "30000"),
      maxRetries: parseInt(process.env.AI_MAX_RETRIES || "3"),
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    },
    features: {
      enableHackathonAnalyzer:
        process.env.NEXT_PUBLIC_FF_HACKATHON_ANALYZER === "true",
      enableAudioFeatures: process.env.NEXT_PUBLIC_FF_AUDIO_FEATURES === "true",
      enableClassicAnalyzer:
        process.env.NEXT_PUBLIC_FF_CLASSIC_ANALYZER !== "false", // Default true
      // Local dev mode now follows NODE_ENV
      localDevMode:
        ((process.env.NODE_ENV as string) || "development") === "development",
    },
    environment:
      (process.env.NODE_ENV as "development" | "production" | "test") ||
      "development",
    logLevel:
      (process.env.LOG_LEVEL as "debug" | "info" | "warn" | "error") || "info",
  };
}

/**
 * Get database configuration
 */
export function getDatabaseConfig(): DatabaseConfig {
  return getAppConfig().database;
}

/**
 * Get AI service configuration
 */
export function getAIConfig(): AIConfig {
  return getAppConfig().ai;
}

/**
 * Get feature flag configuration
 */
export function getFeatureConfig(): FeatureConfig {
  return getAppConfig().features;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getAppConfig().environment === "development";
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getAppConfig().environment === "production";
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getAppConfig().environment === "test";
}

/**
 * Validate configuration at startup
 * Throws detailed errors for configuration issues
 *
 * In LOCAL_STORAGE_MODE, Supabase URL validation is skipped
 */
export function validateConfiguration(): void {
  try {
    const config = getAppConfig();
    const localStorageMode = isLocalStorageMode();

    // Validate database configuration (only in normal mode)
    if (!localStorageMode) {
      if (!config.database.supabaseUrl.startsWith("https://")) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL");
      }
    }

    // Validate AI configuration (required in both modes)
    if (config.ai.timeout < 1000) {
      throw new Error("AI_TIMEOUT must be at least 1000ms");
    }

    if (config.ai.maxRetries < 1 || config.ai.maxRetries > 10) {
      throw new Error("AI_MAX_RETRIES must be between 1 and 10");
    }

    const modeLabel = localStorageMode ? " (Open Source Mode)" : "";
    console.log(`✅ Configuration validation passed${modeLabel}`);
  } catch (error) {
    console.error("❌ Configuration validation failed:", error);
    throw error;
  }
}
