import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";

export const runtime = "nodejs";

/**
 * Regenerate a document using AI
 * POST /api/v2/documents/[documentId]/regenerate
 *
 * Requirements: 13.1
 */
export async function POST(
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
    return await controller.regenerateDocument(request, { params });
  } catch (error) {
    console.error(
      "Error in POST /api/v2/documents/[documentId]/regenerate:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
