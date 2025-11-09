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
}

export async function saveAnalysis(
  params: SaveAnalysisParams
): Promise<{ data: SavedAnalysisRecord | null; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      // Create a mock user for local dev mode
      const mockUser = generateMockUser();

      // Create a new analysis record for local storage
      const analysisRecord: SavedAnalysisRecord = {
        id: crypto.randomUUID(),
        userId: mockUser.id,
        idea: params.idea,
        analysis: params.analysis,
        audioBase64: params.audioBase64 || null,
        createdAt: new Date().toISOString(),
        analysisType: "idea",
      };

      // Save to local storage
      await localStorageService.saveAnalysis(analysisRecord);

      return { data: analysisRecord, error: null };
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
    const response = await fetch('/api/analyze/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea: params.idea,
        analysis: params.analysis,
        audioBase64: params.audioBase64,
        locale: 'en' // Default locale, could be passed as parameter
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error ?? 'Failed to save analysis.');
    }

    const result = await response.json();
    
    // Convert the response to the expected format
    const record: SavedAnalysisRecord = {
      id: result.id,
      userId: result.userId || 'unknown', // Fallback for compatibility
      idea: params.idea,
      analysis: params.analysis,
      audioBase64: params.audioBase64 || null,
      createdAt: result.createdAt || new Date().toISOString(),
      analysisType: "idea",
    };

    return { data: record, error: null };
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
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: params.audioBase64,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error ?? 'Failed to update analysis audio.');
    }

    return { error: null };
  } catch (error) {
    console.error("Failed to update analysis audio", error);
    return { error: "Failed to update audio. Please try again." };
  }
}
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
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { data: null, error: "Analysis not found" };
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error ?? 'Failed to load analysis.');
    }

    const result = await response.json();
    
    // Convert the response to the expected format
    const record: SavedAnalysisRecord = {
      id: result.id,
      userId: result.userId || 'unknown', // Fallback for compatibility
      idea: result.idea,
      analysis: result.analysis || {
        detailedSummary: result.detailedSummary,
        finalScore: result.score,
        // Add other required fields with defaults
        founderQuestions: [],
        swotAnalysis: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        currentMarketTrends: [],
        scoringRubric: result.criteria || [],
        competitors: [],
        monetizationStrategies: [],
        improvementSuggestions: [],
        nextSteps: [],
        finalScoreExplanation: '',
        viabilitySummary: result.detailedSummary
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
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: null,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error ?? 'Failed to clear analysis audio.');
    }

    return { error: null };
  } catch (error) {
    console.error("Failed to clear analysis audio", error);
    return { error: "Failed to clear audio. Please try again." };
  }
}
