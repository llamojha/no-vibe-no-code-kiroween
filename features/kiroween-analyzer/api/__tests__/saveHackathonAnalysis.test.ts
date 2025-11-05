import { saveHackathonAnalysis } from "../saveHackathonAnalysis";
import type { HackathonAnalysis } from "@/lib/types";

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(),
};

const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockReturns = jest.fn();
const mockSingle = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  browserSupabase: () => mockSupabase,
}));

jest.mock("@/lib/supabase/mappers", () => ({
  mapSavedHackathonAnalysesRow: jest.fn((row) => ({
    id: row.id,
    userId: row.user_id,
    projectDescription: row.project_description,
    selectedCategory: row.selected_category,
    kiroUsage: row.kiro_usage,
    analysis: row.analysis,
    createdAt: row.created_at,
    audioBase64: row.audio_base64,
    supportingMaterials: row.supporting_materials,
  })),
}));

describe("saveHackathonAnalysis", () => {
  const mockAnalysis: HackathonAnalysis = {
    finalScore: 4.2,
    viabilitySummary: "Strong project",
    detailedSummary: "Detailed analysis",
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
    selectedCategory: "resurrection" as const,
    kiroUsage: "Using Kiro for automation",
    analysis: mockAnalysis,
    supportingMaterials: {
      screenshots: ["screenshot1.png"],
      demoLink: "https://demo.example.com",
    },
    audioBase64: "base64audiodata",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock chain
    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      returns: mockReturns,
    });
    mockReturns.mockReturnValue({
      single: mockSingle,
    });
  });

  it("should save hackathon analysis successfully", async () => {
    const mockSession = {
      user: { id: "user-123" },
    };
    const mockSavedRow = {
      id: "analysis-123",
      user_id: "user-123",
      project_description: mockParams.projectDescription,
      selected_category: mockParams.selectedCategory,
      kiro_usage: mockParams.kiroUsage,
      analysis: mockParams.analysis,
      audio_base64: mockParams.audioBase64,
      supporting_materials: mockParams.supportingMaterials,
      created_at: "2023-01-01T00:00:00Z",
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
    });
    mockSingle.mockResolvedValue({
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
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    const result = await saveHackathonAnalysis(mockParams);

    expect(result.error).toBe("Authentication required");
    expect(result.data).toBeNull();
  });

  it("should handle database errors", async () => {
    const mockSession = {
      user: { id: "user-123" },
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
    });
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const result = await saveHackathonAnalysis(mockParams);

    expect(result.error).toBe("Failed to save your analysis.ry again.");
    expect(result.data).toBeNull();
  });

  it("should call database with correct parameters", async () => {
    const mockSession = {
      user: { id: "user-123" },
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
    });
    mockSingle.mockResolvedValue({
      data: { id: "test-id" },
      error: null,
    });

    await saveHackathonAnalysis(mockParams);

    expect(mockSupabase.from).toHaveBeenCalledWith("saved_hackathon_analyses");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      project_description: mockParams.projectDescription,
      selected_category: mockParams.selectedCategory,
      kiro_usage: mockParams.kiroUsage,
      analysis: mockParams.analysis,
      audio_base64: mockParams.audioBase64,
      supporting_materials: mockParams.supportingMaterials,
    });
  });
});
