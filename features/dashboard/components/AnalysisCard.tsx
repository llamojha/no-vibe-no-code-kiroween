"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { UnifiedAnalysisRecord } from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";
import { formatDateUTCEnUS } from "@/lib/date";

interface AnalysisCardProps {
  analysis: UnifiedAnalysisRecord;
  onDelete: (analysis: UnifiedAnalysisRecord) => void;
}

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 5) * circumference;

  const scoreColorClass =
    score >= 4
      ? "text-green-400"
      : score >= 2.5
      ? "text-yellow-400"
      : "text-red-400";
  const ringColorClass =
    score >= 4
      ? "stroke-green-400"
      : score >= 2.5
      ? "stroke-yellow-400"
      : "stroke-red-400";

  const scoreCategory =
    score >= 4 ? "excellent" : score >= 2.5 ? "good" : "needs improvement";

  return (
    <div
      className={`relative flex-shrink-0 w-16 h-16 flex items-center justify-center font-mono ${scoreColorClass}`}
      role="img"
      aria-label={`Analysis score: ${score.toFixed(
        1
      )} out of 5, rated as ${scoreCategory}`}
    >
      <svg
        className="absolute w-full h-full"
        viewBox="0 0 56 56"
        aria-hidden="true"
      >
        <circle
          className="stroke-slate-700"
          strokeWidth="4"
          fill="transparent"
          r={radius}
          cx="28"
          cy="28"
        />
        <circle
          className={`${ringColorClass} transform -rotate-90 origin-center`}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="28"
          cy="28"
          style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
        />
      </svg>
      <span className="text-lg font-bold" aria-hidden="true">
        {score.toFixed(1)}
      </span>
    </div>
  );
};

const CategoryBadge: React.FC<{ category: "idea" | "kiroween" }> = ({
  category,
}) => {
  const isIdea = category === "idea";

  const badgeClasses = isIdea
    ? "bg-teal-500/20 border-teal-500 text-teal-400"
    : "bg-orange-500/20 border-orange-500 text-orange-400";

  const icon = isIdea ? (
    <svg
      className="h-3 w-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  ) : (
    <svg
      className="h-3 w-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );

  const label = isIdea ? "IDEA" : "KIROWEEN";
  const fullLabel = isIdea
    ? "Startup Idea Analysis"
    : "Kiroween Project Analysis";

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase tracking-wider border rounded-none ${badgeClasses}`}
      role="img"
      aria-label={fullLabel}
    >
      {icon}
      <span aria-hidden="true">{label}</span>
    </div>
  );
};

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, onDelete }) => {
  const router = useRouter();

  // Feature flag evaluations
  const showClassicAnalyzer = isEnabled("ENABLE_CLASSIC_ANALYZER");
  const showKiroweenAnalyzer = isEnabled("ENABLE_KIROWEEN_ANALYZER");

  // Determine if this analysis type is enabled
  const isAnalyzerEnabled =
    analysis.category === "idea" ? showClassicAnalyzer : showKiroweenAnalyzer;

  const handleView = () => {
    if (analysis.category === "idea") {
      router.push(
        `/analyzer?savedId=${encodeURIComponent(analysis.id)}&mode=view`
      );
    } else {
      router.push(
        `/kiroween-analyzer?savedId=${encodeURIComponent(
          analysis.id
        )}&mode=view`
      );
    }
  };

  const handleEdit = () => {
    // Only allow editing if the analyzer is enabled
    if (!isAnalyzerEnabled) return;

    if (analysis.category === "idea") {
      router.push(
        `/analyzer?savedId=${encodeURIComponent(analysis.id)}&mode=refine`
      );
    } else {
      router.push(
        `/kiroween-analyzer?savedId=${encodeURIComponent(
          analysis.id
        )}&mode=refine`
      );
    }
  };

  return (
    <div className="bg-primary/40 border border-slate-700 p-4 flex flex-col sm:flex-row gap-4 sm:items-center animate-fade-in">
      <ScoreRing score={analysis.finalScore} />

      <div className="flex-1">
        <div className="flex items-start gap-2 mb-2">
          <CategoryBadge category={analysis.category} />
          {!isAnalyzerEnabled && (
            <div
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase tracking-wider border rounded-none bg-slate-800/20 border-slate-600 text-slate-500"
              role="img"
              aria-label="This analysis is read-only because the analyzer is disabled"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span aria-hidden="true">READ-ONLY</span>
            </div>
          )}
        </div>

        <h3 className="text-xl font-semibold text-slate-200 uppercase tracking-wider mb-1">
          {analysis.title}
        </h3>

        <p className="text-sm text-slate-500 font-mono mb-2">
          {formatDateUTCEnUS(analysis.createdAt)}
        </p>

        <p className="text-sm text-slate-400 line-clamp-2">
          {analysis.summary}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleView}
          className="flex items-center gap-2 px-3 py-2 bg-primary/40 border border-slate-700 text-slate-300 hover:bg-accent/20 hover:text-accent hover:border-accent transition-colors rounded-none uppercase tracking-wider text-xs sm:text-sm"
          aria-label={`View analysis: ${analysis.title}`}
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
          <span aria-hidden="true">View</span>
        </button>

        {analysis.category === "idea" && (
          <button
            onClick={handleEdit}
            disabled={!isAnalyzerEnabled}
            className={`flex items-center gap-2 px-3 py-2 border rounded-none uppercase tracking-wider text-xs sm:text-sm transition-colors ${
              isAnalyzerEnabled
                ? "bg-primary/40 border-slate-700 text-slate-300 hover:bg-secondary/20 hover:text-secondary hover:border-secondary cursor-pointer"
                : "bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed"
            }`}
            aria-label={
              isAnalyzerEnabled
                ? `Edit analysis: ${analysis.title}`
                : `Analysis "${analysis.title}" is read-only because the analyzer is disabled`
            }
            aria-describedby={
              !isAnalyzerEnabled ? "analyzer-disabled-help" : undefined
            }
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
            <span aria-hidden="true">
              {isAnalyzerEnabled ? "Edit" : "Read-Only"}
            </span>
          </button>
        )}

        <button
          onClick={() => onDelete(analysis)}
          className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-700 text-red-400 hover:bg-red-500/20 transition-colors rounded-none uppercase tracking-wider text-xs sm:text-sm"
          aria-label={`Delete analysis: ${analysis.title}`}
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
              d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span aria-hidden="true">Delete</span>
        </button>
      </div>

      {/* Hidden helper text for screen readers */}
      {!isAnalyzerEnabled && (
        <div id="analyzer-disabled-help" className="sr-only">
          The analyzer for this type of analysis is currently disabled, so
          editing is not available.
        </div>
      )}
    </div>
  );
};

export default AnalysisCard;
