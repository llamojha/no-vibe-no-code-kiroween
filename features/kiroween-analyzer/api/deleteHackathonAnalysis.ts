import { browserSupabase } from "@/lib/supabase/client";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";

export async function deleteHackathonAnalysis(
  analysisId: string
): Promise<{ error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      const success = await localStorageService.deleteHackathonAnalysis(
        analysisId
      );

      if (!success) {
        return { error: "Analysis not found in local storage" };
      }

      return { error: null };
    } catch (error) {
      console.error(
        "Failed to delete hackathon analysis from local storage",
        error
      );
      return {
        error:
          "Failed to delete analysis from local storage. Please try again.",
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
    const { error } = await supabase
      .from("saved_analyses")
      .delete()
      .eq("id", analysisId)
      .eq("user_id", user.id)
      .eq("analysis_type", "hackathon");

    if (error) {
      console.error("Failed to delete hackathon analysis", error);
      throw new Error("Failed to delete hackathon analysis from database");
    }

    return { error: null };
  } catch (error) {
    console.error("Failed to delete hackathon analysis", error);
    return { error: "Failed to delete analysis. Please try again." };
  }
}
