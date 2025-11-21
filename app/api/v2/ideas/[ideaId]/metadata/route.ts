import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";

export const runtime = "nodejs";

/**
 * Save idea metadata (notes and tags)
 * PUT /api/v2/ideas/[ideaId]/metadata
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { ideaId: string } }
) {
  try {
    // Create fresh Supabase client for this request
    const supabase = serverSupabase();

    // Create service factory with fresh client
    const serviceFactory = ServiceFactory.getInstance(supabase);

    // Create controller
    const controller = serviceFactory.createIdeaPanelController();

    // Delegate to controller
    return await controller.saveMetadata(request, { params });
  } catch (error) {
    console.error("Error in PUT /api/v2/ideas/[ideaId]/metadata:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
