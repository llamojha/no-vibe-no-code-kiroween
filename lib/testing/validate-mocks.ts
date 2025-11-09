#!/usr/bin/env node

/**
 * CLI tool for validating mock response data files
 * 
 * Usage:
 *   npm run validate:mocks
 *   npm run validate:mocks -- --type analyzer
 *   npm run validate:mocks -- --strict
 */

import { TestDataManager } from './TestDataManager';
import type { MockResponseType } from './TestDataManager';

interface ValidationOptions {
  type?: MockResponseType;
  strict?: boolean;
  verbose?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ValidationOptions {
  const args = process.argv.slice(2);
  const options: ValidationOptions = {
    strict: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--type':
      case '-t':
        const typeValue = args[++i];
        if (typeValue && ['analyzer', 'hackathon', 'frankenstein'].includes(typeValue)) {
          options.type = typeValue as MockResponseType;
        } else {
          console.error(`Invalid type: ${typeValue}. Must be one of: analyzer, hackathon, frankenstein`);
          process.exit(1);
        }
        break;

      case '--strict':
      case '-s':
        options.strict = true;
        break;

      case '--verbose':
      case '-v':
        options.verbose = true;
        break;

      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;

      default:
        console.error(`Unknown option: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Mock Response Validation Tool

Usage:
  npm run validate:mocks [options]

Options:
  -t, --type <type>     Validate specific type only (analyzer, hackathon, frankenstein)
  -s, --strict          Exit with error code if any validation fails
  -v, --verbose         Show detailed validation results
  -h, --help            Show this help message

Examples:
  npm run validate:mocks
  npm run validate:mocks -- --type analyzer
  npm run validate:mocks -- --strict --verbose
  `);
}

/**
 * Validate a specific mock response type
 */
function validateType(
  manager: TestDataManager,
  type: MockResponseType,
  options: ValidationOptions
): boolean {
  console.log(`\n📋 Validating ${type} mock responses...`);

  try {
    const results = manager.validateAllResponses(type);
    let hasErrors = false;
    let totalScenarios = 0;
    let totalVariants = 0;
    let failedVariants = 0;

    for (const [scenario, scenarioResults] of results.entries()) {
      totalScenarios++;
      totalVariants += scenarioResults.length;

      const failedInScenario = scenarioResults.filter((r) => !r.valid);
      failedVariants += failedInScenario.length;

      if (failedInScenario.length > 0) {
        hasErrors = true;
        console.log(`\n  ❌ Scenario: ${scenario}`);

        for (const result of failedInScenario) {
          if (options.verbose) {
            console.log(`     Errors:`);
            result.errors.forEach((error) => {
              console.log(`       - ${error}`);
            });
          } else {
            console.log(`     ${result.errors.length} validation error(s)`);
          }
        }
      } else if (options.verbose) {
        console.log(`  ✅ Scenario: ${scenario} (${scenarioResults.length} variant(s))`);
      }
    }

    // Print summary
    console.log(`\n  Summary:`);
    console.log(`    Total scenarios: ${totalScenarios}`);
    console.log(`    Total variants: ${totalVariants}`);
    console.log(`    Failed variants: ${failedVariants}`);
    console.log(`    Success rate: ${((totalVariants - failedVariants) / totalVariants * 100).toFixed(1)}%`);

    if (!hasErrors) {
      console.log(`\n  ✅ All ${type} mock responses are valid!`);
    }

    return !hasErrors;
  } catch (error) {
    console.error(`\n  ❌ Failed to validate ${type}:`, (error as Error).message);
    return false;
  }
}

/**
 * Main validation function
 */
async function main(): Promise<void> {
  const options = parseArgs();

  console.log('🔍 Mock Response Validation');
  console.log('============================');

  const manager = new TestDataManager();
  const typesToValidate: MockResponseType[] = options.type
    ? [options.type]
    : ['analyzer', 'hackathon', 'frankenstein'];

  let allValid = true;

  for (const type of typesToValidate) {
    const isValid = validateType(manager, type, options);
    allValid = allValid && isValid;
  }

  // Print final summary
  console.log('\n============================');
  if (allValid) {
    console.log('✅ All mock responses are valid!');
    process.exit(0);
  } else {
    console.log('❌ Some mock responses have validation errors.');
    
    if (options.strict) {
      console.log('\nExiting with error code due to --strict flag.');
      process.exit(1);
    } else {
      console.log('\nRun with --strict flag to exit with error code on validation failure.');
      console.log('Run with --verbose flag to see detailed error messages.');
      process.exit(0);
    }
  }
}

// Run the validation
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
