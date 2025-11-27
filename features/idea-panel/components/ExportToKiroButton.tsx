"use client";

import React, { useState, useMemo } from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";
import {
  DocumentValidator,
  type DocumentsToValidate,
  type ExportDocumentType,
} from "@/src/application/services/DocumentValidator";
import { trackExportInitiated } from "@/features/idea-panel/analytics/tracking";
import type { DocumentDTO } from "@/src/infrastructure/web/dto/IdeaDTO";

/**
 * Props for ExportToKiroButton component
 */
interface ExportToKiroButtonProps {
  /** Unique identifier for the idea */
  ideaId: string;
  /** Name of the idea (used for export filename) */
  ideaName: string;
  /** Available documents for the idea */
  documents: DocumentDTO[];
  /** Callback when export modal should open */
  onExportClick: () => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Map document types from DocumentDTO to ExportDocumentType
 */
const mapDocumentType = (
  docType: DocumentDTO["documentType"]
): ExportDocumentType | null => {
  const mapping: Partial<
    Record<DocumentDTO["documentType"], ExportDocumentType>
  > = {
    prd: "prd",
    technical_design: "design",
    architecture: "techArchitecture",
    roadmap: "roadmap",
  };
  return mapping[docType] ?? null;
};

/**
 * ExportToKiroButton component
 *
 * Displays an "Export to Kiro" button that enables users to export their
 * generated project documentation as a ready-to-use Kiro workspace setup.
 *
 * Features:
 * - Enabled/disabled state based on document availability
 * - Tooltip showing missing documents when disabled
 * - Analytics tracking on click
 * - Triggers export modal on click
 *
 * Requirements: 1.1, 1.5, 9.2, 9.3
 */
export const ExportToKiroButton: React.FC<ExportToKiroButtonProps> = ({
  ideaId,
  ideaName,
  documents,
  onExportClick,
  className = "",
}) => {
  const { t } = useLocale();
  const [showTooltip, setShowTooltip] = useState(false);

  // Validate document availability
  const validationResult = useMemo(() => {
    const validator = new DocumentValidator();

    // Build documents to validate from available documents
    const documentsToValidate: DocumentsToValidate = {
      prd: undefined,
      design: undefined,
      techArchitecture: undefined,
      roadmap: undefined,
    };

    // Map available documents to validation format
    for (const doc of documents) {
      const exportType = mapDocumentType(doc.documentType);
      if (exportType) {
        // Get content as string - handle different content formats
        let contentStr = "";
        if (doc.content) {
          if (typeof doc.content === "string") {
            contentStr = doc.content;
          } else if (typeof doc.content === "object") {
            // For structured content, check if it has meaningful data
            contentStr = JSON.stringify(doc.content);
          }
        }

        documentsToValidate[exportType] = {
          type: exportType,
          content: contentStr,
          exists: true,
        };
      }
    }

    return validator.validate(documentsToValidate);
  }, [documents]);

  // Get list of available document types for analytics
  const availableDocumentTypes = useMemo(() => {
    return documents
      .map((doc) => mapDocumentType(doc.documentType))
      .filter((type): type is ExportDocumentType => type !== null);
  }, [documents]);

  // Get missing documents message for tooltip
  const tooltipMessage = useMemo(() => {
    if (validationResult.isValid) {
      return t("exportReady");
    }

    const missingNames: string[] = [];

    // Add missing documents
    for (const docType of validationResult.missingDocuments) {
      missingNames.push(DocumentValidator.getDisplayName(docType));
    }

    // Add empty documents
    for (const docType of validationResult.emptyDocuments) {
      missingNames.push(`${DocumentValidator.getDisplayName(docType)} (empty)`);
    }

    return `${t("missingDocuments")}: ${missingNames.join(", ")}`;
  }, [validationResult, t]);

  const handleClick = () => {
    if (!validationResult.isValid) {
      return;
    }

    // Track export initiated event
    trackExportInitiated({
      ideaId,
      ideaName,
      documentTypes: availableDocumentTypes,
      exportFormat: "zip", // Default format, will be selected in modal
    });

    onExportClick();
  };

  const isDisabled = !validationResult.isValid;

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={`
          flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-none
          uppercase tracking-wider transition-all duration-300
          ${
            isDisabled
              ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60"
              : "bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/30 hover:shadow-purple-500/40 transform hover:scale-105"
          }
        `}
        aria-label={
          isDisabled ? tooltipMessage : t("exportToKiro")
        }
        aria-disabled={isDisabled}
      >
        {/* Kiro/Export Icon */}
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
        <span>{t("exportToKiro")}</span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={`
            absolute z-50 px-3 py-2 text-xs font-mono
            bg-slate-800 border border-slate-600 rounded-none shadow-lg
            whitespace-nowrap
            bottom-full left-1/2 transform -translate-x-1/2 mb-2
            ${isDisabled ? "text-amber-400" : "text-green-400"}
          `}
          role="tooltip"
        >
          {tooltipMessage}
          {/* Tooltip arrow */}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px"
            aria-hidden="true"
          >
            <div className="border-4 border-transparent border-t-slate-600" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportToKiroButton;
