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

  // Standard Supabase flow for production
  const supabase = browserSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { data: null, error: "Authentication required" };
  }

  try {
    const insertPayload: SavedAnalysesInsert = {
      user_id: session.user.id,
      idea: params.idea,
      analysis: params.analysis as unknown as SavedAnalysesInsert["analysis"],
      audio_base64: params.audioBase64 || null,
    };

    const { data, error } = await supabase
      .from("saved_analyses")
      .insert(insertPayload)
      .select()
      .returns<SavedAnalysesRow>()
      .single();

    if (error || !data) {
      console.error("Failed to save analysis", error);
      throw new Error("Failed to save analysis to database");
    }

    const record = mapSavedAnalysesRow(data);
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

  // Standard Supabase flow for production
  const supabase = browserSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Authentication required" };
  }

  try {
    const { error } = await supabase
      .from("saved_analyses")
      .update({ audio_base64: params.audioBase64 })
      .eq("id", params.analysisId)
      .eq("user_id", session.user.id); // Ensure user can only update their own analyses

    if (error) {
      console.error("Failed to update analysis audio", error);
      throw new Error("Failed to update analysis audio in database");
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

  // Standard Supabase flow for production
  const supabase = browserSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { data: null, error: "Authentication required" };
  }

  try {
    const { data, error } = await supabase
      .from("saved_analyses")
      .select("*")
      .eq("id", analysisId)
      .eq("user_id", session.user.id)
      .returns<SavedAnalysesRow>()
      .single();

    if (error || !data) {
      console.error("Failed to load analysis", error);
      if (error?.code === "PGRST116") {
        return { data: null, error: "Analysis not found" };
      }
      return {
        data: null,
        error: "Failed to load analysis. Please try again.",
      };
    }

    const record = mapSavedAnalysesRow(data);
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

  // Standard Supabase flow for production
  const supabase = browserSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Authentication required" };
  }

  try {
    const { error } = await supabase
      .from("saved_analyses")
      .update({ audio_base64: null })
      .eq("id", analysisId)
      .eq("user_id", session.user.id); // Ensure user can only update their own analyses

    if (error) {
      console.error("Failed to clear analysis audio", error);
      throw new Error("Failed to clear analysis audio in database");
    }

    return { error: null };
  } catch (error) {
    console.error("Failed to clear analysis audio", error);
    return { error: "Failed to clear audio. Please try again." };
  }
}
