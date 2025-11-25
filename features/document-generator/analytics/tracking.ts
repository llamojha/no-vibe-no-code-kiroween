"use client";

import posthog from "posthog-js";

/**
 * Document Generation Analytics Tracking
 *
 * This module provides analytics tracking for the document generation feature.
 * It tracks document generation requests, success/failure rates, credit usage,
 * editing events, version history usage, regeneration events, export functionality,
 * and feature flag adoption.
 *
 * Requirements: All requirements for observability
 */

/**
 * Document types that can be generated
 */
export type TrackableDocumentType =
  | "prd"
  | "technical_design"
  | "architecture"
  | "roadmap";

/**
 * Export format types
 */
export type TrackableExportFormat = "markdown" | "pdf";

/**
 * Properties for document generation request events
 */
export interface DocumentGenerationRequestProps {
  ideaId: string;
  documentType: TrackableDocumentType;
  creditCost: number;
  userCredits: number;
  hasExistingDocuments: boolean;
  existingDocumentTypes?: string[];
}

/**
 * Properties for document generation success events
 */
export interface DocumentGenerationSuccessProps {
  ideaId: string;
  documentId: string;
  documentType: TrackableDocumentType;
  creditCost: number;
  generationTimeMs: number;
  version: number;
}

/**
 * Properties for document generation failure events
 */
export interface DocumentGenerationFailureProps {
  ideaId: string;
  documentType: TrackableDocumentType;
  errorType: "insufficient_credits" | "ai_error" | "network_error" | "unknown";
  errorMessage: string;
  creditsRefunded: boolean;
}

/**
 * Properties for document editing events
 */
export interface DocumentEditProps {
  documentId: string;
  documentType: TrackableDocumentType;
  action: "start_edit" | "save" | "cancel" | "auto_save";
  previousVersion: number;
  newVersion?: number;
  contentLengthChange?: number;
}

/**
 * Properties for version history events
 */
export interface VersionHistoryProps {
  documentId: string;
  documentType: TrackableDocumentType;
  action: "view" | "select_version" | "restore";
  totalVersions: number;
  selectedVersion?: number;
  currentVersion?: number;
}

/**
 * Properties for document regeneration events
 */
export interface DocumentRegenerationProps {
  documentId: string;
  documentType: TrackableDocumentType;
  action: "request" | "confirm" | "cancel" | "success" | "failure";
  creditCost?: number;
  previousVersion?: number;
  newVersion?: number;
  errorMessage?: string;
}

/**
 * Properties for document export events
 */
export interface DocumentExportProps {
  documentId: string;
  documentType: TrackableDocumentType;
  format: TrackableExportFormat;
  success: boolean;
  errorMessage?: string;
  fileSizeBytes?: number;
}

/**
 * Properties for feature flag tracking
 */
export interface FeatureFlagProps {
  flagName: string;
  flagValue: boolean;
  context: "page_load" | "button_visibility" | "api_request";
}

/**
 * Properties for credit usage tracking
 */
export interface CreditUsageProps {
  documentType: TrackableDocumentType;
  action: "check" | "deduct" | "refund";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  success: boolean;
}

/**
 * Helper function to check if PostHog is available and loaded
 * @returns true if PostHog is available, false otherwise
 */
const isPostHogAvailable = (): boolean => {
  return typeof window !== "undefined" && posthog.__loaded;
};

/**
 * Track document generation request
 * @param props Document generation request properties
 */
export const trackDocumentGenerationRequest = (
  props: DocumentGenerationRequestProps
): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      idea_id: props.ideaId,
      document_type: props.documentType,
      credit_cost: props.creditCost,
      user_credits: props.userCredits,
      has_existing_documents: props.hasExistingDocuments,
      existing_document_types: props.existingDocumentTypes?.join(",") || "",
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 📄 document_generation_requested", eventData);

    posthog.capture("document_generation_requested", eventData);
  } catch (error) {
    console.error(
      "[Analytics] Failed to track document generation request:",
      error
    );
  }
};

/**
 * Track document generation success
 * @param props Document generation success properties
 */
export const trackDocumentGenerationSuccess = (
  props: DocumentGenerationSuccessProps
): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      idea_id: props.ideaId,
      document_id: props.documentId,
      document_type: props.documentType,
      credit_cost: props.creditCost,
      generation_time_ms: props.generationTimeMs,
      version: props.version,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] ✅ document_generation_success", eventData);

    posthog.capture("document_generation_success", eventData);
  } catch (error) {
    console.error(
      "[Analytics] Failed to track document generation success:",
      error
    );
  }
};

/**
 * Track document generation failure
 * @param props Document generation failure properties
 */
export const trackDocumentGenerationFailure = (
  props: DocumentGenerationFailureProps
): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      idea_id: props.ideaId,
      document_type: props.documentType,
      error_type: props.errorType,
      error_message: props.errorMessage,
      credits_refunded: props.creditsRefunded,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] ❌ document_generation_failure", eventData);

    posthog.capture("document_generation_failure", eventData);
  } catch (error) {
    console.error(
      "[Analytics] Failed to track document generation failure:",
      error
    );
  }
};

/**
 * Track document editing events
 * @param props Document edit properties
 */
export const trackDocumentEdit = (props: DocumentEditProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      document_id: props.documentId,
      document_type: props.documentType,
      action: props.action,
      previous_version: props.previousVersion,
      new_version: props.newVersion,
      content_length_change: props.contentLengthChange,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] ✏️ document_edited", eventData);

    posthog.capture("document_edited", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track document edit:", error);
  }
};

/**
 * Track version history events
 * @param props Version history properties
 */
export const trackVersionHistory = (props: VersionHistoryProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      document_id: props.documentId,
      document_type: props.documentType,
      action: props.action,
      total_versions: props.totalVersions,
      selected_version: props.selectedVersion,
      current_version: props.currentVersion,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 📜 version_history_action", eventData);

    posthog.capture("version_history_action", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track version history:", error);
  }
};

/**
 * Track document regeneration events
 * @param props Document regeneration properties
 */
export const trackDocumentRegeneration = (
  props: DocumentRegenerationProps
): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      document_id: props.documentId,
      document_type: props.documentType,
      action: props.action,
      credit_cost: props.creditCost,
      previous_version: props.previousVersion,
      new_version: props.newVersion,
      error_message: props.errorMessage,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 🔄 document_regeneration", eventData);

    posthog.capture("document_regeneration", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track document regeneration:", error);
  }
};

/**
 * Track document export events
 * @param props Document export properties
 */
export const trackDocumentExport = (props: DocumentExportProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      document_id: props.documentId,
      document_type: props.documentType,
      format: props.format,
      success: props.success,
      error_message: props.errorMessage,
      file_size_bytes: props.fileSizeBytes,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 📤 document_exported", eventData);

    posthog.capture("document_exported", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track document export:", error);
  }
};

/**
 * Track feature flag status
 * @param props Feature flag properties
 */
export const trackFeatureFlag = (props: FeatureFlagProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      flag_name: props.flagName,
      flag_value: props.flagValue,
      context: props.context,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 🚩 feature_flag_checked", eventData);

    posthog.capture("feature_flag_checked", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track feature flag:", error);
  }
};

/**
 * Track credit usage for document generation
 * @param props Credit usage properties
 */
export const trackCreditUsage = (props: CreditUsageProps): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      document_type: props.documentType,
      action: props.action,
      amount: props.amount,
      balance_before: props.balanceBefore,
      balance_after: props.balanceAfter,
      success: props.success,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 💳 document_credit_usage", eventData);

    posthog.capture("document_credit_usage", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track credit usage:", error);
  }
};

/**
 * Track generator page view
 * @param ideaId The idea ID
 * @param documentType The document type being generated
 */
export const trackGeneratorPageView = (
  ideaId: string,
  documentType: TrackableDocumentType
): void => {
  if (!isPostHogAvailable()) return;

  try {
    const eventData = {
      idea_id: ideaId,
      document_type: documentType,
      timestamp: new Date().toISOString(),
    };

    console.log("[PostHog] 👁️ generator_page_viewed", eventData);

    posthog.capture("generator_page_viewed", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track generator page view:", error);
  }
};
