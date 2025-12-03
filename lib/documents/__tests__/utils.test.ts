import { describe, it, expect } from "vitest";
import { DocumentType } from "@/src/domain/value-objects/DocumentType";
import {
  getDocumentDisplayName,
  getDocumentCreditCost,
  getDocumentIcon,
  getDocumentColor,
  getGeneratorRoute,
} from "../utils";

describe("Document Utilities", () => {
  describe("getDocumentDisplayName", () => {
    it("should return display name for PRD", () => {
      const result = getDocumentDisplayName(DocumentType.PRD);
      expect(result).toBe("Product Requirements Document");
    });

    it("should return display name for Technical Design", () => {
      const result = getDocumentDisplayName(DocumentType.TECHNICAL_DESIGN);
      expect(result).toBe("Technical Design Document");
    });

    it("should return display name for Architecture", () => {
      const result = getDocumentDisplayName(DocumentType.ARCHITECTURE);
      expect(result).toBe("Architecture Document");
    });

    it("should return display name for Roadmap", () => {
      const result = getDocumentDisplayName(DocumentType.ROADMAP);
      expect(result).toBe("Project Roadmap");
    });
  });

  describe("getDocumentCreditCost", () => {
    it("should return correct credit cost for PRD", () => {
      const result = getDocumentCreditCost(DocumentType.PRD);
      expect(result).toBe(1);
    });

    it("should return correct credit cost for Technical Design", () => {
      const result = getDocumentCreditCost(DocumentType.TECHNICAL_DESIGN);
      expect(result).toBe(1);
    });

    it("should return correct credit cost for Architecture", () => {
      const result = getDocumentCreditCost(DocumentType.ARCHITECTURE);
      expect(result).toBe(1);
    });

    it("should return correct credit cost for Roadmap", () => {
      const result = getDocumentCreditCost(DocumentType.ROADMAP);
      expect(result).toBe(1);
    });

    it("should return 0 for analysis documents", () => {
      expect(getDocumentCreditCost(DocumentType.STARTUP_ANALYSIS)).toBe(0);
      expect(getDocumentCreditCost(DocumentType.HACKATHON_ANALYSIS)).toBe(0);
    });
  });

  describe("getDocumentIcon", () => {
    it("should return icon for each document type", () => {
      expect(getDocumentIcon(DocumentType.PRD)).toBe("file-text");
      expect(getDocumentIcon(DocumentType.TECHNICAL_DESIGN)).toBe("code");
      expect(getDocumentIcon(DocumentType.ARCHITECTURE)).toBe("layers");
      expect(getDocumentIcon(DocumentType.ROADMAP)).toBe("map");
    });
  });

  describe("getDocumentColor", () => {
    it("should return color for each document type", () => {
      expect(getDocumentColor(DocumentType.PRD)).toBe("blue");
      expect(getDocumentColor(DocumentType.TECHNICAL_DESIGN)).toBe("purple");
      expect(getDocumentColor(DocumentType.ARCHITECTURE)).toBe("green");
      expect(getDocumentColor(DocumentType.ROADMAP)).toBe("orange");
    });
  });

  describe("getGeneratorRoute", () => {
    const ideaId = "test-idea-123";

    it("should return correct route for PRD", () => {
      const result = getGeneratorRoute(DocumentType.PRD, ideaId);
      expect(result).toBe(`/generate/prd/${ideaId}`);
    });

    it("should return correct route for Technical Design", () => {
      const result = getGeneratorRoute(DocumentType.TECHNICAL_DESIGN, ideaId);
      expect(result).toBe(`/generate/technical-design/${ideaId}`);
    });

    it("should return correct route for Architecture", () => {
      const result = getGeneratorRoute(DocumentType.ARCHITECTURE, ideaId);
      expect(result).toBe(`/generate/architecture/${ideaId}`);
    });

    it("should return correct route for Roadmap", () => {
      const result = getGeneratorRoute(DocumentType.ROADMAP, ideaId);
      expect(result).toBe(`/generate/roadmap/${ideaId}`);
    });

    it("should return idea panel route for analysis documents", () => {
      const result = getGeneratorRoute(DocumentType.STARTUP_ANALYSIS, ideaId);
      expect(result).toBe(`/idea/${ideaId}`);
    });
  });
});
