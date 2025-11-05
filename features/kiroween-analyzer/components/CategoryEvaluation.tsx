"use client";

import React from "react";
import { CategoryAnalysis, KiroweenCategory } from "@/lib/types";
import { useLocale } from "@/features/locale/context/LocaleContext";

interface CategoryEvaluationProps {
  categoryAnalysis: CategoryAnalysis;
}

const getCategoryInfo = (
  t: (key: string) => string
): Record<
  KiroweenCategory,
  { emoji: string; label: string; description: string; color: string }
> => ({
  resurrection: {
    emoji: "🧟",
    label: t("categoryResurrection"),
    description: t("categoryResurrectionDescription"),
    color: "text-green-400",
  },
  frankenstein: {
    emoji: "⚡",
    label: t("categoryFrankenstein"),
    description: t("categoryFrankensteinDescription"),
    color: "text-purple-400",
  },
  "skeleton-crew": {
    emoji: "💀",
    label: t("categorySkeletonCrew"),
    description: t("categorySkeletonCrewDescription"),
    color: "text-blue-400",
  },
  "costume-contest": {
    emoji: "🎭",
    label: t("categoryCostumeContest"),
    description: t("categoryCostumeContestDescription"),
    color: "text-orange-400",
  },
});

const FitScoreGauge: React.FC<{ score: number; color: string }> = ({
  score,
  color,
}) => {
  const percentage = (score / 10) * 100;
  const strokeColorClass =
    score >= 8
      ? "stroke-green-400"
      : score >= 6
      ? "stroke-yellow-400"
      : score >= 4
      ? "stroke-orange-400"
      : "stroke-red-400";
  const textColorClass =
    score >= 8
      ? "text-green-400"
      : score >= 6
      ? "text-yellow-400"
      : score >= 4
      ? "text-orange-400"
      : "text-red-400";

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <div
        className={`absolute text-2xl font-bold font-mono ${textColorClass}`}
        style={{ textShadow: `0 0 10px currentColor` }}
      >
        {score.toFixed(1)}
      </div>
      <svg className="w-full h-full" viewBox="0 0 80 80">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />

        {/* Progress circle */}
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          strokeWidth="4"
          strokeDasharray={`${(percentage / 100) * 201.06} 201.06`}
          strokeDashoffset="50.27"
          className={strokeColorClass}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 1s ease-out",
            transform: "rotate(-90deg)",
            transformOrigin: "40px 40px",
          }}
        />
      </svg>
    </div>
  );
};

const CategoryEvaluation: React.FC<CategoryEvaluationProps> = ({
  categoryAnalysis,
}) => {
  const { t } = useLocale();
  const { evaluations, bestMatch, bestMatchReason } = categoryAnalysis;
  const CATEGORY_INFO = getCategoryInfo(t);

  return (
    <div className="space-y-6">
      {/* Best Match Highlight */}
      <div className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 p-6 rounded-lg border-2 border-orange-400/50 shadow-lg">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-3">{CATEGORY_INFO[bestMatch].emoji}</div>
          <div>
            <h3 className="text-xl font-bold text-orange-300 uppercase tracking-wider">
              🏆 {t("bestMatchingCategory")}
            </h3>
            <p
              className={`text-lg font-semibold ${CATEGORY_INFO[bestMatch].color}`}
            >
              {CATEGORY_INFO[bestMatch].label}
            </p>
          </div>
        </div>
        <p className="text-slate-300 text-base leading-relaxed">
          {bestMatchReason}
        </p>
      </div>

      {/* Category Evaluations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {evaluations.map((evaluation) => {
          const categoryInfo = CATEGORY_INFO[evaluation.category];
          const isBestMatch = evaluation.category === bestMatch;

          return (
            <div
              key={evaluation.category}
              className={`bg-black/40 p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                isBestMatch
                  ? "border-orange-400/70 shadow-lg shadow-orange-500/20"
                  : "border-purple-500/30 hover:border-purple-400/50"
              }`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{categoryInfo.emoji}</span>
                  <div>
                    <h4
                      className={`text-lg font-bold ${categoryInfo.color} uppercase tracking-wider`}
                    >
                      {categoryInfo.label}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {categoryInfo.description}
                    </p>
                  </div>
                </div>
                {isBestMatch && (
                  <div className="text-orange-400 animate-pulse">
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Fit Score */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">
                    {t("categoryFitScore")}
                  </p>
                  <p className="text-xs text-slate-500">{t("outOfTen")}</p>
                </div>
                <FitScoreGauge
                  score={evaluation.fitScore}
                  color={categoryInfo.color}
                />
              </div>

              {/* Explanation */}
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  📝 {t("rubricJustification")}
                </h5>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {evaluation.explanation}
                </p>
              </div>

              {/* Improvement Suggestions */}
              {evaluation.improvementSuggestions.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider flex items-center">
                    <span className="mr-1">💡</span>
                    {t("improvementSuggestions")}
                  </h5>
                  <ul className="space-y-2">
                    {evaluation.improvementSuggestions.map(
                      (suggestion, index) => (
                        <li
                          key={index}
                          className="flex items-start text-sm text-slate-400"
                        >
                          <span className="text-orange-400 mr-2 flex-shrink-0 mt-0.5">
                            •
                          </span>
                          <span className="leading-relaxed">{suggestion}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-black/20 p-4 rounded-lg border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
          📊 {t("scoringGuide")}
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
            <span className="text-slate-400">8-10: {t("excellentFit")}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
            <span className="text-slate-400">6-7: {t("goodFit")}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
            <span className="text-slate-400">4-5: {t("fairFit")}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
            <span className="text-slate-400">1-3: {t("poorFit")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryEvaluation;
