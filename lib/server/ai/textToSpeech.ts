import { Modality } from '@google/genai';
import type { SupportedLocale } from '@/features/locale/translations';
import { getGenAiClient } from '@/lib/server/ai/client';

const MAX_TTS_LENGTH = 15000;

export const generateSpeech = async (
  text: string,
  locale: SupportedLocale,
): Promise<string> => {
  const ai = getGenAiClient();

  const truncatedText = text.substring(0, MAX_TTS_LENGTH);
  const prompt =
    locale === 'es'
      ? `Por favor, lee el siguiente texto en español: ${truncatedText}`
      : `Please read the following text in English: ${truncatedText}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    console.error('No audio data in TTS response', response);
    throw new Error('Audio generation returned no data');
  }

  return base64Audio;
};
