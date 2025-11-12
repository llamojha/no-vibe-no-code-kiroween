"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Analysis, SavedAnalysisRecord, UserTier } from "@/lib/types";
import { mapSavedAnalysesRow } from "@/lib/supabase/mappers";
import type {
  SavedAnalysesInsert,
  SavedAnalysesRow,
  SavedAnalysesUpdate,
} from "@/lib/supabase/types";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { useAuth } from "@/features/auth/context/AuthContext";
import { requestAnalysis } from "@/features/analyzer/api/analyzeIdea";
import {
  saveAnalysis,
  updateAnalysisAudio,
  loadAnalysis,
  clearAnalysisAudio,
} from "@/features/analyzer/api/saveAnalysis";
import IdeaInputForm from "@/features/analyzer/components/IdeaInputForm";
import AnalysisDisplay from "@/features/analyzer/components/AnalysisDisplay";
import Loader from "@/features/analyzer/components/Loader";
import ErrorMessage from "@/features/analyzer/components/ErrorMessage";
import LanguageToggle from "@/features/locale/components/LanguageToggle";
import { capture } from "@/features/analytics/posthogClient";
import { CreditCounter } from "@/features/shared/components/CreditCounter";
import { getCreditBalance } from "@/features/shared/api";

type LoaderMessages = [string, string, string, string, string, string];

interface AnalyzerViewProps {
  initialCredits: number;
  userTier: UserTier;
}

const AnalyzerView: React.FC<AnalyzerViewProps> = ({
  initialCredits,
  userTier,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const savedId = searchParams.get("savedId");
  const mode = searchParams.get("mode");
  const ideaFromUrl = searchParams.get("idea");
  const sourceFromUrl = searchParams.get("source");
  const frankensteinMode = searchParams.get("mode"); // companies or aws
  const frankensteinId = searchParams.get("frankensteinId"); // ID of the original Frankenstein

  const { locale, t } = useLocale();
  const {
    session,
    supabase,
    isLoading: isAuthLoading,
    isLocalDevMode,
  } = useAuth();

  const [idea, setIdea] = useState<string>("");
  const [newAnalysis, setNewAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [isReportSaved, setIsReportSaved] = useState<boolean>(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [addedSuggestions, setAddedSuggestions] = useState<number[]>([]);
  const [savedAnalysisRecord, setSavedAnalysisRecord] =
    useState<SavedAnalysisRecord | null>(null);
  const [isFetchingSaved, setIsFetchingSaved] = useState(false);
  const [credits, setCredits] = useState<number>(initialCredits);
  const savedRecordId = savedAnalysisRecord?.id ?? null;
  const savedRecordAudio = savedAnalysisRecord?.audioBase64 ?? null;

  const ideaInputRef = useRef<HTMLDivElement>(null);

  const refreshCredits = useCallback(async () => {
    try {
      const balance = await getCreditBalance();
      setCredits(balance.credits);
    } catch (error) {
      const message = "Failed to refresh credit balance";
      if (isLocalDevMode) {
        console.warn(message, error);
      } else {
        console.error(message, error);
      }
    }
  }, [isLocalDevMode]);

  const showInputForm =
    !savedAnalysisRecord || mode === "refine" || newAnalysis !== null;

  // Pre-fill idea from Doctor Frankenstein if provided
  useEffect(() => {
    if (ideaFromUrl && sourceFromUrl === 'frankenstein' && !savedId) {
      // useSearchParams().get() already returns decoded values, no need to decode again
      setIdea(ideaFromUrl);
    }
  }, [ideaFromUrl, sourceFromUrl, savedId]);

  useEffect(() => {
    void refreshCredits();
  }, [refreshCredits]);

  useEffect(() => {
    if (!savedId) {
      setSavedAnalysisRecord(null);
      // Don't reset if we have an idea from Frankenstein
      if (!ideaFromUrl || sourceFromUrl !== 'frankenstein') {
        setIdea("");
      }
      setIsReportSaved(false);
      setGeneratedAudio(null);
      return;
    }

    // Wait until auth is initialized before deciding unauthenticated (unless in local dev mode)
    if (!isLocalDevMode && (!supabase || isAuthLoading)) return;

    if (!isLocalDevMode && !session) {
      const next = `/analyzer?savedId=${encodeURIComponent(savedId)}${
        mode ? `&mode=${mode}` : ""
      }`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    const fetchSavedAnalysis = async () => {
      setIsFetchingSaved(true);
      try {
        // Use the new load function that handles both local dev mode and production
        const { data: record, error } = await loadAnalysis(savedId);

        if (error || !record) {
          console.error("Failed to load saved analysis", error);
          setSavedAnalysisRecord(null);
          setIdea("");
          setIsReportSaved(false);
          setGeneratedAudio(null);
          if (error !== "Analysis not found") {
            setError(
              "Unable to load the saved analysis. It may have been removed."
            );
          }
          return;
        }

        setSavedAnalysisRecord(record);
        setIdea(record.idea);
        setIsReportSaved(true);
        setNewAnalysis(null);
        setAddedSuggestions([]);
        setGeneratedAudio(record.audioBase64 ?? null);
        setError(null);
      } finally {
        setIsFetchingSaved(false);
      }
    };

    void fetchSavedAnalysis();
  }, [mode, router, savedId, session, supabase, isAuthLoading, isLocalDevMode, ideaFromUrl, sourceFromUrl]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (isLoading) {
      const messages: LoaderMessages = [
        t("loaderMessage1"),
        t("loaderMessage2"),
        t("loaderMessage3"),
        t("loaderMessage4"),
        t("loaderMessage5"),
        t("loaderMessage6"),
      ];
      let currentIndex = 0;
      setLoadingMessage(messages[currentIndex]);

      intervalId = setInterval(() => {
        currentIndex = (currentIndex + 1) % messages.length;
        setLoadingMessage(messages[currentIndex]);
      }, 2500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading, t]);

  const handleBack = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleAnalyze = useCallback(async () => {
    if (!idea.trim()) {
      setError(t("enterIdeaError"));
      return;
    }

    if (generatedAudio) {
      setGeneratedAudio(null);
    }

    if (savedRecordId && savedRecordAudio) {
      const { error: clearError } = await clearAnalysisAudio(savedRecordId);
      if (clearError) {
        console.error("Failed to clear saved audio", clearError);
      } else {
        setSavedAnalysisRecord((previous) =>
          previous && previous.id === savedRecordId
            ? { ...previous, audioBase64: null }
            : previous
        );
      }
    }

    setIsLoading(true);
    capture("analysis_started", { locale, has_saved_id: Boolean(savedId) });
    setError(null);
    setNewAnalysis(null);
    setAddedSuggestions([]);
    setIsReportSaved(false);

    try {
      const analysisResult = await requestAnalysis(idea, locale);
      setNewAnalysis(analysisResult);
      await refreshCredits();
      
      let newlySavedId: string | null = null;
      
      // Auto-save if user is logged in (to preserve credits)
      if (session && !isLocalDevMode) {
        try {
          const { data: record, error: saveError } = await saveAnalysis({
            idea,
            analysis: analysisResult,
          });

          if (!saveError && record) {
            newlySavedId = record.id;
            setSavedAnalysisRecord(record);
            setIsReportSaved(true);
            capture("analysis_auto_saved", { analysis_id: record.id, locale });
            
            // If this came from a Frankenstein, update it with the validation
            if (frankensteinId && sourceFromUrl === 'frankenstein') {
              try {
                const { updateFrankensteinValidation } = await import('@/features/doctor-frankenstein/api/saveFrankensteinIdea');
                const { deriveFivePointScore } = await import('@/features/dashboard/api/scoreUtils');
                
                const score = deriveFivePointScore(analysisResult as any);
                
                console.log('Auto-updating Frankenstein with validation:', {
                  frankensteinId,
                  analysisId: record.id,
                  score,
                });
                
                await updateFrankensteinValidation(frankensteinId, 'analyzer', {
                  analysisId: record.id,
                  score,
                });
              } catch (err) {
                console.error('Failed to update Frankenstein with validation:', err);
              }
            }
            
            // Update URL with saved ID
            router.replace(`/analyzer?savedId=${encodeURIComponent(record.id)}&mode=view`);
          } else {
            console.error('Auto-save failed:', saveError);
          }
        } catch (err) {
          console.error('Auto-save error:', err);
          // Don't show error to user, analysis was still generated successfully
        }
      } else if (frankensteinId && sourceFromUrl === 'frankenstein') {
        // If not logged in but came from Frankenstein, still update with temp score
        try {
          const { updateFrankensteinValidation } = await import('@/features/doctor-frankenstein/api/saveFrankensteinIdea');
          const { deriveFivePointScore } = await import('@/features/dashboard/api/scoreUtils');
          
          const score = deriveFivePointScore(analysisResult as unknown);
          
          await updateFrankensteinValidation(frankensteinId, 'analyzer', {
            analysisId: 'temp-' + Date.now(),
            score,
          });
          
          setIsReportSaved(true);
        } catch (err) {
          console.error('Failed to update Frankenstein with score:', err);
        }
      }
      
      // Only clean up URL if we had a savedId but didn't just create a new one
      if (savedId && !newlySavedId) {
        router.replace("/analyzer");
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during analysis."
      );
    } finally {
      setIsLoading(false);
    }
  }, [idea, generatedAudio, savedRecordId, savedRecordAudio, locale, savedId, t, refreshCredits, session, isLocalDevMode, frankensteinId, sourceFromUrl, router]);

  const handleAudioGenerated = useCallback(
    async (audioBase64: string) => {
      setGeneratedAudio(audioBase64);

      if (!savedRecordId) {
        return;
      }

      // Use the new update function that handles both local dev mode and production
      const { error: updateError } = await updateAnalysisAudio({
        analysisId: savedRecordId,
        audioBase64: audioBase64,
      });

      if (updateError) {
        console.error("Failed to persist audio", updateError);
        return;
      }

      setSavedAnalysisRecord((previous) =>
        previous && previous.id === savedRecordId
          ? { ...previous, audioBase64: audioBase64 }
          : previous
      );
    },
    [savedRecordId]
  );

  const handleRefineSuggestion = useCallback(
    (suggestionText: string, suggestionTitle: string, index: number) => {
      setIdea(
        (prev) => `${prev.trim()}\n\n— ${suggestionTitle}: ${suggestionText}`
      );
      setAddedSuggestions((prev) => [...prev, index]);
      ideaInputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    []
  );

  const handleStartNewAnalysis = useCallback(() => {
    setIdea("");
    setNewAnalysis(null);
    setSavedAnalysisRecord(null);
    setIsReportSaved(false);
    setGeneratedAudio(null);
    setAddedSuggestions([]);
    setError(null);

    if (savedId) {
      router.replace("/analyzer");
    }
  }, [router, savedId]);

  const analysisToDisplay =
    newAnalysis ?? savedAnalysisRecord?.analysis ?? null;

  const busy = isLoading || isFetchingSaved;
  const busyMessage = isLoading ? loadingMessage : t("loading");

  return (
    <div className="min-h-screen bg-black text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded"
      >
        {t("skipToMainContent") || "Skip to main content"}
      </a>

      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8 animate-fade-in relative">
          <button
            onClick={handleBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 hover:text-accent transition-colors duration-200"
            title={t("goToDashboardButton")}
            aria-label={t("goToDashboardButton")}
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
              {t("goToDashboardButton")}
            </span>
          </button>
          <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
            {t("appTitle")}
          </h1>
          <p className="mt-2 text-lg text-slate-400">{t("appSubtitle")}</p>
          
          {/* Frankenstein Origin Badge */}
          {sourceFromUrl === 'frankenstein' && !savedId && (
            <div className="mt-4 space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-900/50 to-purple-900/50 border border-green-500 rounded-lg">
                <span className="text-2xl">🧟</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-green-400">
                    {locale === 'es' ? 'Remix de Doctor Frankenstein' : 'Remix from Doctor Frankenstein'}
                  </p>
                  <p className="text-xs text-green-300">
                    {frankensteinMode === 'aws' 
                      ? (locale === 'es' ? 'Combinación de AWS Services' : 'AWS Services Combination')
                      : (locale === 'es' ? 'Combinación de Tech Companies' : 'Tech Companies Combination')}
                  </p>
                </div>
              </div>
              {isReportSaved && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-600 rounded-lg">
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-300">
                    {locale === 'es' 
                      ? '✓ Puntuación guardada en tu Frankenstein' 
                      : '✓ Score saved to your Frankenstein'}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <LanguageToggle />
          </div>
        </header>

        <main id="main-content" className="w-full">
          {/* Credit Counter */}
          <div className="mb-6">
            <CreditCounter credits={credits} tier={userTier} />
          </div>

          {showInputForm && (
            <div ref={ideaInputRef}>
              <IdeaInputForm
                idea={idea}
                onIdeaChange={setIdea}
                onAnalyze={handleAnalyze}
                isLoading={busy}
              />
            </div>
          )}
          {error && (
            <div role="alert" aria-live="assertive">
              <ErrorMessage message={error} />
            </div>
          )}
          {busy && (
            <div role="status" aria-live="polite" aria-atomic="true">
              <Loader message={busyMessage} />
            </div>
          )}
          {analysisToDisplay && !busy && (
            <div className={showInputForm ? "mt-8" : ""}>
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleStartNewAnalysis}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider border border-accent text-accent rounded hover:bg-accent/10 transition-colors"
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
                      d="M4.5 4a.5.5 0 01.5-.5h4a.5.5 0 010 1H6.207l1.647 1.646a.5.5 0 01-.708.708L4.146 4.854A.5.5 0 014 4.5V4zm11 12a.5.5 0 01-.5.5h-4a.5.5 0 010-1h2.793l-1.647-1.646a.5.5 0 11.708-.708l3 2.999a.5.5 0 01.146.355V16zM4 12.5a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{t("generateNewIdea") || "Generate New Idea"}</span>
                </button>
              </div>
              <AnalysisDisplay
                analysis={analysisToDisplay}
                isSaved={isReportSaved}
                savedAudioBase64={generatedAudio}
                onAudioGenerated={handleAudioGenerated}
                onGoToDashboard={handleBack}
                onRefineSuggestion={
                  showInputForm ? handleRefineSuggestion : undefined
                }
                addedSuggestions={addedSuggestions}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AnalyzerView;
