"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Analysis } from "@/lib/types";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { generateReport } from "@/features/analyzer/utils/exportReport";
import { trackExport } from "@/features/analytics/tracking";

interface ExportControlProps {
  analysis: Analysis;
}

const ExportControl: React.FC<ExportControlProps> = ({ analysis }) => {
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (format: "md" | "txt") => {
    try {
      const content = generateReport(analysis, locale, format);
      const blob = new Blob([content], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `idea-analysis.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsOpen(false);

      // Track successful export
      trackExport({
        format: format === "md" ? "markdown" : "txt",
        reportType: "startup",
        success: true,
      });
    } catch (error) {
      console.error("Export failed:", error);

      // Track failed export
      trackExport({
        format: format === "md" ? "markdown" : "txt",
        reportType: "startup",
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium uppercase tracking-wider text-slate-300 bg-primary/50 border border-slate-600 rounded-none hover:bg-accent/20 hover:text-accent hover:border-accent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-accent"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
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
          className="absolute right-0 bottom-full mb-2 w-56 origin-bottom-right bg-primary border border-slate-700 rounded-none shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 animate-fade-in"
          style={{ animationDuration: "150ms" }}
        >
          <div className="py-1">
            <button
              onClick={() => handleExport("md")}
              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-accent/20 hover:text-accent transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
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
              onClick={() => handleExport("txt")}
              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-accent/20 hover:text-accent transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>{t("exportAsText")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportControl;
