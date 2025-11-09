/**
 * Global Teardown for E2E Tests
 * 
 * Runs once after all tests to clean up and process coverage data.
 */

import * as fs from 'fs';
import * as path from 'path';
import { mergeCoverageData, saveCoverageSummary, type CoverageData } from './helpers/coverage-helper';

async function globalTeardown(): Promise<void> {
  console.log('🧹 Cleaning up E2E test environment...');
  
  // Process coverage data if collection was enabled
  if (process.env.E2E_COLLECT_COVERAGE === 'true') {
    try {
      const coverageDir = path.join(process.cwd(), 'tests/e2e/coverage');
      
      if (fs.existsSync(coverageDir)) {
        // Read all coverage files
        const files = fs.readdirSync(coverageDir).filter(f => f.endsWith('-js.json'));
        
        if (files.length > 0) {
          console.log(`📊 Processing ${files.length} coverage files...`);
          
          const allCoverage: CoverageData[][] = [];
          
          for (const file of files) {
            const filePath = path.join(coverageDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            allCoverage.push(data);
          }
          
          // Merge all coverage data
          const merged = mergeCoverageData(allCoverage);
          
          // Save merged coverage
          const mergedPath = path.join(coverageDir, 'coverage-merged.json');
          fs.writeFileSync(mergedPath, JSON.stringify(merged, null, 2));
          console.log('✅ Saved merged coverage data');
          
          // Generate and save summary
          const summaryPath = path.join(coverageDir, 'coverage-summary.json');
          saveCoverageSummary(merged, summaryPath);
          console.log('✅ Generated coverage summary');
        }
      }
    } catch (error) {
      console.error('❌ Error processing coverage data:', error);
    }
  }
  
  console.log('✅ E2E test cleanup complete');
}

export default globalTeardown;
