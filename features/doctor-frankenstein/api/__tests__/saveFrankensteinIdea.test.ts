import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  saveFrankensteinIdea,
  loadFrankensteinIdea,
  updateFrankensteinIdea,
} from "../saveFrankensteinIdea";
import type { TechItem, FrankensteinAnalysis } from "@/lib/types";

// Mock dependencies
vi.mock("@/lib/supabase/client", () => ({
  browserSupabase: vi.fn(),
}));

vi.mock("@/lib/featureFlags", () => ({
  isEnabled: vi.fn(),
}));

vi.mock("@/lib/localStorage", () => ({
  localStorageService: {
    saveFrankensteinIdea: vi.fn(),
    getFrankensteinIdea: vi.fn(),
  },
}));

vi.mock("@/lib/mockData", () => ({
  generateMockUser: vi.fn(() => ({ id: "mock-user-id" })),
}));

import { browserSupabase } from "@/lib/supabase/client";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";

describe("saveFrankensteinIdea", () => {
  const mockTech1: TechItem = {
    name: "React",
    description: "A JavaScript library for building user interfaces",
    category: "Frontend",
  };

  const mockTech2: TechItem = {
    name: "Node.js",
    description: "JavaScript runtime built on Chrome's V8 engine",
    category: "Backend",
  };

  const mockAnalysis: FrankensteinAnalysis = {
    ideaName: "React + Node.js Platform",
    description: "A full-stack platform combining React and Node.js",
    keyFeatures: [],
    targetMarket: "Developers",
    uniqueValueProposition: "Fast and scalable",
    language: "en",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Production mode (Supabase)", () => {
    beforeEach(() => {
      vi.mocked(isEnabled).mockReturnValue(false);
    });

    it("should create idea in ideas table with source='frankenstein'", async () => {
      const mockUser = { id: "test-user-id" };
      const mockIdeaId = "test-idea-id";
      const mockCreatedAt = "2024-01-01T00:00:00.000Z";

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: mockIdeaId,
                  created_at: mockCreatedAt,
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.mocked(browserSupabase).mockReturnValue(mockSupabase as any);

      const result = await saveFrankensteinIdea({
        mode: "companies",
        tech1: mockTech1,
        tech2: mockTech2,
        analysis: mockAnalysis,
      });

      expect(result.data).toEqual({
        ideaId: mockIdeaId,
        createdAt: mockCreatedAt,
      });
      expect(result.error).toBeNull();

      // Verify the insert was called with correct data
      expect(mockSupabase.from).toHaveBeenCalledWith("ideas");
      const insertCall = mockSupabase.from("ideas").insert;
      expect(insertCall).toHaveBeenCalledWith({
        user_id: mockUser.id,
        idea_text: `${mockAnalysis.ideaName}\n\n${mockAnalysis.description}`,
        source: "frankenstein",
        project_status: "idea",
        notes: "",
        tags: [],
      });
    });

    it("should return error when user is not authenticated", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      };

      vi.mocked(browserSupabase).mockReturnValue(mockSupabase as any);

      const result = await saveFrankensteinIdea({
        mode: "companies",
        tech1: mockTech1,
        tech2: mockTech2,
        analysis: mockAnalysis,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe("User not authenticated");
    });

    it("should return error when database insert fails", async () => {
      const mockUser = { id: "test-user-id" };
      const mockError = { message: "Database error" };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      };

      vi.mocked(browserSupabase).mockReturnValue(mockSupabase as any);

      const result = await saveFrankensteinIdea({
        mode: "companies",
        tech1: mockTech1,
        tech2: mockTech2,
        analysis: mockAnalysis,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError.message);
    });
  });

  describe("Local dev mode (localStorage)", () => {
    beforeEach(() => {
      vi.mocked(isEnabled).mockReturnValue(true);
    });

    it("should save idea to localStorage", async () => {
      vi.mocked(localStorageService.saveFrankensteinIdea).mockResolvedValue(
        undefined
      );

      const result = await saveFrankensteinIdea({
        mode: "companies",
        tech1: mockTech1,
        tech2: mockTech2,
        analysis: mockAnalysis,
      });

      expect(result.data).toBeDefined();
      expect(result.data?.ideaId).toBeDefined();
      expect(result.data?.createdAt).toBeDefined();
      expect(result.error).toBeNull();

      expect(localStorageService.saveFrankensteinIdea).toHaveBeenCalled();
    });

    it("should return error when localStorage save fails", async () => {
      vi.mocked(localStorageService.saveFrankensteinIdea).mockRejectedValue(
        new Error("Storage error")
      );

      const result = await saveFrankensteinIdea({
        mode: "companies",
        tech1: mockTech1,
        tech2: mockTech2,
        analysis: mockAnalysis,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe(
        "Failed to save your idea to local storage. Please try again."
      );
    });
  });
});

describe("loadFrankensteinIdea", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Production mode (Supabase)", () => {
    beforeEach(() => {
      vi.mocked(isEnabled).mockReturnValue(false);
    });

    it("should load idea from ideas table", async () => {
      const mockIdeaId = "test-idea-id";
      const mockIdeaData = {
        id: mockIdeaId,
        idea_text: "Test Idea\n\nTest Description",
        source: "frankenstein",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockIdeaData,
              error: null,
            }),
          }),
        }),
      };

      vi.mocked(browserSupabase).mockReturnValue(mockSupabase as any);

      const result = await loadFrankensteinIdea(mockIdeaId);

      expect(result.data).toEqual({
        id: mockIdeaData.id,
        ideaText: mockIdeaData.idea_text,
        source: mockIdeaData.source,
        createdAt: mockIdeaData.created_at,
      });
      expect(result.error).toBeNull();

      expect(mockSupabase.from).toHaveBeenCalledWith("ideas");
    });

    it("should return error when idea not found", async () => {
      const mockIdeaId = "non-existent-id";
      const mockError = { message: "Not found" };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      };

      vi.mocked(browserSupabase).mockReturnValue(mockSupabase as any);

      const result = await loadFrankensteinIdea(mockIdeaId);

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError.message);
    });
  });

  describe("Local dev mode (localStorage)", () => {
    beforeEach(() => {
      vi.mocked(isEnabled).mockReturnValue(true);
    });

    it("should load idea from localStorage", async () => {
      const mockIdea = {
        id: "test-idea-id",
        userId: "mock-user-id",
        mode: "companies" as const,
        tech1: { name: "React", description: "Frontend", category: "Frontend" },
        tech2: { name: "Node.js", description: "Backend", category: "Backend" },
        analysis: {
          ideaName: "Test Idea",
          description: "Test Description",
          keyFeatures: [],
          targetMarket: "Developers",
          uniqueValueProposition: "Fast",
          language: "en" as const,
        },
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      vi.mocked(localStorageService.getFrankensteinIdea).mockResolvedValue(
        mockIdea
      );

      const result = await loadFrankensteinIdea("test-idea-id");

      expect(result.data).toEqual({
        id: mockIdea.id,
        ideaText: `${mockIdea.analysis.ideaName}\n\n${mockIdea.analysis.description}`,
        source: "frankenstein",
        createdAt: mockIdea.createdAt,
      });
      expect(result.error).toBeNull();
    });

    it("should return error when idea not found in localStorage", async () => {
      vi.mocked(localStorageService.getFrankensteinIdea).mockResolvedValue(
        null
      );

      const result = await loadFrankensteinIdea("non-existent-id");

      expect(result.data).toBeNull();
      expect(result.error).toBe("Idea not found in local storage");
    });
  });
});

describe("updateFrankensteinIdea", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Production mode (Supabase)", () => {
    beforeEach(() => {
      vi.mocked(isEnabled).mockReturnValue(false);
    });

    it("should update idea text in ideas table", async () => {
      const mockIdeaId = "test-idea-id";
      const newIdeaText = "Updated Idea\n\nUpdated Description";

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      };

      vi.mocked(browserSupabase).mockReturnValue(mockSupabase as any);

      const result = await updateFrankensteinIdea(mockIdeaId, newIdeaText);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      expect(mockSupabase.from).toHaveBeenCalledWith("ideas");
      const updateCall = mockSupabase.from("ideas").update;
      expect(updateCall).toHaveBeenCalledWith({ idea_text: newIdeaText });
    });

    it("should return error when update fails", async () => {
      const mockIdeaId = "test-idea-id";
      const newIdeaText = "Updated Idea";
      const mockError = { message: "Update failed" };

      const mockEqChain = {
        eq: vi.fn().mockResolvedValue({
          error: mockError,
        }),
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(mockEqChain),
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      };

      vi.mocked(browserSupabase).mockReturnValue(mockSupabase as any);

      const result = await updateFrankensteinIdea(mockIdeaId, newIdeaText);

      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError.message);
    });
  });

  describe("Local dev mode (localStorage)", () => {
    beforeEach(() => {
      vi.mocked(isEnabled).mockReturnValue(true);
    });

    it("should update idea in localStorage", async () => {
      const mockIdea = {
        id: "test-idea-id",
        userId: "mock-user-id",
        mode: "companies" as const,
        tech1: { name: "React", description: "Frontend", category: "Frontend" },
        tech2: { name: "Node.js", description: "Backend", category: "Backend" },
        analysis: {
          ideaName: "Test Idea",
          description: "Test Description",
          keyFeatures: [],
          targetMarket: "Developers",
          uniqueValueProposition: "Fast",
          language: "en" as const,
        },
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      vi.mocked(localStorageService.getFrankensteinIdea).mockResolvedValue(
        mockIdea
      );
      vi.mocked(localStorageService.saveFrankensteinIdea).mockResolvedValue(
        undefined
      );

      const newIdeaText = "Updated Idea\n\nUpdated Description";
      const result = await updateFrankensteinIdea("test-idea-id", newIdeaText);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      expect(localStorageService.saveFrankensteinIdea).toHaveBeenCalled();
    });

    it("should return error when idea not found in localStorage", async () => {
      vi.mocked(localStorageService.getFrankensteinIdea).mockResolvedValue(
        null
      );

      const result = await updateFrankensteinIdea(
        "non-existent-id",
        "New text"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Frankenstein idea not found");
    });
  });
});
