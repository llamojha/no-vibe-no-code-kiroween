import type {
  HackathonAnalysis,
  ProjectSubmission,
  SavedHackathonAnalysis,
} from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";
import { generateMockUser } from "@/lib/mockData";

export interface SaveHackathonAnalysisParams {
  projectDescription: string;
  analysis: HackathonAnalysis;
  supportingMaterials?: ProjectSubmission["supportingMaterials"];
  audioBase64?: string;
  ideaId?: string; // Optional: link to existing idea
  source?: "manual" | "frankenstein"; // Optional: source of the idea
}

export interface SaveHackathonAnalysisResult {
  ideaId: string;
  documentId: string;
  createdAt: string;
}

/**
 * Save a hackathon analysis to the ideas and documents tables
 *
 * If ideaId is provided, creates a document linked to the existing idea.
 * If no ideaId, creates a new idea with source='manual' and links the document to it.
 *
 * @param params - SaveHackathonAnalysisParams containing project description, analysis, optional materials, audio, and ideaId
 * @returns Promise resolving to an object with data (ideaId, documentId, createdAt) or error
 *
 * Requirements: 1.3, 1.4, 1.7
 */
export async function saveHackathonAnalysis(
  params: SaveHackathonAnalysisParams
): Promise<{ data: SaveHackathonAnalysisResult | null; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      // Create a mock user for local dev mode
      const mockUser = generateMockUser();

      // Create a new analysis record for local storage (legacy format for compatibility)
      const analysisRecord: SavedHackathonAnalysis = {
        id: crypto.randomUUID(),
        userId: mockUser.id,
        projectDescription: params.projectDescription,
        analysis: params.analysis,
        audioBase64: params.audioBase64 || null,
        supportingMaterials: params.supportingMaterials || undefined,
        createdAt: new Date().toISOString(),
      };

      // Save to local storage
      await localStorageService.saveHackathonAnalysis(analysisRecord);

      // Return new format
      return {
        data: {
          ideaId: params.ideaId || crypto.randomUUID(),
          documentId: analysisRecord.id,
          createdAt: analysisRecord.createdAt,
        },
        error: null,
      };
    } catch (error) {
      console.error(
        "Failed to save hackathon analysis to local storage",
        error
      );
      return {
        data: null,
        error:
          "Failed to save your analysis to local storage. Please try again.",
      };
    }
  }

  // Call server-side API route
  try {
    const response = await fetch("/api/v2/hackathon/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectDescription: params.projectDescription,
        analysis: params.analysis,
        supportingMaterials: params.supportingMaterials,
        audioBase64: params.audioBase64,
        ideaId: params.ideaId,
        source: params.source,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: null,
        error:
          errorData.error || "Failed to save your analysis. Please try again.",
      };
    }

    const result = await response.json();
    return {
      data: {
        ideaId: result.ideaId,
        documentId: result.documentId,
        createdAt: result.createdAt,
      },
      error: null,
    };
  } catch (error) {
    console.error("Failed to save hackathon analysis", error);
    return {
      data: null,
      error: "Failed to save your analysis. Please try again.",
    };
  }
}
