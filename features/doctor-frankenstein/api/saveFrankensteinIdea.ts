import { browserSupabase } from "@/lib/supabase/client";
import { mapSavedFrankensteinIdea } from "@/lib/supabase/mappers";
import type {
  SavedAnalysesInsert,
  SavedAnalysesRow,
  Json,
} from "@/lib/supabase/types";
import type {
  SavedFrankensteinIdea,
  TechItem,
  FrankensteinAnalysis,
} from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";
import { generateMockUser } from "@/lib/mockData";

export interface SaveFrankensteinIdeaParams {
  mode: "companies" | "aws";
  tech1: TechItem;
  tech2: TechItem;
  analysis: FrankensteinAnalysis;
}

/**
 * Save a Doctor Frankenstein generated idea to the database
 * Supports both production (Supabase) and local dev mode (localStorage)
 */
export async function saveFrankensteinIdea(
  params: SaveFrankensteinIdeaParams
): Promise<{ data: SavedFrankensteinIdea | null; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      // Create a mock user for local dev mode
      const mockUser = generateMockUser();

      // Create a new idea record for local storage
      const ideaRecord: SavedFrankensteinIdea = {
        id: crypto.randomUUID(),
        userId: mockUser.id,
        mode: params.mode,
        tech1: params.tech1,
        tech2: params.tech2,
        analysis: params.analysis,
        createdAt: new Date().toISOString(),
      };

      // Save to local storage
      await localStorageService.saveFrankensteinIdea(ideaRecord);

      return { data: ideaRecord, error: null };
    } catch (error) {
      console.error("Failed to save Frankenstein idea to local storage", error);
      return {
        data: null,
        error:
          "Failed to save your idea to local storage. Please try again.",
      };
    }
  }

  // Production: use Supabase
  const supabase = browserSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "User not authenticated" };
  }

  const payload = {
    mode: params.mode,
    tech1: params.tech1,
    tech2: params.tech2,
    analysis: params.analysis,
  };

  const insert: SavedAnalysesInsert = {
    user_id: user.id,
    analysis_type: "frankenstein",
    idea: params.analysis.ideaName,
    analysis: payload as unknown as Json,
  };

  const { data, error } = await supabase
    .from("saved_analyses")
    .insert(insert)
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to save Frankenstein idea", error);
    return {
      data: null,
      error: error?.message || "Failed to save your idea. Please try again.",
    };
  }

  return { data: mapSavedFrankensteinIdea(data as SavedAnalysesRow), error: null };
}

/**
 * Load a saved Doctor Frankenstein idea by ID
 * Supports both production (Supabase) and local dev mode (localStorage)
 */
export async function loadFrankensteinIdea(
  ideaId: string
): Promise<{ data: SavedFrankensteinIdea | null; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      const idea = await localStorageService.getFrankensteinIdea(ideaId);

      if (!idea) {
        return { data: null, error: "Idea not found in local storage" };
      }

      return { data: idea, error: null };
    } catch (error) {
      console.error("Failed to load Frankenstein idea from local storage", error);
      return {
        data: null,
        error: "Failed to load idea from local storage. Please try again.",
      };
    }
  }

  // Production: use Supabase
  const supabase = browserSupabase();
  const { data, error } = await supabase
    .from("saved_analyses")
    .select("*")
    .eq("id", ideaId)
    .eq("analysis_type", "frankenstein")
    .single();

  if (error || !data) {
    console.error("Failed to load Frankenstein idea", error);
    return {
      data: null,
      error: error?.message || "Idea not found",
    };
  }

  return { data: mapSavedFrankensteinIdea(data as SavedAnalysesRow), error: null };
}
