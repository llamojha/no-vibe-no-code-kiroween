import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";
import { IdeaId, UserId } from "@/src/domain/value-objects";
import { authenticateRequest } from "@/src/infrastructure/web/middleware/AuthMiddleware";
import { handleApiError } from "@/src/infrastructure/web/middleware/ErrorMiddleware";
import { isEnabled } from "@/lib/featureFlags";

export const runtime = "nodejs";

/**
 * Get all documents for an idea
 * GET /api/v2/ideas/[ideaId]/documents
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { ideaId: string } }
) {
  try {
    // Check feature flag
    const featureEnabled = isEnabled("ENABLE_IDEA_PANEL");
    if (!featureEnabled) {
      return NextResponse.json(
        { error: "Feature not available" },
        { status: 404 }
      );
    }

    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Create fresh Supabase client for this request
    const supabase = serverSupabase();

    // Create service factory with fresh client
    const serviceFactory = ServiceFactory.getInstance(supabase);

    // Get use case factory
    const useCaseFactory = serviceFactory.getUseCaseFactory();

    // Create use case
    const getDocumentsByIdeaUseCase =
      useCaseFactory.createGetDocumentsByIdeaUseCase();

    const userId = UserId.fromString(authResult.userId);
    const ideaId = IdeaId.fromString(params.ideaId);

    // Execute use case
    const result = await getDocumentsByIdeaUseCase.execute({
      ideaId,
      userId,
    });

    if (!result.success) {
      const errorCode =
        result.error && typeof result.error === "object"
          ? (result.error as { code?: string }).code
          : undefined;
      const statusCode =
        errorCode === "IDEA_NOT_FOUND"
          ? 404
          : errorCode === "UNAUTHORIZED_ACCESS"
          ? 403
          : 400;
      return NextResponse.json(
        { error: result.error?.message || "Failed to retrieve documents" },
        { status: statusCode }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}
