'use client';

import React from 'react';
import { useLocale } from '@/features/locale/context/LocaleContext';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const { t } = useLocale();
  return (
    <div
      className="my-4 p-4 bg-red-900/20 border-l-4 border-red-500 text-red-300 rounded-none animate-fade-in"
      role="alert"
    >
      <p className="font-bold uppercase tracking-wider text-red-400">
        {t('errorTitle')}
      </p>
      <p className="font-mono mt-1">{message}</p>
    </div>
  );
};

export default ErrorMessage;
