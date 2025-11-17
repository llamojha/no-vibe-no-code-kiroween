"use client";

import React, { useState } from "react";
import { HackathonAnalysis } from "@/lib/types";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { copyShareableLinkToClipboard } from "../utils/shareableLinks";
import { isEnabled } from "@/lib/featureFlags";
import CollapsibleSection from "@/features/analyzer/components/CollapsibleSection";
import CategoryEvaluation from "./CategoryEvaluation";
import CriteriaScoring from "./CriteriaScoring";
import HackathonExportControl from "./HackathonExportControl";
import { ScoreGauge } from "@/features/shared/components/ScoreGauge";

interface HackathonAnalysisDisplayProps {
  analysis: HackathonAnalysis;
  isSaved: boolean;
  savedAnalysisId?: string;
  savedAudioBase64?: string | null;
  onAudioGenerated?: (audio: string) => void;
  onGoToDashboard: () => void;
  onRefineSuggestion?: (
    suggestionText: string,
    suggestionTitle: string,
    index: number
  ) => void;
  addedSuggestions?: number[];
}

const HackathonAnalysisDisplay: React.FC<HackathonAnalysisDisplayProps> = ({
  analysis,
  isSaved,
  savedAnalysisId,
  savedAudioBase64,
  onAudioGenerated,
  onGoToDashboard,
  onRefineSuggestion,
  addedSuggestions,
}) => {
  const { session } = useAuth();
  const { t } = useLocale();
  const isLoggedIn = !!session;
  const [shareSuccess, setShareSuccess] = useState(false);
  const shareLinksEnabled = isEnabled("ENABLE_SHARE_LINKS");

  const handleShare = async () => {
    if (!shareLinksEnabled) return;
    if (!savedAnalysisId) return;

    const success = await copyShareableLinkToClipboard(savedAnalysisId);
    if (success) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const iconClasses = "w-7 h-7 text-orange-400";

  // Display the actual final score (0-5) from analysis
  const computeFinalScore = () => {
    // Use the actual final score value without snapping to increments
    // Keep display formatting in the gauge component.
    return analysis.finalScore ?? analysis.criteriaAnalysis?.finalScore ?? 0;
  };

  const finalScore = computeFinalScore();

  return (
    <div className="mt-8 space-y-8 animate-fade-in">
      {/* Refine Your Project Section (only in edit mode) */}
      {onRefineSuggestion &&
        (analysis?.improvementSuggestions || []).length > 0 && (
          <CollapsibleSection
            title={`🔮 ${t("refineIdeaTitle")}`}
            animationDelay="50ms"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={iconClasses}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385m5.043.025a15.998 15.998 0 001.622-3.385m3.388 1.62a15.998 15.998 0 00-1.622-3.385m0 5.042a3 3 0 00-5.78-1.128 2.25 2.25 0 01-2.4-2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385"
                />
              </svg>
            }
          >
            <p className="text-slate-400 mb-6 text-base">
              {t("refineIdeaSubtitle")}
            </p>
            <div className="space-y-4">
              {(analysis?.improvementSuggestions || []).map(
                (suggestion, index) => (
                  <div
                    key={index}
                    className="bg-black/40 p-4 border border-orange-500/30 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-orange-400/50 transition-colors"
                  >
                    <div className="flex-grow">
                      <h3 className="font-bold text-lg text-orange-300">
                        {suggestion.title}
                      </h3>
                      <p className="text-slate-400 text-base mt-1">
                        {suggestion.snippet || suggestion.description}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        onRefineSuggestion(
                          suggestion.snippet || suggestion.description || "",
                          suggestion.title,
                          index
                        )
                      }
                      disabled={addedSuggestions?.includes(index)}
                      title={t("addSuggestionButtonTooltip")}
                      className="flex-shrink-0 self-start sm:self-center ml-auto sm:ml-4 p-2.5 rounded bg-orange-600/80 text-white hover:bg-orange-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-orange-500 disabled:bg-slate-600 disabled:hover:bg-slate-600 disabled:cursor-not-allowed"
                      aria-label="Add suggestion to project"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )
              )}
            </div>
          </CollapsibleSection>
        )}

      {/* Final Score & Viability Summary (merged with Detailed Summary) */}
      <CollapsibleSection
        title={`🎯 ${t("finalScoreTitle")}`}
        animationDelay="100ms"
        defaultOpen={true}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={iconClasses}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      >
        <div className="bg-gradient-to-r from-purple-500/20 to-orange-500/20 p-8 rounded-lg border border-orange-400/50">
          <div className="flex flex-col items-center justify-center mb-6">
            <ScoreGauge score={finalScore} size={160} />
            <div className="mt-3 text-center">
              <p className="text-slate-400 text-sm uppercase tracking-wider">
                {t("averageOfAllCriteria")}
              </p>
              <p className="text-slate-500 text-xs">{t("outOfFive")}</p>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-lg text-slate-300 leading-relaxed">
              {analysis.viabilitySummary}
            </p>
            <div className="bg-black/20 p-4 rounded-lg border border-slate-700">
              <p className="text-base text-slate-400 whitespace-pre-wrap leading-relaxed">
                {analysis.detailedSummary}
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Category Evaluation Section (Detailed Breakdown renamed) */}
      <CollapsibleSection
        title={`🎃 ${t("categoryEvaluationTitle")}`}
        animationDelay="175ms"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={iconClasses}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228a25.628 25.628 0 012.916.52 6.003 6.003 0 00-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0A7.454 7.454 0 0112 13.5c-.248 0-.494-.07-.728-.198m0 0A7.454 7.454 0 0112 13.5c.248 0 .494-.07.728-.198"
            />
          </svg>
        }
      >
        <CategoryEvaluation categoryAnalysis={analysis.categoryAnalysis} />
      </CollapsibleSection>

      {/* Criteria Scoring Section */}
      <CollapsibleSection
        title={`📊 ${t("criteriaScoreTitle")}`}
        animationDelay="200ms"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={iconClasses}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
        }
      >
        <CriteriaScoring criteriaAnalysis={analysis.criteriaAnalysis} />
      </CollapsibleSection>

      {/* Detailed Summary section removed (merged above) */}

      {/* Hackathon-Specific Advice Section */}
      <CollapsibleSection
        title={`🎃 ${t("hackathonSpecificAdvice")}`}
        animationDelay="325ms"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={iconClasses}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 7.478a12.06 12.06 0 004.5 0m-3.75-15.75a12.06 12.06 0 00-4.5 0m3.75 0a12.06 12.06 0 00-4.5 0m3.75 0v11.25A2.25 2.25 0 0113.5 21h-3A2.25 2.25 0 018.25 18.75V7.5A2.25 2.25 0 0110.5 5.25h3a2.25 2.25 0 012.25 2.25v11.25z"
            />
          </svg>
        }
      >
        <div className="space-y-6">
          {/* Category Optimization */}
          {analysis.hackathonSpecificAdvice?.categoryOptimization?.length >
            0 && (
            <div className="bg-purple-500/20 p-4 rounded-lg border border-purple-400/50">
              <h4 className="font-bold text-lg text-purple-300 mb-3 flex items-center">
                <span className="mr-2">🏆</span>
                {t("categoryOptimization")}
              </h4>
              <ul className="space-y-2">
                {analysis.hackathonSpecificAdvice.categoryOptimization.map(
                  (tip, index) => (
                    <li
                      key={index}
                      className="flex items-start text-sm text-slate-400"
                    >
                      <span className="text-purple-400 mr-2 flex-shrink-0 mt-0.5">
                        •
                      </span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Kiro Integration Tips */}
          {analysis.hackathonSpecificAdvice?.kiroIntegrationTips?.length >
            0 && (
            <div className="bg-green-500/20 p-4 rounded-lg border border-green-400/50">
              <h4 className="font-bold text-lg text-green-300 mb-3 flex items-center">
                <span className="mr-2">🤖</span>
                {t("kiroIntegrationTips")}
              </h4>
              <ul className="space-y-2">
                {analysis.hackathonSpecificAdvice.kiroIntegrationTips.map(
                  (tip, index) => (
                    <li
                      key={index}
                      className="flex items-start text-sm text-slate-400"
                    >
                      <span className="text-green-400 mr-2 flex-shrink-0 mt-0.5">
                        •
                      </span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Competition Strategy */}
          {analysis.hackathonSpecificAdvice?.competitionStrategy?.length >
            0 && (
            <div className="bg-orange-500/20 p-4 rounded-lg border border-orange-400/50">
              <h4 className="font-bold text-lg text-orange-300 mb-3 flex items-center">
                <span className="mr-2">⚡</span>
                {t("competitionStrategy")}
              </h4>
              <ul className="space-y-2">
                {analysis.hackathonSpecificAdvice.competitionStrategy.map(
                  (tip, index) => (
                    <li
                      key={index}
                      className="flex items-start text-sm text-slate-400"
                    >
                      <span className="text-orange-400 mr-2 flex-shrink-0 mt-0.5">
                        •
                      </span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Competitors Section */}
      {(analysis?.competitors || []).length > 0 && (
        <CollapsibleSection
          title={`👻 ${t("spookyCompetition")}`}
          animationDelay="375ms"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={iconClasses}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 015.609 2.188m-5.609-2.188a3.75 3.75 0 01-5.609 2.188m0 0A2.25 2.25 0 015.171 12m-5.172.839a3.75 3.75 0 015.609-2.188m-5.609 2.188a2.25 2.25 0 01-2.434 2.188m8.162-2.188a2.25 2.25 0 012.434 2.188m0 0A3.75 3.75 0 0112.83 15M12 9.75A3.75 3.75 0 0115.75 6m-3.75 3.75A3.75 3.75 0 008.25 6m7.5 3.75c0-1.02-.424-1.933-1.125-2.625M12 9.75c-.701 0-1.363-.224-1.906-.625M12 9.75c.701 0 1.363-.224-1.906-.625M8.25 6h7.5M12 6.375c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125V3.375c0-.621-.504-1.125-1.125-1.125h-1.5A1.125 1.125 0 0012 3.375v3z"
              />
            </svg>
          }
        >
          <div className="space-y-6">
            {(analysis?.competitors || []).map((competitor, index) => (
              <div
                key={index}
                className="bg-black/40 p-4 border border-slate-700 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-orange-300">
                    {competitor.name}
                  </h3>
                  {competitor.sourceLink && (
                    <a
                      href={competitor.sourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("visitSource")}
                      className="text-slate-500 hover:text-orange-400 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </a>
                  )}
                </div>
                <p className="text-base text-slate-400 mt-1">
                  {competitor.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="font-semibold text-green-400 mb-2">
                      {t("strengths")}
                    </h4>
                    <ul className="list-disc list-inside text-slate-400 text-base space-y-1">
                      {(competitor.strengths || []).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-400 mb-2">
                      {t("weaknesses")}
                    </h4>
                    <ul className="list-disc list-inside text-slate-400 text-base space-y-1">
                      {(competitor.weaknesses || []).map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Improvement Suggestions Section (only when not in refine mode) */}
      {!onRefineSuggestion &&
        (analysis?.improvementSuggestions || []).length > 0 && (
          <CollapsibleSection
            title={`💡 ${t("improvementSuggestionsTitle")}`}
            animationDelay="425ms"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={iconClasses}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385m5.043.025a15.998 15.998 0 001.622-3.385m3.388 1.62a15.998 15.998 0 00-1.622-3.385m0 5.042a3 3 0 00-5.78-1.128 2.25 2.25 0 01-2.4-2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385"
                />
              </svg>
            }
          >
            <div className="space-y-4">
              {(analysis?.improvementSuggestions || []).map(
                (suggestion, index) => (
                  <div
                    key={index}
                    className="bg-black/40 p-4 border border-slate-700 rounded-lg"
                  >
                    <h3 className="font-bold text-lg text-orange-300">
                      {suggestion.title}
                    </h3>
                    <p className="text-base text-slate-400 mt-1">
                      {suggestion.snippet || suggestion.description}
                    </p>
                  </div>
                )
              )}
            </div>
          </CollapsibleSection>
        )}

      {/* Next Steps Section */}
      <CollapsibleSection
        title={`🚀 ${t("nextStepsTitle")}`}
        animationDelay="475ms"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={iconClasses}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      >
        <ol className="space-y-4">
          {(analysis?.nextSteps || []).map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="flex-shrink-0 mr-4 h-8 w-8 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center font-mono">
                {index + 1}
              </span>
              <div>
                <h3 className="font-bold text-lg text-slate-200">
                  {step.title}
                </h3>
                <p className="text-base text-slate-400">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </CollapsibleSection>

      {/* Action Buttons: Save, Export & Share */}
      <div
        className="mt-8 flex flex-col sm:flex-row justify-end items-center gap-4 animate-slide-in-up"
        style={{ animationDelay: "525ms" }}
      >
        {/* Export Control - Always visible */}
        <HackathonExportControl analysis={analysis} />

        {isLoggedIn && isSaved && (
          <>
            {shareLinksEnabled && savedAnalysisId && (
              <button
                onClick={handleShare}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium uppercase tracking-wider border rounded transition-colors ${
                  shareSuccess
                    ? "text-green-400 bg-green-900/20 border-green-700"
                    : "text-slate-300 bg-black/50 border-slate-600 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-400"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                <span>{shareSuccess ? t("linkCopied") : t("share")}</span>
              </button>
            )}
            <button
              onClick={onGoToDashboard}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium uppercase tracking-wider text-slate-300 bg-black/50 border border-slate-600 rounded hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-400 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>{t("goToDashboardButton")}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default HackathonAnalysisDisplay;
