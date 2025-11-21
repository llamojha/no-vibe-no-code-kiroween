import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HackathonAnalysis } from "@/lib/types";
import { saveHackathonAnalysis } from "../saveHackathonAnalysis";

vi.mock("@/lib/featureFlags", () => ({
  isEnabled: () => false,
}));

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

const mockQuery = {
  insert: vi.fn(),
  select: vi.fn(),
  returns: vi.fn(),
  single: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  browserSupabase: () => mockSupabase,
}));

vi.mock("@/lib/supabase/mappers", () => ({
  mapSavedHackathonAnalysesRow: vi.fn((row) => ({
    id: row.id,
    userId: row.user_id,
    projectDescription: row.idea,
    analysis: row.analysis,
    createdAt: row.created_at ?? "2023-01-01T00:00:00Z",
    audioBase64: row.audio_base64,
    supportingMaterials: undefined,
  })),
}));

describe("saveHackathonAnalysis", () => {
  const mockAnalysis: HackathonAnalysis = {
    finalScore: 4.2,
    finalScoreExplanation: "Overall strong submission",
    viabilitySummary: "Strong project",
    detailedSummary: "Detailed analysis",
    scoringRubric: [
      {
        name: "Potential Value",
        score: 4.5,
        justification: "High market potential",
      },
    ],
    categoryAnalysis: {
      evaluations: [],
      bestMatch: "resurrection",
      bestMatchReason: "Good fit",
    },
    criteriaAnalysis: {
      scores: [],
      finalScore: 4.2,
      finalScoreExplanation: "Average score",
    },
    hackathonSpecificAdvice: {
      categoryOptimization: [],
      kiroIntegrationTips: [],
      competitionStrategy: [],
    },
    competitors: [],
    nextSteps: [],
    improvementSuggestions: [],
  };

  const mockParams = {
    projectDescription: "Test project description",
    analysis: mockAnalysis,
    supportingMaterials: {
      screenshots: ["screenshot1.png"],
      demoLink: "https://demo.example.com",
    },
    audioBase64: "base64audiodata",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock chain
    mockSupabase.from.mockReturnValue(mockQuery);
    mockQuery.insert.mockReturnValue(mockQuery);
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.returns.mockReturnValue(mockQuery);
  });

  it("should save hackathon analysis successfully", async () => {
    const mockSession = {
      user: { id: "user-123" },
    };
    const mockSavedRow = {
      id: "analysis-123",
      user_id: "user-123",
      analysis_type: "hackathon",
      idea: mockParams.projectDescription,
      analysis: mockParams.analysis,
      audio_base64: mockParams.audioBase64,
      created_at: "2023-01-01T00:00:00Z",
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    });
    mockQuery.single.mockResolvedValue({
      data: mockSavedRow,
      error: null,
    });

    const result = await saveHackathonAnalysis(mockParams);

    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
    expect(result.data!.id).toBe("analysis-123");
    expect(result.data!.userId).toBe("user-123");
  });

  it("should return error when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await saveHackathonAnalysis(mockParams);

    expect(result.error).toBe("Authentication required");
    expect(result.data).toBeNull();
  });

  it("should handle database errors", async () => {
    const mockSession = {
      user: { id: "user-123" },
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    });
    mockQuery.single.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const result = await saveHackathonAnalysis(mockParams);

    expect(result.error).toBe("Failed to save your analysis. Please try again.");
    expect(result.data).toBeNull();
  });

  it("should call database with correct parameters", async () => {
    const mockSession = {
      user: { id: "user-123" },
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    });
    mockQuery.single.mockResolvedValue({
      data: { id: "test-id" },
      error: null,
    });

    await saveHackathonAnalysis(mockParams);

    expect(mockSupabase.from).toHaveBeenCalledWith("saved_analyses");
    expect(mockQuery.insert).toHaveBeenCalledWith({
      user_id: "user-123",
      analysis_type: "hackathon",
      idea: mockParams.projectDescription,
      analysis: mockParams.analysis,
      audio_base64: mockParams.audioBase64,
    });
  });
});
