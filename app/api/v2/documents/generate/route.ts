import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";

export const runtime = "nodejs";

/**
 * Generate a new document using AI
 * POST /api/v2/documents/generate
 *
 * Requirements: 2.1, 4.1, 6.1, 8.1, 21.1, 21.2
 */
export async function POST(request: NextRequest) {
  try {
    // Create fresh Supabase client for this request
    const supabase = serverSupabase();

    // Create service factory with fresh client
    const serviceFactory = ServiceFactory.getInstance(supabase);

    // Create controller
    const controller = serviceFactory.createDocumentGeneratorController();

    // Delegate to controller
    return await controller.generateDocument(request);
  } catch (error) {
    console.error("Error in POST /api/v2/documents/generate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
