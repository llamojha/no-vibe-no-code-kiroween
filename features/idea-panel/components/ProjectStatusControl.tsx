"use client";

import React, { useState } from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";
import type { IdeaDTO } from "@/src/infrastructure/web/dto/IdeaDTO";
import { trackStatusUpdate } from "@/features/idea-panel/analytics/tracking";

interface ProjectStatusControlProps {
  idea: IdeaDTO;
  onStatusUpdate: (newStatus: IdeaDTO["projectStatus"]) => Promise<void>;
}

type ProjectStatus = "idea" | "in_progress" | "completed" | "archived";

/**
 * ProjectStatusControl component
 *
 * Provides controls for managing project status:
 * - Displays current status with visual indicator
 * - Provides dropdown/buttons for status updates
 * - Updates status indicator immediately on change
 * - Displays last updated timestamp
 *
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */
export const ProjectStatusControl: React.FC<ProjectStatusControlProps> = ({
  idea,
  onStatusUpdate,
}) => {
  const { t, locale } = useLocale();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const statusOptions: ProjectStatus[] = [
    "idea",
    "in_progress",
    "completed",
    "archived",
  ];

  const getStatusLabel = (status: ProjectStatus): string => {
    const labels: Record<ProjectStatus, string> = {
      idea: t("statusIdea") || "Idea",
      in_progress: t("statusInProgress") || "In Progress",
      completed: t("statusCompleted") || "Completed",
      archived: t("statusArchived") || "Archived",
    };
    return labels[status];
  };

  const getStatusColor = (status: ProjectStatus): string => {
    const colors: Record<ProjectStatus, string> = {
      idea: "text-blue-400 bg-blue-900/30 border-blue-600",
      in_progress: "text-yellow-400 bg-yellow-900/30 border-yellow-600",
      completed: "text-green-400 bg-green-900/30 border-green-600",
      archived: "text-slate-400 bg-slate-900/30 border-slate-600",
    };
    return colors[status];
  };

  const getStatusIcon = (status: ProjectStatus) => {
    const icons: Record<ProjectStatus, JSX.Element> = {
      idea: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
        </svg>
      ),
      in_progress: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
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
      ),
      completed: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      archived: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
          <path
            fillRule="evenodd"
            d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };
    return icons[status];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (newStatus === idea.projectStatus || isUpdating) return;

    const previousStatus = idea.projectStatus;
    setIsUpdating(true);
    setShowDropdown(false);

    try {
      await onStatusUpdate(newStatus);

      // Track status update
      trackStatusUpdate({
        ideaId: idea.id,
        previousStatus,
        newStatus,
        ideaSource: idea.source,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      // Error handling is done in parent component
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="bg-primary/30 border border-slate-700 p-6 animate-fade-in"
      style={{ animationDelay: "100ms" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Current status display */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            {t("projectStatusLabel") || "Project Status"}
          </h3>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded ${getStatusColor(
              idea.projectStatus
            )}`}
          >
            {getStatusIcon(idea.projectStatus)}
            <span className="font-semibold uppercase tracking-wider">
              {getStatusLabel(idea.projectStatus)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-mono">
            {t("lastUpdatedLabel") || "Last updated"}:{" "}
            {formatDate(idea.updatedAt)}
          </p>
        </div>

        {/* Status update dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isUpdating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider border border-accent text-accent rounded-none hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("updateStatusLabel") || "Update status"}
            aria-expanded={showDropdown}
            aria-haspopup="true"
          >
            {isUpdating ? (
              <>
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
                <span>{t("updating") || "Updating..."}</span>
              </>
            ) : (
              <>
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
                <span>{t("updateStatus") || "Update Status"}</span>
              </>
            )}
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <div
              className="absolute right-0 mt-2 w-56 bg-primary border border-slate-700 rounded-none shadow-xl z-10 animate-fade-in"
              role="menu"
              aria-orientation="vertical"
            >
              <div className="py-1">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={status === idea.projectStatus}
                    className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${
                      status === idea.projectStatus
                        ? "bg-slate-800/50 cursor-default"
                        : "hover:bg-slate-800/50"
                    } ${getStatusColor(status).split(" ")[0]}`}
                    role="menuitem"
                  >
                    {getStatusIcon(status)}
                    <span className="font-semibold uppercase tracking-wider">
                      {getStatusLabel(status)}
                    </span>
                    {status === idea.projectStatus && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-auto"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default ProjectStatusControl;
