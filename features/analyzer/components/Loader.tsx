'use client';

import React from 'react';
import { useLocale } from '@/features/locale/context/LocaleContext';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  const { t } = useLocale();
  return (
    <div data-testid="loading-spinner" className="flex flex-col items-center justify-center my-12 text-center animate-fade-in">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-2 border-accent/30 rounded-full" />
        <div
          className="absolute inset-2 border-2 border-secondary/30 rounded-full animate-spin"
          style={{ animationDuration: '3s', animationDirection: 'reverse' }}
        />
        <div
          className="absolute inset-0 border-t-2 border-accent rounded-full animate-spin"
          style={{ animationDuration: '1.5s' }}
        />
        <div
          className="absolute inset-4 border-b-2 border-secondary rounded-full animate-spin"
          style={{ animationDuration: '2s' }}
        />
      </div>
      <p className="mt-6 text-lg text-accent uppercase tracking-widest font-semibold">
        {message}
      </p>
      <p className="text-sm text-slate-500">{t('loaderSubMessage')}</p>
    </div>
  );
};

export default Loader;
