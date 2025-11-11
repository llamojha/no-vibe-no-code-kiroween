"use client";

import React, { useMemo, useState } from "react";
import type { Analysis } from "@/lib/types";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { useAuth } from "@/features/auth/context/AuthContext";
import CollapsibleSection from "@/features/analyzer/components/CollapsibleSection";
import ExportControl from "@/features/analyzer/components/ExportControl";
import TTSPlayer from "@/features/analyzer/components/TTSPlayer";
import RadarChart from "@/features/analyzer/components/RadarChart";
import { ScoreGauge } from "@/features/shared/components/ScoreGauge";

interface AnalysisDisplayProps {
  analysis: Analysis;
  onSave: () => void;
  isSaved: boolean;
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

const renderTextWithLinks = (text: string) => {
  // Simple regex to find markdown-style links
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

  return (
    <>
      {parts.map((part, index) => {
        const match = /\[([^\]]+)\]\(([^)]+)\)/.exec(part);
        if (match) {
          const [, title, url] = match;
          // Basic validation for URL
          if (url.startsWith("http://") || url.startsWith("https://")) {
            return (
              <a
                href={url}
                key={index}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline decoration-accent/50"
              >
                {title}
              </a>
            );
          }
        }
        return part;
      })}
    </>
  );
};

const StarRating: React.FC<{ score: number }> = ({ score }) => {
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
        ({score.toFixed(1)}/5.0)
      </span>
    </div>
  );
};

const SWOTList: React.FC<{ title: string; items: string[]; color: string }> = ({
  title,
  items,
  color,
}) => {
  const testId = title.toLowerCase().includes("strength")
    ? "strengths-list"
    : title.toLowerCase().includes("weakness")
    ? "weaknesses-list"
    : title.toLowerCase().includes("opportunit")
    ? "opportunities-list"
    : "threats-list";

  return (
    <div className="bg-primary/50 p-4 border border-slate-700">
      <h3
        className={`font-bold text-lg mb-2 ${color} uppercase tracking-wider`}
      >
        {title}
      </h3>
      <ul
        data-testid={testId}
        className="list-none space-y-2 text-slate-400 text-base"
      >
        {(items || []).map((item, index) => (
          <li key={index} className="flex items-start">
            <svg
              className={`w-3 h-3 ${color} flex-shrink-0 mt-1.5 mr-2`}
              viewBox="0 0 8 8"
              fill="currentColor"
            >
              <path d="M4 0l4 4-4 4-4-4L4 0z" />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({
  analysis,
  onSave,
  isSaved,
  savedAudioBase64,
  onAudioGenerated,
  onGoToDashboard,
  onRefineSuggestion,
  addedSuggestions,
}) => {
  const { t } = useLocale();
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const [sortConfig, setSortConfig] = useState<{
    key: "score";
    direction: "ascending" | "descending";
  } | null>(null);

  const criterionToLocaleKey: Record<string, string> = {
    "Market Demand": "rubricCriterionMarketDemand",
    "Market Size": "rubricCriterionMarketSize",
    Uniqueness: "rubricCriterionUniqueness",
    Scalability: "rubricCriterionScalability",
    "Potential Profitability": "rubricCriterionPotentialProfitability",
  };

  const sortedRubric = useMemo(() => {
    let sortableItems = [...(analysis?.scoringRubric || [])];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [analysis?.scoringRubric, sortConfig]);

  const requestSort = (key: "score") => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: "score") => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="text-slate-500 opacity-50 ml-1">▲▼</span>;
    }
    return sortConfig.direction === "ascending" ? (
      <span className="text-white ml-1">▲</span>
    ) : (
      <span className="text-white ml-1">▼</span>
    );
  };

  const iconClasses = "w-7 h-7 text-accent";

  return (
    <div
      data-testid="results-container"
      className="mt-8 space-y-8 animate-fade-in"
    >
      <TTSPlayer
        analysis={analysis}
        initialAudioBase64={savedAudioBase64}
        onAudioGenerated={onAudioGenerated}
      />

      {/* Refine Your Idea Section (only in edit mode) */}
      {onRefineSuggestion &&
        (analysis?.improvementSuggestions || []).length > 0 && (
          <CollapsibleSection
            title={t("refineIdeaTitle")}
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
                    className="bg-primary/50 p-4 border border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                  >
                    <div className="flex-grow">
                      <h3 className="font-bold text-lg text-accent">
                        {suggestion.title}
                      </h3>
                      <p className="text-slate-400 text-base mt-1">
                        {suggestion.description}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        onRefineSuggestion(
                          suggestion.description,
                          suggestion.title,
                          index
                        )
                      }
                      disabled={addedSuggestions?.includes(index)}
                      title={t("addSuggestionButtonTooltip")}
                      className="flex-shrink-0 self-start sm:self-center ml-auto sm:ml-4 p-2.5 rounded-none bg-secondary/80 text-white hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-secondary disabled:bg-slate-600 disabled:hover:bg-slate-600 disabled:cursor-not-allowed"
                      aria-label={t("addSuggestionButtonTooltip")}
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

      {/* Final Score Section */}
      <CollapsibleSection
        title={t("finalScoreTitle")}
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
        <div className="flex flex-col items-center text-center gap-8">
          <ScoreGauge score={analysis.finalScore} size={192} />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-200 mb-2 uppercase tracking-wider">
              {t("viabilityVerdict")}
            </h3>
            <p
              data-testid="analysis-summary"
              className="text-lg text-slate-300 mb-4"
            >
              {analysis.viabilitySummary}
            </p>
            <p className="text-base text-slate-400 font-mono italic">
              {analysis.finalScoreExplanation}
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Detailed Summary Section */}
      <CollapsibleSection
        title={t("detailedSummaryTitle")}
        animationDelay="150ms"
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
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        }
      >
        <p className="text-base text-slate-400 whitespace-pre-wrap">
          {analysis.detailedSummary}
        </p>
      </CollapsibleSection>

      {/* Scoring Rubric Table */}
      <CollapsibleSection
        title={t("scoringRubricTitle")}
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
        <div className="mb-8">
          <RadarChart data={analysis?.scoringRubric} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 uppercase text-sm tracking-wider">
                <th className="p-3">{t("rubricCriterion")}</th>
                <th
                  className="p-3 text-center cursor-pointer hover:text-white"
                  onClick={() => requestSort("score")}
                >
                  {t("rubricScore")}
                  {getSortIndicator("score")}
                </th>
                <th className="p-3">{t("rubricJustification")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedRubric.map((criterion, index) => (
                <tr key={index} className="border-b border-slate-800">
                  <td className="p-3 font-semibold text-slate-300 align-top">
                    {t(criterionToLocaleKey[criterion.name] || criterion.name)}
                  </td>
                  <td className="p-3 text-center align-top">
                    <StarRating score={criterion.score} />
                  </td>
                  <td className="p-3 text-slate-400 text-base align-top">
                    {criterion.justification}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Founder's Checklist Section */}
      <CollapsibleSection
        title={t("checklistTitle")}
        animationDelay="250ms"
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
        <div className="space-y-6">
          {(analysis?.founderQuestions || []).map((item, index) => (
            <div
              key={index}
              className="bg-primary/50 p-4 border-l-4 border-accent/50"
            >
              <h3 className="font-bold text-lg text-slate-200">
                {item.question}
              </h3>
              <blockquote className="mt-2 pl-4 border-l-2 border-slate-700 italic text-base text-slate-400">
                "{item.ask}" -{" "}
                <span className="text-xs text-slate-500">({item.source})</span>
              </blockquote>
              <p className="mt-2 text-base text-slate-400">
                <strong className="text-slate-300">Why it matters:</strong>{" "}
                {item.why}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-700">
                <p className="text-base text-slate-300 whitespace-pre-wrap">
                  {item.analysis}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* SWOT Analysis Section */}
      <CollapsibleSection
        title={t("swotTitle")}
        animationDelay="300ms"
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
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SWOTList
            title={t("swotStrengths")}
            items={analysis?.swotAnalysis?.strengths}
            color="text-green-400"
          />
          <SWOTList
            title={t("swotWeaknesses")}
            items={analysis?.swotAnalysis?.weaknesses}
            color="text-red-400"
          />
          <SWOTList
            title={t("swotOpportunities")}
            items={analysis?.swotAnalysis?.opportunities}
            color="text-blue-400"
          />
          <SWOTList
            title={t("swotThreats")}
            items={analysis?.swotAnalysis?.threats}
            color="text-yellow-400"
          />
        </div>
      </CollapsibleSection>

      {/* Market Trends Section */}
      <CollapsibleSection
        title={t("trendsTitle")}
        animationDelay="350ms"
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
              d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
            />
          </svg>
        }
      >
        <div className="space-y-4">
          {(analysis?.currentMarketTrends || []).map((trend, index) => (
            <div
              key={index}
              className="bg-primary/50 p-4 border border-slate-700"
            >
              <h3 className="font-bold text-lg text-accent">{trend.trend}</h3>
              <p className="text-base text-slate-400 mt-1">
                {renderTextWithLinks(trend.impact)}
              </p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Competitors Section */}
      <CollapsibleSection
        title={t("competitorsTitle")}
        animationDelay="400ms"
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
              className="bg-primary/50 p-4 border border-slate-700"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-accent">
                  {competitor.name}
                </h3>
                {competitor.sourceLink && (
                  <a
                    href={competitor.sourceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("visitSourceTooltip")}
                    className="text-slate-500 hover:text-accent transition-colors"
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
                    {t("competitorStrengths")}
                  </h4>
                  <ul className="list-disc list-inside text-slate-400 text-base space-y-1">
                    {(competitor.strengths || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-400 mb-2">
                    {t("competitorWeaknesses")}
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

      {/* Monetization Strategies Section */}
      <CollapsibleSection
        title={t("monetizationTitle")}
        animationDelay="450ms"
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
              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      >
        <div className="space-y-4">
          {(analysis?.monetizationStrategies || []).map((strategy, index) => (
            <div
              key={index}
              className="bg-primary/50 p-4 border border-slate-700"
            >
              <h3 className="font-bold text-lg text-accent">{strategy.name}</h3>
              <p className="text-base text-slate-400 mt-1">
                {strategy.description}
              </p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Improvement & Pivot Ideas Section (only when not in refine mode) */}
      {!onRefineSuggestion &&
        (analysis?.improvementSuggestions || []).length > 0 && (
          <CollapsibleSection
            title={t("improvementSuggestionsTitle")}
            animationDelay="500ms"
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
                    className="bg-primary/50 p-4 border border-slate-700"
                  >
                    <h3 className="font-bold text-lg text-accent">
                      {suggestion.title}
                    </h3>
                    <p className="text-base text-slate-400 mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                )
              )}
            </div>
          </CollapsibleSection>
        )}

      {/* Next Steps Section */}
      <CollapsibleSection
        title={t("nextStepsTitle")}
        animationDelay="550ms"
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
              <span className="flex-shrink-0 mr-4 h-8 w-8 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center font-mono">
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

      {/* Action Buttons: Save & Export */}
      <div
        className="mt-8 flex flex-col sm:flex-row justify-end items-center gap-4 animate-slide-in-up"
        style={{ animationDelay: "650ms" }}
      >
        {isLoggedIn &&
          (isSaved ? (
            <>
              <span className="flex items-center gap-2 px-3 py-2 text-sm font-medium uppercase tracking-wider text-green-400 bg-green-900/20 border border-green-700 rounded-none cursor-default">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t("reportSavedMessage")}</span>
              </span>
              <button
                onClick={onGoToDashboard}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium uppercase tracking-wider text-slate-300 bg-primary/50 border border-slate-600 rounded-none hover:bg-accent/20 hover:text-accent hover:border-accent transition-colors"
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
          ) : (
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium uppercase tracking-wider text-slate-300 bg-primary/50 border border-slate-600 rounded-none hover:bg-accent/20 hover:text-accent hover:border-accent transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm3 1h4a1 1 0 000-2H8a1 1 0 000 2z" />
              </svg>
              <span>{t("saveReportButton")}</span>
            </button>
          ))}
        <ExportControl analysis={analysis} />
      </div>
    </div>
  );
};

export default AnalysisDisplay;
