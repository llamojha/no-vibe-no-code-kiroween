import type {
  UnifiedAnalysisRecord,
  AnalysisCounts,
  SavedFrankensteinIdea,
} from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";

function transformFrankensteinIdea(
  idea: SavedFrankensteinIdea
): UnifiedAnalysisRecord {
  const metrics = idea.analysis.fullAnalysis?.metrics;
  const scores = metrics
    ? [
        metrics.originality_score ?? 0,
        metrics.feasibility_score ?? 0,
        metrics.impact_score ?? 0,
        metrics.scalability_score ?? 0,
        metrics.wow_factor ?? 0,
      ]
    : [];

  const average100 =
    scores.length > 0
      ? scores.reduce((sum, value) => sum + (value || 0), 0) / scores.length
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
      idea.analysis.fullAnalysis?.summary ||
      idea.analysis.fullAnalysis?.idea_description ||
      idea.analysis.description ||
      `${idea.tech1.name} meets ${idea.tech2.name}`,
    audioBase64: undefined,
    originalData: idea,
  };
}

/**
 * Load all analyses for the current user using the new v2 API
 * Routes to local storage when in local dev mode
 */
export async function loadUnifiedAnalysesV2(): Promise<{
  data: UnifiedAnalysisRecord[];
  counts: AnalysisCounts;
  error: string | null;
}> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    try {
      // Load from local storage (same as before)
      const [startupAnalyses, hackathonAnalyses, frankensteinIdeas] =
        await Promise.all([
          localStorageService.loadAnalyses(),
          localStorageService.loadHackathonAnalyses(),
          localStorageService.loadFrankensteinIdeas(),
        ]);

      // Transform to unified format (simplified for now)
      const transformedStartupAnalyses = startupAnalyses.map((analysis) => ({
        id: analysis.id,
        userId: analysis.userId,
        category: "idea" as const,
        title: analysis.idea.split("\n")[0].trim() || analysis.idea.trim(),
        createdAt: analysis.createdAt,
        finalScore: analysis.analysis.finalScore,
        summary:
          analysis.analysis.viabilitySummary ||
          analysis.analysis.detailedSummary,
        audioBase64: analysis.audioBase64,
        originalData: analysis,
      }));

      const transformedHackathonAnalyses = hackathonAnalyses.map(
        (analysis) => ({
          id: analysis.id,
          userId: analysis.userId,
          category: "kiroween" as const,
          title:
            analysis.projectDescription.split("\n")[0].trim() ||
            analysis.projectDescription.trim(),
          createdAt: analysis.createdAt,
          finalScore: analysis.analysis.finalScore,
          summary:
            analysis.analysis.viabilitySummary ||
            analysis.analysis.detailedSummary,
          audioBase64: analysis.audioBase64,
          originalData: analysis,
        })
      );
      const transformedFrankensteinAnalyses = frankensteinIdeas.map(
        transformFrankensteinIdea
      );

      // Combine and sort by creation date (newest first)
      const allAnalyses = [
        ...transformedStartupAnalyses,
        ...transformedHackathonAnalyses,
        ...transformedFrankensteinAnalyses,
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Calculate counts
      const counts: AnalysisCounts = {
        total: allAnalyses.length,
        idea: transformedStartupAnalyses.length,
        kiroween: transformedHackathonAnalyses.length,
        frankenstein: transformedFrankensteinAnalyses.length,
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

  // Use the new v2 API for production with optimized query
  try {
    const response = await fetch(
      "/api/v2/dashboard/analyses?limit=1000&optimized=true",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    // Transform optimized API response to unified format
    const analyses: UnifiedAnalysisRecord[] = result.analyses.map(
      (analysis: any) => ({
        id: analysis.id,
        userId: "current-user", // Not included in optimized response
        category: analysis.category || "idea",
        title: analysis.title || "Untitled",
        createdAt: analysis.createdAt,
        finalScore: analysis.score,
        summary: analysis.summary || "No summary available",
        audioBase64: undefined, // Not included in optimized response
        originalData: analysis,
      })
    );

    // Calculate counts from the analyses
    const counts: AnalysisCounts = {
      total: analyses.length,
      idea: analyses.filter((a) => a.category === "idea").length,
      kiroween: analyses.filter((a) => a.category === "kiroween").length,
      frankenstein: analyses.filter((a) => a.category === "frankenstein").length,
    };

    return { data: analyses, counts, error: null };
  } catch (error) {
    console.error("Failed to load unified analyses from v2 API", error);
    return {
      data: [],
      counts: { total: 0, idea: 0, kiroween: 0, frankenstein: 0 },
      error: "Failed to load your analyses. Please try again.",
    };
  }
}

/**
 * Server-side version for initial page load using v2 API with optimized query
 */
export async function loadUnifiedAnalysesServerV2(baseUrl: string): Promise<{
  data: UnifiedAnalysisRecord[];
  counts: AnalysisCounts;
  error: string | null;
}> {
  try {
    const response = await fetch(
      `${baseUrl}/api/v2/dashboard/analyses?limit=1000&optimized=true`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    // Transform optimized API response to unified format
    const analyses: UnifiedAnalysisRecord[] = result.analyses.map(
      (analysis: any) => ({
        id: analysis.id,
        userId: "current-user", // Not included in optimized response
        category: analysis.category || "idea",
        title: analysis.title || "Untitled",
        createdAt: analysis.createdAt,
        finalScore: analysis.score,
        summary: analysis.summary || "No summary available",
        audioBase64: undefined, // Not included in optimized response
        originalData: analysis,
      })
    );

    // Calculate counts from the analyses
    const counts: AnalysisCounts = {
      total: analyses.length,
      idea: analyses.filter((a) => a.category === "idea").length,
      kiroween: analyses.filter((a) => a.category === "kiroween").length,
      frankenstein: analyses.filter((a) => a.category === "frankenstein").length,
    };

    return { data: analyses, counts, error: null };
  } catch (error) {
    console.error("Failed to load unified analyses from v2 API", error);
    return {
      data: [],
      counts: { total: 0, idea: 0, kiroween: 0, frankenstein: 0 },
      error: "Failed to load analyses. Please try again.",
    };
  }
}
