"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLocale } from "@/features/locale/context/LocaleContext";
import LanguageToggle from "@/features/locale/components/LanguageToggle";
import IdeaCard from "./IdeaCard";
import IdeaCreationHub from "./IdeaCreationHub";
import { getUserIdeas } from "@/features/idea-panel/api";
import type { DashboardIdeaDTO } from "@/src/infrastructure/web/dto/IdeaDTO";
import type { UserTier } from "@/lib/types";
import { trackDashboardView } from "@/features/analytics/tracking";
import { CreditCounter } from "@/features/shared/components/CreditCounter";
// Note: isEnabled moved to IdeaCreationHub component

type SortOption = "newest" | "oldest" | "az";
type FilterOption = "all" | "manual" | "frankenstein";

interface UserDashboardProps {
  initialIdeas: DashboardIdeaDTO[];
  sessionUserId: string;
  initialCredits: number;
  userTier: UserTier;
  userEmail?: string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({
  initialIdeas,
  sessionUserId,
  initialCredits,
  userTier,
  userEmail,
}) => {
  const router = useRouter();
  const { t } = useLocale();
  const { signOut } = useAuth();

  const [ideas, setIdeas] = useState<DashboardIdeaDTO[]>(initialIdeas);
  const [filterState, setFilterState] = useState<{
    filter: FilterOption;
    searchQuery: string;
    sortOption: SortOption;
  }>({
    filter: "all",
    searchQuery: "",
    sortOption: "newest",
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshIdeas = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const data = await getUserIdeas();
      setIdeas(data);
    } catch (error) {
      console.error("Error refreshing ideas", error);
      const message =
        error instanceof Error ? error.message : "Failed to load ideas";
      setErrorMessage(message);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    trackDashboardView();
  }, []);

  const filteredAndSortedIdeas = useMemo(() => {
    return ideas
      .filter((idea) => {
        // Filter by source
        if (
          filterState.filter !== "all" &&
          idea.source !== filterState.filter
        ) {
          return false;
        }
        // Filter by search query
        if (filterState.searchQuery) {
          const query = filterState.searchQuery.toLowerCase();
          return (
            idea.ideaText.toLowerCase().includes(query) ||
            idea.tags.some((tag) => tag.toLowerCase().includes(query))
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
            return a.ideaText.localeCompare(b.ideaText);
          case "newest":
          default:
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
      });
  }, [ideas, filterState]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace("/");
  }, [router, signOut]);

  const handleFilterChange = useCallback((filter: FilterOption) => {
    setFilterState((prev) => ({ ...prev, filter }));
  }, []);

  const handleSearchChange = useCallback((searchQuery: string) => {
    setFilterState((prev) => ({ ...prev, searchQuery }));
  }, []);

  const handleSortChange = useCallback((sortOption: SortOption) => {
    setFilterState((prev) => ({ ...prev, sortOption }));
  }, []);

  // Calculate counts for filter buttons
  const counts = useMemo(() => {
    return {
      total: ideas.length,
      manual: ideas.filter((i) => i.source === "manual").length,
      frankenstein: ideas.filter((i) => i.source === "frankenstein").length,
    };
  }, [ideas]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/30 to-orange-950/30 text-slate-200 p-4 sm:p-6 lg:p-8">
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
        {/* Credit Counter */}
        <div className="mb-8 animate-slide-in-up">
          <CreditCounter
            credits={initialCredits}
            tier={userTier}
            userEmail={userEmail}
          />
        </div>

        {/* Idea Creation Hub - unified entry point */}
        <div className="mb-12 animate-slide-in-up">
          <IdeaCreationHub onIdeaCreated={refreshIdeas} />
        </div>

        <div
          className="animate-slide-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2
              className="text-2xl font-bold border-b border-slate-700 pb-2 text-slate-200 uppercase tracking-wider"
              data-testid="ideas-heading"
            >
              {t("yourIdeas") || "Your Ideas"}
            </h2>
            <button
              onClick={refreshIdeas}
              disabled={isRefreshing}
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wider border border-slate-700 text-slate-300 hover:border-accent hover:text-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? t("refreshing") : t("refresh")}
            </button>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-600 rounded text-red-200">
              <p className="font-semibold mb-1">Error loading ideas</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider border rounded transition-colors ${
                filterState.filter === "all"
                  ? "border-accent text-accent bg-accent/10"
                  : "border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              {t("allAnalyses") || "All Analyses"} ({counts.total})
            </button>
            <button
              onClick={() => handleFilterChange("manual")}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider border rounded transition-colors ${
                filterState.filter === "manual"
                  ? "border-blue-600 text-blue-400 bg-blue-900/20"
                  : "border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              ✍️ {t("manualAnalyses") || "Manual Analyses"} ({counts.manual})
            </button>
            <button
              onClick={() => handleFilterChange("frankenstein")}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider border rounded transition-colors ${
                filterState.filter === "frankenstein"
                  ? "border-green-600 text-green-400 bg-green-900/20"
                  : "border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              🧟 {t("frankensteinAnalyses") || "Frankenstein Analyses"} (
              {counts.frankenstein})
            </button>
          </div>

          {ideas.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <label htmlFor="search-ideas" className="sr-only">
                  {t("searchIdeasLabel") || "Search ideas"}
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
                  id="search-ideas"
                  type="text"
                  placeholder={t("searchIdeasPlaceholder") || "Search ideas..."}
                  value={filterState.searchQuery}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-primary/50 border border-slate-700 rounded-none focus:outline-none focus:ring-2 focus:ring-accent text-slate-200 placeholder-slate-500 font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort-ideas"
                  className="text-sm text-slate-400 uppercase tracking-wider"
                >
                  {t("sort")}
                </label>
                <select
                  id="sort-ideas"
                  value={filterState.sortOption}
                  onChange={(event) =>
                    handleSortChange(event.target.value as SortOption)
                  }
                  className="bg-primary/50 border border-slate-700 text-slate-200 px-3 py-2 rounded-none focus:outline-none focus:ring-2 focus:ring-accent text-sm uppercase tracking-wider"
                >
                  <option value="newest">{t("newest")}</option>
                  <option value="oldest">{t("oldest")}</option>
                  <option value="az">{t("alphabetical")}</option>
                </select>
              </div>
            </div>
          )}

          {/* Ideas list */}
          {filteredAndSortedIdeas.length === 0 ? (
            <div
              className="bg-primary/30 border border-dashed border-slate-700 p-8 text-center text-slate-500 font-mono uppercase tracking-widest"
              data-testid="empty-state"
            >
              {ideas.length === 0
                ? t("noIdeasYet") || "No ideas yet"
                : t("noIdeasMatch") || "No ideas match your search"}
            </div>
          ) : (
            <div className="space-y-4" data-testid="ideas-list">
              {filteredAndSortedIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
