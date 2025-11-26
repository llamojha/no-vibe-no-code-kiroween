import { describe, it, expect } from "vitest";
import { DocumentType } from "@/src/domain/value-objects/DocumentType";
import {
  getRecommendedNextDocument,
  calculateProgress,
  hasDocumentType,
  getDocumentOrder,
  getDocumentTypesInOrder,
} from "../progress";

describe("Document Progress Utilities", () => {
  describe("getRecommendedNextDocument", () => {
    it("should return null when no analysis exists", () => {
      const documents = [];
      const result = getRecommendedNextDocument(documents);
      expect(result).toBeNull();
    });

    it("should recommend PRD after analysis", () => {
      const documents = [{ documentType: "startup_analysis" }];
      const result = getRecommendedNextDocument(documents);
      expect(result).toEqual(DocumentType.PRD);
    });

    it("should recommend Technical Design after PRD", () => {
      const documents = [
        { documentType: "startup_analysis" },
        { documentType: "prd" },
      ];
      const result = getRecommendedNextDocument(documents);
      expect(result).toEqual(DocumentType.TECHNICAL_DESIGN);
    });

    it("should recommend Architecture after Technical Design", () => {
      const documents = [
        { documentType: "startup_analysis" },
        { documentType: "prd" },
        { documentType: "technical_design" },
      ];
      const result = getRecommendedNextDocument(documents);
      expect(result).toEqual(DocumentType.ARCHITECTURE);
    });

    it("should recommend Roadmap after Architecture", () => {
      const documents = [
        { documentType: "startup_analysis" },
        { documentType: "prd" },
        { documentType: "technical_design" },
        { documentType: "architecture" },
      ];
      const result = getRecommendedNextDocument(documents);
      expect(result).toEqual(DocumentType.ROADMAP);
    });

    it("should return null when all documents are generated", () => {
      const documents = [
        { documentType: "startup_analysis" },
        { documentType: "prd" },
        { documentType: "technical_design" },
        { documentType: "architecture" },
        { documentType: "roadmap" },
      ];
      const result = getRecommendedNextDocument(documents);
      expect(result).toBeNull();
    });

    it("should work with hackathon analysis", () => {
      const documents = [{ documentType: "hackathon_analysis" }];
      const result = getRecommendedNextDocument(documents);
      expect(result).toEqual(DocumentType.PRD);
    });
  });

  describe("calculateProgress", () => {
    it("should return 0 for no documents", () => {
      const documents = [];
      const result = calculateProgress(documents);
      expect(result).toBe(0);
    });

    it("should return 20 for analysis only", () => {
      const documents = [{ documentType: "startup_analysis" }];
      const result = calculateProgress(documents);
      expect(result).toBe(20);
    });

    it("should return 40 for analysis and PRD", () => {
      const documents = [
        { documentType: "startup_analysis" },
        { documentType: "prd" },
      ];
      const result = calculateProgress(documents);
      expect(result).toBe(40);
    });

    it("should return 60 for analysis, PRD, and Technical Design", () => {
      const documents = [
        { documentType: "startup_analysis" },
        { documentType: "prd" },
        { documentType: "technical_design" },
      ];
      const result = calculateProgress(documents);
      expect(result).toBe(60);
    });

    it("should return 80 for analysis, PRD, Technical Design, and Architecture", () => {
      const documents = [
        { documentType: "startup_analysis" },
        { documentType: "prd" },
        { documentType: "technical_design" },
        { documentType: "architecture" },
      ];
      const result = calculateProgress(documents);
      expect(result).toBe(80);
    });

    it("should return 100 for all documents", () => {
      const documents = [
        { documentType: "startup_analysis" },
        { documentType: "prd" },
        { documentType: "technical_design" },
        { documentType: "architecture" },
        { documentType: "roadmap" },
      ];
      const result = calculateProgress(documents);
      expect(result).toBe(100);
    });
  });

  describe("hasDocumentType", () => {
    const documents = [
      { documentType: "startup_analysis" },
      { documentType: "prd" },
    ];

    it("should return true for existing document type", () => {
      const result = hasDocumentType(documents, DocumentType.PRD);
      expect(result).toBe(true);
    });

    it("should return false for non-existing document type", () => {
      const result = hasDocumentType(documents, DocumentType.ROADMAP);
      expect(result).toBe(false);
    });
  });

  describe("getDocumentOrder", () => {
    it("should return correct order for each document type", () => {
      expect(getDocumentOrder(DocumentType.STARTUP_ANALYSIS)).toBe(0);
      expect(getDocumentOrder(DocumentType.PRD)).toBe(1);
      expect(getDocumentOrder(DocumentType.TECHNICAL_DESIGN)).toBe(2);
      expect(getDocumentOrder(DocumentType.ARCHITECTURE)).toBe(3);
      expect(getDocumentOrder(DocumentType.ROADMAP)).toBe(4);
    });
  });

  describe("getDocumentTypesInOrder", () => {
    it("should return document types in workflow order", () => {
      const result = getDocumentTypesInOrder();
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual(DocumentType.STARTUP_ANALYSIS);
      expect(result[1]).toEqual(DocumentType.PRD);
      expect(result[2]).toEqual(DocumentType.TECHNICAL_DESIGN);
      expect(result[3]).toEqual(DocumentType.ARCHITECTURE);
      expect(result[4]).toEqual(DocumentType.ROADMAP);
    });
  });
});
