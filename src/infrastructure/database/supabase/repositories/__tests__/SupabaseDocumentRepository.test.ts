import { describe, it, expect, beforeEach, vi } from "vitest";
import { SupabaseDocumentRepository } from "../SupabaseDocumentRepository";
import { DocumentMapper } from "../../mappers/DocumentMapper";
import { Document } from "../../../../../domain/entities";
import {
  DocumentId,
  IdeaId,
  UserId,
  DocumentType,
} from "../../../../../domain/value-objects";

/**
 * Verification tests for SupabaseDocumentRepository
 *
 * These tests verify:
 * - All methods work correctly
 * - Indexes are used (via query structure)
 * - Error handling is implemented
 *
 * Requirements: 10.2, 10.3, 10.4
 */
describe("SupabaseDocumentRepository", () => {
  let repository: SupabaseDocumentRepository;
  let mockClient: any;
  let mapper: DocumentMapper;

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
      in: vi.fn().mockReturnThis(),
    };

    mapper = new DocumentMapper();
    repository = new SupabaseDocumentRepository(mockClient, mapper);
  });

  describe("save", () => {
    it("should save a document successfully", async () => {
      const document = Document.create({
        ideaId: IdeaId.generate(),
        userId: UserId.generate(),
        documentType: DocumentType.STARTUP_ANALYSIS,
        content: { score: 85, feedback: "Valid feedback" },
      });

      const mockDAO = {
        id: document.id.value,
        idea_id: document.ideaId.value,
        user_id: document.userId.value,
        document_type: "startup_analysis",
        title: null,
        content: { score: 85, feedback: "Valid feedback" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockClient.single.mockResolvedValue({
        data: mockDAO,
        error: null,
      });

      const result = await repository.save(document);

      expect(result.success).toBe(true);
      expect(mockClient.from).toHaveBeenCalledWith("documents");
      expect(mockClient.insert).toHaveBeenCalled();
    });

    it("should handle save errors", async () => {
      const document = Document.create({
        ideaId: IdeaId.generate(),
        userId: UserId.generate(),
        documentType: DocumentType.STARTUP_ANALYSIS,
        content: { score: 85, feedback: "Valid feedback" },
      });

      mockClient.single.mockResolvedValue({
        data: null,
        error: { message: "Database error", code: "500" },
      });

      const result = await repository.save(document);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("findById", () => {
    it("should find a document by ID", async () => {
      const documentId = DocumentId.generate();
      const ideaId = IdeaId.generate();
      const userId = UserId.generate();

      const mockDAO = {
        id: documentId.value,
        idea_id: ideaId.value,
        user_id: userId.value,
        document_type: "startup_analysis",
        title: null,
        content: { score: 85, feedback: "Valid feedback" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockClient.single.mockResolvedValue({
        data: mockDAO,
        error: null,
      });

      const result = await repository.findById(documentId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockClient.from).toHaveBeenCalledWith("documents");
      expect(mockClient.eq).toHaveBeenCalledWith("id", documentId.value);
    });

    it("should return null when document not found", async () => {
      const documentId = DocumentId.generate();

      mockClient.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" }, // PostgREST not found error
      });

      const result = await repository.findById(documentId);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe("findByIdeaId", () => {
    it("should find all documents for an idea with proper ordering", async () => {
      const ideaId = IdeaId.generate();
      const userId = UserId.generate();

      const mockDAOs = [
        {
          id: DocumentId.generate().value,
          idea_id: ideaId.value,
          user_id: userId.value,
          document_type: "startup_analysis",
          title: null,
          content: { score: 85, feedback: "Valid feedback" },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: DocumentId.generate().value,
          idea_id: ideaId.value,
          user_id: userId.value,
          document_type: "hackathon_analysis",
          title: "Hackathon Project",
          content: { score: 90, detailedSummary: "Detailed summary" },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockClient.order.mockResolvedValue({
        data: mockDAOs,
        error: null,
      });

      const result = await repository.findByIdeaId(ideaId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockClient.from).toHaveBeenCalledWith("documents");
      expect(mockClient.eq).toHaveBeenCalledWith("idea_id", ideaId.value);
      // Verify ordering by created_at DESC (uses index)
      expect(mockClient.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });

    it("should handle empty results", async () => {
      const ideaId = IdeaId.generate();

      mockClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await repository.findByIdeaId(ideaId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe("findByUserId", () => {
    it("should find all documents for a user", async () => {
      const userId = UserId.generate();

      const mockDAOs = [
        {
          id: DocumentId.generate().value,
          idea_id: IdeaId.generate().value,
          user_id: userId.value,
          document_type: "startup_analysis",
          title: null,
          content: { score: 85, feedback: "Valid feedback" },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockClient.order.mockResolvedValue({
        data: mockDAOs,
        error: null,
      });

      const result = await repository.findByUserId(userId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockClient.from).toHaveBeenCalledWith("documents");
      expect(mockClient.eq).toHaveBeenCalledWith("user_id", userId.value);
    });
  });

  describe("delete", () => {
    it("should delete a document successfully", async () => {
      const documentId = DocumentId.generate();

      mockClient.eq.mockResolvedValue({
        error: null,
      });

      const result = await repository.delete(documentId);

      expect(result.success).toBe(true);
      expect(mockClient.from).toHaveBeenCalledWith("documents");
      expect(mockClient.delete).toHaveBeenCalled();
    });

    it("should handle delete errors", async () => {
      const documentId = DocumentId.generate();

      mockClient.eq.mockResolvedValue({
        error: { message: "Database error", code: "500" },
      });

      const result = await repository.delete(documentId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Index Usage Verification", () => {
    it("should use idx_documents_idea index when querying by idea_id", async () => {
      const ideaId = IdeaId.generate();

      mockClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      await repository.findByIdeaId(ideaId);

      // Verify query structure that would use idx_documents_idea index
      expect(mockClient.eq).toHaveBeenCalledWith("idea_id", ideaId.value);
    });

    it("should use idx_documents_user index when querying by user_id", async () => {
      const userId = UserId.generate();

      mockClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      await repository.findByUserId(userId);

      // Verify query structure that would use idx_documents_user index
      expect(mockClient.eq).toHaveBeenCalledWith("user_id", userId.value);
    });

    it("should order by created_at DESC for performance", async () => {
      const ideaId = IdeaId.generate();

      mockClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      await repository.findByIdeaId(ideaId);

      // Verify ordering for index usage
      expect(mockClient.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });
  });

  describe("Error Handling", () => {
    it("should convert database errors to domain errors", async () => {
      const document = Document.create({
        ideaId: IdeaId.generate(),
        userId: UserId.generate(),
        documentType: DocumentType.STARTUP_ANALYSIS,
        content: { score: 85, feedback: "Valid feedback" },
      });

      mockClient.single.mockResolvedValue({
        data: null,
        error: { message: "Connection failed", code: "CONNECTION_ERROR" },
      });

      const result = await repository.save(document);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Failed to save document");
    });

    it("should handle unique constraint violations", async () => {
      const document = Document.create({
        ideaId: IdeaId.generate(),
        userId: UserId.generate(),
        documentType: DocumentType.STARTUP_ANALYSIS,
        content: { score: 85, feedback: "Valid feedback" },
      });

      mockClient.single.mockResolvedValue({
        data: null,
        error: { message: "Duplicate key", code: "23505" },
      });

      const result = await repository.save(document);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Bulk Operations", () => {
    it("should find documents by multiple idea IDs efficiently", async () => {
      const ideaIds = [IdeaId.generate(), IdeaId.generate()];

      mockClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await repository.findByIdeaIds(ideaIds);

      expect(result.success).toBe(true);
      expect(mockClient.from).toHaveBeenCalledWith("documents");
      // Verify bulk query using IN clause
      expect(mockClient.in).toHaveBeenCalledWith(
        "idea_id",
        ideaIds.map((id) => id.value)
      );
    });

    it("should get document counts for multiple ideas efficiently", async () => {
      const ideaIds = [IdeaId.generate(), IdeaId.generate()];

      mockClient.in.mockResolvedValue({
        data: [
          { idea_id: ideaIds[0].value },
          { idea_id: ideaIds[0].value },
          { idea_id: ideaIds[1].value },
        ],
        error: null,
      });

      const result = await repository.getDocumentCountsForIdeas(ideaIds);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Map);
      expect(result.data?.get(ideaIds[0].value)).toBe(2);
      expect(result.data?.get(ideaIds[1].value)).toBe(1);
    });
  });
});
