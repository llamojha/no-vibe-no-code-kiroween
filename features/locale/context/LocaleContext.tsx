'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  SupportedLocale,
  TranslationDictionary,
  TranslationKey,
  translations,
} from '@/features/locale/translations';

type LocaleContextValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: TranslationKey | string) => string;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [locale, setLocale] = useState<SupportedLocale>('en');

  const dictionary: TranslationDictionary = useMemo(
    () => translations[locale],
    [locale],
  );

  const translate = useCallback(
    (key: TranslationKey | string) =>
      (dictionary[key as TranslationKey] as string) ?? key,
    [dictionary],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: translate,
    }),
    [locale, translate],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
};

export const useLocale = (): LocaleContextValue => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
