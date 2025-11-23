import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { saveAnalysis } from "../saveAnalysis";
import type { Analysis } from "@/lib/types";
import * as featureFlags from "@/lib/featureFlags";
import * as localStorage from "@/lib/localStorage";

// Mock dependencies
vi.mock("@/lib/featureFlags");
vi.mock("@/lib/localStorage");
vi.mock("@/lib/mockData", () => ({
  generateMockUser: () => ({ id: "mock-user-id", email: "test@example.com" }),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("saveAnalysis", () => {
  const mockAnalysis: Analysis = {
    detailedSummary: "Test analysis summary",
    founderQuestions: [],
    swotAnalysis: {
      strengths: ["Strong team"],
      weaknesses: ["Limited funding"],
      opportunities: ["Growing market"],
      threats: ["Competition"],
    },
    currentMarketTrends: [],
    scoringRubric: [],
    competitors: [],
    monetizationStrategies: [],
    improvementSuggestions: [],
    nextSteps: [],
    finalScore: 85,
    finalScoreExplanation: "Good potential",
    viabilitySummary: "Viable startup idea",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Local Dev Mode", () => {
    beforeEach(() => {
      vi.mocked(featureFlags.isEnabled).mockReturnValue(true);
      vi.mocked(
        localStorage.localStorageService.saveAnalysis
      ).mockResolvedValue(undefined);
    });

    it("should save analysis without ideaId (creates new idea)", async () => {
      const result = await saveAnalysis({
        idea: "Test startup idea",
        analysis: mockAnalysis,
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.ideaId).toBeDefined();
      expect(result.data?.documentId).toBeDefined();
      expect(result.data?.createdAt).toBeDefined();
      expect(localStorage.localStorageService.saveAnalysis).toHaveBeenCalled();
    });

    it("should save analysis with ideaId (links to existing idea)", async () => {
      const existingIdeaId = "existing-idea-123";

      const result = await saveAnalysis({
        idea: "Test startup idea",
        analysis: mockAnalysis,
        ideaId: existingIdeaId,
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.ideaId).toBe(existingIdeaId);
      expect(result.data?.documentId).toBeDefined();
      expect(result.data?.createdAt).toBeDefined();
      expect(localStorage.localStorageService.saveAnalysis).toHaveBeenCalled();
    });

    it("should handle errors in local dev mode", async () => {
      vi.mocked(
        localStorage.localStorageService.saveAnalysis
      ).mockRejectedValue(new Error("Storage error"));

      const result = await saveAnalysis({
        idea: "Test startup idea",
        analysis: mockAnalysis,
      });

      expect(result.error).toBe(
        "Failed to save your analysis to local storage. Please try again."
      );
      expect(result.data).toBeNull();
    });
  });

  describe("Production Mode", () => {
    beforeEach(() => {
      vi.mocked(featureFlags.isEnabled).mockReturnValue(false);
    });

    it("should save analysis without ideaId (creates new idea)", async () => {
      const mockResponse = {
        id: "analysis-123",
        ideaId: "idea-456",
        documentId: "doc-789",
        createdAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await saveAnalysis({
        idea: "Test startup idea",
        analysis: mockAnalysis,
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.ideaId).toBe("idea-456");
      expect(result.data?.documentId).toBe("doc-789");
      expect(result.data?.createdAt).toBe("2024-01-01T00:00:00Z");
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/analyze/save",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("should save analysis with ideaId (links to existing idea)", async () => {
      const existingIdeaId = "existing-idea-123";
      const mockResponse = {
        id: "analysis-123",
        ideaId: existingIdeaId,
        documentId: "doc-789",
        createdAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await saveAnalysis({
        idea: "Test startup idea",
        analysis: mockAnalysis,
        ideaId: existingIdeaId,
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.ideaId).toBe(existingIdeaId);
      expect(result.data?.documentId).toBe("doc-789");
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/analyze/save?ideaId=${encodeURIComponent(existingIdeaId)}`,
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: "API error occurred" }),
      });

      const result = await saveAnalysis({
        idea: "Test startup idea",
        analysis: mockAnalysis,
      });

      expect(result.error).toBe(
        "Failed to save your analysis. Please try again."
      );
      expect(result.data).toBeNull();
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await saveAnalysis({
        idea: "Test startup idea",
        analysis: mockAnalysis,
      });

      expect(result.error).toBe(
        "Failed to save your analysis. Please try again."
      );
      expect(result.data).toBeNull();
    });

    it("should fallback to result.id when ideaId/documentId not in response", async () => {
      const mockResponse = {
        id: "legacy-id-123",
        createdAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await saveAnalysis({
        idea: "Test startup idea",
        analysis: mockAnalysis,
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.ideaId).toBe("legacy-id-123");
      expect(result.data?.documentId).toBe("legacy-id-123");
    });
  });
});
