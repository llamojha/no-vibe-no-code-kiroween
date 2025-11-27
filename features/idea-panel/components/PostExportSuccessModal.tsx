"use client";

import React, { useEffect, useCallback, useState } from "react";
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
 * File tree structure for the exported files
 */
const EXPORTED_FILES = [
  { path: ".kiro/steering/product.md", description: "Product vision & users" },
  { path: ".kiro/steering/tech.md", description: "Technology stack" },
  {
    path: ".kiro/steering/architecture.md",
    description: "Architecture patterns",
  },
  {
    path: ".kiro/steering/spec-generation.md",
    description: "Spec generation guide",
  },
  {
    path: ".kiro/specs/example-feature/requirements.md",
    description: "Example requirements",
  },
  {
    path: ".kiro/specs/example-feature/design.md",
    description: "Example design",
  },
  {
    path: ".kiro/specs/example-feature/tasks.md",
    description: "Example tasks",
  },
  { path: ".kiro/docs/roadmap.md", description: "Project roadmap" },
  { path: "README.md", description: "Setup instructions" },
];

/**
 * PostExportSuccessModal component
 *
 * Displays a modal after successful export with step-by-step instructions
 * for setting up Kiro with the exported files.
 */
export const PostExportSuccessModal: React.FC<PostExportSuccessModalProps> = ({
  isOpen,
  onClose,
  firstFeatureName = "your first feature",
  exportFormat,
}) => {
  const { t } = useLocale();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showFiles, setShowFiles] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const copyToClipboard = useCallback(async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  if (!isOpen) {
    return null;
  }

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-primary z-10">
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
        <div className="px-6 py-6 space-y-5">
          <p className="text-slate-300 text-sm">
            {t("kiroSetupReadyDescription") ||
              "Your project is ready for Kiro. Here's how to get started:"}
          </p>

          {/* Exported Files Section */}
          <div className="space-y-2">
            <button
              onClick={() => setShowFiles(!showFiles)}
              className="flex items-center gap-2 text-slate-300 hover:text-slate-100 transition-colors w-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform ${
                  showFiles ? "rotate-90" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="text-sm font-semibold">
                {t("exportedFiles") || "Exported Files"} (
                {EXPORTED_FILES.length})
              </span>
            </button>

            {showFiles && (
              <div className="ml-6 bg-slate-900/50 border border-slate-700 rounded p-3 space-y-1">
                {EXPORTED_FILES.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-start gap-2 text-xs"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 text-slate-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <code className="text-purple-400 break-all">
                        {file.path}
                      </code>
                      <span className="text-slate-500 ml-2">
                        — {file.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 1: Extract/Move files */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-bold">
                1
              </span>
              <span className="text-slate-200 font-semibold">
                {exportFormat === "zip"
                  ? t("extractAndCopyStep") ||
                    "Extract ZIP and copy to your project"
                  : t("moveFilesStep") ||
                    "Move downloaded files to your project"}
              </span>
            </div>
            <div className="ml-8 text-slate-400 text-xs space-y-2">
              {exportFormat === "zip" ? (
                <>
                  <p>
                    {t("extractZipInstructions") ||
                      "Extract the ZIP file, then copy the contents to your project:"}
                  </p>
                  <div className="bg-slate-900/60 border border-slate-700 p-2 rounded font-mono">
                    <div className="text-slate-500 mb-1"># Extract the ZIP</div>
                    <div className="text-green-400">unzip kiro-setup-*.zip</div>
                    <div className="text-slate-500 mt-2 mb-1">
                      # Copy files to your project
                    </div>
                    <div className="text-green-400">
                      cp -r kiro-setup/.kiro .
                    </div>
                    <div className="text-green-400">
                      cp kiro-setup/README.md ./KIRO_SETUP.md
                    </div>
                  </div>
                </>
              ) : (
                <p>
                  {t("moveFilesDescription") ||
                    "Move the downloaded files to your project, preserving the folder structure indicated by the filenames (e.g., 'steering--product.md' goes to '.kiro/steering/product.md')."}
                </p>
              )}
            </div>
          </div>

          {/* Step 2: Open in Kiro */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-bold">
                2
              </span>
              <span className="text-slate-200 font-semibold">
                {t("openInKiroStep") || "Open project in Kiro IDE"}
              </span>
            </div>
            <p className="text-slate-400 text-xs ml-8">
              {t("openInKiroDescription") ||
                "Launch Kiro and open your project folder. Kiro will automatically detect the steering files."}
            </p>
          </div>

          {/* Step 3: Generate first spec */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-bold">
                3
              </span>
              <span className="text-slate-200 font-semibold">
                {t("generateFirstSpecStep") ||
                  "Generate your first spec — paste this in Kiro chat:"}
              </span>
            </div>
            <div className="ml-8 bg-purple-900/30 border border-purple-500/40 p-3 rounded">
              <div className="flex items-start justify-between gap-2">
                <code className="text-purple-300 text-xs break-all whitespace-pre-wrap font-mono">
                  {kiroPrompt}
                </code>
                <button
                  onClick={() => copyToClipboard(kiroPrompt, "prompt")}
                  className="flex-shrink-0 px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors"
                  aria-label={t("copyPrompt") || "Copy prompt"}
                >
                  {copiedItem === "prompt" ? "✓" : t("copy") || "Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-slate-800/50 border border-slate-600 p-3 rounded flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
