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
  
  // Transform the response from the new architecture format to the expected format
  if (result.analysis) {
    return result.analysis;
  }
  
  return result;
}
