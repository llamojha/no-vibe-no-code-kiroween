/**
 * Property-based tests for document generator UI components
 *
 * Tests correctness properties for document generator pages:
 * - Property 1: Generator page navigation (Requirements 1.2, 3.2, 5.2, 7.2)
 * - Property 2: Context display on generator pages (Requirements 1.3, 3.3, 5.3, 7.3)
 * - Property 3: Credit cost display (Requirements 1.4, 3.4, 5.4, 7.4)
 */

import { describe, it, expect } from "vitest";
import { faker } from "@faker-js/faker";
import { DocumentType } from "@/src/domain/value-objects/DocumentType";
import { DOCUMENT_TYPE_CONFIGS } from "@/src/domain/config/documentTypeConfig";
import {
  getGeneratorRoute,
  getDocumentDisplayName,
  getDocumentCreditCost,
} from "@/lib/documents";

/**
 * Generate random valid UUID for idea IDs
 */
function generateIdeaId(): string {
  return faker.string.uuid();
}

/**
 * Generate random generatable document type
 */
function generateGeneratableDocumentType(): DocumentType {
  return faker.helpers.arrayElement([
    DocumentType.PRD,
    DocumentType.TECHNICAL_DESIGN,
    DocumentType.ARCHITECTURE,
    DocumentType.ROADMAP,
  ]);
}

/**
 * All generatable document types for exhaustive testing
 */
const GENERATABLE_DOCUMENT_TYPES = [
  DocumentType.PRD,
  DocumentType.TECHNICAL_DESIGN,
  DocumentType.ARCHITECTURE,
  DocumentType.ROADMAP,
];

describe("Document Generator UI Properties", () => {
  describe("Property 1: Generator page navigation", () => {
    it("Feature: idea-panel-document-generation, Property 1: Generator page navigation - route format", () => {
      // **Validates: Requirements 1.2, 3.2, 5.2, 7.2**
      // For any idea ID and document type (PRD, Technical Design, Architecture, Roadmap),
      // the generator route should follow the pattern /generate/[type]/[ideaId]

      // Run 100 iterations with random idea IDs and document types
      for (let i = 0; i < 100; i++) {
        const ideaId = generateIdeaId();
        const documentType = generateGeneratableDocumentType();

        const route = getGeneratorRoute(documentType, ideaId);

        // Property: Route must start with /generate/
        expect(route).toMatch(/^\/generate\//);

        // Property: Route must contain the idea ID
        expect(route).toContain(ideaId);

        // Property: Route must be a valid URL path (no special characters except - and /)
        expect(route).toMatch(/^\/generate\/[a-z-]+\/[a-f0-9-]+$/);
      }
    });

    it("Feature: idea-panel-document-generation, Property 1: Generator page navigation - PRD route", () => {
      // **Validates: Requirements 1.2**

      for (let i = 0; i < 100; i++) {
        const ideaId = generateIdeaId();
        const route = getGeneratorRoute(DocumentType.PRD, ideaId);

        // Property: PRD route must be /generate/prd/[ideaId]
        expect(route).toBe(`/generate/prd/${ideaId}`);
      }
    });

    it("Feature: idea-panel-document-generation, Property 1: Generator page navigation - Technical Design route", () => {
      // **Validates: Requirements 3.2**

      for (let i = 0; i < 100; i++) {
        const ideaId = generateIdeaId();
        const route = getGeneratorRoute(DocumentType.TECHNICAL_DESIGN, ideaId);

        // Property: Technical Design route must be /generate/technical-design/[ideaId]
        expect(route).toBe(`/generate/technical-design/${ideaId}`);
      }
    });

    it("Feature: idea-panel-document-generation, Property 1: Generator page navigation - Architecture route", () => {
      // **Validates: Requirements 5.2**

      for (let i = 0; i < 100; i++) {
        const ideaId = generateIdeaId();
        const route = getGeneratorRoute(DocumentType.ARCHITECTURE, ideaId);

        // Property: Architecture route must be /generate/architecture/[ideaId]
        expect(route).toBe(`/generate/architecture/${ideaId}`);
      }
    });

    it("Feature: idea-panel-document-generation, Property 1: Generator page navigation - Roadmap route", () => {
      // **Validates: Requirements 7.2**

      for (let i = 0; i < 100; i++) {
        const ideaId = generateIdeaId();
        const route = getGeneratorRoute(DocumentType.ROADMAP, ideaId);

        // Property: Roadmap route must be /generate/roadmap/[ideaId]
        expect(route).toBe(`/generate/roadmap/${ideaId}`);
      }
    });

    it("Feature: idea-panel-document-generation, Property 1: Generator page navigation - all types have unique routes", () => {
      // **Validates: Requirements 1.2, 3.2, 5.2, 7.2**

      for (let i = 0; i < 100; i++) {
        const ideaId = generateIdeaId();

        const routes = GENERATABLE_DOCUMENT_TYPES.map((type) =>
          getGeneratorRoute(type, ideaId)
        );

        // Property: All routes must be unique for the same idea ID
        const uniqueRoutes = new Set(routes);
        expect(uniqueRoutes.size).toBe(GENERATABLE_DOCUMENT_TYPES.length);
      }
    });
  });

  describe("Property 2: Context display on generator pages", () => {
    it("Feature: idea-panel-document-generation, Property 2: Context display on generator pages - display name exists", () => {
      // **Validates: Requirements 1.3, 3.3, 5.3, 7.3**
      // For any document type, the generator page should have a display name for context

      for (let i = 0; i < 100; i++) {
        const documentType = generateGeneratableDocumentType();

        const displayName = getDocumentDisplayName(documentType);

        // Property: Display name must be a non-empty string
        expect(typeof displayName).toBe("string");
        expect(displayName.length).toBeGreaterThan(0);
      }
    });

    it("Feature: idea-panel-document-generation, Property 2: Context display on generator pages - all types have display names", () => {
      // **Validates: Requirements 1.3, 3.3, 5.3, 7.3**

      // Property: All generatable document types must have display names
      for (const documentType of GENERATABLE_DOCUMENT_TYPES) {
        const displayName = getDocumentDisplayName(documentType);

        expect(typeof displayName).toBe("string");
        expect(displayName.length).toBeGreaterThan(0);
        // Display name should be human-readable (contain spaces or be a proper name)
        expect(displayName).not.toBe(documentType.value);
      }
    });

    it("Feature: idea-panel-document-generation, Property 2: Context display on generator pages - display names are unique", () => {
      // **Validates: Requirements 1.3, 3.3, 5.3, 7.3**

      const displayNames = GENERATABLE_DOCUMENT_TYPES.map((type) =>
        getDocumentDisplayName(type)
      );

      // Property: All display names must be unique
      const uniqueNames = new Set(displayNames);
      expect(uniqueNames.size).toBe(GENERATABLE_DOCUMENT_TYPES.length);
    });

    it("Feature: idea-panel-document-generation, Property 2: Context display on generator pages - expected display names", () => {
      // **Validates: Requirements 1.3, 3.3, 5.3, 7.3**

      // Property: Each document type has its expected display name
      expect(getDocumentDisplayName(DocumentType.PRD)).toBe(
        "Product Requirements Document"
      );
      expect(getDocumentDisplayName(DocumentType.TECHNICAL_DESIGN)).toBe(
        "Technical Design Document"
      );
      expect(getDocumentDisplayName(DocumentType.ARCHITECTURE)).toBe(
        "Architecture Document"
      );
      expect(getDocumentDisplayName(DocumentType.ROADMAP)).toBe(
        "Project Roadmap"
      );
    });
  });

  describe("Property 3: Credit cost display", () => {
    it("Feature: idea-panel-document-generation, Property 3: Credit cost display - cost is positive", () => {
      // **Validates: Requirements 1.4, 3.4, 5.4, 7.4**
      // For any document type, the credit cost should be a positive number

      for (let i = 0; i < 100; i++) {
        const documentType = generateGeneratableDocumentType();

        const creditCost = getDocumentCreditCost(documentType);

        // Property: Credit cost must be a positive number
        expect(typeof creditCost).toBe("number");
        expect(creditCost).toBeGreaterThan(0);
        expect(Number.isInteger(creditCost)).toBe(true);
      }
    });

    it("Feature: idea-panel-document-generation, Property 3: Credit cost display - all types have costs", () => {
      // **Validates: Requirements 1.4, 3.4, 5.4, 7.4**

      // Property: All generatable document types must have credit costs
      for (const documentType of GENERATABLE_DOCUMENT_TYPES) {
        const creditCost = getDocumentCreditCost(documentType);

        expect(typeof creditCost).toBe("number");
        expect(creditCost).toBeGreaterThan(0);
      }
    });

    it("Feature: idea-panel-document-generation, Property 3: Credit cost display - costs match config", () => {
      // **Validates: Requirements 1.4, 3.4, 5.4, 7.4**

      // Property: Credit costs must match the configuration
      for (const documentType of GENERATABLE_DOCUMENT_TYPES) {
        const creditCost = getDocumentCreditCost(documentType);
        const configCost =
          DOCUMENT_TYPE_CONFIGS[documentType.value]?.creditCost;

        expect(creditCost).toBe(configCost);
      }
    });

    it("Feature: idea-panel-document-generation, Property 3: Credit cost display - expected costs", () => {
      // **Validates: Requirements 1.4, 3.4, 5.4, 7.4**

      // Property: Each document type has its expected credit cost
      expect(getDocumentCreditCost(DocumentType.PRD)).toBe(50);
      expect(getDocumentCreditCost(DocumentType.TECHNICAL_DESIGN)).toBe(75);
      expect(getDocumentCreditCost(DocumentType.ARCHITECTURE)).toBe(75);
      expect(getDocumentCreditCost(DocumentType.ROADMAP)).toBe(50);
    });

    it("Feature: idea-panel-document-generation, Property 3: Credit cost display - cost consistency", () => {
      // **Validates: Requirements 1.4, 3.4, 5.4, 7.4**

      // Property: Credit cost should be consistent across multiple calls
      for (let i = 0; i < 100; i++) {
        const documentType = generateGeneratableDocumentType();

        const cost1 = getDocumentCreditCost(documentType);
        const cost2 = getDocumentCreditCost(documentType);

        expect(cost1).toBe(cost2);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle analysis document types gracefully", () => {
      // Analysis types should return fallback route (not generator route)
      const ideaId = generateIdeaId();

      const startupRoute = getGeneratorRoute(
        DocumentType.STARTUP_ANALYSIS,
        ideaId
      );
      const hackathonRoute = getGeneratorRoute(
        DocumentType.HACKATHON_ANALYSIS,
        ideaId
      );

      // Should return idea panel route as fallback
      expect(startupRoute).toBe(`/idea/${ideaId}`);
      expect(hackathonRoute).toBe(`/idea/${ideaId}`);
    });

    it("should handle analysis document type credit costs", () => {
      // Analysis types should have 0 credit cost (they use existing analyzer)
      expect(getDocumentCreditCost(DocumentType.STARTUP_ANALYSIS)).toBe(0);
      expect(getDocumentCreditCost(DocumentType.HACKATHON_ANALYSIS)).toBe(0);
    });

    it("should handle special characters in idea ID", () => {
      // UUIDs should be safe, but test with various formats
      const validUUIDs = [
        "123e4567-e89b-12d3-a456-426614174000",
        "00000000-0000-0000-0000-000000000000",
        "ffffffff-ffff-ffff-ffff-ffffffffffff",
      ];

      for (const ideaId of validUUIDs) {
        const route = getGeneratorRoute(DocumentType.PRD, ideaId);
        expect(route).toBe(`/generate/prd/${ideaId}`);
      }
    });
  });
});
