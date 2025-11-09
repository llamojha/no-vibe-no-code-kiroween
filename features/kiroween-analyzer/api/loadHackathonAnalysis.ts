import { browserSupabase } from "@/lib/supabase/client";
import { mapSavedHackathonAnalysesRow } from "@/lib/supabase/mappers";
import type { SavedAnalysesRow } from "@/lib/supabase/types";
import type { SavedHackathonAnalysis } from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";

export async function loadHackathonAnalysis(
  analysisId: string
): Promise<{ data: SavedHackathonAnalysis | null; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      const analysis = await localStorageService.getHackathonAnalysis(
        analysisId
      );

      if (!analysis) {
        return { data: null, error: "Analysis not found in local storage" };
      }

      return { data: analysis, error: null };
    } catch (error) {
      console.error(
        "Failed to load hackathon analysis from local storage",
        error
      );
      return {
        data: null,
        error: "Failed to load analysis from local storage. Please try again.",
      };
    }
  }

  // Standard Supabase flow for production
  const supabase = browserSupabase();

  // Use getUser() for secure authentication validation
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: "Authentication required" };
  }

  try {
    const { data, error } = await supabase
      .from("saved_analyses")
      .select("*")
      .eq("id", analysisId)
      .eq("user_id", user.id)
      .eq("analysis_type", "hackathon")
      .returns<SavedAnalysesRow>()
      .single();

    if (error || !data) {
      console.error("Failed to load hackathon analysis", error);
      if (error?.code === "PGRST116") {
        return { data: null, error: "Analysis not found" };
      }
      return {
        data: null,
        error: "Unable to load the analysis. It may have been removed.",
      };
    }

    const record = mapSavedHackathonAnalysesRow(data);
    return { data: record, error: null };
  } catch (error) {
    console.error("Failed to load hackathon analysis", error);
    return {
      data: null,
      error: "Unable to load the analysis. Please try again.",
    };
  }
}
