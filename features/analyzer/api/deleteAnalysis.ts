import { browserSupabase } from "@/lib/supabase/client";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";

/**
 * Delete a startup analysis document
 *
 * Tries deleting from documents table first (new data model), then falls back
 * to saved_analyses table for legacy data. Does NOT delete the parent idea.
 *
 * @param analysisId - The ID of the analysis/document to delete
 * @returns Promise resolving to an object with error (null on success)
 *
 * Requirements: 4.1, 4.2, 4.5
 */
export async function deleteAnalysis(
  analysisId: string
): Promise<{ error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      const success = await localStorageService.deleteAnalysis(analysisId);

      if (!success) {
        return { error: "Analysis not found in local storage" };
      }

      return { error: null };
    } catch (error) {
      console.error("Failed to delete analysis from local storage", error);
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
    // Try deleting from documents table first (new data model)
    const { data: documentData, error: documentError } = await supabase
      .from("documents")
      .delete()
      .eq("id", analysisId)
      .eq("user_id", user.id)
      .eq("document_type", "startup_analysis")
      .select();

    // If document was found and deleted, return success
    // Do NOT delete the parent idea - idea can exist without documents
    if (!documentError && documentData && documentData.length > 0) {
      return { error: null };
    }

    // Fallback to saved_analyses table for legacy data
    const { error: legacyError } = await supabase
      .from("saved_analyses")
      .delete()
      .eq("id", analysisId)
      .eq("user_id", user.id)
      .eq("analysis_type", "idea");

    if (legacyError) {
      console.error("Failed to delete analysis", legacyError);
      throw new Error("Failed to delete analysis from database");
    }

    return { error: null };
  } catch (error) {
    console.error("Failed to delete analysis", error);
    return { error: "Failed to delete analysis. Please try again." };
  }
}
