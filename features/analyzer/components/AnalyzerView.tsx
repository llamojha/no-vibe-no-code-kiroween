'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Analysis, SavedAnalysisRecord } from '@/lib/types';
import { mapSavedAnalysesRow } from '@/lib/supabase/mappers';
import type {
  SavedAnalysesInsert,
  SavedAnalysesRow,
  SavedAnalysesUpdate,
} from '@/lib/supabase/types';
import { useLocale } from '@/features/locale/context/LocaleContext';
import { useAuth } from '@/features/auth/context/AuthContext';
import { requestAnalysis } from '@/features/analyzer/api/analyzeIdea';
import IdeaInputForm from '@/features/analyzer/components/IdeaInputForm';
import AnalysisDisplay from '@/features/analyzer/components/AnalysisDisplay';
import Loader from '@/features/analyzer/components/Loader';
import ErrorMessage from '@/features/analyzer/components/ErrorMessage';
import LanguageToggle from '@/features/locale/components/LanguageToggle';
import { capture } from '@/features/analytics/posthogClient';

type LoaderMessages = [
  string,
  string,
  string,
  string,
  string,
  string,
];

const AnalyzerView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const savedId = searchParams.get('savedId');
  const mode = searchParams.get('mode');

  const { locale, t } = useLocale();
  const { session, supabase, isLoading: isAuthLoading } = useAuth();
  const isLoggedIn = useMemo(() => !!session, [session]);

  const [idea, setIdea] = useState<string>('');
  const [newAnalysis, setNewAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isReportSaved, setIsReportSaved] = useState<boolean>(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [addedSuggestions, setAddedSuggestions] = useState<number[]>([]);
  const [savedAnalysisRecord, setSavedAnalysisRecord] = useState<SavedAnalysisRecord | null>(null);
  const [isFetchingSaved, setIsFetchingSaved] = useState(false);
  const savedRecordId = savedAnalysisRecord?.id ?? null;
  const savedRecordAudio = savedAnalysisRecord?.audioBase64 ?? null;

  const ideaInputRef = useRef<HTMLDivElement>(null);

  const showInputForm =
    !savedAnalysisRecord || mode === 'refine' || newAnalysis !== null;

  useEffect(() => {
    if (!savedId) {
      setSavedAnalysisRecord(null);
      setIdea('');
      setIsReportSaved(false);
      setGeneratedAudio(null);
      return;
    }

    // Wait until auth is initialized before deciding unauthenticated
    if (!supabase || isAuthLoading) return;

    if (!session) {
      const next = `/analyzer?savedId=${encodeURIComponent(savedId)}${mode ? `&mode=${mode}` : ''}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    const fetchSavedAnalysis = async () => {
      setIsFetchingSaved(true);
      try {
        const { data, error } = await supabase
          .from('saved_analyses')
          .select('*')
          .eq('id', savedId)
          .eq('user_id', session.user.id)
          .returns<SavedAnalysesRow>()
          .single();

        if (error || !data) {
          console.error('Failed to load saved analysis', error);
          setSavedAnalysisRecord(null);
          setIdea('');
          setIsReportSaved(false);
          setGeneratedAudio(null);
          if (error?.code !== 'PGRST116') {
            setError('Unable to load the saved analysis. It may have been removed.');
          }
          return;
        }

        const record = mapSavedAnalysesRow(data);
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
  }, [mode, router, savedId, session, supabase, isAuthLoading]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (isLoading) {
      const messages: LoaderMessages = [
        t('loaderMessage1'),
        t('loaderMessage2'),
        t('loaderMessage3'),
        t('loaderMessage4'),
        t('loaderMessage5'),
        t('loaderMessage6'),
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
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  const handleAnalyze = useCallback(async () => {
    if (!idea.trim()) {
      setError(t('enterIdeaError'));
      return;
    }

    if (generatedAudio) {
      setGeneratedAudio(null);
    }

    if (supabase && savedRecordId && savedRecordAudio) {
      const clearPayload: SavedAnalysesUpdate = {
        audio_base64: null,
      };
      const { error: clearError } = await supabase
        .from('saved_analyses')
        .update(clearPayload)
        .eq('id', savedRecordId);
      if (clearError) {
        console.error('Failed to clear saved audio', clearError);
      } else {
        setSavedAnalysisRecord((previous) =>
          previous && previous.id === savedRecordId ? { ...previous, audioBase64: null } : previous,
        );
      }
    }

    setIsLoading(true);
    capture('analysis_started', { locale, has_saved_id: Boolean(savedId) });
    setError(null);
    setNewAnalysis(null);
    setAddedSuggestions([]);
    setIsReportSaved(false);

    try {
      const analysisResult = await requestAnalysis(idea, locale);
      setNewAnalysis(analysisResult);
      if (savedId) {
        router.replace('/analyzer');
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unknown error occurred during analysis.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [generatedAudio, idea, locale, router, savedId, savedRecordAudio, savedRecordId, supabase, t]);

  const handleSaveReport = useCallback(async () => {
    const analysisToSave = newAnalysis ?? savedAnalysisRecord?.analysis;
    if (!analysisToSave || !idea) return;

    if (!supabase) {
      setError('Supabase client is not ready. Check your configuration and try again.');
      return;
    }

    if (!session) {
      router.push(`/login?next=${encodeURIComponent('/dashboard')}`);
      return;
    }

    const insertPayload: SavedAnalysesInsert = {
      user_id: session.user.id,
      idea,
      analysis: analysisToSave as unknown as SavedAnalysesInsert['analysis'],
      audio_base64: generatedAudio,
    };

    const { data, error: saveError } = await supabase
      .from('saved_analyses')
      .insert(insertPayload)
      .select()
      .returns<SavedAnalysesRow>()
      .single();

    if (saveError || !data) {
      console.error('Failed to save analysis', saveError);
      setError('Failed to save your analysis. Please try again.');
      return;
    }

    const record = mapSavedAnalysesRow(data);

    setSavedAnalysisRecord(record);
    setIsReportSaved(true);
    setNewAnalysis(null);
    setAddedSuggestions([]);
    setGeneratedAudio(record.audioBase64 ?? null);
    capture('analysis_saved', { analysis_id: record.id, locale });
    router.replace(`/analyzer?savedId=${encodeURIComponent(record.id)}&mode=view`);
  }, [generatedAudio, idea, newAnalysis, router, savedAnalysisRecord, session, supabase]);

  const handleAudioGenerated = useCallback(
    async (audioBase64: string) => {
      setGeneratedAudio(audioBase64);

      if (!supabase || !savedRecordId) {
        return;
      }

      const updatePayload: SavedAnalysesUpdate = {
        audio_base64: audioBase64,
      };

      const { error: updateError } = await supabase
        .from('saved_analyses')
        .update(updatePayload)
        .eq('id', savedRecordId);

      if (updateError) {
        console.error('Failed to persist audio', updateError);
        return;
      }

      setSavedAnalysisRecord((previous) =>
        previous && previous.id === savedRecordId
          ? { ...previous, audioBase64: audioBase64 }
          : previous,
      );
    },
    [savedRecordId, supabase],
  );

  const handleRefineSuggestion = useCallback(
    (suggestionText: string, suggestionTitle: string, index: number) => {
      setIdea((prev) => `${prev.trim()}\n\n— ${suggestionTitle}: ${suggestionText}`);
      setAddedSuggestions((prev) => [...prev, index]);
      ideaInputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    },
    [],
  );

  const analysisToDisplay = newAnalysis ?? savedAnalysisRecord?.analysis ?? null;

  const busy = isLoading || isFetchingSaved;
  const busyMessage = isLoading ? loadingMessage : t('loading');

  return (
    <div className="min-h-screen bg-black text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8 animate-fade-in relative">
          <button
            onClick={handleBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 hover:text-accent transition-colors duration-200"
            title={t('backToHome')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline uppercase tracking-wider">
              {t('backToHome')}
            </span>
          </button>
          <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
            {t('appTitle')}
          </h1>
          <p className="mt-2 text-lg text-slate-400">{t('appSubtitle')}</p>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <LanguageToggle />
          </div>
        </header>

        <main className="w-full">
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
          {error && <ErrorMessage message={error} />}
          {busy && <Loader message={busyMessage} />}
          {analysisToDisplay && !busy && (
            <div className={showInputForm ? 'mt-8' : ''}>
              <AnalysisDisplay
                analysis={analysisToDisplay}
                onSave={handleSaveReport}
                isSaved={isReportSaved}
                savedAudioBase64={generatedAudio}
                onAudioGenerated={handleAudioGenerated}
                onGoToDashboard={handleBack}
                onRefineSuggestion={showInputForm ? handleRefineSuggestion : undefined}
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
