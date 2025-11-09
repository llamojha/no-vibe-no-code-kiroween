/**
 * Global Setup for E2E Tests
 * 
 * Runs once before all tests to prepare the test environment.
 * Sets up coverage collection directories and configuration.
 * Verifies that mock mode is active before running tests.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import * as fs from 'fs';
import * as path from 'path';
import { FullConfig } from '@playwright/test';
import { MockModeSetup } from './setup/mock-mode-setup';

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🔧 Setting up E2E test environment...');
  console.log('');
  
  // Log environment configuration for debugging
  console.log('📋 Environment Configuration:');
  MockModeSetup.logEnvironmentConfig();
  console.log('');
  
  // Create coverage directory
  const coverageDir = path.join(process.cwd(), 'tests/e2e/coverage');
  if (!fs.existsSync(coverageDir)) {
    fs.mkdirSync(coverageDir, { recursive: true });
    console.log('✅ Created coverage directory');
  }
  
  // Create reports directory
  const reportsDir = path.join(process.cwd(), 'tests/e2e/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
    console.log('✅ Created reports directory');
  }
  
  // Set environment variables for coverage collection
  process.env.E2E_COLLECT_COVERAGE = process.env.E2E_COLLECT_COVERAGE || 'true';
  
  console.log('');
  console.log('🔍 Verifying mock mode is active...');
  
  // Get base URL from config
  const baseURL = config.use?.baseURL || process.env.E2E_BASE_URL || 'http://localhost:3000';
  console.log(`[Global Setup] Base URL: ${baseURL}`);
  
  // Verify mock mode is active before running tests
  try {
    await MockModeSetup.waitForMockMode(baseURL, {
      maxAttempts: 10,
      delayMs: 2000,
      timeoutMs: 60000, // 60 seconds total timeout
    });
    
    console.log('');
    console.log('✅ Mock mode verified and active');
    console.log('✅ E2E test environment ready');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ Mock mode verification failed:');
    console.error((error as Error).message);
    console.error('');
    console.error('Tests cannot run without mock mode active.');
    console.error('This prevents tests from making real API calls or database connections.');
    console.error('');
    
    // Fail fast - throw error to stop test execution
    throw error;
  }
}

export default globalSetup;
