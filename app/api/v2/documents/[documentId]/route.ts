import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";

export const runtime = "nodejs";

/**
 * Get a document by ID
 * GET /api/v2/documents/[documentId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const controller = serviceFactory.createDocumentGeneratorController();

    return await controller.getDocument(request, { params });
  } catch (error) {
    console.error("Error in GET /api/v2/documents/[documentId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Update a document's content
 * PUT /api/v2/documents/[documentId]
 *
 * Requirements: 11.2
 */
export async function PUT(
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
    return await controller.updateDocument(request, { params });
  } catch (error) {
    console.error("Error in PUT /api/v2/documents/[documentId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
