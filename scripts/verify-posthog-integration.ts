#!/usr/bin/env tsx

/**
 * PostHog Integration Verification Script
 *
 * This script verifies that the PostHog analytics integration is properly configured
 * and all required files are in place.
 */

import * as fs from "fs";
import * as path from "path";

interface CheckResult {
  name: string;
  status: "✅" | "❌" | "⚠️";
  message: string;
}

const results: CheckResult[] = [];

function checkFile(filePath: string, description: string): boolean {
  const fullPath = path.join(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);

  results.push({
    name: description,
    status: exists ? "✅" : "❌",
    message: exists ? `Found: ${filePath}` : `Missing: ${filePath}`,
  });

  return exists;
}

function checkFileContent(
  filePath: string,
  searchString: string,
  description: string
): boolean {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    results.push({
      name: description,
      status: "❌",
      message: `File not found: ${filePath}`,
    });
    return false;
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  const found = content.includes(searchString);

  results.push({
    name: description,
    status: found ? "✅" : "❌",
    message: found
      ? `Found in ${filePath}`
      : `Not found in ${filePath}: "${searchString}"`,
  });

  return found;
}

function checkEnvVariable(varName: string, description: string): boolean {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    results.push({
      name: description,
      status: "⚠️",
      message: `.env.local not found - ${varName} not configured`,
    });
    return false;
  }

  const content = fs.readFileSync(envPath, "utf-8");
  const hasVar = content.includes(varName);

  results.push({
    name: description,
    status: hasVar ? "✅" : "⚠️",
    message: hasVar
      ? `${varName} configured in .env.local`
      : `${varName} not configured in .env.local (optional for testing)`,
  });

  return hasVar;
}

function printResults() {
  console.log("\n" + "=".repeat(80));
  console.log("PostHog Analytics Integration Verification");
  console.log("=".repeat(80) + "\n");

  const categories = {
    "Core Files": results.slice(0, 4),
    Configuration: results.slice(4, 7),
    "Integration Points": results.slice(7, 12),
    "Testing Files": results.slice(12),
  };

  for (const [category, items] of Object.entries(categories)) {
    console.log(`\n${category}:`);
    console.log("-".repeat(80));

    for (const result of items) {
      console.log(`${result.status} ${result.name}`);
      console.log(`   ${result.message}`);
    }
  }

  const passed = results.filter((r) => r.status === "✅").length;
  const failed = results.filter((r) => r.status === "❌").length;
  const warnings = results.filter((r) => r.status === "⚠️").length;

  console.log("\n" + "=".repeat(80));
  console.log("Summary:");
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  ⚠️  Warnings: ${warnings}`);
  console.log("=".repeat(80) + "\n");

  if (failed > 0) {
    console.log("❌ PostHog integration has missing components.");
    console.log(
      "   Please review the failed checks and ensure all files are in place.\n"
    );
    process.exit(1);
  } else if (warnings > 0) {
    console.log("⚠️  PostHog integration is complete but not configured.");
    console.log(
      "   Add NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST to .env.local to enable analytics.\n"
    );
    process.exit(0);
  } else {
    console.log("✅ PostHog integration is complete and configured!\n");
    process.exit(0);
  }
}

// Run checks
console.log("Verifying PostHog analytics integration...\n");

// Core Files
checkFile("instrumentation.ts", "Server-side instrumentation file");
checkFile("features/analytics/tracking.ts", "Client-side tracking utilities");
checkFile(
  "features/analytics/server-tracking.ts",
  "Server-side tracking utilities"
);
checkFile("features/analytics/posthogClient.ts", "Legacy PostHog client");

// Configuration
checkFileContent(
  "next.config.js",
  "/ingest/",
  "Reverse proxy configuration in next.config.js"
);
checkFileContent(
  ".env.example",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "PostHog env vars in .env.example"
);
checkEnvVariable("NEXT_PUBLIC_POSTHOG_KEY", "PostHog API key in .env.local");

// Integration Points
checkFileContent(
  "features/analyzer/components/AnalyzerView.tsx",
  "trackReportGeneration",
  "Analyzer tracking integration"
);
checkFileContent(
  "features/kiroween-analyzer/components/KiroweenAnalyzerView.tsx",
  "trackReportGeneration",
  "Kiroween Analyzer tracking integration"
);
checkFileContent(
  "features/doctor-frankenstein/components/DoctorFrankensteinView.tsx",
  "trackFrankensteinInteraction",
  "Dr. Frankenstein tracking integration"
);
checkFileContent(
  "features/home/components/AnimationToggle.tsx",
  "trackHomepageInteraction",
  "Homepage tracking integration"
);
checkFileContent(
  "features/auth/context/AuthContext.tsx",
  "identifyUser",
  "User identification integration"
);

// Testing Files
checkFile(
  "tests/integration/posthog-analytics.test.ts",
  "Integration test file"
);
checkFile(
  "tests/integration/POSTHOG_TESTING_GUIDE.md",
  "Testing guide documentation"
);

printResults();
