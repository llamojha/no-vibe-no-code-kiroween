/**
 * Delete an idea and all its associated documents
 * @param ideaId - The ID of the idea to delete
 * @throws Error if request fails
 */
export async function deleteIdea(ideaId: string): Promise<void> {
  const response = await fetch(`/api/v2/ideas/${ideaId}`, {
    method: "DELETE",
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
        errorData.error || "You do not have permission to delete this idea"
      );
    }

    if (response.status === 401) {
      throw new Error(errorData.error || "Authentication required");
    }

    throw new Error(errorData.error || "Failed to delete idea");
  }
}
