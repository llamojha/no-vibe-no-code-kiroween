"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";
import {
  trackVersionHistory,
  type TrackableDocumentType,
} from "@/features/document-generator/analytics";
import type { DocumentDTO } from "@/src/infrastructure/web/dto/IdeaDTO";

/**
 * Props for the VersionHistoryModal component
 */
export interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DocumentDTO[];
  currentVersion: number;
  onRestore: (version: number) => Promise<void>;
  isLoading?: boolean;
  documentTitle?: string;
  /** Document ID for analytics tracking */
  documentId?: string;
  /** Document type for analytics tracking */
  documentType?: TrackableDocumentType;
}

/**
 * VersionHistoryModal component
 * Modal for viewing and restoring document version history
 *
 * Features:
 * - Display all versions with timestamps
 * - Show version numbers in descending order
 * - Allow selecting and viewing previous versions
 * - Add Restore button for each version
 * - Reuse existing modal styles
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  versions,
  currentVersion,
  onRestore,
  isLoading = false,
  documentTitle = "Document",
  documentId,
  documentType,
}) => {
  const { t, locale } = useLocale();
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedVersion, setSelectedVersion] = useState<DocumentDTO | null>(
    null
  );
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sort versions in descending order (newest first)
  const sortedVersions = [...versions].sort(
    (a, b) => (b.version || 1) - (a.version || 1)
  );

  // Track modal view when opened
  useEffect(() => {
    if (isOpen && documentId && documentType) {
      trackVersionHistory({
        documentId,
        documentType,
        action: "view",
        totalVersions: versions.length,
        currentVersion,
      });
    }
  }, [isOpen, documentId, documentType, versions.length, currentVersion]);

  // Format date
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

  // Handle restore
  const handleRestore = useCallback(
    async (version: number) => {
      if (isRestoring) return;

      setIsRestoring(true);
      setError(null);

      // Track restore action
      if (documentId && documentType) {
        trackVersionHistory({
          documentId,
          documentType,
          action: "restore",
          totalVersions: versions.length,
          selectedVersion: version,
          currentVersion,
        });
      }

      try {
        await onRestore(version);
        onClose();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to restore version"
        );
      } finally {
        setIsRestoring(false);
      }
    },
    [
      isRestoring,
      onRestore,
      onClose,
      documentId,
      documentType,
      versions.length,
      currentVersion,
    ]
  );

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      firstElement?.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Get content preview for a version
  const getContentPreview = (doc: DocumentDTO): string => {
    if (!doc.content) return "";

    const content = doc.content as Record<string, unknown> | string;

    if (typeof content === "string") {
      return content.slice(0, 150) + (content.length > 150 ? "..." : "");
    }

    if (typeof content === "object" && content !== null) {
      const summary =
        content.summary || content.description || content.viabilitySummary;
      if (typeof summary === "string") {
        return summary.slice(0, 150) + (summary.length > 150 ? "..." : "");
      }
    }

    return "";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-history-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl max-h-[80vh] bg-slate-900 border border-slate-700 rounded-lg shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2
              id="version-history-title"
              className="text-xl font-bold text-slate-200 uppercase tracking-wider"
            >
              {t("versionHistory") || "Version History"}
            </h2>
            <p className="text-sm text-slate-400 mt-1">{documentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
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
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="px-6 py-3 bg-red-900/30 border-b border-red-600 text-red-300 text-sm"
          >
            {error}
          </div>
        )}

        {/* Version list */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-accent"
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
            </div>
          ) : sortedVersions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {t("noVersionsFound") || "No versions found"}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedVersions.map((version) => {
                const isCurrent = version.version === currentVersion;
                const isSelected = selectedVersion?.id === version.id;

                return (
                  <div
                    key={version.id}
                    className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? "border-accent bg-accent/10"
                        : isCurrent
                        ? "border-green-500/50 bg-green-500/10"
                        : "border-slate-700 hover:border-slate-600 bg-slate-800/50"
                    }`}
                    onClick={() => {
                      setSelectedVersion(version);
                      // Track version selection
                      if (documentId && documentType) {
                        trackVersionHistory({
                          documentId,
                          documentType,
                          action: "select_version",
                          totalVersions: versions.length,
                          selectedVersion: version.version || 1,
                          currentVersion,
                        });
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedVersion(version);
                        // Track version selection
                        if (documentId && documentType) {
                          trackVersionHistory({
                            documentId,
                            documentType,
                            action: "select_version",
                            totalVersions: versions.length,
                            selectedVersion: version.version || 1,
                            currentVersion,
                          });
                        }
                      }
                    }}
                    aria-selected={isSelected}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-purple-400 font-mono">
                            v{version.version || 1}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded uppercase tracking-wider">
                              {t("current") || "Current"}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mt-1 font-mono">
                          {formatDate(version.createdAt)}
                        </p>
                        {isSelected && (
                          <p className="text-sm text-slate-300 mt-3 line-clamp-3">
                            {getContentPreview(version)}
                          </p>
                        )}
                      </div>

                      {/* Restore button (not for current version) */}
                      {!isCurrent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(version.version || 1);
                          }}
                          disabled={isRestoring}
                          className="flex-shrink-0 px-3 py-2 text-sm bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded uppercase tracking-wider"
                          aria-label={`${t("restore") || "Restore"} v${
                            version.version || 1
                          }`}
                        >
                          {isRestoring ? (
                            <svg
                              className="animate-spin h-4 w-4"
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
                            t("restore") || "Restore"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <p className="text-sm text-slate-500">
            {sortedVersions.length}{" "}
            {sortedVersions.length === 1
              ? t("version") || "version"
              : t("versions") || "versions"}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            {t("close") || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
