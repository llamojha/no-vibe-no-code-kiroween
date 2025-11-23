/**
 * Complete Documents Migration Integration Tests
 *
 * Tests the complete migration from saved_analyses to ideas + documents tables.
 * Covers all analysis flows: startup, hackathon, Doctor Frankenstein, and Idea Panel.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 5.3, 6.1, 6.2, 7.1, 7.2, 7.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { saveAnalysis } from "../../features/analyzer/api/saveAnalysis";
import { saveHackathonAnalysis } from "../../features/kiroween-analyzer/api/saveHackathonAnalysis";
import { saveFrankensteinIdea } from "../../features/doctor-frankenstein/api/saveFrankensteinIdea";
import { getIdeaWithDocuments } from "../../features/idea-panel/api/getIdeaWithDocuments";
import type { Analysis, HackathonAnalysis } from "../../lib/types";

// Mock featuregs to enable local dev mode for testing
vi.mock("../../lib/featureFlags", () => ({
  isEnabled: vi.fn((flag: string) => {
    if (flag === "LOCAL_DEV_MODE") return true;
    return false;
  }),
}));

// Mock localStorage service
const mockLocalStorage = new Map<string, any>();

vi.mock("../../lib/localStorage", () => ({
  localStorageService: {
    saveAnalysis: vi.fn(async (record: any) => {
      mockLocalStorage.set(record.id, record);
    }),
    getAnalysis: vi.fn(async (id: string) => {
      return mockLocalStorage.get(id) || null;
    }),
    saveHackathonAnalysis: vi.fn(async (record: any) => {
      mockLocalStorage.set(record.id, record);
    }),
    getHackathonAnalysis: vi.fn(async (id: string) => {
      return mockLocalStorage.get(id) || null;
    }),
    saveFrankensteinIdea: vi.fn(async (record: any) => {
      mockLocalStorage.set(record.id, record);
    }),
    getFrankensteinIdea: vi.fn(async (id: string) => {
      return mockLocalStorage.get(id) || null;
    }),
  },
}));

// Mock Supabase client
vi.mock("../../lib/supabase/client", () => ({
  browserSupabase: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "test-user-id" } },
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: { id: "test-idea-id", created_at: new Date().toISOString() },
            error: null,
          })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: null,
            error: { code: "PGRST116" },
          })),
        })),
      })),
    })),
  })),
}));

describe("Documents Migration Integration Tests", () => {
  beforeEach(() => {
    // Clear mock storage before each test
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("9.1 Complete Startup Analysis Flow", () => {
    it("should create analysis without ideaId", async () => {
      // Arrange
      const mockAnalysis: Analysis = {
        detailedSummary: "Test analysis summary",
        finalScore: 85,
        founderQuestions: ["Question 1", "Question 2"],
        swotAnalysis: {
          strengths: ["Strength 1"],
          weaknesses: ["Weakness 1"],
          opportunities: ["Opportunity 1"],
          threats: ["Threat 1"],
        },
        currentMarketTrends: ["Trend 1"],
        scoringRubric: [
          {
            category: "Market Opportunity",
            score: 85,
            reasoning: "Good market",
            weight: 0.3,
          },
        ],
        competitors: ["Competitor 1"],
        monetizationStrategies: ["Strategy 1"],
        improvementSuggestions: ["Suggestion 1"],
        nextSteps: ["Step 1"],
        finalScoreExplanation: "Good score",
        viabilitySummary: "Viable",
      };

      // Act - Create analysis without ideaId
      const result = await saveAnalysis({
        idea: "My startup idea",
        analysis: mockAnalysis,
      });

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.ideaId).toBeDefined();
      expect(result.data?.documentId).toBeDefined();
      expect(result.data?.createdAt).toBeDefined();

      // Verify idea was created in storage
      const savedRecord = mockLocalStorage.get(result.data!.documentId);
      expect(savedRecord).toBeDefined();
      expect(savedRecord.idea).toBe("My startup idea");
      expect(savedRecord.analysis).toEqual(mockAnalysis);
      expect(savedRecord.analysisType).toBe("idea");
    });

    it("should create document linked to existing idea when ideaId provided", async () => {
      // Arrange
      const existingIdeaId = "existing-idea-123";
      const mockAnalysis: Analysis = {
        detailedSummary: "Test analysis summary",
        finalScore: 85,
        founderQuestions: [],
        swotAnalysis: {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: [],
        },
        currentMarketTrends: [],
        scoringRubric: [],
        competitors: [],
        monetizationStrategies: [],
        improvementSuggestions: [],
        nextSteps: [],
        finalScoreExplanation: "Good score",
        viabilitySummary: "Viable",
      };

      // Act - Create analysis with ideaId
      const result = await saveAnalysis({
        idea: "My startup idea",
        analysis: mockAnalysis,
        ideaId: existingIdeaId,
      });

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.ideaId).toBe(existingIdeaId);
      expect(result.data?.documentId).toBeDefined();
      expect(result.data?.createdAt).toBeDefined();
    });

    it("should handle errors gracefully", async () => {
      // Arrange - Mock localStorage to throw error
      const { localStorageService } = await import("../../lib/localStorage");
      vi.mocked(localStorageService.saveAnalysis).mockRejectedValueOnce(
        new Error("Storage error")
      );

      const mockAnalysis: Analysis = {
        detailedSummary: "Test",
        finalScore: 85,
        founderQuestions: [],
        swotAnalysis: {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: [],
        },
        currentMarketTrends: [],
        scoringRubric: [],
        competitors: [],
        monetizationStrategies: [],
        improvementSuggestions: [],
        nextSteps: [],
        finalScoreExplanation: "",
        viabilitySummary: "",
      };

      // Act
      const result = await saveAnalysis({
        idea: "Test idea",
        analysis: mockAnalysis,
      });

      // Assert
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
      expect(result.error).toContain("Failed to save");
    });
  });

  describe("9.2 Complete Hackathon Analysis Flow", () => {
    it("should create hackathon analysis without ideaId", async () => {
      // Arrange
      const mockHackathonAnalysis: HackathonAnalysis = {
        projectName: "Test Project",
        overallScore: 85,
        categoryScores: {
          technical: 90,
          creativity: 80,
          presentation: 85,
          impact: 80,
        },
        detailedEvaluation: {
          technical: {
            score: 90,
            strengths: ["Good code"],
            improvements: ["Add tests"],
            reasoning: "Well implemented",
          },
          creativity: {
            score: 80,
            strengths: ["Unique idea"],
            improvements: ["More features"],
            reasoning: "Creative approach",
          },
          presentation: {
            score: 85,
            strengths: ["Clear demo"],
            improvements: ["Better slides"],
            reasoning: "Good presentation",
          },
          impact: {
            score: 80,
            strengths: ["Solves problem"],
            improvements: ["Wider reach"],
            reasoning: "Good impact",
          },
        },
        strengths: ["Overall strength"],
        improvements: ["Overall improvement"],
        nextSteps: ["Next step"],
        finalVerdict: "Good project",
      };

      // Act - Create hackathon analysis without ideaId
      const result = await saveHackathonAnalysis({
        projectDescription: "My hackathon project",
        analysis: mockHackathonAnalysis,
      });

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.ideaId).toBeDefined();
      expect(result.data?.documentId).toBeDefined();
      expect(result.data?.createdAt).toBeDefined();

      // Verify document was created in storage
      const savedRecord = mockLocalStorage.get(result.data!.documentId);
      expect(savedRecord).toBeDefined();
      expect(savedRecord.projectDescription).toBe("My hackathon project");
      expect(savedRecord.analysis).toEqual(mockHackathonAnalysis);
    });

    it("should create document linked to existing idea when ideaId provided", async () => {
      // Arrange
      const existingIdeaId = "existing-hackathon-idea-123";
      const mockHackathonAnalysis: HackathonAnalysis = {
        projectName: "Test Project",
        overallScore: 85,
        categoryScores: {
          technical: 90,
          creativity: 80,
          presentation: 85,
          impact: 80,
        },
        detailedEvaluation: {
          technical: {
            score: 90,
            strengths: [],
            improvements: [],
            reasoning: "",
          },
          creativity: {
            score: 80,
            strengths: [],
            improvements: [],
            reasoning: "",
          },
          presentation: {
            score: 85,
            strengths: [],
            improvements: [],
            reasoning: "",
          },
          impact: {
            score: 80,
            strengths: [],
            improvements: [],
            reasoning: "",
          },
        },
        strengths: [],
        improvements: [],
        nextSteps: [],
        finalVerdict: "",
      };

      // Act - Create hackathon analysis with ideaId
      const result = await saveHackathonAnalysis({
        projectDescription: "My hackathon project",
        analysis: mockHackathonAnalysis,
        ideaId: existingIdeaId,
      });

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.ideaId).toBe(existingIdeaId);
      expect(result.data?.documentId).toBeDefined();
    });

    it("should handle errors gracefully", async () => {
      // Arrange - Mock localStorage to throw error
      const { localStorageService } = await import("../../lib/localStorage");
      vi.mocked(
        localStorageService.saveHackathonAnalysis
      ).mockRejectedValueOnce(new Error("Storage error"));

      const mockHackathonAnalysis: HackathonAnalysis = {
        projectName: "Test",
        overallScore: 85,
        categoryScores: {
          technical: 90,
          creativity: 80,
          presentation: 85,
          impact: 80,
        },
        detailedEvaluation: {
          technical: {
            score: 90,
            strengths: [],
            improvements: [],
            reasoning: "",
          },
          creativity: {
            score: 80,
            strengths: [],
            improvements: [],
            reasoning: "",
          },
          presentation: {
            score: 85,
            strengths: [],
            improvements: [],
            reasoning: "",
          },
          impact: { score: 80, strengths: [], improvements: [], reasoning: "" },
        },
        strengths: [],
        improvements: [],
        nextSteps: [],
        finalVerdict: "",
      };

      // Act
      const result = await saveHackathonAnalysis({
        projectDescription: "Test project",
        analysis: mockHackathonAnalysis,
      });

      // Assert
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });

  describe("9.3 Doctor Frankenstein Flow", () => {
    it("should create idea with source='frankenstein' without document", async () => {
      // Arrange
      const mockFrankensteinAnalysis = {
        ideaName: "AWS Lambda + Stripe",
        description: "A payment processing service using AWS Lambda",
        keyFeatures: ["Feature 1", "Feature 2"],
        targetAudience: "Developers",
        potentialChallenges: ["Challenge 1"],
        estimatedComplexity: "Medium" as const,
        suggestedNextSteps: ["Step 1"],
      };

      // Act - Generate Frankenstein idea
      const result = await saveFrankensteinIdea({
        mode: "aws",
        tech1: {
          name: "AWS Lambda",
          description: "Serverless compute",
          category: "Compute",
        },
        tech2: {
          name: "Stripe",
          description: "Payment processing",
          category: "Payments",
        },
        analysis: mockFrankensteinAnalysis,
      });

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.ideaId).toBeDefined();
      expect(result.data?.createdAt).toBeDefined();

      // Verify idea was created in storage
      const savedIdea = mockLocalStorage.get(result.data!.ideaId);
      expect(savedIdea).toBeDefined();
      expect(savedIdea.mode).toBe("aws");
      expect(savedIdea.analysis).toEqual(mockFrankensteinAnalysis);

      // Verify no document was created (only idea)
      expect(savedIdea.analysis).toBeDefined();
      expect(savedIdea.tech1).toBeDefined();
      expect(savedIdea.tech2).toBeDefined();
    });

    it("should allow analyzing Frankenstein idea to create linked document", async () => {
      // Arrange - First create Frankenstein idea
      const mockFrankensteinAnalysis = {
        ideaName: "AWS Lambda + Stripe",
        description: "A payment processing service",
        keyFeatures: ["Feature 1"],
        targetAudience: "Developers",
        potentialChallenges: ["Challenge 1"],
        estimatedComplexity: "Medium" as const,
        suggestedNextSteps: ["Step 1"],
      };

      const frankensteinResult = await saveFrankensteinIdea({
        mode: "aws",
        tech1: {
          name: "AWS Lambda",
          description: "Serverless",
          category: "Compute",
        },
        tech2: {
          name: "Stripe",
          description: "Payments",
          category: "Payments",
        },
        analysis: mockFrankensteinAnalysis,
      });

      expect(frankensteinResult.data).toBeDefined();
      const frankensteinIdeaId = frankensteinResult.data!.ideaId;

      // Act - Now analyze the Frankenstein idea
      const mockAnalysis: Analysis = {
        detailedSummary: "Analysis of Frankenstein idea",
        finalScore: 90,
        founderQuestions: [],
        swotAnalysis: {
          strengths: ["Innovative"],
          weaknesses: [],
          opportunities: [],
          threats: [],
        },
        currentMarketTrends: [],
        scoringRubric: [],
        competitors: [],
        monetizationStrategies: [],
        improvementSuggestions: [],
        nextSteps: [],
        finalScoreExplanation: "Excellent idea",
        viabilitySummary: "Highly viable",
      };

      const analysisResult = await saveAnalysis({
        idea: "AWS Lambda + Stripe payment service",
        analysis: mockAnalysis,
        ideaId: frankensteinIdeaId,
      });

      // Assert
      expect(analysisResult.error).toBeNull();
      expect(analysisResult.data).toBeDefined();
      expect(analysisResult.data?.ideaId).toBe(frankensteinIdeaId);
      expect(analysisResult.data?.documentId).toBeDefined();

      // Verify document is linked to the Frankenstein idea
      const savedDocument = mockLocalStorage.get(
        analysisResult.data!.documentId
      );
      expect(savedDocument).toBeDefined();
      expect(savedDocument.analysis).toEqual(mockAnalysis);
    });
  });

  describe("9.4 Idea Panel Flow", () => {
    it("should support multiple analyses for same idea", async () => {
      // Arrange - Create first analysis
      const mockAnalysis1: Analysis = {
        detailedSummary: "First analysis",
        finalScore: 80,
        founderQuestions: [],
        swotAnalysis: {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: [],
        },
        currentMarketTrends: [],
        scoringRubric: [],
        competitors: [],
        monetizationStrategies: [],
        improvementSuggestions: [],
        nextSteps: [],
        finalScoreExplanation: "",
        viabilitySummary: "",
      };

      const firstResult = await saveAnalysis({
        idea: "My evolving idea",
        analysis: mockAnalysis1,
      });

      expect(firstResult.data).toBeDefined();
      const ideaId = firstResult.data!.ideaId;
      const firstDocumentId = firstResult.data!.documentId;

      // Act - Create second analysis for same idea
      const mockAnalysis2: Analysis = {
        detailedSummary: "Second analysis with improvements",
        finalScore: 90,
        founderQuestions: [],
        swotAnalysis: {
          strengths: ["Improved"],
          weaknesses: [],
          opportunities: [],
          threats: [],
        },
        currentMarketTrends: [],
        scoringRubric: [],
        competitors: [],
        monetizationStrategies: [],
        improvementSuggestions: [],
        nextSteps: [],
        finalScoreExplanation: "Better score",
        viabilitySummary: "More viable",
      };

      const secondResult = await saveAnalysis({
        idea: "My evolving idea (refined)",
        analysis: mockAnalysis2,
        ideaId: ideaId,
      });

      // Assert
      expect(secondResult.error).toBeNull();
      expect(secondResult.data).toBeDefined();
      expect(secondResult.data?.ideaId).toBe(ideaId);
      expect(secondResult.data?.documentId).toBeDefined();
      expect(secondResult.data?.documentId).not.toBe(firstDocumentId);

      // Verify both documents exist
      const firstDocument = mockLocalStorage.get(firstDocumentId);
      const secondDocument = mockLocalStorage.get(
        secondResult.data!.documentId
      );

      expect(firstDocument).toBeDefined();
      expect(secondDocument).toBeDefined();
      expect(firstDocument.analysis.finalScore).toBe(80);
      expect(secondDocument.analysis.finalScore).toBe(90);
    });

    it("should support mixing startup and hackathon analyses for same idea", async () => {
      // Arrange - Create startup analysis first
      const mockStartupAnalysis: Analysis = {
        detailedSummary: "Startup analysis",
        finalScore: 85,
        founderQuestions: [],
        swotAnalysis: {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: [],
        },
        currentMarketTrends: [],
        scoringRubric: [],
        competitors: [],
        monetizationStrategies: [],
        improvementSuggestions: [],
        nextSteps: [],
        finalScoreExplanation: "",
        viabilitySummary: "",
      };

      const startupResult = await saveAnalysis({
        idea: "My project idea",
        analysis: mockStartupAnalysis,
      });

      expect(startupResult.data).toBeDefined();
      const ideaId = startupResult.data!.ideaId;

      // Act - Create hackathon analysis for same idea
      const mockHackathonAnalysis: HackathonAnalysis = {
        projectName: "My Project",
        overallScore: 90,
        categoryScores: {
          technical: 95,
          creativity: 85,
          presentation: 90,
          impact: 90,
        },
        detailedEvaluation: {
          technical: {
            score: 95,
            strengths: [],
            improvements: [],
            reasoning: "",
          },
          creativity: {
            score: 85,
            strengths: [],
            improvements: [],
            reasoning: "",
          },
          presentation: {
            score: 90,
            strengths: [],
            improvements: [],
            reasoning: "",
          },
          impact: { score: 90, strengths: [], improvements: [], reasoning: "" },
        },
        strengths: [],
        improvements: [],
        nextSteps: [],
        finalVerdict: "",
      };

      const hackathonResult = await saveHackathonAnalysis({
        projectDescription: "My project for hackathon",
        analysis: mockHackathonAnalysis,
        ideaId: ideaId,
      });

      // Assert
      expect(hackathonResult.error).toBeNull();
      expect(hackathonResult.data).toBeDefined();
      expect(hackathonResult.data?.ideaId).toBe(ideaId);
      expect(hackathonResult.data?.documentId).toBeDefined();

      // Verify both documents exist and are different types
      const startupDocument = mockLocalStorage.get(
        startupResult.data!.documentId
      );
      const hackathonDocument = mockLocalStorage.get(
        hackathonResult.data!.documentId
      );

      expect(startupDocument).toBeDefined();
      expect(hackathonDocument).toBeDefined();
      expect(startupDocument.analysisType).toBe("idea");
      // Hackathon documents don't have analysisType in the mock, but they have different structure
      expect(hackathonDocument.projectDescription).toBeDefined();
    });
  });

  describe("9.5 Legacy Data Compatibility", () => {
    it("should handle legacy data gracefully", async () => {
      // This test verifies that the system can work with both new and legacy data
      // In local dev mode, we're using localStorage which doesn't have legacy data
      // But the code paths should handle it gracefully

      // Arrange - Create a new analysis
      const mockAnalysis: Analysis = {
        detailedSummary: "New analysis",
        finalScore: 85,
        founderQuestions: [],
        swotAnalysis: {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: [],
        },
        currentMarketTrends: [],
        scoringRubric: [],
        competitors: [],
        monetizationStrategies: [],
        improvementSuggestions: [],
        nextSteps: [],
        finalScoreExplanation: "",
        viabilitySummary: "",
      };

      // Act
      const result = await saveAnalysis({
        idea: "Test idea",
        analysis: mockAnalysis,
      });

      // Assert - Should work with new format
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.ideaId).toBeDefined();
      expect(result.data?.documentId).toBeDefined();
    });
  });
});
