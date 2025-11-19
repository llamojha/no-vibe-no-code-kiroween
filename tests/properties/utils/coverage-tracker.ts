/**
 * Property Coverage Tracker
 *
 * Tracks which correctness properties have test implementations
 * and generates coverage reports.
 */

export interface PropertyTest {
  id: string;
  name: string;
  category: string;
  implemented: boolean;
  testFile?: string;
}

export interface CoverageStats {
  total: number;
  tested: number;
  percentage: number;
  byCategory: Record<string, { total: number; tested: number }>;
}

/**
 * PropertyCoverageTracker
 *
 * Manages property test coverage tracking and reporting.
 * Validates: Requirements 7.1, 7.2, 7.3
 */
export class PropertyCoverageTracker {
  private properties: Map<string, PropertyTest> = new Map();

  /**
   * Register a property for tracking
   *
   * @param property - Property test metadata
   */
  registerProperty(property: PropertyTest): void {
    if (!property.id || !property.name || !property.category) {
      throw new Error("Property must have id, name, and category");
    }

    this.properties.set(property.id, property);
  }

  /**
   * Mark a property as tested
   *
   * @param propertyId - ID of the property (e.g., "P-DOM-001")
   * @param testFile - Path to the test file implementing this property
   */
  markTested(propertyId: string, testFile: string): void {
    const property = this.properties.get(propertyId);

    if (!property) {
      throw new Error(`Property ${propertyId} not registered`);
    }

    property.implemented = true;
    property.testFile = testFile;
  }

  /**
   * Get coverage statistics
   *
   * @returns Coverage statistics including total, tested, percentage, and by-category breakdown
   */
  getCoverage(): CoverageStats {
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
      percentage: total > 0 ? (tested / total) * 100 : 0,
      byCategory,
    };
  }

  /**
   * Get list of untested properties
   *
   * @returns Array of properties that don't have test implementations
   */
  getUntested(): PropertyTest[] {
    return Array.from(this.properties.values()).filter((p) => !p.implemented);
  }

  /**
   * Get list of tested properties
   *
   * @returns Array of properties that have test implementations
   */
  getTested(): PropertyTest[] {
    return Array.from(this.properties.values()).filter((p) => p.implemented);
  }

  /**
   * Get property by ID
   *
   * @param propertyId - ID of the property
   * @returns Property metadata or undefined if not found
   */
  getProperty(propertyId: string): PropertyTest | undefined {
    return this.properties.get(propertyId);
  }

  /**
   * Get all registered properties
   *
   * @returns Array of all registered properties
   */
  getAllProperties(): PropertyTest[] {
    return Array.from(this.properties.values());
  }

  /**
   * Generate markdown coverage report
   *
   * @returns Formatted markdown report
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
      const pct =
        stats.total > 0
          ? ((stats.tested / stats.total) * 100).toFixed(1)
          : "0.0";
      report += `- **${category}:** ${stats.tested}/${stats.total} (${pct}%)\n`;
    }

    if (untested.length > 0) {
      report += `\n## Untested Properties (${untested.length})\n\n`;

      // Group untested by category
      const untestedByCategory: Record<string, PropertyTest[]> = {};
      for (const property of untested) {
        if (!untestedByCategory[property.category]) {
          untestedByCategory[property.category] = [];
        }
        untestedByCategory[property.category].push(property);
      }

      for (const [category, properties] of Object.entries(untestedByCategory)) {
        report += `\n### ${category}\n\n`;
        for (const property of properties) {
          report += `- ${property.id}: ${property.name}\n`;
        }
      }
    } else {
      report += `\n## ✅ All Properties Tested!\n\n`;
      report += `Congratulations! All ${coverage.total} properties have test implementations.\n`;
    }

    return report;
  }

  /**
   * Generate JSON coverage report
   *
   * @returns JSON-serializable coverage data
   */
  generateJSONReport(): {
    timestamp: string;
    coverage: CoverageStats;
    untested: PropertyTest[];
    tested: PropertyTest[];
  } {
    return {
      timestamp: new Date().toISOString(),
      coverage: this.getCoverage(),
      untested: this.getUntested(),
      tested: this.getTested(),
    };
  }

  /**
   * Clear all registered properties
   */
  clear(): void {
    this.properties.clear();
  }
}
