import { browserSupabase } from "@/lib/supabase/client";
import type { TechItem, FrankensteinAnalysis } from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";
import { generateMockUser } from "@/lib/mockData";

export interface SaveFrankensteinIdeaParams {
  mode: "companies" | "aws";
  tech1: TechItem;
  tech2: TechItem;
  analysis: FrankensteinAnalysis;
}

export interface SaveFrankensteinIdeaResult {
  ideaId: string;
  createdAt: string;
}

/**
 * Save a Doctor Frankenstein generated idea to the ideas table
 * Creates an idea with source='frankenstein' but does NOT create a document
 * Supports both production (Supabase) and local dev mode (localStorage)
 *
 * Requirements: 1.5, 5.1, 5.2
 */
export async function saveFrankensteinIdea(
  params: SaveFrankensteinIdeaParams
): Promise<{ data: SaveFrankensteinIdeaResult | null; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      // Create a mock user for local dev mode
      const mockUser = generateMockUser();

      const ideaId = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      // Create a new idea record for local storage
      const ideaRecord = {
        id: ideaId,
        userId: mockUser.id,
        mode: params.mode,
        tech1: params.tech1,
        tech2: params.tech2,
        analysis: params.analysis,
        createdAt,
      };

      // Save to local storage
      await localStorageService.saveFrankensteinIdea(ideaRecord);

      return {
        data: { ideaId, createdAt },
        error: null,
      };
    } catch (error) {
      console.error("Failed to save Frankenstein idea to local storage", error);
      return {
        data: null,
        error: "Failed to save your idea to local storage. Please try again.",
      };
    }
  }

  // Production: use Supabase to create idea in ideas table
  const supabase = browserSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "User not authenticated" };
  }

  // Create idea text from analysis
  const ideaText = `${params.analysis.ideaName}\n\n${params.analysis.description}`;

  // Insert into ideas table with source='frankenstein'
  const { data, error } = await supabase
    .from("ideas")
    .insert({
      user_id: user.id,
      idea_text: ideaText,
      source: "frankenstein",
      project_status: "idea",
      notes: "",
      tags: [],
    })
    .select("id, created_at")
    .single();

  if (error || !data) {
    console.error("Failed to save Frankenstein idea", error);
    return {
      data: null,
      error: error?.message || "Failed to save your idea. Please try again.",
    };
  }

  return {
    data: {
      ideaId: data.id,
      createdAt: data.created_at,
    },
    error: null,
  };
}

export interface LoadFrankensteinIdeaResult {
  id: string;
  ideaText: string;
  source: string;
  createdAt: string;
}

/**
 * Load a saved Doctor Frankenstein idea by ID from ideas table
 * Returns idea without documents
 * Supports both production (Supabase) and local dev mode (localStorage)
 *
 * Requirements: 5.1
 */
export async function loadFrankensteinIdea(
  ideaId: string
): Promise<{ data: LoadFrankensteinIdeaResult | null; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      const idea = await localStorageService.getFrankensteinIdea(ideaId);

      if (!idea) {
        return { data: null, error: "Idea not found in local storage" };
      }

      // Convert legacy format to new format
      const ideaText = idea.analysis?.ideaName
        ? `${idea.analysis.ideaName}\n\n${idea.analysis.description || ""}`
        : "";

      return {
        data: {
          id: idea.id,
          ideaText,
          source: "frankenstein",
          createdAt: idea.createdAt,
        },
        error: null,
      };
    } catch (error) {
      console.error(
        "Failed to load Frankenstein idea from local storage",
        error
      );
      return {
        data: null,
        error: "Failed to load idea from local storage. Please try again.",
      };
    }
  }

  // Production: Try loading from ideas table first, fallback to saved_analyses for legacy data
  const supabase = browserSupabase();

  // Try ideas table first
  const { data: ideaData, error: ideaError } = await supabase
    .from("ideas")
    .select("id, idea_text, source, created_at")
    .eq("id", ideaId)
    .eq("source", "frankenstein")
    .single();

  if (ideaData && !ideaError) {
    return {
      data: {
        id: ideaData.id,
        ideaText: ideaData.idea_text,
        source: ideaData.source,
        createdAt: ideaData.created_at,
      },
      error: null,
    };
  }

  // Fallback to saved_analyses for legacy Frankenstein ideas
  const { data: legacyData, error: legacyError } = await supabase
    .from("saved_analyses")
    .select("*")
    .eq("id", ideaId)
    .eq("analysis_type", "frankenstein")
    .single();

  if (legacyError || !legacyData) {
    console.error("Failed to load Frankenstein idea", legacyError);
    return {
      data: null,
      error: legacyError?.message || "Idea not found",
    };
  }

  // Convert legacy format - extract idea text from analysis
  const analysisData = legacyData as any;
  const analysis = analysisData.analysis as any;
  const ideaText = analysis?.ideaName
    ? `${analysis.ideaName}\n\n${analysis.description || ""}`
    : analysisData.idea;

  return {
    data: {
      id: analysisData.id,
      ideaText,
      source: "frankenstein",
      createdAt: analysisData.created_at || new Date().toISOString(),
    },
    error: null,
  };
}

/**
 * Update a Frankenstein idea text in the ideas table
 * Supports both production (Supabase) and local dev mode (localStorage)
 *
 * Requirements: 5.5
 */
export async function updateFrankensteinIdea(
  ideaId: string,
  ideaText: string
): Promise<{ success: boolean; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      const idea = await localStorageService.getFrankensteinIdea(ideaId);

      if (!idea) {
        return { success: false, error: "Frankenstein idea not found" };
      }

      // Update the idea text in the analysis
      const updatedIdea = {
        ...idea,
        analysis: {
          ...idea.analysis,
          ideaName: ideaText.split("\n\n")[0] || ideaText,
          description: ideaText.split("\n\n")[1] || "",
        },
      };

      await localStorageService.saveFrankensteinIdea(updatedIdea);

      return { success: true, error: null };
    } catch (error) {
      console.error(
        "Failed to update Frankenstein idea in local storage",
        error
      );
      return {
        success: false,
        error: "Failed to update idea. Please try again.",
      };
    }
  }

  // Production: update ideas table
  const supabase = browserSupabase();

  const { error } = await supabase
    .from("ideas")
    .update({ idea_text: ideaText })
    .eq("id", ideaId)
    .eq("source", "frankenstein");

  if (error) {
    console.error("Failed to update Frankenstein idea", error);
    return {
      success: false,
      error: error.message || "Failed to update idea",
    };
  }

  return { success: true, error: null };
}

/**
 * Update a Frankenstein idea with validation results
 * This function is kept for backward compatibility with existing analyzers
 * that link validation results to Frankenstein ideas
 *
 * @deprecated This function will be removed once analyzers are updated to use the new document-based approach
 */
export async function updateFrankensteinValidation(
  frankensteinId: string,
  validationType: "kiroween" | "analyzer",
  validationData: {
    analysisId: string;
    score: number;
  }
): Promise<{ success: boolean; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      const idea = await localStorageService.getFrankensteinIdea(
        frankensteinId
      );

      if (!idea) {
        return { success: false, error: "Frankenstein idea not found" };
      }

      // Update the validation data
      const updatedAnalysis = {
        ...idea.analysis,
        ...(validationType === "kiroween"
          ? {
              validatedWithKiroween: {
                ...validationData,
                validatedAt: new Date().toISOString(),
              },
            }
          : {
              validatedWithAnalyzer: {
                ...validationData,
                validatedAt: new Date().toISOString(),
              },
            }),
      };

      const updatedIdea = { ...idea, analysis: updatedAnalysis };
      await localStorageService.saveFrankensteinIdea(updatedIdea);

      return { success: true, error: null };
    } catch (error) {
      console.error(
        "Failed to update Frankenstein validation in local storage",
        error
      );
      return {
        success: false,
        error: "Failed to update validation. Please try again.",
      };
    }
  }

  // Production: This is a legacy operation that's no longer needed
  // In the new architecture, validation results are stored as documents
  // For now, we'll just return success to avoid breaking existing code
  console.warn(
    "updateFrankensteinValidation called in production mode - this is a legacy operation that should be migrated to use documents"
  );

  return { success: true, error: null };
}

/**
 * Load a saved Doctor Frankenstein idea with full metadata (legacy format)
 * This function is used by the Doctor Frankenstein view which needs the full metadata
 *
 * @deprecated This function loads from saved_analyses for backward compatibility
 * New code should use loadFrankensteinIdea which loads from ideas table
 */
export async function loadFrankensteinIdeaLegacy(
  ideaId: string
): Promise<{ data: any | null; error: string | null }> {
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
      console.error(
        "Failed to load Frankenstein idea from local storage",
        error
      );
      return {
        data: null,
        error: "Failed to load idea from local storage. Please try again.",
      };
    }
  }

  // Production: load from saved_analyses (legacy)
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

  // Map to expected format
  const dataAny = data as any;
  const analysis = dataAny.analysis as any;
  return {
    data: {
      id: dataAny.id,
      userId: dataAny.user_id,
      mode: analysis.mode || "companies",
      tech1: analysis.tech1 || { name: "", description: "", category: "" },
      tech2: analysis.tech2 || { name: "", description: "", category: "" },
      analysis: analysis.analysis || analysis,
      createdAt: dataAny.created_at || new Date().toISOString(),
    },
    error: null,
  };
}
