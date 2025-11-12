import type { SupportedLocale } from "@/features/locale/translations";
import type { Analysis } from "@/lib/types";

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

export const requestAnalysis = async (
  idea: string,
  locale: SupportedLocale
): Promise<Analysis> => {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea, locale }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    // Handle 429 (Too Many Requests) - Insufficient Credits
    if (response.status === 429) {
      const credits = error.details?.credits ?? 0;
      const tier = error.details?.tier ?? "free";
      throw new InsufficientCreditsError(
        error.error ||
          error.message ||
          "Insufficient credits to perform analysis",
        credits,
        tier
      );
    }

    throw new Error(error.error ?? "Failed to analyze idea.");
  }

  const result = await response.json();

  // Handle the Result<T, E> pattern from the backend
  if (result.success === false) {
    throw new Error(result.error?.message || result.error || "Analysis failed");
  }

  // Extract data from the success response
  if (result.success && result.data) {
    return result.data as Analysis;
  }

  // Legacy format support - direct return
  return result as Analysis;
};
