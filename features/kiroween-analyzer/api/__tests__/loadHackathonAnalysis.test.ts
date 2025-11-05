import { loadHackathonAnalysis } from "../loadHackathonAnalysis";

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(),
};

const mockSelect = jest.fn();
const mockEq = jest.fn();
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

describe("loadHackathonAnalysis", () => {
  const mockAnalysisRow = {
    id: "analysis-123",
    user_id: "user-123",
    project_description: "Test project",
    selected_category: "resurrection",
    kiro_usage: "Using Kiro for automation",
    analysis: {
      finalScore: 4.2,
      viabilitySummary: "Strong project",
    },
    created_at: "2023-01-01T00:00:00Z",
    audio_base64: null,
    supporting_materials: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock chain
    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      returns: mockReturns,
    });
    mockReturns.mockReturnValue({
      single: mockSingle,
    });
  });

  it("should load hackathon analysis successfully", async () => {
    const mockSession = {
      user: { id: "user-123" },
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
    });
    mockSingle.mockResolvedValue({
      data: mockAnalysisRow,
      error: null,
    });

    const result = await loadHackathonAnalysis("analysis-123");

    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
    expect(result.data!.id).toBe("analysis-123");
    expect(result.data!.userId).toBe("user-123");
  });

  it("should return error when user is not authenticated", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    const result = await loadHackathonAnalysis("analysis-123");

    expect(result.error).toBe("Authentication required");
    expect(result.data).toBeNull();
  });

  it("should handle analysis not found", async () => {
    const mockSession = {
      user: { id: "user-123" },
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
    });
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: "PGRST116" },
    });

    const result = await loadHackathonAnalysis("nonexistent-id");

    expect(result.error).toBe("Analysis not found");
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

    const result = await loadHackathonAnalysis("analysis-123");

    expect(result.error).toBe(
      "Unable to load the analysis. It may have been removed."
    );
    expect(result.data).toBeNull();
  });

  it("should query database with correct parameters", async () => {
    const mockSession = {
      user: { id: "user-123" },
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
    });
    mockSingle.mockResolvedValue({
      data: mockAnalysisRow,
      error: null,
    });

    await loadHackathonAnalysis("analysis-123");

    expect(mockSupabase.from).toHaveBeenCalledWith("saved_hackathon_analyses");
    expect(mockSelect).toHaveBeenCalledWith("*");

    // Check that eq was called twice (for id and user_id)
    expect(mockEq).toHaveBeenCalledTimes(2);
    expect(mockEq).toHaveBeenNthCalledWith(1, "id", "analysis-123");
    expect(mockEq).toHaveBeenNthCalledWith(2, "user_id", "user-123");
  });
});
