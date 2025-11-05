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

export interface SaveHackathonAnalysisParams {
  projectDescription: string;
  selectedCategory: ProjectSubmission["selectedCategory"];
  kiroUsage: string;
  analysis: HackathonAnalysis;
  supportingMaterials?: ProjectSubmission["supportingMaterials"];
  audioBase64?: string;
}

export async function saveHackathonAnalysis(
  params: SaveHackathonAnalysisParams
): Promise<{ data: SavedHackathonAnalysis | null; error: string | null }> {
  const supabase = browserSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { data: null, error: "Authentication required" };
  }

  const insertPayload: SavedHackathonAnalysesInsert = {
    user_id: session.user.id,
    project_description: params.projectDescription,
    selected_category: params.selectedCategory,
    kiro_usage: params.kiroUsage,
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
    return { data: null, error: "Failed to save your analysis.ry again." };
  }

  const record = mapSavedHackathonAnalysesRow(data);
  return { data: record, error: null };
}
