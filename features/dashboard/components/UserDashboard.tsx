'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLocale } from '@/features/locale/context/LocaleContext';
import LanguageToggle from '@/features/locale/components/LanguageToggle';
import { mapSavedAnalysesRow } from '@/lib/supabase/mappers';
import type { SavedAnalysesRow } from '@/lib/supabase/types';
import type { SavedAnalysisRecord } from '@/lib/types';
import { capture } from '@/features/analytics/posthogClient';

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 5) * circumference;

  const scoreColorClass =
    score >= 4 ? 'text-green-400' : score >= 2.5 ? 'text-yellow-400' : 'text-red-400';
  const ringColorClass =
    score >= 4 ? 'stroke-green-400' : score >= 2.5 ? 'stroke-yellow-400' : 'stroke-red-400';

  return (
    <div
      className={`relative flex-shrink-0 w-16 h-16 flex items-center justify-center font-mono ${scoreColorClass}`}
    >
      <svg className="absolute w-full h-full" viewBox="0 0 56 56">
        <circle className="stroke-slate-700" strokeWidth="4" fill="transparent" r={radius} cx="28" cy="28" />
        <circle
          className={`${ringColorClass} transform -rotate-90 origin-center`}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="28"
          cy="28"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <span className="text-lg font-bold">{score.toFixed(1)}</span>
    </div>
  );
};

type SortOption = 'newest' | 'oldest' | 'az';

interface UserDashboardProps {
  initialAnalyses: SavedAnalysisRecord[];
  sessionUserId: string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ initialAnalyses, sessionUserId }) => {
  const router = useRouter();
  const { t } = useLocale();
  const { supabase, signOut } = useAuth();

  const [analyses, setAnalyses] = useState<SavedAnalysisRecord[]>(initialAnalyses);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [ideaToDelete, setIdeaToDelete] = useState<SavedAnalysisRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshAnalyses = useCallback(async () => {
    if (!supabase) return;
    setIsRefreshing(true);
    const { data, error } = await supabase
      .from('saved_analyses')
      .select('*')
      .eq('user_id', sessionUserId)
      .order('created_at', { ascending: false })
      .returns<SavedAnalysesRow[]>();
    if (error) {
      console.error('Error refreshing analyses', error);
      setIsRefreshing(false);
      return;
    }
    setAnalyses((data ?? []).map(mapSavedAnalysesRow));
    setIsRefreshing(false);
  }, [sessionUserId, supabase]);

  // Avoid auto-refresh on mount to prevent perceived "soft reloads".
  // The page provides server-fetched `initialAnalyses`; users can refresh manually.
  useEffect(() => {
    capture('dashboard_view');
  }, []);

  const filteredAndSortedAnalyses = useMemo(() => {
    return analyses
      .filter((analysis) => analysis.idea.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        switch (sortOption) {
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'az':
            return a.idea.localeCompare(b.idea);
          case 'newest':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [analyses, searchQuery, sortOption]);

  const handleDelete = useCallback(async () => {
    if (!ideaToDelete || !supabase) return;
    const { error } = await supabase.from('saved_analyses').delete().eq('id', ideaToDelete.id);
    if (error) {
      console.error('Failed to delete analysis', error);
      return;
    }
    setAnalyses((prev) => prev.filter((analysis) => analysis.id !== ideaToDelete.id));
    setIdeaToDelete(null);
  }, [ideaToDelete, supabase]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace('/');
  }, [router, signOut]);

  return (
    <div className="min-h-screen bg-black text-slate-200 p-4 sm:p-6 lg:p-8">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
            {t('userDashboardTitle')}
          </h1>
          <p className="text-slate-400">{t('welcomeBack')}</p>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-primary/50 border border-slate-600 rounded-none hover:bg-red-500/20 hover:text-red-400 hover:border-red-500 transition-colors uppercase tracking-wider"
          >
            {t('logoutButton')}
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto">
        <div className="mb-12 animate-slide-in-up">
          <button
            onClick={() => router.push('/analyzer')}
            className="w-full px-8 py-4 bg-secondary/80 text-white font-bold text-lg rounded-none shadow-lg shadow-secondary/30 hover:bg-secondary transform hover:scale-105 transition-all duration-300 ease-in-out uppercase tracking-widest"
          >
            {t('analyzeNewIdeaButton')}
          </button>
        </div>

        <div className="animate-slide-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold border-b border-slate-700 pb-2 text-slate-200 uppercase tracking-wider">
              {t('savedIdeasTitle')}
            </h2>
            <button
              onClick={refreshAnalyses}
              disabled={isRefreshing}
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wider border border-slate-700 text-slate-300 hover:border-accent hover:text-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {analyses.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-primary/50 border border-slate-700 rounded-none focus:outline-none focus:ring-2 focus:ring-accent text-slate-200 placeholder-slate-500 font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400 uppercase tracking-wider">
                  {t('sortLabel')}
                </label>
                <select
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value as SortOption)}
                  className="bg-primary/50 border border-slate-700 text-slate-200 px-3 py-2 rounded-none focus:outline-none focus:ring-2 focus:ring-accent text-sm uppercase tracking-wider"
                >
                  <option value="newest">{t('sortNewest')}</option>
                  <option value="oldest">{t('sortOldest')}</option>
                  <option value="az">{t('sortAZ')}</option>
                </select>
              </div>
            </div>
          )}

          {filteredAndSortedAnalyses.length === 0 ? (
            <div className="bg-primary/30 border border-dashed border-slate-700 p-8 text-center text-slate-500 font-mono uppercase tracking-widest">
              {analyses.length === 0 ? t('noSavedIdeas') : t('noSearchResults')}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="bg-primary/40 border border-slate-700 p-4 flex flex-col sm:flex-row gap-4 sm:items-center animate-fade-in"
                >
                  <ScoreRing score={analysis.analysis.finalScore} />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-200 uppercase tracking-wider">
                      {(() => {
                        const raw = analysis.idea || '';
                        const firstLine = raw.split('\n')[0].trim();
                        const title = firstLine.length > 0 ? firstLine : raw.trim();
                        const maxLen = 80;
                        return title.length > maxLen ? `${title.slice(0, maxLen - 1)}…` : title;
                      })()}
                    </h3>
                    <p className="text-sm text-slate-500 font-mono">
                      {new Date(analysis.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                      {analysis.analysis.detailedSummary}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() =>
                        router.push(`/analyzer?savedId=${encodeURIComponent(analysis.id)}&mode=view`)
                      }
                      className="flex items-center gap-2 px-3 py-2 bg-primary/40 border border-slate-700 text-slate-300 hover:bg-accent/20 hover:text-accent hover:border-accent transition-colors rounded-none uppercase tracking-wider text-xs sm:text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 3a1 1 0 01.832.445l2.39 3.42 3.864 1.118a1 1 0 01.276 1.794l-2.857 2.308.826 3.966a1 1 0 01-1.45 1.054L10 15.347l-3.881 1.758a1 1 0 01-1.45-1.054l.826-3.966-2.857-2.308a1 1 0 01.276-1.794l3.864-1.118 2.39-3.42A1 1 0 0110 3z" />
                      </svg>
                      {t('viewLabel') ?? 'View'}
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/analyzer?savedId=${encodeURIComponent(analysis.id)}&mode=refine`)
                      }
                      className="flex items-center gap-2 px-3 py-2 bg-primary/40 border border-slate-700 text-slate-300 hover:bg-secondary/20 hover:text-secondary hover:border-secondary transition-colors rounded-none uppercase tracking-wider text-xs sm:text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path
                          fillRule="evenodd"
                          d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('editIdeaButton')}
                    </button>
                    <button
                      onClick={() => setIdeaToDelete(analysis)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-700 text-red-400 hover:bg-red-500/20 transition-colors rounded-none uppercase tracking-wider text-xs sm:text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M6 8a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1zm4 0a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1zm4 1a1 1 0 10-2 0v6a1 1 0 102 0V9z"
                          clipRule="evenodd"
                        />
                        <path
                          fillRule="evenodd"
                          d="M4 5a2 2 0 012-2h8a2 2 0 012 2v1H4V5zm2-4a4 4 0 00-4 4v1a2 2 0 002 2h12a2 2 0 002-2V5a4 4 0 00-4-4H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('deleteIdeaButton')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {ideaToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-primary/90 border border-red-500 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-400 uppercase tracking-wider">
              {t('deleteConfirmationTitle')}
            </h3>
            <p className="text-slate-300 mt-4">{t('deleteConfirmationMessage')}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIdeaToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700 rounded-none hover:bg-slate-700/50 transition-colors uppercase tracking-wider"
              >
                {t('cancelDeleteButton')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-500 rounded-none hover:bg-red-500 transition-colors uppercase tracking-wider"
              >
                {t('confirmDeleteButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
