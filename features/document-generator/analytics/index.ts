/**
 * Document Generator Analytics Module
 *
 * Exports all analytics tracking functions and types for the document generation feature.
 *
 * Requirements: All requirements for observability
 */

export {
  trackDocumentGenerationRequest,
  trackDocumentGenerationSuccess,
  trackDocumentGenerationFailure,
  trackDocumentEdit,
  trackVersionHistory,
  trackDocumentRegeneration,
  trackDocumentExport,
  trackFeatureFlag,
  trackCreditUsage,
  trackGeneratorPageView,
} from "./tracking";

export type {
  TrackableDocumentType,
  TrackableExportFormat,
  DocumentGenerationRequestProps,
  DocumentGenerationSuccessProps,
  DocumentGenerationFailureProps,
  DocumentEditProps,
  VersionHistoryProps,
  DocumentRegenerationProps,
  DocumentExportProps,
  FeatureFlagProps,
  CreditUsageProps,
} from "./tracking";
