import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";

export const runtime = "nodejs";

/**
 * Export a document in the specified format
 * GET /api/v2/documents/[documentId]/export
 *
 * Requirements: 14.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    // Create fresh Supabase client for this request
    const supabase = serverSupabase();

    // Create service factory with fresh client
    const serviceFactory = ServiceFactory.getInstance(supabase);

    // Create controller
    const controller = serviceFactory.createDocumentGeneratorController();

    // Delegate to controller
    return await controller.exportDocument(request, { params });
  } catch (error) {
    console.error("Error in GET /api/v2/documents/[documentId]/export:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
