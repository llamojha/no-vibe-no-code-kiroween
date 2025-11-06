import { browserSupabase } from "@/lib/supabase/client";
import { mapSavedHackathonAnalysesRow } from "@/lib/supabase/mappers";
import type { SavedHackathonAnalysesRow } from "@/lib/supabase/types";
import type { SavedHackathonAnalysis } from "@/lib/types";

export async function loadUserHackathonAnalyses(): Promise<{
  data: SavedHackathonAnalysis[];
  error: string | null;
}> {
  const supabase = browserSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { data: [], error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("saved_hackathon_analyses")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .returns<SavedHackathonAnalysesRow[]>();

  if (error) {
    console.error("Failed to load user hackathon analyses", error);
    return {
      data: [],
      error: "Failed to load your analyses. Please try again.",
    };
  }

  const records = (data ?? []).map(mapSavedHackathonAnalysesRow);
  return { data: records, error: null };
}
