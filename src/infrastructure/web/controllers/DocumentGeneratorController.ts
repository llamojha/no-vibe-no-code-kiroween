import { NextRequest, NextResponse } from "next/server";
import { GenerateDocumentUseCase } from "@/src/application/use-cases/GenerateDocumentUseCase";
import { UpdateDocumentUseCase } from "@/src/application/use-cases/UpdateDocumentUseCase";
import { RegenerateDocumentUseCase } from "@/src/application/use-cases/RegenerateDocumentUseCase";
import { GetDocumentVersionsUseCase } from "@/src/application/use-cases/GetDocumentVersionsUseCase";
import { RestoreDocumentVersionUseCase } from "@/src/application/use-cases/RestoreDocumentVersionUseCase";
import { GetDocumentByIdUseCase } from "@/src/application/use-cases/GetDocumentByIdUseCase";
import {
  ExportDocumentUseCase,
  ExportFormat,
} from "@/src/application/use-cases/ExportDocumentUseCase";
import {
  IdeaId,
  UserId,
  DocumentType,
  DocumentId,
  DocumentVersion,
} from "@/src/domain/value-objects";
import { handleApiError } from "../middleware/ErrorMiddleware";
import { authenticateRequest } from "../middleware/AuthMiddleware";
import { DocumentMapper } from "../../database/supabase/mappers/DocumentMapper";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import { logger, LogCategory } from "@/lib/logger";

/**
 * Controller for Document Generator API endpoints
 * Handles HTTP requests for document generation and management
 *
 * Requirements: 2.1, 4.1, 6.1, 8.1, 11.2, 12.1, 12.5, 13.1, 14.1, 21.1, 21.2
 */
export class DocumentGeneratorController {
  private readonly documentMapper = new DocumentMapper();

  constructor(
    private readonly generateDocumentUseCase: GenerateDocumentUseCase,
    private readonly updateDocumentUseCase: UpdateDocumentUseCase,
    private readonly regenerateDocumentUseCase: RegenerateDocumentUseCase,
    private readonly getVersionsUseCase: GetDocumentVersionsUseCase,
    private readonly restoreVersionUseCase: RestoreDocumentVersionUseCase,
    private readonly getDocumentByIdUseCase: GetDocumentByIdUseCase,
    private readonly exportDocumentUseCase: ExportDocumentUseCase
  ) {}

  /**
   * Get a single document by ID
   * GET /api/v2/documents/[documentId]
   *
   * Requirements: 2.1
   */
  async getDocument(
    request: NextRequest,
    { params }: { params: { documentId: string } }
  ): Promise<NextResponse> {
    try {
      // Check feature flag
      if (!this.isFeatureEnabled()) {
        return NextResponse.json(
          { error: "Document generation feature is disabled" },
          { status: 403 }
        );
      }

      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      const userId = UserId.fromString(authResult.userId);
      const documentId = DocumentId.fromString(params.documentId);

      const result = await this.getDocumentByIdUseCase.execute({
        documentId,
        userId,
      });

      if (!result.success) {
        const statusCode = this.mapErrorToStatus(result.error);
        return NextResponse.json(
          { error: result.error?.message || "Failed to retrieve document" },
          { status: statusCode }
        );
      }

      const documentDTO = this.documentMapper.toDTO(result.data.document);
      return NextResponse.json(documentDTO);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Generate a new document using AI
   * POST /api/v2/documents/generate
   *
   * Requirements: 2.1, 4.1, 6.1, 8.1, 21.1, 21.2
   */
  async generateDocument(request: NextRequest): Promise<NextResponse> {
    try {
      // Check feature flag
      if (!this.isFeatureEnabled()) {
        return NextResponse.json(
          { error: "Document generation feature is disabled" },
          { status: 403 }
        );
      }

      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Parse request body
      const body = await request.json();
      const { ideaId, documentType } = body;

      // Validate required fields
      if (!ideaId || typeof ideaId !== "string") {
        return NextResponse.json(
          { error: "ideaId is required" },
          { status: 400 }
        );
      }

      if (!documentType || typeof documentType !== "string") {
        return NextResponse.json(
          { error: "documentType is required" },
          { status: 400 }
        );
      }

      // Validate document type
      const validTypes = ["prd", "technical_design", "architecture", "roadmap"];
      if (!validTypes.includes(documentType)) {
        return NextResponse.json(
          {
            error: `Invalid documentType. Must be one of: ${validTypes.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }

      const userId = UserId.fromString(authResult.userId);
      const ideaIdVO = IdeaId.fromString(ideaId);
      const documentTypeVO = DocumentType.fromString(documentType);

      logger.info(LogCategory.API, "Document generation request received", {
        ideaId,
        documentType,
        userId: authResult.userId,
      });

      // Execute use case
      const result = await this.generateDocumentUseCase.execute({
        ideaId: ideaIdVO,
        userId,
        documentType: documentTypeVO,
      });

      if (!result.success) {
        const statusCode = this.mapErrorToStatus(result.error);
        return NextResponse.json(
          { error: result.error?.message || "Failed to generate document" },
          { status: statusCode }
        );
      }

      // Convert domain entity to DTO
      const documentDTO = this.documentMapper.toDTO(result.data.document);

      return NextResponse.json({ document: documentDTO });
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Update a document's content
   * PUT /api/v2/documents/[documentId]
   *
   * Requirements: 11.2
   */
  async updateDocument(
    request: NextRequest,
    { params }: { params: { documentId: string } }
  ): Promise<NextResponse> {
    try {
      // Check feature flag
      if (!this.isFeatureEnabled()) {
        return NextResponse.json(
          { error: "Document generation feature is disabled" },
          { status: 403 }
        );
      }

      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Parse request body
      const body = await request.json();
      const { content, ideaId, documentType } = body;

      // Validate required fields
      if (!content) {
        return NextResponse.json(
          { error: "content is required" },
          { status: 400 }
        );
      }

      if (!ideaId || typeof ideaId !== "string") {
        return NextResponse.json(
          { error: "ideaId is required" },
          { status: 400 }
        );
      }

      if (!documentType || typeof documentType !== "string") {
        return NextResponse.json(
          { error: "documentType is required" },
          { status: 400 }
        );
      }

      const userId = UserId.fromString(authResult.userId);
      const documentId = DocumentId.fromString(params.documentId);
      const ideaIdVO = IdeaId.fromString(ideaId);
      const documentTypeVO = DocumentType.fromString(documentType);

      logger.info(LogCategory.API, "Document update request received", {
        documentId: params.documentId,
        ideaId,
        documentType,
        userId: authResult.userId,
      });

      // Execute use case
      const result = await this.updateDocumentUseCase.execute({
        documentId,
        ideaId: ideaIdVO,
        documentType: documentTypeVO,
        userId,
        content,
      });

      if (!result.success) {
        const statusCode = this.mapErrorToStatus(result.error);
        return NextResponse.json(
          { error: result.error?.message || "Failed to update document" },
          { status: statusCode }
        );
      }

      // Convert domain entity to DTO
      const documentDTO = this.documentMapper.toDTO(result.data.document);

      return NextResponse.json({ document: documentDTO });
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Regenerate a document using AI
   * POST /api/v2/documents/[documentId]/regenerate
   *
   * Requirements: 13.1
   */
  async regenerateDocument(
    request: NextRequest,
    { params }: { params: { documentId: string } }
  ): Promise<NextResponse> {
    try {
      // Check feature flag
      if (!this.isFeatureEnabled()) {
        return NextResponse.json(
          { error: "Document generation feature is disabled" },
          { status: 403 }
        );
      }

      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Parse request body
      const body = await request.json();
      const { ideaId, documentType } = body;

      // Validate required fields
      if (!ideaId || typeof ideaId !== "string") {
        return NextResponse.json(
          { error: "ideaId is required" },
          { status: 400 }
        );
      }

      if (!documentType || typeof documentType !== "string") {
        return NextResponse.json(
          { error: "documentType is required" },
          { status: 400 }
        );
      }

      const userId = UserId.fromString(authResult.userId);
      const documentId = DocumentId.fromString(params.documentId);
      const ideaIdVO = IdeaId.fromString(ideaId);
      const documentTypeVO = DocumentType.fromString(documentType);

      logger.info(LogCategory.API, "Document regeneration request received", {
        documentId: params.documentId,
        ideaId,
        documentType,
        userId: authResult.userId,
      });

      // Execute use case
      const result = await this.regenerateDocumentUseCase.execute({
        documentId,
        ideaId: ideaIdVO,
        userId,
        documentType: documentTypeVO,
      });

      if (!result.success) {
        const statusCode = this.mapErrorToStatus(result.error);
        return NextResponse.json(
          { error: result.error?.message || "Failed to regenerate document" },
          { status: statusCode }
        );
      }

      // Convert domain entity to DTO
      const documentDTO = this.documentMapper.toDTO(result.data.document);

      return NextResponse.json({ document: documentDTO });
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Get all versions of a document
   * GET /api/v2/documents/[documentId]/versions
   *
   * Requirements: 12.1
   */
  async getVersions(
    request: NextRequest,
    { params }: { params: { documentId: string } }
  ): Promise<NextResponse> {
    try {
      // Check feature flag
      if (!this.isFeatureEnabled()) {
        return NextResponse.json(
          { error: "Document generation feature is disabled" },
          { status: 403 }
        );
      }

      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Get query parameters
      const { searchParams } = new URL(request.url);
      const ideaId = searchParams.get("ideaId");
      const documentType = searchParams.get("documentType");

      // Validate required parameters
      if (!ideaId) {
        return NextResponse.json(
          { error: "ideaId query parameter is required" },
          { status: 400 }
        );
      }

      if (!documentType) {
        return NextResponse.json(
          { error: "documentType query parameter is required" },
          { status: 400 }
        );
      }

      const userId = UserId.fromString(authResult.userId);
      const documentId = DocumentId.fromString(params.documentId);
      const ideaIdVO = IdeaId.fromString(ideaId);
      const documentTypeVO = DocumentType.fromString(documentType);

      logger.info(LogCategory.API, "Get document versions request received", {
        documentId: params.documentId,
        ideaId,
        documentType,
        userId: authResult.userId,
      });

      // Execute use case
      const result = await this.getVersionsUseCase.execute({
        documentId,
        ideaId: ideaIdVO,
        userId,
        documentType: documentTypeVO,
      });

      if (!result.success) {
        const statusCode = this.mapErrorToStatus(result.error);
        return NextResponse.json(
          { error: result.error?.message || "Failed to get document versions" },
          { status: statusCode }
        );
      }

      // Convert domain entities to DTOs
      const versionDTOs = this.documentMapper.toDTOBatch(result.data.versions);

      return NextResponse.json({ versions: versionDTOs });
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Restore a previous version of a document
   * POST /api/v2/documents/[documentId]/versions/[version]/restore
   *
   * Requirements: 12.5
   */
  async restoreVersion(
    request: NextRequest,
    { params }: { params: { documentId: string; version: string } }
  ): Promise<NextResponse> {
    try {
      // Check feature flag
      if (!this.isFeatureEnabled()) {
        return NextResponse.json(
          { error: "Document generation feature is disabled" },
          { status: 403 }
        );
      }

      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Parse request body
      const body = await request.json();
      const { ideaId, documentType } = body;

      // Validate required fields
      if (!ideaId || typeof ideaId !== "string") {
        return NextResponse.json(
          { error: "ideaId is required" },
          { status: 400 }
        );
      }

      if (!documentType || typeof documentType !== "string") {
        return NextResponse.json(
          { error: "documentType is required" },
          { status: 400 }
        );
      }

      // Validate version parameter
      const versionNumber = parseInt(params.version, 10);
      if (isNaN(versionNumber) || versionNumber < 1) {
        return NextResponse.json(
          { error: "Invalid version number" },
          { status: 400 }
        );
      }

      const userId = UserId.fromString(authResult.userId);
      const documentId = DocumentId.fromString(params.documentId);
      const ideaIdVO = IdeaId.fromString(ideaId);
      const documentTypeVO = DocumentType.fromString(documentType);
      const versionVO = DocumentVersion.create(versionNumber);

      logger.info(
        LogCategory.API,
        "Restore document version request received",
        {
          documentId: params.documentId,
          version: versionNumber,
          ideaId,
          documentType,
          userId: authResult.userId,
        }
      );

      // Execute use case
      const result = await this.restoreVersionUseCase.execute({
        documentId,
        ideaId: ideaIdVO,
        userId,
        documentType: documentTypeVO,
        version: versionVO,
      });

      if (!result.success) {
        const statusCode = this.mapErrorToStatus(result.error);
        return NextResponse.json(
          {
            error:
              result.error?.message || "Failed to restore document version",
          },
          { status: statusCode }
        );
      }

      // Convert domain entity to DTO
      const documentDTO = this.documentMapper.toDTO(result.data.document);

      return NextResponse.json({ document: documentDTO });
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Export a document in the specified format
   * GET /api/v2/documents/[documentId]/export
   *
   * Requirements: 14.1
   */
  async exportDocument(
    request: NextRequest,
    { params }: { params: { documentId: string } }
  ): Promise<NextResponse> {
    try {
      // Check feature flag
      if (!this.isFeatureEnabled()) {
        return NextResponse.json(
          { error: "Document generation feature is disabled" },
          { status: 403 }
        );
      }

      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Get query parameters
      const { searchParams } = new URL(request.url);
      const format = searchParams.get("format") as ExportFormat | null;

      // Validate format
      if (!format || !["markdown", "pdf"].includes(format)) {
        return NextResponse.json(
          { error: "format query parameter must be 'markdown' or 'pdf'" },
          { status: 400 }
        );
      }

      const userId = UserId.fromString(authResult.userId);
      const documentId = DocumentId.fromString(params.documentId);

      logger.info(LogCategory.API, "Export document request received", {
        documentId: params.documentId,
        format,
        userId: authResult.userId,
      });

      // Execute use case
      const result = await this.exportDocumentUseCase.execute({
        documentId,
        userId,
        format,
      });

      if (!result.success) {
        const statusCode = this.mapErrorToStatus(result.error);
        return NextResponse.json(
          { error: result.error?.message || "Failed to export document" },
          { status: statusCode }
        );
      }

      const exportData = result.data.export;

      // Return file download response
      return new NextResponse(exportData.content, {
        status: 200,
        headers: {
          "Content-Type": exportData.mimeType,
          "Content-Disposition": `attachment; filename="${exportData.filename}"`,
          "X-Document-Title": exportData.metadata.title,
          "X-Document-Version": exportData.metadata.version.toString(),
          "X-Document-Type": exportData.metadata.documentType,
          "X-Export-Date": exportData.metadata.exportDate,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Check if document generation feature is enabled
   */
  private isFeatureEnabled(): boolean {
    try {
      // Ensure flags are registered in API context
      initFeatureFlags();
      return isEnabled("ENABLE_DOCUMENT_GENERATION");
    } catch (_error) {
      // If flag doesn't exist, default to false
      logger.warn(
        LogCategory.INFRASTRUCTURE,
        "ENABLE_DOCUMENT_GENERATION flag not found, defaulting to false"
      );
      return false;
    }
  }

  /**
   * Map domain errors to HTTP status codes
   */
  private mapErrorToStatus(error: unknown): number {
    if (error && typeof error === "object" && "code" in error) {
      const code = (error as { code?: string }).code;
      if (code === "IDEA_NOT_FOUND" || code === "DOCUMENT_NOT_FOUND") {
        return 404;
      }
      if (code === "UNAUTHORIZED_ACCESS") {
        return 403;
      }
      if (code === "INSUFFICIENT_CREDITS") {
        return 402; // Payment Required
      }
      if (code === "FEATURE_DISABLED") {
        return 403;
      }
    }
    return 400;
  }
}
