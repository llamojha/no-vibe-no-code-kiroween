import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteAnalysis } from "../deleteAnalysis";

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
  delete: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  browserSupabase: () => mockSupabase,
}));

describe("deleteAnalysis", () => {
  const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
  const mockAnalysisId = "550e8400-e29b-41d4-a716-446655440001";

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock chain
    mockSupabase.from.mockReturnValue(mockQuery);
    mockQuery.delete.mockReturnValue(mockQuery);
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
  });

  it("should delete from documents table when document exists", async () => {
    const mockSession = {
      user: { id: mockUserId },
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    });

    // Mock successful delete from documents table
    mockQuery.select.mockResolvedValue({
      data: [{ id: mockAnalysisId }],
      error: null,
    });

    const result = await deleteAnalysis(mockAnalysisId);

    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith("documents");
    expect(mockQuery.delete).toHaveBeenCalled();
    expect(mockQuery.eq).toHaveBeenCalledWith("id", mockAnalysisId);
    expect(mockQuery.eq).toHaveBeenCalledWith("user_id", mockUserId);
    expect(mockQuery.eq).toHaveBeenCalledWith(
      "document_type",
      "startup_analysis"
    );
  });

  it("should fallback to saved_analyses when document not found", async () => {
    const mockSession = {
      user: { id: mockUserId },
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    });

    // Create separate mock query chains for documents and saved_analyses
    const documentsQuery = {
      delete: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      eq: vi.fn().mockReturnThis(),
    };

    const savedAnalysesQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn(function (this: any) {
        return this;
      }),
    };

    // Mock the third (final) eq call to return a promise with success
    let eqCallCount = 0;
    savedAnalysesQuery.eq = vi.fn(function (this: any) {
      eqCallCount++;
      if (eqCallCount === 3) {
        return Promise.resolve({ error: null });
      }
      return this;
    });

    // Mock from() to return different query chains
    mockSupabase.from
      .mockReturnValueOnce(documentsQuery)
      .mockReturnValueOnce(savedAnalysesQuery);

    const result = await deleteAnalysis(mockAnalysisId);

    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith("documents");
    expect(mockSupabase.from).toHaveBeenCalledWith("saved_analyses");
  });

  it("should return error when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await deleteAnalysis(mockAnalysisId);

    expect(result.error).toBe("Authentication required");
  });

  it("should return error when authentication fails", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth error" },
    });

    const result = await deleteAnalysis(mockAnalysisId);

    expect(result.error).toBe("Authentication required");
  });

  it("should handle database errors gracefully", async () => {
    const mockSession = {
      user: { id: mockUserId },
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    });

    // Create separate mock query chains for documents and saved_analyses
    const documentsQuery = {
      delete: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      eq: vi.fn().mockReturnThis(),
    };

    const savedAnalysesQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn(function (this: any) {
        return this;
      }),
    };

    // Mock the third (final) eq call to return a promise with error
    let eqCallCount = 0;
    savedAnalysesQuery.eq = vi.fn(function (this: any) {
      eqCallCount++;
      if (eqCallCount === 3) {
        return Promise.resolve({ error: { message: "Database error" } });
      }
      return this;
    });

    // Mock from() to return different query chains
    mockSupabase.from
      .mockReturnValueOnce(documentsQuery)
      .mockReturnValueOnce(savedAnalysesQuery);

    const result = await deleteAnalysis(mockAnalysisId);

    expect(result.error).toBe("Failed to delete analysis. Please try again.");
  });

  it("should not delete parent idea when deleting document", async () => {
    const mockSession = {
      user: { id: mockUserId },
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    });

    // Mock successful delete from documents table
    mockQuery.select.mockResolvedValue({
      data: [{ id: mockAnalysisId, idea_id: "some-idea-id" }],
      error: null,
    });

    await deleteAnalysis(mockAnalysisId);

    // Verify that we never tried to delete from ideas table
    const fromCalls = mockSupabase.from.mock.calls;
    const ideasTableCalls = fromCalls.filter((call) => call[0] === "ideas");
    expect(ideasTableCalls.length).toBe(0);
  });

  it("should use correct analysis_type for legacy fallback", async () => {
    const mockSession = {
      user: { id: mockUserId },
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    });

    // Create separate mock query chains for documents and saved_analyses
    const documentsQuery = {
      delete: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      eq: vi.fn().mockReturnThis(),
    };

    const savedAnalysesQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn(function (this: any) {
        return this;
      }),
    };

    // Track eq calls to verify analysis_type
    const eqCalls: Array<[string, any]> = [];
    let eqCallCount = 0;
    savedAnalysesQuery.eq = vi.fn(function (
      this: any,
      key: string,
      value: any
    ) {
      eqCallCount++;
      eqCalls.push([key, value]);
      if (eqCallCount === 3) {
        return Promise.resolve({ error: null });
      }
      return this;
    });

    // Mock from() to return different query chains
    mockSupabase.from
      .mockReturnValueOnce(documentsQuery)
      .mockReturnValueOnce(savedAnalysesQuery);

    await deleteAnalysis(mockAnalysisId);

    // Verify that analysis_type 'idea' was used for legacy table
    expect(eqCalls).toContainEqual(["analysis_type", "idea"]);
  });
});
