/**
 * Options for saving idea metadata
 */
export interface SaveMetadataOptions {
  notes?: string;
  tags?: string[];
}

/**
 * Save metadata (notes and/or tags) for an idea
 * @param ideaId - The ID of the idea to update
 * @param options - The metadata to save (notes and/or tags)
 * @returns Promise resolving when metadata is saved
 * @throws Error if request fails or validation fails
 */
export async function saveMetadata(
  ideaId: string,
  options: SaveMetadataOptions
): Promise<void> {
  // Validate that at least one field is provided
  if (options.notes === undefined && options.tags === undefined) {
    throw new Error("At least one of notes or tags must be provided");
  }

  const response = await fetch(`/api/v2/ideas/${ideaId}/metadata`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
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
      throw new Error(errorData.error || "Invalid metadata");
    }

    throw new Error(errorData.error || "Failed to save metadata");
  }

  // Success - no return value needed
  return;
}
