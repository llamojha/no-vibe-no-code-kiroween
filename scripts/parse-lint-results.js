#!/usr/bin/env node

const fs = require("fs");

try {
  const results = JSON.parse(fs.readFileSync("lint-results.json", "utf8"));

  const errorCount = results.reduce((sum, file) => sum + file.errorCount, 0);
  const warningCount = results.reduce(
    (sum, file) => sum + file.warningCount,
    0
  );

  console.log(`ERRORS=${errorCount}`);
  console.log(`WARNINGS=${warningCount}`);

  if (errorCount > 0) {
    process.exit(1);
  }

  process.exit(0);
} catch (error) {
  console.error("Error parsing lint results:", error.message);
  process.exit(1);
}
