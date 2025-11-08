"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLocale } from "@/features/locale/context/LocaleContext";
import LanguageToggle from "@/features/locale/components/LanguageToggle";
import AnalysisFilter from "./AnalysisFilter";
import AnalysisCard from "./AnalysisCard";
import { loadUnifiedAnalyses } from "../api/loadUnifiedAnalyses";
import type {
  UnifiedAnalysisRecord,
  AnalysisCounts,
  DashboardFilterState,
} from "@/lib/types";
import { capture } from "@/features/analytics/posthogClient";
import { isEnabled } from "@/lib/featureFlags";

type SortOption = "newest" | "oldest" | "az";

interface UserDashboardProps {
  initialAnalyses: UnifiedAnalysisRecord[];
  initialCounts: AnalysisCounts;
  sessionUserId: string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({
  initialAnalyses,
  initialCounts,
  sessionUserId,
}) => {
  const router = useRouter();
  const { t } = useLocale();
  const { supabase, signOut } = useAuth();

  // Feature flag evaluations
  const showClassicAnalyzer = isEnabled("ENABLE_CLASSIC_ANALYZER");
  const showKiroweenAnalyzer = isEnabled("ENABLE_KIROWEEN_ANALYZER");

  const [analyses, setAnalyses] =
    useState<UnifiedAnalysisRecord[]>(initialAnalyses);
  const [counts, setCounts] = useState<AnalysisCounts>(initialCounts);
  const [filterState, setFilterState] = useState<DashboardFilterState>({
    filter: "all",
    searchQuery: "",
    sortOption: "newest",
  });
  const [analysisToDelete, setAnalysisToDelete] =
    useState<UnifiedAnalysisRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cancelButtonRef = React.useRef<HTMLButtonElement>(null);

  const refreshAnalyses = useCallback(async () => {
    setIsRefreshing(true);
    const { data, counts: newCounts, error } = await loadUnifiedAnalyses();
    if (error) {
      console.error("Error refreshing analyses", error);
    } else {
      setAnalyses(data);
      setCounts(newCounts);
    }
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    capture("dashboard_view");
  }, []);

  const filteredAndSortedAnalyses = useMemo(() => {
    return analyses
      .filter((analysis) => {
        if (
          filterState.filter !== "all" &&
          analysis.category !== filterState.filter
        ) {
          return false;
        }
        if (filterState.searchQuery) {
          const query = filterState.searchQuery.toLowerCase();
          return (
            analysis.title.toLowerCase().includes(query) ||
            analysis.summary.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        switch (filterState.sortOption) {
          case "oldest":
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          case "az":
            return a.title.localeCompare(b.title);
          case "newest":
          default:
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
      });
  }, [analyses, filterState]);

  const handleDelete = useCallback(async () => {
    if (!analysisToDelete || !supabase) return;

    const tableName =
      analysisToDelete.category === "idea"
        ? "saved_analyses"
        : "saved_hackathon_analyses";

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", analysisToDelete.id);

    if (error) {
      console.error("Failed to delete analysis", error);
      return;
    }

    setAnalyses((prev) =>
      prev.filter((analysis) => analysis.id !== analysisToDelete.id)
    );
    setCounts((prev) => ({
      total: prev.total - 1,
      idea: analysisToDelete.category === "idea" ? prev.idea - 1 : prev.idea,
      kiroween:
        analysisToDelete.category === "kiroween"
          ? prev.kiroween - 1
          : prev.kiroween,
    }));
    setAnalysisToDelete(null);
  }, [analysisToDelete, supabase]);

  // Focus management for delete dialog
  useEffect(() => {
    if (analysisToDelete && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [analysisToDelete]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace("/");
  }, [router, signOut]);

  const handleFilterChange = useCallback(
    (filter: "all" | "idea" | "kiroween") => {
      setFilterState((prev) => ({ ...prev, filter }));
    },
    []
  );

  const handleSearchChange = useCallback((searchQuery: string) => {
    setFilterState((prev) => ({ ...prev, searchQuery }));
  }, []);

  const handleSortChange = useCallback((sortOption: SortOption) => {
    setFilterState((prev) => ({ ...prev, sortOption }));
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-200 p-4 sm:p-6 lg:p-8">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
            {t("userDashboardTitle")}
          </h1>
          <p className="text-slate-400">{t("welcomeBack")}</p>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-primary/50 border border-slate-600 rounded-none hover:bg-red-500/20 hover:text-red-400 hover:border-red-500 transition-colors uppercase tracking-wider"
          >
            {t("logoutButton")}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {(showClassicAnalyzer || showKiroweenAnalyzer) && (
          <div className="mb-12 animate-slide-in-up">
            <div
              className={`grid gap-4 ${
                showClassicAnalyzer && showKiroweenAnalyzer
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 max-w-md mx-auto"
              }`}
            >
              {showClassicAnalyzer && (
                <button
                  onClick={() => router.push("/analyzer")}
                  className="px-8 py-4 bg-teal-500/80 text-white font-bold text-lg rounded-none shadow-lg shadow-teal-500/30 hover:bg-teal-500 transform hover:scale-105 transition-all duration-300 ease-in-out uppercase tracking-widest"
                >
                  {t('analyzeStartupIdea')}
                </button>
              )}
              {showKiroweenAnalyzer && (
                <button
                  onClick={() => router.push("/kiroween-analyzer")}
                  className="px-8 py-4 bg-orange-500/80 text-white font-bold text-lg rounded-none shadow-lg shadow-orange-500/30 hover:bg-orange-500 transform hover:scale-105 transition-all duration-300 ease-in-out uppercase tracking-widest"
                >
                  {t('analyzeKiroweenProject')}
                </button>
              )}
            </div>
          </div>
        )}

        <div
          className="animate-slide-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold border-b border-slate-700 pb-2 text-slate-200 uppercase tracking-wider">
              {t('yourAnalyses')}
            </h2>
            <button
              onClick={refreshAnalyses}
              disabled={isRefreshing}
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wider border border-slate-700 text-slate-300 hover:border-accent hover:text-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? t('refreshing') : t('refresh')}
            </button>
          </div>

          <AnalysisFilter
            currentFilter={filterState.filter}
            onFilterChange={handleFilterChange}
            counts={counts}
          />

          {analyses.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <label htmlFor="search-analyses" className="sr-only">
                  {t('searchAnalysesLabel')}
                </label>
                <span
                  className="absolute inset-y-0 left-0 flex items-center pl-3"
                  aria-hidden="true"
                >
                  <svg
                    className="h-5 w-5 text-slate-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  id="search-analyses"
                  type="text"
                  placeholder={t('searchAnalysesPlaceholder')}
                  value={filterState.searchQuery}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  aria-describedby="search-help"
                  className="w-full pl-10 pr-4 py-2 bg-primary/50 border border-slate-700 rounded-none focus:outline-none focus:ring-2 focus:ring-accent text-slate-200 placeholder-slate-500 font-mono"
                />
                <div id="search-help" className="sr-only">
                  {t('searchAnalysesHelp')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort-analyses"
                  className="text-sm text-slate-400 uppercase tracking-wider"
                >
                  {t('sort')}
                </label>
                <select
                  id="sort-analyses"
                  value={filterState.sortOption}
                  onChange={(event) =>
                    handleSortChange(event.target.value as SortOption)
                  }
                  aria-describedby="sort-help"
                  className="bg-primary/50 border border-slate-700 text-slate-200 px-3 py-2 rounded-none focus:outline-none focus:ring-2 focus:ring-accent text-sm uppercase tracking-wider"
                >
                  <option value="newest">{t('newest')}</option>
                  <option value="oldest">{t('oldest')}</option>
                  <option value="az">{t('alphabetical')}</option>
                </select>
                <div id="sort-help" className="sr-only">
                  {t('sortHelp')}
                </div>
              </div>
            </div>
          )}

          {filteredAndSortedAnalyses.length === 0 ? (
            <div className="bg-primary/30 border border-dashed border-slate-700 p-8 text-center text-slate-500 font-mono uppercase tracking-widest">
              {analyses.length === 0
                ? t('noAnalysesYet')
                : t('noAnalysesMatch')}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedAnalyses.map((analysis) => (
                <AnalysisCard
                  key={analysis.id}
                  analysis={analysis}
                  onDelete={setAnalysisToDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {analysisToDelete && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <div className="bg-primary/90 border border-red-500 p-6 max-w-md w-full">
            <h3
              id="delete-dialog-title"
              className="text-xl font-bold text-red-400 uppercase tracking-wider"
            >
              {t('deleteAnalysisTitle')}
            </h3>
            <p id="delete-dialog-description" className="text-slate-300 mt-4">
              {t('deleteAnalysisConfirm', { title: analysisToDelete.title })}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelButtonRef}
                onClick={() => setAnalysisToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700 rounded-none hover:bg-slate-700/50 transition-colors uppercase tracking-wider"
                aria-label={t('cancelDeleteLabel')}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-500 rounded-none hover:bg-red-500 transition-colors uppercase tracking-wider"
                aria-label={t('deleteAnalysisLabel', { title: analysisToDelete.title })}
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
