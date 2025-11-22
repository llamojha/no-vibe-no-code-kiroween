/**
 * Example usage patterns for Idea Panel API client functions
 *
 * These examples demonstrate common usage patterns and best practices
 * for integrating the API client functions into React components.
 */

import {
  getIdeaWithDocuments,
  getUserIdeas,
  updateStatus,
  saveMetadata,
  getDocumentsByIdea,
} from "./index";

/**
 * Example 1: Loading idea panel data
 * Typical usage in a React component's useEffect or server component
 */
export async function exampleLoadIdeaPanel(ideaId: string) {
  try {
    const ideaData = await getIdeaWithDocuments(ideaId);

    console.log("Idea:", ideaData.idea.ideaText);
    console.log("Status:", ideaData.idea.projectStatus);
    console.log("Documents:", ideaData.documents.length);

    // Process documents
    ideaData.documents.forEach((doc) => {
      console.log(`- ${doc.documentType}: ${doc.title || "Untitled"}`);
    });

    return ideaData;
  } catch (error) {
    console.error("Failed to load idea panel:", error);
    throw error;
  }
}

/**
 * Example 2: Loading dashboard ideas
 * Typical usage in dashboard component
 */
export async function exampleLoadDashboard() {
  try {
    const ideas = await getUserIdeas();

    console.log(`Found ${ideas.length} ideas`);

    // Group by status
    const byStatus = ideas.reduce((acc, idea) => {
      acc[idea.projectStatus] = (acc[idea.projectStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("Ideas by status:", byStatus);

    return ideas;
  } catch (error) {
    console.error("Failed to load dashboard:", error);
    throw error;
  }
}

/**
 * Example 3: Updating idea status with optimistic UI
 * Shows pattern for immediate UI update with rollback on error
 */
export async function exampleUpdateStatusOptimistic(
  ideaId: string,
  newStatus: "idea" | "in_progress" | "completed" | "archived",
  currentStatus: string,
  onStatusChange: (status: string) => void
) {
  // Optimistic update
  onStatusChange(newStatus);

  try {
    await updateStatus(ideaId, newStatus);
    console.log("Status updated successfully");
  } catch (error) {
    // Rollback on error
    onStatusChange(currentStatus);
    console.error("Failed to update status:", error);
    throw error;
  }
}

/**
 * Example 4: Saving notes with debouncing
 * Shows pattern for auto-saving notes as user types
 */
export async function exampleSaveNotes(ideaId: string, notes: string) {
  try {
    await saveMetadata(ideaId, { notes });
    console.log("Notes saved successfully");
  } catch (error) {
    console.error("Failed to save notes:", error);
    throw error;
  }
}

/**
 * Example 5: Managing tags
 * Shows pattern for adding/removing tags
 */
export async function exampleManageTags(
  ideaId: string,
  currentTags: string[],
  action: "add" | "remove",
  tag: string
) {
  try {
    let newTags: string[];

    if (action === "add") {
      // Add tag if not already present
      if (!currentTags.includes(tag)) {
        newTags = [...currentTags, tag];
      } else {
        return currentTags; // No change needed
      }
    } else {
      // Remove tag
      newTags = currentTags.filter((t) => t !== tag);
    }

    await saveMetadata(ideaId, { tags: newTags });
    console.log(`Tag ${action === "add" ? "added" : "removed"} successfully`);

    return newTags;
  } catch (error) {
    console.error("Failed to manage tags:", error);
    throw error;
  }
}

/**
 * Example 6: Loading documents separately
 * Useful when you only need documents without full idea data
 */
export async function exampleLoadDocuments(ideaId: string) {
  try {
    const documents = await getDocumentsByIdea(ideaId);

    console.log(`Found ${documents.length} documents`);

    // Separate by type
    const startupAnalyses = documents.filter(
      (d) => d.documentType === "startup_analysis"
    );
    const hackathonAnalyses = documents.filter(
      (d) => d.documentType === "hackathon_analysis"
    );

    console.log(`- ${startupAnalyses.length} startup analyses`);
    console.log(`- ${hackathonAnalyses.length} hackathon analyses`);

    return documents;
  } catch (error) {
    console.error("Failed to load documents:", error);
    throw error;
  }
}

/**
 * Example 7: Complete workflow - Create, update, and manage idea
 * Shows a complete workflow from loading to updating
 */
export async function exampleCompleteWorkflow(ideaId: string) {
  try {
    // 1. Load idea
    console.log("Loading idea...");
    const ideaData = await getIdeaWithDocuments(ideaId);

    // 2. Update status
    console.log("Updating status...");
    await updateStatus(ideaId, "in_progress");

    // 3. Add notes
    console.log("Adding notes...");
    await saveMetadata(ideaId, {
      notes: "Started working on this idea today!",
    });

    // 4. Add tags
    console.log("Adding tags...");
    await saveMetadata(ideaId, {
      tags: ["mvp", "high-priority"],
    });

    // 5. Reload to verify
    console.log("Reloading to verify...");
    const updatedData = await getIdeaWithDocuments(ideaId);

    console.log("Workflow complete!");
    console.log("Final status:", updatedData.idea.projectStatus);
    console.log("Final notes:", updatedData.idea.notes);
    console.log("Final tags:", updatedData.idea.tags);

    return updatedData;
  } catch (error) {
    console.error("Workflow failed:", error);
    throw error;
  }
}

/**
 * Example 8: Error handling patterns
 * Shows comprehensive error handling
 */
export async function exampleErrorHandling(ideaId: string) {
  try {
    const ideaData = await getIdeaWithDocuments(ideaId);
    return { success: true, data: ideaData };
  } catch (error) {
    // Type-safe error handling
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return {
          success: false,
          error: "IDEA_NOT_FOUND",
          message: error.message,
        };
      }
      if (error.message.includes("permission")) {
        return {
          success: false,
          error: "UNAUTHORIZED",
          message: error.message,
        };
      }
      if (error.message.includes("Authentication")) {
        return {
          success: false,
          error: "UNAUTHENTICATED",
          message: error.message,
        };
      }
    }

    return {
      success: false,
      error: "UNKNOWN",
      message: "An unexpected error occurred",
    };
  }
}
