import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadHackathonAnalysis } from "../loadHackathonAnalysis";

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
  select: vi.fn(),
  eq: vi.fn(),
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

describe("loadHackathonAnalysis", () => {
  const mockAnalysisRow = {
    id: "analysis-123",
    user_id: "user-123",
    analysis_type: "hackathon",
    idea: "Test project",
    analysis: {
      finalScore: 4.2,
      viabilitySummary: "Strong project",
    },
    created_at: "2023-01-01T00:00:00Z",
    audio_base64: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.from.mockReturnValue(mockQuery);
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.returns.mockReturnValue(mockQuery);
  });

  it("should load hackathon analysis successfully", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockQuery.single.mockResolvedValue({
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
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await loadHackathonAnalysis("analysis-123");

    expect(result.error).toBe("Authentication required");
    expect(result.data).toBeNull();
  });

  it("should handle analysis not found", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockQuery.single.mockResolvedValue({
      data: null,
      error: { code: "PGRST116" },
    });

    const result = await loadHackathonAnalysis("nonexistent-id");

    expect(result.error).toBe("Analysis not found");
    expect(result.data).toBeNull();
  });

  it("should handle database errors", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockQuery.single.mockResolvedValue({
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
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockQuery.single.mockResolvedValue({
      data: mockAnalysisRow,
      error: null,
    });

    await loadHackathonAnalysis("analysis-123");

    expect(mockSupabase.from).toHaveBeenCalledWith("saved_analyses");
    expect(mockQuery.select).toHaveBeenCalledWith("*");

    // Check that eq was called for id, user_id, and analysis_type
    expect(mockQuery.eq).toHaveBeenCalledTimes(3);
    expect(mockQuery.eq).toHaveBeenNthCalledWith(1, "id", "analysis-123");
    expect(mockQuery.eq).toHaveBeenNthCalledWith(2, "user_id", "user-123");
    expect(mockQuery.eq).toHaveBeenNthCalledWith(3, "analysis_type", "hackathon");
  });
});
