import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";
import { Idea } from "@/src/domain/entities/Idea";
import { Document, DocumentContent } from "@/src/domain/entities/Document";
import {
  IdeaId,
  UserId,
  IdeaSource,
  DocumentType,
} from "@/src/domain/value-objects";
import { logger, LogCategory } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info(
      LogCategory.API,
      "POST /api/v2/hackathon/save - Saving hackathon analysis",
      {
        method: "POST",
        path: "/api/v2/hackathon/save",
      }
    );

    // Get authenticated user
    const supabase = serverSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      projectDescription,
      analysis,
      supportingMaterials,
      audioBase64,
      ideaId,
    } = body;

    if (!projectDescription || !analysis) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userId = UserId.fromString(user.id);

    // Get repositories from service factory
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const repositoryFactory = serviceFactory.getRepositoryFactory();
    const ideaRepository = repositoryFactory.createIdeaRepository();
    const documentRepository = repositoryFactory.createDocumentRepository();

    let idea: Idea;

    // Check if ideaId is provided
    if (ideaId) {
      // Load existing idea
      const ideaIdVO = IdeaId.fromString(ideaId);
      const ideaResult = await ideaRepository.findById(ideaIdVO, userId);

      if (!ideaResult.success || !ideaResult.data) {
        return NextResponse.json(
          { error: "Idea not found or you don't have permission to access it" },
          { status: 404 }
        );
      }

      idea = ideaResult.data;
    } else {
      // Create new idea with source='manual'
      idea = Idea.create({
        userId,
        ideaText: projectDescription,
        source: IdeaSource.MANUAL,
      });

      const saveIdeaResult = await ideaRepository.save(idea);

      if (!saveIdeaResult.success) {
        logger.error(
          LogCategory.API,
          "Failed to create idea",
          saveIdeaResult.error
        );
        return NextResponse.json(
          { error: "Failed to create idea. Please try again." },
          { status: 500 }
        );
      }

      idea = saveIdeaResult.data;
    }

    // Create document linked to idea. Normalize the hackathon analysis payload so
    // that the fields expected by Document.validateHackathonAnalysisContent live
    // at the top level instead of nested inside `analysis`.
    const normalizedAnalysisContent = normalizeHackathonDocumentContent(analysis);

    const documentContent = {
      ...normalizedAnalysisContent,
      projectDescription,
      supportingMaterials: supportingMaterials || {},
      audioBase64: audioBase64 || null,
    };

    const document = Document.create({
      ideaId: idea.id,
      userId,
      documentType: DocumentType.HACKATHON_ANALYSIS,
      content: documentContent,
    });

    const saveDocumentResult = await documentRepository.save(document);

    if (!saveDocumentResult.success) {
      logger.error(
        LogCategory.API,
        "Failed to create document",
        saveDocumentResult.error
      );
      return NextResponse.json(
        {
          error: ideaId
            ? "Idea exists but failed to save analysis. Please try again."
            : "Idea created but failed to save analysis. Please try analyzing again from the Idea Panel.",
        },
        { status: 500 }
      );
    }

    const savedDocument = saveDocumentResult.data;

    const duration = Date.now() - startTime;
    logger.info(LogCategory.API, "POST /api/v2/hackathon/save - Completed", {
      statusCode: 200,
      duration,
      ideaId: idea.id.value,
      documentId: savedDocument.id.value,
    });

    return NextResponse.json({
      ideaId: idea.id.value,
      documentId: savedDocument.id.value,
      createdAt: savedDocument.createdAt.toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(LogCategory.API, "POST /api/v2/hackathon/save - Failed", {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    const message =
      error instanceof Error
        ? error.message
        : "Failed to save hackathon analysis.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function normalizeHackathonDocumentContent(
  content: unknown
): DocumentContent {
  let normalized: unknown = content;

  if (
    normalized &&
    typeof normalized === "object" &&
    "success" in normalized &&
    "data" in normalized &&
    (normalized as { data?: unknown }).data
  ) {
    normalized = (normalized as { data: unknown }).data;
  }

  if (
    normalized &&
    typeof normalized === "object" &&
    "analysis" in normalized &&
    (normalized as { analysis?: unknown }).analysis &&
    typeof (normalized as { analysis?: unknown }).analysis === "object"
  ) {
    return (normalized as { analysis: DocumentContent }).analysis;
  }

  if (normalized && typeof normalized === "object") {
    return normalized as DocumentContent;
  }

  return {};
}
