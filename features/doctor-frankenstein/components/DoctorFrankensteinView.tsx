"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { useAuth } from "@/features/auth/context/AuthContext";
import LanguageToggle from "@/features/locale/components/LanguageToggle";
import { FrankensteinSlotMachine } from "./FrankensteinSlotMachine";
import { FrankensteinDiagram } from "./FrankensteinDiagram";
import FrankensteinExportControl from "./FrankensteinExportControl";
import {
  selectRandom,
  type TechCompany,
  type AWSService,
} from "../utils/dataParser";
import { type FrankensteinIdeaResult } from "../api/generateFrankensteinIdea";
import {
  saveFrankensteinIdea,
  loadFrankensteinIdeaLegacy,
} from "../api/saveFrankensteinIdea";
import type { SavedFrankensteinIdea, TechItem, UserTier } from "@/lib/types";
import { isEnabled } from "@/lib/featureFlags";
import { CreditCounter } from "@/features/shared/components/CreditCounter";
import { getCreditBalance } from "@/features/shared/api";
import {
  trackFrankensteinInteraction,
  trackReportGeneration,
} from "@/features/analytics/tracking";
import LoadingOverlay from "@/features/shared/components/LoadingOverlay";

interface DoctorFrankensteinViewProps {
  initialCredits: number;
  userTier: UserTier;
}

export const DoctorFrankensteinView: React.FC<DoctorFrankensteinViewProps> = ({
  initialCredits,
  userTier,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const savedId = searchParams.get("savedId");

  const { locale, t } = useLocale();
  const { session } = useAuth();
  const isLoggedIn = !!session;
  const shareLinksEnabled = isEnabled("ENABLE_SHARE_LINKS");
  const classicAnalyzerEnabled = isEnabled("ENABLE_CLASSIC_ANALYZER");
  const kiroweenAnalyzerEnabled = isEnabled("ENABLE_KIROWEEN_ANALYZER");

  // Credit system state
  const [credits, setCredits] = useState<number>(initialCredits);
  const [currentTier, setCurrentTier] = useState<UserTier>(userTier);
  const refreshCredits = useCallback(async () => {
    try {
      const balance = await getCreditBalance();
      setCredits(balance.credits);
      setCurrentTier(balance.tier);
    } catch (error) {
      console.error("Failed to refresh credit balance", error);
    }
  }, []);

  useEffect(() => {
    void refreshCredits();
  }, [refreshCredits]);

  const [mode, setMode] = useState<"companies" | "aws">("companies");
  const [techCompanies, setTechCompanies] = useState<TechCompany[]>([]);
  const [awsServices, setAWSServices] = useState<AWSService[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save/Share state
  const [savedIdeaRecord, setSavedIdeaRecord] =
    useState<SavedFrankensteinIdea | null>(null);
  const [isReportSaved, setIsReportSaved] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Separate state for each mode
  const [companiesState, setCompaniesState] = useState<{
    selectedItems: string[];
    frankensteinIdea: FrankensteinIdeaResult | null;
    slotSelectionLocked: boolean;
    slotCount: 3 | 4;
  }>({
    selectedItems: [],
    frankensteinIdea: null,
    slotSelectionLocked: false,
    slotCount: 4,
  });

  const [awsState, setAWSState] = useState<{
    selectedItems: string[];
    frankensteinIdea: FrankensteinIdeaResult | null;
    slotSelectionLocked: boolean;
    slotCount: 3 | 4;
  }>({
    selectedItems: [],
    frankensteinIdea: null,
    slotSelectionLocked: false,
    slotCount: 4,
  });

  // Get current state based on mode
  const currentState = mode === "companies" ? companiesState : awsState;
  const setCurrentState =
    mode === "companies" ? setCompaniesState : setAWSState;
  const selectedItems = currentState.selectedItems;
  const frankensteinIdea = currentState.frankensteinIdea;
  const slotSelectionLocked = currentState.slotSelectionLocked;
  const slotCount = currentState.slotCount;

  const slotOptions: Array<3 | 4> = [3, 4];

  // Check if current mode has active work (selected items or generated idea)
  const hasActiveWork = selectedItems.length > 0 || frankensteinIdea !== null;

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        console.log("Loading data sources...");
        const response = await fetch("/api/doctor-frankenstein/data");

        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.status}`);
        }

        const data = await response.json();

        console.log(
          `Loaded ${data.techCompanies.length} companies and ${data.awsServices.length} AWS services`
        );

        setTechCompanies(data.techCompanies);
        setAWSServices(data.awsServices);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(
          `Failed to load data sources: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    }

    loadData();
  }, []);

  // Load saved idea if savedId is in URL
  useEffect(() => {
    if (!savedId) {
      setSavedIdeaRecord(null);
      setIsReportSaved(false);
      return;
    }

    // Skip reload if we already have this idea in state (just saved it)
    // This prevents unnecessary database queries after auto-save
    if (savedIdeaRecord?.id === savedId) {
      console.log("Skipping reload - idea already in state:", savedId);
      return;
    }

    // Only fetch if we don't have it in state (e.g., page refresh or shared link)
    const fetchSavedIdea = async () => {
      try {
        console.log("Loading saved Frankenstein idea from database:", savedId);
        const { data, error: loadError } = await loadFrankensteinIdeaLegacy(
          savedId
        );

        if (loadError || !data) {
          console.error("Failed to load saved idea", loadError);
          setSavedIdeaRecord(null);
          setIsReportSaved(false);
          if (loadError !== "Idea not found") {
            setError(
              "Unable to load the saved idea. It may have been removed."
            );
          }
          return;
        }

        // Restore the saved idea
        setSavedIdeaRecord(data);
        setMode(data.mode);
        setIsReportSaved(true);

        // Use the complete analysis if available, otherwise create simplified version
        const restoredIdea: FrankensteinIdeaResult = data.analysis
          .fullAnalysis || {
          idea_title: data.analysis.ideaName,
          idea_description: data.analysis.description,
          core_concept: data.analysis.description,
          problem_statement: "",
          proposed_solution: "",
          unique_value_proposition: data.analysis.uniqueValueProposition,
          target_audience: data.analysis.targetMarket,
          business_model: "",
          growth_strategy: "",
          tech_stack_suggestion: "",
          risks_and_challenges: "",
          summary: "",
          language: data.analysis.language,
        };

        // Use all selected technologies if available, otherwise fallback to tech1 and tech2
        const selectedTechNames = data.analysis.allSelectedTechnologies
          ? data.analysis.allSelectedTechnologies.map((tech: any) => tech.name)
          : [data.tech1.name, data.tech2.name];

        // Determine slot count from number of selected technologies
        const restoredSlotCount = (selectedTechNames.length === 3 ? 3 : 4) as
          | 3
          | 4;

        if (data.mode === "companies") {
          setCompaniesState({
            selectedItems: selectedTechNames,
            frankensteinIdea: restoredIdea,
            slotSelectionLocked: true,
            slotCount: restoredSlotCount,
          });
        } else {
          setAWSState({
            selectedItems: selectedTechNames,
            frankensteinIdea: restoredIdea,
            slotSelectionLocked: true,
            slotCount: restoredSlotCount,
          });
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching saved idea:", err);
        setError("Failed to load saved idea");
      }
    };

    void fetchSavedIdea();
  }, [savedId, savedIdeaRecord?.id]);

  // Reset saved state when mode changes (but not when loading a saved idea)
  useEffect(() => {
    if (!savedId) {
      setIsReportSaved(false);
      setSavedIdeaRecord(null);
    }
  }, [mode, savedId]);

  const currentItems = mode === "companies" ? techCompanies : awsServices;
  const currentItemNames = currentItems.map((item) => item.name);

  // Retry save handler
  const handleRetrySave = useCallback(async () => {
    if (!frankensteinIdea || selectedItems.length < 2 || !isLoggedIn) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const tech1Item = currentItems.find((i) => i.name === selectedItems[0]);
      const tech2Item = currentItems.find((i) => i.name === selectedItems[1]);

      if (!tech1Item || !tech2Item) {
        throw new Error("Technology items not found");
      }

      const tech1: TechItem = {
        name: tech1Item.name,
        description:
          tech1Item.description || `${tech1Item.category} technology`,
        category: tech1Item.category,
      };

      const tech2: TechItem = {
        name: tech2Item.name,
        description:
          tech2Item.description || `${tech2Item.category} technology`,
        category: tech2Item.category,
      };

      const allSelectedTechs = selectedItems.map((name) => {
        const item = currentItems.find((i) => i.name === name);
        return {
          name,
          description:
            item?.description || `${item?.category || ""} technology`,
          category: item?.category || "",
        };
      });

      const { data, error: saveError } = await saveFrankensteinIdea({
        mode,
        tech1,
        tech2,
        analysis: {
          ideaName: frankensteinIdea.idea_title,
          description: frankensteinIdea.idea_description,
          keyFeatures: [],
          targetMarket: frankensteinIdea.target_audience,
          uniqueValueProposition: frankensteinIdea.unique_value_proposition,
          language: (frankensteinIdea.language || locale) as "en" | "es",
          fullAnalysis: frankensteinIdea,
          allSelectedTechnologies: allSelectedTechs,
        },
      });

      if (saveError || !data) {
        setSaveError(
          saveError || "Failed to save your idea. Please try again."
        );
        return;
      }

      // Create a saved record object for state management
      const savedRecord = {
        id: data.ideaId,
        userId: session?.user?.id || "",
        mode,
        tech1,
        tech2,
        analysis: {
          ideaName: frankensteinIdea.idea_title,
          description: frankensteinIdea.idea_description,
          keyFeatures: [],
          targetMarket: frankensteinIdea.target_audience,
          uniqueValueProposition: frankensteinIdea.unique_value_proposition,
          language: (frankensteinIdea.language || locale) as "en" | "es",
          fullAnalysis: frankensteinIdea,
          allSelectedTechnologies: allSelectedTechs,
        },
        createdAt: data.createdAt,
      };

      setSavedIdeaRecord(savedRecord);
      setIsReportSaved(true);
      setSaveError(null);
      router.replace(
        `/doctor-frankenstein?savedId=${encodeURIComponent(data.ideaId)}`
      );
    } catch (err) {
      console.error("Retry save error:", err);
      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to save idea. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    frankensteinIdea,
    selectedItems,
    isLoggedIn,
    currentItems,
    mode,
    locale,
    router,
  ]);

  // Save report handler
  const handleSaveReport = useCallback(async (): Promise<string | null> => {
    if (!frankensteinIdea || selectedItems.length < 2) return null;

    // Check authentication
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent("/doctor-frankenstein")}`);
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Get tech items
      const tech1Item = currentItems.find((i) => i.name === selectedItems[0]);
      const tech2Item = currentItems.find((i) => i.name === selectedItems[1]);

      if (!tech1Item || !tech2Item) {
        throw new Error("Technology items not found");
      }

      const tech1: TechItem = {
        name: tech1Item.name,
        description:
          tech1Item.description || `${tech1Item.category} technology`,
        category: tech1Item.category,
      };

      const tech2: TechItem = {
        name: tech2Item.name,
        description:
          tech2Item.description || `${tech2Item.category} technology`,
        category: tech2Item.category,
      };

      // Store all selected technologies
      const allSelectedTechs = selectedItems.map((name) => {
        const item = currentItems.find((i) => i.name === name);
        return {
          name,
          description:
            item?.description || `${item?.category || ""} technology`,
          category: item?.category || "",
        };
      });

      const { data, error: saveError } = await saveFrankensteinIdea({
        mode,
        tech1,
        tech2,
        analysis: {
          ideaName: frankensteinIdea.idea_title,
          description: frankensteinIdea.idea_description,
          keyFeatures: [], // TODO: Extract from frankensteinIdea if available
          targetMarket: frankensteinIdea.target_audience,
          uniqueValueProposition: frankensteinIdea.unique_value_proposition,
          language: (frankensteinIdea.language || locale) as "en" | "es",
          // Store the complete analysis and all technologies
          fullAnalysis: frankensteinIdea,
          allSelectedTechnologies: allSelectedTechs,
        },
      });

      if (saveError || !data) {
        setError(saveError || "Failed to save your idea. Please try again.");
        return null;
      }

      // Create a saved record object for state management
      const savedRecord = {
        id: data.ideaId,
        userId: session?.user?.id || "",
        mode,
        tech1,
        tech2,
        analysis: {
          ideaName: frankensteinIdea.idea_title,
          description: frankensteinIdea.idea_description,
          keyFeatures: [],
          targetMarket: frankensteinIdea.target_audience,
          uniqueValueProposition: frankensteinIdea.unique_value_proposition,
          language: (frankensteinIdea.language || locale) as "en" | "es",
          fullAnalysis: frankensteinIdea,
          allSelectedTechnologies: allSelectedTechs,
        },
        createdAt: data.createdAt,
      };

      setSavedIdeaRecord(savedRecord);
      setIsReportSaved(true);
      router.replace(
        `/doctor-frankenstein?savedId=${encodeURIComponent(data.ideaId)}`
      );
      return data.ideaId;
    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save idea");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [
    frankensteinIdea,
    selectedItems,
    isLoggedIn,
    mode,
    currentItems,
    locale,
    router,
  ]);

  // Share handler
  const handleShare = useCallback(async () => {
    if (!shareLinksEnabled || !savedIdeaRecord) return;

    const url = `${window.location.origin}/doctor-frankenstein?savedId=${savedIdeaRecord.id}`;

    try {
      await navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy link", error);
      setError("Failed to copy link to clipboard");
    }
  }, [savedIdeaRecord, shareLinksEnabled]);

  // Go to dashboard handler
  const handleGoToDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleCreateFrankenstein = () => {
    if (currentItems.length === 0 || isSpinning) return;

    setIsSpinning(true);

    // Track slot machine roll event
    trackFrankensteinInteraction({
      action: "roll",
      mode: mode === "companies" ? "tech_companies" : "aws",
      slotCount: currentState.slotCount,
    });

    // Reset the current mode's state and lock slots (keep slotCount)
    setCurrentState({
      selectedItems: [],
      frankensteinIdea: null,
      slotSelectionLocked: true,
      slotCount: currentState.slotCount,
    });
    setError(null);

    // Reset saved state when generating a new idea
    setIsReportSaved(false);
    setSavedIdeaRecord(null);

    // Remove savedId from URL if present
    if (savedId) {
      router.replace("/doctor-frankenstein");
    }

    // Simulate slot machine animation
    setTimeout(() => {
      const selected = selectRandom(currentItems, slotCount);
      setCurrentState({
        selectedItems: selected.map((item) => item.name),
        frankensteinIdea: null,
        slotSelectionLocked: true,
        slotCount: currentState.slotCount,
      });
      setIsSpinning(false);
    }, 3000);
  };

  const handleAcceptCombination = async () => {
    if (selectedItems.length === 0) return;

    setIsGenerating(true);
    setError(null);
    setSaveError(null);

    try {
      const elements = selectedItems.map((name) => {
        const item = currentItems.find((i) => i.name === name);
        return {
          name,
          description:
            "description" in item!
              ? (item as TechCompany).description
              : undefined,
        };
      });

      const response = await fetch("/api/doctor-frankenstein/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elements,
          mode,
          language: locale,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate idea");
      }

      const result = await response.json();
      setCurrentState({
        selectedItems: selectedItems,
        frankensteinIdea: result,
        slotSelectionLocked: true,
        slotCount: currentState.slotCount,
      });

      // Track successful Frankenstein idea generation
      trackReportGeneration({
        reportType: "frankenstein",
        ideaLength: result.idea_description?.length,
        userId: session?.user?.id,
      });

      await refreshCredits();

      // Auto-save if user is logged in (to preserve credits)
      if (isLoggedIn) {
        // Set saving state to prevent duplicate saves
        setIsSaving(true);

        try {
          const tech1Item = currentItems.find(
            (i) => i.name === selectedItems[0]
          );
          const tech2Item = currentItems.find(
            (i) => i.name === selectedItems[1]
          );

          if (tech1Item && tech2Item) {
            const tech1: TechItem = {
              name: tech1Item.name,
              description:
                tech1Item.description || `${tech1Item.category} technology`,
              category: tech1Item.category,
            };

            const tech2: TechItem = {
              name: tech2Item.name,
              description:
                tech2Item.description || `${tech2Item.category} technology`,
              category: tech2Item.category,
            };

            const allSelectedTechs = selectedItems.map((name) => {
              const item = currentItems.find((i) => i.name === name);
              return {
                name,
                description:
                  item?.description || `${item?.category || ""} technology`,
                category: item?.category || "",
              };
            });

            const { data, error: saveError } = await saveFrankensteinIdea({
              mode,
              tech1,
              tech2,
              analysis: {
                ideaName: result.idea_title,
                description: result.idea_description,
                keyFeatures: [],
                targetMarket: result.target_audience,
                uniqueValueProposition: result.unique_value_proposition,
                language: (result.language || locale) as "en" | "es",
                fullAnalysis: result,
                allSelectedTechnologies: allSelectedTechs,
              },
            });

            if (!saveError && data) {
              // Create a saved record object for state management
              const savedRecord = {
                id: data.ideaId,
                userId: session?.user?.id || "",
                mode,
                tech1,
                tech2,
                analysis: {
                  ideaName: result.idea_title,
                  description: result.idea_description,
                  keyFeatures: [],
                  targetMarket: result.target_audience,
                  uniqueValueProposition: result.unique_value_proposition,
                  language: (result.language || locale) as "en" | "es",
                  fullAnalysis: result,
                  allSelectedTechnologies: allSelectedTechs,
                },
                createdAt: data.createdAt,
              };

              setSavedIdeaRecord(savedRecord);
              setIsReportSaved(true);
              router.replace(
                `/doctor-frankenstein?savedId=${encodeURIComponent(
                  data.ideaId
                )}`
              );
              setSaveError(null);
            } else {
              console.error("Auto-save failed:", saveError);
              setSaveError(
                saveError ||
                  "Failed to save your Frankenstein. Your credits were consumed but the idea was not saved."
              );
            }
          }
        } catch (err) {
          console.error("Auto-save error:", err);
          setSaveError(
            err instanceof Error
              ? err.message
              : "Failed to save your Frankenstein. Your credits were consumed but the idea was not saved."
          );
        } finally {
          setIsSaving(false);
        }
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate idea");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReject = () => {
    // Only reset the current mode's state and unlock slots (keep slotCount)
    setCurrentState({
      selectedItems: [],
      frankensteinIdea: null,
      slotSelectionLocked: false,
      slotCount: currentState.slotCount,
    });

    // Reset saved state
    setIsReportSaved(false);
    setSavedIdeaRecord(null);

    // Remove savedId from URL if present
    if (savedId) {
      router.replace("/doctor-frankenstein");
    }
  };

  const handleGenerateNewIdea = useCallback(() => {
    // Only reset the current mode's state and unlock slots (keep slotCount)
    setCurrentState((prev) => ({
      selectedItems: [],
      frankensteinIdea: null,
      slotSelectionLocked: false,
      slotCount: prev.slotCount,
    }));

    setIsSpinning(false);
    setIsReportSaved(false);
    setSavedIdeaRecord(null);
    setShareSuccess(false);
    setError(null);
    setSaveError(null);

    if (savedId) {
      router.replace("/doctor-frankenstein");
    }
  }, [router, savedId, setCurrentState]);

  if (frankensteinIdea) {
    // Check if the report language matches current UI language
    const reportLanguage = frankensteinIdea.language || "en";
    const currentLanguage = locale;
    const languageMismatch = reportLanguage !== currentLanguage;

    const handleRegenerateInCurrentLanguage = async () => {
      setIsGenerating(true);
      setError(null);

      try {
        const elements = selectedItems.map((name) => {
          const item = currentItems.find((i) => i.name === name);
          return {
            name,
            description:
              "description" in item!
                ? (item as TechCompany).description
                : undefined,
          };
        });

        const response = await fetch("/api/doctor-frankenstein/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            elements,
            mode,
            language: currentLanguage,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate idea");
        }

        const result = await response.json();
        setCurrentState({
          selectedItems: selectedItems,
          frankensteinIdea: result,
          slotSelectionLocked: true,
          slotCount: currentState.slotCount,
        });
        await refreshCredits();
      } catch (err) {
        console.error("Generation error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to generate idea"
        );
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              ← {t("back") || "Back"}
            </button>
            <LanguageToggle />
          </div>

          {isLoggedIn && (
            <div className="mb-6 max-w-xs ml-auto">
              <CreditCounter
                credits={credits}
                tier={currentTier}
                userEmail={session?.user?.email}
              />
            </div>
          )}

          {/* Save error warning */}
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

          {/* Language mismatch warning */}
          {languageMismatch && (
            <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-500 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-yellow-200 font-semibold mb-1">
                    {currentLanguage === "es"
                      ? "⚠️ Este reporte está en inglés"
                      : "⚠️ This report is in Spanish"}
                  </p>
                  <p className="text-yellow-300 text-sm">
                    {currentLanguage === "es"
                      ? "El contenido fue generado en otro idioma. ¿Quieres regenerarlo en español?"
                      : "The content was generated in another language. Do you want to regenerate it in English?"}
                  </p>
                </div>
                <button
                  onClick={handleRegenerateInCurrentLanguage}
                  disabled={isGenerating}
                  className="ml-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-all whitespace-nowrap"
                >
                  {isGenerating
                    ? currentLanguage === "es"
                      ? "Regenerando..."
                      : "Regenerating..."
                    : currentLanguage === "es"
                    ? "🔄 Regenerar"
                    : "🔄 Regenerate"}
                </button>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-purple-900/50 to-black/50 rounded-lg border-2 border-orange-500 p-8 space-y-6">
            <h1 className="text-4xl font-bold text-orange-500 text-center mb-4">
              {frankensteinIdea.idea_title}
            </h1>

            {/* Frankenstein Diagram showing the combination */}
            <FrankensteinDiagram
              elements={selectedItems.map((name) => {
                const item = currentItems.find((i) => i.name === name);
                // If no description, use category as fallback
                let description = item?.description;
                if (!description && item) {
                  const categoryName = item.category || "";
                  if (categoryName) {
                    description =
                      mode === "aws"
                        ? `${categoryName} service`
                        : `${categoryName} technology`;
                  }
                }
                return {
                  name,
                  description,
                };
              })}
              ideaTitle={frankensteinIdea.idea_title}
            />

            <div className="space-y-4 text-purple-100">
              <Section title={t("ideaDescription") || "Idea Description"}>
                {frankensteinIdea.idea_description}
              </Section>

              <Section title={t("summary") || "Summary"}>
                {frankensteinIdea.summary}
              </Section>
            </div>

            {/* Validation Buttons */}
            <div className="mt-8 p-6 bg-purple-900/30 border border-purple-600 rounded-lg">
              <h3 className="text-xl font-bold text-orange-400 mb-4 text-center">
                {locale === "es"
                  ? "🎯 Validar esta Idea"
                  : "🎯 Validate This Idea"}
              </h3>
              <p className="text-purple-200 text-sm text-center mb-6">
                {locale === "es"
                  ? "Obtén una puntuación detallada analizando esta idea con nuestros validadores especializados"
                  : "Get a detailed score by analyzing this idea with our specialized validators"}
              </p>
              {!isLoggedIn && (
                <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                  <p className="text-yellow-200 text-sm text-center">
                    {locale === "es"
                      ? "💡 Inicia sesión para guardar automáticamente tu Frankenstein antes de validar"
                      : "💡 Log in to automatically save your Frankenstein before validating"}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={async () => {
                    try {
                      let ideaIdToUse = savedIdeaRecord?.id;

                      // Save first if not already saved and user is logged in
                      // Check isSaving to prevent duplicate saves
                      if (!isReportSaved && isLoggedIn && !isSaving) {
                        const savedId = await handleSaveReport();
                        if (savedId) {
                          ideaIdToUse = savedId;
                        }
                      }

                      // Navigate to Kiroween Hackathon analyzer with the idea
                      const ideaText = `${frankensteinIdea.idea_title}\n\n${frankensteinIdea.idea_description}`;
                      const ideaIdParam = ideaIdToUse
                        ? `&ideaId=${encodeURIComponent(ideaIdToUse)}`
                        : "";
                      console.log(
                        "Navigating to Kiroween with ideaId:",
                        ideaIdToUse
                      );
                      router.push(
                        `/kiroween-analyzer?idea=${encodeURIComponent(
                          ideaText
                        )}&source=frankenstein&mode=${mode}${ideaIdParam}`
                      );
                    } catch (err) {
                      console.error("Error saving before validation:", err);
                      // Still navigate even if save fails
                      const ideaText = `${frankensteinIdea.idea_title}\n\n${frankensteinIdea.idea_description}`;
                      const ideaIdParam = savedIdeaRecord?.id
                        ? `&ideaId=${encodeURIComponent(savedIdeaRecord.id)}`
                        : "";
                      router.push(
                        `/kiroween-analyzer?idea=${encodeURIComponent(
                          ideaText
                        )}&source=frankenstein&mode=${mode}${ideaIdParam}`
                      );
                    }
                  }}
                  disabled={isSaving || !kiroweenAnalyzerEnabled}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:scale-100 shadow-lg"
                  title={
                    !kiroweenAnalyzerEnabled
                      ? locale === "es"
                        ? "Validador deshabilitado"
                        : "Validator disabled"
                      : ""
                  }
                >
                  <span>🎃</span>
                  <span>
                    {isSaving
                      ? locale === "es"
                        ? "Guardando..."
                        : "Saving..."
                      : locale === "es"
                      ? "Validar con Kiroween Hackathon"
                      : "Validate with Kiroween Hackathon"}
                  </span>
                </button>
                <button
                  onClick={async () => {
                    try {
                      let ideaIdToUse = savedIdeaRecord?.id;

                      // Save first if not already saved and user is logged in
                      // Check isSaving to prevent duplicate saves
                      if (!isReportSaved && isLoggedIn && !isSaving) {
                        const savedId = await handleSaveReport();
                        if (savedId) {
                          ideaIdToUse = savedId;
                        }
                      }

                      // Navigate to Analyzer with the idea
                      const ideaText = `${frankensteinIdea.idea_title}\n\n${frankensteinIdea.idea_description}`;
                      const ideaIdParam = ideaIdToUse
                        ? `&ideaId=${encodeURIComponent(ideaIdToUse)}`
                        : "";
                      console.log(
                        "Navigating to Analyzer with ideaId:",
                        ideaIdToUse
                      );
                      router.push(
                        `/analyzer?idea=${encodeURIComponent(
                          ideaText
                        )}&source=frankenstein&mode=${mode}${ideaIdParam}`
                      );
                    } catch (err) {
                      console.error("Error saving before validation:", err);
                      // Still navigate even if save fails
                      const ideaText = `${frankensteinIdea.idea_title}\n\n${frankensteinIdea.idea_description}`;
                      const ideaIdParam = savedIdeaRecord?.id
                        ? `&ideaId=${encodeURIComponent(savedIdeaRecord.id)}`
                        : "";
                      router.push(
                        `/analyzer?idea=${encodeURIComponent(
                          ideaText
                        )}&source=frankenstein&mode=${mode}${ideaIdParam}`
                      );
                    }
                  }}
                  disabled={isSaving || !classicAnalyzerEnabled}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:scale-100 shadow-lg"
                  title={
                    !classicAnalyzerEnabled
                      ? locale === "es"
                        ? "Validador deshabilitado"
                        : "Validator disabled"
                      : ""
                  }
                >
                  <span>🔬</span>
                  <span>
                    {isSaving
                      ? locale === "es"
                        ? "Guardando..."
                        : "Saving..."
                      : locale === "es"
                      ? "Validar con Analyzer"
                      : "Validate with Analyzer"}
                  </span>
                </button>
              </div>
            </div>

            {/* Action Buttons: Save, Share & Export */}
            <div className="mt-8 flex flex-col sm:flex-row justify-end items-center gap-4">
              <button
                onClick={handleGenerateNewIdea}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium uppercase tracking-wider text-orange-300 bg-black/50 border border-orange-500 rounded hover:bg-orange-500/20 hover:text-orange-100 hover:border-orange-300 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a1 1 0 011-1h4a1 1 0 110 2H6.414l1.293 1.293a1 1 0 01-1.414 1.414L3.293 4.707A1 1 0 013 4V3a1 1 0 011-1zm12 12a1 1 0 01-1 1h-4a1 1 0 110-2h2.586l-1.293-1.293a1 1 0 011.414-1.414l2.999 2.999a1 1 0 01.001 1.414L17 17v-1zM4 12a1 1 0 011-1h11a1 1 0 110 2H5a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t("generateNewIdea") || "Generate New Idea"}</span>
              </button>

              {/* Export Control - Always visible */}
              {selectedItems.length >= 2 && (
                <FrankensteinExportControl
                  mode={mode}
                  tech1={{
                    name: selectedItems[0],
                    description:
                      currentItems.find((i) => i.name === selectedItems[0])
                        ?.description || "",
                    category:
                      currentItems.find((i) => i.name === selectedItems[0])
                        ?.category || "",
                  }}
                  tech2={{
                    name: selectedItems[1],
                    description:
                      currentItems.find((i) => i.name === selectedItems[1])
                        ?.description || "",
                    category:
                      currentItems.find((i) => i.name === selectedItems[1])
                        ?.category || "",
                  }}
                  analysis={{
                    ideaName: frankensteinIdea.idea_title,
                    description: frankensteinIdea.idea_description,
                    keyFeatures: [],
                    targetMarket: frankensteinIdea.target_audience,
                    uniqueValueProposition:
                      frankensteinIdea.unique_value_proposition,
                    language: (frankensteinIdea.language || locale) as
                      | "en"
                      | "es",
                  }}
                  fullAnalysis={frankensteinIdea}
                  allTechnologies={selectedItems.map((name) => {
                    const item = currentItems.find((i) => i.name === name);
                    return {
                      name,
                      description:
                        item?.description ||
                        `${item?.category || ""} technology`,
                      category: item?.category || "",
                    };
                  })}
                />
              )}

              {isLoggedIn && isReportSaved && (
                <>
                  {shareLinksEnabled && savedIdeaRecord && (
                    <button
                      onClick={handleShare}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium uppercase tracking-wider border rounded transition-colors ${
                        shareSuccess
                          ? "text-green-400 bg-green-900/20 border-green-700"
                          : "text-slate-300 bg-black/50 border-purple-600 hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-400"
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
                      <span>
                        {shareSuccess
                          ? t("linkCopied") || "Link Copied!"
                          : t("share") || "Share"}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={handleGoToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium uppercase tracking-wider text-slate-300 bg-black/50 border border-purple-600 rounded hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-400 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    <span>{t("goToDashboardButton") || "Go to Dashboard"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-orange-400 transition-colors duration-200 w-fit"
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
            <span className="uppercase tracking-wider text-sm">
              {t("goToDashboardButton")}
            </span>
          </button>
          <h1 className="text-4xl font-bold text-orange-500 text-center flex-1">
            🧟 Doctor Frankenstein Kiroween 🧟
          </h1>
          <div className="flex justify-end">
            <LanguageToggle />
          </div>
        </div>

        {/* Credit Counter */}
        {isLoggedIn && (
          <div className="mb-8 max-w-2xl mx-auto">
            <CreditCounter
              credits={credits}
              tier={currentTier}
              userEmail={session?.user?.email}
            />
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-purple-900/50 rounded-lg p-1 flex gap-2">
            <button
              onClick={() => {
                setMode("companies");
                // Track mode selection
                trackFrankensteinInteraction({
                  action: "mode_select",
                  mode: "tech_companies",
                });
              }}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                mode === "companies"
                  ? "bg-orange-500 text-black"
                  : "bg-transparent text-purple-300 hover:text-white"
              }`}
            >
              🏢 {t("techCompanies") || "Tech Companies"}
            </button>
            <button
              onClick={() => {
                setMode("aws");
                // Track mode selection
                trackFrankensteinInteraction({
                  action: "mode_select",
                  mode: "aws",
                });
              }}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                mode === "aws"
                  ? "bg-orange-500 text-black"
                  : "bg-transparent text-purple-300 hover:text-white"
              }`}
            >
              ☁️ {t("awsServices") || "AWS Services"}
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="text-center mb-8 text-purple-200">
          <p className="text-lg">
            {t("frankensteinDescription") ||
              "Combine random technologies to create innovative startup ideas!"}
          </p>
          <p className="text-sm mt-2 text-purple-400">
            {mode === "companies"
              ? `${techCompanies.length} ${
                  t("companiesAvailable") || "companies available"
                }`
              : `${awsServices.length} ${
                  t("awsServicesAvailable") || "AWS services available"
                }`}
          </p>
          {currentItems.length === 0 && !error && (
            <p className="text-sm mt-2 text-yellow-400">
              Loading data sources...
            </p>
          )}
          {!hasActiveWork && (
            <p className="text-xs mt-2 text-purple-500 italic">
              {mode === "companies"
                ? t("readyToCombineCompanies") ||
                  "Ready to combine tech companies into a new idea"
                : t("readyToCombineAWS") ||
                  "Ready to combine AWS services into a new idea"}
            </p>
          )}
          {hasActiveWork && (
            <p className="text-xs mt-2 text-green-400 italic">
              {mode === "companies"
                ? "✓ Tech Companies combination in progress"
                : "✓ AWS Services combination in progress"}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Slot configuration */}
        <div className="mb-8 flex justify-center">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center bg-purple-900/40 border border-purple-700 rounded-lg px-6 py-4 text-purple-200">
            <span className="text-xs uppercase tracking-[0.3em] text-purple-400">
              {t("slotCountLabel") || "Slots per spin"}
            </span>
            <div className="flex gap-2">
              {slotOptions.map((option) => {
                const isActive = slotCount === option;
                const isDisabled = slotSelectionLocked || isSpinning;
                return (
                  <button
                    key={option}
                    onClick={() => {
                      if (isDisabled) return;
                      setCurrentState({
                        ...currentState,
                        slotCount: option,
                      });
                      // Track slot count configuration
                      trackFrankensteinInteraction({
                        action: "slot_config",
                        slotCount: option,
                      });
                    }}
                    disabled={isDisabled}
                    aria-disabled={isDisabled}
                    className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider border rounded-md transition-colors ${
                      isActive
                        ? "bg-orange-500 text-black border-orange-300 shadow-lg"
                        : "bg-black/40 text-purple-200 border-purple-700 hover:border-orange-400 hover:text-orange-200"
                    } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    aria-pressed={isActive}
                    aria-label={
                      t("slotCountOption", { count: option }) ||
                      `${option} Slots`
                    }
                  >
                    {t("slotCountOption", { count: option }) ||
                      `${option} Slots`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Slot Machine */}
        <div className="mb-8">
          <FrankensteinSlotMachine
            allItems={currentItemNames}
            selectedItems={selectedItems}
            isSpinning={isSpinning}
            slotCount={slotCount}
            itemsWithDetails={currentItems.map((item) => ({
              name: item.name,
              description: item.description,
              category: item.category,
            }))}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {selectedItems.length === 0 ? (
            <button
              onClick={handleCreateFrankenstein}
              disabled={isSpinning || currentItems.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold text-xl rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
            >
              ⚡ {t("createFrankenstein") || "Create Frankenstein"} ⚡
            </button>
          ) : (
            <>
              <button
                onClick={handleReject}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all"
              >
                ❌ {t("reject") || "Reject"}
              </button>
              <button
                onClick={handleAcceptCombination}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all transform hover:scale-105"
              >
                ✅ {t("acceptAndGenerate") || "Accept & Generate Idea"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <LoadingOverlay
          message={
            t("generatingFrankensteinIdea") ||
            "Bringing your Frankenstein to life..."
          }
        />
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  // Helper to safely render content (handle objects, arrays, etc.)
  const renderContent = (content: React.ReactNode): React.ReactNode => {
    if (typeof content === "string") {
      return content;
    }
    if (
      typeof content === "object" &&
      content !== null &&
      !Array.isArray(content)
    ) {
      // If it's an object, convert to JSON string for display
      return JSON.stringify(content, null, 2);
    }
    if (Array.isArray(content)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {content.map((item, i) => (
            <li key={i}>
              {typeof item === "string" ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      );
    }
    return content;
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-orange-400 mb-2">{title}</h3>
      <div className="text-purple-100 whitespace-pre-wrap">
        {renderContent(children)}
      </div>
    </div>
  );
};
