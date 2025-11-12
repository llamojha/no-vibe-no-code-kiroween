import type { SupportedLocale } from "@/features/locale/translations";
import type { ProjectSubmission, HackathonAnalysis } from "@/lib/types";

/**
 * Custom error class for insufficient credits
 * Thrown when user has no credits remaining (HTTP 429)
 */
export class InsufficientCreditsError extends Error {
  constructor(
    message: string,
    public readonly credits: number = 0,
    public readonly tier: string = "free"
  ) {
    super(message);
    this.name = "InsufficientCreditsError";
  }
}

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

    // Handle 429 (Too Many Requests) - Insufficient Credits
    if (response.status === 429) {
      const credits = errorData.details?.credits ?? 0;
      const tier = errorData.details?.tier ?? "free";
      throw new InsufficientCreditsError(
        errorData.error ||
          errorData.message ||
          "Insufficient credits to perform analysis",
        credits,
        tier
      );
    }

    throw new Error(errorData.error || "Failed to analyze hackathon project");
  }

  const result = await response.json();

  // Handle the Result<T, E> pattern from the backend
  if (result.success === false) {
    throw new Error(result.error?.message || "Analysis failed");
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
