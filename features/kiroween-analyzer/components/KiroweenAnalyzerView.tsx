"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  HackathonAnalysis,
  ProjectSubmission,
  SavedHackathonAnalysis,
  UserTier,
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
import SpookyErrorMessage from "./SpookyErrorMessage";
import LanguageToggle from "@/features/locale/components/LanguageToggle";
import { CreditCounter } from "@/features/shared/components/CreditCounter";
import LoadingOverlay from "@/features/shared/components/LoadingOverlay";
import { getCreditBalance } from "@/features/shared/api";
import {
  trackReportGeneration,
  trackIdeaEnhancement,
} from "@/features/analytics/tracking";

interface KiroweenAnalyzerViewProps {
  initialCredits: number;
  userTier: UserTier;
}

const KiroweenAnalyzerView: React.FC<KiroweenAnalyzerViewProps> = ({
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
  const [credits, setCredits] = useState<number>(initialCredits);
  const [currentTier, setCurrentTier] = useState<UserTier>(userTier);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savedRecordId = savedAnalysisRecord?.id ?? null;
  const savedRecordAudio = savedAnalysisRecord?.audioBase64 ?? null;

  const submissionFormRef = useRef<HTMLDivElement>(null);

  const showInputForm =
    !savedAnalysisRecord || mode === "refine" || newAnalysis !== null;

  const refreshCredits = useCallback(async () => {
    try {
      const balance = await getCreditBalance();
      setCredits(balance.credits);
      setCurrentTier(balance.tier);
    } catch (err) {
      console.error("Failed to refresh credit balance", err);
    }
  }, []);

  useEffect(() => {
    void refreshCredits();
  }, [refreshCredits]);

  // Loading messages for spooky theme
  const loadingMessages = [
    t("spookyLoaderMessage1"),
    t("spookyLoaderMessage2"),
    t("spookyLoaderMessage3"),
    t("spookyLoaderMessage4"),
    t("spookyLoaderMessage5"),
    t("spookyLoaderMessage6"),
  ];

  // Pre-fill idea from Doctor Frankenstein if provided
  useEffect(() => {
    if (ideaFromUrl && sourceFromUrl === "frankenstein" && !savedId) {
      // useSearchParams().get() already returns decoded values, no need to decode again
      setSubmission({
        description: ideaFromUrl,
        supportingMaterials: {},
      });
    }
  }, [ideaFromUrl, sourceFromUrl, savedId]);

  useEffect(() => {
    if (!savedId) {
      setSavedAnalysisRecord(null);
      // Don't reset if we have an idea from Frankenstein
      if (!ideaFromUrl || sourceFromUrl !== "frankenstein") {
        setSubmission({
          description: "",
          supportingMaterials: {},
        });
      }
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
  }, [
    mode,
    router,
    savedId,
    session,
    supabase,
    isAuthLoading,
    ideaFromUrl,
    sourceFromUrl,
  ]);

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
    router.push("/dashboard");
  }, [router]);

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
    setSaveError(null);
    setNewAnalysis(null);
    setAddedSuggestions([]);
    setIsReportSaved(false);

    try {
      const analysisResult = await analyzeHackathonProject(submission, locale);
      setNewAnalysis(analysisResult);
      await refreshCredits();

      // Track successful report generation
      trackReportGeneration({
        reportType: "kiroween",
        ideaLength: submission.description.length,
        userId: session?.user?.id,
      });

      let newlySavedId: string | null = null;

      // Auto-save if user is logged in (to preserve credits)
      if (session) {
        try {
          const { data: record, error: saveError } =
            await saveHackathonAnalysis({
              projectDescription: submission.description,
              analysis: analysisResult,
              supportingMaterials: submission.supportingMaterials,
            });

          if (!saveError && record) {
            newlySavedId = record.id;
            setSavedAnalysisRecord(record);
            setIsReportSaved(true);

            // If this came from a Frankenstein, update it with the validation
            if (frankensteinId && sourceFromUrl === "frankenstein") {
              try {
                const { updateFrankensteinValidation } = await import(
                  "@/features/doctor-frankenstein/api/saveFrankensteinIdea"
                );
                const { deriveFivePointScore } = await import(
                  "@/features/dashboard/api/scoreUtils"
                );

                const score = deriveFivePointScore(analysisResult);

                console.log("Auto-updating Frankenstein with validation:", {
                  frankensteinId,
                  analysisId: record.id,
                  score,
                  rawFinalScore: analysisResult.finalScore,
                });

                await updateFrankensteinValidation(frankensteinId, "kiroween", {
                  analysisId: record.id,
                  score,
                });
              } catch (err) {
                console.error(
                  "Failed to update Frankenstein with validation:",
                  err
                );
              }
            }

            // Update URL with saved ID
            router.replace(
              `/kiroween-analyzer?savedId=${encodeURIComponent(
                record.id
              )}&mode=view`
            );
          } else {
            console.error("Auto-save failed:", saveError);
            setSaveError(
              saveError ||
                "Failed to save analysis. Your credits were consumed but the analysis was not saved."
            );
          }
        } catch (err) {
          console.error("Auto-save error:", err);
          setSaveError(
            err instanceof Error
              ? err.message
              : "Failed to save analysis. Your credits were consumed but the analysis was not saved."
          );
        }
      } else if (frankensteinId && sourceFromUrl === "frankenstein") {
        // If not logged in but came from Frankenstein, still update with temp score
        try {
          const { updateFrankensteinValidation } = await import(
            "@/features/doctor-frankenstein/api/saveFrankensteinIdea"
          );
          const { deriveFivePointScore } = await import(
            "@/features/dashboard/api/scoreUtils"
          );

          const score = deriveFivePointScore(analysisResult);

          console.log("Auto-updating Frankenstein with score:", {
            frankensteinId,
            score,
            rawFinalScore: analysisResult.finalScore,
          });

          await updateFrankensteinValidation(frankensteinId, "kiroween", {
            analysisId: "temp-" + Date.now(),
            score,
          });

          setIsReportSaved(true);
        } catch (err) {
          console.error("Failed to update Frankenstein with score:", err);
        }
      }

      // Only clean up URL if we had a savedId but didn't just create a new one
      if (savedId && !newlySavedId) {
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
    submission,
    generatedAudio,
    savedRecordId,
    savedRecordAudio,
    locale,
    refreshCredits,
    session,
    frankensteinId,
    sourceFromUrl,
    savedId,
    router,
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

      // If this came from a Frankenstein, update it with the validation
      if (frankensteinId && sourceFromUrl === "frankenstein") {
        try {
          const { updateFrankensteinValidation } = await import(
            "@/features/doctor-frankenstein/api/saveFrankensteinIdea"
          );
          const { deriveFivePointScore } = await import(
            "@/features/dashboard/api/scoreUtils"
          );

          // Use deriveFivePointScore to get the correct 0-5 score
          const score = deriveFivePointScore(analysisToSave);

          console.log("Updating Frankenstein with validation:", {
            frankensteinId,
            analysisId: data.id,
            score,
            rawFinalScore: analysisToSave.finalScore,
          });

          const result = await updateFrankensteinValidation(
            frankensteinId,
            "kiroween",
            {
              analysisId: data.id,
              score,
            }
          );
          console.log("Frankenstein update result:", result);
        } catch (err) {
          console.error("Failed to update Frankenstein with validation:", err);
          // Don't show error to user, this is a background operation
        }
      } else {
        console.log("Not updating Frankenstein:", {
          frankensteinId,
          sourceFromUrl,
          hasId: !!frankensteinId,
          isFromFrankenstein: sourceFromUrl === "frankenstein",
        });
      }

      router.replace(
        `/kiroween-analyzer?savedId=${encodeURIComponent(data.id)}&mode=view`
      );
    } catch (err) {
      console.error("Error saving analysis:", err);
      setError("Failed to save your analysis. Please try again.");
    }
  }, [
    newAnalysis,
    savedAnalysisRecord?.analysis,
    submission.description,
    submission.supportingMaterials,
    session,
    router,
    generatedAudio,
    frankensteinId,
    sourceFromUrl,
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
      const suggestionContent = `— ${suggestionTitle}: ${suggestionText}`;
      setSubmission((prev) => ({
        ...prev,
        description: `${prev.description.trim()}\n\n${suggestionContent}`,
      }));
      setAddedSuggestions((prev) => {
        const newSuggestions = [...prev, index];

        // Track suggestion addition
        trackIdeaEnhancement({
          action: "add_suggestion",
          analysisType: "kiroween",
          suggestionLength: suggestionContent.length,
        });

        return newSuggestions;
      });
      submissionFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    []
  );

  const handleRetrySave = useCallback(async () => {
    if (!newAnalysis || !session) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const { data: record, error: saveError } = await saveHackathonAnalysis({
        projectDescription: submission.description,
        analysis: newAnalysis,
        supportingMaterials: submission.supportingMaterials,
      });

      if (!saveError && record) {
        setSavedAnalysisRecord(record);
        setIsReportSaved(true);
        setSaveError(null);

        // If this came from a Frankenstein, update it with the validation
        if (frankensteinId && sourceFromUrl === "frankenstein") {
          try {
            const { updateFrankensteinValidation } = await import(
              "@/features/doctor-frankenstein/api/saveFrankensteinIdea"
            );
            const { deriveFivePointScore } = await import(
              "@/features/dashboard/api/scoreUtils"
            );

            const score = deriveFivePointScore(newAnalysis);

            await updateFrankensteinValidation(frankensteinId, "kiroween", {
              analysisId: record.id,
              score,
            });
          } catch (err) {
            console.error(
              "Failed to update Frankenstein with validation:",
              err
            );
          }
        }

        // Update URL with saved ID
        router.replace(
          `/kiroween-analyzer?savedId=${encodeURIComponent(
            record.id
          )}&mode=view`
        );
      } else {
        console.error("Manual save failed:", saveError);
        setSaveError(saveError || "Failed to save analysis. Please try again.");
      }
    } catch (err) {
      console.error("Manual save error:", err);
      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to save analysis. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }, [newAnalysis, session, submission, frankensteinId, sourceFromUrl, router]);

  const handleStartNewAnalysis = useCallback(() => {
    setSubmission({
      description: "",
      supportingMaterials: {},
    });
    setNewAnalysis(null);
    setSavedAnalysisRecord(null);
    setIsReportSaved(false);
    setGeneratedAudio(null);
    setAddedSuggestions([]);
    setError(null);
    setSaveError(null);

    if (savedId) {
      router.replace("/kiroween-analyzer");
    }
  }, [router, savedId]);

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
            aria-label={t("goToDashboardButton")}
            title={t("goToDashboardButton")}
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

          {/* Frankenstein Origin Badge */}
          {sourceFromUrl === "frankenstein" && !savedId && (
            <div className="mt-4 space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-900/50 to-purple-900/50 border border-green-500 rounded-lg">
                <span className="text-2xl">🧟</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-green-400">
                    {locale === "es"
                      ? "Remix de Doctor Frankenstein"
                      : "Remix from Doctor Frankenstein"}
                  </p>
                  <p className="text-xs text-green-300">
                    {frankensteinMode === "aws"
                      ? locale === "es"
                        ? "Combinación de AWS Services"
                        : "AWS Services Combination"
                      : locale === "es"
                      ? "Combinación de Tech Companies"
                      : "Tech Companies Combination"}
                  </p>
                </div>
              </div>
              {isReportSaved && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-600 rounded-lg">
                  <svg
                    className="h-5 w-5 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-sm text-green-300">
                    {locale === "es"
                      ? "✓ Puntuación guardada en tu Frankenstein"
                      : "✓ Score saved to your Frankenstein"}
                  </p>
                </div>
              )}
            </div>
          )}
        </header>

        <main className="w-full">
          {/* Credit Counter */}
          <div className="mb-6">
            <CreditCounter
              credits={credits}
              tier={currentTier}
              userEmail={session?.user?.email}
            />
          </div>

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
          {saveError && (
            <div role="alert" aria-live="assertive" className="mb-6">
              <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-yellow-400 font-semibold mb-1">
                      {t("saveFailedTitle") || "Save Failed"}
                    </h3>
                    <p className="text-yellow-200 text-sm mb-3">{saveError}</p>
                    <button
                      onClick={handleRetrySave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:cursor-not-allowed text-white rounded font-semibold text-sm transition-colors"
                    >
                      {isSaving
                        ? t("saving") || "Saving..."
                        : t("retrySave") || "Retry Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {busy && <LoadingOverlay message={busyMessage} />}
          {analysisToDisplay && !busy && (
            <section
              className={showInputForm ? "mt-8" : ""}
              aria-labelledby="analysis-results-heading"
            >
              <h2 id="analysis-results-heading" className="sr-only">
                {t("analysisResults")}
              </h2>
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleStartNewAnalysis}
                  className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] border border-orange-400 text-orange-300 rounded hover:bg-orange-400/10 transition-colors"
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
              <HackathonAnalysisDisplay
                analysis={analysisToDisplay}
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
