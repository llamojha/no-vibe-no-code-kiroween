#!/usr/bin/env node

/**
 * Architecture validation script
 * Validates that the hexagonal architecture is properly configured
 */

import { existsSync } from 'fs';
import { join } from 'path';

const requiredDirectories = [
  'src/domain',
  'src/domain/entities',
  'src/domain/value-objects',
  'src/domain/repositories',
  'src/domain/services',
  'src/application',
  'src/application/use-cases',
  'src/application/handlers',
  'src/application/services',
  'src/infrastructure',
  'src/infrastructure/database',
  'src/infrastructure/external',
  'src/infrastructure/web',
  'src/infrastructure/config',
  'src/infrastructure/factories',
  'src/infrastructure/integration',
  'src/shared',
  'app/actions',
];

const requiredFiles = [
  'src/main.ts',
  'src/domain/entities/Analysis.ts',
  'src/domain/entities/User.ts',
  'src/domain/value-objects/AnalysisId.ts',
  'src/domain/value-objects/UserId.ts',
  'src/application/use-cases/AnalyzeIdeaUseCase.ts',
  'src/infrastructure/database/supabase/repositories/SupabaseAnalysisRepository.ts',
  'src/infrastructure/factories/ServiceFactory.ts',
  'src/infrastructure/factories/UseCaseFactory.ts',
  'src/infrastructure/integration/SupabaseAdapter.ts',
  'src/infrastructure/integration/FeatureFlagAdapter.ts',
  'src/infrastructure/integration/LocaleAdapter.ts',
  'app/actions/analysis.ts',
  'app/actions/hackathon.ts',
  'app/actions/dashboard.ts',
];

function validateArchitecture() {
  console.log('🏗️  Validating hexagonal architecture...\n');

  let hasErrors = false;

  // Check required directories
  console.log('📁 Checking required directories...');
  for (const dir of requiredDirectories) {
    if (!existsSync(dir)) {
      console.error(`❌ Missing directory: ${dir}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${dir}`);
    }
  }

  console.log('\n📄 Checking required files...');
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      console.error(`❌ Missing file: ${file}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${file}`);
    }
  }

  // Check TypeScript configuration
  console.log('\n⚙️  Checking TypeScript configuration...');
  try {
    const tsconfig = JSON.parse(
      require('fs').readFileSync('tsconfig.json', 'utf8')
    );
    
    const requiredPaths = [
      '@/domain',
      '@/application',
      '@/infrastructure',
      '@/shared'
    ];

    for (const path of requiredPaths) {
      if (!tsconfig.compilerOptions?.paths?.[path]) {
        console.error(`❌ Missing TypeScript path alias: ${path}`);
        hasErrors = true;
      } else {
        console.log(`✅ Path alias configured: ${path}`);
      }
    }
  } catch (error) {
    console.error('❌ Error reading tsconfig.json:', error.message);
    hasErrors = true;
  }

  // Check Next.js configuration
  console.log('\n🔧 Checking Next.js configuration...');
  if (!existsSync('next.config.js')) {
    console.error('❌ Missing next.config.js');
    hasErrors = true;
  } else {
    console.log('✅ next.config.js exists');
  }

  // Check package.json scripts
  console.log('\n📦 Checking package.json scripts...');
  try {
    const packageJson = JSON.parse(
      require('fs').readFileSync('package.json', 'utf8')
    );
    
    const requiredScripts = ['dev', 'build', 'start', 'lint'];
    for (const script of requiredScripts) {
      if (!packageJson.scripts?.[script]) {
        console.error(`❌ Missing script: ${script}`);
        hasErrors = true;
      } else {
        console.log(`✅ Script configured: ${script}`);
      }
    }
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
    hasErrors = true;
  }

  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.error('❌ Architecture validation failed!');
    console.error('Please fix the issues above before proceeding.');
    process.exit(1);
  } else {
    console.log('✅ Architecture validation passed!');
    console.log('🎉 Hexagonal architecture is properly configured.');
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateArchitecture();
}

export { validateArchitecture };