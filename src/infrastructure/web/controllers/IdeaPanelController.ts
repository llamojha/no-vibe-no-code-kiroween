import { NextRequest, NextResponse } from "next/server";
import { GetIdeaWithDocumentsUseCase } from "@/src/application/use-cases/GetIdeaWithDocumentsUseCase";
import { UpdateIdeaStatusUseCase } from "@/src/application/use-cases/UpdateIdeaStatusUseCase";
import { SaveIdeaMetadataUseCase } from "@/src/application/use-cases/SaveIdeaMetadataUseCase";
import { GetUserIdeasUseCase } from "@/src/application/use-cases/GetUserIdeasUseCase";
import { IdeaId, UserId } from "@/src/domain/value-objects";
import { handleApiError } from "../middleware/ErrorMiddleware";
import { authenticateRequest } from "../middleware/AuthMiddleware";
import { IdeaMapper } from "../../database/supabase/mappers/IdeaMapper";
import { DashboardIdeaDTO } from "../dto/IdeaDTO";

/**
 * Controller for Idea Panel API endpoints
 * Handles HTTP requests for idea management and delegates to application layer use cases
 */
export class IdeaPanelController {
  private readonly ideaMapper = new IdeaMapper();

  constructor(
    private readonly getIdeaWithDocumentsUseCase: GetIdeaWithDocumentsUseCase,
    private readonly updateStatusUseCase: UpdateIdeaStatusUseCase,
    private readonly saveMetadataUseCase: SaveIdeaMetadataUseCase,
    private readonly getUserIdeasUseCase: GetUserIdeasUseCase
  ) {}

  /**
   * Get all ideas for the current user
   * GET /api/v2/ideas
   */
  async getUserIdeas(request: NextRequest): Promise<NextResponse> {
    try {
      // Authenticate request
      const authResult = await authenticateRequest(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      const userId = UserId.fromString(authResult.userId);

      // Execute use case
      const result = await this.getUserIdeasUseCase.execute({ userId });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error?.message || "Failed to retrieve ideas" },
          { status: 500 }
        );
      }

      // Convert to DashboardIdeaDTO format
      const dashboardIdeas: DashboardIdeaDTO[] = result.data.ideas.map(
        (item) => {
          const ideaDTO = this.ideaMapper.toDTO(item.idea);
          return {
            id: ideaDTO.id,
            ideaText: ideaDTO.ideaText,
            source: ideaDTO.source,
            projectStatus: ideaDTO.projectStatus,
            documentCount: item.documentCount,
            createdAt: ideaDTO.createdAt,
            updatedAt: ideaDTO.updatedAt,
            tags: ideaDTO.tags,
          };
        }
      );

      return NextResponse.json(dashboardIdeas);
    } catch (error) {
      return handleApiError(error);
    }
  }

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
        const statusCode = this.mapErrorToStatus(result.error);
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
        const statusCode = this.mapErrorToStatus(result.error);
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
        const statusCode = this.mapErrorToStatus(result.error);
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

  private mapErrorToStatus(error: unknown): number {
    if (error && typeof error === "object" && "code" in error) {
      const code = (error as { code?: string }).code;
      if (code === "IDEA_NOT_FOUND") {
        return 404;
      }
      if (code === "UNAUTHORIZED_ACCESS") {
        return 403;
      }
    }
    return 400;
  }
}
