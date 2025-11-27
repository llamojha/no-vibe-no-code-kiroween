"use client";

import React, { useEffect, useCallback } from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";

/**
 * Props for PostExportSuccessModal component
 */
interface PostExportSuccessModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Name of the first feature from roadmap (for the prompt) */
  firstFeatureName?: string;
  /** Export format used */
  exportFormat: "zip" | "individual";
}

/**
 * PostExportSuccessModal component
 *
 * Displays a modal after successful export with step-by-step instructions
 * for setting up Kiro with the exported files.
 *
 * Features:
 * - Numbered steps with copy buttons for commands
 * - Pre-filled Kiro prompt with first feature name
 * - Link to download Kiro if needed
 * - Dismissible with "Got it!" button
 */
export const PostExportSuccessModal: React.FC<PostExportSuccessModalProps> = ({
  isOpen,
  onClose,
  firstFeatureName = "your first feature",
  exportFormat,
}) => {
  const { t } = useLocale();
  const [copiedStep, setCopiedStep] = React.useState<number | null>(null);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const copyToClipboard = useCallback(
    async (text: string, stepNumber: number) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedStep(stepNumber);
        setTimeout(() => setCopiedStep(null), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    },
    []
  );

  if (!isOpen) {
    return null;
  }

  const setupCommand =
    exportFormat === "zip"
      ? "unzip kiro-setup-*.zip -d .kiro && mv .kiro/kiro-setup/* .kiro/ && rm -rf .kiro/kiro-setup"
      : "mkdir -p .kiro/steering .kiro/specs .kiro/docs";

  const kiroPrompt = `#spec-generation Create a spec for "${firstFeatureName}" based on the roadmap in #[[file:docs/roadmap.md]]`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-export-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative bg-primary border border-slate-700 shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-primary">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2
              id="post-export-modal-title"
              className="text-xl font-bold text-green-400 uppercase tracking-wider"
            >
              {t("kiroSetupExported") || "Kiro Setup Exported!"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
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

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          <p className="text-slate-300 text-sm">
            {t("kiroSetupReadyDescription") ||
              "Your project is ready for Kiro. Here's how to get started:"}
          </p>

          {/* Step 1: Extract/Move files - different based on format */}
          {exportFormat === "zip" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-bold">
                  1
                </span>
                <span className="text-slate-200 font-semibold">
                  {t("extractZipStep") || "Extract ZIP to your project folder"}
                </span>
              </div>
              <p className="text-slate-400 text-xs ml-8">
                {t("extractZipDescription") ||
                  "Unzip the downloaded file into your project's root directory."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-bold">
                  1
                </span>
                <span className="text-slate-200 font-semibold">
                  {t("moveFilesStep") ||
                    "Move downloaded files to your project"}
                </span>
              </div>
              <p className="text-slate-400 text-xs ml-8">
                {t("moveFilesDescription") ||
                  "Move the downloaded files to your project's root directory, preserving the folder structure from the filenames."}
              </p>
            </div>
          )}

          {/* Step 2: Setup Kiro config */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-bold">
                2
              </span>
              <span className="text-slate-200 font-semibold">
                {exportFormat === "zip"
                  ? t("copyFilesStep") || "Copy files to Kiro config"
                  : t("createFoldersStep") || "Create Kiro folder structure"}
              </span>
            </div>
            <div className="ml-8 bg-slate-800/80 border border-slate-700 p-3 rounded font-mono text-xs">
              <div className="flex items-center justify-between gap-2">
                <code className="text-green-400 break-all">{setupCommand}</code>
                <button
                  onClick={() => copyToClipboard(setupCommand, 2)}
                  className="flex-shrink-0 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded transition-colors"
                  aria-label={t("copyCommand") || "Copy command"}
                >
                  {copiedStep === 2 ? (
                    <span className="text-green-400">
                      {t("copied") || "Copied!"}
                    </span>
                  ) : (
                    t("copy") || "Copy"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Open in Kiro */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-bold">
                3
              </span>
              <span className="text-slate-200 font-semibold">
                {t("openInKiroStep") || "Open project in Kiro IDE"}
              </span>
            </div>
            <p className="text-slate-400 text-xs ml-8">
              {t("openInKiroDescription") ||
                "Launch Kiro and open your project folder."}
            </p>
          </div>

          {/* Step 4: Generate first spec */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-bold">
                4
              </span>
              <span className="text-slate-200 font-semibold">
                {t("generateFirstSpecStep") ||
                  "Generate your first spec - paste this in Kiro chat:"}
              </span>
            </div>
            <div className="ml-8 bg-slate-800/80 border border-purple-500/50 p-3 rounded font-mono text-xs">
              <div className="flex items-start justify-between gap-2">
                <code className="text-purple-300 break-all whitespace-pre-wrap">
                  {kiroPrompt}
                </code>
                <button
                  onClick={() => copyToClipboard(kiroPrompt, 4)}
                  className="flex-shrink-0 px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors"
                  aria-label={t("copyPrompt") || "Copy prompt"}
                >
                  {copiedStep === 4 ? (
                    <span>{t("copied") || "Copied!"}</span>
                  ) : (
                    t("copy") || "Copy"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-slate-800/50 border border-slate-600 p-4 rounded flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-slate-300 text-sm">
              {t("fullSetupGuideIncluded") ||
                "Full setup guide included in the exported README.md file."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 bg-primary">
          <a
            href="https://kiro.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-700 text-slate-200 font-bold text-sm uppercase tracking-wider hover:bg-slate-600 transition-colors text-center"
          >
            {t("downloadKiro") || "Download Kiro"}
          </a>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 text-white font-bold text-sm uppercase tracking-wider hover:bg-green-500 transition-colors shadow-lg shadow-green-600/30"
          >
            {t("gotIt") || "Got it!"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostExportSuccessModal;
