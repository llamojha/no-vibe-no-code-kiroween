import type { IdeaWithDocumentsDTO } from "@/src/infrastructure/web/dto/IdeaDTO";

/**
 * Get idea with all associated documents
 * @param ideaId - The ID of the idea to retrieve
 * @returns Promise resolving to idea with documents
 * @throws Error if request fails or idea not found
 */
export async function getIdeaWithDocuments(
  ideaId: string
): Promise<IdeaWithDocumentsDTO> {
  const response = await fetch(`/api/v2/ideas/${ideaId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle specific error codes
    if (response.status === 404) {
      throw new Error(errorData.error || "Idea not found");
    }

    if (response.status === 403) {
      throw new Error(
        errorData.error || "You do not have permission to access this idea"
      );
    }

    if (response.status === 401) {
      throw new Error(errorData.error || "Authentication required");
    }

    throw new Error(errorData.error || "Failed to retrieve idea");
  }

  const result = await response.json();
  return result as IdeaWithDocumentsDTO;
}
