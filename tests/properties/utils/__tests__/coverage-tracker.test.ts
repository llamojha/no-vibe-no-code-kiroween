import { describe, it, expect, beforeEach } from "vitest";
import { PropertyCoverageTracker } from "../coverage-tracker";

describe("PropertyCoverageTracker", () => {
  let tracker: PropertyCoverageTracker;

  beforeEach(() => {
    tracker = new PropertyCoverageTracker();
  });

  describe("registerProperty", () => {
    it("should register a property", () => {
      tracker.registerProperty({
        id: "P-DOM-001",
        name: "Entity ID Immutability",
        category: "Domain Layer",
        implemented: false,
      });

      const property = tracker.getProperty("P-DOM-001");
      expect(property).toBeDefined();
      expect(property?.name).toBe("Entity ID Immutability");
    });

    it("should throw error if property is missing required fields", () => {
      expect(() => {
        tracker.registerProperty({
          id: "",
          name: "Test",
          category: "Test",
          implemented: false,
        });
      }).toThrow("Property must have id, name, and category");
    });
  });

  describe("markTested", () => {
    it("should mark a property as tested", () => {
      tracker.registerProperty({
        id: "P-DOM-001",
        name: "Entity ID Immutability",
        category: "Domain Layer",
        implemented: false,
      });

      tracker.markTested(
        "P-DOM-001",
        "tests/properties/domain/entity-identity.test.ts"
      );

      const property = tracker.getProperty("P-DOM-001");
      expect(property?.implemented).toBe(true);
      expect(property?.testFile).toBe(
        "tests/properties/domain/entity-identity.test.ts"
      );
    });

    it("should throw error if property is not registered", () => {
      expect(() => {
        tracker.markTested("P-INVALID-001", "test.ts");
      }).toThrow("Property P-INVALID-001 not registered");
    });
  });

  describe("getCoverage", () => {
    it("should calculate coverage correctly", () => {
      tracker.registerProperty({
        id: "P-DOM-001",
        name: "Entity ID Immutability",
        category: "Domain Layer",
        implemented: false,
      });
      tracker.registerProperty({
        id: "P-DOM-002",
        name: "Entity ID Uniqueness",
        category: "Domain Layer",
        implemented: false,
      });
      tracker.registerProperty({
        id: "P-DATA-001",
        name: "Entity-DAO Round-Trip",
        category: "Data Integrity",
        implemented: false,
      });

      tracker.markTested("P-DOM-001", "test1.ts");

      const coverage = tracker.getCoverage();
      expect(coverage.total).toBe(3);
      expect(coverage.tested).toBe(1);
      expect(coverage.percentage).toBeCloseTo(33.33, 1);
      expect(coverage.byCategory["Domain Layer"].total).toBe(2);
      expect(coverage.byCategory["Domain Layer"].tested).toBe(1);
      expect(coverage.byCategory["Data Integrity"].total).toBe(1);
      expect(coverage.byCategory["Data Integrity"].tested).toBe(0);
    });

    it("should handle empty tracker", () => {
      const coverage = tracker.getCoverage();
      expect(coverage.total).toBe(0);
      expect(coverage.tested).toBe(0);
      expect(coverage.percentage).toBe(0);
    });
  });

  describe("getUntested", () => {
    it("should return untested properties", () => {
      tracker.registerProperty({
        id: "P-DOM-001",
        name: "Entity ID Immutability",
        category: "Domain Layer",
        implemented: false,
      });
      tracker.registerProperty({
        id: "P-DOM-002",
        name: "Entity ID Uniqueness",
        category: "Domain Layer",
        implemented: false,
      });

      tracker.markTested("P-DOM-001", "test1.ts");

      const untested = tracker.getUntested();
      expect(untested).toHaveLength(1);
      expect(untested[0].id).toBe("P-DOM-002");
    });
  });

  describe("getTested", () => {
    it("should return tested properties", () => {
      tracker.registerProperty({
        id: "P-DOM-001",
        name: "Entity ID Immutability",
        category: "Domain Layer",
        implemented: false,
      });
      tracker.registerProperty({
        id: "P-DOM-002",
        name: "Entity ID Uniqueness",
        category: "Domain Layer",
        implemented: false,
      });

      tracker.markTested("P-DOM-001", "test1.ts");

      const tested = tracker.getTested();
      expect(tested).toHaveLength(1);
      expect(tested[0].id).toBe("P-DOM-001");
    });
  });

  describe("generateReport", () => {
    it("should generate markdown report", () => {
      tracker.registerProperty({
        id: "P-DOM-001",
        name: "Entity ID Immutability",
        category: "Domain Layer",
        implemented: false,
      });
      tracker.registerProperty({
        id: "P-DOM-002",
        name: "Entity ID Uniqueness",
        category: "Domain Layer",
        implemented: false,
      });

      tracker.markTested("P-DOM-001", "test1.ts");

      const report = tracker.generateReport();
      expect(report).toContain("Property Test Coverage Report");
      expect(report).toContain("**Total Coverage:** 1/2 (50.0%)");
      expect(report).toContain("Domain Layer");
      expect(report).toContain("P-DOM-002: Entity ID Uniqueness");
    });

    it("should show success message when all properties tested", () => {
      tracker.registerProperty({
        id: "P-DOM-001",
        name: "Entity ID Immutability",
        category: "Domain Layer",
        implemented: false,
      });

      tracker.markTested("P-DOM-001", "test1.ts");

      const report = tracker.generateReport();
      expect(report).toContain("All Properties Tested!");
    });
  });

  describe("generateJSONReport", () => {
    it("should generate JSON report", () => {
      tracker.registerProperty({
        id: "P-DOM-001",
        name: "Entity ID Immutability",
        category: "Domain Layer",
        implemented: false,
      });

      tracker.markTested("P-DOM-001", "test1.ts");

      const report = tracker.generateJSONReport();
      expect(report.timestamp).toBeDefined();
      expect(report.coverage.total).toBe(1);
      expect(report.coverage.tested).toBe(1);
      expect(report.tested).toHaveLength(1);
      expect(report.untested).toHaveLength(0);
    });
  });

  describe("clear", () => {
    it("should clear all properties", () => {
      tracker.registerProperty({
        id: "P-DOM-001",
        name: "Entity ID Immutability",
        category: "Domain Layer",
        implemented: false,
      });

      tracker.clear();

      const coverage = tracker.getCoverage();
      expect(coverage.total).toBe(0);
    });
  });
});
