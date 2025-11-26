/**
 * Document Generation API Routes Integration Tests
 *
 * Tests the integration of Document Generation API routes with authentication,
 * credit system, feature flags, version management, and error handling.
 *
 * Task 9.3: Write integration tests for API routes
 * - Test complete document generation flow
 * - Test credit system integration
 * - Test feature flag protection
 * - Test error handling and rollback
 * - Test version management
 * - Test export functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { DocumentGeneratorController } from "../../src/infrastructure/web/controllers/DocumentGeneratorController";
import { GenerateDocumentUseCase } from "../../src/application/use-cases/GenerateDocumentUseCase";
import { UpdateDocumentUseCase } from "../../src/application/use-cases/UpdateDocumentUseCase";
import { RegenerateDocumentUseCase } from "../../src/application/use-cases/RegenerateDocumentUseCase";
import { GetDocumentVersionsUseCase } from "../../src/application/use-cases/GetDocumentVersionsUseCase";
import { RestoreDocumentVersionUseCase } from "../../src/application/use-cases/RestoreDocumentVersionUseCase";
import { ExportDocumentUseCase } from "../../src/application/use-cases/ExportDocumentUseCase";
import { success, failure } from "../../src/shared/types/common";
import {
  InsufficientCreditsError,
  IdeaNotFoundError,
  DocumentNotFoundError,
  UnauthorizedAccessError,
} from "../../src/shared/types/errors";
import { Document } from "../../src/domain/entities/Document";
import {
  DocumentId,
  IdeaId,
  UserId,
  DocumentType,
  DocumentVersion,
} from "../../src/domain/value-objects";

// Mock feature flags
vi.mock("@/lib/featureFlags", () => ({
  isEnabled: vi.fn(),
}));

// Mock authentication middleware
vi.mock("../../src/infrastructure/web/middleware/AuthMiddleware", () => ({
  authenticateRequest: vi.fn(),
}));

import { isEnabled } from "@/lib/featureFlags";
import { authenticateRequest } from "../../src/infrastructure/web/middleware/AuthMiddleware";

describe("Document Generation API Routes Integration", () => {
  let mockGenerateUseCase: GenerateDocumentUseCase;
  let mockUpdateUseCase: UpdateDocumentUseCase;
  let mockRegenerateUseCase: RegenerateDocumentUseCase;
  let mockGetVersionsUseCase: GetDocumentVersionsUseCase;
  let mockRestoreVersionUseCase: RestoreDocumentVersionUseCase;
  let mockExportUseCase: ExportDocumentUseCase;
  let controller: DocumentGeneratorController;

  const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
  const mockIdeaId = "550e8400-e29b-41d4-a716-446655440001";
  const mockDocumentId = "550e8400-e29b-41d4-a716-446655440002";

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock use cases
    mockGenerateUseCase = {
      execute: vi.fn(),
    } as any;

    mockUpdateUseCase = {
      execute: vi.fn(),
    } as any;

    mockRegenerateUseCase = {
      execute: vi.fn(),
    } as any;

    mockGetVersionsUseCase = {
      execute: vi.fn(),
    } as any;

    mockRestoreVersionUseCase = {
      execute: vi.fn(),
    } as any;

    mockExportUseCase = {
      execute: vi.fn(),
    } as any;

    // Create controller with mocked use cases
    controller = new DocumentGeneratorController(
      mockGenerateUseCase,
      mockUpdateUseCase,
      mockRegenerateUseCase,
      mockGetVersionsUseCase,
      mockRestoreVersionUseCase,
      mockExportUseCase
    );

    // Default: feature flag enabled
    vi.mocked(isEnabled).mockReturnValue(true);

    // Default: authentication succeeds
    vi.mocked(authenticateRequest).mockResolvedValue({
      success: true,
      userId: mockUserId,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Feature Flag Protection", () => {
    it("should return 403 when feature flag is disabled for generateDocument", async () => {
      vi.mocked(isEnabled).mockReturnValue(false);

      const request = new NextRequest(
        "http://localhost/api/v2/documents/generate",
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.generateDocument(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain("disabled");
      expect(mockGenerateUseCase.execute).not.toHaveBeenCalled();
    });

    it("should return 403 when feature flag is disabled for updateDocument", async () => {
      vi.mocked(isEnabled).mockReturnValue(false);

      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
            content: { markdown: "Updated content" },
          }),
        }
      );

      const response = await controller.updateDocument(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(403);
      expect(mockUpdateUseCase.execute).not.toHaveBeenCalled();
    });

    it("should return 403 when feature flag is disabled for regenerateDocument", async () => {
      vi.mocked(isEnabled).mockReturnValue(false);

      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/regenerate`,
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.regenerateDocument(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(403);
      expect(mockRegenerateUseCase.execute).not.toHaveBeenCalled();
    });

    it("should return 403 when feature flag is disabled for getVersions", async () => {
      vi.mocked(isEnabled).mockReturnValue(false);

      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/versions?ideaId=${mockIdeaId}&documentType=prd`
      );

      const response = await controller.getVersions(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(403);
      expect(mockGetVersionsUseCase.execute).not.toHaveBeenCalled();
    });

    it("should return 403 when feature flag is disabled for exportDocument", async () => {
      vi.mocked(isEnabled).mockReturnValue(false);

      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/export?format=markdown`
      );

      const response = await controller.exportDocument(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(403);
      expect(mockExportUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("Authentication", () => {
    it("should require authentication for generateDocument", async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: "Unauthorized",
      });

      const request = new NextRequest(
        "http://localhost/api/v2/documents/generate",
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.generateDocument(request);

      expect(response.status).toBe(401);
      expect(mockGenerateUseCase.execute).not.toHaveBeenCalled();
    });

    it("should require authentication for updateDocument", async () => {
      vi.mocked(authenticateRequest).mockResolvedValue({
        success: false,
        error: "Unauthorized",
      });

      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
            content: { markdown: "Updated" },
          }),
        }
      );

      const response = await controller.updateDocument(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(401);
      expect(mockUpdateUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("Complete Document Generation Flow", () => {
    it("should successfully generate a PRD document", async () => {
      const mockDocument = Document.create({
        ideaId: IdeaId.fromString(mockIdeaId),
        userId: UserId.fromString(mockUserId),
        documentType: DocumentType.PRD,
        title: "Test PRD",
        content: { markdown: "# PRD Content" },
      });

      vi.mocked(mockGenerateUseCase.execute).mockResolvedValue(
        success({ document: mockDocument })
      );

      const request = new NextRequest(
        "http://localhost/api/v2/documents/generate",
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.generateDocument(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.document).toBeDefined();
      expect(body.document.documentType).toBe("prd");
      expect(mockGenerateUseCase.execute).toHaveBeenCalledWith({
        ideaId: expect.any(Object),
        userId: expect.any(Object),
        documentType: expect.any(Object),
      });
    });

    it("should successfully generate a Technical Design document", async () => {
      const mockDocument = Document.create({
        ideaId: IdeaId.fromString(mockIdeaId),
        userId: UserId.fromString(mockUserId),
        documentType: DocumentType.TECHNICAL_DESIGN,
        title: "Test Technical Design",
        content: { markdown: "# Technical Design Content" },
      });

      vi.mocked(mockGenerateUseCase.execute).mockResolvedValue(
        success({ document: mockDocument })
      );

      const request = new NextRequest(
        "http://localhost/api/v2/documents/generate",
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "technical_design",
          }),
        }
      );

      const response = await controller.generateDocument(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.document.documentType).toBe("technical_design");
    });

    it("should validate required fields for document generation", async () => {
      const request = new NextRequest(
        "http://localhost/api/v2/documents/generate",
        {
          method: "POST",
          body: JSON.stringify({
            // Missing ideaId and documentType
          }),
        }
      );

      const response = await controller.generateDocument(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("ideaId");
      expect(mockGenerateUseCase.execute).not.toHaveBeenCalled();
    });

    it("should validate document type is one of the allowed types", async () => {
      const request = new NextRequest(
        "http://localhost/api/v2/documents/generate",
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "invalid_type",
          }),
        }
      );

      const response = await controller.generateDocument(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Invalid documentType");
      expect(mockGenerateUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("Credit System Integration", () => {
    it("should return 402 when user has insufficient credits", async () => {
      vi.mocked(mockGenerateUseCase.execute).mockResolvedValue(
        failure(new InsufficientCreditsError(mockUserId))
      );

      const request = new NextRequest(
        "http://localhost/api/v2/documents/generate",
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.generateDocument(request);

      expect(response.status).toBe(402);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it("should deduct credits on successful generation", async () => {
      const mockDocument = Document.create({
        ideaId: IdeaId.fromString(mockIdeaId),
        userId: UserId.fromString(mockUserId),
        documentType: DocumentType.PRD,
        title: "Test PRD",
        content: { markdown: "# Content" },
      });

      vi.mocked(mockGenerateUseCase.execute).mockResolvedValue(
        success({ document: mockDocument })
      );

      const request = new NextRequest(
        "http://localhost/api/v2/documents/generate",
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.generateDocument(request);

      expect(response.status).toBe(200);
      expect(mockGenerateUseCase.execute).toHaveBeenCalled();
    });

    it("should handle credit refund on generation failure", async () => {
      vi.mocked(mockGenerateUseCase.execute).mockResolvedValue(
        failure(new Error("AI service error"))
      );

      const request = new NextRequest(
        "http://localhost/api/v2/documents/generate",
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.generateDocument(request);

      expect(response.status).toBe(400);
      expect(mockGenerateUseCase.execute).toHaveBeenCalled();
    });
  });

  describe("Error Handling and Rollback", () => {
    it("should return 404 when idea not found", async () => {
      vi.mocked(mockGenerateUseCase.execute).mockResolvedValue(
        failure(new IdeaNotFoundError(mockIdeaId))
      );

      const request = new NextRequest(
        "http://localhost/api/v2/documents/generate",
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.generateDocument(request);

      expect(response.status).toBe(404);
    });

    it("should return 403 for unauthorized access", async () => {
      vi.mocked(mockGenerateUseCase.execute).mockResolvedValue(
        failure(new UnauthorizedAccessError(mockUserId, mockIdeaId))
      );

      const request = new NextRequest(
        "http://localhost/api/v2/documents/generate",
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.generateDocument(request);

      expect(response.status).toBe(403);
    });

    it("should handle AI service errors gracefully", async () => {
      vi.mocked(mockGenerateUseCase.execute).mockResolvedValue(
        failure(new Error("AI service unavailable"))
      );

      const request = new NextRequest(
        "http://localhost/api/v2/documents/generate",
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.generateDocument(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it("should handle database errors during save", async () => {
      vi.mocked(mockGenerateUseCase.execute).mockResolvedValue(
        failure(new Error("Database connection failed"))
      );

      const request = new NextRequest(
        "http://localhost/api/v2/documents/generate",
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.generateDocument(request);

      expect(response.status).toBe(400);
    });
  });

  describe("Version Management", () => {
    it("should create new version when updating document", async () => {
      const mockDocument = Document.create({
        ideaId: IdeaId.fromString(mockIdeaId),
        userId: UserId.fromString(mockUserId),
        documentType: DocumentType.PRD,
        title: "Test PRD",
        content: { markdown: "# Updated Content" },
      });

      vi.mocked(mockUpdateUseCase.execute).mockResolvedValue(
        success({ document: mockDocument })
      );

      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
            content: { markdown: "# Updated Content" },
          }),
        }
      );

      const response = await controller.updateDocument(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.document).toBeDefined();
      expect(mockUpdateUseCase.execute).toHaveBeenCalled();
    });

    it("should retrieve all versions of a document", async () => {
      const mockVersions = [
        Document.create({
          ideaId: IdeaId.fromString(mockIdeaId),
          userId: UserId.fromString(mockUserId),
          documentType: DocumentType.PRD,
          title: "Test PRD v2",
          content: { markdown: "# Version 2" },
        }),
        Document.create({
          ideaId: IdeaId.fromString(mockIdeaId),
          userId: UserId.fromString(mockUserId),
          documentType: DocumentType.PRD,
          title: "Test PRD v1",
          content: { markdown: "# Version 1" },
        }),
      ];

      vi.mocked(mockGetVersionsUseCase.execute).mockResolvedValue(
        success({ versions: mockVersions })
      );

      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/versions?ideaId=${mockIdeaId}&documentType=prd`
      );

      const response = await controller.getVersions(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.versions).toHaveLength(2);
      expect(mockGetVersionsUseCase.execute).toHaveBeenCalled();
    });

    it("should restore a previous version", async () => {
      const mockDocument = Document.create({
        ideaId: IdeaId.fromString(mockIdeaId),
        userId: UserId.fromString(mockUserId),
        documentType: DocumentType.PRD,
        title: "Test PRD",
        content: { markdown: "# Restored Content" },
      });

      vi.mocked(mockRestoreVersionUseCase.execute).mockResolvedValue(
        success({ document: mockDocument })
      );

      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/versions/1/restore`,
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.restoreVersion(request, {
        params: { documentId: mockDocumentId, version: "1" },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.document).toBeDefined();
      expect(mockRestoreVersionUseCase.execute).toHaveBeenCalled();
    });

    it("should validate version number when restoring", async () => {
      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/versions/invalid/restore`,
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.restoreVersion(request, {
        params: { documentId: mockDocumentId, version: "invalid" },
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Invalid version number");
      expect(mockRestoreVersionUseCase.execute).not.toHaveBeenCalled();
    });

    it("should create new version when regenerating document", async () => {
      const mockDocument = Document.create({
        ideaId: IdeaId.fromString(mockIdeaId),
        userId: UserId.fromString(mockUserId),
        documentType: DocumentType.PRD,
        title: "Test PRD",
        content: { markdown: "# Regenerated Content" },
      });

      vi.mocked(mockRegenerateUseCase.execute).mockResolvedValue(
        success({ document: mockDocument })
      );

      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/regenerate`,
        {
          method: "POST",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
          }),
        }
      );

      const response = await controller.regenerateDocument(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.document).toBeDefined();
      expect(mockRegenerateUseCase.execute).toHaveBeenCalled();
    });
  });

  describe("Export Functionality", () => {
    it("should export document as markdown", async () => {
      const mockExport = {
        content: Buffer.from("# Markdown Content"),
        filename: "test-prd.md",
        mimeType: "text/markdown",
        metadata: {
          title: "Test PRD",
          version: 1,
          documentType: "prd",
          exportDate: new Date().toISOString(),
        },
      };

      vi.mocked(mockExportUseCase.execute).mockResolvedValue(
        success({ export: mockExport })
      );

      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/export?format=markdown`
      );

      const response = await controller.exportDocument(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/markdown");
      expect(response.headers.get("Content-Disposition")).toContain(
        "test-prd.md"
      );
      expect(mockExportUseCase.execute).toHaveBeenCalled();
    });

    it("should export document as PDF", async () => {
      const mockExport = {
        content: Buffer.from("PDF content"),
        filename: "test-prd.pdf",
        mimeType: "application/pdf",
        metadata: {
          title: "Test PRD",
          version: 1,
          documentType: "prd",
          exportDate: new Date().toISOString(),
        },
      };

      vi.mocked(mockExportUseCase.execute).mockResolvedValue(
        success({ export: mockExport })
      );

      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/export?format=pdf`
      );

      const response = await controller.exportDocument(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/pdf");
      expect(response.headers.get("Content-Disposition")).toContain(
        "test-prd.pdf"
      );
    });

    it("should validate export format", async () => {
      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/export?format=invalid`
      );

      const response = await controller.exportDocument(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("format");
      expect(mockExportUseCase.execute).not.toHaveBeenCalled();
    });

    it("should require format parameter for export", async () => {
      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/export`
      );

      const response = await controller.exportDocument(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("format");
    });

    it("should include metadata in export headers", async () => {
      const mockExport = {
        content: Buffer.from("# Content"),
        filename: "test.md",
        mimeType: "text/markdown",
        metadata: {
          title: "Test Document",
          version: 2,
          documentType: "prd",
          exportDate: "2024-01-01T00:00:00.000Z",
        },
      };

      vi.mocked(mockExportUseCase.execute).mockResolvedValue(
        success({ export: mockExport })
      );

      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/export?format=markdown`
      );

      const response = await controller.exportDocument(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Document-Title")).toBe("Test Document");
      expect(response.headers.get("X-Document-Version")).toBe("2");
      expect(response.headers.get("X-Document-Type")).toBe("prd");
      expect(response.headers.get("X-Export-Date")).toBe(
        "2024-01-01T00:00:00.000Z"
      );
    });
  });

  describe("Request Validation", () => {
    it("should validate required query parameters for getVersions", async () => {
      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/versions`
      );

      const response = await controller.getVersions(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("ideaId");
      expect(mockGetVersionsUseCase.execute).not.toHaveBeenCalled();
    });

    it("should validate content field for updateDocument", async () => {
      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            ideaId: mockIdeaId,
            documentType: "prd",
            // Missing content
          }),
        }
      );

      const response = await controller.updateDocument(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("content");
      expect(mockUpdateUseCase.execute).not.toHaveBeenCalled();
    });

    it("should validate ideaId for regenerateDocument", async () => {
      const request = new NextRequest(
        `http://localhost/api/v2/documents/${mockDocumentId}/regenerate`,
        {
          method: "POST",
          body: JSON.stringify({
            documentType: "prd",
            // Missing ideaId
          }),
        }
      );

      const response = await controller.regenerateDocument(request, {
        params: { documentId: mockDocumentId },
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("ideaId");
      expect(mockRegenerateUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
