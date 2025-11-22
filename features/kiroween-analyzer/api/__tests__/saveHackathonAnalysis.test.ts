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
  eq: vi.fn(),
  order: vi.fn(),
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

// Mock repositories
const mockIdeaRepository = {
  save: vi.fn(),
  findById: vi.fn(),
};

const mockDocumentRepository = {
  save: vi.fn(),
};

vi.mock(
  "@/src/infrastructure/database/supabase/repositories/SupabaseIdeaRepository",
  () => ({
    SupabaseIdeaRepository: vi.fn(() => mockIdeaRepository),
  })
);

vi.mock(
  "@/src/infrastructure/database/supabase/repositories/SupabaseDocumentRepository",
  () => ({
    SupabaseDocumentRepository: vi.fn(() => mockDocumentRepository),
  })
);

vi.mock("@/src/infrastructure/database/supabase/mappers/IdeaMapper", () => ({
  IdeaMapper: vi.fn(),
}));

vi.mock(
  "@/src/infrastructure/database/supabase/mappers/DocumentMapper",
  () => ({
    DocumentMapper: vi.fn(),
  })
);

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
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
  });

  it("should create new idea and document when ideaId is not provided", async () => {
    const mockIdeaId = "550e8400-e29b-41d4-a716-446655440001";
    const mockDocumentId = "550e8400-e29b-41d4-a716-446655440002";
    const mockCreatedAt = "2023-01-01T00:00:00Z";

    // Mock fetch to simulate successful API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ideaId: mockIdeaId,
        documentId: mockDocumentId,
        createdAt: mockCreatedAt,
      }),
    });

    const result = await saveHackathonAnalysis(mockParams);

    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
    expect(result.data!.ideaId).toBe(mockIdeaId);
    expect(result.data!.documentId).toBe(mockDocumentId);
    expect(result.data!.createdAt).toBe(mockCreatedAt);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v2/hackathon/save",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("should use existing idea when ideaId is provided", async () => {
    const existingIdeaId = "550e8400-e29b-41d4-a716-446655440003";
    const mockDocumentId = "550e8400-e29b-41d4-a716-446655440004";
    const mockCreatedAt = "2023-01-01T00:00:00Z";

    // Mock fetch to simulate successful API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ideaId: existingIdeaId,
        documentId: mockDocumentId,
        createdAt: mockCreatedAt,
      }),
    });

    const result = await saveHackathonAnalysis({
      ...mockParams,
      ideaId: existingIdeaId,
    });

    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
    expect(result.data!.ideaId).toBe(existingIdeaId);
    expect(result.data!.documentId).toBe(mockDocumentId);
    expect(result.data!.createdAt).toBe(mockCreatedAt);
  });

  it("should return error when user is not authenticated", async () => {
    // Mock fetch to simulate authentication error
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: "Authentication required",
      }),
    });

    const result = await saveHackathonAnalysis(mockParams);

    expect(result.error).toBe("Authentication required");
    expect(result.data).toBeNull();
  });

  it("should return error when idea not found with provided ideaId", async () => {
    const nonExistentIdeaId = "550e8400-e29b-41d4-a716-446655440005";

    // Mock fetch to simulate idea not found error
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        error: "Idea not found or you don't have permission to access it",
      }),
    });

    const result = await saveHackathonAnalysis({
      ...mockParams,
      ideaId: nonExistentIdeaId,
    });

    expect(result.error).toBe(
      "Idea not found or you don't have permission to access it"
    );
    expect(result.data).toBeNull();
  });

  it("should handle idea creation errors", async () => {
    // Mock fetch to simulate idea creation error
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: "Failed to create idea. Please try again.",
      }),
    });

    const result = await saveHackathonAnalysis(mockParams);

    expect(result.error).toBe("Failed to create idea. Please try again.");
    expect(result.data).toBeNull();
  });

  it("should handle document creation errors", async () => {
    // Mock fetch to simulate API error response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error:
          "Idea created but failed to save analysis. Please try analyzing again from the Idea Panel.",
      }),
    });

    const result = await saveHackathonAnalysis(mockParams);

    expect(result.error).toBe(
      "Idea created but failed to save analysis. Please try analyzing again from the Idea Panel."
    );
    expect(result.data).toBeNull();
  });
});
