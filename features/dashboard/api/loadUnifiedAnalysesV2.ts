import type { UnifiedAnalysisRecord, AnalysisCounts } from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";
import { localStorageService } from "@/lib/localStorage";

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
      const [startupAnalyses, hackathonAnalyses] = await Promise.all([
        localStorageService.loadAnalyses(),
        localStorageService.loadHackathonAnalyses(),
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

      // Combine and sort by creation date (newest first)
      const allAnalyses = [
        ...transformedStartupAnalyses,
        ...transformedHackathonAnalyses,
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Calculate counts
      const counts: AnalysisCounts = {
        total: allAnalyses.length,
        idea: transformedStartupAnalyses.length,
        kiroween: transformedHackathonAnalyses.length,
      };

      return { data: allAnalyses, counts, error: null };
    } catch (error) {
      console.error("Failed to load analyses from local storage", error);
      return {
        data: [],
        counts: { total: 0, idea: 0, kiroween: 0 },
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
    };

    return { data: analyses, counts, error: null };
  } catch (error) {
    console.error("Failed to load unified analyses from v2 API", error);
    return {
      data: [],
      counts: { total: 0, idea: 0, kiroween: 0 },
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
    };

    return { data: analyses, counts, error: null };
  } catch (error) {
    console.error("Failed to load unified analyses from v2 API", error);
    return {
      data: [],
      counts: { total: 0, idea: 0, kiroween: 0 },
      error: "Failed to load analyses. Please try again.",
    };
  }
}
