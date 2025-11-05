import type { SupportedLocale } from '@/features/locale/translations';
import { getGenAiClient } from '@/lib/server/ai/client';

export const transcribeAudio = async (
  base64Audio: string,
  mimeType: string,
  locale: SupportedLocale,
): Promise<string> => {
  const ai = getGenAiClient();

  const audioPart = {
    inlineData: {
      data: base64Audio,
      mimeType,
    },
  };

  const prompt =
    locale === 'es'
      ? 'Transcribe este audio de un usuario describiendo su idea.'
      : 'Transcribe this audio recording of a user describing their idea.';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [audioPart, { text: prompt }] },
  });

  const transcription = response.text?.trim();
  if (!transcription) {
    throw new Error('Transcription returned no text.');
  }

  return transcription;
};
