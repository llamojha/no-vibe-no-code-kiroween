import { browserSupabase } from "@/lib/supabase/client";
import { mapSavedHackathonAnalysesRow } from "@/lib/supabase/mappers";
import type { SavedAnalysesRow } from "@/lib/supabase/types";
import type { SavedHackathonAnalysis } from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";

/**
 * Load all hackathon analyses for the current user
 *
 * New behavior: Loads from ideas table with document counts, filtering for ideas
 * with hackathon_analysis documents. UsOIN with GROUP BY to avoid N+1 queries.
 *
 * Legacy behavior: Falls back to saved_analyses table for backward compatibility
 * when no documents are found in the new tables.
 */
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
    // NEW: Load from ideas + documents tables with JOIN to get document counts
    // Filter for ideas that have at least one hackathon_analysis document
    type IdeaWithDocuments = {
      id: string;
      user_id: string;
      idea_text: string;
      source: string;
      project_status: string;
      notes: string;
      tags: string[];
      created_at: string;
      updated_at: string;
      documents: Array<{
        id: string;
        document_type: string;
        title: string | null;
        content: any;
        created_at: string;
        updated_at: string;
      }>;
    };

    const { data: ideasWithDocs, error: newError } = await supabase
      .from("ideas")
      .select(
        `
        id,
        user_id,
        idea_text,
        source,
        project_status,
        notes,
        tags,
        created_at,
        updated_at,
        documents!inner(
          id,
          document_type,
          title,
          content,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", user.id)
      .eq("documents.document_type", "hackathon_analysis")
      .order("updated_at", { ascending: false });

    if (newError) {
      console.error(
        "Failed to load hackathon analyses from new tables",
        newError
      );
      // Fall through to legacy fallback
    } else if (ideasWithDocs && ideasWithDocs.length > 0) {
      // Transform new data structure to SavedHackathonAnalysis format
      const analyses: SavedHackathonAnalysis[] = [];

      for (const ideaRow of ideasWithDocs as IdeaWithDocuments[]) {
        // Each idea may have multiple documents, but we only want hackathon_analysis ones
        const hackathonDocs = Array.isArray(ideaRow.documents)
          ? ideaRow.documents.filter(
              (doc: any) => doc.document_type === "hackathon_analysis"
            )
          : [];

        for (const doc of hackathonDocs) {
          const content = doc.content as any;
          analyses.push({
            id: doc.id,
            userId: ideaRow.user_id,
            projectDescription: content.projectDescription || ideaRow.idea_text,
            analysis: content.analysis || {},
            supportingMaterials: content.supportingMaterials || {},
            audioBase64: content.audioBase64,
            createdAt: doc.created_at,
          });
        }
      }

      // Sort by creation date (newest first)
      analyses.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return { data: analyses, error: null };
    }

    // LEGACY FALLBACK: Load from saved_analyses table for backward compatibility
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
