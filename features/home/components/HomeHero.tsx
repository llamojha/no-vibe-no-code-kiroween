
'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/features/locale/context/LocaleContext';
import BackgroundAnimation from '@/features/home/components/BackgroundAnimation';
import LanguageToggle from '@/features/locale/components/LanguageToggle';
import { useAuth } from '@/features/auth/context/AuthContext';

const HomeHero: React.FC = () => {
  const router = useRouter();
  const { t } = useLocale();
  const { session, isLoading, tier } = useAuth();

  const handleAnalyzeClick = useCallback(() => {
    if (isLoading) return; // avoid double routing while auth initializes
    if (!session) {
      router.push('/login');
      return;
    }
    if (tier === 'paid' || tier === 'admin') {
      router.push('/analyzer');
    } else {
      router.push('/dashboard');
    }
  }, [isLoading, router, session, tier]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-transparent text-white overflow-hidden relative">
      <BackgroundAnimation />
       <header className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6 lg:p-8 flex justify-end">
        <LanguageToggle />
      </header>
      <main className="flex-grow flex flex-col items-center justify-center text-center p-4 relative z-10 pointer-events-none">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] [mask-image:linear-gradient(to_bottom,transparent,white)]"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-accent rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-secondary rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="z-10 animate-fade-in">
            <h1 id="main-title" aria-describedby="main-subtitle" className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-widest" style={{ textShadow: '0 0 5px rgba(0, 240, 255, 0.7), 0 0 15px rgba(0, 240, 255, 0.5), 0 0 30px rgba(0, 240, 255, 0.3)' }}>
              {t('homeTitle')}
            </h1>
        </div>

        <div className="z-10 mt-4 animate-slide-in-up bg-black/75 backdrop-blur-md p-4 border border-accent/30" style={{ animationDelay: '300ms' }}>
            <p id="main-subtitle" className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-2xl ">
              {t('homeSubtitle')}
            </p>
        </div>

        <div className="z-10 mt-12 animate-slide-in-up flex flex-col items-center gap-4 pointer-events-auto" style={{ animationDelay: '600ms' }}>
            <button
              onClick={handleAnalyzeClick}
              className="px-8 py-4 bg-secondary/80 text-white font-bold text-lg rounded-none shadow-lg shadow-secondary/30 hover:bg-secondary transform hover:scale-105 transition-all duration-300 ease-in-out uppercase tracking-widest"
            >
              {t('homeCTA')}
            </button>
             <button
              onClick={() => router.push('/login')}
              aria-label={t('loginButtonAriaLabel')}
              className="px-6 py-2 text-sm font-bold uppercase tracking-wider text-slate-300 bg-slate-900/80 border border-accent/50 rounded-none hover:bg-accent/20 hover:text-accent hover:border-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-accent"
            >
              {t('loginButton')}
            </button>
        </div>
      </main>
    </div>
  );
};

export default HomeHero;
