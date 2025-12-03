"use client";

import React, { useState, useCallback } from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";

/**
 * Props for KiroGettingStartedPanel component
 */
interface KiroGettingStartedPanelProps {
  /** Whether the export has been completed */
  hasExported: boolean;
  /** Name of the first feature from roadmap (for the prompt) */
  firstFeatureName?: string;
  /** Callback when user dismisses the panel */
  onDismiss?: () => void;
}

/**
 * KiroGettingStartedPanel component
 *
 * An expandable panel that shows Kiro setup instructions.
 * Appears in the Idea Panel after export and persists until dismissed.
 *
 * Features:
 * - Collapsible/expandable design
 * - Copy buttons for commands and prompts
 * - Persistent until user dismisses
 * - Shows different states based on export status
 */
export const KiroGettingStartedPanel: React.FC<
  KiroGettingStartedPanelProps
> = ({ hasExported, firstFeatureName = "your first feature", onDismiss }) => {
  const { t } = useLocale();
  const [isExpanded, setIsExpanded] = useState(hasExported);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  // Don't show if not exported yet
  if (!hasExported) {
    return null;
  }

  const setupCommand =
    "unzip kiro-setup-*.zip && mkdir -p .kiro && cp -r kiro-setup/steering kiro-setup/specs .kiro/ && cp -r kiro-setup/docs . && cp kiro-setup/README.md ./KIRO_SETUP.md";
  const kiroPrompt = `#spec-generation Create a spec for "${firstFeatureName}" based on the roadmap in #[[file:docs/roadmap.md]]`;

  return (
    <section
      className="bg-gradient-to-r from-purple-900/20 to-slate-800/40 border border-purple-500/30 animate-fade-in"
      aria-labelledby="kiro-getting-started-heading"
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-500/5 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="kiro-getting-started-content"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3
              id="kiro-getting-started-heading"
              className="text-lg font-bold text-purple-300 uppercase tracking-wider"
            >
              {t("kiroGettingStarted") || "Getting Started with Kiro"}
            </h3>
            <p className="text-xs text-slate-400">
              {t("kiroGettingStartedSubtitle") ||
                "Setup instructions for your exported files"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={t("dismissPanel") || "Dismiss panel"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div
          id="kiro-getting-started-content"
          className="px-6 pb-6 space-y-5 border-t border-purple-500/20"
        >
          {/* Quick Steps */}
          <div className="pt-4 space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600/50 text-purple-200 text-xs font-bold flex-shrink-0">
                1
              </span>
              <div className="flex-1">
                <p className="text-slate-200 text-sm font-medium">
                  {t("extractZipStep") || "Extract ZIP to your project folder"}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {t("extractZipDescription") ||
                    "Unzip the downloaded file into your project's root directory."}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600/50 text-purple-200 text-xs font-bold flex-shrink-0">
                2
              </span>
              <div className="flex-1">
                <p className="text-slate-200 text-sm font-medium mb-2">
                  {t("copyFilesStep") || "Copy files to Kiro config"}
                </p>
                <div className="bg-slate-900/60 border border-slate-700 p-2 rounded font-mono text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-green-400 text-[11px] break-all">
                      {setupCommand}
                    </code>
                    <button
                      onClick={() => copyToClipboard(setupCommand, "setup")}
                      className="flex-shrink-0 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded transition-colors"
                      aria-label={t("copyCommand") || "Copy command"}
                    >
                      {copiedItem === "setup" ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        t("copy") || "Copy"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600/50 text-purple-200 text-xs font-bold flex-shrink-0">
                3
              </span>
              <div className="flex-1">
                <p className="text-slate-200 text-sm font-medium">
                  {t("openInKiroStep") || "Open project in Kiro IDE"}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600/50 text-purple-200 text-xs font-bold flex-shrink-0">
                4
              </span>
              <div className="flex-1">
                <p className="text-slate-200 text-sm font-medium mb-2">
                  {t("generateFirstSpecStep") ||
                    "Generate your first spec - paste this in Kiro chat:"}
                </p>
                <div className="bg-purple-900/30 border border-purple-500/30 p-2 rounded font-mono text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <code className="text-purple-300 text-[11px] break-all whitespace-pre-wrap">
                      {kiroPrompt}
                    </code>
                    <button
                      onClick={() => copyToClipboard(kiroPrompt, "prompt")}
                      className="flex-shrink-0 px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors"
                      aria-label={t("copyPrompt") || "Copy prompt"}
                    >
                      {copiedItem === "prompt" ? (
                        <span>✓</span>
                      ) : (
                        t("copy") || "Copy"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer links */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-700/50">
            <a
              href="https://kiro.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {t("downloadKiro") || "Download Kiro"}
            </a>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-500">
              {t("fullSetupGuideIncluded") ||
                "Full setup guide included in README.md"}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default KiroGettingStartedPanel;
