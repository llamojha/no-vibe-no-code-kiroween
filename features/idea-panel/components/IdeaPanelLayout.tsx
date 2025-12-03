"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/features/locale/context/LocaleContext";
import LanguageToggle from "@/features/locale/components/LanguageToggle";

interface IdeaPanelLayoutProps {
  children: React.ReactNode;
  ideaId: string;
}

/**
 * IdeaPanelLayout component
 *
 * Provides a full-screen layout for the Idea Panel with:
 * - Breadcrumb navigation back to dashboard
 * - Responsive design for mobile and desktop
 * - Accessibility features (ARIA labels, keyboard navigation)
 *
 * Requirements: 1.4, 1.5, 6.2, 6.3
 */
export const IdeaPanelLayout: React.FC<IdeaPanelLayoutProps> = ({
  children,
  ideaId,
}) => {
  const router = useRouter();
  const { t } = useLocale();

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/30 to-orange-950/30 text-slate-200 p-4 sm:p-6 lg:p-8">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#idea-panel-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-none"
      >
        {t("skipToMainContent") || "Skip to main content"}
      </a>

      {/* Header with breadcrumb navigation */}
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-2">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-slate-400 hover:text-accent transition-colors duration-200 group"
              aria-label={t("goToDashboardButton") || "Go to Dashboard"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 group-hover:translate-x-[-2px] transition-transform"
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
              <span className="uppercase tracking-wider text-sm font-semibold">
                {t("userDashboardTitle") || "Dashboard"}
              </span>
            </button>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
            {t("ideaTitle") || "Idea Panel"}
          </h1>
        </div>
        <div className="flex items-center">
          <LanguageToggle />
        </div>
      </header>

      {/* Main content area */}
      <main id="idea-panel-main" className="max-w-4xl mx-auto" role="main">
        {children}
      </main>
    </div>
  );
};

export default IdeaPanelLayout;
