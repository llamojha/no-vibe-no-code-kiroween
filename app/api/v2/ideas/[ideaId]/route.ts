import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import { generateMockIdeaPanel } from "@/lib/mockData";

export const runtime = "nodejs";

/**
 * Get idea with all associated documents
 * GET /api/v2/ideas/[ideaId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { ideaId: string } }
) {
  try {
    // Initialize feature flags
    initFeatureFlags();
    const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

    // In local dev mode, return mock data
    if (isLocalDevMode) {
      const mockData = generateMockIdeaPanel(params.ideaId);

      if (!mockData) {
        return NextResponse.json({ error: "Idea not found" }, { status: 404 });
      }

      return NextResponse.json(mockData);
    }

    // Create fresh Supabase client for this request
    const supabase = serverSupabase();

    // Create service factory with fresh client
    const serviceFactory = ServiceFactory.getInstance(supabase);

    // Create controller
    const controller = serviceFactory.createIdeaPanelController();

    // Delegate to controller
    return await controller.getIdeaPanel(request, { params });
  } catch (error) {
    console.error("Error in GET /api/v2/ideas/[ideaId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Delete idea and all associated documents
 * DELETE /api/v2/ideas/[ideaId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { ideaId: string } }
) {
  try {
    // Initialize feature flags
    initFeatureFlags();
    const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

    // In local dev mode, mock deletion
    if (isLocalDevMode) {
      return NextResponse.json({ message: "Idea deleted successfully (mock)" });
    }

    // Create fresh Supabase client for this request
    const supabase = serverSupabase();

    // Create service factory with fresh client
    const serviceFactory = ServiceFactory.getInstance(supabase);

    // Create controller
    const controller = serviceFactory.createIdeaPanelController();

    // Delegate to controller
    return await controller.deleteIdea(request, { params });
  } catch (error) {
    console.error("Error in DELETE /api/v2/ideas/[ideaId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
