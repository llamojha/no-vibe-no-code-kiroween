import en from "@/locales/en.json";
import es from "@/locales/es.json";

export const translations = {
  en,
  es,
} as const;

export type SupportedLocale = keyof typeof translations;
export type TranslationDictionary = (typeof translations)[SupportedLocale];
export type TranslationKey = keyof TranslationDictionary;
