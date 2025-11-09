"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { useAuth } from "@/features/auth/context/AuthContext";
import LanguageToggle from "@/features/locale/components/LanguageToggle";
import { FrankensteinSlotMachine } from "./FrankensteinSlotMachine";
import { FrankensteinDiagram } from "./FrankensteinDiagram";
import FrankensteinExportControl from "./FrankensteinExportControl";
import { parseTechCompanies, parseAWSServices, selectRandom, type TechCompany, type AWSService } from "../utils/dataParser";
import { type FrankensteinIdeaResult } from "../api/generateFrankensteinIdea";
import { saveFrankensteinIdea, loadFrankensteinIdea } from "../api/saveFrankensteinIdea";
import type { SavedFrankensteinIdea, TechItem } from "@/lib/types";
import SpookyLoader from "@/features/kiroween-analyzer/components/SpookyLoader";
import { isEnabled } from "@/lib/featureFlags";

export const DoctorFrankensteinView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const savedId = searchParams.get("savedId");
  
  const { locale, t } = useLocale();
  const { session, isLoading: isAuthLoading } = useAuth();
  const isLoggedIn = !!session;
  const shareLinksEnabled = isEnabled("ENABLE_SHARE_LINKS");
  
  const [mode, setMode] = useState<'companies' | 'aws'>('companies');
  const [techCompanies, setTechCompanies] = useState<TechCompany[]>([]);
  const [awsServices, setAWSServices] = useState<AWSService[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Save/Share state
  const [savedIdeaRecord, setSavedIdeaRecord] = useState<SavedFrankensteinIdea | null>(null);
  const [isReportSaved, setIsReportSaved] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  // Separate state for each mode
  const [companiesState, setCompaniesState] = useState<{
    selectedItems: string[];
    frankensteinIdea: FrankensteinIdeaResult | null;
  }>({
    selectedItems: [],
    frankensteinIdea: null,
  });
  
  const [awsState, setAWSState] = useState<{
    selectedItems: string[];
    frankensteinIdea: FrankensteinIdeaResult | null;
  }>({
    selectedItems: [],
    frankensteinIdea: null,
  });
  // Get current state based on mode
  const currentState = mode === 'companies' ? companiesState : awsState;
  const setCurrentState = mode === 'companies' ? setCompaniesState : setAWSState;
  const selectedItems = currentState.selectedItems;
  const frankensteinIdea = currentState.frankensteinIdea;

  const [slotCount, setSlotCount] = useState<3 | 4>(4);
  const [slotSelectionLocked, setSlotSelectionLocked] = useState(false);
  const slotOptions: Array<3 | 4> = [3, 4];
  const isModeSelectionDisabled = slotSelectionLocked || isSpinning;

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        console.log('Loading data sources...');
        const [companiesRes, awsRes] = await Promise.all([
          fetch('/doctor-frankenstein/well_known_unique_tech_companies_300_400_frankenstein_mashups_catalog.md'),
          fetch('/doctor-frankenstein/aws_services_products_full_list_as_of_nov_5_2025.md')
        ]);

        if (!companiesRes.ok) {
          throw new Error(`Failed to load companies: ${companiesRes.status}`);
        }
        if (!awsRes.ok) {
          throw new Error(`Failed to load AWS services: ${awsRes.status}`);
        }

        const companiesText = await companiesRes.text();
        const awsText = await awsRes.text();

        const parsedCompanies = parseTechCompanies(companiesText);
        const parsedAWS = parseAWSServices(awsText);

        console.log(`Loaded ${parsedCompanies.length} companies and ${parsedAWS.length} AWS services`);

        setTechCompanies(parsedCompanies);
        setAWSServices(parsedAWS);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(`Failed to load data sources: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    loadData();
  }, []);

  // Load saved idea if savedId is in URL
  useEffect(() => {
    if (!savedId) {
      setSavedIdeaRecord(null);
      setIsReportSaved(false);
      setSlotSelectionLocked(false);
      return;
    }

    const fetchSavedIdea = async () => {
      setIsLoadingSaved(true);
      try {
        const { data, error: loadError } = await loadFrankensteinIdea(savedId);

        if (loadError || !data) {
          console.error("Failed to load saved idea", loadError);
          setSavedIdeaRecord(null);
          setIsReportSaved(false);
          if (loadError !== "Idea not found") {
            setError("Unable to load the saved idea. It may have been removed.");
          }
          return;
        }

        // Restore the saved idea
        setSavedIdeaRecord(data);
        setMode(data.mode);
        setIsReportSaved(true);
        setSlotSelectionLocked(true);
        
        // Use the complete analysis if available, otherwise create simplified version
        const restoredIdea: FrankensteinIdeaResult = data.analysis.fullAnalysis || {
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
          metrics: {
            originality_score: 0,
            feasibility_score: 0,
            impact_score: 0,
            scalability_score: 0,
            wow_factor: 0,
          },
          summary: "",
          language: data.analysis.language,
        };

        // Use all selected technologies if available, otherwise fallback to tech1 and tech2
        const selectedTechNames = data.analysis.allSelectedTechnologies 
          ? data.analysis.allSelectedTechnologies.map(tech => tech.name)
          : [data.tech1.name, data.tech2.name];
        
        if (data.mode === 'companies') {
          setCompaniesState({
            selectedItems: selectedTechNames,
            frankensteinIdea: restoredIdea,
          });
        } else {
          setAWSState({
            selectedItems: selectedTechNames,
            frankensteinIdea: restoredIdea,
          });
        }
        
        setError(null);
      } catch (err) {
        console.error("Error fetching saved idea:", err);
        setError("Failed to load saved idea");
      } finally {
        setIsLoadingSaved(false);
      }
    };

    void fetchSavedIdea();
  }, [savedId]);

  // Reset saved state when mode changes (but not when loading a saved idea)
  useEffect(() => {
    if (!savedId) {
      setIsReportSaved(false);
      setSavedIdeaRecord(null);
    }
  }, [mode, savedId]);

  const currentItems = mode === 'companies' ? techCompanies : awsServices;
  const currentItemNames = currentItems.map(item => item.name);

  // Save report handler
  const handleSaveReport = useCallback(async () => {
    if (!frankensteinIdea || selectedItems.length < 2) return;

    // Check authentication
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent("/doctor-frankenstein")}`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Get tech items
      const tech1Item = currentItems.find(i => i.name === selectedItems[0]);
      const tech2Item = currentItems.find(i => i.name === selectedItems[1]);

      if (!tech1Item || !tech2Item) {
        throw new Error("Technology items not found");
      }

      const tech1: TechItem = {
        name: tech1Item.name,
        description: tech1Item.description || `${tech1Item.category} technology`,
        category: tech1Item.category,
      };

      const tech2: TechItem = {
        name: tech2Item.name,
        description: tech2Item.description || `${tech2Item.category} technology`,
        category: tech2Item.category,
      };

      // Store all selected technologies
      const allSelectedTechs = selectedItems.map(name => {
        const item = currentItems.find(i => i.name === name);
        return {
          name,
          description: item?.description || `${item?.category || ''} technology`,
          category: item?.category || '',
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
          language: (frankensteinIdea.language || locale) as 'en' | 'es',
          // Store the complete analysis and all technologies
          fullAnalysis: frankensteinIdea,
          allSelectedTechnologies: allSelectedTechs,
        },
      });

      if (saveError || !data) {
        setError(saveError || "Failed to save your idea. Please try again.");
        return;
      }

      setSavedIdeaRecord(data);
      setIsReportSaved(true);
      router.replace(`/doctor-frankenstein?savedId=${encodeURIComponent(data.id)}`);
    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save idea");
    } finally {
      setIsSaving(false);
    }
  }, [frankensteinIdea, selectedItems, isLoggedIn, mode, currentItems, locale, router]);

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

    setSlotSelectionLocked(true);
    setIsSpinning(true);
    setCurrentState({
      selectedItems: [],
      frankensteinIdea: null,
    });
    setError(null);
    
    // Reset saved state when generating a new idea
    setIsReportSaved(false);
    setSavedIdeaRecord(null);
    
    // Remove savedId from URL if present
    if (savedId) {
      router.replace('/doctor-frankenstein');
    }

    // Simulate slot machine animation
    setTimeout(() => {
      const selected = selectRandom(currentItems, slotCount);
      setCurrentState({
        selectedItems: selected.map(item => item.name),
        frankensteinIdea: null,
      });
      setIsSpinning(false);
    }, 3000);
  };

  const handleAcceptCombination = async () => {
    if (selectedItems.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const elements = selectedItems.map(name => {
        const item = currentItems.find(i => i.name === name);
        return {
          name,
          description: 'description' in item! ? (item as TechCompany).description : undefined
        };
      });

      const response = await fetch('/api/doctor-frankenstein/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elements,
          mode,
          language: locale
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate idea');
      }

      const result = await response.json();
      setCurrentState({
        selectedItems: selectedItems,
        frankensteinIdea: result,
      });
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate idea');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReject = () => {
    setCurrentState({
      selectedItems: [],
      frankensteinIdea: null,
    });
    setSlotSelectionLocked(false);
  };

  const handleGenerateNewIdea = useCallback(() => {
    if (mode === 'companies') {
      setCompaniesState({
        selectedItems: [],
        frankensteinIdea: null,
      });
    } else {
      setAWSState({
        selectedItems: [],
        frankensteinIdea: null,
      });
    }

    setSlotSelectionLocked(false);
    setIsSpinning(false);
    setIsReportSaved(false);
    setSavedIdeaRecord(null);
    setShareSuccess(false);
    setError(null);

    if (savedId) {
      router.replace('/doctor-frankenstein');
    }
  }, [mode, router, savedId]);

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black flex items-center justify-center">
        <SpookyLoader message={t('generatingFrankensteinIdea') || 'Bringing your Frankenstein to life...'} />
      </div>
    );
  }

  if (frankensteinIdea) {
    // Check if the report language matches current UI language
    const reportLanguage = frankensteinIdea.language || 'en';
    const currentLanguage = locale;
    const languageMismatch = reportLanguage !== currentLanguage;

    const handleRegenerateInCurrentLanguage = async () => {
      setIsGenerating(true);
      setError(null);

      try {
        const elements = selectedItems.map(name => {
          const item = currentItems.find(i => i.name === name);
          return {
            name,
            description: 'description' in item! ? (item as TechCompany).description : undefined
          };
        });

        const response = await fetch('/api/doctor-frankenstein/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            elements,
            mode,
            language: currentLanguage
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate idea');
        }

        const result = await response.json();
        setCurrentState({
          selectedItems: selectedItems,
          frankensteinIdea: result,
        });
      } catch (err) {
        console.error('Generation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate idea');
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
              ← {t('back') || 'Back'}
            </button>
            <LanguageToggle />
          </div>

          {/* Language mismatch warning */}
          {languageMismatch && (
            <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-500 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-yellow-200 font-semibold mb-1">
                    {currentLanguage === 'es' 
                      ? '⚠️ Este reporte está en inglés'
                      : '⚠️ This report is in Spanish'}
                  </p>
                  <p className="text-yellow-300 text-sm">
                    {currentLanguage === 'es'
                      ? 'El contenido fue generado en otro idioma. ¿Quieres regenerarlo en español?'
                      : 'The content was generated in another language. Do you want to regenerate it in English?'}
                  </p>
                </div>
                <button
                  onClick={handleRegenerateInCurrentLanguage}
                  disabled={isGenerating}
                  className="ml-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-all whitespace-nowrap"
                >
                  {isGenerating 
                    ? (currentLanguage === 'es' ? 'Regenerando...' : 'Regenerating...')
                    : (currentLanguage === 'es' ? '🔄 Regenerar' : '🔄 Regenerate')}
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
              elements={selectedItems.map(name => {
                const item = currentItems.find(i => i.name === name);
                // If no description, use category as fallback
                let description = item?.description;
                if (!description && item) {
                  const categoryName = item.category || '';
                  if (categoryName) {
                    description = mode === 'aws' 
                      ? `${categoryName} service`
                      : `${categoryName} technology`;
                  }
                }
                return {
                  name,
                  description
                };
              })}
              ideaTitle={frankensteinIdea.idea_title}
            />

            <div className="space-y-4 text-purple-100">
              <Section title={t('ideaDescription') || 'Idea Description'}>
                {frankensteinIdea.idea_description}
              </Section>

              <Section title={t('coreConcept') || 'Core Concept'}>
                {frankensteinIdea.core_concept}
              </Section>

              <Section title={t('problemStatement') || 'Problem Statement'}>
                {frankensteinIdea.problem_statement}
              </Section>

              <Section title={t('proposedSolution') || 'Proposed Solution'}>
                {frankensteinIdea.proposed_solution}
              </Section>

              <Section title={t('uniqueValueProposition') || 'Unique Value Proposition'}>
                {frankensteinIdea.unique_value_proposition}
              </Section>

              <Section title={t('targetAudience') || 'Target Audience'}>
                {frankensteinIdea.target_audience}
              </Section>

              <Section title={t('businessModel') || 'Business Model'}>
                {frankensteinIdea.business_model}
              </Section>

              <Section title={t('growthStrategy') || 'Growth Strategy'}>
                {frankensteinIdea.growth_strategy}
              </Section>

              <Section title={t('techStack') || 'Tech Stack'}>
                {frankensteinIdea.tech_stack_suggestion}
              </Section>

              <Section title={t('risksAndChallenges') || 'Risks & Challenges'}>
                {frankensteinIdea.risks_and_challenges}
              </Section>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 my-8">
                <MetricCard label={t('originality') || 'Originality'} value={frankensteinIdea.metrics.originality_score} />
                <MetricCard label={t('feasibility') || 'Feasibility'} value={frankensteinIdea.metrics.feasibility_score} />
                <MetricCard label={t('impact') || 'Impact'} value={frankensteinIdea.metrics.impact_score} />
                <MetricCard label={t('scalability') || 'Scalability'} value={frankensteinIdea.metrics.scalability_score} />
                <MetricCard label={t('wowFactor') || 'Wow Factor'} value={frankensteinIdea.metrics.wow_factor} />
              </div>

              <Section title={t('summary') || 'Summary'}>
                {frankensteinIdea.summary}
              </Section>
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
                    description: currentItems.find(i => i.name === selectedItems[0])?.description || "",
                    category: currentItems.find(i => i.name === selectedItems[0])?.category || "",
                  }}
                  tech2={{
                    name: selectedItems[1],
                    description: currentItems.find(i => i.name === selectedItems[1])?.description || "",
                    category: currentItems.find(i => i.name === selectedItems[1])?.category || "",
                  }}
                  analysis={{
                    ideaName: frankensteinIdea.idea_title,
                    description: frankensteinIdea.idea_description,
                    keyFeatures: [],
                    targetMarket: frankensteinIdea.target_audience,
                    uniqueValueProposition: frankensteinIdea.unique_value_proposition,
                    language: (frankensteinIdea.language || locale) as 'en' | 'es',
                  }}
                  fullAnalysis={frankensteinIdea}
                  allTechnologies={selectedItems.map(name => {
                    const item = currentItems.find(i => i.name === name);
                    return {
                      name,
                      description: item?.description || `${item?.category || ''} technology`,
                      category: item?.category || '',
                    };
                  })}
                />
              )}

              {isLoggedIn && (
                isReportSaved ? (
                  <>
                    <span className="flex items-center gap-2 px-3 py-2 text-sm font-medium uppercase tracking-wider text-green-400 bg-green-900/20 border border-green-700 rounded cursor-default">
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
                      <span>{t("reportSavedMessage") || "Report Saved"}</span>
                    </span>

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
                        <span>{shareSuccess ? (t("linkCopied") || "Link Copied!") : (t("share") || "Share")}</span>
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
                ) : (
                  <button
                    onClick={handleSaveReport}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium uppercase tracking-wider text-slate-300 bg-black/50 border border-purple-600 rounded hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm3 1h4a1 1 0 000-2H8a1 1 0 000 2z" />
                    </svg>
                    <span>{isSaving ? (t("saving") || "Saving...") : (t("saveReportButton") || "Save Report")}</span>
                  </button>
                )
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

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-purple-900/50 rounded-lg p-1 flex gap-2">
            <button
              onClick={() => {
                if (isModeSelectionDisabled) return;
                setMode('companies');
              }}
              disabled={isModeSelectionDisabled}
              aria-disabled={isModeSelectionDisabled}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                mode === 'companies'
                  ? 'bg-orange-500 text-black'
                  : 'bg-transparent text-purple-300 hover:text-white'
              } ${isModeSelectionDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              🏢 {t('techCompanies') || 'Tech Companies'}
            </button>
            <button
              onClick={() => {
                if (isModeSelectionDisabled) return;
                setMode('aws');
              }}
              disabled={isModeSelectionDisabled}
              aria-disabled={isModeSelectionDisabled}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                mode === 'aws'
                  ? 'bg-orange-500 text-black'
                  : 'bg-transparent text-purple-300 hover:text-white'
              } ${isModeSelectionDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              ☁️ {t('awsServices') || 'AWS Services'}
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="text-center mb-8 text-purple-200">
          <p className="text-lg">
            {t('frankensteinDescription') || 
              'Combine random technologies to create innovative startup ideas!'}
          </p>
          <p className="text-sm mt-2 text-purple-400">
            {mode === 'companies' 
              ? `${techCompanies.length} ${t('companiesAvailable') || 'companies available'}`
              : `${awsServices.length} ${t('awsServicesAvailable') || 'AWS services available'}`}
          </p>
          {currentItems.length === 0 && !error && (
            <p className="text-sm mt-2 text-yellow-400">
              Loading data sources...
            </p>
          )}
          {selectedItems.length === 0 && frankensteinIdea === null && (
            <p className="text-xs mt-2 text-purple-500 italic">
              {mode === 'companies' 
                ? t('readyToCombineCompanies') || 'Ready to combine tech companies into a new idea'
                : t('readyToCombineAWS') || 'Ready to combine AWS services into a new idea'}
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
                      setSlotCount(option);
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
            key={mode} // Force re-render when mode changes
            allItems={currentItemNames}
            selectedItems={selectedItems}
            isSpinning={isSpinning}
            slotCount={slotCount}
            itemsWithDetails={currentItems.map(item => ({
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
              ⚡ {t('createFrankenstein') || 'Create Frankenstein'} ⚡
            </button>
          ) : (
            <>
              <button
                onClick={handleReject}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all"
              >
                ❌ {t('reject') || 'Reject'}
              </button>
              <button
                onClick={handleAcceptCombination}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all transform hover:scale-105"
              >
                ✅ {t('acceptAndGenerate') || 'Accept & Generate Idea'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  // Helper to safely render content (handle objects, arrays, etc.)
  const renderContent = (content: React.ReactNode): React.ReactNode => {
    if (typeof content === 'string') {
      return content;
    }
    if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
      // If it's an object, convert to JSON string for display
      return JSON.stringify(content, null, 2);
    }
    if (Array.isArray(content)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {content.map((item, i) => (
            <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
          ))}
        </ul>
      );
    }
    return content;
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-orange-400 mb-2">{title}</h3>
      <div className="text-purple-100 whitespace-pre-wrap">{renderContent(children)}</div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-purple-900/50 rounded-lg p-4 text-center border border-purple-600">
    <div className="text-3xl font-bold text-orange-400">{value}</div>
    <div className="text-sm text-purple-300 mt-1">{label}</div>
  </div>
);
