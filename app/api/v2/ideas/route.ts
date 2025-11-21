import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { RepositoryFactory } from "@/src/infrastructure/factories/RepositoryFactory";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";
import { UseCaseFactory } from "@/src/infrastructure/factories/UseCaseFactory";
import { IdeaPanelController } from "@/src/infrastructure/web/controllers/IdeaPanelController";

export const runtime = "nodejs";

/**
 * Get list of user's ideas
 * GET /api/v2/ideas
 */
export async function GET(request: NextRequest) {
  try {
    // Create fresh Supabase client for this request
    const supabase = serverSupabase();

    // Create service factory with fresh client
    const serviceFactory = ServiceFactory.getInstance(supabase);

    // Create controller
    const controller = serviceFactory.createIdeaPanelController();

    // For now, return not implemented
    // This will be implemented when we add the GetUserIdeasUseCase handler
    return NextResponse.json(
      { error: "List ideas endpoint not yet implemented" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error in GET /api/v2/ideas:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Create a new idea
 * POST /api/v2/ideas
 */
export async function POST(_request: NextRequest) {
  // This will be implemented when we add idea creation functionality
  return NextResponse.json(
    { error: "Create idea endpoint not yet implemented" },
    { status: 501 }
  );
}
