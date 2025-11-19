# Design: Property Testing Framework

## Overview

This design implements a comprehensive property-based framework that validates all 64 correctness properties extracted from completed specifications. The framework provides test generators, property test utilities, and CI/CD integration to ensure system correctness across all architectural layers.

## Architecture

### High-Level Architecture

```
tests/
├── properties/
│   ├── domain/
│   │   ├── entity-identity.properties.test.ts
│   │   ├── value-objects.properties.test.ts
│   │   ├── analysis.properties.test.ts
│   │   └── credits.properties.test.ts
│   ├── data-integrity/
│   │   ├── mappers.properties.test.ts
│   │   └── migration.properties.test.ts
│   ├── business-rules/
│   │   ├── scoring.properties.test.ts
│   │   ├── rate-limiting.properties.test.ts
│   │   └── categories.properties.test.ts
│   ├── security/
│   │   └── auth.properties.test.ts
│   ├── system/
│   │   ├── idempotency.properties.test.ts
│   │   ├── caching.properties.test.ts
│   │   └── ci-cd.properties.test.ts
│   └── utils/
│       ├── generators.ts
│       ├── property-helpers.ts
│       └── coverage-tracker.ts
└── property-coverage-report.json
```

## Components and Interfaces

### 1. Test Data Generators

**Purpose:** Generate random valid test data for property-based testing

**Design Note:** Uses `@faker-js/faker` for realistic test data generation. Install with `npm install @faker-js/faker --save-dev`.

```typescript
// tests/properties/utils/generators.ts

import { faker } from "@faker-js/faker";
import { Analysis, User, CreditTransaction } from "@/domain/entities";
import { AnalysisId, UserId, Score, Email } from "@/domain/value-objects";

/**
 * Generate random valid AnalysisId
 */
export function generateAnalysisId(): AnalysisId {
  return AnalysisId.generate();
}

/**
 * Generate random valid UserId
 */
export function generateUserId(): UserId {
  return UserId.generate();
}

/**
 * Generate random valid Score (0-100)
 */
export function generateScore(): Score {
  return Score.fromNumber(faker.number.int({ min: 0, max: 100 }));
}

/**
 * Generate random valid Email
 */
export function generateEmail(): Email {
  return Email.create(faker.internet.email());
}

/**
 * Generate random valid User
 */
export function generateUser(overrides?: Partial<UserProps>): User {
  return User.create({
    email: generateEmail(),
    tier: faker.helpers.arrayElement(["free", "paid", "admin"]),
    credits: faker.number.int({ min: 0, max: 10 }),
    ...overrides,
  });
}

/**
 * Generate random valid Analysis
 */
export function generateAnalysis(overrides?: Partial<AnalysisProps>): Analysis {
  return Analysis.create({
    idea: faker.lorem.paragraph(),
    userId: generateUserId(),
    score: generateScore(),
    locale: faker.helpers.arrayElement(["en", "es"]),
    ...overrides,
  });
}

/**
 * Generate random valid CreditTransaction
 */
export function generateCreditTransaction(
  overrides?: Partial<CreditTransactionProps>
): CreditTransaction {
  return CreditTransaction.create({
    userId: generateUserId(),
    amount: faker.number.int({ min: -5, max: 5 }),
    type: faker.helpers.arrayElement([
      "deduct",
      "add",
      "refund",
      "admin_adjustment",
    ]),
    description: faker.lorem.sentence(),
    ...overrides,
  });
}

/**
 * Generate array of test data
 */
export function generateMany<T>(generator: () => T, count: number = 10): T[] {
  return Array.from({ length: count }, generator);
}
```

### 2. Property Test Helpers

**Purpose:** Provide utilities for common property test assertions

```typescript
// tests/properties/utils/property-helpers.ts

/**
 * Assert property holds for all generated values
 */
export function forAll<T>(
  generator: () => T,
  property: (value: T) => boolean,
  iterations: number = 100
): void {
  for (let i = 0; i < iterations; i++) {
    const value = generator();
    if (!property(value)) {
      throw new Error(
        `Property violated at iteration ${i + 1} with value: ${JSON.stringify(
          value
        )}`
      );
    }
  }
}

/**
 * Assert property holds for specific test cases
 */
export function forCases<T>(cases: T[], property: (value: T) => boolean): void {
  cases.forEach((testCase, index) => {
    if (!property(testCase)) {
      throw new Error(
        `Property violated for case ${index + 1}: ${JSON.stringify(testCase)}`
      );
    }
  });
}

/**
 * Assert two values are deeply equal
 */
export function deepEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Assert entity equality (by ID)
 */
export function entityEquals<T extends { id: any }>(a: T, b: T): boolean {
  return a.id.equals(b.id);
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}
```

### 3. Coverage Tracker

**Purpose:** Track which properties have tests implemented

```typescript
// tests/properties/utils/coverage-tracker.ts

interface PropertyTest {
  id: string;
  name: string;
  category: string;
  implemented: boolean;
  testFile?: string;
}

export class PropertyCoverageTracker {
  private properties: Map<string, PropertyTest> = new Map();

  /**
   * Register a property
   */
  registerProperty(property: PropertyTest): void {
    this.properties.set(property.id, property);
  }

  /**
   * Mark property as tested
   */
  markTested(propertyId: string, testFile: string): void {
    const property = this.properties.get(propertyId);
    if (property) {
      property.implemented = true;
      property.testFile = testFile;
    }
  }

  /**
   * Get coverage statistics
   */
  getCoverage(): {
    total: number;
    tested: number;
    percentage: number;
    byCategory: Record<string, { total: number; tested: number }>;
  } {
    const total = this.properties.size;
    const tested = Array.from(this.properties.values()).filter(
      (p) => p.implemented
    ).length;

    const byCategory: Record<string, { total: number; tested: number }> = {};

    for (const property of this.properties.values()) {
      if (!byCategory[property.category]) {
        byCategory[property.category] = { total: 0, tested: 0 };
      }
      byCategory[property.category].total++;
      if (property.implemented) {
        byCategory[property.category].tested++;
      }
    }

    return {
      total,
      tested,
      percentage: (tested / total) * 100,
      byCategory,
    };
  }

  /**
   * Get untested properties
   */
  getUntested(): PropertyTest[] {
    return Array.from(this.properties.values()).filter((p) => !p.implemented);
  }

  /**
   * Generate coverage report
   */
  generateReport(): string {
    const coverage = this.getCoverage();
    const untested = this.getUntested();

    let report = `# Property Test Coverage Report\n\n`;
    report += `**Total Coverage:** ${coverage.tested}/${
      coverage.total
    } (${coverage.percentage.toFixed(1)}%)\n\n`;

    report += `## Coverage by Category\n\n`;
    for (const [category, stats] of Object.entries(coverage.byCategory)) {
      const pct = ((stats.tested / stats.total) * 100).toFixed(1);
      report += `- **${category}:** ${stats.tested}/${stats.total} (${pct}%)\n`;
    }

    if (untested.length > 0) {
      report += `\n## Untested Properties (${untested.length})\n\n`;
      for (const property of untested) {
        report += `- ${property.id}: ${property.name}\n`;
      }
    }

    return report;
  }
}
```

### 4. Example Property Tests

**Domain Layer Example:**

```typescript
// tests/properties/domain/entity-identity.properties.test.ts

import { describe, it, expect } from "vitest";
import { generateAnalysis, generateMany } from "../utils/generators";
import { forAll, entityEquals } from "../utils/property-helpers";

describe("Property: Entity Identity", () => {
  describe("P-DOM-001: Entity ID Immutability", () => {
    it("should maintain same ID through all operations", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const originalId = analysis.id;

          // Perform various operations
          analysis.updateScore(Score.fromNumber(50));

          // ID should remain unchanged
          return analysis.id.equals(originalId);
        },
        100
      );
    });
  });

  describe("P-DOM-002: Entity ID Uniqueness", () => {
    it("should generate unique IDs for different entities", () => {
      const analyses = generateMany(generateAnalysis, 100);
      const ids = analyses.map((a) => a.id.value);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(analyses.length);
    });
  });

  describe("P-DOM-003: Entity ID Format Validity", () => {
    it("should generate valid UUID v4 format", () => {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      forAll(
        generateAnalysis,
        (analysis) => uuidRegex.test(analysis.id.value),
        100
      );
    });
  });
});
```

**Data Integrity Example:**

```typescript
// tests/properties/data-integrity/mappers.properties.test.ts

import { describe, it, expect } from "vitest";
import { AnalysisMapper } from "@/infrastructure/database/supabase/mappers/AnalysisMapper";
import { generateAnalysis } from "../utils/generators";
import { forAll, entityEquals } from "../utils/property-helpers";

describe("Property: Mapper Bidirectionality", () => {
  const mapper = new AnalysisMapper();

  describe("P-DATA-001: Entity-DAO Round-Trip Fidelity", () => {
    it("should preserve entity through DAO conversion", () => {
      forAll(
        generateAnalysis,
        (entity) => {
          const dao = mapper.toDAO(entity);
          const reconstructed = mapper.toDomain(dao);

          return (
            entityEquals(entity, reconstructed) &&
            entity.idea === reconstructed.idea &&
            entity.score.value === reconstructed.score.value
          );
        },
        100
      );
    });
  });

  describe("P-DATA-003: Null Field Preservation", () => {
    it("should preserve null fields through conversion", () => {
      const entityWithNulls = generateAnalysis({
        feedback: undefined,
        audio: undefined,
      });

      const dao = mapper.toDAO(entityWithNulls);
      const reconstructed = mapper.toDomain(dao);

      expect(reconstructed.feedback).toBeUndefined();
      expect(reconstructed.audio).toBeUndefined();
    });
  });
});
```

**Business Rules Example:**

```typescript
// tests/properties/business-rules/scoring.properties.test.ts

import { describe, it, expect } from "vitest";
import { ScoreCalculationService } from "@/domain/services/ScoreCalculationService";
import { generateAnalysis } from "../utils/generators";
import { forAll } from "../utils/property-helpers";

describe("Property: Score Calculation", () => {
  const service = new ScoreCalculationService();

  describe("P-BIZ-001: Score Calculation Determinism", () => {
    it("should produce same score for same input", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const score1 = service.calculateFinalScore(analysis.criteria);
          const score2 = service.calculateFinalScore(analysis.criteria);

          return score1 === score2;
        },
        100
      );
    });
  });

  describe("P-BIZ-002: Criteria Score Aggregation", () => {
    it("should calculate final score as average of criteria", () => {
      forAll(
        generateAnalysis,
        (analysis) => {
          const criteriaScores = analysis.criteria.map((c) => c.score);
          const expectedAvg =
            criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length;
          const actualScore = service.calculateFinalScore(analysis.criteria);

          return Math.abs(actualScore - expectedAvg) < 0.01; // Allow small floating point error
        },
        100
      );
    });
  });
});
```

### 5. CI/CD Integration

**GitHub Actions Workflow:**

```yaml
# .github/workflows/property-tests.yml

name: Property Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  property-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run property tests
        run: npm run test:properties

      - name: Generate coverage report
        run: npm run test:properties:coverage

      - name: Upload coverage report
        uses: actions/upload-artifact@v3
        with:
          name: property-coverage-report
          path: tests/property-coverage-report.json

      - name: Comment PR with coverage
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('tests/property-coverage-report.json', 'utf8'));

            const body = `## 🔍 Property Test Coverage

            **Total:** ${report.tested}/${report.total} (${report.percentage.toFixed(1)}%)

            ### By Category
            ${Object.entries(report.byCategory).map(([cat, stats]) =>
              `- **${cat}:** ${stats.tested}/${stats.total} (${((stats.tested/stats.total)*100).toFixed(1)}%)`
            ).join('\n')}
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

### 6. NPM Scripts

**package.json additions:**

```json
{
  "scripts": {
    "test:properties": "vitest run tests/properties",
    "test:properties:watch": "vitest watch tests/properties",
    "test:properties:coverage": "vitest run tests/properties --coverage && node scripts/generate-property-coverage.js"
  }
}
```

### 7. Coverage Report Generator

```typescript
// scripts/generate-property-coverage.js

const fs = require("fs");
const path = require("path");

// Read all property test files
const testDir = path.join(__dirname, "../tests/properties");
const propertyFile = path.join(
  __dirname,
  "../.kiro/specs/general-properties.md"
);

// Parse general-properties.md to extract all property IDs
const propertiesContent = fs.readFileSync(propertyFile, "utf8");
const propertyIds = propertiesContent.match(/P-[A-Z]+-\d+/g) || [];

// Scan test files for implemented properties
const testFiles = getAllTestFiles(testDir);
const implementedProperties = new Set();

testFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  propertyIds.forEach((id) => {
    if (content.includes(id)) {
      implementedProperties.add(id);
    }
  });
});

// Generate report
const report = {
  total: propertyIds.length,
  tested: implementedProperties.size,
  percentage: (implementedProperties.size / propertyIds.length) * 100,
  untested: propertyIds.filter((id) => !implementedProperties.has(id)),
  timestamp: new Date().toISOString(),
};

// Write report
fs.writeFileSync(
  path.join(__dirname, "../tests/property-coverage-report.json"),
  JSON.stringify(report, null, 2)
);

console.log(
  `Property Coverage: ${report.tested}/${
    report.total
  } (${report.percentage.toFixed(1)}%)`
);

if (report.untested.length > 0) {
  console.log("\nUntested properties:");
  report.untested.forEach((id) => console.log(`  - ${id}`));
}

function getAllTestFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllTestFiles(fullPath));
    } else if (item.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  });

  return files;
}
```

## Steering Documentation Updates

### Tech.md Updates

**Changes needed:**

- Update Next.js version to current (14.2+)
- Add property testing tools (faker, fast-check if used)
- Update test framework details with property testing
- Add any new dependencies from completed specs

### Structure.md Updates

**Changes needed:**

- Add tests/properties/ directory structure
- Update with any new infrastructure from completed specs
- Verify all file paths are current
- Add property testing utilities location

### Product.md Updates

**Changes needed:**

- Update feature list with completed features
- Update product direction if pivots occurred
- Verify target users and value proposition
- Update current phase information

## Testing Strategy

### Unit Tests for Framework

- Test data generators produce valid data
- Test property helpers work correctly
- Test coverage tracker calculates correctly

### Integration Tests

- Test property tests run in CI/CD
- Test coverage report generation
- Test PR comment posting

### Manual Verification

- Run all property tests locally
- Verify coverage report accuracy
- Test CI/CD integration end-to-end

## Success Criteria

- ✅ All 64 properties have test files
- ✅ Property tests run in CI/CD
- ✅ Coverage tracking works
- ✅ PR comments show coverage
- ✅ Steering files updated and accurate

## Implementation Priority

1. **Phase 1:** Test infrastructure (generators, helpers, coverage tracker)
2. **Phase 2:** Domain layer property tests (highest value)
3. **Phase 3:** Data integrity property tests
4. **Phase 4:** Business rules property tests
5. **Phase 5:** Security and system property tests
6. **Phase 6:** CI/CD integration
7. **Phase 7:** Steering documentation updates
8. **Phase 8:** Documentation and examples
