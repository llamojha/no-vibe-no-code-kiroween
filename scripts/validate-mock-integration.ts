/**
 * Mock System Integration Validation Script
 * 
 * This script validates that the mock system is properly integrated with the application.
 * It checks:
 * 1. ServiceFactory creates mock services
 * 2. API routes return mock responses
 * 3. No database connections during tests
 * 4. No external API calls during tests
 */

import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';
import { SupabaseAdapter } from '@/src/infrastructure/integration/SupabaseAdapter';
import { MockAIAnalysisService } from '@/lib/testing/mocks/MockAIAnalysisService';
import { MockFrankensteinService } from '@/lib/testing/mocks/MockFrankensteinService';
import { TestEnvironmentConfig } from '@/lib/testing/config/test-environment';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: unknown;
}

interface ValidationReport {
  timestamp: string;
  environment: {
    mockMode: boolean;
    scenario: string;
    nodeEnv: string;
  };
  results: {
    serviceFactory: ValidationResult[];
    apiRoutes: ValidationResult[];
    isolation: ValidationResult[];
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  issues: string[];
}

class MockIntegrationValidator {
  private results: ValidationReport;

  constructor() {
    const config = TestEnvironmentConfig.getCurrentConfig();
    this.results = {
      timestamp: new Date().toISOString(),
      environment: {
        mockMode: config.mockMode,
        scenario: config.scenario,
        nodeEnv: config.nodeEnv,
      },
      results: {
        serviceFactory: [],
        apiRoutes: [],
        isolation: [],
      },
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
      },
      issues: [],
    };
  }

  /**
   * Validate ServiceFactory creates mock services
   */
  async validateServiceFactory(): Promise<void> {
    console.log('\n🔍 Validating ServiceFactory...');

    // Test 1: Mock mode is enabled
    const supabase = SupabaseAdapter.getServerClient();
    const factory = ServiceFactory.create(supabase);
    
    this.addResult('serviceFactory', {
      passed: factory.isMockModeEnabled(),
      message: 'ServiceFactory detects mock mode',
      details: { mockMode: factory.isMockModeEnabled() },
    });

    // Test 2: Creates MockAIAnalysisService
    try {
      const aiService = factory.createAIAnalysisService();
      const isMockService = aiService instanceof MockAIAnalysisService;
      
      this.addResult('serviceFactory', {
        passed: isMockService,
        message: 'ServiceFactory creates MockAIAnalysisService',
        details: { 
          serviceName: aiService.constructor.name,
          isMock: isMockService,
        },
      });
    } catch (error) {
      this.addResult('serviceFactory', {
        passed: false,
        message: 'Failed to create AI Analysis Service',
        details: { error: (error as Error).message },
      });
    }

    // Test 3: Creates MockFrankensteinService
    try {
      const frankensteinService = factory.createFrankensteinService();
      const isMockService = frankensteinService instanceof MockFrankensteinService;
      
      this.addResult('serviceFactory', {
        passed: isMockService,
        message: 'ServiceFactory creates MockFrankensteinService',
        details: { 
          serviceName: frankensteinService.constructor.name,
          isMock: isMockService,
        },
      });
    } catch (error) {
      this.addResult('serviceFactory', {
        passed: false,
        message: 'Failed to create Frankenstein Service',
        details: { error: (error as Error).message },
      });
    }

    // Test 4: Diagnostics are available
    try {
      const diagnostics = factory.getDiagnostics();
      
      this.addResult('serviceFactory', {
        passed: diagnostics.mockMode === true,
        message: 'ServiceFactory diagnostics show mock mode',
        details: diagnostics,
      });
    } catch (error) {
      this.addResult('serviceFactory', {
        passed: false,
        message: 'Failed to get diagnostics',
        details: { error: (error as Error).message },
      });
    }
  }

  /**
   * Validate API routes return mock responses
   */
  async validateApiRoutes(): Promise<void> {
    console.log('\n🔍 Validating API Routes...');

    const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

    // Test 1: Mock status endpoint
    try {
      const response = await fetch(`${baseUrl}/api/test/mock-status`);
      const data = await response.json();
      
      this.addResult('apiRoutes', {
        passed: response.ok && data.mockMode === true,
        message: 'Mock status endpoint returns correct status',
        details: { status: response.status, data },
      });
    } catch (error) {
      this.addResult('apiRoutes', {
        passed: false,
        message: 'Mock status endpoint failed',
        details: { error: (error as Error).message },
      });
    }

    // Test 2: Analyze endpoint returns mock response
    try {
      const response = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idea: 'Test idea for validation',
          locale: { value: 'en' },
        }),
      });
      
      const data = await response.json();
      const hasMockMetadata = data._meta?.mockMode === true;
      
      this.addResult('apiRoutes', {
        passed: response.ok && hasMockMetadata,
        message: 'Analyze endpoint returns mock response with metadata',
        details: { 
          status: response.status, 
          hasMockMetadata,
          mockMode: data._meta?.mockMode,
        },
      });
    } catch (error) {
      this.addResult('apiRoutes', {
        passed: false,
        message: 'Analyze endpoint failed',
        details: { error: (error as Error).message },
      });
    }

    // Test 3: Hackathon analyze endpoint returns mock response
    try {
      const response = await fetch(`${baseUrl}/api/analyze-hackathon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idea: 'Test hackathon idea',
          locale: { value: 'en' },
        }),
      });
      
      const data = await response.json();
      const hasMockMetadata = data._meta?.mockMode === true;
      
      this.addResult('apiRoutes', {
        passed: response.ok && hasMockMetadata,
        message: 'Hackathon analyze endpoint returns mock response with metadata',
        details: { 
          status: response.status, 
          hasMockMetadata,
          mockMode: data._meta?.mockMode,
        },
      });
    } catch (error) {
      this.addResult('apiRoutes', {
        passed: false,
        message: 'Hackathon analyze endpoint failed',
        details: { error: (error as Error).message },
      });
    }

    // Test 4: Frankenstein endpoint returns mock response
    try {
      const response = await fetch(`${baseUrl}/api/doctor-frankenstein/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          locale: { value: 'en' },
        }),
      });
      
      const data = await response.json();
      const hasMockMetadata = data._meta?.mockMode === true;
      
      this.addResult('apiRoutes', {
        passed: response.ok && hasMockMetadata,
        message: 'Frankenstein endpoint returns mock response with metadata',
        details: { 
          status: response.status, 
          hasMockMetadata,
          mockMode: data._meta?.mockMode,
        },
      });
    } catch (error) {
      this.addResult('apiRoutes', {
        passed: false,
        message: 'Frankenstein endpoint failed',
        details: { error: (error as Error).message },
      });
    }
  }

  /**
   * Validate no database or external API calls
   */
  async validateIsolation(): Promise<void> {
    console.log('\n🔍 Validating Test Isolation...');

    // Test 1: Environment is configured for test mode
    const validation = TestEnvironmentConfig.validateTestEnvironment();
    
    this.addResult('isolation', {
      passed: validation.isValid && this.results.environment.mockMode,
      message: 'Environment is properly configured for test mode',
      details: { 
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
    });

    // Test 2: Mock services don't make external calls
    try {
      const supabase = SupabaseAdapter.getServerClient();
      const factory = ServiceFactory.create(supabase);
      const aiService = factory.createAIAnalysisService();
      
      // Call the service and verify it returns immediately (mock behavior)
      const startTime = Date.now();
      const result = await aiService.analyzeIdea('Test idea', { value: 'en' } as any);
      const duration = Date.now() - startTime;
      
      // Mock services should return very quickly (< 100ms without simulated latency)
      const isQuick = duration < 100;
      
      this.addResult('isolation', {
        passed: result.success && isQuick,
        message: 'Mock AI service returns without external calls',
        details: { 
          success: result.success,
          duration: `${duration}ms`,
          isQuick,
        },
      });
    } catch (error) {
      this.addResult('isolation', {
        passed: false,
        message: 'Failed to verify mock service isolation',
        details: { error: (error as Error).message },
      });
    }

    // Test 3: Frankenstein service doesn't make external calls
    try {
      const supabase = SupabaseAdapter.getServerClient();
      const factory = ServiceFactory.create(supabase);
      const frankensteinService = factory.createFrankensteinService();
      
      const startTime = Date.now();
      const result = await frankensteinService.generateIdea({ value: 'en' } as unknown);
      const duration = Date.now() - startTime;
      
      const isQuick = duration < 100;
      
      this.addResult('isolation', {
        passed: result.success && isQuick,
        message: 'Mock Frankenstein service returns without external calls',
        details: { 
          success: result.success,
          duration: `${duration}ms`,
          isQuick,
        },
      });
    } catch (error) {
      this.addResult('isolation', {
        passed: false,
        message: 'Failed to verify Frankenstein service isolation',
        details: { error: (error as Error).message },
      });
    }
  }

  /**
   * Add a validation result
   */
  private addResult(category: keyof ValidationReport['results'], result: ValidationResult): void {
    this.results.results[category].push(result);
    this.results.summary.total++;
    
    if (result.passed) {
      this.results.summary.passed++;
      console.log(`  ✅ ${result.message}`);
    } else {
      this.results.summary.failed++;
      console.log(`  ❌ ${result.message}`);
      this.results.issues.push(result.message);
      
      if (result.details) {
        console.log(`     Details:`, result.details);
      }
    }
  }

  /**
   * Run all validations
   */
  async validate(): Promise<ValidationReport> {
    console.log('🚀 Starting Mock System Integration Validation\n');
    console.log('Environment:', this.results.environment);

    await this.validateServiceFactory();
    await this.validateApiRoutes();
    await this.validateIsolation();

    return this.results;
  }

  /**
   * Print summary report
   */
  printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`Passed: ${this.results.summary.passed} ✅`);
    console.log(`Failed: ${this.results.summary.failed} ❌`);
    console.log(`Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
    
    if (this.results.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      this.results.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    } else {
      console.log('\n✨ All validations passed!');
    }
    
    console.log('='.repeat(60));
  }

  /**
   * Save report to file
   */
  async saveReport(filename: string): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(filename, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Report saved to: ${filename}`);
  }
}

export { MockIntegrationValidator, ValidationReport, ValidationResult };

// Run validation if executed directly
(async () => {
  // Set up test environment
  process.env.FF_USE_MOCK_API = 'true';
  process.env.FF_MOCK_SCENARIO = 'success';
  process.env.FF_SIMULATE_LATENCY = 'false';
  process.env.NODE_ENV = 'test';

  const validator = new MockIntegrationValidator();
  
  try {
    const report = await validator.validate();
    validator.printSummary();
    
    // Save report
    const reportPath = '.kiro/specs/mock-system-integration-fix/VALIDATION_REPORT.json';
    await validator.saveReport(reportPath);
    
    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Validation failed with error:', error);
    process.exit(1);
  }
})();
