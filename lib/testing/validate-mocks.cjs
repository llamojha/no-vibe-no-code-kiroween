/**
 * Validation script for mock data files
 * Run with: node lib/testing/validate-mocks.cjs
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const files = ['analyzer-mocks.json', 'hackathon-mocks.json', 'frankenstein-mocks.json'];

console.log('Validating mock data files...\n');

let allValid = true;

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  console.log(`Checking ${file}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Check structure
    if (!data.scenarios) {
      console.error(`  ❌ Missing 'scenarios' key`);
      allValid = false;
      return;
    }
    
    const scenarios = Object.keys(data.scenarios);
    console.log(`  ✓ Found ${scenarios.length} scenarios: ${scenarios.join(', ')}`);
    
    // Check each scenario has responses
    scenarios.forEach(scenario => {
      const responses = data.scenarios[scenario];
      if (!Array.isArray(responses) || responses.length === 0) {
        console.error(`  ❌ Scenario '${scenario}' has no responses`);
        allValid = false;
      } else {
        console.log(`    - ${scenario}: ${responses.length} variant(s)`);
        
        // Check response structure
        responses.forEach((response, idx) => {
          if (!response.data) {
            console.error(`      ❌ Response ${idx} missing 'data' field`);
            allValid = false;
          }
          if (typeof response.statusCode !== 'number') {
            console.error(`      ❌ Response ${idx} missing or invalid 'statusCode'`);
            allValid = false;
          }
        });
      }
    });
    
    console.log(`  ✓ ${file} is valid\n`);
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}\n`);
    allValid = false;
  }
});

if (allValid) {
  console.log('✅ All mock data files are valid!');
  process.exit(0);
} else {
  console.error('❌ Some mock data files have errors');
  process.exit(1);
}
