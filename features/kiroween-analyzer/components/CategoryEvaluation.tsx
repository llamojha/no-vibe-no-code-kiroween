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
    emoji: "☠️",
    label: t("categorySkeletonCrew"),
    description: t("categorySkeletonCrewDescription"),
    color: "text-blue-400",
  },
  "costume-contest": {
    emoji: "👗",
    label: t("categoryCostumeContest"),
    description: t("categoryCostumeContestDescription"),
    color: "text-orange-400",
  },
});

const FitScoreGauge: React.FC<{ score: number; color: string }> = ({
  score,
  color,
}) => {
  // Convert 0-10 input score to 0-5 scale with 0.5 increments
  const fiveScaleRaw = score / 2;
  const fiveScale = Math.round(fiveScaleRaw / 0.5) * 0.5;
  const percentage = (fiveScale / 5) * 100;
  const strokeColorClass =
    fiveScale >= 4
      ? "stroke-green-400"
      : fiveScale >= 3.5
      ? "stroke-yellow-400"
      : fiveScale >= 2.5
      ? "stroke-orange-400"
      : "stroke-red-400";
  const textColorClass =
    fiveScale >= 4
      ? "text-green-400"
      : fiveScale >= 3.5
      ? "text-yellow-400"
      : fiveScale >= 2.5
      ? "text-orange-400"
      : "text-red-400";

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <div
        className={`absolute text-2xl font-bold font-mono ${textColorClass}`}
        style={{ textShadow: `0 0 10px currentColor` }}
      >
        {fiveScale.toFixed(1)}
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
  
  // Handle undefined categoryAnalysis
  if (!categoryAnalysis) {
    return (
      <div className="bg-black/40 p-6 rounded-lg border border-slate-700">
        <p className="text-slate-400 text-center">{t("noCategoryAnalysisAvailable") || "No category analysis available"}</p>
      </div>
    );
  }
  
  const { evaluations, bestMatch, bestMatchReason } = categoryAnalysis;
  const CATEGORY_INFO = getCategoryInfo(t);

  // Normalize possibly free-form category strings to our canonical keys
  const normalizeCategory = (
    value: string | KiroweenCategory | undefined | null
  ): KiroweenCategory | null => {
    if (!value) return null;
    const raw = String(value).trim().toLowerCase();
    // Replace spaces/underscores with hyphens
    const key = raw.replace(/\s+/g, "-").replace(/_/g, "-");
    // Allow common variations
    const aliases: Record<string, KiroweenCategory> = {
      resurrection: "resurrection",
      "the-resurrection": "resurrection",
      frankenstein: "frankenstein",
      "franken-stein": "frankenstein",
      "skeleton-crew": "skeleton-crew",
      skeleton: "skeleton-crew",
      "skeleton crew": "skeleton-crew",
      "costume-contest": "costume-contest",
      costume: "costume-contest",
      "costume contest": "costume-contest",
    };
    if (aliases[key]) return aliases[key];
    // Direct match to known keys
    const known: KiroweenCategory[] = [
      "resurrection",
      "frankenstein",
      "skeleton-crew",
      "costume-contest",
    ];
    return (known as string[]).includes(key) ? (key as KiroweenCategory) : null;
  };

  // Ensure we always have all four categories represented
  const ALL_CATEGORIES: KiroweenCategory[] = [
    'resurrection',
    'frankenstein',
    'skeleton-crew',
    'costume-contest',
  ];

  const normalizedEvaluations = Array.isArray(evaluations) ? evaluations : [];
  const evalByCategory = new Map<KiroweenCategory, typeof normalizedEvaluations[number]>();
  for (const ev of normalizedEvaluations) {
    const norm = normalizeCategory(ev.category);
    if (norm) evalByCategory.set(norm, ev);
  }

  const fullEvaluations = ALL_CATEGORIES.map((cat) =>
    evalByCategory.get(cat) || {
      category: cat,
      fitScore: 0,
      explanation: t('notEvaluated') || 'Not evaluated',
      improvementSuggestions: [],
    }
  );

  // Determine best match strictly by highest fitScore, normalizing category keys
  const validBestMatch = (() => {
    if (fullEvaluations && fullEvaluations.length > 0) {
      const bestEvaluation = fullEvaluations.reduce((acc, current) =>
        current.fitScore > acc.fitScore ? current : acc
      );
      const normalized = normalizeCategory(bestEvaluation?.category);
      if (normalized && CATEGORY_INFO[normalized]) {
        return normalized;
      }
    }
    const normalizedBest = normalizeCategory(bestMatch);
    return normalizedBest || ("resurrection" as KiroweenCategory);
  })();

  const bestMatchInfo = CATEGORY_INFO[validBestMatch] || {
    emoji: "🧟",
    label: "Resurrection",
    description: "Default category",
    color: "text-green-400",
  };

  return (
    <div className="space-y-6">
      {/* Best Match Highlight */}
      <div className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 p-6 rounded-lg border-2 border-orange-400/50 shadow-lg">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-3">{bestMatchInfo.emoji}</div>
          <div>
            <h3 className="text-xl font-bold text-orange-300 uppercase tracking-wider">
              🏆 {t("bestMatchingCategory")}
            </h3>
            <p className={`text-lg font-semibold ${bestMatchInfo.color}`}>
              {bestMatchInfo.label}
            </p>
          </div>
        </div>
        <p className="text-slate-300 text-base leading-relaxed">
          {bestMatchReason}
        </p>
      </div>

      {/* Category Evaluations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fullEvaluations.map((evaluation) => {
          const normalizedCategory = normalizeCategory(evaluation.category);
          const categoryInfo =
            (normalizedCategory && CATEGORY_INFO[normalizedCategory]) || {
              emoji: "❓",
              label: evaluation.category,
              description: "Unknown category",
              color: "text-gray-400",
            };
          const isBestMatch =
            normalizedCategory !== null && normalizedCategory === validBestMatch;

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
                  <p className="text-xs text-slate-500">{t("outOfFive")}</p>
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
            <span className="text-slate-400">4-5: {t("excellentFit")}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
            <span className="text-slate-400">3.5-4: {t("goodFit")}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
            <span className="text-slate-400">2.5-3: {t("fairFit")}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
            <span className="text-slate-400">0-2: {t("poorFit")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryEvaluation;
