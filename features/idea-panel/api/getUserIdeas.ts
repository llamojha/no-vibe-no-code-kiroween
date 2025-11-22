import type { DashboardIdeaDTO } from "@/src/infrastructure/web/dto/IdeaDTO";

/**
 * Get all ideas for the current user
 * Returns optimized data for dashboard display
 * @returns Promise resolving to array of user's ideas
 * @throws Error if request fails
 */
export async function getUserIdeas(): Promise<DashboardIdeaDTO[]> {
  const response = await fetch("/api/v2/ideas", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle specific error codes
    if (response.status === 401) {
      throw new Error(errorData.error || "Authentication required");
    }

    if (response.status === 404) {
      throw new Error(errorData.error || "Feature not available");
    }

    throw new Error(errorData.error || "Failed to retrieve ideas");
  }

  const result = await response.json();

  // Handle array response
  if (Array.isArray(result)) {
    return result as DashboardIdeaDTO[];
  }

  // Handle wrapped response
  if (result.data && Array.isArray(result.data)) {
    return result.data as DashboardIdeaDTO[];
  }

  // Handle ideas property
  if (result.ideas && Array.isArray(result.ideas)) {
    return result.ideas as DashboardIdeaDTO[];
  }

  // Fallback to empty array
  return [];
}
