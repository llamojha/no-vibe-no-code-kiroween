/**
 * Delete an idea and all its associated documents
 * @param ideaId - The ID of the idea to delete
 * @throws Error if request fails
 */
export async function deleteIdea(ideaId: string): Promise<void> {
<<<<<<< HEAD
=======
  console.log("deleteIdea API: Sending DELETE request for ideaId:", ideaId);

>>>>>>> 4224bb8 (feat(idea-panel): Implement idea deletion with confirmation dialog)
  const response = await fetch(`/api/v2/ideas/${ideaId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

<<<<<<< HEAD
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
=======
  console.log("deleteIdea API: Response status:", response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("deleteIdea API: Error response:", errorData);
>>>>>>> 4224bb8 (feat(idea-panel): Implement idea deletion with confirmation dialog)

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
<<<<<<< HEAD
=======

  console.log("deleteIdea API: Delete successful");
>>>>>>> 4224bb8 (feat(idea-panel): Implement idea deletion with confirmation dialog)
}
