/**
 * Startup validation utilities
 * Comprehensive checks for application readiness
 */

import { 
  validateConfiguration,
  checkDatabaseConnection,
  checkAIServiceConnection,
  isDevelopment,
  isProduction 
} from '../config';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StartupChecks {
  configuration: ValidationResult;
  database: ValidationResult;
  aiService: ValidationResult;
  environment: ValidationResult;
}

/**
 * Perform comprehensive startup validation
 */
export async function performStartupValidation(): Promise<StartupChecks> {
  const checks: StartupChecks = {
    configuration: await validateConfigurationCheck(),
    database: await validateDatabaseCheck(),
    aiService: await validateAIServiceCheck(),
    environment: await validateEnvironmentCheck(),
  };

  return checks;
}

/**
 * Validate configuration
 */
async function validateConfigurationCheck(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    validateConfiguration();
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Configuration validation failed: ${error}`);
  }

  return result;
}

/**
 * Validate database connectivity
 */
async function validateDatabaseCheck(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      if (isProduction()) {
        result.isValid = false;
        result.errors.push('Database connection failed in production environment');
      } else {
        result.warnings.push('Database connection failed, but continuing in non-production environment');
      }
    }
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Database check failed: ${error}`);
  }

  return result;
}

/**
 * Validate AI service connectivity
 */
async function validateAIServiceCheck(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    const isConnected = await checkAIServiceConnection();
    
    if (!isConnected) {
      if (isProduction()) {
        result.isValid = false;
        result.errors.push('AI service connection failed in production environment');
      } else {
        result.warnings.push('AI service connection failed, but continuing in non-production environment');
      }
    }
  } catch (error) {
    result.isValid = false;
    result.errors.push(`AI service check failed: ${error}`);
  }

  return result;
}

/**
 * Validate environment setup
 */
async function validateEnvironmentCheck(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    result.errors.push(`Node.js version ${nodeVersion} is not supported. Minimum version is 18.x`);
    result.isValid = false;
  }

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GEMINI_API_KEY',
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    result.errors.push(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    result.isValid = false;
  }

  // Development-specific checks
  if (isDevelopment()) {
    if (!process.env.NODE_ENV) {
      result.warnings.push('NODE_ENV not set, defaulting to development');
    }
  }

  // Production-specific checks
  if (isProduction()) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      result.warnings.push('SUPABASE_SERVICE_ROLE_KEY not set, some admin features may not work');
    }
  }

  return result;
}

/**
 * Generate startup validation report
 */
export function generateValidationReport(checks: StartupChecks): string {
  const lines: string[] = [];
  
  lines.push('🔍 Startup Validation Report');
  lines.push('=' .repeat(50));
  
  for (const [checkName, result] of Object.entries(checks)) {
    const status = result.isValid ? '✅' : '❌';
    lines.push(`${status} ${checkName.charAt(0).toUpperCase() + checkName.slice(1)}`);
    
    if (result.errors.length > 0) {
      lines.push('  Errors:');
      result.errors.forEach(error => lines.push(`    - ${error}`));
    }
    
    if (result.warnings.length > 0) {
      lines.push('  Warnings:');
      result.warnings.forEach(warning => lines.push(`    - ${warning}`));
    }
    
    lines.push('');
  }
  
  const overallStatus = Object.values(checks).every(check => check.isValid);
  lines.push(`Overall Status: ${overallStatus ? '✅ PASSED' : '❌ FAILED'}`);
  
  return lines.join('\n');
}

/**
 * Check if startup validation passed
 */
export function isValidationPassed(checks: StartupChecks): boolean {
  return Object.values(checks).every(check => check.isValid);
}