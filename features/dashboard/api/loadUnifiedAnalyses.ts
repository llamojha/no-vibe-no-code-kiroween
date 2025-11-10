import type { SupabaseClient } from "@supabase/supabase-js";
import { browserSupabase } from "@/lib/supabase/client";
import {
  mapSavedAnalysesRow,
  mapSavedHackathonAnalysesRow,
  mapSavedFrankensteinIdea,
} from "@/lib/supabase/mappers";
import type { Database, SavedAnalysesRow } from "@/lib/supabase/types";
import type {
  UnifiedAnalysisRecord,
  SavedAnalysisRecord,
  SavedHackathonAnalysis,
  AnalysisCounts,
  SavedFrankensteinIdea,
} from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";
import { deriveFivePointScore } from "./scoreUtils";

/**
 * Transform a startup idea analysis to unified format
 */
function transformStartupAnalysis(
  analysis: SavedAnalysisRecord
): UnifiedAnalysisRecord {
  const finalScore = deriveFivePointScore(
    analysis.analysis as unknown as { finalScore?: number; score?: number }
  );

  // Extract title from idea text (first line or truncated)
  const ideaText = analysis.idea || "";
  const firstLine = ideaText.split("\n")[0].trim();
  const title = firstLine.length > 0 ? firstLine : ideaText.trim();
  const maxTitleLength = 80;
  const truncatedTitle =
    title.length > maxTitleLength
      ? `${title.slice(0, maxTitleLength - 1)}…`
      : title;

  return {
    id: analysis.id,
    userId: analysis.userId,
    category: "idea",
    title: truncatedTitle,
    createdAt: analysis.createdAt,
    finalScore,
    summary:
      analysis.analysis.viabilitySummary || analysis.analysis.detailedSummary,
    audioBase64: analysis.audioBase64,
    originalData: analysis,
  };
}

/**
 * Transform a hackathon analysis to unified format
 */
function transformHackathonAnalysis(
  analysis: SavedHackathonAnalysis
): UnifiedAnalysisRecord {
  const finalScore = deriveFivePointScore(
    analysis.analysis as unknown as { finalScore?: number; score?: number }
  );

  // Extract title from project description (first line or truncated)
  const projectText = analysis.projectDescription || "";
  const firstLine = projectText.split("\n")[0].trim();
  const title = firstLine.length > 0 ? firstLine : projectText.trim();
  const maxTitleLength = 80;
  const truncatedTitle =
    title.length > maxTitleLength
      ? `${title.slice(0, maxTitleLength - 1)}…`
      : title;

  return {
    id: analysis.id,
    userId: analysis.userId,
    category: "kiroween",
    title: truncatedTitle,
    createdAt: analysis.createdAt,
    finalScore,
    summary:
      analysis.analysis.viabilitySummary || analysis.analysis.detailedSummary,
    audioBase64: analysis.audioBase64,
    originalData: analysis,
  };
}

/**
 * Transform a Doctor Frankenstein idea to unified format
 */
function transformFrankensteinIdea(
  idea: SavedFrankensteinIdea
): UnifiedAnalysisRecord {
  const fullAnalysis = idea.analysis.fullAnalysis as
    | {
        summary?: string;
        idea_description?: string;
        metrics?: {
          originality_score?: number;
          feasibility_score?: number;
          impact_score?: number;
          scalability_score?: number;
          wow_factor?: number;
        };
      }
    | undefined;

  const metricValues = fullAnalysis?.metrics
    ? [
        fullAnalysis.metrics.originality_score ?? 0,
        fullAnalysis.metrics.feasibility_score ?? 0,
        fullAnalysis.metrics.impact_score ?? 0,
        fullAnalysis.metrics.scalability_score ?? 0,
        fullAnalysis.metrics.wow_factor ?? 0,
      ]
    : [];

  const average100 =
    metricValues.length > 0
      ? metricValues.reduce((sum, value) => sum + (value || 0), 0) /
        metricValues.length
      : 0;
  const normalizedScore = Math.max(
    0,
    Math.min(5, Number((average100 / 20).toFixed(1)))
  );

  return {
    id: idea.id,
    userId: idea.userId,
    category: "frankenstein",
    title: idea.analysis.ideaName || `${idea.tech1.name} + ${idea.tech2.name}`,
    createdAt: idea.createdAt,
    finalScore: normalizedScore,
    summary:
      fullAnalysis?.summary ||
      fullAnalysis?.idea_description ||
      idea.analysis.description ||
      `${idea.tech1.name} meets ${idea.tech2.name}`,
    audioBase64: undefined,
    originalData: idea,
  };
}

/**
 * Load all analyses for the current user from both tables and transform to unified format
 * Routes to local storage when in local dev mode
 */
export async function loadUnifiedAnalyses(): Promise<{
  data: UnifiedAnalysisRecord[];
  counts: AnalysisCounts;
  error: string | null;
}> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      // Load from local storage
      const [startupAnalyses, hackathonAnalyses, frankensteinIdeas] =
        await Promise.all([
          localStorageService.loadAnalyses(),
          localStorageService.loadHackathonAnalyses(),
          localStorageService.loadFrankensteinIdeas(),
        ]);

      // Transform to unified format
      const transformedStartupAnalyses = startupAnalyses.map(
        transformStartupAnalysis
      );
      const transformedHackathonAnalyses = hackathonAnalyses.map(
        transformHackathonAnalysis
      );
      const transformedFrankensteinIdeas = frankensteinIdeas.map(
        transformFrankensteinIdea
      );

      // Combine and sort by creation date (newest first)
      const allAnalyses = [
        ...transformedStartupAnalyses,
        ...transformedHackathonAnalyses,
        ...transformedFrankensteinIdeas,
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Calculate counts
      const counts: AnalysisCounts = {
        total: allAnalyses.length,
        idea: transformedStartupAnalyses.length,
        kiroween: transformedHackathonAnalyses.length,
        frankenstein: transformedFrankensteinIdeas.length,
      };

      return { data: allAnalyses, counts, error: null };
    } catch (error) {
      console.error("Failed to load analyses from local storage", error);
      return {
        data: [],
        counts: { total: 0, idea: 0, kiroween: 0, frankenstein: 0 },
        error:
          "Failed to load your analyses from local storage. Please try again.",
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
    return {
      data: [],
      counts: { total: 0, idea: 0, kiroween: 0, frankenstein: 0 },
      error: "Authentication required",
    };
  }

  try {
    // Single round-trip fetch for all analysis types; reduces latency by avoiding
    // three sequential Supabase queries while keeping per-type transforms intact.
    const { data, error: unifiedError } = await supabase
      .from("saved_analyses")
      .select("*")
      .eq("user_id", user.id)
      .in("analysis_type", ["idea", "hackathon", "frankenstein"])
      .order("created_at", { ascending: false })
      .returns<SavedAnalysesRow[]>();

    if (unifiedError) {
      console.error("Failed to load analyses", unifiedError);
      throw new Error("Failed to load analyses");
    }

    const rows = data ?? [];
    const startupRows = rows.filter((row) => row.analysis_type === "idea");
    const hackathonRows = rows.filter((row) => row.analysis_type === "hackathon");
    const frankensteinRows = rows.filter(
      (row) => row.analysis_type === "frankenstein"
    );

    // Transform to unified format
    const startupAnalyses = startupRows
      .map(mapSavedAnalysesRow)
      .map(transformStartupAnalysis);

    const hackathonAnalyses = hackathonRows
      .map(mapSavedHackathonAnalysesRow)
      .map(transformHackathonAnalysis);
    const frankensteinAnalyses = frankensteinRows
      .map(mapSavedFrankensteinIdea)
      .map(transformFrankensteinIdea);

    // Combine and sort by creation date (newest first)
    const allAnalyses = [
      ...startupAnalyses,
      ...hackathonAnalyses,
      ...frankensteinAnalyses,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate counts
    const counts: AnalysisCounts = {
      total: allAnalyses.length,
      idea: startupAnalyses.length,
      kiroween: hackathonAnalyses.length,
      frankenstein: frankensteinAnalyses.length,
    };

    return { data: allAnalyses, counts, error: null };
  } catch (error) {
    console.error("Failed to load unified analyses", error);
    return {
      data: [],
      counts: { total: 0, idea: 0, kiroween: 0, frankenstein: 0 },
      error: "Failed to load your analyses. Please try again.",
    };
  }
}

/**
 * Server-side version for initial page load
 * Note: Local dev mode is handled client-side, so this always uses Supabase
 */
export async function loadUnifiedAnalysesServer(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<{
  data: UnifiedAnalysisRecord[];
  counts: AnalysisCounts;
  error: string | null;
}> {
  try {
    const { data, error: unifiedError } = await supabase
      .from("saved_analyses")
      .select("*")
      .eq("user_id", userId)
      .in("analysis_type", ["idea", "hackathon", "frankenstein"])
      .order("created_at", { ascending: false })
      .returns<SavedAnalysesRow[]>();

    if (unifiedError) {
      console.error("Failed to load analyses", unifiedError);
      throw new Error("Failed to load analyses");
    }

    const rows = data ?? [];
    const startupRows = rows.filter((row) => row.analysis_type === "idea");
    const hackathonRows = rows.filter((row) => row.analysis_type === "hackathon");
    const frankensteinRows = rows.filter(
      (row) => row.analysis_type === "frankenstein"
    );

    // Transform to unified format
    const startupAnalyses = startupRows
      .map(mapSavedAnalysesRow)
      .map(transformStartupAnalysis);

    const hackathonAnalyses = hackathonRows
      .map(mapSavedHackathonAnalysesRow)
      .map(transformHackathonAnalysis);
    const frankensteinAnalyses = frankensteinRows
      .map(mapSavedFrankensteinIdea)
      .map(transformFrankensteinIdea);

    // Combine and sort by creation date (newest first)
    const allAnalyses = [
      ...startupAnalyses,
      ...hackathonAnalyses,
      ...frankensteinAnalyses,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate counts
    const counts: AnalysisCounts = {
      total: allAnalyses.length,
      idea: startupAnalyses.length,
      kiroween: hackathonAnalyses.length,
      frankenstein: frankensteinAnalyses.length,
    };

    return { data: allAnalyses, counts, error: null };
  } catch (error) {
    console.error("Failed to load unified analyses", error);
    return {
      data: [],
      counts: { total: 0, idea: 0, kiroween: 0, frankenstein: 0 },
      error: "Failed to load analyses. Please try again.",
    };
  }
}
