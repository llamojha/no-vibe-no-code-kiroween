"use client";

import React from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";
import type { AnalysisCounts } from "@/lib/types";

interface AnalysisFilterProps {
  currentFilter: "all" | "idea" | "kiroween";
  onFilterChange: (filter: "all" | "idea" | "kiroween") => void;
  counts: AnalysisCounts;
}

const AnalysisFilter: React.FC<AnalysisFilterProps> = ({
  currentFilter,
  onFilterChange,
  counts,
}) => {
  const { t } = useLocale();
  
  const filterOptions = [
    {
      key: "all" as const,
      label: t('allAnalyses'),
      count: counts.total,
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14-7l2 2-2 2m0 8l2-2-2-2"
          />
        </svg>
      ),
    },
    {
      key: "idea" as const,
      label: t('startupIdeas'),
      count: counts.idea,
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    },
    {
      key: "kiroween" as const,
      label: t('kiroweenProjects'),
      count: counts.kiroween,
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="flex flex-wrap gap-2 mb-6"
      role="group"
      aria-label={t('filterAnalysesLabel')}
    >
      {filterOptions.map((option) => {
        const isActive = currentFilter === option.key;
        const baseClasses =
          "flex items-center gap-2 px-4 py-2 text-sm font-medium uppercase tracking-wider transition-all duration-200 border rounded-none";

        let colorClasses = "";
        if (isActive) {
          if (option.key === "idea") {
            colorClasses = "bg-teal-500/20 border-teal-500 text-teal-400";
          } else if (option.key === "kiroween") {
            colorClasses = "bg-orange-500/20 border-orange-500 text-orange-400";
          } else {
            colorClasses = "bg-accent/20 border-accent text-accent";
          }
        } else {
          colorClasses =
            "bg-primary/40 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-200";
        }

        return (
          <button
            key={option.key}
            onClick={() => onFilterChange(option.key)}
            className={`${baseClasses} ${colorClasses}`}
            aria-pressed={isActive}
            aria-label={t('filterOptionLabel', { label: option.label, count: option.count }) + (isActive ? t('currentlySelected') : '')}
          >
            <span aria-hidden="true">{option.icon}</span>
            <span>{option.label}</span>
            <span
              className={`ml-1 px-2 py-1 text-xs rounded-full ${
                isActive
                  ? "bg-current/20 text-current"
                  : "bg-slate-600 text-slate-300"
              }`}
              aria-hidden="true"
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default AnalysisFilter;
