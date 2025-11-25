"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { DocumentType } from "@/src/domain/value-objects/DocumentType";
import {
  getDocumentDisplayName,
  getDocumentColor,
  getDocumentIcon,
} from "@/lib/documents";
import type { DocumentDTO } from "@/src/infrastructure/web/dto/IdeaDTO";

/**
 * Props for the DocumentCard component
 */
export interface DocumentCardProps {
  document: DocumentDTO;
  ideaId: string;
  onEdit?: (documentId: string) => void;
  onView?: (documentId: string) => void;
  onRegenerate?: (documentId: string) => void;
  onViewVersions?: (documentId: string) => void;
  onExport?: (documentId: string) => void;
  defaultExpanded?: boolean;
  showExpandToggle?: boolean;
  viewLabel?: string;
}

/**
 * Icon components for document types
 */
const DocumentIcons: Record<string, React.FC<{ className?: string }>> = {
  prd: ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
        clipRule="evenodd"
      />
    </svg>
  ),
  technical_design: ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  ),
  architecture: ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
    </svg>
  ),
  roadmap: ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  startup_analysis: ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
      <path
        fillRule="evenodd"
        d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
        clipRule="evenodd"
      />
    </svg>
  ),
  hackathon_analysis: ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

/**
 * Color mapping for document types
 */
const colorClasses: Record<string, { icon: string; border: string }> = {
  blue: { icon: "text-blue-400", border: "border-blue-500/30" },
  purple: { icon: "text-purple-400", border: "border-purple-500/30" },
  green: { icon: "text-green-400", border: "border-green-500/30" },
  orange: { icon: "text-orange-400", border: "border-orange-500/30" },
  teal: { icon: "text-teal-400", border: "border-teal-500/30" },
  gray: { icon: "text-slate-400", border: "border-slate-500/30" },
};

/**
 * DocumentCard component
 * Shared component for displaying all document types (PRD, Technical Design, Architecture, Roadmap)
 *
 * Features:
 * - Display document type with icon and color
 * - Display document creation date and last updated
 * - Display content preview
 * - Support expand/collapse for full content
 * - Display Edit, Regenerate, Version History, and Export buttons
 * - Adapt display based on document type
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 12.1, 13.1, 14.1
 */
export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  ideaId,
  onEdit,
  onView,
  onRegenerate,
  onViewVersions,
  onExport,
  defaultExpanded = false,
  showExpandToggle = true,
  viewLabel,
}) => {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Get document type info
  const documentType = DocumentType.fromString(document.documentType);
  const displayName = getDocumentDisplayName(documentType);
  const color = getDocumentColor(documentType);
  const colorClass = colorClasses[color] || colorClasses.gray;

  // Get icon component
  const IconComponent =
    DocumentIcons[document.documentType] || DocumentIcons.prd;

  // Format dates
  const formatDate = useCallback(
    (dateString: string): string => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    },
    [locale]
  );

  // Handle edit click
  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit(document.id);
    }
  }, [document.id, onEdit]);

  // Handle view click (can be used for view + edit)
  const handleView = useCallback(() => {
    if (onView) {
      onView(document.id);
      return;
    }
    if (onEdit) {
      onEdit(document.id);
    }
  }, [document.id, onView, onEdit]);

  // Handle regenerate click
  const handleRegenerate = useCallback(() => {
    if (onRegenerate) {
      onRegenerate(document.id);
    }
  }, [document.id, onRegenerate]);

  // Handle version history click
  const handleViewVersions = useCallback(() => {
    if (onViewVersions) {
      onViewVersions(document.id);
    }
  }, [document.id, onViewVersions]);

  // Handle export click
  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(document.id);
    }
  }, [document.id, onExport]);

  // Toggle expand/collapse
  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Check if this is a generated document (not analysis)
  const isGeneratedDocument = documentType.isGeneratedDocument();

  const convertMarkdownToHtml = useCallback((markdown: string): string => {
    let html = markdown
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(
        /^### (.+)$/gm,
        '<h3 class="text-lg font-bold text-slate-200 mt-4 mb-2">$1</h3>'
      )
      .replace(
        /^## (.+)$/gm,
        '<h2 class="text-xl font-bold text-slate-200 mt-6 mb-3">$1</h2>'
      )
      .replace(
        /^# (.+)$/gm,
        '<h1 class="text-2xl font-bold text-slate-200 mt-8 mb-4">$1</h1>'
      )
      .replace(
        /\*\*(.+?)\*\*/g,
        '<strong class="font-bold text-slate-200">$1</strong>'
      )
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      .replace(
        /```(\w*)\n([\s\S]*?)```/g,
        '<pre class="bg-slate-900 p-4 rounded my-4 overflow-x-auto"><code class="text-sm text-green-400">$2</code></pre>'
      )
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-slate-800 px-1 py-0.5 rounded text-green-400">$1</code>'
      )
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/\n\n+/g, '</p><p class="my-4">')
      .replace(/\n/g, "<br />");

    return `<p class="my-4">${html}</p>`;
  }, []);

  const markdownContent = useMemo(() => {
    if (!document.content) return null;

    const content = document.content as Record<string, unknown> | string;

    if (typeof content === "object" && content !== null) {
      const markdownValue = (content as Record<string, unknown>)["markdown"];
      if (typeof markdownValue === "string") {
        return markdownValue;
      }
    }

    if (typeof content === "string" && content.trim()) {
      return content;
    }

    return null;
  }, [document.content]);

  const renderedMarkdown = useMemo(() => {
    if (!markdownContent) return null;
    return convertMarkdownToHtml(markdownContent);
  }, [markdownContent, convertMarkdownToHtml]);

  const contentPreview = useMemo((): string => {
    if (markdownContent) {
      const normalized = markdownContent.replace(/\s+/g, " ").trim();
      return normalized.length > 200
        ? `${normalized.slice(0, 200)}...`
        : normalized;
    }

    if (!document.content) return "";

    const content = document.content as Record<string, unknown> | string;

    if (typeof content === "string") {
      return content.slice(0, 200) + (content.length > 200 ? "..." : "");
    }

    if (typeof content === "object" && content !== null) {
      const summary =
        content.summary || content.description || content.viabilitySummary;
      if (typeof summary === "string") {
        return summary.slice(0, 200) + (summary.length > 200 ? "..." : "");
      }
      return JSON.stringify(content).slice(0, 200) + "...";
    }

    return "";
  }, [document.content, markdownContent]);

  const fullContent = useMemo((): string => {
    if (markdownContent) {
      return markdownContent;
    }

    if (!document.content) return "";

    const content = document.content as Record<string, unknown> | string;

    if (typeof content === "string") {
      return content;
    }

    if (typeof content === "object" && content !== null) {
      return JSON.stringify(content, null, 2);
    }

    return "";
  }, [document.content, markdownContent]);

  return (
    <article
      className={`bg-black/30 border ${colorClass.border} overflow-hidden transition-all duration-200 hover:border-slate-600`}
      aria-labelledby={`document-title-${document.id}`}
    >
      {/* Document Header */}
      <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Left side: Icon and info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`flex-shrink-0 ${colorClass.icon}`}>
            <IconComponent className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id={`document-title-${document.id}`}
              className="text-lg font-semibold text-slate-200 truncate uppercase tracking-wider"
            >
              {document.title || displayName}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-400 font-mono">
              <span>{formatDate(document.createdAt)}</span>
              {document.updatedAt &&
                document.updatedAt !== document.createdAt && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span>
                      {t("updatedAt") || "Updated"}:{" "}
                      {formatDate(document.updatedAt)}
                    </span>
                  </>
                )}
              {document.version && document.version > 1 && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-purple-400">v{document.version}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {/* View Button - preferred call to view/edit document */}
          {(onView || onEdit) && (
            <button
              onClick={handleView}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/40 border border-slate-700 text-slate-200 hover:bg-accent/20 hover:text-accent hover:border-accent transition-colors rounded-none uppercase tracking-wider"
              aria-label={t("viewDocument") || "View document"}
              data-testid="view-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10 3.5C5 3.5 1.27 7.61 1 10c.27 2.39 4 6.5 9 6.5s8.73-4.11 9-6.5c-.27-2.39-4-6.5-9-6.5zm0 11c-3.46 0-6.65-2.9-7.74-5 1.09-2.1 4.28-5 7.74-5s6.65 2.9 7.74 5c-1.09 2.1-4.28 5-7.74 5z" />
                <path d="M10 7a3 3 0 110 6 3 3 0 010-6z" />
              </svg>
              <span className="hidden sm:inline">
                {viewLabel || t("viewAndEdit") || "View / Edit"}
              </span>
            </button>
          )}

          {/* Edit Button - Only for generated documents */}
          {isGeneratedDocument && onEdit && !onView && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/40 border border-slate-700 text-slate-300 hover:bg-secondary/20 hover:text-secondary hover:border-secondary transition-colors rounded-none uppercase tracking-wider"
              aria-label={t("editDocument") || "Edit document"}
              data-testid="edit-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path
                  fillRule="evenodd"
                  d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden sm:inline">{t("edit") || "Edit"}</span>
            </button>
          )}

          {/* Regenerate Button - Only for generated documents */}
          {isGeneratedDocument && onRegenerate && (
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/40 border border-slate-700 text-slate-300 hover:bg-accent/20 hover:text-accent hover:border-accent transition-colors rounded-none uppercase tracking-wider"
              aria-label={t("regenerateDocument") || "Regenerate document"}
              data-testid="regenerate-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden sm:inline">
                {t("regenerate") || "Regenerate"}
              </span>
            </button>
          )}

          {/* Version History Button */}
          {onViewVersions && document.version && document.version > 1 && (
            <button
              onClick={handleViewVersions}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/40 border border-slate-700 text-slate-300 hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500 transition-colors rounded-none uppercase tracking-wider"
              aria-label={t("viewVersionHistory") || "View version history"}
              data-testid="version-history-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden sm:inline">
                {t("history") || "History"}
              </span>
            </button>
          )}

          {/* Export Button */}
          {onExport && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/40 border border-slate-700 text-slate-300 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500 transition-colors rounded-none uppercase tracking-wider"
              aria-label={t("exportDocument") || "Export document"}
              data-testid="export-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
              <span className="hidden sm:inline">
                {t("export") || "Export"}
              </span>
            </button>
          )}

          {/* Expand/Collapse Button */}
          {showExpandToggle && (
            <button
              onClick={toggleExpand}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/40 border border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 hover:border-slate-600 transition-colors rounded-none uppercase tracking-wider"
              aria-expanded={isExpanded}
              aria-controls={`document-content-${document.id}`}
              aria-label={
                isExpanded
                  ? t("collapse") || "Collapse"
                  : t("expand") || "Expand"
              }
            >
              <span className="hidden sm:inline">
                {isExpanded
                  ? t("collapse") || "Collapse"
                  : t("expand") || "Expand"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
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
          )}
        </div>
      </div>

      {/* Content Preview (always visible) */}
      {!isExpanded && (
        <div className="px-6 pb-4">
          <p className="text-sm text-slate-400 font-mono line-clamp-2">
            {contentPreview}
          </p>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div
          id={`document-content-${document.id}`}
          className="px-6 pb-6 border-t border-slate-800 pt-4 animate-fade-in"
        >
          <div className="bg-slate-900/50 border border-slate-800 p-4 max-h-96 overflow-y-auto">
            {renderedMarkdown ? (
              <div
                className="prose prose-invert max-w-none text-slate-200"
                dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
              />
            ) : (
              <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap break-words">
                {fullContent}
              </pre>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export default DocumentCard;
