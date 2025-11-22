import { describe, it, expect, beforeEach, vi } from "vitest";
import { SupabaseIdeaRepository } from "../SupabaseIdeaRepository";
import { IdeaMapper } from "../../mappers/IdeaMapper";
import { Idea } from "../../../../../domain/entities";
import {
  IdeaId,
  UserId,
  IdeaSource,
  ProjectStatus,
} from "../../../../../domain/value-objects";

// Helper function to create test IDs
const createTestUserId = () => UserId.generate();
const createTestIdeaId = () => IdeaId.generate();

/**
 * Verification tests for SupabaseIdeaRepository
 *
 * These tests verify:
 * - All methods work correctly
 * - Indexes are used (via query structure)
 * - Error handling is implemented
 *
 * Requirements: 10.1, 10.3, 10.4
 */
describe("SupabaseIdeaRepository", () => {
  let repository: SupabaseIdeaRepository;
  let mockClient: any;
  let mapper: IdeaMapper;

  beforeEach(() => {
    // Create mock Supabase client
    mockClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    mapper = new IdeaMapper();
    repository = new SupabaseIdeaRepository(mockClient, mapper);
  });

  describe("save", () => {
    it("should save an idea successfully", async () => {
      const idea = Idea.create({
        userId: UserId.generate(),
        ideaText: "Repository test idea for saving success",
        source: IdeaSource.MANUAL,
      });

      const mockDAO = {
        id: idea.id.value,
        user_id: idea.userId.value,
        idea_text: "Repository test idea for saving success",
        source: "manual",
        project_status: "idea",
        notes: "",
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockClient.single.mockResolvedValue({
        data: mockDAO,
        error: null,
      });

      const result = await repository.save(idea);

      expect(result.success).toBe(true);
      expect(mockClient.from).toHaveBeenCalledWith("ideas");
      expect(mockClient.insert).toHaveBeenCalled();
    });

    it("should handle save errors", async () => {
      const idea = Idea.create({
        userId: createTestUserId(),
        ideaText: "Test idea for error handling",
        source: IdeaSource.MANUAL,
      });

      mockClient.single.mockResolvedValue({
        data: null,
        error: { message: "Database error", code: "500" },
      });

      const result = await repository.save(idea);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("findById", () => {
    it("should find an idea by ID", async () => {
      const ideaId = createTestIdeaId();
      const userId = createTestUserId();

      const mockDAO = {
        id: ideaId.value,
        user_id: userId.value,
        idea_text: "Repository test idea for find by id",
        source: "manual",
        project_status: "idea",
        notes: "",
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockClient.single.mockResolvedValue({
        data: mockDAO,
        error: null,
      });

      const result = await repository.findById(ideaId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockClient.from).toHaveBeenCalledWith("ideas");
      expect(mockClient.eq).toHaveBeenCalledWith("id", ideaId.value);
    });

    it("should return null when idea not found", async () => {
      const ideaId = createTestIdeaId();

      mockClient.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" }, // PostgREST not found error
      });

      const result = await repository.findById(ideaId);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it("should handle database errors", async () => {
      const ideaId = createTestIdeaId();

      mockClient.single.mockResolvedValue({
        data: null,
        error: { message: "Database error", code: "500" },
      });

      const result = await repository.findById(ideaId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("findAllByUserId", () => {
    it("should find all ideas for a user with proper ordering", async () => {
      const userId = createTestUserId();

      const mockDAOs = [
        {
          id: createTestIdeaId().value,
          user_id: userId.value,
          idea_text: "Repository idea text one",
          source: "manual",
          project_status: "idea",
          notes: "",
          tags: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: createTestIdeaId().value,
          user_id: userId.value,
          idea_text: "Repository idea text two",
          source: "frankenstein",
          project_status: "in_progress",
          notes: "Some notes",
          tags: ["tag1", "tag2"],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockClient.order.mockResolvedValue({
        data: mockDAOs,
        error: null,
      });

      const result = await repository.findAllByUserId(userId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockClient.from).toHaveBeenCalledWith("ideas");
      expect(mockClient.eq).toHaveBeenCalledWith("user_id", userId.value);
      // Verify ordering by updated_at DESC (uses index)
      expect(mockClient.order).toHaveBeenCalledWith("updated_at", {
        ascending: false,
      });
    });

    it("should handle empty results", async () => {
      const userId = createTestUserId();

      mockClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await repository.findAllByUserId(userId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe("update", () => {
    it("should update an idea successfully", async () => {
      const idea = Idea.reconstruct({
        id: createTestIdeaId(),
        userId: createTestUserId(),
        ideaText: "Updated idea",
        source: IdeaSource.MANUAL,
        projectStatus: ProjectStatus.IN_PROGRESS,
        notes: "Updated notes",
        tags: ["tag1"],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockDAO = {
        id: idea.id.value,
        user_id: idea.userId.value,
        idea_text: "Updated idea",
        source: "manual",
        project_status: "in_progress",
        notes: "Updated notes",
        tags: ["tag1"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockClient.single.mockResolvedValue({
        data: mockDAO,
        error: null,
      });

      const result = await repository.update(idea);

      expect(result.success).toBe(true);
      expect(mockClient.from).toHaveBeenCalledWith("ideas");
      expect(mockClient.update).toHaveBeenCalled();
      expect(mockClient.eq).toHaveBeenCalledWith("id", idea.id.value);
    });

    it("should handle authorization errors", async () => {
      const idea = Idea.reconstruct({
        id: createTestIdeaId(),
        userId: createTestUserId(),
        ideaText: "Updated idea",
        source: IdeaSource.MANUAL,
        projectStatus: ProjectStatus.IN_PROGRESS,
        notes: "",
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const differentUserId = createTestUserId();

      const result = await repository.update(idea, differentUserId);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("not authorized");
    });
  });

  describe("delete", () => {
    it("should delete an idea successfully", async () => {
      const ideaId = createTestIdeaId();
      const userId = createTestUserId();

      // Mock findById for authorization check
      const mockDAO = {
        id: ideaId.value,
        user_id: userId.value,
        idea_text: "Repository test idea for delete success",
        source: "manual",
        project_status: "idea",
        notes: "",
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockClient.single.mockResolvedValueOnce({
        data: mockDAO,
        error: null,
      });

      const result = await repository.delete(ideaId, userId);

      expect(result.success).toBe(true);
      expect(mockClient.from).toHaveBeenCalledWith("ideas");
      expect(mockClient.delete).toHaveBeenCalled();
    });

    it("should handle delete errors", async () => {
      const ideaId = createTestIdeaId();

      mockClient.eq.mockResolvedValueOnce({
        error: { message: "Database error", code: "500" },
      });

      const result = await repository.delete(ideaId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Index Usage Verification", () => {
    it("should use idx_ideas_user index when querying by user_id", async () => {
      const userId = createTestUserId();

      mockClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      await repository.findAllByUserId(userId);

      // Verify query structure that would use idx_ideas_user index
      expect(mockClient.eq).toHaveBeenCalledWith("user_id", userId.value);
    });

    it("should use idx_ideas_updated index when ordering by updated_at", async () => {
      const userId = createTestUserId();

      mockClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      await repository.findAllByUserId(userId);

      // Verify ordering that would use idx_ideas_updated index
      expect(mockClient.order).toHaveBeenCalledWith("updated_at", {
        ascending: false,
      });
    });
  });

  describe("Error Handling", () => {
    it("should convert database errors to domain errors", async () => {
      const idea = Idea.create({
        userId: createTestUserId(),
        ideaText: "Test idea for unique constraint",
        source: IdeaSource.MANUAL,
      });

      mockClient.single.mockResolvedValue({
        data: null,
        error: { message: "Connection failed", code: "CONNECTION_ERROR" },
      });

      const result = await repository.save(idea);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Failed to save idea");
    });

    it("should handle unique constraint violations", async () => {
      const idea = Idea.create({
        userId: createTestUserId(),
        ideaText: "Repository test idea for unique constraint handling",
        source: IdeaSource.MANUAL,
      });

      mockClient.single.mockResolvedValue({
        data: null,
        error: { message: "Duplicate key", code: "23505" },
      });

      const result = await repository.save(idea);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
