"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/features/locale/context/LocaleContext";
import type { DashboardIdeaDTO } from "@/src/infrastructure/web/dto/IdeaDTO";

interface IdeaCardProps {
  idea: DashboardIdeaDTO;
}

/**
 * IdeaCard component
 *
 * Displays a summary card for an idea on the dashboard:
 * - Idea text (truncated)
 * - Document count
 * - Idea source badge (manual/frankenstein)
 * - Project status
 * - "Manage" button to navigate to idea panel
 * - Touch-friendly button sizing for mobile
 *
 * Requirements: 1.1, 1.2, 6.4, 9.1, 9.2, 9.3, 9.4, 9.5
 */
export const IdeaCard: React.FC<IdeaCardProps> = ({ idea }) => {
  const router = useRouter();
  const { t, locale } = useLocale();

  const analysisCategory =
    idea.source === "frankenstein"
      ? "frankenstein"
      : idea.source === "kiroween"
      ? "kiroween"
      : "idea";

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getSourceBadge = () => {
    if (idea.source === "frankenstein") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-gradient-to-r from-green-900/50 to-purple-900/50 border border-green-500 rounded text-green-400">
          <span aria-hidden="true">🧟</span>
          <span>{t("ideaSourceFrankenstein") || "Frankenstein"}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-blue-900/30 border border-blue-600 rounded text-blue-400">
        <span aria-hidden="true">✍️</span>
        <span>{t("ideaSourceManual") || "Manual"}</span>
      </span>
    );
  };

  const getStatusBadge = () => {
    const statusConfig: Record<
      string,
      { label: string; color: string; icon: string }
    > = {
      idea: {
        label: t("statusIdea") || "Idea",
        color: "text-blue-400 bg-blue-900/30 border-blue-600",
        icon: "💡",
      },
      in_progress: {
        label: t("statusInProgress") || "In Progress",
        color: "text-yellow-400 bg-yellow-900/30 border-yellow-600",
        icon: "⏳",
      },
      completed: {
        label: t("statusCompleted") || "Completed",
        color: "text-green-400 bg-green-900/30 border-green-600",
        icon: "✅",
      },
      archived: {
        label: t("statusArchived") || "Archived",
        color: "text-slate-400 bg-slate-900/30 border-slate-600",
        icon: "📦",
      },
    };

    const config = statusConfig[idea.projectStatus] || statusConfig.idea;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold border rounded ${config.color}`}
      >
        <span aria-hidden="true">{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  const handleManageClick = () => {
    router.push(`/idea/${idea.id}`);
  };

  // Truncate idea text for display
  const truncatedIdea =
    idea.ideaText.length > 150
      ? `${idea.ideaText.substring(0, 150)}...`
      : idea.ideaText;

  return (
    <div
      className="bg-primary/30 border border-slate-700 rounded-lg p-6 hover:border-accent/50 transition-all duration-200 animate-fade-in"
      data-testid="analysis-item"
      data-analysis-category={analysisCategory}
    >
      {/* Header with badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {getSourceBadge()}
        {getStatusBadge()}
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-slate-900/50 border border-slate-700 rounded text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
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
          <span data-testid="analysis-score">
            {idea.documentCount}{" "}
            {idea.documentCount === 1
              ? t("document") || "document"
              : t("documents") || "documents"}
          </span>
        </span>
      </div>

      {/* Idea text */}
      <div className="mb-4">
        <p
          className="text-slate-200 leading-relaxed"
          data-testid="analysis-title"
        >
          {truncatedIdea}
        </p>
      </div>

      {/* Tags */}
      {idea.tags && idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {idea.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent/20 border border-accent/50 rounded text-accent"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              {tag}
            </span>
          ))}
          {idea.tags.length > 5 && (
            <span className="inline-flex items-center px-2 py-1 text-xs text-slate-500">
              +{idea.tags.length - 5} {t("more") || "more"}
            </span>
          )}
        </div>
      )}

      {/* Footer with date and manage button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
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
            {formatDate(idea.createdAt)}
          </span>
          <span className="flex items-center gap-1">
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
            {formatDate(idea.updatedAt)}
          </span>
        </div>

        {/* View button */}
        <button
          onClick={handleManageClick}
          className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 text-sm font-semibold uppercase tracking-wider border border-accent text-accent rounded hover:bg-accent/10 transition-colors min-h-[44px] touch-manipulation"
          aria-label={t("viewIdeaButton") || "View this idea"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>{t("View")}</span>
        </button>
      </div>
    </div>
  );
};

export default IdeaCard;
