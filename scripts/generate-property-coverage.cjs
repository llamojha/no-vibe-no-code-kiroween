#!/usr/bin/env node

/**
 * Property Coverage Report Generator
 *
 * Scans general-properties.md for property IDs and test files for implementations,
 * then generates a JSON coverage report.
 *
 * Validates: Requirements 7.4, 7.5
 */

const fs = require("fs");
const path = require("path");

// Configuration
const PROPERTY_FILE = path.join(
  __dirname,
  "../.kiro/specs/general-properties.md"
);
const TEST_DIR = path.join(__dirname, "../tests/properties");
const OUTPUT_FILE = path.join(
  __dirname,
  "../tests/property-coverage-report.json"
);

/**
 * Extract property IDs from general-properties.md
 *
 * @returns {Array<{id: string, name: string, category: string}>}
 */
function extractPropertiesFromSpec() {
  if (!fs.existsSync(PROPERTY_FILE)) {
    console.error(`Error: Property file not found at ${PROPERTY_FILE}`);
    process.exit(1);
  }

  const content = fs.readFileSync(PROPERTY_FILE, "utf8");
  const properties = [];

  // Match property IDs like P-DOM-001, P-DATA-001, etc.
  const propertyIdRegex = /#### (P-[A-Z0-9]+-\d+): (.+)/g;
  let match;

  // Track current category
  let currentCategory = "Unknown";
  const categoryRegex = /^## (.+) Properties$/gm;

  // Split content into lines for better parsing
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for category header
    const categoryMatch = line.match(/^## (.+) Properties$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1];
      continue;
    }

    // Check for property definition
    const propertyMatch = line.match(/^#### (P-[A-Z0-9]+-\d+): (.+)$/);
    if (propertyMatch) {
      properties.push({
        id: propertyMatch[1],
        name: propertyMatch[2],
        category: currentCategory,
      });
    }
  }

  return properties;
}

/**
 * Get all test files recursively
 *
 * @param {string} dir - Directory to scan
 * @returns {string[]} - Array of test file paths
 */
function getAllTestFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllTestFiles(fullPath));
    } else if (
      item.endsWith(".test.ts") ||
      item.endsWith(".properties.test.ts")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Scan test files for implemented properties
 *
 * @param {string[]} testFiles - Array of test file paths
 * @param {Array<{id: string}>} properties - Array of property definitions
 * @returns {Map<string, string>} - Map of property ID to test file path
 */
function scanTestFilesForProperties(testFiles, properties) {
  const implementedProperties = new Map();

  for (const testFile of testFiles) {
    const content = fs.readFileSync(testFile, "utf8");

    // Check each property ID
    for (const property of properties) {
      // Look for property ID in comments or test descriptions
      if (content.includes(property.id)) {
        implementedProperties.set(
          property.id,
          path.relative(process.cwd(), testFile)
        );
      }
    }
  }

  return implementedProperties;
}

/**
 * Calculate coverage statistics
 *
 * @param {Array} properties - All properties
 * @param {Map} implementedProperties - Implemented properties map
 * @returns {Object} - Coverage statistics
 */
function calculateCoverage(properties, implementedProperties) {
  const total = properties.length;
  const tested = implementedProperties.size;
  const percentage = total > 0 ? (tested / total) * 100 : 0;

  // Calculate by category
  const byCategory = {};

  for (const property of properties) {
    if (!byCategory[property.category]) {
      byCategory[property.category] = { total: 0, tested: 0 };
    }
    byCategory[property.category].total++;

    if (implementedProperties.has(property.id)) {
      byCategory[property.category].tested++;
    }
  }

  return {
    total,
    tested,
    percentage: parseFloat(percentage.toFixed(1)),
    byCategory,
  };
}

/**
 * Generate coverage report
 */
function generateReport() {
  console.log("🔍 Scanning for property definitions...");
  const properties = extractPropertiesFromSpec();
  console.log(`   Found ${properties.length} properties in specification`);

  console.log("\n📂 Scanning test files...");
  const testFiles = getAllTestFiles(TEST_DIR);
  console.log(`   Found ${testFiles.length} test files`);

  console.log("\n🔗 Matching properties to tests...");
  const implementedProperties = scanTestFilesForProperties(
    testFiles,
    properties
  );
  console.log(`   Found ${implementedProperties.size} implemented properties`);

  console.log("\n📊 Calculating coverage...");
  const coverage = calculateCoverage(properties, implementedProperties);

  // Build untested and tested arrays
  const untested = properties
    .filter((p) => !implementedProperties.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      implemented: false,
    }));

  const tested = properties
    .filter((p) => implementedProperties.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      implemented: true,
      testFile: implementedProperties.get(p.id),
    }));

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    coverage,
    untested,
    tested,
  };

  // Write report to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  console.log(
    `\n✅ Coverage report written to ${path.relative(
      process.cwd(),
      OUTPUT_FILE
    )}`
  );

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("PROPERTY TEST COVERAGE SUMMARY");
  console.log("=".repeat(60));
  console.log(
    `\nTotal Coverage: ${coverage.tested}/${coverage.total} (${coverage.percentage}%)`
  );

  console.log("\nCoverage by Category:");
  for (const [category, stats] of Object.entries(coverage.byCategory)) {
    const pct =
      stats.total > 0 ? ((stats.tested / stats.total) * 100).toFixed(1) : "0.0";
    const bar = "█".repeat(Math.floor((stats.tested / stats.total) * 20));
    const empty = "░".repeat(
      20 - Math.floor((stats.tested / stats.total) * 20)
    );
    console.log(
      `  ${category.padEnd(25)} [${bar}${empty}] ${stats.tested}/${
        stats.total
      } (${pct}%)`
    );
  }

  if (untested.length > 0) {
    console.log(`\n⚠️  Untested Properties (${untested.length}):`);

    // Group by category
    const untestedByCategory = {};
    for (const prop of untested) {
      if (!untestedByCategory[prop.category]) {
        untestedByCategory[prop.category] = [];
      }
      untestedByCategory[prop.category].push(prop);
    }

    for (const [category, props] of Object.entries(untestedByCategory)) {
      console.log(`\n  ${category}:`);
      for (const prop of props) {
        console.log(`    - ${prop.id}: ${prop.name}`);
      }
    }
  } else {
    console.log("\n🎉 All properties have test implementations!");
  }

  console.log("\n" + "=".repeat(60));

  // Exit with error code if coverage is not 100%
  if (coverage.percentage < 100) {
    console.log("\n⚠️  Warning: Property coverage is not at 100%");
    // Don't exit with error for now, just warn
    // process.exit(1);
  }
}

// Run the generator
try {
  generateReport();
} catch (error) {
  console.error("\n❌ Error generating coverage report:");
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}
