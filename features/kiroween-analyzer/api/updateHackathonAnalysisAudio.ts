import { browserSupabase } from "@/lib/supabase/client";
import type { SavedHackathonAnalysesUpdate } from "@/lib/supabase/types";

export async function updateHackathonAnalysisAudio(
  analysisId: string,
  audioBase64: string
): Promise<{ error: string | null }> {
  const supabase = browserSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Authentication required" };
  }

  const updatePayload: SavedHackathonAnalysesUpdate = {
    audio_base64: audioBase64,
  };

  const { error } = await supabase
    .from("saved_hackathon_analyses")
    .update(updatePayload)
    .eq("id", analysisId)
    .eq("user_id", session.user.id);

  if (error) {
    console.error("Failed to update hackathon analysis audio", error);
    return { error: "Failed to save audio. Please try again." };
  }

  return { error: null };
}
