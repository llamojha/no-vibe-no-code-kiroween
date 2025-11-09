import { browserSupabase } from "@/lib/supabase/client";
import { mapSavedHackathonAnalysesRow } from "@/lib/supabase/mappers";
import type { SavedAnalysesRow } from "@/lib/supabase/types";
import type { SavedHackathonAnalysis } from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";

export async function loadUserHackathonAnalyses(): Promise<{
  data: SavedHackathonAnalysis[];
  error: string | null;
}> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      const analyses = await localStorageService.loadHackathonAnalyses();

      // Sort by creation date (newest first) to match Supabase behavior
      const sortedAnalyses = analyses.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return { data: sortedAnalyses, error: null };
    } catch (error) {
      console.error(
        "Failed to load hackathon analyses from local storage",
        error
      );
      return {
        data: [],
        error: "Failed to load analyses from local storage. Please try again.",
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
    return { data: [], error: "Authentication required" };
  }

  try {
    const { data, error } = await supabase
      .from("saved_analyses")
      .select("*")
      .eq("user_id", user.id)
      .eq("analysis_type", "hackathon")
      .order("created_at", { ascending: false })
      .returns<SavedAnalysesRow[]>();

    if (error) {
      console.error("Failed to load user hackathon analyses", error);
      throw new Error("Failed to load user hackathon analyses from database");
    }

    const records = (data ?? []).map(mapSavedHackathonAnalysesRow);
    return { data: records, error: null };
  } catch (error) {
    console.error("Failed to load user hackathon analyses", error);
    return {
      data: [],
      error: "Failed to load your analyses. Please try again.",
    };
  }
}
