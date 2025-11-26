/**
 * Property-based tests for document generation
 *
 * Tests correctness properties for AI document generation:
 * - Property 15: Idea text in AI prompt (Requirements 17.1)
 * - Property 16: Contextual document generation (Requirements 17.3)
 */

import { describe, it, expect } from "vitest";
import { faker } from "@faker-js/faker";
import { DocumentType } from "@/src/domain/value-objects/DocumentType";
import { GoogleAIDocumentGeneratorAdapter } from "@/src/infrastructure/external/ai/GoogleAIDocumentGeneratorAdapter";
import { DocumentGenerationContext } from "@/src/application/services/IAIDocumentGeneratorService";
import {
  generatePRDPrompt,
  generateTechnicalDesignPrompt,
  generateArchitecturePrompt,
  generateRoadmapPrompt,
} from "@/lib/prompts/documentGeneration";

/**
 * Generate random document generation context
 */
function generateDocumentContext(
  overrides?: Partial<DocumentGenerationContext>
): DocumentGenerationContext {
  return {
    ideaText: faker.lorem.paragraphs(3),
    analysisScores: {
      marketOpportunity: faker.number.int({ min: 0, max: 100 }),
      technicalFeasibility: faker.number.int({ min: 0, max: 100 }),
      uniqueness: faker.number.int({ min: 0, max: 100 }),
    },
    analysisFeedback: faker.lorem.paragraph(),
    existingPRD: faker.datatype.boolean()
      ? faker.lorem.paragraphs(5)
      : undefined,
    existingTechnicalDesign: faker.datatype.boolean()
      ? faker.lorem.paragraphs(5)
      : undefined,
    existingArchitecture: faker.datatype.boolean()
      ? faker.lorem.paragraphs(5)
      : undefined,
    ...overrides,
  };
}

describe("Document Generation Properties", () => {
  describe("Property 15: Idea text in AI prompt", () => {
    it("Feature: idea-panel-document-generation, Property 15: Idea text in AI prompt - PRD", () => {
      // **Validates: Requirements 17.1**
      // For any idea text and document type, the AI prompt should include the original idea text

      // Run 100 iterations with random idea texts
      for (let i = 0; i < 100; i++) {
        const context = generateDocumentContext();
        const documentType = DocumentType.PRD;

        // Generate the prompt
        const prompt = generatePRDPrompt(context);

        // Property: The prompt must contain the idea text
        expect(prompt).toContain(context.ideaText);
      }
    });

    it("Feature: idea-panel-document-generation, Property 15: Idea text in AI prompt - Technical Design", () => {
      // **Validates: Requirements 17.1**

      for (let i = 0; i < 100; i++) {
        const context = generateDocumentContext();
        const documentType = DocumentType.TECHNICAL_DESIGN;

        const prompt = generateTechnicalDesignPrompt(context);

        // Property: The prompt must contain the idea text
        expect(prompt).toContain(context.ideaText);
      }
    });

    it("Feature: idea-panel-document-generation, Property 15: Idea text in AI prompt - Architecture", () => {
      // **Validates: Requirements 17.1**

      for (let i = 0; i < 100; i++) {
        const context = generateDocumentContext();
        const documentType = DocumentType.ARCHITECTURE;

        const prompt = generateArchitecturePrompt(context);

        // Property: The prompt must contain the idea text
        expect(prompt).toContain(context.ideaText);
      }
    });

    it("Feature: idea-panel-document-generation, Property 15: Idea text in AI prompt - Roadmap", () => {
      // **Validates: Requirements 17.1**

      for (let i = 0; i < 100; i++) {
        const context = generateDocumentContext();
        const documentType = DocumentType.ROADMAP;

        const prompt = generateRoadmapPrompt(context);

        // Property: The prompt must contain the idea text
        expect(prompt).toContain(context.ideaText);
      }
    });
  });

  describe("Property 16: Contextual document generation", () => {
    it("Feature: idea-panel-document-generation, Property 16: Contextual document generation - Technical Design includes PRD", () => {
      // **Validates: Requirements 17.3**
      // For any Technical Design generation, if a PRD exists, the AI prompt should include the PRD content

      for (let i = 0; i < 100; i++) {
        // Generate context with PRD
        const prdContent = faker.lorem.paragraphs(5);
        const context = generateDocumentContext({
          existingPRD: prdContent,
        });

        const prompt = generateTechnicalDesignPrompt(context);

        // Property: If PRD exists, the prompt must contain the PRD content
        expect(prompt).toContain(prdContent);
      }
    });

    it("Feature: idea-panel-document-generation, Property 16: Contextual document generation - Architecture includes Technical Design", () => {
      // **Validates: Requirements 17.5**
      // For any Architecture generation, if a Technical Design exists, the AI prompt should include it

      for (let i = 0; i < 100; i++) {
        // Generate context with Technical Design
        const techDesignContent = faker.lorem.paragraphs(5);
        const context = generateDocumentContext({
          existingTechnicalDesign: techDesignContent,
        });

        const prompt = generateArchitecturePrompt(context);

        // Property: If Technical Design exists, the prompt must contain it
        expect(prompt).toContain(techDesignContent);
      }
    });

    it("Feature: idea-panel-document-generation, Property 16: Contextual document generation - Roadmap includes PRD and Technical Design", () => {
      // **Validates: Requirements 17.4**
      // For any Roadmap generation, if PRD and Technical Design exist, the AI prompt should include both

      for (let i = 0; i < 100; i++) {
        // Generate context with both PRD and Technical Design
        const prdContent = faker.lorem.paragraphs(5);
        const techDesignContent = faker.lorem.paragraphs(5);
        const context = generateDocumentContext({
          existingPRD: prdContent,
          existingTechnicalDesign: techDesignContent,
        });

        const prompt = generateRoadmapPrompt(context);

        // Property: If PRD exists, the prompt must contain it
        if (context.existingPRD) {
          expect(prompt).toContain(prdContent);
        }

        // Property: If Technical Design exists, the prompt must contain it
        if (context.existingTechnicalDesign) {
          expect(prompt).toContain(techDesignContent);
        }
      }
    });

    it("Feature: idea-panel-document-generation, Property 16: Contextual document generation - PRD includes analysis when available", () => {
      // **Validates: Requirements 17.2**
      // For any PRD generation, if analysis scores and feedback exist, the AI prompt should include them

      for (let i = 0; i < 100; i++) {
        // Generate context with analysis data
        const analysisFeedback = faker.lorem.paragraph();
        const context = generateDocumentContext({
          analysisScores: {
            marketOpportunity: faker.number.int({ min: 0, max: 100 }),
            technicalFeasibility: faker.number.int({ min: 0, max: 100 }),
            uniqueness: faker.number.int({ min: 0, max: 100 }),
          },
          analysisFeedback,
        });

        const prompt = generatePRDPrompt(context);

        // Property: If analysis feedback exists, the prompt should reference it
        if (context.analysisFeedback) {
          expect(prompt).toContain(analysisFeedback);
        }
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty idea text gracefully", () => {
      const context = generateDocumentContext({
        ideaText: "",
      });

      // Should not throw, but prompt should still be generated
      expect(() => generatePRDPrompt(context)).not.toThrow();
      expect(() => generateTechnicalDesignPrompt(context)).not.toThrow();
      expect(() => generateArchitecturePrompt(context)).not.toThrow();
      expect(() => generateRoadmapPrompt(context)).not.toThrow();
    });

    it("should handle missing optional context fields", () => {
      const context: DocumentGenerationContext = {
        ideaText: faker.lorem.paragraphs(3),
        // All optional fields omitted
      };

      // Should not throw
      expect(() => generatePRDPrompt(context)).not.toThrow();
      expect(() => generateTechnicalDesignPrompt(context)).not.toThrow();
      expect(() => generateArchitecturePrompt(context)).not.toThrow();
      expect(() => generateRoadmapPrompt(context)).not.toThrow();
    });

    it("should handle very long idea text", () => {
      const context = generateDocumentContext({
        ideaText: faker.lorem.paragraphs(50), // Very long text
      });

      const prompt = generatePRDPrompt(context);

      // Should still contain the idea text
      expect(prompt).toContain(context.ideaText);
    });

    it("should handle special characters in idea text", () => {
      const specialChars = "Test idea with special chars: <>&\"'{}[]()";
      const context = generateDocumentContext({
        ideaText: specialChars,
      });

      const prompt = generatePRDPrompt(context);

      // Should preserve special characters
      expect(prompt).toContain(specialChars);
    });
  });
});
