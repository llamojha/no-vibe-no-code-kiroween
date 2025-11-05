import { browserSupabase } from "@/lib/supabase/client";

export async function deleteHackathonAnalysis(
  analysisId: string
): Promise<{ error: string | null }> {
  const supabase = browserSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Authentication required" };
  }

  const { error } = await supabase
    .from("saved_hackathon_analyses")
    .delete()
    .eq("id", analysisId)
    .eq("user_id", session.user.id);

  if (error) {
    console.error("Failed to delete hackathon analysis", error);
    return { error: "Failed to delete analysis. Please try again." };
  }

  return { error: null };
}
