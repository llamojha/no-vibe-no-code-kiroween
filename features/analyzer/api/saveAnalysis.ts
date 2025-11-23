import { browserSupabase } from "@/lib/supabase/client";
import { mapSavedAnalysesRow } from "@/lib/supabase/mappers";
import type {
  SavedAnalysesInsert,
  SavedAnalysesRow,
} from "@/lib/supabase/types";
import type { Analysis, SavedAnalysisRecord } from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";
import { generateMockUser } from "@/lib/mockData";

export interface SaveAnalysisParams {
  idea: string;
  analysis: Analysis;
  audioBase64?: string;
  ideaId?: string; // Optional: link to existing idea
}

export interface SaveAnalysisResult {
  ideaId: string;
  documentId: string;
  createdAt: string;
}

/**
 * Save a startup analysis to the ideas and documents tables
 *
 * If ideaId is provided, creates a document linked to the existing idea.
 * If no ideaId, creates a new idea with source='manual' and links the document to it.
 *
 * @param params - SaveAnalysisParams containing idea text, analysis, optional audio, and optional ideaId
 * @returns Promise resolving to an object with data (ideaId, documentId, createdAt) or error
 *
 * Requirements: 1.1, 1.2, 1.7
 */
export async function saveAnalysis(
  params: SaveAnalysisParams
): Promise<{ data: SaveAnalysisResult | null; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      // Create a mock user for local dev mode
      const mockUser = generateMockUser();

      // Generate IDs for idea and document
      const ideaId = params.ideaId || crypto.randomUUID();
      const documentId = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      // Create a new analysis record for local storage (legacy format for compatibility)
      const analysisRecord: SavedAnalysisRecord = {
        id: documentId,
        userId: mockUser.id,
        idea: params.idea,
        analysis: params.analysis,
        audioBase64: params.audioBase64 || null,
        createdAt,
        analysisType: "idea",
      };

      // Save to local storage
      await localStorageService.saveAnalysis(analysisRecord);

      // Return new format with ideaId and documentId
      return {
        data: {
          ideaId,
          documentId,
          createdAt,
        },
        error: null,
      };
    } catch (error) {
      console.error("Failed to save analysis to local storage", error);
      return {
        data: null,
        error:
          "Failed to save your analysis to local storage. Please try again.",
      };
    }
  }

  // Use new hexagonal architecture API endpoints
  try {
    // Build URL with ideaId parameter if provided
    const url = params.ideaId
      ? `/api/analyze/save?ideaId=${encodeURIComponent(params.ideaId)}`
      : "/api/analyze/save";

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idea: params.idea,
        analysis: params.analysis,
        audioBase64: params.audioBase64,
        locale: "en", // Default locale, could be passed as parameter
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error ?? "Failed to save analysis.");
    }

    const result = await response.json();

    // The backend now returns ideaId and documentId from SaveAnalysisToIdeaPanelUseCase
    // Extract them from the response
    const ideaId = result.ideaId || result.id; // Fallback to result.id for compatibility
    const documentId = result.documentId || result.id;
    const createdAt = result.createdAt || new Date().toISOString();

    return {
      data: {
        ideaId,
        documentId,
        createdAt,
      },
      error: null,
    };
  } catch (error) {
    console.error("Failed to save analysis", error);
    return {
      data: null,
      error: "Failed to save your analysis. Please try again.",
    };
  }
}

export interface UpdateAnalysisAudioParams {
  analysisId: string;
  audioBase64: string;
}

/**
 * Update the audio for a startup analysis
 *
 * Updates the audio_base64 field. Tries documents table first, then falls back
 * to saved_analyses table for legacy data.
 *
 * @param params - UpdateAnalysisAudioParams containing analysisId and audioBase64
 * @returns Promise resolving to an object with error (null on success)
 *
 * Requirements: 3.1, 3.2
 */
export async function updateAnalysisAudio(
  params: UpdateAnalysisAudioParams
): Promise<{ error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      // Get the existing analysis from local storage
      const existingAnalysis = await localStorageService.getAnalysis(
        params.analysisId
      );

      if (!existingAnalysis) {
        return { error: "Analysis not found in local storage" };
      }

      // Update the audio and save back to local storage
      const updatedAnalysis: SavedAnalysisRecord = {
        ...existingAnalysis,
        audioBase64: params.audioBase64,
      };

      await localStorageService.saveAnalysis(updatedAnalysis);
      return { error: null };
    } catch (error) {
      console.error("Failed to update analysis audio in local storage", error);
      return {
        error: "Failed to update audio in local storage. Please try again.",
      };
    }
  }

  // Use new hexagonal architecture API endpoints
  try {
    const response = await fetch(`/api/analyze/${params.analysisId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audioBase64: params.audioBase64,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error ?? "Failed to update analysis audio.");
    }

    return { error: null };
  } catch (error) {
    console.error("Failed to update analysis audio", error);
    return { error: "Failed to update audio. Please try again." };
  }
}

/**
 * Load a single startup analysis by ID
 *
 * Tries loading from documents table first, then falls back to saved_analyses
 * table for legacy data.
 *
 * @param analysisId - The ID of the analysis to load
 * @returns Promise resolving to an object with data (SavedAnalysisRecord) or error
 *
 * Requirements: 2.1, 2.2
 */
export async function loadAnalysis(
  analysisId: string
): Promise<{ data: SavedAnalysisRecord | null; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      const analysis = await localStorageService.getAnalysis(analysisId);

      if (!analysis) {
        return { data: null, error: "Analysis not found in local storage" };
      }

      return { data: analysis, error: null };
    } catch (error) {
      console.error("Failed to load analysis from local storage", error);
      return {
        data: null,
        error: "Failed to load analysis from local storage. Please try again.",
      };
    }
  }

  // Use new hexagonal architecture API endpoints
  try {
    const response = await fetch(`/api/analyze/${analysisId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { data: null, error: "Analysis not found" };
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error ?? "Failed to load analysis.");
    }

    const result = await response.json();

    // Convert the response to the expected format
    const record: SavedAnalysisRecord = {
      id: result.id,
      userId: result.userId || "unknown", // Fallback for compatibility
      idea: result.idea,
      analysis: result.analysis || {
        detailedSummary: result.detailedSummary,
        finalScore: result.score,
        // Add other required fields with defaults
        founderQuestions: [],
        swotAnalysis: {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: [],
        },
        currentMarketTrends: [],
        scoringRubric: result.criteria || [],
        competitors: [],
        monetizationStrategies: [],
        improvementSuggestions: [],
        nextSteps: [],
        finalScoreExplanation: "",
        viabilitySummary: result.detailedSummary,
      },
      audioBase64: result.audioBase64 || null,
      createdAt: result.createdAt,
      analysisType: "idea",
    };

    return { data: record, error: null };
  } catch (error) {
    console.error("Failed to load analysis", error);
    return {
      data: null,
      error: "Failed to load analysis. Please try again.",
    };
  }
}

/**
 * Clear the audio for a startup analysis
 *
 * Sets the audio_base64 field to null. Tries documents table first, then falls back
 * to saved_analyses table for legacy data.
 *
 * @param analysisId - The ID of the analysis to clear audio from
 * @returns Promise resolving to an object with error (null on success)
 *
 * Requirements: 3.1, 3.2
 */
export async function clearAnalysisAudio(
  analysisId: string
): Promise<{ error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      // Get the existing analysis from local storage
      const existingAnalysis = await localStorageService.getAnalysis(
        analysisId
      );

      if (!existingAnalysis) {
        return { error: "Analysis not found in local storage" };
      }

      // Clear the audio and save back to local storage
      const updatedAnalysis: SavedAnalysisRecord = {
        ...existingAnalysis,
        audioBase64: null,
      };

      await localStorageService.saveAnalysis(updatedAnalysis);
      return { error: null };
    } catch (error) {
      console.error("Failed to clear analysis audio in local storage", error);
      return {
        error: "Failed to clear audio in local storage. Please try again.",
      };
    }
  }

  // Use new hexagonal architecture API endpoints
  try {
    const response = await fetch(`/api/analyze/${analysisId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audioBase64: null,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error ?? "Failed to clear analysis audio.");
    }

    return { error: null };
  } catch (error) {
    console.error("Failed to clear analysis audio", error);
    return { error: "Failed to clear audio. Please try again." };
  }
}
