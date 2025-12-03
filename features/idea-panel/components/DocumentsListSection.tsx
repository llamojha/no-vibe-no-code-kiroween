"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { isEnabled } from "@/lib/featureFlags";
import type { DocumentDTO } from "@/src/infrastructure/web/dto/IdeaDTO";
import { ScoreGauge } from "@/features/shared/components/ScoreGauge";
import { trackDocumentView } from "@/features/idea-panel/analytics/tracking";

interface DocumentsListSectionProps {
  documents: DocumentDTO[];
  ideaId?: string;
}

type ScoreRubricItem = {
  name?: string;
  score?: number;
  explanation?: string;
};

type AnalysisContent = {
  viabilitySummary?: string;
} & Record<string, unknown>;

type StartupAnalysisContent = AnalysisContent & {
  finalScore?: number;
  scoringRubric?: ScoreRubricItem[];
};

type HackathonAnalysisContent = AnalysisContent & {
  overallScore?: number;
  categoryScores?: {
    technical?: number;
    creativity?: number;
    impact?: number;
  };
};

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
  ideaId,
}) => {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(
    new Set()
  );

  // Feature flag evaluations
  const showClassicAnalyzer = isEnabled("ENABLE_CLASSIC_ANALYZER");
  const showKiroweenAnalyzer = isEnabled("ENABLE_KIROWEEN_ANALYZER");

  const toggleDocument = (documentId: string, documentType: string) => {
    const isExpanding = !expandedDocuments.has(documentId);

    setExpandedDocuments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });

    // Track document view
    if (ideaId && isExpanding) {
      trackDocumentView({
        ideaId,
        documentId,
        documentType: documentType as "startup_analysis" | "hackathon_analysis",
        action: "expand",
      });
    }
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

  const renderStartupAnalysisFields = (
    content: StartupAnalysisContent
  ): JSX.Element => {
    const scoringRubric = Array.isArray(content.scoringRubric)
      ? content.scoringRubric
      : [];
    const marketDemandScore = scoringRubric.find(
      (r) => r.name === "Market Demand"
    )?.score;
    const uniquenessScore = scoringRubric.find(
      (r) => r.name === "Uniqueness"
    )?.score;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {typeof content.finalScore === "number" && (
          <div className="bg-black/30 border border-slate-800 p-4 flex flex-col items-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {t("finalScoreLabel") || "Final Score"}
            </span>
            <ScoreGauge score={content.finalScore} size={80} />
          </div>
        )}
        {scoringRubric.length > 0 && (
          <>
            {typeof marketDemandScore === "number" && (
              <div className="bg-black/30 border border-slate-800 p-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {t("marketDemandLabel") || "Market Demand"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent font-mono">
                    {marketDemandScore.toFixed(1)}
                  </span>
                  <span className="text-slate-500 font-mono">/5.0</span>
                </div>
              </div>
            )}
            {typeof uniquenessScore === "number" && (
              <div className="bg-black/30 border border-slate-800 p-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {t("uniquenessLabel") || "Uniqueness"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent font-mono">
                    {uniquenessScore.toFixed(1)}
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

  const renderHackathonAnalysisFields = (
    content: HackathonAnalysisContent
  ): JSX.Element => {
    const categoryScores =
      content.categoryScores && typeof content.categoryScores === "object"
        ? content.categoryScores
        : undefined;
    const technicalScore =
      categoryScores && typeof categoryScores.technical === "number"
        ? categoryScores.technical
        : undefined;
    const creativityScore =
      categoryScores && typeof categoryScores.creativity === "number"
        ? categoryScores.creativity
        : undefined;
    const impactScore =
      categoryScores && typeof categoryScores.impact === "number"
        ? categoryScores.impact
        : undefined;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {typeof content.overallScore === "number" && (
          <div className="bg-black/30 border border-slate-800 p-4 flex flex-col items-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {t("overallScoreLabel") || "Overall Score"}
            </span>
            <ScoreGauge score={content.overallScore} size={80} />
          </div>
        )}
        {categoryScores && (
          <>
            {typeof technicalScore === "number" && (
              <div className="bg-black/30 border border-slate-800 p-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {t("technicalLabel") || "Technical"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent font-mono">
                    {technicalScore.toFixed(1)}
                  </span>
                  <span className="text-slate-500 font-mono">/5.0</span>
                </div>
              </div>
            )}
            {typeof creativityScore === "number" && (
              <div className="bg-black/30 border border-slate-800 p-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {t("creativityLabel") || "Creativity"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent font-mono">
                    {creativityScore.toFixed(1)}
                  </span>
                  <span className="text-slate-500 font-mono">/5.0</span>
                </div>
              </div>
            )}
            {typeof impactScore === "number" && (
              <div className="bg-black/30 border border-slate-800 p-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {t("impactLabel") || "Impact"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent font-mono">
                    {impactScore.toFixed(1)}
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
        {t("reportsAndDocumentsTitle") || "Reports & Documents"}{" "}
        <span className="text-slate-500">({documents.length})</span>
      </h2>

      <div className="space-y-4">
        {documents.map((document) => {
          const isExpanded = expandedDocuments.has(document.id);
          const analysisContent = document.content as AnalysisContent;
          const viabilitySummary =
            typeof analysisContent.viabilitySummary === "string"
              ? analysisContent.viabilitySummary
              : undefined;

          return (
            <div
              key={document.id}
              className="bg-black/30 border border-slate-800 overflow-hidden transition-all duration-200 hover:border-slate-700"
            >
              {/* Document header - always visible with buttons */}
              <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Left side: Icon and info */}
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

                {/* Right side: Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (document.documentType === "startup_analysis") {
                        router.push(
                          `/analyzer?savedId=${encodeURIComponent(
                            document.id
                          )}&mode=view`
                        );
                      } else if (
                        document.documentType === "hackathon_analysis"
                      ) {
                        router.push(
                          `/kiroween-analyzer?savedId=${encodeURIComponent(
                            document.id
                          )}&mode=view`
                        );
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/40 border border-slate-700 text-slate-300 hover:bg-accent/20 hover:text-accent hover:border-accent transition-colors rounded-none uppercase tracking-wider"
                    aria-label={t("viewDocumentButton") || "View"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="hidden sm:inline">
                      {t("view") || "View"}
                    </span>
                  </button>

                  {((document.documentType === "startup_analysis" &&
                    showClassicAnalyzer) ||
                    (document.documentType === "hackathon_analysis" &&
                      showKiroweenAnalyzer)) && (
                    <button
                      onClick={() => {
                        if (document.documentType === "startup_analysis") {
                          router.push(
                            `/analyzer?savedId=${encodeURIComponent(
                              document.id
                            )}&mode=refine`
                          );
                        } else if (
                          document.documentType === "hackathon_analysis"
                        ) {
                          router.push(
                            `/kiroween-analyzer?savedId=${encodeURIComponent(
                              document.id
                            )}&mode=refine`
                          );
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/40 border border-slate-700 text-slate-300 hover:bg-secondary/20 hover:text-secondary hover:border-secondary transition-colors rounded-none uppercase tracking-wider"
                      aria-label={t("editDocumentButton") || "Edit"}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path
                          fillRule="evenodd"
                          d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="hidden sm:inline">
                        {t("edit") || "Edit"}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() =>
                      toggleDocument(document.id, document.documentType)
                    }
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/40 border border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 hover:border-slate-600 transition-colors rounded-none uppercase tracking-wider"
                    aria-expanded={isExpanded}
                    aria-controls={`document-content-${document.id}`}
                    aria-label={
                      isExpanded
                        ? t("collapseSummary") || "Collapse"
                        : t("expandSummary") || "Expand"
                    }
                  >
                    <span className="hidden sm:inline">
                      {isExpanded
                        ? t("collapseSummary") || "Collapse"
                        : t("expandSummary") || "Expand"}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transition-transform ${
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
                </div>
              </div>

              {/* Document content - expandable summary */}
              {isExpanded && (
                <div
                  id={`document-content-${document.id}`}
                  className="px-6 pb-6 border-t border-slate-800 pt-4 animate-fade-in"
                >
                  {/* Summary section */}
                  <div className="bg-slate-900/50 border border-slate-800 p-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t("summaryLabel") || "Summary"}
                    </h4>

                    {viabilitySummary ? (
                      <div className="text-slate-300 text-sm leading-relaxed prose prose-sm prose-invert max-w-none [&>h1]:text-lg [&>h1]:font-bold [&>h1]:text-slate-200 [&>h1]:mt-4 [&>h1]:mb-2 [&>h2]:text-base [&>h2]:font-semibold [&>h2]:text-slate-200 [&>h2]:mt-3 [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:text-slate-300 [&>h3]:mt-2 [&>h3]:mb-1 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:mb-2 [&>pre]:bg-slate-900 [&>pre]:p-3 [&>pre]:rounded [&>pre]:overflow-x-auto [&>pre]:text-xs [&>code]:bg-slate-800 [&>code]:px-1 [&>code]:rounded [&>a]:text-accent [&>a]:hover:underline">
                        <ReactMarkdown>{viabilitySummary}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm italic font-mono">
                        {t("noSummaryAvailable") ||
                          "No summary available for this document"}
                      </p>
                    )}
                  </div>

                  {/* Score preview */}
                  <div className="mt-4">
                    {document.documentType === "startup_analysis" &&
                      renderStartupAnalysisFields(
                        document.content as StartupAnalysisContent
                      )}
                    {document.documentType === "hackathon_analysis" &&
                      renderHackathonAnalysisFields(
                        document.content as HackathonAnalysisContent
                      )}
                  </div>
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
