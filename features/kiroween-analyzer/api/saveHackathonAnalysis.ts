import { browserSupabase } from "@/lib/supabase/client";
import { mapSavedHackathonAnalysesRow } from "@/lib/supabase/mappers";
import type {
  SavedHackathonAnalysesInsert,
  SavedHackathonAnalysesRow,
} from "@/lib/supabase/types";
import type {
  HackathonAnalysis,
  ProjectSubmission,
  SavedHackathonAnalysis,
} from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";
import { generateMockUser } from "@/lib/mockData";

export interface SaveHackathonAnalysisParams {
  projectDescription: string;
  analysis: HackathonAnalysis;
  supportingMaterials?: ProjectSubmission["supportingMaterials"];
  audioBase64?: string;
}

export async function saveHackathonAnalysis(
  params: SaveHackathonAnalysisParams
): Promise<{ data: SavedHackathonAnalysis | null; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      // Create a mock user for local dev mode
      const mockUser = generateMockUser();

      // Create a new analysis record for local storage
      const analysisRecord: SavedHackathonAnalysis = {
        id: crypto.randomUUID(),
        userId: mockUser.id,
        projectDescription: params.projectDescription,
        analysis: params.analysis,
        audioBase64: params.audioBase64 || null,
        supportingMaterials: params.supportingMaterials || undefined,
        createdAt: new Date().toISOString(),
      };

      // Save to local storage
      await localStorageService.saveHackathonAnalysis(analysisRecord);

      return { data: analysisRecord, error: null };
    } catch (error) {
      console.error(
        "Failed to save hackathon analysis to local storage",
        error
      );
      return {
        data: null,
        error:
          "Failed to save your analysis to local storage. Please try again.",
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
    const insertPayload: SavedHackathonAnalysesInsert = {
      user_id: user.id,
      project_description: params.projectDescription,
      // Provide default values for deprecated database columns (to be removed in future migration)
      selected_category: "resurrection",
      kiro_usage: "",
      analysis:
        params.analysis as unknown as SavedHackathonAnalysesInsert["analysis"],
      audio_base64: params.audioBase64 || null,
      supporting_materials:
        params.supportingMaterials as unknown as SavedHackathonAnalysesInsert["supporting_materials"],
    };

    const { data, error } = await supabase
      .from("saved_hackathon_analyses")
      .insert(insertPayload)
      .select()
      .returns<SavedHackathonAnalysesRow>()
      .single();

    if (error || !data) {
      console.error("Failed to save hackathon analysis", error);
      throw new Error("Failed to save hackathon analysis to database");
    }

    const record = mapSavedHackathonAnalysesRow(data);
    return { data: record, error: null };
  } catch (error) {
    console.error("Failed to save hackathon analysis", error);
    return {
      data: null,
      error: "Failed to save your analysis. Please try again.",
    };
  }
}
