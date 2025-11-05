import type { SupportedLocale } from "@/features/locale/translations";
import type { ProjectSubmission, HackathonAnalysis } from "@/lib/types";

export async function analyzeHackathonProject(
  submission: ProjectSubmission,
  locale: SupportedLocale
): Promise<HackathonAnalysis> {
  const response = await fetch("/api/analyze-hackathon", {
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

  return response.json();
}
