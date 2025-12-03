import type { DocumentDTO } from "@/src/infrastructure/web/dto/IdeaDTO";

/**
 * Get all documents for a specific idea
 * @param ideaId - The ID of the idea
 * @returns Promise resolving to array of documents
 * @throws Error if request fails or idea not found
 */
export async function getDocumentsByIdea(
  ideaId: string
): Promise<DocumentDTO[]> {
  const response = await fetch(`/api/v2/ideas/${ideaId}/documents`, {
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

    throw new Error(errorData.error || "Failed to retrieve documents");
  }

  const result = await response.json();

  // Handle array response
  if (Array.isArray(result)) {
    return result as DocumentDTO[];
  }

  // Handle wrapped response
  if (result.data && Array.isArray(result.data)) {
    return result.data as DocumentDTO[];
  }

  // Handle documents property
  if (result.documents && Array.isArray(result.documents)) {
    return result.documents as DocumentDTO[];
  }

  // Fallback to empty array
  return [];
}
