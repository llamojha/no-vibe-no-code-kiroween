"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { isEnabled } from "@/lib/featureFlags";
import { createIdea } from "@/features/idea-panel/api";

interface IdeaCreationHubProps {
  onIdeaCreated?: () => void;
}

/**
 * IdeaCreationHub component
 *
 * Unified entry point for creating ideas:
 * - Quick text input for manual ideas
 * - Links to Dr. Frankenstein and Analyzers
 *
 * When user submits an idea, it creates the idea and navigates
 * to the Idea Panel with auto-generate flag.
 */
export const IdeaCreationHub: React.FC<IdeaCreationHubProps> = ({
  onIdeaCreated,
}) => {
  const router = useRouter();
  const { t } = useLocale();

  // Feature flags
  const showClassicAnalyzer = isEnabled("ENABLE_CLASSIC_ANALYZER");
  const showKiroweenAnalyzer = isEnabled("ENABLE_KIROWEEN_ANALYZER");

  // State
  const [ideaText, setIdeaText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmed = ideaText.trim();
      if (!trimmed) {
        setError(t("enterIdeaError") || "Please enter an idea.");
        return;
      }

      if (trimmed.length < 10) {
        setError(
          t("ideaMinLengthError") || "Idea must be at least 10 characters."
        );
        return;
      }

      setIsCreating(true);
      setError(null);

      try {
        const idea = await createIdea({ ideaText: trimmed, source: "manual" });
        onIdeaCreated?.();
        // Navigate to idea panel - user can generate docs from there
        router.push(`/idea/${idea.id}`);
      } catch (err) {
        console.error("Failed to create idea:", err);
        setError(
          err instanceof Error
            ? err.message
            : t("createIdeaError") || "Failed to create idea"
        );
        setIsCreating(false);
      }
    },
    [ideaText, router, onIdeaCreated, t]
  );

  return (
    <section
      className="bg-gradient-to-br from-purple-900/40 to-black/60 border border-accent/30 p-6 animate-fade-in"
      aria-labelledby="idea-creation-heading"
    >
      <h2
        id="idea-creation-heading"
        className="text-xl font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2"
      >
        <span aria-hidden="true">💡</span>
        {t("createNewIdea") || "Create New Idea"}
      </h2>

      {/* Quick Idea Input Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <label htmlFor="quick-idea-input" className="sr-only">
          {t("describeYourIdea") || "Describe your idea"}
        </label>
        <textarea
          id="quick-idea-input"
          value={ideaText}
          onChange={(e) => {
            setIdeaText(e.target.value);
            if (error) setError(null);
          }}
          placeholder={
            t("quickIdeaPlaceholder") ||
            "Describe your startup idea in a few sentences..."
          }
          disabled={isCreating}
          rows={3}
          className="w-full px-4 py-3 bg-primary/50 border border-slate-700 text-slate-200 placeholder-slate-500 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          aria-describedby={error ? "idea-error" : undefined}
        />

        {error && (
          <p
            id="idea-error"
            className="mt-2 text-sm text-red-400 font-mono"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isCreating || !ideaText.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent text-black font-bold text-sm uppercase tracking-wider hover:bg-accent/90 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? (
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
                <span>{t("creating") || "Creating..."}</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">✨</span>
                <span>{t("createIdea") || "Create Idea"}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-transparent text-slate-500 text-sm uppercase tracking-wider">
            {t("orUse") || "or use"}
          </span>
        </div>
      </div>

      {/* Alternative Entry Points */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Dr. Frankenstein - Always shown */}
        <button
          onClick={() => router.push("/doctor-frankenstein")}
          className="flex items-center gap-3 px-4 py-3 bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:bg-purple-500/30 hover:border-purple-500 transition-colors"
        >
          <span className="text-2xl" aria-hidden="true">
            🧟
          </span>
          <div className="text-left">
            <div className="font-bold text-sm uppercase tracking-wider">
              {t("doctorFrankenstein") || "Dr. Frankenstein"}
            </div>
            <div className="text-xs text-purple-400/80">
              {t("frankensteinShortDesc") || "Mashup random technologies"}
            </div>
          </div>
        </button>

        {/* Classic Analyzer */}
        {showClassicAnalyzer && (
          <button
            onClick={() => router.push("/analyzer")}
            className="flex items-center gap-3 px-4 py-3 bg-teal-500/20 border border-teal-500/50 text-teal-300 hover:bg-teal-500/30 hover:border-teal-500 transition-colors"
          >
            <span className="text-2xl" aria-hidden="true">
              💡
            </span>
            <div className="text-left">
              <div className="font-bold text-sm uppercase tracking-wider">
                {t("startupAnalyzer") || "Startup Analyzer"}
              </div>
              <div className="text-xs text-teal-400/80">
                {t("analyzerShortDesc") || "Detailed idea analysis"}
              </div>
            </div>
          </button>
        )}

        {/* Kiroween Analyzer */}
        {showKiroweenAnalyzer && (
          <button
            onClick={() => router.push("/kiroween-analyzer")}
            className="flex items-center gap-3 px-4 py-3 bg-orange-500/20 border border-orange-500/50 text-orange-300 hover:bg-orange-500/30 hover:border-orange-500 transition-colors"
          >
            <span className="text-2xl" aria-hidden="true">
              🎃
            </span>
            <div className="text-left">
              <div className="font-bold text-sm uppercase tracking-wider">
                {t("kiroweenAnalyzer") || "Kiroween Analyzer"}
              </div>
              <div className="text-xs text-orange-400/80">
                {t("kiroweenShortDesc") || "Hackathon project eval"}
              </div>
            </div>
          </button>
        )}
      </div>
    </section>
  );
};

export default IdeaCreationHub;
