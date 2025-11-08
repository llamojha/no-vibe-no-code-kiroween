import type {
  Analysis,
  SavedAnalysisRecord,
  SavedHackathonAnalysis,
  HackathonAnalysis,
  ProjectSubmission,
} from "@/lib/types";
import type { SavedAnalysesRow, SavedHackathonAnalysesRow } from "./types";

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
  analysis: row.analysis as unknown as HackathonAnalysis,
  audioBase64: row.audio_base64,
  supportingMaterials:
    row.supporting_materials as unknown as ProjectSubmission["supportingMaterials"],
  createdAt: row.created_at ?? new Date().toISOString(),
});
