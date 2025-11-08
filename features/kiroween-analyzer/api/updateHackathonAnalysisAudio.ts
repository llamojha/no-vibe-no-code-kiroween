import { browserSupabase } from "@/lib/supabase/client";
import type { SavedHackathonAnalysesUpdate } from "@/lib/supabase/types";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";
import type { SavedHackathonAnalysis } from "@/lib/types";

export async function updateHackathonAnalysisAudio(
  analysisId: string,
  audioBase64: string
): Promise<{ error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      // Get the existing analysis from local storage
      const existingAnalysis = await localStorageService.getHackathonAnalysis(
        analysisId
      );

      if (!existingAnalysis) {
        return { error: "Hackathon analysis not found in local storage" };
      }

      // Update the audio and save back to local storage
      const updatedAnalysis: SavedHackathonAnalysis = {
        ...existingAnalysis,
        audioBase64: audioBase64,
      };

      await localStorageService.saveHackathonAnalysis(updatedAnalysis);
      return { error: null };
    } catch (error) {
      console.error(
        "Failed to update hackathon analysis audio in local storage",
        error
      );
      return {
        error: "Failed to update audio in local storage. Please try again.",
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
    return { error: "Authentication required" };
  }

  try {
    const updatePayload: SavedHackathonAnalysesUpdate = {
      audio_base64: audioBase64,
    };

    const { error } = await supabase
      .from("saved_hackathon_analyses")
      .update(updatePayload)
      .eq("id", analysisId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to update hackathon analysis audio", error);
      throw new Error("Failed to update hackathon analysis audio in database");
    }

    return { error: null };
  } catch (error) {
    console.error("Failed to update hackathon analysis audio", error);
    return { error: "Failed to save audio. Please try again." };
  }
}
