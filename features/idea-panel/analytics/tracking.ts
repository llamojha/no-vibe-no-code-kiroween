"use client";

import posthog from "posthog-js";

/**
 * Event property interfaces for Idea Panel analytics tracking
 */

/**
 * Properties for idea panel view events
 */
export interface IdeaPanelViewProps {
  ideaId: string;
  ideaSource: "manual" | "frankenstein";
  projectStatus: "idea" | "in_progress" | "completed" | "archived";
  documentCount: number;
  hasNotes: boolean;
  tagCount: number;
}

/**
 * Properties for status update events
 */
export interface StatusUpdateProps {
  ideaId: string;
  previousStatus: "idea" | "in_progress" | "completed" | "archived";
  newStatus: "idea" | "in_progress" | "completed" | "archived";
  ideaSource: "manual" | "frankenstein";
}

/**
 * Properties for notes save events
 */
export interface NotesSaveProps {
  ideaId: string;
  notesLength: number;
  hadPreviousNotes: boolean;
  ideaSource: "manual" | "frankenstein";
}

/**
 * Properties for tags management events
 */
export interface TagsManagementProps {
  ideaId: string;
  action: "add" | "remove" | "save";
  tagCount: number;
  previousTagCount?: number;
  ideaSource: "manual" | "frankenstein";
}

/**
 * Properties for document view events
 */
export interface DocumentViewProps {
  ideaId: string;
  documentId: string;
  documentType: "startup_analysis" | "hackathon_analysis";
  action: "expand" | "collapse";
}

/**
 * Properties for analyze button click events
 */
export interface AnalyzeButtonClickProps {
  ideaId: string;
  analysisType: "startup" | "hackathon";
  ideaSource: "manual" | "frankenstein";
  existingDocumentCount: number;
}

/**
 * Helper function to check if PostHog is available and loaded
 * @returns true if PostHog is available, false otherwise
 */
const isPostHogAvailable = (): boolean => {
  return typeof window !== "undefined" && posthog.__loaded;
};

/**
 * Track idea panel opens
 * @param props Idea panel view properties
 */
export const trackIdeaPanelView = (props: IdeaPanelViewProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      idea_id: props.ideaId,
      idea_source: props.ideaSource,
      project_status: props.projectStatus,
      document_count: props.documentCount,
      has_notes: props.hasNotes,
      tag_count: props.tagCount,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 📋 idea_panel_viewed", eventData);

    posthog.capture("idea_panel_viewed", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track idea panel view:", error);
  }
};

/**
 * Track status updates
 * @param props Status update properties
 */
export const trackStatusUpdate = (props: StatusUpdateProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      idea_id: props.ideaId,
      previous_status: props.previousStatus,
      new_status: props.newStatus,
      idea_source: props.ideaSource,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 🔄 idea_status_updated", eventData);

    posthog.capture("idea_status_updated", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track status update:", error);
  }
};

/**
 * Track notes saves
 * @param props Notes save properties
 */
export const trackNotesSave = (props: NotesSaveProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      idea_id: props.ideaId,
      notes_length: props.notesLength,
      had_previous_notes: props.hadPreviousNotes,
      idea_source: props.ideaSource,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 📝 idea_notes_saved", eventData);

    posthog.capture("idea_notes_saved", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track notes save:", error);
  }
};

/**
 * Track tags management
 * @param props Tags management properties
 */
export const trackTagsManagement = (props: TagsManagementProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      idea_id: props.ideaId,
      action: props.action,
      tag_count: props.tagCount,
      previous_tag_count: props.previousTagCount,
      idea_source: props.ideaSource,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 🏷️ idea_tags_managed", eventData);

    posthog.capture("idea_tags_managed", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track tags management:", error);
  }
};

/**
 * Track document views
 * @param props Document view properties
 */
export const trackDocumentView = (props: DocumentViewProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      idea_id: props.ideaId,
      document_id: props.documentId,
      document_type: props.documentType,
      action: props.action,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 📄 idea_document_viewed", eventData);

    posthog.capture("idea_document_viewed", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track document view:", error);
  }
};

/**
 * Track analyze button clicks
 * @param props Analyze button click properties
 */
export const trackAnalyzeButtonClick = (
  props: AnalyzeButtonClickProps
): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      idea_id: props.ideaId,
      analysis_type: props.analysisType,
      idea_source: props.ideaSource,
      existing_document_count: props.existingDocumentCount,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 🔬 idea_analyze_clicked", eventData);

    posthog.capture("idea_analyze_clicked", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track analyze button click:", error);
  }
};

/**
 * Document types that can be included in an export
 */
export type ExportDocumentType =
  | "prd"
  | "design"
  | "techArchitecture"
  | "roadmap";

/**
 * Properties for export initiated events
 * Tracks when a user clicks the Export to Kiro button
 */
export interface ExportInitiatedProps {
  ideaId: string;
  ideaName: string;
  userId?: string;
  documentTypes: ExportDocumentType[];
  exportFormat: "zip" | "individual";
}

/**
 * Properties for export completed events
 * Tracks successful export package generation
 */
export interface ExportCompletedProps {
  ideaId: string;
  ideaName: string;
  userId?: string;
  documentTypes: ExportDocumentType[];
  exportFormat: "zip" | "individual";
  packageSizeBytes: number;
  generationDurationMs: number;
  fileCount: number;
}

/**
 * Properties for export failed events
 * Tracks export failures with error details
 */
export interface ExportFailedProps {
  ideaId: string;
  ideaName: string;
  userId?: string;
  documentTypes: ExportDocumentType[];
  exportFormat: "zip" | "individual";
  errorType: string;
  errorMessage: string;
}

/**
 * Track export initiated events
 * Called when user clicks the Export to Kiro button
 * @param props Export initiated properties
 * Requirements: 10.1, 10.4, 10.5
 */
export const trackExportInitiated = (props: ExportInitiatedProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      idea_id: props.ideaId,
      idea_name: props.ideaName,
      user_id: props.userId,
      document_types: props.documentTypes,
      export_format: props.exportFormat,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 📦 export_initiated", eventData);

    posthog.capture("export_initiated", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track export initiated:", error);
  }
};

/**
 * Track export completed events
 * Called when export package generation completes successfully
 * @param props Export completed properties
 * Requirements: 10.2, 10.4, 10.5
 */
export const trackExportCompleted = (props: ExportCompletedProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      idea_id: props.ideaId,
      idea_name: props.ideaName,
      user_id: props.userId,
      document_types: props.documentTypes,
      export_format: props.exportFormat,
      package_size_bytes: props.packageSizeBytes,
      generation_duration_ms: props.generationDurationMs,
      file_count: props.fileCount,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] ✅ export_completed", eventData);

    posthog.capture("export_completed", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track export completed:", error);
  }
};

/**
 * Track export failed events
 * Called when export package generation fails
 * @param props Export failed properties
 * Requirements: 10.3, 10.4, 10.5
 */
export const trackExportFailed = (props: ExportFailedProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      idea_id: props.ideaId,
      idea_name: props.ideaName,
      user_id: props.userId,
      document_types: props.documentTypes,
      export_format: props.exportFormat,
      error_type: props.errorType,
      error_message: props.errorMessage,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] ❌ export_failed", eventData);

    posthog.capture("export_failed", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track export failed:", error);
  }
};
