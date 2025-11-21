/**
 * Update the status of an idea
 * @param ideaId - The ID of the idea to update
 * @param status - The new status value
 * @returns Promise resolving when status is updated
 * @throws Error if request fails or validation fails
 */
export async function updateStatus(
  ideaId: string,
  status: "idea" | "in_progress" | "completed" | "archived"
): Promise<void> {
  const response = await fetch(`/api/v2/ideas/${ideaId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle specific error codes
    if (response.status === 404) {
      throw new Error(errorData.error || "Idea not found");
    }

    if (response.status === 403) {
      throw new Error(
        errorData.error || "You do not have permission to update this idea"
      );
    }

    if (response.status === 401) {
      throw new Error(errorData.error || "Authentication required");
    }

    if (response.status === 400) {
      throw new Error(errorData.error || "Invalid status value");
    }

    throw new Error(errorData.error || "Failed to update status");
  }

  // Success - no return value needed
  return;
}
