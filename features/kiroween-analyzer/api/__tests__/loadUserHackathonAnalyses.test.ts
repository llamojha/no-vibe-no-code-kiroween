import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadUserHackathonAnalyses } from "../loadUserHackathonAnalyses";

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
  order: vi.fn(),
  returns: vi.fn(),
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
    supportingMaterials: row.supporting_materials ?? {},
  })),
}));

describe("loadUserHackathonAnalyses", () => {
  const mockUser = { id: "user-123" };

  const mockIdeaWithDocs = {
    id: "idea-123",
    user_id: "user-123",
    idea_text: "Test hackathon project",
    source: "manual",
    project_status: "idea",
    notes: "",
    tags: [],
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    documents: [
      {
        id: "doc-123",
        document_type: "hackathon_analysis",
        title: null,
        content: {
          projectDescription: "Test hackathon project",
          analysis: {
            finalScore: 4.2,
            viabilitySummary: "Strong project",
          },
          supportingMaterials: {},
          audioBase64: null,
        },
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      },
    ],
  };

  const mockLegacyAnalysisRow = {
    id: "legacy-123",
    user_id: "user-123",
    analysis_type: "hackathon",
    idea: "Legacy project",
    analysis: {
      finalScore: 3.8,
      viabilitySummary: "Good project",
    },
    created_at: "2023-01-01T00:00:00Z",
    audio_base64: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.from.mockReturnValue(mockQuery);
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
    mockQuery.returns.mockReturnValue(mockQuery);
  });

  describe("loading from new tables (ideas + documents)", () => {
    it("should load hackathon analyses from ideas table with document counts", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // First call to ideas table succeeds
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [mockIdeaWithDocs],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await loadUserHackathonAnalyses();

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("doc-123");
      expect(result.data[0].projectDescription).toBe("Test hackathon project");
      expect(result.data[0].analysis.finalScore).toBe(4.2);
    });

    it("should filter for hackathon_analysis documents only", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const ideaWithMixedDocs = {
        ...mockIdeaWithDocs,
        documents: [
          {
            id: "doc-hackathon",
            document_type: "hackathon_analysis",
            content: {
              projectDescription: "Hackathon project",
              analysis: { finalScore: 4.0 },
            },
            created_at: "2023-01-01T00:00:00Z",
          },
          {
            id: "doc-startup",
            document_type: "startup_analysis",
            content: {
              analysis: { finalScore: 3.5 },
            },
            created_at: "2023-01-02T00:00:00Z",
          },
        ],
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [ideaWithMixedDocs],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await loadUserHackathonAnalyses();

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("doc-hackathon");
    });

    it("should use JOIN query to avoid N+1 queries", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [mockIdeaWithDocs],
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: selectMock,
      });

      await loadUserHackathonAnalyses();

      // Verify that select was called with JOIN syntax
      expect(selectMock).toHaveBeenCalledWith(
        expect.stringContaining("documents")
      );
      expect(selectMock).toHaveBeenCalledWith(
        expect.stringContaining("!inner")
      );
    });

    it("should sort analyses by creation date (newest first)", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const idea1 = {
        ...mockIdeaWithDocs,
        documents: [
          {
            id: "doc-1",
            document_type: "hackathon_analysis",
            content: {
              projectDescription: "Project 1",
              analysis: {},
            },
            created_at: "2023-01-01T00:00:00Z",
          },
        ],
      };

      const idea2 = {
        ...mockIdeaWithDocs,
        id: "idea-456",
        documents: [
          {
            id: "doc-2",
            document_type: "hackathon_analysis",
            content: {
              projectDescription: "Project 2",
              analysis: {},
            },
            created_at: "2023-01-02T00:00:00Z",
          },
        ],
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [idea1, idea2],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await loadUserHackathonAnalyses();

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      // Newest first
      expect(result.data[0].id).toBe("doc-2");
      expect(result.data[1].id).toBe("doc-1");
    });
  });

  describe("fallback to legacy table (saved_analyses)", () => {
    it("should fall back to saved_analyses when ideas table query fails", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1 && table === "ideas") {
          // First call to ideas table fails
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Table not found" },
                  }),
                }),
              }),
            }),
          };
        } else if (callCount === 2 && table === "saved_analyses") {
          // Second call to saved_analyses succeeds
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    returns: vi.fn().mockResolvedValue({
                      data: [mockLegacyAnalysisRow],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return mockQuery;
      });

      const result = await loadUserHackathonAnalyses();

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("legacy-123");
    });

    it("should fall back to saved_analyses when no documents found in new tables", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1 && table === "ideas") {
          // First call to ideas table returns empty
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (callCount === 2 && table === "saved_analyses") {
          // Second call to saved_analyses succeeds
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    returns: vi.fn().mockResolvedValue({
                      data: [mockLegacyAnalysisRow],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return mockQuery;
      });

      const result = await loadUserHackathonAnalyses();

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("legacy-123");
    });
  });

  describe("error handling", () => {
    it("should return error when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await loadUserHackathonAnalyses();

      expect(result.error).toBe("Authentication required");
      expect(result.data).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Both queries fail
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                returns: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Database error" },
                }),
              }),
            }),
          }),
        }),
      });

      const result = await loadUserHackathonAnalyses();

      expect(result.error).toBe(
        "Failed to load your analyses. Please try again."
      );
      expect(result.data).toEqual([]);
    });
  });

  describe("data transformation", () => {
    it("should correctly transform document content to SavedHackathonAnalysis format", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const ideaWithCompleteDoc = {
        ...mockIdeaWithDocs,
        documents: [
          {
            id: "doc-complete",
            document_type: "hackathon_analysis",
            content: {
              projectDescription: "Complete project",
              analysis: {
                finalScore: 4.5,
                viabilitySummary: "Excellent",
              },
              supportingMaterials: { github: "https://github.com/test" },
              audioBase64: "base64data",
            },
            created_at: "2023-01-01T00:00:00Z",
          },
        ],
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [ideaWithCompleteDoc],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await loadUserHackathonAnalyses();

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);

      const analysis = result.data[0];
      expect(analysis.id).toBe("doc-complete");
      expect(analysis.userId).toBe("user-123");
      expect(analysis.projectDescription).toBe("Complete project");
      expect(analysis.analysis.finalScore).toBe(4.5);
      expect(analysis.supportingMaterials).toEqual({
        github: "https://github.com/test",
      });
      expect(analysis.audioBase64).toBe("base64data");
    });

    it("should use idea_text as fallback for projectDescription", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const ideaWithoutProjectDescription = {
        ...mockIdeaWithDocs,
        idea_text: "Fallback idea text",
        documents: [
          {
            id: "doc-fallback",
            document_type: "hackathon_analysis",
            content: {
              analysis: {},
            },
            created_at: "2023-01-01T00:00:00Z",
          },
        ],
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [ideaWithoutProjectDescription],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await loadUserHackathonAnalyses();

      expect(result.error).toBeNull();
      expect(result.data[0].projectDescription).toBe("Fallback idea text");
    });
  });
});
