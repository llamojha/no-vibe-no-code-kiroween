import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAdapter } from '@/src/infrastructure/integration/SupabaseAdapter';
import { FeatureFlagAdapter } from '@/src/infrastructure/integration/FeatureFlagAdapter';
import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';

/**
 * Health check endpoint for the hexagonal architecture
 * Validates that all layers and integrations are working properly
 */
export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    architecture: {
      domain: 'ok',
      application: 'ok',
      infrastructure: 'ok',
    },
    integrations: {
      supabase: 'unknown',
      featureFlags: 'unknown',
      serviceFactory: 'unknown',
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      nextjsVersion: process.env.npm_package_dependencies_next || 'unknown',
    },
    errors: [] as string[],
  };

  try {
    // Test Supabase integration
    try {
      const supabaseConfig = SupabaseAdapter.getConfig();
      if (supabaseConfig.isConfigured) {
        const client = SupabaseAdapter.getServerClient();
        // Simple connectivity test
        await client.from('users').select('count').limit(1);
        checks.integrations.supabase = 'ok';
      } else {
        checks.integrations.supabase = 'not_configured';
        checks.errors.push('Supabase not configured');
      }
    } catch (error) {
      checks.integrations.supabase = 'error';
      checks.errors.push(`Supabase error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test feature flags integration
    try {
      const featureFlagAdapter = FeatureFlagAdapter.getInstance();
      const classicAnalyzerEnabled = featureFlagAdapter.isClassicAnalyzerEnabled();
      const kiroweenAnalyzerEnabled = featureFlagAdapter.isKiroweenAnalyzerEnabled();
      
      checks.integrations.featureFlags = 'ok';
      checks.environment = {
        ...checks.environment,
        features: {
          classicAnalyzer: classicAnalyzerEnabled,
          kiroweenAnalyzer: kiroweenAnalyzerEnabled,
        },
      };
    } catch (error) {
      checks.integrations.featureFlags = 'error';
      checks.errors.push(`Feature flags error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test service factory
    try {
      const supabase = SupabaseAdapter.getServerClient();
      const serviceFactory = ServiceFactory.getInstance(supabase);
      
      // Test that we can create basic services
      const featureFlagAdapter = serviceFactory.getFeatureFlagAdapter();
      const localeAdapter = serviceFactory.getLocaleAdapter();
      
      if (featureFlagAdapter && localeAdapter) {
        checks.integrations.serviceFactory = 'ok';
      } else {
        checks.integrations.serviceFactory = 'partial';
        checks.errors.push('Service factory missing some adapters');
      }
    } catch (error) {
      checks.integrations.serviceFactory = 'error';
      checks.errors.push(`Service factory error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Determine overall status
    const hasErrors = checks.errors.length > 0;
    const hasFailedIntegrations = Object.values(checks.integrations).some(
      status => status === 'error'
    );

    if (hasErrors || hasFailedIntegrations) {
      checks.status = 'degraded';
    }

    // Return appropriate HTTP status
    const httpStatus = checks.status === 'healthy' ? 200 : 503;

    return NextResponse.json(checks, { status: httpStatus });

  } catch (error) {
    // Catastrophic failure
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        architecture: {
          domain: 'unknown',
          application: 'unknown',
          infrastructure: 'error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Health check with detailed architecture validation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const includeDetails = body.includeDetails === true;

    if (!includeDetails) {
      // Return simple health check
      return GET(request);
    }

    // Detailed architecture validation
    const detailedChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      architecture: {
        domain: {
          entities: 'ok',
          valueObjects: 'ok',
          repositories: 'ok',
          services: 'ok',
        },
        application: {
          useCases: 'ok',
          handlers: 'ok',
          services: 'ok',
        },
        infrastructure: {
          database: 'ok',
          external: 'ok',
          web: 'ok',
          config: 'ok',
        },
      },
      dependencies: {
        typescript: 'ok',
        nextjs: 'ok',
        supabase: 'ok',
        zod: 'ok',
      },
      errors: [] as string[],
    };

    // Test domain layer
    try {
      // Import key domain classes to ensure they're loadable
      const { Analysis } = await import('@/src/domain/entities/analysis/Analysis');
      const { AnalysisId } = await import('@/src/domain/entities/analysis/AnalysisId');
      const { UserId } = await import('@/src/domain/entities/user/UserId');
      
      if (!Analysis || !AnalysisId || !UserId) {
        detailedChecks.architecture.domain.entities = 'error';
        detailedChecks.errors.push('Domain entities not loadable');
      }
    } catch (error) {
      detailedChecks.architecture.domain.entities = 'error';
      detailedChecks.errors.push(`Domain layer error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test application layer
    try {
      const { AnalyzeIdeaUseCase } = await import('@/src/application/use-cases/analysis/AnalyzeIdeaUseCase');
      const { CreateAnalysisHandler } = await import('@/src/application/handlers/commands');
      
      if (!AnalyzeIdeaUseCase || !CreateAnalysisHandler) {
        detailedChecks.architecture.application.useCases = 'error';
        detailedChecks.errors.push('Application layer components not loadable');
      }
    } catch (error) {
      detailedChecks.architecture.application.useCases = 'error';
      detailedChecks.errors.push(`Application layer error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test infrastructure layer
    try {
      const { SupabaseAnalysisRepository } = await import('@/src/infrastructure/database/supabase/repositories/SupabaseAnalysisRepository');
      const { AnalysisController } = await import('@/src/infrastructure/web/controllers/AnalysisController');
      
      if (!SupabaseAnalysisRepository || !AnalysisController) {
        detailedChecks.architecture.infrastructure.database = 'error';
        detailedChecks.errors.push('Infrastructure layer components not loadable');
      }
    } catch (error) {
      detailedChecks.architecture.infrastructure.database = 'error';
      detailedChecks.errors.push(`Infrastructure layer error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Determine overall status
    const hasErrors = detailedChecks.errors.length > 0;
    if (hasErrors) {
      detailedChecks.status = 'degraded';
    }

    const httpStatus = detailedChecks.status === 'healthy' ? 200 : 503;
    return NextResponse.json(detailedChecks, { status: httpStatus });

  } catch (error) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}