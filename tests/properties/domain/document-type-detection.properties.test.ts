/**
 * Property test for Document Type Detection
 * Tests that document type is correctly detected and preserved
 *
 * Feature: idea-panel
 * Property: Document type is detected correctly
 * Validates: Requirements 2.3, 2.4
 */

import { describe, it, expect } from "vitest";
import { generateDocument, generateDocumentType } from "../utils/generators";
import { forAll } from "../utils/property-helpers";
import { DocumentType } from "@/src/domain/value-objects/DocumentType";

describe("Property: Document Type Detection", () => {
  /**
   * Property: For any document, the document type should be correctly detected
   * Validates: Requirements 2.3, 2.4
   */
  it("Feature: idea-panel, Property: Document type is detected correctly", () => {
    forAll(
      generateDocument,
      (document) => {
        const detectedType = document.getType();

        // The detected type should match the document's type
        return document.documentType.equals(detectedType);
      },
      100
    );
  });

  /**
   * Property: For any startup analysis document, getType() should return startup_analysis
   * Validates: Requirements 2.3
   */
  it("should correctly detect startup_analysis document type", () => {
    forAll(
      () => generateDocument({ documentType: DocumentType.STARTUP_ANALYSIS }),
      (document) => {
        const detectedType = document.getType();

        // Should be startup analysis
        return (
          detectedType.isStartupAnalysis() &&
          detectedType.value === "startup_analysis"
        );
      },
      100
    );
  });

  /**
   * Property: For any hackathon analysis document, getType() should return hackathon_analysis
   * Validates: Requirements 2.4
   */
  it("should correctly detect hackathon_analysis document type", () => {
    forAll(
      () => generateDocument({ documentType: DocumentType.HACKATHON_ANALYSIS }),
      (document) => {
        const detectedType = document.getType();

        // Should be hackathon analysis
        return (
          detectedType.isHackathonAnalysis() &&
          detectedType.value === "hackathon_analysis"
        );
      },
      100
    );
  });

  /**
   * Property: Document type should be immutable after creation
   * Validates: Requirements 2.3, 2.4
   */
  it("should maintain document type immutability", () => {
    forAll(
      generateDocument,
      (document) => {
        const originalType = document.getType();

        // Get type multiple times
        const type1 = document.getType();
        const type2 = document.getType();
        const type3 = document.getType();

        // All should be equal to original
        return (
          originalType.equals(type1) &&
          originalType.equals(type2) &&
          originalType.equals(type3)
        );
      },
      100
    );
  });

  /**
   * Property: Document type should match content structure
   * Validates: Requirements 2.3, 2.4
   */
  it("should have content structure matching document type", () => {
    forAll(
      generateDocument,
      (document) => {
        const content = document.getContent();
        const type = document.getType();

        if (type.isStartupAnalysis()) {
          const hasLegacyFields =
            "viability" in content &&
            "innovation" in content &&
            "market" in content;
          const hasIdeaPanelFields =
            "score" in content &&
            ("feedback" in content || "detailedSummary" in content);

          // Startup analysis should have either legacy fields or idea panel fields
          return hasLegacyFields || hasIdeaPanelFields;
        } else if (type.isHackathonAnalysis()) {
          const hasLegacyFields =
            "technical" in content &&
            "creativity" in content &&
            "impact" in content;
          const hasIdeaPanelFields =
            "score" in content && "detailedSummary" in content;
          const hasCriteriaAnalysisFields =
            "criteriaAnalysis" in content || "categoryAnalysis" in content;

          // Hackathon analysis should have either legacy fields or idea panel fields
          return (
            hasLegacyFields || hasIdeaPanelFields || hasCriteriaAnalysisFields
          );
        }

        return false;
      },
      100
    );
  });

  /**
   * Property: Document type value should be one of the valid types
   * Validates: Requirements 2.3, 2.4
   */
  it("should only have valid document type values", () => {
    forAll(
      generateDocument,
      (document) => {
        const type = document.getType();
        const validTypes = ["startup_analysis", "hackathon_analysis"];

        return validTypes.includes(type.value);
      },
      100
    );
  });

  /**
   * Property: Document type detection should be consistent across multiple calls
   * Validates: Requirements 2.3, 2.4
   */
  it("should return consistent type across multiple getType() calls", () => {
    forAll(
      generateDocument,
      (document) => {
        const types = Array.from({ length: 10 }, () => document.getType());

        // All types should be equal
        return types.every((type) => type.equals(types[0]));
      },
      100
    );
  });
});
