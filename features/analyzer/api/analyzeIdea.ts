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

  const result = await response.json();
  
  // Handle the Result<T, E> pattern from the backend
  if (result.success === false) {
    throw new Error(result.error?.message || result.error || 'Analysis failed');
  }
  
  // Extract data from the success response
  if (result.success && result.data) {
    return result.data as Analysis;
  }
  
  // Legacy format support - direct return
  return result as Analysis;
};
