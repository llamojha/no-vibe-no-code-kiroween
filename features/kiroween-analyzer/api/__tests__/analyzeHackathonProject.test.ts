import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectSubmission } from "@/lib/types";
import { analyzeHackathonProject } from "../analyzeHackathonProject";

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

describe("analyzeHackathonProject API", () => {
  const mockSubmission: ProjectSubmission = {
    description: "A unique hackathon project that solves real problems",
    supportingMaterials: {
      screenshots: ["screenshot1.png"],
      demoLink: "https://demo.example.com",
    },
  };

  const mockAnalysis = {
    finalScore: 4.2,
    viabilitySummary: "Strong project with good potential",
    detailedSummary: "Detailed analysis of the project",
    categoryAnalysis: {
      evaluations: [
        {
          category: "resurrection",
          fitScore: 8.5,
          explanation: "Good fit for resurrection category",
          improvementSuggestions: ["Improve legacy tech integration"],
        },
      ],
      bestMatch: "resurrection",
      bestMatchReason: "Strong alignment with category criteria",
    },
    criteriaAnalysis: {
      scores: [
        {
          name: "Potential Value",
          score: 4.0,
          justification: "Good market potential",
        },
      ],
      finalScore: 4.2,
      finalScoreExplanation: "Average of all criteria scores",
    },
    hackathonSpecificAdvice: {
      categoryOptimization: ["Focus on legacy tech"],
      kiroIntegrationTips: ["Use more Kiro features"],
      competitionStrategy: ["Highlight uniqueness"],
    },
    competitors: [],
    nextSteps: [],
    improvementSuggestions: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully analyze a hackathon project", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalysis,
    });

    const result = await analyzeHackathonProject(mockSubmission, "en");

    expect(fetch).toHaveBeenCalledWith("/api/v2/hackathon/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        submission: mockSubmission,
        locale: "en",
      }),
    });

    expect(result).toEqual(mockAnalysis);
  });

  it("should handle API errors gracefully", async () => {
    const errorMessage = "Analysis failed";
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    });

    await expect(analyzeHackathonProject(mockSubmission, "en")).rejects.toThrow(
      errorMessage
    );
  });

  it("should handle network errors", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    await expect(analyzeHackathonProject(mockSubmission, "en")).rejects.toThrow(
      "Network error"
    );
  });

  it("should handle malformed error responses", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    await expect(analyzeHackathonProject(mockSubmission, "en")).rejects.toThrow(
      "Failed to analyze hackathon project"
    );
  });

  it("should send correct request format", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalysis,
    });

    await analyzeHackathonProject(mockSubmission, "es");

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toBe("/api/v2/hackathon/analyze");
    expect(callArgs[1].method).toBe("POST");
    expect(callArgs[1].headers["Content-Type"]).toBe("application/json");

    const requestBody = JSON.parse(callArgs[1].body);
    expect(requestBody.submission).toEqual(mockSubmission);
    expect(requestBody.locale).toBe("es");
  });
});
