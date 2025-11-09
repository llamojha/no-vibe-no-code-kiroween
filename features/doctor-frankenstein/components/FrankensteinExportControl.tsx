"use client";

import React, { useEffect, useRef, useState } from "react";
import type { TechItem, FrankensteinAnalysis } from "@/lib/types";
import type { FrankensteinIdeaResult } from "@/features/doctor-frankenstein/api/generateFrankensteinIdea";
import { useLocale } from "@/features/locale/context/LocaleContext";
import {
  generateMarkdownReport,
  generateJSONReport,
  generatePDFReport,
  downloadTextFile,
  type ExportData,
} from "@/features/doctor-frankenstein/utils/exportFrankensteinIdea";

interface FrankensteinExportControlProps {
  mode: "companies" | "aws";
  tech1: TechItem;
  tech2: TechItem;
  analysis: FrankensteinAnalysis;
  fullAnalysis?: FrankensteinIdeaResult;
  allTechnologies?: TechItem[];
}

const FrankensteinExportControl: React.FC<FrankensteinExportControlProps> = ({
  mode,
  tech1,
  tech2,
  analysis,
  fullAnalysis,
  allTechnologies,
}) => {
  const { t, locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const exportData: ExportData = {
    mode,
    tech1,
    tech2,
    analysis,
    fullAnalysis,
    allTechnologies,
  };

  const handleExport = async (format: "pdf" | "md" | "json") => {
    try {
      // Sanitize the idea name for use in filename
      const sanitizedName = analysis.ideaName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .substring(0, 50); // Limit length
      
      switch (format) {
        case "pdf":
          await generatePDFReport(exportData, locale);
          break;
        case "md":
          const markdownContent = generateMarkdownReport(exportData, locale);
          downloadTextFile(
            markdownContent,
            `frankenstein-${sanitizedName}-${Date.now()}.md`,
            "text/markdown"
          );
          break;
        case "json":
          const jsonContent = generateJSONReport(exportData);
          downloadTextFile(
            jsonContent,
            `frankenstein-${sanitizedName}-${Date.now()}.json`,
            "application/json"
          );
          break;
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      // TODO: Show error message to user
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium uppercase tracking-wider text-slate-300 bg-black/50 border border-purple-600 rounded hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-purple-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t("exportButton")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        <span>{t("exportButton")}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transform transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
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

      {isOpen && (
        <div
          className="absolute right-0 bottom-full mb-2 w-56 origin-bottom-right bg-black/90 border border-purple-700 rounded shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 animate-fade-in"
          style={{ animationDuration: "150ms" }}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            <button
              onClick={() => handleExport("pdf")}
              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
              role="menuitem"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <span>{t("exportAsPDF")}</span>
            </button>

            <button
              onClick={() => handleExport("md")}
              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
              role="menuitem"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>{t("exportAsMarkdown")}</span>
            </button>

            <button
              onClick={() => handleExport("json")}
              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
              role="menuitem"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              <span>{t("exportAsJSON")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FrankensteinExportControl;
