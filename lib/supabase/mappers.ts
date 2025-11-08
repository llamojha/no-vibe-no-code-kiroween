import type {
  Analysis,
  SavedAnalysisRecord,
  SavedHackathonAnalysis,
  HackathonAnalysis,
  ProjectSubmission,
  SavedFrankensteinIdea,
  FrankensteinAnalysis,
} from "@/lib/types";
import type {
  SavedAnalysesRow,
  SavedHackathonAnalysesRow,
  SavedFrankensteinIdeasRow,
} from "./types";

export const mapSavedAnalysesRow = (
  row: SavedAnalysesRow
): SavedAnalysisRecord => ({
  id: row.id,
  userId: row.user_id,
  idea: row.idea,
  analysis: row.analysis as unknown as Analysis,
  audioBase64: row.audio_base64,
  createdAt: row.created_at ?? new Date().toISOString(),
});
export const mapSavedHackathonAnalysesRow = (
  row: SavedHackathonAnalysesRow
): SavedHackathonAnalysis => ({
  id: row.id,
  userId: row.user_id,
  projectDescription: row.project_description,
  selectedCategory: row.selected_category,
  kiroUsage: row.kiro_usage,
  analysis: row.analysis as unknown as HackathonAnalysis,
  audioBase64: row.audio_base64,
  supportingMaterials:
    row.supporting_materials as unknown as ProjectSubmission["supportingMaterials"],
  createdAt: row.created_at ?? new Date().toISOString(),
});

export const mapSavedFrankensteinIdea = (
  row: SavedFrankensteinIdeasRow
): SavedFrankensteinIdea => ({
  id: row.id,
  userId: row.user_id,
  mode: row.mode,
  tech1: {
    name: row.tech1_name,
    description: row.tech1_description,
    category: row.tech1_category,
  },
  tech2: {
    name: row.tech2_name,
    description: row.tech2_description,
    category: row.tech2_category,
  },
  analysis: row.analysis as unknown as FrankensteinAnalysis,
  createdAt: row.created_at ?? new Date().toISOString(),
});
