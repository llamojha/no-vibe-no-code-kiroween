"use client";

import React, { useState } from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";
import type { DocumentDTO } from "@/src/infrastructure/web/dto/IdeaDTO";
import { ScoreGauge } from "@/features/shared/components/ScoreGauge";

interface DocumentsListSectionProps {
  documents: DocumentDTO[];
}

/**
 * DocumentsListSection component
 *
 * Displays a list of all documents (analyses) associated with an idea:
 * - Shows "No analyses yet" when no documents exist
 * - Displays document type (startup_analysis or hackathon_analysis)
 * - Shows document creation date
 * - Supports expandable/collapsible document details
 * - Displays type-specific fields (viability/innovation/market for startup, technical/creativity/impact for hackathon)
 ** Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export const DocumentsListSection: React.FC<DocumentsListSectionProps> = ({
  documents,
}) => {
  const { t, locale } = useLocale();
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(
    new Set()
  );

  const toggleDocument = (documentId: string) => {
    setExpandedDocuments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getDocumentTypeLabel = (type: string): string => {
    if (type === "startup_analysis") {
      return t("documentTypeStartup") || "Startup Analysis";
    }
    if (type === "hackathon_analysis") {
      return t("documentTypeHackathon") || "Hackathon Analysis";
    }
    return type;
  };

  const getDocumentTypeIcon = (type: string) => {
    if (type === "startup_analysis") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-teal-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path
            fillRule="evenodd"
            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (type === "hackathon_analysis") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-orange-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return null;
  };

  const renderStartupAnalysisFields = (content: any) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {content.finalScore !== undefined && (
          <div className="bg-black/30 border border-slate-800 p-4 flex flex-col items-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {t("finalScoreLabel") || "Final Score"}
            </span>
            <ScoreGauge score={content.finalScore} size={80} />
          </div>
        )}
        {content.scoringRubric && (
          <>
            {content.scoringRubric.find(
              (r: any) => r.name === "Market Demand"
            ) && (
              <div className="bg-black/30 border border-slate-800 p-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {t("marketDemandLabel") || "Market Demand"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent font-mono">
                    {content.scoringRubric
                      .find((r: any) => r.name === "Market Demand")
                      ?.score.toFixed(1)}
                  </span>
                  <span className="text-slate-500 font-mono">/5.0</span>
                </div>
              </div>
            )}
            {content.scoringRubric.find(
              (r: any) => r.name === "Uniqueness"
            ) && (
              <div className="bg-black/30 border border-slate-800 p-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {t("uniquenessLabel") || "Uniqueness"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent font-mono">
                    {content.scoringRubric
                      .find((r: any) => r.name === "Uniqueness")
                      ?.score.toFixed(1)}
                  </span>
                  <span className="text-slate-500 font-mono">/5.0</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderHackathonAnalysisFields = (content: any) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {content.overallScore !== undefined && (
          <div className="bg-black/30 border border-slate-800 p-4 flex flex-col items-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {t("overallScoreLabel") || "Overall Score"}
            </span>
            <ScoreGauge score={content.overallScore} size={80} />
          </div>
        )}
        {content.categoryScores && (
          <>
            {content.categoryScores.technical !== undefined && (
              <div className="bg-black/30 border border-slate-800 p-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {t("technicalLabel") || "Technical"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent font-mono">
                    {content.categoryScores.technical.toFixed(1)}
                  </span>
                  <span className="text-slate-500 font-mono">/5.0</span>
                </div>
              </div>
            )}
            {content.categoryScores.creativity !== undefined && (
              <div className="bg-black/30 border border-slate-800 p-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {t("creativityLabel") || "Creativity"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent font-mono">
                    {content.categoryScores.creativity.toFixed(1)}
                  </span>
                  <span className="text-slate-500 font-mono">/5.0</span>
                </div>
              </div>
            )}
            {content.categoryScores.impact !== undefined && (
              <div className="bg-black/30 border border-slate-800 p-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {t("impactLabel") || "Impact"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent font-mono">
                    {content.categoryScores.impact.toFixed(1)}
                  </span>
                  <span className="text-slate-500 font-mono">/5.0</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (documents.length === 0) {
    return (
      <section
        className="bg-primary/30 border border-dashed border-slate-700 p-8 text-center animate-fade-in"
        aria-labelledby="documents-heading"
      >
        <h2
          id="documents-heading"
          className="text-2xl font-bold border-b border-slate-700 pb-2 text-slate-200 uppercase tracking-wider mb-4"
        >
          {t("documentsTitle") || "Analyses"}
        </h2>
        <div className="flex flex-col items-center gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg text-slate-400 font-mono uppercase tracking-widest">
            {t("noAnalysesYet") || "No analyses yet"}
          </p>
          <p className="text-sm text-slate-500 font-mono">
            {t("noAnalysesDescription") ||
              "Use the Analyze button below to create your first analysis"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-primary/30 border border-slate-700 p-6 sm:p-8 animate-fade-in"
      aria-labelledby="documents-heading"
    >
      <h2
        id="documents-heading"
        className="text-2xl font-bold border-b border-slate-700 pb-2 text-slate-200 uppercase tracking-wider mb-6"
      >
        {t("documentsTitle") || "Analyses"}{" "}
        <span className="text-slate-500">({documents.length})</span>
      </h2>

      <div className="space-y-4">
        {documents.map((document) => {
          const isExpanded = expandedDocuments.has(document.id);

          return (
            <div
              key={document.id}
              className="bg-black/30 border border-slate-800 overflow-hidden transition-all duration-200 hover:border-slate-700"
            >
              {/* Document header - always visible */}
              <button
                onClick={() => toggleDocument(document.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-900/30 transition-colors"
                aria-expanded={isExpanded}
                aria-controls={`document-content-${document.id}`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {getDocumentTypeIcon(document.documentType)}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-200 truncate uppercase tracking-wider">
                      {document.title ||
                        getDocumentTypeLabel(document.documentType)}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 font-mono">
                      {formatDate(document.createdAt)}
                    </p>
                  </div>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 text-slate-400 transition-transform flex-shrink-0 ml-4 ${
                    isExpanded ? "rotate-180" : ""
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

              {/* Document content - expandable */}
              {isExpanded && (
                <div
                  id={`document-content-${document.id}`}
                  className="px-6 pb-6 border-t border-slate-800 pt-4 animate-fade-in"
                >
                  {document.documentType === "startup_analysis" &&
                    renderStartupAnalysisFields(document.content)}
                  {document.documentType === "hackathon_analysis" &&
                    renderHackathonAnalysisFields(document.content)}

                  {/* Summary or description if available */}
                  {document.content.viabilitySummary && (
                    <div className="mt-4 p-4 bg-slate-900/50 border border-slate-800">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        {t("summaryLabel") || "Summary"}
                      </h4>
                      <p className="text-slate-300 text-sm leading-relaxed font-mono">
                        {document.content.viabilitySummary}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default DocumentsListSection;
