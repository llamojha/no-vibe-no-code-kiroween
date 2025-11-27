"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";
import {
  trackExportCompleted,
  trackExportFailed,
  type ExportDocumentType,
} from "@/features/idea-panel/analytics/tracking";
import { ExportKiroSetupUseCase } from "@/src/application/use-cases/ExportKiroSetupUseCase";
import type { ExportFormat } from "@/src/infrastructure/export/types";
import type { DocumentDTO } from "@/src/infrastructure/web/dto/IdeaDTO";

/**
 * Props for ExportOptionsModal component
 */
interface ExportOptionsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Unique identifier for the idea */
  ideaId: string;
  /** Name of the idea (used for export filename) */
  ideaName: string;
  /** Available documents for the idea */
  documents: DocumentDTO[];
}

/**
 * Export progress state
 */
type ExportState = "idle" | "exporting" | "success" | "error";

/**
 * Map document types from DocumentDTO to export document content
 */
const getDocumentContent = (
  documents: DocumentDTO[],
  docType: DocumentDTO["documentType"]
): string => {
  const doc = documents.find((d) => d.documentType === docType);
  if (!doc || !doc.content) return "";

  if (typeof doc.content === "string") {
    return doc.content;
  }

  // For structured content, convert to string representation
  if (typeof doc.content === "object") {
    // Check for markdown or text content in common fields
    const content = doc.content as Record<string, unknown>;
    if (typeof content.markdown === "string") return content.markdown;
    if (typeof content.text === "string") return content.text;
    if (typeof content.content === "string") return content.content;
    // Fallback to JSON stringification
    return JSON.stringify(doc.content, null, 2);
  }

  return "";
};

/**
 * Get available document types for analytics
 */
const getAvailableDocumentTypes = (
  documents: DocumentDTO[]
): ExportDocumentType[] => {
  const types: ExportDocumentType[] = [];
  const mapping: Partial<
    Record<DocumentDTO["documentType"], ExportDocumentType>
  > = {
    prd: "prd",
    technical_design: "design",
    architecture: "techArchitecture",
    roadmap: "roadmap",
  };

  for (const doc of documents) {
    const exportType = mapping[doc.documentType];
    if (exportType && !types.includes(exportType)) {
      types.push(exportType);
    }
  }

  return types;
};

/**
 * ExportOptionsModal component
 *
 * Displays a modal for selecting export format and initiating the export process.
 *
 * Features:
 * - Format selection (ZIP or individual files)
 * - Export progress indicator
 * - Success/error messages
 * - Analytics tracking
 *
 * Requirements: 13.1, 13.2, 13.3
 */
export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  onClose,
  ideaId,
  ideaName,
  documents,
}) => {
  const { t } = useLocale();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("zip");
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setExportState("idle");
      setErrorMessage(null);
      setExportProgress(0);
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && exportState !== "exporting") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, exportState, onClose]);

  const handleExport = useCallback(async () => {
    const startTime = Date.now();
    setExportState("exporting");
    setErrorMessage(null);
    setExportProgress(10);

    try {
      const useCase = new ExportKiroSetupUseCase();

      // Prepare document content
      setExportProgress(30);
      const exportDocuments = {
        prd: getDocumentContent(documents, "prd"),
        design: getDocumentContent(documents, "technical_design"),
        techArchitecture: getDocumentContent(documents, "architecture"),
        roadmap: getDocumentContent(documents, "roadmap"),
      };

      setExportProgress(50);

      // Execute export
      const result = await useCase.execute({
        ideaId,
        ideaName,
        format: selectedFormat,
        documents: exportDocuments,
      });

      setExportProgress(80);

      if (!result.success) {
        const error = result.error?.message || "Export failed";

        setExportState("error");
        setErrorMessage(error);

        trackExportFailed({
          ideaId,
          ideaName,
          documentTypes: getAvailableDocumentTypes(documents),
          exportFormat: selectedFormat,
          errorType: "EXPORT_FAILED",
          errorMessage: error,
        });

        return;
      }

      const payload = result.data;
      if (!payload.success) {
        const error = payload.error || "Export failed";

        setExportState("error");
        setErrorMessage(error);

        // Track export failed
        trackExportFailed({
          ideaId,
          ideaName,
          documentTypes: getAvailableDocumentTypes(documents),
          exportFormat: selectedFormat,
          errorType: "EXPORT_FAILED",
          errorMessage: error,
        });

        return;
      }

      setExportProgress(90);

      // Trigger download
      if (selectedFormat === "zip" && payload.blob) {
        // Download ZIP file
        const url = URL.createObjectURL(payload.blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = payload.filename || `kiro-setup-${ideaName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (selectedFormat === "individual" && payload.files) {
        // Download individual files
        for (const file of payload.files) {
          const blob = new Blob([file.content], { type: "text/markdown" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }

      setExportProgress(100);
      setExportState("success");

      // Track export completed
      const duration = Date.now() - startTime;
      trackExportCompleted({
        ideaId,
        ideaName,
        documentTypes: getAvailableDocumentTypes(documents),
        exportFormat: selectedFormat,
        packageSizeBytes: payload.blob?.size || 0,
        generationDurationMs: duration,
        fileCount: payload.files?.length || 1,
      });

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setExportState("error");
      setErrorMessage(errorMsg);

      // Track export failed
      trackExportFailed({
        ideaId,
        ideaName,
        documentTypes: getAvailableDocumentTypes(documents),
        exportFormat: selectedFormat,
        errorType: "UNEXPECTED_ERROR",
        errorMessage: errorMsg,
      });
    }
  }, [ideaId, ideaName, documents, selectedFormat, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={exportState !== "exporting" ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative bg-primary border border-slate-700 shadow-2xl w-full max-w-md mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2
            id="export-modal-title"
            className="text-xl font-bold text-slate-200 uppercase tracking-wider"
          >
            {t("exportToKiro") || "Export to Kiro"}
          </h2>
          {exportState !== "exporting" && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              aria-label={t("close") || "Close"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {exportState === "idle" && (
            <>
              <p className="text-sm text-slate-400 mb-6 font-mono">
                {t("exportDescription") ||
                  "Export your project documentation as a ready-to-use Kiro workspace setup."}
              </p>

              {/* Format Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  {t("selectFormat") || "Select Format"}
                </label>

                {/* ZIP Option */}
                <button
                  onClick={() => setSelectedFormat("zip")}
                  className={`
                    w-full p-4 text-left border transition-all
                    ${
                      selectedFormat === "zip"
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-slate-700 hover:border-slate-600 bg-slate-800/50"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${
                          selectedFormat === "zip"
                            ? "border-purple-500"
                            : "border-slate-500"
                        }
                      `}
                    >
                      {selectedFormat === "zip" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">
                        {t("downloadAsZip") || "Download as ZIP"}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {t("zipDescription") ||
                          "Single compressed file with all steering files and specs"}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Individual Files Option */}
                <button
                  onClick={() => setSelectedFormat("individual")}
                  className={`
                    w-full p-4 text-left border transition-all
                    ${
                      selectedFormat === "individual"
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-slate-700 hover:border-slate-600 bg-slate-800/50"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${
                          selectedFormat === "individual"
                            ? "border-purple-500"
                            : "border-slate-500"
                        }
                      `}
                    >
                      {selectedFormat === "individual" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">
                        {t("downloadIndividualFiles") ||
                          "Download Individual Files"}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {t("individualDescription") ||
                          "Separate files with folder-prefixed names"}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}

          {exportState === "exporting" && (
            <div className="text-center py-8">
              <svg
                className="animate-spin h-12 w-12 mx-auto mb-4 text-purple-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-lg text-slate-300 font-mono uppercase tracking-wider mb-4">
                {t("generatingExport") || "Generating export..."}
              </p>
              {/* Progress bar */}
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">{exportProgress}%</p>
            </div>
          )}

          {exportState === "success" && (
            <div className="text-center py-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto mb-4 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg text-green-400 font-bold uppercase tracking-wider">
                {t("exportSuccess") || "Export Complete!"}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                {t("exportSuccessDescription") ||
                  "Your Kiro setup has been downloaded."}
              </p>
            </div>
          )}

          {exportState === "error" && (
            <div className="text-center py-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto mb-4 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-lg text-red-400 font-bold uppercase tracking-wider mb-2">
                {t("exportFailed") || "Export Failed"}
              </p>
              <p className="text-sm text-slate-400 mb-4 font-mono">
                {errorMessage}
              </p>
              <button
                onClick={() => {
                  setExportState("idle");
                  setErrorMessage(null);
                }}
                className="px-4 py-2 bg-slate-700 text-slate-200 font-bold text-sm uppercase tracking-wider hover:bg-slate-600 transition-colors"
              >
                {t("tryAgain") || "Try Again"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {exportState === "idle" && (
          <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-slate-200 font-bold text-sm uppercase tracking-wider hover:bg-slate-600 transition-colors"
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              onClick={handleExport}
              className="px-6 py-2 bg-purple-600 text-white font-bold text-sm uppercase tracking-wider hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/30"
            >
              {t("export") || "Export"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportOptionsModal;
