import type { SupportedLocale } from '@/features/locale/translations';

export const requestSpeech = async (
  text: string,
  locale: SupportedLocale,
): Promise<string> => {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, locale }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? 'Failed to generate audio.');
  }

  const { audio } = await response.json();
  if (!audio) {
    throw new Error('Audio payload is empty.');
  }
  return audio;
};
