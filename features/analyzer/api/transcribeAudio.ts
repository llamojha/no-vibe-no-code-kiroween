import type { SupportedLocale } from '@/features/locale/translations';

export const requestTranscription = async (
  audio: string,
  mimeType: string,
  locale: SupportedLocale,
): Promise<string> => {
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio, mimeType, locale }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? 'Failed to transcribe audio.');
  }

  const { transcription } = await response.json();
  if (!transcription) {
    throw new Error('Transcription payload is empty.');
  }
  return transcription;
};
