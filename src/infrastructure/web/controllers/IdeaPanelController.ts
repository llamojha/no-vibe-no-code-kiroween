import { NextRequest, NextResponse } from "next/server";
import { GetIdeaWithDocumentsUseCase } from "@/src/application/use-cases/GetIdeaWithDocumentsUseCase";
import { UpdateIdeaStatusUseCase } from "@/src/application/use-cases/UpdateIdeaStatusUseCase";
import { SaveIdeaMetadataUseCase } from "@/src/application/use-cases/SaveIdeaMetadataUseCase";
import { IdeaId, UserId } from "@/src/domain/value-objects";
import { handleApiError } from "../middleware/ErrorMiddleware";
import { authenticateRequest } from "../middleware/AuthMiddleware";

/**
 * Controller for Idea Panel API endpoints
 * Handles HTTP requests for idea management and delegates to application layer use cases
 */
export class IdeaPanelController {
  constructor(
    private readonly getIdeaWithDocumentsUseCase: GetIdeaWithDocumentsUseCase,
    private readonly updateStatusUseCase: UpdateIdeaStatusUseCase,
    private readonly saveMetadataUseCase: SaveIdeaMetadataUseCase
  ) {}

  /**
   * Get idea with all associated documents
   * GET /api/v2/ideas/[ideaId]
   */
  async getIdeaPanel(
    request: NextRequest,
    { params }: { params: { ideaId: string } }
  ): Promise<NextResponse> {
    try {
      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      const userId = UserId.fromString(authResult.userId);
      const ideaId = IdeaId.fromString(params.ideaId);

      // Execute use case
      const result = await this.getIdeaWithDocumentsUseCase.execute({
        ideaId,
        userId,
      });

      if (!result.success) {
        const error = result.error as any;
        const statusCode =
          error?.code === "IDEA_NOT_FOUND"
            ? 404
            : error?.code === "UNAUTHORIZED_ACCESS"
            ? 403
            : 400;
        return NextResponse.json(
          { error: result.error?.message || "Failed to retrieve idea" },
          { status: statusCode }
        );
      }

      return NextResponse.json(result.data);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Update idea status
   * PUT /api/v2/ideas/[ideaId]/status
   */
  async updateStatus(
    request: NextRequest,
    { params }: { params: { ideaId: string } }
  ): Promise<NextResponse> {
    try {
      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Parse request body
      const body = await request.json();
      const { status } = body;

      if (!status) {
        return NextResponse.json(
          { error: "Status is required" },
          { status: 400 }
        );
      }

      // Validate status value
      const validStatuses = ["idea", "in_progress", "completed", "archived"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${validStatuses.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }

      const userId = UserId.fromString(authResult.userId);
      const ideaId = IdeaId.fromString(params.ideaId);

      // Execute use case
      const result = await this.updateStatusUseCase.execute({
        ideaId,
        userId,
        newStatus: status,
      });

      if (!result.success) {
        const error = result.error as any;
        const statusCode =
          error?.code === "IDEA_NOT_FOUND"
            ? 404
            : error?.code === "UNAUTHORIZED_ACCESS"
            ? 403
            : 400;
        return NextResponse.json(
          { error: result.error?.message || "Failed to update status" },
          { status: statusCode }
        );
      }

      return NextResponse.json({ message: "Status updated successfully" });
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Save idea metadata (notes and tags)
   * PUT /api/v2/ideas/[ideaId]/metadata
   */
  async saveMetadata(
    request: NextRequest,
    { params }: { params: { ideaId: string } }
  ): Promise<NextResponse> {
    try {
      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Parse request body
      const body = await request.json();
      const { notes, tags } = body;

      // At least one field must be provided
      if (notes === undefined && tags === undefined) {
        return NextResponse.json(
          { error: "At least one of notes or tags must be provided" },
          { status: 400 }
        );
      }

      // Validate tags if provided
      if (tags !== undefined && !Array.isArray(tags)) {
        return NextResponse.json(
          { error: "Tags must be an array" },
          { status: 400 }
        );
      }

      const userId = UserId.fromString(authResult.userId);
      const ideaId = IdeaId.fromString(params.ideaId);

      // Execute use case
      const result = await this.saveMetadataUseCase.execute({
        ideaId,
        userId,
        notes,
        tags,
      });

      if (!result.success) {
        const error = result.error as any;
        const statusCode =
          error?.code === "IDEA_NOT_FOUND"
            ? 404
            : error?.code === "UNAUTHORIZED_ACCESS"
            ? 403
            : 400;
        return NextResponse.json(
          { error: result.error?.message || "Failed to save metadata" },
          { status: statusCode }
        );
      }

      return NextResponse.json({ message: "Metadata saved successfully" });
    } catch (error) {
      return handleApiError(error);
    }
  }
}
