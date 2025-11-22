"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { isEnabled } from "@/lib/featureFlags";
import type { IdeaDTO } from "@/src/infrastructure/web/dto/IdeaDTO";
import { trackAnalyzeButtonClick } from "@/features/idea-panel/analytics/tracking";

interface AnalyzeButtonProps {
  idea: IdeaDTO;
  documentCount?: number;
}

type AnalysisType = "startup" | "hackathon";

/**
 * AnalyzeButton component
 *
 * Provides a button to create new analyses:
 * - Displays "Analyze" button
 * - Shows dropdown with analysis type options (Startup, Hackathon)
 * - Navigates to appropriate analyzer page with idea pre-filled
 *
 * Requirements: 10.1, 10.2, 10.3
 */
export const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({
  idea,
  documentCount = 0,
}) => {
  const router = useRouter();
  const { t } = useLocale();
  const [showDropdown, setShowDropdown] = useState(false);
  const [enabledAnalyzers, setEnabledAnalyzers] = useState({
    startup: true,
    hackathon: true,
  });

  // Check feature flags on mount
  useEffect(() => {
    setEnabledAnalyzers({
      startup: isEnabled("ENABLE_CLASSIC_ANALYZER"),
      hackathon: isEnabled("ENABLE_KIROWEEN_ANALYZER"),
    });
  }, []);

  const handleAnalyze = (type: AnalysisType) => {
    setShowDropdown(false);

    // Track analyze button click
    trackAnalyzeButtonClick({
      ideaId: idea.id,
      analysisType: type,
      ideaSource: idea.source,
      existingDocumentCount: documentCount,
    });

    // Encode the idea text for URL
    const encodedIdea = encodeURIComponent(idea.ideaText);
    const encodedSource = encodeURIComponent(idea.source);

    if (type === "startup") {
      router.push(
        `/analyzer?idea=${encodedIdea}&source=${encodedSource}&ideaId=${idea.id}`
      );
    } else if (type === "hackathon") {
      router.push(
        `/kiroween-analyzer?idea=${encodedIdea}&source=${encodedSource}&ideaId=${idea.id}`
      );
    }
  };

  // If no analyzers are enabled, don't render the button
  if (!enabledAnalyzers.startup && !enabledAnalyzers.hackathon) {
    return null;
  }

  // If only one analyzer is enabled, navigate directly without dropdown
  const singleAnalyzer =
    enabledAnalyzers.startup && !enabledAnalyzers.hackathon
      ? "startup"
      : !enabledAnalyzers.startup && enabledAnalyzers.hackathon
      ? "hackathon"
      : null;

  if (singleAnalyzer) {
    return (
      <button
        onClick={() => handleAnalyze(singleAnalyzer)}
        className="flex items-center gap-2 px-8 py-4 bg-accent text-white font-bold text-lg rounded-none shadow-lg shadow-accent/30 hover:bg-accent/90 transform hover:scale-105 transition-all duration-300 ease-in-out uppercase tracking-widest"
        aria-label={t("analyzeIdeaLabel") || "Analyze this idea"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path
            fillRule="evenodd"
            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>{t("analyzeButton") || "Analyze"}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-8 py-4 bg-accent text-white font-bold text-lg rounded-none shadow-lg shadow-accent/30 hover:bg-accent/90 transform hover:scale-105 transition-all duration-300 ease-in-out uppercase tracking-widest"
        aria-label={t("analyzeIdeaLabel") || "Analyze this idea"}
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path
            fillRule="evenodd"
            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>{t("analyzeButton") || "Analyze"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-transform ${
            showDropdown ? "rotate-180" : ""
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
      {showDropdown && (
        <div
          className="absolute left-0 mt-2 w-full min-w-[280px] bg-primary border border-slate-700 rounded-none shadow-xl z-10 animate-fade-in"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-2">
            {enabledAnalyzers.startup && (
              <button
                onClick={() => handleAnalyze("startup")}
                className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-teal-900/20 transition-colors group"
                role="menuitem"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-teal-500/20 rounded-none flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
                  <span className="text-2xl" aria-hidden="true">
                    💡
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-teal-400 group-hover:text-teal-300 transition-colors uppercase tracking-wider">
                    {t("analyzeStartupIdea") || "Startup Analysis"}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {t("analyzeStartupDescription") ||
                      "Evaluate market viability and potential"}
                  </div>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-slate-500 group-hover:text-teal-400 transition-colors"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}

            {enabledAnalyzers.startup && enabledAnalyzers.hackathon && (
              <div className="border-t border-slate-800 my-2" />
            )}

            {enabledAnalyzers.hackathon && (
              <button
                onClick={() => handleAnalyze("hackathon")}
                className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-orange-900/20 transition-colors group"
                role="menuitem"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-orange-500/20 rounded-none flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <span className="text-2xl" aria-hidden="true">
                    🎃
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-orange-400 group-hover:text-orange-300 transition-colors uppercase tracking-wider">
                    {t("analyzeKiroweenProject") || "Hackathon Analysis"}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {t("analyzeHackathonDescription") ||
                      "Evaluate technical execution and creativity"}
                  </div>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-slate-500 group-hover:text-orange-400 transition-colors"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

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

export default AnalyzeButton;
