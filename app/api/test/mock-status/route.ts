import { NextResponse } from 'next/server';
import { TestEnvironmentConfig, isTestModeOverrideEnabled } from '@/lib/testing/config/test-environment';

/**
 * Test endpoint to verify mock mode status
 * Only available in non-production environments
 * 
 * Returns:
 * - Current mock mode status
 * - Environment configuration
 * - Validation results
 * - Timestamp
 */
export async function GET() {
  // Prevent access in production
  const allowTestEndpointInProduction = isTestModeOverrideEnabled();
  if (process.env.NODE_ENV === 'production' && !allowTestEndpointInProduction) {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  const config = TestEnvironmentConfig.getCurrentConfig();
  const validation = TestEnvironmentConfig.validateTestEnvironment();

  return NextResponse.json({
    mockMode: config.mockMode,
    scenario: config.scenario,
    simulateLatency: config.simulateLatency,
    nodeEnv: config.nodeEnv,
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    timestamp: new Date().toISOString(),
  });
}
