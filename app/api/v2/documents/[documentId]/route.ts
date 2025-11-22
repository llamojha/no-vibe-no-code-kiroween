import { NextRequest, NextResponse } from "next/server";
import { NextJSBootstrap } from "@/src/infrastructure/bootstrap/nextjs";
import { DocumentId, UserId } from "@/src/domain/value-objects";

/**
 * GET /api/v2/documents/[documentId]
 *
 * Retrieves a single document by ID.
 * Used when viewing reports from the idea panel.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    await NextJSBootstrap.initialize();
    const serviceFactory = await NextJSBootstrap.getServiceFactory();
    const documentRepository = serviceFactory
      .getRepositoryFactory()
      .createDocumentRepository();

    // Get authenticated user
    const { serverSupabase } = await import("@/lib/supabase/server");
    const supabase = serverSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Load document
    const documentId = DocumentId.fromString(params.documentId);
    const userId = UserId.fromString(user.id);
    const result = await documentRepository.findById(documentId, userId);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Convert to DTO
    const { DocumentMapper } = await import(
      "@/src/infrastructure/database/supabase/mappers/DocumentMapper"
    );
    const mapper = new DocumentMapper();
    const dto = mapper.toDTO(result.data);

    return NextResponse.json(dto);
  } catch (error) {
    console.error("Failed to load document:", error);
    return NextResponse.json(
      { error: "Failed to load document. Please try again." },
      { status: 500 }
    );
  }
}
