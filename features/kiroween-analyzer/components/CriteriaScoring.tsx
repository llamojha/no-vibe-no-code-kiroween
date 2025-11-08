"use client";

import React from "react";
import { CriteriaAnalysis } from "@/lib/types";
import { useLocale } from "@/features/locale/context/LocaleContext";

interface CriteriaScoringProps {
  criteriaAnalysis: CriteriaAnalysis;
}

const getCriteriaInfo = (t: (key: string) => string) => {
  const potential = {
    emoji: "💎",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-400/50",
    description: "Market uniqueness, UI intuitiveness, and scalability potential",
  } as const;
  const implementation = {
    emoji: "🔧",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-400/50",
    description:
      "Variety of Kiro features, depth of understanding, strategic integration",
  } as const;
  const quality = {
    emoji: "🎨",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-400/50",
    description: "Creativity, originality, and UI polish",
  } as const;

  // Map both canonical English names and localized labels to the same info
  return {
    // Potential Value
    "Potential Value": potential,
    [t("criteriaPotentialValue")]: potential,
    // Implementation
    Implementation: implementation,
    [t("criteriaImplementation")]: implementation,
    // Quality and Design
    "Quality and Design": quality,
    [t("criteriaQualityDesign")]: quality,
  } as const;
};

const StarRating: React.FC<{ score: number; color: string }> = ({
  score,
  color,
}) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        const starPath =
          "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

        // Full star
        if (score >= starValue) {
          return (
            <svg
              key={index}
              className={`w-5 h-5 ${color}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d={starPath} />
            </svg>
          );
        }

        // Half star
        if (score >= starValue - 0.5) {
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
                className={`w-5 h-5 ${color} absolute`}
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
      <span className={`ml-2 text-base font-medium font-mono ${color}`}>
        ({score.toFixed(1)}/5.0)
      </span>
    </div>
  );
};

// FinalScoreDisplay removed; final score is shown in merged section in HackathonAnalysisDisplay

const CriteriaScoring: React.FC<CriteriaScoringProps> = ({
  criteriaAnalysis,
}) => {
  const { t } = useLocale();
  
  // Handle undefined criteriaAnalysis
  if (!criteriaAnalysis) {
    return (
      <div className="bg-black/40 p-6 rounded-lg border border-slate-700">
        <p className="text-slate-400 text-center">{t("noCriteriaAnalysisAvailable") || "No criteria analysis available"}</p>
      </div>
    );
  }
  
  const { scores } = criteriaAnalysis;
  const CRITERIA_INFO = getCriteriaInfo(t);

  return (
    <div className="space-y-8">
      {/* Final Score removed from this section */}

      {/* Individual Criteria Scores */}
      <div className="space-y-6">
        <h4 className="text-xl font-bold text-slate-200 uppercase tracking-wider flex items-center">
          <span className="mr-2">📊</span>
          {t("criteriaScoreTitle")}
        </h4>

        {scores.map((criterion) => {
          const criteriaInfo =
            CRITERIA_INFO[criterion.name as keyof typeof CRITERIA_INFO] || {
              emoji: "❓",
              color: "text-slate-300",
              bgColor: "bg-slate-700/30",
              borderColor: "border-slate-600",
              description: "Unknown criterion",
            };

          return (
            <div
              key={criterion.name}
              className={`${criteriaInfo.bgColor} p-6 rounded-lg border-2 ${criteriaInfo.borderColor} transition-all duration-300 hover:scale-[1.02]`}
            >
              {/* Criterion Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{criteriaInfo.emoji}</span>
                  <div>
                    <h5
                      className={`text-lg font-bold ${criteriaInfo.color} uppercase tracking-wider`}
                    >
                      {criterion.name}
                    </h5>
                    <p className="text-xs text-slate-400">
                      {criteriaInfo.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <StarRating
                    score={criterion.score}
                    color={criteriaInfo.color}
                  />
                </div>
              </div>

              {/* Justification */}
              <div className="mb-4">
                <h6 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  📝 {t("rubricJustification")}
                </h6>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {criterion.justification}
                </p>
              </div>

              {/* Sub-scores if available */}
              {criterion.subScores &&
                Object.keys(criterion.subScores).length > 0 && (
                  <div>
                    <h6 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                      🔍 {t("detailedBreakdown")}
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(criterion.subScores).map(
                        ([subCriterion, subScore]) => (
                          <div
                            key={subCriterion}
                            className="bg-black/30 p-3 rounded border border-slate-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                {subCriterion}
                              </span>
                              <span
                                className={`text-sm font-bold font-mono ${criteriaInfo.color}`}
                              >
                                {subScore.score.toFixed(1)}/5
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {subScore.explanation}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Scoring Legend */}
      <div className="bg-black/20 p-4 rounded-lg border border-slate-700">
        <h5 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
          📊 {t("scoringGuide")}
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
            <span className="text-slate-400">4.5-5.0: {t("excellent")}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
            <span className="text-slate-400">3.5-4.4: {t("veryGood")}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
            <span className="text-slate-400">2.5-3.4: {t("good")}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
            <span className="text-slate-400">1.5-2.4: {t("fair")}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
            <span className="text-slate-400">1.0-1.4: {t("poor")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriteriaScoring;
