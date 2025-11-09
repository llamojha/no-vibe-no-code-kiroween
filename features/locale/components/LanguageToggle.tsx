'use client';

import React from 'react';
import { useLocale } from '@/features/locale/context/LocaleContext';

const toggleBase =
  'w-12 h-8 rounded-none transition-all duration-300 flex justify-center items-center text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-accent uppercase';
const activeStyles = 'bg-accent/20 border border-accent text-accent';
const inactiveStyles =
  'bg-primary/50 border border-transparent hover:border-accent/50 text-slate-400 hover:text-white';

const LanguageToggle: React.FC = () => {
  const { locale, setLocale } = useLocale();

  return (
    <div data-testid="language-toggle" className="flex items-center p-1 space-x-1 bg-primary/30 backdrop-blur-sm shadow border border-slate-800">
      <button
        data-testid="language-en"
        onClick={() => setLocale('en')}
        className={`${toggleBase} ${
          locale === 'en' ? activeStyles : inactiveStyles
        }`}
        aria-pressed={locale === 'en'}
        aria-label="Set language to English"
      >
        <span>EN</span>
      </button>
      <button
        data-testid="language-es"
        onClick={() => setLocale('es')}
        className={`${toggleBase} ${
          locale === 'es' ? activeStyles : inactiveStyles
        }`}
        aria-pressed={locale === 'es'}
        aria-label="Set language to Spanish"
      >
        <span>ES</span>
      </button>
    </div>
  );
};

export default LanguageToggle;
