import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";

export const runtime = "nodejs";

/**
 * Restore a previous version of a document
 * POST /api/v2/documents/[documentId]/versions/[version]/restore
 *
 * Requirements: 12.5
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string; version: string } }
) {
  try {
    // Create fresh Supabase client for this request
    const supabase = serverSupabase();

    // Create service factory with fresh client
    const serviceFactory = ServiceFactory.getInstance(supabase);

    // Create controller
    const controller = serviceFactory.createDocumentGeneratorController();

    // Delegate to controller
    return await controller.restoreVersion(request, { params });
  } catch (error) {
    console.error(
      "Error in POST /api/v2/documents/[documentId]/versions/[version]/restore:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
