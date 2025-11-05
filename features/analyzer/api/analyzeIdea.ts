import type { SupportedLocale } from '@/features/locale/translations';
import type { Analysis } from '@/lib/types';

export const requestAnalysis = async (
  idea: string,
  locale: SupportedLocale,
): Promise<Analysis> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea, locale }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? 'Failed to analyze idea.');
  }

  return response.json();
};
