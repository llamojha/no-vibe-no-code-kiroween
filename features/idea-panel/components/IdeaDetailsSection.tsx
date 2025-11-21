"use client";

import React from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";
import type { IdeaDTO } from "@/src/infrastructure/web/dto/IdeaDTO";

interface IdeaDetailsSectionProps {
  idea: IdeaDTO;
}

/**
 * IdeaDetailsSection component
 *
 * Displays the core details of an idea:
 * - Idea text prominently displayed
 * - Idea source (manual or frankenstein) with visual badge
 * - Creation date
 *
 * Requirements: 1.3, 9.2, 9.4
 */
export const IdeaDetailsSection: React.FC<IdeaDetailsSectionProps> = ({
  idea,
}) => {
  const { t, locale } = useLocale();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getSourceBadge = () => {
    if (idea.source === "frankenstein") {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-900/50 to-purple-900/50 border border-green-500 rounded">
          <span className="text-xl" aria-hidden="true">
            🧟
          </span>
          <span className="text-sm font-bold text-green-400 uppercase tracking-wider">
            {t("ideaSourceFrankenstein") || "Doctor Frankenstein"}
          </span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 border border-blue-600 rounded">
        <span className="text-xl" aria-hidden="true">
          ✍️
        </span>
        <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">
          {t("ideaSourceManual") || "Manual Entry"}
        </span>
      </div>
    );
  };

  return (
    <section
      className="bg-primary/30 border border-slate-700 p-6 sm:p-8 animate-fade-in"
      aria-labelledby="idea-details-heading"
    >
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2
          id="idea-details-heading"
          className="text-2xl font-bold border-b border-slate-700 pb-2 text-slate-200 uppercase tracking-wider"
        >
          {t("ideaDetailsTitle") || "Idea Details"}
        </h2>
        {getSourceBadge()}
      </div>

      {/* Idea text - prominently displayed */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          {t("ideaTextLabel") || "Your Idea"}
        </h3>
        <div className="bg-black/30 border border-slate-800 p-6">
          <p className="text-lg text-slate-200 leading-relaxed whitespace-pre-wrap font-mono">
            {idea.ideaText}
          </p>
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-slate-500"
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
          <span>
            <span className="font-semibold">
              {t("createdLabel") || "Created"}:
            </span>{" "}
            {formatDate(idea.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-slate-500"
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
          <span>
            <span className="font-semibold">
              {t("lastUpdatedLabel") || "Last Updated"}:
            </span>{" "}
            {formatDate(idea.updatedAt)}
          </span>
        </div>
      </div>
    </section>
  );
};

export default IdeaDetailsSection;
