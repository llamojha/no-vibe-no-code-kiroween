import { browserSupabase } from "@/lib/supabase/client";
import { mapSavedHackathonAnalysesRow } from "@/lib/supabase/mappers";
import type { SavedHackathonAnalysesRow } from "@/lib/supabase/types";
import type { SavedHackathonAnalysis } from "@/lib/types";

export async function loadHackathonAnalysis(
  analysisId: string
): Promise<{ data: SavedHackathonAnalysis | null; error: string | null }> {
  const supabase = browserSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { data: null, error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("saved_hackathon_analyses")
    .select("*")
    .eq("id", analysisId)
    .eq("user_id", session.user.id)
    .returns<SavedHackathonAnalysesRow>()
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
}
