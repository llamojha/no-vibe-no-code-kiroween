"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { useAuth } from "@/features/auth/context/AuthContext";
import LanguageToggle from "@/features/locale/components/LanguageToggle";
import {
  DocumentType,
  type DocumentTypeValue,
} from "@/src/domain/value-objects/DocumentType";
import { DocumentProgressIndicator } from "./DocumentProgressIndicator";
import { getDocumentDisplayName, getDocumentCreditCost } from "@/lib/documents";
import {
  generateDocument,
  updateDocument,
} from "@/features/idea-panel/api/documentGeneration";
import { getIdeaWithDocuments } from "@/features/idea-panel/api/getIdeaWithDocuments";
import { getCreditBalance } from "@/features/shared/api";
import { CreditCounter } from "@/features/shared/components/CreditCounter";
import LoadingOverlay from "@/features/shared/components/LoadingOverlay";
import {
  trackDocumentGenerationRequest,
  trackDocumentGenerationSuccess,
  trackDocumentGenerationFailure,
  trackGeneratorPageView,
  type TrackableDocumentType,
} from "@/features/document-generator/analytics";
import { DocumentEditor } from "./DocumentEditor";
import { RoadmapDependencyPanel } from "./RoadmapDependencyPanel";
import type {
  IdeaDTO,
  DocumentDTO,
} from "@/src/infrastructure/web/dto/IdeaDTO";
import type { UserTier } from "@/lib/types";

/**
 * Props for the DocumentGenerator component
 */
export interface DocumentGeneratorProps {
  ideaId: string;
  documentType: DocumentTypeValue;
  initialCredits?: number;
  userTier?: UserTier;
}

/**
 * Loading messages for document generation
 */
/**
 * DocumentGenerator component
 * Shared component used by all generator pages (PRD, Technical Design, Architecture, Roadmap)
 *
 * Features:
 * - Display idea context section (idea text, analysis summary)
 * - Display existing documents section (show related docs if available)
 * - Display credit cost
 * - Implement generate button with loading state
 * - Implement credit balance check
 * - Implement generation flow with progress feedback
 * - Handle errors and display user-friendly messages
 * - Navigate back to Idea Panel on success
 *
 * Requirements: 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.3, 3.4, 3.5, 4.2, 4.3, 4.4, 4.5,
 *               5.3, 5.4, 5.5, 6.2, 6.3, 6.4, 6.5, 7.3, 7.4, 7.5, 8.2, 8.3, 8.4, 8.5,
 *               15.1, 15.2, 15.3, 15.4, 16.1, 16.2, 16.3, 16.4, 16.5, 19.3, 19.4, 19.5
 */
export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  ideaId,
  documentType,
  initialCredits = 0,
  userTier = "free",
}) => {
  const router = useRouter();
  const { t } = useLocale();
  const { session, isLocalDevMode } = useAuth();

  // State management
  const [idea, setIdea] = useState<IdeaDTO | null>(null);
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [credits, setCredits] = useState<number>(initialCredits);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null
  );
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const documentTypeInstance = useMemo(
    () => DocumentType.fromString(documentType),
    [documentType]
  );

  // Derived values
  const creditCost = getDocumentCreditCost(documentTypeInstance);
  const displayName = getDocumentDisplayName(documentTypeInstance);
  const hasInsufficientCredits = credits < creditCost;
  const loadingMessages = useMemo(
    () => [
      t("generatorLoadingAnalyzing") || "Analyzing your idea...",
      t("generatorLoadingContext") || "Gathering context...",
      t("generatorLoadingGenerating") || "Generating document...",
      t("generatorLoadingCrafting") || "Crafting content...",
      t("generatorLoadingAlmost") || "Almost there...",
      t("generatorLoadingFinalizing") || "Finalizing document...",
    ],
    [t]
  );

  // Get existing documents of relevant types for context
  const latestGeneratedDocument = useMemo(() => {
    const matchingDocs = documents.filter(
      (doc) => doc.documentType === documentTypeInstance.value
    );

    if (matchingDocs.length === 0) return null;

    return matchingDocs.reduce((latest, doc) => {
      const latestVersion = latest.version ?? 1;
      const docVersion = doc.version ?? 1;

      if (docVersion !== latestVersion) {
        return docVersion > latestVersion ? doc : latest;
      }

      const latestUpdatedAt = new Date(latest.updatedAt).getTime();
      const docUpdatedAt = new Date(doc.updatedAt).getTime();

      return docUpdatedAt > latestUpdatedAt ? doc : latest;
    }, matchingDocs[0]);
  }, [documents, documentTypeInstance.value]);

  const hasGeneratedDocument = Boolean(latestGeneratedDocument);

  const getDocumentContentString = useCallback(
    (doc: DocumentDTO | null): string => {
      if (!doc || !doc.content) return "";
      const content = doc.content as Record<string, unknown> | string;

      if (typeof content === "string") {
        return content;
      }

      if (typeof content === "object") {
        const markdownValue = (content as Record<string, unknown>)["markdown"];
        if (typeof markdownValue === "string" && markdownValue.trim()) {
          return markdownValue;
        }
        return JSON.stringify(content, null, 2);
      }

      return "";
    },
    []
  );

  const latestDocumentContent = useMemo(
    () => getDocumentContentString(latestGeneratedDocument),
    [getDocumentContentString, latestGeneratedDocument]
  );

  const existingPRD = documents.find((d) => d.documentType === "prd");
  const existingTechnicalDesign = documents.find(
    (d) => d.documentType === "technical_design"
  );
  const existingArchitecture = documents.find(
    (d) => d.documentType === "architecture"
  );
  const existingAnalysis = documents.find(
    (d) =>
      d.documentType === "startup_analysis" ||
      d.documentType === "hackathon_analysis"
  );

  const analysisSummary = useMemo(() => {
    if (!existingAnalysis || !existingAnalysis.content) return null;

    const content = existingAnalysis.content as Record<string, unknown> | string;

    if (typeof content === "string") {
      const trimmed = content.trim();
      return trimmed ? trimmed : null;
    }

    if (typeof content === "object" && content !== null) {
      const candidateKeys = [
        "summary",
        "detailedSummary",
        "viabilitySummary",
        "feedback",
        "description",
      ];

      for (const key of candidateKeys) {
        const value = (content as Record<string, unknown>)[key];
        if (typeof value === "string" && value.trim()) {
          return value.trim();
        }
      }
    }

    return null;
  }, [existingAnalysis]);

  // Refresh credits
  const refreshCredits = useCallback(async () => {
    try {
      const balance = await getCreditBalance();
      setCredits(balance.credits);
    } catch (err) {
      console.error("Failed to refresh credits:", err);
    }
  }, []);

  // Load idea data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getIdeaWithDocuments(ideaId);
        setIdea(data.idea);
        setDocuments(data.documents);

        // Track generator page view
        trackGeneratorPageView(
          ideaId,
          documentTypeInstance.value as TrackableDocumentType
        );
      } catch (err) {
        console.error("Failed to load idea:", err);
        const loadErrorMessage =
          err instanceof Error
            ? err.message
            : t("loadIdeaError") || "Failed to load idea. Please try again.";
        setError(loadErrorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    refreshCredits();
  }, [ideaId, refreshCredits, documentTypeInstance, t]);

  // Loading message rotation during generation
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    if (isGenerating && loadingMessages.length) {
      let currentIndex = 0;
      setLoadingMessage(loadingMessages[currentIndex]);

      intervalId = setInterval(() => {
        currentIndex = (currentIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[currentIndex]);
      }, 2500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isGenerating, loadingMessages]);

  // Show "still working" message after 30 seconds
  useEffect(() => {
    if (isGenerating && generationStartTime) {
      const checkTime = () => {
        const elapsed = Date.now() - generationStartTime;
        if (elapsed > 30000) {
          setLoadingMessage(
            t("generatorStillWorking") || "Still working on your document..."
          );
        }
      };

      const intervalId = setInterval(checkTime, 5000);
      return () => clearInterval(intervalId);
    }
  }, [isGenerating, generationStartTime, t]);

  // Handle generate button click
  const runGeneration = useCallback(async () => {
    if (isGenerating) return; // Prevent duplicate requests

    const docType = documentTypeInstance.value as TrackableDocumentType;
    const existingDocTypes = documents.map((d) => d.documentType);

    // Track generation request
    trackDocumentGenerationRequest({
      ideaId,
      documentType: docType,
      creditCost,
      userCredits: credits,
      hasExistingDocuments: documents.length > 0,
      existingDocumentTypes: existingDocTypes,
    });

    // Check credits
    if (hasInsufficientCredits) {
      trackDocumentGenerationFailure({
        ideaId,
        documentType: docType,
        errorType: "insufficient_credits",
        errorMessage: `Insufficient credits. Need ${creditCost}, have ${credits}`,
        creditsRefunded: false,
      });
      setError(
        `Insufficient credits. You need ${creditCost} credits but only have ${credits}. Please purchase more credits to continue.`
      );
      return;
    }

    setIsGenerating(true);
    setError(null);
    const startTime = Date.now();
    setGenerationStartTime(startTime);

    try {
      const result = await generateDocument({
        ideaId,
        documentType: docType,
      });

      // Track successful generation
      trackDocumentGenerationSuccess({
        ideaId,
        documentId: result.id,
        documentType: docType,
        creditCost,
        generationTimeMs: Date.now() - startTime,
        version: result.version || 1,
      });

      // Update local document list so the generated output is immediately visible
      setDocuments((prev) => [
        result,
        ...prev.filter((doc) => doc.id !== result.id),
      ]);

      // Refresh credits after successful generation
      await refreshCredits();
    } catch (err) {
      console.error("Document generation failed:", err);

      // Handle specific error types
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate document";

      // Determine error type for analytics
      let errorType:
        | "insufficient_credits"
        | "ai_error"
        | "network_error"
        | "unknown" = "unknown";
      if (errorMessage.includes("Insufficient credits")) {
        errorType = "insufficient_credits";
      } else if (
        errorMessage.includes("AI") ||
        errorMessage.includes("generation")
      ) {
        errorType = "ai_error";
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("fetch")
      ) {
        errorType = "network_error";
      }

      // Track generation failure
      trackDocumentGenerationFailure({
        ideaId,
        documentType: docType,
        errorType,
        errorMessage,
        creditsRefunded:
          errorType === "ai_error" || errorType === "network_error",
      });

      if (errorMessage.includes("Insufficient credits")) {
        setError(
          t("insufficientCreditsDetailed", {
            required: creditCost,
            available: credits,
          }) ||
            `Insufficient credits. You need ${creditCost} credits but only have ${credits}. Please purchase more credits to continue.`
        );
      } else {
        setError(
          errorMessage ||
            t("generationFailedFallback") ||
            "Failed to generate document"
        );
      }

      // Refresh credits in case they were refunded
      await refreshCredits();
    } finally {
      setIsGenerating(false);
      setGenerationStartTime(null);
    }
  }, [
    isGenerating,
    hasInsufficientCredits,
    creditCost,
    credits,
    ideaId,
    documentTypeInstance,
    documents,
    refreshCredits,
    router,
    t,
  ]);

  const handleGenerate = useCallback(() => {
    if (isGenerating) return;
    if (hasGeneratedDocument) {
      setShowRegenerateConfirm(true);
      return;
    }
    runGeneration();
  }, [hasGeneratedDocument, isGenerating, runGeneration]);

  const confirmRegenerate = useCallback(() => {
    setShowRegenerateConfirm(false);
    runGeneration();
  }, [runGeneration]);

  const cancelRegenerate = useCallback(() => {
    setShowRegenerateConfirm(false);
  }, []);

  const saveDocumentContent = useCallback(
    async (content: string) => {
      if (!latestGeneratedDocument) return;
      setIsSavingEdit(true);
      try {
        const updated = await updateDocument(latestGeneratedDocument.id, {
          content,
          ideaId,
          documentType: documentTypeInstance.value as
            | "prd"
            | "technical_design"
            | "architecture"
            | "roadmap",
        });

        setDocuments((prev) => [
          updated,
          ...prev.filter((doc) => doc.id !== updated.id),
        ]);
      } finally {
        setIsSavingEdit(false);
      }
    },
    [documentTypeInstance.value, ideaId, latestGeneratedDocument]
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.push(`/idea/${ideaId}`);
  }, [router, ideaId]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    handleGenerate();
  }, [handleGenerate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/30 to-orange-950/30 text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 mx-auto mb-4 text-accent"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-lg text-slate-400 font-mono uppercase tracking-widest">
                {t("loading") || "Loading..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state (idea not found)
  if (!idea) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/30 to-orange-950/30 text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto mb-4 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="text-2xl font-bold text-red-400 mb-2 uppercase tracking-wider">
                {t("errorTitle") || "Error"}
              </h2>
              <p className="text-slate-400 mb-6 font-mono">
                {error || t("ideaNotFound") || "Idea not found"}
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-3 bg-accent text-white font-bold rounded-none hover:bg-accent/90 transition-colors uppercase tracking-wider"
              >
                {t("backToDashboard") || "Back to Dashboard"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/30 to-orange-950/30 text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      {/* Loading overlay during generation */}
      {isGenerating && <LoadingOverlay message={loadingMessage} />}

      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded"
      >
        {t("skipToMainContent") || "Skip to main content"}
      </a>

      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in relative">
          <button
            onClick={handleBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 hover:text-accent transition-colors duration-200"
            title={t("backToIdeaPanel") || t("back") || "Back"}
            aria-label={t("backToIdeaPanel") || t("back") || "Back"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline uppercase tracking-wider">
              {t("back") || "Back"}
            </span>
          </button>

          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <LanguageToggle />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
            {(t("generateLabel") || "Generate") + " " + displayName}
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            {t("generatorSubtitle") ||
              "AI-powered document generation for your idea"}
          </p>
        </header>

        {/* Progress across documents */}
        <section className="mb-6">
          <DocumentProgressIndicator
            ideaId={ideaId}
            documents={documents}
            className="bg-primary/40 border border-slate-700"
          />
        </section>

        {/* Credit Counter */}
        <div className="mb-6">
          <CreditCounter
            credits={credits}
            tier={userTier}
            userEmail={session?.user?.email}
          />
        </div>

        {/* Main Content */}
        <main id="main-content" className="space-y-6">
          {/* Idea Context Section */}
          <section
            className="bg-gradient-to-br from-purple-900/40 to-black/60 border border-orange-500/30 rounded-lg p-6"
            aria-labelledby="idea-context-heading"
          >
            <h2
              id="idea-context-heading"
              className="text-xl font-bold text-accent mb-4 uppercase tracking-wider"
            >
              {t("ideaSummaryTitle") || "Idea Summary"}
            </h2>
            {analysisSummary ? (
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 whitespace-pre-wrap">
                  {analysisSummary}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                {t("ideaSummaryEmpty") ||
                  "No summary yet. Run an analysis to capture a quick overview."}
              </p>
            )}

            {/* Analysis Summary (if available) */}
            {existingAnalysis && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t("analysisSummaryTitle") || "Analysis Summary"}
                </h3>
                <p className="text-sm text-slate-400">
                  {(t("lastUpdatedLabel") || "Last updated") + " "}
                  {new Date(existingAnalysis.updatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </section>

          {/* Existing Documents Section */}
          {documents.length > 0 && (
            <section
              className="bg-gradient-to-br from-purple-900/40 to-black/60 border border-orange-500/30 rounded-lg p-6"
              aria-labelledby="existing-docs-heading"
            >
              <h2
              id="existing-docs-heading"
              className="text-xl font-bold text-accent mb-4 uppercase tracking-wider"
            >
              {t("existingDocumentsTitle") || "Existing Documents"}
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              {t("existingDocumentsDescription") ||
                "The AI will use these documents as context for better results."}
            </p>
            <ul className="space-y-2">
              {existingPRD && (
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>
                    {t("prdDisplayName") ||
                      getDocumentDisplayName(DocumentType.PRD)}
                  </span>
                  <span className="text-xs text-slate-500">
                    (v{existingPRD.version || 1})
                  </span>
                </li>
              )}
              {existingTechnicalDesign && (
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span>
                    {t("technicalDesignDisplayName") ||
                      getDocumentDisplayName(DocumentType.TECHNICAL_DESIGN)}
                  </span>
                  <span className="text-xs text-slate-500">
                    (v{existingTechnicalDesign.version || 1})
                  </span>
                </li>
              )}
              {existingArchitecture && (
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>
                    {t("architectureDisplayName") ||
                      getDocumentDisplayName(DocumentType.ARCHITECTURE)}
                  </span>
                  <span className="text-xs text-slate-500">
                    (v{existingArchitecture.version || 1})
                  </span>
                </li>
              )}
              {existingAnalysis && (
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span>
                    {existingAnalysis.documentType === "startup_analysis"
                      ? t("startupAnalysisTitle") || "Startup Analysis"
                      : t("hackathonAnalysisTitle") || "Hackathon Analysis"}
                  </span>
                </li>
              )}
            </ul>
            </section>
          )}

          {/* Credit Cost Section */}
          <section
            className="bg-slate-900/50 border border-slate-700 rounded-lg p-6"
            aria-labelledby="credit-cost-heading"
          >
            <h2
              id="credit-cost-heading"
              className="text-xl font-bold text-accent mb-4 uppercase tracking-wider"
            >
              {t("generationCostTitle") || "Generation Cost"}
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300">
                  {t("generationCostDescription", {
                    documentName: displayName,
                  }) || `Generating a ${displayName} costs:`}
                </p>
                <p className="text-3xl font-bold text-purple-400 mt-2">
                  {creditCost} credits
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">
                  {t("yourBalance") || "Your balance:"}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    hasInsufficientCredits ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {credits} credits
                </p>
              </div>
            </div>

            {hasInsufficientCredits && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-600 rounded-lg">
                <p className="text-red-300 text-sm">
                  {t("additionalCreditsNeeded", {
                    amount: creditCost - credits,
                  }) ||
                    `You need ${creditCost - credits} more credits to generate this document.`}
                </p>
                <button
                  onClick={() => {
                    // TODO: Navigate to purchase page when implemented
                    console.log("Navigate to purchase credits");
                  }}
                  className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors duration-200"
                >
                  {t("getMoreCredits") || "Get More Credits"}
                </button>
              </div>
            )}
          </section>

          {/* Generated Output - single document view */}
          {latestGeneratedDocument && (
            <section className="bg-gradient-to-br from-purple-900/40 to-black/60 border border-orange-500/30 rounded-lg p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-accent uppercase tracking-wider">
                    {t("viewAndEdit")}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {(t("generatorLatestVersion") || "Latest version") +
                      " • " +
                      new Date(
                        latestGeneratedDocument.updatedAt
                      ).toLocaleString()}
                  </p>
                </div>
                {latestGeneratedDocument.version && (
                  <span className="px-3 py-1 text-xs font-semibold text-purple-200 bg-purple-900/50 border border-purple-500/40 rounded">
                    {t("versionLabel", {
                      version: latestGeneratedDocument.version,
                    }) || `v${latestGeneratedDocument.version}`}
                  </span>
                )}
              </div>

              <div className="space-y-6">
                <DocumentEditor
                  initialContent={latestDocumentContent}
                  onSave={saveDocumentContent}
                  disabled={isSavingEdit}
                  documentId={latestGeneratedDocument.id}
                  documentType={
                    documentTypeInstance.value as TrackableDocumentType
                  }
                  currentVersion={latestGeneratedDocument.version || 1}
                  placeholder={
                    t("editDocumentPlaceholder") || "Edit document..."
                  }
                />

                {documentTypeInstance.value === "roadmap" && (
                  <RoadmapDependencyPanel
                    content={latestDocumentContent}
                    onSave={saveDocumentContent}
                    isSaving={isSavingEdit}
                  />
                )}
              </div>
            </section>
          )}

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-red-900/30 border border-red-600 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-red-400 font-semibold mb-1">
                    {t("generationFailedTitle") || "Generation Failed"}
                  </h3>
                  <p className="text-red-300 text-sm mb-3">{error}</p>
                  <button
                    onClick={handleRetry}
                    disabled={hasInsufficientCredits}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    {t("tryAgain") || "Try Again"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || hasInsufficientCredits}
              className={`
                px-8 py-4 text-lg font-bold uppercase tracking-wider rounded-lg
                transition-all duration-200 transform
                ${
                  isGenerating || hasInsufficientCredits
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-accent to-secondary text-white hover:scale-105 hover:shadow-lg hover:shadow-accent/30"
                }
              `}
              aria-busy={isGenerating}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t("generatingDocument") || "Generating..."}
                </span>
              ) : (
                hasGeneratedDocument
                  ? t("regenerateDocument") || "Re-generate document"
                  : t("generateDocumentCta", {
                      documentName: displayName,
                    }) || `Generate ${displayName}`
              )}
            </button>
          </div>
        </main>
      </div>

      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-100 mb-2 uppercase tracking-wider">
              {t("confirmRegenerateTitle") || "Regenerate document?"}
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              {t("confirmRegenerateBody") ||
                "This will generate a new version and override the current document. Do you want to continue?"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelRegenerate}
                className="px-4 py-2 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={confirmRegenerate}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                {t("regenerateDocument") || "Re-generate document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentGenerator;
