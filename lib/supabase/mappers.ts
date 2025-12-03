import type {
  Analysis,
  SavedAnalysisRecord,
  SavedHackathonAnalysis,
  HackathonAnalysis,
  SavedFrankensteinIdea,
  FrankensteinAnalysis,
} from "@/lib/types";
import type { SavedAnalysesRow } from "./types";

type FrankensteinIdeaPayload = Pick<
  SavedFrankensteinIdea,
  "mode" | "tech1" | "tech2" | "analysis"
>;

export const mapSavedAnalysesRow = (
  row: SavedAnalysesRow
): SavedAnalysisRecord => ({
  id: row.id,
  userId: row.user_id,
  idea: row.idea,
  analysis: row.analysis as unknown as Analysis,
  audioBase64: row.audio_base64,
  createdAt: row.created_at ?? new Date().toISOString(),
  analysisType: row.analysis_type as "idea" | "hackathon",
});
export const mapSavedHackathonAnalysesRow = (
  row: SavedAnalysesRow
): SavedHackathonAnalysis => ({
  id: row.id,
  userId: row.user_id,
  projectDescription: row.idea,
  analysis: row.analysis as unknown as HackathonAnalysis,
  audioBase64: row.audio_base64,
  // saved_analyses doesn't store supporting materials
  supportingMaterials: undefined,
  createdAt: row.created_at ?? new Date().toISOString(),
});

export const mapSavedFrankensteinIdea = (
  row: SavedAnalysesRow
): SavedFrankensteinIdea => {
  const payload = (row.analysis ?? {}) as unknown as FrankensteinIdeaPayload;

  return {
    id: row.id,
    userId: row.user_id,
    mode: payload.mode ?? "companies",
    tech1: payload.tech1 ?? {
      name: "Unknown",
      description: "Unknown technology",
      category: "unknown",
    },
    tech2: payload.tech2 ?? {
      name: "Unknown",
      description: "Unknown technology",
      category: "unknown",
    },
    analysis:
      payload.analysis ??
      ({
        ideaName: row.idea,
        description: "",
        keyFeatures: [],
        targetMarket: "",
        uniqueValueProposition: "",
        language: "en",
      } as FrankensteinAnalysis),
    createdAt: row.created_at ?? new Date().toISOString(),
  };
};
