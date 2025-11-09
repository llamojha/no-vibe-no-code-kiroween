#!/usr/bin/env node
/**
 * Manual verification script for MockModeSetup
 * 
 * Usage: npx tsx tests/e2e/setup/verify-mock-mode.ts [baseURL]
 */

import { MockModeSetup } from './mock-mode-setup';

const baseURL = process.argv[2] || 'http://localhost:3000';

console.log('🔍 Verifying mock mode...');
console.log(`Base URL: ${baseURL}`);
console.log('');

MockModeSetup.logEnvironmentConfig();
console.log('');

MockModeSetup.waitForMockMode(baseURL, {
  maxAttempts: 5,
  delayMs: 2000,
  timeoutMs: 30000,
})
  .then(() => {
    console.log('');
    console.log('✅ Mock mode verification successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Mock mode verification failed:');
    console.error(error.message);
    process.exit(1);
  });
