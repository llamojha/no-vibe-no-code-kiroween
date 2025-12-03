"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/features/locale/context/LocaleContext";
import BackgroundAnimation from "@/features/home/components/BackgroundAnimation";
import AnimationToggle from "@/features/home/components/AnimationToggle";
import AnalyzerButton from "@/features/home/components/AnalyzerButton";
import LanguageToggle from "@/features/locale/components/LanguageToggle";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useAnimationPreference } from "@/features/home/hooks/useAnimationPreference";
import { isEnabled } from "@/lib/featureFlags";

const HomeHero: React.FC = () => {
  const router = useRouter();
  const { t } = useLocale();
  const { session, isLoading, tier } = useAuth();
  const {
    mode,
    isLoading: animationLoading,
    setAnimationMode,
  } = useAnimationPreference();

  // Feature flag evaluations
  const showClassicAnalyzer = isEnabled("ENABLE_CLASSIC_ANALYZER");
  const showKiroweenAnalyzer = isEnabled("ENABLE_KIROWEEN_ANALYZER");
  const showDoctorFrankenstein = true; // Always enabled for now
  const hasAnyAnalyzer = showClassicAnalyzer || showKiroweenAnalyzer || showDoctorFrankenstein;

  const handleAnalyzeClick = useCallback(() => {
    if (isLoading) return; // avoid double routing while auth initializes
    if (!session) {
      router.push("/login");
      return;
    }
    if (tier === "paid" || tier === "admin") {
      router.push("/analyzer");
    } else {
      router.push("/dashboard");
    }
  }, [isLoading, router, session, tier]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-transparent text-white overflow-hidden relative">
      <BackgroundAnimation mode={mode} />
      <header className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6 lg:p-8 flex justify-between items-start">
        <AnimationToggle
          currentMode={mode}
          onToggle={setAnimationMode}
          isLoading={animationLoading}
        />
        <LanguageToggle />
      </header>
      <main className="flex-grow flex flex-col items-center justify-center text-center p-4 relative z-10 pointer-events-none">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] [mask-image:linear-gradient(to_bottom,transparent,white)]"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-accent rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-secondary rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="z-10 animate-fade-in">
          <h1
            id="main-title"
            aria-describedby="main-subtitle"
            className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-widest"
            style={{
              textShadow:
                "0 0 5px rgba(0, 240, 255, 0.7), 0 0 15px rgba(0, 240, 255, 0.5), 0 0 30px rgba(0, 240, 255, 0.3)",
            }}
          >
            {t("homeTitle")}
          </h1>
        </div>

        <div
          className="z-10 mt-4 animate-slide-in-up bg-black/75 backdrop-blur-md p-4 border border-accent/30"
          style={{ animationDelay: "300ms" }}
        >
          <p
            id="main-subtitle"
            className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-2xl "
          >
            {t("homeSubtitle")}
          </p>
        </div>

        <div
          className="z-10 mt-12 animate-slide-in-up flex flex-col items-center gap-8 pointer-events-auto"
          style={{ animationDelay: "600ms" }}
        >
          {/* Conditional analyzer buttons */}
          {hasAnyAnalyzer ? (
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center w-full max-w-4xl">
              {showClassicAnalyzer && (
                <AnalyzerButton
                  title={t("homeCTA")}
                  description="Validate your startup idea with AI-powered analysis"
                  href="/analyzer"
                  icon="💡"
                  variant="primary"
                  onClick={handleAnalyzeClick}
                />
              )}
              {showKiroweenAnalyzer && (
                <AnalyzerButton
                  title="Kiroween Analyzer"
                  description="Get spooky feedback on your hackathon project"
                  href="/kiroween-analyzer"
                  icon="🎃"
                  variant="secondary"
                />
              )}
              {showDoctorFrankenstein && (
                <AnalyzerButton
                  title="Doctor Frankenstein"
                  description="Combine random technologies to create innovative ideas"
                  href="/doctor-frankenstein"
                  icon="🧟"
                  variant="secondary"
                />
              )}
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-700 p-8 text-center max-w-md">
              <div className="text-slate-400 text-lg mb-2">⚠️</div>
              <p className="text-slate-300 font-medium uppercase tracking-wider">
                No Analyzers Available
              </p>
              <p className="text-slate-500 text-sm mt-2">
                All analyzer features are currently disabled. Please check back
                later.
              </p>
            </div>
          )}

          {/* Enhanced Login button */}
          <button
            onClick={() => router.push("/login")}
            aria-label={t("loginButtonAriaLabel")}
            className="group relative px-8 py-4 text-lg font-bold uppercase tracking-wider overflow-hidden
                       bg-gradient-to-r from-accent via-secondary to-accent bg-size-200 bg-pos-0
                       hover:bg-pos-100 transition-all duration-500 ease-out
                       border-2 border-accent/50 hover:border-accent
                       shadow-lg hover:shadow-accent/50 hover:shadow-2xl
                       transform hover:scale-105 active:scale-95
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-accent"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5 transform group-hover:rotate-12 transition-transform"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              {t("loginButton")}
            </span>
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                         transform -skew-x-12 -translate-x-full group-hover:translate-x-full
                         transition-transform duration-1000"
              aria-hidden="true"
            />
          </button>
        </div>
      </main>
    </div>
  );
};

export default HomeHero;
