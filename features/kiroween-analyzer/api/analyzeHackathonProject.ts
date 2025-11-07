import type { SupportedLocale } from "@/features/locale/translations";
import type { ProjectSubmission, HackathonAnalysis } from "@/lib/types";

export async function analyzeHackathonProject(
  submission: ProjectSubmission,
  locale: SupportedLocale
): Promise<HackathonAnalysis> {
  // Use the new v2 API endpoint with hexagonal architecture
  const response = await fetch("/api/v2/hackathon/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      submission,
      locale,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to analyze hackathon project");
  }

  const result = await response.json();
  
  // Handle the Result<T, E> pattern from the backend
  if (result.success === false) {
    throw new Error(result.error?.message || 'Analysis failed');
  }
  
  // Extract data from the success response
  if (result.success && result.data) {
    return result.data as HackathonAnalysis;
  }
  
  // Legacy format support
  if (result.analysis) {
    return result.analysis;
  }
  
  // Direct format
  return result as HackathonAnalysis;
}
