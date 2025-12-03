"use client";

import React from "react";
import { CategoryAnalysis, KiroweenCategory } from "@/lib/types";
import { useLocale } from "@/features/locale/context/LocaleContext";

interface KiroweenCategorySectionProps {
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

const StarRating: React.FC<{ score: number }> = ({ score }) => {
  // Convert 0-10 scale to 0-5 stars
  const starScore = score / 2;

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        const starPath =
          "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

        // Full star
        if (starScore >= starValue) {
          return (
            <svg
              key={index}
              className="w-5 h-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d={starPath} />
            </svg>
          );
        }

        // Half star
        if (starScore >= starValue - 0.5) {
          return (
            <div key={index} className="relative w-5 h-5">
              {/* Empty star background */}
              <svg
                className="w-5 h-5 text-slate-700 absolute"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d={starPath} />
              </svg>
              {/* Filled star foreground, clipped */}
              <svg
                className="w-5 h-5 text-yellow-400 absolute"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                style={{ clipPath: "inset(0 50% 0 0)" }}
              >
                <path d={starPath} />
              </svg>
            </div>
          );
        }

        // Empty star
        return (
          <svg
            key={index}
            className="w-5 h-5 text-slate-700"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d={starPath} />
          </svg>
        );
      })}
      <span className="ml-2 text-base font-medium text-slate-300 font-mono">
        ({starScore.toFixed(1)}/5)
      </span>
    </div>
  );
};

const KiroweenCategorySection: React.FC<KiroweenCategorySectionProps> = ({
  categoryAnalysis,
}) => {
  const { t } = useLocale();
  const { evaluations, bestMatch } = categoryAnalysis;
  const CATEGORY_INFO = getCategoryInfo(t);

  // Always compute best match by highest fitScore to avoid selecting a lower score
  const validBestMatch = (() => {
    if (evaluations && evaluations.length > 0) {
      const bestEvaluation = evaluations.reduce((best, current) =>
        current.fitScore > best.fitScore ? current : best
      );
      if (bestEvaluation && CATEGORY_INFO[bestEvaluation.category]) {
        return bestEvaluation.category as KiroweenCategory;
      }
    }
    return (bestMatch as KiroweenCategory) || ("resurrection" as KiroweenCategory);
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
      <div className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 p-4 rounded-lg border-2 border-orange-400/50 shadow-lg">
        <div className="flex items-center mb-2">
          <div className="text-2xl mr-3">{bestMatchInfo.emoji}</div>
          <div>
            <h3 className="text-lg font-bold text-orange-300 uppercase tracking-wider">
              🏆 {t("bestMatchingCategory")}
            </h3>
            <p className={`text-base font-semibold ${bestMatchInfo.color}`}>
              {bestMatchInfo.label}
            </p>
          </div>
        </div>
      </div>

      {/* Category Compatibility Table - Similar to Rubric Score section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 uppercase text-sm tracking-wider">
              <th className="p-3">{t("categoryEvaluationTitle")}</th>
              <th className="p-3 text-center">{t("categoryFitScore")}</th>
              <th className="p-3">{t("rubricJustification")}</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((evaluation) => {
              const categoryInfo = CATEGORY_INFO[evaluation.category] || {
                emoji: "❓",
                label: evaluation.category,
                description: "Unknown category",
                color: "text-gray-400",
              };
              const isBestMatch = evaluation.category === validBestMatch;

              return (
                <tr
                  key={evaluation.category}
                  className={`border-b border-slate-800 ${
                    isBestMatch ? "bg-orange-500/10" : ""
                  }`}
                >
                  <td className="p-3 align-top">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{categoryInfo.emoji}</span>
                      <div>
                        <div
                          className={`font-semibold ${categoryInfo.color} uppercase tracking-wider flex items-center`}
                        >
                          {categoryInfo.label}
                          {isBestMatch && (
                            <span className="ml-2 text-orange-400 animate-pulse">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {categoryInfo.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center align-top">
                    <StarRating score={evaluation.fitScore} />
                  </td>
                  <td className="p-3 text-slate-400 text-base align-top">
                    {evaluation.explanation}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

export default KiroweenCategorySection;
