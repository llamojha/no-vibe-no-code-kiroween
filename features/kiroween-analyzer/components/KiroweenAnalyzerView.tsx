"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  HackathonAnalysis,
  ProjectSubmission,
  SavedHackathonAnalysis,
} from "@/lib/types";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLocale } from "@/features/locale/context/LocaleContext";
import {
  analyzeHackathonProject,
  loadHackathonAnalysis,
  saveHackathonAnalysis,
  updateHackathonAnalysisAudio,
} from "@/features/kiroween-analyzer/api";
import ProjectSubmissionForm from "./ProjectSubmissionForm";
import HackathonAnalysisDisplay from "./HackathonAnalysisDisplay";
import SpookyLoader from "./SpookyLoader";
import SpookyErrorMessage from "./SpookyErrorMessage";
import LanguageToggle from "@/features/locale/components/LanguageToggle";

const KiroweenAnalyzerView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const savedId = searchParams.get("savedId");
  const mode = searchParams.get("mode");

  const { locale, t } = useLocale();
  const { session, supabase, isLoading: isAuthLoading } = useAuth();
  const isLoggedIn = useMemo(() => !!session, [session]);

  const [submission, setSubmission] = useState<ProjectSubmission>({
    description: "",
    supportingMaterials: {},
  });
  const [newAnalysis, setNewAnalysis] = useState<HackathonAnalysis | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [isReportSaved, setIsReportSaved] = useState<boolean>(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [addedSuggestions, setAddedSuggestions] = useState<number[]>([]);
  const [savedAnalysisRecord, setSavedAnalysisRecord] =
    useState<SavedHackathonAnalysis | null>(null);
  const [isFetchingSaved, setIsFetchingSaved] = useState(false);
  const savedRecordId = savedAnalysisRecord?.id ?? null;
  const savedRecordAudio = savedAnalysisRecord?.audioBase64 ?? null;

  const submissionFormRef = useRef<HTMLDivElement>(null);

  const showInputForm =
    !savedAnalysisRecord || mode === "refine" || newAnalysis !== null;

  // Loading messages for spooky theme
  const loadingMessages = [
    t("spookyLoaderMessage1"),
    t("spookyLoaderMessage2"),
    t("spookyLoaderMessage3"),
    t("spookyLoaderMessage4"),
    t("spookyLoaderMessage5"),
    t("spookyLoaderMessage6"),
  ];

  useEffect(() => {
    if (!savedId) {
      setSavedAnalysisRecord(null);
      setSubmission({
        description: "",
        supportingMaterials: {},
      });
      setIsReportSaved(false);
      setGeneratedAudio(null);
      return;
    }

    // Wait until auth is initialized before deciding unauthenticated
    if (!supabase || isAuthLoading) return;

    if (!session) {
      const next = `/kiroween-analyzer?savedId=${encodeURIComponent(savedId)}${
        mode ? `&mode=${mode}` : ""
      }`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    const fetchSavedAnalysis = async () => {
      setIsFetchingSaved(true);
      try {
        const { data, error } = await loadHackathonAnalysis(savedId);

        if (error || !data) {
          console.error("Failed to load saved hackathon analysis", error);
          setSavedAnalysisRecord(null);
          setSubmission({
            description: "",
            supportingMaterials: {},
          });
          setIsReportSaved(false);
          setGeneratedAudio(null);
          if (error !== "Analysis not found") {
            setError(
              error ||
                "Unable to load the saved analysis. It may have been removed."
            );
          }
          return;
        }

        setSavedAnalysisRecord(data);
        setSubmission({
          description: data.projectDescription,
          supportingMaterials: data.supportingMaterials || {},
        });
        setIsReportSaved(true);
        setNewAnalysis(null);
        setAddedSuggestions([]);
        setGeneratedAudio(data.audioBase64 ?? null);
        setError(null);
      } catch (err) {
        console.error("Error fetching saved analysis:", err);
        setError("Failed to load saved analysis");
      } finally {
        setIsFetchingSaved(false);
      }
    };

    void fetchSavedAnalysis();
  }, [mode, router, savedId, session, supabase, isAuthLoading]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (isLoading) {
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
  }, [isLoading, loadingMessages]);

  const handleBack = useCallback(() => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  }, [isLoggedIn, router]);

  const handleAnalyze = useCallback(async () => {
    if (!submission.description.trim()) {
      setError("Please provide a project description");
      return;
    }

    if (generatedAudio) {
      setGeneratedAudio(null);
    }

    // Clear saved audio if updating existing analysis
    if (savedRecordId && savedRecordAudio) {
      try {
        const { error: clearError } = await updateHackathonAnalysisAudio(
          savedRecordId,
          ""
        );
        if (clearError) {
          console.error("Failed to clear saved audio", clearError);
        } else {
          setSavedAnalysisRecord((previous) =>
            previous && previous.id === savedRecordId
              ? { ...previous, audioBase64: null }
              : previous
          );
        }
      } catch (err) {
        console.error("Error clearing audio:", err);
      }
    }

    setIsLoading(true);
    setError(null);
    setNewAnalysis(null);
    setAddedSuggestions([]);
    setIsReportSaved(false);

    try {
      const analysisResult = await analyzeHackathonProject(submission, locale);
      setNewAnalysis(analysisResult);
      if (savedId) {
        router.replace("/kiroween-analyzer");
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
  }, [
    generatedAudio,
    submission,
    locale,
    router,
    savedId,
    savedRecordAudio,
    savedRecordId,
  ]);

  const handleSaveReport = useCallback(async () => {
    const analysisToSave = newAnalysis ?? savedAnalysisRecord?.analysis;
    if (!analysisToSave || !submission.description) return;

    if (!session) {
      router.push(`/login?next=${encodeURIComponent("/dashboard")}`);
      return;
    }

    try {
      const { data, error: saveError } = await saveHackathonAnalysis({
        projectDescription: submission.description,
        analysis: analysisToSave,
        supportingMaterials: submission.supportingMaterials,
        audioBase64: generatedAudio || undefined,
      });

      if (saveError || !data) {
        console.error("Failed to save hackathon analysis", saveError);
        setError(
          saveError || "Failed to save your analysis. Please try again."
        );
        return;
      }

      setSavedAnalysisRecord(data);
      setIsReportSaved(true);
      setNewAnalysis(null);
      setAddedSuggestions([]);
      setGeneratedAudio(data.audioBase64 ?? null);
      router.replace(
        `/kiroween-analyzer?savedId=${encodeURIComponent(data.id)}&mode=view`
      );
    } catch (err) {
      console.error("Error saving analysis:", err);
      setError("Failed to save your analysis. Please try again.");
    }
  }, [
    generatedAudio,
    submission,
    newAnalysis,
    router,
    savedAnalysisRecord,
    session,
  ]);

  const handleAudioGenerated = useCallback(
    async (audioBase64: string) => {
      setGeneratedAudio(audioBase64);

      if (!savedRecordId) {
        return;
      }

      try {
        const { error: updateError } = await updateHackathonAnalysisAudio(
          savedRecordId,
          audioBase64
        );

        if (updateError) {
          console.error("Failed to persist audio", updateError);
          return;
        }

        setSavedAnalysisRecord((previous) =>
          previous && previous.id === savedRecordId
            ? { ...previous, audioBase64: audioBase64 }
            : previous
        );
      } catch (err) {
        console.error("Error updating audio:", err);
      }
    },
    [savedRecordId]
  );

  const handleRefineSuggestion = useCallback(
    (suggestionText: string, suggestionTitle: string, index: number) => {
      setSubmission((prev) => ({
        ...prev,
        description: `${prev.description.trim()}\n\n— ${suggestionTitle}: ${suggestionText}`,
      }));
      setAddedSuggestions((prev) => [...prev, index]);
      submissionFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    []
  );

  const analysisToDisplay =
    newAnalysis ?? savedAnalysisRecord?.analysis ?? null;

  const busy = isLoading || isFetchingSaved;
  const busyMessage = isLoading ? loadingMessage : t("loading");

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/30 to-orange-950/30 text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8 animate-fade-in relative">
          <button
            onClick={handleBack}
            className="absolute left-0 top-[90%] -translate-y-1/2 flex items-center gap-2 text-slate-400 hover:text-orange-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black rounded-md p-1"
            aria-label={t("backToHome")}
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
              {t("backToHome")}
            </span>
          </button>
          <div className="absolute right-0 top-[90%] -translate-y-1/2">
            <LanguageToggle />
          </div>
          <h1 className="flex items-center justify-center gap-3 text-4xl sm:text-5xl font-bold uppercase tracking-widest text-transparent">
            <span
              role="img"
              aria-label="Jack-o-lantern"
              className="text-orange-400 drop-shadow-lg"
            >
              🎃
            </span>
            <span className="bg-clip-text bg-gradient-to-r from-orange-400 to-purple-400">
              {t("kiroweenAnalyzerTitle")}
            </span>
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            {t("kiroweenAnalyzerSubtitle")}
          </p>
        </header>

        <main className="w-full">
          {showInputForm && (
            <section
              ref={submissionFormRef}
              aria-labelledby="project-form-heading"
            >
              <h2 id="project-form-heading" className="sr-only">
                {t("projectSubmissionForm")}
              </h2>
              <ProjectSubmissionForm
                submission={submission}
                onSubmissionChange={setSubmission}
                onAnalyze={handleAnalyze}
                isLoading={busy}
              />
            </section>
          )}
          {error && (
            <section aria-labelledby="error-heading" role="alert">
              <h2 id="error-heading" className="sr-only">
                {t("errorOccurred")}
              </h2>
              <SpookyErrorMessage message={error} />
            </section>
          )}
          {busy && (
            <section
              aria-labelledby="loading-heading"
              aria-live="polite"
              aria-busy="true"
            >
              <h2 id="loading-heading" className="sr-only">
                {t("loading")}
              </h2>
              <SpookyLoader message={busyMessage} />
            </section>
          )}
          {analysisToDisplay && !busy && (
            <section
              className={showInputForm ? "mt-8" : ""}
              aria-labelledby="analysis-results-heading"
            >
              <h2 id="analysis-results-heading" className="sr-only">
                {t("analysisResults")}
              </h2>
              <HackathonAnalysisDisplay
                analysis={analysisToDisplay}
                onSave={handleSaveReport}
                isSaved={isReportSaved}
                savedAnalysisId={savedRecordId || undefined}
                savedAudioBase64={generatedAudio}
                onAudioGenerated={handleAudioGenerated}
                onGoToDashboard={handleBack}
                onRefineSuggestion={
                  showInputForm ? handleRefineSuggestion : undefined
                }
                addedSuggestions={addedSuggestions}
              />
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default KiroweenAnalyzerView;
