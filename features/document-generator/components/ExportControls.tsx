"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";
import {
  exportDocument,
  downloadExportedDocument,
  type ExportFormat,
} from "@/features/idea-panel/api/documentGeneration";
import {
  trackDocumentExport,
  type TrackableDocumentType,
} from "@/features/document-generator/analytics";

/**
 * Props for the ExportControls component
 */
export interface ExportControlsProps {
  documentId: string;
  documentTitle?: string;
  onExportStart?: () => void;
  onExportComplete?: (format: ExportFormat) => void;
  onExportError?: (error: Error) => void;
  disabled?: boolean;
  /** Document type for analytics tracking */
  documentType?: TrackableDocumentType;
}

/**
 * ExportControls component
 * Dropdown component for exporting documents in multiple formats
 *
 * Features:
 * - Display Export button
 * - Show format options (Markdown, PDF)
 * - Handle export download
 * - Show loading state during export
 * - Reuse existing button styles
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */
export const ExportControls: React.FC<ExportControlsProps> = ({
  documentId,
  documentTitle = "document",
  onExportStart,
  onExportComplete,
  onExportError,
  disabled = false,
  documentType,
}) => {
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle export
  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (isExporting || disabled) return;

      setIsExporting(true);
      setExportingFormat(format);
      onExportStart?.();

      try {
        const result = await exportDocument(documentId, format);
        downloadExportedDocument(result);

        // Track successful export
        if (documentType) {
          trackDocumentExport({
            documentId,
            documentType,
            format: format as "markdown" | "pdf",
            success: true,
            fileSizeBytes: result.blob.size,
          });
        }

        onExportComplete?.(format);
        setIsOpen(false);
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Export failed");

        // Track failed export
        if (documentType) {
          trackDocumentExport({
            documentId,
            documentType,
            format: format as "markdown" | "pdf",
            success: false,
            errorMessage: err.message,
          });
        }

        onExportError?.(err);
        console.error("Export failed:", error);
      } finally {
        setIsExporting(false);
        setExportingFormat(null);
      }
    },
    [
      documentId,
      disabled,
      isExporting,
      onExportStart,
      onExportComplete,
      onExportError,
      documentType,
    ]
  );

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    if (!disabled && !isExporting) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled, isExporting]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Export button */}
      <button
        onClick={toggleDropdown}
        disabled={disabled || isExporting}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium uppercase tracking-wider text-slate-300 bg-primary/50 border border-slate-600 rounded-none hover:bg-green-500/20 hover:text-green-400 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-green-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t("exportDocument") || "Export document"}
        data-testid="export-button"
      >
        {isExporting ? (
          <svg
            className="animate-spin h-5 w-5"
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
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span>{t("export") || "Export"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transform transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 bottom-full mb-2 w-56 origin-bottom-right bg-primary border border-slate-700 rounded-none shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 animate-fade-in"
          style={{ animationDuration: "150ms" }}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="export-menu-button"
        >
          <div className="py-1">
            {/* Markdown export option */}
            <button
              onClick={() => handleExport("markdown")}
              disabled={isExporting}
              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-accent/20 hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              role="menuitem"
              data-testid="export-markdown-button"
            >
              {exportingFormat === "markdown" ? (
                <svg
                  className="animate-spin h-5 w-5"
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
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              )}
              <div className="flex-1">
                <span className="block font-medium">
                  {t("exportAsMarkdown") || "Markdown (.md)"}
                </span>
                <span className="block text-xs text-slate-500">
                  {t("markdownDescription") || "Plain text with formatting"}
                </span>
              </div>
            </button>

            {/* PDF export option */}
            <button
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-accent/20 hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              role="menuitem"
              data-testid="export-pdf-button"
            >
              {exportingFormat === "pdf" ? (
                <svg
                  className="animate-spin h-5 w-5"
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
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              )}
              <div className="flex-1">
                <span className="block font-medium">
                  {t("exportAsPDF") || "PDF (.pdf)"}
                </span>
                <span className="block text-xs text-slate-500">
                  {t("pdfDescription") || "Formatted document for sharing"}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportControls;
