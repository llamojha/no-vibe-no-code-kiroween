/**
 * Environment configuration using Next.js environment variables
 * Centralizes all configuration management with validation
 */

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
  environment: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Get application configuration with validation
 * Throws error if required environment variables are missing
 */
export function getAppConfig(): AppConfig {
  // Validate required environment variables
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([__key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  return {
    database: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    ai: {
      geminiApiKey: process.env.GEMINI_API_KEY!,
      timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
      model: process.env.AI_MODEL || 'gemini-1.5-flash',
    },
    features: {
      enableHackathonAnalyzer: process.env.NEXT_PUBLIC_FF_HACKATHON_ANALYZER === 'true',
      enableAudioFeatures: process.env.NEXT_PUBLIC_FF_AUDIO_FEATURES === 'true',
      enableClassicAnalyzer: process.env.NEXT_PUBLIC_FF_CLASSIC_ANALYZER !== 'false', // Default true
      localDevMode: process.env.FF_LOCAL_DEV_MODE === 'true',
    },
    environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
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
  return getAppConfig().environment === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getAppConfig().environment === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getAppConfig().environment === 'test';
}

/**
 * Validate configuration at startup
 * Throws detailed errors for configuration issues
 */
export function validateConfiguration(): void {
  try {
    const config = getAppConfig();
    
    // Validate database configuration
    if (!config.database.supabaseUrl.startsWith('https://')) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL');
    }
    
    // Validate AI configuration
    if (config.ai.timeout < 1000) {
      throw new Error('AI_TIMEOUT must be at least 1000ms');
    }
    
    if (config.ai.maxRetries < 1 || config.ai.maxRetries > 10) {
      throw new Error('AI_MAX_RETRIES must be between 1 and 10');
    }
    
    console.log('✅ Configuration validation passed');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    throw error;
  }
}